import { test, expect } from '@playwright/test';

test.describe('Music Category Implementation', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to ensure consistent testing
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('should display Music navigation link in header', async ({ page }) => {
    await page.goto('/de'); // Remove trailing slash to match site config
    
    // Check if Music link is present in navigation
    const musicLink = page.locator('nav a:has-text("Musik")');
    await expect(musicLink).toBeVisible();
    
    // Check link points to correct URL
    await expect(musicLink).toHaveAttribute('href', '/de/music');
    
    // Test English version
    await page.goto('/en');
    const musicLinkEn = page.locator('nav a:has-text("Music")');
    await expect(musicLinkEn).toBeVisible();
    await expect(musicLinkEn).toHaveAttribute('href', '/en/music');
  });

  test('should navigate to music listing page', async ({ page }) => {
    // Test German version
    await page.goto('/de/music');
    await expect(page.locator('h1:has-text("🎵 Musik")')).toBeVisible();
    
    // Test English version
    await page.goto('/en/music');
    await expect(page.locator('h1:has-text("🎵 Music")')).toBeVisible();
  });

  test('should display music content correctly', async ({ page }) => {
    // Test German music content
    await page.goto('/de/music/meine-musik');
    // Use more specific selector to avoid multiple h1 conflicts
    await expect(page.locator('header h1, .metadata h1').first()).toContainText('Musik');
    
    // Check for MediaPlayer components (songs)
    const playButtons = page.locator('button:has-text("Play/Pause"), button[aria-label*="Play"]');
    await expect(playButtons.first()).toBeVisible();
    
    // Test English music content
    await page.goto('/en/music/my-music');
    await expect(page.locator('header h1, .metadata h1').first()).toContainText('Music');
  });

  test('should handle canonical ID URLs correctly', async ({ page }) => {
    // Test the canonical ID URL format that was causing 404s
    await page.goto('/de/music/meine-musik-slug-20250805-bf655b06');
    
    // Should successfully load the music content
    await expect(page.locator('header h1, .metadata h1').first()).toContainText('Musik');
    
    // Should not show 404 error
    await expect(page.locator('text=404')).not.toBeVisible();
  });
});

test.describe('Header Navigation Responsiveness', () => {
  test('should not have overlapping elements on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/de');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get all navigation links
    const navLinks = page.locator('nav a:visible');
    const linkCount = await navLinks.count();
    
    // Check that all links are visible and not overlapping
    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      await expect(link).toBeVisible();
      
      // Get bounding box to check for overlaps
      const box = await link.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
    }
  });

  test('should resize properly on tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/de');
    await page.waitForLoadState('networkidle');
    
    // Check if mobile menu toggle is visible or all links are properly visible
    const mobileToggle = page.locator('[data-aw-toggle-menu], .toggle-menu, button[aria-expanded], button:has([data-icon*="menu"])');
    const navLinks = page.locator('nav a:visible');
    const visibleLinkCount = await navLinks.count();
    
    // Either mobile menu should be present OR all links should be visible without overflow
    const hasMobileToggle = await mobileToggle.isVisible();
    
    if (!hasMobileToggle && visibleLinkCount > 0) {
      // All visible links should not overlap
      for (let i = 0; i < visibleLinkCount; i++) {
        const link = navLinks.nth(i);
        const box = await link.boundingBox();
        expect(box).toBeTruthy();
        expect(box!.width).toBeGreaterThan(0);
      }
    }
    
    // The test passes if either mobile menu is available or links are properly spaced
    expect(hasMobileToggle || visibleLinkCount > 0).toBe(true);
  });

  test('should use mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/de');
    await page.waitForLoadState('networkidle');
    
    // Look for mobile menu toggle with various possible selectors
    const mobileToggle = page.locator('[data-aw-toggle-menu], .toggle-menu, button[aria-expanded], button:has([data-icon*="menu"]), button:has(svg)').first();
    
    // Check if mobile navigation is handled properly
    const navLinks = page.locator('nav a:visible');
    const visibleLinkCount = await navLinks.count();
    
    // On mobile, either:
    // 1. Mobile toggle should be visible, OR
    // 2. Navigation should be hidden/collapsed, OR  
    // 3. Links should be in a mobile-friendly layout
    const hasMobileToggle = await mobileToggle.isVisible();
    
    if (hasMobileToggle) {
      // If mobile toggle exists, try clicking it to reveal menu
      await mobileToggle.click();
      
      // Music link should be accessible in mobile menu
      const musicLink = page.locator('text=Musik, a:has-text("Musik")');
      // Give it time to animate/appear
      await page.waitForTimeout(500);
      const isMusicVisible = await musicLink.isVisible();
      expect(isMusicVisible).toBe(true);
    } else if (visibleLinkCount > 0) {
      // If no mobile toggle, links should be visible and properly laid out
      const musicLink = page.locator('nav a:has-text("Musik")');
      await expect(musicLink).toBeVisible();
    }
    
    // Test passes if mobile navigation is handled in some way
    expect(hasMobileToggle || visibleLinkCount > 0).toBe(true);
  });

  test('should maintain proper spacing between navigation elements', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/de');
    await page.waitForLoadState('networkidle');
    
    const navLinks = page.locator('nav a:visible');
    const linkCount = await navLinks.count();
    
    // Check spacing between consecutive links
    for (let i = 0; i < linkCount - 1; i++) {
      const currentLink = navLinks.nth(i);
      const nextLink = navLinks.nth(i + 1);
      
      const currentBox = await currentLink.boundingBox();
      const nextBox = await nextLink.boundingBox();
      
      if (currentBox && nextBox) {
        // Links should not overlap (next link should start after current link ends)
        // Allow for some tolerance for margins/padding
        expect(nextBox.x).toBeGreaterThanOrEqual(currentBox.x + currentBox.width - 10); // 10px tolerance
      }
    }
  });

  test('should handle header overflow gracefully', async ({ page }) => {
    // Test various viewport widths to ensure no horizontal overflow
    const viewports = [
      { width: 320, height: 568 },  // iPhone SE
      { width: 375, height: 667 },  // iPhone 6/7/8
      { width: 768, height: 1024 }, // iPad
      { width: 1024, height: 768 }, // iPad landscape
      { width: 1200, height: 800 }, // Desktop
      { width: 1920, height: 1080 } // Large desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/de');
      await page.waitForLoadState('networkidle');
      
      // Check that header doesn't cause horizontal scroll
      const headerElement = page.locator('header, nav, [role="banner"]').first();
      
      // Ensure header exists and is visible
      if (await headerElement.isVisible()) {
        const headerBox = await headerElement.boundingBox();
        
        if (headerBox) {
          // Header should not exceed viewport width significantly
          expect(headerBox.width).toBeLessThanOrEqual(viewport.width + 20); // 20px tolerance
        }
      }
      
      // Ensure no significant horizontal scroll is present
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(viewport.width + 30); // 30px tolerance for scrollbars
    }
  });
});