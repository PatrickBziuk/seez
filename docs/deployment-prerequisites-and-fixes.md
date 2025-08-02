# Deployment Scripts Prerequisites and Fixes

## 🔧 Issues Fixed

### 1. GitHub Actions Version Error
**Fixed in**: `manual-regen.yml` and `translation-pipeline.yml`
- **Issue**: `actions/setup-node@v20` doesn't exist
- **Fix**: Updated to `actions/setup-node@v4` with explicit Node.js version 20

### 2. YAML Syntax Error in Translation Pipeline
**Fixed in**: `translation-pipeline.yml`
- **Issue**: Nested mappings error and invalid GitHub context variable
- **Fixes Applied**:
  - Added quotes around string values to prevent YAML parsing issues
  - Changed `${{ github.sha_short }}` to `${{ github.run_number }}` (sha_short doesn't exist)
  - Fixed `labels` field formatting using proper YAML list syntax
  - Enhanced PR body with more context information

## 📋 Prerequisites You Need to Fulfill

### 1. Required Branches
**Current Status**: Only `main` branch exists
**Required Actions**:
```bash
# Create the release branch (required by post-release-sync.yml)
git checkout -b release
git push origin release
git checkout main
```

### 2. Required Dependencies
**Missing packages** needed for translation scripts:
```bash
# Install missing dependencies for translation pipeline
pnpm add openai octokit

# Or add to package.json devDependencies:
# "openai": "^4.0.0",
# "octokit": "^3.0.0"
```

### 3. GitHub Secrets and Permissions
**Required for workflows to function**:
- `GITHUB_TOKEN`: Usually available by default, but verify it has proper permissions
- `OPENAI_API_KEY`: Required if you want to use the translation generation features
  - Add this in GitHub repository settings → Secrets and variables → Actions

### 4. Environment Variables (Optional)
For translation pipeline customization:
- `TRANSLATION_QUALITY_THRESHOLD`: Default 70 (used in generate_translations.ts)
- `GITHUB_REPOSITORY`: Automatically provided by GitHub Actions

## 🔄 Workflow Overview

Your deployment consists of 4 GitHub Actions workflows:

### 1. `translation-pipeline.yml`
- **Trigger**: Push to `main` branch
- **Purpose**: Detect missing translations and generate AI translations via OpenAI
- **Creates**: Draft PRs with translations targeting `release` branch
- **Dependencies**: OpenAI API key, Node.js, pnpm, translation scripts

### 2. `manual-regen.yml`
- **Trigger**: PR labeled with 'regen-needed'
- **Purpose**: Manually re-run translations on specific PRs
- **Dependencies**: Node.js, pnpm, translation scripts

### 3. `post-release-sync.yml`
- **Trigger**: Push to `release` branch
- **Purpose**: Sync approved translations back to `main` branch
- **Dependencies**: `release` branch must exist

### 4. `cleanup-translate-branches.yml`
- **Trigger**: PR closed/merged
- **Purpose**: Clean up temporary translation branches
- **Dependencies**: GitHub token with branch deletion permissions

## 🏗️ Branching Strategy

Your deployment uses this branching flow:
```
draft (optional) → main → translate/* (temporary) → release → main (sync back)
                     ↓
                 GitHub Pages deployment
```

- **main**: Primary development branch
- **release**: Deployment branch (serves GitHub Pages)
- **translate/***: Temporary AI translation branches (auto-created/cleaned)
- **draft**: Optional staging branch for content before main

## ✅ Next Steps

1. **Create release branch** (required):
   ```bash
   git checkout -b release
   git push origin release
   git checkout main
   ```

2. **Install missing dependencies**:
   ```bash
   pnpm add openai octokit
   ```

3. **Set up OpenAI API key** (if using translation features):
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add new secret: `OPENAI_API_KEY` with your OpenAI API key

4. **Test the setup**:
   ```bash
   # Test that scripts can run
   pnpm run check
   
   # Test translation detection (requires content)
   tsx scripts/check_translations.ts > tasks.json
   ```

## 🚨 Important Notes

- The workflows are designed to work with your Astro-based content in `src/content/{books,projects,lab,life}/`
- Translation scripts expect specific frontmatter schema (see `docs/plan-10016-translation-pipeline.md`)
- OpenAI costs: The pipeline includes a 2M token daily cap for cost control
- All AI-generated translations create draft PRs for human review before deployment

## 🔍 Validation

After completing the prerequisites, your workflows should:
- ✅ Pass GitHub Actions syntax validation
- ✅ Have access to required branches (`main`, `release`)
- ✅ Have all npm dependencies available
- ✅ Have proper GitHub permissions for PR creation and branch management

The deployment is now ready to use once you complete the prerequisite steps above.
