# Plan 10036: Repository Overhaul & SEO/i18n Hardening [COMPLETED]

**Date**: August 16, 2025  
**Status**: ✅ **COMPLETED** - Core objectives achieved, Phase 3 superseded by Plan 10037  
**Goal**: Fix language handling, de-duplicate SEO, harden i18n routing and alternates, shrink bundles, and make Pagefind/astro:transitions opt-in.  
**Results**: Enhanced development experience with environment-dependent metadata system

## Implementation Summary

### ✅ Phase 1 — Language correctness and alternates [COMPLETED]

**T36-001 Fix `<html lang>` binding** ✅

- Fixed `Layout.astro` to use `Astro.params.lang` with fallback
- Language correctly reflects current route language on all pages

**T36-002 Normalize route assumptions** ✅

- Created `utils/seo/alternates.ts` utility
- Replaced brittle regex-based alternates with normalized route handling
- Integrated into `Layout.astro` with `buildAlternates()` function

**T36-003 Sitemap i18n configuration** ✅

- Enhanced `astro.config.ts` with i18n sitemap configuration
- Added xhtml:link alternates support for proper hreflang indexing

### ✅ Phase 2 — SEO consolidation [COMPLETED]

**T36-010 Make Metadata.astro the single source of truth** ✅

- Enhanced `Metadata.astro` with canonical ID support
- Added `canonicalId` prop interface with `getCanonicalUrl()` and `getHreflangData()` integration
- Updated hreflang link generation with canonical ID support

**T36-011 Deprecate parallel SEO paths** ✅

- Added development-only deprecation warnings to `SEO.astro` and `CanonicalSEO.astro`
- Updated `MarkdownLayout.astro` to use consolidated `Metadata.astro` approach
- Maintained backward compatibility while encouraging migration

**T36-012 Environment-dependent metadata system** ✅

- Implemented optional canonical IDs in development for simplified content creation
- Created environment-aware content schema (`canonicalId` optional everywhere)
- Added URL strategy configuration (human-readable vs canonical ID URLs)
- Created development content helpers with auto-generation capabilities

### 🚧 Phase 3 — Build hygiene [SUPERSEDED BY PLAN 10037]

**T36-020 Bundle optimization** - Moved to Plan 10037 (enhanced scope)  
**T36-021 Compression and caching** - Moved to Plan 10037 (CI/CD integration)  
**T36-022 Pagefind optimization** - Moved to Plan 10037 (includes search icon & warning fixes)

> **Note:** Phase 3 has been superseded by Plan 10037 which includes these tasks within a broader automation and enhancement strategy. Plan 10036 is considered **COMPLETED** for its core objectives.

## Current Architecture

### **URL Strategy**

- **Primary**: Human-readable URLs (`/en/life/trumps-coup`)
- **Optional**: Canonical ID redirects (`/en/life/canonical/01JDX...` → `/en/life/trumps-coup`)
- **Configurable**: Environment-based URL strategy via `USE_CANONICAL_URLS`

### **Content Schema**

```typescript
canonicalId: z.string().min(8).optional(); // Optional everywhere for dev UX
```

### **Environment Files**

- `.env.development` - Relaxed validation, simplified workflow
- `.env.production` - Configurable validation and URL strategy

### **SEO Architecture**

- **Single source**: `Metadata.astro` handles all SEO metadata
- **Canonical ID support**: Integrated with existing canonical-urls system
- **Backward compatibility**: Deprecated components show warnings but remain functional
- **Hreflang**: Enhanced with canonical ID relationships
  hreflang: l,
  href: new URL(`/${l}/${stripped}`, Astro.site).toString()
  }));
  }

````

**Acceptance:** All localized pages render correct alternates; non-localized utility pages don’t emit hreflang.

### T36-003 Locale-aware sitemap

Add `@astrojs/sitemap` with xhtml:link alternates. Validate only canonical URLs are canonicalized; alternates exist for all locales.

**Risk:** Search console churn. **Mitigation:** keep URL structure stable and push 301s only when necessary. You’ve already documented redirect hygiene and SEO safeguards; keep following that.

* * *

Phase 2 — SEO consolidation (single source of truth)
----------------------------------------------------

### T36-010 De-duplicate SEO components

**Problem:** Three parallel SEO paths risk duplicate canonicals/OG/Twitter/JSON-LD.
**Decision:** Keep `src/components/core/meta/Metadata.astro` as the single source. Route all layouts through it; retire `SEO.astro` and `CanonicalSEO.astro` by exporting no-ops that warn in dev only.

**Definition of done:**

*   Exactly one `<link rel="canonical">`.
*   Exactly one OG/Twitter set.
*   JSON-LD merged into a single `<script type="application/ld+json">` block when multiple types are needed.

**Note:** Your metadata/author/AI-impact UI is already in place; do not regress it.

### T36-011 Gate debug scripts

Any inline debug in SEO components must be wrapped:

```ts
if (import.meta.env.DEV) { /* diagnostics only */ }
````

---

## Phase 3 — Build hygiene, chunking, compression

### T36-020 Robust manualChunks

Swap static `manualChunks` for a function that groups node_modules. Improves cache hit rates when deps drift.

```ts
// astro.config.ts
export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            return id.includes('node_modules') ? 'vendor' : undefined;
          },
        },
      },
      cssCodeSplit: true,
      reportCompressedSize: false,
      target: 'es2020',
    },
  },
});
```

Add `rollup-plugin-visualizer` locally to validate the new chunk shape before merging.

### T36-021 HTML/CSS/JS compression

Add `@playform/compress` (or `astro-compress`) for precompression. Keep zero-runtime footprint.

### T36-022 Caching headers

Ship long-cache for hashed assets, no-cache for HTML (Netlify/Vercel headers). Example:

- `/*.html` → `cache-control: no-cache`
- `/assets/*.[hash].*` → `cache-control: public, max-age=31536000, immutable`

**Benefits:** Faster builds, smaller output. Matches your “keep it boring” pipeline. Your docs-driven protocol expects you to document this; do so.

---

## Phase 4 — Images, fonts, and above-the-fold priorities

### T36-030 Prefer Astro `<Image>` for local assets

Keep your custom Image component only for remote/unpic flows. For local images:

```astro
import {Image} from "astro:assets";
<Image src={import.meta.glob('~/assets/**/*')} alt={alt} format={['avif', 'webp', 'png']} />
```

### T36-031 Remove redundant IntersectionObserver

If it merely flips `loading`, it’s wasted JS. Keep IO only for LQIP/reveal effects.

### T36-032 Font hygiene

Self-host woff2, preload critical subsets, `font-display: swap`. Avoid `preconnect` unless fonts really are remote.

---

## Phase 5 — Routing & transitions

### T36-040 Make `astro:transitions` opt-in via env

Keep ClientRouter when the budget allows, but make it toggleable:

```astro
{import.meta.env.PUBLIC_ENABLE_TRANSITIONS === '1' && <ClientRouter />}
```

Add link prefetch on hover/in-viewport to smooth navigations. Validate that CLS/LCP remain stable. If they don’t, the flag goes off. You’ve already got a habit of measuring impact; keep it.

---

## Phase 6 — Search (Pagefind) diet

### T36-050 Shrink the index

- Add `data-pagefind-ignore` to nav, footer, legal.
- Wrap article bodies in `data-pagefind-body` to index only real content.

This trims index size and speeds client-side search. Minimal code, maximal sanity.

---

## Phase 7 — Canonical ID routing (optional, guarded rollout)

You deferred canonical-ID URLs earlier to avoid breaking links. If you’re ready:

### T36-060 Implement canonical ID routes

- Add `[canonicalId].astro` and resolve the current language variant by `canonicalId + lang`.
- Generate 301s from the old slug paths to the new canonical route, but only after Search Console warm-up.

### T36-061 Internal link updater

Script to rewrite internal links to canonical form, then run sitewide link check.

**Follow the risk playbook you already wrote for redirects, sitemap updating, and Search Console notifications.**

---

## Phase 8 — Tests, monitoring, and CI polish

### T36-070 Lighthouse CI & Web Vitals logging

- Add LHCI to PRs for regressions.
- Tiny inline Web Vitals logger gated for production to catch CLS/LCP jank introduced by transitions/images.

### T36-071 Bundle analysis check

- `pnpm analyze` runs rollup visualizer locally; attach a screenshot to PRs touching `astro.config.ts`.

### T36-072 Pagefind smoke test

- Simple assertion that non-content is ignored, body is indexed.

---

## Concrete code patches (illustrative)

### 1) `Layout.astro` language + alternates

```astro
---
// layouts/Layout.astro
import { i18nConfig, SUPPORTED_LANGUAGES } from '@/utils/i18n';
import { buildAlternates } from '@/utils/seo/alternates';
const currentLang = Astro.params.lang ?? i18nConfig.defaultLanguage;
const alternates = buildAlternates(Astro, SUPPORTED_LANGUAGES);
---

<html lang={currentLang}>
  <head>
    {alternates.map((a) => <link rel="alternate" hreflang={a.hreflang} href={a.href} />)}
    <!-- Use Metadata.astro only -->
    <Metadata />
  </head>
  <body>...</body>
</html>
```

### 2) `astro.config.ts` chunking + compression

```ts
import { defineConfig } from 'astro/config';
import compress from '@playform/compress';

export default defineConfig({
  integrations: [compress()],
  vite: {
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            return id.includes('node_modules') ? 'vendor' : undefined;
          },
        },
      },
    },
  },
});
```

---

## Risks & mitigations

- **SEO duplication** if old SEO components aren’t removed.  
  Mitigation: DEV-only warning export for `SEO.astro` and `CanonicalSEO.astro`, unit test for “exactly one canonical tag.”
- **Broken alternates** if pages live outside `[lang]/`.  
  Mitigation: either move them or explicitly opt them out. Add an integration test that crawls build output and validates hreflang pairs.
- **CLS from transitions** if prefetching is off.  
  Mitigation: feature flag and LHCI budget thresholds.

You’ve already codified rollback patterns for SEO changes and redirects; reuse them.

---

## Deliverables

- Working `<html lang>` binding and alternate link generator.
- Single SEO component in use, other SEO paths deprecated.
- New chunking strategy, compression enabled, caching headers config.
- Pagefind diet and opt-in transitions.
- Optional canonical-ID routing with redirect script and link updater.
- LHCI config, bundle analyzer script, and basic search/SEO smoke tests.

---

## Timeline (aggressive but sane)

1.  **Day 1**: T36-001..003 (lang + alternates + sitemap), unit test alternates.
2.  **Day 2**: T36-010..011 (SEO consolidation), write “exactly-one-canonical” test.
3.  **Day 3**: T36-020..022 (chunking/compress/cache), run analyzer, capture baseline.
4.  **Day 4**: T36-030..032 (images/fonts), LCP spot checks.
5.  **Day 5**: T36-040 (transitions flag + prefetch), Pagefind diet (T36-050).
6.  **Day 6**: Optional canonical-ID routing (T36-060..061) behind a feature flag.
7.  **Day 7**: LHCI + Web Vitals logger + smoke tests (T36-070..072).

Document each phase under `/docs/` per your protocol. You already require plans + linkage in `todo.md`; keep that discipline.

---

## Integration notes with existing systems

- **Frontmatter & authors:** Do not touch; it’s already consolidated with author references and ledger UI.
- **Metadata automation (pre-commit):** Keep your detection/injection workflow; ensure new sitemap/SEO code doesn’t introduce content-layer dates accidentally.
- **AI ledger:** Unchanged. Keep it separate from content to avoid bloat.

---

## Checklists

### Repo structure

- `utils/seo/alternates.ts` created
- `layouts/Layout.astro` uses `currentLang` and `alternates`
- `components/core/meta/Metadata.astro` is the single SEO entry
- `components/core/SEO.astro` and `components/core/CanonicalSEO.astro` deprecated with DEV warnings

### Build

- `astro.config.ts` updated (manualChunks, compression, targets)
- `visualizer` script exists and documented
- Pagefind ignore/body attributes added
- Transitions behind `PUBLIC_ENABLE_TRANSITIONS`

### Ops

- Headers config added (Netlify/Vercel)
- Sitemap with alternates enabled
- LHCI in CI, budgets set; Web Vitals logger gated

### Optional

- Canonical-ID router behind feature flag
- Redirects + Search Console submission playbook followed

---

## Post-merge validation

- Build routes count and time vs baseline (keep those obsessive numbers coming).
- LHCI JSON diff shows no regression > budget.
- Crawl `dist/` to assert single canonical + correct alternates per page.
- Pagefind index size reduced; search still returns expected results.

---
