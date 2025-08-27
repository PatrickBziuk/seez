import { test, expect } from '@playwright/test';

/**
 * Streamlined Debug Tests
 * Quick diagnostic tests for development debugging
 */

test.describe('Debug - Core Navigation', () => {
  test('verify /en route works correctly', async ({ page }) => {
    const response = await page.goto('/en', { waitUntil: 'networkidle' });

    console.log('Response status:', response?.status());
    console.log('Final URL:', page.url());
    console.log('Page title:', await page.title());

    // Verify successful response
    expect(response?.status()).toBe(200);
    expect(page.url()).toContain('/en');
    await expect(page).not.toHaveTitle(/404|Not Found/);
  });

  test('check navigation links generation', async ({ page }) => {
    await page.goto('/en');

    // Test logo navigation
    const logo = page.locator('a').filter({ has: page.locator('span:has-text("seez")') });
    const logoHref = await logo.getAttribute('href');
    console.log('Logo href:', logoHref);
    expect(logoHref).toBe('/en');

    // Test main navigation links
    const navLinks = await page.locator('nav a').all();
    const linkData = [];

    for (const link of navLinks.slice(0, 6)) {
      // Limit to first 6 to prevent timeout
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      linkData.push({ text: text?.trim(), href });
      console.log(`Nav link "${text?.trim()}": ${href}`);
    }

    // Verify links are properly localized
    const localizedLinks = linkData.filter((link) => link.href?.startsWith('/en/'));
    expect(localizedLinks.length).toBeGreaterThan(0);
  });

  test('verify German route accessibility', async ({ page }) => {
    const response = await page.goto('/de', { waitUntil: 'networkidle' });

    console.log('DE Response status:', response?.status());
    console.log('DE Final URL:', page.url());
    console.log('DE Page title:', await page.title());

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });
});
