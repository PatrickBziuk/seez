#!/usr/bin/env tsx

/**
 * Pre-commit Content Validation Script
 * @purpose Validate content structure and update canonical registry before commit
 * @dependencies content-canonical-system
 * @usedBy Husky pre-commit hook
 */

import { execSync } from 'child_process';
import fs from 'fs';
import { scanAndUpdateContent, validateRegistry } from '../content/content-canonical-system';

/**
 * Main pre-commit validation
 */
async function preCommitValidation(): Promise<boolean> {
  console.log('🔍 Running pre-commit content validation...');

  try {
    // 1. Scan and update content canonical IDs
    console.log('\n📋 Scanning content for canonical ID updates...');
    const scanResult = scanAndUpdateContent();

    if (scanResult.filesUpdated.length > 0) {
      console.log(`📝 Updated ${scanResult.filesUpdated.length} files with canonical IDs`);

      // Stage the updated files
      for (const file of scanResult.filesUpdated) {
        try {
          execSync(`git add "${file}"`, { stdio: 'pipe' });
        } catch (error) {
          console.warn(`⚠️ Failed to stage ${file}:`, error);
        }
      }
    }

    if (scanResult.registryUpdated) {
      console.log('📄 Content registry updated');

      // Create a marker file to indicate registry was updated
      // This will be checked by the main pre-commit hook
      fs.writeFileSync('data/content-registry.json.updated', '');
    }

    // 2. Validate registry consistency
    console.log('\n🔍 Validating registry consistency...');
    const validation = validateRegistry();

    if (!validation.valid) {
      console.error('❌ Registry validation failed:');
      validation.errors.forEach((error: string) => console.error(`   ${error}`));
      return false;
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ Registry warnings:');
      validation.warnings.forEach((warning: string) => console.warn(`   ${warning}`));
    }

    console.log('✅ Pre-commit validation completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Pre-commit validation failed:', error);
    return false;
  }
}

/**
 * CLI interface
 */
async function main() {
  const success = await preCommitValidation();

  if (!success) {
    console.error('\n❌ Pre-commit validation failed. Commit aborted.');
    console.error('💡 Fix the issues above and try again.');
    process.exit(1);
  }

  console.log('\n✅ Pre-commit validation passed. Proceeding with commit.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error in pre-commit validation:', error);
    process.exit(1);
  });
}

export { preCommitValidation };
