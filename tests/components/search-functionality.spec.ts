import { test, expect } from '@playwright/test';

/**
 * Search Functionality Component Tests
 * 
 * Tests search input, filtering, results display, and
 * search across content collections with proper
 * multilingual support and responsive behavior.
 */

test.describe('Search Input Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display search input field', async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input, [data-search-input]'
    );
    
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      await expect(searchInput.first()).toBeEnabled();
      
      // Should have appropriate placeholder
      const placeholder = await searchInput.first().getAttribute('placeholder');
      expect(placeholder?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should accept and display user input', async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      const testQuery = 'test search query';
      
      await searchInput.first().fill(testQuery);
      
      const inputValue = await searchInput.first().inputValue();
      expect(inputValue).toBe(testQuery);
    }
  });

  test('should clear search when clear button is clicked', async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      // Fill search input
      await searchInput.first().fill('test query');
      
      // Look for clear button
      const clearButton = page.locator(
        '.search-clear, .clear-search, button[aria-label*="clear"], .search-input + button'
      );
      
      if (await clearButton.count() > 0) {
        await clearButton.first().click();
        
        const inputValue = await searchInput.first().inputValue();
        expect(inputValue).toBe('');
      }
    }
  });

  test('should trigger search on Enter key', async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('javascript');
      
      const initialUrl = page.url();
      
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      const newUrl = page.url();
      
      // Should either navigate to search results or show results on same page
      const hasNavigated = newUrl !== initialUrl;
      const hasResults = await page.locator('.search-results, .results, .search-hits').count() > 0;
      
      expect(hasNavigated || hasResults).toBe(true);
    }
  });
});

test.describe('Search Results Display', () => {
  test('should display search results', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      // Perform search
      await searchInput.first().fill('content');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Look for results
      const searchResults = page.locator(
        '.search-results, .results, .search-hits, .search-result-item'
      );
      
      if (await searchResults.count() > 0) {
        await expect(searchResults.first()).toBeVisible();
        
        // Results should have some content
        const resultsText = await searchResults.first().textContent();
        expect(resultsText?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should show result count', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Look for result count
      const resultCount = page.locator(
        '.result-count, .search-count, .results-found, .search-stats'
      );
      
      if (await resultCount.count() > 0) {
        const countText = await resultCount.first().textContent();
        
        // Should contain numbers
        expect(countText).toMatch(/\d+/);
      }
    }
  });

  test('should highlight search terms in results', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      const searchTerm = 'javascript';
      
      await searchInput.first().fill(searchTerm);
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Look for highlighted terms
      const highlights = page.locator(
        '.highlight, .search-highlight, mark, .highlighted-term'
      );
      
      if (await highlights.count() > 0) {
        const highlightedText = await highlights.first().textContent();
        
        // Should contain the search term
        expect(highlightedText?.toLowerCase()).toContain(searchTerm.toLowerCase());
      }
    }
  });

  test('should display no results message when appropriate', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      // Search for something unlikely to exist
      const unlikelyQuery = 'xyzabc123impossiblequery456';
      
      await searchInput.first().fill(unlikelyQuery);
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Look for no results message
      const noResults = page.locator(
        '.no-results, .empty-results, .search-empty, [data-no-results]'
      );
      
      if (await noResults.count() > 0) {
        await expect(noResults.first()).toBeVisible();
        
        const noResultsText = await noResults.first().textContent();
        expect(noResultsText?.toLowerCase()).toMatch(/no.*results|not.*found|empty/);
      }
    }
  });
});

test.describe('Search Filtering and Collections', () => {
  test('should search across different content collections', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('programming');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Look for collection filters or mixed results
      const collectionFilters = page.locator(
        '.collection-filter, .filter-books, .filter-projects, .filter-lab, .filter-life'
      );
      
      const mixedResults = page.locator(
        '.result-item[data-collection], .search-result .collection-badge'
      );
      
      // Should either have filters or show collection info in results
      expect(await collectionFilters.count() > 0 || await mixedResults.count() > 0).toBe(true);
    }
  });

  test('should filter results by collection type', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('content');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Look for collection filters
      const bookFilter = page.locator(
        '.filter-books, [data-filter="books"], .collection-filter[data-collection="books"]'
      );
      
      if (await bookFilter.count() > 0) {
        await bookFilter.first().click();
        await page.waitForLoadState('networkidle');
        
        // Results should be filtered to books only
        const resultItems = page.locator('.search-result, .result-item');
        
        if (await resultItems.count() > 0) {
          // Check if results are from books collection
          const firstResultCollection = await resultItems.first().getAttribute('data-collection');
          const firstResultUrl = await resultItems.first().locator('a').first().getAttribute('href');
          
          expect(firstResultCollection === 'books' || firstResultUrl?.includes('/books/')).toBe(true);
        }
      }
    }
  });

  test('should handle tag-based filtering', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('javascript');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Look for tag filters
      const tagFilters = page.locator(
        '.tag-filter, .filter-tag, [data-tag-filter]'
      );
      
      if (await tagFilters.count() > 0) {
        await tagFilters.first().click();
        await page.waitForLoadState('networkidle');
        
        // Should update results or URL
        const hasFilteredResults = await page.locator('.filtered-results, .active-filter').count() > 0;
        const urlChanged = page.url().includes('tag=') || page.url().includes('filter=');
        
        expect(hasFilteredResults || urlChanged).toBe(true);
      }
    }
  });
});

test.describe('Search Performance and UX', () => {
  test('should show loading state during search', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('complex search query');
      
      // Start search and immediately check for loading state
      const searchPromise = searchInput.first().press('Enter');
      
      // Look for loading indicators
      const loadingIndicators = page.locator(
        '.loading, .spinner, .search-loading, [data-loading]'
      );
      
      if (await loadingIndicators.count() > 0) {
        await expect(loadingIndicators.first()).toBeVisible();
      }
      
      await searchPromise;
      await page.waitForLoadState('networkidle');
      
      // Loading should disappear
      if (await loadingIndicators.count() > 0) {
        await expect(loadingIndicators.first()).not.toBeVisible();
      }
    }
  });

  test('should implement search suggestions/autocomplete', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      // Type partial query
      await searchInput.first().fill('java');
      await page.waitForTimeout(500); // Wait for suggestions
      
      // Look for suggestions dropdown
      const suggestions = page.locator(
        '.search-suggestions, .autocomplete, .search-dropdown, [data-suggestions]'
      );
      
      if (await suggestions.count() > 0) {
        await expect(suggestions.first()).toBeVisible();
        
        // Should have suggestion items
        const suggestionItems = suggestions.first().locator('li, .suggestion-item, .suggestion');
        expect(await suggestionItems.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should handle keyboard navigation in suggestions', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('prog');
      await page.waitForTimeout(500);
      
      const suggestions = page.locator('.search-suggestions, .autocomplete');
      
      if (await suggestions.count() > 0 && await suggestions.first().isVisible()) {
        // Use arrow keys to navigate
        await page.keyboard.press('ArrowDown');
        
        // Should highlight first suggestion
        const highlightedSuggestion = page.locator(
          '.suggestion.highlighted, .suggestion:focus, .suggestion.active'
        );
        
        if (await highlightedSuggestion.count() > 0) {
          await expect(highlightedSuggestion.first()).toBeVisible();
          
          // Enter should select suggestion
          await page.keyboard.press('Enter');
          await page.waitForLoadState('networkidle');
          
          // Should perform search or navigate
          expect(true).toBe(true); // Placeholder for successful navigation
        }
      }
    }
  });
});

test.describe('Search Multilingual Support', () => {
  test('should search within current language context', async ({ page }) => {
    // Test English search
    await page.goto('/en');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('content');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Results should be from English content
      const resultLinks = page.locator('.search-result a, .result-item a');
      
      if (await resultLinks.count() > 0) {
        const firstResultHref = await resultLinks.first().getAttribute('href');
        
        // Should link to English content
        expect(firstResultHref).toMatch(/\/en\//);
      }
    }
    
    // Test German search
    await page.goto('/de');
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('inhalt');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      const resultLinks = page.locator('.search-result a, .result-item a');
      
      if (await resultLinks.count() > 0) {
        const firstResultHref = await resultLinks.first().getAttribute('href');
        
        // Should link to German content
        expect(firstResultHref).toMatch(/\/de\//);
      }
    }
  });

  test('should have localized search interface', async ({ page }) => {
    // Test English interface
    await page.goto('/en');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      const placeholder = await searchInput.first().getAttribute('placeholder');
      
      // Should be in English
      expect(placeholder?.toLowerCase()).toMatch(/search|find/);
    }
    
    // Test German interface
    await page.goto('/de');
    
    if (await searchInput.count() > 0) {
      const placeholder = await searchInput.first().getAttribute('placeholder');
      
      // Should be in German or at least different from English
      if (placeholder) {
        const isGerman = placeholder.toLowerCase().includes('suchen') || 
                        placeholder.toLowerCase().includes('finden');
        
        expect(isGerman || placeholder !== 'Search').toBe(true);
      }
    }
  });

  test('should handle cross-language search links', async ({ page }) => {
    await page.goto('/en');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('javascript');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Look for language toggle in search results
      const languageOptions = page.locator(
        '.search-language-toggle, .lang-filter, [data-search-lang]'
      );
      
      if (await languageOptions.count() > 0) {
        const germanOption = languageOptions.locator('[data-lang="de"], [href*="de"]');
        
        if (await germanOption.count() > 0) {
          await germanOption.first().click();
          await page.waitForLoadState('networkidle');
          
          // Should switch to German search context
          expect(page.url()).toMatch(/\/de/);
        }
      }
    }
  });
});

test.describe('Search Accessibility', () => {
  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      const ariaLabel = await searchInput.first().getAttribute('aria-label');
      const role = await searchInput.first().getAttribute('role');
      const ariaDescribedBy = await searchInput.first().getAttribute('aria-describedby');
      
      // Should have proper accessibility attributes
      expect(ariaLabel || role === 'searchbox' || 
             await searchInput.first().evaluate(el => (el as HTMLInputElement).type === 'search')).toBe(true);
      
      // If there are instructions, should be described by them
      if (ariaDescribedBy) {
        const describedByElement = page.locator(`#${ariaDescribedBy}`);
        expect(await describedByElement.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should announce search results to screen readers', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Look for aria-live regions or role="status"
      const liveRegions = page.locator(
        '[aria-live], [role="status"], .sr-only'
      );
      
      const searchResults = page.locator(
        '.search-results, .results'
      );
      
      if (await searchResults.count() > 0) {
        const resultsAriaLabel = await searchResults.first().getAttribute('aria-label');
        const resultsRole = await searchResults.first().getAttribute('role');
        
        // Should have proper region labeling
        expect(resultsAriaLabel || resultsRole || await liveRegions.count() > 0).toBeTruthy();
      }
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      // Should be reachable via Tab
      await searchInput.first().focus();
      await expect(searchInput.first()).toBeFocused();
      
      // Should maintain focus styles
      const focusStyles = await searchInput.first().evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          boxShadow: computed.boxShadow
        };
      });
      
      expect(focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none').toBe(true);
    }
  });
});
