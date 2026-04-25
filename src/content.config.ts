import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const completeCatalogCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/master-library' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().optional(),
    publishedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    dataThemes: z.array(z.string()).default([]),
    pedagogicalTags: z.array(z.string()).default([]),
    audienceAccess: z
      .object({
        teacher: z.boolean().default(true),
        student: z.boolean().default(true),
        community: z.boolean().default(true),
      })
      .default({
        teacher: true,
        student: true,
        community: true,
      }),
    sensitive: z.boolean().default(false),
    url: z.string().url().optional(),
    fileUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    language: z.string().optional(),
  }),
});

export const collections = {
  'master-library': completeCatalogCollection,
};
