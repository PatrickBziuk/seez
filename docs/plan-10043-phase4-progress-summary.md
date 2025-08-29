# Plan 10043 — Phase 4 Progress Summary (Music & Text Integration)

Date: August 28, 2025
Status: Core implemented, polish pending

## What shipped

- Localized Music listing at `/[lang]/musik/` with figure chips
- Song detail pages `/[lang]/music/[slug]` with HTML5 audio player
- Schema relaxed for `audioUrl` to allow site-relative MP3s
- Migrated tracks with audio:
  - de: als-sie-kamen, fck-suno, genaeht, glueck-am-ende, herz-klopft-kopf-platzt, schmetterlingsmoment
  - en: time-to-leave
- Texts listing `/[lang]/texte/` and detail `/[lang]/texte/[slug]` with cross-links to figures and songs
- Concept explainer `/[lang]/welcome`
- Figure pages: fixed related songs logic and link paths
- Figures listing: fixed Gl1tch and Shift images via explicit `image` field; added robust fallback logic
- Translation pipeline: added "notranslate" opt-out (frontmatter list + block markers) respected by task-based and registry-based generators and local validator; detector now scans figures/texts/music
- New RelatedContent component rendering cross-links between music, texts, and figures on detail pages
- DecapCMS config updated to expose figures.image and figures.notranslate; added CMS collections for music/texts/figures/artifacts
- New Creative landing at `/[lang]/kreatives` with hero, quick-entry links (Musik/Texte/Figuren), and recent highlights
- Header navigation verified to target `/[lang]/kreatives`; behavior now correct with dedicated page (no longer redirecting to Life)

## Build health

- Build: 159 pages generated; Pagefind indexed 156
- Typecheck: clean
- Content sync: clean

## Open polish tasks

- Related Content component shared by music, texts, figures — Implemented basic version (ships now); further polish pending
- Album/collection grouping; filters and sort on music listing
- Liner notes + optional lyrics sections on song pages
- Cover images and consistent card visuals
- JSON-LD: MusicRecording/AudioObject and Article
- A11y: keyboard-accessible audio controls, transcripts/lyrics
- Search facets by collection and tags; filters on listings
- Breadcrumbs + active nav highlight rules
- Performance: optimize images; preload key assets; verify Pagefind inclusions
- DecapCMS: update `public/admin/config.yml` to expose music/texts fields
- DecapCMS: surface `image` and `notranslate` fields for figures — Done
- Tests: E2E for `/[lang]/musik/*`, `/[lang]/texte/*`, `/[lang]/welcome`
- i18n: ensure parity for new UI labels
- Creative landing: add cover images/cards for highlights and a curated “Featured” section
- Import select assets from `content_to_fill_site/` into proper collections (texts/music/artifacts) and wire media
- JSON-LD for Creative hub aggregations (breadcrumbs/collection links)

## Next steps (immediate)

- Run link integrity audit across Musik/Texte/Figuren/welcome and all detail routes; fix any 404s or stale permalinks — Partial: welcome, homepage, texts listing/detail, music detail updated to use permalink helpers
- Implement Related Content blocks across music, texts, and figures using existing references — Done (baseline)
- Reuse `AudioPlayer` where appropriate and ensure accessible labels/localized strings
- Update DecapCMS config to expose figures `image` and `notranslate` — Done
- Enhance Creative landing with visuals (cards, images), and add E2E tests for nav + highlights
- Minor visual polish added (highlight dots); further card visuals pending

## Content imports (new)

- Added essay: `src/content/texts/de/fuck-suno-meta.md` linked to song `de/fck-suno`

## Actionable TODOs (curated)

- Link audit across Musik/Texte/Figuren/Welcome and all detail pages; prefer permalink helpers
- Creative landing polish: cover images/cards, curated “Featured,” and Playwright E2E
- Import selected assets from `content_to_fill_site/` into collections; wire images/audio
- Audio experience: reuse `AudioPlayer` where helpful; add transcripts/lyrics; a11y polish
- Search & discovery: tag filters and facets on listings (music/texts)
- Navigation UX: breadcrumbs and active state rules
- Structured data: JSON-LD for MusicRecording/AudioObject, Article, BreadcrumbList
- DecapCMS: expose missing music/texts fields; verify relations and preview
- Tests: E2E for nav, highlights, related content, audio playback
- Performance: image optimization, key preloads, Pagefind indexing checks
- i18n parity: ensure all new labels exist in `src/locales`; keep `/musik` alias consistent
- Accessibility: keyboard/focus behavior, ARIA roles, contrast checks

## Immediate Next Steps — Detailed

1. Complete link audit
   - Replace hard-coded paths with `getPermalink`/`getLocalizedUrl`
   - Verify `/[lang]/musik`, `/[lang]/texte`, `/[lang]/figuren`, `/[lang]/welcome`, and detail routes
2. Enhance Creative landing
   - Add cover images/cards to highlights and a compact Featured block
   - Add Playwright tests: header “Creative” → landing, highlights render, links resolve
3. Content import
   - Convert 3–5 items from `content_to_fill_site/` to `src/content/{texts,music,artifacts}`
   - Ensure frontmatter matches schema (authors, language, publicationStatus, optional canonicalId)
4. Audio & a11y
   - Reuse `AudioPlayer` where it adds value (song highlights/embeds)
   - Add transcripts/lyrics where relevant; ensure keyboard support and labels
5. Structured data + breadcrumbs
   - Add JSON-LD (songs/articles) and `BreadcrumbList`; wire breadcrumbs on listings/detail
6. Search and filters
   - Add basic tag filters to music/texts listings; keep UI minimal but usable

## Key Considerations / Guardrails

- URL & i18n correctness
  - Always use `getPermalink`/`getLocalizedUrl`; respect `trailingSlash: 'never'`
  - Keep `/[lang]/` prefixes and de/en parity for all new labels in `src/locales/*`
- Schema discipline
  - Follow `src/content/config.ts`; `firstPublishedAt` as ISO string
  - Use references (`figureRef`, `primarySongs`, `figureRefs`, `songRefs`) for cross-links
  - Run content sync after schema changes
- Accessibility & semantics
  - Keyboard operability, visible focus states, alt text, ARIA roles on nav/cards
  - Accessible audio controls; transcripts/lyrics where possible
- Performance & indexing
  - Optimize images (sizes/formats); avoid oversized hero assets
  - Verify Pagefind indexes new pages; keep essential content server-rendered
- CMS/editorial flow
  - Ensure DecapCMS shows needed fields; relations behave; previews work
  - Keep frontmatter consistent to prevent editor breakage
- Tests & CI
  - Add targeted Playwright tests for new nav and Creative landing behavior
  - Keep Astro check/content sync clean locally before pushing
- Docs protocol
  - Update `docs/todo.md` and this plan when shipping or re-scoping tasks
  - Add component doc headers if touching components

## Suggested Sequencing

1. Link audit and Creative landing visuals (+ tests)
2. Import 3–5 curated items; wire audio/images; re-run sync and tests
3. Breadcrumbs, simple tag filters, JSON-LD
4. a11y/audio transcripts, performance polish
5. Broader E2E coverage and search facets

## Notes

Phase 4 has functional breadth: users can discover, read, and listen. Next step is depth: recommendations, structure, and polish to make it feel intentional and complete.
