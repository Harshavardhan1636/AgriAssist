
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
  forecastSummary: z.string().describe("A summary of the upcoming weather forecast (e.g., 'High humidity and rain expected')."),
  soilType: z.string().describe("The soil type of the farm (e.g., 'Loam', 'Clay').")
});
export type GenerateRecommendationsInput = z.infer<typeof GenerateRecommendationsInputSchema>;

const GenerateRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
        step: z.number().describe("The step number in the plan."),
        title: z.string().describe("A short, clear title for the recommendation."),
        description: z.string().describe("A simple, detailed explanation of the action to take and why it's important, considering the specific weather and soil conditions."),
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
  prompt: `You are an ethical agricultural advisor creating a recommendation plan for a farmer in India. Your advice must be hyper-personalized based on all available data.

  IMPORTANT: All output text MUST be in the language with the code: {{{language}}}.

  ANALYSIS DATA:
  - Disease: {{{disease}}}
  - Severity: {{{severity}}}
  - Crop: {{{cropType}}}
  - Soil Type: {{{soilType}}}
  - Weather Forecast: {{{forecastSummary}}}

  TASK:
  Generate a list of clear, step-by-step recommendations. For each recommendation, explicitly mention HOW it relates to the provided soil and weather data.

  ETHICAL GUARDRAILS:
  1.  **Start with Organic/Cultural Methods:** Always suggest non-chemical solutions first, especially if severity is not 'High'. These should be the initial steps.
  2.  **Responsible Chemical Use:** Only if the severity is 'High', you may suggest a common, government-approved pesticide as a *later* step. Emphasize safety precautions.
  3.  **Contextualize with Data:** Explain *why* a step is important in the context of the forecast or soil. For example: "Because rain is forecasted and you have clay soil, it's vital to check field drainage to prevent waterlogging, which helps blight spread." or "With high humidity expected, prune lower leaves to improve airflow."
  4.  **Include Preventive Actions:** Add recommendations for future prevention.
  5.  **Simplicity & Clarity:** Write in simple language. Provide 3-5 actionable steps.

  Format the output as a JSON object with a "recommendations" array, where each item is an object with "step", "title", "description" (including the 'why' connected to data), and "type".
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


