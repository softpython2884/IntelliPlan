'use server';

/**
 * @fileOverview Evaluates a furniture arrangement and provides feedback on its suitability for the space.
 *
 * - evaluateArrangement - A function that evaluates the furniture arrangement.
 * - EvaluateArrangementInput - The input type for the evaluateArrangement function.
 * - EvaluateArrangementOutput - The return type for the evaluateArrangement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateArrangementInputSchema = z.object({
  roomDimensions: z
    .string()
    .describe('The dimensions of the room in the format WidthxLength.'),
  furnitureArrangementDescription: z
    .string()
    .describe(
      'A detailed description of the furniture arrangement in the room, including the type and placement of each piece of furniture.'
    ),
  userPreferences: z
    .string()
    .optional()
    .describe(
      'Any specific preferences or requirements the user has for the arrangement.'
    ),
});
export type EvaluateArrangementInput = z.infer<
  typeof EvaluateArrangementInputSchema
>;

const EvaluateArrangementOutputSchema = z.object({
  overallAssessment: z
    .string()
    .describe('An overall assessment of the furniture arrangement.'),
  flowFeedback: z
    .string()
    .describe(
      'Feedback on the flow and movement within the room, considering the placement of furniture.'
    ),
  aestheticsFeedback: z
    .string()
    .describe('Feedback on the aesthetic aspects of the arrangement.'),
  functionalityFeedback: z
    .string()
    .describe(
      'Feedback on the functionality of the arrangement, considering how well it meets the user needs.'
    ),
  suggestions: z
    .array(z.string())
    .describe('Specific suggestions for improving the arrangement.'),
});
export type EvaluateArrangementOutput = z.infer<
  typeof EvaluateArrangementOutputSchema
>;

export async function evaluateArrangement(
  input: EvaluateArrangementInput
): Promise<EvaluateArrangementOutput> {
  return evaluateArrangementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateArrangementPrompt',
  input: {schema: EvaluateArrangementInputSchema},
  output: {schema: EvaluateArrangementOutputSchema},
  prompt: `You are an interior design expert providing feedback on furniture arrangements.

  Evaluate the arrangement based on the room dimensions, furniture arrangement description, and user preferences.

  Room Dimensions: {{{roomDimensions}}}
  Furniture Arrangement Description: {{{furnitureArrangementDescription}}}
  User Preferences: {{{userPreferences}}}

  Provide feedback on the following aspects:
  - Overall Assessment: Provide an overall assessment of the furniture arrangement.
  - Flow Feedback: Provide feedback on the flow and movement within the room, considering the placement of furniture.
  - Aesthetics Feedback: Provide feedback on the aesthetic aspects of the arrangement.
  - Functionality Feedback: Provide feedback on the functionality of the arrangement, considering how well it meets the user needs.
  - Suggestions: Provide specific suggestions for improving the arrangement.

  Make sure to return the data in a JSON format.
  `,
});

const evaluateArrangementFlow = ai.defineFlow(
  {
    name: 'evaluateArrangementFlow',
    inputSchema: EvaluateArrangementInputSchema,
    outputSchema: EvaluateArrangementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
