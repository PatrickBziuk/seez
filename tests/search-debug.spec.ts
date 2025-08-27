import { test, expect } from '@playwright/test';

test.describe('Pagefind Search Content Debug', () => {
  test('should show search interface content details', async ({ page }) => {
    // Open page
    await page.goto('http://localhost:4323');

    // Enable console logging
    page.on('console', (msg) => console.log('Console:', msg.text()));

    // Click search button
    await page.click('#search-button');

    // Wait for modal to be visible
    await page.waitForSelector('#search-modal:not(.hidden)');

    // Wait longer for pagefind to initialize
    await page.waitForTimeout(5000);

    // Get the search container content
    const searchContainer = page.locator('#search');
    await expect(searchContainer).toBeVisible();

    // Log the HTML content to see what's actually there
    const content = await searchContainer.innerHTML();
    console.log('=== SEARCH CONTAINER CONTENT ===');
    console.log(content);
    console.log('=== END CONTENT ===');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'search-debug.png' });

    // Check for different possible states
    const hasInput = (await page.locator('#search input').count()) > 0;
    const hasPagefindUI = (await page.locator('.pagefind-ui').count()) > 0;
    const hasErrorMessage = content.includes('unavailable') || content.includes('production build');
    const hasDevMessage = content.includes('Development mode');

    console.log('Has input:', hasInput);
    console.log('Has pagefind UI:', hasPagefindUI);
    console.log('Has error message:', hasErrorMessage);
    console.log('Has dev message:', hasDevMessage);

    // One of these should be true
    expect(hasInput || hasPagefindUI || hasErrorMessage || hasDevMessage).toBe(true);
  });

  test('should check pagefind files exist', async ({ page }) => {
    // Check if pagefind files are available
    const pagefindJs = await page.goto('http://localhost:4323/pagefind/pagefind.js');
    console.log('Pagefind JS status:', pagefindJs?.status());

    const pagefindWasm = await page.goto('http://localhost:4323/pagefind/pagefind_bg.wasm');
    console.log('Pagefind WASM status:', pagefindWasm?.status());
  });
});
