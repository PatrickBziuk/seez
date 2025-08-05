# Plan 10011: Content Organization & Tags System

## Requirements Analysis

### 1. Page Structure Organization

**Problem**: Current multilingual pages use inline conditionals for content, which becomes unwieldy for full-blown pages.
**Need**: Better structure for organizing multilingual content, similar to how content collections are organized in subdirectories.

### 2. Tags System Implementation

**Problem**: Clicking tag badges redirects to `/tags/programming` but results in 404 errors.
**Need**:

- Create tag pages that list all content tagged with specific tags
- Filter content by user's current language
- Support multilingual tag navigation
- Integrate with existing badge system

## Current State Analysis

- Content collections: `src/content/{books,projects,lab,life}/`
- Tag badges: Working in `ContentMetadata.astro`
- Multilingual routing: `/[lang]/` structure
- Missing: Tag page routes and tag-based content filtering

## Proposed Solutions

### 1. Content Organization Options

**Option A**: External content files (like collections)

- Create `src/content/pages/` with language-specific subdirectories
- Import content into page components

**Option B**: Component-based architecture

- Create separate components for each language version
- Import appropriate component based on language

**Option C**: Template + data approach

- Use JSON/YAML files for page content
- Single template that renders data

### 2. Tags System Architecture

**Components needed**:

- `/[lang]/tags/` directory for tag listing
- `/[lang]/tags/[tag]/` for individual tag pages
- Tag filtering utilities
- Multilingual tag support

## Goals

1. Scalable content organization for multilingual pages
2. Working tag system with language-aware filtering
3. Consistent with existing content collection patterns
4. Maintainable and follows docs-driven protocol

## Implementation Status

### ✅ Completed

1. **Fixed tag links** - Updated ContentMetadata.astro to use language-aware URLs (`/${lang}/tags/[tag]`)
2. **Created tag pages structure** - Added `/[lang]/tags/` directory with index and individual tag pages
3. **Implemented content organization** - Created `src/content/pages/` collection for scalable multilingual content
4. **Updated about page** - Now uses content collection approach instead of inline conditionals
5. **Added proper TypeScript types** - Fixed type issues in tag pages

### 🔧 Technical Implementation

- **Tag Index Page**: `/[lang]/tags/index.astro` - Lists all tags with counts
- **Individual Tag Pages**: `/[lang]/tags/[tag].astro` - Shows content filtered by tag and language
- **Content Collection**: `src/content/pages/` with language-specific markdown files
- **Updated Schema**: Added `pages` collection to `content/config.ts`

### 📁 New File Structure

```
src/content/pages/
  about/
    en.md
    de.md
src/pages/[lang]/tags/
  index.astro
  [tag].astro
```

## Next Steps

- [x] Fix TypeScript errors in tag pages (completed)
- [ ] Test tag navigation functionality end-to-end
- [ ] Consider creating similar structure for contact page
- [ ] Add breadcrumb navigation to tag pages
- [ ] Implement tag search/filtering on tag index page

## Current Issues & Fixes Applied

### ✅ Fixed TypeScript Errors

- Added proper type definitions for `getStaticPaths` return type
- Fixed `Astro.props` type assertion in tag pages
- Resolved content entry property access issues

### 🔧 Technical Debt

- Tag pages now properly typed with `ContentEntry[]`
- Proper handling of collection entry IDs for routing
- URL encoding for tag names with special characters

## Edge Cases

- Tags that exist in one language but not another
- Content that has tags in multiple languages
- Tag URL encoding for special characters
- Pagination for large tag result sets

## Impact

- Better maintainability for large multilingual pages
- Working tag navigation enhances content discoverability
- Consistent with existing collection-based architecture
- Improved developer experience for content management
