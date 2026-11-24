/**
 * Publication gate — the single rule for what appears on seez.eu.
 *
 * Default is "not public". An entry is public only when its frontmatter says
 * `publicationStatus: published` and it is not flagged `draft: true`.
 * Everything else (draft, archived, missing status) stays in the source code
 * on GitHub but never reaches the built website.
 *
 * Local preview: `pnpm dev:drafts` (SEEZ_PREVIEW=1 in dev mode) shows drafts
 * with a badge. A production build never shows drafts, whatever the env says;
 * `scripts/ci/publish-guard.mjs` re-checks the finished dist/ folder.
 */
import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import { isPreview } from './preview';

export { isPreview };

/** Collections whose entries need an explicit release. */
export const GATED_COLLECTIONS = new Set<string>([
  'books',
  'projects',
  'lab',
  'life',
  'music',
  'pages',
  'fragments',
  'texts',
  'artifacts',
]);

type PublishableData = { publicationStatus?: string; draft?: boolean } | undefined | null;

/** Released for the public website. */
export function isPublished(data: PublishableData): boolean {
  return !!data && data.draft !== true && data.publicationStatus === 'published';
}

/** Shown in the current run: released entries, plus drafts in local preview. */
export function isVisible(data: PublishableData): boolean {
  return isPublished(data) || isPreview();
}

/**
 * Drop-in replacement for `getCollection` that applies the gate.
 * Ungated collections (authors, legacy post) pass through unchanged.
 */
export async function getPublicCollection<C extends CollectionKey>(
  collection: C,
  filter?: (entry: CollectionEntry<C>) => unknown
): Promise<CollectionEntry<C>[]> {
  const entries = (await getCollection(collection)) as CollectionEntry<C>[];
  const gated = GATED_COLLECTIONS.has(collection);
  return entries.filter(
    (entry) => (!gated || isVisible((entry as { data: PublishableData }).data)) && (!filter || filter(entry))
  );
}
