# Plan 10042: About Wiring, Aggregated Blog, and Homepage Enhancements

Status: Completed on 2025-08-27

Goal

- Wire multilingual About pages to the correct route and filenames
- Ensure Tech Stack page is properly wired
- Implement a localized, aggregated Blog listing that pulls from all collections and sorts by date
- Fix footer Blog link to point to the new localized blog route
- Improve localized homepage to include all categories and latest items

Scope of changes

- Content: Created src/content/pages/about/{en,de}.md from legacy about-en.md/about-de.md
- Pages: Added src/pages/[lang]/blog/index.astro (aggregated blog), enhanced src/pages/[lang]/index.astro (hero + category previews)
- Navigation: Footer Blog link now points to /[lang]/blog via getLocalizedUrl
- Validation: Ran content sync, build, and checks; resolved Prettier parse errors via .prettierignore additions

Edge cases considered

- Content without publishDate/firstPublishDate: robust date parsing with safe fallbacks
- Draft/archived entries: filtered out to show only published items
- Per-collection URL differences (e.g., pages/about, pages/tech-stack): special-cased URL builder
- Language filtering and localized paths for en/de

Checklist

- [x] Migrate About content to src/content/pages/about/{lang}.md
- [x] Verify Tech Stack content exists at src/content/pages/tech-stack/{lang}.md
- [x] Implement /[lang]/blog with cross-collection aggregation and sorting
- [x] Fix footer Blog link to localized path
- [x] Enhance /[lang]/ homepage with hero and category sections
- [x] Run build and checks; resolve any errors

Follow-ups (optional)

- Add pagination to /[lang]/blog if content volume grows
- Expand category sections to include Life/Music previews on homepage when content increases
- Consider a mass Prettier format pass (pnpm run fix) in a dedicated formatting-only commit
