import { test, expect } from '@playwright/test';

test.describe('Header Navigation - Large Desktop Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Set a very large desktop viewport to ensure we're in desktop mode
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should maintain desktop navigation when clicking categories', async ({ page }) => {
    // Enable console logging
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));

    // Navigate to site (relative to baseURL)
    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    console.log('=== Initial State ===');

    // Verify we're in desktop mode initially
    const desktopNav = page.locator('nav[data-nav="desktop"]');
    const toggleButton = page.locator('[data-aw-toggle-menu]');

    await expect(desktopNav).toBeVisible();
    await expect(toggleButton).not.toBeVisible();

    console.log('✅ Initial state: Desktop navigation visible, toggle hidden');

    // Take screenshot of initial state
    await page.screenshot({
      path: 'test-results/header-desktop-initial.png',
      fullPage: false,
    });

    console.log('=== Testing Navigation ===');

    // Test clicking on Books
    console.log('Clicking Books...');
    await page.locator('nav[data-nav="desktop"] a[href="/en/books"]').click();
    await page.waitForLoadState('networkidle');

    // Check if we're still in desktop mode
    const desktopNavAfter = page.locator('nav[data-nav="desktop"]');
    const toggleButtonAfter = page.locator('[data-aw-toggle-menu]');

    const desktopStillVisible = await desktopNavAfter.isVisible();
    const toggleStillHidden = !(await toggleButtonAfter.isVisible());

    console.log(
      `After Books click: Desktop nav visible = ${desktopStillVisible}, Toggle hidden = ${toggleStillHidden}`
    );

    if (!desktopStillVisible || !toggleStillHidden) {
      console.log('❌ ISSUE DETECTED: Navigation changed to mobile mode after clicking Books!');

      // Get detailed debug info
      const currentUrl = page.url();
      const viewportSize = page.viewportSize();
      const desktopNavClasses = await desktopNavAfter.getAttribute('class');
      const toggleClasses = await toggleButtonAfter.getAttribute('class');

      console.log('Current URL:', currentUrl);
      console.log('Viewport size:', viewportSize);
      console.log('Desktop nav classes:', desktopNavClasses);
      console.log('Toggle button classes:', toggleClasses);

      // Check if CSS media query is working
      const mediaQueryMatches = await page.evaluate(() => {
        return window.matchMedia('(min-width: 768px)').matches;
      });
      console.log('Media query (min-width: 768px) matches:', mediaQueryMatches);

      // Check computed styles
      const desktopNavDisplay = await desktopNavAfter.evaluate((el) => window.getComputedStyle(el).display);
      const toggleDisplay = await toggleButtonAfter.evaluate((el) => window.getComputedStyle(el).display);

      console.log('Desktop nav computed display:', desktopNavDisplay);
      console.log('Toggle computed display:', toggleDisplay);
    }

    // Take screenshot after Books click
    await page.screenshot({
      path: 'test-results/header-desktop-after-books.png',
      fullPage: false,
    });

    // Verify navigation stayed in desktop mode
    expect(desktopStillVisible, 'Desktop navigation should remain visible after navigation').toBe(true);
    expect(toggleStillHidden, 'Toggle button should remain hidden after navigation').toBe(true);

    // Test a few more categories to be sure
    // Use direct navigation to avoid view-transition click flakiness
    const categories = ['projects', 'music', 'lab'];

    for (const category of categories) {
      console.log(`\nTesting ${category}...`);
      await page.goto(`/en/${category}`);
      await page.waitForLoadState('networkidle');

      const navStillDesktop = await desktopNavAfter.isVisible();
      const toggleStillMobile = !(await toggleButtonAfter.isVisible());

      console.log(`${category}: Desktop nav = ${navStillDesktop}, Toggle hidden = ${toggleStillMobile}`);

      expect(navStillDesktop, `Desktop nav should be visible on ${category} page`).toBe(true);
      expect(toggleStillMobile, `Toggle should be hidden on ${category} page`).toBe(true);

      await page.screenshot({
        path: `test-results/header-desktop-${category}.png`,
        fullPage: false,
      });
    }

    console.log('✅ All navigation tests passed - header remains in desktop mode');
  });
});
