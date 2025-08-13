#!/usr/bin/env npx tsx

/**
 * Test Success Rate Calculator and Deployment Decision Script
 *
 * This script analyzes test results and determines if deployment should proceed
 * based on an 80% overall success rate threshold.
 *
 * Usage:
 *   npx tsx scripts/ci/calculate-test-success-rate.ts [--threshold=80] [--verbose]
 *
 * Exit codes:
 *   0: Tests meet threshold, deployment allowed
 *   1: Tests below threshold, deployment blocked
 *   2: Error calculating success rate
 */

import fs from 'fs';

interface TestPhaseResult {
  name: string;
  success: boolean;
  passed?: number;
  total?: number;
  successRate?: number;
}

interface OverallTestResult {
  phases: TestPhaseResult[];
  overallSuccessRate: number;
  passedPhases: number;
  totalPhases: number;
  meetsThreshold: boolean;
  threshold: number;
}

class TestSuccessRateCalculator {
  private threshold: number;
  private verbose: boolean;

  constructor(threshold = 80, verbose = false) {
    this.threshold = threshold;
    this.verbose = verbose;
  }

  private log(message: string, force = false) {
    if (this.verbose || force) {
      console.log(message);
    }
  }

  /**
   * Calculate success rate from GitHub Actions job outputs
   */
  calculateFromEnvironment(): OverallTestResult {
    this.log('📊 Calculating test success rate from environment variables...');

    const phases: TestPhaseResult[] = [
      {
        name: 'Validation Tests',
        success: process.env.VALIDATION_SUCCESS === 'true',
      },
      {
        name: 'E2E Tests',
        success: process.env.E2E_SUCCESS === 'true',
      },
      {
        name: 'Component Tests',
        success: process.env.COMPONENT_SUCCESS === 'true',
      },
      {
        name: 'Accessibility Tests',
        success: process.env.ACCESSIBILITY_SUCCESS === 'true',
      },
      {
        name: 'Performance Tests',
        success: process.env.PERFORMANCE_SUCCESS === 'true',
      },
    ];

    const passedPhases = phases.filter((phase) => phase.success).length;
    const totalPhases = phases.length;
    const overallSuccessRate = (passedPhases / totalPhases) * 100;
    const meetsThreshold = overallSuccessRate >= this.threshold;

    return {
      phases,
      overallSuccessRate,
      passedPhases,
      totalPhases,
      meetsThreshold,
      threshold: this.threshold,
    };
  }

  /**
   * Calculate success rate from provided test results
   */
  calculateFromResults(testResults: Array<{ name: string; passed: number; total: number }>): OverallTestResult {
    this.log('📊 Calculating test success rate from provided results...');

    const phases: TestPhaseResult[] = testResults.map((result) => ({
      name: result.name,
      success: result.passed / result.total >= 0.5, // Individual test considered successful if >= 50%
      passed: result.passed,
      total: result.total,
      successRate: (result.passed / result.total) * 100,
    }));

    const passedPhases = phases.filter((phase) => phase.success).length;
    const totalPhases = phases.length;
    const overallSuccessRate = (passedPhases / totalPhases) * 100;
    const meetsThreshold = overallSuccessRate >= this.threshold;

    return {
      phases,
      overallSuccessRate,
      passedPhases,
      totalPhases,
      meetsThreshold,
      threshold: this.threshold,
    };
  }

  /**
   * Generate detailed report
   */
  generateReport(result: OverallTestResult): string {
    let report = '';

    report += '# 🧪 Test Success Rate Report\n\n';
    report += `**Overall Success Rate**: ${result.overallSuccessRate.toFixed(1)}%\n`;
    report += `**Threshold**: ${result.threshold}%\n`;
    report += `**Status**: ${result.meetsThreshold ? '✅ DEPLOYMENT ALLOWED' : '❌ DEPLOYMENT BLOCKED'}\n\n`;

    report += '## Test Phase Results\n\n';
    report += '| Phase | Status | Success Rate |\n';
    report += '|-------|--------|-------------|\n';

    for (const phase of result.phases) {
      const status = phase.success ? '✅ Passed' : '❌ Failed';
      const rate = phase.successRate ? `${phase.successRate.toFixed(1)}%` : 'N/A';
      report += `| ${phase.name} | ${status} | ${rate} |\n`;
    }

    report += '\n';
    report += `**Summary**: ${result.passedPhases}/${result.totalPhases} test phases passed\n\n`;

    if (result.meetsThreshold) {
      report += '🚀 **Deployment Decision**: Tests meet the minimum threshold for deployment.\n';
    } else {
      report += '🚫 **Deployment Decision**: Tests do not meet the minimum threshold. ';
      report += 'GitHub issues will be created for failed tests, but deployment is blocked.\n';
    }

    return report;
  }

  /**
   * Output GitHub Actions step summary
   */
  outputGitHubSummary(result: OverallTestResult): void {
    const summary = this.generateReport(result);

    // Write to GitHub Actions step summary if available
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile) {
      try {
        fs.appendFileSync(summaryFile, summary);
        this.log('✅ Summary written to GitHub Actions step summary');
      } catch (error) {
        this.log(`⚠️ Failed to write GitHub summary: ${error}`);
      }
    }

    // Also output to console
    console.log(summary);
  }

  /**
   * Set GitHub Actions outputs
   */
  setGitHubOutputs(result: OverallTestResult): void {
    const outputs = [
      `deployment-allowed=${result.meetsThreshold}`,
      `success-rate=${result.overallSuccessRate.toFixed(1)}`,
      `passed-phases=${result.passedPhases}`,
      `total-phases=${result.totalPhases}`,
      `threshold=${result.threshold}`,
    ];

    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
      try {
        for (const output of outputs) {
          fs.appendFileSync(outputFile, output + '\n');
        }
        this.log('✅ Outputs written to GitHub Actions');
      } catch (error) {
        this.log(`⚠️ Failed to write GitHub outputs: ${error}`);
      }
    }

    // Also output to console for debugging
    this.log('GitHub Outputs:');
    outputs.forEach((output) => this.log(`  ${output}`));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let threshold = 80;
  let verbose = false;

  for (const arg of args) {
    if (arg.startsWith('--threshold=')) {
      threshold = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--verbose') {
      verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Test Success Rate Calculator

Usage:
  npx tsx scripts/ci/calculate-test-success-rate.ts [options]

Options:
  --threshold=N    Set success rate threshold (default: 80)
  --verbose        Show detailed logging
  --help, -h       Show this help message

Environment Variables (for GitHub Actions):
  VALIDATION_SUCCESS     'true' if validation tests passed
  E2E_SUCCESS           'true' if E2E tests passed  
  COMPONENT_SUCCESS     'true' if component tests passed
  ACCESSIBILITY_SUCCESS 'true' if accessibility tests passed
  PERFORMANCE_SUCCESS   'true' if performance tests passed

Exit Codes:
  0: Tests meet threshold, deployment allowed
  1: Tests below threshold, deployment blocked
  2: Error calculating success rate
      `);
      process.exit(0);
    }
  }

  try {
    const calculator = new TestSuccessRateCalculator(threshold, verbose);
    const result = calculator.calculateFromEnvironment();

    // Generate and output report
    calculator.outputGitHubSummary(result);
    calculator.setGitHubOutputs(result);

    console.log(`\n📊 Final Result: ${result.overallSuccessRate.toFixed(1)}% success rate`);

    if (result.meetsThreshold) {
      console.log('✅ Deployment allowed - threshold met');
      process.exit(0);
    } else {
      console.log(`❌ Deployment blocked - below ${threshold}% threshold`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error calculating test success rate:', error);
    process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { TestSuccessRateCalculator, type OverallTestResult, type TestPhaseResult };
