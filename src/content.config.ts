import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tours = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tours' }),
  schema: z.object({
    datum: z.string(),
    locatie: z.string(),
    tickets: z.string(),
  }),
});

export const collections = { tours };
