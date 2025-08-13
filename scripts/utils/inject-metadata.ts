#!/usr/bin/env tsx

/**
 * Metadata Injection Script
 * 
 * Automatically injects publish dates, change dates, and other metadata into content files
 * based on the output from detect-metadata-changes.ts
 */

import fs from 'fs';
import matter from 'gray-matter';
import { execSync } from 'child_process';
import { detectMetadataChanges, type MetadataChange } from './detect-metadata-changes.js';

interface ChangeLogEntry {
  date: string;
  description: string;
  author?: string;
  type: 'content' | 'metadata' | 'structure' | 'translation';
  automated: boolean;
}

/**
 * Get current Git user for attribution
 */
function getGitUser(): string {
  try {
    const gitUser = execSync('git config user.name', { encoding: 'utf8' }).trim();
    return gitUser || 'automated';
  } catch {
    return 'automated';
  }
}

/**
 * Generate current ISO timestamp
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Add or update metadata in frontmatter
 */
function updateFrontmatter(content: string, changes: MetadataChange): string {
  const parsed = matter(content);
  const frontmatter = parsed.data;
  const currentTime = getCurrentTimestamp();
  const gitUser = getGitUser();
  
  let updated = false;
  
  // Add publishDate for first publication
  if (changes.needsPublishDate && !frontmatter.publishDate) {
    frontmatter.publishDate = currentTime;
    updated = true;
  }
  
  // Add firstPublishDate for first publication (never changes)
  if (changes.needsFirstPublishDate && !frontmatter.firstPublishDate) {
    frontmatter.firstPublishDate = frontmatter.publishDate || currentTime;
    updated = true;
  }
  
  // Update lastChangeDate for content changes
  if (changes.needsChangeDate) {
    frontmatter.lastChangeDate = currentTime;
    updated = true;
  }
  
  // Ensure publicationStatus is set correctly
  if (changes.currentStatus && frontmatter.publicationStatus !== changes.currentStatus) {
    frontmatter.publicationStatus = changes.currentStatus;
    updated = true;
  }
  
  // Add to change log
  if (updated) {
    const changeLogEntry: ChangeLogEntry = {
      date: currentTime,
      description: changes.changeDescription,
      author: gitUser,
      type: getChangeType(changes.action),
      automated: changes.automated
    };
    
    if (!frontmatter.changeLog) {
      frontmatter.changeLog = [];
    }
    
    frontmatter.changeLog.push(changeLogEntry);
    
    // Keep only last 10 entries to avoid bloat
    if (frontmatter.changeLog.length > 10) {
      frontmatter.changeLog = frontmatter.changeLog.slice(-10);
    }
  }
  
  if (!updated) {
    return content; // No changes needed
  }
  
  // Reconstruct the file with updated frontmatter
  return matter.stringify(parsed.content, frontmatter);
}

/**
 * Map action to change log type
 */
function getChangeType(action: MetadataChange['action']): ChangeLogEntry['type'] {
  switch (action) {
    case 'first-publish':
    case 'status-change':
      return 'metadata';
    case 'content-change':
      return 'content';
    case 'metadata-update':
      return 'metadata';
    default:
      return 'content';
  }
}

/**
 * Process a single file
 */
function processFile(change: MetadataChange): boolean {
  try {
    const originalContent = fs.readFileSync(change.filePath, 'utf8');
    const updatedContent = updateFrontmatter(originalContent, change);
    
    if (updatedContent !== originalContent) {
      fs.writeFileSync(change.filePath, updatedContent, 'utf8');
      console.log(`✅ Updated metadata for: ${change.filePath}`);
      console.log(`   Action: ${change.action}`);
      console.log(`   Status: ${change.currentStatus}`);
      console.log(`   Description: ${change.changeDescription}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed for: ${change.filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${change.filePath}:`, error);
    return false;
  }
}

/**
 * Main function to inject metadata into all affected files
 */
async function injectMetadata(changes?: MetadataChange[]): Promise<string[]> {
  // If no changes provided, detect them
  if (!changes) {
    changes = await detectMetadataChanges();
  }
  
  if (changes.length === 0) {
    console.log('ℹ️  No files need metadata updates');
    return [];
  }
  
  console.log(`📝 Processing ${changes.length} files for metadata injection...`);
  
  const updatedFiles: string[] = [];
  
  for (const change of changes) {
    const wasUpdated = processFile(change);
    if (wasUpdated) {
      updatedFiles.push(change.filePath);
    }
  }
  
  console.log(`✅ Updated metadata for ${updatedFiles.length} files`);
  
  // Write list of updated files for pre-commit hook consumption
  if (updatedFiles.length > 0) {
    fs.writeFileSync('updated-files.txt', updatedFiles.join('\n'));
  }
  
  return updatedFiles;
}

/**
 * CLI execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check if changes are provided via stdin or file
  let inputChanges: MetadataChange[] | undefined;
  
  // Try to read from metadata-changes.json if it exists
  if (fs.existsSync('metadata-changes.json')) {
    try {
      const changesData = fs.readFileSync('metadata-changes.json', 'utf8');
      inputChanges = JSON.parse(changesData);
      if (inputChanges) {
        console.log(`📋 Using changes from metadata-changes.json (${inputChanges.length} changes)`);
      }
    } catch (error) {
      console.error('⚠️  Error reading metadata-changes.json:', error);
    }
  }
  
  injectMetadata(inputChanges)
    .then(updatedFiles => {
      if (updatedFiles.length > 0) {
        console.log('\n📋 Summary of updated files:');
        updatedFiles.forEach(file => console.log(`  - ${file}`));
        
        console.log('\n💡 These files have been updated with metadata and should be added to the commit.');
        process.exit(0);
      } else {
        console.log('✅ No files required metadata updates');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Error injecting metadata:', error);
      process.exit(1);
    });
}

export { injectMetadata, updateFrontmatter };
