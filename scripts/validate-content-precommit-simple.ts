#!/usr/bin/env tsx

/**
 * Simple Pre-commit Validation Script
 */

import { execSync } from 'child_process';

async function main() {
  console.log('🔍 Running pre-commit content validation...');

  try {
    // Run the canonical system scan
    console.log('📋 Scanning content for canonical ID updates...');
    execSync('npx tsx scripts/content-canonical-simple.ts scan', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log('✅ Pre-commit validation completed successfully');
  } catch (error) {
    console.error('❌ Pre-commit validation failed:', error);
    process.exit(1);
  }
}

main();
