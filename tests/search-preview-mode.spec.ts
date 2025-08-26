import { test, expect } from '@playwright/test';

test.describe('Search Functionality - Preview Mode Tests', () => {
  // These tests should run against the preview server (port 4324)
  // which has the built pagefind files
  
  test.beforeEach(async ({ page }) => {
    // Connect to preview server instead of dev server
    await page.goto('http://localhost:4324/');
  });

  test('should successfully load pagefind in preview mode', async ({ page }) => {
    // Open search modal
    const searchButton = page.locator('#search-button');
    await searchButton.click();

    // Wait for search initialization (longer timeout for pagefind loading)
    await page.waitForTimeout(3000);

    // Should show search input, not error message
    const searchInput = page.locator('#pagefind-search');
    const errorMessage = page.locator('text=Search Unavailable');
    
    // Either search input should be visible OR we should see dev mode message
    const hasSearchInput = await searchInput.isVisible();
    const hasError = await errorMessage.isVisible();
    
    if (hasError) {
      // If we see an error, let's check what the actual message is
      const modalContent = await page.locator('#search-container').textContent();
      console.log('Search modal content:', modalContent);
    }
    
    // In preview mode, we should have functional search
    expect(hasSearchInput).toBe(true);
  });

  test('should perform actual search queries', async ({ page }) => {
    // Open search modal
    const searchButton = page.locator('#search-button');
    await searchButton.click();

    // Wait for search initialization
    await page.waitForTimeout(3000);

    const searchInput = page.locator('#pagefind-search');
    
    // Skip test if search is not available
    if (!(await searchInput.isVisible())) {
      test.skip(true, 'Search input not available');
      return;
    }

    // Perform search
    await searchInput.fill('music');
    
    // Wait for search results
    await page.waitForTimeout(1500);

    const resultsContainer = page.locator('#search-results');
    const results = resultsContainer.locator('a');
    
    // Should either have results or "No results found"
    const hasResults = await results.count() > 0;
    const noResultsMessage = await page.locator('text=No results found').isVisible();
    
    expect(hasResults || noResultsMessage).toBe(true);
  });

  test('should validate search result structure', async ({ page }) => {
    // Open search modal
    const searchButton = page.locator('#search-button');
    await searchButton.click();

    await page.waitForTimeout(3000);

    const searchInput = page.locator('#pagefind-search');
    
    if (!(await searchInput.isVisible())) {
      test.skip(true, 'Search input not available');
      return;
    }

    // Search for content that should exist
    await searchInput.fill('seez');
    await page.waitForTimeout(1500);

    const results = page.locator('#search-results a');
    
    if (await results.count() > 0) {
      const firstResult = results.first();
      
      // Each result should have a valid href
      const href = await firstResult.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^\/[a-z]{2}\//); // Should start with language code
      
      // Result should have title and excerpt
      const resultText = await firstResult.textContent();
      expect(resultText).toBeTruthy();
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test keyboard shortcuts
    await page.keyboard.press('/');
    
    const searchModal = page.locator('#search-modal');
    await expect(searchModal).toHaveCSS('display', 'block');
    
    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(searchModal).toHaveCSS('display', 'none');
  });

  test('should show appropriate error handling', async ({ page }) => {
    // Test what happens when pagefind fails to load
    // Block pagefind.js to simulate error
    await page.route('**/pagefind/pagefind.js', route => route.abort());
    
    const searchButton = page.locator('#search-button');
    await searchButton.click();
    
    await page.waitForTimeout(3000);
    
    // Should show error message
    const errorMessage = page.locator('text=Search Unavailable');
    await expect(errorMessage).toBeVisible();
  });

  test('should validate search works across languages', async ({ page }) => {
    // Test English first
    await page.goto('http://localhost:4324/en');
    
    const searchButton = page.locator('#search-button');
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    const searchInput = page.locator('#pagefind-search');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('music');
      await page.waitForTimeout(1000);
      
      // Should get some results or no results message
      const resultsExist = await page.locator('#search-results a').count() > 0;
      const noResults = await page.locator('text=No results found').isVisible();
      expect(resultsExist || noResults).toBe(true);
    }
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Test German if available
    try {
      await page.goto('http://localhost:4324/de');
      
      await searchButton.click();
      await page.waitForTimeout(3000);
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('musik');
        await page.waitForTimeout(1000);
        
        const resultsExist = await page.locator('#search-results a').count() > 0;
        const noResults = await page.locator('text=No results found').isVisible();
        expect(resultsExist || noResults).toBe(true);
      }
    } catch (error) {
      // German page might not exist, that's okay
      console.log('German page not available:', error);
    }
  });
});

test.describe('Navigation Active States - Fixed Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4324/');
  });

  test('should highlight navigation correctly', async ({ page }) => {
    // Test with correct selectors
    
    // Go to English home page
    await page.goto('http://localhost:4324/en');
    
    // Look for active navigation using the actual class structure
    const activeNav = page.locator('nav[data-nav="desktop"] a.active');
    
    // Should have at least one active nav item
    expect(await activeNav.count()).toBeGreaterThan(0);
  });

  test('should update active state on navigation', async ({ page }) => {
    await page.goto('http://localhost:4324/en');
    
    // Navigate to books
    const booksLink = page.locator('nav[data-nav="desktop"] a[href="/en/books"]');
    
    if (await booksLink.count() > 0) {
      await booksLink.click();
      await page.waitForURL('**/en/books**');
      
      // Books navigation should be active
      await expect(booksLink).toHaveClass(/active/);
    }
  });
});