
'use server';

import { classifyPlantDisease } from "@/ai/flows/classify-plant-disease";
import { diagnoseWithText } from "@/ai/flows/diagnose-with-text";
import { assessDiseaseSeverity } from "@/ai/flows/assess-disease-severity";
import { forecastOutbreakRisk } from "@/ai/flows/forecast-outbreak-risk";
import { explainClassificationWithGradCAM } from "@/ai/flows/explain-classification-with-grad-cam";
import { generateRecommendations } from "@/ai/flows/generate-recommendations";
import { askFollowUpQuestion as askFollowUpQuestionFlow } from "@/ai/flows/ask-follow-up-question";
import type { AskFollowUpQuestionOutput } from "@/ai/flows/ask-follow-up-question";
import type { FullAnalysisResponse } from "@/lib/types";
import { z } from "zod";


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


const analyzeImageSchema = z.object({
  photoDataUri: z.string().optional(),
  textQuery: z.string().optional(),
  locale: z.string().optional(),
}).refine(data => !!data.photoDataUri || !!data.textQuery, {
  message: "Either an image or a text query must be provided."
});


export async function analyzeImage(
    formData: FormData
  ): Promise<{ data: FullAnalysisResponse | null, error: string | null }> {
    
    const photoDataUri = formData.get('photoDataUri') as string | null;
    const textQuery = formData.get('textQuery') as string | null;
    const locale = formData.get('locale') as string || 'en';

    const validatedFields = analyzeImageSchema.safeParse({ photoDataUri, textQuery, locale });
    if (!validatedFields.success) {
      return { data: null, error: "Invalid input: Please upload an image or describe the issue." };
    }

    try {
      let classification;
      let usedPhoto = photoDataUri;

      if (photoDataUri) {
        // 1a. Classify with image
        classification = await classifyPlantDisease({ photoDataUri, language: locale });
      } else if (textQuery) {
        // 1b. Classify with text
        const textDiagnosis = await diagnoseWithText({ query: textQuery, language: locale });
        classification = { predictions: textDiagnosis.predictions };
        // We don't have a real photo, so we'll use a placeholder for subsequent steps
        usedPhoto = "https://picsum.photos/seed/placeholder/600/400";
      } else {
         return { data: null, error: "No input provided. Please upload an image or describe the problem." };
      }

      if (!classification || !classification.predictions || classification.predictions.length === 0) {
        return { data: null, error: "The AI model could not identify a disease. Please try a different photo or description." };
      }

      const topPrediction = classification.predictions[0];
      
      const [severity, explanation, forecast, recommendations] = await Promise.all([
        // Assess Severity
        assessDiseaseSeverity({ photoDataUri: usedPhoto, description: `Classified as ${topPrediction.label}. ${textQuery || ''}`, language: locale })
          .catch(e => { console.error("Severity assessment failed:", e); return { severityPercentage: 0, severityBand: 'Unknown', confidence: 0 }; }),
        
        // Explain with Grad-CAM (or fallback for text)
        explainClassificationWithGradCAM({ photoDataUri: usedPhoto, classificationResult: topPrediction.label })
          .catch(e => { console.error("Grad-CAM explanation failed:", e); return { gradCAMOverlay: usedPhoto }; }), // Fallback to original/placeholder image
        
        // Forecast Risk
        forecastOutbreakRisk({
          disease: topPrediction.label,
          historicalDetections: [1, 0, 2, 1, 3, 0, 4],
          weatherFeatures: { temperature: 25, humidity: 80, rainfall: 5 },
          cropType: 'Tomato', // Mock data
          soilType: 'Loam', // Mock data
          language: locale,
        }).catch(e => { console.error("Risk forecast failed:", e); return { riskScore: 0, explanation: 'Not available', recommendations: [] }; }),

        // Generate Recommendations
        generateRecommendations({ disease: topPrediction.label, severity: 'Medium', cropType: 'Tomato', language: locale }) // Mock severity for now
          .catch(e => { console.error("Recommendations generation failed:", e); return { recommendations: ['Could not generate recommendations.'] }; }),
      ]);
      

      return {
        data: {
          classification,
          severity,
          explanation,
          forecast,
          recommendations,
          originalImage: usedPhoto,
          locale,
        },
        error: null
      };

    } catch (e: any) {
      console.error("Analysis failed:", e);
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
