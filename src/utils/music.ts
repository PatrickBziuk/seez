/**
 * Music entries grouped by slug across languages. Reads only through the publication gate.
 */
import type { CollectionEntry } from 'astro:content';
import { getPublicCollection } from './publication';
import { musicSlug } from '~/data/songs';
import type { Lang } from './routes';

export type MusicEntry = CollectionEntry<'music'>;
export interface SongRecord {
  slug: string;
  de?: MusicEntry;
  en?: MusicEntry;
}

export async function getSongRecords(): Promise<SongRecord[]> {
  const all = await getPublicCollection('music');
  const map = new Map<string, SongRecord>();
  for (const e of all) {
    const slug = musicSlug(e.id);
    const rec = map.get(slug) || { slug };
    rec[(e.data.language || 'de') as Lang] = e;
    map.set(slug, rec);
  }
  return [...map.values()];
}

/** Entry for the page language, falling back to the other language. */
export const pickEntry = (rec: SongRecord, lang: Lang): MusicEntry => (lang === 'en' ? rec.en || rec.de : rec.de || rec.en)!;

/** A song (not an overview text such as "Meine Musik"). */
export const isSong = (e: MusicEntry) => (e.data.tags || []).includes('song');
