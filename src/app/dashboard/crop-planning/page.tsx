'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Sun, Droplets, Sprout, CalendarClock, Thermometer, Wind, Eye, Leaf, Cloud } from "lucide-react";
import { useI18n } from "@/context/i18n-context";
import { format, addDays, addMonths, isWithinInterval } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Define crop types
type CropType = 'tomato' | 'rice' | 'wheat' | 'maize' | 'potato' | 'cotton' | 'sugarcane' | 'soybean';

// Define season types
type Season = 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter';

// Define soil types
type SoilType = 'Loam' | 'Clay' | 'Sandy' | 'Silty' | 'Peaty' | 'Chalky' | 'Sandy Loam' | 'Clay Loam' | 'Black' | 'Red Sandy Loam' | 'Alluvial' | 'Laterite';

// Define weather conditions
interface WeatherData {
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  humidity: number;
  rainfall: number;
  windSpeed: number;
  sunlightHours: number;
}

// Define soil data
interface SoilData {
  type: SoilType;
  pH: number;
  nutrients: {
    nitrogen: 'Low' | 'Medium' | 'High';
    phosphorus: 'Low' | 'Medium' | 'High';
    potassium: 'Low' | 'Medium' | 'High';
  };
  moisture: number;
}

// Define crop data structure
interface CropData {
  name: string;
  plantingSeason: Season[];
  harvestingSeason: Season[];
  growthDuration: number; // in days
  waterRequirement: 'low' | 'medium' | 'high';
  soilType: SoilType[];
  recommendedRegions: string[];
  benefits: string[];
  challenges: string[];
  optimalWeather: {
    temperature: {
      min: number;
      max: number;
    };
    humidity: {
      min: number;
      max: number;
    };
    rainfall: {
      min: number;
      max: number;
    };
  };
  nutrientRequirements: {
    nitrogen: 'Low' | 'Medium' | 'High';
    phosphorus: 'Low' | 'Medium' | 'High';
    potassium: 'Low' | 'Medium' | 'High';
  };
  // Climate resilience attributes
  climateResilience: {
    droughtTolerance: 'low' | 'medium' | 'high';
    floodTolerance: 'low' | 'medium' | 'high';
    heatTolerance: 'low' | 'medium' | 'high';
    coldTolerance: 'low' | 'medium' | 'high';
  };
  adaptiveTechniques: string[];
}

// Define seasonal recommendation
interface SeasonalRecommendation {
  crop: CropType;
  name: string;
  bestPlantingWindow: {
    start: Date;
    end: Date;
  };
  expectedHarvest: Date;
  expectedYield: string;
  careInstructions: string[];
  riskFactors: string[];
  weatherSuitability: number; // 0-100
  soilSuitability: number; // 0-100
  overallSuitability: number; // 0-100
  climateAdaptation: {
    droughtTolerance: 'low' | 'medium' | 'high';
    floodTolerance: 'low' | 'medium' | 'high';
    heatTolerance: 'low' | 'medium' | 'high';
  };
  climateRecommendations: string[];
}

// Mock crop data with advanced information
const cropDatabase: Record<CropType, CropData> = {
  tomato: {
    name: 'Tomato',
    plantingSeason: ['spring', 'summer'],
    harvestingSeason: ['summer', 'autumn'],
    growthDuration: 90,
    waterRequirement: 'medium',
    soilType: ['Loam', 'Sandy Loam'],
    recommendedRegions: ['Tropical', 'Subtropical'],
    benefits: ['High yield', 'Rich in vitamins', 'Market demand'],
    challenges: ['Pest susceptibility', 'Disease risk'],
    optimalWeather: {
      temperature: { min: 18, max: 28 },
      humidity: { min: 60, max: 75 },
      rainfall: { min: 800, max: 1200 }
    },
    nutrientRequirements: {
      nitrogen: 'Medium',
      phosphorus: 'High',
      potassium: 'High'
    },
    climateResilience: {
      droughtTolerance: 'medium',
      floodTolerance: 'low',
      heatTolerance: 'medium',
      coldTolerance: 'low'
    },
    adaptiveTechniques: [
      'Use mulching to retain soil moisture during droughts',
      'Install drip irrigation systems for efficient water use',
      'Provide shade cloth during extreme heat',
      'Plant in raised beds to prevent waterlogging during floods',
      'Implement agroforestry practices to reduce wind speed and provide microclimate buffering',
      'Use cover crops to protect soil from erosion and retain moisture during extreme weather',
      'Apply soil amendments like biochar to improve water retention and soil structure',
      'Practice intercropping with complementary species to enhance resilience'
    ]
  },
  rice: {
    name: 'Rice',
    plantingSeason: ['monsoon'],
    harvestingSeason: ['autumn'],
    growthDuration: 120,
    waterRequirement: 'high',
    soilType: ['Clay', 'Silty'],
    recommendedRegions: ['Tropical'],
    benefits: ['Staple food', 'High caloric value'],
    challenges: ['Water intensive', 'Flood risk'],
    optimalWeather: {
      temperature: { min: 20, max: 35 },
      humidity: { min: 70, max: 90 },
      rainfall: { min: 1500, max: 2500 }
    },
    nutrientRequirements: {
      nitrogen: 'High',
      phosphorus: 'Medium',
      potassium: 'Medium'
    },
    climateResilience: {
      droughtTolerance: 'low',
      floodTolerance: 'high',
      heatTolerance: 'high',
      coldTolerance: 'low'
    },
    adaptiveTechniques: [
      'Use drought-resistant rice varieties during dry seasons',
      'Implement System of Rice Intensification (SRI) for water efficiency',
      'Create proper drainage systems to manage floodwaters',
      'Apply zinc fertilization to improve heat stress tolerance',
      'Use alternate wetting and drying (AWD) technique to conserve water',
      'Plant flood-tolerant rice varieties in low-lying areas',
      'Implement raised bed planting for better water management',
      'Use organic amendments to improve soil water retention'
    ]
  },
  wheat: {
    name: 'Wheat',
    plantingSeason: ['winter'],
    harvestingSeason: ['spring'],
    growthDuration: 150,
    waterRequirement: 'medium',
    soilType: ['Loam', 'Clay'],
    recommendedRegions: ['Temperate'],
    benefits: ['Staple food', 'Good shelf life'],
    challenges: ['Cold sensitivity', 'Drought risk'],
    optimalWeather: {
      temperature: { min: 10, max: 25 },
      humidity: { min: 50, max: 70 },
      rainfall: { min: 300, max: 700 }
    },
    nutrientRequirements: {
      nitrogen: 'High',
      phosphorus: 'High',
      potassium: 'Medium'
    },
    climateResilience: {
      droughtTolerance: 'medium',
      floodTolerance: 'medium',
      heatTolerance: 'low',
      coldTolerance: 'high'
    },
    adaptiveTechniques: [
      'Use drought-tolerant wheat varieties',
      'Apply anti-transpirants to reduce water loss',
      'Plant windbreaks to protect against extreme cold',
      'Use raised beds to prevent waterlogging',
      'Implement conservation tillage to preserve soil moisture',
      'Use early-maturing varieties to avoid heat stress during grain filling',
      'Apply gypsum to improve soil structure in sodic soils',
      'Practice crop rotation with legumes to enhance soil nitrogen'
    ]
  },
  maize: {
    name: 'Maize',
    plantingSeason: ['summer'],
    harvestingSeason: ['autumn'],
    growthDuration: 100,
    waterRequirement: 'medium',
    soilType: ['Loam', 'Sandy'],
    recommendedRegions: ['Tropical', 'Subtropical'],
    benefits: ['Versatile use', 'Animal feed'],
    challenges: ['Pest issues', 'Weather sensitivity'],
    optimalWeather: {
      temperature: { min: 15, max: 30 },
      humidity: { min: 60, max: 80 },
      rainfall: { min: 600, max: 1000 }
    },
    nutrientRequirements: {
      nitrogen: 'High',
      phosphorus: 'Medium',
      potassium: 'High'
    },
    climateResilience: {
      droughtTolerance: 'medium',
      floodTolerance: 'medium',
      heatTolerance: 'medium',
      coldTolerance: 'low'
    },
    adaptiveTechniques: [
      'Use drought-tolerant maize hybrids',
      'Implement conservation tillage to retain soil moisture',
      'Create drainage channels to manage excess water',
      'Apply reflective mulch to reduce heat stress',
      'Use early planting to avoid peak heat periods',
      'Implement intercropping with legumes for nitrogen fixation',
      'Apply potassium fertilizers to improve drought tolerance',
      'Use no-till practices to preserve soil structure and moisture'
    ]
  },
  potato: {
    name: 'Potato',
    plantingSeason: ['spring', 'autumn'],
    harvestingSeason: ['summer', 'winter'],
    growthDuration: 110,
    waterRequirement: 'medium',
    soilType: ['Sandy Loam', 'Loam'],
    recommendedRegions: ['Temperate', 'Subtropical'],
    benefits: ['High nutrition', 'Storage friendly'],
    challenges: ['Disease susceptibility', 'Storage issues'],
    optimalWeather: {
      temperature: { min: 15, max: 22 },
      humidity: { min: 70, max: 85 },
      rainfall: { min: 800, max: 1200 }
    },
    nutrientRequirements: {
      nitrogen: 'Medium',
      phosphorus: 'High',
      potassium: 'High'
    },
    climateResilience: {
      droughtTolerance: 'low',
      floodTolerance: 'medium',
      heatTolerance: 'low',
      coldTolerance: 'high'
    },
    adaptiveTechniques: [
      'Use drought-tolerant potato varieties',
      'Install drip irrigation systems',
      'Plant in raised beds with good drainage',
      'Use straw mulching to protect against frost',
      'Practice hilling to improve drainage and protect tubers',
      'Use black plastic mulch to warm soil in cool conditions',
      'Implement crop rotation to break pest and disease cycles',
      'Apply organic compost to improve soil water-holding capacity'
    ]
  },
  cotton: {
    name: 'Cotton',
    plantingSeason: ['spring', 'summer'],
    harvestingSeason: ['autumn'],
    growthDuration: 180,
    waterRequirement: 'medium',
    soilType: ['Black', 'Loam'],
    recommendedRegions: ['Tropical', 'Subtropical'],
    benefits: ['Fiber crop', 'High economic value'],
    challenges: ['Pest issues', 'Water management'],
    optimalWeather: {
      temperature: { min: 20, max: 30 },
      humidity: { min: 50, max: 70 },
      rainfall: { min: 500, max: 1000 }
    },
    nutrientRequirements: {
      nitrogen: 'High',
      phosphorus: 'Medium',
      potassium: 'High'
    },
    climateResilience: {
      droughtTolerance: 'high',
      floodTolerance: 'medium',
      heatTolerance: 'high',
      coldTolerance: 'low'
    },
    adaptiveTechniques: [
      'Use drought-resistant cotton varieties',
      'Implement rainwater harvesting systems',
      'Create proper drainage to prevent waterlogging',
      'Use shade nets during extreme heat periods',
      'Practice intercropping with legumes for nitrogen and shade',
      'Use plastic mulch to control weeds and retain soil moisture',
      'Implement precision planting to optimize plant spacing',
      'Apply organic amendments to improve soil fertility and structure'
    ]
  },
  sugarcane: {
    name: 'Sugarcane',
    plantingSeason: ['spring'],
    harvestingSeason: ['winter'],
    growthDuration: 365,
    waterRequirement: 'high',
    soilType: ['Loam', 'Clay Loam'],
    recommendedRegions: ['Tropical', 'Subtropical'],
    benefits: ['High sugar content', 'Biofuel production'],
    challenges: ['Long growth period', 'Water intensive'],
    optimalWeather: {
      temperature: { min: 20, max: 35 },
      humidity: { min: 60, max: 80 },
      rainfall: { min: 1000, max: 1500 }
    },
    nutrientRequirements: {
      nitrogen: 'High',
      phosphorus: 'High',
      potassium: 'High'
    },
    climateResilience: {
      droughtTolerance: 'medium',
      floodTolerance: 'high',
      heatTolerance: 'high',
      coldTolerance: 'low'
    },
    adaptiveTechniques: [
      'Use drought-tolerant sugarcane varieties',
      'Implement micro-irrigation systems',
      'Create proper drainage channels for flood management',
      'Apply anti-transpirants to reduce water loss during heat stress',
      'Practice ratoon cropping to extend growing season',
      'Use organic mulches to conserve soil moisture',
      'Implement contour planting to reduce soil erosion',
      'Apply biofertilizers to enhance nutrient uptake'
    ]
  },
  soybean: {
    name: 'Soybean',
    plantingSeason: ['summer'],
    harvestingSeason: ['autumn'],
    growthDuration: 120,
    waterRequirement: 'medium',
    soilType: ['Loam', 'Clay Loam'],
    recommendedRegions: ['Temperate', 'Subtropical'],
    benefits: ['Protein rich', 'Oil production'],
    challenges: ['Disease susceptibility', 'Weather sensitivity'],
    optimalWeather: {
      temperature: { min: 18, max: 28 },
      humidity: { min: 60, max: 80 },
      rainfall: { min: 600, max: 1000 }
    },
    nutrientRequirements: {
      nitrogen: 'Low', // Fixes nitrogen in soil
      phosphorus: 'Medium',
      potassium: 'Medium'
    },
    climateResilience: {
      droughtTolerance: 'medium',
      floodTolerance: 'medium',
      heatTolerance: 'medium',
      coldTolerance: 'medium'
    },
    adaptiveTechniques: [
      'Use drought-tolerant soybean varieties',
      'Implement conservation tillage practices',
      'Create proper drainage systems',
      'Apply reflective mulch to reduce heat stress',
      'Practice relay cropping to optimize land use',
      'Use inoculants to enhance nitrogen fixation',
      'Implement controlled traffic farming to reduce soil compaction',
      'Apply gypsum to improve soil structure in acidic soils'
    ]
  }
};

// Season mapping
const seasonMapping: Record<Season, { name: string; months: number[] }> = {
  spring: { name: 'Spring', months: [2, 3, 4] },
  summer: { name: 'Summer', months: [5, 6, 7] },
  monsoon: { name: 'Monsoon', months: [6, 7, 8, 9] },
  autumn: { name: 'Autumn', months: [9, 10, 11] },
  winter: { name: 'Winter', months: [11, 12, 1] }
};

// Mock weather data for different regions
const mockWeatherData: Record<string, WeatherData> = {
  'Hyderabad, Telangana': {
    temperature: { min: 22, max: 35, avg: 28 },
    humidity: 65,
    rainfall: 800,
    windSpeed: 12,
    sunlightHours: 8.5
  },
  'Delhi, India': {
    temperature: { min: 15, max: 30, avg: 22 },
    humidity: 55,
    rainfall: 600,
    windSpeed: 10,
    sunlightHours: 9.2
  },
  'Mumbai, Maharashtra': {
    temperature: { min: 24, max: 32, avg: 28 },
    humidity: 75,
    rainfall: 2200,
    windSpeed: 15,
    sunlightHours: 7.8
  }
};

// Mock soil data for different regions
const mockSoilData: Record<string, SoilData> = {
  'Hyderabad, Telangana': {
    type: 'Red Sandy Loam',
    pH: 7.2,
    nutrients: {
      nitrogen: 'Medium',
      phosphorus: 'Low',
      potassium: 'Medium'
    },
    moisture: 45
  },
  'Delhi, India': {
    type: 'Alluvial',
    pH: 7.5,
    nutrients: {
      nitrogen: 'High',
      phosphorus: 'Medium',
      potassium: 'Low'
    },
    moisture: 35
  },
  'Mumbai, Maharashtra': {
    type: 'Laterite',
    pH: 6.8,
    nutrients: {
      nitrogen: 'Low',
      phosphorus: 'Medium',
      potassium: 'High'
    },
    moisture: 65
  }
};

export default function CropPlanningPage() {
  const { t } = useI18n();
  const [selectedCrop, setSelectedCrop] = useState<CropType>('tomato');
  const [selectedSeason, setSelectedSeason] = useState<Season>('spring');
  const [userLocation, setUserLocation] = useState<string>('Hyderabad, Telangana');
  const [recommendations, setRecommendations] = useState<SeasonalRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [customLocation, setCustomLocation] = useState<string>('');
  const [useCustomLocation, setUseCustomLocation] = useState<boolean>(false);

  // Simulate loading data
  useEffect(() => {
    setLoading(true);
    // Simulate API call delay
    const timer = setTimeout(() => {
      generateRecommendations();
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [selectedCrop, selectedSeason, userLocation]);

  const calculateSuitability = (crop: CropType, location: string): { weather: number; soil: number; overall: number } => {
    const cropData = cropDatabase[crop];
    const weatherData = mockWeatherData[location] || mockWeatherData['Hyderabad, Telangana'];
    const soilData = mockSoilData[location] || mockSoilData['Hyderabad, Telangana'];
    
    // Calculate weather suitability (0-100)
    let weatherScore = 100;
    
    // Temperature factor
    const tempFactor = Math.min(100, Math.max(0, 
      100 - Math.abs(weatherData.temperature.avg - 
        (cropData.optimalWeather.temperature.min + cropData.optimalWeather.temperature.max) / 2) * 3));
    
    // Humidity factor
    const humidityFactor = Math.min(100, Math.max(0, 
      100 - Math.abs(weatherData.humidity - 
        (cropData.optimalWeather.humidity.min + cropData.optimalWeather.humidity.max) / 2) * 1.5));
    
    // Rainfall factor
    const rainfallFactor = Math.min(100, Math.max(0, 
      100 - Math.abs(weatherData.rainfall - 
        (cropData.optimalWeather.rainfall.min + cropData.optimalWeather.rainfall.max) / 2) * 0.05));
    
    weatherScore = (tempFactor + humidityFactor + rainfallFactor) / 3;
    
    // Calculate soil suitability (0-100)
    let soilScore = 100;
    
    // Soil type match
    const soilTypeMatch = cropData.soilType.includes(soilData.type) ? 100 : 50;
    
    // pH factor (optimal range 6.0-7.5)
    const pHFactor = Math.min(100, Math.max(0, 100 - Math.abs(soilData.pH - 6.75) * 20));
    
    // Nutrient match
    const nutrientMatch = 
      (cropData.nutrientRequirements.nitrogen === soilData.nutrients.nitrogen ? 100 : 50) * 0.33 +
      (cropData.nutrientRequirements.phosphorus === soilData.nutrients.phosphorus ? 100 : 50) * 0.33 +
      (cropData.nutrientRequirements.potassium === soilData.nutrients.potassium ? 100 : 50) * 0.34;
    
    soilScore = (soilTypeMatch + pHFactor + nutrientMatch) / 3;
    
    // Overall suitability
    const overallScore = (weatherScore * 0.6 + soilScore * 0.4);
    
    return {
      weather: Math.round(weatherScore),
      soil: Math.round(soilScore),
      overall: Math.round(overallScore)
    };
  };

  const generateRecommendations = () => {
    const cropData = cropDatabase[selectedCrop];
    const recommendations: SeasonalRecommendation[] = [];
    
    // Get suitability scores
    const suitability = calculateSuitability(selectedCrop, userLocation);
    
    // Generate recommendations for the next 3 planting seasons
    for (let i = 0; i < 3; i++) {
      const plantingDate = new Date();
      plantingDate.setMonth(plantingDate.getMonth() + (i * 4)); // Every 4 months
      
      // Adjust to the best planting window for the selected season
      const seasonMonths = seasonMapping[selectedSeason].months;
      if (!seasonMonths.includes(plantingDate.getMonth() + 1)) {
        // Find the closest month in the season
        const closestMonth = seasonMonths.reduce((prev, curr) => 
          Math.abs(curr - (plantingDate.getMonth() + 1)) < Math.abs(prev - (plantingDate.getMonth() + 1)) ? curr : prev
        );
        plantingDate.setMonth(closestMonth - 1);
      }
      
      const harvestDate = new Date(plantingDate);
      harvestDate.setDate(harvestDate.getDate() + cropData.growthDuration);
      
      // Generate crop-specific care instructions
      const careInstructions = generateCareInstructions(selectedCrop, userLocation);
      
      recommendations.push({
        crop: selectedCrop,
        name: cropData.name,
        bestPlantingWindow: {
          start: plantingDate,
          end: addDays(plantingDate, 14)
        },
        expectedHarvest: harvestDate,
        expectedYield: `${Math.floor(8 + Math.random() * 7)} tons/hectare`,
        careInstructions,
        riskFactors: generateRiskFactors(selectedCrop, userLocation, suitability),
        weatherSuitability: suitability.weather,
        soilSuitability: suitability.soil,
        overallSuitability: suitability.overall,
        climateAdaptation: {
          droughtTolerance: cropData.climateResilience.droughtTolerance,
          floodTolerance: cropData.climateResilience.floodTolerance,
          heatTolerance: cropData.climateResilience.heatTolerance
        },
        climateRecommendations: generateClimateRecommendations(selectedCrop, userLocation)
      });
    }
    
    setRecommendations(recommendations);
  };

  const generateCareInstructions = (crop: CropType, location: string): string[] => {
    const weatherData = mockWeatherData[location] || mockWeatherData['Hyderabad, Telangana'];
    const soilData = mockSoilData[location] || mockSoilData['Hyderabad, Telangana'];
    const cropData = cropDatabase[crop];
    
    const instructions = [
      t('Prepare soil with organic compost and ensure proper drainage'),
      t('Monitor weather conditions and adjust irrigation accordingly'),
      `${t('Based on soil pH')} (${soilData.pH}), ${t('apply lime if acidic or sulfur if alkaline')}`,
      `${t('Apply')} ${cropData.nutrientRequirements.nitrogen} ${t('nitrogen fertilizers as per crop requirements')}`
    ];
    
    // Add weather-specific instructions
    if (weatherData.temperature.avg > cropData.optimalWeather.temperature.max) {
      instructions.push(t('Provide shade during peak heat hours'));
    }
    
    if (weatherData.humidity > cropData.optimalWeather.humidity.max) {
      instructions.push(t('Improve air circulation to prevent fungal diseases'));
    }
    
    if (weatherData.rainfall < cropData.optimalWeather.rainfall.min) {
      instructions.push(t('Implement drip irrigation for efficient water use'));
    }
    
    instructions.push(t('Monitor for pests and diseases regularly'));
    instructions.push(t('Apply fertilizers as per growth stage'));
    
    return instructions;
  };

  const generateRiskFactors = (crop: CropType, location: string, suitability: { weather: number; soil: number; overall: number }): string[] => {
    const risks = [];
    
    if (suitability.weather < 60) {
      risks.push(t('Suboptimal weather conditions for this crop'));
    }
    
    if (suitability.soil < 60) {
      risks.push(t('Soil conditions may not be ideal for this crop'));
    }
    
    if (suitability.overall < 70) {
      risks.push(t('Consider alternative crops for better yield'));
    }
    
    risks.push(t('Weather variations and extreme conditions'));
    risks.push(t('Pest infestations and disease outbreaks'));
    risks.push(t('Market price fluctuations'));
    
    return risks;
  };

  const generateClimateRecommendations = (crop: CropType, location: string): string[] => {
    const cropData = cropDatabase[crop];
    const weatherData = mockWeatherData[location] || mockWeatherData['Hyderabad, Telangana'];
    const soilData = mockSoilData[location] || mockSoilData['Hyderabad, Telangana'];
    
    const recommendations = [];
    
    // Drought recommendations
    if (cropData.climateResilience.droughtTolerance === 'low') {
      recommendations.push(t('This crop has low drought tolerance. Consider implementing water conservation techniques like drip irrigation or mulching.'));
    } else if (cropData.climateResilience.droughtTolerance === 'medium') {
      recommendations.push(t('This crop has medium drought tolerance. Use water-efficient irrigation methods and monitor soil moisture regularly.'));
    } else {
      recommendations.push(t('This crop has high drought tolerance. Still, monitor water stress during extended dry periods.'));
    }
    
    // Flood recommendations
    if (cropData.climateResilience.floodTolerance === 'low') {
      recommendations.push(t('This crop has low flood tolerance. Plant in raised beds and ensure proper drainage to prevent waterlogging.'));
      recommendations.push(t('Consider installing French drains or contour farming to redirect excess water.'));
    } else if (cropData.climateResilience.floodTolerance === 'medium') {
      recommendations.push(t('This crop has medium flood tolerance. Ensure adequate drainage and avoid overwatering during heavy rainfall.'));
      recommendations.push(t('Implement controlled flooding techniques and maintain proper field grading.'));
    } else {
      recommendations.push(t('This crop has high flood tolerance. Still, ensure proper drainage to prevent root diseases.'));
      recommendations.push(t('Use flood-tolerant varieties and implement water management practices.'));
    }
    
    // Heat stress recommendations
    if (cropData.climateResilience.heatTolerance === 'low' && weatherData.temperature.max > cropData.optimalWeather.temperature.max) {
      recommendations.push(t('This crop has low heat tolerance and current temperatures exceed optimal range. Consider providing shade or using reflective mulch.'));
      recommendations.push(t('Apply anti-transpirants and increase irrigation frequency during heat waves.'));
    } else if (cropData.climateResilience.heatTolerance === 'medium' && weatherData.temperature.max > cropData.optimalWeather.temperature.max + 2) {
      recommendations.push(t('This crop has medium heat tolerance. Monitor for heat stress symptoms during peak temperature periods.'));
      recommendations.push(t('Use evaporative cooling techniques and apply potassium-rich fertilizers to improve heat tolerance.'));
    } else if (cropData.climateResilience.heatTolerance === 'high') {
      recommendations.push(t('This crop has high heat tolerance. Still, ensure adequate watering during extreme heat events.'));
      recommendations.push(t('Maintain soil moisture and consider foliar applications of seaweed extract for additional heat protection.'));
    }
    
    // General climate adaptation strategies
    recommendations.push(t('Implement crop rotation with climate-resilient varieties to improve soil health.'));
    recommendations.push(t('Use cover crops to protect soil from erosion and retain moisture.'));
    recommendations.push(t('Install windbreaks to reduce heat and wind stress on crops.'));
    
    // Add crop-specific adaptive techniques
    cropData.adaptiveTechniques.forEach(technique => {
      recommendations.push(t(technique));
    });
    
    return recommendations;
  };

  const getCropOptions = () => {
    return Object.entries(cropDatabase).map(([key, crop]) => (
      <SelectItem key={key} value={key}>
        {t(crop.name)}
      </SelectItem>
    ));
  };

  const getSeasonOptions = () => {
    return Object.entries(seasonMapping).map(([key, season]) => (
      <SelectItem key={key} value={key}>
        {t(season.name)}
      </SelectItem>
    ));
  };

  const handleLocationChange = () => {
    if (useCustomLocation && customLocation.trim()) {
      setUserLocation(customLocation.trim());
    }
  };

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('Advanced Crop Planning Assistant')}</h1>
        <p className="text-muted-foreground">
          {t('Get personalized crop planning recommendations based on weather, soil data, location, season and crop type')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5" />
            {t('Advanced Planning Parameters')}
          </CardTitle>
          <CardDescription>
            {t('Select your crop, season, and location for personalized recommendations')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('Select Crop')}</label>
              <Select value={selectedCrop} onValueChange={(value: CropType) => setSelectedCrop(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select a crop")} />
                </SelectTrigger>
                <SelectContent>
                  {getCropOptions()}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">{t('Select Season')}</label>
              <Select value={selectedSeason} onValueChange={(value: Season) => setSelectedSeason(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select a season")} />
                </SelectTrigger>
                <SelectContent>
                  {getSeasonOptions()}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">{t('Location Options')}</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="useCustom" 
                    checked={useCustomLocation}
                    onChange={(e) => setUseCustomLocation(e.target.checked)}
                  />
                  <label htmlFor="useCustom" className="text-sm">{t('Use custom location')}</label>
                </div>
                
                {useCustomLocation ? (
                  <div className="flex gap-2">
                    <Input 
                      placeholder={t("Enter your location")}
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                    />
                    <Button onClick={handleLocationChange} size="sm">{t('Set')}</Button>
                  </div>
                ) : (
                  <Select value={userLocation} onValueChange={setUserLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select a location")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hyderabad, Telangana">Hyderabad, Telangana</SelectItem>
                      <SelectItem value="Delhi, India">Delhi, India</SelectItem>
                      <SelectItem value="Mumbai, Maharashtra">Mumbai, Maharashtra</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
          
          {/* Display current weather and soil data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4" />
                {t('Current Weather Data')}
              </h3>
              {(() => {
                const weatherData = mockWeatherData[userLocation] || mockWeatherData['Hyderabad, Telangana'];
                return (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Thermometer className="h-3 w-3" />
                      <span>{t('Temperature')}: {weatherData.temperature.avg}°C</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      <span>{t('Humidity')}: {weatherData.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{t('Rainfall')}: {weatherData.rainfall}mm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="h-3 w-3" />
                      <span>{t('Wind Speed')}: {weatherData.windSpeed}km/h</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div>
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Sprout className="h-4 w-4" />
                {t('Current Soil Data')}
              </h3>
              {(() => {
                const soilData = mockSoilData[userLocation] || mockSoilData['Hyderabad, Telangana'];
                return (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <span>{t('Soil Type')}: {soilData.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>pH: {soilData.pH}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{t('Nitrogen')}: {soilData.nutrients.nitrogen}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{t('Phosphorus')}: {soilData.nutrients.phosphorus}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{t('Potassium')}: {soilData.nutrients.potassium}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{t('Moisture')}: {soilData.moisture}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Skeleton className="h-20 flex-1" />
                  <Skeleton className="h-20 flex-1" />
                  <Skeleton className="h-20 flex-1" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{t('Advanced Seasonal Recommendations')}</h2>
            <p className="text-muted-foreground">
              {t('Based on comprehensive analysis of weather, soil, location, season and crop type')}
            </p>
          </div>
          
          {recommendations.map((rec, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sprout className="h-5 w-5" />
                      {t('{{cropName}} Planting Schedule').replace('{{cropName}}', rec.name)}
                    </CardTitle>
                    <CardDescription>
                      {t('Recommendation {{index}}').replace('{{index}}', (index + 1).toString())}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Badge variant="secondary">
                      {t('Expected Yield: {{yield}}').replace('{{yield}}', rec.expectedYield)}
                    </Badge>
                    <Badge variant={rec.overallSuitability > 80 ? "default" : rec.overallSuitability > 60 ? "secondary" : "destructive"}>
                      {t('Suitability')}: {rec.overallSuitability}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('Planting Window')}</p>
                      <p className="font-medium">{format(rec.bestPlantingWindow.start, 'MMM dd')} - {format(rec.bestPlantingWindow.end, 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('Expected Harvest')}</p>
                      <p className="font-medium">{format(rec.expectedHarvest, 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Droplets className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('Water Requirement')}</p>
                      <p className="font-medium">{t(cropDatabase[rec.crop].waterRequirement)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      {t('Drought Tolerance')}
                    </h4>
                    <Badge variant={rec.climateAdaptation.droughtTolerance === 'high' ? 'default' : rec.climateAdaptation.droughtTolerance === 'medium' ? 'secondary' : 'destructive'}>
                      {t(rec.climateAdaptation.droughtTolerance)}
                    </Badge>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      {t('Flood Tolerance')}
                    </h4>
                    <Badge variant={rec.climateAdaptation.floodTolerance === 'high' ? 'default' : rec.climateAdaptation.floodTolerance === 'medium' ? 'secondary' : 'destructive'}>
                      {t(rec.climateAdaptation.floodTolerance)}
                    </Badge>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      {t('Heat Tolerance')}
                    </h4>
                    <Badge variant={rec.climateAdaptation.heatTolerance === 'high' ? 'default' : rec.climateAdaptation.heatTolerance === 'medium' ? 'secondary' : 'destructive'}>
                      {t(rec.climateAdaptation.heatTolerance)}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      {t('Weather Suitability')}
                    </h4>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${rec.weatherSuitability}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1">{rec.weatherSuitability}%</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Sprout className="h-4 w-4" />
                      {t('Soil Suitability')}
                    </h4>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${rec.soilSuitability}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1">{rec.soilSuitability}%</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Leaf className="h-4 w-4" />
                      {t('Overall Suitability')}
                    </h4>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${rec.overallSuitability}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1">{rec.overallSuitability}%</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">{t('Care Instructions')}</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {rec.careInstructions.map((instruction, i) => (
                      <li key={i} className="text-sm">{instruction}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">{t('Risk Factors')}</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {rec.riskFactors.map((risk, i) => (
                      <li key={i} className="text-sm">{risk}</li>
                    ))}
                  </ul>
                </div>
                            
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    {t('Climate Adaptation Recommendations')}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        {t('Drought Management')}
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                        {rec.climateRecommendations
                          .filter(rec => rec.toLowerCase().includes('drought') || rec.toLowerCase().includes('water') || rec.toLowerCase().includes('irrigation') || rec.toLowerCase().includes('mulch'))
                          .slice(0, 3)
                          .map((rec, i) => (
                            <li key={`drought-${i}`} className="text-sm">{rec}</li>
                          ))
                        }
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                        <Cloud className="h-4 w-4 text-blue-500" />
                        {t('Flood Management')}
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                        {rec.climateRecommendations
                          .filter(rec => rec.toLowerCase().includes('flood') || rec.toLowerCase().includes('drainage') || rec.toLowerCase().includes('waterlogging'))
                          .slice(0, 3)
                          .map((rec, i) => (
                            <li key={`flood-${i}`} className="text-sm">{rec}</li>
                          ))
                        }
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        {t('Heat Stress Management')}
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                        {rec.climateRecommendations
                          .filter(rec => rec.toLowerCase().includes('heat') || rec.toLowerCase().includes('shade') || rec.toLowerCase().includes('temperature') || rec.toLowerCase().includes('cooling'))
                          .slice(0, 3)
                          .map((rec, i) => (
                            <li key={`heat-${i}`} className="text-sm">{rec}</li>
                          ))
                        }
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                        <Wind className="h-4 w-4 text-gray-500" />
                        {t('Adaptive Farming Techniques')}
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                        {rec.climateRecommendations
                          .filter(rec => !rec.toLowerCase().includes('drought') && 
                                     !rec.toLowerCase().includes('flood') && 
                                     !rec.toLowerCase().includes('heat') &&
                                     !rec.toLowerCase().includes('water') &&
                                     !rec.toLowerCase().includes('irrigation') &&
                                     !rec.toLowerCase().includes('drainage') &&
                                     !rec.toLowerCase().includes('waterlogging') &&
                                     !rec.toLowerCase().includes('shade') &&
                                     !rec.toLowerCase().includes('temperature') &&
                                     !rec.toLowerCase().includes('cooling') &&
                                     !rec.toLowerCase().includes('mulch'))
                          .slice(0, 4)
                          .map((rec, i) => (
                            <li key={`adaptive-${i}`} className="text-sm">{rec}</li>
                          ))
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}