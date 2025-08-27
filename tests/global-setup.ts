import { chromium } from '@playwright/test';
import type { FullConfig } from '@playwright/test';
import fs from 'fs';

/**
 * Global Setup for Plan 10029 Comprehensive Testing
 *
 * Prepares the testing environment with necessary configurations,
 * checks server health, and sets up any required test data.
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for comprehensive testing...');

  // Launch a browser instance for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Verify server is running and responsive with retries
    console.log('🔍 Checking server health...');
    const baseURL = config.projects[0].use.baseURL as string;

    const maxAttempts = 10;
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 5000 });
        break; // success
      } catch (err) {
        lastError = err;
        console.log(`⏳ Server not ready yet (attempt ${attempt}/${maxAttempts})...`);
        await new Promise((r) => setTimeout(r, 1000));
        if (attempt === maxAttempts) throw lastError;
      }
    }

    // Verify basic page structure is present
    const title = await page.title();
    if (!title) {
      throw new Error('Server is not returning proper HTML pages');
    }

    console.log(`✅ Server is healthy - Page title: "${title}"`);

    // Verify language switching is working
    console.log('🌐 Verifying multilingual setup...');

    try {
      await page.goto(`${baseURL}/en`, { waitUntil: 'networkidle' });
      const englishTitle = await page.title();

      await page.goto(`${baseURL}/de`, { waitUntil: 'networkidle' });
      const germanTitle = await page.title();

      console.log(`✅ Multilingual setup verified - EN: "${englishTitle}", DE: "${germanTitle}"`);
    } catch (error) {
      console.warn('⚠️ Multilingual setup may have issues:', error);
    }

    // Create test output directories
    console.log('📁 Setting up test output directories...');

    const outputDirs = ['test-results', 'test-results/screenshots', 'test-results/videos', 'test-results/traces'];

    for (const dir of outputDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    }

    // Store test metadata
    const testMetadata = {
      setupTime: new Date().toISOString(),
      baseURL,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || 'unknown',
    };

    fs.writeFileSync('test-results/test-metadata.json', JSON.stringify(testMetadata, null, 2));

    console.log('✅ Test metadata saved');
    console.log('🎯 Global setup completed successfully!');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
