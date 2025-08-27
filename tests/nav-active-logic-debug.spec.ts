import { test } from '@playwright/test';

test.describe('Navigation Active Logic Debug', () => {
  test('should debug isLinkActive function behavior', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Test the isLinkActive logic directly in the browser
    await page.goto('http://localhost:4324/en/projects');
    await page.waitForLoadState('networkidle');

    const debugResult = await page.evaluate(() => {
      // Replicate the exact isLinkActive function from Header.astro
      const currentPath = window.location.pathname;
      const safeLocale = 'en';

      const isLinkActive = (href: string) => {
        if (!href) return false;

        // Handle root/home page
        if (href === `/${safeLocale}` || href === '/') {
          return currentPath === `/${safeLocale}` || currentPath === '/';
        }

        // For category pages like /en/books, /en/projects, etc.
        const normalizedHref = href.replace(/^\//, '').replace(/\/$/, '');
        const normalizedPath = currentPath.replace(/^\//, '').replace(/\/$/, '');

        // Check if current path starts with the href (for category pages)
        return normalizedPath.startsWith(normalizedHref);
      };

      // Test with actual navigation hrefs
      const testCases = [
        { name: 'Books', href: '/en/books' },
        { name: 'Projects', href: '/en/projects' },
        { name: 'Music', href: '/en/music' },
        { name: 'Lab', href: '/en/lab' },
        { name: 'Life', href: '/en/life' },
      ];

      const results = testCases.map((testCase) => ({
        ...testCase,
        isActive: isLinkActive(testCase.href),
        normalizedHref: testCase.href.replace(/^\//, '').replace(/\/$/, ''),
        normalizedPath: currentPath.replace(/^\//, '').replace(/\/$/, ''),
        startsWithCheck: currentPath
          .replace(/^\//, '')
          .replace(/\/$/, '')
          .startsWith(testCase.href.replace(/^\//, '').replace(/\/$/, '')),
      }));

      return {
        currentPath,
        testResults: results,
      };
    });

    console.log('🔍 isLinkActive Debug Results:');
    console.log(JSON.stringify(debugResult, null, 2));

    // Check for specific issues
    const booksResult = debugResult.testResults.find((r) => r.name === 'Books');
    const projectsResult = debugResult.testResults.find((r) => r.name === 'Projects');

    if (booksResult?.isActive) {
      console.log('🚨 BUG FOUND: Books shows as active on Projects page!');
      console.log(`Books normalized href: "${booksResult.normalizedHref}"`);
      console.log(`Current normalized path: "${booksResult.normalizedPath}"`);
      console.log(`StartsWith check: ${booksResult.startsWithCheck}`);
    }

    if (!projectsResult?.isActive) {
      console.log('🚨 BUG FOUND: Projects does NOT show as active on Projects page!');
      console.log(`Projects normalized href: "${projectsResult?.normalizedHref}"`);
      console.log(`Current normalized path: "${projectsResult?.normalizedPath}"`);
      console.log(`StartsWith check: ${projectsResult?.startsWithCheck}`);
    }

    // Also check the actual DOM to see what classes are applied
    const actualDOMStates = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('.nav-link') as NodeListOf<HTMLElement>;
      const states: Array<{ text: string; href: string | null; hasActiveClass: boolean }> = [];
      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        const hasActiveClass = link.classList.contains('active');
        const text = link.textContent?.trim() || 'unknown';
        states.push({ text, href, hasActiveClass });
      });
      return states;
    });

    console.log('\\n🔍 Actual DOM Active Classes:');
    actualDOMStates.forEach((state) => {
      console.log(`${state.text}: href="${state.href}", active=${state.hasActiveClass}`);
    });
  });
});
