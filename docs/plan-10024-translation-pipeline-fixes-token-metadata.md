# Plan 10024: Translation Pipeline Language Detection Fixes & Token Metadata Implementation

**Date**: 2025-08-05  
**Status**: ACTIVE  
**Priority**: HIGH  

# Plan 10024: Translation Pipeline Architecture Overhaul - Canonical IDs & Content Integrity

**Date**: 2025-08-05  
**Status**: ACTIVE  
**Priority**: CRITICAL  

## Problem Statement

### 1. Translation Divergence Crisis
- Files that should be translations of each other have diverged into different content
- `licht-am-ende-der-zeilen` exists in both languages but with different content
- No way to track which file is the "original" vs "translated"
- Bidirectional translation creates confusion and content drift

### 2. Architectural Issues
- Translation system uses filename-based matching instead of content relationships
- No canonical source tracking - any file can be translated to any language
- Translation history doesn't prevent translation loops (de→en→de)
- No systematic way to ensure translation integrity

### 3. Missing Content Governance
- No pre-commit validation of content structure
- No central registry of content relationships
- No automatic detection of when originals change
- No canonical linking for SEO purposes

## Proposed Solution: Canonical ID System with Content Registry

### Core Architecture

**1. Canonical Slug IDs**
- Every content file gets a unique canonical ID: `slug-YYYYMMDD-hash8`
- Generated via Husky pre-commit hooks
- Stored in frontmatter as `canonicalId`
- Enables permanent content tracking regardless of file moves/renames

**2. Central Content Registry (`data/content-registry.json`)**
```json
{
  "slug-20250805-1d4f7a2b": {
    "originalPath": "books/de/licht-am-ende-der-zeilen.md",
    "originalLanguage": "de", 
    "title": "Licht am Ende der Zeilen",
    "lastModified": "2025-08-05T10:30:00Z",
    "translations": {
      "en": {
        "path": "books/en/licht-am-ende-der-zeilen.md",
        "status": "stale",
        "lastTranslated": "2025-08-01T10:30:00Z"
      }
    }
  }
}
```

**3. Enhanced Frontmatter Schema**
```yaml
# Original files
canonicalId: slug-20250805-1d4f7a2b
originalLanguage: de
language: de

# Translated files  
canonicalId: slug-20250805-1d4f7a2b
translationOf: slug-20250805-1d4f7a2b
sourceLanguage: de
language: en
```

**4. Translation Direction Enforcement**
- Only files with `originalLanguage` can be translation sources
- Files with `translationOf` cannot be used as sources
- Prevents bidirectional translation loops

## Goals

1. **Canonical Content Identity**: Every content piece gets a permanent, unique canonical ID
2. **Translation Relationship Tracking**: Central registry tracks original→translation relationships
3. **Content Integrity Enforcement**: Prevent translation divergence and loops
4. **Automated Content Governance**: Pre-commit hooks ensure content structure compliance
5. **SEO Canonical Linking**: Enable proper canonical URLs and hreflang relationships
6. **Token Usage Metadata**: Comprehensive tracking of AI operation costs and impact

## Technical Strategy

### Phase 1: Infrastructure & Husky Setup

**Pre-commit Hook System:**
- Install Husky for Git hooks management
- Create pre-commit hook to scan content files
- Generate canonical IDs for new content
- Update central registry automatically
- Validate content structure and relationships

**Canonical ID Generation:**
```typescript
function generateCanonicalId(filePath: string, content: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const hash = crypto.createHash('sha256')
    .update(filePath + content)
    .digest('hex')
    .substring(0, 8);
  return `slug-${date}-${hash}`;
}
```

### Phase 2: Content Registry System

**Registry Structure:**
- Central JSON file tracking all content relationships
- Automatic updates via pre-commit hooks
- Backup and validation mechanisms
- Migration tools for existing content

**Content Classification:**
- Identify original vs translated content
- Establish canonical source relationships
- Mark translation status (current/stale/missing)
- Track modification timestamps

### Phase 3: Translation Pipeline Rewrite

**Registry-Based Translation Detection:**
- Replace filename-based matching with registry lookup
- Generate tasks only from original→target language
- Use canonical IDs for translation grouping
- Prevent translation of already-translated content

**Enhanced Translation Metadata:**
```yaml
ai_metadata:
  canonicalId: slug-20250805-1d4f7a2b
  translationOf: slug-20250805-1d4f7a2b
  tokenUsage:
    translation: { tokens: 3450, cost: 0.00345, co2: 0.00034 }
    tldr: { tokens: 1250, cost: 0.00125, co2: 0.00012 }
    total: { tokens: 4700, cost: 0.0047, co2: 0.00046 }
```

## Implementation Tasks

### T24-001: Husky Pre-commit Infrastructure
- [ ] Install and configure Husky for Git hooks
- [ ] Create pre-commit hook script for content validation
- [ ] Implement canonical ID generation utility
- [ ] Add content file scanning and metadata injection
- [ ] Create backup/recovery mechanisms for registry updates

### T24-002: Central Content Registry System
- [ ] Design and implement registry JSON schema
- [ ] Create registry initialization script for existing content
- [ ] Build registry update/validation utilities
- [ ] Add registry backup and recovery tools
- [ ] Implement content relationship mapping

### T24-003: Content Migration & Classification
- [ ] Analyze existing content to identify originals vs translations
- [ ] Assign canonical IDs to all existing content
- [ ] Classify translation relationships and fix diverged content
- [ ] Generate initial content registry from existing files
- [ ] Validate and test registry integrity

### T24-004: Translation Pipeline Rewrite
- [ ] Modify `check_translations.ts` to use registry instead of filename matching
- [ ] Implement translation direction enforcement (original→target only)
- [ ] Add canonical ID-based translation task generation
- [ ] Update translation metadata schema with canonical IDs
- [ ] Integrate token usage tracking with canonical ID system

### T24-005: SEO & Content Integration
- [ ] Update content schema to support canonical ID metadata
- [ ] Implement canonical URL generation using slug IDs
- [ ] Update hreflang tags to use canonical relationships
- [ ] Add content lineage tracking to SEO metadata
- [ ] Test SEO impact and validate canonical linking

### T24-006: Testing & Validation
- [ ] Test pre-commit hooks with various content scenarios
- [ ] Validate registry consistency and relationship integrity
- [ ] Test translation pipeline with canonical ID system
- [ ] Verify no translation loops or divergence possible
- [ ] Performance test registry operations and hook execution

## Technical Specifications

### Canonical ID System
```typescript
interface CanonicalId {
  id: string;  // Format: slug-YYYYMMDD-hash8
  generated: string;  // ISO timestamp
  filePath: string;
  contentHash: string;
}

interface ContentRegistryEntry {
  canonicalId: string;
  originalPath: string;
  originalLanguage: SupportedLanguage;
  title: string;
  lastModified: string;
  contentHash: string;
  translations: {
    [lang in SupportedLanguage]?: {
      path: string;
      status: 'current' | 'stale' | 'missing';
      lastTranslated: string;
      translationHash: string;
    }
  };
}
```

### Enhanced Frontmatter Schema
```yaml
# Original Content
canonicalId: slug-20250805-1d4f7a2b
originalLanguage: de
language: de
title: "Licht am Ende der Zeilen"

# Translated Content  
canonicalId: slug-20250805-1d4f7a2b
translationOf: slug-20250805-1d4f7a2b
sourceLanguage: de
language: en
title: "Light at the End of Lines"
translationHistory:
  - language: en
    sourceSha: abc123...
    timestamp: "2025-08-05T10:30:00Z"
    translator: "AI (gpt-4o-mini)"
ai_metadata:
  tokenUsage:
    translation: { tokens: 3450, cost: 0.00345, co2: 0.00034 }
    tldr: { tokens: 1250, cost: 0.00125, co2: 0.00012 }
    total: { tokens: 4700, cost: 0.0047, co2: 0.00046 }
```

### Pre-commit Hook Logic
```bash
#!/bin/sh
# .husky/pre-commit

# Run content validation and registry update
npx tsx scripts/validate-content-precommit.ts

# If registry was updated, stage the changes
if [ -f "data/content-registry.json.updated" ]; then
  git add data/content-registry.json
  rm data/content-registry.json.updated
fi
```

## Risk Assessment

### High Risk
- **Major architectural change**: Requires careful migration of existing content
- **Registry becomes critical dependency**: Single point of failure for content system
- **Pre-commit hook overhead**: May slow development workflow
- **Content classification complexity**: Determining originals vs translations from existing diverged content

### Medium Risk  
- **Translation pipeline compatibility**: Existing workflows need updates
- **SEO impact during migration**: Canonical URLs may change temporarily
- **Registry corruption**: Need robust backup/recovery procedures

### Low Risk
- **Performance impact**: Registry operations should be fast
- **Developer adoption**: Hooks are transparent once configured

### Mitigation Strategies
- **Gradual rollout**: Test with subset of content first
- **Registry validation tools**: Automated consistency checking
- **Emergency bypass**: Option to skip hooks for critical commits
- **Comprehensive backups**: Registry versioning and recovery procedures
- **Documentation**: Clear migration guides and troubleshooting

## Success Criteria

1. **No Translation Divergence**: Impossible for translations to drift from originals
2. **Clear Content Lineage**: Every file has traceable canonical source
3. **Automatic Stale Detection**: System detects when originals change
4. **SEO Canonical Support**: Proper canonical URLs and hreflang relationships
5. **Translation Direction Enforcement**: Only original→target translations allowed
6. **Complete Token Tracking**: All AI operations tracked with cost/impact
7. **Registry Integrity**: Content relationships always consistent
8. **Zero Translation Loops**: No de→en→de or similar cycles possible

## Rollback Strategy

- **Registry backup**: Automatic versioning of registry changes
- **Hook disable**: Emergency bypass option for pre-commit hooks
- **Content restoration**: Scripts to restore original frontmatter
- **Pipeline fallback**: Revert to filename-based translation matching if needed
- **Incremental migration**: Ability to run both systems in parallel during transition

## Timeline

- **T24-001**: 4-6 hours (Husky setup and basic hook infrastructure)
- **T24-002**: 6-8 hours (Registry system and utilities)
- **T24-003**: 8-12 hours (Content migration and classification - most complex)
- **T24-004**: 6-8 hours (Translation pipeline rewrite)
- **T24-005**: 4-6 hours (SEO integration)
- **T24-006**: 6-8 hours (Testing and validation)

**Total Estimated Time**: 34-48 hours over 1-2 weeks

## Dependencies

- Git hooks system (Husky)
- Existing content schema system
- Translation pipeline infrastructure
- Token tracking system (existing)
- SEO component system (existing)

---

**Priority**: This architectural overhaul will permanently solve translation integrity issues and provide a robust foundation for content governance at scale.
