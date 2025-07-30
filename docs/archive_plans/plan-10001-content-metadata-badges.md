# Plan 10001: Content Metadata & UI Badges

## Goal
Implement a robust metadata and badge system for all content types, supporting multilingual display, status visualization, and responsive UI.

## Steps
- Extend content schema in `src/content/config.ts` (language, timestamp, status)
- Update TypeScript interfaces in `src/types.d.ts`
- Create reusable Badge component with variants
- Create ContentMetadata component for displaying metadata
- Integrate ContentMetadata into MarkdownLayout
- Ensure accessibility and responsive design

## Edge Cases
- Backward compatibility for old content
- Missing metadata fields
- Unrecognized language/status codes

## Impact
- Improved content discoverability
- Consistent metadata visualization
- Foundation for i18n and SEO features

## Checklist
- [x] Schema extended
- [x] Badge component created
- [x] ContentMetadata component created
- [x] Layout updated
- [x] Accessibility ensured
- [x] Responsive design

## References
- See `docs/design.md`, `docs/technical-spec.md`, `docs/implementation.md`, `docs/knowledge.md`
- Related tasks in `docs/todo.md`
