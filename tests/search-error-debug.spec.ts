import { test } from '@playwright/test';

test.describe('Search Error Detection Debug', () => {
  test('should analyze the exact error path', async ({ page }) => {
    // Capture all console logs and errors
    const logs: string[] = [];
    const errors: string[] = [];

    page.on('console', (msg) => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', (err) => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });

    await page.goto('http://localhost:4324/en');

    // Open search modal
    const searchButton = page.locator('#search-button');
    await searchButton.click();

    // Wait for initialization to complete
    await page.waitForTimeout(8000);

    // Print all logs and errors
    console.log('=== CONSOLE LOGS ===');
    logs.forEach((log) => console.log(log));

    console.log('=== PAGE ERRORS ===');
    errors.forEach((error) => console.log(error));

    // Get the current search container content
    const searchContainer = page.locator('#search-container');
    const content = await searchContainer.innerHTML();
    console.log('=== SEARCH CONTAINER HTML ===');
    console.log(content);

    // Check what specific error path was taken
    const hasDevMessage = await page.locator('text=Search in Development Mode').isVisible();
    const hasErrorMessage = await page.locator('text=Search Unavailable').isVisible();
    const hasSearchInput = await page.locator('#pagefind-search').isVisible();

    console.log('=== ERROR PATH ANALYSIS ===');
    console.log('Has dev message:', hasDevMessage);
    console.log('Has error message:', hasErrorMessage);
    console.log('Has search input:', hasSearchInput);

    // Try to manually check if window.pagefind exists
    const pagefindExists = await page.evaluate(() => {
      const win = window as unknown as { pagefind?: unknown };
      return {
        windowPagefind: typeof win.pagefind !== 'undefined',
        pagefindObject: win.pagefind ?? null,
        windowKeys: Object.keys(window).filter((key) => key.includes('pagefind')),
      };
    });

    console.log('=== PAGEFIND OBJECT STATUS ===');
    console.log(JSON.stringify(pagefindExists, null, 2));
  });

  test('should check network timing and requests', async ({ page }) => {
    const networkEvents: { type: string; url: string; status?: number; time: number }[] = [];

    page.on('request', (request) => {
      if (request.url().includes('pagefind')) {
        networkEvents.push({
          type: 'request',
          url: request.url(),
          time: Date.now(),
        });
      }
    });

    page.on('response', (response) => {
      if (response.url().includes('pagefind')) {
        networkEvents.push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          time: Date.now(),
        });
      }
    });

    await page.goto('http://localhost:4324/en');

    const startTime = Date.now();

    // Open search modal
    const searchButton = page.locator('#search-button');
    await searchButton.click();

    // Wait for initialization
    await page.waitForTimeout(8000);

    console.log('=== NETWORK EVENTS ===');
    networkEvents.forEach((event) => {
      console.log(
        `${event.type.toUpperCase()}: ${event.url} (${event.status || 'N/A'}) at +${event.time - startTime}ms`
      );
    });
  });
});
