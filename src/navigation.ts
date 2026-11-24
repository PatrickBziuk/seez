/**
 * Legacy navigation data (AstroWind shape). The site header and footer now live in
 * src/components/seez/SiteHeader.astro and SiteFooter.astro; this file mirrors the
 * same five sections for any remaining consumer.
 */
import type { SupportedLanguage } from './utils/i18n';
import { showVideothek } from './utils/videothek';
import { sectionUrl } from './utils/routes';

export const getHeaderData = (locale: SupportedLanguage = 'de') => ({
  links: [
    { text: locale === 'de' ? 'Musik' : 'Music', href: sectionUrl(locale, 'music') },
    { text: locale === 'de' ? 'Fragmente' : 'Fragments', href: sectionUrl(locale, 'fragments') },
    ...(showVideothek() ? [{ text: 'Videothek', href: sectionUrl(locale, 'videothek') }] : []),
    { text: 'Lyrics', href: sectionUrl(locale, 'lyrics') },
    { text: locale === 'de' ? 'Werkstatt' : 'Workshop', href: sectionUrl(locale, 'workshop') },
  ],
  actions: [],
  locale,
});

export const headerData = getHeaderData();

export const getFooterData = (locale: SupportedLanguage = 'de') => ({
  links: [{ title: locale === 'de' ? 'Kosmos' : 'Cosmos', links: getHeaderData(locale).links }],
  secondaryLinks: [
    { text: locale === 'de' ? 'Datenschutz' : 'Privacy', href: `/${locale}/legal/privacy` },
    { text: 'Impressum', href: `/${locale}/legal/impressum` },
  ],
  socialLinks: [],
  footNote: '',
  locale,
});

export const footerData = getFooterData();
