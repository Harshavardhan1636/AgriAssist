
// forecast-outbreak-risk.ts
'use server';

/**
 * @fileOverview A flow for forecasting outbreak risk based on historical data and current detections.
 *
 * - forecastOutbreakRisk - A function that handles the outbreak risk forecasting process.
 * - ForecastOutbreakRiskInput - The input type for the forecastOutbreakRisk function.
 * - ForecastOutbreakRiskOutput - The return type for the forecastOutbreakRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastOutbreakRiskInputSchema = z.object({
  disease: z.string().describe('The name of the detected disease.'),
  historicalDetections: z
    .array(z.number())
    .describe('Historical detection counts in the last 7 days.'),
  weatherFeatures: z
    .object({
      temperature: z.number(),
      humidity: z.number(),
      rainfall: z.number(),
    })
    .describe('Local weather features (7-day average).'),
  cropType: z.string().describe('Type of crop.'),
  soilType: z.string().describe('Type of soil.'),
  language: z.string().optional().describe('The language for the output, as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});
export type ForecastOutbreakRiskInput = z.infer<typeof ForecastOutbreakRiskInputSchema>;

const ForecastOutbreakRiskOutputSchema = z.object({
  riskScore:
    z
      .number()
      .min(0)
      .max(1)
      .describe(
        'The risk score for a potential outbreak, ranging from 0 to 1 (0-100%).'
      ),
  explanation: z.string().describe('A detailed explanation of the factors contributing to the risk score.'),
  preventiveActions: z
    .array(z.string())
    .describe('A list of preventive actions to mitigate the outbreak risk.'),
});
export type ForecastOutbreakRiskOutput = z.infer<typeof ForecastOutbreakRiskOutputSchema>;

export async function forecastOutbreakRisk(
  input: ForecastOutbreakRiskInput
): Promise<ForecastOutbreakRiskOutput> {
  return forecastOutbreakRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'forecastOutbreakRiskPrompt',
  input: {schema: ForecastOutbreakRiskInputSchema},
  output: {schema: ForecastOutbreakRiskOutputSchema},
  prompt: `You are an expert agricultural advisor forecasting a disease outbreak for a farm in India.

  IMPORTANT: All output text MUST be in the language with the code: {{{language}}}.

  Analysis Details:
  - Detected Disease: {{{disease}}}
  - Historical Detections (last 7 days): {{{historicalDetections}}}
  - 7-Day Avg Weather: Temperature={{{weatherFeatures.temperature}}}°C, Humidity={{{weatherFeatures.humidity}}}%, Rainfall={{{weatherFeatures.rainfall}}}mm
  - Crop Type: {{{cropType}}}
  - Soil Type: {{{soilType}}}

  Your Task:
  1.  **Calculate a Risk Score:** Provide a risk score between 0 and 1, representing the probability of a significant outbreak in the next 7-14 days.
  2.  **Provide a Detailed Explanation:** Explain the "why" behind the score. Mention how the weather, disease type, and crop vulnerability contribute. For example, high humidity is favorable for fungal diseases like Late Blight.
  3.  **Suggest Preventive Actions:** Provide a list of 3-4 clear, simple, and actionable steps the farmer can take *before* the outbreak gets worse. Prioritize cultural and organic methods.

  Example Preventive Actions:
  - "Improve air circulation by pruning lower leaves."
  - "Avoid overhead watering to keep leaves dry."
  - "Proactively spray with a Neem oil solution."
  - "Monitor fields daily, especially in the early morning."
`,
});

const forecastOutbreakRiskFlow = ai.defineFlow(
  {
    name: 'forecastOutbreakRiskFlow',
    inputSchema: ForecastOutbreakRiskInputSchema,
    outputSchema: ForecastOutbreakRiskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
