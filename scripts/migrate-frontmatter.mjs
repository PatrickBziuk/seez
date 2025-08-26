// Deprecated shim: this migration script was converted to TypeScript.
// Use `scripts/migrate-frontmatter.ts` instead.
// Keeping this file minimal to avoid Astro/TS checker errors.

if (require?.main === module) {
  console.log('This script is deprecated. Run: npx tsx scripts/migrate-frontmatter.ts');
  process.exit(0);
}

export {};
