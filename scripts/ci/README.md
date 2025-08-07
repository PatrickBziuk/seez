# Continuous Integration & Testing Scripts

This directory contains scripts specifically designed for CI/CD pipelines and automated testing of the content ecosystem.

## 📁 Contents

- `test-analysis.ts` - Simple content analysis testing utility
- `test-canonical.ts` - Debug and test canonical ID system
- `test-canonical-seo.ts` - Test SEO and canonical URL generation (moved to validation/)
- `test-routing.js` - Test language variant routing for all content
- `test-translations.js` - Test translation key completeness across locales

## 🚀 Quick Commands

```bash
# CI Testing Suite
pnpm run test:ci              # Run full CI test suite
pnpm run test:translations    # Test translation completeness
pnpm run test:routing         # Test routing for all language variants

# Individual Tests
npx tsx scripts/ci/test-analysis.ts          # Test content analysis
npx tsx scripts/ci/test-canonical.ts         # Test canonical system
```

## 🧪 Test Suite Overview

### Translation Completeness Testing

Validates that all translation keys are present across all supported locales.

```javascript
// test-translations.js
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const de = JSON.parse(fs.readFileSync('src/locales/de.json', 'utf8'));

// Flatten nested translation objects
function flatten(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix ? `${prefix}.` : '';
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(acc, flatten(obj[k], pre + k));
    } else {
      acc[pre + k] = String(obj[k]);
    }
    return acc;
  }, {});
}

// Find missing keys
const missingInDe = Object.keys(enFlat).filter((key) => !(key in deFlat));
const missingInEn = Object.keys(deFlat).filter((key) => !(key in enFlat));
```

### Routing Validation

Ensures all content has proper language variants and routing works correctly.

```javascript
// test-routing.js
const collections = ['books', 'projects', 'lab', 'life', 'pages'];
const languages = ['en', 'de'];

function validateRoutes(collection) {
  const entries = getContentEntries(collection);
  for (const entry of entries) {
    for (const lang of languages) {
      // Verify route existence for each language variant
      const routeExists = checkRouteExists(`/${lang}/${collection}/${entry}`);
      if (!routeExists) {
        errors.push(`Missing ${lang} route for ${collection}/${entry}`);
      }
    }
  }
}
```

### Content Analysis Testing

Simple testing utility for content discovery and analysis.

```typescript
// test-analysis.ts
async function testContentDiscovery(): Promise<void> {
  const contentFiles = await glob('src/content/{books,projects,lab,life}/**/*.{md,mdx}');

  console.log(`Found ${contentFiles.length} content files:`);
  for (const file of contentFiles) {
    console.log(`  ${file}`);
  }
}
```

### Canonical System Testing

Debug and test the canonical ID system functionality.

```typescript
// test-canonical.ts
try {
  import('./content-canonical-system.js')
    .then((module) => {
      console.log('✅ Canonical system module loaded');
      console.log('Running scan...');
      module.scanAndUpdateContent();
    })
    .catch((error) => {
      console.error('❌ Import error:', error);
    });
} catch (error) {
  console.error('❌ Error:', error);
}
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-tests.yml
name: CI Content Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  content-tests:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run translation tests
        run: pnpm run test:translations

      - name: Run routing tests
        run: pnpm run test:routing

      - name: Run content analysis
        run: npx tsx scripts/ci/test-analysis.ts

      - name: Test canonical system
        run: npx tsx scripts/ci/test-canonical.ts
```

### Test Exit Codes

All CI tests use proper exit codes for pipeline integration:

```javascript
// Success
if (allTestsPassed) {
  console.log('✅ All tests passed');
  process.exit(0);
}

// Failure
if (hasErrors) {
  console.error('❌ Tests failed:', errors);
  process.exit(1);
}
```

## 📊 Test Coverage

### Translation Testing Coverage

- **Locale Files**: Tests all supported locale files (`en.json`, `de.json`)
- **Nested Keys**: Validates deeply nested translation structures
- **Key Symmetry**: Ensures bidirectional key completeness
- **Format Validation**: Validates translation file JSON structure

### Routing Testing Coverage

- **Collection Coverage**: Tests all content collections
- **Language Variants**: Tests all supported language routes
- **Content Discovery**: Validates content file discovery
- **Route Generation**: Tests dynamic route generation

### Content Testing Coverage

- **File Discovery**: Tests content file discovery across collections
- **Format Support**: Tests both `.md` and `.mdx` file support
- **Structure Validation**: Basic content structure validation
- **Canonical Integration**: Tests canonical ID system integration

## 🔧 Configuration

### Test Configuration

```typescript
const CI_CONFIG = {
  supportedLanguages: ['en', 'de'],
  contentCollections: ['books', 'projects', 'lab', 'life', 'pages'],
  localeFiles: ['src/locales/en.json', 'src/locales/de.json'],
  contentGlob: 'src/content/**/*.{md,mdx}',
  timeoutMs: 30000,
};
```

### Test Environment Variables

```bash
# Optional test configuration
CI_VERBOSE=true          # Enable verbose test output
CI_TIMEOUT=60000        # Test timeout in milliseconds
CI_FAIL_FAST=true       # Stop on first test failure
```

## 📈 Performance

### Test Execution Speed

- **Translation Tests**: ~1 second for typical locale files
- **Routing Tests**: ~2-5 seconds depending on content volume
- **Content Analysis**: ~3-10 seconds for full content discovery
- **Canonical Tests**: ~2-5 seconds for system validation

### Optimization Strategies

- **Parallel Execution**: Run independent tests in parallel
- **Incremental Testing**: Test only changed content when possible
- **Caching**: Cache content discovery results for repeated tests
- **Early Exit**: Fail fast on critical errors

## 🐛 Troubleshooting

### Common CI Test Failures

**Translation Test Failures**

```bash
# Missing translation keys
Error: Missing translation keys:
In de.json: ['nav.home', 'footer.copyright']
In en.json: ['nav.blog']

# Fix: Add missing keys to locale files
echo '{"nav": {"home": "Startseite"}}' >> src/locales/de.json
```

**Routing Test Failures**

```bash
# Missing language routes
Error: Missing de route for books/programming-guide

# Fix: Ensure content exists for all languages or update routing logic
ls src/content/books/de/programming-guide.md
```

**Content Analysis Failures**

```bash
# Content discovery issues
Error: No content files found

# Fix: Check content directory structure
ls -la src/content/
```

**Canonical System Failures**

```bash
# Module loading errors
Error: Cannot import canonical system module

# Fix: Check module paths and dependencies
npx tsx scripts/content/content-canonical-system.ts scan
```

### Performance Issues

**Slow Test Execution**

```bash
# Enable parallel execution
CI_PARALLEL=true pnpm run test:ci

# Reduce test scope for debugging
CI_COLLECTIONS=books pnpm run test:routing
```

**Memory Issues**

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run test:ci
```

## 📋 Test Reports

### Test Output Format

```bash
# Translation Test Report
✅ All translation keys are present in both en.json and de.json.
📊 Tested 45 translation keys across 2 locales

# Routing Test Report
✅ All language variant routes exist for content entries.
📊 Tested 28 content entries across 2 languages (56 routes total)

# Content Analysis Report
✅ Content analysis complete
📊 Found 16 content files across 4 collections
```

### Error Reporting

```bash
# Detailed error reports for debugging
❌ Translation Test Failed:
   Missing in de.json: nav.settings, footer.privacy
   Missing in en.json: nav.impressum

❌ Routing Test Failed:
   Missing de variant for books/advanced-programming
   Missing en variant for life/meine-reise

❌ Content Analysis Failed:
   Cannot read directory: src/content/projects
   Permission denied: src/content/lab/restricted.md
```

## 🔮 Future Enhancements

### Planned Testing Features

- **Visual Regression Testing**: Screenshot-based testing for content rendering
- **Performance Testing**: Load testing for content delivery
- **A11y Testing**: Accessibility testing for all content pages
- **SEO Testing**: Comprehensive SEO validation and scoring
- **Content Quality Testing**: AI-powered content quality assessment

### Advanced CI Integration

- **Test Parallelization**: Advanced parallel test execution
- **Flaky Test Detection**: Identify and handle unreliable tests
- **Test Analytics**: Detailed test performance and failure analytics
- **Dynamic Test Generation**: Generate tests based on content structure
- **Integration Testing**: End-to-end content pipeline testing

### Monitoring & Alerting

- **Real-time Alerts**: Immediate notifications for test failures
- **Trend Analysis**: Test performance trends over time
- **Failure Prediction**: Predict potential test failures based on changes
- **Recovery Testing**: Automated recovery and retry mechanisms
- **Health Dashboards**: Visual dashboards for CI/CD health monitoring
