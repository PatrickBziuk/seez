# Plan 10040: RSS Feed Fix

## Goal

Fix 404 on /rss.xml and provide a working RSS feed listing the most recent published content across active collections (books, projects, lab, life, music), language-aware and respecting trailingSlash: 'never'. Add per-locale feeds and per-locale+collection feeds. Include proper publication dates and lastBuildDate.

## Steps

1. Replace blog-gated route logic in `src/pages/rss.xml.ts` that returns 404 when the legacy blog is disabled.
2. Aggregate content from active collections using Astro Content Collections API.
3. Filter to published entries only (publicationStatus === 'published' and not draft).
4. Build absolute, localized item links using /:lang/:collection/:slug-:canonicalId when canonicalId is present, else fallback to /:lang/:collection/:slug.
5. Set RSS metadata using seez config (site name, description, base url).
6. Limit to latest N items (default 50), sorted by updatedAt > firstPublishedAt fallback; expose <lastBuildDate> at channel level.
7. Add /[lang]/rss.xml for per-locale; add /[lang]/[collection]/rss.xml for per-locale+collection.
8. Validate dev server logs show 200 for /rss.xml and localized routes.

## Edge Cases

- Entries missing canonicalId (use slug-only URL format).
- Missing dates: fallback to file path order or skip; prefer updatedAt > firstPublishedAt > Date.now().
- Draft/unpublished content must not appear.
- Mixed languages: include all; consumers can filter; ensure absolute URLs include language prefix.

## Impact

- Unblocks RSS consumers; improves SEO and syndication.

## Checklist

- [x] Update rss.xml.ts implementation
- [x] Dev test: GET /rss.xml returns 200 with valid XML
- [x] Content filters exclude drafts/unpublished
- [x] Links are absolute and localized
- [x] Add per-locale and per-locale+collection feeds
- [x] Include lastBuildDate
- [x] Docs updated (todo + plan archived when done)
