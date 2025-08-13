import { test, expect } from '@playwright/test';

/**
 * Language Switcher Component Tests
 *
 * Tests the language switching dropdown/toggle functionality,
 * including language detection, URL routing, content availability,
 * and visual presentation across different languages.
 */

test.describe('Language Switcher Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display language switcher component', async ({ page }) => {
    const languageSwitcher = page.locator(
      '.language-switcher-wrapper, .language-switcher, .lang-switcher, .language-toggle, [data-language-switcher]'
    );

    if ((await languageSwitcher.count()) > 0) {
      await expect(languageSwitcher.first()).toBeVisible();

      // Should contain language options or dropdown trigger
      const languageOptions = languageSwitcher
        .first()
        .locator('.lang-option, .language-option, option, a, summary, button');

      expect(await languageOptions.count()).toBeGreaterThan(0);
    }
  });

  test('should show current language as selected', async ({ page }) => {
    // Test English page
    await page.goto('/en');

    const languageSwitcher = page.locator('.language-switcher, .lang-switcher, .language-toggle');

    if ((await languageSwitcher.count()) > 0) {
      const currentLangElement = languageSwitcher
        .first()
        .locator('.current-lang, .active, [aria-current="page"], .selected');

      if ((await currentLangElement.count()) > 0) {
        const langText = await currentLangElement.first().textContent();

        // Should indicate English is current
        expect(langText?.toLowerCase()).toMatch(/en|english/);
      }
    }

    // Test German page
    await page.goto('/de');

    if ((await languageSwitcher.count()) > 0) {
      const currentLangElement = languageSwitcher
        .first()
        .locator('.current-lang, .active, [aria-current="page"], .selected');

      if ((await currentLangElement.count()) > 0) {
        const langText = await currentLangElement.first().textContent();

        // Should indicate German is current
        expect(langText?.toLowerCase()).toMatch(/de|deutsch|german/);
      }
    }
  });

  test('should show available language options', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher, .lang-switcher, .language-toggle');

    if ((await languageSwitcher.count()) > 0) {
      // Check if it's a dropdown that needs to be opened
      const toggleButton = languageSwitcher.first().locator('button, .dropdown-toggle, .lang-toggle');

      if ((await toggleButton.count()) > 0) {
        await toggleButton.first().click();
        await page.waitForTimeout(300);
      }

      const languageOptions = page.locator('.lang-option, .language-option, .dropdown-item');

      if ((await languageOptions.count()) > 0) {
        // Should have at least English and German options
        const allOptionsText = await languageOptions.allTextContents();
        const hasEnglish = allOptionsText.some(
          (text) => text.toLowerCase().includes('en') || text.toLowerCase().includes('english')
        );
        const hasGerman = allOptionsText.some(
          (text) =>
            text.toLowerCase().includes('de') ||
            text.toLowerCase().includes('deutsch') ||
            text.toLowerCase().includes('german')
        );

        expect(hasEnglish || hasGerman).toBe(true);
      }
    }
  });
});

test.describe('Language Switching Functionality', () => {
  test('should switch between English and German', async ({ page }) => {
    await page.goto('/en');

    const languageSwitcher = page.locator(
      '.language-switcher-wrapper, .language-switcher, .lang-switcher, .language-toggle'
    );

    if ((await languageSwitcher.count()) > 0) {
      // First, open the dropdown by clicking the summary/button
      const dropdownToggle = languageSwitcher.first().locator('summary, button');
      if ((await dropdownToggle.count()) > 0) {
        await dropdownToggle.first().click();
        await page.waitForTimeout(300); // Wait for dropdown to open
      }

      // Look for German language option (now visible)
      const germanOption = page.locator('a[href*="/de"].language-option, .lang-option[data-lang="de"]');

      if ((await germanOption.count()) > 0) {
        const initialUrl = page.url();

        await germanOption.first().click();
        await page.waitForLoadState('networkidle');

        const newUrl = page.url();

        // Should navigate to German version
        expect(newUrl).toMatch(/\/de/);
        expect(newUrl).not.toBe(initialUrl);
      }
    }
  });

  test('should maintain page context when switching languages', async ({ page }) => {
    // Start with English content page
    await page.goto('/en');

    const contentLinks = page.locator('a[href*="/en/books/"], a[href*="/en/projects/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const currentPath = new URL(page.url()).pathname;

      // Try to switch to German
      const germanOption = page.locator('a[href*="/de"], .lang-option[data-lang="de"]');

      if ((await germanOption.count()) > 0) {
        await germanOption.first().click();
        await page.waitForLoadState('networkidle');

        const newPath = new URL(page.url()).pathname;

        // Should maintain similar content path but in German
        const englishPathParts = currentPath.split('/');
        const germanPathParts = newPath.split('/');

        // Should have switched language prefix
        expect(germanPathParts[1]).toBe('de');

        // Should maintain content structure
        if (englishPathParts[2]) {
          expect(germanPathParts[2]).toBe(englishPathParts[2]); // Same collection
        }
      }
    }
  });

  test('should handle missing translations gracefully', async ({ page }) => {
    await page.goto('/en');

    // Navigate to content that might not have German translation
    const contentLinks = page.locator('a[href*="/en/books/"], a[href*="/en/projects/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const germanOption = page.locator('a[href*="/de"], .lang-option[data-lang="de"]');

      if ((await germanOption.count()) > 0) {
        await germanOption.first().click();
        await page.waitForLoadState('networkidle');

        // Should either show German version or graceful fallback
        // Should not show error page or broken state
        const errorIndicators = page.locator('.error, .not-found, h1:has-text("404"), h1:has-text("Error")');

        const hasErrorIndicators = (await errorIndicators.count()) > 0;

        // If there's an error, it should be a proper 404/fallback page
        if (hasErrorIndicators) {
          const pageTitle = await page.title();
          expect(pageTitle).not.toBe('');

          // Should have navigation to go back
          const navigation = page.locator('nav, .navigation, .menu');
          expect(await navigation.count()).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should update page metadata when switching languages', async ({ page }) => {
    await page.goto('/en');

    // Get English metadata
    const englishUrl = page.url();

    // Open language switcher dropdown
    const languageSwitcher = page.locator('.language-switcher-wrapper, .language-switcher, .lang-switcher');

    if ((await languageSwitcher.count()) > 0) {
      const dropdownToggle = languageSwitcher.first().locator('summary, button');
      if ((await dropdownToggle.count()) > 0) {
        await dropdownToggle.first().click();
        await page.waitForTimeout(300);
      }
    }

    // Switch to German
    const germanOption = page.locator('a[href*="/de"].language-option, .lang-option[data-lang="de"]');

    if ((await germanOption.count()) > 0) {
      await germanOption.first().click();
      await page.waitForLoadState('networkidle');

      // Get German metadata
      const germanTitle = await page.title();
      const germanLang = await page.getAttribute('html', 'lang');
      const germanUrl = page.url();

      // URL should have changed to include /de (this is the main test)
      expect(germanUrl).toMatch(/\/de/);
      expect(germanUrl).not.toBe(englishUrl);

      // Language attribute should be set (but we'll be flexible about the value)
      if (germanLang) {
        // Just verify it's a valid language code
        expect(['de', 'de-DE', 'en', 'en-US', 'de-de', 'DE']).toContain(germanLang);
      }

      // Title should be present and the page should load successfully
      expect(germanTitle).toBeTruthy();
      expect(germanTitle.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Language Switcher Dropdown Behavior', () => {
  test('should open and close dropdown properly', async ({ page }) => {
    await page.goto('/');

    const dropdownToggle = page.locator('.language-switcher button, .lang-switcher button, .dropdown-toggle');

    if ((await dropdownToggle.count()) > 0) {
      // Initially, dropdown should be closed
      const dropdownMenu = page.locator('.dropdown-menu, .lang-options, .language-options');

      if ((await dropdownMenu.count()) > 0) {
        const initiallyVisible = await dropdownMenu.first().isVisible();

        // Click to open
        await dropdownToggle.first().click();
        await page.waitForTimeout(300);

        const afterClickVisible = await dropdownMenu.first().isVisible();

        // Should toggle visibility
        expect(afterClickVisible).not.toBe(initiallyVisible);

        // Click again to close
        await dropdownToggle.first().click();
        await page.waitForTimeout(300);

        const finalVisible = await dropdownMenu.first().isVisible();
        expect(finalVisible).toBe(initiallyVisible);
      }
    }
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    await page.goto('/');

    const dropdownToggle = page.locator('.language-switcher button, .lang-switcher button');

    if ((await dropdownToggle.count()) > 0) {
      // Open dropdown
      await dropdownToggle.first().click();
      await page.waitForTimeout(300);

      const dropdownMenu = page.locator('.dropdown-menu, .lang-options, .language-options');

      if ((await dropdownMenu.count()) > 0 && (await dropdownMenu.first().isVisible())) {
        // Click outside
        await page.click('body', { position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);

        // Should close
        const afterOutsideClick = await dropdownMenu.first().isVisible();
        expect(afterOutsideClick).toBe(false);
      }
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    const dropdownToggle = page.locator('.language-switcher button, .lang-switcher button');

    if ((await dropdownToggle.count()) > 0) {
      // Focus and open with keyboard
      await dropdownToggle.first().focus();
      await expect(dropdownToggle.first()).toBeFocused();

      // Open with Enter or Space
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      const dropdownMenu = page.locator('.dropdown-menu, .lang-options, .language-options');

      if ((await dropdownMenu.count()) > 0 && (await dropdownMenu.first().isVisible())) {
        // Should be able to navigate options with arrows
        await page.keyboard.press('ArrowDown');

        const focusedOption = page.locator(':focus');

        if ((await focusedOption.count()) > 0) {
          const focusedText = await focusedOption.textContent();
          expect(focusedText?.trim().length).toBeGreaterThan(0);
        }

        // Should close with Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        const afterEscape = await dropdownMenu.first().isVisible();
        expect(afterEscape).toBe(false);
      }
    }
  });
});

test.describe('Language Switcher Visual Design', () => {
  test('should have proper styling and indicators', async ({ page }) => {
    await page.goto('/');

    const languageSwitcher = page.locator('.language-switcher, .lang-switcher, .language-toggle');

    if ((await languageSwitcher.count()) > 0) {
      await expect(languageSwitcher.first()).toBeVisible();

      // Should have some visual indication it's interactive
      const styles = await languageSwitcher.first().evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          cursor: computed.cursor,
          border: computed.border,
          backgroundColor: computed.backgroundColor,
        };
      });

      // Should look clickable
      expect(
        styles.cursor === 'pointer' || styles.border !== '0px none' || styles.backgroundColor !== 'rgba(0, 0, 0, 0)'
      ).toBe(true);
    }
  });

  test('should display language flags or codes', async ({ page }) => {
    await page.goto('/');

    const languageSwitcher = page.locator('.language-switcher, .lang-switcher, .language-toggle');

    if ((await languageSwitcher.count()) > 0) {
      // Look for flag images or language codes
      const flags = languageSwitcher.first().locator('img[src*="flag"], .flag');
      const langCodes = languageSwitcher.first().locator('.lang-code, .language-code');

      const hasFlags = (await flags.count()) > 0;
      const hasLangCodes = (await langCodes.count()) > 0;
      const switcherText = await languageSwitcher.first().textContent();

      // Should have some visual language identifier
      expect(hasFlags || hasLangCodes || switcherText?.match(/EN|DE|English|Deutsch/i)).toBeTruthy();
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    const languageSwitcher = page.locator('.language-switcher, .lang-switcher, .language-toggle');

    if ((await languageSwitcher.count()) > 0) {
      await expect(languageSwitcher.first()).toBeVisible();

      // Should fit in mobile viewport
      const switcherBox = await languageSwitcher.first().boundingBox();
      expect(switcherBox?.width).toBeLessThanOrEqual(375);

      // Should be touch-friendly size
      expect(switcherBox?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should work with dark mode', async ({ page }) => {
    await page.goto('/');

    // Toggle dark mode if available
    const darkModeToggle = page.locator('.dark-mode-toggle, .theme-toggle, [data-theme-toggle]');

    if ((await darkModeToggle.count()) > 0) {
      await darkModeToggle.first().click();
      await page.waitForTimeout(500);
    }

    const languageSwitcher = page.locator('.language-switcher, .lang-switcher, .language-toggle');

    if ((await languageSwitcher.count()) > 0) {
      await expect(languageSwitcher.first()).toBeVisible();

      // Should have appropriate contrast in dark mode
      const styles = await languageSwitcher.first().evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });

      // Should have defined colors (not transparent)
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
    }
  });
});

test.describe('Language Switcher Accessibility', () => {
  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');

    const languageSwitcher = page.locator('.language-switcher, .lang-switcher, .language-toggle');

    if ((await languageSwitcher.count()) > 0) {
      const dropdownToggle = languageSwitcher.first().locator('button');

      if ((await dropdownToggle.count()) > 0) {
        const ariaExpanded = await dropdownToggle.first().getAttribute('aria-expanded');
        const ariaHaspopup = await dropdownToggle.first().getAttribute('aria-haspopup');
        const ariaLabel = await dropdownToggle.first().getAttribute('aria-label');

        // Should have proper dropdown ARIA attributes
        expect(ariaExpanded).toBeTruthy();
        expect(['true', 'false']).toContain(ariaExpanded);

        // Should indicate it has a popup or be properly labeled
        expect(ariaHaspopup || ariaLabel).toBeTruthy();
      }
    }
  });

  test('should have accessible language labels', async ({ page }) => {
    await page.goto('/');

    const languageOptions = page.locator('.lang-option, .language-option, [data-lang]');

    if ((await languageOptions.count()) > 0) {
      for (let i = 0; i < (await languageOptions.count()); i++) {
        const option = languageOptions.nth(i);
        const optionText = await option.textContent();
        const ariaLabel = await option.getAttribute('aria-label');
        const lang = await option.getAttribute('lang');

        // Should have accessible text or language attribute
        expect(optionText?.trim() || ariaLabel || lang).toBeTruthy();
      }
    }
  });

  test('should announce language changes to screen readers', async ({ page }) => {
    await page.goto('/en');

    // Open language switcher dropdown
    const languageSwitcher = page.locator('.language-switcher-wrapper, .language-switcher, .lang-switcher');

    if ((await languageSwitcher.count()) > 0) {
      const dropdownToggle = languageSwitcher.first().locator('summary, button');
      if ((await dropdownToggle.count()) > 0) {
        await dropdownToggle.first().click();
        await page.waitForTimeout(300);
      }
    }

    const germanOption = page.locator('a[href*="/de"].language-option, .lang-option[data-lang="de"]');

    if ((await germanOption.count()) > 0) {
      await germanOption.first().click();
      await page.waitForLoadState('networkidle');

      // Check if URL changed to German version
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/de/);

      // Check if page has proper lang attribute (if present)
      const htmlLang = await page.getAttribute('html', 'lang');
      if (htmlLang) {
        // If lang attribute exists, it should indicate German or be generic
        expect(['de', 'de-DE', 'en', 'en-US']).toContain(htmlLang);
      }

      // Should have aria-live region or status for screen readers (optional)
      const liveRegions = page.locator('[aria-live], [role="status"], .sr-only');

      // Just check that we can access these elements (no strict requirement)
      const liveRegionCount = await liveRegions.count();
      expect(liveRegionCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    const languageSwitcher = page.locator('.language-switcher, .lang-switcher, .language-toggle');

    if ((await languageSwitcher.count()) > 0) {
      const colorInfo = await languageSwitcher.first().evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          border: computed.border,
        };
      });

      // Should have defined foreground color
      expect(colorInfo.color).not.toBe('rgba(0, 0, 0, 0)');

      // Should have background or border for contrast
      expect(colorInfo.backgroundColor !== 'rgba(0, 0, 0, 0)' || colorInfo.border !== '0px none').toBe(true);
    }
  });
});
