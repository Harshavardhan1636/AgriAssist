
import type {
  ClassifyPlantDiseaseOutput,
  AssessDiseaseSeverityOutput,
  ExplainClassificationWithGradCAMOutput,
  ForecastOutbreakRiskOutput,
  GenerateRecommendationsOutput,
} from '@/app/dashboard/analyze/fixed-actions';


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
    // Environmental metrics
    environmentalImpact?: {
      carbonFootprint?: number; // in kg CO2 equivalent
      waterUsage?: number; // in liters
      biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
    };
    organicTreatmentAlternatives?: string[]; // List of organic treatment options
    waterConservationRecommendations?: string[]; // Water conservation techniques
}

export type AnalysisResult = {
  id: string;
  conversationId: string;
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
  // Environmental metrics
  environmentalImpact?: {
    carbonFootprint?: number; // in kg CO2 equivalent
    waterUsage?: number; // in liters
    biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
  };
  organicTreatmentAlternatives?: string[]; // List of organic treatment options
  waterConservationRecommendations?: string[]; // Water conservation techniques
  biodiversityImpactAssessment?: string; // Biodiversity impact assessment
};

export type ReviewQueueItem = {
  id: string;
  conversationId: string;
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
  confidence: number;
  reviewedAt?: string;
  reviewedBy?: string;
  expertLabel?: string;
  notes?: string;
  // Environmental metrics
  environmentalImpact?: {
    carbonFootprint?: number; // in kg CO2 equivalent
    waterUsage?: number; // in liters
    biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
  };
  organicTreatmentAlternatives?: string[]; // List of organic treatment options
  waterConservationRecommendations?: string[]; // Water conservation techniques
  biodiversityImpactAssessment?: string; // Biodiversity impact assessment
};

export type FullAnalysisResponse = {
  classification: ClassifyPlantDiseaseOutput;
  severity: AssessDiseaseSeverityOutput;
  explanation: ExplainClassificationWithGradCAMOutput;
  forecast: ForecastOutbreakRiskOutput;
  recommendations: GenerateRecommendationsOutput;
  originalImage: string;
  locale: string;
  conversationId: string;
  // Add property to indicate if this is a text-based analysis
  isTextBasedAnalysis?: boolean;
  // Environmental metrics
  environmentalImpact?: {
    carbonFootprint?: number; // in kg CO2 equivalent
    waterUsage?: number; // in liters
    biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
  };
  organicTreatmentAlternatives?: string[]; // List of organic treatment options
  waterConservationRecommendations?: string[]; // Water conservation techniques
  biodiversityImpactAssessment?: string; // Biodiversity impact assessment
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
    // Environmental metrics
    environmentalImpact?: {
      carbonFootprint?: number; // in kg CO2 equivalent per application
      waterUsage?: number; // in liters per hectare
      biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
    };
    isOrganic?: boolean; // Whether this product is organic
    organicCertification?: string; // Organic certification details
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
    // Environmental metrics
    environmentalImpact?: {
      carbonFootprint?: number; // in kg CO2 equivalent
      waterUsage?: number; // in liters
      biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
    };
    waterConservationRecommendations?: string[]; // Water conservation techniques
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
    // Environmental metrics
    environmentalImpact?: {
      carbonFootprint?: number; // in kg CO2 equivalent
      waterRetention?: number; // in liters
      biodiversitySupport?: 'High' | 'Medium' | 'Low';
    };
    organicMatterContent?: number; // percentage
    waterConservationCapacity?: number; // in liters per cubic meter
};

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  // Environmental metrics
  environmentalImpact?: {
    carbonFootprint?: number; // in kg CO2 equivalent
    waterUsage?: number; // in liters
    biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
  };
  organicTreatmentAlternatives?: string[]; // List of organic treatment options
  waterConservationRecommendations?: string[]; // Water conservation techniques
  biodiversityImpactAssessment?: string; // Biodiversity impact assessment
}

export interface Conversation {
  id: string;
  analysisId: string;
  title: string;
  lastMessageTimestamp: string;
  analysisContext: string;
  messages: ChatMessage[];
  // Environmental metrics
  environmentalImpact?: {
    carbonFootprint?: number; // in kg CO2 equivalent
    waterUsage?: number; // in liters
    biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
  };
  organicTreatmentAlternatives?: string[]; // List of organic treatment options
  waterConservationRecommendations?: string[]; // Water conservation techniques
  biodiversityImpactAssessment?: string; // Biodiversity impact assessment
}

// Knowledge Sharing Platform Types
export type KnowledgeProblem = {
  id: string;
  title: string;
  description: string;
  crop: 'Tomato' | 'Potato' | 'Maize' | 'Wheat' | 'Rice' | 'Unknown';
  location: string;
  region: string;
  postedAt: string;
  postedBy: string; // Anonymous identifier
  isAnonymous: boolean;
  category: 'Pest' | 'Disease' | 'Nutrition' | 'Weather' | 'Soil' | 'Other';
  upvotes: number;
  downvotes: number;
  status: 'Open' | 'Solved' | 'In Progress' | 'Closed';
  views: number;
  // Environmental metrics
  environmentalImpact?: {
    carbonFootprint?: number; // in kg CO2 equivalent
    waterUsage?: number; // in liters
    biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
  };
  organicTreatmentAlternatives?: string[]; // List of organic treatment options
};

export type KnowledgeSolution = {
  id: string;
  problemId: string;
  title: string;
  description: string;
  postedAt: string;
  postedBy: string;
  isAnonymous: boolean;
  upvotes: number;
  downvotes: number;
  verifiedByExpert: boolean;
  expertId?: string;
  expertName?: string;
  expertVerifiedAt?: string;
  helpfulCount: number;
  notHelpfulCount: number;
  // Environmental metrics
  environmentalImpact?: {
    carbonFootprint?: number; // in kg CO2 equivalent
    waterUsage?: number; // in liters
    biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
  };
  organicTreatmentAlternatives?: string[]; // List of organic treatment options
  isOrganic?: boolean; // Whether this solution prioritizes organic methods
};

export type BestPractice = {
  id: string;
  title: string;
  description: string;
  region: string;
  crop: 'Tomato' | 'Potato' | 'Maize' | 'Wheat' | 'Rice' | 'Unknown';
  category: 'Pest' | 'Disease' | 'Nutrition' | 'Weather' | 'Soil' | 'Other';
  postedAt: string;
  postedBy: string;
  upvotes: number;
  downvotes: number;
  verifiedByExpert: boolean;
  expertId?: string;
  expertName?: string;
  expertVerifiedAt?: string;
  successRate?: number;
  // Environmental metrics
  environmentalImpact?: {
    carbonFootprint?: number; // in kg CO2 equivalent
    waterUsage?: number; // in liters
    biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
  };
  organicTreatmentAlternatives?: string[]; // List of organic treatment options
  isOrganic?: boolean; // Whether this practice prioritizes organic methods
  waterConservationTechnique?: string; // Specific water conservation technique used
};

export type SuccessStory = {
  id: string;
  title: string;
  description: string;
  farmerName: string;
  location: string;
  region: string;
  crop: 'Tomato' | 'Potato' | 'Maize' | 'Wheat' | 'Rice' | 'Unknown';
  problem: string;
  solution: string;
  beforeYield: number;
  afterYield: number;
  yieldImprovement: number;
  costSavings: number;
  timePeriod: string;
  postedAt: string;
  upvotes: number;
  downvotes: number;
  verifiedByExpert: boolean;
  expertId?: string;
  expertName?: string;
  expertVerifiedAt?: string;
  images?: string[];
  // Environmental metrics
  environmentalImpact?: {
    carbonFootprint?: number; // in kg CO2 equivalent
    waterUsage?: number; // in liters
    biodiversityImpact?: 'Positive' | 'Neutral' | 'Negative';
  };
  organicTreatmentAlternatives?: string[]; // List of organic treatment options used
  isOrganic?: boolean; // Whether this story involves organic methods
  waterConservationTechnique?: string; // Specific water conservation technique used
  biodiversityImpactDescription?: string; // Description of biodiversity impact
};
