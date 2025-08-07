import { test } from '@playwright/test';

test('Manual redirect test', async ({ page }) => {
  console.log('Testing redirect manually...');

  try {
    // Test /en/ redirect
    console.log('Testing /en/ redirect...');
    const response = await page.goto('http://localhost:4321/en/', {
      waitUntil: 'networkidle',
      timeout: 10000,
    });

    console.log('Response status:', response?.status());
    console.log('Final URL:', page.url());
    console.log('Page title:', await page.title());

    const success = page.url().endsWith('/en') && !page.url().endsWith('/en/');
    console.log('Redirect success:', success);
  } catch (error) {
    console.log('Error:', String(error));
  }
});
