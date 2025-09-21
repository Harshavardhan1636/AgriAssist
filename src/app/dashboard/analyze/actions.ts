'use server';

import { classifyPlantDisease } from "@/ai/flows/classify-plant-disease";
import { assessDiseaseSeverity } from "@/ai/flows/assess-disease-severity";
import { forecastOutbreakRisk } from "@/ai/flows/forecast-outbreak-risk";
import { explainClassificationWithGradCAM } from "@/ai/flows/explain-classification-with-grad-cam";
import { z } from "zod";
import type { FullAnalysisResponse } from "@/lib/types";

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

const analyzeImageSchema = z.object({
  photoDataUri: z.string().refine(val => val.startsWith('data:image/'), {
    message: "Invalid image data URI"
  }),
});

export async function analyzeImage(
  prevState: any,
  formData: FormData
): Promise<{ data: FullAnalysisResponse | null, error: string | null }> {

  const photoDataUri = formData.get('photoDataUri') as string;

  const validatedFields = analyzeImageSchema.safeParse({ photoDataUri });
  if (!validatedFields.success) {
    return { data: null, error: "Invalid input: Please upload a valid image." };
  }

  try {
    const classification = await classifyPlantDisease({ photoDataUri });
    
    const topPredictionLabel = classification.predictions?.[0]?.label ?? "unknown";

    const [severity, explanation, forecast] = await Promise.all([
      assessDiseaseSeverity({ photoDataUri, description: `Image of a plant leaf, classified as ${topPredictionLabel}` }),
      explainClassificationWithGradCAM({ photoDataUri, classificationResult: topPredictionLabel }),
      forecastOutbreakRisk({
        historicalDetections: [1, 0, 2, 1, 3, 0, 4],
        weatherFeatures: { temperature: 25, humidity: 80, rainfall: 5 },
        cropType: 'Tomato',
        soilType: 'Loam',
        recentSeverityAverages: 0.35,
      }),
    ]);
    
    // In a real scenario, the Grad-CAM might fail or be mocked. Let's ensure a fallback.
    if (!explanation.gradCAMOverlay) {
        explanation.gradCAMOverlay = photoDataUri; // Fallback to original image
    }

    return {
      data: {
        classification,
        severity,
        explanation,
        forecast,
        originalImage: photoDataUri,
      },
      error: null
    };

  } catch (e: any) {
    console.error("Analysis failed:", e);
    return { data: null, error: e.message || "An unexpected error occurred during analysis." };
  }
}
