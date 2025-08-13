# Local Translation Workflow

This document explains how the local translation generation works with Husky git hooks.

## Setup

1. **Environment Configuration**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your OpenAI API key
   ```

2. **Install Dependencies**:

   ```bash
   pnpm install
   ```

3. **Husky Hook Installation**:
   Husky hooks are automatically installed via `pnpm prepare` script.

## How It Works

### Pre-commit Hook (`.husky/pre-commit`)

**Triggers**: When you commit changes to Markdown/MDX files in `src/content/`

**Process**:

1. **Content Validation**: Validates content structure and updates registry
2. **Translation Detection**: Checks for missing/stale translations using the canonical ID system
3. **Translation Generation**: If needed, generates translations using OpenAI API
4. **Auto-staging**: Automatically stages generated translation files

**Example Workflow**:

```bash
# Edit a content file
vim src/content/projects/en/my-project.mdx

# Commit triggers automatic translation
git add .
git commit -m "Add new project content"
# -> Hook detects missing German translation
# -> Generates German version automatically
# -> Stages new translation file
# -> Commit succeeds with both versions
```

### Pre-push Hook (`.husky/pre-push`) - Optional

**Triggers**: When you push commits

**Purpose**: Catch any missed translations before pushing to remote
**Behavior**: Similar to pre-commit but creates additional commit if needed

## Configuration

### Environment Variables

| Variable                        | Default  | Description                               |
| ------------------------------- | -------- | ----------------------------------------- |
| `OPENAI_API_KEY`                | Required | Your OpenAI API key                       |
| `TRANSLATION_QUALITY_THRESHOLD` | 70       | Minimum quality score for auto-acceptance |

### Quality Control

- Translations below threshold are flagged for human review
- Content hash system prevents translation loops
- Registry tracks translation relationships and status

## Troubleshooting

### Common Issues

1. **Hook doesn't run**:

   ```bash
   # Reinstall hooks
   pnpm prepare
   ```

2. **API key not working**:

   ```bash
   # Verify .env.local exists and has correct key
   cat .env.local | grep OPENAI_API_KEY
   ```

3. **Permission errors on Windows**:

   ```bash
   # Ensure WSL or Git Bash is used for hooks
   git config core.hooksPath .husky
   ```

4. **Skip translation for emergency commits**:
   ```bash
   git commit --no-verify -m "emergency fix"
   ```

## Manual Commands

You can also run translation commands manually:

```bash
# Check for missing translations
pnpm run translations:check-registry

# Generate translations manually
pnpm run translations:generate-registry

# Full validation
pnpm run validate:content
```

## Files Created/Modified

- **Generated translations**: `src/content/[collection]/[lang]/`
- **Registry updates**: `data/content-registry.json`
- **Token tracking**: `data/token-usage.json`

## Benefits

- ✅ **No CI overhead**: Translations happen locally, CI stays lean
- ✅ **Immediate feedback**: Know translation status before pushing
- ✅ **Consistent quality**: Registry-based system prevents drift
- ✅ **Cost efficient**: Only translates changed content
- ✅ **Git-integrated**: Natural part of commit workflow
