import { test, expect } from '@playwright/test';

// Start narrow (mobile), open menu, then widen to desktop and ensure menu state resets
test.describe('Header - Mobile state resets on desktop', () => {
  test('toggle open on mobile then resize to desktop', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/en');

    const desktopNav = page.locator('nav[data-nav="desktop"]');
    const toggle = page.locator('[data-aw-toggle-menu]');
    const mobileNav = page.locator('#mobile-navigation');

    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(mobileNav).toBeVisible();

    // Resize to desktop breakpoint
    await page.setViewportSize({ width: 1280, height: 800 });

    // Desktop nav visible, mobile hidden, toggle not visible
    await expect(desktopNav).toBeVisible();
    await expect(mobileNav).toHaveClass(/hidden/);
    await expect(toggle).not.toBeVisible();
  });
});
