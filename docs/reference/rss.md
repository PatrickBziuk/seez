# RSS Feeds

This site exposes multiple RSS feeds built from Astro Content Collections and configured via `seez.config`. Feeds are language-aware, collection-scoped when requested, and include robust publication dates.

## Endpoints

- Global: `/rss.xml`
- Per‑locale: `/:lang/rss.xml` (e.g., `/en/rss.xml`, `/de/rss.xml`)
- Per‑locale + collection: `/:lang/:collection/rss.xml`
  - Examples: `/en/books/rss.xml`, `/en/projects/rss.xml`, `/de/lab/rss.xml`, `/de/life/rss.xml`, `/en/music/rss.xml`

Notes:
- Trailing slashes are disabled globally (`trailingSlash: 'never'`), so feed URLs do not end with `/`.
- Only content with `publicationStatus === 'published'` is included.

## Date semantics

- Item pubDate: prefers `updatedAt` when present; otherwise falls back to `firstPublishedAt`.
- Channel `lastBuildDate`: set to the newest item date included in the feed, or the current time if no items match.

## Configuration (`seez.config`)

The `rss` section centralizes behavior:

```ts
rss: {
  enabled: boolean;         // Toggle all RSS routes
  limit: number;            // Max items per feed (default ~50)
  perLocale: boolean;       // Enable /:lang/rss.xml
  perCollection: boolean;   // Enable /:lang/:collection/rss.xml
  collections: string[];    // Collections to include (e.g., ['books','projects','lab','life','music'])
}
```

Accessors:
- `getRssConfig()` — reads config
- Utility: `buildRssItems({ language?, collection? })` — returns filtered, sorted items and `lastBuildDate`
- Utility: `getRssChannelMeta(scope)` — channel title/description per scope (global, locale, locale+collection)

## Autodiscovery

`<link rel="alternate" type="application/rss+xml" href="/rss.xml" title="RSS" />` is injected in the site head when RSS is enabled.

## Verification

- Global: `/rss.xml` → 200 with valid XML
- Localized: `/:lang/rss.xml` → 200 when `perLocale` is true
- Scoped: `/:lang/:collection/rss.xml` → 200 when `perCollection` is true and collection is allowed

## Troubleshooting

- 404: Ensure `rss.enabled` is true and that the route files exist.
- Empty feed: Confirm there is at least one item with `publicationStatus: 'published'` in the targeted language/collection.
- Wrong dates: Check content metadata for `updatedAt` and `firstPublishedAt` values and format (ISO 8601 recommended).

## Related files

- `src/pages/rss.xml.ts` — Global feed
- `src/pages/[lang]/rss.xml.ts` — Per‑locale feed
- `src/pages/[lang]/[collection]/rss.xml.ts` — Per‑locale + collection feed
- `src/utils/rss.ts` — Feed builder & channel metadata helpers
- `src/config/seez.config.ts` — RSS settings
- `src/components/core/meta/Metadata.astro` — RSS autodiscovery link
