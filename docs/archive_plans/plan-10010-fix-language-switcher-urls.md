# Plan 10010: Fix Language Switcher URL Generation

## Goal
Fix the language switcher to properly generate URLs with language prefixes for both EN and DE, preventing 404 errors when switching from DE back to EN.

## Problem
When switching from DE to EN, the language switcher generated URLs without the `/en/` prefix (e.g., `/books/slug` instead of `/en/books/slug`), causing 404 errors because the routing structure uses `/[lang]/` for all routes.

## Root Cause
The `getLocalizedUrl` function in `~/utils/i18n.ts` assumed EN was the "default" language and didn't need a prefix, but the routing structure requires language prefixes for all languages.

## Solution
Modified `getLocalizedUrl` to always include language prefixes for all languages, matching the `/[lang]/` routing structure.

## Steps
1. [x] Identify the issue in `getLocalizedUrl` function
2. [x] Update function to always include language prefix
3. [x] Verify redirect pages use consistent pattern
4. [x] Document fix in plan and todo

## Impact
- Fixes 404 errors when switching languages
- Ensures consistent URL structure across all languages
- Maintains backward compatibility with existing redirects

## Checklist
- [x] Fix getLocalizedUrl function
- [x] Verify redirect consistency
- [x] Document changes
- [x] Test language switching functionality

## Status: ✅ COMPLETED
Language switcher now properly generates URLs with language prefixes for both EN and DE, preventing 404 errors.
