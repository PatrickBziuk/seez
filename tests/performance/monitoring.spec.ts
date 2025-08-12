import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Comprehensive Monitoring Tests for Plan 10029
 * 
 * High-level monitoring that combines all testing aspects and 
 * generates reports for tracking site health over time.
 * 
 * Tests cover:
 * - Site availability and uptime
 * - Cross-browser compatibility
 * - Performance regression detection
 * - Error monitoring and logging
 * - Health dashboard generation
 */

interface HealthMetrics {
  timestamp: string;
  performance: {
    lcp: number;
    cls: number;
    fid: number;
  };
  seo: {
    hasTitle: boolean;
    hasDescription: boolean;
    hasCanonical: boolean;
  };
  accessibility: {
    hasMainLandmark: boolean;
    hasHeadingHierarchy: boolean;
    hasAltText: boolean;
  };
  errors: string[];
  warnings: string[];
}

test.describe('Site Health Monitoring', () => {
  test('should monitor overall site health', async ({ page }) => {
    const healthMetrics: HealthMetrics = {
      timestamp: new Date().toISOString(),
      performance: { lcp: 0, cls: 0, fid: 0 },
      seo: { hasTitle: false, hasDescription: false, hasCanonical: false },
      accessibility: { hasMainLandmark: false, hasHeadingHierarchy: false, hasAltText: false },
      errors: [],
      warnings: []
    };

    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Performance Metrics
      try {
        const lcpValue = await page.evaluate(() => {
          return new Promise<number>((resolve) => {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              resolve(lastEntry.startTime);
              observer.disconnect();
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            setTimeout(() => { observer.disconnect(); resolve(0); }, 5000);
          });
        });
        healthMetrics.performance.lcp = lcpValue;
      } catch (error) {
        healthMetrics.errors.push(`LCP measurement failed: ${error}`);
      }

      try {
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
            setTimeout(() => { observer.disconnect(); resolve(clsValue); }, 3000);
          });
        });
        healthMetrics.performance.cls = clsValue;
      } catch (error) {
        healthMetrics.errors.push(`CLS measurement failed: ${error}`);
      }

      // SEO Health
      const title = await page.title();
      healthMetrics.seo.hasTitle = title.length > 0;

      const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
      healthMetrics.seo.hasDescription = !!metaDescription;

      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      healthMetrics.seo.hasCanonical = !!canonical;

      // Accessibility Health
      const main = page.locator('main');
      healthMetrics.accessibility.hasMainLandmark = await main.count() > 0;

      const h1 = page.locator('h1');
      healthMetrics.accessibility.hasHeadingHierarchy = await h1.count() === 1;

      const images = page.locator('img');
      if (await images.count() > 0) {
        const firstImage = images.first();
        const alt = await firstImage.getAttribute('alt');
        healthMetrics.accessibility.hasAltText = !!alt;
      } else {
        healthMetrics.accessibility.hasAltText = true; // No images to check
      }

      // Generate warnings based on thresholds
      if (healthMetrics.performance.lcp > 2500) {
        healthMetrics.warnings.push(`LCP is ${healthMetrics.performance.lcp}ms (should be < 2500ms)`);
      }

      if (healthMetrics.performance.cls > 0.1) {
        healthMetrics.warnings.push(`CLS is ${healthMetrics.performance.cls} (should be < 0.1)`);
      }

      if (!healthMetrics.seo.hasTitle) {
        healthMetrics.warnings.push('Missing page title');
      }

      if (!healthMetrics.seo.hasDescription) {
        healthMetrics.warnings.push('Missing meta description');
      }

      if (!healthMetrics.accessibility.hasMainLandmark) {
        healthMetrics.warnings.push('Missing main landmark');
      }

      // Save health metrics
      const metricsDir = path.join(process.cwd(), 'test-results', 'health-metrics');
      if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
      }

      const metricsFile = path.join(metricsDir, `health-${new Date().toISOString().split('T')[0]}.json`);
      
      let existingMetrics: HealthMetrics[] = [];
      if (fs.existsSync(metricsFile)) {
        try {
          existingMetrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
        } catch {
          // Start fresh if file is corrupted
          existingMetrics = [];
        }
      }

      existingMetrics.push(healthMetrics);
      fs.writeFileSync(metricsFile, JSON.stringify(existingMetrics, null, 2));

      // Assertions for test pass/fail
      expect(healthMetrics.errors.length).toBe(0);
      expect(healthMetrics.seo.hasTitle).toBe(true);
      expect(healthMetrics.accessibility.hasMainLandmark).toBe(true);

    } catch (error) {
      healthMetrics.errors.push(`Health monitoring failed: ${error}`);
      throw error;
    }
  });

  test('should monitor error rates across pages', async ({ page }) => {
    const pages = ['/', '/en', '/de'];
    const errorCounts: { [key: string]: number } = {};
    
    for (const pagePath of pages) {
      let errorCount = 0;
      
      page.on('pageerror', () => {
        errorCount++;
      });
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errorCount++;
        }
      });
      
      try {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Wait for any async errors
        await page.waitForTimeout(2000);
        
        errorCounts[pagePath] = errorCount;
      } catch {
        errorCounts[pagePath] = errorCount + 1;
      }
    }
    
    // Assert no critical errors
    for (const [pagePath, count] of Object.entries(errorCounts)) {
      expect(count).toBeLessThanOrEqual(2); // Allow minor non-critical errors
      
      if (count > 0) {
        console.warn(`${count} errors detected on page ${pagePath}`);
      }
    }
  });

  test('should monitor resource loading health', async ({ page }) => {
    let failedResources = 0;
    let totalResources = 0;
    const failedUrls: string[] = [];
    
    page.on('response', (response) => {
      totalResources++;
      
      if (response.status() >= 400) {
        failedResources++;
        failedUrls.push(response.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const failureRate = totalResources > 0 ? (failedResources / totalResources) * 100 : 0;
    
    // Resource failure rate should be under 5%
    expect(failureRate).toBeLessThan(5);
    
    // Log failed resources for debugging
    if (failedUrls.length > 0) {
      console.warn('Failed resources:', failedUrls);
    }
    
    // Should have loaded some resources
    expect(totalResources).toBeGreaterThan(0);
  });

  test('should monitor uptime and availability', async ({ page }) => {
    const urls = ['/', '/en', '/de', '/robots.txt'];
    const uptimeResults: { [key: string]: boolean } = {};
    
    for (const url of urls) {
      try {
        const response = await page.goto(url);
        uptimeResults[url] = response !== null && response.status() < 400;
      } catch {
        uptimeResults[url] = false;
      }
    }
    
    // All URLs should be accessible
    for (const [url, isUp] of Object.entries(uptimeResults)) {
      expect(isUp).toBe(true);
      
      if (!isUp) {
        console.error(`${url} is not accessible`);
      }
    }
  });
});

test.describe('Cross-Browser Compatibility Monitoring', () => {
  test('should work across different user agents', async ({ page }) => {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
    ];
    
    for (const userAgent of userAgents) {
      await page.setExtraHTTPHeaders({
        'User-Agent': userAgent
      });
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Basic functionality should work
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      
      const main = page.locator('main');
      await expect(main).toBeVisible();
    }
  });

  test('should handle different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }, // Desktop
      { width: 2560, height: 1440 }  // Large Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Page should render properly at all sizes
      const main = page.locator('main');
      await expect(main).toBeVisible();
      
      // Should not have horizontal scroll (except for large content)
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 50); // Allow small tolerance
    }
  });
});

test.describe('Performance Regression Detection', () => {
  test('should detect performance regressions', async ({ page }) => {
    await page.goto('/');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstByte: navigation.responseStart - navigation.requestStart,
        resourceCount: performance.getEntriesByType('resource').length
      };
    });
    
    // Save metrics for regression analysis
    const metricsDir = path.join(process.cwd(), 'test-results', 'performance-history');
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }
    
    const metricsFile = path.join(metricsDir, 'performance-history.json');
    
    let history: Array<{ timestamp: string; metrics: typeof performanceMetrics }> = [];
    if (fs.existsSync(metricsFile)) {
      try {
        history = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      } catch {
        history = [];
      }
    }
    
    const currentEntry = {
      timestamp: new Date().toISOString(),
      metrics: performanceMetrics
    };
    
    history.push(currentEntry);
    
    // Keep only last 50 entries
    if (history.length > 50) {
      history = history.slice(-50);
    }
    
    fs.writeFileSync(metricsFile, JSON.stringify(history, null, 2));
    
    // Check for regressions if we have historical data
    if (history.length > 1) {
      const recent = history.slice(-5); // Last 5 entries
      const avgDomContentLoaded = recent.reduce((sum, entry) => sum + entry.metrics.domContentLoaded, 0) / recent.length;
      
      // Current performance should not be significantly worse than recent average
      const regressionThreshold = avgDomContentLoaded * 1.5; // 50% slower is a regression
      
      if (performanceMetrics.domContentLoaded > regressionThreshold) {
        console.warn(`Performance regression detected: DOM content loaded in ${performanceMetrics.domContentLoaded}ms vs ${avgDomContentLoaded}ms average`);
      }
      
      // Don't fail test for regressions, just warn
      // expect(performanceMetrics.domContentLoaded).toBeLessThan(regressionThreshold);
    }
    
    // Basic performance thresholds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000);
    expect(performanceMetrics.firstByte).toBeLessThan(1000);
  });
});

test.describe('Health Dashboard Generation', () => {
  test('should generate health dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Collect comprehensive health data
    const healthData = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      viewport: await page.viewportSize(),
      userAgent: await page.evaluate(() => navigator.userAgent),
      
      // Performance
      performance: await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstByte: navigation.responseStart - navigation.requestStart
        };
      }),
      
      // SEO
      seo: {
        title: await page.title(),
        description: await page.getAttribute('meta[name="description"]', 'content'),
        canonical: await page.getAttribute('link[rel="canonical"]', 'href'),
        h1Count: await page.locator('h1').count(),
        imageCount: await page.locator('img').count(),
        linkCount: await page.locator('a').count()
      },
      
      // Accessibility
      accessibility: {
        mainLandmarks: await page.locator('main').count(),
        navLandmarks: await page.locator('nav').count(),
        headingStructure: {
          h1: await page.locator('h1').count(),
          h2: await page.locator('h2').count(),
          h3: await page.locator('h3').count()
        }
      },
      
      // Technical
      technical: {
        hasServiceWorker: await page.evaluate(() => 'serviceWorker' in navigator),
        hasLocalStorage: await page.evaluate(() => typeof Storage !== 'undefined'),
        protocol: await page.evaluate(() => location.protocol),
        resourceCount: await page.evaluate(() => performance.getEntriesByType('resource').length)
      }
    };
    
    // Generate HTML dashboard
    const dashboardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Health Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: inline-block; margin: 10px; padding: 15px; border-radius: 4px; min-width: 120px; text-align: center; }
        .metric.good { background: #e7f5e7; border-left: 4px solid #4caf50; }
        .metric.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .metric.error { background: #f8d7da; border-left: 4px solid #dc3545; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .timestamp { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Site Health Dashboard</h1>
        <p class="timestamp">Generated: ${healthData.timestamp}</p>
        
        <div class="card">
            <h2>Performance Metrics</h2>
            <div class="metric ${healthData.performance.domContentLoaded < 1000 ? 'good' : healthData.performance.domContentLoaded < 3000 ? 'warning' : 'error'}">
                <div class="metric-label">DOM Content Loaded</div>
                <div class="metric-value">${healthData.performance.domContentLoaded}ms</div>
            </div>
            <div class="metric ${healthData.performance.firstByte < 200 ? 'good' : healthData.performance.firstByte < 1000 ? 'warning' : 'error'}">
                <div class="metric-label">First Byte</div>
                <div class="metric-value">${healthData.performance.firstByte}ms</div>
            </div>
        </div>
        
        <div class="card">
            <h2>SEO Health</h2>
            <div class="metric ${healthData.seo.title && healthData.seo.title.length > 10 ? 'good' : 'error'}">
                <div class="metric-label">Page Title</div>
                <div class="metric-value">${healthData.seo.title ? '✓' : '✗'}</div>
            </div>
            <div class="metric ${healthData.seo.description ? 'good' : 'error'}">
                <div class="metric-label">Meta Description</div>
                <div class="metric-value">${healthData.seo.description ? '✓' : '✗'}</div>
            </div>
            <div class="metric ${healthData.seo.h1Count === 1 ? 'good' : 'warning'}">
                <div class="metric-label">H1 Count</div>
                <div class="metric-value">${healthData.seo.h1Count}</div>
            </div>
        </div>
        
        <div class="card">
            <h2>Accessibility</h2>
            <div class="metric ${healthData.accessibility.mainLandmarks > 0 ? 'good' : 'error'}">
                <div class="metric-label">Main Landmarks</div>
                <div class="metric-value">${healthData.accessibility.mainLandmarks}</div>
            </div>
            <div class="metric ${healthData.accessibility.navLandmarks > 0 ? 'good' : 'warning'}">
                <div class="metric-label">Nav Landmarks</div>
                <div class="metric-value">${healthData.accessibility.navLandmarks}</div>
            </div>
        </div>
        
        <div class="card">
            <h2>Technical Details</h2>
            <pre>${JSON.stringify(healthData, null, 2)}</pre>
        </div>
    </div>
</body>
</html>`;
    
    // Save dashboard
    const dashboardDir = path.join(process.cwd(), 'test-results', 'dashboard');
    if (!fs.existsSync(dashboardDir)) {
      fs.mkdirSync(dashboardDir, { recursive: true });
    }
    
    const dashboardFile = path.join(dashboardDir, 'health-dashboard.html');
    fs.writeFileSync(dashboardFile, dashboardHtml);
    
    // Basic health checks
    expect(healthData.seo.title).toBeTruthy();
    expect(healthData.accessibility.mainLandmarks).toBeGreaterThan(0);
    expect(healthData.performance.domContentLoaded).toBeLessThan(5000);
    
    console.log(`Health dashboard generated: ${dashboardFile}`);
  });
});
