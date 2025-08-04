#!/usr/bin/env tsx

/**
 * Translation Detection Script
 * @purpose Detect missing and stale translations across content collections
 * @dependencies gray-matter, fs, path
 * @usedBy GitHub Actions workflow for translation pipeline
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import matter from 'gray-matter';
import {
  computeContentSha,
  getLanguagePairs,
  generateTranslationKey,
  validateTranslationFrontmatter,
  type TranslationTask,
  type SupportedLanguage,
  SUPPORTED_LANGUAGES
} from '../src/utils/translation';
import { shouldSkipTranslation, getSkipReason } from '../src/utils/translation-override';

/**
 * Content collection configuration
 */
const CONTENT_COLLECTIONS = ['books', 'projects', 'lab', 'life'] as const;
const CONTENT_BASE_PATH = 'src/content';

/**
 * Content file information
 */
interface ContentFile {
  path: string;
  relativePath: string;
  language: SupportedLanguage;
  translationKey: string;
  frontmatter: Record<string, unknown>;
  content: string;
  sourceSha: string;
}

/**
 * Translation pair information
 */
interface TranslationPair {
  translationKey: string;
  files: Map<SupportedLanguage, ContentFile>;
}

/**
 * Get all content files from a collection
 * @param collection - Collection name
 * @returns Array of content files
 */
function getContentFiles(collection: string): ContentFile[] {
  const collectionPath = join(CONTENT_BASE_PATH, collection);
  
  if (!existsSync(collectionPath)) {
    console.warn(`Collection path does not exist: ${collectionPath}`);
    return [];
  }
  
  const files: ContentFile[] = [];
  
  function scanDirectory(dirPath: string) {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const entryPath = join(dirPath, entry);
      const stat = statSync(entryPath);
      
      if (stat.isDirectory()) {
        scanDirectory(entryPath);
      } else if (entry.match(/\.(md|mdx)$/)) {
        try {
          const content = readFileSync(entryPath, 'utf-8');
          const parsed = matter(content);
          const relativePath = relative(CONTENT_BASE_PATH, entryPath);
          
          // Determine language from frontmatter or file path
          let language: SupportedLanguage = parsed.data.language || 'en';
          if (!SUPPORTED_LANGUAGES.includes(language)) {
            // Try to infer from path
            const pathLang = entryPath.match(/[/\\](en|de)[/\\]/)?.[1];
            language = (pathLang as SupportedLanguage) || 'en';
          }
          
          // Generate or extract translation key
          const translationKey = parsed.data.translationKey || 
            generateTranslationKey(relativePath);
          
          // Validate frontmatter
          const validation = validateTranslationFrontmatter(parsed.data);
          if (!validation.valid) {
            console.warn(`Invalid frontmatter in ${relativePath}:`, validation.errors);
          }
          
          const sourceSha = computeContentSha(content);
          
          files.push({
            path: entryPath,
            relativePath,
            language,
            translationKey,
            frontmatter: parsed.data,
            content: parsed.content,
            sourceSha
          });
          
        } catch (error) {
          console.error(`Error processing ${entryPath}:`, error);
        }
      }
    }
  }
  
  scanDirectory(collectionPath);
  return files;
}

/**
 * Group content files by translation key
 * @param files - Array of content files
 * @returns Map of translation pairs
 */
function groupByTranslationKey(files: ContentFile[]): Map<string, TranslationPair> {
  const pairs = new Map<string, TranslationPair>();
  
  for (const file of files) {
    if (!pairs.has(file.translationKey)) {
      pairs.set(file.translationKey, {
        translationKey: file.translationKey,
        files: new Map()
      });
    }
    
    const pair = pairs.get(file.translationKey)!;
    pair.files.set(file.language, file);
  }
  
  return pairs;
}

/**
 * Detect translation tasks for a translation pair
 * @param pair - Translation pair to analyze
 * @returns Array of translation tasks
 */
function detectTranslationTasks(pair: TranslationPair): TranslationTask[] {
  const tasks: TranslationTask[] = [];
  
  for (const [sourceLang, sourceFile] of pair.files) {
    const targetLangs = getLanguagePairs(sourceLang);
    
    for (const targetLang of targetLangs) {
      // Check if translation should be skipped
      if (shouldSkipTranslation(pair.translationKey, sourceFile.relativePath)) {
        const reason = getSkipReason(pair.translationKey, sourceFile.relativePath);
        console.error(`Skipping translation ${pair.translationKey} ${sourceLang}->${targetLang}: ${reason}`);
        continue;
      }
      
      const targetFile = pair.files.get(targetLang);
      
      if (!targetFile) {
        // Missing translation
        tasks.push({
          sourcePath: sourceFile.relativePath,
          targetLang,
          translationKey: pair.translationKey,
          reason: 'missing',
          sourceSha: sourceFile.sourceSha
        });
      } else {
        // Check if translation is stale
        const translationHistory = targetFile.frontmatter.translationHistory as Array<{
          sourceSha: string;
        }> | undefined;
        
        const lastTranslationSha = translationHistory?.[0]?.sourceSha;
        
        if (!lastTranslationSha || lastTranslationSha !== sourceFile.sourceSha) {
          tasks.push({
            sourcePath: sourceFile.relativePath,
            targetLang,
            translationKey: pair.translationKey,
            reason: 'stale',
            sourceSha: sourceFile.sourceSha
          });
        }
      }
    }
  }
  
  return tasks;
}

/**
 * Main detection function
 * @returns Array of all translation tasks
 */
async function detectTranslations(): Promise<TranslationTask[]> {
  const allTasks: TranslationTask[] = [];
  
  console.error('🔍 Scanning content collections for translation tasks...');

  for (const collection of CONTENT_COLLECTIONS) {
    console.error(`📁 Processing collection: ${collection}`);    const files = getContentFiles(collection);
    console.error(`   Found ${files.length} content files`);
    
    const pairs = groupByTranslationKey(files);
    console.error(`   Found ${pairs.size} translation groups`);
    
    let collectionTasks = 0;
    for (const pair of pairs.values()) {
      const tasks = detectTranslationTasks(pair);
      allTasks.push(...tasks);
      collectionTasks += tasks.length;
    }
    
    console.error(`   Generated ${collectionTasks} translation tasks`);
  }
  
  return allTasks;
}

/**
 * CLI execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const tasks = await detectTranslations();
    
    console.error(`\\n📋 Translation Detection Summary:`);
    console.error(`   Total tasks: ${tasks.length}`);
    console.error(`   Missing translations: ${tasks.filter(t => t.reason === 'missing').length}`);
    console.error(`   Stale translations: ${tasks.filter(t => t.reason === 'stale').length}`);
    
    // Output as JSON for consumption by GitHub Actions
    console.log(JSON.stringify(tasks, null, 2));
    
  } catch (error) {
    console.error('❌ Error detecting translations:', error);
    process.exit(1);
  }
}

export { detectTranslations };
