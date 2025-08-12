# Plan 10032: Root Directory Cleanup

**Date**: August 12, 2025  
**Goal**: Clean up the root directory of the Seez project to make it more organized and maintainable

## Current Root Directory Analysis

### Files Present in Root:
```
astro.config.ts              ✅ KEEP - Essential config
CNAME                        ✅ KEEP - GitHub Pages config
docker-compose.yml           ✅ KEEP - Docker setup
Dockerfile                   ✅ KEEP - Docker setup
eslint.config.js            ✅ KEEP - ESLint config
LICENSE.md                   ✅ KEEP - Legal requirement
netlify.toml                 ✅ KEEP - Netlify deployment
package.json                 ✅ KEEP - Essential config
playwright.config.ts         ✅ KEEP - Test configuration
pnpm-lock.yaml              ✅ KEEP - Package lock
README.md                    ✅ KEEP - Documentation
tailwind.config.js          ✅ KEEP - CSS framework config
tsconfig.json               ✅ KEEP - TypeScript config
translation.override.yml     ✅ KEEP - Translation pipeline

sandbox.config.json          🟡 EVALUATE - CodeSandbox config
stderr.log                   ❌ REMOVE - Development log
test_translation_tasks_small.json  ❌ REMOVE - Empty dev file
test-i18n.mjs               ❌ REMOVE - Development test script
test-reading-stats.js       ❌ REMOVE - Development test script
test-urls.js                ❌ REMOVE - Development test script
translation_tasks_debug.json ❌ REMOVE - Empty debug file
translation_tasks.json      🟡 MOVE - Generated file, should be in data/
update-imports.mjs          ❌ REMOVE - One-time migration script
vscode.tailwind.json        🔧 MOVE - VS Code specific, move to .vscode/
```

## Cleanup Strategy

### Phase 1: Safe Removals (Immediate)
Files that can be safely deleted without breaking anything:

1. **Development/Debug Files**:
   - `stderr.log` - Development log output
   - `test_translation_tasks_small.json` - Empty test file
   - `test-i18n.mjs` - Development test script
   - `test-reading-stats.js` - Development test script  
   - `test-urls.js` - Development test script
   - `translation_tasks_debug.json` - Empty debug file

2. **One-time Migration Scripts**:
   - `update-imports.mjs` - Component restructuring script (completed)

### Phase 2: File Relocations
Files that should be moved to more appropriate locations:

1. **VS Code Configuration**:
   - `vscode.tailwind.json` → `.vscode/tailwind.json`
   - Update `.vscode/settings.json` reference

2. **Generated Data Files**:
   - `translation_tasks.json` → `data/translation_tasks.json`
   - This is generated content that belongs with other data files

### Phase 3: Evaluation & Decision
Files that need careful evaluation:

1. **CodeSandbox Configuration**:
   - `sandbox.config.json` - Evaluate if still needed for development
   - Can be removed if CodeSandbox integration not used

### Phase 4: .gitignore Updates
Add patterns to prevent future clutter:

```ignore
# Development artifacts
*.log
*_debug.json
test-*.js
test-*.mjs
*_tasks_*.json

# Generated translation data (keep in data/ folder)
/translation_tasks.json
```

## Implementation Tasks

### Phase 1: Safe Removals
- [ ] **T32-001**: Remove development log files (`stderr.log`)
- [ ] **T32-002**: Remove empty test files (`test_translation_tasks_small.json`, `translation_tasks_debug.json`)
- [ ] **T32-003**: Remove development test scripts (`test-*.js`, `test-*.mjs`)
- [ ] **T32-004**: Remove completed migration script (`update-imports.mjs`)

### Phase 2: File Relocations  
- [ ] **T32-005**: Move `vscode.tailwind.json` to `.vscode/tailwind.json`
- [ ] **T32-006**: Update `.vscode/settings.json` to reference new location
- [ ] **T32-007**: Move `translation_tasks.json` to `data/translation_tasks.json`
- [ ] **T32-008**: Update any scripts that reference moved files

### Phase 3: Configuration Evaluation
- [ ] **T32-009**: Evaluate `sandbox.config.json` usage and remove if unused
- [ ] **T32-010**: Verify no dependencies on removed files

### Phase 4: Prevention Measures
- [ ] **T32-011**: Update `.gitignore` with cleanup patterns
- [ ] **T32-012**: Add documentation about root directory organization
- [ ] **T32-013**: Test build and deployment after cleanup

## Risk Assessment

### Low Risk (Safe to Remove)
- All development log and test files
- Empty JSON debug files
- Completed migration scripts

### Medium Risk (Move/Relocate)
- `vscode.tailwind.json` - Only affects VS Code, easy to fix
- `translation_tasks.json` - Generated file, can be regenerated

### High Risk (Evaluate Carefully)
- `sandbox.config.json` - May be used by CodeSandbox integration

## Expected Benefits

1. **Cleaner Root Directory**: Reduced visual clutter
2. **Better Organization**: Files in appropriate locations
3. **Easier Maintenance**: Clear separation of concerns
4. **Improved Developer Experience**: Easier to find important configs
5. **Reduced Confusion**: No stale development artifacts

## Rollback Plan

If issues arise:
1. All removed files are available in git history
2. Moved files can be moved back if needed
3. Updated references can be reverted
4. .gitignore changes can be undone

## Success Criteria

- [ ] Root directory contains only essential configuration files
- [ ] All builds and tests pass after cleanup
- [ ] VS Code integration still works properly
- [ ] Translation pipeline continues to function
- [ ] No broken references to moved/removed files
