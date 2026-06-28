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
      title: locale === 'de' ? 'Kosmos' : 'Cosmos',
      links: [
        { text: locale === 'de' ? 'Erlebnis' : 'Experience', href: getLocalizedUrl('/', locale) },
        { text: 'Creative Core', href: getLocalizedUrl('/kreatives', locale) },
        { text: 'System Logs', href: getLocalizedUrl('/system-logs', locale) },
        { text: locale === 'de' ? 'Fragmente' : 'Fragments', href: getLocalizedUrl('/fragmente', locale) },
        { text: 'Inventory', href: getLocalizedUrl('/inventory', locale) },
      ],
    },
    {
      title: 'Release',
      links: [
        { text: 'Sonic Archive', href: getLocalizedUrl('/musik', locale) },
        { text: 'Lyrics Vault', href: getLocalizedUrl('/lyrics', locale) },
        {
          text: 'GENERIERUNG LÄUFT',
          href: 'https://open.spotify.com/intl-de/album/47aAj0XEtEJnmJqFDswAp0?si=BrvL2mSxQNWD7ER5QBa7MA',
        },
        { text: locale === 'de' ? 'Presse' : 'Press', href: getLocalizedUrl('/press', locale) },
        { text: locale === 'de' ? 'Über Seez' : 'About Seez', href: getLocalizedUrl('/about', locale) },
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
          text: 'GENERIERUNG LÄUFT - Spotify',
          href: 'https://open.spotify.com/intl-de/album/47aAj0XEtEJnmJqFDswAp0?si=BrvL2mSxQNWD7ER5QBa7MA',
          icon: 'tabler:brand-spotify',
          ariaLabel: 'Spotify EP',
        },
        {
          text: locale === 'de' ? '@seezerino - Art, Musik & Schreiben' : '@seezerino - Art, Music & Writing',
          href: 'https://www.instagram.com/seezerino/',
          icon: 'tabler:brand-instagram',
          ariaLabel: locale === 'de' ? 'Seez auf Instagram' : 'Seez on Instagram',
        },
        {
          text: locale === 'de' ? '@seezerino - Art, Musik & Schreiben' : '@seezerino - Art, Music & Writing',
          href: 'https://www.tiktok.com/@seezerino',
          icon: 'tabler:brand-tiktok',
          ariaLabel: locale === 'de' ? 'Seez auf TikTok' : 'Seez on TikTok',
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
  footNote:
    locale === 'de'
      ? 'Seez ist ein kreativer Kosmos aus Musik, Figuren, Texten und System Logs.'
      : 'Seez is a creative cosmos of music, figures, texts, and system logs.',
  locale,
});

// Legacy export for backward compatibility
export const footerData = getFooterData();
