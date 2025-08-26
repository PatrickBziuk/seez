// Test trailing slash behavior specifically
import { test, expect } from '@playwright/test';

test.describe('Trailing Slash Routing Verification', () => {
  test('check what actually happens with /en/', async ({ page }) => {
    console.log('Testing /en/ behavior...');
    
    // Try to go to /en/ and see what happens
    const response = await page.goto('/en/', { waitUntil: 'networkidle' });
    
    console.log('Response status:', response?.status());
    console.log('Final URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Let's check what the page actually contains
    const bodyText = await page.locator('body').textContent();
    const hasWelcome = bodyText?.includes('Welcome to seez.eu');
    const has404 = bodyText?.includes('404') || bodyText?.includes('Not Found');
    
    console.log('Has welcome text:', hasWelcome);
    console.log('Has 404 content:', has404);
    
    // Based on the archived plans, /en/ should redirect to /en
    // Let's see what actually happens
    expect(response?.status()).not.toBe(404);
  });

  test('check what actually happens with /de/', async ({ page }) => {
    console.log('Testing /de/ behavior...');
    
    const response = await page.goto('/de/', { waitUntil: 'networkidle' });
    
    console.log('Response status:', response?.status());
    console.log('Final URL:', page.url());
    console.log('Page title:', await page.title());
    
    const bodyText = await page.locator('body').textContent();
    const hasWelcome = bodyText?.includes('Willkommen bei seez.eu');
    const has404 = bodyText?.includes('404') || bodyText?.includes('Not Found');
    
    console.log('Has welcome text:', hasWelcome);
    console.log('Has 404 content:', has404);
    
    expect(response?.status()).not.toBe(404);
  });
});
