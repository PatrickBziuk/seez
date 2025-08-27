#!/usr/bin/env node

/**
 * One-time script to add missing firstPublishDate and publishDate metadata
 * to all published content files in the workspace
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';

interface FileMetadata {
  filePath: string;
  collection: string;
  slug: string;
  language: string;
  draft: boolean;
  needsFirstPublishDate: boolean;
  needsPublishDate: boolean;
}

async function scanAllContentFiles(): Promise<FileMetadata[]> {
  console.log('🔍 Scanning all content files...');

  const contentPattern = 'src/content/**/*.{md,mdx}';
  const files = await glob(contentPattern, { ignore: ['**/node_modules/**'] });

  const results: FileMetadata[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const { data: frontmatter } = matter(content);

      // Parse collection and slug from path
      const relativePath = path.relative('src/content', file);
      const pathParts = relativePath.split(path.sep);
      const collection = pathParts[0];
      const filename = path.basename(file, path.extname(file));

      results.push({
        filePath: file,
        collection,
        slug: filename,
        language: frontmatter.language || 'en',
        draft: frontmatter.draft === true,
        needsFirstPublishDate: !frontmatter.draft && !frontmatter.firstPublishDate,
        needsPublishDate: !frontmatter.draft && !frontmatter.publishDate,
      });
    } catch (error) {
      console.warn(`⚠️  Failed to parse ${file}:`, error instanceof Error ? error.message : String(error));
    }
  }

  return results;
}

async function addMissingMetadata(files: FileMetadata[]): Promise<void> {
  const publishedFiles = files.filter((f) => !f.draft && (f.needsFirstPublishDate || f.needsPublishDate));

  if (publishedFiles.length === 0) {
    console.log('✅ All published content already has proper metadata');
    return;
  }

  console.log(`📝 Found ${publishedFiles.length} published files needing metadata updates:`);

  const currentTimestamp = new Date().toISOString();

  for (const file of publishedFiles) {
    console.log(`   📄 ${file.filePath}`);

    try {
      const content = fs.readFileSync(file.filePath, 'utf-8');
      const parsed = matter(content);

      let updated = false;

      if (file.needsFirstPublishDate) {
        parsed.data.firstPublishDate = currentTimestamp;
        updated = true;
        console.log(`      ✅ Added firstPublishDate: ${currentTimestamp}`);
      }

      if (file.needsPublishDate) {
        parsed.data.publishDate = currentTimestamp;
        updated = true;
        console.log(`      ✅ Added publishDate: ${currentTimestamp}`);
      }

      if (updated) {
        const updatedContent = matter.stringify(parsed.content, parsed.data);
        fs.writeFileSync(file.filePath, updatedContent, 'utf-8');
        console.log(`      💾 Updated file: ${file.filePath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to update ${file.filePath}:`, error instanceof Error ? error.message : String(error));
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting one-time metadata addition for published content...');

    const files = await scanAllContentFiles();
    console.log(`📊 Found ${files.length} total content files`);

    const publishedFiles = files.filter((f) => !f.draft);
    const draftFiles = files.filter((f) => f.draft);
    console.log(`   📝 Published: ${publishedFiles.length}`);
    console.log(`   📄 Drafts: ${draftFiles.length}`);

    const needingMetadata = publishedFiles.filter((f) => f.needsFirstPublishDate || f.needsPublishDate);
    console.log(`   🏷️  Needing metadata: ${needingMetadata.length}`);

    if (needingMetadata.length > 0) {
      console.log('📋 Files needing metadata updates:');
      needingMetadata.forEach((f) => {
        const missing = [];
        if (f.needsFirstPublishDate) missing.push('firstPublishDate');
        if (f.needsPublishDate) missing.push('publishDate');
        console.log(`   📄 ${f.filePath} (missing: ${missing.join(', ')})`);
      });

      console.log('\n🔄 Starting metadata injection...');
      await addMissingMetadata(files);

      console.log('\n✅ Metadata addition completed!');
      console.log('💡 Remember to review the changes and commit them manually');
    } else {
      console.log('✅ All published content already has proper metadata');
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
