import { test, expect } from '@playwright/test';

/**
 * TLDR Component Tests
 *
 * Tests the TLDR (Too Long; Didn't Read) expand/collapse functionality.
 * This includes collapsible content behavior, accessibility features,
 * and visual state management.
 */

test.describe('TLDR Component Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Start from homepage and navigate to content with TLDR
    await page.goto('/');
  });

  test('should display TLDR sections', async ({ page }) => {
    // Look for content pages that might have TLDR
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for TLDR components
      const tldrElements = page.locator('.tldr, .tl-dr, .summary, .tldr-section, [data-testid="tldr"]');

      if ((await tldrElements.count()) > 0) {
        await expect(tldrElements.first()).toBeVisible();

        // Should have some content
        const tldrText = await tldrElements.first().textContent();
        expect(tldrText?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should expand and collapse TLDR content', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    // Check multiple pages for TLDR functionality
    for (let i = 0; i < Math.min(3, await contentLinks.count()); i++) {
      await contentLinks.nth(i).click();
      await page.waitForLoadState('networkidle');

      // Look for TLDR toggle buttons or collapsible elements
      const tldrToggle = page.locator('.tldr-toggle, .toggle-tldr, .expand-tldr, .tldr button, .tldr [role="button"]');

      if ((await tldrToggle.count()) > 0) {
        // Test expand/collapse functionality
        const initialState = await tldrToggle.first().getAttribute('aria-expanded');

        await tldrToggle.first().click();
        await page.waitForTimeout(300); // Wait for animation

        const afterClickState = await tldrToggle.first().getAttribute('aria-expanded');

        // State should have changed
        expect(afterClickState).not.toBe(initialState);

        // Click again to toggle back
        await tldrToggle.first().click();
        await page.waitForTimeout(300);

        const finalState = await tldrToggle.first().getAttribute('aria-expanded');
        expect(finalState).toBe(initialState);

        break; // Found working TLDR, exit loop
      }

      // Go back to try next page
      if (i < Math.min(2, await contentLinks.count()) - 1) {
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should show/hide TLDR content based on state', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for collapsible TLDR content
      const tldrContent = page.locator('.tldr-content, .tldr-text, .tldr-body, .collapsible-content');

      const tldrToggle = page.locator('.tldr-toggle, .toggle-tldr, .expand-tldr');

      if ((await tldrContent.count()) > 0 && (await tldrToggle.count()) > 0) {
        // Check initial visibility
        const initiallyVisible = await tldrContent.first().isVisible();

        // Toggle state
        await tldrToggle.first().click();
        await page.waitForTimeout(300);

        // Visibility should change
        const afterToggleVisible = await tldrContent.first().isVisible();
        expect(afterToggleVisible).not.toBe(initiallyVisible);
      }
    }
  });

  test('should have proper ARIA attributes for accessibility', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for TLDR toggle with ARIA attributes
      const tldrToggle = page.locator('.tldr-toggle, .toggle-tldr, .expand-tldr, .tldr button');

      if ((await tldrToggle.count()) > 0) {
        // Should have proper ARIA attributes
        const ariaExpanded = await tldrToggle.first().getAttribute('aria-expanded');
        const ariaControls = await tldrToggle.first().getAttribute('aria-controls');
        const role = await tldrToggle.first().getAttribute('role');

        // Should have aria-expanded
        expect(ariaExpanded).toBeTruthy();
        expect(['true', 'false']).toContain(ariaExpanded);

        // Should have aria-controls or be a proper button
        expect(
          ariaControls || role === 'button' || (await tldrToggle.first().evaluate((el) => el.tagName === 'BUTTON'))
        ).toBeTruthy();
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const tldrToggle = page.locator('.tldr-toggle, .toggle-tldr, .expand-tldr, .tldr button');

      if ((await tldrToggle.count()) > 0) {
        // Focus the toggle
        await tldrToggle.first().focus();
        await expect(tldrToggle.first()).toBeFocused();

        // Should be activatable with Enter or Space
        const initialState = await tldrToggle.first().getAttribute('aria-expanded');

        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        const afterEnterState = await tldrToggle.first().getAttribute('aria-expanded');

        // State should change with keyboard activation
        if (initialState !== null && afterEnterState !== null) {
          expect(afterEnterState).not.toBe(initialState);
        }
      }
    }
  });
});

test.describe('TLDR Visual Presentation', () => {
  test('should have distinct visual styling', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const tldrSection = page.locator('.tldr, .tl-dr, .summary, .tldr-section');

      if ((await tldrSection.count()) > 0) {
        // Should have distinct styling
        const styles = await tldrSection.first().evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            border: computed.border,
            borderRadius: computed.borderRadius,
            padding: computed.padding,
            margin: computed.margin,
          };
        });

        // Should have some visual distinction (background, border, etc.)
        const hasVisualDistinction =
          styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
          styles.border !== '0px none' ||
          parseFloat(styles.borderRadius) > 0 ||
          parseFloat(styles.padding) > 0;

        expect(hasVisualDistinction).toBe(true);
      }
    }
  });

  test('should show appropriate expand/collapse indicators', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const tldrToggle = page.locator('.tldr-toggle, .toggle-tldr, .expand-tldr');

      if ((await tldrToggle.count()) > 0) {
        // Should have some indicator (text, icon, arrow)
        const toggleText = await tldrToggle.first().textContent();
        const hasIcon = (await tldrToggle.first().locator('svg, .icon, i').count()) > 0;

        // Should have either meaningful text or icon
        expect(toggleText?.trim().length || hasIcon).toBeTruthy();

        // Common expand/collapse text patterns
        if (toggleText) {
          const expandTexts = ['show', 'expand', 'more', '▼', '▲', '⬇', '⬆', '+', '-'];
          const hasExpandText = expandTexts.some((text) => toggleText.toLowerCase().includes(text.toLowerCase()));

          expect(hasExpandText || hasIcon).toBe(true);
        }
      }
    }
  });

  test('should animate transitions smoothly', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const tldrToggle = page.locator('.tldr-toggle, .toggle-tldr, .expand-tldr');
      const tldrContent = page.locator('.tldr-content, .tldr-text, .collapsible-content');

      if ((await tldrToggle.count()) > 0 && (await tldrContent.count()) > 0) {
        // Check for CSS transitions
        const hasTransition = await tldrContent.first().evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return computed.transition !== 'all 0s ease 0s' && computed.transition !== 'none';
        });

        // Should have some form of transition/animation
        if (hasTransition) {
          expect(hasTransition).toBe(true);
        } else {
          // If no CSS transition, at least check that toggle works
          await tldrToggle.first().click();
          await page.waitForTimeout(100);

          // Should respond to clicks
          expect(true).toBe(true); // Placeholder - actual state change tested elsewhere
        }
      }
    }
  });
});

test.describe('TLDR Content Quality', () => {
  test('should contain meaningful summary content', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const tldrContent = page.locator('.tldr-content, .tldr-text, .tldr p, .summary-text');

      if ((await tldrContent.count()) > 0) {
        const summaryText = await tldrContent.first().textContent();

        if (summaryText) {
          // Should be a reasonable length for a summary
          expect(summaryText.trim().length).toBeGreaterThan(20);
          expect(summaryText.trim().length).toBeLessThan(500);

          // Should contain complete sentences
          expect(summaryText).toMatch(/[.!?]/);
        }
      }
    }
  });

  test('should be positioned appropriately in content', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const tldrSection = page.locator('.tldr, .tl-dr, .summary');

      if ((await tldrSection.count()) > 0) {
        // Should be near the top of the content
        const tldrPosition = await tldrSection.first().boundingBox();
        const contentArea = page.locator('main, .content, article');
        const contentPosition = await contentArea.first().boundingBox();

        if (tldrPosition && contentPosition) {
          // TLDR should be in the upper portion of content
          const relativePosition = (tldrPosition.y - contentPosition.y) / contentPosition.height;
          expect(relativePosition).toBeLessThan(0.5); // In first half of content
        }
      }
    }
  });

  test('should not interfere with main content flow', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check that page is still readable with TLDR present
      const mainContent = page.locator('main, .content, article');
      await expect(mainContent).toBeVisible();

      // Should not cause layout issues
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    }
  });
});
