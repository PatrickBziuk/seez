# Deployment and Translation Strategy

This document outlines the new lean CI/CD approach with local translation generation and release-branch-only deployment.

## Overview

**Goal**: Keep CI lean (build/test/release only), shift translation generation to local development, deploy only from release branch.

**Benefits**:
- ✅ Faster CI pipelines (no translation overhead)
- ✅ Local translation feedback during development
- ✅ Better quality control through release branch gating
- ✅ Reduced CI costs and complexity
- ✅ More predictable deployments

## Deployment Strategy

### Branch-based Deployment Model

```
main branch     →  Build validation only (no deployment)
release branch  →  Build + Deploy to production
```

### Workflow Details

#### Main Branch (`main`)
- **Purpose**: Development integration, testing, validation
- **CI Actions**: 
  - ✅ Build validation
  - ✅ Type checking
  - ✅ Code quality checks (ESLint, Prettier)
  - ✅ Multi-version Node.js testing
- **No Actions**:
  - ❌ Deployment
  - ❌ Automatic translation generation
  - ❌ GitHub Pages upload

#### Release Branch (`release`)
- **Purpose**: Production deployment
- **CI Actions**:
  - ✅ Full build with optimizations
  - ✅ Content validation
  - ✅ Git metadata extraction
  - ✅ Deploy to GitHub Pages
- **Requirements**: All content must be complete with translations

### Promotion Workflow

```
1. Develop on feature branches
2. Merge to main (triggers build validation)
3. Local translation generation via Husky hooks
4. Merge completed work to release branch
5. Automatic deployment from release branch
```

## Translation Strategy

### Local-First Translation Generation

**Philosophy**: Generate translations locally during development, not in CI.

#### Husky Hook Integration

**Pre-commit Hook** (`.husky/pre-commit`):
- Triggers on changes to `src/content/**/*.{md,mdx}`
- Validates content structure
- Detects missing/stale translations
- Generates translations automatically
- Stages generated files

**Pre-push Hook** (`.husky/pre-push`):
- Optional safety net for missed translations
- Creates additional commit if needed

#### Local Workflow

```bash
# 1. Edit content
vim src/content/projects/en/my-project.mdx

# 2. Commit triggers automatic translation
git add .
git commit -m "Add new project"
# → Hook detects missing German translation
# → Generates German version with OpenAI
# → Stages new translation files
# → Commit succeeds with both versions

# 3. Push when ready
git push origin my-feature
# → Pre-push hook validates completeness
```

### Translation Quality Control

#### Registry-Based System
- **Content Registry**: `data/content-registry.json`
- **Canonical IDs**: Unique identifiers for content tracking
- **Hash Validation**: Prevents translation loops
- **Quality Scores**: AI confidence ratings

#### Quality Thresholds
- **Auto-accept**: Quality score ≥ 70%
- **Manual review**: Quality score < 70%
- **Flagging**: Content requiring human attention

### Manual Override Workflows

#### Emergency Manual Regeneration

**Via GitHub Actions** (Manual Dispatch):
```yaml
# Access via: Actions → Manual Translation Regeneration → Run workflow
inputs:
  mode: ['check-only', 'generate-missing', 'regenerate-all']
  target_language: 'de' # optional, empty = all languages
  create_pr: true # creates PR with results
```

**Via PR Labels**:
```bash
# Add 'regen-needed' label to any PR
# Triggers automatic regeneration on that branch
```

**Local Emergency Bypass**:
```bash
# Skip hooks for emergency commits
git commit --no-verify -m "emergency fix"

# Manual translation generation
pnpm run translations:check-registry
pnpm run translations:generate-registry
```

## CI Pipeline Architecture

### Lean CI Principles

**Main Branch CI** (`ci-cd.yml`):
- Multi-version Node.js testing (18, 20, 22)
- Build validation
- Code quality checks (allow failures)
- **No deployment**
- **No translation generation**

**Release Branch CI** (`release.yml`):
- Single Node.js version (20)
- Production build
- Content validation
- GitHub Pages deployment

### Removed Components

**Disabled**:
- ❌ Automatic translation triggering from main branch
- ❌ Translation pipeline job chaining
- ❌ GitHub Pages deployment from main branch
- ❌ Translation branch creation from CI

**Preserved**:
- ✅ Manual regeneration workflows
- ✅ Error reporting and issue creation
- ✅ Release branch synchronization
- ✅ Build failure notifications

## Migration Benefits

### Performance Improvements
- **CI Runtime**: Reduced by ~5-10 minutes per main branch push
- **API Costs**: Translation API calls only during local development
- **Pipeline Complexity**: Simplified linear workflows

### Developer Experience
- **Immediate Feedback**: Translation status known before pushing
- **Local Control**: Generate translations when convenient
- **Quality Assurance**: Review translations before committing
- **Emergency Bypasses**: Multiple escape hatches available

### Operational Benefits
- **Predictable Deployments**: Only from release branch
- **Content Completeness**: Enforced by release branch requirements
- **Reduced CI Failures**: Fewer moving parts in CI
- **Cost Efficiency**: API usage only when developing

## Troubleshooting

### Common Scenarios

#### "Hooks not running"
```bash
# Reinstall Husky hooks
pnpm prepare

# Check hook permissions (Windows)
git config core.hooksPath .husky
```

#### "Translation generation failed"
```bash
# Check API key
grep OPENAI_API_KEY .env.local

# Manual generation
pnpm run translations:generate-registry
```

#### "Emergency deployment needed"
```bash
# Direct push to release branch (bypass main)
git checkout release
git cherry-pick <commit-sha>
git push origin release
# → Triggers immediate deployment
```

#### "Local hooks too slow"
```bash
# Skip for quick commits
git commit --no-verify -m "quick fix"

# Generate translations later
pnpm run translations:check-registry
```

### Monitoring and Alerts

**GitHub Actions Notifications**:
- Build failures create GitHub issues
- Failed manual regeneration creates recovery issues
- Translation conflicts flagged for review

**Local Development Feedback**:
- Hook execution time displayed
- Translation quality scores shown
- Registry conflicts reported immediately

## Configuration

### Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | `.env.local` | Local translation generation |
| `TRANSLATION_QUALITY_THRESHOLD` | Workflows | Auto-acceptance threshold |

### Repository Settings

**Required Secrets**:
- `OPENAI_API_KEY`: OpenAI API access for manual workflows

**Branch Protection**:
- `main`: Require PR reviews, status checks
- `release`: Direct push allowed for emergency deployments

**GitHub Pages**:
- Source: GitHub Actions
- Deploy from: `release` branch only

## Future Enhancements

### Potential Improvements
- **Translation caching**: Cache API responses for identical content
- **Quality learning**: Improve thresholds based on review feedback
- **Batch optimization**: Group translation requests for efficiency
- **Preview deployments**: Temporary deployments for PR reviews

### Migration Monitoring
- **Track CI performance**: Measure speed improvements
- **Monitor translation quality**: Compare local vs CI-generated translations
- **Cost analysis**: Measure API usage reduction
- **Developer satisfaction**: Gather feedback on local workflow
