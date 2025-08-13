#!/usr/bin/env tsx

/**
 * Metadata Change Detection Script
 * 
 * Detects which content files need publish dates, change dates, or other metadata updates
 * during the pre-commit phase. Integrates with the existing content registry system.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import matter from 'gray-matter';

interface MetadataChange {
  filePath: string;
  action: 'first-publish' | 'content-change' | 'status-change' | 'metadata-update';
  currentStatus: 'draft' | 'published' | 'archived';
  previousStatus?: 'draft' | 'published' | 'archived';
  needsPublishDate: boolean;
  needsChangeDate: boolean;
  needsFirstPublishDate: boolean;
  changeDescription: string;
  automated: boolean;
}

/**
 * Get list of staged content files
 */
function getStagedContentFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output
      .split('\n')
      .filter(line => line.trim())
      .filter(file => file.startsWith('src/content/') && (file.endsWith('.md') || file.endsWith('.mdx')))
      .filter(file => fs.existsSync(file)); // Only include files that exist
  } catch (error) {
    console.error('Error getting staged files:', error);
    return [];
  }
}

/**
 * Get the previous version of a file from git
 */
function getPreviousFileContent(filePath: string): string | null {
  try {
    return execSync(`git show HEAD:${filePath}`, { encoding: 'utf8' });
  } catch {
    // File doesn't exist in previous commit (new file)
    return null;
  }
}

/**
 * Parse frontmatter from content
 */
function parseFrontmatter(content: string) {
  try {
    const parsed = matter(content);
    return parsed.data;
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return {};
  }
}

/**
 * Determine if content has significantly changed (not just metadata)
 */
function hasSignificantContentChange(currentContent: string, previousContent: string): boolean {
  if (!previousContent) return true; // New file
  
  const currentMatter = matter(currentContent);
  const previousMatter = matter(previousContent);
  
  // Compare the actual content body
  const currentBody = currentMatter.content.trim();
  const previousBody = previousMatter.content.trim();
  
  if (currentBody !== previousBody) {
    return true;
  }
  
  // Check for significant frontmatter changes (excluding automated metadata)
  const significantFields = ['title', 'description', 'tags', 'language', 'canonicalId'];
  for (const field of significantFields) {
    if (JSON.stringify(currentMatter.data[field]) !== JSON.stringify(previousMatter.data[field])) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect required metadata changes for a file
 */
function detectFileMetadataChanges(filePath: string): MetadataChange | null {
  const currentContent = fs.readFileSync(filePath, 'utf8');
  const previousContent = getPreviousFileContent(filePath);
  
  const currentFrontmatter = parseFrontmatter(currentContent);
  const previousFrontmatter = previousContent ? parseFrontmatter(previousContent) : {};
  
  const currentStatus = currentFrontmatter.publicationStatus || 
                       (currentFrontmatter.draft === false ? 'published' : 'draft');
  const previousStatus = previousFrontmatter.publicationStatus || 
                        (previousFrontmatter.draft === false ? 'published' : 'draft');
  
  let action: MetadataChange['action'] = 'metadata-update';
  let needsPublishDate = false;
  let needsChangeDate = false;
  let needsFirstPublishDate = false;
  let changeDescription = 'Metadata update';
  
  // Detect publication status change (draft -> published)
  if (previousStatus === 'draft' && currentStatus === 'published') {
    action = 'first-publish';
    needsPublishDate = !currentFrontmatter.publishDate;
    needsFirstPublishDate = !currentFrontmatter.firstPublishDate;
    changeDescription = 'Content published for the first time';
  }
  // Detect status change (published -> archived, etc.)
  else if (previousStatus !== currentStatus) {
    action = 'status-change';
    changeDescription = `Status changed from ${previousStatus} to ${currentStatus}`;
    needsChangeDate = true;
  }
  // Detect content changes in published content
  else if (currentStatus === 'published' && hasSignificantContentChange(currentContent, previousContent || '')) {
    action = 'content-change';
    needsChangeDate = true;
    changeDescription = 'Content updated';
  }
  // New file that's being published
  else if (!previousContent && currentStatus === 'published') {
    action = 'first-publish';
    needsPublishDate = !currentFrontmatter.publishDate;
    needsFirstPublishDate = !currentFrontmatter.firstPublishDate;
    changeDescription = 'New content published';
  }
  
  // If no significant changes detected, return null
  if (!needsPublishDate && !needsChangeDate && !needsFirstPublishDate && action === 'metadata-update') {
    return null;
  }
  
  return {
    filePath,
    action,
    currentStatus: currentStatus as 'draft' | 'published' | 'archived',
    previousStatus: previousStatus as 'draft' | 'published' | 'archived',
    needsPublishDate,
    needsChangeDate,
    needsFirstPublishDate,
    changeDescription,
    automated: true
  };
}

/**
 * Main function to detect all metadata changes
 */
async function detectMetadataChanges(): Promise<MetadataChange[]> {
  const stagedFiles = getStagedContentFiles();
  const changes: MetadataChange[] = [];
  
  console.log(`🔍 Checking ${stagedFiles.length} staged content files for metadata changes...`);
  
  for (const filePath of stagedFiles) {
    const change = detectFileMetadataChanges(filePath);
    if (change) {
      changes.push(change);
      console.log(`📝 ${filePath}: ${change.changeDescription}`);
    }
  }
  
  return changes;
}

/**
 * CLI execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  detectMetadataChanges()
    .then(changes => {
      // Output as JSON for consumption by other scripts
      console.log(JSON.stringify(changes, null, 2));
      
      // Also create a simple list for bash processing
      const affectedFiles = changes.map(c => c.filePath);
      if (affectedFiles.length > 0) {
        fs.writeFileSync('metadata-affected-files.txt', affectedFiles.join('\n'));
        console.error(`✅ Detected ${changes.length} files needing metadata updates`);
      } else {
        console.error('ℹ️  No metadata changes needed');
      }
    })
    .catch(error => {
      console.error('❌ Error detecting metadata changes:', error);
      process.exit(1);
    });
}

export { detectMetadataChanges, type MetadataChange };
