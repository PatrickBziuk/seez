#!/usr/bin/env tsx

/**
 * validate-translation-relationships.ts - Translation Relationship Validation (BLOCKING)
 * 
 * Purpose: Ensure all translation relationships are properly configured and valid
 * 
 * This script validates:
 * - Translation links via canonicalId and translationOf references
 * - Registry consistency with actual file relationships
 * - Translation quality and completeness
 * - Proper metadata structure for multilingual content
 * 
 * @blocking This validation BLOCKS commits until all issues are resolved
 * @dependencies gray-matter, glob, content registry system
 */

import { glob } from 'glob';
import matter from 'gray-matter';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface TranslationRelationship {
  file: string;
  canonicalId?: string;
  translationOf?: string;
  language: string;
  collection: string;
  slug: string;
}

interface ValidationError {
  file: string;
  issue: string;
  severity: 'critical' | 'warning';
  category: 'link' | 'quality' | 'metadata' | 'registry';
}

interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  relationships: Map<string, TranslationRelationship[]>;
  summary: string;
}

/**
 * Extract collection and slug from file path
 */
function parseContentPath(filePath: string): { collection: string; slug: string } {
  const pathParts = filePath.replace(/\\/g, '/').split('/');
  const contentIndex = pathParts.findIndex(part => part === 'content');
  
  if (contentIndex === -1 || pathParts.length < contentIndex + 3) {
    throw new Error(`Invalid content path structure: ${filePath}`);
  }
  
  const collection = pathParts[contentIndex + 1];
  const languageOrSlug = pathParts[contentIndex + 2];
  
  // Check if language directory structure is used
  if (['en', 'de'].includes(languageOrSlug)) {
    const slug = pathParts[contentIndex + 3]?.replace(/\.(md|mdx)$/, '') || '';
    return { collection, slug };
  } else {
    const slug = languageOrSlug.replace(/\.(md|mdx)$/, '');
    return { collection, slug };
  }
}

/**
 * Validate translation relationships across all content
 */
async function validateTranslationRelationships(): Promise<ValidationResult> {
  console.log('🔗 Validating translation relationships...');
  
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const relationships = new Map<string, TranslationRelationship[]>();
  
  try {
    // Find all content files
    const contentFiles = await glob('src/content/{books,projects,lab,life,pages}/**/*.{md,mdx}', {
      cwd: process.cwd(),
      absolute: true
    });
    
    console.log(`📄 Found ${contentFiles.length} content files to validate`);
    
    // First pass: collect all translation relationships
    const allContent: TranslationRelationship[] = [];
    
    for (const filePath of contentFiles) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const { data: frontmatter } = matter(content);
        
        const { collection, slug } = parseContentPath(filePath);
        const language = frontmatter.language || 'en';
        
        const relationship: TranslationRelationship = {
          file: filePath.replace(process.cwd(), '.'),
          canonicalId: frontmatter.canonicalId,
          translationOf: frontmatter.translationOf,
          language,
          collection,
          slug
        };
        
        allContent.push(relationship);
        
        // Group by canonical ID or slug for relationship analysis
        const groupKey = frontmatter.canonicalId || `${collection}/${slug}`;
        if (!relationships.has(groupKey)) {
          relationships.set(groupKey, []);
        }
        relationships.get(groupKey)!.push(relationship);
        
      } catch (fileError) {
        errors.push({
          file: filePath.replace(process.cwd(), '.'),
          issue: `Failed to parse file: ${(fileError as Error).message}`,
          severity: 'critical',
          category: 'metadata'
        });
      }
    }
    
    // Second pass: validate relationships
    for (const [groupKey, group] of relationships) {
      if (group.length === 1) {
        // Single file - check if it should have translations
        const item = group[0];
        if (item.translationOf) {
          // This claims to be a translation but no original found
          errors.push({
            file: item.file,
            issue: `References translationOf "${item.translationOf}" but original not found`,
            severity: 'critical',
            category: 'link'
          });
        }
      } else {
        // Multiple files - validate translation relationships
        const originalLanguageItems = group.filter(item => !item.translationOf);
        const translationItems = group.filter(item => item.translationOf);
        
        // Check for multiple originals
        if (originalLanguageItems.length > 1) {
          const languages = originalLanguageItems.map(item => item.language);
          const uniqueLanguages = new Set(languages);
          
          if (uniqueLanguages.size === languages.length) {
            // Multiple originals in different languages - this might be okay
            warnings.push({
              file: originalLanguageItems.map(item => item.file).join(', '),
              issue: `Multiple original content files for same topic in different languages`,
              severity: 'warning',
              category: 'metadata'
            });
          } else {
            // Multiple originals in same language - error
            errors.push({
              file: originalLanguageItems.map(item => item.file).join(', '),
              issue: `Multiple original content files with same language "${originalLanguageItems[0].language}"`,
              severity: 'critical',
              category: 'link'
            });
          }
        }
        
        // Validate translation references
        for (const translation of translationItems) {
          const originalExists = originalLanguageItems.some(orig => 
            orig.canonicalId === translation.translationOf ||
            `${orig.collection}/${orig.slug}` === translation.translationOf
          );
          
          if (!originalExists) {
            errors.push({
              file: translation.file,
              issue: `References translationOf "${translation.translationOf}" but original not found in group`,
              severity: 'critical',
              category: 'link'
            });
          }
          
          // Check for self-translation
          if (translation.translationOf === translation.canonicalId) {
            errors.push({
              file: translation.file,
              issue: 'Content references itself as translation (translationOf === canonicalId)',
              severity: 'critical',
              category: 'link'
            });
          }
          
          // Check for same language as original
          const original = originalLanguageItems.find(orig => 
            orig.canonicalId === translation.translationOf ||
            `${orig.collection}/${orig.slug}` === translation.translationOf
          );
          
          if (original && original.language === translation.language) {
            errors.push({
              file: translation.file,
              issue: `Translation has same language "${translation.language}" as original`,
              severity: 'critical',
              category: 'link'
            });
          }
        }
        
        // Check for orphaned translations (translation references something outside this group)
        for (const item of group) {
          if (item.translationOf && !item.translationOf.startsWith(groupKey)) {
            const referencedExists = allContent.some(content => 
              content.canonicalId === item.translationOf ||
              `${content.collection}/${content.slug}` === item.translationOf
            );
            
            if (!referencedExists) {
              errors.push({
                file: item.file,
                issue: `References non-existent original "${item.translationOf}"`,
                severity: 'critical',
                category: 'link'
              });
            }
          }
        }
      }
    }
    
    // Validate content registry consistency if it exists
    const registryPath = resolve(process.cwd(), 'data/content-registry.json');
    if (existsSync(registryPath)) {
      try {
        const registryContent = readFileSync(registryPath, 'utf-8');
        const registry = JSON.parse(registryContent);
        
        // Check registry consistency with actual files
        for (const item of allContent) {
          const registryEntry = registry.entries?.find((entry: { filePath: string; canonicalId?: string }) => 
            entry.filePath === item.file.replace('./', '')
          );
          
          if (!registryEntry) {
            warnings.push({
              file: item.file,
              issue: 'File not found in content registry',
              severity: 'warning',
              category: 'registry'
            });
          } else {
            // Validate registry data consistency
            if (registryEntry.canonicalId !== item.canonicalId) {
              errors.push({
                file: item.file,
                issue: `Registry canonicalId mismatch: registry="${registryEntry.canonicalId}", file="${item.canonicalId}"`,
                severity: 'critical',
                category: 'registry'
              });
            }
          }
        }
      } catch (registryError) {
        warnings.push({
          file: 'data/content-registry.json',
          issue: `Failed to validate registry: ${(registryError as Error).message}`,
          severity: 'warning',
          category: 'registry'
        });
      }
    }
    
    const passed = errors.length === 0;
    const summary = passed 
      ? `✅ All translation relationships are valid (${relationships.size} content groups)`
      : `❌ Found ${errors.length} critical translation relationship issues`;
    
    return {
      passed,
      errors,
      warnings,
      relationships,
      summary
    };
    
  } catch (error) {
    return {
      passed: false,
      errors: [{
        file: 'validation-system',
        issue: `Translation validation failed: ${(error as Error).message}`,
        severity: 'critical',
        category: 'metadata'
      }],
      warnings: [],
      relationships: new Map(),
      summary: '❌ Translation relationship validation system encountered an error'
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
    const categories = ['link', 'quality', 'metadata', 'registry'] as const;
    
    for (const category of categories) {
      const categoryErrors = result.errors.filter(error => error.category === category);
      if (categoryErrors.length > 0) {
        console.log(`\n  📂 ${category.toUpperCase()} ISSUES:`);
        categoryErrors.forEach((error, index) => {
          console.log(`    ${index + 1}. ${error.file}`);
          console.log(`       ${error.issue}`);
        });
      }
    }
    
    console.log('\n💡 To fix:');
    console.log('   • Ensure translationOf references point to existing content');
    console.log('   • Verify canonicalId values are unique and consistent');
    console.log('   • Check that translations reference content in different languages');
    console.log('   • Update content registry if it exists');
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (recommended fixes):');
    result.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning.file}`);
      console.log(`     ${warning.issue}`);
    });
  }
  
  if (result.passed) {
    console.log('\n🎉 All translation relationships are valid! Content is ready for commit.');
    process.exit(0);
  } else {
    console.log('\n❌ Commit blocked due to translation relationship failures.');
    console.log('Please fix the critical issues above and try again.');
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const result = await validateTranslationRelationships();
    reportResults(result);
  } catch (error) {
    console.error('❌ Translation relationship validation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateTranslationRelationships };
