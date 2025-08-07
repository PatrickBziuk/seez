/**
 * Content Migration Script for multilanguage metadata & badges
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../src/content');
const BACKUP_DIR = path.join(__dirname, '../content-backup');
const COLLECTIONS = ['books', 'projects', 'lab', 'life'];

const DEFAULT_METADATA = {
  language: 'en',
  status: { authoring: 'Human' },
};

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function log(msg, color = 'reset') {
  const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[color] || ''}${msg}${colors.reset}`);
}

function backupContent() {
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp()}`);
  fs.mkdirSync(backupPath, { recursive: true });
  fs.cpSync(CONTENT_DIR, backupPath, { recursive: true });
  // Verify backup integrity
  const backupExists = fs.existsSync(backupPath);
  if (backupExists) {
    log(`Backup created at ${backupPath}`, 'green');
  } else {
    log(`Backup failed at ${backupPath}`, 'red');
  }
}

function validateFrontmatter(data) {
  const errors = [];
  if (!data.title) errors.push('Missing title');
  if (!data.tags || !Array.isArray(data.tags)) errors.push('Missing or invalid tags');
  if (!data.language || !['en', 'de'].includes(data.language)) errors.push('Invalid language');
  if (data.status && data.status.authoring && !['Human', 'AI', 'AI+Human'].includes(data.status.authoring))
    errors.push('Invalid authoring status');
  if (data.status && data.status.translation && !['Human', 'AI', 'AI+Human'].includes(data.status.translation))
    errors.push('Invalid translation status');
  return errors;
}

function migrateFile(filePath, dryRun = false) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  // Merge defaults
  const newData = { ...DEFAULT_METADATA, ...data };
  if (!newData.status) newData.status = { authoring: 'Human' };
  const errors = validateFrontmatter(newData);
  if (errors.length) {
    log(`Validation errors in ${filePath}: ${errors.join(', ')}`, 'red');
    return { updated: false, errors };
  }
  const newRaw = matter.stringify(content, newData);
  if (dryRun) {
    log(`--- ${filePath} ---`, 'yellow');
    log('Before:', 'blue');
    log(JSON.stringify(data, null, 2), 'reset');
    log('After:', 'blue');
    log(JSON.stringify(newData, null, 2), 'reset');
    log('Status: VALID', 'green');
  } else {
    fs.writeFileSync(filePath, newRaw, 'utf8');
    log(`${filePath} updated.`, 'green');
  }
  return { updated: true, errors: [] };
}

function migrateCollection(collection, dryRun = false) {
  const dir = path.join(CONTENT_DIR, collection);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  let processed = 0,
    updated = 0,
    errors = [];
  for (const file of files) {
    processed++;
    const result = migrateFile(path.join(dir, file), dryRun);
    if (result.updated) updated++;
    if (result.errors.length) errors.push({ file, errors: result.errors });
  }
  log(`Collection ${collection}: ${updated}/${processed} files processed.`, 'green');
  if (errors.length) {
    log(`Errors in ${collection}:`, 'red');
    errors.forEach((e) => log(`${e.file}: ${e.errors.join(', ')}`, 'red'));
  }
  return { processed, updated, errors };
}

function migrateContent(dryRun = false) {
  log('🚀 Starting content migration...', 'blue');
  if (!dryRun) backupContent();
  let totalProcessed = 0,
    totalUpdated = 0,
    allErrors = [];
  for (const collection of COLLECTIONS) {
    const { processed, updated, errors } = migrateCollection(collection, dryRun);
    totalProcessed += processed;
    totalUpdated += updated;
    allErrors = allErrors.concat(errors);
  }
  log(`Migration complete. ${totalUpdated}/${totalProcessed} files updated.`, 'blue');
  if (allErrors.length) {
    log('Summary of errors:', 'red');
    allErrors.forEach((e) => log(`${e.file}: ${e.errors.join(', ')}`, 'red'));
  }
}

const dryRun = process.argv.includes('--dry-run');
migrateContent(dryRun);
