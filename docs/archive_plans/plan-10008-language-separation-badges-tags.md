# Plan 10008: Language Separation, Translation Keys, Badge Redesign, and Tag Overview

## Title
Language Separation, Translation Key Rendering, Badge Redesign, and Tag Overview Implementation

## Goal
- Restructure content folders for language separation to enable future automatic translation.
- Ensure translation keys are loaded and rendered for each content page.
- Redesign badge display to clearly differentiate authoring and translation status, and group badges by type.
- Make tags clickable and link to a tag overview page listing all content with the same tag.

## Implementation Status

### ✅ Completed Tasks
1. **Tag Overview Implementation** - Created `/[lang]/tags/` routes with index and individual tag pages (Plan 10011)
2. **Badge Redesign** - ContentMetadata.astro now groups badges by type with clear differentiation
3. **Translation Keys** - Components use translation keys from locale files
4. **Clickable Tags** - Tag badges now link to language-aware tag overview pages

### 🔄 In Progress 
1. **Content Folder Restructuring** - Current structure works but could be optimized for language separation

### ❌ Not Started
1. **Automatic Translation Pipeline** - Future enhancement, requires external translation services

## Detailed Steps

### 1. Content Folder Restructuring ⚠️ NEEDS EVALUATION
**Current State**: Content in `src/content/{books,projects,lab,life}/` with language metadata
**Proposed**: Move to language subfolders (e.g., `src/content/lab/en/`, `src/content/lab/de/`)

**Considerations**:
- Current approach works well and is less complex
- Folder restructuring might break existing content references
- Benefits vs. complexity needs evaluation

**Decision**: Postpone until clear need for automatic translation emerges

### 2. Translation Key Rendering ✅ COMPLETED
- ✅ Components use translation keys from `src/locales/{en,de}.json`
- ✅ ContentMetadata component renders translated labels
- ✅ Navigation uses translation keys
- ✅ Error handling for missing translation keys

### 3. Badge Redesign ✅ COMPLETED
Current badge grouping in ContentMetadata:
- **Author**: Human/AI/AI+Human badges for content creation
- **Translation**: Human/AI/AI+Human badges for translation status  
- **Published**: Date badge with timestamp
- **Tags**: Clickable tag badges linking to overview pages

### 4. Tag Overview Page ✅ COMPLETED
- ✅ `/[lang]/tags/` index page lists all tags with counts
- ✅ `/[lang]/tags/[tag]` individual pages show filtered content
- ✅ Language-aware filtering and navigation
- ✅ Breadcrumb navigation and proper TypeScript types

## Edge Cases Handled
- ✅ Content with missing or mixed language metadata - filtered appropriately
- ✅ Tags with special characters - URL encoded properly
- ✅ Backward compatibility - existing content and routes preserved
- ✅ Draft content handling - filtered from public tag pages

## Impact Achieved
- ✅ Enhanced navigation and discoverability via tag overview pages
- ✅ Improved clarity and usability of badge display
- ✅ Better multilingual support without breaking existing structure
- ✅ Aligned with project conventions and workflow protocol

## Final Checklist
- [x] Translation keys rendered on all pages
- [x] Badge display redesigned and grouped
- [x] Tag badges clickable and linked to overview
- [x] Tag overview page implemented  
- [x] Plan linked in todo.md
- [x] Documentation updated
- [ ] Consider content folder restructuring (future task)
- [ ] Evaluate automatic translation needs (future task)

## Decision: Mark as Substantially Complete
The core goals of this plan have been achieved. Content folder restructuring can be reconsidered when automatic translation becomes a priority.
