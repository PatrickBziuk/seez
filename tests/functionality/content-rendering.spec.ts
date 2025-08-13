import { test, expect } from '@playwright/test';

/**
 * Content Rendering Tests
 *
 * Tests content page rendering across languages and collections.
 * This includes markdown rendering, component functionality,
 * and cross-collection consistency.
 */

test.describe('Content Collection Rendering', () => {
  test('should render books collection pages', async ({ page }) => {
    // Navigate to books collection
    const booksResponse = await page.goto('/books/', { waitUntil: 'networkidle' });

    if (booksResponse?.status() === 200) {
      // Check page structure
      await expect(page.locator('h1, h2, .page-title')).toBeVisible();

      // Should have content items
      const contentItems = page.locator('article, .content-item, .book-item, a[href*="/books/"]');
      expect(await contentItems.count()).toBeGreaterThan(0);

      // Test clicking on a book item
      if ((await contentItems.count()) > 0) {
        await contentItems.first().click();
        await page.waitForLoadState('networkidle');

        // Should navigate to individual book page
        await expect(page.locator('h1, h2, .content-title')).toBeVisible();
      }
    }
  });

  test('should render projects collection pages', async ({ page }) => {
    const projectsResponse = await page.goto('/projects/', { waitUntil: 'networkidle' });

    if (projectsResponse?.status() === 200) {
      // Check page structure
      await expect(page.locator('h1, h2, .page-title')).toBeVisible();

      // Should have project items
      const projectItems = page.locator('article, .content-item, .project-item, a[href*="/projects/"]');
      expect(await projectItems.count()).toBeGreaterThan(0);

      // Test project page navigation
      if ((await projectItems.count()) > 0) {
        await projectItems.first().click();
        await page.waitForLoadState('networkidle');

        await expect(page.locator('h1, h2, .content-title')).toBeVisible();
      }
    }
  });

  test('should render lab collection pages', async ({ page }) => {
    const labResponse = await page.goto('/lab/', { waitUntil: 'networkidle' });

    if (labResponse?.status() === 200) {
      await expect(page.locator('h1, h2, .page-title')).toBeVisible();

      const labItems = page.locator('article, .content-item, .lab-item, a[href*="/lab/"]');
      expect(await labItems.count()).toBeGreaterThan(0);
    }
  });

  test('should render life collection pages', async ({ page }) => {
    const lifeResponse = await page.goto('/life/', { waitUntil: 'networkidle' });

    if (lifeResponse?.status() === 200) {
      await expect(page.locator('h1, h2, .page-title')).toBeVisible();

      const lifeItems = page.locator('article, .content-item, .life-item, a[href*="/life/"]');
      expect(await lifeItems.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('Markdown Content Rendering', () => {
  test('should render headings properly', async ({ page }) => {
    // Find a content page to test
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    await page.goto('/');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check for proper heading hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      if ((await headings.count()) > 0) {
        // Should have at least one h1
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(1);

        // Headings should be visible
        await expect(headings.first()).toBeVisible();
      }
    }
  });

  test('should render paragraphs and text content', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Should have paragraph content
      const paragraphs = page.locator('p');
      if ((await paragraphs.count()) > 0) {
        await expect(paragraphs.first()).toBeVisible();

        // Paragraphs should have text content
        const firstParagraphText = await paragraphs.first().textContent();
        expect(firstParagraphText?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should render links properly', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check for content links
      const internalLinks = page.locator('main a, .content a, article a');

      if ((await internalLinks.count()) > 0) {
        // Links should be visible
        await expect(internalLinks.first()).toBeVisible();

        // Links should have href
        const href = await internalLinks.first().getAttribute('href');
        expect(href).toBeTruthy();
      }
    }
  });

  test('should render code blocks properly', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      // Check multiple content pages for code blocks
      for (let i = 0; i < Math.min(3, await contentLinks.count()); i++) {
        await contentLinks.nth(i).click();
        await page.waitForLoadState('networkidle');

        const codeBlocks = page.locator('pre, code, .code-block');

        if ((await codeBlocks.count()) > 0) {
          // Code blocks should be visible
          await expect(codeBlocks.first()).toBeVisible();

          // Should have monospace font
          const fontFamily = await codeBlocks.first().evaluate((el) => window.getComputedStyle(el).fontFamily);
          expect(fontFamily.toLowerCase()).toMatch(/mono|consolas|courier|fira|source/);

          break; // Found code blocks, exit loop
        }

        // Go back to try next link
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should render lists properly', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check for lists
      const lists = page.locator('ul, ol');

      if ((await lists.count()) > 0) {
        await expect(lists.first()).toBeVisible();

        // Lists should have list items
        const listItems = page.locator('li');
        expect(await listItems.count()).toBeGreaterThan(0);
        await expect(listItems.first()).toBeVisible();
      }
    }
  });
});

test.describe('Content Metadata Display', () => {
  test('should display publication date', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for date display
      const dateElements = page.locator('.date, .published, .timestamp, time, [datetime], .publication-date');

      if ((await dateElements.count()) > 0) {
        await expect(dateElements.first()).toBeVisible();

        const dateText = await dateElements.first().textContent();
        expect(dateText?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should display author information', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for author display
      const authorElements = page.locator('.author, .by-author, .written-by, [rel="author"]');

      if ((await authorElements.count()) > 0) {
        await expect(authorElements.first()).toBeVisible();
      }
    }
  });

  test('should display tags or categories', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for tags/categories
      const tagElements = page.locator('.tags, .categories, .tag, .category, .label, .badge');

      if ((await tagElements.count()) > 0) {
        await expect(tagElements.first()).toBeVisible();
      }
    }
  });

  test('should display reading time or word count', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for reading time indicators
      const readingTimeElements = page.locator('.reading-time, .read-time, .duration, .word-count, .time-to-read');

      if ((await readingTimeElements.count()) > 0) {
        await expect(readingTimeElements.first()).toBeVisible();

        const timeText = await readingTimeElements.first().textContent();
        expect(timeText).toMatch(/\d+\s*(min|minutes|words|tokens)/i);
      }
    }
  });
});

test.describe('Multilingual Content Rendering', () => {
  test('should render English content properly', async ({ page }) => {
    await page.goto('/');

    // Check main content area
    const contentArea = page.locator('main, .content, .page-content, article');
    await expect(contentArea).toBeVisible();

    // Check for English text indicators
    const englishText = await page.textContent('body');
    expect(englishText).toBeTruthy();
  });

  test('should render German content properly', async ({ page }) => {
    // Try to navigate to German version
    const germanResponse = await page.goto('/de/', { waitUntil: 'networkidle' });

    if (germanResponse?.status() === 200) {
      const contentArea = page.locator('main, .content, .page-content, article');
      await expect(contentArea).toBeVisible();

      // Check for German text
      const germanText = await page.textContent('body');
      expect(germanText).toBeTruthy();

      // HTML should have German lang attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe('de');
    }
  });

  test('should handle translation links properly', async ({ page }) => {
    await page.goto('/');

    // Look for translation links
    const translationLinks = page.locator('.translation-links, .language-versions, a[href*="/de/"], a[href*="/en/"]');

    if ((await translationLinks.count()) > 0) {
      const germanLink = page.locator('a[href*="/de/"]');

      if ((await germanLink.count()) > 0) {
        await germanLink.first().click();
        await page.waitForLoadState('networkidle');

        // Should navigate to German version
        expect(page.url()).toMatch(/\/de\//);
      }
    }
  });
});

test.describe('Content Layout and Typography', () => {
  test('should have readable typography', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check main content typography
      const mainContent = page.locator('main, .content, article');

      if ((await mainContent.count()) > 0) {
        const styles = await mainContent.first().evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            lineHeight: computed.lineHeight,
            fontFamily: computed.fontFamily,
          };
        });

        // Font size should be reasonable
        const fontSize = parseFloat(styles.fontSize);
        expect(fontSize).toBeGreaterThan(12);
        expect(fontSize).toBeLessThan(24);

        // Should have line height for readability
        expect(styles.lineHeight).toBeTruthy();
        expect(styles.fontFamily).toBeTruthy();
      }
    }
  });

  test('should have proper spacing and layout', async ({ page }) => {
    await page.goto('/');
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check for reasonable content width
      const contentWidth = await page.evaluate(() => {
        const content = document.querySelector('main, .content, article');
        return content ? content.getBoundingClientRect().width : 0;
      });

      // Content should not be too wide or too narrow
      expect(contentWidth).toBeGreaterThan(200);
      expect(contentWidth).toBeLessThan(1400);
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Content should still be readable on mobile
      const mainContent = page.locator('main, .content, article');
      await expect(mainContent).toBeVisible();

      // Should not have horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
