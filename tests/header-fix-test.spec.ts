import { test, expect } from '@playwright/test';

test.describe('Header Fix Attempt', () => {
  test('should apply CSS fix for header navigation', async ({ page }) => {
    // Set large desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    console.log('=== Before Fix ===');

    // Check current state
    const beforeState = await page.evaluate(() => {
      const desktopNav = document.querySelector('nav[data-nav="desktop"]') as HTMLElement;
      const toggleBtn = document.querySelector('[data-aw-toggle-menu]') as HTMLElement;

      return {
        desktopNav: {
          classes: desktopNav?.className,
          display: desktopNav ? getComputedStyle(desktopNav).display : 'not found',
          visible: desktopNav ? getComputedStyle(desktopNav).display !== 'none' : false,
        },
        toggleBtn: {
          classes: toggleBtn?.className,
          display: toggleBtn ? getComputedStyle(toggleBtn).display : 'not found',
          visible: toggleBtn ? getComputedStyle(toggleBtn).display !== 'none' : false,
        },
      };
    });

    console.log('Before state:', beforeState);

    // Apply CSS fix by adding custom styles to force correct behavior
    await page.addStyleTag({
      content: `
        /* Fix header navigation responsive behavior */
        @media (min-width: 768px) {
          nav[data-nav="desktop"] {
            display: flex !important;
          }
          
          [data-aw-toggle-menu] {
            display: none !important;
          }
          
          .md\\:hidden {
            display: none !important;
          }
          
          .md\\:flex {
            display: flex !important;
          }
        }
        
        @media (max-width: 767px) {
          nav[data-nav="desktop"] {
            display: none !important;
          }
          
          [data-aw-toggle-menu] {
            display: flex !important;
          }
        }
      `,
    });

    // Wait a moment for styles to apply
    await page.waitForTimeout(500);

    console.log('=== After Fix ===');

    // Check state after fix
    const afterState = await page.evaluate(() => {
      const desktopNav = document.querySelector('nav[data-nav="desktop"]') as HTMLElement;
      const toggleBtn = document.querySelector('[data-aw-toggle-menu]') as HTMLElement;

      return {
        desktopNav: {
          classes: desktopNav?.className,
          display: desktopNav ? getComputedStyle(desktopNav).display : 'not found',
          visible: desktopNav ? getComputedStyle(desktopNav).display !== 'none' : false,
        },
        toggleBtn: {
          classes: toggleBtn?.className,
          display: toggleBtn ? getComputedStyle(toggleBtn).display : 'not found',
          visible: toggleBtn ? getComputedStyle(toggleBtn).display !== 'none' : false,
        },
      };
    });

    console.log('After state:', afterState);

    // Verify the fix worked
    expect(afterState.desktopNav.visible).toBe(true);
    expect(afterState.toggleBtn.visible).toBe(false);

    // Take screenshot of fixed state
    await page.screenshot({
      path: 'test-results/header-fixed-home.png',
      fullPage: false,
    });

    console.log('=== Testing Navigation After Fix ===');

    // Test clicking on Books with the fix applied
    await page.locator('nav[data-nav="desktop"] a[href="/en/books"]').click();
    await page.waitForLoadState('networkidle');

    const booksState = await page.evaluate(() => {
      const desktopNav = document.querySelector('nav[data-nav="desktop"]') as HTMLElement;
      const toggleBtn = document.querySelector('[data-aw-toggle-menu]') as HTMLElement;

      return {
        url: window.location.href,
        desktopNav: {
          display: desktopNav ? getComputedStyle(desktopNav).display : 'not found',
          visible: desktopNav ? getComputedStyle(desktopNav).display !== 'none' : false,
        },
        toggleBtn: {
          display: toggleBtn ? getComputedStyle(toggleBtn).display : 'not found',
          visible: toggleBtn ? getComputedStyle(toggleBtn).display !== 'none' : false,
        },
      };
    });

    console.log('Books page state:', booksState);

    // Verify navigation still works after clicking
    expect(booksState.desktopNav.visible).toBe(true);
    expect(booksState.toggleBtn.visible).toBe(false);

    await page.screenshot({
      path: 'test-results/header-fixed-books.png',
      fullPage: false,
    });

    console.log('✅ Fix successful! Navigation works correctly.');
  });
});
