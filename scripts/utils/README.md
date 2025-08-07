# General Utilities & Maintenance

This directory contains utility scripts for maintenance operations, data migration, and general project utilities.

## 📁 Contents

- `extract-error.js` - Extract error messages from build logs for CI issue reporting
- `extract-git-metadata.ts` - Extract Git commit metadata for content publish/modified dates
- `migrate-content.js` - Migrate content between schema versions with backup

## 🚀 Quick Commands

```bash
# Git Metadata Extraction
pnpm run extract:git-metadata   # Extract Git metadata for all content

# Content Migration
npx tsx scripts/utils/migrate-content.js           # Migrate with preview
npx tsx scripts/utils/migrate-content.js --apply   # Apply migration

# Error Extraction (CI/CD)
node scripts/utils/extract-error.js build.log      # Extract errors from log
```

## 📅 Git Metadata Extraction

### Overview

Extracts Git commit information to automatically determine publish and modified dates for content files.

### Features

- **Publish Date**: First commit date for each content file
- **Modified Date**: Last commit date for each content file
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Follow History**: Tracks file renames and moves
- **Batch Processing**: Processes all content files efficiently

### Generated Metadata Structure

```json
{
  "src/content/books/en/programming-guide.md": {
    "publishDate": "2025-01-15T10:30:00.000Z",
    "modifiedDate": "2025-08-07T14:22:00.000Z"
  },
  "src/content/projects/de/portfolio-website.md": {
    "publishDate": "2025-03-22T08:15:00.000Z",
    "modifiedDate": "2025-07-30T16:45:00.000Z"
  }
}
```

### Integration with Layouts

Automatically used in content layouts for SEO metadata:

```astro
---
// src/layouts/MarkdownLayout.astro
import gitMetadata from '../generated/git-metadata.json';

const filePath = `src/content/${entry.collection}/${entry.id}`;
const gitData = gitMetadata[filePath];

const publishDate = frontmatter.publishDate || (gitData?.publishDate ? new Date(gitData.publishDate) : undefined);
const modifiedDate = frontmatter.modifiedDate || (gitData?.modifiedDate ? new Date(gitData.modifiedDate) : undefined);
---

<SEO {publishDate} {modifiedDate} {/* other props */} />
```

## 📦 Content Migration

### Overview

Safely migrates content between different schema versions with comprehensive backup and validation.

### Migration Features

- **Automatic Backup**: Creates timestamped backups before migration
- **Dry Run Mode**: Preview changes without applying them
- **Schema Validation**: Validates content against new schema
- **Rollback Support**: Easy rollback to previous version
- **Progress Tracking**: Detailed migration progress and statistics

### Migration Process

1. **Backup Creation**: Creates complete backup of existing content
2. **Schema Analysis**: Analyzes current content structure
3. **Migration Planning**: Plans required changes for each file
4. **Dry Run Validation**: Shows what would be changed
5. **Migration Execution**: Applies changes with validation
6. **Post-Migration Validation**: Ensures migration success

### Migration Types

```typescript
interface MigrationOperation {
  type: 'add' | 'update' | 'remove' | 'rename';
  field: string;
  oldValue?: any;
  newValue?: any;
  reason: string;
}
```

### Example Migration

```bash
# Preview migration changes
npx tsx scripts/utils/migrate-content.js --dry-run

# Apply migration
npx tsx scripts/utils/migrate-content.js --apply

# Migration output:
# ✅ Migrated 45 files
# ⚠️  3 files had warnings
# ❌ 0 files failed migration
# 📁 Backup created at: content-backup/backup-20250807-143022
```

## ⚠️ Error Extraction (CI/CD)

### Overview

Extracts meaningful error information from build logs for automated issue reporting in CI/CD pipelines.

### Features

- **Error Pattern Matching**: Recognizes common error patterns
- **File/Line Detection**: Extracts file names and line numbers
- **Context Preservation**: Maintains relevant error context
- **Multiple Format Support**: Handles various build tool outputs

### Supported Error Types

- Astro build errors
- TypeScript compilation errors
- Vite bundling errors
- Node.js runtime errors
- Custom script errors

### Usage in CI/CD

```yaml
# .github/workflows/build.yml
- name: Build Project
  id: build
  run: pnpm run build 2>&1 | tee build.log
  continue-on-error: true

- name: Extract Build Errors
  if: steps.build.outcome == 'failure'
  run: |
    node scripts/utils/extract-error.js build.log > error-summary.txt

- name: Create Issue on Build Failure
  if: steps.build.outcome == 'failure'
  uses: actions/github-script@v6
  with:
    script: |
      const fs = require('fs');
      const errorSummary = fs.readFileSync('error-summary.txt', 'utf8');

      await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: 'Build Failed - Automated Report',
        body: `## Build Error Report\n\n\`\`\`\n${errorSummary}\n\`\`\``,
        labels: ['bug', 'build-failure', 'automated']
      });
```

## 🔧 Configuration

### Git Metadata Configuration

```typescript
const GIT_CONFIG = {
  contentGlob: 'src/content/**/*.{md,mdx}',
  outputPath: 'src/generated/git-metadata.json',
  followRenames: true,
  includeBackups: false,
};
```

### Migration Configuration

```typescript
const MIGRATION_CONFIG = {
  backupDir: 'content-backup',
  dryRunByDefault: true,
  validateAfterMigration: true,
  rollbackOnFailure: true,
};
```

### Error Extraction Configuration

```typescript
const ERROR_CONFIG = {
  maxLogLines: 10,
  contextLines: 3,
  includeStackTrace: true,
  errorPatterns: [/Error: (.*)/, /TypeError: (.*)/, /SyntaxError: (.*)/],
};
```

## 📊 Performance

### Git Metadata Extraction

- **Speed**: ~50 files per minute (depends on Git history)
- **Memory**: Efficient streaming processing
- **Git Operations**: Optimized Git commands for minimal overhead

### Content Migration

- **Speed**: ~100 files per minute
- **Safety**: Comprehensive backup and validation
- **Memory**: Processes files individually to minimize memory usage

### Error Extraction

- **Speed**: Near-instantaneous for typical log files
- **Memory**: Streams large log files efficiently
- **Pattern Matching**: Optimized regex patterns for common errors

## 🧪 Testing

### Git Metadata Testing

```bash
# Test on specific files
npx tsx scripts/utils/extract-git-metadata.ts --files="src/content/books/en/*.md"

# Validate output
npx tsx scripts/validation/validate-git-metadata.ts
```

### Migration Testing

```bash
# Test migration without applying
npx tsx scripts/utils/migrate-content.js --dry-run --verbose

# Test on specific collection
npx tsx scripts/utils/migrate-content.js --collection=books --dry-run
```

### Error Extraction Testing

```bash
# Test with sample error log
echo "Error: Test error message" > test.log
node scripts/utils/extract-error.js test.log
```

## 🐛 Troubleshooting

### Git Metadata Issues

**Missing Git History**

```bash
# Ensure Git history is available
git log --oneline | head -5

# Check for renamed files
git log --follow --oneline -- src/content/books/en/example.md
```

**Permission Issues**

```bash
# Ensure read access to Git repository
ls -la .git/

# Check Git configuration
git config --list
```

### Migration Issues

**Backup Failures**

```bash
# Check disk space
df -h

# Verify backup directory permissions
mkdir -p content-backup
chmod 755 content-backup
```

**Schema Validation Errors**

```bash
# Run content validation first
pnpm run validate:content

# Fix validation errors before migration
npx tsx scripts/validation/validate-content.ts --fix
```

### Error Extraction Issues

**Empty Error Output**

```bash
# Check log file exists and has content
ls -la build.log
head -10 build.log

# Test with verbose output
node scripts/utils/extract-error.js build.log --verbose
```

## 🔮 Future Enhancements

### Planned Features

**Git Metadata**

- **Performance Optimization**: Parallel Git operations for faster processing
- **Advanced Metadata**: Extract author information, commit messages
- **Change Detection**: Track significant content changes vs minor edits
- **Branch Support**: Extract metadata from specific branches

**Content Migration**

- **Schema Versioning**: Automated schema version detection and migration
- **Rollback Improvements**: Point-in-time rollback capabilities
- **Migration Scripts**: Custom migration scripts for complex transformations
- **Validation Enhancement**: More sophisticated post-migration validation

**Error Extraction**

- **Intelligent Parsing**: AI-powered error analysis and categorization
- **Solution Suggestions**: Automatic suggestions for common errors
- **Error Aggregation**: Group similar errors across multiple builds
- **Integration Enhancement**: Better integration with monitoring tools

### Integration Opportunities

- **Monitoring Integration**: Connect with application monitoring systems
- **Analytics**: Detailed insights into content evolution and error patterns
- **Automation**: Fully automated migration pipelines
- **Notification Systems**: Real-time alerts for migration and error events
