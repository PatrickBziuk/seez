import { test, expect } from '@playwright/test';

test.describe('Pagefind Debug Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4324/');
  });

  test('should access pagefind.js directly', async ({ page }) => {
    const response = await page.goto('http://localhost:4324/pagefind/pagefind.js');
    expect(response?.status()).toBe(200);

    const content = await response?.text();
    expect(content).toContain('pagefind');
  });

  test('should access pagefind entry file', async ({ page }) => {
    const response = await page.goto('http://localhost:4324/pagefind/pagefind-entry.json');
    expect(response?.status()).toBe(200);

    const json = await response?.json();
    expect(json).toBeTruthy();
    console.log('Pagefind entry:', json);
  });

  test('should debug actual search loading process', async ({ page }) => {
    // Enable console logging
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:4324/en');

    // Open search modal
    const searchButton = page.locator('#search-button');
    await searchButton.click();

    // Wait longer for search initialization
    await page.waitForTimeout(8000);

    // Check what's in the search container
    const searchContainer = page.locator('#search-container');
    const content = await searchContainer.textContent();
    console.log('Search container content:', content);

    // Try to manually load pagefind in browser
    const pagefindLoadResult = await page.evaluate(async () => {
      try {
        const script = document.createElement('script');
        script.src = '/pagefind/pagefind.js';

        return new Promise((resolve, reject) => {
          script.onload = () => resolve('loaded');
          script.onerror = (e) => reject('failed: ' + e);
          document.head.appendChild(script);

          setTimeout(() => reject('timeout'), 5000);
        });
      } catch (error) {
        return 'error: ' + error;
      }
    });

    console.log('Manual pagefind load result:', pagefindLoadResult);
  });

  test('should check network requests', async ({ page }) => {
    const requests: string[] = [];
    const responses: { url: string; status: number }[] = [];

    page.on('request', (request) => {
      if (request.url().includes('pagefind')) {
        requests.push(request.url());
      }
    });

    page.on('response', (response) => {
      if (response.url().includes('pagefind')) {
        responses.push({ url: response.url(), status: response.status() });
      }
    });

    await page.goto('http://localhost:4324/en');

    // Open search modal
    const searchButton = page.locator('#search-button');
    await searchButton.click();

    // Wait for search initialization
    await page.waitForTimeout(6000);

    console.log('Pagefind requests:', requests);
    console.log('Pagefind responses:', responses);

    // Check if pagefind script was requested
    expect(requests.some((url) => url.includes('/pagefind/pagefind.js'))).toBe(true);
  });
});
