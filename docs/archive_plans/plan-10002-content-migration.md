# Plan 10002: Content Migration Script

## Goal

Automate migration of existing content to new schema, ensuring data integrity and backup.

## Steps

- Create migration script in `scripts/migrate-content.js`
- Implement backup system for content directory
- Add dry run mode for previewing changes
- Parse and merge frontmatter with defaults
- Validate fields and report errors
- Output progress and summary statistics

## Edge Cases

- Files with invalid frontmatter
- Backup failures
- Unwritable files

## Impact

- Safe schema migration
- Reduced manual errors
- Improved content consistency

## Checklist

- [x] Script created
- [x] Backup system implemented
- [x] Dry run mode
- [x] Validation system
- [x] Progress reporting
- [x] Content updated

## References

- See `docs/implementation.md`, `docs/technical-spec.md`
- Related tasks in `docs/todo.md`
