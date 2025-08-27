import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('Header - Goto navigation stays desktop', () => {
  test('home -> books -> projects via goto keeps desktop header', async ({ page }) => {
    const desktopNav = page.locator('nav[data-nav="desktop"]');
    const toggleBtn = page.locator('[data-aw-toggle-menu]');

    await page.goto('/en');
    await expect(desktopNav).toBeVisible();
    await expect(toggleBtn).not.toBeVisible();

    await page.goto('/en/books');
    await expect(desktopNav).toBeVisible();
    await expect(toggleBtn).not.toBeVisible();

    await page.goto('/en/projects');
    await expect(desktopNav).toBeVisible();
    await expect(toggleBtn).not.toBeVisible();
  });
});
