/**
 * Configuration Types for Seez
 * 
 * This file defines TypeScript interfaces for the centralized configuration
 * system defined in src/config.yaml. This ensures type safety when accessing
 * configuration values throughout the application.
 * 
 * Last updated: 2025-08-09
 * Matches config.yaml structure completely
 */

export interface SiteConfig {
  name: string;
  site: string;
  base: string;
  trailingSlash: boolean;
  title: string;
  description: string;
  author: string;
  lang: string;
  logo: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  googleSiteVerificationId?: string;
}

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  light: {
    background: string;
    surface: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
  };
  dark: {
    background: string;
    surface: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
  };
}

export interface ThemeTypography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
}

export interface ThemeConfig {
  colors: ThemeColors;
  typography: ThemeTypography;
}

export interface MetadataConfig {
  title: {
    default: string;
    template: string;
  };
  description: string;
  robots: {
    index: boolean;
    follow: boolean;
  };
  openGraph: {
    site_name: string;
    images: Array<{
      url: string;
      width: number;
      height: number;
    }>;
    type: string;
  };
  twitter: {
    handle: string;
    site: string;
    cardType: string;
  };
}

export interface I18nConfig {
  language: string;
  textDirection: 'ltr' | 'rtl';
  locales: string[];
  translations: {
    autoGenerate: boolean;
    qualityThreshold: number;
    provider: string;
    model: string;
    tracking: {
      enabled: boolean;
      co2PerToken: number;
    };
  };
}

export interface IntegrationsConfig {
  openai: {
    enabled: boolean;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  contact: {
    enabled: boolean;
    provider: string;
    endpoint: string;
  };
  search: {
    enabled: boolean;
    provider: string;
    hotkeys: string[];
  };
}

export interface ContentCollection {
  enabled: boolean;
  title: string;
  description: string;
  icon: string;
}

export interface ContentConfig {
  collections: {
    books: ContentCollection;
    projects: ContentCollection;
    lab: ContentCollection;
    life: ContentCollection;
  };
}

export interface CallToAction {
  text: string;
  url: string;
  style: 'primary' | 'secondary';
}

export interface FeaturedSection {
  type: string;
  title: string;
  limit: number;
  showMore: boolean;
}

export interface HomepageConfig {
  hero: {
    enabled: boolean;
    title: string;
    subtitle: string;
    showImage: boolean;
    cta: {
      primary: CallToAction;
      secondary: CallToAction;
    };
  };
  featured: {
    enabled: boolean;
    sections: FeaturedSection[];
  };
}

export interface NavigationItem {
  text: string;
  href: string;
  icon: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface LegalLink {
  text: string;
  href: string;
}

export interface NavigationConfig {
  header: {
    showLogo: boolean;
    showThemeToggle: boolean;
    showLanguageSwitch: boolean;
    showSearch: boolean;
    items: NavigationItem[];
  };
  footer: {
    enabled: boolean;
    social: SocialLink[];
    legal: LegalLink[];
  };
}

export interface FeaturesConfig {
  enableComments: boolean;
  enableShare: boolean;
  enablePrint: boolean;
  enableSearch: boolean;
  enableTags: boolean;
  enableAutoTranslation: boolean;
  enableTranslationHooks: boolean;
  showTranslationMetadata: boolean;
  enableImageOptimization: boolean;
  enableMinification: boolean;
  enableCompression: boolean;
}

export interface LegacyBlogConfig {
  isEnabled: boolean;
  postsPerPage: number;
  post: {
    isEnabled: boolean;
    permalink: string;
    robots: {
      index: boolean;
    };
  };
  list: {
    isEnabled: boolean;
    pathname: string;
    robots: {
      index: boolean;
    };
  };
  category: {
    isEnabled: boolean;
    pathname: string;
    robots: {
      index: boolean;
    };
  };
  tag: {
    isEnabled: boolean;
    pathname: string;
    robots: {
      index: boolean;
    };
  };
  isRelatedPostsEnabled: boolean;
  relatedPostsCount: number;
}

export interface AnalyticsConfig {
  vendors: {
    googleAnalytics: {
      id: string | null;
    };
  };
}

export interface UIConfig {
  theme: 'system' | 'light' | 'dark' | 'light:only' | 'dark:only';
}

/**
 * Main Configuration Interface
 * 
 * This represents the complete structure of the config.yaml file
 */
export interface AppConfig {
  site: SiteConfig;
  theme: ThemeConfig;
  metadata: MetadataConfig;
  i18n: I18nConfig;
  integrations: IntegrationsConfig;
  content: ContentConfig;
  homepage: HomepageConfig;
  navigation: NavigationConfig;
  features: FeaturesConfig;
  apps: {
    blog: LegacyBlogConfig;
  };
  analytics: AnalyticsConfig;
  ui: UIConfig;
}

/**
 * Helper type for accessing nested configuration properties
 */
export type ConfigPath<T = AppConfig> = T extends object
  ? {
      [K in keyof T]: T[K] extends object
        ? K | `${K & string}.${ConfigPath<T[K]> & string}`
        : K;
    }[keyof T]
  : never;

/**
 * Utility type for getting the value type at a specific config path
 */
export type ConfigValue<T extends string> = T extends keyof AppConfig
  ? AppConfig[T]
  : T extends `${infer K}.${infer Rest}`
  ? K extends keyof AppConfig
    ? ConfigValue<Rest> extends string
      ? AppConfig[K] extends object
        ? ConfigValue<Rest>
        : never
      : never
    : never
  : never;
