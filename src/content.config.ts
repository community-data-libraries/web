import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const masterLibraryCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/master-library' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().optional(),
    publishedDate: z.coerce.date().optional(),
    category: z.enum(['dataset', 'tool', 'guide', 'paper']).default('dataset'),
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
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    featured: z.boolean().default(false),
    language: z.string().optional(),
  }),
});

const communityLibraryRequestsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/community-library-requests' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    community_name: z.string(),
    community_slug: z.string(),
    contact_name: z.string(),
    contact_email: z.string(),
    repository_name: z.string().optional(),
    repository_description: z.string().optional(),
    geographic_tags: z.array(z.string()).default([]),
    geographic_filters: z
      .object({
        filter_state: z.boolean().default(true),
        filter_county: z.boolean().default(true),
        filter_zip_code: z.boolean().default(true),
        filter_school_district: z.boolean().default(false),
        filter_tract: z.boolean().default(false),
        filter_fips_code: z.boolean().default(false),
        default_state: z.string().optional(),
        default_county_fips: z.string().optional(),
        default_zip_code: z.string().optional(),
        default_school_district: z.string().optional(),
      })
      .default({}),
    implementation_notes: z.string().optional(),
    status: z.enum(['pending', 'approved', 'provisioned', 'failed']).default('pending'),
    provisioned_repo_url: z.string().optional(),
    provisioned_site_url: z.string().optional(),
    last_error: z.string().optional(),
  }),
});

export const collections = {
  'master-library': masterLibraryCollection,
  'community-library-requests': communityLibraryRequestsCollection,
};
