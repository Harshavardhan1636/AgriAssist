'use server';

/**
 * @fileOverview Classifies plant diseases from an image and provides a diagnosis with confidence levels.
 *
 * - classifyPlantDisease - A function that handles the plant disease classification process.
 * - ClassifyPlantDiseaseInput - The input type for the classifyPlantDisease function.
 * - ClassifyPlantDiseaseOutput - The return type for the classifyPlantDisease function.
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
        // Instead of throwing an error, throw a specific error that can be caught and handled
        console.log('[INFO] Circuit breaker is OPEN for classifyPlantDisease');
        throw new Error('Service temporarily unavailable due to high demand. Please try again in a moment.');
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
      console.log(`[INFO] Circuit breaker opened for classifyPlantDisease. Will retry at ${new Date(this.nextAttempt).toLocaleTimeString()}`);
    }
  }
}

const ClassifyPlantDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().optional().describe('The language for the output, as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});
export type ClassifyPlantDiseaseInput = z.infer<typeof ClassifyPlantDiseaseInputSchema>;

const ClassifyPlantDiseaseOutputSchema = z.object({
  predictions: z.array(
    z.object({
      label: z.string().describe('The predicted disease label.'),
      confidence: z.number().describe('The confidence level of the prediction (0-1).'),
    })
  ).describe('A list of predicted diseases with confidence levels.'),
});
export type ClassifyPlantDiseaseOutput = z.infer<typeof ClassifyPlantDiseaseOutputSchema>;

export async function classifyPlantDisease(input: ClassifyPlantDiseaseInput): Promise<ClassifyPlantDiseaseOutput> {
  return classifyPlantDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyPlantDiseasePrompt',
  input: {schema: ClassifyPlantDiseaseInputSchema},
  output: {schema: ClassifyPlantDiseaseOutputSchema},
  prompt: `You are an expert in plant pathology. Given an image of a plant, identify potential diseases and provide a confidence level for each prediction.

  Analyze the following image and provide a list of potential diseases with confidence levels.

  IMPORTANT: All output labels MUST be in the language with the code: {{{language}}}.

  Image: {{media url=photoDataUri}}

  Format your response as a JSON object with a 'predictions' field. The 'predictions' field should be an array of objects, where each object has a 'label' field (the disease name) and a 'confidence' field (a number between 0 and 1 indicating the confidence level).`,
});

const classifyPlantDiseaseFlow = ai.defineFlow(
  {
    name: 'classifyPlantDiseaseFlow',
    inputSchema: ClassifyPlantDiseaseInputSchema,
    outputSchema: ClassifyPlantDiseaseOutputSchema,
  },
  async (input: ClassifyPlantDiseaseInput) => {
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
            console.log(`Gemini API overloaded in classifyPlantDisease, retrying in ${waitTime}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            delay *= 2; // Exponential backoff
          } else {
            console.error('[ERROR] Classify plant disease failed after all retries');
            throw new Error('Failed to classify plant disease after multiple retries due to API overload');
          }
        } else {
          // For other errors
          console.error('[ERROR] Unexpected error in classifyPlantDisease:', error);
          throw error;
        }
      }
    }
    throw new Error('Failed to classify plant disease after multiple retries');
  }
);
