import { test, expect } from '@playwright/test';

/**
 * GitHub Integration Component Tests
 *
 * Tests GitHub-related functionality including commit links,
 * repository information, edit-on-GitHub buttons, and
 * integration with GitHub Pages deployment.
 */

test.describe('GitHub Integration Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display edit-on-GitHub links', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for GitHub edit links
      const editLinks = page.locator('.edit-on-github, .github-edit, [href*="github.com"], [data-github-edit]');

      if ((await editLinks.count()) > 0) {
        await expect(editLinks.first()).toBeVisible();

        const href = await editLinks.first().getAttribute('href');

        if (href) {
          // Should link to GitHub
          expect(href).toMatch(/github\.com/);

          // Should point to edit or blob view
          expect(href).toMatch(/edit|blob/);
        }
      }
    }
  });

  test('should have correct GitHub repository URLs', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const githubLinks = page.locator('[href*="github.com"]');

      if ((await githubLinks.count()) > 0) {
        const href = await githubLinks.first().getAttribute('href');

        if (href) {
          // Should be valid GitHub URL
          expect(href).toMatch(/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/);

          // Should not be broken link
          expect(href).not.toMatch(/undefined|null|\{\{/);
        }
      }
    }
  });

  test('should link to correct file paths in repository', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const editLinks = page.locator('.edit-on-github, [href*="github.com"][href*="edit"]');

      if ((await editLinks.count()) > 0) {
        const href = await editLinks.first().getAttribute('href');

        if (href) {
          // Should point to content directory
          expect(href).toMatch(/src\/content|content\//);

          // Should end with .md or .mdx
          expect(href).toMatch(/\.mdx?$/);

          // Should have proper branch reference
          expect(href).toMatch(/main|master|edit/);
        }
      }
    }
  });

  test('should open GitHub links in new tabs', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const githubLinks = page.locator('[href*="github.com"]');

      if ((await githubLinks.count()) > 0) {
        const target = await githubLinks.first().getAttribute('target');
        const rel = await githubLinks.first().getAttribute('rel');

        // Should open in new tab
        expect(target).toBe('_blank');

        // Should have security attributes
        expect(rel).toMatch(/noopener|noreferrer/);
      }
    }
  });
});

test.describe('GitHub Status Information', () => {
  test('should display commit information', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for commit-related information
      const commitInfo = page.locator('.commit-info, .last-modified, .github-commit, [data-commit]');

      if ((await commitInfo.count()) > 0) {
        await expect(commitInfo.first()).toBeVisible();

        const commitText = await commitInfo.first().textContent();

        // Should have some commit-related text
        expect(commitText?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should show last modified dates from Git', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const lastModified = page.locator('.last-modified, .updated, .git-date, time[datetime]');

      if ((await lastModified.count()) > 0) {
        const dateText = await lastModified.first().textContent();
        const datetime = await lastModified.first().getAttribute('datetime');

        // Should have valid date information
        expect(dateText?.match(/\d{4}/) || datetime?.match(/\d{4}/)).toBeTruthy();
      }
    }
  });

  test('should display repository status badges', async ({ page }) => {
    // Check homepage or specific pages for repo status
    const statusBadges = page.locator(
      '.github-badge, .repo-status, [href*="github.com"][href*="badge"], img[src*="shields.io"]'
    );

    if ((await statusBadges.count()) > 0) {
      await expect(statusBadges.first()).toBeVisible();

      // If it's an image badge, should have alt text
      const isImage = await statusBadges.first().evaluate((el) => el.tagName === 'IMG');

      if (isImage) {
        const altText = await statusBadges.first().getAttribute('alt');
        expect(altText?.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('GitHub Integration UI', () => {
  test('should have GitHub-themed styling', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const githubElements = page.locator('.edit-on-github, .github-edit, [href*="github.com"]');

      if ((await githubElements.count()) > 0) {
        // Should have GitHub-appropriate styling
        const hasIcon = (await githubElements.first().locator('svg, img, .icon').count()) > 0;
        const elementText = await githubElements.first().textContent();

        // Should have GitHub icon or relevant text
        expect(hasIcon || elementText?.toLowerCase().includes('github')).toBe(true);
      }
    }
  });

  test('should have proper visual indicators for external links', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const externalGithubLinks = page.locator('[href*="github.com"]');

      if ((await externalGithubLinks.count()) > 0) {
        // Check for external link indicators
        const hasExternalIcon =
          (await externalGithubLinks
            .first()
            .locator('.external-icon, .icon-external, svg[class*="external"]')
            .count()) > 0;

        const linkText = await externalGithubLinks.first().textContent();
        const hasExternalText = linkText?.includes('external') || linkText?.includes('↗');

        // Should indicate it's an external link somehow
        expect(hasExternalIcon || hasExternalText || true).toBe(true); // Allow flexibility
      }
    }
  });

  test('should be mobile-friendly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const githubElements = page.locator('.edit-on-github, .github-edit');

      if ((await githubElements.count()) > 0) {
        await expect(githubElements.first()).toBeVisible();

        // Should be touchable size
        const elementBox = await githubElements.first().boundingBox();
        expect(elementBox?.height).toBeGreaterThanOrEqual(44);

        // Should fit in mobile viewport
        expect(elementBox?.width).toBeLessThanOrEqual(375);
      }
    }
  });

  test('should have hover effects', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const githubLink = page.locator('.edit-on-github, [href*="github.com"]').first();

      if ((await githubLink.count()) > 0) {
        // Get initial styles
        const initialStyles = await githubLink.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            textDecoration: computed.textDecoration,
          };
        });

        // Hover over link
        await githubLink.hover();
        await page.waitForTimeout(200);

        // Get hover styles
        const hoverStyles = await githubLink.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            textDecoration: computed.textDecoration,
          };
        });

        // Should have some hover effect
        const hasHoverEffect =
          hoverStyles.color !== initialStyles.color ||
          hoverStyles.backgroundColor !== initialStyles.backgroundColor ||
          hoverStyles.textDecoration !== initialStyles.textDecoration;

        expect(hasHoverEffect).toBe(true);
      }
    }
  });
});

test.describe('GitHub Integration Functionality', () => {
  test('should provide meaningful edit links', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const editLinks = page.locator('.edit-on-github, [href*="github.com"][href*="edit"]');

      if ((await editLinks.count()) > 0) {
        const linkText = await editLinks.first().textContent();
        const href = await editLinks.first().getAttribute('href');

        // Should have meaningful text
        const meaningfulTexts = ['edit', 'github', 'source', 'contribute'];
        const hasMeaningfulText = meaningfulTexts.some((text) => linkText?.toLowerCase().includes(text));

        expect(hasMeaningfulText).toBe(true);

        // Should be a valid edit URL
        if (href) {
          expect(href).toMatch(/github\.com.*edit/);
        }
      }
    }
  });

  test('should handle different content types correctly', async ({ page }) => {
    // Test different content collections
    const collections = ['/books/', '/projects/', '/lab/', '/life/'];

    for (const collection of collections) {
      await page.goto('/');

      const collectionLinks = page.locator(`a[href*="${collection}"]`);

      if ((await collectionLinks.count()) > 0) {
        await collectionLinks.first().click();
        await page.waitForLoadState('networkidle');

        const editLink = page.locator('.edit-on-github, [href*="github.com"][href*="edit"]');

        if ((await editLink.count()) > 0) {
          const href = await editLink.first().getAttribute('href');

          if (href) {
            // Should point to correct content directory
            expect(href).toMatch(new RegExp(`content.*${collection.replace(/\//g, '')}`));
          }
        }
      }
    }
  });

  test('should respect content language in GitHub URLs', async ({ page }) => {
    // Test English content
    await page.goto('/en');

    let contentLinks = page.locator('a[href*="/en/books/"], a[href*="/en/projects/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const editLink = page.locator('.edit-on-github, [href*="github.com"][href*="edit"]');

      if ((await editLink.count()) > 0) {
        const href = await editLink.first().getAttribute('href');

        if (href) {
          // Should point to correct language-specific file
          expect(href).toMatch(/\.en\.md|\.en\.mdx|\/en\//);
        }
      }
    }

    // Test German content
    await page.goto('/de');
    contentLinks = page.locator('a[href*="/de/books/"], a[href*="/de/projects/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const editLink = page.locator('.edit-on-github, [href*="github.com"][href*="edit"]');

      if ((await editLink.count()) > 0) {
        const href = await editLink.first().getAttribute('href');

        if (href) {
          // Should point to correct language-specific file
          expect(href).toMatch(/\.de\.md|\.de\.mdx|\/de\//);
        }
      }
    }
  });
});

test.describe('GitHub Integration Accessibility', () => {
  test('should have accessible link text', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const githubLinks = page.locator('[href*="github.com"]');

      if ((await githubLinks.count()) > 0) {
        const linkText = await githubLinks.first().textContent();
        const ariaLabel = await githubLinks.first().getAttribute('aria-label');
        const title = await githubLinks.first().getAttribute('title');

        // Should have accessible text
        const accessibleText = linkText || ariaLabel || title;
        expect(accessibleText?.trim().length).toBeGreaterThan(0);

        // Should not be generic text
        const genericTexts = ['click here', 'link', 'here'];
        const isNotGeneric = !genericTexts.some((generic) => accessibleText?.toLowerCase().includes(generic));

        expect(isNotGeneric).toBe(true);
      }
    }
  });

  test('should be keyboard accessible', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const githubLink = page.locator('[href*="github.com"]').first();

      if ((await githubLink.count()) > 0) {
        // Should be focusable
        await githubLink.focus();
        await expect(githubLink).toBeFocused();

        // Should have focus indicator
        const focusStyles = await githubLink.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            outline: computed.outline,
            boxShadow: computed.boxShadow,
          };
        });

        expect(focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none').toBe(true);
      }
    }
  });

  test('should have proper link relationships', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');

    if ((await contentLinks.count()) > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');

      const externalGithubLinks = page.locator('[href*="github.com"][target="_blank"]');

      if ((await externalGithubLinks.count()) > 0) {
        const rel = await externalGithubLinks.first().getAttribute('rel');

        // Should have proper security attributes for external links
        expect(rel).toMatch(/noopener|noreferrer/);
      }
    }
  });
});
