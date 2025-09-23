
'use server';

/**
 * @fileOverview A flow for answering follow-up questions about a crop analysis.
 *
 * - askFollowUpQuestion - A function that handles the conversational follow-up process.
 * - AskFollowUpQuestionInput - The input type for the askFollowUpQuestion function.
 * - AskFollowUpQuestionOutput - The return type for the askFollowUpQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
