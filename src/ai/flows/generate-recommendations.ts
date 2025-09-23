
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
        description: z.string().describe("A simple, detailed explanation of the action to take and why it's important."),
        type: z.enum(["Organic/Cultural", "Chemical", "Preventive"]).describe("The category of the recommendation (e.g., Organic/Cultural, Chemical, Preventive).")
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
  1.  **Start with Organic/Cultural Methods:** Always suggest non-chemical solutions first. These should be the initial steps, focusing on remedies like neem oil, removing infected leaves, or improving air circulation.
  2.  **Responsible Chemical Use:** Only if the severity is 'High', you may suggest a common, government-approved pesticide as a *later* step. Clearly state that this is for severe cases. Emphasize using the exact recommended dose and all safety precautions (like wearing gloves and a mask).
  3.  **Include Preventive Actions:** Add recommendations for future prevention, such as crop rotation, improving soil health, or using disease-resistant varieties.
  4.  **Be Transparent:** For each step, briefly explain *why* it is being recommended. (e.g., "Remove infected leaves to reduce the source of the fungus.")
  5.  **Simplicity & Clarity:** Write in simple language that is easy for a farmer to understand. Provide 3-5 actionable steps in total.

  Format the output as a JSON object with a "recommendations" array, where each item is an object with "step", "title", "description" (including the 'why'), and "type".
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

