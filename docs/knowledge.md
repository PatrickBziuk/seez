# Seez Repository Knowledge Base (2025)

## Current Architecture (Build 2025-01-23)

- **Framework**: Astro 5.x with TypeScript strict mode
- **Styling**: Tailwind CSS with custom components and dark mode
- **Content**: Markdown-based collections (books, projects, lab, life) with type-safe schemas
- **Internationalization**: Astro-i18next with middleware-based language detection
- **Build Status**: ✅ Production-ready (154 pages, ~28s build time, no errors)

## Core Systems

### Content Management

- **Collections**: Four main content types with unified schema pattern
- **Schema**: Extended with `language`, `timestamp`, `status.authoring`, `status.translation`, `tags`
- **Types**: Auto-generated from `src/content/config.ts` via `astro sync`
- **Processing**: Uses Astro 5 `glob()` loader for efficient content loading

### Translation Pipeline

- **AI Translation**: OpenAI-powered with hallucination detection and progressive saving
- **Quality Control**: Automatic scoring, incremental git commits, MDX component preservation
- **State Management**: Robust error handling with file-level transaction safety
- **Validation**: 488-line implementation in `scripts/generate_translations.ts`

### Language Detection & Routing

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
