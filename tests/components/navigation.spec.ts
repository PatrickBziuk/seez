import { test, expect } from '@playwright/test';

/**
 * Navigation Component Tests
 *
 * Tests main navigation menu, breadcrumbs, footer navigation,
 * mobile navigation behavior, and multilingual navigation
 * consistency across different screen sizes and languages.
 */

test.describe('Main Navigation Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main navigation menu', async ({ page }) => {
    const viewport = page.viewportSize() || { width: 1024, height: 768 };

    const mainNav = page.locator('[data-nav="desktop"]');

    // On desktop, navigation should be visible (CSS: hidden md:flex)
    if (viewport.width >= 768) {
      await expect(mainNav).toBeVisible();
    } else {
      // On mobile, desktop nav should be hidden
      const isHidden = await mainNav.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return computed.display === 'none';
      });
      expect(isHidden).toBe(true);
    }

    // Should contain navigation links
    const navLinks = mainNav.locator('a');
    expect(await navLinks.count()).toBeGreaterThan(0);
  });

  test('should have correct navigation structure', async ({ page }) => {
    const navLinks = page.locator('nav a, .navigation a, .main-nav a');

    if ((await navLinks.count()) > 0) {
      // Check for main sections
      const linkTexts = await navLinks.allTextContents();
      const expectedSections = ['books', 'projects', 'lab', 'life', 'home'];

      const hasMainSections = expectedSections.some((section) =>
        linkTexts.some((text) => text.toLowerCase().includes(section))
      );

      expect(hasMainSections).toBe(true);
    }
  });

  test('should highlight current page in navigation', async ({ page }) => {
    const viewport = page.viewportSize() || { width: 1024, height: 768 };

    // Only test on desktop where navigation is visible
    if (viewport.width >= 768) {
      // Navigate to a specific section
      const booksLink = page.locator('[data-nav="desktop"] a[href*="/books"]');

      if ((await booksLink.count()) > 0) {
        await booksLink.first().click();
        await page.waitForLoadState('networkidle');

        // Check for active/current state
        const activeNavItem = page.locator(
          '[data-nav="desktop"] .active, [data-nav="desktop"] .current, [data-nav="desktop"] [aria-current="page"]'
        );

        if ((await activeNavItem.count()) > 0) {
          const activeText = await activeNavItem.first().textContent();
          expect(activeText?.toLowerCase()).toMatch(/books?/);
        }
      }
    }
  });

  test('should be keyboard accessible', async ({ page }) => {
    const viewport = page.viewportSize() || { width: 1024, height: 768 };

    // Only test on desktop where navigation is visible
    if (viewport.width >= 768) {
      const firstNavLink = page.locator('[data-nav="desktop"] a').first();

      if ((await firstNavLink.count()) > 0) {
        await firstNavLink.focus();
        await expect(firstNavLink).toBeFocused();

        // Should be able to navigate with Tab
        await page.keyboard.press('Tab');

        const secondNavLink = page.locator('[data-nav="desktop"] a').nth(1);

        if ((await secondNavLink.count()) > 0) {
          await expect(secondNavLink).toBeFocused();
        }
      }
    }
  });

  test('should have proper semantic structure', async ({ page }) => {
    const navigation = page.locator('nav, [role="navigation"]');

    if ((await navigation.count()) > 0) {
      // Should use proper HTML5 nav element or role
      const isSemanticNav = await navigation
        .first()
        .evaluate((el) => el.tagName.toLowerCase() === 'nav' || el.getAttribute('role') === 'navigation');

      expect(isSemanticNav).toBe(true);

      // Should have accessible name
      const ariaLabel = await navigation.first().getAttribute('aria-label');
      const ariaLabelledBy = await navigation.first().getAttribute('aria-labelledby');

      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });
});

test.describe('Mobile Navigation', () => {
  test('should display mobile menu toggle on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const mobileToggle = page.locator('[data-aw-toggle-menu]');

    await expect(mobileToggle).toBeVisible();

    // Should have proper accessibility attributes
    const ariaLabel = await mobileToggle.getAttribute('aria-label');
    const ariaExpanded = await mobileToggle.getAttribute('aria-expanded');

    expect(ariaLabel !== null || ariaExpanded !== null).toBe(true);
  });

  test('should toggle mobile menu visibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const mobileToggle = page.locator('[data-aw-toggle-menu]');
    const mobileMenu = page.locator('#mobile-navigation');

    // Initially should be hidden
    await expect(mobileMenu).not.toBeVisible();

    await mobileToggle.click();
    await page.waitForTimeout(300);

    // Should be visible after toggle (JavaScript removes 'hidden' class)
    await expect(mobileMenu).toBeVisible();

    // Click again to close
    await mobileToggle.click();
    await page.waitForTimeout(300);

    // Should be hidden again
    await expect(mobileMenu).not.toBeVisible();
  });

  test('should hide desktop navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const desktopNav = page.locator('[data-nav="desktop"]');

    // Should be hidden on mobile (uses CSS classes hidden md:flex)
    const isHidden = await desktopNav.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.display === 'none';
    });

    expect(isHidden).toBe(true);
  });

  test('should provide touch-friendly mobile menu items', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const mobileToggle = page.locator('[data-aw-toggle-menu]');

    await mobileToggle.click();
    await page.waitForTimeout(300);

    const mobileMenuItems = page.locator('#mobile-navigation a');

    if ((await mobileMenuItems.count()) > 0) {
      // Should be large enough for touch
      const itemBox = await mobileMenuItems.first().boundingBox();
      expect(itemBox?.height).toBeGreaterThanOrEqual(44); // iOS minimum

      // Should be properly spaced
      expect(itemBox?.width).toBeGreaterThan(0);
    }
  });

  test('should handle touch gestures correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Test swipe gesture simulation
    const mobileToggle = page.locator('[data-aw-toggle-menu]');

    // Touch start/end simulation
    await mobileToggle.hover();
    await page.mouse.down();
    await page.mouse.up();

    // Verify toggle responded to touch
    await page.waitForTimeout(300);
    const menu = page.locator('#mobile-navigation');
    const isVisible = await menu.isVisible();

    expect(isVisible).toBe(true);
  });

  test('should maintain consistent tap targets across breakpoints', async ({ page }) => {
    const breakpoints = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'desktop' },
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/');

      // Check primary navigation elements
      const navElements = page.locator('nav a[data-testid*="nav"]');
      const count = await navElements.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = navElements.nth(i);
          const box = await element.boundingBox();

          if (box) {
            // Minimum tap target size
            expect(box.height).toBeGreaterThanOrEqual(32);
            expect(box.width).toBeGreaterThanOrEqual(32);
          }
        }
      }
    }
  });
});

test.describe('Breadcrumb Navigation', () => {
  test('should display breadcrumbs on content pages', async ({ page }) => {
    await page.goto('/');

    // Navigate to content
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const breadcrumbs = page.locator('.breadcrumb, .breadcrumbs, nav[aria-label*="breadcrumb"], [data-breadcrumb]');

      if ((await breadcrumbs.count()) > 0) {
        await expect(breadcrumbs.first()).toBeVisible();

        // Should contain navigation trail
        const breadcrumbItems = breadcrumbs.first().locator('a, span');
        expect(await breadcrumbItems.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should show correct breadcrumb hierarchy', async ({ page }) => {
    await page.goto('/');

    const booksLink = page.locator('a[href*="/books/"]');

    if ((await booksLink.count()) > 0) {
      await booksLink.first().click();
      await page.waitForLoadState('networkidle');

      const breadcrumbs = page.locator('.breadcrumb, .breadcrumbs');

      if ((await breadcrumbs.count()) > 0) {
        const breadcrumbText = await breadcrumbs.first().textContent();

        // Should show hierarchy (Home > Books or similar)
        expect(breadcrumbText?.toLowerCase()).toMatch(/home|books/);
      }
    }
  });

  test('should have clickable breadcrumb links', async ({ page }) => {
    await page.goto('/');

    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const breadcrumbLinks = page.locator('.breadcrumb a, .breadcrumbs a');

      if ((await breadcrumbLinks.count()) > 0) {
        const originalUrl = page.url();

        await breadcrumbLinks.first().click();
        await page.waitForLoadState('networkidle');

        const newUrl = page.url();

        // Should navigate to parent level
        expect(newUrl).not.toBe(originalUrl);
      }
    }
  });

  test('should use proper breadcrumb markup', async ({ page }) => {
    await page.goto('/');

    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const breadcrumbNav = page.locator('nav[aria-label*="breadcrumb"], [role="navigation"]');

      if ((await breadcrumbNav.count()) > 0) {
        // Should use proper ARIA or structured data
        const ariaLabel = await breadcrumbNav.first().getAttribute('aria-label');
        const hasStructuredData = (await page.locator('[itemtype*="BreadcrumbList"]').count()) > 0;

        expect(ariaLabel?.toLowerCase().includes('breadcrumb') || hasStructuredData).toBe(true);
      }
    }
  });
});

test.describe('Footer Navigation', () => {
  test('should display footer navigation', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');

    if ((await footer.count()) > 0) {
      await expect(footer.first()).toBeVisible();

      const footerLinks = footer.first().locator('a');
      expect(await footerLinks.count()).toBeGreaterThan(0);
    }
  });

  test('should include important site links in footer', async ({ page }) => {
    await page.goto('/');

    const footerLinks = page.locator('footer a');

    if ((await footerLinks.count()) > 0) {
      const linkTexts = await footerLinks.allTextContents();
      const importantLinks = ['privacy', 'contact', 'about', 'sitemap', 'rss'];

      const hasImportantLinks = importantLinks.some((link) =>
        linkTexts.some((text) => text.toLowerCase().includes(link))
      );

      expect(hasImportantLinks).toBe(true);
    }
  });

  test('should include social media links', async ({ page }) => {
    await page.goto('/');

    const socialLinks = page.locator('footer a[href*="github"], footer a[href*="twitter"], footer a[href*="linkedin"]');

    if ((await socialLinks.count()) > 0) {
      await expect(socialLinks.first()).toBeVisible();

      // Should open in new tab
      const target = await socialLinks.first().getAttribute('target');
      expect(target).toBe('_blank');

      // Should have security attributes
      const rel = await socialLinks.first().getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });

  test('should display copyright information', async ({ page }) => {
    await page.goto('/');

    const copyright = page.locator('footer .copyright, footer [data-copyright], footer:has-text("©")');

    if ((await copyright.count()) > 0) {
      const copyrightText = await copyright.first().textContent();

      // Should contain copyright symbol and current year
      expect(copyrightText).toMatch(/©|copyright/i);
      expect(copyrightText).toMatch(/20\d{2}/); // Year pattern
    }
  });
});

test.describe('Navigation Multilingual Support', () => {
  test('should adapt navigation for different languages', async ({ page }) => {
    // Test English navigation
    await page.goto('/en');

    const navLinks = page.locator('nav a, .navigation a');

    if ((await navLinks.count()) > 0) {
      const englishTexts = await navLinks.allTextContents();

      // Test German navigation
      await page.goto('/de');

      const germanTexts = await navLinks.allTextContents();

      // Should have different text content for different languages
      if (englishTexts.length > 0 && germanTexts.length > 0) {
        const hasDifferentTexts = englishTexts.some((text, index) => germanTexts[index] && text !== germanTexts[index]);

        expect(hasDifferentTexts).toBe(true);
      }
    }
  });

  test('should maintain navigation structure across languages', async ({ page }) => {
    await page.goto('/en');

    const englishNavCount = await page.locator('nav a, .navigation a').count();

    await page.goto('/de');

    const germanNavCount = await page.locator('nav a, .navigation a').count();

    // Should have same number of navigation items
    expect(germanNavCount).toBe(englishNavCount);
  });

  test('should link to correct language versions', async ({ page }) => {
    await page.goto('/en');

    const navLinks = page.locator('nav a[href*="/en/"], .navigation a[href*="/en/"]');

    if ((await navLinks.count()) > 0) {
      // All navigation links should point to English pages
      for (let i = 0; i < (await navLinks.count()); i++) {
        const href = await navLinks.nth(i).getAttribute('href');
        expect(href).toMatch(/\/en\//);
      }
    }

    await page.goto('/de');

    const germanNavLinks = page.locator('nav a[href*="/de/"], .navigation a[href*="/de/"]');

    if ((await germanNavLinks.count()) > 0) {
      // All navigation links should point to German pages
      for (let i = 0; i < (await germanNavLinks.count()); i++) {
        const href = await germanNavLinks.nth(i).getAttribute('href');
        expect(href).toMatch(/\/de\//);
      }
    }
  });
});

test.describe('Navigation Performance and UX', () => {
  test('should have smooth hover effects', async ({ page }) => {
    const viewport = page.viewportSize() || { width: 1024, height: 768 };

    // Only test hover effects on desktop
    if (viewport.width >= 768) {
      await page.goto('/');

      const navLink = page.locator('[data-nav="desktop"] a').first();

      if ((await navLink.count()) > 0) {
        // Get initial styles
        const initialStyles = await navLink.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            textDecoration: computed.textDecoration,
          };
        });

        await navLink.hover();
        await page.waitForTimeout(200);

        const hoverStyles = await navLink.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            textDecoration: computed.textDecoration,
          };
        });

        // Should have some hover effect
        const hasHoverEffect =
          hoverStyles.color !== initialStyles.color ||
          hoverStyles.backgroundColor !== initialStyles.backgroundColor ||
          hoverStyles.textDecoration !== initialStyles.textDecoration;

        expect(hasHoverEffect).toBe(true);
      }
    }
  });

  test('should be responsive across screen sizes', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    const desktopNav = page.locator('nav, .navigation');
    await expect(desktopNav.first()).toBeVisible();

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    await expect(desktopNav.first()).toBeVisible();

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Should show mobile toggle or regular nav should be functional
    const mobileToggle = page.locator('[data-aw-toggle-menu]');

    if ((await mobileToggle.count()) > 0) {
      await expect(mobileToggle).toBeVisible();
    } else {
      // Regular nav should still be visible and functional
      await expect(desktopNav.first()).toBeVisible();
    }
  });

  test('should handle focus management properly', async ({ page }) => {
    await page.goto('/');

    const firstNavLink = page.locator('nav a, .navigation a').first();

    if ((await firstNavLink.count()) > 0) {
      await firstNavLink.focus();

      // Should have visible focus indicator
      const focusStyles = await firstNavLink.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          boxShadow: computed.boxShadow,
          border: computed.border,
        };
      });

      const hasFocusIndicator =
        focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none' || focusStyles.border !== '0px none';

      expect(hasFocusIndicator).toBe(true);
    }
  });

  test('should provide clear visual hierarchy', async ({ page }) => {
    await page.goto('/');

    const navigation = page.locator('nav, .navigation');

    if ((await navigation.count()) > 0) {
      // Should be visually distinct from content
      const navStyles = await navigation.first().evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderBottom: computed.borderBottom,
          padding: computed.padding,
          margin: computed.margin,
        };
      });

      // Should have some visual separation
      const hasVisualSeparation =
        navStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
        navStyles.borderBottom !== '0px none' ||
        parseFloat(navStyles.padding) > 0 ||
        parseFloat(navStyles.margin) > 0;

      expect(hasVisualSeparation).toBe(true);
    }
  });
});
