# Plan: Content Metadata & UI Badges

## Goals
- Extend content metadata for language, timestamp, and AI/Human status
- Display metadata at top of content pages with badges
- Reuse existing components where possible
- Maintain clean, modern UI
- Ensure all UI is multilang/i18n-ready from the start
- Integrate multilanguage routing, locale-aware frontmatter, dynamic translation loading, UI string replacement, and fallback handling

## Steps
1. Analyze repo for reusable components/layouts
2. Design metadata schema and badge UI
3. Document design and implementation
4. Plan migration for all content files
   - Move .md files into language-specific directories
   - Add language field to frontmatter
   - Validate translation coverage
5. Update layouts/components to display metadata
   - Refactor layouts to use I18nextProvider
   - Replace static labels with i18n keys
6. Cluster all UI strings into i18n keys by feature
   - Document key structure for maintainability
7. Document i18n key structure and translation file format
   - Create en.json and de.json in src/locales/
   - Ensure keys match clusters from design.md
8. Install and configure i18n libraries
   - Use astro-i18next, i18next, react-i18next
   - Configure astro.config.mjs for translation loading
9. Refactor content routes for multilanguage
   - Rename page files to [lang=string]/foo.astro
   - Add getStaticPaths for language routing
10. Implement LanguageSwitcher and SEO tags
    - Create LanguageSwitcher component for locale switching
    - Add hreflang tags for SEO
11. Add translation-validation to CI
    - Use i18next-scanner to validate translation coverage
12. Review plan from UI and technical perspectives
