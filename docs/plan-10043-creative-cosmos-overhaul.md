# Plan 10043: Seez.eu Creative Cosmos Overhaul

**Created**: August 27, 2025  
**Status**: Phase 4 IN PROGRESS - Music & Text Integration 🔄  
**Priority**: High - Major Site Restructure  
**Estimated Duration**: 4-6 weeks  
**Last Updated**: August 28, 2025

## Overview

Complete overhaul of seez.eu from a generic development portfolio to a focused creative cosmos centered around music, texts, figures, and artistic content. This transformation will establish seez.eu as the primary platform for the creative universe while maintaining technical excellence.

**IMPLEMENTATION UPDATE**: Phases 1-3 successfully completed; Phase 4 groundwork implemented. Current build produces 159 pages with 156 indexed by Pagefind. Figure universe fully operational; music and texts now integrated with localized listings and detail pages.

## Goals

### Primary Goals ✅ ACHIEVED

1. **Refocus Site Identity**: ✅ Transform from "Digital Sovereignty & Development" to creative cosmos
2. **Simplify Navigation**: ✅ Reduce to 3-4 main entry points (Music, Texts, Figures, Creative)
3. **Establish Figure Universe**: ✅ Create comprehensive character dossiers and interconnected content
4. **Preserve Technical Foundation**: ✅ Maintain Astro 5 + i18n architecture while adapting collections
5. **Legal Compliance**: ✅ Fix privacy/impressum issues immediately

### Success Metrics ✅ ACHIEVED

- ✅ Clear creative focus immediately visible on homepage
- ✅ Simplified navigation with max 4 main categories
- ✅ All 6 figures (Splinter, Lume, Drift, Shift, Gl1tch, Unknown) with complete dossiers
- ✅ Legal compliance achieved (impressum, privacy policy)
- ✅ Bidirectional content linking working

## Implementation Insights

### Key Discoveries During Development

1. **Schema Evolution**: Initial plan used simple strings for figure metadata, but implementation revealed need for structured objects:
   - `symbolism` became array of `{icon, meaning}` objects for rich metadata
   - `voiceCharacteristics` structured as `{preset, bpmRange, style}` for performance guidance
   - `movementGrammar` as array for detailed choreography notes

2. **Content Collection Patterns**: Astro 5 content collections use `.id` not `.slug` for file identification, requiring template adjustments

3. **SCP-Style Documentation**: The containment protocol format proved highly effective for character documentation:
   - Clear designation system (SZ-001 through SZ-006)
   - Structured metadata with containment classes
   - Color-coded visual identification system

4. **Footer Navigation**: User feedback confirmed social media prominence is crucial for creative cosmos - footer should not fold/collapse

## Technical Analysis

### Current State ✅ IMPLEMENTED

- **Architecture**: Astro 5 with Tailwind CSS ✅
- **Collections**: Extended with figures, music, texts, artifacts ✅
- **i18n**: astro-i18next working with /de/, /en/ prefixes ✅
- **Content System**: Extended schema with multilingual support ✅
- **Legal Pages**: Complete impressum and privacy policy ✅
- **Figure Universe**: 6 complete character dossiers with SCP styling ✅

### New Content Model ✅ IMPLEMENTED

#### Figures Collection Schema (Final Implementation)

```typescript
// src/content/config.ts - figures collection
figures: defineCollection({
  schema: base.extend({
    alias: z.string().optional(),
    designation: z.string().optional(), // SZ-001, etc.
    colorCode: z.string().optional(),
    symbolism: z.array(z.object({
      icon: z.string(),
      meaning: z.string()
    })).length(3).optional(),
    voiceCharacteristics: z.object({
      preset: z.string().optional(),
      bpmRange: z.tuple([z.number(), z.number()]).optional(),
      style: z.array(z.string()).optional()
    }).optional(),
    movementGrammar: z.array(z.string()).length(3).optional(),
    primarySongs: z.array(reference('music')).optional(),
    containmentNote: z.string().optional(),
    artifacts: z.array(reference('artifacts')).optional()
  })
})
}

texts: {
  // Prose, poetry, book chapters
  title, type, figureRefs, songRefs, excerpt, chapterNumber
}

artifacts: {
  // Merch, physical items with cost transparency
  title, type, figureRef, description, costBreakdown, availability
}

games: {
  // Interactive content (future)
  title, description, playUrl, figureRef, difficulty
}
```

## Implementation Plan

### Phase 1: Foundation & Legal (Week 1) ✅ COMPLETED

**Priority: Critical - Legal Compliance**

#### 1.1 Legal Pages Fix ✅ COMPLETED

- [x] Create proper German impressum with real contact data
- [x] Write GDPR-compliant privacy policy
- [x] Implement cookie consent banner if needed
- [x] Review all tracking and external service usage

#### 1.2 Homepage Transformation ✅ COMPLETED

- [x] Replace current hero with new creative focus claim
- [x] Create 3-4 main entry point cards:
  - **Musik**: "Hör die Stimmen deiner Figuren" ✅
  - **Texte**: "Wörter werden zu Welten" ✅
  - **Figuren**: "Begegne den Charakteren" ✅
  - **Kreatives**: "Spiele, Experimente, Überraschungen" ✅
- [x] Add "Neu" section showing latest 3 items from any collection
- [x] Add "Zufall" button for random content discovery
- [x] Update site tagline and meta descriptions

#### 1.3 URL Structure Simplification ✅ COMPLETED

- [x] Maintain /de/ and /en/ prefixes
- [x] Map new routes: `/[lang]/musik/`, `/[lang]/texte/`, `/[lang]/figuren/`
- [x] Set up redirects from old structure
- [x] Update internal navigation references

### Phase 2: Content Collections (Week 2) ✅ COMPLETED

#### 2.1 Schema Definition ✅ COMPLETED

- [x] Extend `src/content/config.ts` with new collections
- [x] Define bidirectional reference system
- [x] Set up proper TypeScript types
- [x] Run `pnpm astro sync` to generate types

**Implementation Note**: Schema evolved during development to use structured objects for richer metadata.

#### 2.2 Figures Collection Setup ✅ COMPLETED

- [x] Create `src/content/figures/` directory
- [x] Port and rewrite figure data from `content_to_fill_site/figure_*.md`
- [x] Create comprehensive schema with:
  - SCP-style identifiers (SZ-001 Splinter, SZ-002 Lume, etc.) ✅
  - Color codes: Splinter (#0a0a0a), Lume (#E8D5B7), Drift (#1F2937), Shift (#6366F1), Gl1tch (#00FF41), Unknown (#8B9DC3) ✅
  - Symbolism (3 icons + explanations as structured objects) ✅
  - Voice characteristics & BPM ranges (structured as objects) ✅
  - Movement grammar (3 verbs each as arrays) ✅
  - Primary songs references ✅
  - Containment notes in SCP style ✅
- [x] Move character images to `public/images/figures/`

**Implementation Discovery**: Original simple string fields were upgraded to structured objects for better metadata management.

#### 2.3 Music Collection Setup ✅ COMPLETED

- [x] Create `src/content/music/` directory
- [x] Port existing song data from `content_to_fill_site/song_*.md`
- [x] Start with "Kiffen Kippen Alk" as test case
- [x] Set up figure references and metadata
- [x] Plan audio integration (Spotify embeds, etc.)

### Phase 3: Figure Universe (Week 3) ✅ COMPLETED

#### 3.1 Figure Dossier Pages ✅ COMPLETED

- [x] Create `/[slug].astro` template for figures
- [x] Implement SCP-style layout with:
  - Header with designation (SZ-001, etc.) ✅
  - Basic information table ✅
  - Symbolism section with icons ✅
  - Voice & movement characteristics ✅
  - Primary songs grid with covers ✅
  - Quotes section ✅
  - Related artifacts ✅
  - Containment/background note ✅
- [x] Add figure color theming per page

**Implementation Note**: Used Astro 5's `render()` function from `astro:content` for proper content rendering.

#### 3.2 Bidirectional Linking System ✅ COMPLETED

- [x] Implement song → figure connections
- [x] Create figure → songs listings
- [x] Add text → figure/song references
- [x] Build dynamic "Related Content" components

#### 3.3 Complete Figure Profiles ✅ COMPLETED

- [x] **Splinter** (SZ-001): The mirror-man with fragmented reflection face
- [x] **Lume** (SZ-002): The optimistic light-bringer with creative energy
- [x] **Drift** (SZ-003): The lost wanderer struggling with direction
- [x] **Shift** (SZ-004): The workplace survivor with controlled rebellion
- [x] **Gl1tch** (SZ-005): The digital ethics analyst with LED-line symbolism
- [x] **Unknown** (SZ-006): The political outsider with migration perspective

**Build Results (at completion)**: 149 total pages, 122 indexed by Pagefind. All figure pages building successfully.

### Phase 4: Music & Text Integration (Week 4) 🔄 IN PROGRESS

#### 4.1 Enhanced Music Pages - PRIORITY

- [x] Create music listing page at `/[lang]/musik/` (localized listing live)
- [x] Individual song pages with:
  - [x] Audio player (site-relative MP3s via `AudioPlayer.astro`)
  - [ ] Liner notes (UI section planned)
  - [x] Figure connections (basic implementation on detail pages)
  - [ ] Lyrics (if appropriate)
  - [ ] Related songs surface (by figureRefs and tags)
- [ ] Album/collection grouping system

**Implementation Notes**:

- Music schema relaxed to allow site-relative `audioUrl` (e.g., `/sounds/*.mp3`).
- De song migrations added with audio: als-sie-kamen, fck-suno, genaeht, glueck-am-ende, herz-klopft-kopf-platzt, schmetterlingsmoment; En: time-to-leave.

#### 4.1.1 Latest Updates (Aug 28, 2025)

- Audio player wired on song detail pages via `AudioPlayer.astro` when `audioUrl` is present
- Figures listing/detail now stable: Gl1tch/Shift images fixed by introducing optional `image` field in figures schema with filename fallback
- Translation pipeline updated with opt-out mechanism:
  - Frontmatter `notranslate: string[]` + block markers preserved
  - Mask/restore placeholders across task-based and registry-based generators, and local validator
  - Translation detector expanded to include figures, texts, music
- Content sync and type generation running clean

#### 4.1.2 Immediate Next Steps

- Link audit: crawl internal links across `/[lang]/musik`, `/[lang]/texte`, `/[lang]/figuren`, detail pages, and welcome; fix any 404s and ensure consistent use of `getPermalink()`
  - Update: tag links normalized to `getPermalink()` across ContentCard, TagsSection, SocialShareFooter, and tags pages.
- Related Content: add reusable sections on music, texts, and figures (figure ↔ songs/texts; song ↔ figure/texts; text ↔ figure/songs)
- Audio: reuse `AudioPlayer` where appropriate on listings or embeds; ensure accessible labels and localized titles
- CMS: expose figures `image` and `notranslate` fields in `public/admin/config.yml`
- Tests: add E2E for cross-links and audio rendering; verify localized routes resolve

#### 4.2 Text Collection - PRIORITY

- [x] Create `src/content/texts/` directory and schema wiring
- [x] Implement localized listing at `/[lang]/texte/`
- [x] Implement detail page `/[lang]/texte/[slug]` with cross-links to figures and songs
- [ ] Port additional content and categorize types (prolog, chapter, essay, poem)
- [ ] Add reading UI polish (progress, next/prev, typographic rhythm)

**Implementation Notes**:

- Cross-linking resolves via `reference()` ids; links render per-locale.

#### 4.3 Cross-Reference System - PRIORITY

- [x] Implement content discovery through connections (basic version working)
- [ ] Add "More from this figure" components
- [ ] Create thematic browsing paths
- [ ] Enhance "Related Content" sections across all collections

#### 4.4 Concept Explainer

- [x] Create `/[lang]/welcome` page explaining the universe concept and entry points

### Phase 5: Enhancement & Polish (Week 5) 📋 PLANNED

#### 5.1 Artifacts Collection

- [ ] Create merch/artifacts system
- [ ] Implement cost transparency features
- [ ] Link artifacts to figures
- [ ] Add print-on-demand information

#### 5.2 Performer License System

- [ ] Create `/perform` page explaining licensing
- [ ] Add license terms (Sinn fix, Form frei)
- [ ] Implement request form for stems
- [ ] Create downloadable PDF license

#### 5.3 Visual Theme Enhancement

- [ ] Implement figure-specific color theming
- [ ] Enhance dark theme with character colors
- [ ] Create figure-specific icons/symbols
- [ ] Add subtle animations and transitions

### Phase 6: Content Migration & Launch (Week 6)

#### 6.1 Content Migration

- [ ] Migrate relevant content from old collections
- [ ] Archive or redirect deprecated content
- [ ] Ensure no broken links
- [ ] Update sitemap and navigation

#### 6.2 Final Testing

- [ ] Test all new routes and collections
- [ ] Verify multilingual functionality
- [ ] Check mobile responsiveness
- [ ] Validate SEO and meta tags

#### 6.3 Soft Launch

- [ ] Deploy to staging for review
- [ ] Content review and proofreading
- [ ] Final legal review
- [ ] Production deployment

## Technical Requirements

### Content Schema Updates

```typescript
// New collections to add to config.ts
const figures = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/figures' }),
  schema: base.extend({
    alias: z.string(),
    designation: z.string(), // SZ-001, etc.
    colorCode: z.string(),
    symbolism: z
      .array(
        z.object({
          icon: z.string(),
          meaning: z.string(),
        })
      )
      .length(3),
    voiceCharacteristics: z.object({
      preset: z.string(),
      bpmRange: z.tuple([z.number(), z.number()]),
      style: z.array(z.string()),
    }),
    movementGrammar: z.array(z.string()).length(3),
    primarySongs: z.array(reference('music')),
    containmentNote: z.string(),
    artifacts: z.array(reference('artifacts')).optional(),
  }),
});

const music = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/music' }),
  schema: base.extend({
    artist: z.string().default('Seez'),
    figureRef: reference('figures'),
    releaseDate: z.string().datetime(),
    // Accept absolute and site-relative audio URLs
    audioUrl: z
      .string()
      .regex(/^(https?:\/\/|\/).+$/)
      .optional(),
    spotifyId: z.string().optional(),
    bpm: z.number().optional(),
    genre: z.array(z.string()),
    linerNotes: z.string().optional(),
  }),
});
```

### URL Structure

```
Current: seez.eu/projects/, seez.eu/books/, etc.
New:     seez.eu/de/musik/, seez.eu/de/figuren/, seez.eu/de/texte/
         seez.eu/en/music/, seez.eu/en/figures/, seez.eu/en/texts/
```

### Navigation Updates

- Main nav: Musik, Texte, Figuren, (Kreatives)
- Footer: Projects, Lab, Life, About, Contact (demoted)
- Cross-links: Subtle references to bziuk.com for tech content

## Risk Assessment

### High Risk

- **Legal Issues**: Current privacy/impressum non-compliance
- **Content Loss**: Migration from old collections
- **SEO Impact**: Major URL structure changes

### Medium Risk

- **User Confusion**: Complete site reorganization
- **Technical Debt**: Complex bidirectional references
- **Performance**: New collection loading patterns

### Mitigation Strategies

- Phase 1 prioritizes legal compliance
- Comprehensive redirect mapping for SEO preservation
- Gradual content migration with parallel systems
- Extensive testing in staging environment

## Success Criteria

### Technical

- [ ] All new collections functional with proper TypeScript types
- [ ] Bidirectional references working correctly
- [ ] Legal pages compliant and deployed
- [ ] Mobile-responsive figure dossiers
- [ ] Performance maintained (<3s load time)

### Content

- [ ] All 6 figures with complete dossiers
- [ ] At least 5 songs properly categorized and linked
- [ ] Working performer license system
- [ ] Clear creative focus on homepage

### User Experience

- [ ] Intuitive navigation with max 4 main categories
- [ ] Smooth content discovery through connections
- [ ] Clear figure universe understanding
- [ ] Professional but creative presentation

## Post-Launch

### Immediate (Month 1)

- Monitor user behavior and navigation patterns
- Collect feedback on new structure
- Fix any discovered bugs or usability issues
- Content additions based on user interest

### Medium Term (Months 2-3)

- Implement games collection when content ready
- Add interactive elements to figure pages
- Enhance cross-content discovery features
- Possible mini-games integration

### Long Term (Months 4-6)

- Full book content integration
- Advanced figure interactions
- Community features for performers
- Expanded artifact/merch system

## Dependencies

### Internal

- Legal consultation for impressum/privacy content ✅ COMPLETED
- Content review and proofreading ✅ ONGOING
- Figure image assets and iconography ✅ COMPLETED
- Audio/music integration decisions 🔄 IN PROGRESS

### External

- Hosting provider legal compliance ✅ RESOLVED
- CDN and external service privacy review ✅ COMPLETED
- Font and asset licensing verification ✅ VERIFIED
- Third-party embed compliance (Spotify, etc.) 📋 PLANNED

## Implementation Lessons Learned

### Technical Insights

1. **Astro 5 Content Collections**: Use `.id` not `.slug` for file identification in templates
2. **Schema Evolution**: Start simple, evolve to structured objects as requirements become clear
3. **TypeScript Integration**: `pnpm astro sync` after schema changes is crucial for type safety
4. **Render Function**: Use `render()` from `astro:content` for content rendering, not `figure.render()`

### Content Strategy Insights

1. **SCP-Style Documentation**: Highly effective for character universe documentation
   - Clear hierarchy with designation system (SZ-001 through SZ-006)
   - Structured metadata with containment protocols
   - Color-coded visual identification system
2. **User Feedback Integration**: Footer social prominence confirmed as crucial for creative cosmos
3. **Bidirectional References**: Essential for rich content discovery and cross-pollination

### Development Process Insights

1. **Incremental Implementation**: Phases 1-3 completed successfully shows value of structured approach
2. **Schema-First Design**: Defining collections upfront enabled smooth template development
3. **Build Validation**: Regular builds (149 pages, 122 indexed) provide clear success metrics
4. **User Feedback Loop**: Direct feedback on footer navigation proved valuable for real-world usage

### Content Quality Insights

1. **Character Depth**: 6 complete figures with distinct personalities and symbolism provide rich creative foundation
2. **Multilingual Support**: DE/EN implementation working seamlessly across all figure content
3. **Visual Consistency**: Color-coded figure system creates strong brand identity
4. **Performance Guidelines**: BPM ranges and movement grammar provide practical creative direction

## Success Metrics Achieved ✅

- **159 total pages built** (latest full build)
- **156 pages indexed by Pagefind** (excellent search coverage)
- **6 complete figure dossiers** (vs. original target of 6)
- **Legal compliance achieved** (critical business requirement met)
- **Multilingual functionality preserved** (technical foundation maintained)
- **Creative focus established** (primary transformation goal achieved)

## Current Status: Phase 4 In Progress

Foundation (Phases 1-3) complete. Phase 4 core pieces are live: localized music/texts listings, per-song pages with audio, cross-linked text details, figure reference fixes, and a concept explainer page. Next, we’ll polish discovery and presentation.

### Remaining Polish Tasks (to reach “polished overhaul”)

- Related content component reused across music, texts, and figures
- Album/collection grouping and filters on music listing
- Liner notes and lyrics sections on song pages (optional toggle)
- Song cover images and consistent card visuals
- Structured data (JSON-LD): MusicRecording/AudioObject and Article
- Accessibility: keyboard-accessible audio controls, transcripts/lyrics
- Search facets for collections (music/texts/figures) and tag filters
- Breadcrumbs and collection-aware navigation highlights
- Performance: image optimization, preload key assets, verify Pagefind inclusions
- CMS (Decap) config updates for new collections/fields at `public/admin/config.yml`
- Tests: add E2E coverage for `/[lang]/musik/*`, `/[lang]/texte/*`, and `/[lang]/welcome`
- i18n completeness: ensure DE/EN parity for new pages and labels

## Notes

This plan transforms seez.eu from a broad development portfolio into a focused creative universe while preserving the strong technical foundation. The phased approach ensures legal compliance first, then systematic content restructuring, maintaining site functionality throughout the transition.

The new structure aligns with the artistic vision while leveraging existing technical capabilities like multilingual support and dynamic content systems. Success depends on careful content migration and clear communication of the new creative focus.

**IMPLEMENTATION UPDATE (August 27, 2025)**: Phases 1-3 completed successfully. The transformation from development portfolio to creative cosmos is now operational with a complete figure universe serving as the foundation for all future content development.
