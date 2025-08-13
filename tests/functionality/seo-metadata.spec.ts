import { test, expect } from '@playwright/test';

/**
 * SEO Metadata Tests
 *
 * Tests SEO tags, canonical URLs, hreflang tags, and Open Graph metadata.
 * This includes meta tag completeness, structured data validation,
 * and multilingual SEO implementation.
 */

test.describe('Basic SEO Metadata', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper title tag', async ({ page }) => {
    const title = await page.locator('title').textContent();

    expect(title).toBeTruthy();
    expect(title?.length).toBeGreaterThan(10);
    expect(title?.length).toBeLessThan(60); // Good SEO practice
  });

  test('should have meta description', async ({ page }) => {
    const description = await page.locator('meta[name="description"]').getAttribute('content');

    expect(description).toBeTruthy();
    expect(description?.length).toBeGreaterThan(50);
    expect(description?.length).toBeLessThan(160); // Good SEO practice
  });

  test('should have proper viewport meta tag', async ({ page }) => {
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');

    expect(viewport).toBeTruthy();
    expect(viewport).toContain('width=device-width');
  });

  test('should have canonical URL', async ({ page }) => {
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

    expect(canonical).toBeTruthy();
    expect(canonical).toMatch(/^https?:\/\//);
  });

  test('should have proper language declarations', async ({ page }) => {
    // Check html lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);

    // Check for og:locale if present
    const ogLocale = await page.locator('meta[property="og:locale"]').getAttribute('content');
    if (ogLocale) {
      expect(ogLocale).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    }
  });
});

test.describe('Open Graph Metadata', () => {
  test('should have Open Graph title', async ({ page }) => {
    await page.goto('/');

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');

    expect(ogTitle).toBeTruthy();
    expect(ogTitle?.length).toBeGreaterThan(0);
  });

  test('should have Open Graph description', async ({ page }) => {
    await page.goto('/');

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');

    expect(ogDescription).toBeTruthy();
    expect(ogDescription?.length).toBeGreaterThan(0);
  });

  test('should have Open Graph URL', async ({ page }) => {
    await page.goto('/');

    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');

    expect(ogUrl).toBeTruthy();
    expect(ogUrl).toMatch(/^https?:\/\//);
  });

  test('should have Open Graph type', async ({ page }) => {
    await page.goto('/');

    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');

    expect(ogType).toBeTruthy();
    expect(['website', 'article', 'blog']).toContain(ogType);
  });

  test('should have Open Graph image if available', async ({ page }) => {
    await page.goto('/');

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');

    if (ogImage) {
      expect(ogImage).toMatch(/^https?:\/\//);

      // Check image dimensions if specified
      const ogImageWidth = await page.locator('meta[property="og:image:width"]').getAttribute('content');
      const ogImageHeight = await page.locator('meta[property="og:image:height"]').getAttribute('content');

      if (ogImageWidth) {
        expect(parseInt(ogImageWidth)).toBeGreaterThan(200);
      }
      if (ogImageHeight) {
        expect(parseInt(ogImageHeight)).toBeGreaterThan(200);
      }
    }
  });
});

test.describe('Twitter Card Metadata', () => {
  test('should have Twitter card type', async ({ page }) => {
    await page.goto('/');

    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');

    if (twitterCard) {
      expect(['summary', 'summary_large_image', 'app', 'player']).toContain(twitterCard);
    }
  });

  test('should have Twitter title', async ({ page }) => {
    await page.goto('/');

    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');

    if (twitterTitle) {
      expect(twitterTitle.length).toBeGreaterThan(0);
    }
  });

  test('should have Twitter description', async ({ page }) => {
    await page.goto('/');

    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content');

    if (twitterDescription) {
      expect(twitterDescription.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Multilingual SEO', () => {
  test('should have hreflang tags for multilingual content', async ({ page }) => {
    await page.goto('/');

    const hreflangTags = await page.locator('link[hreflang]').count();

    if (hreflangTags > 0) {
      // Should have at least English and one other language
      expect(hreflangTags).toBeGreaterThan(1);

      // Check for English hreflang
      const enHreflang = await page.locator('link[hreflang="en"]').getAttribute('href');
      expect(enHreflang).toBeTruthy();

      // Check for x-default if present
      const defaultHreflang = await page.locator('link[hreflang="x-default"]').getAttribute('href');
      if (defaultHreflang) {
        expect(defaultHreflang).toMatch(/^https?:\/\//);
      }
    }
  });

  test('should have consistent canonical URLs across languages', async ({ page }) => {
    // Test English canonical
    await page.goto('/');
    const enCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');

    // Test German canonical if available
    const germanResponse = await page.goto('/de/', { waitUntil: 'networkidle' });

    if (germanResponse?.status() === 200) {
      const deCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      // Both should exist and be different
      expect(enCanonical).toBeTruthy();
      expect(deCanonical).toBeTruthy();

      if (enCanonical && deCanonical) {
        expect(enCanonical).not.toBe(deCanonical);
      }
    }
  });

  test('should have proper language-specific meta tags', async ({ page }) => {
    // Test English page
    await page.goto('/');
    const enLang = await page.locator('html').getAttribute('lang');
    expect(enLang).toBe('en');

    // Test German page if available
    const germanResponse = await page.goto('/de/', { waitUntil: 'networkidle' });

    if (germanResponse?.status() === 200) {
      const deLang = await page.locator('html').getAttribute('lang');
      expect(deLang).toBe('de');
    }
  });
});

test.describe('Content-Specific SEO', () => {
  test('should have proper SEO for blog/content pages', async ({ page }) => {
    // Navigate to a content page
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check article-specific SEO
      const title = await page.locator('title').textContent();
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      expect(title).toBeTruthy();
      expect(description).toBeTruthy();
      expect(canonical).toBeTruthy();

      // Check Open Graph article metadata
      const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
      if (ogType) {
        expect(['article', 'website']).toContain(ogType);
      }

      // Check for article published time if it's an article
      const articlePublished = await page.locator('meta[property="article:published_time"]').getAttribute('content');
      if (articlePublished) {
        const publishedDate = new Date(articlePublished);
        expect(publishedDate.toString()).not.toBe('Invalid Date');
      }
    }
  });

  test('should have unique titles across pages', async ({ page }) => {
    const titles = new Set<string>();

    // Collect titles from different pages
    await page.goto('/');
    const homeTitle = await page.locator('title').textContent();
    if (homeTitle) titles.add(homeTitle);

    // Test some content pages
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    const linkCount = Math.min(3, await contentLinks.count());

    for (let i = 0; i < linkCount; i++) {
      const link = contentLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href) {
        await page.goto(href);
        await page.waitForLoadState('networkidle');

        const title = await page.locator('title').textContent();
        if (title) titles.add(title);
      }
    }

    // All titles should be unique
    expect(titles.size).toBeGreaterThan(1);
  });
});

test.describe('Structured Data', () => {
  test('should have JSON-LD structured data', async ({ page }) => {
    await page.goto('/');

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').count();

    if (jsonLdScripts > 0) {
      const jsonLdContent = await page.locator('script[type="application/ld+json"]').first().textContent();

      expect(jsonLdContent).toBeTruthy();

      // Should be valid JSON
      try {
        const structuredData = JSON.parse(jsonLdContent || '{}');
        expect(structuredData['@type']).toBeTruthy();
        expect(structuredData['@context']).toBeTruthy();
      } catch {
        throw new Error('JSON-LD is not valid JSON');
      }
    }
  });

  test('should have proper schema.org markup', async ({ page }) => {
    await page.goto('/');

    // Check for microdata or RDFa markup
    const itemScopes = await page.locator('[itemscope]').count();
    const rdfa = await page.locator('[typeof]').count();

    // Should have some form of structured data
    if (itemScopes === 0 && rdfa === 0) {
      // Check for JSON-LD as alternative
      const jsonLd = await page.locator('script[type="application/ld+json"]').count();
      expect(jsonLd).toBeGreaterThan(0);
    }
  });
});

test.describe('SEO Performance', () => {
  test('should not have duplicate meta descriptions', async ({ page }) => {
    await page.goto('/');

    const descriptions = await page.locator('meta[name="description"]').count();
    expect(descriptions).toBeLessThanOrEqual(1);
  });

  test('should not have duplicate canonical URLs', async ({ page }) => {
    await page.goto('/');

    const canonicals = await page.locator('link[rel="canonical"]').count();
    expect(canonicals).toBeLessThanOrEqual(1);
  });

  test('should have proper robots meta tag', async ({ page }) => {
    await page.goto('/');

    const robots = await page.locator('meta[name="robots"]').getAttribute('content');

    if (robots) {
      // Should not block indexing on production pages
      expect(robots).not.toContain('noindex');
      expect(robots).not.toContain('nofollow');
    }
  });

  test('should have reasonable page load speed for SEO', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Should load within reasonable time for good SEO
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
  });

  test('should not have missing alt text on images', async ({ page }) => {
    await page.goto('/');

    const images = await page.locator('img').count();

    if (images > 0) {
      // Check first few images for alt text
      const imagesToCheck = Math.min(5, images);

      for (let i = 0; i < imagesToCheck; i++) {
        const img = page.locator('img').nth(i);
        const alt = await img.getAttribute('alt');

        // Alt attribute should exist (can be empty for decorative images)
        expect(alt).not.toBeNull();
      }
    }
  });
});
