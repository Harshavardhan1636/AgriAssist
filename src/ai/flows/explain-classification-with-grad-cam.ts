'use server';
/**
 * @fileOverview Explains image classification results using Grad-CAM.
 *
 * - explainClassificationWithGradCAM - A function that takes an image and classification result and returns a Grad-CAM overlay.
 * - ExplainClassificationWithGradCAMInput - The input type for the explainClassificationWithGradCAM function.
 * - ExplainClassificationWithGradCAMOutput - The return type for the explainClassificationWithGradCAM function.
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
        console.log('[INFO] Circuit breaker is OPEN for explainClassificationWithGradCAM, returning original image');
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
      console.log(`[INFO] Circuit breaker opened for explainClassificationWithGradCAM. Will retry at ${new Date(this.nextAttempt).toLocaleTimeString()}`);
    }
  }
}

const ExplainClassificationWithGradCAMInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  classificationResult: z.string().describe('The classification result of the image.'),
});
export type ExplainClassificationWithGradCAMInput = z.infer<
  typeof ExplainClassificationWithGradCAMInputSchema
>;

const ExplainClassificationWithGradCAMOutputSchema = z.object({
  gradCAMOverlay: z
    .string()
    .describe(
      'A Grad-CAM overlay image as a data URI that highlights the areas used for classification.'
    ),
});
export type ExplainClassificationWithGradCAMOutput = z.infer<
  typeof ExplainClassificationWithGradCAMOutputSchema
>;

export async function explainClassificationWithGradCAM(
  input: ExplainClassificationWithGradCAMInput
): Promise<ExplainClassificationWithGradCAMOutput> {
  return explainClassificationWithGradCAMFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainClassificationWithGradCAMPrompt',
  input: {schema: ExplainClassificationWithGradCAMInputSchema},
  output: {schema: ExplainClassificationWithGradCAMOutputSchema},
  prompt: `You are an AI assistant that explains image classification results using Grad-CAM.

You will receive a photo of a plant and the classification result. You will generate a Grad-CAM overlay image that highlights the areas of the image that were used to make the classification decision. Return the Grad-CAM overlay as a data URI.

Photo: {{media url=photoDataUri}}
Classification Result: {{{classificationResult}}}`,
});

const explainClassificationWithGradCAMFlow = ai.defineFlow(
  {
    name: 'explainClassificationWithGradCAMFlow',
    inputSchema: ExplainClassificationWithGradCAMInputSchema,
    outputSchema: ExplainClassificationWithGradCAMOutputSchema,
  },
  async (input: ExplainClassificationWithGradCAMInput) => {
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
            console.log(`Gemini API overloaded in explainClassificationWithGradCAM, retrying in ${waitTime}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            delay *= 2; // Exponential backoff
          } else {
            console.error('[ERROR] Explain classification with Grad-CAM failed after all retries');
            throw new Error('Failed to explain classification with Grad-CAM after multiple retries due to API overload');
          }
        } else {
          // For other errors
          console.error('[ERROR] Unexpected error in explainClassificationWithGradCAM:', error);
          throw error;
        }
      }
    }
    throw new Error('Failed to explain classification with Grad-CAM after multiple retries');
  }
);