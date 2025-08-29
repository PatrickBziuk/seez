# Plan 10044: FRAGMENT Redesign for Figures + Press Page

Date: 2025-08-29
Status: Completed

Goal

- Redesign figure pages from SCP-style containment to FRAGMENT identity framing
- Keep multilingual support (de/en)
- Add a Press page explaining the project to media
- Update the Welcome explainer to introduce the FRAGMENT concept

Steps

- Update `src/pages/[lang]/figuren/index.astro` UI: gradient overlays, symbolism chips, FRAGMENT copy
- Update `src/pages/[lang]/figuren/[slug].astro` copy and header: remove containment, add FRAGMENT header and note
- Tweak `src/pages/[lang]/welcome.astro` to mention FRAGMENTS
- Add `src/pages/[lang]/press.astro` (multilingual press explainer)
- Wire navigation to include Press

Edge cases

- Missing `image` falls back to `/images/figures/{base}.png`
- Optional fields (symbolism, movementGrammar) handled gracefully
- i18n labels for de/en everywhere

Checklist

- [x] Listing redesign
- [x] Detail redesign
- [x] Welcome explainer tweak
- [x] Press page
- [x] Nav wiring

Notes

- Schema remains compatible; `containmentNote` reinterpreted as optional FRAGMENT note
- No breaking changes to content or routes

---

## Post-Completion Update — 2025-08-29

### Current State

- FRAGMENT identity framing live for listing/detail.
- figures ➜ fragments migration implemented: `/[lang]/fragmente` pages are active; legacy `/[lang]/figuren` still present for verification.
- New `ProfileCard.astro` (framework-free) added with minimalist TCG styling and reduced tilt; integrated on `/[lang]/fragmente` grid.
- Press page created and formatted; site checks pass (Astro check 0 errors, ESLint clean, Prettier clean).

### What We Tried

- Attempted a React/TSX ProfileCard embedded in `.astro` → led to parser issues and missing React typings.
- Pivoted to a pure Astro component with dedicated CSS, using CSS variables and a small inline script for tilt and pointer-driven effects.
- Added vendor-prefixed CSS for mask/backdrop and reordered properties to satisfy linters.

### What Worked

- Pure Astro ProfileCard with variants (`minimal` default, optional `holo`) met aesthetic and performance goals.
- Reduced motion via `tiltIntensity` (default 0.3) and disabled mobile tilt by default; iOS motion permission gated.
- Neutral, colorless UI achieved; shine/glare disabled for listing use.
- Build hygiene restored: removed stray TSX from `src/` and formatted codebase; all checks green.

### Next Steps

- Add redirects: `/[lang]/figuren/*` ➜ `/[lang]/fragmente/*`; remove legacy routes after QA.
- Create EN translations for all fragments and tone-adjust copy.
- Validate RelatedContent across collections post-rename and expand tests.
- Optional cleanup: remove redundant "no-shine" overrides now that `variant="minimal"` covers neutrality.
