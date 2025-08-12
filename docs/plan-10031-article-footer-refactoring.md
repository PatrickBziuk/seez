# Plan 10031: Article Footer Refactoring - Modern, Scannable & Transparent

**Status**: 📋 READY FOR IMPLEMENTATION  
**Date**: August 11, 2025  
**Goal**: Transform article endings from messy accumulation to a scannable, honest, and user-friendly experience

## 🎯 Vision & Requirements

**Current Problems**:
- Tags buried at bottom like footnotes nobody reads
- Article facts scattered across different components
- AI impact hidden or presented like greenwashing theatre
- Share buttons missing entirely or poorly placed
- Inconsistent ordering across content types

**New Structure (Priority Order)**:
1. **Share & Follow** - Single row with icons + labels (most engaged readers)
2. **Article Facts** - Compact line + details toggle (word count, dates, language switcher)
3. **AI Usage & Environmental Impact** - Default collapsed, transparent methodology
4. **Tags** - Moved to top of article under deck/summary (discovery-focused)
5. **License & Timestamp** - Tiny footer line

## 📋 Implementation Plan

### Phase 1: Enhanced Remark Plugins (Days 1-2)

#### **T31-001**: Word Count & Reading Time Plugin
- **Goal**: Automatic word count/reading time injection via remark
- **Implementation**: 
  - Extend existing `readingTimeRemarkPlugin` to also inject `wordCount`
  - Use existing `getWordCount()` and `getReadingTime()` utilities
  - Auto-inject into frontmatter for layout consumption
- **Output**: `frontmatter.wordCount` and `frontmatter.readingMinutes`

#### **T31-002**: Git-Based Last Modified Plugin  
- **Goal**: remark plugin for automatic last modified dates
- **Implementation**:
  - Create `remarkModifiedTime()` plugin using Git log commands
  - Fallback to filesystem mtime if Git unavailable
  - Integrate with existing git metadata system
- **Output**: `frontmatter.lastModified` (ISO string)

#### **T31-003**: Astro Config Plugin Integration
- **Goal**: Wire new plugins into astro.config.ts
- **Implementation**:
  - Add new plugins to existing `remarkPlugins` array
  - Test with development builds
  - Validate frontmatter injection works correctly

### Phase 2: AI Metrics & Environmental Impact (Days 3-4)

#### **T31-004**: AI Metrics JSON Structure
- **Goal**: Central AI usage storage following your proposed schema
- **Implementation**:
  - Create `src/data/ai-metrics.json` with canonical ID keys
  - Schema: `{ "slug-YYYYMMDD-hash8": { model, region, items[] } }`
  - Each item: `{ label, type, input_tokens, output_tokens, price_per_1k_* }`
- **Integration**: Import in layouts, reference by canonical ID

#### **T31-005**: Enhanced AI Impact Utilities
- **Goal**: Transparent, range-based environmental calculations
- **Implementation**:
  - Extend existing `src/utils/aiImpact.ts` with your ranges approach
  - `DEFAULT_WH_PER_KTOKENS: { low, mid, high }` configuration
  - Grid intensity and CO₂ calculation functions
  - Cost calculation with per-model pricing
- **Features**: Uncertainty ranges, methodology transparency

#### **T31-006**: AIImpact Component (Astro v5 Compatible)
- **Goal**: Collapsible, honest environmental impact display
- **Implementation**:
  - Replace/enhance existing token stats with new AIImpact component
  - Default collapsed "summary pill" view
  - Expandable breakdown by operation type
  - Clear methodology explanation paragraph
- **Design**: Non-greenwashing, factual presentation

### Phase 3: Article Facts & Metadata Consolidation (Days 5-6)

#### **T31-007**: Enhanced ArticleFacts Component
- **Goal**: Single component for all article metadata
- **Implementation**:
  - Consolidate word count, reading time, publish/modified dates
  - Add slug ID copy-to-clipboard functionality
  - Language switcher integration (if counterpart exists)
  - GitHub "Edit" link integration
- **Design**: Compact single line + details toggle

#### **T31-008**: Language Counterpart Detection
- **Goal**: Intelligent detection of translated content
- **Implementation**:
  - Use existing canonical ID system from Plan 10024
  - Query content registry for translation relationships
  - Generate proper hreflang URLs for language switching
- **Features**: EN ↔ DE switching when available

#### **T31-009**: Social Share Enhancement
- **Goal**: Prominent, well-designed sharing at article top
- **Implementation**:
  - Enhance existing `SocialShare.astro` component
  - Single row design with icons + short labels
  - Position at very top of footer section
  - Include existing platforms + ensure mobile responsiveness

### Phase 4: New ArticleFooter Component (Days 7-8)

#### **T31-010**: Complete ArticleFooter Rewrite
- **Goal**: Replace existing footer with new ordered structure
- **Implementation**:
  - Create new `src/components/article/ArticleFooter.astro`
  - Implement exact ordering: Share → Facts → AI Impact → License
  - Remove tags from footer (they move to top)
  - Clean, scannable design with consistent spacing

#### **T31-011**: Footer Integration & Testing
- **Goal**: Wire new footer into all content layouts
- **Implementation**:
  - Update `MarkdownLayout.astro` to use new ArticleFooter
  - Replace existing ArticleFooter and PostFooter components
  - Test across all content types (books, projects, lab, life)
  - Validate responsive design and accessibility

### Phase 5: Tags Repositioning & Enhancement (Days 9-10)

#### **T31-012**: Tags Section Relocation
- **Goal**: Move tags from footer to top of article
- **Implementation**:
  - Update `MarkdownLayout.astro` to show tags under title/subtitle
  - Enhance `TagsSection.astro` for discovery-focused design
  - Optional: Mirror faded tags in footer if needed
- **Placement**: Under article deck/summary, before content

#### **T31-013**: Enhanced Tags Design
- **Goal**: Discovery-focused tag presentation
- **Implementation**:
  - Larger, more prominent tag styling for top placement
  - Optional mirrored tags in footer (faded/smaller)
  - Hover effects and improved accessibility
  - Integration with existing tag system and navigation

### Phase 6: Integration & Polish (Days 11-12)

#### **T31-014**: Complete Layout Integration
- **Goal**: Full integration across all content types
- **Implementation**:
  - Update all collection layouts ([slug].astro files)
  - Ensure proper props passing and data flow
  - Test with various content scenarios (AI/Human, translated/original)
  - Validate SEO and canonical URL integration

#### **T31-015**: Testing & Validation
- **Goal**: Comprehensive testing of new article structure
- **Implementation**:
  - Test reading time/word count accuracy
  - Validate AI metrics display and calculations
  - Test language switching and counterpart detection
  - Mobile responsiveness and accessibility verification
  - Performance impact assessment

## 🔧 Technical Architecture

### Component Structure
```
src/components/article/
├── ArticleFooter.astro          # New unified footer
├── ArticleFacts.astro           # Metadata display component
├── AIImpact.astro              # Environmental impact component
└── SocialShare.astro           # Enhanced sharing component

src/utils/
├── aiImpact.ts                 # Enhanced impact calculations
└── remarkPlugins.ts            # New remark plugins

src/data/
└── ai-metrics.json             # AI usage tracking
```

### Data Flow
1. **Remark plugins** inject automatic metadata (word count, reading time, last modified)
2. **AI metrics JSON** provides token usage data by canonical ID
3. **Content registry** enables language counterpart detection
4. **ArticleFooter** orchestrates all components in correct order
5. **Tags** move to top via layout restructuring

### Integration Points
- **Existing systems**: Content registry, SEO components, i18n utilities
- **New plugins**: Integrate with existing remark pipeline
- **Layout updates**: MarkdownLayout.astro becomes orchestrator
- **Data sources**: Git metadata, AI metrics, content collections

## 🎨 Design Principles

### Scannable Structure
- **Visual hierarchy**: Share buttons → Facts → Impact → License
- **Progressive disclosure**: Compact → Details toggle → Full breakdown
- **Clear separation**: Distinct sections with appropriate spacing

### Honest Transparency
- **AI ranges**: Present uncertainty, not fake precision
- **Methodology**: Clear explanation of assumptions
- **Environmental note**: Honest about impact calculation limitations

### User-Focused UX
- **Share prominence**: Most engaged readers see sharing first
- **Facts accessibility**: Easy access to article metadata
- **Discovery tags**: Tags positioned for content discovery

## 🔍 Testing Strategy

### Automated Tests
- Remark plugin functionality (word count, dates)
- AI impact calculations (ranges, costs, CO₂)
- Component rendering with various prop combinations

### Manual Validation
- Cross-browser footer layout and responsiveness
- Social sharing functionality across platforms
- Language switching and counterpart detection
- Mobile user experience and accessibility

### Performance Validation
- Build time impact of new remark plugins
- Bundle size with new components
- Runtime performance of footer calculations

## 📊 Success Metrics

### User Experience
- Improved engagement with share buttons (top position)
- Reduced bounce rate from better content discovery (tags at top)
- Clearer understanding of AI usage (transparent metrics)

### Technical Quality
- ✅ All content types use consistent footer structure
- ✅ Accurate automatic metadata (word count, dates)
- ✅ Honest environmental impact ranges
- ✅ Accessible, responsive design across devices

### Content Management
- Automated metadata reduces manual work
- Transparent AI metrics support editorial decisions
- Clear content relationships via language switching

## 🚧 Implementation Notes

### Astro v5 Compatibility
- Use new content collections API for counterpart detection
- Leverage existing i18n routing for language switching
- Integrate with current SEO and canonical URL systems

### Backward Compatibility
- Maintain existing frontmatter schema
- Graceful degradation when AI metrics unavailable
- Preserve current tag functionality while enhancing placement

### Performance Considerations
- Lazy load AI metrics data only when needed
- Optimize remark plugins for build performance
- Minimize bundle impact of new components

---

**Ready for Implementation**: This plan provides clear phases, specific tasks, and maintains integration with existing systems while delivering the modern, scannable, and transparent article footer experience described in your requirements.
