/**
 * Videothek data for pages. A film is public only if releases.json pins it;
 * its media URLs then point at exactly the pinned files. In local draft preview
 * (`pnpm dev:drafts`) all other films appear too, with the current local files.
 */
import catalog from '~/data/videothek/catalog.json';
import releases from '~/data/videothek/releases.json';
import { isPreview } from './preview';
import { getFigure } from '~/data/figures';

const PREFIX = '/videothek/media/';

type Pinned = { asset: string; sha256: string; bytes: number };
type Release = {
  approvedAt: string;
  version: string;
  note?: string;
  media: { full: Pinned; cover: Pinned; clip: Pinned; thumbs: Pinned[] };
};
type CatalogFilm = (typeof catalog.films)[number];

export type Film = CatalogFilm & {
  released: boolean;
  release: Release | null;
  media: { full: string; cover: string; clip: string; thumbs: string[]; poster: string };
};

const RELEASES = (releases as { films: Record<string, Release> }).films;

/** Display name in the site-wide spelling (src/data/figures.json), catalog as fallback. */
export const characterName = (key: string): string =>
  getFigure(key)?.name || (catalog.characters as Record<string, { name: string }>)[key]?.name || key;

/** Accent colour of a figure on the dark site. */
export const characterAccent = (key: string): string => getFigure(key)?.accent.dark || '#67e8f9';

export function isFilmReleased(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(RELEASES, id);
}

function toFilm(f: CatalogFilm): Film {
  const rel = RELEASES[f.id] || null;
  if (rel) {
    const thumbs = rel.media.thumbs.map((t) => PREFIX + t.asset);
    return {
      ...f,
      released: true,
      release: rel,
      media: {
        full: PREFIX + rel.media.full.asset,
        cover: PREFIX + rel.media.cover.asset,
        clip: PREFIX + rel.media.clip.asset,
        thumbs,
        poster: thumbs[(f.poster || 1) - 1] || thumbs[0],
      },
    };
  }
  const pv = `${PREFIX}preview/${f.id}/`;
  const thumbs = Array.from({ length: f.thumbs || 5 }, (_, i) => `${pv}thumb-${i + 1}`);
  return {
    ...f,
    released: false,
    release: null,
    media: { full: pv + 'full', cover: pv + 'cover', clip: pv + 'clip', thumbs, poster: thumbs[(f.poster || 1) - 1] },
  };
}

const score = (f: Film) => (f.rating ? f.rating.g * 100 + f.rating.w + f.rating.c + f.rating.l + f.rating.s : 0);

/** Films shown in this run, best first. Production: released films only. */
export function getVisibleFilms(): Film[] {
  const preview = isPreview();
  return catalog.films
    .filter((f) => isFilmReleased(f.id) || preview)
    .map(toFilm)
    .sort((a, b) => Number(b.released) - Number(a.released) || score(b) - score(a));
}

export function hasPublicFilms(): boolean {
  return Object.keys(RELEASES).length > 0;
}

/** The Videothek page and its nav links exist only once a film is released (or in draft preview). */
export function showVideothek(): boolean {
  return hasPublicFilms() || isPreview();
}

/** Films shown in this run that belong to a song (catalog song.key). Discarded versions never appear. */
export function filmsForSong(key: string | undefined): Film[] {
  if (!key) return [];
  return getVisibleFilms().filter((f) => f.song?.key === key && f.workStatus !== 'dropped');
}

/** Films shown in this run with a given figure. Discarded versions never appear. */
export function filmsForFigure(id: string): Film[] {
  return getVisibleFilms().filter((f) => f.characters.includes(id) && f.workStatus !== 'dropped');
}
