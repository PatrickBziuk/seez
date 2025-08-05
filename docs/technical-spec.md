# Technical Specification: Content Metadata & UI Badges

## Overview

This document provides comprehensive technical specifications for implementing content metadata badges and multilingual support in the AstroWind-based site. The implementation includes content schema extensions, UI components, i18n integration, and migration tooling.

## Architecture Overview

### System Components

1. **Content Schema Extension** - Extended Astro content collections with metadata fields
2. **UI Badge System** - Reusable badge components for metadata display
3. **i18n Framework** - Multilingual support with astro-i18next
4. **Migration Tools** - Scripts for content transformation and validation
5. **SEO Integration** - Hreflang and alternate language support

### Data Flow

```
Content Files (Markdown)
  ↓ (with extended frontmatter)
Content Collections (Astro)
  ↓ (parsed by collection schema)
Component Props (TypeScript)
  ↓ (rendered with i18n)
UI Components (Astro)
  ↓ (displayed with badges)
Browser (User Interface)
```

## Content Schema Specification

### Extended Frontmatter Schema

```yaml
# Required fields (existing)
title: string
subtitle?: string
tags: string[]
date: Date
draft?: boolean

# New metadata fields
language: 'en' | 'de'  # Default: 'en'
timestamp?: string     # ISO 8601 format
status?: {
  authoring: 'Human' | 'AI' | 'AI+Human'     # Default: 'Human'
  translation?: 'Human' | 'AI' | 'AI+Human'  # Optional
}
```

### Content Collection Updates

**File**: `src/content/config.ts`

```typescript
import { z, defineCollection, glob } from 'astro:content';

// Extended schema for all collections
const extendedSchema = z.object({
  // Existing fields
  title: z.string(),
  subtitle: z.string().optional(),
  tags: z.array(z.string()),
  date: z.date(),
  draft: z.boolean().optional().default(false),

  // New metadata fields
  language: z.enum(['en', 'de']).default('en'),
  timestamp: z.string().datetime().optional(),
  status: z
    .object({
      authoring: z.enum(['Human', 'AI', 'AI+Human']).default('Human'),
      translation: z.enum(['Human', 'AI', 'AI+Human']).optional(),
    })
    .optional(),
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

export const collections = { books, projects, lab, life };
```

### TypeScript Interface Extensions

**File**: `src/types.d.ts`

```typescript
// Extend existing MetaData interface
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

// Status enums for type safety
export type AuthoringStatus = 'Human' | 'AI' | 'AI+Human';
export type TranslationStatus = 'Human' | 'AI' | 'AI+Human';

// Component props interface
export interface ContentMetadataProps {
  language?: string;
  timestamp?: string | Date;
  status?: {
    authoring: AuthoringStatus;
    translation?: TranslationStatus;
  };
  tags?: string[];
}
```

## UI Component Specifications

### Badge Component

**File**: `src/components/ui/Badge.astro`

**Props Interface**:

```typescript
interface Props {
  variant: 'ai' | 'human' | 'ai-human' | 'tag' | 'language' | 'timestamp';
  text: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

**Variant Specifications**:

- **AI**: Blue color scheme (`bg-blue-100 text-blue-800`) with robot icon 🤖
- **Human**: Green color scheme (`bg-green-100 text-green-800`) with person icon 👤
- **AI+Human**: Purple color scheme (`bg-purple-100 text-purple-800`) with handshake icon 🤝
- **Tag**: Gray color scheme (`bg-gray-100 text-gray-800`) with retro styling
- **Language**: Indigo color scheme (`bg-indigo-100 text-indigo-800`) with flag icons
- **Timestamp**: Slate color scheme (`bg-slate-100 text-slate-700`) with calendar icon 📅

**Accessibility Features**:

- ARIA labels for screen readers
- Keyboard navigation support
- High contrast support for dark mode
- Semantic HTML structure

### ContentMetadata Component

**File**: `src/components/common/ContentMetadata.astro`

**Layout Structure**:

```html
<div class="border-b border-gray-200 dark:border-gray-700 pb-6 mb-8">
  <!-- Primary metadata row -->
  <div class="flex flex-wrap items-center gap-3 mb-4">
    <!-- Language, Status, Timestamp badges -->
  </div>

  <!-- Secondary tags row -->
  <div class="flex flex-wrap gap-2">
    <!-- Tag badges with retro styling -->
  </div>
</div>
```

**Features**:

- Conditional rendering (only shows if metadata exists)
- Responsive design (stacks on mobile, inline on desktop)
- Language mapping with flag emojis
- Status icon integration
- Date formatting with locale awareness

### MarkdownLayout Integration

**File**: `src/layouts/MarkdownLayout.astro`

**Integration Point**:

```astro
<section class="px-4 py-16 sm:px-6 mx-auto lg:px-8 lg:py-20 max-w-4xl">
  <!-- Header -->
  <header class="mb-8">
    <h1>{frontmatter.title}</h1>
    {frontmatter.subtitle && <p>{frontmatter.subtitle}</p>}
  </header>

  <!-- NEW: Metadata display -->
  <ContentMetadata
    language={frontmatter.language}
    timestamp={frontmatter.timestamp}
    status={frontmatter.status}
    tags={frontmatter.tags}
  />

  <!-- Content -->
  <div class="prose prose-lg">
    <slot />
  </div>
</section>
```

## i18n Implementation Specification

### Translation File Structure

**Directory**: `src/locales/`

**Key Clustering Strategy**:

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
    "translated_by": "Translated by"
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

### i18n Configuration

**File**: `src/utils/i18n.ts`

**Supported Languages**:

```typescript
export const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_INFO = {
  en: { label: 'English', flag: '🇺🇸', dir: 'ltr' },
  de: { label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
} as const;
```

**Translation Loading**:

```typescript
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
```

### Astro Integration Configuration

**File**: `astro.config.ts`

```typescript
import astroI18next from 'astro-i18next';

export default defineConfig({
  integrations: [
    astroI18next({
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'de'],
      i18next: {
        debug: true,
        fallbackLng: 'en',
        resources: {
          en: { translation: {} },
          de: { translation: {} },
        },
      },
    }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', de: 'de' },
      },
    }),
  ],
});
```

## Content Utilities Specification

### Language-Aware Content Fetching

**File**: `src/utils/content.ts`

**Core Functions**:

1. **getContentByLanguage**: Filter content by language

```typescript
export async function getContentByLanguage<T extends ContentCollection>(
  collection: T,
  language = 'en'
): Promise<CollectionEntry<T>[]> {
  const entries = await getCollection(collection);
  return entries.filter((entry) => entry.data.language === language && !entry.data.draft);
}
```

2. **getContentWithFallback**: Handle missing translations

```typescript
export async function getContentWithFallback<T extends ContentCollection>(
  collection: T,
  slug: string,
  preferredLanguage = 'en'
): Promise<{ entry: CollectionEntry<T> | null; isDefaultLanguage: boolean }> {
  // Implementation with fallback logic
}
```

3. **generateAlternateLanguageUrls**: SEO URL generation

```typescript
export function generateAlternateLanguageUrls(
  baseUrl: string,
  slug: string,
  availableLanguages: string[]
): Array<{ href: string; hreflang: string }> {
  return availableLanguages.map((lang) => ({
    href: `${baseUrl}/${lang}/${slug}`,
    hreflang: lang,
  }));
}
```

## Migration Script Specification

### Migration Tool

**File**: `scripts/migrate-content.js`

**Core Features**:

- **Backup System**: Automatic content backup before migration
- **Dry Run Mode**: Preview changes without file modification
- **Validation**: Frontmatter validation and error reporting
- **Progress Reporting**: Colored console output with statistics

**Default Metadata Values**:

```javascript
const DEFAULT_METADATA = {
  language: 'en',
  timestamp: new Date().toISOString(),
  status: {
    authoring: 'Human',
  },
};
```

**Usage**:

```bash
# Dry run (preview only)
node scripts/migrate-content.js --dry-run

# Production migration
node scripts/migrate-content.js
```

**Migration Process**:

1. Create timestamped backup of content directory
2. Scan all collections for markdown files
3. Parse existing frontmatter with gray-matter
4. Merge with default metadata (preserving existing values)
5. Validate updated frontmatter
6. Write updated files or show preview (dry run)
7. Generate summary report with statistics

## Advanced Components Specification

### LanguageSwitcher Component

**File**: `src/components/ui/LanguageSwitcher.astro`

**Features**:

- Dropdown interface with current language display
- Intelligent language availability detection
- URL transformation for language switching
- Keyboard navigation (Arrow keys, Enter, Escape)
- Focus management and ARIA attributes

**Props Interface**:

```typescript
interface Props {
  currentLanguage: SupportedLanguage;
  availableLanguages?: SupportedLanguage[];
  currentPath: string;
  showUnavailable?: boolean;
}
```

**State Management**:

- Show/hide dropdown state
- Loading states during navigation
- Error handling for failed switches
- Language preference persistence

### ContentFallbackNotice Component

**File**: `src/components/common/ContentFallbackNotice.astro`

**Features**:

- Display when content shown in non-preferred language
- Dismissible with localStorage persistence
- Clear explanation of language fallback
- Visual indicators for original vs. current language

**Props Interface**:

```typescript
interface Props {
  originalLanguage: SupportedLanguage;
  currentLanguage: SupportedLanguage;
  dismissible?: boolean;
}
```

## SEO Enhancement Specification

### Hreflang Implementation

**Integration Point**: `src/components/common/Metadata.astro`

**Meta Tags Generation**:

```html
<!-- For each available language -->
<link rel="alternate" hreflang="en" href="https://seez.eu/en/books/example" />
<link rel="alternate" hreflang="de" href="https://seez.eu/de/books/example" />
<link rel="alternate" hreflang="x-default" href="https://seez.eu/books/example" />
```

**Canonical URL Handling**:

- Default language (en): canonical without language prefix
- Alternate languages: canonical with language prefix
- x-default directive for language-neutral content

### Open Graph Enhancement

```html
<meta property="og:locale" content="en_US" /> <meta property="og:locale:alternate" content="de_DE" />
```

## Performance Considerations

### Build Time Impact

- **Content Collections**: Minimal impact on build time
- **Translation Loading**: Dynamic imports for optimal bundle size
- **Route Generation**: Static generation for all language combinations

### Runtime Performance

- **JavaScript Bundle**: i18n utilities add ~15KB (gzipped)
- **Page Load**: No additional requests for translations (bundled)
- **Memory Usage**: Minimal impact from language switching

### Optimization Strategies

- Lazy loading of translation files
- Tree shaking of unused i18n keys
- Content caching at collection level
- Minimal JavaScript for interactive components

## Testing Strategy

### Unit Testing

- Content schema validation
- Translation key coverage
- URL generation functions
- Component prop validation

### Integration Testing

- Language switching workflows
- Content fallback scenarios
- SEO tag generation
- Migration script validation

### End-to-End Testing

- Multi-language navigation
- Content display across languages
- Responsive design validation
- Accessibility compliance

### Performance Testing

- Build time measurements
- Bundle size analysis
- Page load speed testing
- Memory usage profiling

## Deployment Considerations

### CI/CD Integration

**File**: `.github/workflows/actions.yaml`

```yaml
jobs:
  build:
    steps:
      - name: Install dependencies
        run: npm ci

      - name: Validate translations
        run: npm run i18n:validate

      - name: Build site
        run: npm run build

      - name: Test language routes
        run: npm run test:routes
```

### Content Management

- Migration script for content updates
- Translation validation in CI pipeline
- Content creator documentation
- Style guide for metadata usage

### Monitoring & Maintenance

- Translation coverage metrics
- 404 monitoring for language routes
- Performance monitoring
- User language preference analytics

## Future Enhancements

### Planned Features

- Additional language support (fr, es, it)
- Content translation workflow integration
- Advanced fallback strategies
- Language detection based on user preferences

### Technical Debt Considerations

- Regular dependency updates
- Performance optimization reviews
- Accessibility audit cycles
- Translation quality assurance

## Success Metrics

### Technical Metrics

- ✅ 100% existing content displays metadata badges
- ✅ 0 breaking changes to existing functionality
- ✅ <100ms additional page load time
- ✅ 95%+ translation coverage

### User Experience Metrics

- ✅ Seamless language switching
- ✅ Clear content origin indication
- ✅ Responsive design across devices
- ✅ Accessible to screen readers

### SEO Metrics

- ✅ Proper hreflang implementation
- ✅ International search visibility
- ✅ No duplicate content penalties
- ✅ Correct language targeting

## Known Issues & Fixes

### I18nextProvider Error

- Problem: Attempted to use <I18nextProvider> from astro-i18next, but this component does not exist. This caused a runtime error: "Unable to render I18nextProvider because it is undefined!"
- Solution: Remove I18nextProvider usage. Use astro-i18next integration and the useTranslation hook for i18n context in components. Astro-i18next automatically provides context via its integration.

### useTranslation Hook SSR Error

- Problem: The `useTranslation` hook from astro-i18next causes "(0 , **vite_ssr_import_1**.useTranslation) is not a function" error in Astro component frontmatter during SSR.
- Root Cause: astro-i18next hooks are designed for client-side usage and are not available in Astro's server-side rendering environment.
- Solution: Replace `useTranslation` hook with static translation loading using our custom `getTranslations` utility function. This approach:
  - Loads translations statically in component frontmatter
  - Works properly with Astro's SSR environment
  - Maintains type safety with our existing i18n utilities
  - Avoids runtime hook dependencies
- Components Fixed:
  - `LanguageSwitcher.astro`: Now uses `getTranslations(currentLanguage)` instead of `useTranslation()`
  - `ContentMetadata.astro`: Now uses static translation loading for timestamp formatting
  - `Badge.astro`: Simplified to use direct text prop instead of translation function
- Status: ✅ Fully resolved - All components render successfully without SSR errors

## Routing & LanguageSwitcher Implementation

- Content routes now use [lang=string] param and getStaticPaths for locale-aware generation.
- LanguageSwitcher component created and integrated into PageLayout.astro.
- LanguageSwitcher supports dropdown, flag, label, accessibility, and URL generation for language switching.
- LanguageSwitcher uses static translation loading instead of useTranslation hook to avoid SSR issues.
- [lang]/index.astro updated to use Astro frontmatter and correct export syntax.
- See todo.md and design.md for implementation details.

## Error Handling & Type Safety

- Explicitly type all function parameters and object keys.
- Use union types for i18n keys and runtime guards for variable indexing.
- Add global type declarations for missing modules (e.g., astro-i18next).
- Fix import paths for local modules to resolve not found errors.
- Document all fixes and rationale for future maintainability.

## UI Component i18n Integration

- All UI components (e.g., ContentMetadata, Badge) must receive translated strings via props.
- Translations are loaded statically in Astro frontmatter using getTranslations(language).
- No component should use hardcoded labels; always use translation keys from src/locales/en.json and de.json.
- Example pattern:
  - In ContentMetadata.astro, load translations and pass them to Badge.astro via the text prop.
  - In Badge.astro, display the text prop directly.
- This ensures SSR compatibility and maintainability.

## Lessons Learned (Component i18n)

- SSR in Astro requires static translation loading, not runtime hooks.
- Passing translated props is the most robust and type-safe approach.
- Document translation key clusters and update as features grow.
