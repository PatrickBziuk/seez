#!/usr/bin/env tsx

import { glob } from 'glob';

/**
 * Simple content analysis test
 */
async function testAnalysis(): Promise<void> {
  console.log('🔍 Starting content analysis...');

  // Find all content files
  const contentFiles = await glob('src/content/{books,projects,lab,life}/**/*.{md,mdx}', {
    cwd: process.cwd(),
  });

  console.log(`Found ${contentFiles.length} content files:`);

  for (const file of contentFiles) {
    console.log(`  ${file}`);
  }

  console.log('\n✅ Analysis complete');
}

testAnalysis().catch(console.error);
