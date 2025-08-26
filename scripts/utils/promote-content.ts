#!/usr/bin/env tsx

/**
 * Content Promotion Script
 * Helps users promote content from draft to published state after review
 * Features:
 * - Lists all draft content
 * - Interactive promotion to published status
 * - Updates both draft and publicationStatus fields
 * - Tracks publication dates
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';

/**
 * Configuration
 */
const CONTENT_BASE_PATH = 'src/content';
const SUPPORTED_COLLECTIONS = ['books', 'projects', 'lab', 'life', 'pages'];

interface ContentFile {
  filePath: string;
  canonicalId?: string;
  title: string;
  language: string;
  publicationStatus: string;
  draft: boolean;
  isTranslation: boolean;
  translationNeedsReview: boolean;
}

/**
 * Discover all content files
 */
async function discoverContentFiles(): Promise<string[]> {
  const patterns = SUPPORTED_COLLECTIONS.map(collection => 
    `${CONTENT_BASE_PATH}/${collection}/**/*.{md,mdx}`
  );
  
  const allFiles: string[] = [];
  for (const pattern of patterns) {
    const files = await glob(pattern);
    allFiles.push(...files);
  }
  
  return allFiles;
}

/**
 * Parse content file and extract metadata
 */
function parseContentFile(filePath: string): ContentFile | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(raw);
    const frontmatter = parsed.data;

    // Skip files that don't have the expected structure
    if (!frontmatter.title) {
      return null;
    }

    return {
      filePath,
      canonicalId: frontmatter.canonicalId,
      title: frontmatter.title,
      language: frontmatter.language || 'en',
      publicationStatus: frontmatter.publicationStatus || 'draft',
      draft: frontmatter.draft ?? true,
      isTranslation: !!frontmatter.translationOf || !!frontmatter.sourceLanguage,
      translationNeedsReview: frontmatter.status?.review?.translation === false,
    };
  } catch (error) {
    console.warn(`Warning: Could not parse ${filePath}:`, error);
    return null;
  }
}

/**
 * Promote a content file from draft to published
 */
function promoteToPublished(filePath: string): void {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(raw);
    
    // Update frontmatter
    parsed.data.publicationStatus = 'published';
    parsed.data.draft = false;
    
    // Set first publication date if not already set
    if (!parsed.data.firstPublishedAt) {
      parsed.data.firstPublishedAt = new Date().toISOString();
    }
    
    // Update publication date
    parsed.data.publishDate = new Date().toISOString();
    
    // If it's a translation, mark it as reviewed
    if (parsed.data.translationOf || parsed.data.sourceLanguage) {
      parsed.data.status = {
        ...parsed.data.status,
        review: {
          ...parsed.data.status?.review,
          translation: true,
          reviewer: 'human', // Could be made configurable
          reviewDate: new Date().toISOString(),
          notes: 'Reviewed and approved for publication',
        },
      };
    }
    
    // Write back to file
    const newContent = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    
    console.log(`✅ Promoted: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error promoting ${filePath}:`, error);
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const FORCE_ALL = args.includes('--all');
  const TARGET_FILE = args.find(arg => arg.startsWith('--file='))?.split('=')[1];

  console.log('📝 Content Promotion Tool');
  console.log('🔍 Scanning for draft content...\n');

  const contentFiles = await discoverContentFiles();
  const parsedFiles = contentFiles
    .map(parseContentFile)
    .filter((file): file is ContentFile => file !== null);

  // Filter to draft content only
  const draftFiles = parsedFiles.filter(file => 
    file.publicationStatus === 'draft' || file.draft === true
  );

  if (draftFiles.length === 0) {
    console.log('🎉 No draft content found - everything is published!');
    return;
  }

  console.log(`📋 Found ${draftFiles.length} draft content files:\n`);

  // Display draft files
  draftFiles.forEach((file, index) => {
    const statusIndicators = [];
    if (file.isTranslation) statusIndicators.push('🌐 Translation');
    if (file.translationNeedsReview) statusIndicators.push('👀 Needs Review');
    
    console.log(`${index + 1}. ${file.title} (${file.language.toUpperCase()})`);
    console.log(`   Path: ${file.filePath}`);
    if (statusIndicators.length > 0) {
      console.log(`   Status: ${statusIndicators.join(', ')}`);
    }
    console.log('');
  });

  if (TARGET_FILE) {
    // Promote specific file
    const targetFile = draftFiles.find(file => 
      file.filePath.includes(TARGET_FILE) || 
      file.canonicalId === TARGET_FILE
    );
    
    if (targetFile) {
      console.log(`🚀 Promoting specific file: ${targetFile.title}`);
      promoteToPublished(targetFile.filePath);
    } else {
      console.error(`❌ File not found: ${TARGET_FILE}`);
      process.exit(1);
    }
  } else if (FORCE_ALL) {
    // Promote all draft files
    console.log('🚀 Promoting ALL draft content to published status...\n');
    
    draftFiles.forEach(file => {
      promoteToPublished(file.filePath);
    });
    
    console.log(`\n✅ Promoted ${draftFiles.length} files to published status`);
  } else {
    // Interactive mode (would need readline for full implementation)
    console.log('💡 Usage options:');
    console.log('   --all          Promote all draft content');
    console.log('   --file=<path>  Promote specific file');
    console.log('\nExample: npx tsx scripts/utils/promote-content.ts --file=cosensai');
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { promoteToPublished, discoverContentFiles, parseContentFile };
