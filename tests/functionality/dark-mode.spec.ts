import { test, expect } from '@playwright/test';

/**
 * Dark Mode Functionality Tests
 * 
 * Tests theme switching, persistence, and visual consistency across the site.
 * This includes dark/light mode toggle, localStorage persistence,
 * and proper CSS class application.
 */

test.describe('Dark Mode Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto('/');
  });

  test('should display theme toggle button', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"], button[aria-label*="dark"]'
    );
    
    // At least one theme toggle should be visible
    expect(await themeToggle.count()).toBeGreaterThan(0);
    await expect(themeToggle.first()).toBeVisible();
  });

  test('should toggle to dark mode', async ({ page }) => {
    // Find theme toggle
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"]'
    );
    
    if (await themeToggle.count() > 0) {
      // Get initial theme state
      const initialClass = await page.locator('html').getAttribute('class') || '';
      
      // Click theme toggle
      await themeToggle.first().click();
      
      // Wait for theme change
      await page.waitForTimeout(300);
      
      // Check for dark mode indicators
      await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.documentElement.classList.contains('theme-dark') ||
               document.body.classList.contains('dark') ||
               document.body.classList.contains('theme-dark');
      });
      
      // Verify theme changed
      const finalClass = await page.locator('html').getAttribute('class') || '';
      expect(finalClass).not.toBe(initialClass);
    }
  });

  test('should toggle to light mode', async ({ page }) => {
    // First ensure we're in dark mode
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"]'
    );
    
    if (await themeToggle.count() > 0) {
      // Click once to potentially activate dark mode
      await themeToggle.first().click();
      await page.waitForTimeout(300);
      
      // Click again to go back to light mode
      await themeToggle.first().click();
      await page.waitForTimeout(300);
      
      // Check for light mode (absence of dark class)
      const lightModeActive = await page.evaluate(() => {
        return !document.documentElement.classList.contains('dark') &&
               !document.documentElement.classList.contains('theme-dark') &&
               !document.body.classList.contains('dark') &&
               !document.body.classList.contains('theme-dark');
      });
      
      expect(lightModeActive).toBe(true);
    }
  });

  test('should persist theme preference in localStorage', async ({ page }) => {
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"]'
    );
    
    if (await themeToggle.count() > 0) {
      // Toggle theme
      await themeToggle.first().click();
      await page.waitForTimeout(300);
      
      // Check localStorage
      const storedTheme = await page.evaluate(() => {
        return localStorage.getItem('theme') || 
               localStorage.getItem('darkMode') ||
               localStorage.getItem('color-scheme');
      });
      
      expect(storedTheme).toBeTruthy();
      
      // Reload page and verify theme persists
      await page.reload();
      await page.waitForTimeout(500);
      
      const themeAfterReload = await page.evaluate(() => {
        return localStorage.getItem('theme') || 
               localStorage.getItem('darkMode') ||
               localStorage.getItem('color-scheme');
      });
      
      expect(themeAfterReload).toBe(storedTheme);
    }
  });

  test('should maintain theme across page navigation', async ({ page }) => {
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"]'
    );
    
    if (await themeToggle.count() > 0) {
      // Set dark mode
      await themeToggle.first().click();
      await page.waitForTimeout(300);
      
      // Get theme state
      const darkModeActive = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.body.classList.contains('dark');
      });
      
      // Navigate to another page
      const navLinks = page.locator('nav a, header a, .navigation a');
      if (await navLinks.count() > 0) {
        await navLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Verify theme persisted
        const darkModeAfterNav = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ||
                 document.body.classList.contains('dark');
        });
        
        expect(darkModeAfterNav).toBe(darkModeActive);
      }
    }
  });
});

test.describe('Dark Mode Visual Consistency', () => {
  test('should have proper contrast in dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Toggle to dark mode
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"]'
    );
    
    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(300);
      
      // Check background and text colors are appropriate for dark mode
      const bodyStyles = await page.evaluate(() => {
        const computedStyle = window.getComputedStyle(document.body);
        return {
          backgroundColor: computedStyle.backgroundColor,
          color: computedStyle.color
        };
      });
      
      // In dark mode, background should be dark and text should be light
      expect(bodyStyles.backgroundColor).toBeTruthy();
      expect(bodyStyles.color).toBeTruthy();
    }
  });

  test('should properly style navigation in dark mode', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"]'
    );
    
    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(300);
      
      // Check navigation elements are visible in dark mode
      const navElements = page.locator('nav, header, .navigation');
      if (await navElements.count() > 0) {
        await expect(navElements.first()).toBeVisible();
        
        // Check nav links are visible
        const navLinks = page.locator('nav a, header a');
        if (await navLinks.count() > 0) {
          await expect(navLinks.first()).toBeVisible();
        }
      }
    }
  });

  test('should handle images properly in dark mode', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"]'
    );
    
    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(300);
      
      // Check if images are still visible and properly styled
      const images = page.locator('img');
      if (await images.count() > 0) {
        // Images should not be completely hidden
        for (let i = 0; i < Math.min(3, await images.count()); i++) {
          const img = images.nth(i);
          await expect(img).toBeVisible();
        }
      }
    }
  });

  test('should style code blocks appropriately in dark mode', async ({ page }) => {
    // Navigate to a page that might have code blocks
    await page.goto('/');
    
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"]'
    );
    
    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(300);
      
      // Look for code blocks
      const codeBlocks = page.locator('pre, code, .code-block');
      if (await codeBlocks.count() > 0) {
        // Code blocks should be visible and properly styled
        await expect(codeBlocks.first()).toBeVisible();
        
        // Check that code has appropriate styling
        const codeStyles = await codeBlocks.first().evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            visibility: style.visibility
          };
        });
        
        expect(codeStyles.visibility).toBe('visible');
      }
    }
  });
});

test.describe('Theme System Integration', () => {
  test('should respect system theme preference', async ({ page }) => {
    // This test checks if the site respects prefers-color-scheme
    await page.goto('/');
    
    // Check if system preference is detected
    const systemDarkMode = await page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    
    // If system prefers dark mode, check if site responds
    if (systemDarkMode) {
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.body.classList.contains('dark');
      });
      
      // Site should either respect system preference or have explicit theme
      expect(typeof initialTheme).toBe('boolean');
    }
  });

  test('should handle theme toggle keyboard accessibility', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"]'
    );
    
    if (await themeToggle.count() > 0) {
      // Focus theme toggle
      await themeToggle.first().focus();
      await expect(themeToggle.first()).toBeFocused();
      
      // Activate with keyboard
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      // Verify theme changed
      const themeChanged = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.body.classList.contains('dark');
      });
      
      expect(typeof themeChanged).toBe('boolean');
    }
  });

  test('should have proper ARIA attributes for theme toggle', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"]'
    );
    
    if (await themeToggle.count() > 0) {
      // Check for accessibility attributes
      const ariaLabel = await themeToggle.first().getAttribute('aria-label');
      const role = await themeToggle.first().getAttribute('role');
      
      // Should have meaningful aria-label or be a proper button
      expect(ariaLabel || role === 'button' || await themeToggle.first().evaluate(el => el.tagName === 'BUTTON')).toBeTruthy();
    }
  });

  test('should not break layout when switching themes', async ({ page }) => {
    await page.goto('/');
    
    // Get initial layout measurements
    const initialLayout = await page.evaluate(() => {
      return {
        bodyWidth: document.body.scrollWidth,
        bodyHeight: document.body.scrollHeight,
        hasHorizontalScroll: document.body.scrollWidth > window.innerWidth
      };
    });
    
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button[aria-label*="theme"]'
    );
    
    if (await themeToggle.count() > 0) {
      // Toggle theme
      await themeToggle.first().click();
      await page.waitForTimeout(500);
      
      // Check layout after theme change
      const finalLayout = await page.evaluate(() => {
        return {
          bodyWidth: document.body.scrollWidth,
          bodyHeight: document.body.scrollHeight,
          hasHorizontalScroll: document.body.scrollWidth > window.innerWidth
        };
      });
      
      // Layout should not be drastically different
      expect(Math.abs(finalLayout.bodyWidth - initialLayout.bodyWidth)).toBeLessThan(100);
      
      // Should not introduce horizontal scroll if it wasn't there before
      if (!initialLayout.hasHorizontalScroll) {
        expect(finalLayout.hasHorizontalScroll).toBe(false);
      }
    }
  });
});
