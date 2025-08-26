// Test to verify header navigation and search fixes
import { test, expect } from '@playwright/test';

test.describe('Header Navigation and Search Fixes', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log('Browser console:', msg.text()));
  });

  test('Navigation active states work correctly in development mode', async ({ page }) => {
    await page.goto('http://localhost:4324/');
    
    // Test navigation to books section
    await page.click('a[href*="/books"]');
    await page.waitForLoadState('networkidle');
    
    // Check if books link is active
    const booksLink = page.locator('a[href*="/books"]').first();
    const isActive = await booksLink.evaluate((el) => {
      return el.classList.contains('text-primary') || 
             el.getAttribute('aria-current') === 'page' ||
             el.closest('li')?.classList.contains('active');
    });
    
    expect(isActive).toBeTruthy();
    
    // Navigate to projects and verify books is no longer active
    await page.click('a[href*="/projects"]');
    await page.waitForLoadState('networkidle');
    
    const projectsLink = page.locator('a[href*="/projects"]').first();
    const projectsActive = await projectsLink.evaluate((el) => {
      return el.classList.contains('text-primary') || 
             el.getAttribute('aria-current') === 'page' ||
             el.closest('li')?.classList.contains('active');
    });
    
    expect(projectsActive).toBeTruthy();
  });

  test('Search modal shows development message in dev mode', async ({ page }) => {
    await page.goto('http://localhost:4324/');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Click search button
    const searchButton = page.locator('#search-button');
    await expect(searchButton).toBeVisible();
    await searchButton.click();
    
    // Wait for modal to appear
    await page.waitForSelector('#search-modal', { state: 'visible' });
    
    // Check if development message is shown
    const searchContainer = page.locator('#search-container');
    const content = await searchContainer.textContent();
    
    expect(content).toContain('Development Mode');
    expect(content).toContain('pnpm run build');
  });

  test('Mobile navigation toggle works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:4324/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find mobile toggle button
    const toggleButton = page.locator('[data-aw-toggle-menu]');
    await expect(toggleButton).toBeVisible();
    
    // Click to open mobile menu
    await toggleButton.click();
    
    // Check if mobile navigation is visible
    const mobileNav = page.locator('#mobile-navigation');
    await expect(mobileNav).not.toHaveClass(/hidden/);
    
    // Click outside to close
    await page.click('body');
    
    // Check if mobile navigation is hidden again
    await expect(mobileNav).toHaveClass(/hidden/);
  });

  test('Search close button works', async ({ page }) => {
    await page.goto('http://localhost:4324/');
    await page.waitForLoadState('networkidle');
    
    // Open search modal
    await page.click('#search-button');
    await page.waitForSelector('#search-modal', { state: 'visible' });
    
    // Close search modal
    await page.click('#search-close');
    
    // Verify modal is hidden
    const modal = page.locator('#search-modal');
    await expect(modal).toHaveClass(/hidden/);
  });
});

test.describe('Header Navigation and Search in Preview Mode', () => {
  
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('Browser console:', msg.text()));
  });

  test('Search works correctly in preview mode', async ({ page }) => {
    // This test assumes preview server is running on port 4323
    await page.goto('http://localhost:4323/');
    await page.waitForLoadState('networkidle');
    
    // Click search button
    await page.click('#search-button');
    await page.waitForSelector('#search-modal', { state: 'visible' });
    
    // Wait for search to initialize
    await page.waitForTimeout(1000);
    
    // Check if search input is present (indicating successful Pagefind load)
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();
    
    // Test search functionality
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    
    // Should have search results or at least search interface
    const searchResults = page.locator('#search-container');
    const content = await searchResults.textContent();
    expect(content).not.toContain('Development Mode');
  });

  test('Navigation states work in preview mode', async ({ page }) => {
    await page.goto('http://localhost:4323/');
    await page.waitForLoadState('networkidle');
    
    // Test navigation through different sections
    const testRoutes = ['/en/books', '/en/projects', '/en/lab'];
    
    for (const route of testRoutes) {
      await page.goto(`http://localhost:4323${route}`);
      await page.waitForLoadState('networkidle');
      
      // Check if correct navigation link is active
      const activeLink = page.locator(`a[href*="${route}"]`).first();
      const isActive = await activeLink.evaluate((el) => {
        const classList = el.classList.toString();
        const parentClassList = el.closest('li')?.classList.toString() || '';
        return classList.includes('text-primary') || 
               parentClassList.includes('active') ||
               el.getAttribute('aria-current') === 'page';
      });
      
      expect(isActive).toBeTruthy();
    }
  });
});