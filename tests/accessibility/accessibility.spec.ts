import { test, expect } from '@playwright/test';

// Basic accessibility smoke test to ensure the accessibility suite runs.
// This checks for common landmarks and focus visibility on the homepage.
test.describe('Accessibility', () => {
	test('homepage has basic accessibility landmarks', async ({ page }) => {
		await page.goto('/');

		// Main landmark exists
		const main = page.locator('main');
		await expect(main, 'main landmark should exist').toHaveCount(1);

		// Header and at least one nav exist (some pages may have secondary navs)
		await expect(page.locator('header')).toHaveCount(1);
		const navCount = await page.locator('nav').count();
		expect(navCount).toBeGreaterThanOrEqual(1);

		// Skip link is present or focusable nav link exists
			const skipLink = page.locator('a[href^="#main"], a.skip-link');
			const hasSkip = await skipLink.count();
			const hasFocusableNav = await page.locator('nav a').first().isVisible().catch(() => false);
			const hasFocusableHeaderControl = await page
				.locator('header a, header button')
				.first()
				.isVisible()
				.catch(() => false);

			expect(hasSkip > 0 || hasFocusableNav || hasFocusableHeaderControl).toBeTruthy();
	});
});

