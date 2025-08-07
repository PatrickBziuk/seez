import { getLocalizedUrl } from './utils/i18n';
import type { SupportedLanguage } from './utils/i18n';

export const getHeaderData = (locale: SupportedLanguage = 'en') => ({
  links: [
    { text: locale === 'de' ? 'Bücher' : 'Books', href: getLocalizedUrl('/books', locale) },
    { text: locale === 'de' ? 'Projekte' : 'Projects', href: getLocalizedUrl('/projects', locale) },
    { text: 'Lab', href: getLocalizedUrl('/lab', locale) },
    { text: locale === 'de' ? 'Leben' : 'Life', href: getLocalizedUrl('/life', locale) },
    { text: locale === 'de' ? 'Über' : 'About', href: getLocalizedUrl('/about', locale) },
    { text: locale === 'de' ? 'Kontakt' : 'Contact', href: getLocalizedUrl('/contact', locale) },
  ],
  actions: [],
  locale,
});

// Legacy export for backward compatibility
export const headerData = getHeaderData();

export const getFooterData = (locale: SupportedLanguage = 'en') => ({
  links: [
    {
      title: locale === 'de' ? 'Rechtliches' : 'Legal',
      links: [
        { text: locale === 'de' ? 'Über' : 'About', href: getLocalizedUrl('/about', locale) },
        { text: locale === 'de' ? 'Blog' : 'Blog', href: getLocalizedUrl('/blog', locale) },
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
  socialLinks: [
    {
      text: 'GitHub',
      href: 'https://github.com/PatrickBziuk/seez',
      icon: 'tabler:brand-github',
      ariaLabel: 'GitHub',
    },
  ],
  footNote: locale === 'de' ? 'Mit Leidenschaft und Neugier erstellt' : 'Built with passion and curiosity',
  locale,
});

// Legacy export for backward compatibility
export const footerData = getFooterData();
