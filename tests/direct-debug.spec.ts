import { test } from '@playwright/test';

test('Direct debug test', async ({ page }) => {
  console.log('Going to debug-urls page...');

  try {
    await page.goto('/debug-urls', { timeout: 10000 });
    console.log('Successfully loaded debug-urls page');

    const content = await page.content();
    console.log('Page content preview:', content.substring(0, 500));

    // Extract URL values from the content
    const enRootMatch = content.match(/getLocalizedUrl\('\/', 'en'\): <strong>([^<]+)<\/strong>/);
    const deRootMatch = content.match(/getLocalizedUrl\('\/', 'de'\): <strong>([^<]+)<\/strong>/);

    console.log('Found EN Root URL:', enRootMatch ? enRootMatch[1] : 'NOT FOUND');
    console.log('Found DE Root URL:', deRootMatch ? deRootMatch[1] : 'NOT FOUND');
  } catch (error) {
    console.error('Error loading debug page:', error);
  }
});
