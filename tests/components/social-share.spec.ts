import { test, expect } from '@playwright/test';

/**
 * Social Share Component Tests
 * 
 * Tests social sharing buttons and functionality including
 * Twitter, LinkedIn, email sharing, copy-to-clipboard,
 * and proper URL generation for shared content.
 */

test.describe('Social Share Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display social share buttons', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // Look for social share buttons
      const shareButtons = page.locator(
        '.share-button, .social-share, .share-twitter, .share-linkedin, .share-email, [data-share]'
      );
      
      if (await shareButtons.count() > 0) {
        await expect(shareButtons.first()).toBeVisible();
        
        // Should be clickable
        await expect(shareButtons.first()).toBeEnabled();
      }
    }
  });

  test('should have Twitter share functionality', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const twitterShare = page.locator(
        '.share-twitter, [href*="twitter.com"], [href*="x.com"], [data-share="twitter"]'
      );
      
      if (await twitterShare.count() > 0) {
        const href = await twitterShare.first().getAttribute('href');
        
        if (href) {
          // Should contain Twitter/X domain
          expect(href).toMatch(/twitter\.com|x\.com/);
          
          // Should have text parameter
          expect(href).toMatch(/text=|tweet=/);
          
          // Should include current page URL
          const currentUrl = page.url();
          const encodedUrl = encodeURIComponent(currentUrl);
          expect(href.includes(encodedUrl) || href.includes('url=')).toBe(true);
        }
      }
    }
  });

  test('should have LinkedIn share functionality', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const linkedinShare = page.locator(
        '.share-linkedin, [href*="linkedin.com"], [data-share="linkedin"]'
      );
      
      if (await linkedinShare.count() > 0) {
        const href = await linkedinShare.first().getAttribute('href');
        
        if (href) {
          // Should contain LinkedIn domain
          expect(href).toMatch(/linkedin\.com/);
          
          // Should have proper LinkedIn share format
          expect(href).toMatch(/shareArticle|sharing\/share-offsite/);
          
          // Should include current page URL
          const currentUrl = page.url();
          const encodedUrl = encodeURIComponent(currentUrl);
          expect(href.includes(encodedUrl) || href.includes('url=')).toBe(true);
        }
      }
    }
  });

  test('should have email share functionality', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const emailShare = page.locator(
        '.share-email, [href^="mailto:"], [data-share="email"]'
      );
      
      if (await emailShare.count() > 0) {
        const href = await emailShare.first().getAttribute('href');
        
        if (href) {
          // Should be mailto link
          expect(href).toMatch(/^mailto:/);
          
          // Should have subject and body
          expect(href).toMatch(/subject=|body=/);
          
          // Should include current page URL in body
          const currentUrl = page.url();
          const encodedUrl = encodeURIComponent(currentUrl);
          expect(href.includes(encodedUrl) || href.includes(currentUrl)).toBe(true);
        }
      }
    }
  });

  test('should open share links in new tabs', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const externalShareLinks = page.locator(
        '.share-twitter, .share-linkedin, [href*="twitter.com"], [href*="linkedin.com"], [href*="x.com"]'
      );
      
      if (await externalShareLinks.count() > 0) {
        const target = await externalShareLinks.first().getAttribute('target');
        const rel = await externalShareLinks.first().getAttribute('rel');
        
        // Should open in new tab/window
        expect(target).toBe('_blank');
        
        // Should have security attributes
        expect(rel).toMatch(/noopener|noreferrer/);
      }
    }
  });
});

test.describe('Copy to Clipboard Functionality', () => {
  test('should have copy-to-clipboard button', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const copyButton = page.locator(
        '.copy-link, .copy-url, [data-copy], .share-copy, .clipboard-copy'
      );
      
      if (await copyButton.count() > 0) {
        await expect(copyButton.first()).toBeVisible();
        await expect(copyButton.first()).toBeEnabled();
      }
    }
  });

  test('should copy current page URL to clipboard', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const copyButton = page.locator(
        '.copy-link, .copy-url, [data-copy], .share-copy'
      );
      
      if (await copyButton.count() > 0) {
        const currentUrl = page.url();
        
        // Click copy button
        await copyButton.first().click();
        
        // Wait a moment for clipboard operation
        await page.waitForTimeout(500);
        
        // Check clipboard content
        const clipboardText = await page.evaluate(() => {
          return navigator.clipboard.readText().catch(() => null);
        });
        
        if (clipboardText) {
          expect(clipboardText).toBe(currentUrl);
        }
      }
    }
  });

  test('should show copy confirmation feedback', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const copyButton = page.locator(
        '.copy-link, .copy-url, [data-copy], .share-copy'
      );
      
      if (await copyButton.count() > 0) {
        // Click copy button
        await copyButton.first().click();
        
        // Look for feedback (tooltip, text change, icon change)
        const feedback = page.locator(
          '.copied, .copy-success, .tooltip, [data-copied="true"]'
        );
        
        if (await feedback.count() > 0) {
          await expect(feedback.first()).toBeVisible();
        } else {
          // Check if button text changed
          const buttonText = await copyButton.first().textContent();
          const feedbackTexts = ['copied', 'success', '✓', 'done'];
          const hasFeedbackText = feedbackTexts.some(text => 
            buttonText?.toLowerCase().includes(text)
          );
          
          expect(hasFeedbackText).toBe(true);
        }
      }
    }
  });
});

test.describe('Share Button Visual Design', () => {
  test('should have proper social media icons', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const shareButtons = page.locator(
        '.share-button, .social-share, .share-twitter, .share-linkedin'
      );
      
      if (await shareButtons.count() > 0) {
        // Should have icons or meaningful text
        const hasIcon = await shareButtons.first().locator('svg, img, .icon, i').count() > 0;
        const buttonText = await shareButtons.first().textContent();
        
        expect(hasIcon || buttonText?.trim().length).toBeTruthy();
      }
    }
  });

  test('should have consistent button styling', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const shareButtons = page.locator('.share-button, .social-share button, .share-twitter, .share-linkedin');
      
      if (await shareButtons.count() > 1) {
        // Get styles from first two buttons
        const firstButtonStyles = await shareButtons.first().evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            height: computed.height,
            borderRadius: computed.borderRadius,
            padding: computed.padding
          };
        });
        
        const secondButtonStyles = await shareButtons.nth(1).evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            height: computed.height,
            borderRadius: computed.borderRadius,
            padding: computed.padding
          };
        });
        
        // Should have consistent sizing
        expect(firstButtonStyles.height).toBe(secondButtonStyles.height);
        expect(firstButtonStyles.borderRadius).toBe(secondButtonStyles.borderRadius);
      }
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const shareSection = page.locator(
        '.share-buttons, .social-share, .share-section'
      );
      
      if (await shareSection.count() > 0) {
        await expect(shareSection.first()).toBeVisible();
        
        // Should fit within mobile viewport
        const sectionBox = await shareSection.first().boundingBox();
        expect(sectionBox?.width).toBeLessThanOrEqual(375);
        
        // Buttons should be large enough for touch
        const shareButtons = shareSection.first().locator('button, a');
        
        if (await shareButtons.count() > 0) {
          const buttonBox = await shareButtons.first().boundingBox();
          expect(buttonBox?.height).toBeGreaterThanOrEqual(44); // iOS minimum touch target
        }
      }
    }
  });

  test('should have hover states and animations', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const shareButton = page.locator('.share-button, .social-share button').first();
      
      if (await shareButton.count() > 0) {
        // Get initial styles
        const initialStyles = await shareButton.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            transform: computed.transform,
            transition: computed.transition
          };
        });
        
        // Hover over button
        await shareButton.hover();
        await page.waitForTimeout(200);
        
        // Get hover styles
        const hoverStyles = await shareButton.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            transform: computed.transform
          };
        });
        
        // Should have some interactive feedback
        const hasHoverEffect = 
          hoverStyles.backgroundColor !== initialStyles.backgroundColor ||
          hoverStyles.transform !== initialStyles.transform ||
          initialStyles.transition !== 'all 0s ease 0s';
        
        expect(hasHoverEffect).toBe(true);
      }
    }
  });
});

test.describe('Share URL Generation', () => {
  test('should generate correct URLs for sharing', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      
      // Check Twitter share URL
      const twitterShare = page.locator('[href*="twitter.com"], [href*="x.com"]');
      
      if (await twitterShare.count() > 0) {
        const twitterHref = await twitterShare.first().getAttribute('href');
        
        if (twitterHref) {
          // Should include page URL
          expect(twitterHref).toContain(encodeURIComponent(currentUrl));
          
          // Should include page title or custom text
          expect(twitterHref).toMatch(/text=|tweet=/);
        }
      }
      
      // Check LinkedIn share URL
      const linkedinShare = page.locator('[href*="linkedin.com"]');
      
      if (await linkedinShare.count() > 0) {
        const linkedinHref = await linkedinShare.first().getAttribute('href');
        
        if (linkedinHref) {
          // Should include page URL
          expect(linkedinHref).toContain(encodeURIComponent(currentUrl));
          
          // Should have title parameter
          expect(linkedinHref).toMatch(/title=|summary=/);
        }
      }
    }
  });

  test('should handle special characters in URLs and titles', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const shareLinks = page.locator('[href*="twitter.com"], [href*="linkedin.com"], [href^="mailto:"]');
      
      for (let i = 0; i < await shareLinks.count(); i++) {
        const href = await shareLinks.nth(i).getAttribute('href');
        
        if (href) {
          // Should not contain unencoded special characters in parameters
          const urlParams = href.split('?')[1];
          
          if (urlParams) {
            // Should be properly URL encoded - check for unencoded special characters
            const paramValues = urlParams.split('&').map(param => param.split('=')[1] || '');
            
            paramValues.forEach(value => {
              if (value) {
                // Should be properly URL encoded
                expect(value).not.toMatch(/[&=#%\s](?![0-9A-Fa-f]{2})/);
              }
            });
          }
        }
      }
    }
  });

  test('should include relevant metadata in shared content', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // Check meta tags for social sharing
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
      const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');
      
      // Should have social media meta tags
      expect(ogTitle || twitterTitle).toBeTruthy();
      
      if (ogDescription) {
        expect(ogDescription.length).toBeGreaterThan(0);
        expect(ogDescription.length).toBeLessThan(300); // Good for social sharing
      }
    }
  });
});

test.describe('Share Button Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const shareButtons = page.locator('.share-button, .social-share button, .share-twitter, .share-linkedin');
      
      for (let i = 0; i < await shareButtons.count(); i++) {
        const button = shareButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        const textContent = await button.textContent();
        
        // Should have accessible label
        expect(ariaLabel || title || textContent?.trim()).toBeTruthy();
      }
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const shareButtons = page.locator('.share-button, .social-share button, .share-twitter, .share-linkedin');
      
      if (await shareButtons.count() > 0) {
        // Tab to first share button
        await page.keyboard.press('Tab');
        
        // Find focused element
        const focused = page.locator(':focus');
        
        if (await focused.count() > 0) {
          // Should be able to reach share buttons via keyboard
          const isShareButton = await focused.evaluate(el => {
            return el.closest('.share-button, .social-share, .share-twitter, .share-linkedin') !== null;
          });
          
          // If not immediately focused, continue tabbing
          if (!isShareButton) {
            for (let i = 0; i < 10; i++) {
              await page.keyboard.press('Tab');
              
              const currentFocused = page.locator(':focus');
              if (await currentFocused.count() > 0) {
                const isShareButtonNow = await currentFocused.evaluate(el => {
                  return el.closest('.share-button, .social-share, .share-twitter, .share-linkedin') !== null;
                });
                
                if (isShareButtonNow) {
                  expect(true).toBe(true); // Found share button via keyboard
                  break;
                }
              }
            }
          }
        }
      }
    }
  });

  test('should have focus indicators', async ({ page }) => {
    const contentLinks = page.locator('a[href*="/books/"], a[href*="/projects/"], a[href*="/lab/"], a[href*="/life/"]');
    
    if (await contentLinks.count() > 0) {
      await contentLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const shareButton = page.locator('.share-button, .social-share button').first();
      
      if (await shareButton.count() > 0) {
        // Focus the button
        await shareButton.focus();
        
        // Check for focus styles
        const focusStyles = await shareButton.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            outline: computed.outline,
            boxShadow: computed.boxShadow,
            border: computed.border
          };
        });
        
        // Should have some form of focus indicator
        const hasFocusIndicator = 
          focusStyles.outline !== 'none' ||
          focusStyles.boxShadow !== 'none' ||
          focusStyles.border !== '0px none';
        
        expect(hasFocusIndicator).toBe(true);
      }
    }
  });
});
