/**
 * Public URL of a content entry (music, texts, fragments) in the relaunch routes.
 * Used by lists that mix collections (tags), so they never link to removed paths.
 */
import { getFigure } from '~/data/figures';
import { musicSlug } from '~/data/songs';
import { sectionUrl, type Lang } from './routes';

export function contentUrl(collection: string, id: string, lang: Lang): string {
  const slug = id.replace(/^(de|en)\//, '').replace(/\.mdx?$/, '');
  if (collection === 'music') return sectionUrl(lang, 'music', musicSlug(id));
  if (collection === 'fragments') return sectionUrl(lang, 'fragments', getFigure(slug)?.id ?? slug);
  if (collection === 'texts') return `/${lang}/texte/${slug}`;
  return `/${lang}`;
}
