/**
 * Songs - one place that joins the EP tracklist, the lyrics archive, the gated
 * music collection and the Videothek (KONZEPT B8 "Der Song ist der Knoten").
 *
 * Only the EP GENERIERUNG LÄUFT is released. Everything else is work in progress
 * and must be labelled that way; no release dates for anything outside the EP.
 * Track order follows the existing site; the repo has no authoritative track
 * numbers, so none are shown.
 */
import lyricsData from './lyrics.json';
import type { FigureId } from './figures';

export const EP = {
  title: 'GENERIERUNG LÄUFT',
  released: '2026-06-27',
  spotify: 'https://open.spotify.com/intl-de/album/47aAj0XEtEJnmJqFDswAp0',
  claim: {
    de: 'Sechs Stimmen. Ein Bruch. Die Frage ist nicht, warum du zersplitterst, sondern was du aus den Splittern baust.',
    en: 'Six voices. One fracture. The question is not why you splinter, but what you build from the shards.',
  },
};

export type Lyrics = (typeof lyricsData.lyrics)[number] & { figure: FigureId };
export const LYRICS = lyricsData.lyrics as Lyrics[];
export const getLyrics = (id?: string) => (id ? LYRICS.find((l) => l.id === id) : undefined);

export interface EpTrack {
  /** music collection slug (file name without language folder) */
  slug: string;
  title: string;
  figures: FigureId[];
  lyricsId?: string;
  /** Videothek catalog song key */
  filmKey?: string;
  note: { de: string; en: string };
  /** A line from the song (German), as shown on the former music page */
  quote?: string;
  /** Help line on the page (KONZEPT B4 Drift) */
  help?: boolean;
}

/** EP tracklist in the order the site has always shown it. */
export const EP_TRACKS: EpTrack[] = [
  {
    slug: 'scherbenprotokoll',
    quote: 'Bevor er schrieb, wurde er beschrieben.',
    title: 'Scherbenprotokoll',
    figures: ['splinter', 'unknown', 'gl1tch'],
    note: {
      de: 'Crossover-Protokoll über Sortierung, Systembrüche und den ersten gemeinsamen Riss.',
      en: 'Crossover protocol about social sorting, system fractures, and the first shared break.',
    },
  },
  {
    slug: 'aufstiegstraum',
    quote: 'Aufstiegstraum, ich stempel mich frei.',
    title: 'Aufstiegstraum',
    figures: ['shift'],
    lyricsId: 'aufstiegstraum',
    filmKey: 'aufstieg',
    note: {
      de: 'Arbeiterklasse, Elternarbeit und die Frage, ob Aufstieg wirklich Befreiung ist.',
      en: 'Working-class origin, parental labor, and the question whether ascent is liberation.',
    },
  },
  {
    slug: 'als-sie-kamen',
    quote: 'Doch die Zeilen halten dicht, wenn sonst keiner mit mir spricht.',
    title: 'Als sie kamen',
    figures: ['unknown'],
    note: {
      de: 'Politische Angst, Schweigen und der Moment, in dem Nichtgesehenwerden benannt wird.',
      en: 'Political fear, silence, and the moment invisibility becomes nameable.',
    },
  },
  {
    slug: 'kiffen-kippen-alk',
    quote: 'Jeder Rausch ein Versuch, doch er heilt mich nicht.',
    title: 'Kiffen Kippen Alk',
    figures: ['drift'],
    lyricsId: 'kiffen-kippen-alk',
    filmKey: 'kka',
    help: true,
    note: {
      de: 'Rausch nicht als Partybild, sondern als schlechtes Werkzeug gegen Leere.',
      en: 'Intoxication not as party image, but as a broken tool against emptiness.',
    },
  },
  {
    slug: 'questlog',
    quote: 'Ich verliere mich, doch nie die Lust am Suchen.',
    title: 'Questlog',
    figures: ['lume'],
    lyricsId: 'questlog',
    filmKey: 'questlog',
    note: {
      de: 'Games, Backlogs, Discord und kleine Pixellichter als Restlicht-Strategie.',
      en: 'Games, backlogs, Discord, and small pixel lights as a residual-light strategy.',
    },
  },
  {
    slug: 'spiegelkrise',
    quote: 'Ich wollte jemand sein, den man versteht.',
    title: 'Spiegelkrise',
    figures: ['splinter'],
    lyricsId: 'spiegelkrise',
    filmKey: 'spiegelkrise',
    note: {
      de: 'Online-Resonanz, Selbsthass und die Maske zwischen Fanliebe und Sichtbarkeit.',
      en: 'Online resonance, self-hate, and the mask between fan love and visibility.',
    },
  },
  {
    slug: 'fck-suno',
    quote: 'Suno singt die Zeilen, die Seele kommt von mir.',
    title: 'FCK SUNO',
    figures: ['gl1tch'],
    lyricsId: 'fuck-suno',
    filmKey: 'fcksuno',
    note: {
      de: 'KI-Musik als Streitfall: Kritik am Werkzeug, das zugleich Stimme gibt.',
      en: 'AI music as a conflict: critique of the tool that also gives a voice.',
    },
  },
];

/** Other music entries that are songs but not on the EP: lyrics link where the archive has them. */
export const SONG_EXTRAS: Record<string, { lyricsId?: string; figures?: FigureId[] }> = {
  genaeht: { lyricsId: 'genaeht', figures: ['splinter'] },
  'herz-klopft-kopf-platzt': { lyricsId: 'herz-klopft-kopf-platzt', figures: ['drift'] },
  schmetterlingsmoment: { lyricsId: 'schmetterlingsmoment', figures: ['lume'] },
};

export const epTrack = (slug: string) => EP_TRACKS.find((t) => t.slug === slug);

/** Slug of a music entry id (`de/spiegelkrise.md` -> `spiegelkrise`). */
export const musicSlug = (id: string) => id.replace(/^(de|en)\//, '').replace(/\.mdx?$/, '');

/** Lyrics id -> music slug, for links from the lyrics index to song pages. */
export function songSlugForLyrics(lyricsId: string): string | undefined {
  const t = EP_TRACKS.find((x) => x.lyricsId === lyricsId);
  if (t) return t.slug;
  return Object.entries(SONG_EXTRAS).find(([, v]) => v.lyricsId === lyricsId)?.[0];
}

/**
 * Lyrics text split into sections (`[Hook]`, `[Verse 1]` …) for the LyricsBlock.
 */
export function lyricsSections(text: string): Array<{ label: string; lines: string[]; hook: boolean }> {
  const out: Array<{ label: string; lines: string[]; hook: boolean }> = [];
  let cur: { label: string; lines: string[]; hook: boolean } | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    const m = line.match(/^\[(.+)\]$/);
    if (m) {
      cur = { label: m[1], lines: [], hook: /hook|chorus|refrain/i.test(m[1]) };
      out.push(cur);
    } else if (line.trim()) {
      if (!cur) {
        cur = { label: '', lines: [], hook: false };
        out.push(cur);
      }
      cur.lines.push(line);
    }
  }
  return out;
}
