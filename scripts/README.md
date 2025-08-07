# Scripts Documentation

This directory contains all automation scripts for the Seez project, organized by functionality and purpose.

## 📁 Directory Structure

```
scripts/
├── ai/              # AI & Machine Learning Operations
├── ci/              # Continuous Integration & Testing
├── content/         # Content Management & Canonical System
├── docs/            # Script Documentation & Standards
├── translations/    # Translation Pipeline & Management
├── utils/           # General Utilities & Maintenance
└── validation/      # Content Validation & Quality Control
```

## 🚀 Quick Start

### Most Common Scripts

```bash
# Content Management
pnpm run content:scan           # Scan and update canonical IDs
pnpm run content:validate       # Validate content registry

# AI Operations
pnpm run tags:suggest           # Suggest tags for content
pnpm run tags:apply             # Apply tag suggestions
pnpm run tldr:generate          # Generate AI summaries

# Translation Pipeline
pnpm run translations:check     # Check for translation tasks
pnpm run translations:generate  # Generate missing translations

# Validation
pnpm run validate:content       # Validate content structure
pnpm run content:precommit      # Pre-commit validation
```

## 📋 Script Categories

### AI & Machine Learning (`ai/`)

- **Tag Management**: Automated content tagging with keyword analysis
- **TLDR Generation**: AI-powered content summarization
- **Token Tracking**: Monitor AI usage, costs, and environmental impact

### Content Management (`content/`)

- **Canonical System**: Unique content identification and registry management
- **Content Analysis**: Relationship detection and classification
- **Registry Operations**: Content metadata and translation tracking

### Translation Pipeline (`translations/`)

- **Translation Detection**: Find missing and stale translations
- **Translation Generation**: AI-powered content translation
- **Conflict Resolution**: Handle translation conflicts and updates

### Validation (`validation/`)

- **Content Validation**: Schema compliance and structure verification
- **Registry Validation**: Content registry integrity checks
- **Pre-commit Hooks**: Automated validation before commits

### Utilities (`utils/`)

- **Git Metadata**: Extract publish/modified dates from Git history
- **Content Migration**: Migrate content between schema versions
- **Error Extraction**: CI/CD error parsing and reporting

### CI/CD Testing (`ci/`)

- **Translation Tests**: Verify translation key completeness
- **Routing Tests**: Validate language variant routes
- **Canonical Tests**: Test SEO and canonical URL generation

## 🏗️ Development Standards

### Script Structure

Every script should follow this structure:

```typescript
#!/usr/bin/env tsx

/**
 * Script Name - Brief Description
 * @purpose Detailed explanation of what this script does
 * @dependencies List of required dependencies
 * @usedBy Where/how this script is used (CI/CD, manual, etc.)
 * @example pnpm run script-name --option
 */

// Imports
import { ... } from '...';

// Configuration constants
const CONFIG = {
  // Script configuration
};

// Interfaces/Types
interface ScriptOptions {
  // Type definitions
}

// Main functions
async function main() {
  // Implementation
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Exports for programmatic use
export { main };
```

### Documentation Requirements

1. **Header Comment**: Purpose, dependencies, usage examples
2. **Type Definitions**: Clear interfaces for all data structures
3. **Error Handling**: Comprehensive error handling with meaningful messages
4. **CLI Support**: Support for command-line execution
5. **Export Support**: Allow programmatic usage from other scripts

### Naming Conventions

- **Scripts**: `kebab-case.ts` (e.g., `validate-content.ts`)
- **Functions**: `camelCase` (e.g., `validateContent`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `CONTENT_BASE_PATH`)
- **Interfaces**: `PascalCase` (e.g., `ContentRegistry`)

## 🔧 Configuration

### Environment Variables

- `OPENAI_API_KEY`: Required for AI operations (translations, TLDR, tagging)
- `GITHUB_TOKEN`: Required for conflict detection and issue creation
- `GITHUB_REPOSITORY`: Repository identifier for GitHub operations

### File Paths

- Content: `src/content/{collection}/{language}/`
- Registry: `data/content-registry.json`
- Token Usage: `data/token-usage.json`
- Tag Registry: `src/data/tags/master-tag-registry.json`

## 📊 Monitoring & Metrics

### Token Usage Tracking

All AI operations are tracked for:

- Token consumption (input/output)
- Cost estimation
- CO2 environmental impact
- Operation timestamps

Access via:

```bash
pnpm run tokens:summary    # Current usage summary
pnpm run tokens:usage      # Detailed usage data
pnpm run tokens:export     # Export usage data
```

### Content Registry

Tracks content relationships and translation status:

- Canonical IDs for permanent content identification
- Translation relationships and status
- Content modification tracking
- File path management

## 🛠️ Troubleshooting

### Common Issues

**Script Not Found**

```bash
# Old path (deprecated)
npx tsx scripts/old-script.ts

# New path (current)
npx tsx scripts/category/script-name.ts
# or use npm scripts
pnpm run script:action
```

**Missing Dependencies**
Ensure all required packages are installed:

```bash
pnpm install
```

**Permission Issues**
Scripts may need file system permissions for:

- Reading/writing content files
- Updating registry files
- Creating backup directories

**Environment Variables**
Set required environment variables:

```bash
# .env file
OPENAI_API_KEY=your_api_key_here
GITHUB_TOKEN=your_github_token_here
```

## 📚 Further Reading

- [Content Management Documentation](./docs/content-management.md)
- [Translation Pipeline Guide](./docs/translation-pipeline.md)
- [AI Operations Manual](./docs/ai-operations.md)
- [Validation & Testing Guide](./docs/validation-testing.md)

## 🤝 Contributing

When adding new scripts:

1. Place in the appropriate category folder
2. Follow the standardized documentation format
3. Add corresponding npm script to `package.json`
4. Update relevant README files
5. Test both CLI and programmatic usage
6. Add error handling and validation

For questions or issues, refer to the specific category documentation or create an issue in the repository.
