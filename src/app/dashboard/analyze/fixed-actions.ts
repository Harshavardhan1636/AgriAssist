'use server';

import { classifyPlantDisease } from "@/ai/flows/classify-plant-disease";
import { diagnoseWithText } from "@/ai/flows/diagnose-with-text";
import { assessDiseaseSeverity } from "@/ai/flows/assess-disease-severity";
import { forecastOutbreakRisk } from "@/ai/flows/forecast-outbreak-risk";
import { explainClassificationWithGradCAM } from "@/ai/flows/explain-classification-with-grad-cam";
import { generateRecommendations } from "@/ai/flows/generate-recommendations";
import { askFollowUpQuestion as askFollowUpQuestionFlow } from "@/ai/flows/ask-follow-up-question";
import { transcribeAudio } from "@/ai/flows/transcribe-audio";
import type { AskFollowUpQuestionOutput } from "@/ai/flows/ask-follow-up-question";
import type { FullAnalysisResponse } from "@/lib/types";
import type { GenerateRecommendationsOutput } from "@/ai/flows/generate-recommendations";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from "@/lib/api-client";

// Enhanced configuration with fallbacks
const CONFIG = {
  INFER_SERVER_URL: process.env.INFER_SERVER_URL || 'http://localhost:8000',
  USE_INFERENCE_SERVER: process.env.NEXT_PUBLIC_USE_INFERENCE_SERVER !== 'false',
  INFERENCE_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  INFERENCE_ENABLED: !!process.env.INFER_SERVER_URL,
};

// Logging functions
function logInfo(message: string, data?: any) {
  console.log(`[INFO] ${message}`, data || '');
}

function logError(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error || '');
}

function logWarn(message: string, data?: any) {
  console.warn(`[WARN] ${message}`, data || '');
}

// Singleton to track server availability
class InferenceServerStatus {
  private isAvailable: boolean = true;
  private lastCheck: number = 0;
  private checkInterval: number = 30000; // Check every 30 seconds
  
  async check(): Promise<boolean> {
    const now = Date.now();
    
    // Use cached status if recent
    if (now - this.lastCheck < this.checkInterval) {
      return this.isAvailable;
    }
    
    // Perform new check
    this.isAvailable = await this.checkInferenceServerHealth();
    this.lastCheck = now;
    
    if (!this.isAvailable) {
      logWarn('Inference server unavailable, will use fallback methods');
    }
    
    return this.isAvailable;
  }
  
  async checkInferenceServerHealth(): Promise<boolean> {
    if (!CONFIG.INFERENCE_ENABLED) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${CONFIG.INFER_SERVER_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logWarn('Inference server health check failed:', error);
      return false;
    }
  }
  
  markUnavailable() {
    this.isAvailable = false;
    this.lastCheck = Date.now();
  }
}

const serverStatus = new InferenceServerStatus();

// Enhanced health check with proper error handling
async function checkInferenceServerHealth(): Promise<boolean> {
  if (!CONFIG.INFERENCE_ENABLED) return false;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${CONFIG.INFER_SERVER_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    logWarn('Inference server health check failed:', error);
    return false;
  }
}

// Enhanced classify function with proper fallbacks
async function classifyWithModel(
  photoDataUri: string,
  modelName: 'plantvillage' | 'paddy'
): Promise<any> {
  // Check server availability first
  const serverAvailable = await serverStatus.check();
  
  if (!serverAvailable) {
    logInfo(`Skipping ${modelName} model - server unavailable`);
    return null;
  }
  
  let timeoutId: NodeJS.Timeout | null = null;
  try {
    logInfo(`Classifying image with ${modelName} model`);
    const blob = await dataUriToBlob(photoDataUri);
    const form = new FormData();
    form.append('model_key', modelName);
    form.append('topk', '5');
    form.append('file', blob, 'image.jpg');
    
    // Add timeout to fetch request
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), CONFIG.INFERENCE_TIMEOUT);
    
    const res = await fetch(`${CONFIG.INFER_SERVER_URL}/classify`, { 
      method: 'POST', 
      body: form as any,
      signal: controller.signal
    });
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      logError(`Classification failed for ${modelName}`, { status: res.status, error: errorText });
      throw new Error(`Classification failed: ${res.status} ${errorText}`);
    }
    
    const json = await res.json();
    logInfo(`Classification successful for ${modelName}`, { predictions: json?.predictions?.length });
    return json?.predictions || [];
  } catch (error: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    logError(`Error in classifyWithModel for ${modelName}`, error);
    if (error.name === 'AbortError') {
      throw new Error(`Classification timed out for ${modelName} model`);
    }
    // Mark server as unavailable if connection refused
    if (error.cause?.code === 'ECONNREFUSED') {
      serverStatus.markUnavailable();
    }
    throw error;
  }
}

// Convert data URI to Blob
async function dataUriToBlob(dataUri: string): Promise<Blob> {
  try {
    // Validate input
    if (!dataUri || typeof dataUri !== 'string') {
      throw new Error('Invalid data URI: empty or not a string');
    }
    
    // Check if it's a valid data URI
    if (!dataUri.startsWith('data:')) {
      throw new Error('Invalid data URI: does not start with "data:"');
    }
    
    const [meta, b64] = dataUri.split(',');
    
    // Validate base64 data
    if (!b64) {
      throw new Error('Invalid data URI: missing base64 data');
    }
    
    const mimeMatch = /data:(.*?);base64/gi.exec(meta || '');
    const mime = mimeMatch?.[1] || 'image/jpeg';
    
    // Validate base64 string
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) {
      throw new Error('Invalid data URI: invalid base64 data');
    }
    
    const buffer = Buffer.from(b64, 'base64');
    return new Blob([buffer], { type: mime });
  } catch (error: any) {
    logError('Failed to convert data URI to blob', {
      error: error.message,
      dataUriLength: dataUri?.length || 0,
      dataUriStart: dataUri?.substring(0, 50) || 'null'
    });
    throw new Error(`Invalid image data: ${error.message}`);
  }
}

// Model classification with proper error handling
async function classifyWithModelOld(photoDataUri: string, modelKey: 'plantvillage' | 'paddy') {
  let timeoutId: NodeJS.Timeout | null = null;
  try {
    logInfo(`Classifying image with ${modelKey} model`);
    const blob = await dataUriToBlob(photoDataUri);
    const form = new FormData();
    form.append('model_key', modelKey);
    form.append('topk', '5');
    form.append('file', blob, 'image.jpg');
    
    // Add timeout to fetch request
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const res = await fetch(`${CONFIG.INFER_SERVER_URL}/classify`, { 
      method: 'POST', 
      body: form as any,
      signal: controller.signal
    });
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      logError(`Classification failed for ${modelKey}`, { status: res.status, error: errorText });
      throw new Error(`Classification failed: ${res.status} ${errorText}`);
    }
    
    const json = await res.json();
    logInfo(`Classification successful for ${modelKey}`, { predictions: json?.predictions?.length });
    return json?.predictions || [];
  } catch (error: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    logError(`Error in classifyWithModel for ${modelKey}`, error);
    if (error.name === 'AbortError') {
      throw new Error(`Classification timed out for ${modelKey} model`);
    }
    throw error;
  }
}

// Grad-CAM with proper error handling
async function gradcamWithModel(photoDataUri: string, modelKey: 'plantvillage' | 'paddy', targetLabel: string) {
  let timeoutId: NodeJS.Timeout | null = null;
  try {
    logInfo(`Generating Grad-CAM for ${modelKey} model with target label: ${targetLabel}`);
    const blob = await dataUriToBlob(photoDataUri);
    const form = new FormData();
    form.append('model_key', modelKey);
    form.append('target_label', targetLabel);
    form.append('file', blob, 'image.jpg');
    
    // Add timeout to fetch request
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const res = await fetch(`${CONFIG.INFER_SERVER_URL}/gradcam`, { 
      method: 'POST', 
      body: form as any,
      signal: controller.signal
    });
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      logError(`Grad-CAM failed for ${modelKey}`, { status: res.status, error: errorText });
      throw new Error(`Grad-CAM failed: ${res.status} ${errorText}`);
    }
    
    const json = await res.json();
    logInfo(`Grad-CAM successful for ${modelKey}`);
    return json?.dataUri as string;
  } catch (error: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    logError(`Error in gradcamWithModel for ${modelKey}`, error);
    if (error.name === 'AbortError') {
      throw new Error(`Grad-CAM generation timed out for ${modelKey} model`);
    }
    throw error;
  }
}

// Severity assessment with proper error handling
async function severityFromServer(photoDataUri: string) {
  let timeoutId: NodeJS.Timeout | null = null;
  try {
    logInfo('Assessing disease severity');
    const blob = await dataUriToBlob(photoDataUri);
    const form = new FormData();
    form.append('file', blob, 'image.jpg');
    
    // Add timeout to fetch request
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const res = await fetch(`${CONFIG.INFER_SERVER_URL}/severity`, { 
      method: 'POST', 
      body: form as any,
      signal: controller.signal
    });
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      logError('Severity assessment failed', { status: res.status, error: errorText });
      throw new Error(`Severity assessment failed: ${res.status} ${errorText}`);
    }
    
    const json = await res.json();
    logInfo('Severity assessment successful', { 
      percentage: json?.severityPercentage, 
      band: json?.severityBand 
    });
    return json as { 
      severityPercentage: number; 
      severityBand: 'Low' | 'Medium' | 'High' | 'Unknown'; 
      confidence: number 
    };
  } catch (error: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    logError('Error in severityFromServer', error);
    if (error.name === 'AbortError') {
      throw new Error('Severity assessment timed out');
    }
    throw error;
  }
}

// Format model responses for Gemini integration
function formatModelResponseForGemini(
  classification: any,
  severity: any,
  explanation: any,
  forecast: any
): string {
  const topPrediction = classification.predictions[0];
  
  return JSON.stringify({
    disease: {
      name: topPrediction.label,
      confidence: topPrediction.confidence
    },
    severity: {
      percentage: severity.severityPercentage,
      band: severity.severityBand,
      confidence: severity.confidence
    },
    explanation: {
      hasGradCAM: !!explanation.gradCAMOverlay,
      description: "Grad-CAM visualization showing areas of focus for the AI diagnosis"
    },
    forecast: {
      riskScore: forecast.riskScore,
      explanation: forecast.explanation,
      preventiveActions: forecast.preventiveActions || []
    }
  }, null, 2);
}

// Implement exponential backoff with jitter
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 5) {
  let retries = maxRetries;
  let delay = 1000;
  
  while (retries > 0) {
    try {
      return await fn();
    } catch (error: any) {
      if ((error.status === 503 || error.message?.includes('overloaded') || error.message?.includes('503')) && retries > 1) {
        // Add jitter to prevent thundering herd
        const jitteredDelay = delay * (0.5 + Math.random());
        console.log(`API overloaded, retrying in ${jitteredDelay}ms... (${retries - 1} retries left)`);
        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
        delay *= 2; // Exponential backoff
        retries--;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// Implement Circuit Breaker Pattern
class CircuitBreaker {
  private failureCount: number;
  private threshold: number;
  private timeout: number;
  private state: 'CLOSED' | 'OPEN' | 'HALF-OPEN';
  private nextAttempt: number;

  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
  }

  async call(fn: () => Promise<any>) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF-OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

async function generateRecommendationsWithRetry(input: any) {
  let retries = 5;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  while (retries > 0) {
    try {
      console.log('[INFO] Generating recommendations with input:', JSON.stringify(input, null, 2));
      const recommendations = await generateRecommendations(input);
      console.log('[INFO] Recommendations generated successfully');
      return { success: true, ...recommendations };
    } catch (error: any) {
      console.log('[WARN] Recommendations generation failed:', error.message);
      if (error.status === 503 || error.statusText === 'Service Unavailable' || error.message?.includes('Circuit breaker is OPEN')) {
        retries--;
        if (retries > 0) {
          const waitTime = (5 - retries) * 1000;
          console.log(`Recommendations API issue, retrying in ${waitTime}ms... (${retries} retries left)`);
          await delay(waitTime);
        } else {
          console.log('[ERROR] All retries exhausted for recommendations generation');
          throw error; // Let the caller handle it
        }
      } else {
        console.log('[ERROR] Non-retryable error in recommendations generation');
        throw error;
      }
    }
  }
  
  throw new Error('Failed to generate recommendations after all retries');
}

// Schema validation
const analyzeImageSchema = z.object({
  photoDataUri: z.string().optional(),
  textQuery: z.string().optional(),
  audioDataUri: z.string().optional(),
  locale: z.string().optional(),
  location: z.object({
    lat: z.string(),
    lng: z.string()
  }).optional()
}).refine(data => !!data.photoDataUri || !!data.textQuery || !!data.audioDataUri, {
  message: "Either an image, a text query, or an audio recording must be provided."
});

// Main analysis function - COMPLETELY REWRITTEN
export async function analyzeImage(
  formData: FormData
): Promise<{ data: FullAnalysisResponse | null, error: string | null }> {
  try {
    // Extract all possible inputs
    const rawPhotoDataUri = formData.get('photoDataUri') as string | null;
    const rawTextQuery = formData.get('textQuery') as string | null;
    const rawAudioDataUri = formData.get('audioDataUri') as string | null;
    const locale = (formData.get('locale') as string) || 'en';
    const rawLocation = formData.get('location') as string | null;
    const cropType = (formData.get('cropType') as string) || 'Unknown'; // Get crop type from form data
    
    // Parse location data if provided
    let location: { lat: string; lng: string } | null = null;
    if (rawLocation) {
      try {
        location = JSON.parse(rawLocation);
      } catch (e) {
        logWarn('Failed to parse location data', e);
      }
    }

    // Check if we have any valid input - MORE PERMISSIVE VALIDATION
    const hasPhoto = !!rawPhotoDataUri && rawPhotoDataUri.startsWith('data:image/');
    const hasText = !!rawTextQuery && rawTextQuery.trim().length > 0;
    const hasAudio = !!rawAudioDataUri && rawAudioDataUri.startsWith('data:audio/');
    
    // If we don't have any valid input, return error
    if (!hasPhoto && !hasText && !hasAudio) {
      logError("No valid input provided", { 
        photo: !!rawPhotoDataUri, 
        text: !!rawTextQuery, 
        audio: !!rawAudioDataUri,
        photoValid: hasPhoto,
        textValid: hasText,
        audioValid: hasAudio
      });
      return { data: null, error: "Invalid input: Please upload an image or describe the issue." };
    }

    logInfo("Starting analysis with inputs", { 
      hasPhoto, 
      hasText, 
      hasAudio,
      locale,
      hasLocation: !!location,
      cropType
    });
    
    // Initialize variables
    let classification: any = null;
    let usedPhoto = rawPhotoDataUri;
    let textDescription = rawTextQuery || '';
    let audioTranscription = '';

    // Handle audio input first
    if (hasAudio && rawAudioDataUri) {
      logInfo("Transcribing audio...");
      try {
        const transcriptionResult = await transcribeAudio({ audioDataUri: rawAudioDataUri });
        audioTranscription = transcriptionResult.transcription;
        textDescription = audioTranscription;
        logInfo(`Audio transcription successful: ${audioTranscription.substring(0, 50)}...`);
      } catch (err) {
        logError("Audio transcription failed", err);
        return { data: null, error: "Failed to transcribe audio. Please try again." };
      }
    }

    // Handle image analysis
    if (hasPhoto && rawPhotoDataUri) {
      // Check server availability first
      const serverAvailable = await serverStatus.check();
      
      if (!serverAvailable) {
        logInfo("Inference server unavailable; using Genkit classification");
        try {
          classification = await classifyPlantDisease({ photoDataUri: rawPhotoDataUri, language: locale });
        } catch (genkitErr) {
          logError('Genkit classification failed', genkitErr);
          return { data: null, error: "Failed to classify the image. Please try again." };
        }
      } else {
        logInfo("Analyzing image via inference server...");
        try {
          // Determine which model to use based on crop type
          let modelToUse: 'plantvillage' | 'paddy' = 'plantvillage';
          
          // Map crop types to appropriate models
          if (cropType.toLowerCase() === 'rice') {
            modelToUse = 'paddy';
          } else if (['tomato', 'potato', 'maize', 'wheat', 'other'].includes(cropType.toLowerCase())) {
            modelToUse = 'plantvillage';
          }
          
          logInfo(`Using ${modelToUse} model for crop type: ${cropType}`);
          
          // Call the appropriate model
          const predictions = await classifyWithModel(rawPhotoDataUri, modelToUse);
          
          if (predictions && predictions.length > 0) {
            classification = { predictions };
            // Attach chosen model key to be used by Grad-CAM later
            (classification as any)._modelKey = modelToUse;
          } else {
            // Fall back to Genkit if model returns no predictions
            logWarn(`No predictions from ${modelToUse} model, falling back to Genkit`);
            classification = await classifyPlantDisease({ photoDataUri: rawPhotoDataUri, language: locale });
          }
        } catch (err) {
          logWarn('Inference server unavailable; using Genkit classification', err);
          try {
            classification = await classifyPlantDisease({ photoDataUri: rawPhotoDataUri, language: locale });
          } catch (genkitErr) {
            logError('Genkit classification also failed', genkitErr);
            return { data: null, error: "Failed to classify the image. Please try again." };
          }
        }
      }
    } else if (hasText || textDescription) {
      // Handle text analysis (either from text input or audio transcription)
      logInfo("Analyzing with text...", { textLength: textDescription.length });
      try {
        const textDiagnosis = await diagnoseWithText({ query: textDescription, language: locale });
        classification = { predictions: textDiagnosis.predictions };
        // Use a placeholder image since none was provided
        usedPhoto = "https://picsum.photos/seed/placeholder/600/400";
      } catch (err) {
        logError("Text diagnosis failed", err);
        return { data: null, error: "Failed to analyze text description. Please try again." };
      }
    }

    // Validate we have a classification
    if (!classification || !classification.predictions || classification.predictions.length === 0) {
      logError("Classification failed to return predictions");
      return { data: null, error: "The AI model could not identify a disease. Please try again." };
    }

    const topPrediction = classification.predictions[0];
    logInfo("Top prediction", topPrediction);
    
    // Get real-time weather and soil data if location is provided
    let soilType = 'Loam'; // Default fallback
    let weatherFeatures = { temperature: 28, humidity: 82, rainfall: 8 }; // Default fallback
    let forecastSummary = 'Weather data not available';
    
    // Determine water conservation needs based on crop type
    const getWaterConservationNeeds = (crop: string, soil: string, weather: any) => {
      const needs = [];
      
      if (crop.toLowerCase().includes('rice')) {
        needs.push('Implement alternate wetting and drying (AWD) technique');
        needs.push('Use laser land leveling for efficient water distribution');
      } else if (crop.toLowerCase().includes('wheat') || crop.toLowerCase().includes('maize')) {
        needs.push('Use drip irrigation or sprinkler systems');
        needs.push('Apply mulching to retain soil moisture');
      } else if (crop.toLowerCase().includes('tomato') || crop.toLowerCase().includes('potato')) {
        needs.push('Use drip irrigation with moisture sensors');
        needs.push('Implement rainwater harvesting');
      }
      
      if (soil === 'Sandy') {
        needs.push('Increase organic matter to improve water retention');
      } else if (soil === 'Clay') {
        needs.push('Improve drainage to prevent waterlogging');
      }
      
      if (weather.rainfall > 1500) {
        needs.push('Install proper drainage systems');
      } else if (weather.rainfall < 500) {
        needs.push('Implement water-efficient irrigation methods');
      }
      
      return needs.join(', ');
    };
    
    // Determine biodiversity considerations
    const getBiodiversityConsiderations = (crop: string, soil: string) => {
      const considerations = [];
      
      considerations.push('Encourage beneficial insects by planting companion crops');
      considerations.push('Avoid broad-spectrum pesticides that harm pollinators');
      
      if (crop.toLowerCase().includes('rice')) {
        considerations.push('Maintain buffer zones around water bodies');
        considerations.push('Support aquatic biodiversity in irrigation systems');
      } else {
        considerations.push('Create habitat corridors for wildlife');
        considerations.push('Plant native species as windbreaks');
      }
      
      if (soil === 'Loam' || soil === 'Organic') {
        considerations.push('Support soil microorganism diversity through organic practices');
      }
      
      return considerations.join(', ');
    };
    
    if (location) {
      try {
        logInfo("Fetching real-time weather and soil data", location);
        
        try {
          // Fetch weather data (14 days) using apiClient
          const weatherResponse = await apiClient.getWeatherData({
            lat: location.lat,
            lng: location.lng,
            days: 14
          });
          
          if (weatherResponse.success && weatherResponse.data) {
            // Use current weather data for immediate conditions
            weatherFeatures = {
              temperature: weatherResponse.data.current.temperature,
              humidity: weatherResponse.data.current.humidity,
              rainfall: weatherResponse.data.forecast.reduce((sum: any, day: any) => sum + day.rainChance, 0) / weatherResponse.data.forecast.length
            };
            
            // Create forecast summary for recommendations
            const avgTemp = weatherResponse.data.forecast.reduce((sum: any, day: any) => sum + (day.temp.max + day.temp.min) / 2, 0) / weatherResponse.data.forecast.length;
            const avgHumidity = weatherResponse.data.forecast.reduce((sum: any, day: any) => sum + day.humidity, 0) / weatherResponse.data.forecast.length;
            const rainDays = weatherResponse.data.forecast.filter((day: any) => day.rainChance > 30).length;
            
            forecastSummary = `Average temperature ${Math.round(avgTemp)}°C, ${Math.round(avgHumidity)}% humidity, with rain expected on ${rainDays} of the next 14 days`;
          }
          
          // Fetch soil data using apiClient
          const soilResponse = await apiClient.getSoilData({
            lat: location.lat,
            lng: location.lng
          });
          
          if (soilResponse.success && soilResponse.data) {
            soilType = soilResponse.data.type;
          }
        } catch (apiError) {
          logWarn('Failed to fetch real-time data from API, using defaults', apiError);
        }
      } catch (e) {
        logWarn('Failed to fetch real-time data, using defaults', e);
      }
    }
    
    const waterConservationNeeds = getWaterConservationNeeds(cropType, soilType, weatherFeatures);
    const biodiversityConsiderations = getBiodiversityConsiderations(cropType, soilType);

    // Parallel processing of severity, explanation, and forecast
    logInfo("Starting parallel processing of severity, explanation, and forecast");
    const [severityResult, explanationResult, forecastResult] = await Promise.allSettled([
      // Assess Severity via inference server if available
      (async () => {
        try {
          const serverAvailable = await serverStatus.check();
          if (!serverAvailable) {
            throw new Error('Inference server unavailable');
          }
          // For text-based analysis, we don't have an image, so we'll use the Genkit fallback
          if (!(usedPhoto && usedPhoto.startsWith('data:image/'))) {
            throw new Error("No valid image for severity assessment");
          }
          logInfo("Attempting severity assessment via inference server");
          const s = await severityFromServer(usedPhoto);
          logInfo("Severity assessment successful via inference server");
          return s;
        } catch (e) {
          logWarn('Severity inference unavailable, using Genkit fallback', e);
          try {
            const result = await assessDiseaseSeverity({ 
              photoDataUri: usedPhoto || '', 
              description: textDescription, 
              language: locale 
            });
            logInfo("Severity assessment successful via Genkit");
            return result;
          } catch (err) {
            logError('Severity assessment failed', err);
            return { 
              severityPercentage: 0, 
              severityBand: 'Unknown' as const, 
              confidence: 0 
            }; 
          }
        }
      })(),
      // Explain with Grad-CAM or provide reference image info
      (async () => {
        try {
          const serverAvailable = await serverStatus.check();
          if (!serverAvailable) {
            throw new Error('Inference server unavailable');
          }
          // For text-based analysis, we don't have an image for Grad-CAM
          if (!(usedPhoto && usedPhoto.startsWith('data:image/'))) {
            throw new Error("No valid image for Grad-CAM");
          }
          const modelKey = (classification as any)._modelKey as ('plantvillage' | 'paddy' | undefined) || 'plantvillage';
          logInfo(`Attempting Grad-CAM explanation with ${modelKey} model`);
          const cam = await gradcamWithModel(usedPhoto, modelKey, topPrediction.label);
          logInfo("Grad-CAM explanation successful");
          return { gradCAMOverlay: cam } as any;
        } catch (e) {
          logWarn('Grad-CAM unavailable, using Genkit fallback', e);
          try {
            // For text-based analysis, we'll provide a reference image instead
            if (!(usedPhoto && usedPhoto.startsWith('data:image/'))) {
              // Return a special marker to indicate this is a text-based analysis
              return { isTextBased: true, disease: topPrediction.label } as any;
            }
            
            const result = await explainClassificationWithGradCAM({ 
              photoDataUri: usedPhoto || '', 
              classificationResult: topPrediction.label 
            });
            logInfo("Grad-CAM explanation successful via Genkit");
            return result;
          } catch (err) {
            logError('Grad-CAM explanation failed', err);
            // For text-based analysis, we'll provide a reference image instead
            if (!(usedPhoto && usedPhoto.startsWith('data:image/'))) {
              // Return a special marker to indicate this is a text-based analysis
              return { isTextBased: true, disease: topPrediction.label } as any;
            }
            return { gradCAMOverlay: usedPhoto || '' } as any;
          }
        }
      })(),
      // Forecast Risk with real-time data and 14-day forecast
      (async () => {
        try {
          // Create detailed forecast input using 14-day data
          const detailedForecastInput = {
            disease: topPrediction.label,
            historicalDetections: [1, 0, 2, 1, 3, 0, 4, 2, 3, 1, 5, 2, 4, 3], // Mock data for 14 days
            weatherFeatures, // Real-time weather data
            cropType: cropType, // Use the crop type from form data
            soilType, // Real-time soil data
            language: locale,
            biodiversityImpact: biodiversityConsiderations
          };
          
          // Call forecastOutbreakRisk directly, as it now has its own retry logic
          const result = await forecastOutbreakRisk(detailedForecastInput);
          
          logInfo("Risk forecast successful");
          return result;
        } catch (e) { 
          logError("Risk forecast failed", e); 
          return { riskScore: 0, explanation: 'Not available', preventiveActions: [], biodiversityImpactAssessment: 'Not available' }; 
        }
      })(),
    ]);

    // Extract results safely
    const severity = severityResult.status === 'fulfilled' 
      ? severityResult.value 
      : { severityPercentage: 0, severityBand: 'Unknown', confidence: 0, error: true };

    const explanation = explanationResult.status === 'fulfilled' 
      ? explanationResult.value 
      : { gradCAMOverlay: null, error: true };

    const forecast = forecastResult.status === 'fulfilled' 
      ? forecastResult.value 
      : { 
          riskScore: 0,
          explanation: 'Forecast unavailable',
          preventiveActions: [],
          error: true 
        };

    // Generate Recommendations using the results from the other flows
    logInfo("Generating recommendations");
    
    // Handle recommendations with retry
    let recommendations;
    try {
      console.log('[DEBUG] Calling generateRecommendationsWithRetry with input:', {
        disease: topPrediction.label,
        severity: severity.severityBand,
        cropType: cropType, // Use the crop type from form data
        language: locale,
        forecastSummary: forecastSummary.substring(0, 100) + '...', // Truncate for logging
        soilType,
        waterConservationNeeds,
        biodiversityConsiderations
      });
      
      recommendations = await generateRecommendationsWithRetry({
        disease: topPrediction.label,
        severity: severity.severityBand,
        cropType: cropType, // Use the crop type from form data
        language: locale,
        forecastSummary,
        soilType,
        waterConservationNeeds,
        biodiversityConsiderations
      });
      
      console.log('[DEBUG] Recommendations generated successfully');
    } catch (error: any) {
      console.error('[ERROR] Recommendations generation failed:', error);
      recommendations = {
        recommendations: [
          { step: 1, title: 'Monitor Plant Health', description: 'Regularly check your plants for signs of disease progression.', type: 'Preventive' as const },
          { step: 2, title: 'Maintain Hygiene', description: 'Remove and destroy any infected plant material to prevent spread.', type: 'Organic/Cultural' as const },
          { step: 3, title: 'Consult Experts', description: 'If symptoms worsen, contact your local agricultural extension office.', type: 'Preventive' as const }
        ]
      };
    }

    const conversationId = uuidv4();
    
    // Prepare data for response (no need to sanitize for Firestore anymore)
    console.log('[DEBUG] Preparing data for response');
    
    const analysisResult = {
      // Input metadata
      hasPhoto: !!rawPhotoDataUri,
      hasText: !!rawTextQuery,
      hasAudio: !!rawAudioDataUri,
      locale: locale,
      hasLocation: !!location,
      
      // Disease detection
      disease: {
        label: topPrediction.label,
        confidence: topPrediction.confidence,
        allPredictions: classification.predictions.slice(0, 5) // Top 5 only
      },
      
      // Severity
      severityInfo: {
        percentage: severity.severityPercentage || 0,
        band: severity.severityBand || 'Unknown',
        hasError: (severity as any).error || false
      },
      
      // Location
      location: location ? {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng)
      } : null,
      
      // Weather (may be null/undefined)
      weather: weatherFeatures || null,
      
      // Soil (may be null/undefined)
      soil: soilType || null,
      
      // Forecast - explicitly handle the structure
      forecastInfo: (forecast as any).riskScore !== undefined ? {
        riskScore: (forecast as any).riskScore,
        explanation: (forecast as any).explanation,
        preventiveActions: (forecast as any).preventiveActions || []
      } : {
        riskScore: 0,
        explanation: 'Forecast unavailable',
        preventiveActions: [],
        hasError: true
      },
      
      // Recommendations
      recommendationsInfo: {
        recommendations: recommendations.recommendations || [],
        hasError: !(recommendations as any).success
      },
      
      // Grad-CAM or reference image info
      gradCam: explanation.gradCAMOverlay || null,
      
      // Original analysis results (without duplicates)
      originalImage: usedPhoto || '',
      conversationId,
    };

    console.log('[DEBUG] Data prepared for response');
    
    // Generate a unique ID for the analysis
    const analysisId = uuidv4();
    
    // Instead of saving to Firestore, we'll return the data directly
    // In a production environment, you might want to use a different backend storage solution
    
    logInfo("Full analysis complete");
    console.log('[DEBUG] Returning analysis results to client');
    
    const resultData = {
      ...analysisResult,
      classification,
      severity,
      explanation,
      forecast: forecast || { riskScore: 0, explanation: 'Not available', preventiveActions: [] },
      recommendations,
      analysisId, // Include the analysis ID for client-side tracking
      // Add a flag to indicate if this is a text-based analysis
      isTextBasedAnalysis: !(rawPhotoDataUri && rawPhotoDataUri.startsWith('data:image/'))
    };
    
    console.log('[DEBUG] Result data structure prepared');
    
    return {
      data: resultData,
      error: null
    };

  } catch (e: any) {
    logError("Full analysis pipeline failed", e);
    return { data: null, error: e.message || "An unexpected error occurred during analysis." };
  }
}

// Server action for handling follow-up questions - COMPLETELY REWRITTEN
export async function askFollowUpQuestion(
  analysisContext: string,
  question: string,
  language: string,
): Promise<AskFollowUpQuestionOutput> {
  try {
    // If the question contains image data, we need to handle it as a new analysis
    if (question && question.startsWith('data:image/')) {
      logInfo("Image detected in follow-up question, treating as new analysis");
      
      // Create a new FormData object
      const formData = new FormData();
      formData.append('photoDataUri', question);
      formData.append('locale', language);
      
      // Call the analyzeImage function directly
      const result = await analyzeImage(formData);
      
      if (result.error) {
        return { answer: `Analysis failed: ${result.error}` };
      }
      
      if (result.data) {
        const topPrediction = result.data.classification.predictions[0];
        return { 
          answer: `I've analyzed your image and identified it as ${topPrediction.label} with ${Math.round(topPrediction.confidence * 100)}% confidence. ${result.data.recommendations.recommendations[0]?.description || 'Please check the detailed results for recommendations.'}` 
        };
      }
      
      return { answer: "I've analyzed your image but couldn't identify the issue. Please try again with a clearer image." };
    }
    
    // Otherwise, treat as a regular follow-up question
    const result = await askFollowUpQuestionFlow({ analysisContext, question, language });
    return result;
  } catch(e: any) {
    logError("Follow-up question failed:", e);
    return { answer: "Sorry, I encountered an error trying to answer your question." };
  }
}

// Re-exporting types for easier access from the client
export type {
  ClassifyPlantDiseaseOutput,
  ClassifyPlantDiseaseInput,
} from '@/ai/flows/classify-plant-disease';
export type {
  DiagnoseWithTextInput,
  DiagnoseWithTextOutput,
} from '@/ai/flows/diagnose-with-text';

export type {
  AssessDiseaseSeverityOutput,
  AssessDiseaseSeverityInput,
} from '@/ai/flows/assess-disease-severity';

export type {
  ForecastOutbreakRiskOutput,
  ForecastOutbreakRiskInput,
} from '@/ai/flows/forecast-outbreak-risk';

export type {
  ExplainClassificationWithGradCAMOutput,
  ExplainClassificationWithGradCAMInput,
} from '@/ai/flows/explain-classification-with-grad-cam';

export type {
  GenerateRecommendationsOutput,
  GenerateRecommendationsInput,
} from '@/ai/flows/generate-recommendations';

export type {
  AskFollowUpQuestionOutput,
  AskFollowUpQuestionInput,
} from '@/ai/flows/ask-follow-up-question';

export type {
  TranscribeAudioOutput,
  TranscribeAudioInput,
} from '@/ai/flows/transcribe-audio';
