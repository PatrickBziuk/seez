import { test, expect } from '@playwright/test';

test.describe('Navigation Active State Fix', () => {
  test('Books link should not stay active on other pages', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('🔧 Testing navigation active state fix...');

    // Test on Books page - Books should be active
    await page.goto('http://localhost:4324/en/books');
    await page.waitForLoadState('networkidle');

    const booksPageState = await page.evaluate(() => {
      const booksLink = document.querySelector('.nav-link[href="/en/books"]') as HTMLElement;
      const projectsLink = document.querySelector('.nav-link[href="/en/projects"]') as HTMLElement;

      return {
        currentPath: window.location.pathname,
        booksActive: booksLink?.classList.contains('active') || false,
        projectsActive: projectsLink?.classList.contains('active') || false,
      };
    });

    console.log('📖 Books page results:', booksPageState);
    expect(booksPageState.booksActive).toBe(true);
    expect(booksPageState.projectsActive).toBe(false);

    // Test on Projects page - Projects should be active, Books should NOT be active
    await page.goto('http://localhost:4324/en/projects');
    await page.waitForLoadState('networkidle');

    const projectsPageState = await page.evaluate(() => {
      const booksLink = document.querySelector('.nav-link[href="/en/books"]') as HTMLElement;
      const projectsLink = document.querySelector('.nav-link[href="/en/projects"]') as HTMLElement;

      return {
        currentPath: window.location.pathname,
        booksActive: booksLink?.classList.contains('active') || false,
        projectsActive: projectsLink?.classList.contains('active') || false,
      };
    });

    console.log('🚀 Projects page results:', projectsPageState);
    expect(projectsPageState.projectsActive).toBe(true);
    expect(projectsPageState.booksActive).toBe(false);

    // Test on Music page - Music should be active, Books should NOT be active
    await page.goto('http://localhost:4324/en/music');
    await page.waitForLoadState('networkidle');

    const musicPageState = await page.evaluate(() => {
      const booksLink = document.querySelector('.nav-link[href="/en/books"]') as HTMLElement;
      const musicLink = document.querySelector('.nav-link[href="/en/music"]') as HTMLElement;

      return {
        currentPath: window.location.pathname,
        booksActive: booksLink?.classList.contains('active') || false,
        musicActive: musicLink?.classList.contains('active') || false,
      };
    });

    console.log('🎵 Music page results:', musicPageState);
    expect(musicPageState.musicActive).toBe(true);
    expect(musicPageState.booksActive).toBe(false);

    console.log('\\n✅ NAVIGATION ACTIVE STATE FIX VALIDATION:');
    console.log('  📖 Books page: Books active ✅, Projects inactive ✅');
    console.log('  🚀 Projects page: Projects active ✅, Books inactive ✅');
    console.log('  🎵 Music page: Music active ✅, Books inactive ✅');
    console.log('\\n🎉 FIX SUCCESSFUL: Books link no longer stays active on other pages!');
  });
});
