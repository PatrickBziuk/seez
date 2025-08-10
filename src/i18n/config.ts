/**
 * i18n Configuration for Seez
 * Defines translation loading, language detection, and routing
 */

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from '~/utils/i18n';

export const i18nConfig = {
  defaultLocale: DEFAULT_LANGUAGE,
  locales: [...SUPPORTED_LANGUAGES],
  fallbackLocale: DEFAULT_LANGUAGE,
  
  // Route patterns for language-specific URLs
  routes: [
    { pattern: '/en/:path*', locale: 'en' },
    { pattern: '/de/:path*', locale: 'de' },
  ],
} as const;

/**
 * Load and format translations for a specific locale
 */
export async function loadTranslations(locale: string): Promise<Record<string, unknown>> {
  const language = locale as SupportedLanguage;
  
  try {
    const translations = await import(`../locales/${language}.json`);
    return translations.default;
  } catch {
    console.warn(`Failed to load translations for ${language}, falling back to ${DEFAULT_LANGUAGE}`);
    const fallback = await import(`../locales/${DEFAULT_LANGUAGE}.json`);
    return fallback.default;
  }
}

/**
 * Format translation message with parameters
 */
export function formatMessage(
  translations: Record<string, unknown>,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let message: unknown = translations;
  
  for (const k of keys) {
    if (message && typeof message === 'object' && message !== null && k in message) {
      message = (message as Record<string, unknown>)[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key; // Return key as fallback
    }
  }
  
  if (typeof message !== 'string') {
    console.warn(`Translation value is not a string: ${key}`);
    return key;
  }
  
  // Simple parameter replacement
  if (params) {
    return Object.entries(params).reduce(
      (text: string, [param, value]) => text.replace(new RegExp(`{{${param}}}`, 'g'), String(value)),
      message
    );
  }
  
  return message;
}

export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Create a translation function for a specific locale
 */
export async function createTranslationFunction(locale: string): Promise<TranslationFunction> {
  const translations = await loadTranslations(locale);
  
  return (key: string, params?: Record<string, string | number>) => {
    return formatMessage(translations, key, params);
  };
}
