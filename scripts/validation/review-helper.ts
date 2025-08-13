#!/usr/bin/env tsx

/**
 * Content Review Helper Script
 * @purpose Help authors mark content as reviewed and ready for publication
 * @dependencies gray-matter, fs, path
 * @usedBy Manual review workflow
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import matter from 'gray-matter';
import path from 'path';

interface ReviewOptions {
  contentReviewed?: boolean;
  translationReviewed?: boolean;
  reviewer?: string;
  notes?: string;
  removeDraft?: boolean;
}

/**
 * Update review status for a content file
 */
function updateReviewStatus(filePath: string, options: ReviewOptions): void {
  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = matter(content);

    // Initialize status object if it doesn't exist
    if (!parsed.data.status) {
      parsed.data.status = {};
    }
    if (!parsed.data.status.review) {
      parsed.data.status.review = {};
    }

    // Update review status
    if (options.contentReviewed !== undefined) {
      parsed.data.status.review.content = options.contentReviewed;
    }
    if (options.translationReviewed !== undefined) {
      parsed.data.status.review.translation = options.translationReviewed;
    }
    if (options.reviewer) {
      parsed.data.status.review.reviewer = options.reviewer;
    }
    if (options.notes) {
      parsed.data.status.review.notes = options.notes;
    }

    // Set review date
    parsed.data.status.review.reviewDate = new Date().toISOString();

    // Remove draft status if requested
    if (options.removeDraft) {
      parsed.data.draft = false;
    }

    // Write updated content
    const updatedContent = matter.stringify(parsed.content, parsed.data);
    writeFileSync(filePath, updatedContent);

    console.log(`✅ Updated review status for: ${path.relative(process.cwd(), filePath)}`);
    console.log(`   Content reviewed: ${parsed.data.status.review.content || false}`);
    console.log(`   Translation reviewed: ${parsed.data.status.review.translation || false}`);
    console.log(`   Reviewer: ${parsed.data.status.review.reviewer || 'not set'}`);
    console.log(`   Draft status: ${parsed.data.draft || false}`);
  } catch (error) {
    console.error(`❌ Failed to update review status for ${filePath}:`, error);
  }
}

/**
 * Mark content as reviewed
 */
function markAsReviewed(filePath: string, reviewer: string, notes?: string): void {
  updateReviewStatus(filePath, {
    contentReviewed: true,
    reviewer,
    notes,
    removeDraft: true,
  });
}

/**
 * Mark translation as reviewed
 */
function markTranslationReviewed(filePath: string, reviewer: string, notes?: string): void {
  updateReviewStatus(filePath, {
    translationReviewed: true,
    reviewer,
    notes,
    removeDraft: true,
  });
}

/**
 * Mark both content and translation as reviewed
 */
function markAllReviewed(filePath: string, reviewer: string, notes?: string): void {
  updateReviewStatus(filePath, {
    contentReviewed: true,
    translationReviewed: true,
    reviewer,
    notes,
    removeDraft: true,
  });
}

/**
 * Show current review status
 */
function showReviewStatus(filePath: string): void {
  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = matter(content);

    console.log(`📄 Review status for: ${path.relative(process.cwd(), filePath)}`);
    console.log(`   Title: ${parsed.data.title || 'untitled'}`);
    console.log(`   Language: ${parsed.data.language || 'unknown'}`);
    console.log(`   Draft: ${parsed.data.draft || false}`);
    console.log(`   Translation of: ${parsed.data.translationOf || 'original content'}`);

    const review = parsed.data.status?.review;
    if (review) {
      console.log(`   Content reviewed: ${review.content || false}`);
      console.log(`   Translation reviewed: ${review.translation || false}`);
      console.log(`   Reviewer: ${review.reviewer || 'not set'}`);
      console.log(`   Review date: ${review.reviewDate || 'not set'}`);
      console.log(`   Notes: ${review.notes || 'none'}`);
    } else {
      console.log(`   ⚠️  No review information found`);
    }

    // Check publication readiness
    const isDraft = parsed.data.draft === true;
    const contentReviewed = review?.content === true;
    const isTranslation = parsed.data.translationOf && parsed.data.sourceLanguage;
    const translationReviewed = review?.translation === true;

    const publishReady = !isDraft && contentReviewed && (!isTranslation || translationReviewed);

    console.log(`   📊 Publication ready: ${publishReady ? '✅ YES' : '❌ NO'}`);

    if (!publishReady) {
      console.log(`   🔧 To make ready for publication:`);
      if (isDraft) console.log(`      • Set draft=false`);
      if (!contentReviewed) console.log(`      • Review content and set status.review.content=true`);
      if (isTranslation && !translationReviewed)
        console.log(`      • Review translation and set status.review.translation=true`);
    }
  } catch (error) {
    console.error(`❌ Failed to read review status for ${filePath}:`, error);
  }
}

/**
 * CLI interface
 */
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Content Review Helper

Usage:
  tsx review-helper.ts <command> <file> [options]

Commands:
  status <file>                    Show current review status
  review <file> <reviewer>         Mark content as reviewed and ready for publication
  review-translation <file> <reviewer>  Mark translation as reviewed
  review-all <file> <reviewer>     Mark both content and translation as reviewed

Options:
  --notes "Review notes"          Add review notes
  --help, -h                      Show this help

Examples:
  tsx review-helper.ts status src/content/books/en/my-book.md
  tsx review-helper.ts review src/content/books/en/my-book.md "john-doe"
  tsx review-helper.ts review-translation src/content/books/de/my-book.md "jane-doe" --notes "Fixed terminology"
  tsx review-helper.ts review-all src/content/lab/en/demo.mdx "reviewer" --notes "Looks good!"
`);
    return;
  }

  const command = args[0];
  const filePath = args[1];
  const reviewer = args[2];
  const notesIndex = args.indexOf('--notes');
  const notes = notesIndex >= 0 && args[notesIndex + 1] ? args[notesIndex + 1] : undefined;

  if (!filePath) {
    console.error('❌ File path is required');
    process.exit(1);
  }

  switch (command) {
    case 'status':
      showReviewStatus(filePath);
      break;

    case 'review':
      if (!reviewer) {
        console.error('❌ Reviewer name is required for review command');
        process.exit(1);
      }
      markAsReviewed(filePath, reviewer, notes);
      break;

    case 'review-translation':
      if (!reviewer) {
        console.error('❌ Reviewer name is required for review-translation command');
        process.exit(1);
      }
      markTranslationReviewed(filePath, reviewer, notes);
      break;

    case 'review-all':
      if (!reviewer) {
        console.error('❌ Reviewer name is required for review-all command');
        process.exit(1);
      }
      markAllReviewed(filePath, reviewer, notes);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.error('Use --help to see available commands');
      process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateReviewStatus, markAsReviewed, markTranslationReviewed, markAllReviewed, showReviewStatus };
