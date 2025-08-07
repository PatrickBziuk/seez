/**
 * Canonical URL Generation Utilities
 * @purpose Generate canonical URLs using canonical IDs for SEO
 * @dependencies content registry, permalink utilities
 * @usedBy SEO components, page templates, hreflang generation
 */

import { readFileSync, existsSync } from 'fs';
import { getPermalink } from './permalinks';

interface ContentRegistry {
  version: string;
  lastUpdated: string;
  entries: { [canonicalId: string]: RegistryEntry };
}

interface RegistryEntry {
  canonicalId: string;
  originalPath: string;
  language: 'en' | 'de';
  title: string;
  lastModified: string;
  contentHash: string;
  translations: {
    [lang in 'en' | 'de']?: {
      path: string;
      contentHash: string;
      status: 'current' | 'stale' | 'missing';
      lastGenerated?: string;
    };
  };
}

/**
 * Load the content registry
 */
function loadContentRegistry(): ContentRegistry | null {
  const registryPath = 'data/content-registry.json';

  if (!existsSync(registryPath)) {
    console.warn('Content registry not found:', registryPath);
    return null;
  }

  try {
    const registryContent = readFileSync(registryPath, 'utf-8');
    return JSON.parse(registryContent);
  } catch (error) {
    console.error('Failed to load content registry:', error);
    return null;
  }
}

/**
 * Extract collection and slug from content path
 */
function parseContentPath(path: string): { collection: string; slug: string; language: string } | null {
  // Extract from paths like "src/content/books/en/example-book.md"
  const match = path.match(/src\/content\/([^/]+)\/([^/]+)\/([^/]+)\.(md|mdx)$/);

  if (!match) {
    console.warn('Could not parse content path:', path);
    return null;
  }

  const [, collection, language, filename] = match;
  const slug = filename.replace(/\.(md|mdx)$/, '');

  return { collection, slug, language };
}

/**
 * Generate canonical URL for a content piece using its canonical ID
 */
export function getCanonicalUrl(canonicalId: string, targetLanguage?: 'en' | 'de'): string | null {
  const registry = loadContentRegistry();

  if (!registry) {
    return null;
  }

  const entry = registry.entries[canonicalId];

  if (!entry) {
    console.warn('Content entry not found in registry:', canonicalId);
    return null;
  }

  // Determine which language version to use
  const language = targetLanguage || entry.language;

  // Check if translation exists
  if (language !== entry.language && !entry.translations[language]) {
    console.warn(`Translation not available for ${canonicalId} in language ${language}`);
    return null;
  }

  // Get the appropriate content path
  const contentPath = language === entry.language ? entry.originalPath : entry.translations[language]?.path;

  if (!contentPath) {
    return null;
  }

  // Parse the path to get collection and slug
  const parsed = parseContentPath(contentPath);

  if (!parsed) {
    return null;
  }

  // Generate the permalink using existing utility
  try {
    return getPermalink(`/${parsed.language}/${parsed.collection}/${parsed.slug}`);
  } catch (error) {
    console.error('Failed to generate permalink:', error);
    return null;
  }
}

/**
 * Get all available language versions for a canonical ID
 */
export function getLanguageVersions(canonicalId: string): { language: 'en' | 'de'; url: string; available: boolean }[] {
  const registry = loadContentRegistry();

  if (!registry) {
    return [];
  }

  const entry = registry.entries[canonicalId];

  if (!entry) {
    return [];
  }

  const versions: { language: 'en' | 'de'; url: string; available: boolean }[] = [];

  // Add original language version
  const originalUrl = getCanonicalUrl(canonicalId, entry.language);
  if (originalUrl) {
    versions.push({
      language: entry.language,
      url: originalUrl,
      available: true,
    });
  }

  // Add translation versions
  const languages: ('en' | 'de')[] = ['en', 'de'];

  for (const lang of languages) {
    if (lang === entry.language) continue; // Skip original language

    const translation = entry.translations[lang];
    const available = translation?.status === 'current';

    if (available) {
      const url = getCanonicalUrl(canonicalId, lang);
      if (url) {
        versions.push({
          language: lang,
          url,
          available: true,
        });
      }
    } else {
      // Generate placeholder URL for missing translations
      const parsed = parseContentPath(entry.originalPath);
      if (parsed) {
        const placeholderUrl = getPermalink(`/${lang}/${parsed.collection}/${parsed.slug}`);
        versions.push({
          language: lang,
          url: placeholderUrl,
          available: false,
        });
      }
    }
  }

  return versions;
}

/**
 * Get canonical ID from content path (for reverse lookup)
 */
export function getCanonicalIdFromPath(contentPath: string): string | null {
  const registry = loadContentRegistry();

  if (!registry) {
    return null;
  }

  // Search through all entries to find matching path
  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    if (entry.originalPath === contentPath) {
      return canonicalId;
    }

    // Check translations
    for (const translation of Object.values(entry.translations)) {
      if (translation.path === contentPath) {
        return canonicalId;
      }
    }
  }

  return null;
}

/**
 * Generate hreflang data for a canonical ID
 */
export function getHreflangData(canonicalId: string): { hreflang: string; href: string }[] {
  const versions = getLanguageVersions(canonicalId);

  return versions
    .filter((version) => version.available)
    .map((version) => ({
      hreflang: version.language,
      href: version.url,
    }));
}

/**
 * Get content lineage information for SEO metadata
 */
export function getContentLineage(canonicalId: string): {
  canonicalId: string;
  originalLanguage: 'en' | 'de';
  isTranslation: boolean;
  sourceLanguage?: 'en' | 'de';
  translationStatus?: 'current' | 'stale' | 'missing';
} | null {
  const registry = loadContentRegistry();

  if (!registry) {
    return null;
  }

  const entry = registry.entries[canonicalId];

  if (!entry) {
    return null;
  }

  return {
    canonicalId,
    originalLanguage: entry.language,
    isTranslation: false, // This will be extended when we add translation tracking
    sourceLanguage: undefined,
    translationStatus: undefined,
  };
}

/**
 * Validate canonical URL system integrity
 */
export function validateCanonicalUrls(): { valid: boolean; errors: string[] } {
  const registry = loadContentRegistry();
  const errors: string[] = [];

  if (!registry) {
    errors.push('Content registry not available');
    return { valid: false, errors };
  }

  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    // Test original language URL generation
    const originalUrl = getCanonicalUrl(canonicalId, entry.language);
    if (!originalUrl) {
      errors.push(`Failed to generate URL for original content: ${canonicalId}`);
    }

    // Test translation URLs
    for (const [lang, translation] of Object.entries(entry.translations)) {
      if (translation.status === 'current') {
        const translationUrl = getCanonicalUrl(canonicalId, lang as 'en' | 'de');
        if (!translationUrl) {
          errors.push(`Failed to generate URL for translation: ${canonicalId} (${lang})`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
