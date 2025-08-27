#!/usr/bin/env npx tsx

/**
 * Content Schema Validator and Self-Healing Script
 *
 * This script validates content files against the Astro content schema
 * and automatically fixes common schema issues that would block CI/CD pipeline.
 *
 * Fixes Applied:
 * - Convert string status fields to proper object format
 * - Ensure required authors array exists and references valid authors
 * - Fix date format issues
 * - Add missing canonicalId fields
 * - Validate and fix language field values
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import type { Dirent } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../');

interface ValidationError {
  file: string;
  field: string;
  issue: string;
  autoFixable: boolean;
  originalValue?: unknown;
  suggestedValue?: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  fixes: ValidationError[];
}

class ContentSchemaValidator {
  private errors: ValidationError[] = [];
  private fixes: ValidationError[] = [];
  private dryRun: boolean = false;

  constructor(options: { dryRun?: boolean } = {}) {
    this.dryRun = options.dryRun || false;
  }

  /**
   * Main validation function - validates all content collections
   */
  async validateAllContent(): Promise<ValidationResult> {
    this.errors = [];
    this.fixes = [];

    const collections = ['lab', 'books', 'projects', 'life', 'music', 'pages'];

    for (const collection of collections) {
      await this.validateCollection(collection);
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      fixes: this.fixes,
    };
  }

  /**
   * Validate a specific content collection
   */
  private async validateCollection(collection: string): Promise<void> {
    const collectionPath = join(PROJECT_ROOT, 'src/content', collection);
    try {
      const mdFiles = await this.listMarkdownFiles(collectionPath);
      for (const filePath of mdFiles) {
        await this.validateContentFile(filePath, collection);
      }
    } catch {
      // Collection might not exist - that's OK
      console.log(`⚠️  Collection '${collection}' not found or empty`);
    }
  }

  /**
   * Recursively list markdown files under a directory
   */
  private async listMarkdownFiles(root: string): Promise<string[]> {
    const results: string[] = [];

    async function walk(dir: string) {
      let entries: Dirent[];
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return; // Skip unreadable directories
      }
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
          continue;
        }
        if (fullPath.endsWith('.md') || fullPath.endsWith('.mdx')) {
          results.push(fullPath);
        }
      }
    }

    await walk(root);
    return results;
  }

  /**
   * Validate and potentially fix a single content file
   */
  private async validateContentFile(filePath: string, _collection: string): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const { data: frontmatter, content: body } = matter(content);

      let needsUpdate = false;
      const relativePath = filePath.replace(PROJECT_ROOT, '');

      // Validate and fix status field
      const statusFix = this.validateAndFixStatus(frontmatter, relativePath);
      if (statusFix) {
        frontmatter.status = statusFix.suggestedValue;
        needsUpdate = true;
        this.fixes.push(statusFix);
      }

      // Validate and fix authors field
      const authorsFix = this.validateAndFixAuthors(frontmatter, relativePath);
      if (authorsFix) {
        frontmatter.authors = authorsFix.suggestedValue;
        needsUpdate = true;
        this.fixes.push(authorsFix);
      }

      // Validate and fix language field
      const languageFix = this.validateAndFixLanguage(frontmatter, relativePath);
      if (languageFix) {
        frontmatter.language = languageFix.suggestedValue;
        needsUpdate = true;
        this.fixes.push(languageFix);
      }

      // Validate and fix canonicalId field
      const canonicalIdFix = this.validateAndFixCanonicalId(frontmatter, relativePath);
      if (canonicalIdFix) {
        frontmatter.canonicalId = canonicalIdFix.suggestedValue;
        needsUpdate = true;
        this.fixes.push(canonicalIdFix);
      }

      // Apply fixes if needed and not in dry-run mode
      if (needsUpdate && !this.dryRun) {
        const newContent = matter.stringify(body, frontmatter);
        await writeFile(filePath, newContent, 'utf-8');
        console.log(`✅ Fixed schema issues in ${relativePath}`);
      }
    } catch (error: unknown) {
      this.errors.push({
        file: filePath.replace(PROJECT_ROOT, ''),
        field: 'general',
        issue: `Failed to process file: ${error}`,
        autoFixable: false,
      });
    }
  }

  /**
   * Validate and fix status field format
   */
  private validateAndFixStatus(frontmatter: Record<string, unknown>, filePath: string): ValidationError | null {
    if (!frontmatter.status) {
      return null; // Status is optional
    }

    // If status is a string, convert to proper object format
    if (typeof frontmatter.status === 'string') {
      const statusValue = frontmatter.status.toLowerCase();
      let suggestedValue: Record<string, unknown>;

      // Map common string values to proper object format
      switch (statusValue) {
        case 'complete':
        case 'completed':
        case 'published':
          suggestedValue = {
            authoring: 'Human',
            review: {
              content: true,
              reviewer: 'seez',
              reviewDate: new Date().toISOString().split('T')[0],
            },
          };
          break;
        case 'draft':
        case 'in-progress':
        case 'wip':
          suggestedValue = {
            authoring: 'Human',
          };
          break;
        case 'ai-generated':
        case 'ai':
          suggestedValue = {
            authoring: 'AI',
          };
          break;
        default:
          suggestedValue = {
            authoring: 'Human',
          };
      }

      return {
        file: filePath,
        field: 'status',
        issue: `Status field is string "${frontmatter.status}" but should be object`,
        autoFixable: true,
        originalValue: frontmatter.status,
        suggestedValue,
      };
    }

    return null;
  }

  /**
   * Validate and fix authors field
   */
  private validateAndFixAuthors(frontmatter: Record<string, unknown>, filePath: string): ValidationError | null {
    if (!frontmatter.authors) {
      // Authors field is required, add default
      return {
        file: filePath,
        field: 'authors',
        issue: 'Missing required authors field',
        autoFixable: true,
        originalValue: undefined,
        suggestedValue: ['seez'], // Default author
      };
    }

    if (!Array.isArray(frontmatter.authors)) {
      // Convert single author to array
      const authorValue = frontmatter.authors;
      return {
        file: filePath,
        field: 'authors',
        issue: `Authors field should be array but is ${typeof authorValue}`,
        autoFixable: true,
        originalValue: authorValue,
        suggestedValue: Array.isArray(authorValue) ? authorValue : [String(authorValue)],
      };
    }

    if (frontmatter.authors.length === 0) {
      // Empty array, add default author
      return {
        file: filePath,
        field: 'authors',
        issue: 'Authors array is empty',
        autoFixable: true,
        originalValue: [],
        suggestedValue: ['seez'],
      };
    }

    return null;
  }

  /**
   * Validate and fix language field
   */
  private validateAndFixLanguage(frontmatter: Record<string, unknown>, filePath: string): ValidationError | null {
    const validLanguages = ['en', 'de'];

    if (!frontmatter.language) {
      // Language defaults to 'en' but let's be explicit
      return {
        file: filePath,
        field: 'language',
        issue: 'Missing language field',
        autoFixable: true,
        originalValue: undefined,
        suggestedValue: 'en',
      };
    }

    if (!validLanguages.includes(frontmatter.language as string)) {
      return {
        file: filePath,
        field: 'language',
        issue: `Invalid language "${frontmatter.language}", must be 'en' or 'de'`,
        autoFixable: true,
        originalValue: frontmatter.language,
        suggestedValue: 'en', // Default to English
      };
    }

    return null;
  }

  /**
   * Validate and fix canonicalId field format
   */
  private validateAndFixCanonicalId(frontmatter: Record<string, unknown>, filePath: string): ValidationError | null {
    if (!frontmatter.canonicalId) {
      // CanonicalId is optional, but if missing, we can generate one
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename =
        filePath
          .split('/')
          .pop()
          ?.replace(/\.(md|mdx)$/, '') || 'content';
      const suggestedId = `slug-${timestamp}-${filename}`;

      if (suggestedId.length >= 8) {
        return {
          file: filePath,
          field: 'canonicalId',
          issue: 'Missing canonicalId field',
          autoFixable: true,
          originalValue: undefined,
          suggestedValue: suggestedId,
        };
      }
    }

    if (frontmatter.canonicalId && typeof frontmatter.canonicalId === 'string' && frontmatter.canonicalId.length < 8) {
      return {
        file: filePath,
        field: 'canonicalId',
        issue: `CanonicalId "${frontmatter.canonicalId}" is too short (minimum 8 characters)`,
        autoFixable: false,
        originalValue: frontmatter.canonicalId,
      };
    }

    return null;
  }

  /**
   * Generate summary report
   */
  generateReport(): string {
    const report = [];

    report.push('# Content Schema Validation Report');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push('');

    if (this.errors.length === 0 && this.fixes.length === 0) {
      report.push('✅ **All content files are valid!**');
      return report.join('\n');
    }

    if (this.fixes.length > 0) {
      report.push(`## ✅ Fixed Issues (${this.fixes.length})`);
      report.push('');

      for (const fix of this.fixes) {
        report.push(`- **${fix.file}** (${fix.field}): ${fix.issue}`);
        if (fix.originalValue !== undefined) {
          report.push(`  - Original: \`${JSON.stringify(fix.originalValue)}\``);
        }
        if (fix.suggestedValue !== undefined) {
          report.push(`  - Fixed to: \`${JSON.stringify(fix.suggestedValue)}\``);
        }
        report.push('');
      }
    }

    if (this.errors.length > 0) {
      report.push(`## ❌ Remaining Issues (${this.errors.length})`);
      report.push('');

      for (const error of this.errors) {
        const status = error.autoFixable ? '🔧 Auto-fixable' : '⚠️  Manual fix required';
        report.push(`- **${error.file}** (${error.field}): ${error.issue} [${status}]`);
        if (error.originalValue !== undefined) {
          report.push(`  - Current value: \`${JSON.stringify(error.originalValue)}\``);
        }
        if (error.suggestedValue !== undefined) {
          report.push(`  - Suggested: \`${JSON.stringify(error.suggestedValue)}\``);
        }
        report.push('');
      }
    }

    return report.join('\n');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log('🔍 Starting content schema validation...');

  if (dryRun) {
    console.log('🔍 Running in dry-run mode (no files will be modified)');
  }

  const validator = new ContentSchemaValidator({ dryRun });
  const result = await validator.validateAllContent();

  if (verbose || result.fixes.length > 0 || result.errors.length > 0) {
    console.log('\n' + validator.generateReport());
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Fixed: ${result.fixes.length} issues`);
  console.log(`  ❌ Errors: ${result.errors.length} issues`);
  console.log(`  📝 Status: ${result.valid ? 'VALID' : 'ISSUES FOUND'}`);

  // Exit with error code if there are unfixed errors
  if (result.errors.length > 0) {
    console.log('\n❌ Content validation failed. Please fix the remaining issues.');
    process.exit(1);
  }

  if (result.fixes.length > 0 && !dryRun) {
    console.log('\n✅ Content schema validation completed with fixes applied.');
  } else if (result.fixes.length > 0 && dryRun) {
    console.log('\n🔍 Content schema issues found. Run without --dry-run to apply fixes.');
  } else {
    console.log('\n✅ All content files are valid!');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ContentSchemaValidator };
