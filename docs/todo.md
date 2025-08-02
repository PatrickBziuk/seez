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
- [ ] **T16-009**: Create main-to-translate GitHub Action workflow with deduplication logic
- [ ] **T16-010**: Implement draft PR creation/updating system with proper naming conventions
- [ ] **T16-011**: Build post-release sync workflow to feed approved translations back to main
- [x] **T16-012**: Add automated bad translation detection and GitHub issue creation

### Phase 4: Branch Management & Release Flow
- [ ] **T16-013**: Implement branching strategy (draft → main → translate/* → release) with proper cleanup
- [ ] **T16-014**: Create manual override workflow for human-only translation branches
- [ ] **T16-015**: Set up conflict resolution for stale translations and concurrent edits
- [ ] **T16-016**: Implement comprehensive testing (unit, integration, snapshot tests) and documentation

---

## Current Task: Automate GitHub issue creation for CI build failures (see plan-10015-ci-auto-issue.md)
- [ ] Review and update GitHub Actions workflow for error capture
- [ ] Implement error log extraction and parsing logic
- [ ] Add GitHub issue creation logic (API or gh CLI)
- [ ] Test with simulated build failures
- [ ] Document process and update plan file
