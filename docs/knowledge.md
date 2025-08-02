# Astro-i18next & TypeScript Integration Knowledge

- Astro-i18next does not export a `useTranslation` hook like React-i18next. Use static helpers or middleware for translations.
- TypeScript type declarations (`.d.ts` files) do not create runtime exports. Always verify actual package exports before using them.
- For SSR frameworks like Astro, prefer static translation loading (e.g., `getTranslations(locale)`) over runtime hooks.
- Always check official documentation and package exports before integrating features.
- Do not rely on React patterns in Astro projects; APIs and usage may differ.
- Run builds and type checks after changes to catch errors early.
- Document custom translation patterns and helpers for maintainability.

## SEO & QA Best Practices (2025 Update)

- All pages include language-specific meta tags (`hreflang`, canonical URLs) and OpenGraph tags via Metadata.astro.
- Sitemap is dynamically generated for all language routes in `src/pages/sitemap.xml.ts`.
- Navigation, header, and footer use translation keys from locale files for all visible text.
- LanguageSwitcher is integrated and tested in header and footer.
- ContentFallbackNotice displays user-friendly notices when content is unavailable in the selected language.
- CI scripts (`test:translations`, `test:routing`) validate translation key completeness and routing for all language variants.
- Build checks ensure no missing translations or broken routes.
- See scripts/ for test logic and package.json for integration.

## Language Detection & Redirect Best Practices (2025 Update)

- **Root domain handling**: Implemented elegant client-side language detection instead of ugly server redirects.
- **Browser language detection**: Use `navigator.languages` array to detect user's preferred language from browser settings.
- **Static deployment compatibility**: Client-side detection works perfectly with static site generation, no SSR required.
- **Fallback mechanisms**: Always include fallback to default language (English) for unsupported languages.
- **UX considerations**: Show professional loading screen during detection rather than blank page or ugly redirect message.
- **Performance**: Keep detection minimal (200ms) for smooth user experience with 2-second safety fallback.
- **Future extensibility**: Server-side detection utilities (`detectLanguageFromHeaders`) available for future SSR migration.
- **Implementation**: Root `index.astro` contains full HTML page with inline CSS/JS for fast loading and immediate detection.