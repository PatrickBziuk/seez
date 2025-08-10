#!/usr/bin/env tsx

/**
 * Publication Readiness Validation Script
 * @purpose Validate that content meets publication criteria before push
 * @dependencies gray-matter, fs, path, content-registry.json
 * @usedBy Husky pre-push hook
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import path from 'path';

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

interface ValidationIssue {
  type: 'draft' | 'unreviewed_content' | 'unreviewed_translation' | 'missing_translation';
  severity: 'error' | 'warning';
  filePath: string;
  canonicalId?: string;
  message: string;
  details?: string;
}

interface ValidationResult {
  success: boolean;
  issues: ValidationIssue[];
  blockers: ValidationIssue[];
  warnings: ValidationIssue[];
}

/**
 * Load the content registry
 */
function loadContentRegistry(): ContentRegistry | null {
  const registryPath = 'data/content-registry.json';

  if (!existsSync(registryPath)) {
    console.error(`❌ Content registry not found at ${registryPath}`);
    return null;
  }

  try {
    const content = readFileSync(registryPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to load content registry:`, error);
    return null;
  }
}

/**
 * Get list of staged files for commit
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return output
      .trim()
      .split('\n')
      .filter((file: string) => file.match(/^src\/content\/.*\.(md|mdx)$/))
      .filter((file: string) => existsSync(file));
  } catch (error) {
    console.error('❌ Failed to get staged files:', error);
    return [];
  }
}

/**
 * Validate a single content file
 */
function validateContentFile(filePath: string, registry: ContentRegistry): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  try {
    const content = readFileSync(filePath, 'utf-8');
    const { data: frontmatter } = matter(content);

    const canonicalId = frontmatter.canonicalId as string;
    const isDraft = frontmatter.draft === true;
    const language = frontmatter.language || 'en';
    const isTranslation = frontmatter.translationOf && frontmatter.sourceLanguage;

    // Check 1: Draft status
    if (isDraft) {
      issues.push({
        type: 'draft',
        severity: 'error',
        filePath,
        canonicalId,
        message: 'Content is in draft state',
        details: 'Content marked as draft=true cannot be published',
      });
    }

    // Check 2: Content review status
    const contentReviewed = frontmatter.status?.review?.content === true;
    if (!contentReviewed && !isDraft) {
      issues.push({
        type: 'unreviewed_content',
        severity: 'error',
        filePath,
        canonicalId,
        message: 'Content has not been reviewed',
        details: 'Set status.review.content=true after human review',
      });
    }

    // Check 3: Translation review status (for AI-translated content)
    if (isTranslation) {
      const translationType = frontmatter.status?.translation;
      const translationReviewed = frontmatter.status?.review?.translation === true;

      if (translationType === 'AI' && !translationReviewed) {
        issues.push({
          type: 'unreviewed_translation',
          severity: 'error',
          filePath,
          canonicalId,
          message: 'AI translation has not been reviewed',
          details: 'Set status.review.translation=true after human review of AI translation',
        });
      }
    }

    // Check 4: Translation completeness (for original content)
    if (canonicalId && registry.entries[canonicalId] && !isTranslation) {
      const registryEntry = registry.entries[canonicalId];
      const supportedLanguages = ['en', 'de'];
      const targetLanguages = supportedLanguages.filter((lang) => lang !== language);

      for (const targetLang of targetLanguages) {
        const translation = registryEntry.translations[targetLang];
        if (!translation || translation.status === 'missing') {
          issues.push({
            type: 'missing_translation',
            severity: 'warning',
            filePath,
            canonicalId,
            message: `Missing ${targetLang} translation`,
            details: `Consider adding translation to ${targetLang} before publishing`,
          });
        }
      }
    }
  } catch (error) {
    issues.push({
      type: 'unreviewed_content',
      severity: 'error',
      filePath,
      message: 'Failed to parse content file',
      details: `Error: ${error}`,
    });
  }

  return issues;
}

/**
 * Validate all staged content files
 */
function validateStagedContent(): ValidationResult {
  console.log('🔍 Validating staged content for publication readiness...');

  const registry = loadContentRegistry();
  if (!registry) {
    return {
      success: false,
      issues: [
        {
          type: 'unreviewed_content',
          severity: 'error',
          filePath: 'data/content-registry.json',
          message: 'Content registry not available',
          details: 'Cannot validate without content registry',
        },
      ],
      blockers: [],
      warnings: [],
    };
  }

  const stagedFiles = getStagedFiles();
  console.log(`📁 Found ${stagedFiles.length} staged content files`);

  if (stagedFiles.length === 0) {
    console.log('ℹ️  No staged content files to validate');
    return {
      success: true,
      issues: [],
      blockers: [],
      warnings: [],
    };
  }

  const allIssues: ValidationIssue[] = [];

  for (const filePath of stagedFiles) {
    console.log(`   📄 Validating: ${path.relative(process.cwd(), filePath)}`);
    const fileIssues = validateContentFile(filePath, registry);
    allIssues.push(...fileIssues);
  }

  const blockers = allIssues.filter((issue) => issue.severity === 'error');
  const warnings = allIssues.filter((issue) => issue.severity === 'warning');

  const success = blockers.length === 0;

  return {
    success,
    issues: allIssues,
    blockers,
    warnings,
  };
}

/**
 * Print validation results
 */
function printValidationResults(result: ValidationResult): void {
  console.log(`\n📊 Publication Readiness Summary:`);
  console.log(`   Total issues: ${result.issues.length}`);
  console.log(`   Blockers: ${result.blockers.length}`);
  console.log(`   Warnings: ${result.warnings.length}`);

  if (result.blockers.length > 0) {
    console.log(`\n❌ Publication Blockers:`);
    for (const issue of result.blockers) {
      console.log(`   🚫 ${path.relative(process.cwd(), issue.filePath)}`);
      console.log(`      ${issue.message}`);
      if (issue.details) {
        console.log(`      Details: ${issue.details}`);
      }
    }
  }

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    for (const issue of result.warnings) {
      console.log(`   ⚠️  ${path.relative(process.cwd(), issue.filePath)}`);
      console.log(`      ${issue.message}`);
      if (issue.details) {
        console.log(`      Details: ${issue.details}`);
      }
    }
  }

  if (result.success) {
    console.log(`\n✅ All staged content is ready for publication!`);
  } else {
    console.log(`\n❌ Publication blocked by ${result.blockers.length} critical issues.`);
    console.log(`\n💡 How to resolve:`);
    console.log(`   • For draft content: Remove draft=true or set draft=false`);
    console.log(`   • For unreviewed content: Set status.review.content=true after review`);
    console.log(`   • For unreviewed translations: Set status.review.translation=true after review`);
    console.log(`   • Review content manually and update metadata accordingly`);
  }
}

/**
 * Main validation function
 */
async function main(): Promise<void> {
  try {
    const result = validateStagedContent();
    printValidationResults(result);

    if (!result.success) {
      console.log(`\n🛑 Push blocked due to publication readiness issues.`);
      process.exit(1);
    }

    console.log(`\n🚀 Content validation passed - ready for publication!`);
  } catch (error) {
    console.error('❌ Publication readiness validation failed:', error);
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateStagedContent };
export type { ValidationResult, ValidationIssue };
