import { test, expect } from '@playwright/test';

// Preview server base
const PREVIEW_BASE = 'http://localhost:4323';

test.describe('Header Nav Mode Indicator (Preview)', () => {
  test('stays in desktop after navigation (preview)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto(`${PREVIEW_BASE}/en`, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');

    const indicator = page.locator('#nav-mode-indicator');
    const desktopNav = page.locator('nav[data-nav="desktop"]');
    const toggleBtn = page.locator('[data-aw-toggle-menu]');

    await expect(indicator).toHaveText('desktop');
    await expect(page.locator('header[data-active-nav="desktop"]')).toBeVisible();
    await expect(desktopNav).toBeVisible();
    await expect(toggleBtn).not.toBeVisible();

    // Click-driven navigation (the scenario reported to regress)
    await page.locator('nav[data-nav="desktop"] a[href="/en/books"]').click();
    await page.waitForLoadState('networkidle');

    await expect(indicator).toHaveText('desktop');
    await expect(desktopNav).toBeVisible();
    await expect(toggleBtn).not.toBeVisible();

    // Direct navigations for more coverage
    for (const category of ['projects', 'music', 'lab']) {
      await page.goto(`${PREVIEW_BASE}/en/${category}`, { waitUntil: 'load' });
      await page.waitForLoadState('networkidle');

      await expect(indicator).toHaveText('desktop');
      await expect(desktopNav).toBeVisible();
      await expect(toggleBtn).not.toBeVisible();
    }
  });
});
