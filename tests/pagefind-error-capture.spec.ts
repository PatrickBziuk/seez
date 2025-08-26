import { test, expect } from '@playwright/test';

test('should capture exact pagefind error details', async ({ page }) => {
  // Capture all network activity
  const requests: { url: string; method: string }[] = [];
  const responses: { url: string; status: number; statusText: string }[] = [];
  const errors: string[] = [];

  page.on('request', request => {
    if (request.url().includes('pagefind')) {
      requests.push({ url: request.url(), method: request.method() });
      console.log('REQUEST:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('pagefind')) {
      responses.push({ 
        url: response.url(), 
        status: response.status(), 
        statusText: response.statusText() 
      });
      console.log('RESPONSE:', response.status(), response.statusText(), response.url());
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('PAGE ERROR:', err.message);
  });

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('pagefind') || msg.text().includes('Search')) {
      console.log(`CONSOLE [${msg.type()}]:`, msg.text());
    }
  });

  await page.goto('http://localhost:4324/en');
  
  // Open search modal
  const searchButton = page.locator('#search-button');
  await searchButton.click();
  
  // Wait and capture what happens
  await page.waitForTimeout(8000);
  
  console.log('=== NETWORK SUMMARY ===');
  console.log('Requests:', requests);
  console.log('Responses:', responses);
  console.log('Errors:', errors);
  
  // Get search container content for analysis
  const searchContainer = page.locator('#search-container');
  const content = await searchContainer.innerHTML();
  console.log('=== SEARCH CONTAINER ===');
  console.log(content);
  
  // Try to manually access pagefind.js to verify it's working
  const directAccess = await page.goto('http://localhost:4324/pagefind/pagefind.js');
  console.log('Direct pagefind.js access:', directAccess?.status());
  
  expect(directAccess?.status()).toBe(200);
});