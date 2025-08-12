#!/usr/bin/env tsx

/**
 * Enhanced Canonical Registry Validation Script (BLOCKING)
 * 
 * Purpose: Comprehensive validation of content registry integrity and structure
 * 
 * This script validates:
 * - Translation link integrity via canonicalId references
 * - Orphaned translation detection
 * - Self-translation prevention
 * - Hash consistency verification
 * - Registry completeness
 * - Path validation
 * 
 * @blocking This validation BLOCKS commits until all issues are resolved
 * @dependencies content registry data, file system access
 * @usedBy Pre-commit validation and CI validation
 */

import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import matter from 'gray-matter';
import { createHash } from 'crypto';

interface Translation {
  status: 'current' | 'outdated' | 'pending';
  path: string;
  timestamp?: string;
  hash?: string;
}

interface RegistryEntry {
  title: string;
  originalLanguage: 'en' | 'de';
  originalPath: string;
  translations?: { [lang: string]: Translation };
  canonicalId?: string;
  timestamp?: string;
  hash?: string;
}

interface ContentRegistry {
  version: string;
  lastUpdated: string;
  entries: { [canonicalId: string]: RegistryEntry };
}

interface ValidationError {
  id: string;
  issue: string;
  severity: 'critical' | 'warning';
  category: 'integrity' | 'orphan' | 'consistency' | 'completeness' | 'path';
}

interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: string;
  stats: {
    totalEntries: number;
    totalTranslations: number;
    validatedFiles: number;
    missingFiles: number;
  };
}

/**
 * Calculate file content hash for consistency checking
 */
function calculateFileHash(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return createHash('md5').update(content).digest('hex');
  } catch {
    return null;
  }
}

/**
 * Load content registry for validation
 */
function loadRegistry(): ContentRegistry | null {
  const registryPath = 'data/content-registry.json';

  if (!existsSync(registryPath)) {
    console.error('❌ Content registry not found:', registryPath);
    return null;
  }

  try {
    const content = readFileSync(registryPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Failed to load registry:', error);
    return null;
  }
}

/**
 * Get all actual content files from the file system
 */
async function getAllContentFiles(): Promise<Set<string>> {
  try {
    const files = await glob('src/content/{books,projects,lab,life,pages}/**/*.{md,mdx}', {
      cwd: process.cwd()
    });
    return new Set(files);
  } catch (error) {
    console.error('❌ Failed to scan content files:', error);
    return new Set();
  }
}

/**
 * Validate the canonical registry comprehensively
 */
async function validateCanonicalRegistry(): Promise<ValidationResult> {
  console.log('🔍 Validating canonical registry integrity...');
  
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const stats = {
    totalEntries: 0,
    totalTranslations: 0,
    validatedFiles: 0,
    missingFiles: 0
  };
  
  try {
    const registry = loadRegistry();
    if (!registry) {
      return {
        passed: false,
        errors: [{
          id: 'registry-system',
          issue: 'Could not load content registry',
          severity: 'critical',
          category: 'completeness'
        }],
        warnings: [],
        summary: '❌ Registry validation failed - registry not accessible',
        stats
      };
    }
    
    // Get all actual content files
    const actualFiles = await getAllContentFiles();
    stats.totalEntries = Object.keys(registry.entries).length;
    
    console.log(`📄 Found ${stats.totalEntries} registry entries and ${actualFiles.size} actual files`);
    
    // Validate each registry entry
    for (const [canonicalId, entry] of Object.entries(registry.entries)) {
      
      // 1. Translation Link Integrity
      if (entry.canonicalId && entry.canonicalId !== canonicalId) {
        errors.push({
          id: canonicalId,
          issue: `Registry key "${canonicalId}" doesn't match entry canonicalId "${entry.canonicalId}"`,
          severity: 'critical',
          category: 'integrity'
        });
      }
      
      // 2. Path Validation - Original Path
      if (!existsSync(entry.originalPath)) {
        errors.push({
          id: canonicalId,
          issue: `Original path does not exist: ${entry.originalPath}`,
          severity: 'critical',
          category: 'path'
        });
        stats.missingFiles++;
      } else {
        stats.validatedFiles++;
        
        // 3. Hash Consistency Check
        if (entry.hash) {
          const actualHash = calculateFileHash(entry.originalPath);
          if (actualHash && actualHash !== entry.hash) {
            warnings.push({
              id: canonicalId,
              issue: `File hash mismatch for ${entry.originalPath} - content may have changed`,
              severity: 'warning',
              category: 'consistency'
            });
          }
        }
        
        // 4. Self-Translation Prevention
        try {
          const content = readFileSync(entry.originalPath, 'utf-8');
          const { data: frontmatter } = matter(content);
          
          if (frontmatter.translationOf === canonicalId || frontmatter.translationOf === entry.canonicalId) {
            errors.push({
              id: canonicalId,
              issue: `Original file references itself as translation: translationOf="${frontmatter.translationOf}"`,
              severity: 'critical',
              category: 'integrity'
            });
          }
          
          // Check canonical ID consistency
          if (frontmatter.canonicalId && frontmatter.canonicalId !== canonicalId) {
            errors.push({
              id: canonicalId,
              issue: `File canonicalId "${frontmatter.canonicalId}" doesn't match registry key "${canonicalId}"`,
              severity: 'critical',
              category: 'integrity'
            });
          }
          
        } catch (parseError) {
          warnings.push({
            id: canonicalId,
            issue: `Could not parse original file ${entry.originalPath}: ${(parseError as Error).message}`,
            severity: 'warning',
            category: 'path'
          });
        }
      }
      
      // 5. Translation Validation
      if (entry.translations) {
        for (const [lang, translation] of Object.entries(entry.translations)) {
          stats.totalTranslations++;
          
          // Self-translation prevention
          if (lang === entry.originalLanguage) {
            errors.push({
              id: canonicalId,
              issue: `Translation language "${lang}" matches original language "${entry.originalLanguage}"`,
              severity: 'critical',
              category: 'integrity'
            });
          }
          
          // Path validation for translations
          if (!existsSync(translation.path)) {
            errors.push({
              id: canonicalId,
              issue: `Translation path does not exist: ${translation.path} (${lang})`,
              severity: 'critical',
              category: 'path'
            });
            stats.missingFiles++;
          } else {
            stats.validatedFiles++;
            
            // Hash consistency for translations
            if (translation.hash) {
              const actualHash = calculateFileHash(translation.path);
              if (actualHash && actualHash !== translation.hash) {
                warnings.push({
                  id: canonicalId,
                  issue: `Translation hash mismatch for ${translation.path} (${lang}) - content may have changed`,
                  severity: 'warning',
                  category: 'consistency'
                });
              }
            }
            
            // Validate translation frontmatter
            try {
              const content = readFileSync(translation.path, 'utf-8');
              const { data: frontmatter } = matter(content);
              
              // Check translation reference
              if (!frontmatter.translationOf) {
                warnings.push({
                  id: canonicalId,
                  issue: `Translation file ${translation.path} (${lang}) missing translationOf reference`,
                  severity: 'warning',
                  category: 'integrity'
                });
              } else if (frontmatter.translationOf !== canonicalId && frontmatter.translationOf !== entry.canonicalId) {
                errors.push({
                  id: canonicalId,
                  issue: `Translation file ${translation.path} (${lang}) references wrong original: "${frontmatter.translationOf}"`,
                  severity: 'critical',
                  category: 'integrity'
                });
              }
              
              // Check language consistency
              if (frontmatter.language && frontmatter.language !== lang) {
                errors.push({
                  id: canonicalId,
                  issue: `Translation file ${translation.path} language mismatch: file="${frontmatter.language}", registry="${lang}"`,
                  severity: 'critical',
                  category: 'integrity'
                });
              }
              
            } catch (parseError) {
              warnings.push({
                id: canonicalId,
                issue: `Could not parse translation file ${translation.path} (${lang}): ${(parseError as Error).message}`,
                severity: 'warning',
                category: 'path'
              });
            }
          }
        }
      }
    }
    
    // 6. Registry Completeness - Check for orphaned files
    const registeredFiles = new Set<string>();
    for (const entry of Object.values(registry.entries)) {
      registeredFiles.add(entry.originalPath);
      if (entry.translations) {
        for (const translation of Object.values(entry.translations)) {
          registeredFiles.add(translation.path);
        }
      }
    }
    
    for (const actualFile of actualFiles) {
      if (!registeredFiles.has(actualFile)) {
        warnings.push({
          id: 'registry-completeness',
          issue: `File not registered in registry: ${actualFile}`,
          severity: 'warning',
          category: 'completeness'
        });
      }
    }
    
    const passed = errors.length === 0;
    const summary = passed 
      ? `✅ Registry validation passed (${stats.totalEntries} entries, ${stats.totalTranslations} translations)`
      : `❌ Found ${errors.length} critical registry issues`;
    
    return {
      passed,
      errors,
      warnings,
      summary,
      stats
    };
    
  } catch (error) {
    return {
      passed: false,
      errors: [{
        id: 'validation-system',
        issue: `Registry validation failed: ${(error as Error).message}`,
        severity: 'critical',
        category: 'integrity'
      }],
      warnings: [],
      summary: '❌ Registry validation system encountered an error',
      stats
    };
  }
}

/**
 * Print validation results and exit with appropriate code
 */
function reportResults(result: ValidationResult): void {
  console.log('\n' + result.summary);
  console.log(`📊 Stats: ${result.stats.validatedFiles} files validated, ${result.stats.missingFiles} missing`);
  
  if (result.errors.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES (must be fixed before commit):');
    const categories = ['integrity', 'path', 'consistency', 'completeness', 'orphan'] as const;
    
    for (const category of categories) {
      const categoryErrors = result.errors.filter(error => error.category === category);
      if (categoryErrors.length > 0) {
        console.log(`\n  📂 ${category.toUpperCase()} ISSUES:`);
        categoryErrors.forEach((error, index) => {
          console.log(`    ${index + 1}. ${error.id}`);
          console.log(`       ${error.issue}`);
        });
      }
    }
    
    console.log('\n💡 To fix:');
    console.log('   • Ensure all paths in registry point to existing files');
    console.log('   • Verify canonicalId values are unique and consistent');
    console.log('   • Fix translation references to point to correct originals');
    console.log('   • Remove self-referencing translations');
    console.log('   • Update file hashes if content has changed legitimately');
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (recommended fixes):');
    result.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning.id || 'registry'}`);
      console.log(`     ${warning.issue}`);
    });
  }
  
  if (result.passed) {
    console.log('\n🎉 Registry validation passed! Content registry is consistent.');
    process.exit(0);
  } else {
    console.log('\n❌ Commit blocked due to registry validation failures.');
    console.log('Please fix the critical issues above and try again.');
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const result = await validateCanonicalRegistry();
    reportResults(result);
  } catch (error) {
    console.error('❌ Registry validation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateCanonicalRegistry };
