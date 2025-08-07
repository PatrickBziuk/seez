import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const sharedSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  slug: z.string().optional(),
  publishDate: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
  modifiedDate: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
  tags: z.array(z.string()).default([]),
  language: z.enum(['en', 'de']).default('en'),
  status: z
    .object({
      authoring: z.enum(['Human', 'AI', 'AI+Human']).default('Human'),
      translation: z.enum(['Human', 'AI', 'AI+Human']).optional(),
    })
    .optional(),
  // Author system
  authors: z.array(z.string()).optional(), // Array of author IDs
  translators: z.array(z.string()).optional(), // Array of translator IDs

  // Sources and references
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url().optional(),
        author: z.string().optional(),
        date: z.string().optional(),
        type: z.enum(['article', 'book', 'video', 'documentation', 'research', 'website', 'other']).default('article'),
        description: z.string().optional(),
      })
    )
    .optional(),
});

// Legacy fields for backward compatibility
const extendedSchema = sharedSchema.extend({
  subtitle: z.string().optional(),
  date: z.date().optional(),
  draft: z.boolean().optional().default(false),
  timestamp: z.string().optional(), // ISO 8601
  translationKey: z.string().optional(), // Unique identifier for pairing across languages
  original: z.string().optional(), // Reference to source file for translations

  // Canonical ID system for content integrity
  canonicalId: z.string().optional(), // Format: slug-YYYYMMDD-hash8
  originalLanguage: z.enum(['en', 'de']).optional(), // Language of original content
  translationOf: z.string().optional(), // Canonical ID of source content
  sourceLanguage: z.enum(['en', 'de']).optional(), // Language this was translated from

  translationHistory: z
    .array(
      z.object({
        language: z.string(),
        translator: z.string(),
        model: z.string().optional(),
        sourceSha: z.string(),
        timestamp: z.string(),
        status: z.enum(['ai-translated', 'human-reviewed', 'ai+human']),
        reviewer: z.string().optional(), // GitHub username if human touched it
      })
    )
    .optional(),
  // AI generated summary and quality metrics
  ai_tldr: z.string().optional(),
  ai_textscore: z
    .object({
      translationQuality: z.number().optional(),
      originalClarity: z.number().optional(),
      timestamp: z.string(),
      notes: z.array(z.string()).optional(),
    })
    .optional(),
  // AI metadata with token usage tracking
  ai_metadata: z
    .object({
      canonicalId: z.string().optional(),
      translationOf: z.string().optional(),
      tokenUsage: z
        .object({
          translation: z
            .object({
              tokens: z.number(),
              cost: z.number(),
              co2: z.number(),
            })
            .optional(),
          tldr: z
            .object({
              tokens: z.number(),
              cost: z.number(),
              co2: z.number(),
            })
            .optional(),
          total: z
            .object({
              tokens: z.number(),
              cost: z.number(),
              co2: z.number(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

// Schema for blog posts (existing structure)
const postSchema = z.object({
  title: z.string(),
  excerpt: z.string().optional(),
  image: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()),
  publishDate: z.date(),
  draft: z.boolean().optional().default(false),
  // Extended metadata for multilingual support
  language: z.enum(['en', 'de']).default('en'),
  timestamp: z.string().optional(),
  status: z
    .object({
      authoring: z.enum(['Human', 'AI', 'AI+Human']).default('Human'),
      translation: z.enum(['Human', 'AI', 'AI+Human']).optional(),
    })
    .optional(),
  // Author system
  authors: z.array(z.string()).optional(),
  translators: z.array(z.string()).optional(),
  // Translation pipeline support
  translationKey: z.string().optional(),
  original: z.string().optional(),

  // Canonical ID system for content integrity
  canonicalId: z.string().optional(),
  originalLanguage: z.enum(['en', 'de']).optional(),
  translationOf: z.string().optional(),
  sourceLanguage: z.enum(['en', 'de']).optional(),

  translationHistory: z
    .array(
      z.object({
        language: z.string(),
        translator: z.string(),
        model: z.string().optional(),
        sourceSha: z.string(),
        timestamp: z.string(),
        status: z.enum(['ai-translated', 'human-reviewed', 'ai+human']),
        reviewer: z.string().optional(),
      })
    )
    .optional(),
  ai_tldr: z.string().optional(),
  ai_textscore: z
    .object({
      translationQuality: z.number().optional(),
      originalClarity: z.number().optional(),
      timestamp: z.string(),
      notes: z.array(z.string()).optional(),
    })
    .optional(),
  // AI metadata with token usage tracking
  ai_metadata: z
    .object({
      canonicalId: z.string().optional(),
      translationOf: z.string().optional(),
      tokenUsage: z
        .object({
          translation: z
            .object({
              tokens: z.number(),
              cost: z.number(),
              co2: z.number(),
            })
            .optional(),
          tldr: z
            .object({
              tokens: z.number(),
              cost: z.number(),
              co2: z.number(),
            })
            .optional(),
          total: z
            .object({
              tokens: z.number(),
              cost: z.number(),
              co2: z.number(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

// Authors collection schema
const authorSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  bio: z.string(),
  avatar: z.string().optional(),
  website: z.string().optional(),
  social: z
    .object({
      github: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      mastodon: z.string().optional(),
    })
    .optional(),
  language: z.enum(['en', 'de']).default('en'),
  status: z.object({
    authoring: z.enum(['Human', 'AI', 'AI+Human']).default('Human'),
  }),
  // AI-specific fields
  model: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/books' }),
  schema: extendedSchema,
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: extendedSchema,
});

const lab = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/lab' }),
  schema: extendedSchema,
});

const life = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/life' }),
  schema: extendedSchema,
});

const post = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/post' }),
  schema: postSchema,
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: extendedSchema,
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/authors' }),
  schema: authorSchema,
});

export const collections = {
  books,
  projects,
  lab,
  life,
  post,
  pages,
  authors,
};
