# Archived TODOs: Content Metadata & UI Badges Feature

These tasks were completed as part of the LanguageSwitcher integration and accessibility improvements for the multilingual AstroWind-based site.

## LanguageSwitcher Integration Tasks

### 1. Toggle/Minimize Behavior
- Refactor LanguageSwitcher to be minimized by default, showing only current language (flag + label)
- Implement toggle logic to expand/collapse language list on click
- Ensure dropdown closes when clicking outside or selecting a language
- Add smooth transition for dropdown open/close

### 2. Accessibility Improvements
- Add ARIA attributes for expanded/collapsed state
- Ensure keyboard navigation (Tab, Enter, Esc) works for toggling and selecting languages
- Visually distinguish current language and disable unavailable languages

### 3. Responsive Placement & Styling
- Test LanguageSwitcher placement in header for desktop and mobile
- Adjust styles for mobile (full-width/touch-friendly dropdown)
- Ensure visual balance with theme toggle and other header icons

### 4. Header Integration & State Management
- Confirm only one LanguageSwitcher instance is rendered in header
- Pass current locale from layout/page to header and LanguageSwitcher
- Document integration steps and lessons learned in docs

---
# Lessons Learned & Integration Steps
- Use slot-based conditional rendering in PageLayout to avoid duplicate headers.
- Pass locale from layout/page to header, footer, and LanguageSwitcher for consistent i18n context.
- Use client-side event listeners for dropdown toggle and accessibility.
- Documented all changes and rationale in design.md and technical-spec.md.
