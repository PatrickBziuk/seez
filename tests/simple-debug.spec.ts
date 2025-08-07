import { test } from '@playwright/test';

test('Check URL generation after disabling astroI18next', async ({ page }) => {
  console.log('Testing URL generation...');

  await page.goto('/debug-urls');
  await page.waitForTimeout(1000);

  console.log('Final URL:', page.url());
  console.log('Page title:', await page.title());

  // Get the content of the debug page
  const pageContent = await page.content();
  console.log('Page content length:', pageContent.length);

  // Check for specific URL patterns in the content
  const enRootMatch = pageContent.match(/getLocalizedUrl\('\/', 'en'\): <strong>([^<]+)<\/strong>/);
  const deRootMatch = pageContent.match(/getLocalizedUrl\('\/', 'de'\): <strong>([^<]+)<\/strong>/);

  console.log('EN Root URL:', enRootMatch ? enRootMatch[1] : 'Not found');
  console.log('DE Root URL:', deRootMatch ? deRootMatch[1] : 'Not found');

  // Test navigation to /en and /de (without trailing slash)
  console.log('\n--- Testing /en navigation ---');
  await page.goto('/en');
  await page.waitForTimeout(500);
  console.log('/en Final URL:', page.url());
  console.log('/en Page title:', await page.title());

  console.log('\n--- Testing /de navigation ---');
  await page.goto('/de');
  await page.waitForTimeout(500);
  console.log('/de Final URL:', page.url());
  console.log('/de Page title:', await page.title());

  console.log('\n--- Testing /en/ (with trailing slash) ---');
  await page.goto('/en/');
  await page.waitForTimeout(500);
  console.log('/en/ Final URL:', page.url());
  console.log('/en/ Page title:', await page.title());
});
