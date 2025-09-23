
'use server';

/**
 * @fileOverview Diagnoses plant diseases from a text description.
 *
 * - diagnoseWithText - A function that handles the plant disease diagnosis process from text.
 * - DiagnoseWithTextInput - The input type for the diagnoseWithText function.
 * - DiagnoseWithTextOutput - The return type for the diagnoseWithText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
