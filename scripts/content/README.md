# Content Management & Canonical System

This directory contains scripts for managing content relationships, canonical IDs, and content registry operations.

## 📁 Contents

- `content-sync-manager.ts` - **Primary content lifecycle management tool**
- `analyze-content-relationships.ts` - Analyze content files to identify translation relationships
- `classify-content-relationships.ts` - Classify and update content with canonical IDs
- `content-canonical-simple.ts` - Simplified canonical ID management
- `content-canonical-system.ts` - Full canonical ID and registry management system
- `fix-registry-paths.ts` - Fix and normalize file paths in content registry
- `resolve-content-divergence.ts` - Resolve content divergence cases manually

## 🚀 Quick Commands

### Content Sync Manager (Recommended)

**Primary tool for content lifecycle management**

```bash
# Full sync (recommended after content changes)
pnpm run content:sync

# Individual operations
pnpm run content:sync-scan      # Scan and build content registry
pnpm run content:sync-clean     # Clean up stale dependent files
pnpm run content:sync-regenerate # Regenerate dependent files
```

**Features:**

- ✅ Handles deleted content gracefully
- ✅ Cleans up stale references in generated files
- ✅ Validates content integrity
- ✅ Regenerates dependent data files
- ✅ Maintains content registry with stats

**Use cases:**

- After deleting content files
- Before CI/CD builds
- After major content restructuring
- Regular maintenance tasks

### Canonical System (Legacy)

```bash
# Core Content Operations
pnpm run content:scan           # Scan and update canonical IDs
pnpm run content:validate       # Validate content registry integrity

# Analysis & Classification
pnpm run content:analyze        # Analyze content relationships
pnpm run content:classify       # Classify content and assign canonical IDs

# Maintenance
pnpm run content:fix-paths      # Fix registry file paths
pnpm run content:resolve        # Resolve content divergence issues
```

## 🔗 Canonical ID System

### Overview

The canonical ID system provides permanent, unique identification for all content pieces, enabling robust translation tracking and content relationships.

### Canonical ID Format

```
slug-YYYYMMDD-hash8
```

- **slug**: Derived from content title/filename
- **YYYYMMDD**: Creation date
- **hash8**: 8-character content hash for uniqueness

Example: `programming-guide-20250807-abc12345`

### Content Registry Structure

The content registry (`data/content-registry.json`) tracks all content relationships:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-08-07T10:30:00.000Z",
  "entries": {
    "programming-guide-20250807-abc12345": {
      "canonicalId": "programming-guide-20250807-abc12345",
      "originalPath": "src/content/books/en/programming-guide.md",
      "originalLanguage": "en",
      "title": "Complete Programming Guide",
      "lastModified": "2025-08-07T10:30:00.000Z",
      "contentHash": "sha256hash...",
      "translations": {
        "de": {
          "path": "src/content/books/de/programming-guide.md",
          "status": "current",
          "lastTranslated": "2025-08-07T11:00:00.000Z",
          "translationHash": "sha256hash..."
        }
      }
    }
  }
}
```

## 📊 Content Analysis

### Relationship Detection

The system analyzes content files to detect translation relationships based on:

- **Filename similarity**: Similar slugs across language directories
- **Content length comparison**: Word count and content richness analysis
- **Manual classification**: Human review for ambiguous cases

### Classification Workflow

1. **Scan**: Discover all content files across collections
2. **Group**: Group files by similar slugs/titles
3. **Analyze**: Compare content to determine original vs translation
4. **Classify**: Assign canonical IDs and update registry
5. **Validate**: Ensure registry integrity and consistency

## 🔧 Core Operations

### Canonical ID Management

```typescript
// Generate new canonical ID
function generateCanonicalId(filePath: string, content: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const hash = crypto
    .createHash('sha256')
    .update(filePath + content)
    .digest('hex')
    .substring(0, 8);
  return `slug-${date}-${hash}`;
}
```

### Content Scanning

The scan operation:

1. Discovers all content files in collections
2. Parses frontmatter and content
3. Generates or validates canonical IDs
4. Updates content registry
5. Modifies frontmatter if needed

### Registry Validation

Validates registry integrity:

- Canonical ID format compliance
- File path existence and consistency
- Translation relationship integrity
- Duplicate detection and resolution

## 📝 Frontmatter Integration

### Original Content

```yaml
---
title: 'Complete Programming Guide'
canonicalId: 'programming-guide-20250807-abc12345'
originalLanguage: 'en'
language: 'en'
tags: ['programming', 'guide', 'tutorial']
---
```

### Translated Content

```yaml
---
title: 'Vollständiger Programmierungsleitfaden'
canonicalId: 'programming-guide-20250807-abc12345'
translationOf: 'programming-guide-20250807-abc12345'
sourceLanguage: 'en'
language: 'de'
tags: ['programmierung', 'anleitung', 'tutorial']
---
```

## 🛠️ Maintenance Operations

### Path Fixing

Normalizes file paths in the registry:

- Ensures consistent `src/content/` prefixes
- Converts backslashes to forward slashes
- Updates both original and translation paths

### Divergence Resolution

Handles cases where content has diverged:

- Identifies content with same canonical ID but different content
- Provides tools for manual resolution
- Updates registry with resolved relationships

### Registry Backup

Automatic backup before major operations:

- Creates timestamped backups
- Validates backup integrity
- Provides rollback capabilities

## 🧪 Testing & Validation

### Registry Integrity Tests

```bash
# Validate registry structure
npx tsx scripts/validation/validate-canonical-registry.ts

# Test canonical URL generation
npx tsx scripts/validation/test-canonical-seo.ts

# Analyze content relationships
pnpm run content:analyze
```

### Pre-commit Validation

Automated validation before commits:

- Scans new/modified content for canonical IDs
- Updates registry if needed
- Validates registry consistency
- Stages updated files automatically

## 📈 Performance

### Scanning Performance

- **Speed**: ~200 files per minute
- **Memory**: Efficient streaming processing
- **Storage**: Incremental registry updates

### Registry Operations

- **Lookup**: O(1) canonical ID lookup
- **Validation**: O(n) full registry validation
- **Updates**: Atomic operations with backup

## 🐛 Troubleshooting

### Common Issues

**Missing Canonical IDs**

```bash
# Scan and generate missing IDs
pnpm run content:scan

# Check specific content
npx tsx scripts/content/content-canonical-system.ts scan --verbose
```

**Registry Corruption**

```bash
# Validate registry
pnpm run content:validate

# Rebuild from content
pnpm run content:classify
```

**Path Issues**

```bash
# Fix registry paths
pnpm run content:fix-paths

# Validate after fixing
pnpm run content:validate
```

### Performance Issues

**Large Content Collections**

- Use streaming processing for large files
- Process collections incrementally
- Monitor memory usage during operations

**Registry Size**

- Registry grows with content volume
- Consider archiving old entries
- Optimize lookup structures for large registries

## 🔮 Future Enhancements

### Planned Features

- **Automated Conflict Resolution**: Smart handling of content divergence
- **Version History**: Track content changes over time
- **Cross-Collection Links**: Detect relationships across content types
- **Registry Optimization**: Advanced indexing and compression
- **Real-time Sync**: Live registry updates during content editing

### Integration Opportunities

- **CMS Integration**: Direct connection to content management systems
- **Git Hooks**: Enhanced pre-commit and post-commit processing
- **Analytics**: Content relationship and usage analytics
- **API**: RESTful API for external content management tools
