import type {
  ClassifyPlantDiseaseOutput,
  AssessDiseaseSeverityOutput,
  ExplainClassificationWithGradCAMOutput,
  ForecastOutbreakRiskOutput,
  GenerateRecommendationsOutput,
} from '@/app/dashboard/analyze/actions';


export type Prediction = {
  label: string;
  confidence: number;
};

export type AnalysisResult = {
  id: string;
  timestamp: string;
  image: string;
  imageHint: string;
  predictions: Prediction[];
  severity: {
    percentage: number;
    band: string;
  };
  gradCamImage: string;
  risk: {
    score: number;
    explanation: string;
  };
  status: 'Completed' | 'Pending Review';
  crop: 'Tomato' | 'Potato' | 'Maize' | 'Unknown';
};

export type FullAnalysisResponse = {
  classification: ClassifyPlantDiseaseOutput;
  severity: AssessDiseaseSeverityOutput;
  explanation: ExplainClassificationWithGradCAMOutput;
  forecast: ForecastOutbreakRiskOutput;
  recommendations: GenerateRecommendationsOutput;
  originalImage: string;
};
