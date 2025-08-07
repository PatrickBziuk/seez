# Translation Pipeline & Management

This directory contains scripts for managing the AI-powered translation pipeline, including translation detection, generation, and conflict resolution.

## 📁 Contents

- `check_translations.ts` - Legacy filename-based translation detection
- `check_translations_registry.ts` - Registry-based translation detection (recommended)
- `detect_conflicts.ts` - Detect and create GitHub issues for translation conflicts
- `generate_translations.ts` - Legacy translation generation with progressive state saving
- `generate_translations_registry.ts` - Registry-based translation generation (recommended)

## 🚀 Quick Commands

```bash
# Translation Detection
pnpm run translations:check          # Check for missing translations (legacy)
pnpm run translations:check-registry # Check using content registry (recommended)

# Translation Generation
pnpm run translations:generate         # Generate translations (legacy)
pnpm run translations:generate-registry # Generate using registry (recommended)

# Conflict Management
pnpm run translations:conflicts       # Detect conflicts and create GitHub issues
```

## 🔄 Translation Pipeline Overview

### Registry-Based System (Recommended)

The modern translation system uses the canonical ID system for robust translation tracking:

1. **Detection**: Find missing/stale translations using content registry
2. **Generation**: AI-powered translation with GPT-4o-mini
3. **Tracking**: Comprehensive token usage and cost tracking
4. **Validation**: Content integrity checks and quality validation
5. **Registry Update**: Automatic registry updates with translation status

### Legacy System (Deprecated)

The original filename-based system is still available but should be migrated to the registry-based approach.

## 📋 Translation Detection

### Registry-Based Detection

Uses the content registry to identify translation tasks:

```typescript
interface RegistryTranslationTask {
  canonicalId: string;
  sourcePath: string;
  targetLang: string;
  reason: 'missing' | 'stale';
  sourceContentHash: string;
  existingTranslationHash?: string;
  translationStatus: 'missing' | 'stale';
  outputPath: string;
  languagePair: string;
  priority: 'high' | 'normal';
}
```

### Detection Process

1. **Load Registry**: Read current content registry
2. **Scan Originals**: Find content marked as original language
3. **Check Translations**: Verify translation status for each target language
4. **Hash Comparison**: Compare content hashes to detect stale translations
5. **Generate Tasks**: Create translation tasks for missing/stale content

## 🤖 AI Translation Generation

### OpenAI Integration

Uses GPT-4o-mini for cost-effective, high-quality translations:

```typescript
const TRANSLATION_PROMPT = `
You are a professional translator. Translate the following content from ${sourceLanguage} to ${targetLanguage}.

Requirements:
- Maintain the exact markdown structure
- Preserve all MDX components unchanged
- Keep code blocks untranslated
- Translate only the content, not technical elements
- Maintain professional tone and accuracy

Content to translate:
${content}
`;
```

### Translation Features

- **Content Preservation**: Maintains MDX components, code blocks, and technical elements
- **Progressive Saving**: Saves progress incrementally to prevent data loss
- **Token Tracking**: Comprehensive usage tracking with cost calculation
- **Quality Validation**: Content integrity checks and hallucination detection
- **Resume Capability**: Can resume interrupted translation jobs

### Generated Metadata

Each translation includes comprehensive metadata:

```yaml
---
title: 'Translated Title'
canonicalId: 'original-canonical-id'
translationOf: 'original-canonical-id'
sourceLanguage: 'en'
language: 'de'
ai_metadata:
  translation:
    model: 'gpt-4o-mini'
    timestamp: '2025-08-07T10:30:00.000Z'
    tokenUsage:
      input: 850
      output: 320
      total: 1170
    cost: 0.002340
    co2Impact: 0.234
  quality:
    contentIntegrityCheck: 'passed'
    hallucinationDetection: 'passed'
    structureValidation: 'passed'
---
```

## 📊 Token Usage & Cost Tracking

### Comprehensive Tracking

Every translation operation is tracked for:

- **Token Consumption**: Input/output tokens per operation
- **Cost Calculation**: Real-time cost estimation based on OpenAI pricing
- **Environmental Impact**: CO2 estimation for sustainability awareness
- **Operation Context**: Source/target languages, content type, model used

### Token Usage Data Structure

```json
{
  "timestamp": "2025-08-07T10:30:00.000Z",
  "operation": "translation",
  "canonicalId": "programming-guide-20250807-abc12345",
  "model": "gpt-4o-mini",
  "tokens": {
    "input": 850,
    "output": 320,
    "total": 1170
  },
  "cost": 0.00234,
  "co2Impact": 0.234,
  "metadata": {
    "sourceLanguage": "en",
    "targetLanguage": "de",
    "contentType": "article",
    "languagePair": "en→de"
  }
}
```

## 🔍 Conflict Detection & Resolution

### Conflict Types

The system detects several types of translation conflicts:

1. **Stale Translations**: Original content changed, translation outdated
2. **Missing Translations**: No translation exists for target language
3. **Concurrent Edits**: Multiple changes to same content simultaneously
4. **Content Divergence**: Translations that have become separate content

### GitHub Integration

Automatically creates GitHub issues for conflicts:

```typescript
const conflictIssue = {
  title: `Translation conflict: ${canonicalId} → ${targetLanguage}`,
  body: `
Detected stale translation for **${canonicalId}** (lang=${targetLanguage}).

Source content hash changed to \`${newContentHash}\`.
Translation last updated: ${lastTranslated}

Please review and resolve the conflict.
  `,
  labels: ['translation', 'conflict', 'needs-review'],
};
```

## 🛠️ Configuration

### Environment Variables

```bash
# Required for translation generation
OPENAI_API_KEY=your_openai_api_key_here

# Required for conflict issue creation
GITHUB_TOKEN=your_github_token_here
GITHUB_REPOSITORY=owner/repository
```

### Translation Settings

```typescript
const TRANSLATION_CONFIG = {
  model: 'gpt-4o-mini',
  maxTokens: 4000,
  temperature: 0.1, // Low temperature for consistent translations
  supportedLanguages: ['en', 'de'],
  batchSize: 5, // Number of translations per batch
  rateLimitDelay: 1000, // Delay between API calls (ms)
};
```

## 📈 Quality Assurance

### Content Validation

Each translation undergoes multiple validation checks:

1. **Structure Preservation**: Ensures markdown/MDX structure is maintained
2. **Component Integrity**: Verifies all MDX components are preserved
3. **Length Validation**: Checks reasonable length ratios between languages
4. **Hallucination Detection**: Identifies potential AI hallucinations
5. **Technical Element Preservation**: Ensures code blocks, links, etc. are untranslated

### Quality Metrics

```typescript
interface TranslationQuality {
  structureScore: number; // 0-1: Markdown structure preservation
  componentIntegrity: boolean; // All MDX components preserved
  lengthRatio: number; // Target/source length ratio
  technicalAccuracy: boolean; // Code blocks, links preserved
  hallucinationScore: number; // 0-1: Likelihood of hallucination
}
```

## 🧪 Testing & Validation

### Translation Testing

```bash
# Test translation detection
pnpm run translations:check-registry --verbose

# Test single file translation
npx tsx scripts/translations/generate_translations_registry.ts --file=path/to/content.md

# Validate translation quality
npx tsx scripts/validation/validate-translation-quality.ts
```

### Registry Integration Testing

```bash
# Test registry-based pipeline
pnpm run content:scan
pnpm run translations:check-registry
pnpm run translations:generate-registry

# Validate final state
pnpm run content:validate
```

## 📊 Performance Optimization

### Batch Processing

- Process multiple translations in batches
- Respect OpenAI API rate limits
- Progressive saving to prevent data loss

### Memory Management

- Stream large content files
- Process collections incrementally
- Efficient registry updates

### Cost Optimization

- Use GPT-4o-mini for cost-effective translations
- Batch similar content types
- Avoid retranslating unchanged content

## 🐛 Troubleshooting

### Common Issues

**API Rate Limiting**

```bash
# Increase delay between requests
export TRANSLATION_RATE_LIMIT_DELAY=2000

# Use smaller batch sizes
export TRANSLATION_BATCH_SIZE=3
```

**Translation Quality Issues**

```bash
# Check translation with higher temperature
npx tsx scripts/translations/generate_translations_registry.ts --temperature=0.3

# Validate specific translation
npx tsx scripts/validation/validate-translation-quality.ts --file=translated-content.md
```

**Registry Sync Issues**

```bash
# Rebuild registry from content
pnpm run content:classify

# Validate registry state
pnpm run content:validate

# Check translation status
pnpm run translations:check-registry
```

### Performance Issues

**Slow Translation Generation**

- Check OpenAI API response times
- Reduce batch size for large content
- Monitor token usage and costs

**Memory Usage**

- Process collections separately
- Use streaming for large files
- Clear caches between operations

## 🔮 Future Enhancements

### Planned Features

- **Multi-Model Support**: Support for different AI models based on content type
- **Quality Scoring**: Advanced quality metrics and scoring
- **Automated Review**: AI-powered translation review and improvement
- **Real-time Translation**: Live translation during content editing
- **Custom Prompts**: Content-type specific translation prompts

### Integration Opportunities

- **CMS Integration**: Direct integration with content management systems
- **Review Workflow**: Human-in-the-loop translation review process
- **Quality Dashboard**: Real-time translation quality monitoring
- **Cost Analytics**: Detailed cost analysis and optimization recommendations
- **A/B Testing**: Compare different translation approaches and models
