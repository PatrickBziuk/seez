# Workflow Migration Plan

**Date**: August 27, 2025  
**Objective**: Consolidate multiple conflicting workflows into a single, reliable CI/CD pipeline

## 🎯 Current Problem

### Workflow Conflicts
Multiple workflows triggering on the same events causing:
- ❌ **Queue conflicts**: Workflows getting stuck in "queued" state
- ❌ **Resource waste**: Multiple redundant builds for single commits
- ❌ **Deployment inconsistency**: Race conditions between workflows
- ❌ **No cancellation**: Previous runs continue even when new commits arrive

### Current Workflows (Conflicting)
1. **`ci-cd.yml`** - Triggers on `push: main` - builds and validates
2. **`release.yml`** - Triggers on `push: main` - builds and deploys  
3. **`comprehensive-testing.yml`** - Triggers on `push: main` - runs tests

## ✅ Solution: Consolidated Pipeline

### New Architecture: `main-cicd.yml`
Single workflow with clear phases and proper concurrency controls:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Workflow Phases
1. **🔍 Validate** - Content schema validation with auto-fix
2. **🏗️ Build** - Site build with quality checks  
3. **🧪 Test** - Comprehensive testing in parallel matrix
4. **📊 Summary** - Test success rate calculation and deployment gate
5. **🚀 Deploy** - GitHub Pages deployment (main branch only)

### Key Improvements
- ✅ **Single workflow** - No conflicts or coordination issues
- ✅ **Automatic cancellation** - Previous runs cancelled on new commits
- ✅ **Conditional deployment** - Only deploys if tests pass (>75% success rate)
- ✅ **Self-healing** - Auto-fixes content schema issues
- ✅ **Parallel testing** - Faster test execution with matrix strategy
- ✅ **Failure handling** - Auto-creates GitHub issues for failures

## 🔧 Migration Steps

### Phase 1: Deploy New Workflow ✅
- [x] Created `main-cicd.yml` with consolidated functionality
- [x] Added concurrency controls and proper job dependencies
- [x] Integrated all features from existing workflows

### Phase 2: Disable Conflicting Workflows
Move these files to prevent execution:

```bash
# Rename to disable (keeps history but prevents execution)
mv .github/workflows/ci-cd.yml .github/workflows/ci-cd.yml.disabled
mv .github/workflows/release.yml .github/workflows/release.yml.disabled  
mv .github/workflows/comprehensive-testing.yml .github/workflows/comprehensive-testing.yml.disabled
```

### Phase 3: Keep Supporting Workflows
These workflows serve different purposes and should remain active:
- ✅ **`translation.yml`** - Translation automation
- ✅ **`cleanup-translate-branches.yml`** - Branch cleanup
- ✅ **`manual-deploy.yml`** - Emergency manual deployment
- ✅ **`manual-regen.yml`** - Manual regeneration tasks
- ✅ **`post-release-sync.yml`** - Post-deployment sync tasks
- ✅ **`enhanced-testing.yml`** - Enhanced testing features

## 📊 Expected Results

### Before Migration
- 🔴 Multiple workflows triggering on same event
- 🔴 Queue conflicts and stuck workflows  
- 🔴 No automatic cancellation
- 🔴 Redundant builds wasting resources

### After Migration  
- 🟢 Single workflow handling all CI/CD
- 🟢 Automatic cancellation of previous runs
- 🟢 Conditional deployment based on test results
- 🟢 Clear status monitoring in single place

## 🚦 Deployment Strategy

### 1. Test New Workflow
- Deploy `main-cicd.yml` alongside existing workflows
- Monitor a few runs to ensure it works correctly
- Verify all phases execute properly

### 2. Gradual Migration
- Disable one conflicting workflow at a time
- Monitor for any issues
- Keep fallback workflows available initially

### 3. Full Cutover
- Once new workflow proves stable, disable all conflicting workflows
- Update documentation and team procedures
- Monitor deployment success rate

## 🔍 Monitoring & Validation

### Success Metrics
- ✅ **Deployment success rate** >95%
- ✅ **Build time** <5 minutes average
- ✅ **Test success rate** >75% (deployment threshold)
- ✅ **Zero queue conflicts** or stuck workflows

### Rollback Plan
If issues arise:
1. Re-enable `release.yml` for immediate deployments
2. Disable `main-cicd.yml` temporarily  
3. Fix issues in new workflow
4. Re-attempt migration

## 📋 Team Communication

### Before Migration
- [ ] Announce workflow changes to team
- [ ] Document new failure handling (GitHub issues)
- [ ] Update deployment procedures

### After Migration  
- [ ] Confirm successful deployments
- [ ] Update any CI/CD documentation
- [ ] Remove disabled workflow files after 30 days

This migration will resolve the current deployment reliability issues and provide a more robust, maintainable CI/CD pipeline.