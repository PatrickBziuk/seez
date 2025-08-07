# Plan 10027: Fix /en/ Trailing Slash 404 Error

**Plan Number:** 10027
**Feature Title:** Resolve 404 error for /en/ routes and fix logo navigation
**Goal:** Fix 404 errors when accessing language routes with trailing slashes (/en/, /de/) and ensure logo navigation works correctly.

---

## Problem Statement

When users directly access `localhost:4321/en/` or click on the logo (which should remain clickable), they encounter a 404 error. This happens because:

1. The middleware only handles root path `/` but doesn't handle language routes with trailing slashes
2. The astro.config.ts has `trailingSlash: 'never'` but this isn't working effectively for language routes
3. Logo navigation may be generating URLs that lead to 404s

## Root Cause Analysis

After examining the codebase:

1. **Middleware Gap**: `src/middleware.ts` only handles `/` path, not `/en/` or `/de/`
2. **Route Structure**: `src/pages/[lang]/index.astro` creates `/en` and `/de` routes (without trailing slash)
3. **Configuration Conflict**: `trailingSlash: 'never'` should redirect `/en/` → `/en` but doesn't work with the current i18n setup
4. **Navigation Issue**: Logo links to `getLocalizedUrl('/', safeLocale)` which should work but routing fails

## Solution Overview

Extend the middleware to handle trailing slash redirects for language routes, ensuring consistent URL structure throughout the application.

## Technical Implementation

### 1. Update Middleware (`src/middleware.ts`)

Add logic to handle language routes with trailing slashes:

```typescript
// Add after root path handling, before return next()
// Handle language routes with trailing slashes
if (url.pathname.match(/^\/(en|de)\/$/)) {
  const langCode = url.pathname.replace(/\/$/, ''); // Remove trailing slash
  return redirect(langCode, 302);
}
```

### 2. Verify Logo Navigation

Ensure Header.astro logo link generates correct URLs without trailing slashes.

### 3. Test All Scenarios

- Direct access to `/en/` and `/de/`
- Logo clicks from different pages
- Root `/` access and language detection
- Navigation consistency throughout the app

## Implementation Steps

1. **T27-001**: Update middleware to handle trailing slash language routes
2. **T27-002**: Verify logo navigation generates correct URLs
3. **T27-003**: Test all navigation scenarios comprehensively
4. **T27-004**: Ensure no regressions in existing language detection

## Acceptance Criteria

- [x] Direct access to `/en/` redirects to `/en` (no 404)
- [x] Direct access to `/de/` redirects to `/de` (no 404)
- [x] Logo clicks navigate to correct language homepage
- [x] Root `/` access still works with language detection
- [x] No 404 errors for any standard navigation patterns
- [x] Consistent URL structure (no trailing slashes)

## Implementation Completed

### Changes Made

1. **Updated `src/middleware.ts`**: Added trailing slash handling for language routes

   ```typescript
   // Handle language routes with trailing slashes (e.g., /en/, /de/)
   // Redirect to non-trailing slash versions to match trailingSlash: 'never' config
   const trailingSlashLangMatch = url.pathname.match(/^\/(en|de)\/$/);
   if (trailingSlashLangMatch) {
     const langCode = trailingSlashLangMatch[1];
     return redirect(`/${langCode}`, 302);
   }
   ```

2. **Verified logo navigation**: Confirmed Header.astro correctly uses `getLocalizedUrl('/', safeLocale)`

3. **Tested all scenarios**: Used Simple Browser to verify routes work correctly

### Results

- ✅ `/en/` now redirects to `/en` properly
- ✅ `/de/` now redirects to `/de` properly
- ✅ Logo navigation works correctly
- ✅ Root `/` access maintains language detection
- ✅ No 404 errors for standard navigation patterns

## Edge Cases Handled

1. **Direct URL Access**: Users typing `/en/` in address bar
2. **Logo Navigation**: Clicking logo from any page
3. **Bookmark Compatibility**: Bookmarked URLs with trailing slashes
4. **SEO Consistency**: All language routes use consistent URL structure

## Testing Notes

- Test with dev server on port 4321/4322
- Verify browser navigation and direct URL access
- Check logo clickability and target URLs
- Ensure no JavaScript errors in console

## Impact

- **User Experience**: Eliminates 404 errors for common navigation patterns
- **SEO**: Consistent URL structure across the site
- **Reliability**: Logo navigation works consistently
- **Maintenance**: Clear routing logic in middleware

---

**Priority**: High (Navigation critical functionality)
**Estimated Effort**: 1-2 hours
**Dependencies**: None
**Risk Level**: Low (focused middleware change)
