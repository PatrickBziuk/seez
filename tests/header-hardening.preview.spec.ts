import { test, expect } from '@playwright/test';

const PREVIEW_BASE = process.env.PREVIEW_BASE || 'http://localhost:4323';

test.describe('Header Hardening - Preview', () => {
  test('enforces desktop mode after navigation (preview)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

    await page.goto(`${PREVIEW_BASE}/en`, { waitUntil: 'load' });

    const desktopNav = page.locator('nav[data-nav="desktop"]');
    const mobileNav = page.locator('nav[data-nav="mobile"]');
    const toggleBtn = page.locator('[data-aw-toggle-menu]');

    // Initial: should be desktop
    await expect(desktopNav).toBeVisible();
    await expect(toggleBtn).not.toBeVisible();

    // Navigate via click (the problematic path)
    await page.locator('nav[data-nav="desktop"] a[href="/en/books"]').click();
    await page.waitForLoadState('networkidle');

    // Hardening: CSS attribute-based enforcement should keep desktop nav visible and mobile hidden
    const desktopDisplay = await desktopNav.evaluate((el) => window.getComputedStyle(el).display);
    const mobileDisplay = await mobileNav.evaluate((el) => window.getComputedStyle(el).display);

    expect(desktopDisplay).not.toBe('none');
    expect(mobileDisplay).toBe('none');
    await expect(toggleBtn).not.toBeVisible();

    // A couple more category navigations to ensure consistency
    for (const cat of ['projects', 'music', 'lab']) {
      await page.goto(`${PREVIEW_BASE}/en/${cat}`, { waitUntil: 'load' });
      const d = await desktopNav.evaluate((el) => window.getComputedStyle(el).display);
      const m = await mobileNav.evaluate((el) => window.getComputedStyle(el).display);
      expect(d).not.toBe('none');
      expect(m).toBe('none');
      await expect(toggleBtn).not.toBeVisible();
    }
  });
});
