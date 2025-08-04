export const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
export const DEFAULT_LANGUAGE = 'en';

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_INFO = {
  en: { label: 'English', flag: '🇺🇸', dir: 'ltr' },
  de: { label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' }
} as const;

/**
 * Load translations for a specific language
 */
export async function getTranslations(language: SupportedLanguage) {
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
 * Detect language from URL or user preference
 */
export function detectLanguage(url: string): SupportedLanguage {
  const pathSegments = url.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  
  if (firstSegment && SUPPORTED_LANGUAGES.includes(firstSegment as SupportedLanguage)) {
    return firstSegment as SupportedLanguage;
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Generate localized URL
 */
export function getLocalizedUrl(path: string, language: SupportedLanguage): string {
  // Remove existing language prefix
  const cleanPath = path.replace(/^\/[a-z]{2}(?=\/|$)/, '');
  
  // Add new language prefix for all languages (including default)
  // since the routing structure uses /[lang]/ for all routes
  return `/${language}${cleanPath || ''}`;
}

/**
 * Get language from locale string (e.g., 'en-US' -> 'en')
 */
export function getLanguageFromLocale(locale: string): SupportedLanguage {
  const lang = locale.split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
    return lang as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Detect language from Accept-Language header
 */
export function detectLanguageFromHeaders(acceptLanguage: string | null): SupportedLanguage {
  if (!acceptLanguage) {
    return DEFAULT_LANGUAGE;
  }

  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,de;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      // Remove quality values (;q=0.9) and trim
      const langCode = lang.split(';')[0].trim();
      // Extract language code before region (en-US -> en)
      return langCode.split('-')[0].toLowerCase();
    })
    .filter(lang => SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage));

  // Return first supported language found, or default
  return languages.length > 0 ? (languages[0] as SupportedLanguage) : DEFAULT_LANGUAGE;
}
