
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
  recentSeverityAverages: z.number().describe('Recent severity averages.'),
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
  explanation: z.string().describe('Explanation of the risk score.'),
  recommendations: z
    .array(z.string())
    .describe('A list of recommendations to mitigate the outbreak risk.'),
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
  prompt: `You are an expert agricultural advisor. You will receive data about recent disease detections, weather patterns, and farm characteristics to forecast potential disease outbreaks.

  IMPORTANT: All output text MUST be in the language with the code: {{{language}}}.

  Historical Detections: {{{historicalDetections}}}
  Weather Features: Temperature={{{weatherFeatures.temperature}}}, Humidity={{{weatherFeatures.humidity}}}, Rainfall={{{weatherFeatures.rainfall}}}
  Crop Type: {{{cropType}}}
  Soil Type: {{{soilType}}}
  Recent Severity Averages: {{{recentSeverityAverages}}}

  Based on this data, provide a risk score between 0 and 1, an explanation for your assessment, and a list of recommendations to mitigate the outbreak risk.  The risk score should be between 0 and 1, representing the probability of an outbreak.

  Consider factors such as favorable weather conditions for disease spread, the vulnerability of the crop type, and the impact of soil conditions.

  Provide specific and actionable recommendations tailored to the situation.
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
