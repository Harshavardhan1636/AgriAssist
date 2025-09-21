'use server';

/**
 * @fileOverview Classifies plant diseases from an image and provides a diagnosis with confidence levels.
 *
 * - classifyPlantDisease - A function that handles the plant disease classification process.
 * - ClassifyPlantDiseaseInput - The input type for the classifyPlantDisease function.
 * - ClassifyPlantDiseaseOutput - The return type for the classifyPlantDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyPlantDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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

  Analyze the following image and provide a list of potential diseases with confidence levels:

  Image: {{media url=photoDataUri}}

  Format your response as a JSON object with a 'predictions' field. The 'predictions' field should be an array of objects, where each object has a 'label' field (the disease name) and a 'confidence' field (a number between 0 and 1 indicating the confidence level).`,
});

const classifyPlantDiseaseFlow = ai.defineFlow(
  {
    name: 'classifyPlantDiseaseFlow',
    inputSchema: ClassifyPlantDiseaseInputSchema,
    outputSchema: ClassifyPlantDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
