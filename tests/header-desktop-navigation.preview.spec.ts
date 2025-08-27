import { test, expect } from '@playwright/test';

const PREVIEW_BASE = 'http://localhost:4323';

/**
 * Preview-only validation of header staying in desktop mode after navigation.
 * Connects directly to astro preview on port 4323.
 */

test.describe('Header Navigation - Preview (Desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('desktop header persists after navigating to categories', async ({ page }) => {
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

    // Go to home (preview)
    await page.goto(`${PREVIEW_BASE}/en`, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');

    const desktopNav = page.locator('nav[data-nav="desktop"]');
    const toggleButton = page.locator('[data-aw-toggle-menu]');

    await expect(desktopNav).toBeVisible();
    await expect(toggleButton).not.toBeVisible();

    // Click Books via desktop nav to mimic the bug report
    await page.locator('nav[data-nav="desktop"] a[href="/en/books"]').click();
    await page.waitForLoadState('networkidle');

    await expect(desktopNav).toBeVisible();
    await expect(toggleButton).not.toBeVisible();

    // Validate a few more categories via direct navigation in preview
    for (const category of ['projects', 'music', 'lab']) {
      await page.goto(`${PREVIEW_BASE}/en/${category}`, { waitUntil: 'load' });
      await page.waitForLoadState('networkidle');

      await expect(desktopNav).toBeVisible();
      await expect(toggleButton).not.toBeVisible();
    }
  });
});
