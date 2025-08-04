/**
 * TypeScript type definitions for the AI tagging system
 */

export interface TagAnalysis {
  tag: string;
  language: 'en' | 'de';
  count: number;
  collections: string[];
  files: string[];
}

export interface TagRegistry {
  version: string;
  lastUpdated: string;
  analysis: {
    totalFiles: number;
    totalTags: number;
    byLanguage: {
      en: number;
      de: number;
    };
    byCollection: Record<string, number>;
  };
  tags: {
    en: Record<string, TagAnalysis>;
    de: Record<string, TagAnalysis>;
  };
  suggestions: {
    multilingual_pairs: Array<{
      en: string;
      de: string;
      confidence: 'high' | 'medium' | 'low';
    }>;
    categories: {
      technology: string[];
      content: string[];
      personal: string[];
      creative: string[];
      other: string[];
    };
  };
}

export interface MasterTagRegistry {
  version: string;
  lastUpdated: string;
  metadata: {
    totalTags: number;
    byLanguage: { en: number; de: number };
    sources: string[];
  };
  categories: {
    technology: {
      en: string[];
      de: string[];
    };
    content: {
      en: string[];
      de: string[];
    };
    personal: {
      en: string[];
      de: string[];
    };
    creative: {
      en: string[];
      de: string[];
    };
    academic: {
      en: string[];
      de: string[];
    };
    business: {
      en: string[];
      de: string[];
    };
    other: {
      en: string[];
      de: string[];
    };
  };
  multilingual_pairs: Array<{
    en: string;
    de: string;
    confidence: 'high' | 'medium' | 'low';
    category?: string;
  }>;
  aliases: {
    en: Record<string, string>;
    de: Record<string, string>;
  };
  usage_stats: {
    [tag: string]: {
      language: 'en' | 'de';
      count: number;
      collections: string[];
      last_seen: string;
    };
  };
}

export interface ContentAnalysis {
  filePath: string;
  collection: string;
  language: 'en' | 'de';
  existingTags: string[];
  suggestedTags: string[];
  confidence: number;
  reasoning: string;
  newTagCandidates: string[];
  shouldAddToRegistry: boolean;
}

export interface TagSuggestionReport {
  timestamp: string;
  summary: {
    totalFiles: number;
    filesWithSuggestions: number;
    totalSuggestedTags: number;
    averageConfidence: number;
    newTagCandidates: number;
  };
  suggestions: ContentAnalysis[];
  newTagRegistry: string[];
}

export interface ApplicationResult {
  totalFiles: number;
  filesModified: number;
  tagsAdded: number;
  newTagsAddedToRegistry: string[];
  skippedFiles: number;
}

export type SupportedLanguage = 'en' | 'de';
export type ContentCollection = 'books' | 'projects' | 'lab' | 'life' | 'pages';
export type TagCategory = 'technology' | 'content' | 'personal' | 'creative' | 'academic' | 'business' | 'other';
export type TagConfidence = 'high' | 'medium' | 'low';
