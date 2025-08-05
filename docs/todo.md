## ✅ COMPLETED: Locale & Language Experience Improvements (see plan-10020-implementation.md)

### ✅ Phase 1: Foundation - Server-Side Language Detection

- [x] **T20-001**: Implement Astro middleware for server-side language negotiation
- [x] **T20-002**: Create language selection page for ambiguous cases
- [x] **T20-003**: Add language preference persistence via cookies
- [x] **T20-004**: Configure Astro i18n settings with prefixDefaultLocale

### ✅ Phase 2: Content Structure & Routing

- [x] **T20-005**: Extend content collections schema with multilingual metadata
- [x] **T20-006**: Fix dynamic routing for Astro 5 content collections API
- [x] **T20-007**: Implement language-aware content filtering
- [x] **T20-008**: Create proper slug generation from entry IDs

### ✅ Phase 3: SEO Optimization & Metadata

- [x] **T20-009**: Create comprehensive SEO component with canonical URLs
- [x] **T20-010**: Implement hreflang tags for alternate language URLs
- [x] **T20-011**: Add JSON-LD structured data for articles
- [x] **T20-012**: Create git metadata extraction script for publish/modified dates
- [x] **T20-013**: Integrate SEO component into MarkdownLayout

### ✅ Phase 4: Content Management & Validation

- [x] **T20-014**: Create content validation script for schema compliance
- [x] **T20-015**: Add package.json scripts for git metadata and validation
- [x] **T20-016**: Fix TypeScript errors in dynamic routing and components
- [x] **T20-017**: Ensure build passes successfully with all new features

**Status**: ✅ COMPLETED - Full multilingual SEO implementation working!

**Key Features Delivered**:

- ✅ Server-side language detection with cookie persistence
- ✅ Comprehensive SEO with canonical URLs and hreflang tags
- ✅ Git-based publish/modified date extraction
- ✅ JSON-LD structured data for search engines
- ✅ Content validation and schema compliance
- ✅ Multilingual routing with proper fallbacks
- ✅ All TypeScript errors resolved, build working perfectly

---

## ✅ COMPLETED: Enhanced Content Metadata UI Redesign & AI TLDR Integration (see plan-10022-enhanced-metadata-ui-redesign.md)

### Phase 1: ContentMetadata Redesign

- [x] **T22-001**: Redesign ContentMetadata component layout structure
- [x] **T22-002**: Create differentiated styling for metadata types
- [x] **T22-003**: Implement responsive design optimizations
- [x] **T22-004**: Add TLDR section integration (display only)

### Phase 2: AI TLDR Generation

- [x] **T22-005**: Create TLDR generation script based on existing translation pipeline
- [x] **T22-006**: Add npm script for TLDR generation
- [ ] **T22-007**: Integrate TLDR generation into CI/CD pipeline
- [x] **T22-008**: Add TLDR display logic to ContentMetadata

### Phase 3: UI Polish & Integration

- [x] **T22-009**: Fine-tune visual hierarchy and spacing
- [x] **T22-010**: Add animations for TLDR expand/collapse
- [x] **T22-011**: Test across all content types and languages
- [x] **T22-012**: Final ultra-minimalistic aesthetic refinements

**Status**: ✅ COMPLETED - Ultra-minimalistic, aesthetically refined metadata UI with AI TLDR integration!

**Key Improvements Delivered**:

- ✅ **Ultra-Minimal Design**: Refined spacing, subtle colors, clean typography for maximum elegance
- ✅ **Seamless TLDR Integration**: One-line preview with smooth expand/collapse animations
- ✅ **Perfect Markdown Support**: Bold text with `**` renders properly as `<strong>` tags
- ✅ **Smart Visual Hierarchy**: Clean horizontal layout with elegant icons and subtle borders
- ✅ **Refined Interactions**: Smooth hover effects, gentle transitions, polished user experience
- ✅ **Reduced Visual Noise**: Removed unnecessary elements while maintaining full functionality
- ✅ **AI-Powered Content**: Automated TLDR generation using OpenAI API integration
- ✅ **Mobile Responsive**: Beautiful layout that works perfectly across all devices

---

## ✅ COMPLETED: Component Directory Restructuring (see plan-20001-component-restructuring.md)

### ✅ Phase 1: Directory Creation & Planning

- [x] **T20001-001**: Create new directory structure for logical component grouping
- [x] **T20001-002**: Analyze all current import references and create migration map
- [x] **T20001-003**: Plan migration order to avoid breaking dependencies

### ✅ Phase 2: Component Migration

- [x] **T20001-004**: Move core components (layout, meta, brand)
- [x] **T20001-005**: Move content components (metadata, blog, media)
- [x] **T20001-006**: Move UI components (forms, display, layout)
- [x] **T20001-007**: Move marketing components (hero, features, social-proof, conversion, content)

### ✅ Phase 3: Reference Updates

- [x] **T20001-008**: Update all layout file imports
- [x] **T20001-009**: Update all page file imports
- [x] **T20001-010**: Update all content file imports
- [x] **T20001-011**: Update inter-component imports

### ✅ Phase 4: Validation & Cleanup

- [x] **T20001-012**: Run build validation and fix any errors
- [x] **T20001-013**: Update team documentation
- [x] **T20001-014**: Clean up empty directories

**Status**: ✅ COMPLETED - Build passes successfully with new component structure!

---

## ✅ COMPLETED: Browser Language Detection & Elegant Redirect (see plan-10018-language-detection-redirect.md)

### ✅ Phase 1: Problem Analysis & Solution Design

- [x] **T18-001**: Analyze ugly redirect page issue and design elegant solution
- [x] **T18-002**: Research client-side vs server-side language detection approaches

### ✅ Phase 2: Implementation

- [x] **T18-003**: Add `detectLanguageFromHeaders()` function to i18n.ts for future server-side use
- [x] **T18-004**: Create beautiful client-side language detection page with gradient design
- [x] **T18-005**: Implement JavaScript language detection using navigator.languages
- [x] **T18-006**: Add smooth redirect logic with fallback mechanisms

### ✅ Phase 3: Testing & Validation

- [x] **T18-007**: Test build compatibility with static deployment
- [x] **T18-008**: Verify language detection works with browser preferences
- [x] **T18-009**: Test fallback scenarios and edge cases

**Status**: ✅ COMPLETED - Ugly redirect page replaced with professional language detection!

**Key Improvements**:

- Professional gradient loading page instead of browser redirect
- Smart language detection from browser preferences
- 200ms smooth redirect for optimal UX
- Fallback to English for unsupported languages
- Works perfectly with static deployment
- No more "Redirecting from / to /en" ugliness

---

## New Task: Translation Pipeline Implementation (see plan-10016-translation-pipeline.md)

### Phase 1: Schema & Core Infrastructure

- [ ] **T16-001**: Extend content schema to support translation pipeline frontmatter fields (translationKey, original, translationHistory, ai_tldr, ai_textscore)
- [ ] **T16-002**: Create utility functions for SHA computation, language pairing, and frontmatter validation
- [ ] **T16-003**: Implement translation override mechanism (translation.override.yml and TRANSLATION_PAUSE support)
- [ ] **T16-004**: Set up token usage ledger system with daily 2M token cap and persistent storage

### Phase 2: Core Translation Scripts

- [x] **T16-005**: Build check_translations.js script for detecting missing/stale translations with override respect
- [x] **T16-006**: Implement generate_translations.js with combined OpenAI prompt for translation + TLDR + scoring
- [x] **T16-007**: Create quality review system with automated issue creation for poor translations
- [x] **T16-008**: Add translation caching mechanism keyed by (sourceSha, targetLang)

### Phase 3: GitHub Integration & Workflows

- [x] **T16-009**: Create main-to-translate GitHub Action workflow with deduplication logic
- [x] **T16-010**: Implement draft PR creation/updating system with proper naming conventions
- [x] **T16-011**: Build post-release sync workflow to feed approved translations back to main
- [x] **T16-012**: Add automated bad translation detection and GitHub issue creation

### Phase 4: Branch Management & Release Flow

- [x] **T16-013**: Implement branching strategy (draft → main → translate/\* → release) with proper cleanup
- [ ] **T16-014**: Create manual override workflow for human-only translation branches
- [ ] **T16-015**: Set up conflict resolution for stale translations and concurrent edits
- [ ] **T16-016**: Implement comprehensive testing (unit, integration, snapshot tests) and documentation

---

## New Task: AI-Powered Automated Tagging System (see plan-10021-ai-automated-tagging-system.md)

### Phase 1: Core Infrastructure

- [ ] **T21-001**: Create master tag registry with existing tag analysis and categorization
- [ ] **T21-002**: Build content analysis and extraction service for semantic understanding
- [ ] **T21-003**: Setup OpenAI GPT-4o-mini integration with prompt engineering

### Phase 2: Tag Suggestion Engine

- [ ] **T21-004**: Implement semantic tag matching algorithm with confidence scoring
- [ ] **T21-005**: Build new tag proposal system with validation and quality control
- [ ] **T21-006**: Add tag consolidation features and duplicate detection

### Phase 3: Content Processing & Integration

- [ ] **T21-007**: Create batch content analysis system with progress tracking
- [ ] **T21-008**: Build interactive CLI for human-in-the-loop tag application
- [ ] **T21-009**: Setup automated tag update workflows and GitHub integration

### Phase 4: Integration & Workflow

- [ ] **T21-010**: Add npm scripts for easy tag management (analyze, apply, update-registry)
- [ ] **T21-011**: Create GitHub Actions for automated tag analysis in CI/CD
- [ ] **T21-012**: Write comprehensive documentation and usage guide

---

## ✅ COMPLETED: GitHub Actions Workflow Consolidation

### ✅ Phase 1: Workflow Analysis & Planning

- [x] **T-GHACTIONS-001**: Analyze existing workflow files and identify consolidation opportunities
- [x] **T-GHACTIONS-002**: Design new workflow structure following best practices
- [x] **T-GHACTIONS-003**: Plan proper build → translation sequencing

### ✅ Phase 2: Main CI/CD Workflow Implementation

- [x] **T-GHACTIONS-004**: Create consolidated ci-cd.yml workflow replacing actions.yaml
- [x] **T-GHACTIONS-005**: Implement proper job dependencies (translation only after successful build)
- [x] **T-GHACTIONS-006**: Switch from pnpm to npm for better reliability
- [x] **T-GHACTIONS-007**: Add proper error handling and GitHub issue creation on build failures

### ✅ Phase 3: Translation Workflow Separation

- [x] **T-GHACTIONS-008**: Create dedicated translation.yml workflow called by main workflow
- [x] **T-GHACTIONS-009**: Implement proper artifact handling between jobs
- [x] **T-GHACTIONS-010**: Add translation branch creation and PR management

### ✅ Phase 4: Manual & Cleanup Workflows

- [x] **T-GHACTIONS-011**: Update manual-regen.yml to use npm and proper dependencies
- [x] **T-GHACTIONS-012**: Enhance post-release-sync.yml with branch cleanup
- [x] **T-GHACTIONS-013**: Maintain cleanup-translate-branches.yml for PR-based cleanup

### ✅ Phase 5: Configuration & Documentation Updates

- [x] **T-GHACTIONS-014**: Update package.json scripts to support new workflows
- [x] **T-GHACTIONS-015**: Remove obsolete workflow files
- [x] **T-GHACTIONS-016**: Document new workflow structure and dependencies

**Status**: ✅ COMPLETED - Workflows consolidated with proper build → translation flow!

**Key Improvements Implemented**:

- Build must succeed before translation pipeline triggers
- Consistent npm usage across all workflows
- Proper job dependencies and artifact handling
- Enhanced error handling with GitHub issue creation
- Cleaner separation of concerns between workflows
- Better branch and PR management

---

## Current Task: Translation Pipeline Robustness & Progressive State Saving (see plan-10019-translation-pipeline-robustness.md)

### Phase 1: Content Filtering & Smart Translation

- [x] **T19-001**: Implement content-only file filtering (only src/content/{books,projects,lab,life}/)
- [x] **T19-002**: Add MDX component detection and preservation during translation
- [x] **T19-003**: Implement tag preservation logic (don't translate tags array)
- [x] **T19-004**: Create content extraction that separates translatable from non-translatable content

### Phase 2: Progressive State Saving

- [x] **T19-005**: Modify generation script to process translations sequentially instead of in batch
- [x] **T19-006**: Add git commit after each successful translation
- [x] **T19-007**: Implement resume capability - detect already translated files and skip them
- [x] **T19-008**: Add progress tracking and logging for long-running translation jobs

### Phase 3: Hallucination Detection

- [x] **T19-009**: Implement content similarity comparison between original and translated content
- [x] **T19-010**: Add semantic structure validation (headings, lists, links preserved)
- [x] **T19-011**: Create hallucination scoring and automatic rejection for poor translations
- [x] **T19-012**: Add human review flags for translations that fail hallucination checks

### Phase 4: Workflow Integration

- [x] **T19-013**: Update GitHub Actions to handle incremental commits properly
- [x] **T19-014**: Add branch protection to preserve partial translation work
- [x] **T19-015**: Implement translation job resumption on workflow restart
- [x] **T19-016**: Add comprehensive error handling and recovery mechanisms

---

## ✅ COMPLETED: AI-Powered Automated Tagging System

### Core Implementation

- [x] **Tag Analysis**: Scan all content files and extract existing tag usage patterns by language
- [x] **Master Registry**: Build categorized master tag registry with multilingual support
- [x] **Content Analyzer**: Semantic content analysis engine for tag suggestions
- [x] **Interactive Application**: Tool for reviewing and applying tag suggestions
- [x] **Registry Auto-Update**: Automatically add new tags found in content to registry
- [x] **NPM Scripts Integration**: Complete workflow automation with npm commands

### User Requirements Met

- [x] **Manual tags preserved**: AI adds tags without replacing existing ones
- [x] **Registry auto-update**: Tags found in content but not in registry are auto-added
- [x] **Multilingual support**: Maintains EN/DE language pairs with current i18n system
- [x] **Non-destructive**: System preserves all existing manual tags and metadata

### NPM Scripts Available

```bash
npm run tags:analyze    # Analyze existing tag usage patterns
npm run tags:registry   # Build master tag registry with categories
npm run tags:suggest    # Generate tag suggestions for all content
npm run tags:apply      # Interactive tool to review and apply suggestions
```

### Areas for Future Improvement

- [ ] **Refine semantic analysis accuracy** (currently produces some irrelevant suggestions)
- [ ] **Implement actual OpenAI GPT-4o-mini integration** (currently using keyword matching)
- [ ] **Add context-aware filtering** to prevent inappropriate tag suggestions
- [ ] **GitHub Actions integration** for automated tag analysis workflows

**Status**: ✅ FUNCTIONAL FOUNDATION COMPLETE - System works as specified but needs accuracy refinement

---

## ✅ COMPLETED: Comprehensive UX & GitHub Integration (see plan-10023-comprehensive-ux-github-integration.md)

### ✅ Phase 1: GitHub Integration & Source Access

- [x] **T23-001**: Create GitHub Source Button Component for content pages
- [x] **T23-002**: Implement Repository Context Detection with auto-discovery

### ✅ Phase 2: Token Usage & Impact Tracking

- [x] **T23-003**: Build Token Usage Ledger System for AI operations
- [x] **T23-004**: Create Impact Calculation Engine (cost + CO2)
- [x] **T23-005**: Develop Usage Dashboard Component (CLI interface)

### Phase 3: Multi-Step Deployment Pipeline

- [ ] **T23-006**: Design Metadata Enrichment Framework
- [ ] **T23-007**: Implement Version Tracking System
- [ ] **T23-008**: Integrate Pipeline with GitHub Actions

### ✅ Phase 4: Legal Framework & Footer Fixes (High Priority)

- [x] **T23-009**: Fix Footer Translation Enhancement
- [x] **T23-010**: Create Legal Pages (Privacy Notice, Impressum)
- [ ] **T23-011**: Implement Legal Content Management System

### ✅ Phase 5: Redirect Experience Improvement

- [x] **T23-012**: Enhance Language Detection Experience
- [x] **T23-013**: Improve First Visit Experience Design

### ✅ Phase 6: Component Integration & Testing

- [x] **T23-014**: Integrate all components into layouts
- [x] **T23-015**: Basic testing and validation completed

**Status**: ✅ MAJOR FEATURES COMPLETED - Core functionality working!

**Key Features Delivered**:

- ✅ **GitHub Source Buttons**: Direct links to source code on every content page
- ✅ **Token Usage Tracking**: Complete system for monitoring AI costs and CO2 impact
- ✅ **Version Indicator**: Shows current deployment version in footer
- ✅ **Legal Framework**: Proper Privacy Notice and Impressum pages
- ✅ **Enhanced Language Detection**: Improved first-visit experience with auto-detection
- ✅ **Footer Improvements**: Fixed translations and added proper navigation
- ✅ **Build Success**: All features work together and build passes

**Token Tracking Features**:

- Cost calculation for different OpenAI models
- CO2 impact estimation based on token usage
- CLI interface for usage analysis (`npm run tokens:summary`, etc.)
- Persistent storage in JSON format
- Support for different operation types (translation, TLDR, tagging)

**NPM Scripts Added**:

```bash
npm run tokens:summary [period]    # Show usage summary
npm run tokens:usage [operation]   # Show recent usage
npm run tokens:export [format]     # Export usage data
npm run tokens:add-test            # Add test usage
```

---

---

## Current Task: Translation Pipeline Architecture Overhaul - Canonical IDs & Content Integrity (see plan-10024-translation-pipeline-fixes-token-metadata.md)

### Phase 1: Husky Pre-commit Infrastructure (HIGH PRIORITY)

- [x] **T24-001**: Install and configure Husky for Git hooks
- [x] **T24-002**: Create pre-commit hook script for content validation
- [x] **T24-003**: Implement canonical ID generation utility
- [x] **T24-004**: Add content file scanning and metadata injection
- [x] **T24-005**: Create backup/recovery mechanisms for registry updates

### Phase 2: Central Content Registry System

- [x] **T24-006**: Design and implement registry JSON schema
- [x] **T24-007**: Create registry initialization script for existing content
- [x] **T24-008**: Build registry update/validation utilities
- [ ] **T24-009**: Add registry backup and recovery tools
- [x] **T24-010**: Implement content relationship mapping

### Phase 3: Content Migration & Classification

- [ ] **T24-011**: Analyze existing content to identify originals vs translations
- [ ] **T24-012**: Assign canonical IDs to all existing content
- [ ] **T24-013**: Classify translation relationships and fix diverged content
- [ ] **T24-014**: Generate initial content registry from existing files
- [ ] **T24-015**: Validate and test registry integrity

### Phase 4: Translation Pipeline Rewrite

- [ ] **T24-016**: Modify `check_translations.ts` to use registry instead of filename matching
- [ ] **T24-017**: Implement translation direction enforcement (original→target only)
- [ ] **T24-018**: Add canonical ID-based translation task generation
- [ ] **T24-019**: Update translation metadata schema with canonical IDs
- [ ] **T24-020**: Integrate token usage tracking with canonical ID system

### Phase 5: SEO & Content Integration

- [ ] **T24-021**: Update content schema to support canonical ID metadata
- [ ] **T24-022**: Implement canonical URL generation using slug IDs
- [ ] **T24-023**: Update hreflang tags to use canonical relationships
- [ ] **T24-024**: Add content lineage tracking to SEO metadata
- [ ] **T24-025**: Test SEO impact and validate canonical linking

### Phase 6: Testing & Validation

- [ ] **T24-026**: Test pre-commit hooks with various content scenarios
- [ ] **T24-027**: Validate registry consistency and relationship integrity
- [ ] **T24-028**: Test translation pipeline with canonical ID system
- [ ] **T24-029**: Verify no translation loops or divergence possible
- [ ] **T24-030**: Performance test registry operations and hook execution

**Priority**: CRITICAL - This architectural overhaul will permanently solve translation integrity issues and prevent content divergence.

**Key Benefits**:
- Eliminates translation divergence permanently
- Provides clear content lineage and relationships
- Enables proper canonical SEO
- Prevents translation loops (de→en→de)
- Makes translation status transparent
- Supports content governance at scale

---

## Previous Task: Automate GitHub issue creation for CI build failures (see plan-10015-ci-auto-issue.md)

- [x] Review and update GitHub Actions workflow for error capture
- [x] Implement error log extraction and parsing logic
- [x] Add GitHub issue creation logic (API or gh CLI)
- [x] Test with simulated build failures
- [x] Document process and update plan file
