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
- [x] **T16-013**: Implement branching strategy (draft → main → translate/* → release) with proper cleanup
- [ ] **T16-014**: Create manual override workflow for human-only translation branches
- [ ] **T16-015**: Set up conflict resolution for stale translations and concurrent edits
- [ ] **T16-016**: Implement comprehensive testing (unit, integration, snapshot tests) and documentation

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
- [ ] **T19-013**: Update GitHub Actions to handle incremental commits properly
- [ ] **T19-014**: Add branch protection to preserve partial translation work
- [ ] **T19-015**: Implement translation job resumption on workflow restart
- [ ] **T19-016**: Add comprehensive error handling and recovery mechanisms

---

## Previous Task: Automate GitHub issue creation for CI build failures (see plan-10015-ci-auto-issue.md)
- [x] Review and update GitHub Actions workflow for error capture
- [x] Implement error log extraction and parsing logic
- [x] Add GitHub issue creation logic (API or gh CLI)  
- [x] Test with simulated build failures
- [x] Document process and update plan file
