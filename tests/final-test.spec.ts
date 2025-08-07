import { test, expect } from '@playwright/test';

test.describe('Fixed Navigation Issues', () => {
  test('Logo href should be correct (without trailing slash)', async ({ page }) => {
    await page.goto('/en');

    // Check logo href
    const logoHref = await page.getAttribute('a:has(img, svg)', 'href');
    console.log('Logo href:', logoHref);

    expect(logoHref).toBe('/en');
  });

  test('Should redirect /en/ to /en', async ({ page }) => {
    const response = await page.goto('/en/');

    console.log('Response status:', response?.status());
    console.log('Final URL:', page.url());

    // Check if we were redirected
    if (page.url().endsWith('/en/')) {
      console.log('❌ Still on /en/ - redirect not working');
      console.log('Page title:', await page.title());
    } else if (page.url().endsWith('/en')) {
      console.log('✅ Successfully redirected to /en');
    }

    // Expect to be redirected to /en (without trailing slash)
    expect(page.url()).toMatch(/\/en$/);
  });

  test('Should redirect /de/ to /de', async ({ page }) => {
    const response = await page.goto('/de/');

    console.log('Response status:', response?.status());
    console.log('Final URL:', page.url());

    // Check if we were redirected
    if (page.url().endsWith('/de/')) {
      console.log('❌ Still on /de/ - redirect not working');
      console.log('Page title:', await page.title());
    } else if (page.url().endsWith('/de')) {
      console.log('✅ Successfully redirected to /de');
    }

    // Expect to be redirected to /de (without trailing slash)
    expect(page.url()).toMatch(/\/de$/);
  });

  test('Logo navigation should work correctly', async ({ page }) => {
    await page.goto('/en');

    // Click the logo
    await page.click('a:has(img, svg)');

    // Should stay on /en (or go to /en if we were elsewhere)
    expect(page.url()).toMatch(/\/en$/);
    console.log('✅ Logo navigation works correctly');
  });
});
