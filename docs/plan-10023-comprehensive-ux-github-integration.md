# Plan 10023: Comprehensive UX & GitHub Integration

## Overview

Comprehensive enhancement to add GitHub integration, deployment tracking, token usage monitoring, and improved legal framework.

## Goals

1. **GitHub Integration**: Add GitHub buttons to content pages for direct source access
2. **Token Tracking**: Monitor AI token usage, costs, and CO2 impact
3. **Deployment Pipeline**: Multi-step metadata enrichment system
4. **Version Indicator**: Display current live version
5. **Legal Framework**: Fix footer translations and add required legal pages
6. **Redirect Fix**: Improve initial language detection experience

## Phase 1: GitHub Integration & Source Access

### T23-001: GitHub Source Button Component

- Create `GitHubSourceButton.astro` component
- Display GitHub icon with "View Source" link
- Calculate GitHub URL from content file path
- Add to MarkdownLayout for all content pages
- Support both MDX and markdown files

### T23-002: Repository Context Detection

- Auto-detect repository URL from git remote
- Support GitHub Enterprise and custom domains
- Handle branch detection (main vs current)
- Fallback to repository root if file path fails

## Phase 2: Token Usage & Impact Tracking

### T23-003: Token Usage Ledger System

- Create `scripts/token-tracking/` directory structure
- Implement token usage tracking for translation/TLDR generation
- Store usage data in `data/token-usage.json`
- Track: tokens used, estimated cost, CO2 equivalent, timestamp

### T23-004: Impact Calculation Engine

- Research and implement CO2 calculation for AI model usage
- Create cost estimation based on OpenAI pricing
- Add environmental impact awareness
- Support different model types (GPT-4, GPT-3.5-turbo, etc.)

### T23-005: Usage Dashboard Component

- Create `TokenUsageStats.astro` component
- Display daily/monthly token usage
- Show cost estimates and environmental impact
- Add to admin/developer pages

## Phase 3: Multi-Step Deployment Pipeline

### T23-006: Metadata Enrichment Framework

- Create modular pipeline system in `scripts/pipeline/`
- Each step as independent module
- Support pre-build, post-build, and deployment steps
- Preserve existing file structure while adding metadata

### T23-007: Version Tracking System

- Add build timestamp and commit SHA to build artifacts
- Create version manifest in dist/
- Track deployment history
- Create version indicator component

### T23-008: Pipeline Integration

- Integrate with existing GitHub Actions
- Add metadata steps to ci-cd.yml
- Support incremental metadata updates
- Maintain backwards compatibility

## Phase 4: Legal Framework & Footer Fixes

### T23-009: Footer Translation Enhancement

- Fix missing translation keys in footer
- Add proper legal, social, and navigation sections
- Ensure consistent i18n key structure
- Test both EN and DE translations

### T23-010: Legal Pages Implementation

- Create `src/pages/[lang]/legal/privacy.astro`
- Create `src/pages/[lang]/legal/impressum.astro`
- Add legal content structure
- Ensure proper i18n support
- Add navigation links to footer

### T23-011: Legal Content Management

- Create legal content collections
- Support versioning of legal documents
- Add last-updated timestamps
- Ensure GDPR compliance structure

## Phase 5: Redirect Experience Improvement

### T23-012: Language Detection Enhancement

- Improve client-side language detection
- Add loading animation/progress indicator
- Reduce redirect time perception
- Better fallback handling

### T23-013: First Visit Experience

- Create elegant landing page for language selection
- Add browser language auto-detection feedback
- Improve visual design consistency
- Test cross-browser compatibility

## Phase 6: Component Integration & Testing

### T23-014: Layout Integration

- Add GitHub button to MarkdownLayout
- Integrate version indicator in header/footer
- Add token usage to admin areas
- Ensure responsive design

### T23-015: Comprehensive Testing

- Test GitHub URL generation accuracy
- Validate token tracking accuracy
- Test legal page functionality
- Cross-browser redirect testing
- Performance impact assessment

## Implementation Priority

1. **High**: Footer fixes, Legal pages, GitHub buttons
2. **Medium**: Token tracking, Version indicator
3. **Low**: Pipeline enhancement, Redirect improvements

## Success Criteria

- ✅ GitHub source buttons on all content pages
- ✅ Accurate token usage tracking with cost/CO2 data
- ✅ Version indicator showing current deployment
- ✅ Working legal pages (Privacy, Impressum)
- ✅ Fixed footer translations
- ✅ Improved first-visit language detection
- ✅ Modular deployment pipeline framework

## Technical Considerations

- Maintain existing build performance
- Ensure static site compatibility
- Keep bundle size minimal
- Preserve SEO optimization
- Maintain accessibility standards
- Support incremental adoption

## File Structure Changes

```
src/
  components/
    common/
      GitHubSourceButton.astro
      VersionIndicator.astro
      TokenUsageStats.astro
  pages/
    [lang]/
      legal/
        privacy.astro
        impressum.astro
scripts/
  token-tracking/
    usage-tracker.ts
    impact-calculator.ts
  pipeline/
    metadata-enricher.ts
    version-tracker.ts
data/
  token-usage.json
  deployment-history.json
```

## Dependencies

- Existing i18n system
- GitHub Actions workflow
- OpenAI API integration
- Git metadata extraction
- Current content collections system

## Risk Mitigation

- Implement feature flags for gradual rollout
- Maintain fallbacks for all new features
- Ensure backwards compatibility
- Add comprehensive error handling
- Create rollback procedures
