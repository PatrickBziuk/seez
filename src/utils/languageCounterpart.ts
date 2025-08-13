/**
 * Language Counterpart Detection Utilities
 * Uses the content registry from Plan 10024 to detect translated content
 */

interface ContentRegistryEntry {
  canonicalId: string;
  originalPath: string;
  originalLanguage: string;
  title: string;
  lastModified: string;
  contentHash: string;
  translations: {
    [lang: string]: {
      path: string;
      status: string; // Allow any string for now
      lastTranslated: string;
      translationHash: string;
    };
  };
}

interface ContentRegistry {
  version: string;
  lastUpdated: string;
  entries: {
    [canonicalId: string]: ContentRegistryEntry;
  };
}

/**
 * Load content registry data
 */
async function loadContentRegistry(): Promise<ContentRegistry | null> {
  try {
    // In Astro, we need to import the JSON file statically
    const registry = await import('../../data/content-registry.json');
    return registry.default;
  } catch {
    return null;
  }
}

/**
 * Find counterpart content in different language
 */
export async function findLanguageCounterpart(
  canonicalId: string,
  currentLanguage: string
): Promise<{
  language: string;
  path: string;
  status: 'current' | 'outdated' | 'missing';
  url: string;
} | null> {
  const registry = await loadContentRegistry();
  if (!registry) return null;

  const entry = registry.entries[canonicalId];
  if (!entry) return null;

  // Determine target language
  const targetLanguage = currentLanguage === 'en' ? 'de' : 'en';

  // Check if content is originally in target language
  if (entry.originalLanguage === targetLanguage) {
    // Create URL from original path
    const url = convertPathToUrl(entry.originalPath, targetLanguage);
    return {
      language: targetLanguage,
      path: entry.originalPath,
      status: 'current',
      url,
    };
  }

  // Check translations
  const translation = entry.translations[targetLanguage];
  if (!translation) return null;

  const url = convertPathToUrl(translation.path, targetLanguage);
  return {
    language: targetLanguage,
    path: translation.path,
    status: translation.status as 'current' | 'outdated' | 'missing',
    url,
  };
}

/**
 * Convert content path to URL
 */
function convertPathToUrl(contentPath: string, language: string): string {
  // Extract collection and slug from path
  // Example: src/content/lab/en/tldr-demo.mdx -> /en/lab/tldr-demo
  const pathParts = contentPath.split('/');
  const collection = pathParts[2]; // 'lab', 'books', etc.
  const filename = pathParts[pathParts.length - 1]; // 'tldr-demo.mdx'
  const slug = filename.replace(/\.(md|mdx)$/, ''); // 'tldr-demo'

  return `/${language}/${collection}/${slug}`;
}

/**
 * Get all available languages for content
 */
export async function getAvailableLanguages(canonicalId: string): Promise<
  {
    language: string;
    url: string;
    status: 'current' | 'outdated' | 'missing';
    isOriginal: boolean;
  }[]
> {
  const registry = await loadContentRegistry();
  if (!registry) return [];

  const entry = registry.entries[canonicalId];
  if (!entry) return [];

  const languages: {
    language: string;
    url: string;
    status: 'current' | 'outdated' | 'missing';
    isOriginal: boolean;
  }[] = [];

  // Add original language
  const originalUrl = convertPathToUrl(entry.originalPath, entry.originalLanguage);
  languages.push({
    language: entry.originalLanguage,
    url: originalUrl,
    status: 'current',
    isOriginal: true,
  });

  // Add translations
  Object.entries(entry.translations).forEach(([lang, translation]) => {
    if (translation.status !== 'missing') {
      const url = convertPathToUrl(translation.path, lang);
      languages.push({
        language: lang,
        url,
        status: translation.status as 'current' | 'outdated' | 'missing',
        isOriginal: false,
      });
    }
  });

  return languages;
}

/**
 * Check if content has translations
 */
export async function hasTranslations(canonicalId: string): Promise<boolean> {
  const languages = await getAvailableLanguages(canonicalId);
  return languages.length > 1;
}

/**
 * Get language label for display
 */
export function getLanguageLabel(language: string, displayLanguage: string = 'en'): string {
  const labels = {
    en: {
      en: 'English',
      de: 'German',
    },
    de: {
      en: 'Englisch',
      de: 'Deutsch',
    },
  };

  return labels[displayLanguage as keyof typeof labels]?.[language as keyof typeof labels.en] || language.toUpperCase();
}

/**
 * Get language flag emoji
 */
export function getLanguageFlag(language: string): string {
  const flags = {
    en: '🇺🇸',
    de: '🇩🇪',
  };

  return flags[language as keyof typeof flags] || '🌐';
}
