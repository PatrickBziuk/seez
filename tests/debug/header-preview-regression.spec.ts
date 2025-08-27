import { test, expect } from '@playwright/test';

// This test intentionally targets the preview server (baseURL from playwright.config.ts)
// It verifies that after client-side navigation the desktop header remains in desktop mode

test.describe('Header regression in preview mode', () => {
  test('desktop header stays desktop after navigating to categories', async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // Go to English home
    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    const desktopNav = page.locator('nav[data-nav="desktop"]');
    const mobileNav = page.locator('nav[data-nav="mobile"]');
    const toggleBtn = page.locator('[data-aw-toggle-menu]');

    // Initial assertions on home
    await expect(desktopNav, 'Desktop nav visible on home').toBeVisible();
    await expect(toggleBtn, 'Toggle hidden on desktop').toBeHidden();
    await expect(mobileNav, 'Mobile nav hidden on desktop').toBeHidden();

    const categories = ['/en/books', '/en/projects', '/en/music', '/en/lab', '/en/life'];

    for (const href of categories) {
      const link = page.locator(`nav[data-nav="desktop"] a[href="${href}"]`).first();
      await expect(link, `Link for ${href} should be visible`).toBeVisible();
      await Promise.all([page.waitForURL((url) => url.pathname === href), link.click({ trial: false })]);
      // Re-query locators after navigation to avoid detached handles
      const desktopNav = page.locator('nav[data-nav="desktop"]');
      const mobileNav = page.locator('nav[data-nav="mobile"]');
      const toggleBtn = page.locator('[data-aw-toggle-menu]');

      // Capture state
      const state = await page.evaluate(() => {
        const d = document.querySelector('nav[data-nav="desktop"]');
        const m = document.querySelector('nav[data-nav="mobile"]');
        const t = document.querySelector('[data-aw-toggle-menu]');
        const csd = d ? window.getComputedStyle(d) : null;
        const csm = m ? window.getComputedStyle(m) : null;
        return {
          desktopDisplay: csd?.display || 'missing',
          mobileDisplay: csm?.display || 'missing',
          togglePresent: !!t,
          toggleVisible: t ? (t as HTMLElement).offsetParent !== null : false,
          width: window.innerWidth,
        };
      });

      // Log for debugging
      console.log(`After ${href}:`, state);

      // Expectations
      await expect(desktopNav, `Desktop nav visible after ${href}`).toBeVisible();
      await expect(toggleBtn, `Toggle hidden after ${href}`).toBeHidden();
      await expect(mobileNav, `Mobile nav should not be visible after ${href}`).toBeHidden();
    }
  });
});
