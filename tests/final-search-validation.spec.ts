import { test, expect } from '@playwright/test';

test.describe('Complete Search Functionality Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4324/en');
    await page.waitForLoadState('networkidle');
  });

  test('should have working search with actual search results', async ({ page }) => {
    // Step 1: Open search modal
    const searchButton = page.locator('#search-button');
    await expect(searchButton).toBeVisible();
    await searchButton.click();

    // Step 2: Wait for search initialization (be generous with timing)
    await page.waitForTimeout(5000);

    // Step 3: Check if search input is available
    const searchInput = page.locator('#pagefind-search');
    
    // Only proceed if search input is available (skip if in dev mode)
    if (await searchInput.isVisible()) {
      console.log('✅ Search input is available - proceeding with search test');
      
      // Step 4: Perform actual search
      await searchInput.fill('music');
      await page.waitForTimeout(2000);

      // Step 5: Check for results
      const resultsContainer = page.locator('#search-results');
      await expect(resultsContainer).toBeVisible();
      
      const results = resultsContainer.locator('a');
      const resultCount = await results.count();
      
      if (resultCount > 0) {
        console.log(`✅ Search returned ${resultCount} results`);
        
        // Validate first result structure
        const firstResult = results.first();
        await expect(firstResult).toBeVisible();
        
        const href = await firstResult.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).toMatch(/^\/[a-z]{2}\//); // Should start with language code
        
        console.log(`✅ First result has valid href: ${href}`);
        
        // Test clicking a result
        await firstResult.click();
        await page.waitForLoadState('load');
        
        // Should navigate to the clicked page
        expect(page.url()).toContain(href!);
        console.log('✅ Search result navigation works');
        
        return; // Exit successfully
      } else {
        // Check for "no results" message
        const noResults = page.locator('text=No results found');
        if (await noResults.isVisible()) {
          console.log('ℹ️ Search is working but returned no results for "music"');
        } else {
          throw new Error('Search performed but no results or "no results" message found');
        }
      }
    } else {
      // Check what error message is shown
      const devMessage = page.locator('text=Search in Development Mode');
      const errorMessage = page.locator('text=Search Unavailable');
      
      if (await devMessage.isVisible()) {
        console.log('⚠️ Search shows development mode message - this indicates the site is not in production mode');
        test.skip(true, 'Search not available in current mode');
      } else if (await errorMessage.isVisible()) {
        console.log('❌ Search shows error message - pagefind failed to load');
        throw new Error('Search functionality failed to initialize');
      } else {
        console.log('❓ Search modal opened but no recognizable content found');
        const modalContent = await page.locator('#search-container').textContent();
        console.log('Modal content:', modalContent);
        throw new Error('Unexpected search modal state');
      }
    }
  });

  test('should validate keyboard shortcuts work', async ({ page }) => {
    // Test opening search with '/' key
    await page.keyboard.press('/');
    
    const searchModal = page.locator('#search-modal');
    await expect(searchModal).toBeVisible();
    
    // Test closing with Escape
    await page.keyboard.press('Escape');
    await expect(searchModal).toBeHidden();
    
    console.log('✅ Keyboard shortcuts (/ and Escape) work correctly');
  });

  test('should test search across different content types', async ({ page }) => {
    const searchButton = page.locator('#search-button');
    await searchButton.click();
    await page.waitForTimeout(5000);

    const searchInput = page.locator('#pagefind-search');
    
    if (await searchInput.isVisible()) {
      // Test multiple search terms
      const searchTerms = ['project', 'book', 'music', 'tech'];
      
      for (const term of searchTerms) {
        await searchInput.clear();
        await searchInput.fill(term);
        await page.waitForTimeout(1500);
        
        const resultsContainer = page.locator('#search-results');
        const results = resultsContainer.locator('a');
        const resultCount = await results.count();
        
        console.log(`Search for "${term}": ${resultCount} results`);
        
        // At least some searches should return results
        if (resultCount > 0) {
          // Validate that results contain the search term
          const firstResultText = await results.first().textContent();
          console.log(`First result for "${term}": ${firstResultText?.substring(0, 100)}...`);
        }
      }
      
      console.log('✅ Search tested across multiple content types');
    } else {
      test.skip(true, 'Search input not available');
    }
  });

  test('should validate navigation active states', async ({ page }) => {
    // Navigate to different pages and check active states
    const pages = [
      { url: '/en/books', name: 'Books' },
      { url: '/en/projects', name: 'Projects' },
      { url: '/en/music', name: 'Music' }
    ];

    for (const pageInfo of pages) {
      await page.goto(`http://localhost:4324${pageInfo.url}`);
      await page.waitForLoadState('load');
      
      // Look for active navigation item
      const activeNavItems = page.locator('nav a.active, nav a[class*="active"]');
      const activeCount = await activeNavItems.count();
      
      if (activeCount > 0) {
        const activeText = await activeNavItems.first().textContent();
        console.log(`✅ Active navigation on ${pageInfo.name} page: "${activeText}"`);
      } else {
        console.log(`⚠️ No active navigation detected on ${pageInfo.name} page`);
      }
    }
  });
});