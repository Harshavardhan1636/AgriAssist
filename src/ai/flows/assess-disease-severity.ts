'use server';

/**
 * @fileOverview An AI agent for assessing the severity of a plant disease based on an image.
 *
 * - assessDiseaseSeverity - A function that handles the disease severity assessment process.
 * - AssessDiseaseSeverityInput - The input type for the assessDiseaseSeverity function.
 * - AssessDiseaseSeverityOutput - The return type for the assessDiseaseSeverity function.
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
        console.log('[INFO] Circuit breaker is OPEN for assessDiseaseSeverity');
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
      console.log(`[INFO] Circuit breaker opened for assessDiseaseSeverity. Will retry at ${new Date(this.nextAttempt).toLocaleTimeString()}`);
    }
  }
}

const AssessDiseaseSeverityInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the plant and its symptoms.'),
  language: z.string().optional().describe('The language for the output, as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});
export type AssessDiseaseSeverityInput = z.infer<typeof AssessDiseaseSeverityInputSchema>;

const AssessDiseaseSeverityOutputSchema = z.object({
  severityPercentage: z
    .number()
    .describe('The estimated severity of the disease as a percentage (0-100).'),
  severityBand: z
    .string()
    .describe(
      'A qualitative description of the severity, such as Low, Medium, or High.'
    ),
  confidence: z
    .number()
    .describe('A confidence score (0-1) indicating the reliability of the assessment.'),
});
export type AssessDiseaseSeverityOutput = z.infer<typeof AssessDiseaseSeverityOutputSchema>;

export async function assessDiseaseSeverity(
  input: AssessDiseaseSeverityInput
): Promise<AssessDiseaseSeverityOutput> {
  return assessDiseaseSeverityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessDiseaseSeverityPrompt',
  input: {schema: AssessDiseaseSeverityInputSchema},
  output: {schema: AssessDiseaseSeverityOutputSchema},
  prompt: `You are an expert in plant pathology, skilled at assessing the severity of plant diseases from images and descriptions.

  Analyze the provided image and description to estimate the severity of the disease. Provide both a percentage representing the severity and a qualitative description (Low, Medium, or High).
  Also, provide a confidence score for your assessment.

  IMPORTANT: All output text MUST be in the language with the code: {{{language}}}.

  Description: {{{description}}}
  Image: {{media url=photoDataUri}}

  Consider factors such as the extent of the affected area, the type of symptoms, and the overall health of the plant.

  Format your response as a JSON object with the following keys:
  - severityPercentage: The estimated severity of the disease as a percentage (0-100).
  - severityBand: A qualitative description of the severity (Low, Medium, or High).
  - confidence: A confidence score (0-1) indicating the reliability of the assessment.
  `,
});

const assessDiseaseSeverityFlow = ai.defineFlow(
  {
    name: 'assessDiseaseSeverityFlow',
    inputSchema: AssessDiseaseSeverityInputSchema,
    outputSchema: AssessDiseaseSeverityOutputSchema,
  },
  async (input: AssessDiseaseSeverityInput) => {
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
            console.log(`Gemini API overloaded in assessDiseaseSeverity, retrying in ${waitTime}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            delay *= 2; // Exponential backoff
          } else {
            console.error('[ERROR] Assess disease severity failed after all retries');
            throw new Error('Failed to assess disease severity after multiple retries due to API overload');
          }
        } else {
          // For other errors
          console.error('[ERROR] Unexpected error in assessDiseaseSeverity:', error);
          throw error;
        }
      }
    }
    throw new Error('Failed to assess disease severity after multiple retries');
  }
);