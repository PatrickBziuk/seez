# Locale & Language Experience Improvements - Implementation Plan

**ID:** plan-10020  
**Status:** Ready for Implementation  
**Goal:** Implement robust, accessible, and SEO-friendly language detection and selection for seez.eu, eliminating client-side redirects and improving user experience.

## Executive Summary

This plan transforms the current client-side language detection approach into a server-side solution with proper fallbacks, SEO optimization, and enhanced content management. The implementation is structured in 5 phases to minimize risk and ensure systematic delivery.

---

## Phase 1: Foundation - Server-Side Language Detection

### Objectives

- Implement server-side language negotiation
- Replace client-side redirects with proper routing
- Establish basic language preference persistence

### Deliverables

#### 1.1 Astro Middleware Implementation

**File:** `src/middleware/language-detection.ts`

```typescript
import type { MiddlewareResponseHandler } from 'astro';

const SUPPORTED_LANGUAGES = ['de', 'en'] as const;
const DEFAULT_LANGUAGE = 'en';

export const onRequest: MiddlewareResponseHandler = async (context, next) => {
  const { url, request, redirect, cookies } = context;

  // Skip for API routes and assets
  if (url.pathname.startsWith('/api/') || url.pathname.includes('.')) {
    return next();
  }

  // Root path language detection
  if (url.pathname === '/') {
    const preferredLang = determineLanguage(
      request.headers.get('accept-language'),
      cookies.get('preferred_lang')?.value
    );

    if (preferredLang) {
      cookies.set('preferred_lang', preferredLang, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax',
        path: '/',
      });
      return redirect(`/${preferredLang}/`, 302);
    } else {
      // Show language selection page
      return next();
    }
  }

  return next();
};

function determineLanguage(acceptLanguage: string | null, cookiePreference?: string): string | null {
  // Cookie preference takes priority
  if (cookiePreference && SUPPORTED_LANGUAGES.includes(cookiePreference as any)) {
    return cookiePreference;
  }

  // Parse Accept-Language header
  if (acceptLanguage) {
    const languages = parseAcceptLanguage(acceptLanguage);
    for (const lang of languages) {
      const base = lang.split('-')[0].toLowerCase();
      if (SUPPORTED_LANGUAGES.includes(base as any)) {
        return base;
      }
    }
  }

  return null; // Show language selection page
}

function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((lang) => lang.split(';')[0].trim())
    .sort((a, b) => {
      const qA = parseFloat(header.match(new RegExp(`${a};q=([0-9.]+)`))?.[1] || '1');
      const qB = parseFloat(header.match(new RegExp(`${b};q=([0-9.]+)`))?.[1] || '1');
      return qB - qA;
    });
}
```

#### 1.2 Language Selection Page

**File:** `src/pages/index.astro`

```astro
---
// Language selection page for ambiguous cases
import Layout from '../layouts/BaseLayout.astro';

const title = 'Choose Language / Sprache wählen';
---

<Layout title={title} canonical="https://seez.eu/">
  <main class="language-selector">
    <div class="container">
      <h1>Welcome to Seez / Willkommen bei Seez</h1>
      <p>Please choose your preferred language / Bitte wählen Sie Ihre bevorzugte Sprache:</p>

      <div class="language-options">
        <a href="/de/" class="language-link" data-lang="de">
          <span class="flag">🇩🇪</span>
          <span class="text">Deutsch</span>
        </a>
        <a href="/en/" class="language-link" data-lang="en">
          <span class="flag">🇬🇧</span>
          <span class="text">English</span>
        </a>
      </div>

      <label class="remember-choice">
        <input type="checkbox" id="remember" checked />
        Remember my choice / Auswahl merken
      </label>
    </div>
  </main>

  <script>
    document.querySelectorAll('.language-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (document.getElementById('remember')?.checked) {
          const lang = e.currentTarget.getAttribute('data-lang');
          document.cookie = `preferred_lang=${lang}; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax`;
        }
      });
    });
  </script>

  <style>
    .language-selector {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .language-options {
      display: flex;
      gap: 2rem;
      margin: 2rem 0;
      justify-content: center;
    }

    .language-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
    }

    .language-link:hover {
      border-color: #007acc;
      transform: translateY(-2px);
    }

    .flag {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }

    .text {
      font-size: 1.2rem;
      font-weight: 600;
    }

    .remember-choice {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 2rem;
      justify-content: center;
    }
  </style>
</Layout>
```

#### 1.3 Configuration Updates

**File:** `astro.config.ts`

```typescript
export default defineConfig({
  site: 'https://seez.eu',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
```

### Acceptance Criteria

- [ ] Requests with `Accept-Language: de` redirect to `/de/`
- [ ] Requests with `Accept-Language: en` redirect to `/en/`
- [ ] Ambiguous language headers show selection page
- [ ] Language selection persists via cookie
- [ ] No JavaScript required for basic functionality
- [ ] 302 redirects are properly handled

---

## Phase 2: Content Structure & Routing

### Objectives

- Establish proper multilingual routing
- Implement content collection schema
- Create language-aware navigation

### Deliverables

#### 2.1 Content Collections Schema

**File:** `src/content/config.ts`

```typescript
import { defineCollection, z } from 'astro:content';

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
});

export const collections = {
  books: defineCollection({ schema: sharedSchema }),
  projects: defineCollection({ schema: sharedSchema }),
  lab: defineCollection({ schema: sharedSchema }),
  life: defineCollection({ schema: sharedSchema }),
  pages: defineCollection({ schema: sharedSchema }),
};
```

#### 2.2 Dynamic Routing Setup

**File:** `src/pages/[locale]/[...slug].astro`

```astro
---
import { getCollection, getEntry } from 'astro:content';
import Layout from '../../layouts/MarkdownLayout.astro';

export async function getStaticPaths() {
  const allContent = await Promise.all([
    getCollection('books'),
    getCollection('projects'),
    getCollection('lab'),
    getCollection('life'),
    getCollection('pages'),
  ]);

  const paths = [];

  for (const collection of allContent) {
    for (const entry of collection) {
      paths.push({
        params: {
          locale: entry.data.language,
          slug: `${entry.collection}/${entry.slug}`,
        },
        props: { entry },
      });
    }
  }

  return paths;
}

const { entry } = Astro.props;
const { Content } = await entry.render();
---

<Layout frontmatter={entry.data} entry={entry}>
  <Content />
</Layout>
```

### Acceptance Criteria

- [ ] All content accessible via `/[locale]/[collection]/[slug]` pattern
- [ ] Content collections properly typed and validated
- [ ] Language-specific content correctly routed
- [ ] Slug generation works automatically

---

## Phase 3: SEO Optimization & Metadata

### Objectives

- Implement comprehensive SEO metadata
- Add hreflang support
- Create automated canonical URL generation
- Integrate Git-based metadata extraction

### Deliverables

#### 3.1 Central SEO Component

**File:** `src/components/core/SEO.astro`

```astro
---
interface Props {
  title: string;
  description?: string;
  canonical?: string;
  locale?: string;
  alternateLocales?: { locale: string; url: string }[];
  publishDate?: Date;
  modifiedDate?: Date;
  type?: 'website' | 'article';
}

const {
  title,
  description,
  canonical,
  locale = 'en',
  alternateLocales = [],
  publishDate,
  modifiedDate,
  type = 'website',
} = Astro.props;

const site = Astro.site?.href || 'https://seez.eu';
const canonicalUrl = canonical || new URL(Astro.url.pathname, site).href;
const fullTitle = title.includes('Seez') ? title : `${title} | Seez`;
---

<!-- Primary Meta Tags -->
<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalUrl} />

<!-- Language alternates -->
{alternateLocales.map(({ locale: altLocale, url }) => <link rel="alternate" hreflang={altLocale} href={url} />)}
<link rel="alternate" hreflang="x-default" href={canonicalUrl} />

<!-- Open Graph -->
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonicalUrl} />
<meta property="og:type" content={type} />
<meta property="og:locale" content={locale} />

<!-- Article-specific metadata -->
{publishDate && <meta property="article:published_time" content={publishDate.toISOString()} />}
{modifiedDate && <meta property="article:modified_time" content={modifiedDate.toISOString()} />}

<!-- JSON-LD Structured Data -->
<script
  type="application/ld+json"
  set:html={JSON.stringify({
    '@context': 'https://schema.org',
    '@type': type === 'article' ? 'Article' : 'WebSite',
    headline: title,
    description,
    url: canonicalUrl,
    datePublished: publishDate?.toISOString(),
    dateModified: modifiedDate?.toISOString() || publishDate?.toISOString(),
    author: {
      '@type': 'Person',
      name: 'Patrick seez',
    },
  })}
/>
```

#### 3.2 Git Metadata Extraction Script

**File:** `scripts/extract-git-metadata.ts`

```typescript
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { glob } from 'glob';
import { dirname } from 'path';

interface GitMetadata {
  [filePath: string]: {
    publishDate: string;
    modifiedDate: string;
  };
}

async function extractGitMetadata() {
  const contentFiles = glob.sync('src/content/**/*.{md,mdx}');
  const metadata: GitMetadata = {};

  for (const file of contentFiles) {
    try {
      // Get first commit date (publish date)
      const firstCommit = execSync(`git log --reverse --format=%cI --follow -- "${file}" | head -n1`, {
        encoding: 'utf8',
      }).trim();

      // Get last commit date (modified date)
      const lastCommit = execSync(`git log -1 --format=%cI -- "${file}"`, { encoding: 'utf8' }).trim();

      if (firstCommit && lastCommit) {
        metadata[file] = {
          publishDate: firstCommit,
          modifiedDate: lastCommit,
        };
      }
    } catch (error) {
      console.warn(`Could not extract git metadata for ${file}:`, error);
    }
  }

  // Ensure the directory exists
  const outputPath = 'src/generated/git-metadata.json';
  mkdirSync(dirname(outputPath), { recursive: true });

  writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`Extracted metadata for ${Object.keys(metadata).length} files`);
}

extractGitMetadata().catch(console.error);
```

#### 3.3 Layout Enhancement

**File:** `src/layouts/MarkdownLayout.astro`

```astro
---
import SEO from '../components/core/SEO.astro';
import BaseLayout from './BaseLayout.astro';

const { frontmatter, entry } = Astro.props;
const filePath = `src/content/${entry.collection}/${entry.id}`;

// Try to import git metadata, fallback to empty object if file doesn't exist
let gitMetadata = {};
try {
  gitMetadata = await import('../generated/git-metadata.json');
} catch (error) {
  console.warn('Git metadata not found, using frontmatter dates only');
}

const gitData = gitMetadata[filePath];

// Combine frontmatter dates with git dates
const publishDate = frontmatter.publishDate || (gitData?.publishDate ? new Date(gitData.publishDate) : undefined);
const modifiedDate = frontmatter.modifiedDate || (gitData?.modifiedDate ? new Date(gitData.modifiedDate) : undefined);

// Generate alternate language URLs
const alternateLocales = [];
if (frontmatter.language === 'de') {
  alternateLocales.push({ locale: 'en', url: `https://seez.eu/en/${entry.collection}/${entry.slug}/` });
} else {
  alternateLocales.push({ locale: 'de', url: `https://seez.eu/de/${entry.collection}/${entry.slug}/` });
}
---

<BaseLayout>
  <SEO
    title={frontmatter.title}
    description={frontmatter.description}
    locale={frontmatter.language}
    alternateLocales={alternateLocales}
    publishDate={publishDate}
    modifiedDate={modifiedDate}
    type="article"
  />

  <slot />
</BaseLayout>
```

### Acceptance Criteria

- [ ] All pages have proper canonical URLs
- [ ] hreflang tags correctly reference language variants
- [ ] Git-based publish/modified dates are extracted and used
- [ ] JSON-LD structured data is present
- [ ] Open Graph metadata is complete

---

## Phase 4: Content Management & Internal Linking

### Objectives

- Implement automated slug generation and validation
- Create robust internal linking system
- Establish evergreen content structure
- Build tag-based content discovery

### Deliverables

#### 4.1 Slug Utility Functions

**File:** `src/utils/content.ts`

```typescript
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function generateSlug(title: string, id?: string): string {
  const normalizedTitle = normalizeSlug(title);
  return id ? `${id}/${normalizedTitle}` : normalizedTitle;
}

export function validateUniquenesss(slugs: string[]): string[] {
  const seen = new Set();
  const duplicates = [];

  for (const slug of slugs) {
    if (seen.has(slug)) {
      duplicates.push(slug);
    } else {
      seen.add(slug);
    }
  }

  return duplicates;
}
```

#### 4.2 Content Validation Script

**File:** `scripts/validate-content.ts`

```typescript
import { getCollection } from 'astro:content';
import { validateUniquenesss, normalizeSlug } from '../src/utils/content.js';

async function validateContent() {
  const collections = ['books', 'projects', 'lab', 'life', 'pages'];
  const allSlugs: string[] = [];
  const issues: string[] = [];

  for (const collectionName of collections) {
    try {
      const entries = await getCollection(collectionName);

      for (const entry of entries) {
        const { data, slug, id } = entry;

        // Check for required fields
        if (!data.title) {
          issues.push(`${collectionName}/${id}: Missing title`);
        }

        if (!data.description) {
          issues.push(`${collectionName}/${id}: Missing description`);
        }

        // Validate slug format
        const expectedSlug = normalizeSlug(data.slug || data.title);
        if (slug !== expectedSlug) {
          issues.push(`${collectionName}/${id}: Slug mismatch. Expected: ${expectedSlug}, Got: ${slug}`);
        }

        allSlugs.push(`${data.language}/${collectionName}/${slug}`);
      }
    } catch (error) {
      console.warn(`Could not validate collection ${collectionName}:`, error);
    }
  }

  // Check for duplicate slugs
  const duplicates = validateUniquenesss(allSlugs);
  if (duplicates.length > 0) {
    issues.push(`Duplicate slugs found: ${duplicates.join(', ')}`);
  }

  if (issues.length > 0) {
    console.error('Content validation failed:');
    issues.forEach((issue) => console.error(`  - ${issue}`));
    process.exit(1);
  } else {
    console.log('✅ Content validation passed');
  }
}

validateContent().catch(console.error);
```

#### 4.3 Related Content Component

**File:** `src/components/content/RelatedContent.astro`

```astro
---
import { getCollection } from 'astro:content';

interface Props {
  currentEntry: any;
  maxItems?: number;
}

const { currentEntry, maxItems = 3 } = Astro.props;

// Find related content based on tags and collection
const allContent = await getCollection(currentEntry.collection);
const related = allContent
  .filter((entry) => entry.id !== currentEntry.id && entry.data.language === currentEntry.data.language)
  .map((entry) => ({
    entry,
    score: calculateRelatedness(currentEntry.data.tags, entry.data.tags),
  }))
  .filter((item) => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxItems);

function calculateRelatedness(tags1: string[], tags2: string[]): number {
  const set1 = new Set(tags1);
  const set2 = new Set(tags2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  return intersection.size;
}
---

{
  related.length > 0 && (
    <aside class="related-content">
      <h3>Related Content</h3>
      <ul>
        {related.map(({ entry }) => (
          <li>
            <a href={`/${entry.data.language}/${entry.collection}/${entry.slug}/`}>{entry.data.title}</a>
            <p class="related-description">{entry.data.description}</p>
          </li>
        ))}
      </ul>
    </aside>
  )
}

<style>
  .related-content {
    margin-top: 2rem;
    padding: 1.5rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
  }

  .related-content h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .related-content ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .related-content li {
    margin-bottom: 1rem;
  }

  .related-content a {
    font-weight: 600;
    text-decoration: none;
    color: #007acc;
  }

  .related-content a:hover {
    text-decoration: underline;
  }

  .related-description {
    margin: 0.25rem 0 0 0;
    font-size: 0.9rem;
    color: #666;
  }
</style>
```

### Acceptance Criteria

- [ ] All content has normalized, validated slugs
- [ ] Related content suggestions work based on tags
- [ ] Content validation runs in CI/CD pipeline
- [ ] Internal links are properly formatted and functional

---

## Phase 5: Deployment & Monitoring

### Objectives

- Remove legacy client-side redirect code
- Implement feature flags for gradual rollout
- Set up monitoring and analytics
- Establish performance baselines

### Deliverables

#### 5.1 GitHub Actions Workflow

**File:** `.github/workflows/release.yml`

```yaml
name: Release Build & Deploy

on:
  push:
    branches: [release]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Need full history for git metadata

      - uses: pnpm/action-setup@v2
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Extract Git metadata
        run: pnpm run extract:git-metadata

      - name: Validate content
        run: pnpm run validate:content

      - name: Sync Astro content
        run: pnpm astro sync

      - name: Build site
        run: pnpm build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
```

#### 5.2 Feature Flag Implementation

**File:** `src/utils/features.ts`

```typescript
export const FEATURE_FLAGS = {
  SERVER_SIDE_LANGUAGE_DETECTION: true,
  LEGACY_CLIENT_REDIRECT: false,
  ENHANCED_SEO: true,
  GIT_METADATA: true,
} as const;

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}
```

#### 5.3 Analytics Integration

**File:** `src/components/core/Analytics.astro`

```astro
---
const { event, language, source } = Astro.props;
---

<script define:vars={{ event, language, source }}>
  // Track language detection events
  if (typeof gtag !== 'undefined') {
    gtag('event', 'language_selection', {
      method: source, // 'auto_detected', 'manual_selection', 'cookie'
      language: language,
      page_path: window.location.pathname,
    });
  }
</script>
```

#### 5.4 Package.json Scripts

**File:** `package.json` (additions)

```json
{
  "scripts": {
    "extract:git-metadata": "tsx scripts/extract-git-metadata.ts",
    "validate:content": "tsx scripts/validate-content.ts",
    "lint:content": "pnpm validate:content",
    "dev:full": "pnpm extract:git-metadata && pnpm astro sync && pnpm dev"
  }
}
```

### Acceptance Criteria

- [ ] Legacy client-side redirect code is removed
- [ ] Feature flags allow controlled rollout
- [ ] Analytics track language detection events
- [ ] CI/CD pipeline includes all validation steps
- [ ] Performance monitoring is in place

---

## Risk Mitigation & Testing Strategy

### Identified Risks

1. **Caching Issues**
   - Risk: CDN/browser caching serves wrong language to users
   - Mitigation: Implement cache-busting for language-sensitive routes
   - Testing: Verify with different cache scenarios

2. **SEO Disruption**
   - Risk: Incorrect canonical URLs or missing hreflang
   - Mitigation: Comprehensive SEO validation in CI/CD
   - Testing: Google Search Console monitoring

3. **Fallback Failures**
   - Risk: Non-JS users get stuck on language selection
   - Mitigation: Progressive enhancement with working no-JS flow
   - Testing: Manual testing with JavaScript disabled

### Testing Checklist

#### Automated Tests

- [ ] Unit tests for language detection logic
- [ ] Integration tests for routing behavior
- [ ] SEO metadata validation
- [ ] Content schema validation
- [ ] Slug uniqueness verification

#### Manual Testing Scenarios

- [ ] Different Accept-Language headers
- [ ] Cookie preference persistence
- [ ] No-JavaScript functionality
- [ ] Language switching behavior
- [ ] Deep linking to specific languages
- [ ] Mobile device compatibility

#### Performance Monitoring

- [ ] Core Web Vitals tracking
- [ ] Language detection timing
- [ ] Redirect performance impact
- [ ] Search engine crawl efficiency

---

## Success Metrics

### User Experience

- Reduction in language-related bounce rate
- Increased engagement on correct language content
- Decreased time to meaningful content

### Technical

- Elimination of client-side redirect delays
- Improved Core Web Vitals scores
- Reduced server response time for language detection

### SEO

- Proper indexing of both language variants
- No duplicate content warnings
- Improved search visibility for non-English content
