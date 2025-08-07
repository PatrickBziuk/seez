import { test } from '@playwright/test';

test('Static redirect pages work', async ({ page }) => {
  // Test /en/ redirect
  console.log('Testing /en/ redirect...');
  await page.goto('/en/');

  // Wait for potential redirect
  await page.waitForTimeout(1000);

  console.log('Final URL:', page.url());
  console.log('Page title:', await page.title());

  // Check if we're on the right page
  const isOnEnPage = page.url().includes('/en') && !page.url().endsWith('/en/');
  console.log('Redirected correctly:', isOnEnPage);

  // Test /de/ redirect
  console.log('Testing /de/ redirect...');
  await page.goto('/de/');

  // Wait for potential redirect
  await page.waitForTimeout(1000);

  console.log('Final URL:', page.url());
  console.log('Page title:', await page.title());

  // Check if we're on the right page
  const isOnDePage = page.url().includes('/de') && !page.url().endsWith('/de/');
  console.log('Redirected correctly:', isOnDePage);
});
