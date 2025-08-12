# Content Review and Publication Workflow

This document describes the enhanced content review and publication workflow that ensures only properly reviewed and finalized content gets published.

## Overview

The new workflow implements a strict review process with the following stages:

1. **Draft Creation** - Content is created in German or English
2. **Translation Generation** - AI generates translations (marked as draft)
3. **Human Review** - Both content and translations are reviewed
4. **Publication Ready** - Content can be pushed and deployed

## Workflow Steps

### 1. Content Creation & Commit

When you create or edit content and commit via VS Code:

```bash
git add src/content/books/en/my-article.md
git commit -m "feat: add new article"
```

**What happens during pre-commit:**
- Content validation and registry updates
- AI translation generation (if needed)
- Translations are created with `draft: true` and review flags set to `false`
- All generated translations are automatically staged

### 2. Review Generated Translations

After commit, review the generated AI translations:

```bash
# Check review status of a file
pnpm run review:status src/content/books/de/my-article.md

# Review and approve content
pnpm run review:approve src/content/books/en/my-article.md "your-github-username"

# Review and approve translation
pnpm run review:translation src/content/books/de/my-article.md "your-github-username"

# Or approve both at once
pnpm run review:all src/content/books/de/my-article.md "your-github-username" --notes "Excellent translation"
```

### 3. Manual Review Process

For each piece of content, manually:

1. **Review Content Quality**
   - Read through the content
   - Check for accuracy, clarity, and completeness
   - Make any necessary edits

2. **Review Translation Quality** (for AI translations)
   - Compare translation with original
   - Check terminology and context
   - Make translation improvements if needed

3. **Mark as Reviewed**
   - Use the review helper scripts
   - Or manually update frontmatter

### 4. Publication Push

When content is ready for publication:

```bash
git add .
git commit -m "feat: review and approve content for publication"
git push origin main
```

**What happens during pre-push:**
- Publication readiness validation
- Checks that content is not in draft state
- Verifies review flags are set to `true`
- Blocks push if requirements not met

## Frontmatter Schema

### Required Review Metadata

```yaml
---
title: "Your Content Title"
draft: false  # Must be false for publication
language: en
status:
  authoring: Human
  translation: AI  # For AI translations
  review:
    content: true      # Human reviewed content quality
    translation: true  # Human reviewed translation quality (for translations)
    reviewer: "github-username"
    reviewDate: "2025-08-10T15:30:00Z"
    notes: "Optional review notes"
---
```

### Example: Original Content

```yaml
---
title: "My Great Article"
draft: false
language: en
status:
  authoring: Human
  review:
    content: true
    reviewer: "john-doe"
    reviewDate: "2025-08-10T15:30:00Z"
---
```

### Example: AI Translation

```yaml
---
title: "Mein großartiger Artikel"
draft: false
language: de
translationOf: "slug-20250810-abc12345"
sourceLanguage: en
status:
  authoring: Human
  translation: AI
  review:
    content: true
    translation: true
    reviewer: "jane-doe"
    reviewDate: "2025-08-10T16:00:00Z"
    notes: "Fixed some terminology, otherwise excellent"
---
```

## Publication Readiness Criteria

Content is ready for publication when ALL of the following are true:

1. **Not in draft state**: `draft: false` or `draft` field absent
2. **Content reviewed**: `status.review.content: true`
3. **Translation reviewed** (for AI translations): `status.review.translation: true`
4. **Reviewer identified**: `status.review.reviewer` field set

## Available Commands

### Review Commands

```bash
# Show current review status
pnpm run review:status <file-path>

# Mark content as reviewed and remove draft status
pnpm run review:approve <file-path> <reviewer-name>

# Mark translation as reviewed and remove draft status
pnpm run review:translation <file-path> <reviewer-name>

# Mark both content and translation as reviewed
pnpm run review:all <file-path> <reviewer-name> --notes "Optional notes"
```

### Validation Commands

```bash
# Check publication readiness of staged files
pnpm run validate:publication

# Check translation needs
pnpm run translations:check-registry
```

## Error Resolution

### Common Error: "Content is in draft state"

```bash
# Solution: Review content and remove draft status
pnpm run review:approve src/content/path/to/file.md "your-username"
```

### Common Error: "Content has not been reviewed"

```bash
# Solution: Mark as reviewed after human review
pnpm run review:approve src/content/path/to/file.md "your-username"
```

### Common Error: "AI translation has not been reviewed"

```bash
# Solution: Review translation and mark as approved
pnpm run review:translation src/content/path/to/file.md "your-username"
```

## Manual Frontmatter Updates

You can also manually update the frontmatter instead of using scripts:

```yaml
# Change this:
draft: true
status:
  review:
    content: false
    translation: false

# To this:
draft: false
status:
  review:
    content: true
    translation: true  # For translations
    reviewer: "your-github-username"
    reviewDate: "2025-08-10T15:30:00Z"
    notes: "Reviewed and approved"
```

## Integration with CI/CD

- **Pre-commit**: Generates translations, marks them as draft
- **Pre-push**: Validates publication readiness, blocks unreviewed content
- **CI/CD**: Only reviewed, non-draft content reaches production

This ensures that your production site only contains properly reviewed and approved content, maintaining high quality standards while leveraging AI for translation efficiency.
