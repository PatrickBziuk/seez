import { test, expect } from '@playwright/test';

test.describe('Header Bug Investigation', () => {
  test('should debug why navigation switches to mobile on category pages', async ({ page }) => {
    // Enable console logging
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));

    // Set large desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('=== STEP 1: Home Page ===');
    await page.goto('http://localhost:4323/en');
    await page.waitForLoadState('networkidle');

    // Debug home page navigation state
    const homeNavState = await page.evaluate(() => {
      const desktopNav = document.querySelector('nav[data-nav="desktop"]') as HTMLElement;
      const mobileNav = document.querySelector('nav[data-nav="mobile"]') as HTMLElement;
      const toggleBtn = document.querySelector('[data-aw-toggle-menu]') as HTMLElement;

      return {
        url: window.location.href,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        mediaQuery768: window.matchMedia('(min-width: 768px)').matches,
        mediaQuery1024: window.matchMedia('(min-width: 1024px)').matches,
        desktopNav: {
          exists: !!desktopNav,
          visible: desktopNav ? getComputedStyle(desktopNav).display !== 'none' : false,
          classes: desktopNav?.className || null,
          computedDisplay: desktopNav ? getComputedStyle(desktopNav).display : null,
        },
        mobileNav: {
          exists: !!mobileNav,
          visible: mobileNav ? getComputedStyle(mobileNav).display !== 'none' : false,
          classes: mobileNav?.className || null,
        },
        toggleBtn: {
          exists: !!toggleBtn,
          visible: toggleBtn ? getComputedStyle(toggleBtn).display !== 'none' : false,
          classes: toggleBtn?.className || null,
        },
      };
    });

    console.log('HOME PAGE STATE:', JSON.stringify(homeNavState, null, 2));

    // Verify home page is in desktop mode
    expect(homeNavState.desktopNav.visible).toBe(true);
    expect(homeNavState.toggleBtn.visible).toBe(false);

    console.log('\\n=== STEP 2: Click Books ===');

    // Click Books and capture the transition
    await page.locator('nav[data-nav="desktop"] a[href="/en/books"]').click();
    await page.waitForLoadState('networkidle');

    // Debug books page navigation state
    const booksNavState = await page.evaluate(() => {
      const desktopNav = document.querySelector('nav[data-nav="desktop"]') as HTMLElement;
      const mobileNav = document.querySelector('nav[data-nav="mobile"]') as HTMLElement;
      const toggleBtn = document.querySelector('[data-aw-toggle-menu]') as HTMLElement;

      return {
        url: window.location.href,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        mediaQuery768: window.matchMedia('(min-width: 768px)').matches,
        mediaQuery1024: window.matchMedia('(min-width: 1024px)').matches,
        desktopNav: {
          exists: !!desktopNav,
          visible: desktopNav ? getComputedStyle(desktopNav).display !== 'none' : false,
          classes: desktopNav?.className || null,
          computedDisplay: desktopNav ? getComputedStyle(desktopNav).display : null,
          computedVisibility: desktopNav ? getComputedStyle(desktopNav).visibility : null,
          offsetWidth: desktopNav?.offsetWidth || 0,
          offsetHeight: desktopNav?.offsetHeight || 0,
        },
        mobileNav: {
          exists: !!mobileNav,
          visible: mobileNav ? getComputedStyle(mobileNav).display !== 'none' : false,
          classes: mobileNav?.className || null,
        },
        toggleBtn: {
          exists: !!toggleBtn,
          visible: toggleBtn ? getComputedStyle(toggleBtn).display !== 'none' : false,
          classes: toggleBtn?.className || null,
          computedDisplay: toggleBtn ? getComputedStyle(toggleBtn).display : null,
        },
        bodyClasses: document.body.className,
        htmlClasses: document.documentElement.className,
      };
    });

    console.log('BOOKS PAGE STATE:', JSON.stringify(booksNavState, null, 2));

    // Compare states
    console.log('\\n=== COMPARISON ===');
    console.log('Media query changed:', homeNavState.mediaQuery768 !== booksNavState.mediaQuery768);
    console.log('Desktop nav visible changed:', homeNavState.desktopNav.visible !== booksNavState.desktopNav.visible);
    console.log('Toggle button visible changed:', homeNavState.toggleBtn.visible !== booksNavState.toggleBtn.visible);

    if (!booksNavState.desktopNav.visible) {
      console.log('\\n🚨 BUG CONFIRMED: Desktop navigation disappeared on Books page');

      // Check if classes changed
      if (homeNavState.desktopNav.classes !== booksNavState.desktopNav.classes) {
        console.log('Desktop nav classes changed:');
        console.log('Home:', homeNavState.desktopNav.classes);
        console.log('Books:', booksNavState.desktopNav.classes);
      }

      // Check computed styles in detail
      console.log('\\nDetailed CSS analysis:');
      const cssAnalysis = await page.evaluate(() => {
        const desktopNav = document.querySelector('nav[data-nav="desktop"]') as HTMLElement;
        if (!desktopNav) return null;

        const styles = getComputedStyle(desktopNav);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          width: styles.width,
          height: styles.height,
          overflow: styles.overflow,
          position: styles.position,
          zIndex: styles.zIndex,
        };
      });

      console.log('Desktop nav computed styles:', cssAnalysis);

      // Check if any scripts are running that might affect navigation
      const scripts = await page.evaluate(() => {
        return Array.from(document.scripts).map((script) => ({
          src: script.src || 'inline',
          text: script.src ? null : script.textContent?.substring(0, 100),
        }));
      });

      console.log('Scripts on page:', scripts.length);
    }

    // Take screenshots for visual comparison
    await page.screenshot({
      path: 'test-results/bug-investigation-books-page.png',
      fullPage: false,
    });

    // Try to understand why this is happening by checking the source
    const headerHTML = await page.locator('header').innerHTML();
    console.log('\\nHeader HTML structure (first 500 chars):', headerHTML.substring(0, 500));
  });
});
