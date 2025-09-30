'use server';

/**
 * @fileOverview A flow for answering follow-up questions about a crop analysis.
 *
 * - askFollowUpQuestion - A function that handles the conversational follow-up process.
 * - AskFollowUpQuestionInput - The input type for the askFollowUpQuestion function.
 * - AskFollowUpQuestionOutput - The return type for the askFollowUpQuestion function.
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
        console.log('[INFO] Circuit breaker is OPEN for askFollowUpQuestion, returning default response');
        return {
          answer: 'I\'m currently experiencing high demand. Please try asking your question again in a moment, or contact your local agricultural extension office for immediate assistance.'
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
      console.log(`[INFO] Circuit breaker opened for askFollowUpQuestion. Will retry at ${new Date(this.nextAttempt).toLocaleTimeString()}`);
    }
  }
}

const AskFollowUpQuestionInputSchema = z.object({
  analysisContext: z.string().describe("The context of the original analysis, including disease, severity, and risk."),
  question: z.string().describe('The farmer\'s follow-up question.'),
  language: z.string().optional().describe('The language for the output, as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});
export type AskFollowUpQuestionInput = z.infer<typeof AskFollowUpQuestionInputSchema>;

const AskFollowUpQuestionOutputSchema = z.object({
  answer: z.string().describe('A clear, simple answer to the farmer\'s question in their local language context.'),
});
export type AskFollowUpQuestionOutput = z.infer<typeof AskFollowUpQuestionOutputSchema>;

export async function askFollowUpQuestion(
  input: AskFollowUpQuestionInput
): Promise<AskFollowUpQuestionOutput> {
  return askFollowUpQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askFollowUpQuestionPrompt',
  input: {schema: AskFollowUpQuestionInputSchema},
  output: {schema: AskFollowUpQuestionOutputSchema},
  prompt: `You are a friendly and helpful agricultural assistant for a farmer. The farmer has received an analysis and is asking a follow-up question.

  IMPORTANT: Your answer MUST be in the language with the code: {{{language}}}. The user's question may be in a different language, but your answer must be in the target language.

  CONTEXT of the analysis: {{{analysisContext}}}

  FARMER'S QUESTION: {{{question}}}

  Your task is to answer the farmer's question in a simple, clear, and encouraging way. Do not use complex jargon.

  Provide a direct answer to the question based on the context.
  `,
});

const askFollowUpQuestionFlow = ai.defineFlow(
  {
    name: 'askFollowUpQuestionFlow',
    inputSchema: AskFollowUpQuestionInputSchema,
    outputSchema: AskFollowUpQuestionOutputSchema,
  },
  async (input: AskFollowUpQuestionInput) => {
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
            console.log(`Gemini API overloaded in askFollowUpQuestion, retrying in ${waitTime}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            delay *= 2; // Exponential backoff
          } else {
            console.error('[ERROR] Ask follow-up question failed after all retries');
            throw new Error('Failed to answer follow-up question after multiple retries due to API overload');
          }
        } else {
          // For other errors
          console.error('[ERROR] Unexpected error in askFollowUpQuestion:', error);
          throw error;
        }
      }
    }
    throw new Error('Failed to answer follow-up question after multiple retries');
  }
);