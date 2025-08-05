/**
 * Translation Pipeline Utilities
 * @purpose Core utilities for the AI translation pipeline
 * @dependencies crypto, gray-matter
 * @usedBy Translation scripts and GitHub Actions workflows
 */

import crypto from 'crypto';
import matter from 'gray-matter';

/**
 * Supported languages in the translation pipeline
 */
export const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Translation task representing work to be done
 */
export interface TranslationTask {
  sourcePath: string;
  targetLang: SupportedLanguage;
  translationKey: string;
  reason: 'missing' | 'stale';
  sourceSha: string;
}

/**
 * Translation history entry schema
 */
export interface TranslationHistoryEntry {
  language: string;
  translator: string;
  model?: string;
  sourceSha: string;
  timestamp: string;
  status: 'ai-translated' | 'human-reviewed' | 'ai+human';
  reviewer?: string;
}

/**
 * AI text score schema
 */
export interface AITextScore {
  translationQuality?: number;
  originalClarity?: number;
  timestamp: string;
  notes?: string[];
}

/**
 * Compute SHA256 hash of normalized content (excluding mutable metadata)
 * @param content - The markdown content to hash
 * @returns SHA256 hash string
 */
export function computeContentSha(content: string): string {
  const parsed = matter(content);

  // Create normalized content excluding mutable fields
  const normalizedFrontmatter = { ...parsed.data };
  delete normalizedFrontmatter.timestamp;
  delete normalizedFrontmatter.translationHistory;
  delete normalizedFrontmatter.ai_tldr;
  delete normalizedFrontmatter.ai_textscore;
  delete normalizedFrontmatter.status?.translation;

  const normalizedContent = matter.stringify(parsed.content, normalizedFrontmatter);

  return crypto.createHash('sha256').update(normalizedContent).digest('hex');
}

/**
 * Get language pairs for translation
 * @param sourceLang - Source language
 * @returns Array of target languages to translate to
 */
export function getLanguagePairs(sourceLang: SupportedLanguage): SupportedLanguage[] {
  return SUPPORTED_LANGUAGES.filter((lang) => lang !== sourceLang);
}

/**
 * Generate translation key from file path
 * @param filePath - Path to the content file
 * @returns Unique translation key
 */
export function generateTranslationKey(filePath: string): string {
  const pathParts = filePath.split(/[/\\]/);
  const fileName = pathParts[pathParts.length - 1];
  const nameWithoutExt = fileName.replace(/\.(md|mdx)$/, '');

  // Remove language prefix if present (e.g., "en/article" -> "article")
  const cleanName = nameWithoutExt.replace(/^(en|de)\//, '');

  return cleanName;
}

/**
 * Validate frontmatter against translation pipeline schema
 * @param frontmatter - Parsed frontmatter object
 * @returns Validation result with errors if any
 */
export function validateTranslationFrontmatter(frontmatter: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!frontmatter.title) errors.push('Missing required field: title');
  if (!frontmatter.language || !SUPPORTED_LANGUAGES.includes(frontmatter.language as SupportedLanguage)) {
    errors.push('Invalid or missing language field');
  }

  // Translation-specific validation
  if (frontmatter.translationHistory) {
    if (!Array.isArray(frontmatter.translationHistory)) {
      errors.push('translationHistory must be an array');
    } else {
      frontmatter.translationHistory.forEach((entry: Record<string, unknown>, index: number) => {
        if (!entry.sourceSha) errors.push(`translationHistory[${index}]: missing sourceSha`);
        if (!entry.timestamp) errors.push(`translationHistory[${index}]: missing timestamp`);
        if (!entry.status) errors.push(`translationHistory[${index}]: missing status`);
      });
    }
  }

  if (frontmatter.ai_textscore) {
    const textScore = frontmatter.ai_textscore as Record<string, unknown>;
    if (!textScore.timestamp) {
      errors.push('ai_textscore: missing timestamp');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a new translation history entry
 * @param params - Parameters for the new entry
 * @returns Translation history entry
 */
export function createTranslationHistoryEntry({
  targetLang,
  sourceSha,
  model = 'gpt-4o-mini',
  reviewer,
}: {
  targetLang: SupportedLanguage;
  sourceSha: string;
  model?: string;
  reviewer?: string;
}): TranslationHistoryEntry {
  const entry: TranslationHistoryEntry = {
    language: targetLang,
    translator: reviewer ? `AI+Human (${model})` : `AI (${model})`,
    model,
    sourceSha,
    timestamp: new Date().toISOString(),
    status: reviewer ? 'ai+human' : 'ai-translated',
  };

  // Only add reviewer if it exists
  if (reviewer) {
    entry.reviewer = reviewer;
  }

  return entry;
}

/**
 * Create short SHA for display purposes
 * @param fullSha - Full SHA string
 * @returns First 7 characters of SHA
 */
export function getShortSha(fullSha: string): string {
  return fullSha.substring(0, 7);
}

/**
 * Generate branch name for translation PR
 * @param translationKey - Content translation key
 * @param sourceSha - Source content SHA
 * @param targetLang - Target language
 * @returns Branch name following convention
 */
export function generateTranslationBranchName(
  translationKey: string,
  sourceSha: string,
  targetLang: SupportedLanguage
): string {
  const shortSha = getShortSha(sourceSha);
  return `translate/${translationKey}-${shortSha}-${targetLang}`;
}

/**
 * Generate PR title for translation
 * @param targetLang - Target language
 * @param translationKey - Content translation key
 * @param sourceSha - Source content SHA
 * @returns PR title following convention
 */
export function generateTranslationPRTitle(
  targetLang: SupportedLanguage,
  translationKey: string,
  sourceSha: string
): string {
  const shortSha = getShortSha(sourceSha);
  return `AI translations: ${targetLang} for ${translationKey} (source @ ${shortSha})`;
}
