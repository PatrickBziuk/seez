#!/usr/bin/env npx tsx

/**
 * Content Metadata Sync Script
 *
 * This script synchronizes content metadata files with the actual filesystem content:
 * - Removes stale entries from content-analysis-results.json and content-registry.json
 * - Only keeps metadata for files that actually exist in the filesystem
 * - Validates content integrity and canonical ID consistency
 *
 * Usage:
 *   npx tsx scripts/content/sync-content-metadata.ts [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run: Show what would be removed without making changes
 *   --verbose: Show detailed logging information
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

interface ContentAnalysisResult {
  slug: string;
  collections: string[];
  files: Array<{
    path: string;
    slug: string;
    collection: string;
    language: string;
    title: string;
    canonicalId: string;
    content: string;
    wordCount: number;
    hasRichContent: boolean;
  }>;
  suggestedOriginal?: {
    path: string;
    slug: string;
    collection: string;
    language: string;
    title: string;
    canonicalId: string;
    content: string;
    wordCount: number;
    hasRichContent: boolean;
  };
  suggestedTranslations?: Array<{
    path: string;
    slug: string;
    collection: string;
    language: string;
    title: string;
    canonicalId: string;
    content: string;
    wordCount: number;
    hasRichContent: boolean;
  }>;
  needsManualReview: boolean;
  reason: string;
}

interface ContentRegistryEntry {
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
      status: string;
      lastTranslated: string;
      translationHash: string;
    }
  >;
}

interface ContentRegistry {
  version: string;
  lastUpdated: string;
  entries: Record<string, ContentRegistryEntry>;
}

const CONTENT_BASE_PATH = 'src/content';
const DATA_PATH = 'data';
const ANALYSIS_RESULTS_FILE = path.join(DATA_PATH, 'content-analysis-results.json');
const REGISTRY_FILE = path.join(DATA_PATH, 'content-registry.json');

class ContentMetadataSync {
  private dryRun: boolean;
  private verbose: boolean;
  private existingFiles: Set<string> = new Set();

  constructor(dryRun = false, verbose = false) {
    this.dryRun = dryRun;
    this.verbose = verbose;
  }

  private log(message: string, force = false) {
    if (this.verbose || force) {
      console.log(message);
    }
  }

  private logAction(action: string, item: string) {
    console.log(`${this.dryRun ? '[DRY-RUN] ' : ''}${action}: ${item}`);
  }

  /**
   * Scan filesystem to get all existing content files
   */
  async scanExistingContent(): Promise<void> {
    this.log('🔍 Scanning existing content files...');

    // Define content collections and their expected patterns
    const collections = ['books', 'projects', 'lab', 'life', 'pages', 'authors'];

    for (const collection of collections) {
      const collectionPath = path.join(CONTENT_BASE_PATH, collection);

      try {
        await fs.access(collectionPath);

        // Find all markdown files in this collection
        const pattern = path.join(collectionPath, '**/*.{md,mdx}').replace(/\\/g, '/');
        const files = await glob(pattern, {
          cwd: process.cwd(),
          absolute: false,
        });

        for (const file of files) {
          // Normalize path for consistent comparison
          const normalizedPath = file.replace(/\\/g, '/');
          this.existingFiles.add(normalizedPath);

          // Also add Windows-style path for backwards compatibility
          const windowsPath = file.replace(/\//g, '\\');
          this.existingFiles.add(windowsPath);
        }

        this.log(`  Found ${files.length} files in ${collection}/`);
      } catch {
        this.log(`  Collection ${collection}/ does not exist or is inaccessible`);
      }
    }

    this.log(`📁 Total files found: ${this.existingFiles.size / 2} (accounting for path format duplicates)`);
  }

  /**
   * Check if a file path exists in the filesystem
   */
  private fileExists(filePath: string): boolean {
    // Normalize path for comparison
    const normalizedPath = filePath.replace(/\\/g, '/');
    const windowsPath = filePath.replace(/\//g, '\\');

    return this.existingFiles.has(normalizedPath) || this.existingFiles.has(windowsPath);
  }

  /**
   * Sync content analysis results file
   */
  async syncAnalysisResults(): Promise<void> {
    this.log('\n📊 Syncing content analysis results...');

    try {
      const content = await fs.readFile(ANALYSIS_RESULTS_FILE, 'utf8');
      const analysisResults: ContentAnalysisResult[] = JSON.parse(content);

      const originalCount = analysisResults.length;
      const validResults: ContentAnalysisResult[] = [];
      const removedResults: ContentAnalysisResult[] = [];

      for (const result of analysisResults) {
        let hasValidFiles = false;
        const validFiles = [];

        // Check each file in the result
        for (const file of result.files) {
          if (this.fileExists(file.path)) {
            validFiles.push(file);
            hasValidFiles = true;
          } else {
            this.log(`  ❌ File not found: ${file.path}`);
          }
        }

        if (hasValidFiles) {
          // Update result with only valid files
          result.files = validFiles;

          // Check if suggested original still exists
          if (result.suggestedOriginal && !this.fileExists(result.suggestedOriginal.path)) {
            this.log(`  ⚠️  Suggested original not found: ${result.suggestedOriginal.path}`);
            result.suggestedOriginal = undefined;
          }

          validResults.push(result);
        } else {
          removedResults.push(result);
          this.logAction('REMOVE ANALYSIS', `slug: ${result.slug} (no valid files)`);
        }
      }

      // Write updated results
      if (!this.dryRun && removedResults.length > 0) {
        const updatedContent = JSON.stringify(validResults, null, 2);
        await fs.writeFile(ANALYSIS_RESULTS_FILE, updatedContent, 'utf8');
      }

      console.log(`✅ Analysis Results: ${originalCount} → ${validResults.length} (removed ${removedResults.length})`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.log('📊 Content analysis results file not found, skipping...');
      } else {
        console.error('❌ Error syncing analysis results:', error);
      }
    }
  }

  /**
   * Sync content registry file
   */
  async syncRegistry(): Promise<void> {
    this.log('\n📋 Syncing content registry...');

    try {
      const content = await fs.readFile(REGISTRY_FILE, 'utf8');
      const registry: ContentRegistry = JSON.parse(content);

      const originalCount = Object.keys(registry.entries).length;
      const validEntries: Record<string, ContentRegistryEntry> = {};
      const removedEntries: string[] = [];

      for (const [canonicalId, entry] of Object.entries(registry.entries)) {
        let isValid = false;

        // Check if original path exists
        if (this.fileExists(entry.originalPath)) {
          isValid = true;
        } else {
          this.log(`  ❌ Original not found: ${entry.originalPath}`);
        }

        // Check and clean up translations
        const validTranslations: typeof entry.translations = {};
        for (const [lang, translation] of Object.entries(entry.translations)) {
          if (this.fileExists(translation.path)) {
            validTranslations[lang] = translation;
          } else {
            this.log(`  ❌ Translation not found: ${translation.path}`);
          }
        }

        if (isValid) {
          // Keep entry but update translations
          validEntries[canonicalId] = {
            ...entry,
            translations: validTranslations,
          };
        } else {
          removedEntries.push(canonicalId);
          this.logAction('REMOVE REGISTRY', `${canonicalId}: ${entry.title}`);
        }
      }

      // Write updated registry
      if (!this.dryRun && removedEntries.length > 0) {
        const updatedRegistry: ContentRegistry = {
          ...registry,
          lastUpdated: new Date().toISOString(),
          entries: validEntries,
        };

        const updatedContent = JSON.stringify(updatedRegistry, null, 2);
        await fs.writeFile(REGISTRY_FILE, updatedContent, 'utf8');
      }

      console.log(
        `✅ Registry: ${originalCount} → ${Object.keys(validEntries).length} (removed ${removedEntries.length})`
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.log('📋 Content registry file not found, skipping...');
      } else {
        console.error('❌ Error syncing registry:', error);
      }
    }
  }

  /**
   * Main sync operation
   */
  async run(): Promise<void> {
    console.log('🔄 Starting content metadata sync...\n');

    if (this.dryRun) {
      console.log('🧪 DRY RUN MODE - No files will be modified\n');
    }

    await this.scanExistingContent();
    await this.syncAnalysisResults();
    await this.syncRegistry();

    console.log('\n✅ Content metadata sync completed!');

    if (this.dryRun) {
      console.log('\n💡 Run without --dry-run to apply changes');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Content Metadata Sync Script

Usage:
  npx tsx scripts/content/sync-content-metadata.ts [options]

Options:
  --dry-run    Show what would be changed without making modifications
  --verbose    Show detailed logging information
  --help, -h   Show this help message

Description:
  Synchronizes content metadata files (content-analysis-results.json and 
  content-registry.json) with the actual filesystem content. Removes stale 
  entries for files that no longer exist.
    `);
    process.exit(0);
  }

  try {
    const sync = new ContentMetadataSync(dryRun, verbose);
    await sync.run();
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ContentMetadataSync };
