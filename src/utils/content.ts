/**
 * Content utilities for language-aware content management and slug generation
 */
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './i18n';

export type ContentCollection = 'books' | 'projects' | 'lab' | 'life';
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Slug normalization and generation utilities
 */
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function generateSlug(title: string, id?: string): string {
  const normalizedTitle = normalizeSlug(title);
  return id ? `${id}/${normalizedTitle}` : normalizedTitle;
}

export function validateUniqueness(slugs: string[]): string[] {
  const seen = new Set();
  const duplicates = [];
  
  for (const slug of slugs) {
    if (seen.has(slug)) {
      duplicates.push(slug);
    } else {
      seen.add(slug);
    }
  }
  
  return duplicates;
}

export function calculateRelatedness(tags1: string[], tags2: string[]): number {
  const set1 = new Set(tags1);
  const set2 = new Set(tags2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  return intersection.size;
}

/**
 * Get content filtered by language
 */
export async function getContentByLanguage<T extends ContentCollection>(
  collection: T,
  language: SupportedLanguage = 'en'
): Promise<CollectionEntry<T>[]> {
  const entries = await getCollection(collection);
  return entries.filter(entry => 
    entry.data.language === language && !entry.data.draft
  );
}

/**
 * Get content with fallback to default language
 */
export async function getContentWithFallback<T extends ContentCollection>(
  collection: T,
  id: string,
  preferredLanguage: SupportedLanguage = 'en'
): Promise<{ entry: CollectionEntry<T> | null; isDefaultLanguage: boolean }> {
  const entries = await getCollection(collection);
  
  // Try preferred language first
  let entry = entries.find(e => 
    e.id === id && e.data.language === preferredLanguage && !e.data.draft
  );
  
  if (entry) {
    return { entry, isDefaultLanguage: preferredLanguage === DEFAULT_LANGUAGE };
  }
  
  // Fallback to default language (English)
  entry = entries.find(e => 
    e.id === id && e.data.language === DEFAULT_LANGUAGE && !e.data.draft
  );
  
  if (entry) {
    return { entry, isDefaultLanguage: false };
  }
  
  // Fallback to any available language
  entry = entries.find(e => 
    e.id === id && !e.data.draft
  );
  
  return { entry: entry || null, isDefaultLanguage: false };
}

/**
 * Get available languages for a specific content item
 */
export async function getAvailableLanguages<T extends ContentCollection>(
  collection: T,
  id: string
): Promise<SupportedLanguage[]> {
  const entries = await getCollection(collection);
  const availableLanguages = entries
    .filter(entry => entry.id === id && !entry.data.draft)
    .map(entry => entry.data.language as SupportedLanguage)
    .filter(lang => SUPPORTED_LANGUAGES.includes(lang));
  
  return [...new Set(availableLanguages)];
}

/**
 * Generate alternate language URLs for SEO
 */
export function generateAlternateLanguageUrls(
  baseUrl: string,
  id: string,
  availableLanguages: SupportedLanguage[]
): Array<{ href: string; hreflang: string }> {
  return availableLanguages.map(lang => ({
    href: lang === DEFAULT_LANGUAGE ? `${baseUrl}/${id}` : `${baseUrl}/${lang}/${id}`,
    hreflang: lang
  }));
}

/**
 * Check if content exists in specific language
 */
export async function hasContentInLanguage<T extends ContentCollection>(
  collection: T,
  id: string,
  language: SupportedLanguage
): Promise<boolean> {
  try {
    const entries = await getCollection(collection);
    return entries.some(entry => 
      entry.id === id && 
      entry.data.language === language && 
      !entry.data.draft
    );
  } catch {
    return false;
  }
}
