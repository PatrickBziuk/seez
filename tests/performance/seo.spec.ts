import { test, expect } from '@playwright/test';

/**
 * SEO Monitoring Tests for Plan 10029
 * 
 * Comprehensive SEO validation to ensure search engine optimization
 * and compliance with SEO best practices across all pages.
 * 
 * Tests cover:
 * - Meta tags and OpenGraph
 * - Structured data
 * - URL structure
 * - Content optimization
 * - Technical SEO
 */

test.describe('Meta Tags and OpenGraph', () => {
  test('should have proper meta tags on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Title tag
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThan(60); // Google typically shows up to 60 chars
    
    // Meta description
    const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription!.length).toBeGreaterThan(50);
    expect(metaDescription!.length).toBeLessThan(160); // Google typically shows up to 160 chars
    
    // Canonical URL
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBeTruthy();
  });

  test('should have proper OpenGraph tags', async ({ page }) => {
    await page.goto('/');
    
    // OG title
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();
    
    // OG description
    const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
    expect(ogDescription).toBeTruthy();
    
    // OG type
    const ogType = await page.getAttribute('meta[property="og:type"]', 'content');
    expect(ogType).toBeTruthy();
    
    // OG URL
    const ogUrl = await page.getAttribute('meta[property="og:url"]', 'content');
    expect(ogUrl).toBeTruthy();
    expect(ogUrl).toMatch(/^https?:\/\//);
  });

  test('should have Twitter Card tags', async ({ page }) => {
    await page.goto('/');
    
    // Twitter card type
    const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content');
    expect(twitterCard).toBeTruthy();
    expect(['summary', 'summary_large_image', 'app', 'player']).toContain(twitterCard);
    
    // Twitter title
    const twitterTitle = await page.getAttribute('meta[name="twitter:title"]', 'content');
    expect(twitterTitle).toBeTruthy();
    
    // Twitter description
    const twitterDescription = await page.getAttribute('meta[name="twitter:description"]', 'content');
    expect(twitterDescription).toBeTruthy();
  });

  test('should have proper meta tags on content pages', async ({ page }) => {
    await page.goto('/en');
    
    const contentLinks = page.locator('a[href*="/en/books/"], a[href*="/en/projects/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // Title should be unique and descriptive
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);
      
      // Meta description should be unique
      const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription!.length).toBeGreaterThan(50);
      
      // Should have canonical URL
      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      expect(canonical).toBeTruthy();
      expect(canonical).toMatch(/^https?:\/\//);
    }
  });
});

test.describe('Structured Data', () => {
  test('should have valid JSON-LD structured data', async ({ page }) => {
    await page.goto('/');
    
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    
    if (await jsonLdScripts.count() > 0) {
      for (let i = 0; i < await jsonLdScripts.count(); i++) {
        const scriptContent = await jsonLdScripts.nth(i).textContent();
        
        if (scriptContent) {
          // Should be valid JSON
          expect(() => JSON.parse(scriptContent)).not.toThrow();
          
          const structuredData = JSON.parse(scriptContent);
          
          // Should have @context
          expect(structuredData['@context']).toBeTruthy();
          expect(structuredData['@context']).toMatch(/schema\.org/);
          
          // Should have @type
          expect(structuredData['@type']).toBeTruthy();
        }
      }
    }
  });

  test('should have appropriate structured data for content', async ({ page }) => {
    await page.goto('/en');
    
    const contentLinks = page.locator('a[href*="/en/books/"], a[href*="/en/projects/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      
      if (await jsonLdScripts.count() > 0) {
        const scriptContent = await jsonLdScripts.first().textContent();
        
        if (scriptContent) {
          const structuredData = JSON.parse(scriptContent);
          
          // Should be Article, BlogPosting, or similar content type
          const validTypes = ['Article', 'BlogPosting', 'TechArticle', 'Book', 'CreativeWork'];
          expect(validTypes).toContain(structuredData['@type']);
          
          // Should have required properties
          expect(structuredData.headline || structuredData.name).toBeTruthy();
          expect(structuredData.author || structuredData.creator).toBeTruthy();
        }
      }
    }
  });
});

test.describe('URL Structure and Navigation', () => {
  test('should have SEO-friendly URLs', async ({ page }) => {
    await page.goto('/en');
    
    const contentLinks = page.locator('a[href*="/en/"]');
    
    if (await contentLinks.count() > 0) {
      for (let i = 0; i < Math.min(5, await contentLinks.count()); i++) {
        const href = await contentLinks.nth(i).getAttribute('href');
        
        if (href) {
          // URLs should be lowercase
          expect(href).toBe(href.toLowerCase());
          
          // URLs should use hyphens instead of underscores
          expect(href).not.toMatch(/_/);
          
          // URLs should not be too long
          expect(href.length).toBeLessThan(100);
          
          // URLs should not have query parameters for content pages
          if (href.includes('/books/') || href.includes('/projects/')) {
            expect(href).not.toMatch(/\?/);
          }
        }
      }
    }
  });

  test('should have proper breadcrumb navigation', async ({ page }) => {
    await page.goto('/en');
    
    const contentLinks = page.locator('a[href*="/en/books/"], a[href*="/en/projects/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // Look for breadcrumb navigation
      const breadcrumbs = page.locator('nav[aria-label*="breadcrumb"], .breadcrumb, [role="navigation"] ol, [role="navigation"] ul');
      
      if (await breadcrumbs.count() > 0) {
        const breadcrumbLinks = breadcrumbs.first().locator('a');
        
        // Should have at least home link
        expect(await breadcrumbLinks.count()).toBeGreaterThanOrEqual(1);
        
        // Links should be accessible
        for (let i = 0; i < await breadcrumbLinks.count(); i++) {
          const linkText = await breadcrumbLinks.nth(i).textContent();
          expect(linkText?.trim()).toBeTruthy();
        }
      }
    }
  });

  test('should have proper language annotations', async ({ page }) => {
    await page.goto('/en');
    
    // Should have hreflang annotations
    const hreflangLinks = page.locator('link[rel="alternate"][hreflang]');
    
    if (await hreflangLinks.count() > 0) {
      for (let i = 0; i < await hreflangLinks.count(); i++) {
        const hreflang = await hreflangLinks.nth(i).getAttribute('hreflang');
        const href = await hreflangLinks.nth(i).getAttribute('href');
        
        expect(hreflang).toBeTruthy();
        expect(href).toBeTruthy();
        expect(href).toMatch(/^https?:\/\//);
        
        // Should have valid language codes
        expect(hreflang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
      }
    }
  });
});

test.describe('Content Optimization', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Should have exactly one H1
    const h1Elements = page.locator('h1');
    expect(await h1Elements.count()).toBe(1);
    
    const h1Text = await h1Elements.first().textContent();
    expect(h1Text?.trim()).toBeTruthy();
    expect(h1Text!.length).toBeGreaterThan(10);
    
    // Should not skip heading levels
    const h3Elements = page.locator('h3');
    const h2Elements = page.locator('h2');
    
    if (await h3Elements.count() > 0) {
      expect(await h2Elements.count()).toBeGreaterThan(0);
    }
  });

  test('should have optimized images for SEO', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    
    if (await images.count() > 0) {
      for (let i = 0; i < Math.min(5, await images.count()); i++) {
        const img = images.nth(i);
        
        // Should have alt text
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
        expect(alt!.length).toBeGreaterThan(3);
        expect(alt!.length).toBeLessThan(125); // Recommended length
        
        // Should not have generic alt text
        const genericAlts = ['image', 'photo', 'picture', 'img'];
        expect(genericAlts).not.toContain(alt!.toLowerCase());
        
        // Should have proper file format
        const src = await img.getAttribute('src');
        if (src) {
          expect(src).toMatch(/\.(jpg|jpeg|png|webp|avif|svg)(\?.*)?$/i);
        }
      }
    }
  });

  test('should have proper internal linking', async ({ page }) => {
    await page.goto('/');
    
    const internalLinks = page.locator('a[href^="/"], a[href*="localhost"], a[href*="127.0.0.1"]');
    
    if (await internalLinks.count() > 0) {
      for (let i = 0; i < Math.min(10, await internalLinks.count()); i++) {
        const link = internalLinks.nth(i);
        
        // Should have descriptive anchor text
        const linkText = await link.textContent();
        expect(linkText?.trim()).toBeTruthy();
        
        // Should not have generic link text
        const genericTexts = ['click here', 'here', 'read more', 'link'];
        expect(genericTexts).not.toContain(linkText!.toLowerCase().trim());
        
        // Should have valid href
        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).not.toBe('#');
      }
    }
  });
});

test.describe('Technical SEO', () => {
  test('should have proper robots meta tags', async ({ page }) => {
    await page.goto('/');
    
    const robotsMeta = await page.getAttribute('meta[name="robots"]', 'content');
    
    if (robotsMeta) {
      // Should allow indexing for public pages
      expect(robotsMeta.toLowerCase()).not.toContain('noindex');
      expect(robotsMeta.toLowerCase()).not.toContain('nofollow');
    }
  });

  test('should have valid robots.txt', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    
    if (response && response.status() === 200) {
      const robotsContent = await response.text();
      
      // Should have User-agent directive
      expect(robotsContent).toMatch(/User-agent:/i);
      
      // Should not disallow everything
      expect(robotsContent).not.toMatch(/Disallow:\s*\/\s*$/m);
      
      // Should have sitemap reference
      expect(robotsContent).toMatch(/Sitemap:/i);
    }
  });

  test('should have accessible sitemap', async ({ page }) => {
    const sitemapUrls = ['/sitemap.xml', '/sitemap_index.xml'];
    
    for (const sitemapUrl of sitemapUrls) {
      const response = await page.goto(sitemapUrl);
      
      if (response && response.status() === 200) {
        const sitemapContent = await response.text();
        
        // Should be valid XML
        expect(sitemapContent).toMatch(/<\?xml/);
        expect(sitemapContent).toMatch(/<urlset|<sitemapindex/);
        
        // Should have URLs
        expect(sitemapContent).toMatch(/<url>|<sitemap>/);
        
        break; // Found a valid sitemap
      }
    }
  });

  test('should have fast loading speed', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds for good SEO
    expect(loadTime).toBeLessThan(3000);
  });

  test('should be mobile-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Should have viewport meta tag
    const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
    expect(viewport).toBeTruthy();
    expect(viewport).toMatch(/width=device-width/i);
    
    // Should not have horizontal scrolling
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small tolerance
  });

  test('should use HTTPS', async ({ page }) => {
    const response = await page.goto('/');
    
    if (response) {
      const url = response.url();
      
      // Should use HTTPS in production
      if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
        expect(url).toMatch(/^https:/);
      }
    }
  });
});

test.describe('Multilingual SEO', () => {
  test('should have proper language tags for each language', async ({ page }) => {
    const languages = ['en', 'de'];
    
    for (const lang of languages) {
      await page.goto(`/${lang}`);
      
      // Should have correct lang attribute
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBe(lang);
      
      // Should have hreflang annotations
      const hreflangLinks = page.locator('link[rel="alternate"][hreflang]');
      
      if (await hreflangLinks.count() > 0) {
        const currentPageHreflang = page.locator(`link[rel="alternate"][hreflang="${lang}"]`);
        expect(await currentPageHreflang.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should have unique content per language', async ({ page }) => {
    const languages = ['en', 'de'];
    const contentTexts: string[] = [];
    
    for (const lang of languages) {
      await page.goto(`/${lang}`);
      
      const mainContent = page.locator('main, .content, #content');
      
      if (await mainContent.count() > 0) {
        const content = await mainContent.first().textContent();
        
        if (content) {
          const trimmedContent = content.trim().substring(0, 500);
          
          // Content should not be identical across languages
          expect(contentTexts).not.toContain(trimmedContent);
          contentTexts.push(trimmedContent);
        }
      }
    }
  });

  test('should have proper URL structure for multilingual content', async ({ page }) => {
    await page.goto('/en');
    
    const contentLinks = page.locator('a[href*="/en/books/"], a[href*="/en/projects/"]');
    
    if (await contentLinks.count() > 0) {
      const englishUrl = await contentLinks.first().getAttribute('href');
      
      if (englishUrl) {
        // Should have corresponding German URL
        const germanUrl = englishUrl.replace('/en/', '/de/');
        
        const response = await page.goto(germanUrl);
        
        if (response && response.status() === 200) {
          // German page should have proper language attributes
          const htmlLang = await page.getAttribute('html', 'lang');
          expect(htmlLang).toBe('de');
          
          // Should have hreflang pointing back to English
          const englishHreflang = page.locator(`link[rel="alternate"][hreflang="en"]`);
          expect(await englishHreflang.count()).toBeGreaterThan(0);
        }
      }
    }
  });
});
