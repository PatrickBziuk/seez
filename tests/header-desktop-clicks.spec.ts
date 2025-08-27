import { test, expect } from '@playwright/test';

// Force a desktop-like viewport for this test file
test.use({ viewport: { width: 1280, height: 800 } });

test.describe('Header - Click navigation stays desktop', () => {
  test('home -> books (click) keeps desktop header', async ({ page }) => {
    await page.goto('/en');
    const desktopNav = page.locator('nav[data-nav="desktop"]');
    const toggleBtn = page.locator('[data-aw-toggle-menu]');

    await expect(desktopNav).toBeVisible();
    await expect(toggleBtn).not.toBeVisible();

    await page.locator('nav[data-nav="desktop"] a[href="/en/books"]').click();

    await expect(desktopNav).toBeVisible();
    await expect(toggleBtn).not.toBeVisible();
  });
});
