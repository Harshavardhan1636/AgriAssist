'use server';

/**
 * @fileOverview A flow for generating ethical, step-by-step recommendations for a plant disease.
 *
 * - generateRecommendations - A function that creates a treatment plan.
 * - GenerateRecommendationsInput - The input type for the generateRecommendations function.
 * - GenerateRecommendationsOutput - The return type for the generateRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Implement Circuit Breaker Pattern
class CircuitBreaker {
  private failureCount: number;
  private threshold: number;
  private timeout: number;
  private state: 'CLOSED' | 'OPEN' | 'HALF-OPEN';
  private nextAttempt: number;

  constructor(threshold = 3, timeout = 10000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
  }

  async call(fn: () => Promise<any>) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        // Instead of throwing an error, return a default response
        console.log('[INFO] Circuit breaker is OPEN, returning default response');
        return {
          recommendations: [
            { step: 1, title: 'Monitor Plant Health', description: 'Regularly check your plants for signs of disease progression.', type: 'Preventive' },
            { step: 2, title: 'Maintain Hygiene', description: 'Remove and destroy any infected plant material to prevent spread.', type: 'Organic/Cultural' },
            { step: 3, title: 'Consult Experts', description: 'If symptoms worsen, contact your local agricultural extension office.', type: 'Preventive' }
          ]
        };
      }
      this.state = 'HALF-OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log(`[INFO] Circuit breaker opened. Will retry at ${new Date(this.nextAttempt).toLocaleTimeString()}`);
    }
  }
}

const GenerateRecommendationsInputSchema = z.object({
  disease: z.string().describe('The name of the diagnosed plant disease.'),
  severity: z.string().describe('The severity of the disease (e.g., Low, Medium, High).'),
  cropType: z.string().describe('The type of crop affected.'),
  language: z.string().optional().describe('The language for the output, as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
  forecastSummary: z.string().describe("A summary of the upcoming weather forecast (e.g., 'High humidity and rain expected')."),
  soilType: z.string().describe("The soil type of the farm (e.g., 'Loam', 'Clay')."),
  // Environmental considerations
  waterConservationNeeds: z.string().optional().describe("Specific water conservation needs based on crop type and local conditions."),
  biodiversityConsiderations: z.string().optional().describe("Biodiversity impact considerations for the farming practices.")
});
export type GenerateRecommendationsInput = z.infer<typeof GenerateRecommendationsInputSchema>;

const GenerateRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
        step: z.number().describe("The step number in the plan."),
        title: z.string().describe("A short, clear title for the recommendation."),
        description: z.string().describe("A simple, detailed explanation of the action to take and why it's important, considering the specific weather and soil conditions."),
        type: z.enum(["Organic/Cultural", "Chemical", "Preventive"]).describe("The category of the recommendation (e.g., Organic/Cultural, Chemical, Preventive).")
    })
  ).describe('A list of clear, step-by-step recommendations for the farmer.'),
});
export type GenerateRecommendationsOutput = z.infer<typeof GenerateRecommendationsOutputSchema>;

export async function generateRecommendations(
  input: GenerateRecommendationsInput
): Promise<GenerateRecommendationsOutput> {
  return generateRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecommendationsPrompt',
  input: {schema: GenerateRecommendationsInputSchema},
  output: {schema: GenerateRecommendationsOutputSchema},
  prompt: `You are an ethical agricultural advisor creating a recommendation plan for a farmer in India. Your advice must be hyper-personalized based on all available data.

  IMPORTANT: All output text MUST be in the language with the code: {{{language}}}.

  ANALYSIS DATA:
  - Disease: {{{disease}}}
  - Severity: {{{severity}}}
  - Crop: {{{cropType}}}
  - Soil Type: {{{soilType}}}
  - Weather Forecast: {{{forecastSummary}}}
  - Water Conservation Needs: {{{waterConservationNeeds}}}
  - Biodiversity Considerations: {{{biodiversityConsiderations}}}

  TASK:
  Generate a list of clear, step-by-step recommendations. For each recommendation, explicitly mention HOW it relates to the provided soil and weather data.

  ETHICAL GUARDRAILS:
  1.  **Start with Organic/Cultural Methods:** Always suggest non-chemical solutions first, especially if severity is not 'High'. These should be the initial steps.
  2.  **Responsible Chemical Use:** Only if the severity is 'High', you may suggest a common, government-approved pesticide as a *later* step. Emphasize safety precautions.
  3.  **Contextualize with Data:** Explain *why* a step is important in the context of the forecast or soil. For example: "Because rain is forecasted and you have clay soil, it's vital to check field drainage to prevent waterlogging, which helps blight spread." or "With high humidity expected, prune lower leaves to improve airflow."
  4.  **Include Preventive Actions:** Add recommendations for future prevention.
  5.  **Water Conservation:** Provide specific water conservation techniques based on the crop type and local conditions.
  6.  **Biodiversity Protection:** Suggest practices that support biodiversity and avoid harm to beneficial insects and wildlife.
  7.  **Simplicity & Clarity:** Write in simple language. Provide 3-5 actionable steps.

  Format the output as a JSON object with a "recommendations" array, where each item is an object with "step", "title", "description" (including the 'why' connected to data), and "type".
  `,
});

const generateRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateRecommendationsFlow',
    inputSchema: GenerateRecommendationsInputSchema,
    outputSchema: GenerateRecommendationsOutputSchema,
  },
  async (input: GenerateRecommendationsInput) => {
    // Add retry logic for Gemini API overload with exponential backoff and jitter
    let retries = 5; // Increase retry attempts
    let delay = 1000; // Start with 1 second delay
    const breaker = new CircuitBreaker(3, 10000); // 3 failures, 10 second timeout

    while (retries > 0) {
      try {
        const {output} = await breaker.call(() => {
          // Add jitter to prevent thundering herd
          const jitteredDelay = delay * (0.5 + Math.random());
          if (jitteredDelay > 1000) {
            return new Promise(resolve => setTimeout(resolve, jitteredDelay)).then(() => prompt(input));
          }
          return prompt(input);
        });
        return output!;
      } catch (error: any) {
        // Check if it's a 503 Service Unavailable error
        if ((error.status === 503 || error.message?.includes('overloaded') || error.message?.includes('503')) && retries > 0) {
          retries--;
          if (retries > 0) {
            const waitTime = delay * (0.5 + Math.random()); // Add jitter
            console.log(`Gemini API overloaded in generateRecommendations, retrying in ${waitTime}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            delay *= 2; // Exponential backoff
          } else {
            console.error('[ERROR] Generate recommendations failed after all retries');
            throw new Error('Failed to generate recommendations after multiple retries due to API overload');
          }
        } else {
          // For other errors
          console.error('[ERROR] Unexpected error in generateRecommendations:', error);
          throw error;
        }
      }
    }
    throw new Error('Failed to generate recommendations after multiple retries');
  }
);