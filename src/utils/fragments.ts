/**
 * Figure dossiers: figures.json joined with the gated `fragments` collection.
 * A figure page exists only while its dossier entry is public (or in draft preview).
 */
import type { CollectionEntry } from 'astro:content';
import { getPublicCollection } from './publication';
import { FIGURES, getFigure, type Figure } from '~/data/figures';
import type { Lang } from './routes';

export interface FigureDossier {
  figure: Figure;
  entry: CollectionEntry<'fragments'>;
}

export async function getFigureDossiers(lang: Lang): Promise<FigureDossier[]> {
  const all = await getPublicCollection('fragments');
  const out: FigureDossier[] = [];
  for (const figure of FIGURES) {
    const matches = all.filter((e) => getFigure(e.id.replace(/^en\//, ''))?.id === figure.id);
    const entry =
      matches.find((e) => (e.data.language || 'de') === lang) || matches.find((e) => (e.data.language || 'de') === 'de') || matches[0];
    if (entry) out.push({ figure, entry });
  }
  return out;
}
