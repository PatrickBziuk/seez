#!/usr/bin/env tsx

/**
 * validate-no-drafts.ts - Draft State Validation (BLOCKING)
 * 
 * Purpose: Ensure no content has `draft: true` in frontmatter before commits
 * 
 * This script prevents draft content from being committed to the repository.
 * It scans all content files and blocks commits if any draft content is found.
 * 
 * @blocking This validation BLOCKS commits until all issues are resolved
 * @dependencies gray-matter, glob
 */

import { glob } from 'glob';
import matter from 'gray-matter';
import { readFileSync } from 'fs';

interface ValidationError {
  file: string;
  issue: string;
  severity: 'critical' | 'warning';
}

interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: string;
}

/**
 * Validate that no content files have draft: true in frontmatter
 */
async function validateNoDrafts(): Promise<ValidationResult> {
  console.log('🔍 Validating that no content is in draft state...');
  
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  try {
    // Find all content files across collections
    const contentFiles = await glob('src/content/{books,projects,lab,life,pages}/**/*.{md,mdx}', {
      cwd: process.cwd(),
      absolute: true
    });
    
    console.log(`📄 Found ${contentFiles.length} content files to validate`);
    
    for (const filePath of contentFiles) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const { data: frontmatter } = matter(content);
        
        // Check for draft status
        if (frontmatter.draft === true) {
          errors.push({
            file: filePath.replace(process.cwd(), '.'),
            issue: 'Content marked as draft: true',
            severity: 'critical'
          });
        }
        
        // Check for missing review status on AI-generated content
        if (frontmatter.status?.authoring === 'AI' || frontmatter.status?.authoring === 'AI+Human') {
          if (!frontmatter.status?.reviewed || frontmatter.status?.reviewed !== true) {
            errors.push({
              file: filePath.replace(process.cwd(), '.'),
              issue: 'AI-generated content not marked as human-reviewed',
              severity: 'critical'
            });
          }
        }
        
        // Check for missing translation review status
        if (frontmatter.status?.translation === 'AI') {
          if (!frontmatter.status?.translationReviewed || frontmatter.status?.translationReviewed !== true) {
            errors.push({
              file: filePath.replace(process.cwd(), '.'),
              issue: 'AI-translated content not marked as human-reviewed',
              severity: 'critical'
            });
          }
        }
        
        // Check for required metadata completeness
        const requiredFields = ['title', 'language'];
        for (const field of requiredFields) {
          if (!frontmatter[field]) {
            errors.push({
              file: filePath.replace(process.cwd(), '.'),
              issue: `Missing required field: ${field}`,
              severity: 'critical'
            });
          }
        }
        
        // Warning for missing tags
        if (!frontmatter.tags || !Array.isArray(frontmatter.tags) || frontmatter.tags.length === 0) {
          warnings.push({
            file: filePath.replace(process.cwd(), '.'),
            issue: 'Content has no tags assigned',
            severity: 'warning'
          });
        }
        
      } catch (fileError) {
        errors.push({
          file: filePath.replace(process.cwd(), '.'),
          issue: `Failed to parse file: ${(fileError as Error).message}`,
          severity: 'critical'
        });
      }
    }
    
    const passed = errors.length === 0;
    const summary = passed 
      ? `✅ All ${contentFiles.length} content files are ready for publication`
      : `❌ Found ${errors.length} critical issues that must be resolved before commit`;
    
    return {
      passed,
      errors,
      warnings,
      summary
    };
    
  } catch (error) {
    return {
      passed: false,
      errors: [{
        file: 'validation-system',
        issue: `Validation failed: ${(error as Error).message}`,
        severity: 'critical'
      }],
      warnings: [],
      summary: '❌ Draft validation system encountered an error'
    };
  }
}

/**
 * Print validation results and exit with appropriate code
 */
function reportResults(result: ValidationResult): void {
  console.log('\n' + result.summary);
  
  if (result.errors.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES (must be fixed before commit):');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.file}`);
      console.log(`     ${error.issue}`);
    });
    console.log('\n💡 To fix:');
    console.log('   • Remove draft: true from frontmatter');
    console.log('   • Add reviewed: true to status for AI-generated content');
    console.log('   • Add translationReviewed: true to status for AI-translated content');
    console.log('   • Ensure all required metadata fields are present');
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (recommended fixes):');
    result.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning.file}`);
      console.log(`     ${warning.issue}`);
    });
  }
  
  if (result.passed) {
    console.log('\n🎉 All validations passed! Content is ready for commit.');
    process.exit(0);
  } else {
    console.log('\n❌ Commit blocked due to validation failures.');
    console.log('Please fix the critical issues above and try again.');
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const result = await validateNoDrafts();
    reportResults(result);
  } catch (error) {
    console.error('❌ Draft validation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateNoDrafts };
