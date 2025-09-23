'use server';

/**
 * @fileOverview A flow for generating ethical, step-by-step recommendations for a plant disease.
 *
 * - generateRecommendations - A function that creates a treatment plan.
 * - GenerateRecommendationsInput - The input type for the generateRecommendations function.
 * - GenerateRecommendationsOutput - The return type for the generateRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecommendationsInputSchema = z.object({
  disease: z.string().describe('The name of the diagnosed plant disease.'),
  severity: z.string().describe('The severity of the disease (e.g., Low, Medium, High).'),
  cropType: z.string().describe('The type of crop affected.'),
});
export type GenerateRecommendationsInput = z.infer<typeof GenerateRecommendationsInputSchema>;

const GenerateRecommendationsOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of clear, step-by-step recommendations for the farmer.'),
});
export type GenerateRecommendationsOutput = z.infer<typeof GenerateRecommendationsOutputSchema>;

export async function generateRecommendations(
  input: GenerateRecommendationsInput
): Promise<GenerateRecommendationsOutput> {
  return generateRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecommendationsPrompt',
  input: {schema: GenerateRecommendationsInputSchema},
  output: {schema: GenerateRecommendationsOutputSchema},
  prompt: `You are an ethical agricultural advisor creating a recommendation plan for a farmer in India.

  Disease: {{{disease}}}
  Severity: {{{severity}}}
  Crop: {{{cropType}}}

  Generate a list of clear, step-by-step recommendations. Follow these ethical guardrails:
  1.  **Prioritize Organic/Cultural Methods:** Always suggest non-chemical solutions first (e.g., removing infected leaves, improving air circulation, using neem oil).
  2.  **Responsible Chemical Use:** If the severity is High, you may suggest a government-approved pesticide as a later step. Emphasize using the exact recommended dose and following safety precautions.
  3.  **Simplicity:** Write in simple language that is easy for a farmer to understand. Avoid jargon.
  4.  **Actionable Steps:** Each recommendation should be a clear, actionable instruction.

  Format the output as a JSON object with a "recommendations" array.
  `,
});

const generateRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateRecommendationsFlow',
    inputSchema: GenerateRecommendationsInputSchema,
    outputSchema: GenerateRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
