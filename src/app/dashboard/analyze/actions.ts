
'use server';

import { classifyPlantDisease } from "@/ai/flows/classify-plant-disease";
import { assessDiseaseSeverity } from "@/ai/flows/assess-disease-severity";
import { forecastOutbreakRisk } from "@/ai/flows/forecast-outbreak-risk";
import { explainClassificationWithGradCAM } from "@/ai/flows/explain-classification-with-grad-cam";
import { generateRecommendations } from "@/ai/flows/generate-recommendations";
import { askFollowUpQuestion as askFollowUpQuestionFlow } from "@/ai/flows/ask-follow-up-question";
import type { AskFollowUpQuestionOutput } from "@/ai/flows/ask-follow-up-question";


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
