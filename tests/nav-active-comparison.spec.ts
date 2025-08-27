import { test } from '@playwright/test';

test.describe('Navigation Active State - Dev vs Preview', () => {
  test('should compare active state behavior between dev and preview', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('🔍 Testing active state on DEVELOPMENT server (port 4324)...');

    // Test on development server
    await page.goto('http://localhost:4324/en/books');
    await page.waitForLoadState('networkidle');

    const devActiveStates = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('.nav-link') as NodeListOf<HTMLElement>;
      const states: Record<string, { href: string | null; hasActiveClass: boolean }> = {};
      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        const hasActiveClass = link.classList.contains('active');
        const text = link.textContent?.trim() || href || 'unknown';
        states[text] = { href, hasActiveClass };
      });
      return {
        currentUrl: window.location.pathname,
        activeStates: states,
      };
    });

    console.log('DEV SERVER Books page active states:', JSON.stringify(devActiveStates, null, 2));

    // Take screenshot of dev server
    await page.screenshot({
      path: 'test-results/nav-active-dev-books.png',
      fullPage: false,
    });

    // Navigate to Projects on dev server
    await page.goto('http://localhost:4324/en/projects');
    await page.waitForLoadState('networkidle');

    const devProjectsStates = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('.nav-link') as NodeListOf<HTMLElement>;
      const states: Record<string, { href: string | null; hasActiveClass: boolean }> = {};
      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        const hasActiveClass = link.classList.contains('active');
        const text = link.textContent?.trim() || href || 'unknown';
        states[text] = { href, hasActiveClass };
      });
      return {
        currentUrl: window.location.pathname,
        activeStates: states,
      };
    });

    console.log('DEV SERVER Projects page active states:', JSON.stringify(devProjectsStates, null, 2));

    await page.screenshot({
      path: 'test-results/nav-active-dev-projects.png',
      fullPage: false,
    });

    console.log('\\n🔍 Testing active state on PREVIEW server (port 4323)...');

    // Test on preview server
    await page.goto('http://localhost:4323/en/books');
    await page.waitForLoadState('networkidle');

    const previewActiveStates = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('.nav-link') as NodeListOf<HTMLElement>;
      const states: Record<string, { href: string | null; hasActiveClass: boolean }> = {};
      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        const hasActiveClass = link.classList.contains('active');
        const text = link.textContent?.trim() || href || 'unknown';
        states[text] = { href, hasActiveClass };
      });
      return {
        currentUrl: window.location.pathname,
        activeStates: states,
      };
    });

    console.log('PREVIEW SERVER Books page active states:', JSON.stringify(previewActiveStates, null, 2));

    await page.screenshot({
      path: 'test-results/nav-active-preview-books.png',
      fullPage: false,
    });

    // Navigate to Projects on preview server
    await page.goto('http://localhost:4323/en/projects');
    await page.waitForLoadState('networkidle');

    const previewProjectsStates = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('.nav-link') as NodeListOf<HTMLElement>;
      const states: Record<string, { href: string | null; hasActiveClass: boolean }> = {};
      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        const hasActiveClass = link.classList.contains('active');
        const text = link.textContent?.trim() || href || 'unknown';
        states[text] = { href, hasActiveClass };
      });
      return {
        currentUrl: window.location.pathname,
        activeStates: states,
      };
    });

    console.log('PREVIEW SERVER Projects page active states:', JSON.stringify(previewProjectsStates, null, 2));

    await page.screenshot({
      path: 'test-results/nav-active-preview-projects.png',
      fullPage: false,
    });

    // Compare and identify differences
    console.log('\\n📊 COMPARISON:');

    const booksActiveDev = devActiveStates.activeStates['Books']?.hasActiveClass;
    const booksActivePreview = previewActiveStates.activeStates['Books']?.hasActiveClass;
    const projectsActiveDev = devProjectsStates.activeStates['Projects']?.hasActiveClass;
    const projectsActivePreview = previewProjectsStates.activeStates['Projects']?.hasActiveClass;

    console.log(`Books active on Books page - Dev: ${booksActiveDev}, Preview: ${booksActivePreview}`);
    console.log(`Projects active on Projects page - Dev: ${projectsActiveDev}, Preview: ${projectsActivePreview}`);

    // Check for the specific bug - Books being active on non-Books pages
    const booksActiveOnProjectsDev = devProjectsStates.activeStates['Books']?.hasActiveClass;
    const booksActiveOnProjectsPreview = previewProjectsStates.activeStates['Books']?.hasActiveClass;

    console.log(
      `Books active on Projects page - Dev: ${booksActiveOnProjectsDev}, Preview: ${booksActiveOnProjectsPreview}`
    );

    if (booksActiveOnProjectsPreview) {
      console.log('🚨 BUG CONFIRMED: Books link stays active on Projects page in PREVIEW mode!');
    }

    if (booksActiveOnProjectsDev) {
      console.log('🚨 BUG CONFIRMED: Books link stays active on Projects page in DEV mode!');
    }
  });
});
