
'use server';

/**
 * @fileOverview An AI agent for assessing the severity of a plant disease based on an image.
 *
 * - assessDiseaseSeverity - A function that handles the disease severity assessment process.
 * - AssessDiseaseSeverityInput - The input type for the assessDiseaseSeverity function.
 * - AssessDiseaseSeverityOutput - The return type for the assessDiseaseSeverity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
