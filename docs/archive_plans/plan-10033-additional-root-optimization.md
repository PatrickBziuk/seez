# Plan 10033: Additional Root Directory Optimization

**Date**: August 12, 2025  
**Goal**: Continue cleaning up the root directory by evaluating additional configuration files

## Analysis of Remaining Configuration Files

### Files Evaluated:

**Essential Configuration Files (KEEP)**:

```
.dockerignore           ✅ KEEP - Docker build optimization
.editorconfig          ✅ KEEP - Editor consistency across team
.npmrc                 ✅ KEEP - PNPM configuration for Astro
.prettierrc.cjs        ✅ KEEP - Code formatting configuration
Dockerfile             ✅ KEEP - Container deployment
docker-compose.yml     ✅ KEEP - Local container orchestration
netlify.toml           ✅ KEEP - Netlify deployment configuration
```

**Potentially Unused Files**:

```
.stackblitzrc          ❌ EVALUATE - StackBlitz online IDE config
```

## Investigation Results

### .stackblitzrc Analysis

- **Purpose**: Configuration for StackBlitz online IDE
- **Content**: Basic Node.js start command and CJS imports
- **Usage Check**: No references to "stackblitz" or "StackBlitz" found in codebase
- **README Check**: No mention of StackBlitz integration
- **Conclusion**: Likely unused legacy configuration

## Cleanup Recommendation

### Phase 1: Remove Unused StackBlitz Configuration

- [ ] **T33-001**: Remove `.stackblitzrc` as it appears unused
- [ ] **T33-002**: Verify no hidden dependencies on StackBlitz integration
- [ ] **T33-003**: Test build after removal

### Phase 2: Configuration File Optimization (Optional)

- [ ] **T33-004**: Consider moving `.prettierrc.cjs` to `package.json` if preferred
- [ ] **T33-005**: Evaluate if `.npmrc` content could be moved to `package.json`

## Risk Assessment

### Low Risk

- **`.stackblitzrc`**: No references found, safe to remove

### No Risk

- **All other configuration files**: Essential for their respective tools

## Benefits

- **Further root directory cleanup**: One less configuration file
- **Reduced confusion**: Remove unused tool configurations
- **Cleaner development setup**: Only active tool configs remain

## Implementation

This is a minimal cleanup focused on removing truly unused files while preserving all essential configuration.
