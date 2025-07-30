import { getLocalizedUrl } from './utils/i18n';
import type { SupportedLanguage } from './utils/i18n';

export const getHeaderData = (locale: SupportedLanguage = 'en') => ({
  links: [
    { text: 'Books', href: getLocalizedUrl('/books', locale) },
    { text: 'Projects', href: getLocalizedUrl('/projects', locale) },
    { text: 'Lab', href: getLocalizedUrl('/lab', locale) },
    { text: 'Life', href: getLocalizedUrl('/life', locale) },
    { text: 'About', href: getLocalizedUrl('/about', locale) },
    { text: 'Contact', href: getLocalizedUrl('/contact', locale) },
  ],
  actions: [],
  locale,
});

// Legacy export for backward compatibility
export const headerData = getHeaderData();

export const getFooterData = (locale: SupportedLanguage = 'en') => ({
  links: [
    {
      title: 'legal', // translation key for footer.legal
      links: [
        { text: 'About', href: getLocalizedUrl('/about', locale) },
        { text: 'blog', href: getLocalizedUrl('/blog', locale) }, // footer.blog
      ],
    },
  ],
  secondaryLinks: [],
  socialLinks: [],
  footNote: '',
  locale,
});

// Legacy export for backward compatibility
export const footerData = getFooterData();
