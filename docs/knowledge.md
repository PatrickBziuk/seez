# Seez Repository Knowledge Base (2025)

## Current Architecture (Build 2025-08-07)

- **Framework**: Astro 5.x with TypeScript strict mode
- **Styling**: Tailwind CSS with custom components and dark mode
- **Content**: Markdown-based collections (books, projects, lab, life) with comprehensive type-safe schemas
- **Internationalization**: Astro-i18next with client-side language detection and cookie persistence
- **AI Integration**: OpenAI GPT-4o powered translation pipeline with token tracking and CO₂ impact monitoring
- **Build Status**: ✅ Production-ready (197 pages, ~28s build time, no errors)

## Core Systems Overview

This project has evolved through 25+ major implementation plans into a sophisticated multilingual content management system with AI-powered translation capabilities, comprehensive SEO optimization, and environmental impact tracking.

### Content Management Architecture

**Collections Structure:**

- **Four main collections**: `books`, `projects`, `lab`, `life` - each supporting multilingual content
- **Extended Schema**: Comprehensive metadata including language, authoring status, translation history, AI-generated summaries, and token usage tracking
- **Type Safety**: Auto-generated TypeScript types from `src/content/config.ts` via `astro sync`
- **Content Loading**: Uses Astro 5 `glob()` loader for efficient content discovery and processing

**Content Schema Features:**

```typescript
// Core metadata fields
language: 'en' | 'de'
status: {
  authoring: 'Human' | 'AI' | 'AI+Human'
  translation?: 'Human' | 'AI' | 'AI+Human'
}
tags: string[]

// Canonical ID system for translation integrity
canonicalId: string // Format: slug-YYYYMMDD-hash8
originalLanguage: 'en' | 'de'
translationOf?: string // Reference to source canonical ID

// AI-generated enhancements
ai_tldr?: string // AI-generated summary
ai_metadata: {
  tokenUsage: {
    translation: { tokens, cost, co2 }
    tldr: { tokens, cost, co2 }
    total: { tokens, cost, co2 }
  }
}
```

### Translation Pipeline System

**Canonical ID Architecture:**

- **Registry-Based Translation**: Central `data/content-registry.json` tracks all content relationships
- **Content Integrity**: SHA-256 content hashing prevents translation loops and content divergence
- **Progressive State Saving**: Translations processed sequentially with git commits after each success
- **Hallucination Detection**: Semantic comparison between original and translated content

**AI Translation Features:**

- **OpenAI Integration**: Uses GPT-4o model with combined prompts for translation + TLDR + quality scoring
- **Token Tracking**: Comprehensive monitoring of API usage, costs, and environmental impact
- **Quality Control**: Automated scoring with human review flags for poor translations
- **Content Preservation**: MDX components, code blocks, and technical elements remain unchanged during translation

**Registry System:**

```json
{
  "canonicalId": "slug-20250805-d90c95e9",
  "originalPath": "src/content/books/de/example.md",
  "originalLanguage": "de",
  "contentHash": "sha256-hash",
  "translations": {
    "en": {
      "path": "src/content/books/en/example.md",
      "status": "current" | "stale" | "missing",
      "translationHash": "sha256-hash"
    }
  }
}
```

### Language Detection & User Experience

**Client-Side Language Detection:**

- **Root Page Experience**: Beautiful gradient loading page replaces ugly browser redirects
- **Browser Language Detection**: Automatic detection from `navigator.languages`
- **Cookie Persistence**: User preferences stored with 30-day expiration
- **Fallback Logic**: Default to English for unsupported languages
- **Manual Override**: Elegant language selection interface for ambiguous cases

**Multilingual Routing:**

- **URL Structure**: `/[lang]/` prefix for all routes (including English)
- **Dynamic Routing**: Language-aware content filtering and URL generation
- **SEO Optimization**: Canonical URLs and hreflang tags for all language variants
- ### Component Architecture

**Directory Structure (Plan 10017):**

```
src/components/
├── core/                    # Essential site functionality
│   ├── layout/             # Header, Footer, LanguageSwitcher, ToggleMenu, ToggleTheme
│   ├── meta/               # SEO, Analytics, Meta tags, Scripts
│   └── brand/              # Logo and brand components
├── content/                # Content display and metadata
│   ├── metadata/           # ContentMetadata, TokenStats, SocialShare
│   ├── blog/               # Blog-specific components
│   └── media/              # MediaPlayer, image components
├── ui/                     # Reusable UI components
│   ├── forms/              # Form controls and inputs
│   ├── display/            # Badge, Button, ItemGrid
│   └── layout/             # Grid, Section, Background
├── marketing/              # Landing page components
│   ├── hero/               # Hero sections and CTAs
│   ├── features/           # Feature highlights
│   ├── social-proof/       # Testimonials, logos
│   ├── conversion/         # Pricing, FAQ
│   └── content/            # Steps, stats, call-to-actions
└── common/                 # Legacy/utility components
```

**Key Components:**

1. **ContentMetadata.astro**: Ultra-minimalistic metadata display with:
   - Collapsible AI-generated TLDR with smooth animations
   - Status badges for Human/AI/AI+Human authoring and translation
   - Token usage statistics with cost and CO₂ impact
   - Clickable tags linking to language-aware tag pages
   - Language and timestamp display with elegant icons

2. **LanguageSwitcher.astro**: Dropdown language selection with:
   - Current language display (flag + label)
   - Expandable dropdown with all available languages
   - Proper accessibility (ARIA attributes, keyboard navigation)
   - URL generation for language switching

3. **TokenStats.astro**: Reusable token statistics formatter supporting:
   - Multiple display modes: 'translation', 'tldr', 'total', 'all'
   - Compact and full display options
   - Cost calculation and CO₂ impact display

4. **PostFooter.astro**: Comprehensive content footer with:
   - GitHub source + commit history integration
   - Social sharing (Twitter/X, LinkedIn, Facebook, Mastodon, WhatsApp, Email)
   - Copyright and licensing information
   - Environmental impact transparency

### SEO & Structured Data System

**CanonicalSEO.astro Component Features:**

- **Canonical URLs**: Registry-based URL generation for proper search engine indexing
- **Hreflang Tags**: Automatic language alternatives using canonical relationships
- **JSON-LD Structured Data**: Rich metadata for search engines including:
  - Article schema with canonical identifiers
  - Translation relationships and language information
  - Author, publisher, and content lineage data
- **Git Metadata Integration**: Automatic publish/modified dates from git history
- **Open Graph & Twitter Cards**: Comprehensive social media metadata

### GitHub Actions CI/CD Pipeline

**Consolidated Workflow Structure:**

1. **ci-cd.yml** (Main Pipeline):
   - **Test Build**: Multi-version Node.js testing (18, 20, 22) on PRs
   - **Quality Check**: ESLint and Prettier validation (non-blocking)
   - **Build & Deploy**: GitHub Pages deployment with issue creation on failures
   - **Translation Trigger**: Calls translation workflow after successful build

2. **translation.yml** (AI Translation Pipeline):
   - **Detection**: Registry-based translation task detection
   - **Generation**: OpenAI-powered translation with progressive saving
   - **PR Management**: Branch creation and pull request handling
   - **Token Tracking**: Cost and environmental impact monitoring

3. **Cleanup & Maintenance Workflows**:
   - **cleanup-translate-branches.yml**: Removes stale translation branches
   - **post-release-sync.yml**: Syncs approved translations back to main
   - **manual-regen.yml**: Manual translation regeneration for specific content

### Environmental Impact & Sustainability

**Token Usage Tracking System:**

- **Cost Calculation**: Real-time OpenAI API cost monitoring
- **CO₂ Impact**: Environmental impact estimation based on token usage
- **Usage Analytics**: Comprehensive CLI tools for usage analysis
- **Persistent Storage**: JSON-based ledger system for historical tracking
- **Transparency**: Public display of AI usage costs and environmental impact

**Available NPM Scripts:**

```bash
npm run tokens:summary [period]    # Show usage summary
npm run tokens:usage [operation]   # Show recent usage
npm run tokens:export [format]     # Export usage data
npm run tokens:add-test            # Add test usage entries
```

## Tag Management & Content Organization

**AI-Powered Tagging System (Plan 10021):**

- **Master Tag Registry**: Categorized registry with multilingual support
- **Semantic Analysis**: Content analysis for intelligent tag suggestions
- **Interactive Application**: CLI tool for reviewing and applying suggestions
- **Auto-Registry Updates**: New tags automatically added to master registry
- **Preservation**: Manual tags preserved; AI only adds, never replaces

**Tag Pages & Navigation:**

- **Language-Aware Routes**: `/[lang]/tags/` index and `/[lang]/tags/[tag]` detail pages
- **Content Filtering**: Real-time search and filtering on tag pages
- **Click-Through Integration**: Tag badges link to relevant tag overview pages

## Development Workflow & Best Practices

### Content Creation Flow

1. **Create Content**: Add markdown files to appropriate collection directories
2. **Schema Validation**: `pnpm astro sync` validates content against schema
3. **Translation Detection**: Registry system automatically detects missing translations
4. **AI Processing**: Translation pipeline generates missing content with TLDR and quality scoring
5. **Review & Approval**: Human review of AI-generated content via PR system

### Build & Deployment Process

1. **Local Development**: `pnpm run dev` (port 4321)
2. **Content Sync**: `pnpm astro sync` after schema changes
3. **Quality Checks**: `pnpm run check` and `pnpm run fix`
4. **Automated Deployment**: GitHub Actions handles build and deployment
5. **Translation Pipeline**: Automatic translation detection and generation post-deployment

### Key Development Commands

```bash
# Core development
pnpm install              # Install dependencies
pnpm run dev             # Start development server
pnpm run build           # Production build
pnpm astro sync          # Sync content types

# Quality & validation
pnpm run check           # TypeScript and lint checks
pnpm run fix             # Auto-fix formatting issues

# Translation & AI tools
npm run translations:check    # Detect missing translations
npm run translations:generate # Generate AI translations
npm run tldr:generate        # Generate TLDR summaries
npm run tags:analyze         # Analyze tag usage patterns
```

## Integration Points & External Services

### AI Services Integration

- **OpenAI API**: GPT-4o model for translation, TLDR generation, and content analysis
- **Token Management**: Rate limiting and cost control mechanisms
- **Quality Assurance**: Automated scoring and hallucination detection

### GitHub Integration

- **Source Links**: Direct links to GitHub source for every content page
- **Commit History**: Links to file modification history
- **Issue Automation**: Automatic issue creation for build failures and translation problems
- **Branch Management**: Automated translation branch creation and cleanup

### Deployment & Hosting

- **GitHub Pages**: Static site deployment with custom domain support
- **CDN**: Automatic content distribution and caching
- **SSL**: Automatic HTTPS with custom domain certificates

## Architecture Evolution Summary

The project has evolved through 25+ major implementation plans:

**Foundation (Plans 10001-10005)**: Content metadata system, i18n setup, routing architecture
**UI/UX Enhancement (Plans 10006-10011)**: Language switcher, component documentation, tag system
**Infrastructure (Plans 10012-10017)**: TypeScript cleanup, component restructuring, CI/CD setup
**User Experience (Plans 10018-10020)**: Language detection, elegant redirects, SEO optimization
**AI Integration (Plans 10021-10025)**: Automated tagging, translation pipeline, token tracking, environmental impact

This comprehensive system provides:

- ✅ Fully automated multilingual content management
- ✅ AI-powered translation with quality control
- ✅ Environmental impact transparency
- ✅ Comprehensive SEO optimization
- ✅ Professional user experience with elegant interactions
- ✅ Robust CI/CD pipeline with automated quality checks

## Current Status & Metrics (2025-08-07)

- **Build Performance**: 28s average build time, 197 pages generated
- **Code Quality**: 0 TypeScript errors, 0 ESLint errors, 11 non-blocking hints
- **Content Coverage**: 4 main collections + pages collection with full multilingual support
- **Translation Pipeline**: Registry-based system with 14 canonical entries tracking 28 content files
- **AI Integration**: Comprehensive token tracking with cost and environmental impact monitoring
- **SEO**: Full structured data, canonical URLs, and hreflang implementation

- **Middleware**: Server-side detection with Accept-Language header parsing
- **Cookie Persistence**: 30-day language preference storage
- **Client Fallback**: Root domain detection with professional loading screen
- **URL Structure**: `/lang/collection/slug` pattern with proper hreflang support

### Component Architecture

- **Core Components**: SEO, ContentMetadata, LanguageSwitcher, ContentFallbackNotice
- **UI Components**: Button, Icon, Image with consistent styling patterns
- **Content Components**: ItemGrid for listings, MarkdownLayout for detail pages
- **Marketing Components**: Hero, Features, CallToAction for landing pages

### SEO & Metadata

- **Comprehensive SEO**: hreflang, canonical URLs, OpenGraph, JSON-LD structured data
- **Dynamic Sitemap**: Auto-generated for all language routes
- **Meta Management**: Centralized in SEO.astro with per-page customization
- **Social Sharing**: Complete OpenGraph and Twitter Card support

### CI/CD & Automation

- **GitHub Actions**: Multi-node testing, build validation, deployment pipeline
- **Auto Issue Creation**: Build failure detection with error extraction
- **Translation Triggers**: Automated workflow for content translation
- **Quality Gates**: TypeScript checks, build validation, routing tests

## Technical Integration Notes

### Astro-i18next Patterns

- No `useTranslation` hook - use static helpers and middleware
- TypeScript declarations don't create runtime exports - verify package exports
- Prefer static translation loading for SSR compatibility
- Document custom patterns for maintainability

### Build & Development

- **Commands**: `pnpm dev` (port 4321), `pnpm build`, `pnpm astro sync`
- **Type Safety**: Strict TypeScript with auto-generated content types
- **Development Flow**: Content changes → schema updates → sync → restart
- **Deployment**: Static build to `/dist` with Netlify/Vercel compatibility

### Performance Considerations

- **Static Generation**: All pages pre-rendered for optimal performance
- **Image Optimization**: Astro Assets with responsive image loading
- **Bundle Size**: Optimized with tree-shaking and component splitting
- **Loading**: Fast language detection (200ms) with 2s safety fallback

## Current Implementation Status (2025-01-23)

All major features are implemented and working in production:

- ✅ Multilingual content system with AI translation
- ✅ Component restructuring and documentation
- ✅ Language detection with cookie persistence
- ✅ Comprehensive SEO with hreflang support
- ✅ CI/CD automation with error handling
- ✅ Translation pipeline with quality controls

## Maintenance Guidelines

- Run `astro sync` after schema changes
- Update documentation comments for new components
- Test builds after significant changes
- Validate translations with CI scripts
- Archive completed plans to maintain organization
