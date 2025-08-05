# Plan 10012: Type Safety & ESLint Cleanup

## Goal

Fix all TypeScript and ESLint errors for type safety and maintainability.

## Steps

1. Refactor all `any` types to explicit interfaces.
2. Fix type mismatches for language props (`string` → `'en' | 'de'`).
3. Remove unused variables and imports.
4. Update Node.js scripts to use ES module `import` syntax.
5. Fix DOM/JS errors in tag search/filter (add null checks, correct property access).
6. Remove unsupported `key` prop from Astro `<li>` elements.
7. Validate all changes with `pnpm run check` and `pnpm run fix`.

## Impact

Cleaner codebase, fewer runtime errors, improved developer experience.
