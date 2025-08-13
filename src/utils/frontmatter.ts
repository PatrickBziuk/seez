import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import type { RehypePlugin, RemarkPlugin } from '@astrojs/markdown-remark';
import { getWordCount, getReadingTime as getReadingTimeUtil } from './reading-stats';
import { execSync } from 'child_process';
import fs from 'fs';

export const readingTimeRemarkPlugin: RemarkPlugin = () => {
  return function (tree, file) {
    const textOnPage = toString(tree);

    // Use existing reading-time library for backward compatibility
    const readingTime = Math.ceil(getReadingTime(textOnPage).minutes);

    // Add word count using our utility function
    const wordCount = getWordCount(textOnPage);

    // Also calculate reading time using our utility for more detailed info
    const readingTimeDetails = getReadingTimeUtil(wordCount);

    if (typeof file?.data?.astro?.frontmatter !== 'undefined') {
      file.data.astro.frontmatter.readingTime = readingTime;
      file.data.astro.frontmatter.wordCount = wordCount;
      file.data.astro.frontmatter.readingMinutes = readingTimeDetails.minutes;
      file.data.astro.frontmatter.readingFormatted = readingTimeDetails.formatted;
    }
  };
};

/**
 * Gets the last modified date from Git log for a file
 */
function getGitLastModified(filePath: string): Date | null {
  try {
    // Get the last commit date for this file
    const gitCommand = `git log -1 --format=%cI "${filePath}"`;
    const result = execSync(gitCommand, {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
    }).trim();

    if (result) {
      return new Date(result);
    }
  } catch {
    // Git command failed, fallback to filesystem mtime
  }

  return null;
}

/**
 * Gets filesystem modification time as fallback
 */
function getFilesystemModified(filePath: string): Date | null {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch {
    return null;
  }
}

export const remarkModifiedTime: RemarkPlugin = () => {
  return function (tree, file) {
    if (!file.history || file.history.length === 0) return;

    const filePath = file.history[0];
    if (!filePath) return;

    // Try to get last modified from Git first
    let lastModified = getGitLastModified(filePath);

    // Fallback to filesystem mtime if Git fails
    if (!lastModified) {
      lastModified = getFilesystemModified(filePath);
    }

    if (lastModified && typeof file?.data?.astro?.frontmatter !== 'undefined') {
      file.data.astro.frontmatter.lastModified = lastModified.toISOString();
    }
  };
};

export const responsiveTablesRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    if (!tree.children) return;

    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i];

      if (child.type === 'element' && child.tagName === 'table') {
        tree.children[i] = {
          type: 'element',
          tagName: 'div',
          properties: {
            style: 'overflow:auto',
          },
          children: [child],
        };

        i++;
      }
    }
  };
};

export const lazyImagesRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    if (!tree.children) return;

    visit(tree, 'element', function (node) {
      if (node.tagName === 'img') {
        node.properties.loading = 'lazy';
      }
    });
  };
};
