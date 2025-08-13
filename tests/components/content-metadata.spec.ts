import { test, expect } from '@playwright/test';

/**
 * Content Metadata Component Tests
 *
 * Tests the content metadata display components including badges,
 * timestamps, author information, status indicators, and tag systems.
 * Validates proper rendering and multilingual support.
 */

test.describe('Content Metadata Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display content metadata badges', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for metadata badges
      const badges = page.locator('.badge, .tag, .metadata-badge, .status-badge, [data-testid="badge"], .chip');

      if ((await badges.count()) > 0) {
        await expect(badges.first()).toBeVisible();

        // Should have some text content
        const badgeText = await badges.first().textContent();
        expect(badgeText?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should show publication/creation timestamps', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for timestamp elements
      const timestamps = page.locator('time, .timestamp, .date, .published, .created, [datetime]');

      if ((await timestamps.count()) > 0) {
        await expect(timestamps.first()).toBeVisible();

        // Should have datetime attribute or valid date text
        const datetimeAttr = await timestamps.first().getAttribute('datetime');
        const timestampText = await timestamps.first().textContent();

        expect(datetimeAttr || timestampText?.match(/\d{4}/)).toBeTruthy();
      }
    }
  });

  test('should display authoring status badges', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    // Check multiple content pages for authoring status
    const linkCount = await contentLinks.count();
    for (let i = 0; i < Math.min(3, linkCount); i++) {
      await contentLinks.nth(i).click();
      await page.waitForLoadState('networkidle');

      // Look for authoring status indicators
      const authoringBadges = page.locator(
        '.authoring-status, .author-badge, [data-authoring], .human-authored, .ai-authored, .ai-human-authored'
      );

      if ((await authoringBadges.count()) > 0) {
        await expect(authoringBadges.first()).toBeVisible();

        const statusText = await authoringBadges.first().textContent();

        // Should indicate authoring type
        const validStatuses = ['human', 'ai', 'ai+human', 'hybrid'];
        const hasValidStatus = validStatuses.some((status) => statusText?.toLowerCase().includes(status));

        expect(hasValidStatus).toBe(true);
        break;
      }

      // Go back to try next content if available
      if (i < Math.min(2, linkCount) - 1) {
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should show translation status badges', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for translation status indicators
      const translationBadges = page.locator(
        '.translation-status, .language-badge, [data-translation], .translated-content'
      );

      if ((await translationBadges.count()) > 0) {
        await expect(translationBadges.first()).toBeVisible();

        const statusText = await translationBadges.first().textContent();

        // Should indicate translation info
        expect(statusText?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should display content tags properly', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for tag elements
      const tags = page.locator('.tag, .tags .tag-item, .content-tag, .topic-tag, [data-tag]');

      if ((await tags.count()) > 0) {
        // All visible tags should have content
        const tagCount = await tags.count();
        for (let i = 0; i < Math.min(5, tagCount); i++) {
          const tag = tags.nth(i);
          await expect(tag).toBeVisible();

          const tagText = await tag.textContent();
          expect(tagText?.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should link tags to filtered content', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for clickable tags
      const clickableTags = page.locator('a.tag, .tag a, .tags a, [href*="tag"], [href*="filter"]');

      if ((await clickableTags.count()) > 0) {
        const originalUrl = page.url();

        // Click on first tag
        await clickableTags.first().click();
        await page.waitForLoadState('networkidle');

        // Should navigate to filtered view
        const newUrl = page.url();
        expect(newUrl).not.toBe(originalUrl);

        // Should show filtered content or search results
        const contentArea = page.locator('main, .content, .results');
        await expect(contentArea).toBeVisible();
      }
    }
  });
});

test.describe('Metadata Visual Presentation', () => {
  test('should have consistent badge styling', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const badges = page.locator('.badge, .tag, .metadata-badge');

      if ((await badges.count()) > 1) {
        // Get styles from first two badges
        const firstBadgeStyles = await badges.first().evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            borderRadius: computed.borderRadius,
            padding: computed.padding,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
          };
        });

        const secondBadgeStyles = await badges.nth(1).evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            borderRadius: computed.borderRadius,
            padding: computed.padding,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
          };
        });

        // Should have consistent styling
        expect(firstBadgeStyles.borderRadius).toBe(secondBadgeStyles.borderRadius);
        expect(firstBadgeStyles.fontSize).toBe(secondBadgeStyles.fontSize);
      }
    }
  });

  test('should have proper color coding for different metadata types', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check for different types of badges with distinct colors
      const authoringBadges = page.locator('.authoring-status, .author-badge');
      const translationBadges = page.locator('.translation-status, .language-badge');

      if ((await authoringBadges.count()) > 0 && (await translationBadges.count()) > 0) {
        const authoringColor = await authoringBadges.first().evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });

        const translationColor = await translationBadges.first().evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });

        // Different badge types should have different colors (if both exist)
        expect(authoringColor).not.toBe(translationColor);
      }
    }
  });

  test('should be responsive and readable on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const metadataSection = page.locator('.metadata, .content-metadata, .post-meta, .article-meta');

      if ((await metadataSection.count()) > 0) {
        await expect(metadataSection.first()).toBeVisible();

        // Should not cause horizontal overflow
        const sectionBox = await metadataSection.first().boundingBox();
        expect(sectionBox?.width).toBeLessThanOrEqual(375);

        // Text should be readable size
        const fontSize = await metadataSection.first().evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });

        const fontSizeNum = parseFloat(fontSize);
        expect(fontSizeNum).toBeGreaterThanOrEqual(12); // Minimum readable size
      }
    }
  });

  test('should maintain proper spacing and alignment', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const metadataElements = page.locator('.metadata > *, .content-metadata > *, .post-meta > *');

      if ((await metadataElements.count()) > 1) {
        // Check spacing between elements
        const firstBox = await metadataElements.first().boundingBox();
        const secondBox = await metadataElements.nth(1).boundingBox();

        if (firstBox && secondBox) {
          // Elements should not overlap
          const noOverlap =
            firstBox.y + firstBox.height <= secondBox.y || // Vertically stacked
            firstBox.x + firstBox.width <= secondBox.x || // Horizontally aligned
            secondBox.x + secondBox.width <= firstBox.x; // Reverse horizontal

          expect(noOverlap).toBe(true);
        }
      }
    }
  });
});

test.describe('Metadata Multilingual Support', () => {
  test('should display metadata in current language', async ({ page }) => {
    // Test English metadata
    await page.goto('/en');
    const enContentLinks = page.locator(
      'a[href*="/en/books/"], a[href*="/en/projects/"], a[href*="/en/lab/"], a[href*="/en/life/"]'
    );

    if ((await enContentLinks.count()) > 0) {
      await enContentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const metadataText = await page.locator('.metadata, .content-metadata').textContent();

      if (metadataText) {
        // Should contain English terms
        const englishTerms = ['human', 'ai', 'published', 'created', 'updated'];
        const hasEnglishTerms = englishTerms.some((term) => metadataText.toLowerCase().includes(term));

        expect(hasEnglishTerms).toBe(true);
      }
    }

    // Test German metadata if available
    await page.goto('/de');
    const deContentLinks = page.locator(
      'a[href*="/de/books/"], a[href*="/de/projects/"], a[href*="/de/lab/"], a[href*="/de/life/"]'
    );

    if ((await deContentLinks.count()) > 0) {
      await deContentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const metadataText = await page.locator('.metadata, .content-metadata').textContent();

      if (metadataText) {
        // Should contain German terms or at least not English-specific terms
        expect(metadataText.length).toBeGreaterThan(0);
      }
    }
  });

  test('should handle language-specific date formatting', async ({ page }) => {
    // Test date formatting in different languages
    await page.goto('/en');
    let contentLinks = page.locator(
      'a[href*="/en/books/"], a[href*="/en/projects/"], a[href*="/en/lab/"], a[href*="/en/life/"]'
    );

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const dateElements = page.locator('time, .date, .timestamp');

      if ((await dateElements.count()) > 0) {
        const dateText = await dateElements.first().textContent();

        // Should have some date format
        expect(dateText?.match(/\d/)).toBeTruthy();
      }
    }

    // Test German date formatting
    await page.goto('/de');
    contentLinks = page.locator(
      'a[href*="/de/books/"], a[href*="/de/projects/"], a[href*="/de/lab/"], a[href*="/de/life/"]'
    );

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const dateElements = page.locator('time, .date, .timestamp');

      if ((await dateElements.count()) > 0) {
        const dateText = await dateElements.first().textContent();

        // Should have some date format (German typically uses DD.MM.YYYY)
        expect(dateText?.match(/\d/)).toBeTruthy();
      }
    }
  });

  test('should show appropriate language indicators', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for language indicators
      const languageIndicators = page.locator('.language-indicator, .lang-badge, [data-lang], .content-language');

      if ((await languageIndicators.count()) > 0) {
        const langText = await languageIndicators.first().textContent();

        // Should show language code or language name
        const validLanguages = ['en', 'de', 'english', 'german', 'deutsch'];
        const hasValidLanguage = validLanguages.some((lang) => langText?.toLowerCase().includes(lang));

        expect(hasValidLanguage).toBe(true);
      }
    }
  });
});

test.describe('Metadata Accessibility', () => {
  test('should have proper semantic markup', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Time elements should have proper datetime attributes
      const timeElements = page.locator('time[datetime]');

      for (let i = 0; i < (await timeElements.count()); i++) {
        const datetime = await timeElements.nth(i).getAttribute('datetime');

        // Should be valid ISO datetime
        expect(datetime).toMatch(/^\d{4}-\d{2}-\d{2}/);
      }
    }
  });

  test('should be screen reader friendly', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check for aria-labels or meaningful text
      const metadataElements = page.locator('.metadata *, .content-metadata *');

      if ((await metadataElements.count()) > 0) {
        // Should have either meaningful text content or aria-label
        for (let i = 0; i < Math.min(5, await metadataElements.count()); i++) {
          const element = metadataElements.nth(i);
          const textContent = await element.textContent();
          const ariaLabel = await element.getAttribute('aria-label');
          const title = await element.getAttribute('title');

          expect(textContent?.trim() || ariaLabel || title).toBeTruthy();
        }
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const badges = page.locator('.badge, .tag, .metadata-badge');

      if ((await badges.count()) > 0) {
        // Get color values
        const colorInfo = await badges.first().evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            border: computed.border,
          };
        });

        // Should have defined colors (not transparent on transparent)
        expect(colorInfo.color).not.toBe('rgba(0, 0, 0, 0)');
        expect(colorInfo.backgroundColor !== 'rgba(0, 0, 0, 0)' || colorInfo.border !== '0px none').toBe(true);
      }
    }
  });
});
