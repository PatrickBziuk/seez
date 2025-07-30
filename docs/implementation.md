# Implementation: Content Metadata & UI Badges

## Metadata Schema
- Add to frontmatter:
  - `language`: en/de/other
  - `timestamp`: ISO 8601 string
  - `status`:
    - `authoring`: 'Human' | 'AI' | 'AI+Human'
    - `translation`: 'Human' | 'AI' | 'AI+Human' | null

## Migration
- Script to update all content files with new metadata fields.
- **Default Values**: Existing content defaults to `language: 'en'`, with `status.authoring: 'Human'` and `status.translation: null`.
- **Dry Run Mode**: Include a `--dry-run` flag to preview changes without writing to files.
- **Backup**: Automatically back up the content directory before migration.
- Validate existing frontmatter and add missing fields
- Move each .md file into the matching `src/pages/[language]/…` directory
- Ensure migration script checks translation coverage and logs/fails on missing locales

## UI Changes
- Update layouts (MarkdownLayout, PageLayout, etc.) to render metadata section
- Use/reuse badge components for tags and status
- Add logic to display language, timestamp, and badges
- All UI strings must use i18n keys, not hardcoded text
- Cluster i18n keys by feature (metadata, badges, status, etc.)
- Document i18n key structure and translation file format
- Install and configure i18n libraries (`astro-i18next`, `i18next`, `react-i18next`)
- Configure Astro to load translations via astro-i18next in `astro.config.mjs`
- Create translation files in `src/locales/` (en.json, de.json) with all key clusters
- Refactor content routes to use `[lang=string]` param and add getStaticPaths for language routing
- Replace Astro.url.pathname with locale-aware logic for frontmatter and routing
- Extend frontmatter parser to read language and pass locale context
- Wrap layouts with I18nextProvider and replace static labels with i18n keys
- Create and integrate LanguageSwitcher component for locale switching
- Add hreflang SEO tags for alternate language URLs by passing `alternate` props to the `AstroSeo` component in `src/components/common/Metadata.astro`.

## Technical Steps
1. Update content parsing logic (frontmatter.ts)
2. Extend layouts to include metadata section
3. Integrate/reuse badge components
4. Cluster all UI strings into i18n keys by feature
5. Set up translation files (e.g. en.json, de.json)
6. Refactor routes and layouts for multilanguage support
7. Implement LanguageSwitcher and SEO tags
8. Extend migration script for language directories and translation validation
9. Add translation-validation to CI (i18next-scanner)
10. Test with sample content and preview /en/* and /de/* routes

## Review & Countercheck
- Ensure UI is clean and metadata is visible
- Confirm technical feasibility and reusability
- Ensure all UI/UX copy is translatable and clustered logically
- Validate translation coverage and fallback handling
- Document all changes

---

## Detailed Implementation Guide

### 1. Content Schema Updates

#### 1.1 Extended Content Config (`src/content/config.ts`)

```typescript
import { z, defineCollection, glob } from 'astro:content';

// Base schema with new metadata fields
const extendedSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  tags: z.array(z.string()),
  date: z.date(),
  draft: z.boolean().optional().default(false),
  
  // NEW: Extended metadata for multilingual and AI/Human tracking
  language: z.enum(['en', 'de']).default('en'),
  timestamp: z.string().datetime().optional(),
  status: z.object({
    authoring: z.enum(['Human', 'AI', 'AI+Human']).default('Human'),
    translation: z.enum(['Human', 'AI', 'AI+Human']).optional()
  }).optional()
});

// Apply to all collections
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

export const collections = {
  books,
  projects,
  lab,
  life,
};
```

#### 1.2 TypeScript Extensions (`src/types.d.ts`)

```typescript
// ...existing code...

// NEW: Extended metadata interface
export interface ExtendedMetaData extends MetaData {
  language?: 'en' | 'de';
  timestamp?: string;
  status?: {
    authoring: 'Human' | 'AI' | 'AI+Human';
    translation?: 'Human' | 'AI' | 'AI+Human';
  };
  alternateLanguages?: Array<{
    href: string;
    hreflang: string;
  }>;
}

// NEW: Status enums for type safety
export type AuthoringStatus = 'Human' | 'AI' | 'AI+Human';
export type TranslationStatus = 'Human' | 'AI' | 'AI+Human';

// NEW: Content collection entry types
export interface ContentMetadataProps {
  language?: string;
  timestamp?: string | Date;
  status?: {
    authoring: AuthoringStatus;
    translation?: TranslationStatus;
  };
  tags?: string[];
}

// ...existing code...
```

### 2. UI Components Implementation

#### 2.1 Badge Component (`src/components/ui/Badge.astro`)

```astro
---
/**
 * Component: Badge
 * Purpose: Reusable badge component for metadata display
 * Props: variant (status type), text, icon
 * Expected behavior: Displays color-coded badges based on variant
 * Dependencies: Tailwind CSS, optional i18n
 * Used by: ContentMetadata component, tag displays
 */
export interface Props {
  variant: 'ai' | 'human' | 'ai-human' | 'tag' | 'language' | 'timestamp';
  text: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}

const { variant, text, icon, size = 'md' } = Astro.props;

const variantClasses = {
  'ai': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  'human': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-700',
  'ai-human': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  'tag': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  'language': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
  'timestamp': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-600'
};

const sizeClasses = {
  'sm': 'px-2 py-0.5 text-xs',
  'md': 'px-2.5 py-0.5 text-xs',
  'lg': 'px-3 py-1 text-sm'
};
---

<span class={`inline-flex items-center rounded-full font-medium border ${variantClasses[variant]} ${sizeClasses[size]}`}>
  {icon && <span class="mr-1.5 flex-shrink-0">{icon}</span>}
  <span>{text}</span>
</span>
```

#### 2.2 ContentMetadata Component (`src/components/common/ContentMetadata.astro`)

```astro
---
/**
 * Component: ContentMetadata
 * Purpose: Displays content metadata with badges at the top of content pages
 * Props: language, timestamp, status, tags
 * Expected behavior: Shows metadata in a clean, responsive layout
 * Dependencies: Badge component, utils for date formatting
 * Used by: MarkdownLayout, content pages
 */
import Badge from '~/components/ui/Badge.astro';
import { getFormattedDate } from '~/utils/utils';

export interface Props {
  language?: string;
  timestamp?: string | Date;
  status?: {
    authoring: 'Human' | 'AI' | 'AI+Human';
    translation?: 'Human' | 'AI' | 'AI+Human';
  };
  tags?: string[];
}

const { language, timestamp, status, tags } = Astro.props;

// Format timestamp for display
const formattedDate = timestamp ? getFormattedDate(new Date(timestamp)) : null;

// Language display mapping
const languageLabels = {
  'en': { label: 'English', flag: '🇺🇸' },
  'de': { label: 'Deutsch', flag: '🇩🇪' },
};

// Status icon mapping
const statusIcons = {
  'Human': '👤',
  'AI': '🤖',
  'AI+Human': '🤝'
};
---

{(language || timestamp || status || tags?.length) && (
  <div class="border-b border-gray-200 dark:border-gray-700 pb-6 mb-8">
    <div class="flex flex-wrap items-center gap-3 mb-4">
      
      <!-- Language Badge -->
      {language && languageLabels[language] && (
        <Badge 
          variant="language" 
          text={languageLabels[language].label}
          icon={languageLabels[language].flag}
        />
      )}
      
      <!-- Status Badges -->
      {status?.authoring && (
        <Badge 
          variant={status.authoring === 'AI' ? 'ai' : status.authoring === 'Human' ? 'human' : 'ai-human'} 
          text={`Created by ${status.authoring}`}
          icon={statusIcons[status.authoring]}
        />
      )}
      
      {status?.translation && (
        <Badge 
          variant={status.translation === 'AI' ? 'ai' : status.translation === 'Human' ? 'human' : 'ai-human'} 
          text={`Translated by ${status.translation}`}
          icon={statusIcons[status.translation]}
        />
      )}
      
      <!-- Timestamp -->
      {formattedDate && (
        <Badge 
          variant="timestamp"
          text={formattedDate}
          icon="📅"
        />
      )}
    </div>
    
    <!-- Tags Section -->
    {tags?.length && (
      <div class="flex flex-wrap gap-2">
        {tags.map(tag => (
          <Badge variant="tag" text={`#${tag}`} />
        ))}
      </div>
    )}
  </div>
)}

<style>
  /* Retro-style enhancement for tags */
  :global([data-variant="tag"]) {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transform: perspective(1px) translateZ(0);
    transition: all 0.2s ease;
  }
  
  :global([data-variant="tag"]:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  
  :global(.dark [data-variant="tag"]) {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  }
</style>
```

#### 2.3 Updated MarkdownLayout (`src/layouts/MarkdownLayout.astro`)

```astro
---
import Layout from '~/layouts/PageLayout.astro';
import ContentMetadata from '~/components/common/ContentMetadata.astro';

import type { MetaData } from '~/types';

export interface Props {
  frontmatter: {
    title?: string;
    subtitle?: string;
    language?: string;
    timestamp?: string | Date;
    status?: {
      authoring: 'Human' | 'AI' | 'AI+Human';
      translation?: 'Human' | 'AI' | 'AI+Human';
    };
    tags?: string[];
  };
}

const { frontmatter } = Astro.props;

const metadata: MetaData = {
  title: frontmatter?.title,
  description: frontmatter?.subtitle,
};
---

<Layout metadata={metadata}>
  <section class="px-4 py-16 sm:px-6 mx-auto lg:px-8 lg:py-20 max-w-4xl">
    <!-- Header -->
    <header class="mb-8">
      <h1 class="font-bold font-heading text-4xl md:text-5xl leading-tighter tracking-tighter mb-4">
        {frontmatter.title}
      </h1>
      {frontmatter.subtitle && (
        <p class="text-xl text-muted dark:text-slate-400">
          {frontmatter.subtitle}
        </p>
      )}
    </header>
    
    <!-- NEW: Metadata display -->
    <ContentMetadata 
      language={frontmatter.language}
      timestamp={frontmatter.timestamp}
      status={frontmatter.status}
      tags={frontmatter.tags}
    />
    
    <!-- Content -->
    <div class="mx-auto prose prose-lg max-w-4xl dark:prose-invert dark:prose-headings:text-slate-300 prose-md prose-headings:font-heading prose-headings:leading-tighter prose-headings:tracking-tighter prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-md prose-img:shadow-lg">
      <slot />
    </div>
  </section>
</Layout>
```

### 3. Migration Script Implementation

#### 3.1 Migration Script (`scripts/migrate-content.js`)

```javascript
/**
 * Content Migration Script
 * Purpose: Updates all content files with new metadata fields
 * Features: Backup, dry-run mode, validation, error handling
 * Usage: node scripts/migrate-content.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONTENT_DIR = path.join(__dirname, '../src/content');
const BACKUP_DIR = path.join(__dirname, '../content-backup');
const COLLECTIONS = ['books', 'projects', 'lab', 'life'];

// Default metadata for existing content
const DEFAULT_METADATA = {
  language: 'en',
  timestamp: new Date().toISOString(),
  status: {
    authoring: 'Human'
  }
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createBackup() {
  try {
    if (fs.existsSync(BACKUP_DIR)) {
      fs.rmSync(BACKUP_DIR, { recursive: true });
    }
    await fs.promises.cp(CONTENT_DIR, BACKUP_DIR, { recursive: true });
    log(`✅ Backup created at: ${BACKUP_DIR}`, 'green');
  } catch (error) {
    log(`❌ Failed to create backup: ${error.message}`, 'red');
    throw error;
  }
}

async function validateFrontmatter(filePath, data) {
  const errors = [];
  
  // Check required fields
  if (!data.title) errors.push('Missing title');
  if (!data.date) errors.push('Missing date');
  if (!data.tags || !Array.isArray(data.tags)) errors.push('Missing or invalid tags');
  
  // Validate new fields
  if (data.language && !['en', 'de'].includes(data.language)) {
    errors.push(`Invalid language: ${data.language}`);
  }
  
  if (data.status) {
    const validAuthoring = ['Human', 'AI', 'AI+Human'];
    if (!validAuthoring.includes(data.status.authoring)) {
      errors.push(`Invalid authoring status: ${data.status.authoring}`);
    }
    
    if (data.status.translation && !validAuthoring.includes(data.status.translation)) {
      errors.push(`Invalid translation status: ${data.status.translation}`);
    }
  }
  
  if (errors.length > 0) {
    log(`⚠️  Validation warnings for ${filePath}:`, 'yellow');
    errors.forEach(error => log(`   - ${error}`, 'yellow'));
  }
  
  return errors;
}

async function migrateFile(filePath, dryRun = false) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const { data, content: body } = matter(content);
    
    // Skip if already has new metadata
    if (data.language && data.status) {
      log(`⏭️  Skipping ${filePath} (already migrated)`, 'blue');
      return { updated: false, errors: [] };
    }
    
    // Merge with defaults, preserving existing values
    const updatedData = {
      ...data,
      ...DEFAULT_METADATA,
      // Preserve existing values if they exist
      ...(data.language && { language: data.language }),
      ...(data.timestamp && { timestamp: data.timestamp }),
      ...(data.status && { status: { ...DEFAULT_METADATA.status, ...data.status } })
    };
    
    // Validate updated frontmatter
    const errors = await validateFrontmatter(filePath, updatedData);
    
    // Generate new content
    const newContent = matter.stringify(body, updatedData);
    
    if (dryRun) {
      log(`📋 Would update: ${filePath}`, 'blue');
      console.log('Current frontmatter:', JSON.stringify(data, null, 2));
      console.log('Updated frontmatter:', JSON.stringify(updatedData, null, 2));
      console.log('---');
    } else {
      await fs.promises.writeFile(filePath, newContent);
      log(`✅ Updated: ${filePath}`, 'green');
    }
    
    return { updated: true, errors };
  } catch (error) {
    log(`❌ Failed to process ${filePath}: ${error.message}`, 'red');
    return { updated: false, errors: [error.message] };
  }
}

async function migrateCollection(collection, dryRun = false) {
  const collectionPath = path.join(CONTENT_DIR, collection);
  
  if (!fs.existsSync(collectionPath)) {
    log(`⚠️  Collection directory not found: ${collectionPath}`, 'yellow');
    return { processed: 0, updated: 0, errors: [] };
  }
  
  const files = await fs.promises.readdir(collectionPath);
  const markdownFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  
  log(`📁 Processing ${collection} collection (${markdownFiles.length} files)`, 'blue');
  
  let processed = 0;
  let updated = 0;
  const allErrors = [];
  
  for (const file of markdownFiles) {
    const filePath = path.join(collectionPath, file);
    const result = await migrateFile(filePath, dryRun);
    
    processed++;
    if (result.updated) updated++;
    allErrors.push(...result.errors);
  }
  
  return { processed, updated, errors: allErrors };
}

async function migrateContent(dryRun = false) {
  log('🚀 Starting content migration...', 'blue');
  log(`Mode: ${dryRun ? 'DRY RUN' : 'PRODUCTION'}`, dryRun ? 'yellow' : 'green');
  
  // Create backup (only in production mode)
  if (!dryRun) {
    await createBackup();
  }
  
  let totalProcessed = 0;
  let totalUpdated = 0;
  const allErrors = [];
  
  // Process each collection
  for (const collection of COLLECTIONS) {
    const result = await migrateCollection(collection, dryRun);
    totalProcessed += result.processed;
    totalUpdated += result.updated;
    allErrors.push(...result.errors);
  }
  
  // Summary
  log('\n📊 Migration Summary:', 'blue');
  log(`   Files processed: ${totalProcessed}`, 'reset');
  log(`   Files updated: ${totalUpdated}`, totalUpdated > 0 ? 'green' : 'yellow');
  log(`   Errors: ${allErrors.length}`, allErrors.length === 0 ? 'green' : 'red');
  
  if (allErrors.length > 0) {
    log('\n❌ Errors encountered:', 'red');
    allErrors.forEach(error => log(`   - ${error}`, 'red'));
  }
  
  if (dryRun) {
    log('\n💡 This was a dry run. No files were actually modified.', 'yellow');
    log('   Run without --dry-run to apply changes.', 'yellow');
  } else {
    log('\n✅ Migration completed successfully!', 'green');
    log(`   Backup available at: ${BACKUP_DIR}`, 'blue');
  }
}

// Script execution
const dryRun = process.argv.includes('--dry-run');

migrateContent(dryRun).catch(error => {
  log(`💥 Migration failed: ${error.message}`, 'red');
  process.exit(1);
});
```

### 4. Content Utilities

#### 4.1 Content Utils (`src/utils/content.ts`)

```typescript
/**
 * Content Utilities
 * Purpose: Language-specific content fetching and fallback logic
 * Features: Content filtering, fallback handling, slug management
 */
import { getCollection, type CollectionEntry } from 'astro:content';

type ContentCollection = 'books' | 'projects' | 'lab' | 'life';

export async function getContentByLanguage<T extends ContentCollection>(
  collection: T,
  language = 'en'
): Promise<CollectionEntry<T>[]> {
  const entries = await getCollection(collection);
  return entries.filter(entry => 
    entry.data.language === language && !entry.data.draft
  );
}

export async function getContentWithFallback<T extends ContentCollection>(
  collection: T,
  slug: string,
  preferredLanguage = 'en'
): Promise<{ entry: CollectionEntry<T> | null; isDefaultLanguage: boolean }> {
  const entries = await getCollection(collection);
  
  // Try preferred language first
  let entry = entries.find(e => 
    e.slug === slug && e.data.language === preferredLanguage && !e.data.draft
  );
  
  if (entry) {
    return { entry, isDefaultLanguage: true };
  }
  
  // Fallback to default language (English)
  entry = entries.find(e => 
    e.slug === slug && e.data.language === 'en' && !e.data.draft
  );
  
  if (entry) {
    return { entry, isDefaultLanguage: false };
  }
  
  // Fallback to any available language
  entry = entries.find(e => 
    e.slug === slug && !e.data.draft
  );
  
  return { entry: entry || null, isDefaultLanguage: false };
}

export async function getAvailableLanguages<T extends ContentCollection>(
  collection: T,
  slug: string
): Promise<string[]> {
  const entries = await getCollection(collection);
  return entries
    .filter(e => e.slug === slug && !e.data.draft)
    .map(e => e.data.language)
    .filter((lang): lang is string => Boolean(lang));
}

export function generateAlternateLanguageUrls(
  baseUrl: string,
  slug: string,
  availableLanguages: string[]
): Array<{ href: string; hreflang: string }> {
  return availableLanguages.map(lang => ({
    href: `${baseUrl}/${lang}/${slug}`,
    hreflang: lang
  }));
}

// Helper function to extract collection from URL
export function getCollectionFromPath(pathname: string): ContentCollection | null {
  const segments = pathname.split('/').filter(Boolean);
  const collections: ContentCollection[] = ['books', 'projects', 'lab', 'life'];
  
  for (const segment of segments) {
    if (collections.includes(segment as ContentCollection)) {
      return segment as ContentCollection;
    }
  }
  
  return null;
}
```

### 5. i18n Implementation

#### 5.1 Translation Files Structure

**`src/locales/en.json`**
```json
{
  "metadata": {
    "title": "Metadata",
    "language": "Language",
    "timestamp": "Created",
    "status": "Status",
    "tags": "Tags"
  },
  "badges": {
    "ai": "AI",
    "human": "Human", 
    "ai_human": "AI + Human",
    "created_by": "Created by",
    "translated_by": "Translated by",
    "language_en": "English",
    "language_de": "German"
  },
  "status": {
    "created": "Created",
    "translated": "Translated", 
    "authoring": "Authoring",
    "translation": "Translation"
  },
  "content": {
    "not_available": "This content is not available in your selected language.",
    "redirected_notice": "You have been redirected to the English version.",
    "dismiss": "Dismiss"
  },
  "navigation": {
    "language_switcher": "Change Language",
    "available_in": "Available in",
    "not_available_in": "Not available in"
  }
}
```

**`src/locales/de.json`**
```json
{
  "metadata": {
    "title": "Metadaten",
    "language": "Sprache", 
    "timestamp": "Erstellt",
    "status": "Status",
    "tags": "Tags"
  },
  "badges": {
    "ai": "KI",
    "human": "Mensch",
    "ai_human": "KI + Mensch", 
    "created_by": "Erstellt von",
    "translated_by": "Übersetzt von",
    "language_en": "Englisch",
    "language_de": "Deutsch"
  },
  "status": {
    "created": "Erstellt",
    "translated": "Übersetzt",
    "authoring": "Verfassung", 
    "translation": "Übersetzung"
  },
  "content": {
    "not_available": "Dieser Inhalt ist in Ihrer gewählten Sprache nicht verfügbar.",
    "redirected_notice": "Sie wurden zur englischen Version weitergeleitet.",
    "dismiss": "Schließen"
  },
  "navigation": {
    "language_switcher": "Sprache wechseln",
    "available_in": "Verfügbar in",
    "not_available_in": "Nicht verfügbar in"
  }
}
```

#### 5.2 i18n Configuration (`src/utils/i18n.ts`)

```typescript
/**
 * i18n Configuration and Utilities
 * Purpose: Internationalization setup and helper functions
 * Features: Translation loading, fallback handling, language detection
 */
import { getCollection } from 'astro:content';

export const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
export const DEFAULT_LANGUAGE = 'en';

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Language display information
export const LANGUAGE_INFO = {
  en: { label: 'English', flag: '🇺🇸', dir: 'ltr' },
  de: { label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' }
} as const;

// Load translations dynamically
export async function getTranslations(language: SupportedLanguage) {
  try {
    const translations = await import(`../locales/${language}.json`);
    return translations.default;
  } catch (error) {
    console.warn(`Failed to load translations for ${language}, falling back to ${DEFAULT_LANGUAGE}`);
    const fallback = await import(`../locales/${DEFAULT_LANGUAGE}.json`);
    return fallback.default;
  }
}

// Translation helper with fallback
export function t(
  translations: Record<string, any>, 
  key: string, 
  fallback?: string
): string {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  return value || fallback || key;
}

// Language detection from URL
export function getLanguageFromUrl(url: string): SupportedLanguage {
  const segments = url.split('/').filter(Boolean);
  const lang = segments[0];
  
  if (SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
    return lang as SupportedLanguage;
  }
  
  return DEFAULT_LANGUAGE;
}

// Generate localized URLs
export function getLocalizedUrl(path: string, language: SupportedLanguage): string {
  // Remove existing language prefix
  const cleanPath = path.replace(/^\/[a-z]{2}(?=\/|$)/, '');
  
  // Add new language prefix (except for default language)
  if (language === DEFAULT_LANGUAGE) {
    return cleanPath || '/';
  }
  
  return `/${language}${cleanPath}`;
}

// Check if content exists in specific language
export async function hasContentInLanguage(
  collection: string,
  slug: string,
  language: SupportedLanguage
): Promise<boolean> {
  try {
    const entries = await getCollection(collection as any);
    return entries.some(entry => 
      entry.slug === slug && 
      entry.data.language === language &&
      !entry.data.draft
    );
  } catch {
    return false;
  }
}
```

### 6. Advanced Components

#### 6.1 Language Switcher (`src/components/ui/LanguageSwitcher.astro`)

```astro
---
/**
 * Component: LanguageSwitcher
 * Purpose: Allows users to switch between available languages
 * Props: currentLanguage, availableLanguages, currentPath
 * Expected behavior: Shows dropdown with language options, intelligently disables unavailable translations
 * Dependencies: i18n utils, content utils
 * Used by: Header component, navigation
 */
import { LANGUAGE_INFO, type SupportedLanguage } from '~/utils/i18n';
import { getLocalizedUrl } from '~/utils/i18n';

export interface Props {
  currentLanguage: SupportedLanguage;
  availableLanguages?: SupportedLanguage[];
  currentPath: string;
  showUnavailable?: boolean;
}

const { 
  currentLanguage, 
  availableLanguages = ['en', 'de'], 
  currentPath,
  showUnavailable = true 
} = Astro.props;

const allLanguages = Object.keys(LANGUAGE_INFO) as SupportedLanguage[];
---

<div class="relative inline-block text-left" data-language-switcher>
  <!-- Dropdown Button -->
  <button 
    type="button" 
    class="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
    aria-expanded="false"
    aria-haspopup="true"
  >
    <span class="mr-2">{LANGUAGE_INFO[currentLanguage].flag}</span>
    <span class="hidden sm:inline">{LANGUAGE_INFO[currentLanguage].label}</span>
    <span class="sm:hidden">{currentLanguage.toUpperCase()}</span>
    <!-- Chevron -->
    <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  </button>

  <!-- Dropdown Menu -->
  <div 
    class="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700 hidden"
    role="menu"
    aria-orientation="vertical"
  >
    <div class="py-1" role="none">
      {allLanguages.map(lang => {
        const isAvailable = availableLanguages.includes(lang);
        const isCurrent = lang === currentLanguage;
        const url = getLocalizedUrl(currentPath, lang);
        
        return (
          <div class="relative">
            {isAvailable ? (
              <a
                href={url}
                class={`group flex items-center px-4 py-2 text-sm transition-colors ${
                  isCurrent 
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
                role="menuitem"
              >
                <span class="mr-3">{LANGUAGE_INFO[lang].flag}</span>
                <span class="flex-1">{LANGUAGE_INFO[lang].label}</span>
                {isCurrent && (
                  <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                )}
              </a>
            ) : showUnavailable ? (
              <div class="group flex items-center px-4 py-2 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed">
                <span class="mr-3 opacity-50">{LANGUAGE_INFO[lang].flag}</span>
                <span class="flex-1 opacity-50">{LANGUAGE_INFO[lang].label}</span>
                <span class="text-xs opacity-75">N/A</span>
              </div>
            ) : null
          )}
          </div>
        );
      })}
    </div>
  </div>
</div>

<script>
  // Dropdown functionality
  document.addEventListener('DOMContentLoaded', function() {
    const switcher = document.querySelector('[data-language-switcher]');
    if (!switcher) return;
    
    const button = switcher.querySelector('button');
    const menu = switcher.querySelector('[role="menu"]');
    
    if (!button || !menu) return;
    
    // Toggle dropdown
    button.addEventListener('click', function() {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', (!isExpanded).toString());
      menu.classList.toggle('hidden');
    });
    
    // Close on outside click
    document.addEventListener('click', function(event) {
      if (!switcher.contains(event.target)) {
        button.setAttribute('aria-expanded', 'false');
        menu.classList.add('hidden');
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        button.setAttribute('aria-expanded', 'false');
        menu.classList.add('hidden');
        button.focus();
      }
    });
  });
</script>
```

#### 6.2 Content Fallback Notice (`src/components/common/ContentFallbackNotice.astro`)

```astro
---
/**
 * Component: ContentFallbackNotice
 * Purpose: Displays a notice when content is not available in the selected language
 * Props: originalLanguage, currentLanguage, dismissible
 * Expected behavior: Shows a banner with explanation and dismiss option
 * Dependencies: i18n utils
 * Used by: Content pages when fallback is used
 */
import { LANGUAGE_INFO, type SupportedLanguage } from '~/utils/i18n';

export interface Props {
  originalLanguage: SupportedLanguage;
  currentLanguage: SupportedLanguage;
  dismissible?: boolean;
}

const { originalLanguage, currentLanguage, dismissible = true } = Astro.props;

if (originalLanguage === currentLanguage) {
  // Don't show notice if languages match
  return null;
}
---

<div 
  class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 dark:bg-yellow-900/20 dark:border-yellow-400"
  role="alert"
  data-fallback-notice
>
  <div class="flex">
    <div class="flex-shrink-0">
      <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="ml-3 flex-1">
      <p class="text-sm text-yellow-700 dark:text-yellow-200">
        <strong>Language Notice:</strong> This content is not available in 
        <span class="inline-flex items-center">
          {LANGUAGE_INFO[currentLanguage].flag}
          <span class="ml-1">{LANGUAGE_INFO[currentLanguage].label}</span>
        </span>.
        You are viewing the 
        <span class="inline-flex items-center">
          {LANGUAGE_INFO[originalLanguage].flag}
          <span class="ml-1">{LANGUAGE_INFO[originalLanguage].label}</span>
        </span>
        version instead.
      </p>
    </div>
    {dismissible && (
      <div class="ml-auto pl-3">
        <div class="-mx-1.5 -my-1.5">
          <button 
            type="button" 
            class="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-400 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30"
            data-dismiss-notice
          >
            <span class="sr-only">Dismiss</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    )}
  </div>
</div>

<script>
  // Dismiss functionality with local storage
  document.addEventListener('DOMContentLoaded', function() {
    const notice = document.querySelector('[data-fallback-notice]');
    const dismissButton = document.querySelector('[data-dismiss-notice]');
    
    if (!notice || !dismissButton) return;
    
    // Check if notice was previously dismissed
    const storageKey = 'language-fallback-notice-dismissed';
    if (localStorage.getItem(storageKey) === 'true') {
      notice.style.display = 'none';
      return;
    }
    
    // Handle dismiss
    dismissButton.addEventListener('click', function() {
      notice.style.display = 'none';
      localStorage.setItem(storageKey, 'true');
    });
  });
</script>
```

### 7. Package Dependencies

#### 7.1 Required Packages (`package.json` additions)

```json
{
  "dependencies": {
    "astro-i18next": "^1.0.0-beta.21",
    "i18next": "^23.7.6",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "i18next-scanner": "^4.4.0"
  }
}
```

#### 7.2 Astro Configuration (`astro.config.ts`)

```typescript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import astroI18next from 'astro-i18next';

// https://astro.build/config
export default defineConfig({
  site: 'https://bziuk.com',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          de: 'de'
        }
      }
    }),
    mdx(),
    astroI18next({
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'de'],
      i18next: {
        debug: true,
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {}
          },
          de: {
            translation: {}
          }
        }
      }
    })
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
```

---

## Summary

This comprehensive implementation guide provides:

1. **Complete code examples** for all components and utilities
2. **Detailed migration scripts** with error handling and validation
3. **Full i18n setup** with translation files and utilities
4. **Advanced UI components** with accessibility features
5. **Proper TypeScript definitions** for type safety
6. **Integration patterns** that work with existing Astro codebase

The implementation is structured in phases to allow incremental development and testing at each stage.

## Language Selector Integration Next to Theme Toggle
- Analyze header/navigation layout for theme toggle placement
- Add Language Selector icon button next to theme toggle
- On click, open language drawer/modal/dropdown
- Use LanguageSwitcher component for drawer content
- Pass current locale and available languages as props
- Ensure mobile responsiveness and accessibility
- Test integration on desktop and mobile
- Document UI pattern and technical steps

## Header Language Selector & Footer Menu Removal
- Fix type error: ensure currentLanguage is 'en' | 'de'
- Use 'onclick' for button event handler
- Toggle drawer visibility with Astro state or script
- Remove language menu from page footer/layouts
- Test button functionality and drawer appearance
- Confirm removal of footer menu
- Document all changes

## Header Layout & Animation Updates
- Add CSS transitions for smooth drawer animations
- Adjust header layout to accommodate drawer
- Use media queries for mobile responsiveness
- Test animations and layout changes
- Ensure accessibility with ARIA attributes

## Language Selector Drawer Implementation
- Use reactive state for drawer open/close
- Toggle between language icon and "X" icon
- Add event listeners for outside click and language selection
- Use CSS for direction and transitions
- Fix layout so drawer overlays below/above icons, not over them
- Test on desktop and mobile

## Language Selector: Refactor Plan
- Use client-side script for drawer state and event handling
- Toggle icon using data attribute or CSS class
- Use 'onclick' for button events
- Only pass allowed props to LanguageSwitcher
- Use CSS for responsive drawer direction
- Position drawer absolutely to overlay header icons
- Document all changes and rationale

# Implementation Update: Language Selector Toggle

## Previous Implementation
- Dropdown menu for language selection in header.
- Complex markup and event handling for menu.

## Issue Encountered
- Dropdown caused UI/UX and accessibility issues.
- Responsive behavior was inconsistent.

## New Implementation
- Simple toggle button labeled "ENG" or "DEU" replaces dropdown.
- Toggle is minimal, boxed only on hover, matching header icon style.
- Language switching logic preserved.

## Rationale
- Toggle is easier to use, visually clear, and maintainable.
- All dropdown/menu code removed from header.

---
