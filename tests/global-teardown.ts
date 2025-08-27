import type { FullConfig } from '@playwright/test';
import fs from 'fs';

/**
 * Global Teardown for Plan 10029 Comprehensive Testing
 *
 * Cleans up test artifacts, generates summary reports,
 * and performs any necessary cleanup operations.
 */

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Starting global teardown...');

  try {
    // Generate test summary
    console.log('📊 Generating test summary...');

    // Ensure output directory exists
    const outputDir = 'test-results';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const testMetadataPath = 'test-results/test-metadata.json';
    const resultsPath = 'test-results/results.json';

    let testMetadata = {};
    let testResults = {};

    // Read existing metadata
    if (fs.existsSync(testMetadataPath)) {
      testMetadata = JSON.parse(fs.readFileSync(testMetadataPath, 'utf8'));
    }

    // Read test results if available
    if (fs.existsSync(resultsPath)) {
      testResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    }

    // Create comprehensive summary
    const summary = {
      ...testMetadata,
      teardownTime: new Date().toISOString(),
      testResults: testResults,
      artifacts: {
        screenshots: fs.existsSync('test-results/screenshots') ? fs.readdirSync('test-results/screenshots').length : 0,
        videos: fs.existsSync('test-results/videos') ? fs.readdirSync('test-results/videos').length : 0,
        traces: fs.existsSync('test-results/traces') ? fs.readdirSync('test-results/traces').length : 0,
      },
    };

    // Save summary
    fs.writeFileSync('test-results/test-summary.json', JSON.stringify(summary, null, 2));

    console.log('✅ Test summary generated');

    // Generate markdown report for easy reading
    const markdownReport = generateMarkdownReport(summary);
    fs.writeFileSync('test-results/test-report.md', markdownReport);

    console.log('✅ Markdown report generated');

    // Clean up temporary files if in CI
    if (process.env.CI) {
      console.log('🗑️ Cleaning up temporary files in CI...');

      // Remove large trace files to save space
      if (fs.existsSync('test-results/traces')) {
        const traceFiles = fs.readdirSync('test-results/traces');
        for (const file of traceFiles) {
          if (file.endsWith('.zip')) {
            fs.unlinkSync(`test-results/traces/${file}`);
          }
        }
      }

      console.log('✅ Cleanup completed');
    }

    console.log('🎯 Global teardown completed successfully!');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
}

interface TestSummary {
  setupTime?: string;
  teardownTime?: string;
  environment?: string;
  baseURL?: string;
  version?: string;
  testResults?: {
    stats?: {
      total?: number;
      passed?: number;
      failed?: number;
      skipped?: number;
    };
  };
  artifacts?: {
    screenshots?: number;
    videos?: number;
    traces?: number;
  };
}

function generateMarkdownReport(summary: TestSummary): string {
  const setupTime = new Date(summary.setupTime || Date.now()).toLocaleString();
  const teardownTime = new Date(summary.teardownTime || Date.now()).toLocaleString();

  return `# Test Report

## Test Execution Summary

- **Setup Time**: ${setupTime}
- **Teardown Time**: ${teardownTime}
- **Environment**: ${summary.environment || 'unknown'}
- **Base URL**: ${summary.baseURL || 'unknown'}
- **Version**: ${summary.version || 'unknown'}

## Test Artifacts

- **Screenshots**: ${summary.artifacts?.screenshots || 0}
- **Videos**: ${summary.artifacts?.videos || 0}
- **Traces**: ${summary.artifacts?.traces || 0}

## Test Results

${
  summary.testResults
    ? `- **Total Tests**: ${summary.testResults.stats?.total || 'unknown'}
- **Passed**: ${summary.testResults.stats?.passed || 'unknown'}
- **Failed**: ${summary.testResults.stats?.failed || 'unknown'}
- **Skipped**: ${summary.testResults.stats?.skipped || 'unknown'}`
    : 'Test results data not available'
}

## Additional Information

This report was generated as part of Plan 10029 comprehensive testing strategy.
For detailed results, see the HTML report in \`playwright-report/\`.

---
*Generated on ${teardownTime}*
`;
}

export default globalTeardown;
