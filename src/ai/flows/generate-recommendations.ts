
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
  language: z.string().optional().describe('The language for the output, as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});
export type GenerateRecommendationsInput = z.infer<typeof GenerateRecommendationsInputSchema>;

const GenerateRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
        step: z.number().describe("The step number in the plan."),
        title: z.string().describe("A short, clear title for the recommendation."),
        description: z.string().describe("A simple, detailed explanation of the action to take."),
        type: z.enum(["Organic/Cultural", "Chemical", "Preventive"]).describe("The type of recommendation.")
    })
  ).describe('A list of clear, step-by-step recommendations for the farmer.'),
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

  IMPORTANT: All output text MUST be in the language with the code: {{{language}}}.

  Disease: {{{disease}}}
  Severity: {{{severity}}}
  Crop: {{{cropType}}}

  Generate a list of clear, step-by-step recommendations. Follow these ethical guardrails:
  1.  **Prioritize Organic/Cultural Methods:** Always suggest non-chemical solutions first (e.g., removing infected leaves, improving air circulation, using neem oil). These should be the first steps.
  2.  **Responsible Chemical Use:** If and only if the severity is 'High', you may suggest a common, government-approved pesticide as a *later* step. Emphasize using the exact recommended dose and following all safety precautions (like wearing gloves and a mask).
  3.  **Simplicity:** Write in simple language that is easy for a farmer to understand. Avoid jargon.
  4.  **Actionable Steps:** Each recommendation should be a clear, actionable instruction with a title and a simple description.
  5.  **Structure:** Provide 3-5 steps.

  Format the output as a JSON object with a "recommendations" array, where each item in the array is an object with "step", "title", "description", and "type".
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
