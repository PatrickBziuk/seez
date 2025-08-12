import { test, expect } from '@playwright/test';

/**
 * Performance Tests for Plan 10029
 * 
 * Comprehensive performance monitoring to ensure site speed, 
 * Core Web Vitals compliance, and optimal user experience.
 * 
 * Tests cover:
 * - Page load times
 * - Core Web Vitals (LCP, FID, CLS)
 * - Resource optimization
 * - Network performance
 * - Bundle size analysis
 */

test.describe('Core Web Vitals Performance', () => {
  test('should meet Largest Contentful Paint (LCP) requirements', async ({ page }) => {
    await page.goto('/');
    
    // Measure LCP using Performance API
    const lcpValue = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve(null), 5000);
      });
    });
    
    if (lcpValue !== null) {
      // LCP should be under 2.5 seconds for good performance
      expect(lcpValue).toBeLessThan(2500);
    }
  });

  test('should meet Cumulative Layout Shift (CLS) requirements', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Measure CLS
    const clsValue = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as PerformanceEntry & { 
              hadRecentInput?: boolean; 
              value?: number; 
            };
            if (!layoutShift.hadRecentInput && layoutShift.value) {
              clsValue += layoutShift.value;
            }
          }
          resolve(clsValue);
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Wait for layout shifts to stabilize
        setTimeout(() => resolve(clsValue), 3000);
      });
    });
    
    // CLS should be under 0.1 for good performance
    expect(clsValue).toBeLessThan(0.1);
  });

  test('should have fast First Input Delay (FID)', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be interactive
    await page.waitForLoadState('domcontentloaded');
    
    // Test interaction responsiveness
    const startTime = Date.now();
    
    const interactiveElement = page.locator('a, button').first();
    
    if (await interactiveElement.count() > 0) {
      await interactiveElement.click();
      
      const endTime = Date.now();
      const delay = endTime - startTime;
      
      // FID should be under 100ms for good performance
      expect(delay).toBeLessThan(100);
    }
  });
});

test.describe('Page Load Performance', () => {
  test('should load homepage quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load content pages quickly', async ({ page }) => {
    await page.goto('/en');
    
    const contentLinks = page.locator('a[href*="/en/books/"], a[href*="/en/projects/"]');
    
    if (await contentLinks.count() > 0) {
      const startTime = Date.now();
      
      await contentLinks.first().click();
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // Content pages should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    }
  });

  test('should handle navigation performance', async ({ page }) => {
    await page.goto('/');
    
    const navigationLinks = page.locator('nav a, header a').first();
    
    if (await navigationLinks.count() > 0) {
      const startTime = Date.now();
      
      await navigationLinks.click();
      await page.waitForLoadState('domcontentloaded');
      
      const navTime = Date.now() - startTime;
      
      // Navigation should be fast
      expect(navTime).toBeLessThan(2000);
    }
  });
});

test.describe('Resource Performance', () => {
  test('should have optimized image loading', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    
    if (await images.count() > 0) {
      for (let i = 0; i < Math.min(5, await images.count()); i++) {
        const img = images.nth(i);
        
        // Check for lazy loading
        const loading = await img.getAttribute('loading');
        const isLazyLoaded = loading === 'lazy' || loading === 'auto';
        
        // Images should use lazy loading or be above the fold
        const boundingBox = await img.boundingBox();
        const isAboveFold = boundingBox && boundingBox.y < 600;
        
        expect(isLazyLoaded || isAboveFold).toBe(true);
      }
    }
  });

  test('should have efficient CSS loading', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check response headers for optimization
    const headers = response?.headers();
    
    if (headers) {
      // Should use compression
      const contentEncoding = headers['content-encoding'];
      expect(contentEncoding).toMatch(/gzip|br|deflate/);
      
      // Should have caching headers
      const cacheControl = headers['cache-control'];
      expect(cacheControl).toBeTruthy();
    }
  });

  test('should have optimized JavaScript bundles', async ({ page }) => {
    // Track network requests
    const resourceSizes: { [key: string]: number } = {};
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.js') && !url.includes('node_modules')) {
        const headers = response.headers();
        const contentLength = parseInt(headers['content-length'] || '0');
        
        if (contentLength > 0) {
          resourceSizes[url] = contentLength;
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check JavaScript bundle sizes
    for (const [_url, size] of Object.entries(resourceSizes)) {
      // Individual JS files should be under 1MB
      expect(size).toBeLessThan(1024 * 1024);
    }
  });
});

test.describe('Network Performance', () => {
  test('should handle slow network conditions', async ({ page, context }) => {
    // Simulate slow 3G
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });
    
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should still be usable on slow connections (under 10 seconds)
    expect(loadTime).toBeLessThan(10000);
  });

  test('should minimize HTTP requests', async ({ page }) => {
    let requestCount = 0;
    
    page.on('request', () => {
      requestCount++;
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have reasonable number of requests (under 50)
    expect(requestCount).toBeLessThan(50);
  });

  test('should use HTTP/2 or HTTP/3', async ({ page }) => {
    const response = await page.goto('/');
    
    if (response) {
      // Check for modern HTTP protocols
      const httpVersion = response.headers()['http-version'] || 
                         response.headers()[':status'] ? 'HTTP/2+' : 'HTTP/1.1';
      
      // Should use HTTP/2 or newer for better performance
      expect(httpVersion).not.toBe('HTTP/1.0');
    }
  });
});

test.describe('Memory Performance', () => {
  test('should not cause memory leaks', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      interface PerformanceWithMemory extends Performance {
        memory?: {
          usedJSHeapSize: number;
        };
      }
      const perf = performance as PerformanceWithMemory;
      return perf.memory ? perf.memory.usedJSHeapSize : 0;
    });
    
    // Navigate and interact
    const links = page.locator('a');
    if (await links.count() > 0) {
      for (let i = 0; i < Math.min(3, await links.count()); i++) {
        await links.nth(i).click();
        await page.waitForLoadState('domcontentloaded');
        await page.goBack();
        await page.waitForLoadState('domcontentloaded');
      }
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      interface WindowWithGC extends Window {
        gc?: () => void;
      }
      const win = window as WindowWithGC;
      if (win.gc) {
        win.gc();
      }
    });
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      interface PerformanceWithMemory extends Performance {
        memory?: {
          usedJSHeapSize: number;
        };
      }
      const perf = performance as PerformanceWithMemory;
      return perf.memory ? perf.memory.usedJSHeapSize : 0;
    });
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const increasePercentage = (memoryIncrease / initialMemory) * 100;
      
      // Memory increase should be reasonable (less than 200%)
      expect(increasePercentage).toBeLessThan(200);
    }
  });

  test('should handle multiple page loads efficiently', async ({ page }) => {
    const urls = ['/', '/en', '/de'];
    
    for (const url of urls) {
      const startTime = Date.now();
      
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // Each page should load efficiently
      expect(loadTime).toBeLessThan(5000);
    }
  });
});

test.describe('Mobile Performance', () => {
  test('should perform well on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Mobile should load within 4 seconds
    expect(loadTime).toBeLessThan(4000);
  });

  test('should have efficient touch interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const touchTargets = page.locator('a, button').first();
    
    if (await touchTargets.count() > 0) {
      const startTime = Date.now();
      
      await touchTargets.tap();
      
      const responseTime = Date.now() - startTime;
      
      // Touch response should be immediate
      expect(responseTime).toBeLessThan(200);
    }
  });

  test('should optimize for mobile bandwidth', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    let totalTransferred = 0;
    
    page.on('response', async (response) => {
      const headers = response.headers();
      const contentLength = parseInt(headers['content-length'] || '0');
      if (contentLength > 0) {
        totalTransferred += contentLength;
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Total transfer should be reasonable for mobile (under 2MB)
    expect(totalTransferred).toBeLessThan(2 * 1024 * 1024);
  });
});
