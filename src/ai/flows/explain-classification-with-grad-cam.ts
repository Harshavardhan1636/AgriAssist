'use server';
/**
 * @fileOverview Explains image classification results using Grad-CAM.
 *
 * - explainClassificationWithGradCAM - A function that takes an image and classification result and returns a Grad-CAM overlay.
 * - ExplainClassificationWithGradCAMInput - The input type for the explainClassificationWithGradCAM function.
 * - ExplainClassificationWithGradCAMOutput - The return type for the explainClassificationWithGradCAM function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
