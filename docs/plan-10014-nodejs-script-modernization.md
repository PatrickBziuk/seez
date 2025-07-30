# Plan 10014: Node.js Script Modernization

## Title
Modernize Node.js scripts for translation and routing tests

## Goal
Refactor legacy Node.js scripts to use ES module imports, remove type errors, and ensure compatibility with current linting and CI requirements.

## Steps
1. Audit all scripts in `scripts/` for CommonJS and type errors.
2. Refactor `test-translations.js` to use ES module imports and remove type annotations.
3. Refactor `test-routing.js` to use ES module imports and remove unused variables.
4. Validate both scripts for lint/type errors and CI compatibility.
5. Update `todo.md` and this plan with completion notes.

## Edge Cases
- Scripts must run in CI and local environments.
- No TypeScript syntax in `.js` files.
- Handle missing translation keys and content variants robustly.

## Impact
- Ensures robust CI checks for multilingual content and routing.
- Prevents runtime and lint errors in scripts.
- Aligns with project standards for maintainability.

## Checklist
- [x] Audit scripts for CommonJS/type errors
- [x] Refactor test-translations.js (ESM, no type annotations)
- [x] Refactor test-routing.js (ESM, no unused vars)
- [x] Validate scripts (no lint/type errors)
- [x] Update todo.md and plan with completion notes

## Completion Notes
All steps completed. Scripts now use ES module imports, have no type/lint errors, and are CI-ready. See `todo.md` for status.
