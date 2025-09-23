
'use server';

import { classifyPlantDisease } from "@/ai/flows/classify-plant-disease";
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
  photoDataUri: z.string().refine(val => val.startsWith('data:image/'), {
    message: "Invalid image data URI"
  }),
  locale: z.string().optional(),
});


export async function analyzeImage(
    formData: FormData
  ): Promise<{ data: FullAnalysisResponse | null, error: string | null }> {
    
    const photoDataUri = formData.get('photoDataUri') as string;
    const locale = formData.get('locale') as string || 'en';

    const validatedFields = analyzeImageSchema.safeParse({ photoDataUri, locale });
    if (!validatedFields.success) {
      return { data: null, error: "Invalid input: Please upload a valid image." };
    }

    try {
      // 1. Classify the disease first, as other steps depend on it.
      const classification = await classifyPlantDisease({ photoDataUri, language: locale });

      // **CRITICAL FIX**: Handle cases where the AI returns no predictions.
      if (!classification || !classification.predictions || classification.predictions.length === 0) {
        // This stops the action gracefully and returns a specific error to the client.
        return { data: null, error: "The AI model could not identify a disease in the image. Please try a different photo." };
      }

      const topPrediction = classification.predictions[0];
      
      // 2. Run subsequent analyses, now with robust error handling for each.
      const [severity, explanation, forecast, recommendations] = await Promise.all([
        // Assess Severity
        assessDiseaseSeverity({ photoDataUri, description: `Image of a plant leaf, classified as ${topPrediction.label}`, language: locale })
          .catch(e => { console.error("Severity assessment failed:", e); return { severityPercentage: 0, severityBand: 'Unknown', confidence: 0 }; }),
        
        // Explain with Grad-CAM
        explainClassificationWithGradCAM({ photoDataUri, classificationResult: topPrediction.label })
          .catch(e => { console.error("Grad-CAM explanation failed:", e); return { gradCAMOverlay: photoDataUri }; }), // Fallback to original image
        
        // Forecast Risk
        forecastOutbreakRisk({
          historicalDetections: [1, 0, 2, 1, 3, 0, 4],
          weatherFeatures: { temperature: 25, humidity: 80, rainfall: 5 },
          cropType: 'Tomato',
          soilType: 'Loam',
          recentSeverityAverages: 0.35,
          language: locale,
        }).catch(e => { console.error("Risk forecast failed:", e); return { riskScore: 0, explanation: 'Not available', recommendations: [] }; }),

        // Generate Recommendations
        generateRecommendations({ disease: topPrediction.label, severity: 'Medium', cropType: 'Tomato', language: locale })
          .catch(e => { console.error("Recommendations generation failed:", e); return { recommendations: ['Could not generate recommendations.'] }; }),
      ]);
      

      return {
        data: {
          classification,
          severity,
          explanation,
          forecast,
          recommendations,
          originalImage: photoDataUri,
          locale,
        },
        error: null
      };

    } catch (e: any) {
      console.error("Analysis failed:", e);
      // This will catch the error from the initial classification step or any other unexpected error.
      return { data: null, error: e.message || "An unexpected error occurred during analysis." };
    }
  }


/**
 * Server action for handling follow-up questions from the user.
 * @param analysisContext - A stringified summary of the initial analysis.
 * @param question - The user's question.
 * @returns A promise that resolves to the AI's answer.
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
