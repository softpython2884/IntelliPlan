'use server';

/**
 * @fileOverview Suggests optimal furniture layout arrangements based on room dimensions and selected furniture.
 *
 * - suggestLayout - A function that handles the layout suggestion process.
 * - SuggestLayoutInput - The input type for the suggestLayout function.
 * - SuggestLayoutOutput - The return type for the suggestLayout function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLayoutInputSchema = z.object({
  roomDimensions: z
    .object({
      width: z.number().describe('The width of the room in meters.'),
      length: z.number().describe('The length of the room in meters.'),
    })
    .describe('The dimensions of the room.'),
  furniture: z
    .array(
      z.object({
        name: z.string().describe('The name of the furniture piece.'),
        width: z.number().describe('The width of the furniture piece in meters.'),
        length: z.number().describe('The length of the furniture piece in meters.'),
      })
    )
    .describe('The list of furniture pieces to arrange in the room.'),
});
export type SuggestLayoutInput = z.infer<typeof SuggestLayoutInputSchema>;

const SuggestLayoutOutputSchema = z.object({
  layoutSuggestions: z
    .array(
      z.object({
        furnitureName: z.string().describe('The name of the furniture piece in this layout.'),
        x: z.number().describe('The x-coordinate of the furniture piece in meters.'),
        y: z.number().describe('The y-coordinate of the furniture piece in meters.'),
        rotation: z.number().describe('The rotation of the furniture piece in degrees.'),
      })
    )
    .describe('A list of suggested furniture layouts.'),
  reasoning: z.string().describe('Reasoning for the suggested layout.'),
});
export type SuggestLayoutOutput = z.infer<typeof SuggestLayoutOutputSchema>;

export async function suggestLayout(input: SuggestLayoutInput): Promise<SuggestLayoutOutput> {
  return suggestLayoutFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLayoutPrompt',
  input: {schema: SuggestLayoutInputSchema},
  output: {schema: SuggestLayoutOutputSchema},
  prompt: `You are an expert interior designer specializing in efficient furniture layouts.

You will use the room dimensions and the list of furniture pieces to suggest an optimal layout.
Consider factors such as traffic flow, natural light, and the function of the room.

Room Dimensions:
Width: {{roomDimensions.width}} meters
Length: {{roomDimensions.length}} meters

Furniture:
{{#each furniture}}
- Name: {{this.name}}, Width: {{this.width}} meters, Length: {{this.length}} meters
{{/each}}

Suggest a layout that maximizes space and functionality. Provide clear coordinates and rotations for each furniture piece.
Also, provide a reasoning for the suggested layout.

Output the layout suggestions as a JSON array of furniture placements, each with the furniture name, x and y coordinates, and rotation in degrees. Also provide a reasoning for the suggested layout.
`,
});

const suggestLayoutFlow = ai.defineFlow(
  {
    name: 'suggestLayoutFlow',
    inputSchema: SuggestLayoutInputSchema,
    outputSchema: SuggestLayoutOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
