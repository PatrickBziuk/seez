#!/usr/bin/env tsx

/**
 * Content Sync Manager - Enhanced content management with deletion handling
 * @purpose Handles content changes, deletions, and keeps all dependent files in sync
 * @dependencies glob, fs, gray-matter, path
 * @usedBy CI/CD pipeline and development workflow
 */

import { glob } from 'glob';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { dirname, relative, normalize } from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';

interface ContentFile {
  filePath: string;
  relativePath: string;
  collection: string;
  language: string;
  slug: string;
  frontmatter: Record<string, unknown>;
  exists: boolean;
}

interface ContentRegistry {
  version: string;
  lastUpdated: string;
  stats: {
    totalFiles: number;
    byCollection: Record<string, number>;
    byLanguage: Record<string, number>;
  };
  files: ContentFile[];
}

interface DependentFile {
  path: string;
  type: 'generated' | 'data' | 'cache';
  description: string;
}

class ContentSyncManager {
  private collections = ['books', 'projects', 'lab', 'life', 'pages'];
  private languages = ['en', 'de'];
  private contentDir = 'src/content';
  private dependentFiles: DependentFile[] = [
    { path: 'src/generated/git-metadata.json', type: 'generated', description: 'Git metadata cache' },
    { path: 'src/data/tags/tag-analysis.json', type: 'data', description: 'Tag analysis results' },
    { path: 'src/data/tags/tag-suggestions-report.json', type: 'data', description: 'Tag suggestions' },
    { path: 'src/data/tags/master-tag-registry.json', type: 'data', description: 'Master tag registry' },
    { path: 'translation_tasks.json', type: 'cache', description: 'Translation tasks' },
    { path: 'data/content-registry.json', type: 'generated', description: 'Content registry' },
  ];

  /**
   * Scan all content files and build a complete registry
   */
  async scanContent(): Promise<ContentRegistry> {
    console.log('🔍 Scanning content collections...');

    const files: ContentFile[] = [];
    const stats = {
      totalFiles: 0,
      byCollection: {} as Record<string, number>,
      byLanguage: {} as Record<string, number>,
    };

    for (const collection of this.collections) {
      console.log(`📚 Scanning collection: ${collection}`);

      const pattern = `${this.contentDir}/${collection}/**/*.{md,mdx}`;
      const foundFiles = glob.sync(pattern);

      stats.byCollection[collection] = foundFiles.length;

      for (const filePath of foundFiles) {
        try {
          const relativePath = relative(process.cwd(), filePath).replace(/\\/g, '/');
          const normalizedPath = normalize(filePath);

          if (!existsSync(normalizedPath)) {
            console.warn(`⚠️  File referenced but missing: ${relativePath}`);
            continue;
          }

          const content = readFileSync(normalizedPath, 'utf-8');
          const { data } = matter(content);

          // Extract slug from filename
          const filename =
            filePath
              .split(/[/\\]/)
              .pop()
              ?.replace(/\.(md|mdx)$/, '') || '';

          // Determine language from path or frontmatter
          const language = data.language || this.extractLanguageFromPath(filePath);

          if (!this.languages.includes(language)) {
            console.warn(`⚠️  Invalid language '${language}' in ${relativePath}`);
            continue;
          }

          const contentFile: ContentFile = {
            filePath: normalizedPath,
            relativePath,
            collection,
            language,
            slug: filename,
            frontmatter: data,
            exists: true,
          };

          files.push(contentFile);
          stats.byLanguage[language] = (stats.byLanguage[language] || 0) + 1;
        } catch (error) {
          console.error(`❌ Error processing ${filePath}:`, error);
        }
      }

      console.log(`✅ ${collection}: ${foundFiles.length} files scanned`);
    }

    stats.totalFiles = files.length;

    const registry: ContentRegistry = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      stats,
      files,
    };

    // Save registry
    this.saveRegistry(registry);

    console.log(`📊 Content scan complete: ${stats.totalFiles} files across ${this.collections.length} collections`);
    return registry;
  }

  /**
   * Validate content integrity and identify issues
   */
  async validateContent(registry?: ContentRegistry): Promise<{ success: boolean; issues: string[] }> {
    if (!registry) {
      registry = await this.scanContent();
    }

    const issues: string[] = [];
    const slugs: string[] = [];

    console.log('🔍 Validating content integrity...');

    for (const file of registry.files) {
      // Check required fields
      if (!file.frontmatter.title) {
        issues.push(`${file.relativePath}: Missing title`);
      }

      // Check description for non-page collections
      if (file.collection !== 'pages' && !file.frontmatter.description) {
        issues.push(`${file.relativePath}: Missing description (recommended)`);
      }

      // Validate language field
      if (!file.language || !this.languages.includes(file.language)) {
        issues.push(`${file.relativePath}: Invalid or missing language field`);
      }

      // Check for duplicate slugs
      const fullSlug = `${file.language}/${file.collection}/${file.slug}`;
      if (slugs.includes(fullSlug)) {
        issues.push(`Duplicate slug: ${fullSlug} (${file.relativePath})`);
      }
      slugs.push(fullSlug);

      // Verify file still exists
      if (!existsSync(file.filePath)) {
        issues.push(`Referenced file missing: ${file.relativePath}`);
      }
    }

    const success = issues.length === 0;

    if (success) {
      console.log('✅ Content validation passed');
    } else {
      console.error('❌ Content validation failed:');
      issues.forEach((issue) => console.error(`  - ${issue}`));
    }

    return { success, issues };
  }

  /**
   * Clean up dependent files that reference deleted content
   */
  async cleanupDependentFiles(): Promise<void> {
    console.log('🧹 Cleaning up dependent files...');

    for (const dep of this.dependentFiles) {
      if (existsSync(dep.path)) {
        console.log(`🗑️  Removing stale ${dep.type}: ${dep.description}`);
        try {
          unlinkSync(dep.path);
        } catch (error) {
          console.warn(`⚠️  Could not remove ${dep.path}:`, error);
        }
      }
    }

    console.log('✅ Cleanup complete');
  }

  /**
   * Regenerate all dependent files
   */
  async regenerateDependentFiles(): Promise<void> {
    console.log('🔄 Regenerating dependent files...');

    // Regenerate git metadata
    await this.regenerateGitMetadata();

    // Regenerate tag analysis
    await this.regenerateTagAnalysis();

    console.log('✅ Regeneration complete');
  }

  /**
   * Full sync operation: scan, clean, validate, regenerate
   */
  async fullSync(): Promise<{ success: boolean; issues: string[] }> {
    console.log('🚀 Starting full content sync...');

    // 1. Clean up stale files
    await this.cleanupDependentFiles();

    // 2. Scan current content
    const registry = await this.scanContent();

    // 3. Validate content
    const validation = await this.validateContent(registry);

    // 4. Regenerate dependent files if validation passed
    if (validation.success) {
      await this.regenerateDependentFiles();
    }

    console.log(validation.success ? '✅ Full sync completed successfully' : '❌ Full sync completed with issues');
    return validation;
  }

  /**
   * Extract language from file path
   */
  private extractLanguageFromPath(filePath: string): string {
    const pathParts = filePath.split(/[/\\]/);
    const langIndex = pathParts.findIndex((part) => this.languages.includes(part));
    return langIndex !== -1 ? pathParts[langIndex] : 'en'; // default to English
  }

  /**
   * Save content registry to file
   */
  private saveRegistry(registry: ContentRegistry): void {
    const outputPath = 'data/content-registry.json';
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(registry, null, 2));
    console.log(`💾 Content registry saved to ${outputPath}`);
  }

  /**
   * Regenerate git metadata for existing files only
   */
  private async regenerateGitMetadata(): Promise<void> {
    console.log('📊 Regenerating git metadata...');

    const contentFiles = glob.sync('src/content/**/*.{md,mdx}');
    const metadata: Record<string, { publishDate: string; modifiedDate: string }> = {};

    for (const file of contentFiles) {
      if (!existsSync(file)) continue; // Skip missing files

      try {
        const firstCommitResult = execSync(`git log --reverse --format=%cI --follow -- "${file}"`, {
          encoding: 'utf8',
        }).trim();
        const firstCommit = firstCommitResult.split('\n')[0];

        const lastCommit = execSync(`git log -1 --format=%cI -- "${file}"`, {
          encoding: 'utf8',
        }).trim();

        if (firstCommit && lastCommit) {
          metadata[file] = {
            publishDate: firstCommit,
            modifiedDate: lastCommit,
          };
        }
      } catch (error) {
        console.warn(`Could not extract git metadata for ${file}:`, error);
      }
    }

    const outputPath = 'src/generated/git-metadata.json';
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    console.log(`📊 Git metadata regenerated for ${Object.keys(metadata).length} files`);
  }

  /**
   * Regenerate tag analysis for existing files only
   */
  private async regenerateTagAnalysis(): Promise<void> {
    console.log('🏷️  Regenerating tag analysis...');

    // This would call the existing tag analysis script
    // but with the updated file list
    try {
      execSync('npx tsx scripts/ai/ai-tagging/analyze-existing-tags.ts', {
        stdio: 'inherit',
      });
      console.log('🏷️  Tag analysis regenerated');
    } catch (error) {
      console.warn('⚠️  Could not regenerate tag analysis:', error);
    }
  }
}

// CLI interface
async function main() {
  const manager = new ContentSyncManager();
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Content Sync Manager

Usage:
  tsx content-sync-manager.ts [command]

Commands:
  scan        Scan all content and build registry
  validate    Validate content integrity
  clean       Clean up dependent files
  regenerate  Regenerate dependent files
  sync        Full sync (default)

Options:
  --help, -h  Show this help message
`);
    return;
  }

  const command = args[0] || 'sync';

  try {
    switch (command) {
      case 'scan':
        await manager.scanContent();
        break;
      case 'validate':
        await manager.validateContent();
        break;
      case 'clean':
        await manager.cleanupDependentFiles();
        break;
      case 'regenerate':
        await manager.regenerateDependentFiles();
        break;
      case 'sync':
      default:
        await manager.fullSync();
        break;
    }
  } catch (error) {
    console.error('❌ Content sync failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ContentSyncManager };
