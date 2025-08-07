import { test } from '@playwright/test';

test.describe('Debug Navigation Issues', () => {
  test('check middleware debug logs for /en/', async ({ page }) => {
    // This will help us see if middleware is being called
    const response = await page.goto('/en/', { waitUntil: 'networkidle' });

    console.log('Response status:', response?.status());
    console.log('Final URL:', page.url());

    // Check page content to see what's actually being served
    const content = await page.content();
    console.log('Page title:', await page.title());

    // Check if it's a 404 page
    const is404 = content.includes('404') || content.includes('Page not found');
    console.log('Is 404 page:', is404);
  });

  test('check logo href value', async ({ page }) => {
    await page.goto('/en');

    const logo = page.locator('a').filter({ has: page.locator('span:has-text("seez")') });
    const href = await logo.getAttribute('href');

    console.log('Logo href value:', href);
    console.log('Expected: /en');
    console.log('Actual matches expected:', href === '/en');
  });

  test('test getLocalizedUrl function output', async ({ page }) => {
    // Navigate to a page and check if the function works correctly
    await page.goto('/en');

    // Check what links are actually generated in the navigation
    const navLinks = await page.locator('nav a').all();
    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`Nav link "${text}": ${href}`);
    }
  });
});
