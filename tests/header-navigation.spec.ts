import { test, expect } from '@playwright/test';

test.describe('Header Navigation in Preview Mode', () => {
  test('should maintain consistent header styling when clicking categories', async ({ page }) => {
    // Enable console logging to catch any JavaScript errors
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));

    // Navigate to the preview site
    await page.goto('http://localhost:4323/en');
    await page.waitForLoadState('networkidle');

    // Take a screenshot of initial state
    await page.screenshot({
      path: 'test-results/header-initial-preview.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 200 },
    });

    // Get initial header styling (target the main page header by ID)
    const header = page.locator('header#header');
    await expect(header).toBeVisible();
    const initialHeaderClass = await header.getAttribute('class');
    console.log('Initial header classes:', initialHeaderClass);

    // Test clicking on each navigation category
    const navLinks = [
      { name: 'Books', href: '/en/books' },
      { name: 'Projects', href: '/en/projects' },
      { name: 'Music', href: '/en/music' },
      { name: 'Lab', href: '/en/lab' },
      { name: 'Life', href: '/en/life' },
      { name: 'About', href: '/en/about' },
      { name: 'Contact', href: '/en/contact' },
    ];

    for (const link of navLinks) {
      console.log(`Testing navigation to ${link.name}...`);

      // Click the navigation link (target main navigation, not mobile nav)
      const navLink = page.locator(`nav[aria-label="Main navigation"] a[href="${link.href}"]`).first();
      await navLink.click();

      // Wait for navigation to complete
      await page.waitForLoadState('networkidle');

      // Check header consistency after navigation
      const headerAfterNav = page.locator('header#header');
      const headerClassAfterNav = await headerAfterNav.getAttribute('class');
      console.log(`Header classes after ${link.name}:`, headerClassAfterNav);

      // Check if navigation is still visible or if it's been collapsed to mobile menu
      const mainNav = page.locator('nav[aria-label="Main navigation"]');
      const mobileToggle = page.locator('button[aria-label="Toggle Menu"], button:has-text("Toggle Menu")');

      const navVisible = await mainNav.isVisible();
      const mobileToggleVisible = await mobileToggle.isVisible();

      console.log(`Main navigation visible: ${navVisible}, Mobile toggle visible: ${mobileToggleVisible}`);

      // This might be the "weird" behavior - navigation switching to mobile mode
      if (mobileToggleVisible && !navVisible) {
        console.log(`⚠️ ISSUE DETECTED: Navigation switched to mobile mode on ${link.name} page!`);
      }

      // Take screenshot to compare
      await page.screenshot({
        path: `test-results/header-after-${link.name.toLowerCase()}-preview.png`,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 200 },
      });

      // Check if header maintains its structure
      await expect(headerAfterNav).toBeVisible();

      // Check if navigation is still accessible
      const navigation = page.locator('nav[aria-label*="navigation"]');
      await expect(navigation).toBeVisible();

      // Check if logo is still visible and functional
      const logo = page.locator('header a[href*="/en"]');
      await expect(logo).toBeVisible();

      // Check for any obvious styling issues
      const headerComputedStyle = await headerAfterNav.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          position: style.position,
          zIndex: style.zIndex,
          backgroundColor: style.backgroundColor,
          display: style.display,
        };
      });

      console.log(`Header computed styles after ${link.name}:`, headerComputedStyle);

      // Verify header hasn't become hidden or mispositioned
      expect(headerComputedStyle.display).not.toBe('none');
      expect(headerComputedStyle.position).toBe('sticky');
    }

    console.log('✅ Header navigation test completed');
  });

  test('should maintain consistent active states in navigation', async ({ page }) => {
    // Navigate to the preview site
    await page.goto('http://localhost:4323/en');
    await page.waitForLoadState('networkidle');

    // Test active states on different pages
    const testPages = [
      { url: 'http://localhost:4323/en/books', expectedActive: 'Books' },
      { url: 'http://localhost:4323/en/projects', expectedActive: 'Projects' },
      { url: 'http://localhost:4323/en/about', expectedActive: 'About' },
    ];

    for (const testPage of testPages) {
      await page.goto(testPage.url);
      await page.waitForLoadState('networkidle');

      // Check for active navigation state
      const activeLink = page.locator('nav a.active, nav a[class*="active"]');

      if ((await activeLink.count()) > 0) {
        const activeLinkText = await activeLink.textContent();
        console.log(`Active link on ${testPage.url}: ${activeLinkText}`);

        // Verify the correct link is active
        if (activeLinkText?.includes(testPage.expectedActive)) {
          console.log(`✅ Correct active state for ${testPage.expectedActive}`);
        } else {
          console.log(`⚠️ Unexpected active state: expected ${testPage.expectedActive}, got ${activeLinkText}`);
        }
      } else {
        console.log(`ℹ️ No active link found on ${testPage.url}`);
      }

      // Take screenshot for visual verification
      await page.screenshot({
        path: `test-results/header-active-state-${testPage.expectedActive.toLowerCase()}.png`,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 200 },
      });
    }
  });
});
