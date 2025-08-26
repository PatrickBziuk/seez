import { test, expect } from '@playwright/test';

/**
 * Consolidated Core Test Suite
 * Focuses on essential functionality for Chromium browsers (mobile/desktop)
 * Removes edge cases to prevent long-running tests that could cause system sleep
 */

test.describe('Core Functionality - Essential Tests', () => {
  
  test('Homepage loads correctly for both languages', async ({ page }) => {
    // Test English homepage
    await page.goto('/en');
    await expect(page).toHaveTitle(/seez/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    
    // Test German homepage
    await page.goto('/de');
    await expect(page).toHaveTitle(/seez/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });

  test('Navigation links work correctly', async ({ page }) => {
    await page.goto('/en');
    
    // Test main navigation sections
    const collections = ['/en/projects', '/en/life', '/en/books', '/en/lab', '/en/about', '/en/contact'];
    
    for (const collection of collections) {
      await page.goto(collection);
      
      // Should not be 404
      await expect(page).not.toHaveTitle(/404|Not Found/);
      
      // Should have proper language attribute
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', 'en');
      
      // Should have main content structure
      const main = page.locator('main, [role="main"], article, .content').first();
      await expect(main).toBeVisible();
    }
  });

  test('Language switching functionality', async ({ page }) => {
    await page.goto('/en');
    
    // Look for language switcher
    const langSwitcher = page.locator('a[href="/de"], [data-testid="language-switcher"] a[href="/de"]').first();
    
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click();
      await expect(page).toHaveURL(/\/de/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    }
  });

  test('Essential SEO metadata', async ({ page }) => {
    await page.goto('/en');
    
    // Check essential meta tags
    await expect(page.locator('meta[charset]')).toHaveCount(1);
    await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
    
    // Check title exists and is reasonable length
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThan(100);
    
    // Check for basic description
    const description = page.locator('meta[name="description"]');
    if (await description.count() > 0) {
      const content = await description.getAttribute('content');
      expect(content?.length || 0).toBeGreaterThan(50);
    }
  });

  test('Content metadata displays correctly', async ({ page }) => {
    // Check a content page with metadata
    await page.goto('/en/life');
    
    // Look for content metadata components
    const metadata = page.locator('[data-testid="content-metadata"], .content-metadata, .metadata').first();
    
    if (await metadata.isVisible()) {
      // Should contain some metadata information
      const text = await metadata.textContent();
      expect(text?.length || 0).toBeGreaterThan(10);
    }
  });

  test('Basic performance and loading', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/en', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time (3 seconds for core test)
    expect(loadTime).toBeLessThan(3000);
    
    // Check for critical JS errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      if (!error.message.includes('favicon') && 
          !error.message.includes('analytics') &&
          !error.message.includes('third-party')) {
        errors.push(error.message);
      }
    });
    
    await page.waitForTimeout(500); // Brief wait for JS initialization
    
    expect(errors).toEqual([]);
  });
});

test.describe('Mobile-Specific Tests', () => {
  test('Mobile navigation is accessible @mobile', async ({ page }) => {
    await page.goto('/en');
    
    // Check if mobile menu toggle exists and works
    const mobileToggle = page.locator('[data-testid="mobile-menu-toggle"], .mobile-menu-toggle, button[aria-label*="menu" i]').first();
    
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      
      // Should show mobile navigation
      const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, nav[aria-expanded="true"]').first();
      await expect(mobileNav).toBeVisible();
    }
  });

  test('Mobile viewport is properly configured @mobile', async ({ page }) => {
    await page.goto('/en');
    
    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    const content = await viewport.getAttribute('content');
    
    expect(content).toContain('width=device-width');
    expect(content).toContain('initial-scale=1');
  });
});

test.describe('Quick Smoke Tests', () => {
  test('Critical paths are functional', async ({ page }) => {
    // Test homepage
    await page.goto('/en');
    await expect(page).toHaveTitle(/seez/);
    
    // Test one content collection
    await page.goto('/en/projects');
    await expect(page).not.toHaveTitle(/404/);
    
    // Test about page
    await page.goto('/en/about');
    await expect(page).not.toHaveTitle(/404/);
  });
  
  test('German language version works', async ({ page }) => {
    await page.goto('/de');
    await expect(page).not.toHaveTitle(/404/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });
});
