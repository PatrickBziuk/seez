# Copilot Instructions for Seez (AstroWind-based Project)

## 1. Project Overview & Architecture
- Framework: Astro 5.x with Tailwind CSS
- Content lives in `src/content/{books,projects,lab,life}/` as Markdown
- Collections defined in `src/content/config.ts` using extended schema
- Dynamic routes for each collection; listing pages use `getCollection`
- Layouts in `layouts/`, e.g., `MarkdownLayout.astro` includes `ContentMetadata`
- Navigation centralized in `src/navigation.ts` using `getPermalink()`
- Vendor integration in `vendor/integration/` loads config from `src/config.yaml`
- Multilingual support via `astro-i18next` and custom i18n utilities
- Badge system for metadata visualization
- Responsive design with Tailwind CSS and dark mode

## 2. Content Schema Pattern
All collections use extended schema with multilingual metadata:
```yaml
title: string
language: 'en' | 'de'  # Default: 'en'
timestamp?: string     # ISO 8601
status?: {
  authoring: 'Human' | 'AI' | 'AI+Human'
  translation?: 'Human' | 'AI' | 'AI+Human'
}
tags: string[]
```

## 3. Key Conventions
- Always update `src/content/config.ts` when adding collections
- Use `[slug].astro` for per-entry pages
- Use `getEntry({ collection, slug })` for fetching entries
- After schema changes, run `pnpm astro sync` and restart dev server
- Remove/ignore `/blog` references unless re-enabled
- Register all collections for type safety and routing

## 4. Development Workflows
- Install: `pnpm install`
- Dev Server: `pnpm run dev` (port 4321)
- Build: `pnpm run build` (output: `/dist`)
- Check: `pnpm run check`
- Format/Fix: `pnpm run fix`
- Sync Content Types: `pnpm astro sync`
- Content Flow: Add/modify content → update config if schema changes → sync → restart dev server

## 5. Integration Points
- DecapCMS at `/admin` with config in `public/admin/config.yml`
- Content loading uses Astro 5 `glob()` loader
- SEO/Analytics via Astro integrations
- Image optimization: Astro Assets and Unpic

## 6. Patterns & Examples
- Listing: see `index.astro`
- Detail: see `[slug].astro`
- Schema: see config
- Navigation: see `navigation.ts` and `permalinks.ts`

## 7. Component Documentation
Every component must include a documentation comment at the top:
```astro
---
/**
 * ComponentName - Brief purpose description
 * @props - List key props and types
 * @behavior - Expected component behavior
 * @dependencies - External libraries or other components used
 * @usedBy - Direct parent components that integrate this
 */
```

## 8. Docs-Driven Protocol
- Regularly use the `docs/` folder for knowledge, planning, and task management.
- For every new feature or fix, create/update a plan in `docs/`, referencing design, implementation, technical-spec, and review docs as needed.
- For larger features, create a specialized plan file in `docs/` named with a unique number and descriptive name (e.g., `plan-12023-feature-name.md`).
- All tasks managed in `docs/todo.md`, with links to their corresponding plan files.
- Use docs for ongoing knowledge capture, lessons learned, and documentation of implementation details.
- Document every step, decision, and change in the appropriate file in `docs/`.
- Archive completed tasks in `docs/archive_todo.md` to maintain a history of work done.
- Archive the plans for features or fixes in `docs/archive_plans/` to keep a record of past work.

## 9. Workflow Protocol
### 1. Always Plan First
- Create a corresponding plan file in `/docs/` before implementing any feature or fix.
- Plan must include: feature/bug title, goal, steps, edge cases, impact, checklist.
- Link plan in `todo.md` when creating new tasks.
- Have a look on the docs, and especially the archived plans, to understand the context and history of the project.

### 2. Task Management
- Use `todo.md` for tasks; mark as done or archive in `/docs/archive_todo.md` (never delete).
- Group tasks meaningfully; link to plan files.

### 3. Documentation & Communication
- Annotate changes in `todo.md` with notes or obstacles.
- Reference docs/plan files as needed.
- Log obstacles in plan or issue files.
- Add documentation comment to every component you touch.

## 10. Retry Expectations
- On bug/failure, attempt five unique strategies before marking as blocked.
- Use inline `// Attempt 1`, `// Attempt 2`, etc. in code if needed.

## 11. Boundaries
- Align changes with `docs/component-structure.md`, `docs/data-structure.md`, and `docs/multilingual-support.md`.
- Respect existing data schema and language-aware behavior.
- Do not alter design, UX, or core logic unless explicitly allowed in a plan or issue.

## 12. Final Output Responsibilities
- Update relevant source files and commit.
- Mark tasks as complete in `todo.md`.
- Add notes in plan/task files.
- Archive completed major blocks in `archive_todo.md`.

---

By following this streamlined protocol, Copilot will ensure structured, transparent, and maintainable development, leveraging the docs for all planning, knowledge, and task management.
