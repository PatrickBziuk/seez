# GitHub Actions Workflow Documentation

## Overview

This document describes the consolidated GitHub Actions workflow structure that implements the translation pipeline with proper build dependencies and best practices.

## Workflow Structure

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers**:

- Pull requests to `main` branch
- Pushes to `main` branch

**Jobs**:

#### `test-build` (PR only)

- Tests build on Node.js versions 18, 20, 22
- Runs Astro sync, check, and build
- Ensures cross-version compatibility

#### `quality-check` (PR only)

- Runs ESLint and Prettier checks
- Continues on error to not block builds
- Provides code quality feedback

#### `build-and-deploy` (main push only)

- Builds and deploys to GitHub Pages
- Creates GitHub issues on build failures
- Outputs build success status for downstream jobs

#### `trigger-translation` (main push only)

- **Only runs after successful build**
- Calls the translation workflow
- Passes commit SHA and build status

### 2. Translation Pipeline (`translation.yml`)

**Triggers**:

- Called by main CI/CD workflow after successful build
- Receives commit SHA as input

**Jobs**:

#### `detect-translations`

- Runs `check_translations.ts` to find missing/stale translations
- Outputs whether translation tasks exist
- Uploads tasks file as artifact

#### `generate-translations`

- Only runs if translation tasks exist
- Downloads tasks file from previous job
- Runs `generate_translations.ts` with OpenAI API
- Runs `detect_conflicts.ts` to create issues for problems
- Uploads generated content as artifact

#### `create-translation-pr`

- Downloads generated translations
- Creates new `translate/*` branch with timestamp
- Commits translations and creates draft PR
- Cleans up empty branches if no changes

### 3. Manual & Maintenance Workflows

#### `manual-regen.yml`

- Triggers when PR is labeled with 'regen-needed'
- Re-runs translation generation for existing PRs
- Uses npm instead of pnpm for consistency

#### `post-release-sync.yml`

- Triggers on pushes to `release` branch
- Syncs approved translations back to `main`
- Cleans up merged translation branches

#### `cleanup-translate-branches.yml`

- Triggers when translation PRs are closed/merged
- Automatically deletes `translate/*` branches

## Key Improvements

### Build-First Architecture

- Translation pipeline only runs after successful build
- Prevents wasted API calls on broken builds
- Ensures translations are based on valid content

### Consistent Tooling

- All workflows use npm instead of pnpm
- Consistent Node.js version (20) for production workflows
- Proper dependency caching

### Error Handling

- Build failures automatically create GitHub issues
- Translation conflicts create issues with actionable information
- Proper cleanup of failed/empty operations

### Artifact Management

- Translation tasks passed between jobs via artifacts
- Generated content properly staged and committed
- Cache directory included for translation optimization

## Branching Strategy

```
draft → main → translate/* → release → main (sync)
```

1. **draft**: Development and content creation
2. **main**: Trigger point for CI/CD and translation detection
3. **translate/\***: AI-generated translations in draft PRs
4. **release**: Human-approved content deployed to production
5. **main (sync)**: Approved translations fed back for future iterations

## Environment Variables & Secrets

Required secrets:

- `GITHUB_TOKEN`: Automatically provided, used for PR/issue creation
- `OPENAI_API_KEY`: Required for translation generation

Environment variables:

- `TRANSLATION_QUALITY_THRESHOLD`: Set to 70 for quality filtering
- `NODE_VERSION`: Set to '20' for consistency

## Package.json Scripts

New scripts added to support workflows:

- `translations:check`: Run translation detection
- `translations:generate`: Generate translations from tasks file
- `translations:conflicts`: Detect and report translation conflicts

## Monitoring & Debugging

### Build Failures

- Automatic GitHub issue creation with error details
- Link to failed workflow run
- Extracted error information when available

### Translation Issues

- Automatic conflict detection and issue creation
- Quality score monitoring in frontmatter
- Cache management for API optimization

### Branch Management

- Automatic cleanup of merged/closed translation branches
- Timestamp-based branch naming for uniqueness
- Proper cleanup of empty or failed operations

## Usage

### For Content Authors

1. Create content in `draft` branch
2. Merge to `main` when ready
3. Wait for automatic translation PR creation
4. Review and edit translations in draft PR
5. Merge to `release` when approved

### For Developers

1. All workflows use npm - run `npm ci` locally
2. Use `npm run translations:check` to test detection
3. Monitor GitHub issues for build/translation problems
4. Review translation PRs for quality before merging

### Manual Overrides

1. Add 'regen-needed' label to translation PRs to regenerate
2. Use translation.override.yml to skip specific content
3. Manual cleanup available via repository settings if needed

## Troubleshooting

### Common Issues

- **Translation not triggered**: Check if main build succeeded
- **Empty translation PR**: No new/changed content detected
- **API limits**: Check OPENAI_API_KEY and usage quotas
- **Branch conflicts**: Review conflicting translations in issues

### Recovery Actions

- Re-run workflows from GitHub Actions tab
- Add 'regen-needed' label for translation regeneration
- Manual branch cleanup via Git if automated cleanup fails
- Check workflow logs for detailed error information
