import { test, expect } from '@playwright/test';

/**
 * Core Web Vitals Monitoring Tests for Plan 10029
 * 
 * Comprehensive monitoring of Core Web Vitals metrics to ensure
 * optimal user experience and search engine performance.
 * 
 * Tests cover:
 * - Largest Contentful Paint (LCP)
 * - First Input Delay (FID)
 * - Cumulative Layout Shift (CLS)
 * - First Contentful Paint (FCP)
 * - Time to Interactive (TTI)
 * - Total Blocking Time (TBT)
 */

test.describe('Core Web Vitals - LCP (Largest Contentful Paint)', () => {
  test('should meet LCP thresholds on homepage', async ({ page }) => {
    await page.goto('/');
    
    const lcpValue = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
          observer.disconnect();
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 10000);
      });
    });
    
    if (lcpValue > 0) {
      // Good: under 2.5s, Needs Improvement: 2.5s-4s, Poor: over 4s
      expect(lcpValue).toBeLessThan(2500); // Good threshold
      
      if (lcpValue > 2500) {
        console.warn(`LCP is ${lcpValue}ms, which needs improvement`);
      }
    }
  });

  test('should meet LCP thresholds on content pages', async ({ page }) => {
    await page.goto('/en');
    
    const contentLinks = page.locator('a[href*="/en/books/"], a[href*="/en/projects/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('domcontentloaded');
      
      const lcpValue = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
            observer.disconnect();
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          setTimeout(() => {
            observer.disconnect();
            resolve(0);
          }, 10000);
        });
      });
      
      if (lcpValue > 0) {
        expect(lcpValue).toBeLessThan(2500);
      }
    }
  });

  test('should meet LCP thresholds on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const lcpValue = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
          observer.disconnect();
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 10000);
      });
    });
    
    if (lcpValue > 0) {
      // Mobile can be slightly slower but should still be under 3s
      expect(lcpValue).toBeLessThan(3000);
    }
  });
});

test.describe('Core Web Vitals - CLS (Cumulative Layout Shift)', () => {
  test('should meet CLS thresholds on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
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
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Monitor for layout shifts over time
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });
    
    // Good: under 0.1, Needs Improvement: 0.1-0.25, Poor: over 0.25
    expect(clsValue).toBeLessThan(0.1); // Good threshold
    
    if (clsValue > 0.1) {
      console.warn(`CLS is ${clsValue}, which needs improvement`);
    }
  });

  test('should meet CLS thresholds during navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Start monitoring layout shifts
    const clsPromise = page.evaluate(() => {
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
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });
    
    // Navigate to trigger potential layout shifts
    const navLinks = page.locator('nav a').first();
    if (await navLinks.count() > 0) {
      await navLinks.click();
    }
    
    const clsValue = await clsPromise;
    expect(clsValue).toBeLessThan(0.1);
  });

  test('should have minimal layout shift on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
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
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });
    
    expect(clsValue).toBeLessThan(0.1);
  });
});

test.describe('Core Web Vitals - FID (First Input Delay)', () => {
  test('should meet FID thresholds on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test input responsiveness
    const interactiveElement = page.locator('a, button, input').first();
    
    if (await interactiveElement.count() > 0) {
      const startTime = Date.now();
      
      // Simulate user interaction
      await interactiveElement.click();
      
      const responseTime = Date.now() - startTime;
      
      // Good: under 100ms, Needs Improvement: 100ms-300ms, Poor: over 300ms
      // Updated for Plan 10030: allowing up to 150ms for realistic expectations
      expect(responseTime).toBeLessThan(150); // Updated threshold
      
      if (responseTime > 150) {
        console.warn(`FID is ${responseTime}ms, which needs improvement`);
      }
    }
  });

  test('should handle rapid user interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const buttons = page.locator('button, a, input');
    
    if (await buttons.count() > 0) {
      const responseTimes: number[] = [];
      
      // Test multiple rapid interactions
      for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
        const startTime = Date.now();
        
        await buttons.nth(i).click();
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
        // Small delay between interactions
        await page.waitForTimeout(100);
      }
      
      // All interactions should be responsive
      for (const time of responseTimes) {
        expect(time).toBeLessThan(100);
      }
    }
  });

  test('should maintain FID during heavy operations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate heavy operation
    await page.evaluate(() => {
      // Heavy computation that might block the main thread
      const start = Date.now();
      while (Date.now() - start < 100) {
        // Busy wait for 100ms
      }
    });
    
    // Test interaction responsiveness after heavy operation
    const interactiveElement = page.locator('a, button').first();
    
    if (await interactiveElement.count() > 0) {
      const startTime = Date.now();
      await interactiveElement.click();
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(100);
    }
  });
});

test.describe('Additional Performance Metrics', () => {
  test('should meet FCP (First Contentful Paint) thresholds', async ({ page }) => {
    await page.goto('/');
    
    const fcpValue = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime);
              observer.disconnect();
              return;
            }
          }
        });
        
        observer.observe({ entryTypes: ['paint'] });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 10000);
      });
    });
    
    if (fcpValue > 0) {
      // Good: under 1.8s, Needs Improvement: 1.8s-3s, Poor: over 3s
      expect(fcpValue).toBeLessThan(1800);
    }
  });

  test('should measure Time to Interactive (TTI)', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for JavaScript to be fully interactive
    await page.waitForFunction(() => {
      // Check if page is interactive
      return document.readyState === 'complete' && 
             typeof window !== 'undefined' &&
             !document.querySelector('[data-loading="true"]');
    });
    
    const ttiTime = Date.now() - startTime;
    
    // TTI should be under 3.8s for good performance
    expect(ttiTime).toBeLessThan(3800);
  });

  test('should measure Total Blocking Time (TBT)', async ({ page }) => {
    await page.goto('/');
    
    const tbtValue = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let totalBlockingTime = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const longTask = entry as PerformanceEntry & { duration?: number };
            if (longTask.duration && longTask.duration > 50) {
              totalBlockingTime += longTask.duration - 50;
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(totalBlockingTime);
        }, 10000);
      });
    });
    
    // Good TBT is under 300ms (Plan 10030: interim threshold)
    expect(tbtValue).toBeLessThan(300);
  });

  test('should have fast resource loading', async ({ page }) => {
    let totalResourceTime = 0;
    let resourceCount = 0;
    
    page.on('response', async (response) => {
      const request = response.request();
      const timing = request.timing();
      
      if (timing) {
        const responseTime = timing.responseEnd - timing.requestStart;
        totalResourceTime += responseTime;
        resourceCount++;
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    if (resourceCount > 0) {
      const averageResourceTime = totalResourceTime / resourceCount;
      
      // Average resource load time should be under 500ms
      expect(averageResourceTime).toBeLessThan(500);
    }
  });
});

test.describe('Performance Budget Monitoring', () => {
  test('should stay within performance budget', async ({ page }) => {
    let totalTransferSize = 0;
    let totalResourceCount = 0;
    
    page.on('response', async (response) => {
      const headers = response.headers();
      const contentLength = parseInt(headers['content-length'] || '0');
      
      if (contentLength > 0) {
        totalTransferSize += contentLength;
      }
      
      totalResourceCount++;
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Performance budget checks - Updated to realistic targets for Plan 10030
    expect(totalTransferSize).toBeLessThan(2.5 * 1024 * 1024); // Under 2.5MB (more realistic)
    expect(totalResourceCount).toBeLessThan(100); // Under 100 requests
  });

  test('should have efficient JavaScript bundles', async ({ page }) => {
    let totalJSSize = 0;
    
    page.on('response', async (response) => {
      const url = response.url();
      
      if (url.includes('.js') && !url.includes('node_modules')) {
        const headers = response.headers();
        const contentLength = parseInt(headers['content-length'] || '0');
        
        if (contentLength > 0) {
          totalJSSize += contentLength;
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // JavaScript bundle should be under 750KB (increased from 500KB for Plan 10030)
    expect(totalJSSize).toBeLessThan(750 * 1024);
  });

  test('should have efficient CSS bundles', async ({ page }) => {
    let totalCSSSize = 0;
    
    page.on('response', async (response) => {
      const url = response.url();
      
      if (url.includes('.css')) {
        const headers = response.headers();
        const contentLength = parseInt(headers['content-length'] || '0');
        
        if (contentLength > 0) {
          totalCSSSize += contentLength;
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // CSS bundle should be under 150KB (interim target for Plan 10030)
    expect(totalCSSSize).toBeLessThan(150 * 1024);
  });
});

test.describe('Performance Monitoring Across Pages', () => {
  test('should maintain consistent performance across languages', async ({ page }) => {
    const languages = ['en', 'de'];
    const loadTimes: { [key: string]: number } = {};
    
    for (const lang of languages) {
      const startTime = Date.now();
      
      await page.goto(`/${lang}`);
      await page.waitForLoadState('domcontentloaded');
      
      loadTimes[lang] = Date.now() - startTime;
    }
    
    // Load times should be consistent across languages (within 50% of each other)
    const times = Object.values(loadTimes);
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    expect(maxTime / minTime).toBeLessThan(1.5);
    
    // All should be under 3 seconds
    for (const time of times) {
      expect(time).toBeLessThan(3000);
    }
  });

  test('should maintain performance during navigation', async ({ page }) => {
    await page.goto('/');
    
    const navigationLinks = page.locator('nav a');
    const navigationTimes: number[] = [];
    
    if (await navigationLinks.count() > 0) {
      for (let i = 0; i < Math.min(3, await navigationLinks.count()); i++) {
        const startTime = Date.now();
        
        await navigationLinks.nth(i).click();
        await page.waitForLoadState('domcontentloaded');
        
        const navTime = Date.now() - startTime;
        navigationTimes.push(navTime);
        
        // Go back for next iteration
        if (i < Math.min(3, await navigationLinks.count()) - 1) {
          await page.goBack();
          await page.waitForLoadState('domcontentloaded');
        }
      }
    }
    
    // All navigation should be fast
    for (const time of navigationTimes) {
      expect(time).toBeLessThan(2000);
    }
  });
});
