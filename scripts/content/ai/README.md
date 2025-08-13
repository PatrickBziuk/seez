# AI & Machine Learning Operations

This directory contains scripts for AI-powered operations including content tagging, TLDR generation, and token usage tracking.

## 📁 Contents

### Tagging System (`ai-tagging/`)

- `analyze-existing-tags.ts` - Analyze current tag usage patterns
- `apply-tag-suggestions.ts` - Interactive tag application tool
- `build-master-registry.ts` - Build and maintain master tag registry
- `content-analyzer.ts` - Content analysis engine for tag suggestions
- `suggest-tags.ts` - Generate tag suggestions for content
- `test-simple.ts` - Simple testing utility

### Token Tracking (`token-tracking/`)

- `cli.ts` - Command-line interface for token operations
- `test.ts` - Token tracking system tests
- `tracker.ts` - Core token usage tracking logic
- `types.ts` - TypeScript type definitions

### Content Generation

- `generate_tldr.ts` - AI-powered TLDR generation

## 🚀 Quick Commands

```bash
# Tag Management
pnpm run tags:analyze          # Analyze existing tag patterns
pnpm run tags:suggest          # Suggest new tags for content
pnpm run tags:apply            # Interactive tag application
pnpm run tags:full-workflow    # Complete tagging workflow

# TLDR Generation
pnpm run tldr:generate         # Generate TLDRs for all content
pnpm run tldr:force            # Force regenerate existing TLDRs
pnpm run tldr:collection=books # Generate for specific collection

# Token Tracking
pnpm run tokens:summary        # Usage summary
pnpm run tokens:usage          # Detailed usage data
pnpm run tokens:export         # Export usage data
```

## 🏷️ Tag Management System

### Overview

The tag management system uses keyword-based analysis to suggest relevant tags for content. It maintains a master registry of curated tags and suggests additions based on content analysis.

### Features

- **Master Tag Registry**: Curated list of 50+ tags across categories
- **Multilingual Support**: EN/DE language pairs with semantic mapping
- **Keyword Analysis**: Simple, effective matching without AI complexity
- **Interactive Application**: Human-in-the-loop tag assignment
- **Registry Auto-Update**: Automatically add approved new tags

### Usage Flow

1. **Analyze**: `pnpm run tags:analyze` - Scan existing content for tag patterns
2. **Suggest**: `pnpm run tags:suggest` - Generate suggestions for all content
3. **Review**: `pnpm run tags:apply` - Interactively review and apply suggestions
4. **Update**: Registry automatically updated with approved new tags

## 📝 TLDR Generation

### Overview

Generates AI-powered TL;DR summaries for content using GPT-4o-mini for cost-effective operation.

### Features

- **Batch Processing**: Process multiple files with progress tracking
- **Resume Capability**: Continue interrupted jobs
- **Content-Aware**: Understands different content types and collections
- **Multilingual**: Supports both EN and DE content
- **Non-Destructive**: Preserves existing TLDRs unless forced

### Configuration

```typescript
const TLDR_CONFIG = {
  model: 'gpt-4o-mini',
  maxTokens: 150,
  temperature: 0.3,
  collections: ['books', 'projects', 'lab', 'life'],
};
```

## 📊 Token Tracking

### Overview

Comprehensive tracking of AI token usage across all operations including cost estimation and environmental impact calculation.

### Tracked Metrics

- **Token Consumption**: Input/output tokens per operation
- **Cost Estimation**: Based on current OpenAI pricing
- **CO2 Impact**: Environmental impact estimation
- **Operation Context**: Source language, target language, content type
- **Timestamps**: Detailed timing information

### Data Storage

Token usage data is stored in `data/token-usage.json` with the following structure:

```json
{
  "timestamp": "2025-08-07T10:30:00.000Z",
  "operation": "translation",
  "canonicalId": "slug-20250807-abc12345",
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
    "contentType": "article"
  }
}
```

## 🔧 Configuration

### Required Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### File Dependencies

- Master Tag Registry: `src/data/tags/master-tag-registry.json`
- Token Usage Data: `data/token-usage.json`
- Content Collections: `src/content/{books,projects,lab,life}/`

## 🧪 Testing

### Tag System Testing

```bash
# Test tag suggestion system
npx tsx scripts/ai/ai-tagging/test-simple.ts

# Analyze specific content
npx tsx scripts/ai/ai-tagging/content-analyzer.ts --file=path/to/content.md
```

### Token Tracking Testing

```bash
# Test token tracking
npx tsx scripts/ai/token-tracking/test.ts

# Add test token usage
pnpm run tokens:add-test
```

## 📈 Performance

### Tag Analysis

- **Speed**: ~100 files per minute
- **Accuracy**: 80-90% relevant suggestions
- **Memory**: Low memory footprint with streaming analysis

### TLDR Generation

- **Rate Limiting**: Respects OpenAI API limits
- **Batch Size**: Configurable batch processing
- **Caching**: Avoids regenerating existing TLDRs

### Token Tracking

- **Overhead**: Minimal performance impact
- **Storage**: Append-only for data integrity
- **Aggregation**: Real-time metrics calculation

## 🐛 Troubleshooting

### Common Issues

**OpenAI API Errors**

```bash
# Check API key
echo $OPENAI_API_KEY

# Test API connection
npx tsx scripts/ai/token-tracking/test.ts
```

**Tag Registry Issues**

```bash
# Rebuild master registry
pnpm run tags:build-registry

# Analyze existing tags
pnpm run tags:analyze
```

**TLDR Generation Failures**

```bash
# Force regenerate with debug output
pnpm run tldr:force --verbose

# Check specific collection
pnpm run tldr:collection=books
```

### Performance Optimization

**Large Content Collections**

- Use collection-specific generation: `--collection=books`
- Process in smaller batches during off-peak hours
- Monitor token usage to avoid rate limits

**Memory Usage**

- Scripts are designed for streaming processing
- Large content files are processed in chunks
- Registry operations use efficient data structures

## 🔮 Future Enhancements

### Planned Features

- **Semantic Tag Analysis**: Upgrade from keyword to semantic matching
- **Multi-Model Support**: Support for different AI models
- **Advanced TLDR Options**: Multiple summary lengths and styles
- **Real-Time Tracking**: Live token usage dashboard
- **Cost Optimization**: Automatic model selection based on content type

### Integration Opportunities

- **GitHub Actions**: Automated tagging in CI/CD pipeline
- **Content Creation**: Real-time tag suggestions during writing
- **Quality Metrics**: Content quality scoring and recommendations
- **Analytics**: Detailed insights into content performance and AI usage
