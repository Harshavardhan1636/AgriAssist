/**
 * Translation utilities for dynamic content in AgriAssist
 * Handles translation of AI-generated content and dynamic data
 */

import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import te from '@/locales/te.json';
import ta from '@/locales/ta.json';
import ml from '@/locales/ml.json';

// Ensure all translation files are properly loaded
const translations: Record<string, any> = { en, hi, te, ta, ml };

// Validate that all translation files have content
Object.keys(translations).forEach(locale => {
  if (!translations[locale] || Object.keys(translations[locale]).length === 0) {
    console.warn(`Translation file for locale '${locale}' is empty or missing`);
  }
});

/**
 * Attempts to translate a disease name or other dynamic content
 * First checks if there's a direct translation, otherwise returns the original text
 */
export const translateDiseaseName = (diseaseName: string, locale: string): string => {
  // Handle empty or invalid inputs
  if (!diseaseName || typeof diseaseName !== 'string' || !locale || typeof locale !== 'string') {
    return diseaseName || '';
  }
  
  // If locale is English or unsupported, return the original name
  if (locale === 'en' || !translations[locale]) {
    return diseaseName;
  }
  
  // Try to find a translation for the disease name
  const localeTranslations = translations[locale];
  const englishTranslations = translations.en;
  
  // Look for the disease name in English translations to find its key
  for (const [key, value] of Object.entries(englishTranslations)) {
    if (typeof value === 'string' && value.toLowerCase() === diseaseName.toLowerCase()) {
      // Found the key, now check if there's a translation in the target locale
      if (localeTranslations[key]) {
        return localeTranslations[key];
      }
    }
  }
  
  // Try partial matching for better translation coverage
  for (const [key, value] of Object.entries(englishTranslations)) {
    if (typeof value === 'string' && diseaseName.toLowerCase().includes(value.toLowerCase())) {
      // Found a partial match, now check if there's a translation in the target locale
      if (localeTranslations[key]) {
        return localeTranslations[key];
      }
    }
  }
  
  // No translation found, return the original name
  return diseaseName;
};

/**
 * Translates recommendation titles and descriptions
 * Tries to match common recommendation patterns and translate them
 */
export const translateRecommendation = (recommendation: any, locale: string): any => {
  // Handle empty or invalid inputs
  if (!recommendation || typeof recommendation !== 'object' || !locale || typeof locale !== 'string') {
    return recommendation || {};
  }
  
  // If locale is English or unsupported, return the original recommendation
  if (locale === 'en' || !translations[locale]) {
    return recommendation;
  }
  
  // Create a copy of the recommendation
  const translatedRecommendation = { ...recommendation };
  
  // Translate title if it exists in our translation files
  if (recommendation.title) {
    translatedRecommendation.title = translateDiseaseName(recommendation.title, locale);
  }
  
  // Translate description if it exists in our translation files
  if (recommendation.description) {
    translatedRecommendation.description = translateDiseaseName(recommendation.description, locale);
  }
  
  // Translate type if it exists in our translation files
  if (recommendation.type) {
    translatedRecommendation.type = translateDiseaseName(recommendation.type, locale);
  }
  
  return translatedRecommendation;
};

/**
 * Translates an array of recommendations
 */
export const translateRecommendations = (recommendations: any[], locale: string): any[] => {
  // Handle empty or invalid inputs
  if (!recommendations || !Array.isArray(recommendations) || !locale || typeof locale !== 'string') {
    return recommendations || [];
  }
  
  return recommendations.map(rec => translateRecommendation(rec, locale));
};

/**
 * Translates severity band values
 */
export const translateSeverityBand = (severityBand: string, locale: string): string => {
  // Handle empty or invalid inputs
  if (!severityBand || typeof severityBand !== 'string' || !locale || typeof locale !== 'string') {
    return severityBand || '';
  }
  
  if (locale === 'en' || !translations[locale]) {
    return severityBand;
  }
  
  const severityMap: Record<string, Record<string, string>> = {
    'Low': {
      'hi': 'कम',
      'te': 'తక్కువ',
      'ta': 'குறைவான',
      'ml': 'കുറഞ്ഞ'
    },
    'Medium': {
      'hi': 'मध्यम',
      'te': 'మధ్యస్థాయి',
      'ta': 'நடுத்தரம்',
      'ml': 'ഇടത്തരം'
    },
    'High': {
      'hi': 'उच्च',
      'te': 'అధిక',
      'ta': 'உயர்',
      'ml': 'ഉയർന്ന'
    },
    'Unknown': {
      'hi': 'अज्ञात',
      'te': 'తెలియదు',
      'ta': 'தெரியவில்லை',
      'ml': 'അജ്ഞാതം'
    }
  };
  
  return severityMap[severityBand]?.[locale] || severityBand;
};

/**
 * Translates risk level values
 */
export const translateRiskLevel = (riskLevel: string, locale: string): string => {
  // Handle empty or invalid inputs
  if (!riskLevel || typeof riskLevel !== 'string' || !locale || typeof locale !== 'string') {
    return riskLevel || '';
  }
  
  if (locale === 'en' || !translations[locale]) {
    return riskLevel;
  }
  
  const riskMap: Record<string, Record<string, string>> = {
    'Low': {
      'hi': 'कम',
      'te': 'తక్కువ',
      'ta': 'குறைவான',
      'ml': 'കുറഞ്ഞ'
    },
    'Medium': {
      'hi': 'मध्यम',
      'te': 'మధ్యస్థాయి',
      'ta': 'நடுத்தரம்',
      'ml': 'ഇടത്തരം'
    },
    'High': {
      'hi': 'उच्च',
      'te': 'అధిక',
      'ta': 'உயர்',
      'ml': 'ഉയർന്ന'
    }
  };
  
  return riskMap[riskLevel]?.[locale] || riskLevel;
};