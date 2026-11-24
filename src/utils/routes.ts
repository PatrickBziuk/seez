/**
 * Localised section paths. German and English use their own words for the
 * main sections (/de/musik vs /en/music). Every helper that builds a link to a
 * section goes through here, so the language switch and hreflang stay in sync.
 * Old paths are kept alive as redirects in astro.config.ts (see REDIRECTS).
 */
import type { SupportedLanguage } from './i18n';

export type Lang = SupportedLanguage;
export type Section = 'music' | 'fragments' | 'workshop' | 'license' | 'archive' | 'lyrics' | 'videothek';

export const SECTION_SEGMENT: Record<Section, Record<Lang, string>> = {
  music: { de: 'musik', en: 'music' },
  fragments: { de: 'fragmente', en: 'fragments' },
  workshop: { de: 'werkstatt', en: 'workshop' },
  license: { de: 'lizenz', en: 'license' },
  archive: { de: 'archiv', en: 'archive' },
  lyrics: { de: 'lyrics', en: 'lyrics' },
  videothek: { de: 'videothek', en: 'videothek' },
};

/** `/de/musik`, `/en/music/spiegelkrise`, … */
export function sectionUrl(lang: Lang, section: Section, slug?: string): string {
  const base = `/${lang}/${SECTION_SEGMENT[section][lang]}`;
  return slug ? `${base}/${slug}` : base;
}

export const homeUrl = (lang: Lang) => `/${lang}`;

/** Language of a path, from its first segment (defaults to German). */
export function langOf(pathname: string): Lang {
  return /^\/en(\/|$)/.test(pathname) ? 'en' : 'de';
}

/**
 * The same page in the other language: swaps the language prefix and a
 * localised section segment (`/de/musik/x` <-> `/en/music/x`).
 */
export function counterpartPath(pathname: string, target: Lang): string {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const m = clean.match(/^\/(de|en)(?:\/([^/]+))?(\/.*)?$/);
  if (!m) return `/${target}`;
  const [, from, segment, rest = ''] = m;
  if (!segment) return `/${target}`;
  const section = (Object.keys(SECTION_SEGMENT) as Section[]).find(
    (s) => SECTION_SEGMENT[s][from as Lang] === segment
  );
  const nextSegment = section ? SECTION_SEGMENT[section][target] : segment;
  return `/${target}/${nextSegment}${rest}`;
}
