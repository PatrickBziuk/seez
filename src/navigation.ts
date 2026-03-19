import { getLocalizedUrl } from './utils/i18n';
import type { SupportedLanguage } from './utils/i18n';

export const getHeaderData = (locale: SupportedLanguage = 'en') => ({
  links: [
    { text: locale === 'de' ? 'Erlebnis' : 'Experience', href: getLocalizedUrl('/', locale) },
    { text: locale === 'de' ? 'System Logs' : 'System Logs', href: getLocalizedUrl('/system-logs', locale) },
    { text: locale === 'de' ? 'Creative Core' : 'Creative Core', href: getLocalizedUrl('/kreatives', locale) },
    { text: locale === 'de' ? 'Sonic Archive' : 'Sonic Archive', href: getLocalizedUrl('/musik', locale) },
    { text: 'Lyrics Vault', href: getLocalizedUrl('/lyrics', locale) },
    { text: locale === 'de' ? 'Fragmente' : 'Fragments', href: getLocalizedUrl('/fragmente', locale) },
    { text: locale === 'de' ? 'Inventory' : 'Inventory', href: getLocalizedUrl('/inventory', locale) },
    { text: locale === 'de' ? 'Blog' : 'Blog', href: getLocalizedUrl('/blog', locale) },
  ],
  actions: [],
  locale,
});

// Legacy export for backward compatibility
export const headerData = getHeaderData();

export const getFooterData = (locale: SupportedLanguage = 'en') => ({
  links: [
    {
      title: locale === 'de' ? 'Kreatives' : 'Creative',
      links: [
        { text: locale === 'de' ? 'Musik' : 'Music', href: getLocalizedUrl('/musik', locale) },
        { text: 'Lyrics Vault', href: getLocalizedUrl('/lyrics', locale) },
        { text: locale === 'de' ? 'Texte' : 'Texts', href: getLocalizedUrl('/texte', locale) },
        { text: locale === 'de' ? 'Fragmente' : 'Fragments', href: getLocalizedUrl('/fragmente', locale) },
        { text: locale === 'de' ? 'Blog' : 'Blog', href: getLocalizedUrl('/blog', locale) },
        { text: locale === 'de' ? 'Presse' : 'Press', href: getLocalizedUrl('/press', locale) },
      ],
    },
    {
      title: locale === 'de' ? 'Technisches' : 'Technical',
      links: [
        { text: locale === 'de' ? 'Projekte' : 'Projects', href: getLocalizedUrl('/projects', locale) },
        { text: 'Lab', href: getLocalizedUrl('/lab', locale) },
        { text: locale === 'de' ? 'Leben' : 'Life', href: getLocalizedUrl('/life', locale) },
        { text: locale === 'de' ? 'Über' : 'About', href: getLocalizedUrl('/about', locale) },
      ],
    },
    {
      title: locale === 'de' ? 'Kontakt' : 'Contact',
      links: [
        { text: 'info@seez.eu', href: 'mailto:info@seez.eu' },
        { text: locale === 'de' ? 'Kontaktformular' : 'Contact Form', href: getLocalizedUrl('/contact', locale) },
      ],
    },
    {
      title: 'Socials',
      links: [
        {
          text: locale === 'de' ? '@seez - Spotify' : '@seez - Spotify',
          href: 'https://open.spotify.com/intl-de/artist/2i9qFi0ArJgbyYbRqqcOgq?si=dsY0gbxgTHKEEHGehupkww',
          icon: 'tabler:brand-spotify',
          ariaLabel: 'Spotify',
        },
        {
          text: '@PatrickBziuk - GitHub',
          href: 'https://github.com/PatrickBziuk/seez',
          icon: 'tabler:brand-github',
          ariaLabel: 'GitHub',
        },
        {
          text: locale === 'de' ? 'Art, Musik & Schreibt' : '@seezerino - Art, Music & Writing',
          href: 'https://www.instagram.com/seezerino/',
          icon: 'tabler:brand-instagram',
          ariaLabel: locale === 'de' ? 'Art, Musik & Schreibt (Instagram)' : 'Art, Music & Writing (Instagram)',
        },
        {
          text: locale === 'de' ? 'Art, Musik & Schreibt' : '@seezerino - Art, Music & Writing',
          href: 'https://www.tiktok.com/@seezerino',
          icon: 'tabler:brand-tiktok',
          ariaLabel: locale === 'de' ? 'Art, Musik & Schreibt (TikTok)' : 'Art, Music & Writing (TikTok)',
        },
        {
          text: locale === 'de' ? 'Dein Anker' : '@deinanker - Your safe harbor',
          href: 'https://www.instagram.com/deinanker/',
          icon: 'tabler:brand-instagram',
          ariaLabel: locale === 'de' ? 'Dein Anker (Instagram)' : 'Your safe harbor (Instagram)',
        },
      ],
    },
  ],
  secondaryLinks: [
    {
      text: locale === 'de' ? 'Datenschutzerklärung' : 'Privacy Notice',
      href: getLocalizedUrl('/legal/privacy', locale),
    },
    { text: 'Impressum', href: getLocalizedUrl('/legal/impressum', locale) },
  ],
  socialLinks: [], // Keep empty array for backward compatibility
  footNote: locale === 'de' ? 'Mit Leidenschaft und Neugier erstellt' : 'Built with passion and curiosity',
  locale,
});

// Legacy export for backward compatibility
export const footerData = getFooterData();
