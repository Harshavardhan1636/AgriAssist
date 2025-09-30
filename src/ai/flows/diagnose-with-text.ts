'use server';

/**
 * @fileOverview Diagnoses plant diseases from a text description.
 *
 * - diagnoseWithText - A function that handles the plant disease diagnosis process from text.
 * - DiagnoseWithTextInput - The input type for the diagnoseWithText function.
 * - DiagnoseWithTextOutput - The return type for the diagnoseWithText function.
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
        console.log('[INFO] Circuit breaker is OPEN for diagnoseWithText');
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
      console.log(`[INFO] Circuit breaker opened for diagnoseWithText. Will retry at ${new Date(this.nextAttempt).toLocaleTimeString()}`);
    }
  }
}

const DiagnoseWithTextInputSchema = z.object({
  query: z
    .string()
    .describe(
      "A farmer's description of the plant's symptoms in their local language."
    ),
  language: z.string().optional().describe('The language for the output, as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});
export type DiagnoseWithTextInput = z.infer<typeof DiagnoseWithTextInputSchema>;

const DiagnoseWithTextOutputSchema = z.object({
  predictions: z.array(
    z.object({
      label: z.string().describe('The predicted disease label.'),
      confidence: z.number().describe('The confidence level of the prediction (0-1).'),
    })
  ).describe('A list of predicted diseases with confidence levels.'),
});
export type DiagnoseWithTextOutput = z.infer<typeof DiagnoseWithTextOutputSchema>;

export async function diagnoseWithText(input: DiagnoseWithTextInput): Promise<DiagnoseWithTextOutput> {
  return diagnoseWithTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseWithTextPrompt',
  input: {schema: DiagnoseWithTextInputSchema},
  output: {schema: DiagnoseWithTextOutputSchema},
  prompt: `You are an expert in plant pathology. A farmer has described a problem with their crop. Based on their description, identify the most likely diseases and provide a confidence level for each prediction.

  IMPORTANT: All output labels MUST be in the language with the code: {{{language}}}. The user's query may be in a different language, but your labels must be in the target language.

  Farmer's Description: "{{{query}}}"

  Format your response as a JSON object with a 'predictions' field. The 'predictions' field should be an array of objects, where each object has a 'label' field (the disease name) and a 'confidence' field (a number between 0 and 1 indicating the confidence level). Provide at least three predictions, even if the confidence is low.
  `,
});

const diagnoseWithTextFlow = ai.defineFlow(
  {
    name: 'diagnoseWithTextFlow',
    inputSchema: DiagnoseWithTextInputSchema,
    outputSchema: DiagnoseWithTextOutputSchema,
  },
  async (input: DiagnoseWithTextInput) => {
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
            console.log(`Gemini API overloaded in diagnoseWithText, retrying in ${waitTime}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            delay *= 2; // Exponential backoff
          } else {
            console.error('[ERROR] Diagnose with text failed after all retries');
            throw new Error('Failed to diagnose with text after multiple retries due to API overload');
          }
        } else {
          // For other errors
          console.error('[ERROR] Unexpected error in diagnoseWithText:', error);
          throw error;
        }
      }
    }
    throw new Error('Failed to diagnose with text after multiple retries');
  }
);