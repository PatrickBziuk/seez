/**
 * Songbook - every song of the Seelensplitter project with its figure(s) and album phase.
 *
 * Public by explicit user decision (24.11.2026: "alle Songs + Charaktere + jeweilige
 * Phasen im Überblick haben, auch das öffentlich"). Only the EP is released; every other
 * song here is work in progress. No release dates for the phase albums.
 *
 * Sources (read 24.11.2026):
 * - Phase: Notion "SEELENSPLITTER PHASE 1/2/3 Album" track plans. NENN ES carries the
 *   tag #sp2 in its text. Songs that are in no plan yet have `phase: null` ("noch offen").
 * - Figures: Notion "Songs" table (relation Charaktere), first figure = main voice.
 * - EP order and spelling: src/data/songs.ts (Spotify).
 * Cancelled songs (Notion status "Abgebrochen", e.g. SCHERBENPROTOKOLL) are not listed.
 */
import type { FigureId } from './figures';

export type Phase = 1 | 2 | 3;

export interface SongbookEntry {
  /** Stable id; equals the lyrics id in lyrics.json where a text exists */
  id: string;
  title: string;
  /** Main figure first; empty when no figure is assigned yet */
  figures: FigureId[];
  phase: Phase | null;
  /** Lyrics id in lyrics.json, if the text is on the site */
  lyricsId?: string;
  /** Music collection slug, if the song has its own page */
  page?: string;
  /** Slug in EP_TRACKS, if the song is on the released EP */
  ep?: string;
}

export const PHASES: Array<{ n: Phase; theme: { de: string; en: string }; motto: { de: string; en: string } }> = [
  {
    n: 1,
    theme: {
      de: 'Kindheit, Pubertät, Tumblr: wie die Splitter entstehen.',
      en: 'Childhood, puberty, Tumblr: how the splinters form.',
    },
    motto: { de: 'Warum bin ich so geworden?', en: 'Why did I become like this?' },
  },
  {
    n: 2,
    theme: {
      de: 'Verloren in der Suche: junges Erwachsensein, Systemkritik, Überforderung, Beziehungscrash.',
      en: 'Lost in the search: young adulthood, system critique, overload, relationships breaking.',
    },
    motto: { de: 'Warum funktioniert das Reparieren nicht?', en: 'Why does repairing not work?' },
  },
  {
    n: 3,
    theme: {
      de: 'Integration: Verantwortung für die eigenen Splitter übernehmen.',
      en: 'Integration: taking responsibility for your own splinters.',
    },
    motto: { de: 'Ich entscheide jetzt, was du sehen darfst.', en: 'I decide now what you get to see.' },
  },
];

const s = (
  id: string,
  title: string,
  figures: FigureId[],
  phase: Phase | null,
  extra: Partial<Pick<SongbookEntry, 'lyricsId' | 'page' | 'ep'>> = {}
): SongbookEntry => ({ id, title, figures, phase, ...extra });

export const SONGBOOK: SongbookEntry[] = [
  // Phase 1 (Notion plan order)
  s('listen-und-lichter', 'LISTEN & LICHTER', ['splinter'], 1, { lyricsId: 'listen-und-lichter' }),
  s('weisses-rauschen', 'WEISSES RAUSCHEN', ['drift'], 1, { lyricsId: 'weisses-rauschen' }),
  s('zwischenraeume', 'ZWISCHENRÄUME', ['unknown'], 1, { lyricsId: 'zwischenraeume' }),
  s('questlog', 'QUESTLOG', ['lume'], 1, { lyricsId: 'questlog', page: 'questlog', ep: 'questlog' }),
  s('aufstiegstraum', 'AUFSTIEGSTRAUM', ['shift'], 1, {
    lyricsId: 'aufstiegstraum',
    page: 'aufstiegstraum',
    ep: 'aufstiegstraum',
  }),
  s('mondstein', 'MONDSTEIN', ['drift'], 1),
  s('tumblr-traeume', 'TUMBLR TRÄUME', ['splinter'], 1, { lyricsId: 'tumblr-traeume' }),
  s('spiegelkrise', 'SPIEGELKRISE', ['splinter'], 1, {
    lyricsId: 'spiegelkrise',
    page: 'spiegelkrise',
    ep: 'spiegelkrise',
  }),
  s('hedwig', 'HEDWIG', ['unknown'], 1, { lyricsId: 'hedwig' }),
  s('schmetterlingsmoment', 'SCHMETTERLINGSMOMENT', ['lume'], 1, {
    lyricsId: 'schmetterlingsmoment',
    page: 'schmetterlingsmoment',
  }),
  s('kiffen-kippen-alk', 'KIFFEN KIPPEN ALK', ['drift'], 1, {
    lyricsId: 'kiffen-kippen-alk',
    page: 'kiffen-kippen-alk',
    ep: 'kiffen-kippen-alk',
  }),
  s('cve-10', 'CVE-10', ['gl1tch'], 1),

  // Phase 2
  s('illegale-aliens', 'ILLEGALE ALIENS', ['unknown'], 2, { lyricsId: 'illegale-aliens' }),
  s('schichtliebe', 'SCHICHTLIEBE', ['shift'], 2),
  s('nachtgedanken', 'NACHTGEDANKEN', ['splinter', 'lume'], 2),
  s('dein-anker', 'DEIN ANKER', ['lume'], 2, { lyricsId: 'dein-anker' }),
  s('maskenspiel', 'MASKENSPIEL', ['splinter', 'lume'], 2, { lyricsId: 'maskenspiel' }),
  s('herz-klopft-kopf-platzt', 'HERZ KLOPFT, KOPF PLATZT', ['drift'], 2, {
    lyricsId: 'herz-klopft-kopf-platzt',
    page: 'herz-klopft-kopf-platzt',
  }),
  s('target-audience', 'TARGET_AUDIENCE', ['gl1tch'], 2, { lyricsId: 'target-audience-v2' }),
  s('first-class', 'FIRST CLASS', ['shift'], 2, { lyricsId: 'first-class' }),
  s('als-sie', 'ALS SIE', ['unknown', 'lume'], 2, { lyricsId: 'als-sie', page: 'als-sie' }),
  s('ich-spiel-nicht-mit', 'ICH SPIEL NICHT MIT', ['lume'], 2),
  s('mehrarbeit', 'MEHRARBEIT', ['shift'], 2, { lyricsId: 'mehrarbeit' }),
  s('fuck-suno', 'FUCK SUNO', ['gl1tch'], 2, { lyricsId: 'fuck-suno', page: 'fck-suno', ep: 'fck-suno' }),
  s('nenn-es', 'NENN ES', ['gl1tch'], 2, { lyricsId: 'nenn-es' }),

  // Phase 3
  s('stempel-aus', 'STEMPEL AUS', ['shift'], 3, { lyricsId: 'stempel-aus' }),
  s('steckerziehen', 'STECKERZIEHEN', ['gl1tch'], 3),
  s('latency-love', 'LATENCY LOVE', ['gl1tch'], 3, { lyricsId: 'latency-love' }),
  s('sperrmuell', 'SPERRMÜLL', ['gl1tch'], 3, { lyricsId: 'sperrmuell' }),
  s('rauch-zu-vape', 'RAUCH ZU VAPE', ['drift'], 3),
  s('abblendlicht', 'ABBLENDLICHT', ['lume'], 3, { lyricsId: 'abblendlicht' }),
  s('genaeht', 'GENÄHT', ['splinter'], 3, { lyricsId: 'genaeht', page: 'genaeht' }),
  s('solche-kinder', 'SOLCHE KINDER', ['unknown'], 3, { lyricsId: 'solche-kinder' }),
  s('ich-will-leuchten', 'ICH WILL LEUCHTEN', ['lume'], 3),

  // No phase yet
  s('weltmeister', 'WELTMEISTER', ['unknown'], null, { ep: 'weltmeister' }),
  s('systemupdate', 'SYSTEMUPDATE', ['lume'], null, { lyricsId: 'systemupdate' }),
  s('glueck-am-ende', 'GLÜCK AM ENDE', ['lume'], null, { page: 'glueck-am-ende' }),
  s('hallo-hedwig', 'HALLO HEDWIG', ['unknown'], null),
  s('attention-baby', 'ATTENTION BABY', ['gl1tch'], null, { lyricsId: 'attention-baby' }),
  s('zu-gefaehrlich', 'ZU GEFÄHRLICH', ['gl1tch'], null, { lyricsId: 'zu-gefaehrlich' }),
  s('echt-genug', 'ECHT GENUG', ['gl1tch'], null, { lyricsId: 'echt-genug' }),
  s('beach-is-closed', 'BEACH IS CLOSED', ['gl1tch', 'unknown'], null, { lyricsId: 'beach-is-closed' }),
  s('erste-sprache', 'ERSTE SPRACHE', ['splinter'], null, { lyricsId: 'erste-sprache' }),
  s('zu-frueh-zu-spaet', 'ZU FRÜH, ZU SPÄT', ['splinter'], null, { lyricsId: 'zu-frueh-zu-spaet' }),
  s('nicht-gefragt', 'NICHT GEFRAGT', ['shift'], null, { lyricsId: 'nicht-gefragt' }),
  s('drei-von-drei', 'DREI VON DREI', ['lume'], null, { lyricsId: 'drei-von-drei' }),
  s('sommerschlussverkauf', 'SOMMERSCHLUSSVERKAUF', ['lume'], null, { lyricsId: 'sommerschlussverkauf' }),
  s('nicht-komplett', 'NICHT KOMPLETT', ['lume'], null, { lyricsId: 'nicht-komplett' }),
  s('vaterland', 'VATERLAND', ['unknown'], null, { lyricsId: 'vaterland' }),
  s('kleines-leben', 'KLEINES LEBEN', [], null, { lyricsId: 'kleines-leben' }),
  s('generalist-era', 'GENERALIST ERA', [], null),
  s('time-to-leave', 'TIME TO LEAVE', [], null, { page: 'time-to-leave' }),
];

/** Phase of a lyrics text (via the songbook), or null when not assigned. */
export const phaseForLyrics = (lyricsId: string): Phase | null =>
  SONGBOOK.find((e) => e.lyricsId === lyricsId)?.phase ?? null;
