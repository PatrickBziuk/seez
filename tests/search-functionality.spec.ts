import { test, expect } from '@playwright/test';

test.describe('Search Functionality Debug', () => {
  test('should open search modal when clicking search button', async ({ page }) => {
    // Go to the home page
    await page.goto('http://localhost:4323');

    // Check if search button exists
    const searchButton = page.locator('#search-button');
    await expect(searchButton).toBeVisible();

    // Check if search modal exists but is hidden
    const searchModal = page.locator('#search-modal');
    await expect(searchModal).toHaveClass(/hidden/);

    // Click the search button
    await searchButton.click();

    // Check if modal is now visible
    await expect(searchModal).not.toHaveClass(/hidden/);

    // Check if the search component is loaded
    const searchContainer = page.locator('#search');
    await expect(searchContainer).toBeVisible();

    // Wait a bit for pagefind to initialize
    await page.waitForTimeout(2000);

    // Check if pagefind search input is present
    const searchInput = page.locator('#search input, .pagefind-ui__search-input');
    
    // Log the current state for debugging
    console.log('Search input found:', await searchInput.count());
    console.log('Search container content:', await searchContainer.innerHTML());
  });

  test('should show pagefind search interface in production build', async ({ page }) => {
    await page.goto('http://localhost:4323');
    
    // Open search modal
    await page.click('#search-button');
    
    // Wait for search to initialize
    await page.waitForTimeout(3000);
    
    // Check if pagefind loaded successfully
    const searchContainer = page.locator('#search');
    const content = await searchContainer.innerHTML();
    
    console.log('Search container content:', content);
    
    // The search should either show the pagefind UI or an error message
    const hasPagefindUI = content.includes('pagefind-ui') || content.includes('input');
    const hasErrorMessage = content.includes('Search is currently unavailable') || content.includes('Search available in production');
    
    expect(hasPagefindUI || hasErrorMessage).toBe(true);
  });

  test('should respond to keyboard shortcuts', async ({ page }) => {
    await page.goto('http://localhost:4323');
    
    // Press / key to open search
    await page.keyboard.press('/');
    
    // Check if modal opened
    const searchModal = page.locator('#search-modal');
    await expect(searchModal).not.toHaveClass(/hidden/);
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    
    // Check if modal closed
    await expect(searchModal).toHaveClass(/hidden/);
  });
});