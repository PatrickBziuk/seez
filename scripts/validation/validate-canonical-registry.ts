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
      cwd: process.cwd(),
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
    missingFiles: 0,
  };

  try {
    const registry = loadRegistry();
    if (!registry) {
      return {
        passed: false,
        errors: [
          {
            id: 'registry-system',
            issue: 'Could not load content registry',
            severity: 'critical',
            category: 'completeness',
          },
        ],
        warnings: [],
        summary: '❌ Registry validation failed - registry not accessible',
        stats,
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
          category: 'integrity',
        });
      }

      // 2. Path Validation - Original Path
      if (!existsSync(entry.originalPath)) {
        errors.push({
          id: canonicalId,
          issue: `Original path does not exist: ${entry.originalPath}`,
          severity: 'critical',
          category: 'path',
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
              category: 'consistency',
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
              category: 'integrity',
            });
          }

          // Check canonical ID consistency
          if (frontmatter.canonicalId && frontmatter.canonicalId !== canonicalId) {
            errors.push({
              id: canonicalId,
              issue: `File canonicalId "${frontmatter.canonicalId}" doesn't match registry key "${canonicalId}"`,
              severity: 'critical',
              category: 'integrity',
            });
          }
        } catch (parseError) {
          warnings.push({
            id: canonicalId,
            issue: `Could not parse original file ${entry.originalPath}: ${(parseError as Error).message}`,
            severity: 'warning',
            category: 'path',
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
              category: 'integrity',
            });
          }

          // Path validation for translations
          if (!existsSync(translation.path)) {
            errors.push({
              id: canonicalId,
              issue: `Translation path does not exist: ${translation.path} (${lang})`,
              severity: 'critical',
              category: 'path',
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
                  category: 'consistency',
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
                  category: 'integrity',
                });
              } else if (frontmatter.translationOf !== canonicalId && frontmatter.translationOf !== entry.canonicalId) {
                errors.push({
                  id: canonicalId,
                  issue: `Translation file ${translation.path} (${lang}) references wrong original: "${frontmatter.translationOf}"`,
                  severity: 'critical',
                  category: 'integrity',
                });
              }

              // Check language consistency
              if (frontmatter.language && frontmatter.language !== lang) {
                errors.push({
                  id: canonicalId,
                  issue: `Translation file ${translation.path} language mismatch: file="${frontmatter.language}", registry="${lang}"`,
                  severity: 'critical',
                  category: 'integrity',
                });
              }
            } catch (parseError) {
              warnings.push({
                id: canonicalId,
                issue: `Could not parse translation file ${translation.path} (${lang}): ${(parseError as Error).message}`,
                severity: 'warning',
                category: 'path',
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
          category: 'completeness',
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
      stats,
    };
  } catch (error) {
    return {
      passed: false,
      errors: [
        {
          id: 'validation-system',
          issue: `Registry validation failed: ${(error as Error).message}`,
          severity: 'critical',
          category: 'integrity',
        },
      ],
      warnings: [],
      summary: '❌ Registry validation system encountered an error',
      stats,
    };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateCanonicalRegistry };

/**
 * Validate canonical ID format
 */
function validateCanonicalIdFormat(canonicalId: string): boolean {
  // Format: slug-YYYYMMDD-hash8
  const pattern = /^[a-z0-9-]+-\d{8}-[a-f0-9]{8}$/;
  return pattern.test(canonicalId);
}

/**
 * Test registry structure and integrity
 */
function testRegistryStructure(registry: ContentRegistry): boolean {
  console.log('\n📋 Testing registry structure...');

  let allPassed = true;

  // Test top-level structure
  if (!registry.version) {
    console.log('  ❌ Missing version field');
    allPassed = false;
  } else {
    console.log(`  ✅ Version: ${registry.version}`);
  }

  if (!registry.lastUpdated) {
    console.log('  ❌ Missing lastUpdated field');
    allPassed = false;
  } else {
    console.log(`  ✅ Last updated: ${registry.lastUpdated}`);
  }

  if (!registry.entries || typeof registry.entries !== 'object') {
    console.log('  ❌ Missing or invalid entries object');
    allPassed = false;
  } else {
    console.log(`  ✅ Entries: ${Object.keys(registry.entries).length} canonical IDs`);
  }

  return allPassed;
}

/**
 * Test canonical ID formats
 */
function testCanonicalIds(registry: ContentRegistry): boolean {
  console.log('\n🔗 Testing canonical ID formats...');

  let allPassed = true;

  for (const canonicalId of Object.keys(registry.entries)) {
    if (validateCanonicalIdFormat(canonicalId)) {
      console.log(`  ✅ ${canonicalId}: valid format`);
    } else {
      console.log(`  ❌ ${canonicalId}: invalid format`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Test entry completeness
 */
function testEntryCompleteness(registry: ContentRegistry): boolean {
  console.log('\n📄 Testing entry completeness...');

  let allPassed = true;

  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    const issues: string[] = [];

    if (!entry.title) issues.push('missing title');
    if (!entry.originalLanguage) issues.push('missing originalLanguage');
    if (entry.originalLanguage && !['en', 'de'].includes(entry.originalLanguage)) {
      issues.push(`invalid originalLanguage: ${entry.originalLanguage}`);
    }
    if (!entry.originalPath) issues.push('missing originalPath');

    // Check translation structure
    if (entry.translations) {
      for (const [lang, translation] of Object.entries(entry.translations)) {
        if (!translation.status) issues.push(`translation ${lang}: missing status`);
        if (!translation.path) issues.push(`translation ${lang}: missing path`);
        if (translation.status && !['current', 'outdated', 'pending'].includes(translation.status)) {
          issues.push(`translation ${lang}: invalid status ${translation.status}`);
        }
      }
    }

    if (issues.length > 0) {
      console.log(`  ❌ ${canonicalId}: ${issues.join(', ')}`);
      allPassed = false;
    } else {
      console.log(`  ✅ ${canonicalId}: complete`);
    }
  }

  return allPassed;
}

/**
 * Test path consistency
 */
function testPathConsistency(registry: ContentRegistry): boolean {
  console.log('\n📁 Testing path consistency...');

  let allPassed = true;
  const usedPaths = new Set<string>();

  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    // Check original path uniqueness
    if (usedPaths.has(entry.originalPath)) {
      console.log(`  ❌ ${canonicalId}: duplicate path ${entry.originalPath}`);
      allPassed = false;
    } else {
      usedPaths.add(entry.originalPath);
      console.log(`  ✅ ${canonicalId}: unique original path`);
    }

    // Check translation path uniqueness
    if (entry.translations) {
      for (const [lang, translation] of Object.entries(entry.translations)) {
        if (usedPaths.has(translation.path)) {
          console.log(`  ❌ ${canonicalId}: duplicate translation path ${translation.path} (${lang})`);
          allPassed = false;
        } else {
          usedPaths.add(translation.path);
        }
      }
    }
  }

  return allPassed;
}

/**
 * Test translation relationships
 */
function testTranslationRelationships(registry: ContentRegistry): boolean {
  console.log('\n🌐 Testing translation relationships...');

  let allPassed = true;

  for (const [canonicalId, entry] of Object.entries(registry.entries)) {
    if (!entry.translations || Object.keys(entry.translations).length === 0) {
      console.log(`  ⚠️  ${canonicalId}: no translations`);
      continue;
    }

    const translationCount = Object.keys(entry.translations).length;
    const currentCount = Object.values(entry.translations).filter((t) => t.status === 'current').length;

    console.log(`  ✅ ${canonicalId}: ${currentCount}/${translationCount} current translations`);

    // Check for language conflicts
    if (entry.translations[entry.originalLanguage]) {
      console.log(`  ❌ ${canonicalId}: self-translation detected (${entry.originalLanguage})`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Generate registry statistics
 */
function generateStatistics(registry: ContentRegistry): void {
  console.log('\n📊 Registry Statistics:');

  const totalEntries = Object.keys(registry.entries).length;
  const languageDistribution: { [lang: string]: number } = {};
  const statusDistribution: { [status: string]: number } = {};
  let totalTranslations = 0;

  for (const entry of Object.values(registry.entries)) {
    // Language distribution
    languageDistribution[entry.originalLanguage] = (languageDistribution[entry.originalLanguage] || 0) + 1;

    // Translation statistics
    if (entry.translations) {
      for (const translation of Object.values(entry.translations)) {
        totalTranslations++;
        statusDistribution[translation.status] = (statusDistribution[translation.status] || 0) + 1;
      }
    }
  }

  console.log(`  📈 Total entries: ${totalEntries}`);
  console.log(`  📈 Total translations: ${totalTranslations}`);

  console.log('  📈 Language distribution:');
  for (const [lang, count] of Object.entries(languageDistribution)) {
    console.log(`     ${lang}: ${count} entries`);
  }

  console.log('  📈 Translation status distribution:');
  for (const [status, count] of Object.entries(statusDistribution)) {
    console.log(`     ${status}: ${count} translations`);
  }
}

/**
 * Main validation execution
 */
async function main(): Promise<void> {
  console.log('🧪 Content Registry Validation\n');
  console.log('='.repeat(50));

  // Load registry
  const registry = loadRegistry();
  if (!registry) {
    console.error('❌ Cannot proceed without content registry');
    process.exit(1);
  }

  // Run all tests
  const tests = [
    { name: 'Registry Structure', fn: () => testRegistryStructure(registry) },
    { name: 'Canonical ID Formats', fn: () => testCanonicalIds(registry) },
    { name: 'Entry Completeness', fn: () => testEntryCompleteness(registry) },
    { name: 'Path Consistency', fn: () => testPathConsistency(registry) },
    { name: 'Translation Relationships', fn: () => testTranslationRelationships(registry) },
  ];

  const results: { name: string; passed: boolean }[] = [];

  for (const test of tests) {
    const passed = test.fn();
    results.push({ name: test.name, passed });
  }

  // Generate statistics
  generateStatistics(registry);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 Validation Results Summary:\n');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${status} ${result.name}`);
  });

  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All validation tests passed! Registry is healthy.');
    process.exit(0);
  } else {
    console.log('🚨 Some validation tests failed. Please review and fix issues.');
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 Validation execution failed:', error);
    process.exit(1);
  });
}
