
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

// Inference server configuration (FastAPI)
const INFER_SERVER_URL = process.env.INFER_SERVER_URL || 'http://localhost:8000';

async function dataUriToBlob(dataUri: string): Promise<Blob> {
  // data:image/jpeg;base64,...
  const [meta, b64] = dataUri.split(',');
  const mimeMatch = /data:(.*?);base64/gi.exec(meta || '')
  const mime = mimeMatch?.[1] || 'image/jpeg';
  const buffer = Buffer.from(b64, 'base64');
  return new Blob([buffer], { type: mime });
}

async function classifyWithModel(photoDataUri: string, modelKey: 'plantvillage'|'paddy') {
  const blob = await dataUriToBlob(photoDataUri);
  const form = new FormData();
  form.append('model_key', modelKey);
  form.append('topk', '5');
  form.append('file', blob, 'image.jpg');
  const res = await fetch(`${INFER_SERVER_URL}/classify`, { method: 'POST', body: form as any });
  if (!res.ok) throw new Error(`classify ${modelKey} failed ${res.status}`);
  const json = await res.json();
  return json?.predictions || [];
}

async function gradcamWithModel(photoDataUri: string, modelKey: 'plantvillage'|'paddy', targetLabel: string) {
  const blob = await dataUriToBlob(photoDataUri);
  const form = new FormData();
  form.append('model_key', modelKey);
  form.append('target_label', targetLabel);
  form.append('file', blob, 'image.jpg');
  const res = await fetch(`${INFER_SERVER_URL}/gradcam`, { method: 'POST', body: form as any });
  if (!res.ok) throw new Error(`gradcam ${modelKey} failed ${res.status}`);
  const json = await res.json();
  return json?.dataUri as string;
}

async function severityFromServer(photoDataUri: string) {
  const blob = await dataUriToBlob(photoDataUri);
  const form = new FormData();
  form.append('file', blob, 'image.jpg');
  const res = await fetch(`${INFER_SERVER_URL}/severity`, { method: 'POST', body: form as any });
  if (!res.ok) throw new Error(`severity failed ${res.status}`);
  const json = await res.json();
  return json as { severityPercentage: number; severityBand: 'Low'|'Medium'|'High'|'Unknown'; confidence: number };
}


// Re-exporting types for easier access from the client
export type {
  ClassifyPlantDiseaseOutput,
  ClassifyPlantDiseaseInput,
} from '@/ai/flows/classify-plant-disease';
export type {
  DiagnoseWithTextOutput,
  DiagnoseWithTextInput,
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

    const validatedFields = analyzeImageSchema.safeParse({ 
        photoDataUri: rawPhotoDataUri, 
        textQuery: rawTextQuery,
        audioDataUri: rawAudioDataUri, 
        locale 
    });

    if (!validatedFields.success) {
      console.error("Validation failed:", validatedFields.error.flatten());
      return { data: null, error: "Invalid input: Please upload an image or describe the issue." };
    }
    
    let { photoDataUri, textQuery, audioDataUri } = validatedFields.data;

    try {
      let classification;
      let usedPhoto = photoDataUri;
      let textDescription = textQuery || '';

      // Main logic for multimodal input
      if (audioDataUri) {
          console.log("Transcribing audio...");
          const transcriptionResult = await transcribeAudio({ audioDataUri });
          textDescription = transcriptionResult.transcription;
          console.log(`Transcription result: ${textDescription}`);
      }

      if (photoDataUri) {
        console.log("Analyzing with image via inference server...");
        try {
          // Call both models and pick the higher-confidence top-1
          const [pv, paddy] = await Promise.all([
            classifyWithModel(photoDataUri, 'plantvillage').catch(() => []),
            classifyWithModel(photoDataUri, 'paddy').catch(() => []),
          ]);
          const pvTop = pv?.[0];
          const paddyTop = paddy?.[0];
          let useModel: 'plantvillage'|'paddy' = 'plantvillage';
          let preds = pv || [];
          if (pvTop && paddyTop) {
            useModel = (paddyTop.confidence > pvTop.confidence) ? 'paddy' : 'plantvillage';
            preds = (useModel === 'paddy') ? paddy : pv;
          } else if (paddyTop && !pvTop) {
            useModel = 'paddy';
            preds = paddy;
          }
          classification = { predictions: preds };
          // Attach chosen model key to be used by Grad-CAM later
          (classification as any)._modelKey = useModel;
        } catch (err) {
          console.warn('Inference server classify failed, falling back to Genkit flow:', err);
          classification = await classifyPlantDisease({ photoDataUri, language: locale });
        }
      } else if (textDescription) {
        console.log("Analyzing with text...");
        const textDiagnosis = await diagnoseWithText({ query: textDescription, language: locale });
        classification = { predictions: textDiagnosis.predictions };
        // Use a placeholder image since none was provided
        usedPhoto = "https://picsum.photos/seed/placeholder/600/400";
      } else {
         return { data: null, error: "Invalid input: Please upload an image or describe the issue." };
      }

      if (!classification || !classification.predictions || classification.predictions.length === 0) {
        console.error("Classification failed to return predictions.");
        return { data: null, error: "The AI model could not identify a disease. Please try again." };
      }

      const topPrediction = classification.predictions[0];
      console.log("Top prediction:", topPrediction);
      
      const soilType = 'Loam'; // Mock data
      
      const [severity, explanation, forecast] = await Promise.all([
        // Assess Severity via inference server if available
        (async () => {
          try {
            const s = await severityFromServer(usedPhoto!);
            return s;
          } catch (e) {
            console.warn('Severity server unavailable, using Genkit fallback');
            try {
              return await assessDiseaseSeverity({ photoDataUri: usedPhoto!, description: textDescription, language: locale });
            } catch (err) {
              console.error('Severity assessment failed:', err);
              return { severityPercentage: 0, severityBand: 'Unknown', confidence: 0 } as any;
            }
          }
        })(),
        // Explain with Grad-CAM
        (async () => {
          try {
            const modelKey = (classification as any)._modelKey as ('plantvillage'|'paddy'|undefined) || 'plantvillage';
            const cam = await gradcamWithModel(usedPhoto!, modelKey, topPrediction.label);
            return { gradCAMOverlay: cam } as any;
          } catch (e) {
            console.warn('Grad-CAM server unavailable, using Genkit fallback');
            try {
              return await explainClassificationWithGradCAM({ photoDataUri: usedPhoto!, classificationResult: topPrediction.label });
            } catch (err) {
              console.error('Grad-CAM explanation failed:', err);
              return { gradCAMOverlay: usedPhoto! } as any;
            }
          }
        })(),
        // Forecast Risk
        forecastOutbreakRisk({
          disease: topPrediction.label,
          historicalDetections: [1, 0, 2, 1, 3, 0, 4, 2, 3, 1, 5, 2, 4, 3], // Mock data for 14 days
          weatherFeatures: { temperature: 28, humidity: 82, rainfall: 8 }, // Mock 14-day average
          cropType: 'Tomato', // Mock data
          soilType,
          language: locale,
        }).catch(e => { console.error("Risk forecast failed:", e); return { riskScore: 0, explanation: 'Not available', preventiveActions: [] }; }),
      ]);

      // Generate Recommendations using the results from the other flows
      const recommendations = await generateRecommendations({ 
          disease: topPrediction.label, 
          severity: severity.severityBand, 
          cropType: 'Tomato', // Mock data
          language: locale,
          forecastSummary: `Risk score is ${forecast.riskScore}. ${forecast.explanation}`,
          soilType: soilType,
      }).catch(e => { console.error("Recommendations generation failed:", e); return { recommendations: [] }; });
      
      const conversationId = uuidv4();
      
      console.log("Full analysis complete.");
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
      console.error("Full analysis pipeline failed:", e);
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
