/**
 * Figure dossiers: figures.json joined with the gated `fragments` collection.
 * A figure page exists only while its dossier entry is public (or in draft preview).
 */
import type { CollectionEntry } from 'astro:content';
import { getPublicCollection } from './publication';
import { FIGURES, getFigure, type Figure } from '~/data/figures';
import type { Lang } from './routes';
import catalog from '~/data/videothek/catalog.json';
import { EP, EP_TRACKS, LYRICS, SINGLES, type EpTrack, type Lyrics } from '~/data/songs';

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
      matches.find((e) => (e.data.language || 'de') === lang) ||
      matches.find((e) => (e.data.language || 'de') === 'de') ||
      matches[0];
    if (entry) out.push({ figure, entry });
  }
  return out;
}

/* ------------------------------------------------------------------------------------------
 * Card and wiki facts (FigurePage / FragmentsIndex). Every value comes from existing data:
 * figures.json, songs.ts (EP_TRACKS, SONG_EXTRAS, SINGLES, lyrics.json), the dossier entry and
 * the BPM noted in the Videothek catalog. Nothing here is invented or estimated.
 * ---------------------------------------------------------------------------------------- */

/** The figure's EP track (each figure has exactly one on GENERIERUNG LÄUFT). */
export const epTrackFor = (id: string): EpTrack | undefined =>
  EP_TRACKS.find((t) => t.figures.includes(id as Figure['id']));

/** Year of the EP release, for the card's rarity mark ("EP 2026"). */
export const EP_YEAR = EP.released.slice(0, 4);

/**
 * BPM of a song as noted in the Videothek catalog (`song.meta`, e.g. "EP-Track 4 · 170 BPM · 2:35").
 * Approximate values ("ca. 120 BPM") are ignored. Returns undefined when no film notes a tempo.
 */
export function bpmFor(filmKey: string | undefined): number | undefined {
  if (!filmKey) return undefined;
  for (const film of catalog.films) {
    if (film.song?.key !== filmKey) continue;
    const m = film.song.meta?.match(/(?:^|·)\s*(\d{2,3}(?:[.,]\d+)?)\s*BPM/);
    if (m) return Number(m[1].replace(',', '.'));
  }
  return undefined;
}

/** Lyrics in the archive (lyrics.json) that belong to a figure, EP texts first. */
export function lyricsFor(id: string): { lyrics: Lyrics; ep?: EpTrack }[] {
  return LYRICS.filter((l) => l.figure === id)
    .map((l) => ({ lyrics: l, ep: EP_TRACKS.find((t) => t.lyricsId === l.id) }))
    .sort((a, b) => Number(Boolean(b.ep)) - Number(Boolean(a.ep)));
}

/** Earlier single versions of the figure's EP track (KIFFEN KIPPEN ALK, 24.08.2025). */
export const singlesFor = (track: EpTrack | undefined) => (track ? SINGLES.filter((s) => s.epSlug === track.slug) : []);

/** The closing line of a dossier: its last italic quote (`*„…“*`). */
export function dossierSignature(entry: CollectionEntry<'fragments'>): string | undefined {
  const lines = (entry.body || '').trim().split('\n').reverse();
  for (const line of lines) {
    const m = line.trim().match(/^\*\s*[„"“](.+?)[“"”]\s*\*$/);
    if (m) return m[1].trim();
  }
  return undefined;
}
