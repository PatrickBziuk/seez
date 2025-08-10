/**
 * Simple Configuration Access Utilities
 * 
 * This module provides practical utilities for accessing the centralized
 * configuration defined in src/config.yaml throughout the application.
 */

/**
 * Environment-aware configuration helpers
 * These functions work with both the config file and environment variables
 */
export class ConfigUtils {
  /**
   * Get OpenAI API key from environment variables
   * This should only be used in server-side contexts
   */
  static getOpenAIKey(): string | null {
    if (typeof process !== 'undefined' && process.env.OPENAI_API_KEY) {
      return process.env.OPENAI_API_KEY;
    }
    return null;
  }

  /**
   * Get translation quality threshold from environment or default
   */
  static getTranslationQualityThreshold(): number {
    if (typeof process !== 'undefined' && process.env.TRANSLATION_QUALITY_THRESHOLD) {
      const threshold = parseInt(process.env.TRANSLATION_QUALITY_THRESHOLD, 10);
      return isNaN(threshold) ? 70 : threshold;
    }
    return 70; // Default threshold
  }

  /**
   * Get Formspree endpoint from environment variables
   */
  static getFormspreeEndpoint(): string | null {
    if (typeof process !== 'undefined' && process.env.FORMSPREE_ENDPOINT) {
      return process.env.FORMSPREE_ENDPOINT;
    }
    return null;
  }

  /**
   * Get Google Analytics ID from environment variables
   */
  static getGoogleAnalyticsId(): string | null {
    if (typeof process !== 'undefined' && process.env.GOOGLE_ANALYTICS_ID) {
      return process.env.GOOGLE_ANALYTICS_ID;
    }
    return null;
  }

  /**
   * Check if we're in development mode
   */
  static isDevelopment(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  }

  /**
   * Check if we're in production mode
   */
  static isProduction(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
  }

  /**
   * Log environment configuration (development only)
   */
  static logEnvironmentConfig(): void {
    if (!this.isDevelopment()) return;

    console.group('🔧 Environment Configuration');
    console.log('🤖 OpenAI Key:', this.getOpenAIKey() ? '✅ Configured' : '❌ Missing');
    console.log('📊 Translation Threshold:', this.getTranslationQualityThreshold());
    console.log('📧 Formspree Endpoint:', this.getFormspreeEndpoint() ? '✅ Configured' : '❌ Missing');
    console.log('📈 Google Analytics:', this.getGoogleAnalyticsId() ? '✅ Configured' : '❌ Missing');
    console.groupEnd();
  }
}

/**
 * Theme configuration helpers
 * These work with the theme system defined in config.yaml
 */
export class ThemeUtils {
  /**
   * CSS custom property names for theme colors
   */
  static readonly CSS_VARS = {
    PRIMARY: '--color-primary',
    SECONDARY: '--color-secondary',
    ACCENT: '--color-accent',
    SUCCESS: '--color-success',
    WARNING: '--color-warning',
    ERROR: '--color-error',
    INFO: '--color-info',
    BACKGROUND: '--color-background',
    SURFACE: '--color-surface',
    BORDER: '--color-border',
    TEXT_PRIMARY: '--color-text-primary',
    TEXT_SECONDARY: '--color-text-secondary',
    TEXT_MUTED: '--color-text-muted',
  } as const;

  /**
   * Get a CSS custom property value
   */
  static getCSSVar(name: string): string {
    if (typeof document !== 'undefined') {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    }
    return '';
  }

  /**
   * Set a CSS custom property value
   */
  static setCSSVar(name: string, value: string): void {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(name, value);
    }
  }

  /**
   * Apply theme colors from configuration
   */
  static applyThemeColors(colors: Record<string, string>): void {
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      this.setCSSVar(cssVar, value);
    });
  }
}

/**
 * Feature flag helpers
 * These work with the feature flags defined in config.yaml
 */
export class FeatureFlags {
  /**
   * Default feature flags (fallback when config is not available)
   */
  static readonly DEFAULTS = {
    enableSearch: true,
    enableComments: false,
    enableShare: true,
    enablePrint: true,
    enableTags: true,
    enableAutoTranslation: true,
    enableTranslationHooks: true,
    showTranslationMetadata: true,
    enableImageOptimization: true,
    enableMinification: true,
    enableCompression: true,
  } as const;

  /**
   * Check if a feature is enabled (with fallback to defaults)
   */
  static isEnabled(feature: keyof typeof FeatureFlags.DEFAULTS, config?: Record<string, unknown>): boolean {
    if (config?.features && typeof config.features === 'object') {
      const features = config.features as Record<string, unknown>;
      if (feature in features && features[feature] !== undefined) {
        return Boolean(features[feature]);
      }
    }
    return this.DEFAULTS[feature];
  }
}

/**
 * Navigation helpers
 */
export class NavigationUtils {
  /**
   * Build navigation URL with language prefix
   */
  static buildUrl(path: string, lang: string = 'en'): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Return language-prefixed URL
    return `/${lang}/${cleanPath}`.replace(/\/+/g, '/');
  }

  /**
   * Get current language from URL
   */
  static getCurrentLanguage(url: string = ''): string {
    if (typeof window !== 'undefined' && !url) {
      url = window.location.pathname;
    }
    
    const match = url.match(/^\/([a-z]{2})\//);
    return match ? match[1] : 'en';
  }

  /**
   * Remove language prefix from path
   */
  static getCleanPath(path: string): string {
    return path.replace(/^\/[a-z]{2}\//, '/');
  }
}

/**
 * Content helpers
 */
export class ContentUtils {
  /**
   * Collection icon mapping
   */
  static readonly COLLECTION_ICONS = {
    books: '📚',
    projects: '🚀',
    lab: '🧪',
    life: '🌱',
  } as const;

  /**
   * Get icon for a collection
   */
  static getCollectionIcon(collection: string): string {
    return this.COLLECTION_ICONS[collection as keyof typeof this.COLLECTION_ICONS] || '📄';
  }

  /**
   * Generate collection title
   */
  static getCollectionTitle(collection: string): string {
    return collection.charAt(0).toUpperCase() + collection.slice(1);
  }
}

/**
 * Development utilities
 */
export class DevUtils {
  /**
   * Log all configuration utilities status
   */
  static logStatus(): void {
    if (!ConfigUtils.isDevelopment()) return;

    console.group('⚙️ Configuration System Status');
    
    // Environment config
    ConfigUtils.logEnvironmentConfig();
    
    // Feature flags
    console.group('🎛️ Feature Flags (Defaults)');
    Object.entries(FeatureFlags.DEFAULTS).forEach(([key, value]) => {
      console.log(`${value ? '✅' : '❌'} ${key}`);
    });
    console.groupEnd();
    
    // Theme status
    console.group('🎨 Theme System');
    console.log('CSS Variables:', Object.values(ThemeUtils.CSS_VARS).join(', '));
    console.groupEnd();
    
    console.groupEnd();
  }
}
