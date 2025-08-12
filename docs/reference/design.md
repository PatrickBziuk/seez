# Design: Content Metadata & Badges

## Metadata Display

- Display all metadata at the top of content pages in an appropiate way
- It should be clear and visually appealing
- Use badges for AI/Human indicator and tags
- Show language, timestamp, and status clearly
- Clean, modern design with minimal clutter

## Badge Design

- Use color-coded badges for AI/Human status (e.g., blue for AI, green for Human, purple for AI+Human)
- Tags as pill-shaped badges with a retro style to it
- Timestamp as subtle text
- Language as a small flag or text badge

## Layout Integration

- Metadata section above main content
- Responsive design for mobile/desktop
- Consistent style across all content types

## Reusability

- Reuse existing badge/tag components if available
- Extend layouts to include metadata section

---

## i18n & Multilang Planning

- Note: Do NOT use <I18nextProvider> from astro-i18next. The package does not provide this component. Use the integration and useTranslation hook for i18n context.
- All UI strings (labels, badge texts, status, metadata headings, etc.) must use i18n keys, not hardcoded text.
- Cluster i18n keys by feature (e.g. metadata, badges, status, language, tags).
- Example i18n key clusters:
  - `metadata.title`, `metadata.subtitle`, `metadata.language`, `metadata.timestamp`, `metadata.status`
  - `badges.ai`, `badges.human`, `badges.ai_human`, `badges.tags`, `badges.language`
  - `status.created`, `status.corrected`, `status.translated`
- Provide fallback for missing translations.
- All new UI components/layouts must be multilang-ready by default.
- Document i18n key structure for easy extension.
- Plan for translation files per language (e.g. `en.json`, `de.json`).
- Ensure all UI/UX copy is translatable and clustered logically for maintainability.
- Use astro-i18next for dynamic translation loading and locale context.
- Refactor routes to use [lang=string] param and getStaticPaths for language routing.
- Wrap layouts with I18nextProvider and replace static labels with i18n keys.
- Create LanguageSwitcher component for user locale selection.
- Add hreflang SEO tags for alternate language URLs.
- Validate translation coverage in CI and during migration.
- Rationale: This approach ensures the site is multilang by default, easy to extend, and approachable for all users.

### Content Fallback Strategy

- If a page is not available in a selected language, redirect the user to the default language version (e.g., English).
- Display a dismissible notice on the page, informing the user that the content was not available in their chosen language and they have been redirected.
- The `LanguageSwitcher` should intelligently disable or visually distinguish links to languages for which a translation of the current page does not exist.

## Routing & LanguageSwitcher Implementation

- Refactored content routes to use [lang=string] param and getStaticPaths for language routing.
- Created LanguageSwitcher.astro with dropdown, flag, label, and accessibility features.
- Integrated LanguageSwitcher into PageLayout.astro, passing current locale and page slug.
- Updated [lang]/index.astro to use Astro frontmatter and correct export syntax for getStaticPaths.
- Documented routing and LanguageSwitcher steps in todo.md

## Type Safety & i18n Key Handling

- All i18n key objects (e.g., LANGUAGE_INFO) must be indexed with union types (e.g., 'en' | 'de'), not plain string.
- Use type assertions or runtime guards when indexing with variables.
- All function parameters must have explicit type annotations.
- Add global type declarations for external modules lacking types (e.g., astro-i18next).
- Document fixes for implicit 'any' and index signature errors.
- Use 'unknown' instead of 'any' in type declarations for strict mode compliance.

## Language Selector Placement & UI

- Place Language Selector icon next to dark/light mode toggle in header/navigation
- Use globe or language icon for selector button
- On click/tap, open a language drawer (dropdown/modal) listing available languages
- Drawer shows flag icons, language names, highlights current language, disables unavailable ones
- Responsive: drawer adapts to mobile (full-width or touch-friendly dropdown)
- Accessibility: ARIA labels, keyboard navigation, focus management
- Integrate with existing LanguageSwitcher component
- Maintain clean, modern UI

## Header Integration

- Update header/navigation to include both theme toggle and Language Selector
- Ensure both are accessible and visually balanced
- Document new UI pattern and integration steps

## Language Selector Integration Fixes

- Pass valid 'en' | 'de' value to LanguageSwitcher (derive from URL or default)
- Use 'onclick' instead of 'onClick' for button event
- Toggle drawer visibility with Astro state or script
- Remove old language menu from page footer
- Ensure accessibility and mobile responsiveness
- Test integration and document changes

## Language Selector Drawer Animation

- Add smooth transition effect for drawer opening/closing
- Use CSS transitions for sliding effect
- Ensure icons shift smoothly to make room for the drawer
- Test animations on desktop and mobile
- Maintain accessibility with ARIA attributes

## Language Selector Responsive Drawer & UX Fixes

- Drawer opens downward on desktop, upward on mobile
- Show "X" icon when drawer is open
- Clicking toggle, outside, or current language closes drawer
- Drawer overlays below/above icons, not over them
- Smooth transitions for open/close
- Accessibility: ARIA, keyboard navigation

## Language Selector: Analysis & Lessons Learned

- Astro is not React: no hooks, no state in frontmatter
- Use client scripts or client directives for interactivity
- Props must match component interface exactly
- HTML attributes must use correct casing (e.g., 'onclick', 'tabindex')
- Use CSS for responsive/directional drawer logic
- Handle drawer open/close and icon toggle in client script
- Record all lessons and new approach for future reference

## Header Double Rendering & TypeScript Error Fixes

### Problem Analysis

- Header appears twice: Caused by duplicate usage of `Header.astro` in both layout and page/component. Must ensure only one instance per page by using conditional slot rendering in `PageLayout.astro`.
- TypeScript errors: Custom property `window.toggleLanguageDrawer` not declared; event parameter missing type annotation.
- MetaData not found: Symbol used in `PageLayout.astro` but not imported/defined.

### Solution Steps

1. In `PageLayout.astro`, render the header only if not provided via slot. Use conditional rendering for the header slot.
2. In `Header.astro` script, declare `window.toggleLanguageDrawer` and add type annotations for event parameters.
3. In `PageLayout.astro`, import or define `MetaData`.
4. Test header rendering and Language Selector functionality. Confirm only one header appears and all errors are resolved.

### Rationale

- Prevents UI duplication and confusion.
- Ensures robust TypeScript typing and error-free builds.
- Maintains clean, maintainable codebase.

# Design Update: Language Selector Toggle

## Previous Approach

- Used a dropdown menu for language selection in the header.
- Dropdown listed available languages and handled accessibility features.

## Issue Encountered

- Dropdown UI caused layering, accessibility, and usability problems.
- Responsive behavior was not optimal.

## New Solution

- Replaced dropdown with a simple toggle button labeled "ENG" or "DEU".
- Toggle is visually minimal, only boxed on hover (like header icons).
- Clicking the toggle switches the language and updates the label.

## Rationale

- Minimal toggle is clearer, easier to use, and visually consistent.
- Reduces complexity and improves maintainability.
