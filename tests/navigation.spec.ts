import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing Tests', () => {
  test.describe('Trailing Slash Redirects', () => {
    test('should redirect /en/ to /en', async ({ page }) => {
      const response = await page.goto('/en/', { waitUntil: 'networkidle' });

      // Should be redirected
      expect(response?.status()).toBe(200);
      expect(page.url()).toMatch(/\/en$/);
      expect(page.url()).not.toMatch(/\/en\/$/);

      // Page should load successfully
      await expect(page.locator('h1')).toContainText('Welcome to seez.eu');
    });

    test('should redirect /de/ to /de', async ({ page }) => {
      const response = await page.goto('/de/', { waitUntil: 'networkidle' });

      // Should be redirected
      expect(response?.status()).toBe(200);
      expect(page.url()).toMatch(/\/de$/);
      expect(page.url()).not.toMatch(/\/de\/$/);

      // Page should load successfully
      await expect(page.locator('h1')).toContainText('Willkommen bei seez.eu');
    });

    test('should not get 404 for /en/ direct access', async ({ page }) => {
      const response = await page.goto('/en/', { waitUntil: 'networkidle' });

      expect(response?.status()).not.toBe(404);

      // Should not show 404 page content
      await expect(page.locator('body')).not.toContainText('404');
      await expect(page.locator('body')).not.toContainText('Page not found');
    });

    test('should not get 404 for /de/ direct access', async ({ page }) => {
      const response = await page.goto('/de/', { waitUntil: 'networkidle' });

      expect(response?.status()).not.toBe(404);

      // Should not show 404 page content
      await expect(page.locator('body')).not.toContainText('404');
      await expect(page.locator('body')).not.toContainText('Page not found');
    });
  });

  test.describe('Logo Navigation', () => {
    test('logo should navigate to correct language homepage from English page', async ({ page }) => {
      // Start on English page
      await page.goto('/en');

      // Click the logo
      const logo = page.locator('a').filter({ has: page.locator('span:has-text("seez")') });
      await expect(logo).toBeVisible();

      await logo.click();
      await page.waitForLoadState('networkidle');

      // Should stay on English homepage
      expect(page.url()).toMatch(/\/en$/);
      await expect(page.locator('h1')).toContainText('Welcome to seez.eu');
    });

    test('logo should navigate to correct language homepage from German page', async ({ page }) => {
      // Start on German page
      await page.goto('/de');

      // Click the logo
      const logo = page.locator('a').filter({ has: page.locator('span:has-text("seez")') });
      await expect(logo).toBeVisible();

      await logo.click();
      await page.waitForLoadState('networkidle');

      // Should stay on German homepage
      expect(page.url()).toMatch(/\/de$/);
      await expect(page.locator('h1')).toContainText('Willkommen bei seez.eu');
    });

    test('logo should be clickable and not result in 404', async ({ page }) => {
      await page.goto('/en');

      const logo = page.locator('a').filter({ has: page.locator('span:has-text("seez")') });

      // Logo should have correct href attribute
      const href = await logo.getAttribute('href');
      expect(href).toBe('/en');

      // Click should work without 404
      const responsePromise = page.waitForResponse((response) => response.url().includes('/en'));
      await logo.click();
      const response = await responsePromise;

      expect(response.status()).toBe(200);
    });
  });

  test.describe('Root Path Language Detection', () => {
    test('root path should redirect to language homepage', async ({ page }) => {
      const response = await page.goto('/', { waitUntil: 'networkidle' });

      expect(response?.status()).toBe(200);

      // Should redirect to either /en or /de
      expect(page.url()).toMatch(/\/(en|de)$/);

      // Should not show loading/detecting message (client-side redirect page)
      await expect(page.locator('body')).not.toContainText('Detecting your preferred language');
    });
  });

  test.describe('Non-trailing Slash Routes', () => {
    test('/en should load successfully', async ({ page }) => {
      const response = await page.goto('/en', { waitUntil: 'networkidle' });

      expect(response?.status()).toBe(200);
      expect(page.url()).toMatch(/\/en$/);

      await expect(page.locator('h1')).toContainText('Welcome to seez.eu');
    });

    test('/de should load successfully', async ({ page }) => {
      const response = await page.goto('/de', { waitUntil: 'networkidle' });

      expect(response?.status()).toBe(200);
      expect(page.url()).toMatch(/\/de$/);

      await expect(page.locator('h1')).toContainText('Willkommen bei seez.eu');
    });
  });

  test.describe('Navigation Consistency', () => {
    test('all navigation links should work from English homepage', async ({ page }) => {
      await page.goto('/en');

      // Test main navigation links
      const navLinks = [
        { text: 'Books', expectedPath: '/en/books' },
        { text: 'Projects', expectedPath: '/en/projects' },
        { text: 'Lab', expectedPath: '/en/lab' },
        { text: 'Life', expectedPath: '/en/life' },
      ];

      for (const link of navLinks) {
        const navLink = page.locator('nav a', { hasText: link.text });
        if ((await navLink.count()) > 0) {
          const href = await navLink.getAttribute('href');
          expect(href).toBe(link.expectedPath);
        }
      }
    });

    test('all navigation links should work from German homepage', async ({ page }) => {
      await page.goto('/de');

      // Test main navigation links
      const navLinks = [
        { text: 'Bücher', expectedPath: '/de/books' },
        { text: 'Projekte', expectedPath: '/de/projects' },
        { text: 'Lab', expectedPath: '/de/lab' },
        { text: 'Leben', expectedPath: '/de/life' },
      ];

      for (const link of navLinks) {
        const navLink = page.locator('nav a', { hasText: link.text });
        if ((await navLink.count()) > 0) {
          const href = await navLink.getAttribute('href');
          expect(href).toBe(link.expectedPath);
        }
      }
    });
  });

  test.describe('URL Structure Validation', () => {
    test('should enforce no trailing slashes throughout site', async ({ page }) => {
      const routes = ['/en', '/de', '/en/books', '/de/books', '/en/projects', '/de/projects'];

      for (const route of routes) {
        await page.goto(route, { waitUntil: 'networkidle' });

        // URL should not have trailing slash
        expect(page.url()).not.toMatch(/\/$/);
        expect(page.url()).toMatch(new RegExp(route + '$'));
      }
    });
  });
});
