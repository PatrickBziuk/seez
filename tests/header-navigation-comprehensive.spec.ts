import { test, expect } from '@playwright/test';

test.describe('Header Navigation and Search - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the homepage
    await page.goto('/');
  });

  test.describe('Navigation Active States', () => {
    test('should highlight active navigation links correctly', async ({ page }) => {
      // Test home page
      const homeNav = page.locator('nav[data-nav="desktop"] a[href="/en"]');
      await expect(homeNav).toHaveClass(/active/);

      // Navigate to projects and check active state
      await page.click('nav[data-nav="desktop"] a[href="/en/projects"]');
      await page.waitForURL('**/en/projects**');
      
      const projectsNav = page.locator('nav[data-nav="desktop"] a[href="/en/projects"]');
      await expect(projectsNav).toHaveClass(/active/);
    });

    test('should maintain active state on sub-pages', async ({ page }) => {
      // Navigate to books section
      await page.goto('/en/books');
      const booksNav = page.locator('nav[data-nav="desktop"] a[href="/en/books"]');
      await expect(booksNav).toHaveClass(/active/);

      // Navigate to a specific book (if it exists)
      const bookLink = page.locator('a[href*="/en/books/"]').first();
      if (await bookLink.count() > 0) {
        await bookLink.click();
        // Books nav should still be active
        await expect(booksNav).toHaveClass(/active/);
      }
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should open and close mobile navigation', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const toggleButton = page.locator('[data-aw-toggle-menu]');
      const mobileNav = page.locator('#mobile-navigation');

      // Should be hidden initially
      await expect(mobileNav).toHaveClass(/hidden/);

      // Open mobile nav
      await toggleButton.click();
      await expect(mobileNav).not.toHaveClass(/hidden/);
      await expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

      // Close mobile nav
      await toggleButton.click();
      await expect(mobileNav).toHaveClass(/hidden/);
      await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('should close mobile nav when clicking outside', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const toggleButton = page.locator('[data-aw-toggle-menu]');
      const mobileNav = page.locator('#mobile-navigation');

      // Open mobile nav
      await toggleButton.click();
      await expect(mobileNav).not.toHaveClass(/hidden/);

      // Click outside
      await page.click('body', { position: { x: 10, y: 10 } });
      await expect(mobileNav).toHaveClass(/hidden/);
    });
  });

  test.describe('Search Modal - Preview Mode', () => {
    test('should open search modal with search button', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      const searchModal = page.locator('#search-modal');

      await expect(searchModal).toHaveCSS('display', 'none');
      
      await searchButton.click();
      await expect(searchModal).toHaveCSS('display', 'block');
      await expect(searchModal).not.toHaveClass(/hidden/);
    });

    test('should close search modal with close button', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      const searchModal = page.locator('#search-modal');
      const closeButton = page.locator('#search-close');

      // Open modal
      await searchButton.click();
      await expect(searchModal).toHaveCSS('display', 'block');

      // Close modal
      await closeButton.click();
      await expect(searchModal).toHaveCSS('display', 'none');
    });

    test('should open search modal with keyboard shortcut', async ({ page }) => {
      const searchModal = page.locator('#search-modal');

      await expect(searchModal).toHaveCSS('display', 'none');
      
      // Press / key
      await page.keyboard.press('/');
      await expect(searchModal).toHaveCSS('display', 'block');
    });

    test('should close search modal with Escape key', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      const searchModal = page.locator('#search-modal');

      // Open modal
      await searchButton.click();
      await expect(searchModal).toHaveCSS('display', 'block');

      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(searchModal).toHaveCSS('display', 'none');
    });

    test('should close search modal when clicking outside', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      const searchModal = page.locator('#search-modal');

      // Open modal
      await searchButton.click();
      await expect(searchModal).toHaveCSS('display', 'block');

      // Click on the backdrop
      await searchModal.click({ position: { x: 10, y: 10 } });
      await expect(searchModal).toHaveCSS('display', 'none');
    });
  });

  test.describe('Search Functionality - Actual Search Tests', () => {
    test('should initialize pagefind and show search interface', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      await searchButton.click();

      // Wait for search initialization
      await page.waitForTimeout(2000);

      // Check for search input
      const searchInput = page.locator('#pagefind-search');
      await expect(searchInput).toBeVisible();
      
      // Search input should have focus
      await expect(searchInput).toBeFocused();
    });

    test('should perform search and return results', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      await searchButton.click();

      // Wait for search initialization
      await page.waitForTimeout(2000);

      const searchInput = page.locator('#pagefind-search');
      const resultsContainer = page.locator('#search-results');

      // Perform a search for common content
      await searchInput.fill('music');
      
      // Wait for search results
      await page.waitForTimeout(1000);

      // Should show search results
      const results = resultsContainer.locator('div').first();
      await expect(results).toBeVisible();
      
      // Should not show "No results found"
      await expect(page.locator('text=No results found')).not.toBeVisible();
    });

    test('should handle search with multiple terms', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      await searchButton.click();

      await page.waitForTimeout(2000);

      const searchInput = page.locator('#pagefind-search');
      const resultsContainer = page.locator('#search-results');

      // Search for multiple terms
      await searchInput.fill('project development');
      await page.waitForTimeout(1000);

      // Should show results or "No results found"
      const hasResults = await resultsContainer.locator('a').count() > 0;
      const hasNoResults = await page.locator('text=No results found').isVisible();
      
      expect(hasResults || hasNoResults).toBe(true);
    });

    test('should show appropriate message for short queries', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      await searchButton.click();

      await page.waitForTimeout(2000);

      const searchInput = page.locator('#pagefind-search');
      
      // Type a single character
      await searchInput.fill('a');
      await page.waitForTimeout(500);

      // Should show "Type at least 2 characters to search..."
      await expect(page.locator('text=Type at least 2 characters to search')).toBeVisible();
    });

    test('should handle empty search results gracefully', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      await searchButton.click();

      await page.waitForTimeout(2000);

      const searchInput = page.locator('#pagefind-search');
      
      // Search for something that definitely doesn't exist
      await searchInput.fill('xyzzyx123nonexistent');
      await page.waitForTimeout(1000);

      // Should show "No results found"
      await expect(page.locator('text=No results found')).toBeVisible();
    });

    test('should navigate to results when clicked', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      await searchButton.click();

      await page.waitForTimeout(2000);

      const searchInput = page.locator('#pagefind-search');
      
      // Perform a search that should return results
      await searchInput.fill('music');
      await page.waitForTimeout(1000);

      // Click on first result if it exists
      const firstResult = page.locator('#search-results a').first();
      
      if (await firstResult.count() > 0) {
        const href = await firstResult.getAttribute('href');
        await firstResult.click();
        
        // Should navigate to the result page
        await page.waitForURL(`**${href}`);
        
        // Search modal should be closed
        const searchModal = page.locator('#search-modal');
        await expect(searchModal).toHaveCSS('display', 'none');
      }
    });
  });

  test.describe('Search - Error Handling', () => {
    test('should handle pagefind loading errors gracefully', async ({ page }) => {
      // Block pagefind.js to simulate loading error
      await page.route('**/pagefind/pagefind.js', route => route.abort());

      const searchButton = page.locator('#search-button');
      await searchButton.click();

      // Wait for error handling
      await page.waitForTimeout(3000);

      // Should show error message or development mode message
      const hasErrorMessage = await page.locator('text=Search Unavailable').isVisible();
      const hasDevMessage = await page.locator('text=Search in Development Mode').isVisible();
      
      expect(hasErrorMessage || hasDevMessage).toBe(true);
    });
  });

  test.describe('Language Switching', () => {
    test('should maintain search functionality across languages', async ({ page }) => {
      // Test search in English
      await page.goto('/en');
      
      let searchButton = page.locator('#search-button');
      await searchButton.click();
      await page.waitForTimeout(2000);
      
      let searchInput = page.locator('#pagefind-search');
      await expect(searchInput).toBeVisible();
      
      // Close search modal
      await page.keyboard.press('Escape');
      
      // Switch to German if available
      const languageSwitcher = page.locator('[data-testid="language-switcher"]');
      if (await languageSwitcher.count() > 0) {
        await languageSwitcher.click();
        const germanLink = page.locator('a[href="/de"]');
        if (await germanLink.count() > 0) {
          await germanLink.click();
          await page.waitForURL('**/de**');
          
          // Test search in German
          searchButton = page.locator('#search-button');
          await searchButton.click();
          await page.waitForTimeout(2000);
          
          searchInput = page.locator('#pagefind-search');
          await expect(searchInput).toBeVisible();
        }
      }
    });
  });

  test.describe('Search Performance', () => {
    test('should load search quickly', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      
      const startTime = Date.now();
      await searchButton.click();
      
      // Wait for search input to appear
      await page.locator('#pagefind-search').waitFor({ timeout: 5000 });
      const loadTime = Date.now() - startTime;
      
      // Should load in less than 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should debounce search queries', async ({ page }) => {
      const searchButton = page.locator('#search-button');
      await searchButton.click();
      await page.waitForTimeout(2000);

      const searchInput = page.locator('#pagefind-search');
      
      // Type quickly
      await searchInput.type('test', { delay: 50 });
      
      // Should show "Searching..." temporarily
      const searching = page.locator('text=Searching...');
      
      // Wait for debounce and result
      await page.waitForTimeout(500);
      
      // Should not be stuck on "Searching..."
      await expect(searching).not.toBeVisible();
    });
  });
});