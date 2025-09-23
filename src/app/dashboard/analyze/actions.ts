
'use server';

import { classifyPlantDisease } from "@/ai/flows/classify-plant-disease";
import { assessDiseaseSeverity } from "@/ai/flows/assess-disease-severity";
import { forecastOutbreakRisk } from "@/ai/flows/forecast-outbreak-risk";
import { explainClassificationWithGradCAM } from "@/ai/flows/explain-classification-with-grad-cam";
import { generateRecommendations } from "@/ai/flows/generate-recommendations";
import { askFollowUpQuestion as askFollowUpQuestionFlow } from "@/ai/flows/ask-follow-up-question";
import { z } from "zod";
import type { FullAnalysisResponse } from "@/lib/types";

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


/**
 * Defines the schema for the input form.
 * Ensures that the photoDataUri is a valid base64-encoded image data URI.
 */
const analyzeImageSchema = z.object({
  photoDataUri: z.string().refine(val => val.startsWith('data:image/'), {
    message: "Invalid image data URI"
  }),
  locale: z.string().optional(),
});


/**
 * This is the primary server action that orchestrates the entire AI analysis process.
 * It is called from the client when the user submits an image for analysis.
 *
 * @param prevState - The previous state of the form, used by `useActionState`.
 * @param formData - The form data submitted by the client, containing the image.
 * @returns A promise that resolves to an object with either the analysis data or an error message.
 */
export async function analyzeImage(
  prevState: any,
  formData: FormData
): Promise<{ data: FullAnalysisResponse | null, error: string | null }> {

  const photoDataUri = formData.get('photoDataUri') as string;
  const locale = formData.get('locale') as string || 'en';

  // 1. Validate the input to ensure it's a valid data URI.
  const validatedFields = analyzeImageSchema.safeParse({ photoDataUri, locale });
  if (!validatedFields.success) {
    return { data: null, error: "Invalid input: Please upload a valid image." };
  }

  try {
    // 2. First, classify the disease to get the primary diagnosis.
    // This is done first because its output is used as input for other flows.
    const classification = await classifyPlantDisease({ photoDataUri, language: locale });
    
    // Get the top prediction to pass to other AI flows for more context.
    const topPrediction = classification.predictions?.[0] ?? { label: "unknown", confidence: 0 };

    // 3. In parallel, run the other analysis flows for efficiency.
    // These flows provide deeper insights into the diagnosis.
    const [severity, explanation, forecast, recommendations] = await Promise.all([
      // Assess the severity of the identified disease.
      assessDiseaseSeverity({ photoDataUri, description: `Image of a plant leaf, classified as ${topPrediction.label}`, language: locale }),
      // Generate an "explainable AI" overlay to show what the AI focused on.
      explainClassificationWithGradCAM({ photoDataUri, classificationResult: topPrediction.label }),
      // Forecast the risk of a disease outbreak based on mock data.
      forecastOutbreakRisk({
        historicalDetections: [1, 0, 2, 1, 3, 0, 4], // Mock data
        weatherFeatures: { temperature: 25, humidity: 80, rainfall: 5 }, // Mock data
        cropType: 'Tomato', // Mock data
        soilType: 'Loam', // Mock data
        recentSeverityAverages: 0.35, // Mock data
        language: locale,
      }),
       // Generate ethical recommendations.
      generateRecommendations({ disease: topPrediction.label, severity: 'Medium' /* Placeholder */, cropType: 'Tomato', language: locale }),
    ]);
    
    // 4. Fallback for the Grad-CAM explanation. If the AI fails to generate an
    // overlay, we'll just use the original image to prevent a crash.
    if (!explanation.gradCAMOverlay) {
        explanation.gradCAMOverlay = photoDataUri;
    }

    // 5. Aggregate all the results into a single object and return it to the client.
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
    // 6. If any part of the analysis fails, log the error and return a user-friendly error message.
    console.error("Analysis failed:", e);
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
