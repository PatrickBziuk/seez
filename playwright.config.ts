import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive Playwright Configuration for Plan 10029
 * Enhanced with mobile viewports, accessibility testing, and cross-browser coverage
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* Test timeout increased for comprehensive testing */
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Enhanced reporting for comprehensive testing */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  
  /* Enhanced settings for comprehensive testing */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4321',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure for debugging */
    screenshot: 'only-on-failure',
    
    /* Video recording for complex test debugging */
    video: 'retain-on-failure',
    
    /* Increased action timeout for responsive testing */
    actionTimeout: 15000,
  },

  /* Enhanced projects for comprehensive cross-browser and responsive testing */
  projects: [
    /* Desktop Browsers */
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'Desktop Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'Desktop Edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
        viewport: { width: 1280, height: 720 },
      },
    },

    /* Tablet Viewports */
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
    },
    {
      name: 'iPad Landscape',
      use: { 
        ...devices['iPad Pro landscape'],
        viewport: { width: 1366, height: 1024 },
      },
    },

    /* Mobile Viewports */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'Mobile Samsung',
      use: { 
        ...devices['Galaxy S9+'],
        viewport: { width: 320, height: 658 },
      },
    },

    /* Large Screen Testing */
    {
      name: 'Large Desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    /* Accessibility Testing Project */
    {
      name: 'Accessibility',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Additional settings for accessibility testing
        colorScheme: 'light',
      },
      testMatch: '**/accessibility/*.spec.ts',
    },
  ],

  /* Enhanced web server configuration for development */
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for server startup
  },

  /* Global test setup for comprehensive testing */
  globalSetup: './tests/global-setup.ts',
  
  /* Global teardown */
  globalTeardown: './tests/global-teardown.ts',
  
  /* Output directory for test artifacts */
  outputDir: 'test-results/',
});
