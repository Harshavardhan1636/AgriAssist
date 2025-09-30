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
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from "@/lib/api-client";
import { app } from '@/lib/firebase';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Inference server configuration (FastAPI)
const INFER_SERVER_URL = process.env.INFER_SERVER_URL || 'http://localhost:8000';

// Add logging function
function logInfo(message: string, data?: any) {
  console.log(`[INFO] ${message}`, data || '');
}

function logError(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error || '');
}

function logWarn(message: string, data?: any) {
  console.warn(`[WARN] ${message}`, data || '');
}

// Function to save conversation to Firestore
async function saveConversationToFirestore(conversationId: string, title: string, analysisContext: string) {
  try {
    // Skip Firestore writes if Firebase isn't configured
    const hasFirebaseConfig = !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    );

    if (!hasFirebaseConfig) {
      logWarn('Firebase env vars missing; skipping Firestore save');
      return null;
    }

    // Mock user ID - in a real app, this would come from authentication
    const userId = 'demo-user-id';
    
    const db = getFirestore(app);
    const conversationsRef = collection(db, 'conversations');
    
    // Create new conversation
    const newConversation = {
      userId,
      title,
      analysisContext,
      messages: [],
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(conversationsRef, newConversation);
    logInfo(`Conversation saved to Firestore with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logError('Failed to save conversation to Firestore', error);
    return null;
  }
}

async function dataUriToBlob(dataUri: string): Promise<Blob> {
  try {
    // data:image/jpeg;base64,...
    const [meta, b64] = dataUri.split(',');
    const mimeMatch = /data:(.*?);base64/gi.exec(meta || '')
    const mime = mimeMatch?.[1] || 'image/jpeg';
    const buffer = Buffer.from(b64, 'base64');
    return new Blob([buffer], { type: mime });
  } catch (error) {
    logError('Failed to convert data URI to blob', error);
    throw new Error('Invalid image data');
  }
}

// Enhanced model classification with proper error handling
async function classifyWithModel(photoDataUri: string, modelKey: 'plantvillage'|'paddy') {
  try {
    logInfo(`Classifying image with ${modelKey} model`);
    const blob = await dataUriToBlob(photoDataUri);
    const form = new FormData();
    form.append('model_key', modelKey);
    form.append('topk', '5');
    form.append('file', blob, 'image.jpg');
    
    const res = await fetch(`${INFER_SERVER_URL}/classify`, { 
      method: 'POST', 
      body: form as any 
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      logError(`Classification failed for ${modelKey}`, { status: res.status, error: errorText });
      throw new Error(`Classification failed: ${res.status} ${errorText}`);
    }
    
    const json = await res.json();
    logInfo(`Classification successful for ${modelKey}`, { predictions: json?.predictions?.length });
    return json?.predictions || [];
  } catch (error) {
    logError(`Error in classifyWithModel for ${modelKey}`, error);
    throw error;
  }
}

// Enhanced Grad-CAM with proper error handling
async function gradcamWithModel(photoDataUri: string, modelKey: 'plantvillage'|'paddy', targetLabel: string) {
  try {
    logInfo(`Generating Grad-CAM for ${modelKey} model with target label: ${targetLabel}`);
    const blob = await dataUriToBlob(photoDataUri);
    const form = new FormData();
    form.append('model_key', modelKey);
    form.append('target_label', targetLabel);
    form.append('file', blob, 'image.jpg');
    
    const res = await fetch(`${INFER_SERVER_URL}/gradcam`, { 
      method: 'POST', 
      body: form as any 
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      logError(`Grad-CAM failed for ${modelKey}`, { status: res.status, error: errorText });
      throw new Error(`Grad-CAM failed: ${res.status} ${errorText}`);
    }
    
    const json = await res.json();
    logInfo(`Grad-CAM successful for ${modelKey}`);
    return json?.dataUri as string;
  } catch (error) {
    logError(`Error in gradcamWithModel for ${modelKey}`, error);
    throw error;
  }
}

// Enhanced severity assessment with proper error handling
async function severityFromServer(photoDataUri: string) {
  try {
    logInfo('Assessing disease severity');
    const blob = await dataUriToBlob(photoDataUri);
    const form = new FormData();
    form.append('file', blob, 'image.jpg');
    
    const res = await fetch(`${INFER_SERVER_URL}/severity`, { 
      method: 'POST', 
      body: form as any 
    });
    
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
      severityBand: 'Low'|'Medium'|'High'|'Unknown'; 
      confidence: number 
    };
  } catch (error) {
    logError('Error in severityFromServer', error);
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


const analyzeImageSchema = z.object({
  photoDataUri: z.string().optional(),
  textQuery: z.string().optional(),
  audioDataUri: z.string().optional(),
  locale: z.string().optional(),
  // Add location data for real-time weather and soil data
  location: z.object({
    lat: z.string(),
    lng: z.string()
  }).optional()
}).refine(data => !!data.photoDataUri || !!data.textQuery || !!data.audioDataUri, {
  message: "Either an image, a text query, or an audio recording must be provided."
});


export async function analyzeImage(
    formData: FormData
  ): Promise<{ data: FullAnalysisResponse | null, error: string | null }> {
    
    const rawPhotoDataUri = formData.get('photoDataUri') as string | null;
    const rawTextQuery = formData.get('textQuery') as string | null;
    const rawAudioDataUri = formData.get('audioDataUri') as string | null;
    const locale = (formData.get('locale') as string) || 'en';
    const rawLocation = formData.get('location') as string | null;
    
    // Parse location data if provided
    let location: { lat: string; lng: string } | null = null;
    if (rawLocation) {
      try {
        location = JSON.parse(rawLocation);
      } catch (e) {
        logWarn('Failed to parse location data', e);
      }
    }

    const validatedFields = analyzeImageSchema.safeParse({ 
        photoDataUri: rawPhotoDataUri, 
        textQuery: rawTextQuery,
        audioDataUri: rawAudioDataUri, 
        locale,
        location
    });

    if (!validatedFields.success) {
      const errorMessage = "Invalid input: Please upload an image or describe the issue.";
      logError("Validation failed", validatedFields.error.flatten());
      return { data: null, error: errorMessage };
    }
    
    let { photoDataUri, textQuery, audioDataUri, location: validatedLocation } = validatedFields.data;

    try {
      let classification;
      let usedPhoto = photoDataUri;
      let textDescription = textQuery || '';

      // Main logic for multimodal input
      if (audioDataUri) {
        logInfo("Transcribing audio...");
        try {
          const transcriptionResult = await transcribeAudio({ audioDataUri });
          textDescription = transcriptionResult.transcription;
          logInfo(`Transcription result: ${textDescription}`);
        } catch (err) {
          logError("Audio transcription failed", err);
          return { data: null, error: "Failed to transcribe audio. Please try again." };
        }
      }

      if (photoDataUri) {
        logInfo("Analyzing with image via inference server...");
        try {
          // Check if FastAPI server is reachable
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const healthCheck = await fetch(`${INFER_SERVER_URL}/health`, { 
              method: 'GET', 
              signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            if (!healthCheck.ok) {
              throw new Error("FastAPI server is not responding");
            }
          } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
              throw new Error("FastAPI server health check timed out");
            }
            throw err;
          }
          
          // Call both models and pick the higher-confidence top-1
          logInfo("Calling both PlantVillage and Paddy models...");
          const [pv, paddy] = await Promise.all([
            classifyWithModel(photoDataUri, 'plantvillage').catch((err) => {
              logError("PlantVillage model failed", err);
              return [];
            }),
            classifyWithModel(photoDataUri, 'paddy').catch((err) => {
              logError("Paddy model failed", err);
              return [];
            }),
          ]);
          
          const pvTop = pv?.[0];
          const paddyTop = paddy?.[0];
          let useModel: 'plantvillage'|'paddy' = 'plantvillage';
          let preds = pv || [];
          
          if (pvTop && paddyTop) {
            useModel = (paddyTop.confidence > pvTop.confidence) ? 'paddy' : 'plantvillage';
            preds = (useModel === 'paddy') ? paddy : pv;
            logInfo(`Selected ${useModel} model based on confidence`, { 
              plantvillage: pvTop?.confidence, 
              paddy: paddyTop?.confidence 
            });
          } else if (paddyTop && !pvTop) {
            useModel = 'paddy';
            preds = paddy;
            logInfo("Selected Paddy model (PlantVillage failed)");
          } else if (pvTop && !paddyTop) {
            useModel = 'plantvillage';
            preds = pv;
            logInfo("Selected PlantVillage model (Paddy failed)");
          }
          
          classification = { predictions: preds };
          // Attach chosen model key to be used by Grad-CAM later
          (classification as any)._modelKey = useModel;
        } catch (err) {
          logError('Both inference models failed, falling back to Genkit flow', err);
          try {
            classification = await classifyPlantDisease({ photoDataUri, language: locale });
          } catch (genkitErr) {
            logError('Genkit classification also failed', genkitErr);
            return { data: null, error: "Failed to classify the image. Please try again." };
          }
        }
      } else if (textDescription) {
        logInfo("Analyzing with text...");
        try {
          const textDiagnosis = await diagnoseWithText({ query: textDescription, language: locale });
          classification = { predictions: textDiagnosis.predictions };
          // Use a placeholder image since none was provided
          usedPhoto = "https://picsum.photos/seed/placeholder/600/400";
        } catch (err) {
          logError("Text diagnosis failed", err);
          return { data: null, error: "Failed to analyze text description. Please try again." };
        }
      } else {
         return { data: null, error: "Invalid input: Please upload an image or describe the issue." };
      }

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
      let fourteenDayForecast = []; // For detailed 14-day forecast
      
      if (validatedLocation) {
        try {
          logInfo("Fetching real-time weather and soil data", validatedLocation);
          
          // Fetch weather data (14 days) directly from API routes instead of using apiClient
          const weatherUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/farm-data/weather?lat=${validatedLocation.lat}&lng=${validatedLocation.lng}&days=14`;
          const weatherResponse = await fetch(weatherUrl);
          const weatherData = await weatherResponse.json();
          
          if (weatherData.success && weatherData.data) {
            // Use current weather data for immediate conditions
            weatherFeatures = {
              temperature: weatherData.data.current.temperature,
              humidity: weatherData.data.current.humidity,
              rainfall: weatherData.data.forecast.reduce((sum: any, day: any) => sum + day.rainChance, 0) / weatherData.data.forecast.length
            };
            
            // Store 14-day forecast for detailed analysis
            fourteenDayForecast = weatherData.data.forecast;
            
            // Create forecast summary for recommendations
            const avgTemp = weatherData.data.forecast.reduce((sum: any, day: any) => sum + (day.temp.max + day.temp.min) / 2, 0) / weatherData.data.forecast.length;
            const avgHumidity = weatherData.data.forecast.reduce((sum: any, day: any) => sum + day.humidity, 0) / weatherData.data.forecast.length;
            const rainDays = weatherData.data.forecast.filter((day: any) => day.rainChance > 30).length;
            
            forecastSummary = `Average temperature ${Math.round(avgTemp)}°C, ${Math.round(avgHumidity)}% humidity, with rain expected on ${rainDays} of the next 14 days`;
          }
          
          // Fetch soil data directly from API routes instead of using apiClient
          const soilUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/farm-data/soil?lat=${validatedLocation.lat}&lng=${validatedLocation.lng}`;
          const soilResponse = await fetch(soilUrl);
          const soilData = await soilResponse.json();
          
          if (soilData.success && soilData.data) {
            soilType = soilData.data.type;
          }
        } catch (e) {
          logWarn('Failed to fetch real-time data, using defaults', e);
        }
      }
      
      // Parallel processing of severity, explanation, and forecast
      logInfo("Starting parallel processing of severity, explanation, and forecast");
      const [severity, explanation, forecast] = await Promise.all([
        // Assess Severity via inference server if available
        (async () => {
          try {
            logInfo("Attempting severity assessment via inference server");
            const s = await severityFromServer(usedPhoto!);
            logInfo("Severity assessment successful via inference server");
            return s;
          } catch (e) {
            logWarn('Severity server unavailable, using Genkit fallback', e);
            try {
              const result = await assessDiseaseSeverity({ 
                photoDataUri: usedPhoto!, 
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
        // Explain with Grad-CAM
        (async () => {
          try {
            const modelKey = (classification as any)._modelKey as ('plantvillage'|'paddy'|undefined) || 'plantvillage';
            logInfo(`Attempting Grad-CAM explanation with ${modelKey} model`);
            const cam = await gradcamWithModel(usedPhoto!, modelKey, topPrediction.label);
            logInfo("Grad-CAM explanation successful");
            return { gradCAMOverlay: cam } as any;
          } catch (e) {
            logWarn('Grad-CAM server unavailable, using Genkit fallback', e);
            try {
              const result = await explainClassificationWithGradCAM({ 
                photoDataUri: usedPhoto!, 
                classificationResult: topPrediction.label 
              });
              logInfo("Grad-CAM explanation successful via Genkit");
              return result;
            } catch (err) {
              logError('Grad-CAM explanation failed', err);
              return { gradCAMOverlay: usedPhoto! } as any;
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
              cropType: 'Tomato', // This would ideally come from image analysis
              soilType, // Real-time soil data
              language: locale,
            };
            
            const result = await forecastOutbreakRisk(detailedForecastInput);
            logInfo("Risk forecast successful");
            return result;
          } catch (e) { 
            logError("Risk forecast failed", e); 
            return { riskScore: 0, explanation: 'Not available', preventiveActions: [] }; 
          }
        })(),
      ]);

      // Generate Recommendations using the results from the other flows
      logInfo("Generating recommendations");
      
      // Format model responses for Gemini integration
      const formattedModelResponse = formatModelResponseForGemini(
        classification,
        severity,
        explanation,
        forecast
      );
      
      logInfo("Formatted model response for Gemini", formattedModelResponse);
      
      const recommendations = await generateRecommendations({ 
          disease: topPrediction.label, 
          severity: severity.severityBand, 
          cropType: 'Tomato', // This would ideally come from image analysis
          language: locale,
          forecastSummary, // Real-time weather forecast summary with 14-day data
          soilType, // Real-time soil data
      }).catch(e => { 
        logError("Recommendations generation failed", e); 
        return { recommendations: [] }; 
      });
      
      const conversationId = uuidv4();
      
      // Save conversation to Firestore
      const analysisContext = JSON.stringify({
        disease: topPrediction.label,
        confidence: topPrediction.confidence,
        severity: severity,
        risk: forecast.riskScore,
      });
      
      const title = `Chat about ${topPrediction.label}`;
      await saveConversationToFirestore(conversationId, title, analysisContext);
      
      logInfo("Full analysis complete");
      return {
        data: {
          classification,
          severity,
          explanation,
          forecast,
          recommendations,
          originalImage: usedPhoto!,
          locale,
          conversationId,
        },
        error: null
      };

    } catch (e: any) {
      logError("Full analysis pipeline failed", e);
      return { data: null, error: e.message || "An unexpected error occurred during analysis." };
    }
  }

/**
 * Server action for handling follow-up questions from the user.
 * @param analysisContext - A stringified summary of the initial analysis.
 * @param question - The user's question.
 * @returns a promise that resolves to the AI's answer.
 */
export async function askFollowUpQuestion(
  analysisContext: string,
  question: string,
  language: string,
): Promise<AskFollowUpQuestionOutput> {
    try {
        const result = await askFollowUpQuestionFlow({ analysisContext, question, language });
        return result;
    } catch(e: any) {
        console.error("Follow-up question failed:", e);
        return { answer: "Sorry, I encountered an error trying to answer your question." };
    }
}