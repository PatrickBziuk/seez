/**
 * The six Seelensplitter figures — one source for ids, slugs, SZ numbers,
 * spelling and accent colours. Use these helpers instead of hard-coded colours.
 * Raw values live in figures.json (shared with seez-kit / Videothek later).
 */
import data from './figures.json';

export type FigureId = 'splinter' | 'lume' | 'drift' | 'shift' | 'gl1tch' | 'unknown';
export type Figure = (typeof data.figures)[number] & { id: FigureId; order: number };

/** In SZ order: Splinter, LUME, Drift, Shift, Gl1tch, Unknown. */
export const FIGURES: Figure[] = data.figures.map((f, i) => ({ ...f, id: f.id as FigureId, order: i + 1 }));

const byKey = new Map<string, Figure>();
for (const f of FIGURES) {
  byKey.set(f.id, f);
  byKey.set(f.slug, f);
  byKey.set(f.name.toLowerCase(), f);
  byKey.set(f.sz.toLowerCase(), f);
}
byKey.set('glitch', byKey.get('gl1tch')!);

/** Look up by id, content slug, name or SZ number (case-insensitive). */
export function getFigure(key: string | undefined | null): Figure | undefined {
  if (!key) return undefined;
  return byKey.get(String(key).trim().toLowerCase());
}

/** Accent for the dark site (default) or light surfaces. */
export function figureAccent(key: string, mode: 'dark' | 'light' = 'dark'): string | undefined {
  return getFigure(key)?.accent[mode];
}

/** Accent as rgba() for glows and tints. */
export function figureGlow(key: string, alpha = 0.25): string | undefined {
  const hex = figureAccent(key);
  if (!hex) return undefined;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
