/**
 * Songs - one place that joins the EP tracklist, the lyrics archive, the gated
 * music collection and the Videothek (KONZEPT B8 "Der Song ist der Knoten").
 *
 * Only the EP GENERIERUNG LÄUFT is released. Everything else is work in progress
 * and must be labelled that way; no release dates for anything outside the EP.
 *
 * Source of truth for the EP: Spotify (album 47aAj0XEtEJnmJqFDswAp0, read 24.11.2026).
 * Track numbers, order, titles (spelling) and durations follow Spotify exactly.
 */
import lyricsData from './lyrics.json';
import type { FigureId } from './figures';

export const EP = {
  title: 'GENERIERUNG LÄUFT',
  released: '2026-06-27',
  spotify: 'https://open.spotify.com/album/47aAj0XEtEJnmJqFDswAp0',
  /** Total running time from the Spotify track durations */
  length: '16:34',
  claim: {
    de: 'Sechs Stimmen. Ein Bruch. Die Frage ist nicht, warum du zersplitterst, sondern was du aus den Splittern baust.',
    en: 'Six voices. One fracture. The question is not why you splinter, but what you build from the shards.',
  },
};

export type Lyrics = (typeof lyricsData.lyrics)[number] & { figure: FigureId };
export const LYRICS = lyricsData.lyrics as Lyrics[];
export const getLyrics = (id?: string) => (id ? LYRICS.find((l) => l.id === id) : undefined);

export interface EpTrack {
  /** Track number on Spotify */
  no: number;
  /** music collection slug (file name without language folder); may have no page yet */
  slug: string;
  /** Title exactly as on Spotify */
  title: string;
  /** Duration as on Spotify (m:ss) */
  length: string;
  /** Spotify track URL */
  spotify: string;
  explicit?: boolean;
  figures: FigureId[];
  lyricsId?: string;
  /** Videothek catalog song key */
  filmKey?: string;
  note?: { de: string; en: string };
  /** A line from the song (German), as shown on the former music page */
  quote?: string;
  /** Help line on the page (KONZEPT B4 Drift) */
  help?: boolean;
}

const track = (id: string) => `https://open.spotify.com/track/${id}`;

/** EP tracklist in Spotify order. */
export const EP_TRACKS: EpTrack[] = [
  {
    no: 1,
    slug: 'weltmeister',
    title: 'WELTMEISTER',
    length: '2:28',
    spotify: track('5egB8UHDiVgiUeRzBDqg9x'),
    figures: ['unknown'],
    filmKey: 'weltmeister',
  },
  {
    no: 2,
    slug: 'questlog',
    quote: 'Ich verliere mich, doch nie die Lust am Suchen.',
    title: 'QUESTLOG',
    length: '2:51',
    spotify: track('2UEZxRbOYiuXcGgcLLjKQr'),
    figures: ['lume'],
    lyricsId: 'questlog',
    filmKey: 'questlog',
    note: {
      de: 'Games, Backlogs, Discord und kleine Pixellichter als Restlicht-Strategie.',
      en: 'Games, backlogs, Discord, and small pixel lights as a residual-light strategy.',
    },
  },
  {
    no: 3,
    slug: 'aufstiegstraum',
    quote: 'Aufstiegstraum, ich stempel mich frei.',
    title: 'AUFSTIEGSTRAUM',
    length: '2:56',
    spotify: track('46dbUCRTF0GrKQfR871Wkf'),
    figures: ['shift'],
    lyricsId: 'aufstiegstraum',
    filmKey: 'aufstieg',
    note: {
      de: 'Arbeiterklasse, Elternarbeit und die Frage, ob Aufstieg wirklich Befreiung ist.',
      en: 'Working-class origin, parental labor, and the question whether ascent is liberation.',
    },
  },
  {
    no: 4,
    slug: 'kiffen-kippen-alk',
    quote: 'Jeder Rausch ein Versuch, doch er heilt mich nicht.',
    title: 'KIFFEN KIPPEN ALK',
    length: '2:35',
    spotify: track('5R5Jhwu4tX8FQoYRQISiUf'),
    explicit: true,
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
    no: 5,
    slug: 'spiegelkrise',
    quote: 'Ich wollte jemand sein, den man versteht.',
    title: 'SPIEGELKRISE',
    length: '2:40',
    spotify: track('4gB9pLOtFkb8YNDsL8lmn4'),
    figures: ['splinter'],
    lyricsId: 'spiegelkrise',
    filmKey: 'spiegelkrise',
    note: {
      de: 'Online-Resonanz, Selbsthass und die Maske zwischen Fanliebe und Sichtbarkeit.',
      en: 'Online resonance, self-hate, and the mask between fan love and visibility.',
    },
  },
  {
    no: 6,
    slug: 'fck-suno',
    quote: 'Suno singt die Zeilen, die Seele kommt von mir.',
    title: 'FUCK SUNO',
    length: '3:05',
    spotify: track('3HvAmBlAUhIY9Edh1XLrsA'),
    explicit: true,
    figures: ['gl1tch'],
    lyricsId: 'fuck-suno',
    filmKey: 'fcksuno',
    note: {
      de: 'KI-Musik als Streitfall: Kritik am Werkzeug, das zugleich Stimme gibt.',
      en: 'AI music as a conflict: critique of the tool that also gives a voice.',
    },
  },
];

/**
 * KIFFEN KIPPEN ALK also exists as an earlier single on Spotify (24.08.2025, 3:31),
 * a different, longer version than EP track 4.
 */
export const SINGLES = [
  {
    title: 'KIFFEN KIPPEN ALK',
    released: '2025-08-24',
    length: '3:31',
    spotify: 'https://open.spotify.com/album/2NskUdlHHJNh3e6nl5lgaQ',
    epSlug: 'kiffen-kippen-alk',
  },
];

/**
 * Music entries that are songs but not on the EP (work in progress): figures, lyrics
 * link where the archive has them, and the line/summary the site showed before.
 */
export const SONG_EXTRAS: Record<
  string,
  { lyricsId?: string; figures?: FigureId[]; quote?: string; note?: { de: string; en: string } }
> = {
  scherbenprotokoll: {
    figures: ['splinter', 'unknown', 'gl1tch'],
    quote: 'Bevor er schrieb, wurde er beschrieben.',
    note: {
      de: 'Crossover-Protokoll über Sortierung, Systembrüche und den ersten gemeinsamen Riss.',
      en: 'Crossover protocol about social sorting, system fractures, and the first shared break.',
    },
  },
  'als-sie': {
    figures: ['unknown'],
    quote: 'Doch die Zeilen halten dicht, wenn sonst keiner mit mir spricht.',
    note: {
      de: 'Politische Angst, Schweigen und der Moment, in dem Nichtgesehenwerden benannt wird.',
      en: 'Political fear, silence, and the moment invisibility becomes nameable.',
    },
  },
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
