#!/usr/bin/env tsx

/**
 * Registry-Based Translation Detection Script
 * @purpose Detect missing and stale translations using canonical ID system
 * @dependencies gray-matter, fs, path, content-registry.json
 * @usedBy GitHub Actions workflow for translation pipeline
 */

import { readFileSync, existsSync } from 'fs';
import matter from 'gray-matter';
import {
  computeContentSha,
  getLanguagePairs,
  type TranslationTask,
  type SupportedLanguage,
} from '../src/utils/translation';
import { shouldSkipTranslation, getSkipReason } from '../src/utils/translation-override';

interface ContentRegistry {
  version: string;
  lastUpdated: string;
  entries: {
    [canonicalId: string]: {
      canonicalId: string;
      originalPath: string;
      originalLanguage: string;
      title: string;
      lastModified: string;
      contentHash: string;
      translations: Record<
        string,
        {
          path: string;
          status: 'current' | 'stale' | 'missing';
          lastTranslated: string;
          translationHash: string;
        }
      >;
    };
  };
}

interface RegistryTranslationTask extends Omit<TranslationTask, 'translationKey'> {
  canonicalId: string;
  sourceLanguage: string;
  sourceContentHash: string;
  existingTranslationHash?: string;
  translationStatus: 'missing' | 'stale';
  outputPath: string;
  languagePair: string;
  priority: 'high' | 'normal';
}

/**
 * Load the content registry
 */
function loadContentRegistry(): ContentRegistry {
  const registryPath = 'data/content-registry.json';

  if (!existsSync(registryPath)) {
    throw new Error(`Content registry not found at ${registryPath}. Run content classification first.`);
  }

  const content = readFileSync(registryPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Check if a file exists and get its current content hash
 */
function getFileContentHash(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) {
      return null;
    }

    const content = readFileSync(filePath, 'utf-8');
    const { content: markdownContent } = matter(content);
    return computeContentSha(markdownContent);
  } catch {
    return null;
  }
}

/**
 * Detect translation tasks based on registry
 */
async function detectRegistryBasedTranslations(): Promise<RegistryTranslationTask[]> {
  console.error('📋 Loading content registry...');
  const registry = loadContentRegistry();

  console.error(`Found ${Object.keys(registry.entries).length} entries in registry`);

  const tasks: RegistryTranslationTask[] = [];

  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    console.error(`🔍 Processing ${canonicalId} (${entry.originalLanguage}): ${entry.title}`);

    // Verify original file still exists
    if (!existsSync(entry.originalPath)) {
      console.error(`   ⚠️  Original file missing: ${entry.originalPath}`);
      continue;
    }

    // Check if we should skip this content
    if (shouldSkipTranslation(entry.originalPath)) {
      const reason = getSkipReason(entry.originalPath);
      console.error(`   ⏭️  Skipping: ${reason}`);
      continue;
    }

    // Get current content hash of original
    const currentContentHash = getFileContentHash(entry.originalPath);
    if (!currentContentHash) {
      console.error(`   ❌ Could not read original file: ${entry.originalPath}`);
      continue;
    }

    // Check if original content has changed
    const originalContentChanged = currentContentHash !== entry.contentHash;
    if (originalContentChanged) {
      console.error(
        `   📝 Original content changed (${entry.contentHash.substring(0, 8)} → ${currentContentHash.substring(0, 8)})`
      );
    }

    // Check all possible target languages
    const sourceLanguage = entry.originalLanguage as SupportedLanguage;
    const targetLanguages = getLanguagePairs(sourceLanguage);

    for (const targetLanguage of targetLanguages) {
      const languagePair = `${sourceLanguage}-${targetLanguage}`;

      const existingTranslation = entry.translations[targetLanguage];
      let needsTranslation = false;
      let translationStatus: 'missing' | 'stale' = 'missing';
      let existingTranslationHash: string | undefined;

      if (!existingTranslation) {
        // Translation doesn't exist in registry
        needsTranslation = true;
        translationStatus = 'missing';
        console.error(`   📋 Missing translation: ${targetLanguage}`);
      } else {
        // Translation exists in registry - check its status
        const translationExists = existsSync(existingTranslation.path);

        if (!translationExists) {
          // Translation file was deleted
          needsTranslation = true;
          translationStatus = 'missing';
          console.error(`   📄 Translation file deleted: ${existingTranslation.path}`);
        } else {
          // Check if translation is stale
          const currentTranslationHash = getFileContentHash(existingTranslation.path);

          if (
            originalContentChanged ||
            existingTranslation.status === 'stale' ||
            existingTranslation.status === 'missing'
          ) {
            needsTranslation = true;
            translationStatus = 'stale';
            existingTranslationHash = currentTranslationHash || undefined;
            console.error(`   🔄 Translation stale: ${targetLanguage} (original changed or marked stale)`);
          } else {
            console.error(`   ✅ Translation current: ${targetLanguage}`);
          }
        }
      }

      if (needsTranslation) {
        // Determine output path for translation
        const outputPath =
          existingTranslation?.path || entry.originalPath.replace(`/${sourceLanguage}/`, `/${targetLanguage}/`);

        tasks.push({
          canonicalId,
          sourcePath: entry.originalPath,
          targetLang: targetLanguage,
          reason: translationStatus,
          sourceSha: currentContentHash,
          sourceLanguage,
          sourceContentHash: currentContentHash,
          existingTranslationHash,
          translationStatus,
          outputPath,
          languagePair,
          priority: originalContentChanged ? 'high' : 'normal',
        });

        console.error(`   ✨ Task created: ${sourceLanguage} → ${targetLanguage}`);
      }
    }
  }

  return tasks;
}

/**
 * Main detection function
 */
async function main() {
  console.error('🚀 Starting registry-based translation detection...');
  console.error(`📁 Working directory: ${process.cwd()}`);

  try {
    const tasks = await detectRegistryBasedTranslations();

    console.error(`\n📊 Translation Detection Summary:`);
    console.error(`   Total tasks: ${tasks.length}`);

    const missingTasks = tasks.filter((t) => t.translationStatus === 'missing');
    const staleTasks = tasks.filter((t) => t.translationStatus === 'stale');

    console.error(`   Missing translations: ${missingTasks.length}`);
    console.error(`   Stale translations: ${staleTasks.length}`);

    // Group by language pair
    const byLanguagePair = new Map<string, RegistryTranslationTask[]>();
    for (const task of tasks) {
      const key = task.languagePair;
      if (!byLanguagePair.has(key)) {
        byLanguagePair.set(key, []);
      }
      byLanguagePair.get(key)!.push(task);
    }

    console.error(`   Language pairs: ${byLanguagePair.size}`);
    for (const [pair, pairTasks] of byLanguagePair) {
      console.error(`     ${pair}: ${pairTasks.length} tasks`);
    }

    // Output JSON for GitHub Actions
    if (tasks.length === 0) {
      console.log('[]');
    } else {
      console.log(JSON.stringify(tasks, null, 2));
    }

    console.error('✅ Translation detection completed successfully');
  } catch (error) {
    console.error('❌ Translation detection failed:', error);
    process.exit(1);
  }
}

// Execute if called directly
main();
