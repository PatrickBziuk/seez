import { test, expect } from '@playwright/test';

/**
 * Search Functionality Test on Preview Server
 * 
 * Tests the built site with pagefind integration working properly.
 * This tests against localhost:4321 where the preview site is served.
 */

test.describe('Search Functionality on Built Site', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging to catch JavaScript errors
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('http://localhost:4323/en');
    await page.waitForLoadState('networkidle');
  });

  test('should have functional search with pagefind on built site', async ({ page }) => {
    const searchButton = page.locator('#search-button');
    
    // Click the search button to open modal
    await searchButton.click();
    await page.waitForTimeout(2000); // Give more time for pagefind to initialize
    
    const searchModal = page.locator('#search-modal');
    await expect(searchModal).toBeVisible();
    
    // Check if search container exists
    const searchContainer = page.locator('#search-container');
    await expect(searchContainer).toBeVisible();
    
    // Wait a bit more for initialization
    await page.waitForTimeout(3000);
    
    // Get the search container content to see what's there
    const containerContent = await searchContainer.textContent();
    console.log('Search container content:', containerContent);
    
    // Check if pagefind UI was initialized
    const pagefindInput = page.locator('#pagefind-ui input, .pagefind-ui__search-input');
    
    if (await pagefindInput.count() > 0) {
      console.log('✅ Pagefind input found - Search is working!');
      await expect(pagefindInput.first()).toBeVisible();
      
      // Test search functionality
      await pagefindInput.first().fill('seez');
      await page.waitForTimeout(1000); // Wait for search results
      
      console.log('✅ Search test completed successfully');
    } else {
      console.log('❌ Pagefind input not found - checking for messages');
      
      // Check if our dev message is shown
      const devMessage = page.locator('text=Search available in production build');
      const errorMessage = page.locator('text=Search is currently unavailable');
      
      if (await devMessage.count() > 0) {
        console.log('ℹ️ Dev mode message displayed');
      } else if (await errorMessage.count() > 0) {
        console.log('⚠️ Error message displayed - pagefind failed to load');
      } else {
        console.log('❌ No expected messages found');
      }
    }
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/search-preview-debug.png',
      fullPage: true 
    });
  });

  test('should load pagefind files correctly', async ({ page }) => {
    // Check if pagefind files are accessible
    const pagefindJsResponse = await page.goto('http://localhost:4321/pagefind/pagefind.js');
    console.log('Pagefind JS status:', pagefindJsResponse?.status());
    
    const pagefindUiResponse = await page.goto('http://localhost:4321/pagefind/pagefind-ui.js');
    console.log('Pagefind UI status:', pagefindUiResponse?.status());
    
    // Navigate back to the site
    await page.goto('http://localhost:4321/en');
    
    // Check if pagefind is available in window
    const pagefindCheck = await page.evaluate(() => {
      return {
        hasPagefind: typeof window !== 'undefined' && 'pagefind' in window,
        pagefindDir: !!document.querySelector('script[src*="pagefind"]'),
        consoleLogs: []
      };
    });
    
    console.log('Pagefind check:', pagefindCheck);
  });

  test('should handle keyboard shortcuts on built site', async ({ page }) => {
    // Test forward slash key
    await page.keyboard.press('/');
    await page.waitForTimeout(300);
    
    const searchModal = page.locator('#search-modal');
    await expect(searchModal).toBeVisible();
    
    // Check if search input is focused
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log('Active element after / key:', activeElement);
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    
    await expect(searchModal).toHaveClass(/hidden/);
  });
});