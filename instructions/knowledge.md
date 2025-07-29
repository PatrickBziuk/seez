# Astro-i18next & TypeScript Integration Knowledge

- Astro-i18next does not export a `useTranslation` hook like React-i18next. Use static helpers or middleware for translations.
- TypeScript type declarations (`.d.ts` files) do not create runtime exports. Always verify actual package exports before using them.
- For SSR frameworks like Astro, prefer static translation loading (e.g., `getTranslations(locale)`) over runtime hooks.
- Always check official documentation and package exports before integrating features.
- Do not rely on React patterns in Astro projects; APIs and usage may differ.
- Run builds and type checks after changes to catch errors early.
- Document custom translation patterns and helpers for maintainability.