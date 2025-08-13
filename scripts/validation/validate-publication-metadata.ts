#!/usr/bin/env tsx

/**
 * Publication Metadata Validation Script
 *
 * Validates the consistency and integrity of publication metadata across all content files.
 * Ensures proper publication workflow and metadata relationships.
 */

import fs from 'fs';
import matter from 'gray-matter';
import { glob } from 'glob';

interface ValidationError {
  file: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

interface PublicationMetadata {
  publishDate?: Date;
  firstPublishDate?: Date;
  lastChangeDate?: Date;
  modifiedDate?: Date;
  publicationStatus?: 'draft' | 'published' | 'archived';
  changeLog?: Array<{
    date: string;
    description: string;
    author?: string;
    type: 'content' | 'metadata' | 'structure' | 'translation';
    automated: boolean;
  }>;
  draft?: boolean;
}

/**
 * Parse and validate a single content file
 */
function validateFile(filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(content);
    const frontmatter = parsed.data as PublicationMetadata;

    // Basic metadata validation
    validatePublicationStatus(filePath, frontmatter, errors);
    validateDateConsistency(filePath, frontmatter, errors);
    validateChangeLog(filePath, frontmatter, errors);
    validatePublicationWorkflow(filePath, frontmatter, errors);
  } catch (error) {
    errors.push({
      file: filePath,
      severity: 'error',
      message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return errors;
}

/**
 * Validate publication status consistency
 */
function validatePublicationStatus(filePath: string, frontmatter: PublicationMetadata, errors: ValidationError[]) {
  const { publicationStatus, draft, publishDate, firstPublishDate } = frontmatter;

  // Check for conflicting draft/publication status
  if (draft === false && publicationStatus === 'draft') {
    errors.push({
      file: filePath,
      severity: 'error',
      message: 'Conflicting status: draft=false but publicationStatus=draft',
      field: 'publicationStatus',
    });
  }

  if (draft === true && publicationStatus === 'published') {
    errors.push({
      file: filePath,
      severity: 'error',
      message: 'Conflicting status: draft=true but publicationStatus=published',
      field: 'publicationStatus',
    });
  }

  // Published content should have publication dates
  if (publicationStatus === 'published' || draft === false) {
    if (!publishDate && !firstPublishDate) {
      errors.push({
        file: filePath,
        severity: 'warning',
        message: 'Published content missing publication date',
        field: 'publishDate',
      });
    }
  }

  // Draft content should not have publication dates
  if (publicationStatus === 'draft' || draft === true) {
    if (publishDate || firstPublishDate) {
      errors.push({
        file: filePath,
        severity: 'warning',
        message: 'Draft content has publication date',
        field: 'publishDate',
      });
    }
  }
}

/**
 * Validate date consistency and relationships
 */
function validateDateConsistency(filePath: string, frontmatter: PublicationMetadata, errors: ValidationError[]) {
  const { publishDate, firstPublishDate, lastChangeDate, modifiedDate } = frontmatter;

  // Convert to Date objects for comparison
  const pubDate = publishDate ? new Date(publishDate) : null;
  const firstPubDate = firstPublishDate ? new Date(firstPublishDate) : null;
  const changeDate = lastChangeDate ? new Date(lastChangeDate) : null;

  // firstPublishDate should be the earliest or equal to publishDate
  if (firstPubDate && pubDate && firstPubDate > pubDate) {
    errors.push({
      file: filePath,
      severity: 'error',
      message: 'firstPublishDate cannot be later than publishDate',
      field: 'firstPublishDate',
    });
  }

  // lastChangeDate should be after or equal to publication dates
  if (changeDate) {
    if (firstPubDate && changeDate < firstPubDate) {
      errors.push({
        file: filePath,
        severity: 'error',
        message: 'lastChangeDate cannot be before firstPublishDate',
        field: 'lastChangeDate',
      });
    }

    if (pubDate && changeDate < pubDate) {
      errors.push({
        file: filePath,
        severity: 'error',
        message: 'lastChangeDate cannot be before publishDate',
        field: 'lastChangeDate',
      });
    }
  }

  // Validate date formats
  [
    { date: publishDate, field: 'publishDate' },
    { date: firstPublishDate, field: 'firstPublishDate' },
    { date: lastChangeDate, field: 'lastChangeDate' },
    { date: modifiedDate, field: 'modifiedDate' },
  ].forEach(({ date, field }) => {
    if (date && isNaN(new Date(date).getTime())) {
      errors.push({
        file: filePath,
        severity: 'error',
        message: `Invalid date format in ${field}`,
        field,
      });
    }
  });
}

/**
 * Validate change log integrity
 */
function validateChangeLog(filePath: string, frontmatter: PublicationMetadata, errors: ValidationError[]) {
  const { changeLog, lastChangeDate } = frontmatter;

  if (!changeLog || changeLog.length === 0) return;

  // Validate change log entries
  changeLog.forEach((entry, index) => {
    if (!entry.date) {
      errors.push({
        file: filePath,
        severity: 'error',
        message: `Change log entry ${index + 1} missing date`,
        field: 'changeLog',
      });
    }

    if (!entry.description) {
      errors.push({
        file: filePath,
        severity: 'error',
        message: `Change log entry ${index + 1} missing description`,
        field: 'changeLog',
      });
    }

    if (entry.date && isNaN(new Date(entry.date).getTime())) {
      errors.push({
        file: filePath,
        severity: 'error',
        message: `Change log entry ${index + 1} has invalid date format`,
        field: 'changeLog',
      });
    }
  });

  // Check if lastChangeDate matches latest change log entry
  if (lastChangeDate && changeLog.length > 0) {
    const latestChange = changeLog[changeLog.length - 1];
    const changeLogDate = new Date(latestChange.date);
    const lastChange = new Date(lastChangeDate);

    if (Math.abs(changeLogDate.getTime() - lastChange.getTime()) > 60000) {
      // Allow 1 minute difference
      errors.push({
        file: filePath,
        severity: 'warning',
        message: 'lastChangeDate does not match latest change log entry',
        field: 'lastChangeDate',
      });
    }
  }
}

/**
 * Validate publication workflow rules
 */
function validatePublicationWorkflow(filePath: string, frontmatter: PublicationMetadata, errors: ValidationError[]) {
  const { publicationStatus, changeLog } = frontmatter;

  // Archived content should have been published first
  if (publicationStatus === 'archived') {
    const hasPublishedEntry = changeLog?.some(
      (entry) => entry.description.toLowerCase().includes('publish') || entry.type === 'metadata'
    );

    if (!hasPublishedEntry) {
      errors.push({
        file: filePath,
        severity: 'warning',
        message: 'Archived content should have publication history in change log',
        field: 'changeLog',
      });
    }
  }

  // Published content should have appropriate change log entries
  if (publicationStatus === 'published' && changeLog && changeLog.length > 0) {
    const hasContentChanges = changeLog.some((entry) => entry.type === 'content');
    const hasPublishEntry = changeLog.some(
      (entry) =>
        entry.description.toLowerCase().includes('publish') || entry.description.toLowerCase().includes('first')
    );

    if (hasContentChanges && !hasPublishEntry) {
      errors.push({
        file: filePath,
        severity: 'info',
        message: 'Published content with changes might be missing initial publication entry',
        field: 'changeLog',
      });
    }
  }
}

/**
 * Main validation function
 */
async function validatePublicationMetadata(): Promise<ValidationError[]> {
  const contentPattern = 'src/content/**/*.{md,mdx}';
  const files = glob.sync(contentPattern);

  console.log(`🔍 Validating publication metadata for ${files.length} content files...`);

  const allErrors: ValidationError[] = [];

  for (const file of files) {
    const fileErrors = validateFile(file);
    allErrors.push(...fileErrors);
  }

  return allErrors;
}

/**
 * Generate validation report
 */
function generateReport(errors: ValidationError[]) {
  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;
  const infoCount = errors.filter((e) => e.severity === 'info').length;

  console.log(`\n📊 Validation Results:`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Warnings: ${warningCount}`);
  console.log(`   Info: ${infoCount}`);

  if (errors.length === 0) {
    console.log('✅ All publication metadata is valid!');
    return;
  }

  // Group errors by file
  const errorsByFile = errors.reduce(
    (acc, error) => {
      if (!acc[error.file]) acc[error.file] = [];
      acc[error.file].push(error);
      return acc;
    },
    {} as Record<string, ValidationError[]>
  );

  console.log('\n📋 Issues Found:');

  Object.entries(errorsByFile).forEach(([file, fileErrors]) => {
    console.log(`\n📄 ${file}:`);
    fileErrors.forEach((error) => {
      const icon = error.severity === 'error' ? '❌' : error.severity === 'warning' ? '⚠️' : 'ℹ️';
      const field = error.field ? ` [${error.field}]` : '';
      console.log(`   ${icon} ${error.message}${field}`);
    });
  });
}

/**
 * CLI execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  validatePublicationMetadata()
    .then((errors) => {
      generateReport(errors);

      // Exit with error code if there are validation errors
      const hasErrors = errors.some((e) => e.severity === 'error');
      process.exit(hasErrors ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export { validatePublicationMetadata, type ValidationError };
