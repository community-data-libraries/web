import { defineCollection, z } from 'astro:content';

/**
 * Content Collection Schema for Master Library
 * 
 * This schema defines the structure for all resources in the master library.
 * Each resource is a markdown file with frontmatter metadata.
 */
const masterLibraryCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Required fields
    title: z.string(),
    description: z.string(),
    
    // Optional metadata
    author: z.string().optional(),
    publishedDate: z.coerce.date().optional(),
    
    // Categorization
    tags: z.array(z.string()).default([]),
    category: z.enum(['dataset', 'tool', 'guide', 'paper']),
    
    // Resource links
    url: z.string().url().optional(),
    fileUrl: z.string().url().optional(),
    
    // Additional optional fields
    featured: z.boolean().default(false),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    language: z.string().optional(),
  }),
});

/**
 * Export collections
 * Collections are automatically available in Astro via the content collections API
 */
export const collections = {
  'master-library': masterLibraryCollection,
};
