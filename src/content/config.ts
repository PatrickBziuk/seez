import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const sharedSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  slug: z.string().optional(),
  publishDate: z.string().transform(s => new Date(s)).optional(),
  modifiedDate: z.string().transform(s => new Date(s)).optional(),
  tags: z.array(z.string()).default([]),
  language: z.enum(['en', 'de']).default('en'),
  status: z.object({
    authoring: z.enum(['Human', 'AI', 'AI+Human']).default('Human'),
    translation: z.enum(['Human', 'AI', 'AI+Human']).optional()
  }).optional()
});

// Legacy fields for backward compatibility
const extendedSchema = sharedSchema.extend({
  subtitle: z.string().optional(),
  date: z.date().optional(),
  draft: z.boolean().optional().default(false),
  timestamp: z.string().optional(), // ISO 8601
  translationKey: z.string().optional(), // Unique identifier for pairing across languages
  original: z.string().optional(), // Reference to source file for translations
  translationHistory: z.array(z.object({
    language: z.string(),
    translator: z.string(),
    model: z.string().optional(),
    sourceSha: z.string(),
    timestamp: z.string(),
    status: z.enum(['ai-translated', 'human-reviewed', 'ai+human']),
    reviewer: z.string().optional(), // GitHub username if human touched it
  })).optional(),
  // AI generated summary and quality metrics
  ai_tldr: z.string().optional(),
  ai_textscore: z.object({
    translationQuality: z.number().optional(),
    originalClarity: z.number().optional(),
    timestamp: z.string(),
    notes: z.array(z.string()).optional(),
  }).optional(),
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
  status: z.object({
    authoring: z.enum(['Human', 'AI', 'AI+Human']).default('Human'),
    translation: z.enum(['Human', 'AI', 'AI+Human']).optional(),
  }).optional(),
  // Translation pipeline support
  translationKey: z.string().optional(),
  original: z.string().optional(),
  translationHistory: z.array(z.object({
    language: z.string(),
    translator: z.string(),
    model: z.string().optional(),
    sourceSha: z.string(),
    timestamp: z.string(),
    status: z.enum(['ai-translated', 'human-reviewed', 'ai+human']),
    reviewer: z.string().optional(),
  })).optional(),
  ai_tldr: z.string().optional(),
  ai_textscore: z.object({
    translationQuality: z.number().optional(),
    originalClarity: z.number().optional(),
    timestamp: z.string(),
    notes: z.array(z.string()).optional(),
  }).optional(),
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

export const collections = {
  books,
  projects,
  lab,
  life,
  post,
  pages,
};
