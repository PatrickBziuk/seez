/**
 * Seez Site Configuration
 * Centralized configuration for all site settings, branding, and behavior
 * This file serves as the single source of truth for site-wide settings
 */

export interface SeezConfig {
  // Core Site Information
  site: {
    name: string;
    description: string;
    url: string;
    logo: {
      svg: string;
      text: string;
      alt: string;
    };
    favicon: {
      href: string;
      sizes: string[];
    };
  };

  // Brand Identity
  brand: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
  };

  // Internationalization
  i18n: {
    defaultLanguage: 'en' | 'de';
    supportedLanguages: Array<'en' | 'de'>;
    languageLabels: Record<'en' | 'de', { flag: string; label: string }>;
  };

  // SEO & Metadata
  seo: {
    titleTemplate: string;
    titleSeparator: string;
    defaultTitle: string;
    defaultDescription: string;
    keywords: string[];
    openGraph: {
      type: string;
      siteName: string;
      images: Array<{
        url: string;
        width: number;
        height: number;
        alt: string;
      }>;
    };
    twitter: {
      card: string;
      site: string;
      creator: string;
    };
  };

  // Navigation & Content
  navigation: {
    header: {
      showLogo: boolean;
      showThemeToggle: boolean;
      showLanguageSwitch: boolean;
      showRssFeed: boolean;
      sticky: boolean;
    };
    footer: {
      showSocialLinks: boolean;
      showVersionIndicator: boolean;
      copyright: {
        holder: string;
        year: number;
      };
    };
  };

  // Content Collections
  content: {
    collections: Array<{
      name: string;
      label: { en: string; de: string };
      icon?: string;
      enabled: boolean;
    }>;
    pagination: {
      defaultPageSize: number;
      maxPageSize: number;
    };
  };

  // Analytics & Tracking
  analytics: {
    googleAnalytics?: string;
    umami?: {
      websiteId: string;
      src: string;
    };
  };

  // Development & Build
  development: {
    port: number;
    enableDebug: boolean;
    showBuildInfo: boolean;
  };
}

/**
 * Seez Site Configuration
 * All site-wide settings in one place for easy maintenance and reusability
 */
export const SEEZ_CONFIG: SeezConfig = {
  site: {
    name: 'seez',
    description: '🚀 A Blog about Development, Writing, Social Projects and Life itself.',
    url: 'https://seez.eu',
    logo: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 7a5 5 0 0 0-7.07 0l-4.24 4.24a5 5 0 0 0 7.07 7.07l1.06-1.06"></path>
        <path d="M7 17a5 5 0 0 0 7.07 0l4.24-4.24a5 5 0 0 0-7.07-7.07l-1.06 1.06"></path>
      </svg>`,
      text: 'seez',
      alt: 'Seez - Connection and insights',
    },
    favicon: {
      href: '/favicon.svg',
      sizes: ['16x16', '32x32', '48x48', '64x64', '128x128'],
    },
  },

  brand: {
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      background: '#ffffff',
      text: '#1f2937',
    },
    fonts: {
      primary: 'Inter, system-ui, sans-serif',
      secondary: 'Inter, system-ui, sans-serif',
    },
  },

  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'de'],
    languageLabels: {
      en: { flag: '🇬🇧', label: 'English' },
      de: { flag: '🇩🇪', label: 'Deutsch' },
    },
  },

  seo: {
    titleTemplate: '%s | seez',
    titleSeparator: ' | ',
    defaultTitle: 'seez',
    defaultDescription: '🚀 A Blog about Development, Writing, Social Projects and Life itself.',
    keywords: ['development', 'writing', 'social projects', 'technology', 'life', 'blog'],
    openGraph: {
      type: 'website',
      siteName: 'seez',
      images: [],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@seez_eu',
      creator: '@seez_eu',
    },
  },

  navigation: {
    header: {
      showLogo: true,
      showThemeToggle: true,
      showLanguageSwitch: true,
      showRssFeed: true,
      sticky: true,
    },
    footer: {
      showSocialLinks: true,
      showVersionIndicator: true,
      copyright: {
        holder: 'seez',
        year: new Date().getFullYear(),
      },
    },
  },

  content: {
    collections: [
      { name: 'books', label: { en: 'Books', de: 'Bücher' }, icon: 'tabler:book', enabled: true },
      { name: 'projects', label: { en: 'Projects', de: 'Projekte' }, icon: 'tabler:code', enabled: true },
      { name: 'lab', label: { en: 'Lab', de: 'Labor' }, icon: 'tabler:flask', enabled: true },
      { name: 'life', label: { en: 'Life', de: 'Leben' }, icon: 'tabler:heart', enabled: true },
    ],
    pagination: {
      defaultPageSize: 12,
      maxPageSize: 50,
    },
  },

  analytics: {
    googleAnalytics: undefined, // Set your GA ID here
    umami: undefined, // Set your Umami config here
  },

  development: {
    port: 4321,
    enableDebug: false,
    showBuildInfo: true,
  },
};

/**
 * Utility functions for accessing configuration
 */
export const getSeezConfig = () => SEEZ_CONFIG;

export const getSiteInfo = () => SEEZ_CONFIG.site;

export const getBrandColors = () => SEEZ_CONFIG.brand.colors;

export const getI18nConfig = () => SEEZ_CONFIG.i18n;

export const getSEOConfig = () => SEEZ_CONFIG.seo;

export const getMetadataConfig = () => ({
  title: {
    default: SEEZ_CONFIG.seo.defaultTitle,
    template: SEEZ_CONFIG.seo.titleTemplate,
  },
  description: SEEZ_CONFIG.seo.defaultDescription,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: SEEZ_CONFIG.seo.openGraph,
  twitter: SEEZ_CONFIG.seo.twitter,
});

export const getNavigationConfig = () => SEEZ_CONFIG.navigation;

export const getContentConfig = () => SEEZ_CONFIG.content;

/**
 * Generate page title using the configured template
 */
export const generatePageTitle = (pageTitle?: string): string => {
  if (!pageTitle || pageTitle === SEEZ_CONFIG.seo.defaultTitle) {
    return SEEZ_CONFIG.seo.defaultTitle;
  }
  return SEEZ_CONFIG.seo.titleTemplate.replace('%s', pageTitle);
};

/**
 * Get collection label for current language
 */
export const getCollectionLabel = (collectionName: string, language: 'en' | 'de'): string => {
  const collection = SEEZ_CONFIG.content.collections.find((c) => c.name === collectionName);
  return collection?.label[language] || collectionName;
};

/**
 * Get language-aware home URL
 */
export const getHomeUrl = (language: 'en' | 'de' = 'en'): string => {
  return `/${language}/`;
};

export default SEEZ_CONFIG;
