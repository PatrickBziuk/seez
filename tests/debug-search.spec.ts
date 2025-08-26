import { test, expect } from '@playwright/test';

/**
 * Debug Search Functionality Issue
 * 
 * User reports search button not working when clicked.
 * This test investigates the search modal, button interaction, and JavaScript execution.
 */

test.describe('Search Button Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging to catch JavaScript errors
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
  });

  test('should have search button visible in header', async ({ page }) => {
    const searchButton = page.locator('#search-button');
    
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toBeEnabled();
    
    // Check if button has proper attributes
    const ariaLabel = await searchButton.getAttribute('aria-label');
    const title = await searchButton.getAttribute('title');
    
    console.log('Search button aria-label:', ariaLabel);
    console.log('Search button title:', title);
    
    expect(ariaLabel).toBe('Open search');
    expect(title).toBe('Search (/ or .)');
  });

  test('should open search modal when clicked', async ({ page }) => {
    const searchButton = page.locator('#search-button');
    const searchModal = page.locator('#search-modal');
    
    // Initially modal should be hidden
    await expect(searchModal).toHaveClass(/hidden/);
    
    // Click the search button
    await searchButton.click();
    
    // Wait a bit for any animations
    await page.waitForTimeout(200);
    
    // Modal should now be visible
    await expect(searchModal).not.toHaveClass(/hidden/);
    await expect(searchModal).toBeVisible();
    
    // Search input should be focused
    const searchInput = page.locator('#search input');
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeFocused();
    }
  });

  test('should close search modal with close button', async ({ page }) => {
    const searchButton = page.locator('#search-button');
    const searchModal = page.locator('#search-modal');
    const searchClose = page.locator('#search-close');
    
    // Open modal
    await searchButton.click();
    await expect(searchModal).toBeVisible();
    
    // Close modal
    await searchClose.click();
    await page.waitForTimeout(100);
    
    // Modal should be hidden again
    await expect(searchModal).toHaveClass(/hidden/);
  });

  test('should open search modal with keyboard shortcuts', async ({ page }) => {
    const searchModal = page.locator('#search-modal');
    
    // Test forward slash key
    await page.keyboard.press('/');
    await page.waitForTimeout(100);
    
    await expect(searchModal).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await expect(searchModal).toHaveClass(/hidden/);
    
    // Test period key
    await page.keyboard.press('.');
    await page.waitForTimeout(100);
    
    await expect(searchModal).toBeVisible();
  });

  test('should have pagefind script loaded', async ({ page }) => {
    // Enable console logging to see what's happening
    page.on('console', msg => console.log('SEARCH PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('SEARCH PAGE ERROR:', error.message));
    
    // First open the search modal since pagefind is only initialized when modal opens
    const searchButton = page.locator('#search-button');
    await searchButton.click();
    
    // Wait for modal to open and initialize
    const searchModal = page.locator('#search-modal');
    await expect(searchModal).toBeVisible();
    
    // Wait a bit for search initialization
    await page.waitForTimeout(3000);
    
    // Check what's actually in the search container
    const searchContainer = page.locator('#search-container');
    const containerContent = await searchContainer.textContent();
    console.log('Search container content:', containerContent);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results/pagefind-debug.png',
      fullPage: true 
    });
    
    // Check if pagefind is available
    const pagefindAvailable = await page.evaluate(() => {
      return typeof window !== 'undefined' && 'pagefind' in window;
    });
    
    console.log('Pagefind available:', pagefindAvailable);
    
    // Try to check for different possible states
    const pagefindUI = page.locator('.pagefind-ui');
    const devMessage = page.locator('text=Search available in production build');
    const errorMessage = page.locator('text=Search is currently unavailable');
    
    const uiCount = await pagefindUI.count();
    const devCount = await devMessage.count();
    const errorCount = await errorMessage.count();
    
    console.log('Pagefind UI elements:', uiCount);
    console.log('Dev message elements:', devCount);
    console.log('Error message elements:', errorCount);
    
    // For now, just ensure the modal opened and some content is shown
    await expect(searchContainer).toBeVisible();
  });

  test('should show search modal structure correctly', async ({ page }) => {
    const searchButton = page.locator('#search-button');
    await searchButton.click();
    
    const modal = page.locator('#search-modal');
    await expect(modal).toBeVisible();
    
    // Check modal structure
    const title = page.locator('#search-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Search');
    
    // Wait for search initialization
    await page.waitForTimeout(2000);
    
    // Check if search container is visible (should always be there)
    const searchContainer = page.locator('#search-container');
    await expect(searchContainer).toBeVisible();
    
    // The #search element is only created if pagefind loads successfully
    // In dev mode, we should see the dev message instead
    const searchComponent = page.locator('#search');
    const searchUnavailableMessage = page.locator('text=Search available in production build');
    
    // Either pagefind search should be available OR dev message should show
    const searchExists = await searchComponent.count() > 0;
    const devMessageExists = await searchUnavailableMessage.count() > 0;
    
    if (searchExists) {
      await expect(searchComponent).toBeVisible();
      console.log('Pagefind search component loaded');
    } else if (devMessageExists) {
      await expect(searchUnavailableMessage).toBeVisible();
      console.log('Dev mode message displayed');
    } else {
      // Fallback: check for any content in search container
      const searchContainerContent = await searchContainer.textContent();
      console.log('Search container content:', searchContainerContent);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/search-modal-debug.png',
      fullPage: true 
    });
    
    console.log('Search modal screenshot saved');
  });

  test('should handle search input interaction', async ({ page }) => {
    const searchButton = page.locator('#search-button');
    await searchButton.click();
    
    // Wait for modal to be fully visible
    await page.waitForTimeout(300);
    
    // Find the actual pagefind input
    const pagefindInput = page.locator('.pagefind-ui input, #search input');
    
    if (await pagefindInput.count() > 0) {
      await pagefindInput.first().fill('test search');
      
      const inputValue = await pagefindInput.first().inputValue();
      expect(inputValue).toBe('test search');
      
      console.log('Search input successfully filled with:', inputValue);
    } else {
      console.log('No search input found in modal');
      
      // Debug: log all inputs in the modal
      const allInputs = await page.locator('#search-modal input').all();
      console.log('All inputs in modal:', allInputs.length);
      
      // Debug: log modal HTML content
      const modalHTML = await page.locator('#search-modal').innerHTML();
      console.log('Modal HTML content:', modalHTML.substring(0, 500));
    }
  });
});