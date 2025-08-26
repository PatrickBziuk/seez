import { test, expect } from '@playwright/test';

test.describe('Header Responsive Behavior Debug', () => {
  test('should show correct navigation based on viewport size', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // Navigate to preview site
    await page.goto('http://localhost:4323/en');
    await page.waitForLoadState('networkidle');
    
    // Get viewport size
    const viewportSize = page.viewportSize();
    console.log('Viewport size:', viewportSize);
    
    // Check which navigation elements are visible
    const desktopNav = page.locator('nav[data-nav="desktop"]');
    const mobileNav = page.locator('nav[data-nav="mobile"]');
    const toggleButton = page.locator('[data-aw-toggle-menu]');
    
    const desktopNavVisible = await desktopNav.isVisible();
    const mobileNavVisible = await mobileNav.isVisible();
    const toggleButtonVisible = await toggleButton.isVisible();
    
    console.log('Desktop nav visible:', desktopNavVisible);
    console.log('Mobile nav visible:', mobileNavVisible);
    console.log('Toggle button visible:', toggleButtonVisible);
    
    // Get computed styles for the desktop navigation
    const desktopNavClasses = await desktopNav.getAttribute('class');
    console.log('Desktop nav classes:', desktopNavClasses);
    
    // Check if viewport is above md breakpoint (768px)
    if (viewportSize && viewportSize.width >= 768) {
      console.log('Expected: Desktop navigation should be visible');
      console.log('Expected: Toggle button should be hidden');
      
      // On desktop viewport, we expect desktop nav to be visible
      if (!desktopNavVisible) {
        console.log('❌ ISSUE: Desktop navigation is hidden on desktop viewport!');
        
        // Let's check CSS computed styles
        const displayStyle = await desktopNav.evaluate(el => 
          window.getComputedStyle(el).display
        );
        console.log('Desktop nav computed display:', displayStyle);
        
        // Check if CSS media queries are working
        const mediaQueryTest = await page.evaluate(() => {
          return window.matchMedia('(min-width: 768px)').matches;
        });
        console.log('Media query (min-width: 768px) matches:', mediaQueryTest);
      }
    } else {
      console.log('Expected: Mobile navigation with toggle button');
    }
    
    // Take screenshot for visual debugging
    await page.screenshot({ 
      path: 'test-results/header-responsive-debug.png',
      fullPage: false 
    });
  });
  
  test('should test navigation behavior at different viewport sizes', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 },
      { name: 'Large Desktop', width: 1920, height: 1080 },
    ];
    
    for (const viewport of viewports) {
      console.log(`\\n=== Testing ${viewport.name} (${viewport.width}x${viewport.height}) ===`);
      
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Navigate to preview site
      await page.goto('http://localhost:4323/en');
      await page.waitForLoadState('networkidle');
      
      // Check navigation visibility
      const desktopNav = page.locator('nav[data-nav="desktop"]');
      const toggleButton = page.locator('[data-aw-toggle-menu]');
      
      const desktopNavVisible = await desktopNav.isVisible();
      const toggleButtonVisible = await toggleButton.isVisible();
      
      console.log(`${viewport.name}: Desktop nav visible = ${desktopNavVisible}, Toggle visible = ${toggleButtonVisible}`);
      
      // Validate expected behavior
      if (viewport.width >= 768) {
        // Desktop/tablet - should show desktop nav, hide toggle
        expect(desktopNavVisible, `Desktop nav should be visible on ${viewport.name}`).toBe(true);
        expect(toggleButtonVisible, `Toggle should be hidden on ${viewport.name}`).toBe(false);
      } else {
        // Mobile - should hide desktop nav, show toggle
        expect(desktopNavVisible, `Desktop nav should be hidden on ${viewport.name}`).toBe(false);
        expect(toggleButtonVisible, `Toggle should be visible on ${viewport.name}`).toBe(true);
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: `test-results/header-${viewport.name.toLowerCase()}-${viewport.width}x${viewport.height}.png`,
        fullPage: false 
      });
    }
  });
});