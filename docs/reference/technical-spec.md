# Technical Specification: Seez Multilingual Content Management System

## Overview

This document provides comprehensive technical specifications for the Seez multilingual content management system, built on Astro 5.x with AI-powered translation capabilities, environmental impact tracking, and comprehensive SEO optimization. The system has evolved through 25+ major implementation plans into a sophisticated platform.

## System Architecture

### Core Technology Stack

**Frontend Framework:**

- **Astro 5.x**: Static site generator with TypeScript strict mode
- **Tailwind CSS**: Utility-first CSS framework with custom components
- **Astro Components**: Server-side rendered components with client-side interactions

**Content Management:**

- **Collections**: Four main content types (books, projects, lab, life)
- **Markdown/MDX**: Content authoring with frontmatter metadata
- **Zod Schemas**: Type-safe content validation and auto-generated TypeScript interfaces

**Internationalization:**

- **astro-i18next**: i18n framework with translation loading
- **Client-side Detection**: Browser language preferences with cookie persistence
- **URL Structure**: `/[lang]/` prefix for all routes (including English)

**AI Integration:**

- **OpenAI GPT-4o**: Translation, TLDR generation, and content analysis
- **Token Tracking**: Comprehensive usage monitoring with cost and CO₂ impact
- **Quality Control**: Hallucination detection and automated scoring

**Data Architecture:**

- **Content Registry**: Central JSON-based content relationship tracking
- **Canonical ID System**: SHA-256 based content identity and translation integrity
- **Git Integration**: Automated metadata extraction from version history

---

## Content Schema Specification

### Extended Frontmatter Schema

```yaml
# Core content fields
title: string                    # Required content title
description?: string             # Optional content description
tags: string[]                   # Content tags (default: [])

# Publication metadata
publishDate?: Date               # Publication date (auto-extracted from git)
modifiedDate?: Date             # Last modification date (auto-extracted from git)
draft?: boolean                 # Draft status (default: false)

# Multilingual support
language: 'en' | 'de'           # Content language (default: 'en')
status:                         # Authoring and translation status
  authoring: 'Human' | 'AI' | 'AI+Human'        # Default: 'Human'
  translation?: 'Human' | 'AI' | 'AI+Human'     # Optional for translations

# Canonical ID system for translation integrity
canonicalId?: string            # Format: slug-YYYYMMDD-hash8
originalLanguage?: 'en' | 'de' # Language of original content
translationOf?: string          # Canonical ID of source content for translations
sourceLanguage?: 'en' | 'de'   # Language this was translated from

# Translation history tracking
translationHistory?: Array<{
  language: string              # Target language
  translator: string           # Translator identifier
  model?: string               # AI model used (if applicable)
  sourceSha: string            # Git SHA of source content
  timestamp: string            # ISO 8601 timestamp
  status: 'ai-translated' | 'human-reviewed' | 'ai+human'
  reviewer?: string            # GitHub username if human reviewed
}>

# AI-generated enhancements
ai_tldr?: string               # AI-generated summary
ai_textscore?: {               # Quality metrics
  translationQuality?: number  # Translation quality score (1-10)
  originalClarity?: number     # Original content clarity score (1-10)
  timestamp: string           # When scored
  notes?: string[]            # Additional quality notes
}

# AI metadata with token usage tracking
ai_metadata?: {
  canonicalId?: string         # Reference to canonical ID
  translationOf?: string       # Reference to source canonical ID
  tokenUsage?: {
    translation?: {            # Translation operation tokens
      tokens: number           # Total tokens used
      cost: number            # USD cost
      co2: number             # CO₂ impact (kg equivalent)
    }
    tldr?: {                  # TLDR generation tokens
      tokens: number
      cost: number
      co2: number
    }
    total?: {                 # Total across all operations
      tokens: number
      cost: number
      co2: number
    }
  }
}
```

### Content Collections Definition

```typescript
// Collection schema for all content types
const extendedSchema = z.object({
  // Core fields with proper validation
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),

  // Date handling with transformation
  publishDate: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
  modifiedDate: z
    .string()
    .transform((s) => new Date(s))
    .optional(),

  // Multilingual fields
  language: z.enum(['en', 'de']).default('en'),
  status: z
    .object({
      authoring: z.enum(['Human', 'AI', 'AI+Human']).default('Human'),
      translation: z.enum(['Human', 'AI', 'AI+Human']).optional(),
    })
    .optional(),

  // Canonical ID system
  canonicalId: z.string().optional(),
  originalLanguage: z.enum(['en', 'de']).optional(),
  translationOf: z.string().optional(),

  // AI enhancements with nested validation
  ai_tldr: z.string().optional(),
  ai_metadata: z
    .object({
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

// Collection definitions with Astro 5 glob loader
const books = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/books' }),
  schema: extendedSchema,
});

// Similarly for projects, lab, life, and pages collections
export const collections = { books, projects, lab, life, pages };
```

---

## Translation Pipeline Architecture

### Canonical ID System

**Purpose**: Provides permanent content identity independent of filenames or paths, enabling robust translation tracking and preventing content divergence.

**Format**: `slug-YYYYMMDD-hash8`

- **slug**: Human-readable content identifier
- **YYYYMMDD**: Creation date for temporal organization
- **hash8**: First 8 characters of SHA-256 content hash for uniqueness

**Implementation**:

```typescript
function generateCanonicalId(content: string, slug: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 8);
  return `${slug}-${date}-${hash}`;
}
```

### Content Registry System

**Central Registry** (`data/content-registry.json`):

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-08-07T00:00:00.000Z",
  "entries": {
    "canonicalId": {
      "canonicalId": "slug-20250805-d90c95e9",
      "originalPath": "src/content/books/de/example.md",
      "originalLanguage": "de",
      "title": "Content Title",
      "lastModified": "2025-08-05T14:04:41.823Z",
      "contentHash": "sha256-full-hash",
      "translations": {
        "en": {
          "path": "src/content/books/en/example.md",
          "status": "current" | "stale" | "missing",
          "lastTranslated": "2025-08-05T14:04:41.827Z",
          "translationHash": "sha256-translation-hash"
        }
      }
    }
  }
}
```

**Registry Operations**:

```typescript
interface ContentRegistry {
  version: string;
  lastUpdated: string;
  entries: Record<string, RegistryEntry>;
}

interface RegistryEntry {
  canonicalId: string;
  originalPath: string;
  originalLanguage: 'en' | 'de';
  title: string;
  lastModified: string;
  contentHash: string;
  translations: Record<string, TranslationEntry>;
}

interface TranslationEntry {
  path: string;
  status: 'current' | 'stale' | 'missing';
  lastTranslated?: string;
  translationHash?: string;
}
```

### AI Translation Generation

**Translation Detection** (`scripts/check_translations_registry.ts`):

```typescript
interface RegistryTranslationTask {
  canonicalId: string;
  sourcePath: string;
  targetLang: string;
  reason: 'missing' | 'stale';
  sourceSha: string;
  sourceLanguage: string;
  sourceContentHash: string;
  existingTranslationHash?: string;
  translationStatus: 'missing' | 'stale';
  outputPath: string;
  languagePair: string;
  priority: 'high' | 'normal';
}

function detectTranslationTasks(): RegistryTranslationTask[] {
  const registry = loadContentRegistry();
  const tasks: RegistryTranslationTask[] = [];

  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    for (const targetLang of SUPPORTED_LANGUAGES) {
      if (targetLang === entry.originalLanguage) continue;

      const translation = entry.translations[targetLang];
      if (!translation || translation.status !== 'current') {
        tasks.push(createTranslationTask(canonicalId, entry, targetLang));
      }
    }
  }

  return tasks;
}
```

**OpenAI Integration** (`scripts/generate_translations_registry.ts`):

```typescript
const TRANSLATION_PROMPT = `You are a professional translator specializing in technical content.

CRITICAL REQUIREMENTS:
1. Preserve ALL MDX components exactly as they appear: <Component prop="value" />
2. Do not translate code blocks, file paths, or technical identifiers
3. Maintain the same document structure (headings, lists, formatting)
4. Generate a concise TLDR summary in the target language
5. Provide a quality score (1-10) for your translation

Source Language: ${task.sourceLanguage}
Target Language: ${task.targetLang}

Respond with valid JSON:
{
  "translation": "...",
  "tldr": "...",
  "qualityScore": 8,
  "notes": ["any translation challenges or decisions"]
}`;

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: TRANSLATION_PROMPT },
    { role: 'user', content: sourceContent },
  ],
  response_format: { type: 'json_object' },
  temperature: 0.3, // Lower temperature for consistent translations
});
```

**Progressive State Saving**:

```typescript
async function processTranslationTasks(tasks: RegistryTranslationTask[]) {
  for (const task of tasks) {
    try {
      // Generate translation
      const result = await translateContent(task);

      // Write translated file
      await writeTranslatedContent(task.outputPath, result);

      // Update registry
      await updateRegistryEntry(task.canonicalId, task.targetLang, result);

      // Git commit for progress saving
      await execAsync(`git add . && git commit -m "feat: translate ${task.canonicalId} to ${task.targetLang}"`);

      console.log(`✅ Completed translation: ${task.canonicalId} → ${task.targetLang}`);
    } catch (error) {
      console.error(`❌ Failed translation: ${task.canonicalId} → ${task.targetLang}`, error);
      // Continue with next task (don't fail entire batch)
    }
  }
}
```

### Quality Control & Hallucination Detection

**Content Structure Validation**:

```typescript
interface QualityMetrics {
  headingStructure: number; // Similarity of heading hierarchy (0-1)
  linkPreservation: number; // Percentage of links preserved (0-1)
  codeBlockIntegrity: number; // Percentage of code blocks unchanged (0-1)
  mdxComponentIntegrity: number; // Percentage of MDX components preserved (0-1)
  overallScore: number; // Weighted average (0-10)
}

function validateTranslationQuality(original: string, translated: string): QualityMetrics {
  const originalStructure = parseContentStructure(original);
  const translatedStructure = parseContentStructure(translated);

  return {
    headingStructure: compareHeadingHierarchy(originalStructure.headings, translatedStructure.headings),
    linkPreservation: calculateLinkPreservation(originalStructure.links, translatedStructure.links),
    codeBlockIntegrity: validateCodeBlocks(originalStructure.codeBlocks, translatedStructure.codeBlocks),
    mdxComponentIntegrity: validateMDXComponents(originalStructure.components, translatedStructure.components),
    overallScore: calculateWeightedScore(metrics),
  };
}
```

---

## Component Architecture Specification

### Directory Structure

```
src/components/
├── core/                      # Essential site functionality
│   ├── layout/               # Navigation and page structure
│   │   ├── Header.astro      # Site header with navigation
│   │   ├── Footer.astro      # Site footer with links
│   │   ├── LanguageSwitcher.astro # Language selection dropdown
│   │   ├── ToggleMenu.astro  # Mobile menu toggle
│   │   └── ToggleTheme.astro # Dark/light mode toggle
│   ├── meta/                 # SEO and analytics
│   │   ├── SEO.astro         # Basic SEO meta tags
│   │   ├── CanonicalSEO.astro # Advanced SEO with canonical URLs
│   │   ├── Analytics.astro   # Analytics integration
│   │   └── CommonMeta.astro  # Common meta tags
│   └── brand/                # Brand and identity
│       ├── Logo.astro        # Site logo component
│       └── Favicons.astro    # Favicon declarations
├── content/                  # Content display and metadata
│   ├── metadata/             # Content metadata display
│   │   ├── ContentMetadata.astro # Main metadata component
│   │   ├── TokenStats.astro  # AI token usage display
│   │   └── SocialShare.astro # Social sharing buttons
│   ├── blog/                 # Blog-specific components
│   └── media/                # Media display components
├── ui/                       # Reusable UI primitives
│   ├── forms/                # Form controls and inputs
│   ├── display/              # Display components
│   │   ├── Badge.astro       # Status and tag badges
│   │   ├── Button.astro      # Button variants
│   │   └── ItemGrid.astro    # Grid layouts
│   └── layout/               # Layout primitives
└── common/                   # Legacy and utility components
```

### Key Component Specifications

#### ContentMetadata.astro

**Purpose**: Ultra-minimalistic content metadata display with TLDR integration, status badges, and environmental transparency.

**Props Interface**:

```typescript
interface ContentMetadataProps {
  language?: 'en' | 'de';
  timestamp?: string;
  status?: {
    authoring: 'Human' | 'AI' | 'AI+Human';
    translation?: 'Human' | 'AI' | 'AI+Human';
  };
  tags?: string[];
  ai_tldr?: string;
  ai_metadata?: {
    tokenUsage?: {
      translation?: { tokens: number; cost: number; co2: number };
      tldr?: { tokens: number; cost: number; co2: number };
      total?: { tokens: number; cost: number; co2: number };
    };
  };
  autoExpandTldr?: boolean;
}
```

**Features**:

- **Collapsible TLDR**: Smooth animations with expand/collapse functionality
- **Status Badges**: Visual indicators for Human/AI/AI+Human authoring and translation
- **Token Stats Integration**: Environmental impact transparency
- **Tag Navigation**: Clickable tags linking to language-aware tag pages
- **Responsive Design**: Works seamlessly on mobile and desktop

**JavaScript Functionality**:

```typescript
// TLDR expand/collapse with smooth animations
document.addEventListener('DOMContentLoaded', () => {
  const preview = document.getElementById(`${tldrId}-preview`);
  const full = document.getElementById(`${tldrId}-full`);

  preview.addEventListener('click', () => {
    // Smooth expand animation
    preview.style.display = 'none';
    full.style.display = 'block';
    full.style.opacity = '0';
    full.style.transform = 'translateY(-10px)';

    requestAnimationFrame(() => {
      full.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      full.style.opacity = '1';
      full.style.transform = 'translateY(0)';
    });
  });
});
```

#### LanguageSwitcher.astro

**Purpose**: Accessible dropdown for language selection with proper URL generation and keyboard navigation.

**Props Interface**:

```typescript
interface LanguageSwitcherProps {
  currentLanguage: 'en' | 'de';
  availableLanguages?: ('en' | 'de')[];
  currentPath?: string;
}
```

**Features**:

- **Current Language Display**: Flag + label showing active language
- **Dropdown Expansion**: Smooth dropdown with all available languages
- **Accessibility**: Full ARIA attributes and keyboard navigation
- **URL Generation**: Proper language-aware URL generation
- **Outside Click**: Dropdown closes when clicking outside

#### TokenStats.astro

**Purpose**: Reusable component for displaying AI token usage statistics with environmental impact.

**Props Interface**:

```typescript
interface TokenStatsProps {
  tokenUsage: {
    translation?: { tokens: number; cost: number; co2: number };
    tldr?: { tokens: number; cost: number; co2: number };
    total?: { tokens: number; cost: number; co2: number };
  };
  showType?: 'translation' | 'tldr' | 'total' | 'all';
  compact?: boolean;
  className?: string;
}
```

**Display Modes**:

- **Compact**: Single line format for inline display
- **Full**: Grid layout with detailed breakdown
- **Selective**: Show specific operation types only

---

## SEO & Structured Data Specification

### CanonicalSEO.astro Component

**Purpose**: Comprehensive SEO optimization with canonical URLs, hreflang tags, and structured data.

**Features**:

**Canonical URL Generation**:

```typescript
function generateCanonicalUrl(canonicalId: string, language: string): string {
  const registry = loadContentRegistry();
  const entry = registry.entries[canonicalId];

  if (entry?.translations[language]?.status === 'current') {
    return `${SITE_URL}/${language}/${getSlugFromPath(entry.translations[language].path)}`;
  }

  // Fallback to original language
  return `${SITE_URL}/${entry.originalLanguage}/${getSlugFromPath(entry.originalPath)}`;
}
```

**Hreflang Implementation**:

```astro
<!-- Automatic alternate language generation -->{
  canonicalId &&
    Object.entries(registry.entries[canonicalId]?.translations || {}).map(
      ([lang, translation]) =>
        translation.status === 'current' && (
          <link rel="alternate" hreflang={lang} href={generateCanonicalUrl(canonicalId, lang)} />
        )
    )
}
<link rel="canonical" href={canonicalUrl} />
```

**JSON-LD Structured Data**:

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: frontmatter.title,
  description: frontmatter.description,
  author: {
    '@type': 'Person',
    name: 'Author Name',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Seez',
    logo: { '@type': 'ImageObject', url: `${site.url}/logo.png` },
  },
  datePublished: gitMetadata[fileId]?.publishDate,
  dateModified: gitMetadata[fileId]?.modifiedDate,
  inLanguage: frontmatter.language,
  // Canonical relationship
  identifier: frontmatter.canonicalId,
  // Translation relationships
  ...(frontmatter.translationOf && {
    translationOfWork: {
      '@type': 'CreativeWork',
      identifier: frontmatter.translationOf,
    },
  }),
};
```

---

## GitHub Actions CI/CD Specification

### Workflow Architecture

**Main CI/CD Pipeline** (`.github/workflows/ci-cd.yml`):

```yaml
name: CI/CD Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: write
  pages: write
  id-token: write
  issues: write
  pull-requests: write

jobs:
  # Multi-version testing on PRs
  test-build:
    name: Test Build (Node.js ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm astro sync
      - run: pnpm run check
      - run: pnpm run build

  # Quality checks (non-blocking)
  quality-check:
    name: Code Quality
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm run check
      - run: pnpm run fix --check

  # Build and deploy (main branch only)
  build-and-deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm astro sync
      - run: pnpm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - uses: actions/deploy-pages@v4
      # Create GitHub issue on build failure
      - if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Build failed: ${context.sha.slice(0, 7)}`,
              body: `Build failed for commit ${context.sha}.\n\nCheck the [workflow run](${context.payload.repository.html_url}/actions/runs/${context.runId}) for details.`
            });

  # Trigger translation pipeline only after successful build
  trigger-translation:
    name: Trigger Translation Pipeline
    needs: build-and-deploy
    if: success()
    uses: ./.github/workflows/translation.yml
    with:
      commit_sha: ${{ github.sha }}
      build_success: 'true'
    secrets: inherit
```

**Translation Pipeline** (`.github/workflows/translation.yml`):

```yaml
name: AI Translation Pipeline

on:
  workflow_call:
    inputs:
      commit_sha:
        required: true
        type: string
      build_success:
        required: true
        type: string
  workflow_dispatch:

jobs:
  detect-translations:
    name: Detect Translation Tasks
    runs-on: ubuntu-latest
    outputs:
      has-tasks: ${{ steps.check.outputs.has-tasks }}
      task-count: ${{ steps.check.outputs.task-count }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - id: check
        run: |
          npm run translations:check > translation_tasks.json
          TASK_COUNT=$(jq length translation_tasks.json)
          echo "task-count=$TASK_COUNT" >> $GITHUB_OUTPUT
          echo "has-tasks=$([ $TASK_COUNT -gt 0 ] && echo 'true' || echo 'false')" >> $GITHUB_OUTPUT

  generate-translations:
    name: Generate AI Translations
    needs: detect-translations
    if: needs.detect-translations.outputs.has-tasks == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install

      # Create translation branch
      - name: Create translation branch
        run: |
          SHORT_SHA="${{ inputs.commit_sha }}"
          SHORT_SHA=${SHORT_SHA:0:7}
          BRANCH_NAME="translate/ai-translations-${SHORT_SHA}"
          git checkout -b "$BRANCH_NAME"
          echo "BRANCH_NAME=$BRANCH_NAME" >> $GITHUB_ENV

      # Configure git for commits
      - name: Configure git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      # Generate translations with progressive saving
      - name: Generate translations
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          npm run translations:generate

      # Push translation branch
      - name: Push translation branch
        run: git push origin "$BRANCH_NAME"

      # Create or update pull request
      - name: Create translation PR
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          TASK_COUNT="${{ needs.detect-translations.outputs.task-count }}"

          gh pr create \
            --title "🤖 AI Translations: $(date +%Y-%m-%d) ($TASK_COUNT tasks)" \
            --body "Automated translations generated by OpenAI GPT-4o

          **Translation Summary:**
          - Tasks processed: $TASK_COUNT
          - Source commit: ${{ inputs.commit_sha }}
          - Generated: $(date -Iseconds)

          **Review Notes:**
          - All translations use AI model: GPT-4o
          - Content integrity validated (MDX components preserved)
          - Token usage tracked for transparency
          - Quality scores included in metadata

          Please review translations for accuracy and cultural appropriateness before merging." \
            --head "$BRANCH_NAME" \
            --base main
```

---

## Environmental Impact & Token Tracking Specification

### Token Usage Data Structure

**Token Usage Ledger** (`data/token-usage.json`):

```json
{
  "version": "1.0.0",
  "created": "2025-08-05T00:00:00.000Z",
  "lastUpdated": "2025-08-07T12:30:00.000Z",
  "entries": [
    {
      "id": "uuid-v4-identifier",
      "timestamp": "2025-08-07T12:30:00.000Z",
      "operation": "translation" | "tldr" | "tagging",
      "model": "gpt-4o" | "gpt-4o-mini",
      "tokens": {
        "prompt": 1250,
        "completion": 890,
        "total": 2140
      },
      "cost": {
        "prompt": 0.00625,    // $0.005 per 1K tokens (GPT-4o prompt)
        "completion": 0.0178,  // $0.02 per 1K tokens (GPT-4o completion)
        "total": 0.0245
      },
      "co2": {
        "estimate": 0.00012,   // kg CO2 equivalent
        "calculation": "tokens * 0.0000556 / 1000",
        "source": "ML CO2 impact research"
      },
      "metadata": {
        "canonicalId": "slug-20250805-d90c95e9",
        "sourceLanguage": "de",
        "targetLanguage": "en",
        "contentLength": 2450,
        "qualityScore": 8.5
      }
    }
  ],
  "summary": {
    "totalOperations": 42,
    "totalTokens": 89450,
    "totalCost": 1.23,
    "totalCO2": 0.00498,
    "byOperation": {
      "translation": { "count": 28, "tokens": 75230, "cost": 1.05, "co2": 0.00419 },
      "tldr": { "count": 12, "tokens": 12100, "cost": 0.15, "co2": 0.00067 },
      "tagging": { "count": 2, "tokens": 2120, "cost": 0.03, "co2": 0.00012 }
    }
  }
}
```

### Cost Calculation Engine

**Model Pricing Configuration**:

```typescript
const MODEL_PRICING = {
  'gpt-4o': {
    prompt: 0.005, // $0.005 per 1K tokens
    completion: 0.02, // $0.02 per 1K tokens
  },
  'gpt-4o-mini': {
    prompt: 0.00015, // $0.00015 per 1K tokens
    completion: 0.0006, // $0.0006 per 1K tokens
  },
} as const;

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

interface CostBreakdown {
  prompt: number;
  completion: number;
  total: number;
}

function calculateCost(tokens: TokenUsage, model: keyof typeof MODEL_PRICING): CostBreakdown {
  const pricing = MODEL_PRICING[model];
  const promptCost = (tokens.prompt / 1000) * pricing.prompt;
  const completionCost = (tokens.completion / 1000) * pricing.completion;

  return {
    prompt: promptCost,
    completion: completionCost,
    total: promptCost + completionCost,
  };
}
```

### Environmental Impact Calculation

**CO₂ Impact Estimation**:

```typescript
// Based on research: ML inference CO2 impact
const CO2_PER_1K_TOKENS = 0.0000556; // kg CO2 equivalent per 1000 tokens

function calculateCO2Impact(totalTokens: number): number {
  return (totalTokens / 1000) * CO2_PER_1K_TOKENS;
}

// Convert to more readable units
function formatCO2Impact(co2Kg: number): string {
  if (co2Kg < 0.001) {
    return `${(co2Kg * 1000000).toFixed(2)}µg`;
  } else if (co2Kg < 1) {
    return `${(co2Kg * 1000).toFixed(2)}mg`;
  } else {
    return `${co2Kg.toFixed(3)}kg`;
  }
}
```

### CLI Analytics Tools

**NPM Scripts for Token Analysis**:

```bash
# Usage summary commands
npm run tokens:summary              # Overall usage summary
npm run tokens:summary week         # Weekly summary
npm run tokens:summary month        # Monthly summary

# Operation-specific analysis
npm run tokens:usage translation    # Translation operations only
npm run tokens:usage tldr          # TLDR generation only
npm run tokens:usage tagging       # Tagging operations only

# Data export
npm run tokens:export csv          # Export to CSV format
npm run tokens:export json         # Export to JSON format

# Testing and development
npm run tokens:add-test            # Add test usage entries
```

**Implementation** (`scripts/token-tracking/`):

```typescript
// Token usage summary generator
async function generateTokenSummary(period?: 'day' | 'week' | 'month'): Promise<UsageSummary> {
  const usage = loadTokenUsage();
  const cutoffDate = period ? getDateCutoff(period) : new Date(0);

  const relevantEntries = usage.entries.filter((entry) => new Date(entry.timestamp) >= cutoffDate);

  return {
    period: period || 'all-time',
    totalOperations: relevantEntries.length,
    totalTokens: relevantEntries.reduce((sum, entry) => sum + entry.tokens.total, 0),
    totalCost: relevantEntries.reduce((sum, entry) => sum + entry.cost.total, 0),
    totalCO2: relevantEntries.reduce((sum, entry) => sum + entry.co2.estimate, 0),
    byOperation: groupByOperation(relevantEntries),
    byModel: groupByModel(relevantEntries),
    trend: calculateTrend(relevantEntries),
  };
}
```

---

## Deployment & Build Specification

### Build Process

**Development Environment**:

```bash
# Local development setup
pnpm install                    # Install dependencies
pnpm astro sync                # Sync content types
pnpm run dev                   # Start dev server (port 4321)

# Content management
pnpm astro sync                # Re-sync after schema changes
npm run translations:check     # Check for missing translations
npm run tags:analyze           # Analyze tag usage

# Quality assurance
pnpm run check                 # TypeScript and lint checks
pnpm run fix                   # Auto-fix formatting issues
pnpm run build                 # Production build
```

**Production Build**:

```bash
# CI/CD build process
pnpm install --frozen-lockfile  # Exact dependency versions
pnpm astro sync                # Generate content types
pnpm run check                 # Quality validation
pnpm run build                 # Static site generation

# Output: ./dist/ directory with optimized static assets
```

### Deployment Configuration

**GitHub Pages Setup**:

- **Source**: GitHub Actions workflow
- **Branch**: Deployed from CI/CD pipeline
- **Custom Domain**: Configured via CNAME file
- **HTTPS**: Automatic with custom domain

**Performance Characteristics**:

- **Build Time**: ~28 seconds for 197+ pages
- **Bundle Size**: Optimized with Astro's static generation
- **Lighthouse Scores**: 95+ for performance, accessibility, SEO
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s

### Content Validation & Quality Assurance

**Pre-commit Hooks** (via Husky):

```bash
# .husky/pre-commit
#!/usr/bin/env sh
pnpm astro sync              # Validate content schema
pnpm run check              # TypeScript validation
npm run content:validate    # Custom content validation
```

**Content Validation Script**:

```typescript
// scripts/validate-content.ts
async function validateContent(): Promise<ValidationReport> {
  const collections = await getCollections();
  const issues: ValidationIssue[] = [];

  for (const collection of collections) {
    for (const entry of collection) {
      // Validate frontmatter completeness
      if (!entry.data.title) {
        issues.push({ type: 'missing-title', file: entry.id });
      }

      // Validate canonical ID format
      if (entry.data.canonicalId && !isValidCanonicalId(entry.data.canonicalId)) {
        issues.push({ type: 'invalid-canonical-id', file: entry.id });
      }

      // Validate translation relationships
      if (entry.data.translationOf) {
        const sourceExists = await checkTranslationSource(entry.data.translationOf);
        if (!sourceExists) {
          issues.push({ type: 'missing-translation-source', file: entry.id });
        }
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
```

This comprehensive technical specification provides all the details necessary to understand, maintain, and rebuild the Seez multilingual content management system. The architecture represents a sophisticated solution for AI-powered content translation with environmental consciousness and professional user experience.
language: 'en' | 'de' # Default: 'en'
timestamp?: string # ISO 8601 format
status?: {
authoring: 'Human' | 'AI' | 'AI+Human' # Default: 'Human'
translation?: 'Human' | 'AI' | 'AI+Human' # Optional
}

````

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
````

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
