
import { config } from 'dotenv';
config();

import '@/ai/flows/assess-disease-severity.ts';
import '@/ai/flows/classify-plant-disease.ts';
import '@/ai/flows/explain-classification-with-grad-cam.ts';
import '@/ai/flows/forecast-outbreak-risk.ts';
import '@/ai/flows/generate-recommendations.ts';
import '@/ai/flows/ask-follow-up-question.ts';
import '@/ai/flows/diagnose-with-text.ts';
import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/recommend-products.ts';
