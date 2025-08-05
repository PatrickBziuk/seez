#!/usr/bin/env tsx

/**
 * Content Canonical System - Canonical ID and Registry Management
 * @purpose Manage canonical IDs, content registry, and translation relationships
 * @dependencies crypto, fs, path, gray-matter
 * @usedBy Pre-commit hooks and content management scripts
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Define supported languages here to avoid import issues
type SupportedLanguage = 'en' | 'de';

/**
 * Content registry configuration
 */
const CONTENT_BASE_PATH = 'src/content';
const CONTENT_REGISTRY_PATH = 'data/content-registry.json';
const CONTENT_COLLECTIONS = ['books', 'projects', 'lab', 'life'] as const;

/**
 * Canonical ID format: slug-YYYYMMDD-hash8
 */
interface CanonicalId {
  id: string;
  generated: string;  // ISO timestamp
  filePath: string;
  contentHash: string;
}

/**
 * Content registry entry
 */
interface ContentRegistryEntry {
  canonicalId: string;
  originalPath: string;
  originalLanguage: SupportedLanguage;
  title: string;
  lastModified: string;
  contentHash: string;
  translations: {
    [lang in SupportedLanguage]?: {
      path: string;
      status: 'current' | 'stale' | 'missing';
      lastTranslated: string;
      translationHash: string;
    };
  };
}

/**
 * Content registry structure
 */
interface ContentRegistry {
  version: string;
  lastUpdated: string;
  entries: Record<string, ContentRegistryEntry>;
}

/**
 * Generate canonical ID for content
 */
function generateCanonicalId(filePath: string, content: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const hash = crypto
    .createHash('sha256')
    .update(filePath + content)
    .digest('hex')
    .substring(0, 8);
  return `slug-${date}-${hash}`;
}

/**
 * Compute content hash for change detection
 */
function computeContentHash(content: string): string {
  const parsed = matter(content);
  
  // Normalize content excluding mutable fields
  const normalizedFrontmatter = { ...parsed.data };
  delete normalizedFrontmatter.timestamp;
  delete normalizedFrontmatter.translationHistory;
  delete normalizedFrontmatter.ai_metadata;
  delete normalizedFrontmatter.ai_tldr;
  delete normalizedFrontmatter.ai_textscore;
  delete normalizedFrontmatter.lastModified;
  delete normalizedFrontmatter.canonicalId;
  delete normalizedFrontmatter.translationOf;
  
  const normalizedContent = matter.stringify(parsed.content, normalizedFrontmatter);
  return crypto.createHash('sha256').update(normalizedContent).digest('hex');
}

/**
 * Load content registry
 */
function loadContentRegistry(): ContentRegistry {
  if (!fs.existsSync(CONTENT_REGISTRY_PATH)) {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      entries: {},
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(CONTENT_REGISTRY_PATH, 'utf-8'));
  } catch (error) {
    console.warn('Failed to load content registry, creating new one:', error);
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      entries: {},
    };
  }
}

/**
 * Save content registry
 */
function saveContentRegistry(registry: ContentRegistry): void {
  registry.lastUpdated = new Date().toISOString();
  
  // Ensure data directory exists
  fs.mkdirSync(path.dirname(CONTENT_REGISTRY_PATH), { recursive: true });
  
  // Create backup of existing registry
  if (fs.existsSync(CONTENT_REGISTRY_PATH)) {
    const backupPath = `${CONTENT_REGISTRY_PATH}.backup.${Date.now()}`;
    fs.copyFileSync(CONTENT_REGISTRY_PATH, backupPath);
  }
  
  fs.writeFileSync(CONTENT_REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

/**
 * Get all content files
 */
function getAllContentFiles(): string[] {
  const files: string[] = [];
  
  for (const collection of CONTENT_COLLECTIONS) {
    const collectionPath = path.join(CONTENT_BASE_PATH, collection);
    if (!fs.existsSync(collectionPath)) continue;
    
    function scanDirectory(dirPath: string) {
      const entries = fs.readdirSync(dirPath);
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        const stat = fs.statSync(entryPath);
        
        if (stat.isDirectory()) {
          scanDirectory(entryPath);
        } else if (entry.match(/\.(md|mdx)$/)) {
          files.push(entryPath);
        }
      }
    }
    
    scanDirectory(collectionPath);
  }
  
  return files;
}

/**
 * Detect if content is original or translation
 */
function detectContentType(filePath: string, frontmatter: Record<string, unknown>): {
  isOriginal: boolean;
  language: SupportedLanguage;
  originalLanguage?: SupportedLanguage;
  translationOf?: string;
} {
  const language = (frontmatter.language as SupportedLanguage) || 'en';
  
  // Check if it's explicitly marked as a translation
  if (frontmatter.translationOf) {
    return {
      isOriginal: false,
      language,
      originalLanguage: frontmatter.sourceLanguage as SupportedLanguage,
      translationOf: frontmatter.translationOf as string,
    };
  }
  
  // Check if it's explicitly marked as original
  if (frontmatter.originalLanguage) {
    return {
      isOriginal: true,
      language,
      originalLanguage: language,
    };
  }
  
  // Heuristic: if in root language folder and no translation markers, assume original
  const pathLang = filePath.match(/[/\\](en|de)[/\\]/)?.[1] as SupportedLanguage;
  const isInLanguageFolder = pathLang === language;
  
  return {
    isOriginal: isInLanguageFolder, // Assume files in language folders are originals
    language,
    originalLanguage: isInLanguageFolder ? language : undefined,
  };
}

/**
 * Process a single content file
 */
function processContentFile(filePath: string, registry: ContentRegistry): {
  updated: boolean;
  canonicalId: string;
  needsFrontmatterUpdate: boolean;
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(content);
  const contentHash = computeContentHash(content);
  const relativePath = path.relative(CONTENT_BASE_PATH, filePath).replace(/\\/g, '/');
  
  // Check if file already has canonical ID
  let canonicalId = parsed.data.canonicalId as string;
  let needsFrontmatterUpdate = false;
  
  if (!canonicalId) {
    // Generate new canonical ID
    canonicalId = generateCanonicalId(relativePath, content);
    needsFrontmatterUpdate = true;
    console.log(`Generated canonical ID ${canonicalId} for ${relativePath}`);
  }
  
  const contentType = detectContentType(filePath, parsed.data);
  const title = parsed.data.title as string || path.basename(filePath, path.extname(filePath));
  
  // Check if registry entry exists
  const existingEntry = registry.entries[canonicalId];
  
  if (!existingEntry) {
    // Create new registry entry
    if (contentType.isOriginal) {
      registry.entries[canonicalId] = {
        canonicalId,
        originalPath: relativePath,
        originalLanguage: contentType.language,
        title,
        lastModified: new Date().toISOString(),
        contentHash,
        translations: {},
      };
      console.log(`Registered new original content: ${canonicalId} (${contentType.language})`);
    } else {
      // This is a translation, but we need to find or create the original entry
      if (contentType.translationOf) {
        const originalEntry = registry.entries[contentType.translationOf];
        if (originalEntry) {
          originalEntry.translations[contentType.language] = {
            path: relativePath,
            status: 'current',
            lastTranslated: new Date().toISOString(),
            translationHash: contentHash,
          };
          console.log(`Registered translation: ${canonicalId} (${contentType.language} of ${contentType.translationOf})`);
        } else {
          console.warn(`Translation references non-existent original: ${contentType.translationOf}`);
        }
      }
    }
    
    return { updated: true, canonicalId, needsFrontmatterUpdate };
  }
  
  // Update existing entry if content changed
  if (existingEntry.contentHash !== contentHash) {
    existingEntry.lastModified = new Date().toISOString();
    existingEntry.contentHash = contentHash;
    
    // Mark translations as stale if this is the original
    if (contentType.isOriginal) {
      Object.keys(existingEntry.translations).forEach(lang => {
        const translation = existingEntry.translations[lang as SupportedLanguage];
        if (translation) {
          translation.status = 'stale';
        }
      });
      console.log(`Original content updated, marked translations as stale: ${canonicalId}`);
    }
    
    return { updated: true, canonicalId, needsFrontmatterUpdate };
  }
  
  return { updated: false, canonicalId, needsFrontmatterUpdate };
}

/**
 * Update file frontmatter with canonical ID
 */
function updateFileFrontmatter(filePath: string, canonicalId: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(content);
  
  // Add canonical ID if missing
  if (!parsed.data.canonicalId) {
    parsed.data.canonicalId = canonicalId;
    
    const updated = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(filePath, updated);
    console.log(`Updated frontmatter for ${filePath} with canonical ID ${canonicalId}`);
  }
}

/**
 * Scan and update all content files
 */
export function scanAndUpdateContent(): {
  registryUpdated: boolean;
  filesUpdated: string[];
} {
  console.log('🔍 Scanning content files for canonical ID updates...');
  
  const registry = loadContentRegistry();
  const files = getAllContentFiles();
  let registryUpdated = false;
  const filesUpdated: string[] = [];
  
  for (const filePath of files) {
    try {
      const result = processContentFile(filePath, registry);
      
      if (result.updated) {
        registryUpdated = true;
      }
      
      if (result.needsFrontmatterUpdate) {
        updateFileFrontmatter(filePath, result.canonicalId);
        filesUpdated.push(filePath);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  if (registryUpdated) {
    saveContentRegistry(registry);
    console.log(`✅ Updated content registry with ${Object.keys(registry.entries).length} entries`);
  }
  
  return { registryUpdated, filesUpdated };
}

/**
 * Validate registry consistency
 */
export function validateRegistry(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const registry = loadContentRegistry();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    // Check if original file exists
    const originalPath = path.join(CONTENT_BASE_PATH, entry.originalPath);
    if (!fs.existsSync(originalPath)) {
      errors.push(`Original file missing: ${entry.originalPath} (${canonicalId})`);
      continue;
    }
    
    // Check translations
    for (const [lang, translation] of Object.entries(entry.translations)) {
      if (!translation) continue;
      
      const translationPath = path.join(CONTENT_BASE_PATH, translation.path);
      if (!fs.existsSync(translationPath)) {
        warnings.push(`Translation file missing: ${translation.path} (${lang} of ${canonicalId})`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * CLI interface
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'scan': {
      const result = scanAndUpdateContent();
      console.log(`\n📊 Scan Results:`);
      console.log(`   Registry updated: ${result.registryUpdated}`);
      console.log(`   Files updated: ${result.filesUpdated.length}`);
      if (result.filesUpdated.length > 0) {
        console.log(`   Updated files:`);
        result.filesUpdated.forEach(file => console.log(`     - ${file}`));
      }
      break;
    }
      
    case 'validate': {
      const validation = validateRegistry();
      console.log(`\n🔍 Registry Validation:`);
      console.log(`   Valid: ${validation.valid}`);
      if (validation.errors.length > 0) {
        console.log(`   Errors:`);
        validation.errors.forEach(error => console.log(`     ❌ ${error}`));
      }
      if (validation.warnings.length > 0) {
        console.log(`   Warnings:`);
        validation.warnings.forEach(warning => console.log(`     ⚠️ ${warning}`));
      }
      break;
    }
      
    default:
      console.log('Usage: content-canonical-system.ts <scan|validate>');
      console.log('  scan     - Scan content and update registry');
      console.log('  validate - Validate registry consistency');
      process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}
