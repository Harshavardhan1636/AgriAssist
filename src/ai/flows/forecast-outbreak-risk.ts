// forecast-outbreak-risk.ts
'use server';

/**
 * @fileOverview A flow for forecasting outbreak risk based on historical data and current detections.
 *
 * - forecastOutbreakRisk - A function that handles the outbreak risk forecasting process.
 * - ForecastOutbreakRiskInput - The input type for the forecastOutbreakRisk function.
 * - ForecastOutbreakRiskOutput - The return type for the forecastOutbreakRisk function.
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
          riskScore: 0,
          explanation: 'Forecast temporarily unavailable due to high demand. Please try again in a moment.',
          preventiveActions: ['Monitor crop health regularly', 'Ensure proper drainage', 'Maintain good air circulation']
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

const ForecastOutbreakRiskInputSchema = z.object({
  disease: z.string().describe('The name of the detected disease.'),
  historicalDetections: z
    .array(z.number())
    .describe('Historical detection counts in the last 14 days.'),
  weatherFeatures: z
    .object({
      temperature: z.number(),
      humidity: z.number(),
      rainfall: z.number(),
    })
    .describe('Local weather features (14-day average).'),
  cropType: z.string().describe('Type of crop.'),
  soilType: z.string().describe('Type of soil.'),
  language: z.string().optional().describe('The language for the output, as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
  // Environmental considerations
  biodiversityImpact: z.string().optional().describe('Biodiversity impact assessment for the farming practices.'),
});
export type ForecastOutbreakRiskInput = z.infer<typeof ForecastOutbreakRiskInputSchema>;

const ForecastOutbreakRiskOutputSchema = z.object({
  riskScore:
    z
      .number()
      .min(0)
      .max(1)
      .describe(
        'The risk score for a potential outbreak, ranging from 0 to 1 (0-100%).'
      ),
  explanation: z.string().describe('A detailed explanation of the factors contributing to the risk score, including how weather and soil type impact the specific disease on the specific crop.'),
  preventiveActions: z
    .array(z.string())
    .describe('A list of clear, actionable preventive actions to mitigate the outbreak risk based on the forecast.'),
  biodiversityImpactAssessment: z.string().optional().describe('Assessment of the impact of preventive actions on local biodiversity.')
});
export type ForecastOutbreakRiskOutput = z.infer<typeof ForecastOutbreakRiskOutputSchema>;

export async function forecastOutbreakRisk(
  input: ForecastOutbreakRiskInput
): Promise<ForecastOutbreakRiskOutput> {
  return forecastOutbreakRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'forecastOutbreakRiskPrompt',
  input: {schema: ForecastOutbreakRiskInputSchema},
  output: {schema: ForecastOutbreakRiskOutputSchema},
  prompt: `You are an expert agricultural advisor forecasting a disease outbreak for a farm in India.

  IMPORTANT: All output text MUST be in the language with the code: {{{language}}}.

  Analysis Details:
  - Detected Disease: {{{disease}}}
  - Crop Type: {{{cropType}}}
  - 14-Day Avg Weather: Temperature={{{weatherFeatures.temperature}}}°C, Humidity={{{weatherFeatures.humidity}}}%, Rainfall={{{weatherFeatures.rainfall}}}mm
  - Soil Type: {{{soilType}}}
  - Historical Detections (last 14 days): {{{historicalDetections}}}
  - Biodiversity Impact: {{{biodiversityImpact}}}

  Your Task:
  1.  **Calculate a Risk Score:** Provide a risk score between 0 and 1, representing the probability of a significant outbreak in the next 7-14 days.
  2.  **Provide a Detailed Explanation:** Explain the "why" behind the score. Mention how the forecasted weather (humidity, temperature) and the specified '{{{soilType}}}' (e.g., clay soil retains moisture, increasing fungal risk) specifically favors or disfavors the growth and spread of the identified '{{{disease}}}' on '{{{cropType}}}'.
  3.  **Suggest Preventive Actions:** Provide a list of 3-4 clear, simple, and actionable steps the farmer can take *before* the outbreak gets worse, based on the forecast and soil type. Prioritize cultural and organic methods.
  4.  **Assess Biodiversity Impact:** Evaluate how the preventive actions will affect local biodiversity, including beneficial insects, soil microorganisms, and wildlife.

  Example Preventive Actions:
  - "With rain expected in your clay soil, ensure good field drainage to avoid waterlogging, which helps spread blight."
  - "Improve air circulation by pruning lower leaves, as high humidity is forecasted."
  - "Avoid overhead watering in the evenings to keep leaves dry overnight."
  - "Proactively spray with a Neem oil solution before the forecasted rain."
  - "Monitor fields daily, especially after the rain stops."

  Example Biodiversity Impact Assessment:
  - "Neem oil is organic and safe for beneficial insects when applied correctly."
  - "Pruning lower leaves may temporarily reduce habitat for ground-dwelling beneficial insects."
  - "Proper drainage will support soil microorganism health by preventing waterlogging."
`,
});

const forecastOutbreakRiskFlow = ai.defineFlow(
  {
    name: 'forecastOutbreakRiskFlow',
    inputSchema: ForecastOutbreakRiskInputSchema,
    outputSchema: ForecastOutbreakRiskOutputSchema,
  },
  async (input: ForecastOutbreakRiskInput) => {
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
            console.log(`Gemini API overloaded in forecastOutbreakRisk, retrying in ${waitTime}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            delay *= 2; // Exponential backoff
          } else {
            console.error('[ERROR] Forecast outbreak risk failed after all retries');
            // ✅ Return a safe, serializable object
            return {
              riskScore: 0,
              explanation: 'Forecast unavailable due to API overload. Please try again later.',
              preventiveActions: ['Monitor crop health regularly', 'Ensure proper drainage', 'Maintain good air circulation']
            };
          }
        } else {
          // For other errors
          console.error('[ERROR] Unexpected error in forecastOutbreakRisk:', error);
          return {
            riskScore: 0,
            explanation: 'Unable to generate forecast',
            preventiveActions: ['Please consult with a local agricultural expert']
          };
        }
      }
    }
    throw new Error('Failed to forecast outbreak risk after multiple retries');
  }
);