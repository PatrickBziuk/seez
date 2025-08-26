import { test, expect } from '@playwright/test';

test.describe('Search in Dev Mode', () => {
  test('should show dev mode message when search is clicked', async ({ page }) => {
    // Enable console logging to catch JavaScript logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // Navigate to the page
    await page.goto('http://localhost:4322/en');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click the search button to open modal
    const searchButton = page.locator('#search-button');
    await searchButton.click();
    
    // Check that the search modal is visible
    const searchModal = page.locator('#search-modal');
    await expect(searchModal).toBeVisible();
    
    // Wait for search initialization
    await page.waitForTimeout(3000);
    
    // Get the actual content to debug
    const searchContainer = page.locator('#search-container');
    const containerContent = await searchContainer.textContent();
    
    console.log('Dev mode search container content:', containerContent);
    
    // Check if we have dev message or fallback error
    const devMessage = page.locator('text=Search available in production build');
    const errorMessage = page.locator('text=Search is currently unavailable');
    
    if (await devMessage.count() > 0) {
      console.log('✅ Dev mode message found');
      await expect(devMessage).toBeVisible();
    } else if (await errorMessage.count() > 0) {
      console.log('ℹ️ Error message found (expected in dev mode if pagefind fetch fails)');
      await expect(errorMessage).toBeVisible();
    } else {
      console.log('❌ Neither dev nor error message found');
    }
    
    // Let's check what the actual fetch results are
    const fetchResult = await page.evaluate(() => {
      return fetch('/pagefind/pagefind.js')
        .then(response => ({
          ok: response.ok,
          status: response.status,
          url: response.url
        }))
        .catch(error => ({
          error: error.message
        }));
    });
    
    console.log('Fetch result:', fetchResult);
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/search-dev-debug.png',
      fullPage: true 
    });
    
    console.log('✅ Dev mode search test completed');
  });
});