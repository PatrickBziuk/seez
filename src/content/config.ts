import { z, defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';

// New simplified base schema according to Plan 10035
const base = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  language: z.enum(['en', 'de']).default('en'),
  authors: z.array(reference('authors')).min(1),
  tags: z.array(z.string()).default([]),
  // Strings or phrases that must not be translated (opt-out list)
  notranslate: z.array(z.string()).optional(),

  // Single source of truth for publication state
  publicationStatus: z.enum(['draft', 'published', 'archived']).default('draft'),
  draft: z.boolean().optional(), // legacy compatibility

  // Dates
  firstPublishedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),

  // Identity & i18n
  canonicalId: z.string().min(8).optional(), // Optional everywhere, auto-generated if missing
  translationKey: z.string().optional(),

  // Minimal AI metadata (optional)
  ai_metadata: z
    .object({
      translation: z
        .object({
          model: z.string().optional(),
          at: z.string().datetime(),
          sourceLanguage: z.enum(['en', 'de']),
          targetLanguage: z.enum(['en', 'de']),
          tokens: z.number().optional(),
          cost: z.number().optional(),
          co2: z.number().optional(),
        })
        .optional(),
    })
    .optional(),

  // Legacy fields for backward compatibility during migration
  description: z.string().optional(),
  slug: z.string().optional(),
  publishDate: z.string().optional(), // Keep as string to avoid transformation issues
  firstPublishDate: z.string().optional(), // Keep as string to avoid transformation issues
  lastChangeDate: z.string().optional(), // Keep as string to avoid transformation issues
  modifiedDate: z.string().optional(), // Keep as string to avoid transformation issues
  changeLog: z
    .array(
      z.object({
        date: z.string(),
        description: z.string(),
        author: z.string().optional(),
        type: z.enum(['content', 'metadata', 'structure', 'translation']).default('content'),
        automated: z.boolean().default(false),
      })
    )
    .optional(),
  status: z
    .object({
      authoring: z.enum(['Human', 'AI', 'AI+Human']).default('Human'),
      translation: z.enum(['Human', 'AI', 'AI+Human']).optional(),
      review: z
        .object({
          content: z.boolean().default(false),
          translation: z.boolean().default(false),
          reviewer: z.string().nullable().optional(),
          reviewDate: z.string().nullable().optional(),
          notes: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  translators: z.array(z.string()).optional(),
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

  // Additional legacy fields for compatibility
  date: z.date().optional(),
  timestamp: z.string().optional(),
  original: z.string().optional(),
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
  tokenUsage: z
    .object({
      translation: z
        .object({
          tokens: z.number().optional(),
          cost: z.number().optional(),
          co2: z.number().optional(),
          operation: z.string().optional(),
          canonicalId: z.string().optional(),
          model: z.string().optional(),
          inputTokens: z.number().optional(),
          outputTokens: z.number().optional(),
          totalTokens: z.number().optional(),
          co2Impact: z.number().optional(),
          timestamp: z.string().optional(),
          sourceLanguage: z.string().optional(),
          targetLanguage: z.string().optional(),
        })
        .optional(),
      tldr: z
        .object({
          tokens: z.number().optional(),
          cost: z.number().optional(),
          co2: z.number().optional(),
        })
        .optional(),
      total: z
        .object({
          tokens: z.number().optional(),
          cost: z.number().optional(),
          co2: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

// Authors collection schema (updated for Plan 10035)
const authors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/authors' }),
  schema: z.object({
    name: z.string(),
    handle: z.string().optional(),
    url: z.string().url().optional(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
    model: z.string().optional(), // for AI authors
    capabilities: z.array(z.string()).optional(), // for AI authors

    // Legacy fields for compatibility
    id: z.string().optional(),
    displayName: z.string().optional(),
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
    status: z
      .object({
        authoring: z.enum(['Human', 'AI', 'AI+Human']).default('Human'),
      })
      .optional(),
    firstPublishDate: z.string().optional(),
    publishDate: z.string().optional(),
  }),
});

// Content collections using the new base schema
const books = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/books' }),
  schema: base,
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: base,
});

const lab = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/lab' }),
  schema: base,
});

const life = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/life' }),
  schema: base,
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: base,
});

// New collections for Plan 10043 - Creative Cosmos (renamed to fragments)
const fragments = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/fragments' }),
  schema: base.extend({
    image: z.string().optional(),
    alias: z.string().optional(),
    designation: z.string().optional(), // SZ-001, etc.
    colorCode: z.string().optional(),
    symbolism: z
      .array(
        z.object({
          icon: z.string(),
          meaning: z.string(),
        })
      )
      .length(3)
      .optional(),
    voiceCharacteristics: z
      .object({
        preset: z.string().optional(),
        bpmRange: z.tuple([z.number(), z.number()]).optional(),
        style: z.array(z.string()).optional(),
      })
      .optional(),
    movementGrammar: z.array(z.string()).length(3).optional(),
    primarySongs: z.array(reference('music')).optional(),
    containmentNote: z.string().optional(),
    artifacts: z.array(reference('artifacts')).optional(),
  }),
});

const texts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/texts' }),
  schema: base.extend({
    type: z.enum(['prolog', 'chapter', 'essay', 'poem', 'story']).optional(),
    figureRefs: z.array(reference('fragments')).optional(),
    songRefs: z.array(reference('music')).optional(),
    excerpt: z.string().optional(),
    chapterNumber: z.number().optional(),
  }),
});

const artifacts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/artifacts' }),
  schema: base.extend({
    type: z.enum(['merch', 'physical', 'digital', 'print']).optional(),
    figureRef: reference('fragments').optional(),
    costBreakdown: z
      .object({
        materials: z.number().optional(),
        production: z.number().optional(),
        shipping: z.number().optional(),
        total: z.number().optional(),
      })
      .optional(),
    availability: z.enum(['available', 'limited', 'sold-out', 'custom-order']).optional(),
  }),
});

// Extended music collection schema
const musicExtended = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/music' }),
  schema: base.extend({
    artist: z.string().default('Seez'),
    figureRef: reference('fragments').optional(),
    releaseDate: z.string().datetime().optional(),
    // Accept absolute or site-relative URLs
    audioUrl: z
      .string()
      .regex(/^(https?:\/\/|\/)/)
      .optional(),
    spotifyId: z.string().optional(),
    bpm: z.number().optional(),
    genre: z.array(z.string()).default([]),
    linerNotes: z.string().optional(),
  }),
});

// Legacy blog post schema (keeping for compatibility)
const post = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/post' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()),
    publishDate: z.date(),
    draft: z.boolean().optional().default(false),
    language: z.enum(['en', 'de']).default('en'),
    timestamp: z.string().optional(),
    status: z
      .object({
        authoring: z.enum(['Human', 'AI', 'AI+Human']).default('Human'),
        translation: z.enum(['Human', 'AI', 'AI+Human']).optional(),
        review: z
          .object({
            content: z.boolean().default(false),
            translation: z.boolean().default(false),
            reviewer: z.string().optional(),
            reviewDate: z.string().optional(),
            notes: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
    authors: z.array(z.string()).optional(),
    translators: z.array(z.string()).optional(),
    translationKey: z.string().optional(),
    original: z.string().optional(),
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
    ai_metadata: z
      .object({
        canonicalId: z.string().optional(),
        translationOf: z.string().optional(),
        tokenUsage: z
          .object({
            translation: z
              .object({
                tokens: z.number().optional(),
                cost: z.number().optional(),
                co2: z.number().optional(),
                operation: z.string().optional(),
                canonicalId: z.string().optional(),
                model: z.string().optional(),
                inputTokens: z.number().optional(),
                outputTokens: z.number().optional(),
                totalTokens: z.number().optional(),
                co2Impact: z.number().optional(),
                timestamp: z.string().optional(),
                sourceLanguage: z.string().optional(),
                targetLanguage: z.string().optional(),
              })
              .optional(),
            tldr: z
              .object({
                tokens: z.number().optional(),
                cost: z.number().optional(),
                co2: z.number().optional(),
              })
              .optional(),
            total: z
              .object({
                tokens: z.number().optional(),
                cost: z.number().optional(),
                co2: z.number().optional(),
              })
              .optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

export const collections = {
  authors,
  books,
  projects,
  lab,
  life,
  music: musicExtended, // Use extended music schema
  post,
  pages,
  fragments,
  texts,
  artifacts,
};
