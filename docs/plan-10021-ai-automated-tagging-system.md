# Plan 10021: AI-Powered Automated Tagging System

## Overview
Implement an intelligent tagging system using GPT-4o-mini to automatically suggest and assign tags to content based on a curated master tag list. The system will analyze content semantically, suggest existing tags, and intelligently propose new tags when no suitable matches exist.

## Goals
1. **Automated Tag Suggestion**: Use AI to analyze content and suggest relevant tags from existing list
2. **Dynamic Tag Management**: Automatically expand tag vocabulary when appropriate
3. **Content-Aware Analysis**: Understand context, topics, and themes in content
4. **Multilingual Support**: Handle both English and German content appropriately
5. **Quality Control**: Ensure tag suggestions are relevant and maintain consistency

## Requirements Analysis

### Current State
- **Tag Storage**: Tags stored in frontmatter `tags: string[]` array in content files
- **Tag Display**: ContentMetadata component renders clickable tag badges
- **Tag Navigation**: `/[lang]/tags/[tag]` pages show content filtered by tag
- **Tag Index**: `/[lang]/tags/` shows all tags with counts
- **Schema Support**: Extended schema already supports `tags: z.array(z.string())`

### Gaps Identified
- **Manual Tagging**: All tags currently manually assigned
- **Inconsistency**: No standardized tag vocabulary
- **Missed Connections**: Content that should be tagged together often isn't
- **No Tag Discovery**: New relevant tags not systematically identified

## System Architecture

### 1. Master Tag Registry
**Location**: `src/data/tags/master-tag-list.json`

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-08-04T12:00:00Z",
  "categories": {
    "technology": {
      "en": ["programming", "javascript", "typescript", "astro", "ai", "machine-learning", "web-development"],
      "de": ["programmierung", "javascript", "typescript", "astro", "ki", "maschinelles-lernen", "web-entwicklung"]
    },
    "content": {
      "en": ["writing", "translation", "documentation", "tutorial", "guide", "review"],
      "de": ["schreiben", "übersetzung", "dokumentation", "tutorial", "anleitung", "bewertung"]
    },
    "personal": {
      "en": ["reflection", "journey", "experience", "learning", "growth"],
      "de": ["reflexion", "reise", "erfahrung", "lernen", "wachstum"]
    },
    "creative": {
      "en": ["music", "art", "design", "creativity", "inspiration"],
      "de": ["musik", "kunst", "design", "kreativität", "inspiration"]
    }
  },
  "aliases": {
    "js": "javascript",
    "ts": "typescript",
    "ml": "machine-learning",
    "ai": "artificial-intelligence"
  }
}
```

### 2. AI Tagging Service
**Location**: `scripts/ai-tagging/`

```
scripts/ai-tagging/
├── analyze-content.ts       # Main content analysis service
├── tag-suggester.ts         # Tag suggestion logic
├── tag-manager.ts           # Master tag list management
├── content-processor.ts     # Content extraction and cleaning
└── validation.ts            # Tag relevance validation
```

### 3. Integration Points
- **Pre-commit Hook**: Analyze new/modified content files
- **Manual Script**: `npm run tags:suggest` for bulk analysis
- **CI Pipeline**: Optional validation of tag relevance
- **Content Creation**: Integration with content creation workflow

## Implementation Plan

### Phase 1: Core Infrastructure

#### T21-001: Master Tag Registry Setup
**Goal**: Create structured tag vocabulary with categorization
**Files**: 
- `src/data/tags/master-tag-list.json`
- `src/data/tags/tag-categories.ts` (TypeScript types)

**Implementation**:
1. Analyze all existing tags across content collections
2. Categorize tags into logical groups (technology, content, personal, creative)
3. Add multilingual mappings for German equivalents
4. Create tag aliases for common abbreviations
5. Add versioning and metadata for tag registry

#### T21-002: Content Analysis Service
**Goal**: Extract and analyze content for tagging
**Files**: 
- `scripts/ai-tagging/content-processor.ts`
- `scripts/ai-tagging/analyze-content.ts`

**Implementation**:
1. Content extraction from Markdown/MDX (excluding frontmatter)
2. Clean content of MDX components and technical markup
3. Extract key phrases, topics, and themes
4. Identify language and collection type
5. Prepare content summary for AI analysis

#### T21-003: OpenAI Integration
**Goal**: Setup GPT-4o-mini integration for tag analysis
**Files**: 
- `scripts/ai-tagging/openai-client.ts`
- `scripts/ai-tagging/prompts.ts`

**Prompt Design**:
```
You are an expert content tagger. Analyze the following content and:

1. Suggest 3-7 relevant tags from this existing tag list: {masterTagList}
2. If no existing tags fit well, suggest 1-3 NEW tags that would be valuable
3. Consider the content language: {language}
4. Content type: {collection} (books/projects/lab/life)

Content to analyze:
{contentSummary}

Respond with JSON:
{
  "suggestedTags": ["tag1", "tag2"],
  "newTags": ["newtag1"],
  "confidence": 0.85,
  "reasoning": "Explanation of tag choices"
}
```

### Phase 2: Tag Suggestion Engine

#### T21-004: Tag Matching Algorithm
**Goal**: Intelligent matching of content to existing tags
**Files**: 
- `scripts/ai-tagging/tag-suggester.ts`
- `scripts/ai-tagging/similarity-matcher.ts`

**Implementation**:
1. Semantic similarity matching using AI embeddings
2. Keyword extraction and tag correlation
3. Category-based tag filtering
4. Confidence scoring for suggestions
5. Multilingual tag mapping

#### T21-005: New Tag Proposal System
**Goal**: Intelligently propose new tags when needed
**Files**: 
- `scripts/ai-tagging/tag-proposal.ts`
- `scripts/ai-tagging/tag-validation.ts`

**Implementation**:
1. Analyze gap between content and existing tags
2. Propose semantically meaningful new tags
3. Validate against existing tag patterns
4. Check for duplicate concepts in different words
5. Multi-language consideration for new tags

#### T21-006: Tag Quality Control
**Goal**: Ensure tag relevance and prevent tag sprawl
**Files**: 
- `scripts/ai-tagging/quality-control.ts`
- `scripts/ai-tagging/tag-consolidation.ts`

**Implementation**:
1. Relevance scoring for proposed tags
2. Detection of near-duplicate tags
3. Tag consolidation suggestions
4. Minimum usage threshold for new tags
5. Automated cleanup of orphaned tags

### Phase 3: Content Processing & Integration

#### T21-007: Batch Content Analysis
**Goal**: Analyze all existing content for tag suggestions
**Files**: 
- `scripts/ai-tagging/batch-processor.ts`
- `scripts/analyze-content-tags.ts` (main entry point)

**Implementation**:
1. Process all content files in collections
2. Generate tag suggestions for each file
3. Create diff preview showing proposed changes
4. Batch processing with rate limiting for API
5. Progress tracking and resume capability

#### T21-008: Interactive Tag Application
**Goal**: Human-in-the-loop tag assignment process
**Files**: 
- `scripts/apply-tag-suggestions.ts`
- `scripts/ai-tagging/interactive-cli.ts`

**Implementation**:
1. Present tag suggestions to user for review
2. Allow selective application of suggestions
3. Enable manual tag editing during review
4. Update master tag list with approved new tags
5. Generate summary report of changes applied

#### T21-009: Automated Tag Updates
**Goal**: Keep tags current as content evolves
**Files**: 
- `scripts/ai-tagging/auto-updater.ts`
- `.github/workflows/tag-analysis.yml`

**Implementation**:
1. Pre-commit hook for new content tagging
2. Periodic re-analysis of existing content
3. Detection of content changes that warrant re-tagging
4. Automated PR creation for tag updates
5. Integration with translation pipeline

### Phase 4: Integration & Workflow

#### T21-010: Package.json Scripts Integration
**Goal**: Easy access to tagging functionality
**Files**: 
- `package.json`
- `scripts/tag-management.ts`

**Scripts to add**:
```json
{
  "scripts": {
    "tags:analyze": "tsx scripts/analyze-content-tags.ts",
    "tags:apply": "tsx scripts/apply-tag-suggestions.ts",
    "tags:update-registry": "tsx scripts/ai-tagging/tag-manager.ts",
    "tags:validate": "tsx scripts/ai-tagging/validation.ts",
    "tags:consolidate": "tsx scripts/ai-tagging/tag-consolidation.ts"
  }
}
```

#### T21-011: GitHub Actions Integration
**Goal**: Automated tag analysis in CI/CD
**Files**: 
- `.github/workflows/tag-analysis.yml`
- `.github/workflows/tag-update-pr.yml`

**Workflow Features**:
1. Analyze new content in PRs for missing tags
2. Create suggestions as PR comments
3. Weekly automated tag analysis jobs
4. Master tag list update notifications
5. Tag quality reports in CI

#### T21-012: Documentation & Usage Guide
**Goal**: Clear documentation for the tagging system
**Files**: 
- `docs/tagging-system.md`
- `docs/ai-tagging-guide.md`

**Documentation Includes**:
1. How to use the tagging system
2. Tag categories and guidelines
3. AI tagging prompt engineering
4. Troubleshooting common issues
5. Best practices for tag management

## Example Workflows

### Workflow 1: New Content Creation
1. Author writes new content in `src/content/lab/en/new-article.mdx`
2. Commits changes to Git
3. Pre-commit hook triggers `tags:analyze` for the new file
4. AI analyzes content and suggests tags: `["astro", "tutorial", "web-development"]`
5. Author reviews suggestions and applies them to frontmatter
6. Content is ready with properly assigned tags

### Workflow 2: Bulk Tag Analysis
1. Developer runs `npm run tags:analyze`
2. System processes all content files without tags or with minimal tags
3. Generates `tag-suggestions.json` with AI recommendations
4. Developer runs `npm run tags:apply` for interactive review
5. System presents each suggestion with confidence score
6. Developer approves/rejects suggestions
7. Master tag list updated with new approved tags

### Workflow 3: Tag Registry Maintenance
1. Monthly automated analysis detects tag consolidation opportunities
2. System suggests merging similar tags: `"js"` → `"javascript"`
3. Creates PR with consolidation recommendations
4. Developer reviews and approves tag mappings
5. Content files automatically updated with consolidated tags

## Expected Outcomes

### Quality Improvements
- **Consistent Tagging**: Standardized vocabulary across all content
- **Better Discoverability**: More comprehensive and relevant tags
- **Automated Maintenance**: Self-improving tag system
- **Multilingual Harmony**: Consistent tagging across languages

### Developer Experience
- **Reduced Manual Work**: Automated tag suggestion saves time
- **Intelligent Suggestions**: AI understands content context
- **Quality Control**: Prevents tag sprawl and inconsistency
- **Easy Integration**: Simple scripts and clear workflows

### Content Strategy
- **Enhanced SEO**: Better content categorization
- **Improved Navigation**: More effective tag-based browsing
- **Content Relationships**: Better discovery of related content
- **Analytics Insights**: Tag-based content performance analysis

## Technical Considerations

### API Usage & Costs
- **GPT-4o-mini**: ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Expected Usage**: ~500-1000 tokens per content analysis
- **Batch Processing**: Rate limiting to stay within API limits
- **Caching**: Cache results to avoid re-analysis of unchanged content

### Performance & Scalability
- **Batch Processing**: Handle large content collections efficiently
- **Incremental Updates**: Only analyze changed content
- **Caching Strategy**: Store AI results to minimize API calls
- **Progress Tracking**: Resume capability for long-running jobs

### Quality & Validation
- **Confidence Scoring**: AI provides confidence levels for suggestions
- **Human Review**: Interactive approval process for new tags
- **Tag Validation**: Prevent low-quality or irrelevant tags
- **Consolidation**: Regular cleanup of tag vocabulary

## Success Criteria

1. **✅ Master Tag Registry**: Comprehensive, categorized tag vocabulary established
2. **✅ AI Integration**: GPT-4o-mini successfully analyzing content and suggesting tags
3. **✅ Batch Processing**: Can analyze entire content collection in one operation
4. **✅ Interactive Review**: Human-friendly interface for reviewing/applying suggestions
5. **✅ Quality Control**: Tag relevance validation and consolidation working
6. **✅ Workflow Integration**: Seamless integration with existing content creation process
7. **✅ Documentation**: Complete guide for using and maintaining the system

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] **T21-001**: Create master tag registry with existing tag analysis
- [ ] **T21-002**: Build content analysis and extraction service
- [ ] **T21-003**: Setup OpenAI integration with prompt engineering

### Phase 2: Tag Suggestion Engine  
- [ ] **T21-004**: Implement semantic tag matching algorithm
- [ ] **T21-005**: Build new tag proposal system with validation
- [ ] **T21-006**: Add tag quality control and consolidation features

### Phase 3: Content Processing & Integration
- [ ] **T21-007**: Create batch content analysis system
- [ ] **T21-008**: Build interactive tag application interface
- [ ] **T21-009**: Setup automated tag update workflows

### Phase 4: Integration & Workflow
- [ ] **T21-010**: Add npm scripts for tag management
- [ ] **T21-011**: Create GitHub Actions for automated tag analysis
- [ ] **T21-012**: Write comprehensive documentation and usage guide

---

**Status**: 📋 PLANNED - Ready for implementation

**Next Steps**: 
1. Analyze existing tags across all content to build initial master tag registry
2. Setup OpenAI API integration and prompt engineering
3. Begin with Phase 1 implementation following docs-driven protocol
