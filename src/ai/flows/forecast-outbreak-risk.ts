
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
    .describe('Historical detection counts in the last 14 days.'),
  weatherFeatures: z
    .object({
      temperature: z.number(),
      humidity: z.number(),
      rainfall: z.number(),
    })
    .describe('Local weather features (14-day average).'),
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
  explanation: z.string().describe('A detailed explanation of the factors contributing to the risk score, including how weather impacts the specific disease on the specific crop.'),
  preventiveActions: z
    .array(z.string())
    .describe('A list of clear, actionable preventive actions to mitigate the outbreak risk based on the forecast.'),
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
  - Crop Type: {{{cropType}}}
  - 14-Day Avg Weather: Temperature={{{weatherFeatures.temperature}}}°C, Humidity={{{weatherFeatures.humidity}}}%, Rainfall={{{weatherFeatures.rainfall}}}mm
  - Soil Type: {{{soilType}}}
  - Historical Detections (last 14 days): {{{historicalDetections}}}

  Your Task:
  1.  **Calculate a Risk Score:** Provide a risk score between 0 and 1, representing the probability of a significant outbreak in the next 7-14 days.
  2.  **Provide a Detailed Explanation:** Explain the "why" behind the score. Mention how the forecasted weather (humidity, temperature) specifically favors or disfavors the growth and spread of the identified '{{{disease}}}' on '{{{cropType}}}'.
  3.  **Suggest Preventive Actions:** Provide a list of 3-4 clear, simple, and actionable steps the farmer can take *before* the outbreak gets worse, based on the forecast. Prioritize cultural and organic methods.

  Example Preventive Actions:
  - "With rain expected, ensure good field drainage to avoid waterlogging, which helps spread blight."
  - "Improve air circulation by pruning lower leaves, as high humidity is forecasted."
  - "Avoid overhead watering in the evenings to keep leaves dry overnight."
  - "Proactively spray with a Neem oil solution before the forecasted rain."
  - "Monitor fields daily, especially after the rain stops."
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

    