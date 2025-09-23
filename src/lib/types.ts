
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

export type CommunityOutbreak = {
  id: string;
  disease: string;
  crop: 'Tomato' | 'Potato' | 'Maize' | 'Wheat' | 'Rice' | 'Unknown';
  location: string; // e.g., "District, State"
  latitude: number;
  longitude: number;
  detectedCases: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  firstReported: string; // ISO date string
}

export type AnalysisResult = {
  id: string;
  timestamp: string;
  image: string;
  imageHint: string;
  predictions: Prediction[];
  severity: {
    percentage: number;
    band: 'Low' | 'Medium' | 'High';
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
  locale: string;
};


export type StoreProduct = {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: 'INR';
    image: string;
    imageHint: string;
    type: 'Organic Fungicide' | 'Chemical Fungicide' | 'Organic Insecticide' | 'Bio-stimulant';
    isGovtApproved: boolean;
    toxicity?: 'Low' | 'Medium' | 'High';
    quantity?: number;
};

export type StoreLocation = {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
};

export type WeatherForecast = {
    condition: 'Sunny' | 'Partly Cloudy' | 'Cloudy' | 'Rain' | 'Thunderstorms';
    temp: {
        max: number;
        min: number;
    };
    humidity: number;
    rainChance: number;
};

export type SoilData = {
    type: 'Loam' | 'Clay' | 'Sandy' | 'Silty';
    moisture: number; // percentage
    ph: number;
    nutrients: {
        nitrogen: 'Low' | 'Medium' | 'High';
        phosphorus: 'Low' | 'Medium' | 'High';
        potassium: 'Low' | 'Medium' | 'High';
    };
};
