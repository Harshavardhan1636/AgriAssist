
'use server';

/**
 * @fileOverview Recommends products based on a diagnosed plant disease.
 *
 * - recommendProducts - A function that suggests suitable products.
 * - RecommendProductsInput - The input type for the recommendProducts function.
 * - RecommendProductsOutput - The return type for the recommendProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const RecommendProductsInputSchema = z.object({
  disease: z.string().describe('The name of the diagnosed plant disease.'),
  cropType: z.string().describe('The type of crop affected.'),
  language: z.string().optional().describe('The language for the output, as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});
export type RecommendProductsInput = z.infer<typeof RecommendProductsInputSchema>;


export const RecommendProductsOutputSchema = z.object({
  products: z.array(z.object({
    id: z.string().describe("A unique product ID, e.g., 'prod_001'."),
    name: z.string().describe('The commercial name of the product.'),
    description: z.string().describe('A brief, farmer-friendly description of the product and its use.'),
    price: z.number().describe('The price of the product in INR.'),
    currency: z.literal('INR').describe("The currency, which is always INR."),
    image: z.string().url().describe("A placeholder image URL for the product."),
    imageHint: z.string().describe("A two-word hint for a real image, e.g., 'neem oil'."),
    type: z.enum(['Organic Fungicide', 'Chemical Fungicide', 'Organic Insecticide', 'Bio-stimulant']).describe("The category of the product."),
    isGovtApproved: z.boolean().describe("Whether the product is approved by the government."),
    toxicity: z.enum(['Low', 'Medium', 'High']).optional().describe("The toxicity level, if applicable."),
  })).describe('A list of recommended products, prioritizing organic and safe options.'),
});
export type RecommendProductsOutput = z.infer<typeof RecommendProductsOutputSchema>;

export async function recommendProducts(
  input: RecommendProductsInput
): Promise<RecommendProductsOutput> {
  return recommendProductsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendProductsPrompt',
  input: {schema: RecommendProductsInputSchema},
  output: {schema: RecommendProductsOutputSchema},
  prompt: `You are an ethical agricultural advisor for a farmer in India. Your task is to recommend products to treat a specific plant disease.

  IMPORTANT:
  1.  All output text MUST be in the language with the code: {{{language}}}.
  2.  Prioritize organic and bio-products. Only suggest chemical products if absolutely necessary for severe diseases.
  3.  All suggested products must be ones commonly approved for use in India.
  4.  Provide 3 to 4 product recommendations.
  5.  Generate a unique ID and a placeholder picsum.photos URL for each product image.

  Disease Context:
  - Disease: {{{disease}}}
  - Crop: {{{cropType}}}

  Generate a list of suitable products. For each product, provide all the fields specified in the output schema, including a simple description, type, and government approval status.
  `,
});

const recommendProductsFlow = ai.defineFlow(
  {
    name: 'recommendProductsFlow',
    inputSchema: RecommendProductsInputSchema,
    outputSchema: RecommendProductsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
