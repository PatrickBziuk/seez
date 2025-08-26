# Environment-Dependent Content System Implementation Guide

**Date**: August 16, 2025  
**Status**: Implemented  
**Related Plans**: plan-10036-Repository-overhaul.md

## Overview

This guide documents the implementation of an environment-dependent content system that simplifies local development while ensuring production data integrity.

## Architecture

### Core Principles

1. **Development First**: Simplified content creation workflow
2. **Production Safety**: Enforced validation and metadata completeness  
3. **URL Flexibility**: Multiple URL strategies for different use cases
4. **Backward Compatibility**: Existing content and workflows preserved

### Environment Behaviors

| Aspect | Development | Production |
|--------|-------------|------------|
| Canonical ID | Optional | Optional (configurable enforcement) |
| URL Strategy | Human-readable | Configurable (human + canonical redirects) |
| Validation | Relaxed | Configurable strict mode |
| Auto-generation | Available via helpers | Disabled |

## Implementation Details

### 1. Content Schema (`src/content/config.ts`)

```typescript
// Environment-aware schema
const base = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  language: z.enum(['en','de']).default('en'),
  authors: z.array(reference('authors')).min(1),
  tags: z.array(z.string()).default([]),
  
  // Publication state
  publicationStatus: z.enum(['draft','published','archived']).default('draft'),
  
  // Dates
  firstPublishedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  
  // Identity - Optional everywhere for better DX
  canonicalId: z.string().min(8).optional(),
  translationKey: z.string().optional(),
  
  // AI metadata
  ai_metadata: z.object({...}).optional(),
});
```

### 2. Environment Configuration

#### `.env.development`
```bash
# URL Strategy (development default: human-readable)
USE_CANONICAL_URLS=false

# Content validation (relaxed for easier development)
CONTENT_VALIDATION=relaxed

# Auto-generation (helpful in development)
AUTO_GENERATE_CANONICAL_IDS=true
```

#### `.env.production`  
```bash
# URL Strategy (configurable based on requirements)
USE_CANONICAL_URLS=false
# Set to true for: /en/life/canonical/01JDXH2J3K9T7M8Z6B4V5Q1N9P
# Set to false for: /en/life/trumps-coup

# Content validation (strict in production)
CONTENT_VALIDATION=strict

# No auto-generation in production
AUTO_GENERATE_CANONICAL_IDS=false
```

### 3. URL Architecture

#### Primary Routes (Always Available)
```
/en/life/trumps-coup
/de/life/trump-putsch  
/en/projects/my-app
/de/projects/meine-app
```

#### Canonical ID Routes (Production Only)
```
/en/life/canonical/01JDXH2J3K9T7M8Z6B4V5Q1N9P → redirects to /en/life/trumps-coup
/de/projects/canonical/01JDXH2J3K9T7M8Z6B4V5Q1N9P → redirects to /de/projects/meine-app
```

### 4. SEO Consolidation (`src/components/core/meta/Metadata.astro`)

Enhanced with canonical ID support:

```astro
---
export interface Props extends MetaData {
  canonicalId?: string; // NEW: Canonical ID support
  alternateLanguages?: Array<{ href: string; hreflang: string }>;
}

// Handle canonical ID if provided
let finalCanonical = canonical;
let hreflangLinks: Array<{ href: string; hreflang: string }> = alternateLanguages;

if (canonicalId) {
  try {
    const canonicalUrl = getCanonicalUrl(canonicalId);
    if (canonicalUrl) {
      finalCanonical = canonicalUrl;
    }
    
    const hreflangData = getHreflangData(canonicalId);
    if (hreflangData && hreflangData.length > 0) {
      hreflangLinks = hreflangData;
    }
  } catch (error) {
    console.warn('Error processing canonical ID:', canonicalId, error);
  }
}
---

<AstroSeo {...seoProps} />
{hreflangLinks.map(({ href, hreflang }) => 
  <link rel="alternate" hreflang={hreflang} href={href} />
)}
```

### 5. Development Helpers (`src/utils/dev-content-helper.ts`)

```typescript
/**
 * Generate ULID-like ID for development
 */
export function generateDevCanonicalId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(6).toString('hex').toUpperCase();
  return `DEV_${timestamp}_${random}`;
}

/**
 * Auto-generate canonical ID if missing in development
 */
export function ensureCanonicalId(frontmatter: { canonicalId?: string; title?: string }): string {
  if (frontmatter.canonicalId) {
    return frontmatter.canonicalId;
  }
  
  if (import.meta.env.DEV) {
    const devId = generateDevCanonicalId();
    console.log(`🔧 Auto-generated canonical ID for "${frontmatter.title}": ${devId}`);
    return devId;
  }
  
  throw new Error(`Missing canonical ID for content: ${frontmatter.title}`);
}
```

## Usage Examples

### Development Workflow

#### 1. Simple Content Creation
```markdown
---
title: 'My New Blog Post'
authors: [authors/seez]
tags: [technology, web]
# No canonical ID needed!
---

Content goes here...
```

#### 2. With Auto-generation (Optional)
```javascript
// In your build script
import { ensureCanonicalId } from '~/utils/dev-content-helper';

const frontmatter = {
  title: 'My Post',
  // canonicalId missing
};

const id = ensureCanonicalId(frontmatter);
// Outputs: 🔧 Auto-generated canonical ID for "My Post": DEV_1K2L3M4N_A1B2C3
```

### Production Workflow

#### 1. Content with Canonical ID
```markdown
---
title: 'My New Blog Post'
authors: [authors/seez]
tags: [technology, web]
canonicalId: "01JDXH2J3K9T7M8Z6B4V5Q1N9P"
---

Content goes here...
```

#### 2. URL Strategy Configuration
```bash
# For human-readable URLs (recommended)
USE_CANONICAL_URLS=false
# Results in: /en/blog/my-new-blog-post

# For canonical ID URLs (if immutable links needed)
USE_CANONICAL_URLS=true  
# Results in: /en/blog/canonical/01JDXH2J3K9T7M8Z6B4V5Q1N9P
```

## Migration Guide

### From Previous System

1. **Content files**: No changes required (canonical IDs now optional)
2. **URL structure**: Remains the same (human-readable by default)
3. **SEO components**: Existing usage preserved with deprecation warnings
4. **Build process**: Works unchanged

### Recommended Steps

1. **Phase 1**: Use new optional canonical ID system
   ```bash
   # Remove canonical IDs from development content if desired
   git checkout -- src/content/*/en/*.md
   ```

2. **Phase 2**: Migrate to Metadata.astro component
   ```astro
   <!-- Old -->
   <CanonicalSEO canonicalId={canonicalId} ... />
   
   <!-- New -->
   <Metadata canonicalId={canonicalId} ... />
   ```

3. **Phase 3**: Configure production URL strategy
   ```bash
   # In .env.production
   USE_CANONICAL_URLS=false  # or true if you want canonical ID URLs
   ```

## Troubleshooting

### Common Issues

1. **Schema validation errors**: Check that canonicalId is properly optional in config
2. **Missing alternates**: Verify canonical ID exists in content registry
3. **404 errors**: Ensure using correct URL format (human-readable vs canonical)

### Debugging

```bash
# Check content schema
pnpm astro sync

# Verify environment variables
echo $USE_CANONICAL_URLS

# Test URL patterns
curl -I http://localhost:4321/en/life/trumps-coup
curl -I http://localhost:4321/en/life/canonical/01JDXH2J3K9T7M8Z6B4V5Q1N9P
```

## Benefits

### Developer Experience
- ✅ Create content without canonical ID overhead
- ✅ Focus on writing, not metadata management
- ✅ Auto-generation helpers for missing IDs
- ✅ Environment-specific behaviors

### Production Benefits  
- ✅ Flexible URL strategies
- ✅ Immutable content references via canonical IDs
- ✅ SEO-optimized human-readable URLs
- ✅ Canonical redirects for content management systems

### System Benefits
- ✅ Backward compatibility preserved
- ✅ Single source of truth for SEO metadata
- ✅ Environment-aware validation
- ✅ Clean deprecation path for old components

## Future Enhancements

1. **Batch ID Generation**: Script to add canonical IDs to content missing them
2. **URL Analytics**: Track usage of canonical vs human-readable URLs
3. **Content Management**: CMS integration using canonical ID references
4. **Translation Linking**: Enhanced hreflang via canonical ID relationships
