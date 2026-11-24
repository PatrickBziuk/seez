/** True only in `astro dev` with SEEZ_PREVIEW=1 (`pnpm dev:drafts`). Never true in a build. */
export function isPreview(): boolean {
  return Boolean(import.meta.env.DEV) && typeof process !== 'undefined' && process.env.SEEZ_PREVIEW === '1';
}
