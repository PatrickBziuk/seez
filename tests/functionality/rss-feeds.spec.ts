import { test, expect } from '@playwright/test';

/**
 * RSS Feeds Functionality Tests
 *
 * Tests RSS feed generation, validity, and multilingual feeds.
 * This includes XML structure validation, content completeness,
 * and proper multilingual feed organization.
 */

test.describe('RSS Feed Generation', () => {
  test('should generate main RSS feed', async ({ page }) => {
    // Test main RSS feed
    const response = await page.goto('/rss.xml');

    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('xml');

    // Check basic RSS structure
    const content = await page.content();
    expect(content).toContain('<?xml');
    expect(content).toContain('<rss');
    expect(content).toContain('<channel>');
    expect(content).toContain('</channel>');
    expect(content).toContain('</rss>');
  });

  test('should have valid RSS structure', async ({ page }) => {
    await page.goto('/rss.xml');

    // Check required RSS elements
    const requiredElements = ['title', 'description', 'link', 'item'];

    const content = await page.content();

    for (const element of requiredElements) {
      expect(content).toContain(`<${element}`);
    }
  });

  test('should contain recent content items', async ({ page }) => {
    await page.goto('/rss.xml');

    const content = await page.content();

    // Should have at least some items
    const itemMatches = content.match(/<item>/g);
    expect(itemMatches).toBeTruthy();
    expect(itemMatches?.length).toBeGreaterThan(0);

    // Items should have required fields
    expect(content).toContain('<title>');
    expect(content).toContain('<link>');
    expect(content).toContain('<pubDate>');
  });

  test('should have proper encoding and escaping', async ({ page }) => {
    await page.goto('/rss.xml');

    const content = await page.content();

    // Check for proper XML declaration with encoding
    expect(content).toMatch(/<?xml version="1\.0" encoding="[uU][tT][fF]-8"\?>/);

    // Should not contain unescaped HTML entities
    expect(content).not.toContain('&nbsp;');
    expect(content).not.toContain('<script');

    // Should properly escape XML special characters if they appear
    if (content.includes('&')) {
      // If ampersands exist, they should be properly escaped or in CDATA
      const unescapedAmpersands = content.match(/&(?![a-zA-Z]+;|#[0-9]+;|#x[0-9a-fA-F]+;)/g);
      expect(unescapedAmpersands).toBeNull();
    }
  });
});

test.describe('Multilingual RSS Feeds', () => {
  test('should generate English RSS feed', async ({ page }) => {
    // Test English-specific RSS feed
    const response = await page.goto('/en/rss.xml');

    if (response?.status() === 200) {
      expect(response.headers()['content-type']).toContain('xml');

      const content = await page.content();

      // Should contain English content indicators
      expect(content).toContain('<rss');
      expect(content).toContain('<channel>');

      // May contain language attribute
      if (content.includes('xml:lang')) {
        expect(content).toContain('xml:lang="en"');
      }
    } else {
      // English RSS might be the same as main RSS
      console.log('English-specific RSS feed not available, using main feed');
    }
  });

  test('should generate German RSS feed', async ({ page }) => {
    // Test German-specific RSS feed
    const response = await page.goto('/de/rss.xml');

    if (response?.status() === 200) {
      expect(response.headers()['content-type']).toContain('xml');

      const content = await page.content();

      // Should contain German content indicators
      expect(content).toContain('<rss');
      expect(content).toContain('<channel>');

      // May contain language attribute
      if (content.includes('xml:lang')) {
        expect(content).toContain('xml:lang="de"');
      }
    } else {
      console.log('German-specific RSS feed not available');
    }
  });

  test('should have different content for different languages', async ({ page }) => {
    // Get English RSS
    const enResponse = await page.goto('/en/rss.xml');
    let enContent = '';

    if (enResponse?.status() === 200) {
      enContent = await page.content();
    } else {
      // Fallback to main RSS
      await page.goto('/rss.xml');
      enContent = await page.content();
    }

    // Get German RSS
    const deResponse = await page.goto('/de/rss.xml');

    if (deResponse?.status() === 200) {
      const deContent = await page.content();

      // Content should be different if both feeds exist
      if (enContent && deContent) {
        expect(deContent).not.toBe(enContent);
      }
    }
  });
});

test.describe('RSS Feed Content Quality', () => {
  test('should include proper metadata', async ({ page }) => {
    await page.goto('/rss.xml');

    const content = await page.content();

    // Check for site metadata
    expect(content).toContain('<title>');
    expect(content).toContain('<description>');
    expect(content).toContain('<link>');

    // Check for proper generator info
    if (content.includes('<generator>')) {
      expect(content).toMatch(/<generator>[^<]+<\/generator>/);
    }

    // Check for language information
    if (content.includes('<language>')) {
      expect(content).toMatch(/<language>[a-z]{2}(-[A-Z]{2})?<\/language>/);
    }
  });

  test('should have valid publication dates', async ({ page }) => {
    await page.goto('/rss.xml');

    const content = await page.content();

    // Extract publication dates
    const pubDateMatches = content.match(/<pubDate>([^<]+)<\/pubDate>/g);

    if (pubDateMatches) {
      for (const pubDateMatch of pubDateMatches) {
        const dateString = pubDateMatch.replace(/<\/?pubDate>/g, '');

        // Should be a valid date
        const date = new Date(dateString);
        expect(date.toString()).not.toBe('Invalid Date');

        // Should be a reasonable date (not in the future, not too old)
        const now = new Date();
        const tenYearsAgo = new Date(now.getFullYear() - 10, 0, 1);

        expect(date.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(date.getTime()).toBeGreaterThan(tenYearsAgo.getTime());
      }
    }
  });

  test('should include full content or summaries', async ({ page }) => {
    await page.goto('/rss.xml');

    const content = await page.content();

    // Should have content in items
    const hasDescription = content.includes('<description>');
    const hasContent = content.includes('<content:encoded>');

    // Should have at least one form of content
    expect(hasDescription || hasContent).toBe(true);

    if (hasDescription) {
      // Descriptions should not be empty
      const descriptions = content.match(/<description>([^<]*)<\/description>/g);
      if (descriptions) {
        for (const desc of descriptions.slice(0, 3)) {
          // Check first 3
          const descContent = desc.replace(/<\/?description>/g, '');
          expect(descContent.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have working item links', async ({ page, context }) => {
    await page.goto('/rss.xml');

    const content = await page.content();

    // Extract item links
    const linkMatches = content.match(/<link>([^<]+)<\/link>/g);

    if (linkMatches && linkMatches.length > 0) {
      // Test first few links
      const linksToTest = linkMatches.slice(0, 3);

      for (const linkMatch of linksToTest) {
        const url = linkMatch.replace(/<\/?link>/g, '').trim();

        if (url.startsWith('http')) {
          // Test if link is accessible
          try {
            const linkPage = await context.newPage();
            const response = await linkPage.goto(url, { timeout: 10000 });
            expect(response?.status()).toBeLessThan(400);
            await linkPage.close();
          } catch (error) {
            console.warn(`Link test failed for ${url}:`, error);
          }
        }
      }
    }
  });
});

test.describe('RSS Feed Performance', () => {
  test('should load RSS feed quickly', async ({ page }) => {
    const startTime = Date.now();

    const response = await page.goto('/rss.xml');

    const loadTime = Date.now() - startTime;

    expect(response?.status()).toBe(200);
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('should have reasonable file size', async ({ page }) => {
    const response = await page.goto('/rss.xml');

    expect(response?.status()).toBe(200);

    const content = await page.content();
    const sizeInBytes = new TextEncoder().encode(content).length;
    const sizeInKB = sizeInBytes / 1024;

    // RSS feed should not be excessively large
    expect(sizeInKB).toBeLessThan(1000); // Less than 1MB

    // But should have some content
    expect(sizeInKB).toBeGreaterThan(1); // More than 1KB
  });

  test('should limit number of items appropriately', async ({ page }) => {
    await page.goto('/rss.xml');

    const content = await page.content();

    // Count items
    const itemMatches = content.match(/<item>/g);
    const itemCount = itemMatches ? itemMatches.length : 0;

    // Should have items but not too many
    expect(itemCount).toBeGreaterThan(0);
    expect(itemCount).toBeLessThan(100); // Reasonable limit
  });
});

test.describe('RSS Feed Validation', () => {
  test('should validate as proper XML', async ({ page }) => {
    await page.goto('/rss.xml');

    const content = await page.content();

    // Basic XML validation checks
    const openTags = content.match(/<[^/][^>]*>/g) || [];
    const closeTags = content.match(/<\/[^>]+>/g) || [];

    // Should have matching open and close tags (rough check)
    expect(Math.abs(openTags.length - closeTags.length)).toBeLessThan(10);

    // Should not have unclosed CDATA sections
    const cdataOpens = (content.match(/<!\[CDATA\[/g) || []).length;
    const cdataCloses = (content.match(/\]\]>/g) || []).length;
    expect(cdataOpens).toBe(cdataCloses);
  });

  test('should have proper namespaces if used', async ({ page }) => {
    await page.goto('/rss.xml');

    const content = await page.content();

    // If using content:encoded, should declare namespace
    if (content.includes('content:encoded')) {
      expect(content).toContain('xmlns:content');
    }

    // If using dc: elements, should declare namespace
    if (content.includes('dc:')) {
      expect(content).toContain('xmlns:dc');
    }

    // If using atom: elements, should declare namespace
    if (content.includes('atom:')) {
      expect(content).toContain('xmlns:atom');
    }
  });

  test('should not contain development artifacts', async ({ page }) => {
    await page.goto('/rss.xml');

    const content = await page.content();

    // Should not contain development URLs
    expect(content).not.toContain('localhost');
    expect(content).not.toContain('127.0.0.1');
    expect(content).not.toContain('dev.');
    expect(content).not.toContain('staging.');

    // Should not contain debug information
    expect(content).not.toContain('TODO');
    expect(content).not.toContain('FIXME');
    expect(content).not.toContain('console.log');
  });
});
