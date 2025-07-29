---
applyTo: '**'
---

# Copilot Instructions for AstroWind-based Projects

## Project Overview

- **Framework:** Astro 5.x with Tailwind CSS
- **Content Model:**  
    - Content lives in `src/content/{collection}/` as Markdown (`.md`) files  
    - Collections are defined in `config.js` using `defineCollection`
- **Pages:**  
    - Dynamic routes for each collection (e.g., `[slug].astro`) render individual entries  
    - Listing pages (e.g., `index.astro`) use `getCollection`
- **Layouts:**  
    - Common layouts in `layouts/` (e.g., `MarkdownLayout.astro` for content entries)
- **Navigation:**  
    - Header/footer navigation is defined in `navigation.ts`  
    - Uses utility functions from `permalinks.ts`

---

## Key Conventions

- **Content Collections:**  
    - Always update `config.js` when adding new collections  
    - Use the same schema pattern as existing collections
- **Dynamic Routing:**  
    - Use `[slug].astro` files for per-entry pages  
    - Use `getEntry({ collection, slug })` for fetching entries
- **Type Safety:**  
    - After changing content collections or schemas, run `pnpm astro sync` and restart the dev server to update types
- **No Blog Remnants:**  
    - Remove or ignore any `/blog` or post references unless explicitly re-enabled
- **Navigation:**  
    - Use `getPermalink` for all internal links in navigation data

---

## Developer Workflows

- **Install:** `pnpm install`
- **Dev Server:** `pnpm run dev` (default port: 4321)
- **Build:** `pnpm run build` (output: `/dist`)
- **Check:** `pnpm run check` (Astro, ESLint, Prettier)
- **Format/Fix:** `pnpm run fix`
- **Sync Content Types:** `pnpm astro sync` (run after changing `config.js` or adding collections)

---

## Integration Points

- **DecapCMS:** Admin UI is integrated for content editing; config in `config.yml`
- **SEO/Analytics:** Provided via Astro integrations in `astro.config.ts`
- **Image Optimization:** Use Astro Assets and Unpic

---

## Patterns & Examples

- **Listing Example:** See `index.astro` for how to list collection entries
- **Detail Example:** See `[slug].astro` for how to render a single entry
- **Schema Example:** See `config.js` for collection schema definition
- **Navigation Example:** See `navigation.ts` and `permalinks.ts`

---

## Special Notes

- After any schema or collection change, always run `pnpm astro sync` and restart the dev server
- Do **not** use deprecated `getEntryBySlug`; always use `getEntry({ collection, slug })`
- All content collections must be registered in `config.js` for type safety and correct routing
