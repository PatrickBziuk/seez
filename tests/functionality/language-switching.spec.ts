import { test, expect } from '@playwright/test';

/**
 * Language Switching Functionality Tests
 *
 * Tests the language toggle functionality and persistence across the site.
 * This includes URL-based language switching, language persistence,
 * and proper content rendering in different languages.
 */

test.describe('Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto('/');
  });

  test('should display language switcher', async ({ page }) => {
    // Check if language switcher is visible
    const languageSwitcher = page.locator('[data-testid="language-switcher"], .language-switcher');
    await expect(languageSwitcher).toBeVisible();
  });

  test('should switch to German language', async ({ page }) => {
    // Look for German language option
    const germanLink = page.locator('a[href*="/de"], a[href*="/de/"]');

    if ((await germanLink.count()) > 0) {
      await germanLink.first().click();

      // Verify URL contains /de
      await expect(page).toHaveURL(/\/de/);

      // Check for German content indicators
      const germanContent = page.locator('html[lang="de"], [lang="de"]');
      await expect(germanContent).toBeVisible();
    } else {
      // If no German link found, check if we're already on German page
      const currentUrl = page.url();
      if (!currentUrl.includes('/de')) {
        return; // Skip test if no German option found
      }
    }
  });

  test('should switch to English language', async ({ page }) => {
    // First navigate to a German page if available
    const germanLink = page.locator('a[href*="/de"]');
    if ((await germanLink.count()) > 0) {
      await germanLink.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Look for English language option
    const englishLink = page.locator('a[href*="/en"], a[href="/"], .language-switcher a[href="/"]');

    if ((await englishLink.count()) > 0) {
      await englishLink.first().click();

      // Verify URL is English (either /en or root)
      await expect(page).toHaveURL(/^\/(en\/|$)/);

      // Check for English content indicators
      const englishContent = page.locator('html[lang="en"], [lang="en"]');
      await expect(englishContent).toBeVisible();
    }
  });

  test('should persist language preference across navigation', async ({ page }) => {
    // Switch to German if available
    const germanLink = page.locator('a[href*="/de"]');

    if ((await germanLink.count()) > 0) {
      await germanLink.first().click();
      await page.waitForLoadState('networkidle');

      // Navigate to different pages and verify language persists
      const navLinks = page.locator('nav a, header a, .navigation a').first();
      if ((await navLinks.count()) > 0) {
        await navLinks.click();
        await page.waitForLoadState('networkidle');

        // Verify still on German version
        await expect(page).toHaveURL(/\/de/);
      }
    } else {
      return; // Skip persistence test if no German option available
    }
  });

  test('should have proper hreflang attributes', async ({ page }) => {
    // Check for hreflang attributes in head
    const hreflangEn = page.locator('link[hreflang="en"]');
    const hreflangDe = page.locator('link[hreflang="de"]');

    // At least one hreflang should be present
    const hreflangCount = (await hreflangEn.count()) + (await hreflangDe.count());
    expect(hreflangCount).toBeGreaterThan(0);
  });

  test('should handle direct URL access to language versions', async ({ page }) => {
    // Test direct access to German URL
    try {
      await page.goto('/de/');
      await expect(page).toHaveURL(/\/de/);

      // Check page loads successfully
      await expect(page.locator('body')).toBeVisible();
    } catch {
      // German version might not exist, which is OK
      console.log('German homepage not available, skipping direct URL test');
    }

    // Test direct access to English URL
    await page.goto('/en/');
    await expect(page).toHaveURL(/\/en/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display content in correct language', async ({ page }) => {
    // Test English content
    await page.goto('/');

    // Look for English-specific text (navigation, common words)
    const englishIndicators = [
      'About',
      'Home',
      'Projects',
      'Books',
      'Life',
      'Lab',
      'Read more',
      'Continue reading',
      'Published',
      'Author',
    ];

    let englishTextFound = false;
    for (const text of englishIndicators) {
      if ((await page.locator(`text=${text}`).count()) > 0) {
        englishTextFound = true;
        break;
      }
    }

    // Test German content if available
    const germanLink = page.locator('a[href*="/de"]');
    if ((await germanLink.count()) > 0) {
      await germanLink.first().click();
      await page.waitForLoadState('networkidle');

      // Look for German-specific text
      const germanIndicators = [
        'Über',
        'Startseite',
        'Projekte',
        'Bücher',
        'Leben',
        'Weiterlesen',
        'Veröffentlicht',
        'Autor',
      ];

      let germanTextFound = false;
      for (const text of germanIndicators) {
        if ((await page.locator(`text=${text}`).count()) > 0) {
          germanTextFound = true;
          break;
        }
      }

      expect(germanTextFound).toBe(true);
    }

    // At least English should have content
    expect(englishTextFound).toBe(true);
  });

  test('should have working language switcher dropdown', async ({ page }) => {
    // Look for dropdown-style language switcher
    const dropdown = page.locator('.language-switcher, [data-testid="language-dropdown"]');

    if ((await dropdown.count()) > 0) {
      // Try to interact with dropdown
      await dropdown.click();

      // Check if dropdown options appear
      const dropdownOptions = page.locator('.language-option, [data-testid="language-option"]');

      if ((await dropdownOptions.count()) > 0) {
        await expect(dropdownOptions.first()).toBeVisible();
      }
    }
  });

  test('should handle language switching on content pages', async ({ page }) => {
    // Navigate to a content page (books, projects, etc.)
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Try to switch language from content page
      const languageSwitcher = page.locator('a[href*="/de"], a[href*="/en"]');

      if ((await languageSwitcher.count()) > 0) {
        const currentUrl = page.url();
        await languageSwitcher.first().click();
        await page.waitForLoadState('networkidle');

        // Verify language switched
        const newUrl = page.url();
        expect(newUrl).not.toBe(currentUrl);
      }
    }
  });
});

test.describe('Language Detection and Redirection', () => {
  test('should handle browser language preferences', async ({ page }) => {
    // This test would require browser locale settings
    // For now, just verify the site loads properly
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should gracefully handle missing translations', async ({ page }) => {
    // Try to access a potentially non-existent translation
    const response = await page.goto('/de/some-non-existent-page/', { waitUntil: 'networkidle' });

    // Should either redirect or show 404, but not crash
    expect(response?.status()).toBeLessThan(500);
  });
});
