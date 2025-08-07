# Content Validation & Quality Control

This directory contains scripts for validating content structure, schema compliance, and quality control across the entire content ecosystem.

## 📁 Contents

- `test-canonical-seo.ts` - Test canonical URL generation and SEO metadata
- `validate-canonical-registry.js` - JavaScript version of registry validation
- `validate-canonical-registry.ts` - TypeScript registry integrity validation
- `validate-content-precommit.ts` - Pre-commit content validation hook
- `validate-content-precommit-simple.ts` - Simplified pre-commit validation
- `validate-content.ts` - Core content schema and structure validation

## 🚀 Quick Commands

```bash
# Core Validation
pnpm run validate:content      # Validate content schema and structure
pnpm run validate:registry     # Validate content registry integrity
pnpm run validate:seo          # Test SEO and canonical URL generation

# Pre-commit Validation
pnpm run content:precommit     # Full pre-commit validation
npx tsx scripts/validation/validate-content-precommit-simple.ts # Simplified version
```

## ✅ Content Validation

### Schema Validation

Validates all content files against the expected schema:

```typescript
interface ContentSchema {
  title: string; // Required title
  language: 'en' | 'de'; // Content language
  tags: string[]; // Tag array
  canonicalId?: string; // Canonical ID (auto-generated)
  originalLanguage?: string; // For translations
  translationOf?: string; // For translations
  status?: {
    authoring: 'Human' | 'AI' | 'AI+Human';
    translation?: 'Human' | 'AI' | 'AI+Human';
  };
}
```

### Validation Rules

1. **Required Fields**: Title, language, tags must be present
2. **Language Compliance**: Language field must match supported languages
3. **Tag Format**: Tags must be array of strings
4. **Canonical ID Format**: Must follow `slug-YYYYMMDD-hash8` pattern
5. **Translation Relationships**: Proper canonical ID references for translations

### Collection-Specific Rules

Different collections have specific validation requirements:

```typescript
const COLLECTION_RULES = {
  books: {
    requiredFields: ['title', 'language', 'tags'],
    optionalFields: ['description', 'publishDate', 'author'],
  },
  projects: {
    requiredFields: ['title', 'language', 'tags', 'description'],
    optionalFields: ['demo', 'repository', 'technologies'],
  },
  lab: {
    requiredFields: ['title', 'language', 'tags'],
    optionalFields: ['experiment', 'demo'],
  },
  life: {
    requiredFields: ['title', 'language', 'tags'],
    optionalFields: ['mood', 'privacy'],
  },
};
```

## 📋 Registry Validation

### Registry Integrity Checks

Comprehensive validation of the content registry:

1. **Structure Validation**: Correct JSON structure and required fields
2. **Canonical ID Format**: Proper format compliance
3. **Path Consistency**: File paths exist and are accessible
4. **Translation Relationships**: Valid translation references
5. **Duplicate Detection**: No duplicate canonical IDs or conflicting entries

### Registry Validation Report

```typescript
interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  statistics: {
    totalEntries: number;
    validEntries: number;
    entriesWithTranslations: number;
    orphanedTranslations: number;
    missingFiles: number;
  };
}
```

## 🔍 SEO Validation

### Canonical URL Testing

Validates SEO metadata and canonical URL generation:

```typescript
interface SEOValidation {
  canonicalUrl: string;
  hreflangTags: Array<{
    hreflang: string;
    href: string;
  }>;
  structuredData: {
    type: string;
    author: string;
    datePublished?: string;
    dateModified?: string;
  };
  metaTags: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
}
```

### SEO Test Cases

- Canonical URL generation from registry data
- Hreflang tag accuracy for language variants
- Open Graph metadata completeness
- JSON-LD structured data validation
- Meta tag optimization

## 🔧 Pre-commit Validation

### Full Pre-commit Process

The comprehensive pre-commit validation:

1. **Content Scanning**: Scan new/modified content for canonical IDs
2. **Registry Updates**: Update content registry if needed
3. **Schema Validation**: Validate all modified content against schema
4. **Registry Consistency**: Ensure registry integrity after changes
5. **File Staging**: Stage updated files for commit

### Simplified Pre-commit

Lightweight validation for faster commits:

- Basic schema validation
- Canonical ID generation for new content
- Essential registry updates only

### Pre-commit Configuration

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run content validation
pnpm run content:precommit

# Exit with error code if validation fails
if [ $? -ne 0 ]; then
  echo "❌ Content validation failed. Commit aborted."
  exit 1
fi
```

## 📊 Quality Metrics

### Content Quality Scoring

Automated quality assessment:

```typescript
interface QualityMetrics {
  completeness: number; // 0-1: Required fields present
  richness: number; // 0-1: Content depth and detail
  structure: number; // 0-1: Proper markdown structure
  metadata: number; // 0-1: Complete metadata
  translation: number; // 0-1: Translation completeness
  overall: number; // 0-1: Overall quality score
}
```

### Quality Reports

- **Content Completeness**: Missing required fields
- **Metadata Quality**: Incomplete or incorrect metadata
- **Translation Coverage**: Missing translations
- **Structure Issues**: Markdown/MDX formatting problems
- **SEO Optimization**: Missing or suboptimal SEO metadata

## 🧪 Testing & Validation

### Validation Test Suite

```bash
# Run full validation suite
pnpm run validate:content
pnpm run validate:registry
pnpm run validate:seo

# Test specific content
npx tsx scripts/validation/validate-content.ts --file=path/to/content.md

# Validate specific collection
npx tsx scripts/validation/validate-content.ts --collection=books
```

### Continuous Integration

Integration with CI/CD pipeline:

```yaml
# .github/workflows/content-validation.yml
- name: Validate Content
  run: |
    pnpm run validate:content
    pnpm run validate:registry
    pnpm run validate:seo
```

## 📈 Performance

### Validation Performance

- **Speed**: ~150 files per minute
- **Memory**: Efficient streaming validation
- **Scalability**: Handles large content collections

### Optimization Strategies

- Parallel validation for independent files
- Incremental validation for changed content only
- Caching of validation results for unchanged content

## 🐛 Troubleshooting

### Common Validation Errors

**Schema Validation Failures**

```bash
# Common issues:
# - Missing required fields
# - Incorrect data types
# - Invalid language codes
# - Malformed tag arrays

# Fix missing fields
echo "title: Your Title Here" >> content.md
echo "language: en" >> content.md
echo "tags: []" >> content.md
```

**Registry Validation Errors**

```bash
# Registry corruption
pnpm run content:classify  # Rebuild registry

# Path issues
pnpm run content:fix-paths # Fix file paths

# Validation after fixes
pnpm run validate:registry
```

**SEO Validation Issues**

```bash
# Missing canonical IDs
pnpm run content:scan

# Test specific content SEO
npx tsx scripts/validation/test-canonical-seo.ts --canonical-id=your-id
```

### Performance Issues

**Slow Validation**

- Validate specific collections: `--collection=books`
- Use incremental validation for large projects
- Run validation in parallel for independent content

**Memory Usage**

- Process collections separately
- Use streaming validation for large files
- Clear caches between validation runs

## 🔮 Future Enhancements

### Planned Features

- **Real-time Validation**: Live validation during content editing
- **Advanced Quality Metrics**: AI-powered content quality assessment
- **Custom Validation Rules**: Project-specific validation rules
- **Validation Dashboard**: Visual validation status dashboard
- **Automated Fixes**: Auto-correction of common validation issues

### Integration Opportunities

- **Editor Integration**: Real-time validation in content editors
- **CMS Integration**: Validation hooks in content management systems
- **Quality Analytics**: Detailed quality trends and insights
- **Automated Remediation**: AI-powered content improvement suggestions
- **Team Workflows**: Validation workflows for content teams
