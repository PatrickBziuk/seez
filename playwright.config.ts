import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive Playwright Configuration for Plan 10029
 * Enhanced with mobile viewports, accessibility testing, and cross-browser coverage
 * @see https://playwright.dev/docs/test-configuration
 */
// Allow overriding baseURL (and webServer usage) via environment for preview runs
// Default to dev port 4321; when pointing to an external preview set PW_BASE_URL or PW_NO_SERVER=1
const USE_EXTERNAL_SERVER = !!process.env.PW_BASE_URL || process.env.PW_NO_SERVER === '1';
const DEFAULT_DEV_URL = 'http://localhost:4321';
const DEFAULT_PREVIEW_URL = 'http://localhost:4323';
const BASE_URL = process.env.PW_BASE_URL || (USE_EXTERNAL_SERVER ? DEFAULT_PREVIEW_URL : DEFAULT_DEV_URL);

export default defineConfig({
  testDir: './tests',

  /* Test timeout reduced for faster execution */
  timeout: 20000,
  expect: {
    timeout: 5000,
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Enhanced reporting for comprehensive testing (no auto-serve to avoid blocking the terminal) */
  reporter: [
    // Disable auto-opening/serving HTML to ensure the test process exits cleanly
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  /* Enhanced settings for efficient testing */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure for debugging */
    screenshot: 'only-on-failure',

    /* Video recording for complex test debugging */
    video: 'retain-on-failure',

    /* Reduced action timeout for faster failures */
    actionTimeout: 10000,
  },

  /* Streamlined projects - Chromium only (mobile/desktop) */
  projects: [
    /* Desktop Chrome */
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    /* Mobile Chrome */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
    },

    /* Accessibility Testing (Desktop Chrome only) */
    {
      name: 'Accessibility',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        colorScheme: 'light',
      },
      testMatch: '**/accessibility/*.spec.ts',
    },
  ],

  /* Enhanced web server configuration for development */
  // Only start a dev web server if we're not pointing to an external preview
  webServer: USE_EXTERNAL_SERVER
    ? undefined
    : {
        command: 'pnpm run dev',
        url: DEFAULT_DEV_URL,
        reuseExistingServer: true, // Always reuse existing server
        timeout: 120 * 1000, // 2 minutes for server startup
      },

  /* Global test setup for comprehensive testing */
  globalSetup: './tests/global-setup.ts',

  /* Global teardown */
  globalTeardown: './tests/global-teardown.ts',

  /* Output directory for test artifacts */
  outputDir: 'test-results/',
});
