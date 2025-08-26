import { test, expect } from '@playwright/test';

test.describe('Direct Search Debug', () => {
  test('should manually test pagefind loading step by step', async ({ page }) => {
    // Capture ALL console output
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(`[${msg.type().toUpperCase()}] ${text}`);
      console.log(`BROWSER: [${msg.type().toUpperCase()}] ${text}`);
    });
    
    page.on('pageerror', err => {
      const error = `PAGE ERROR: ${err.message}`;
      logs.push(error);
      console.log(`BROWSER: ${error}`);
    });

    await page.goto('http://localhost:4324/en');
    
    // Step 1: Check if pagefind files are actually accessible
    const pagefindJsResponse = await page.goto('http://localhost:4324/pagefind/pagefind.js');
    console.log('Pagefind.js status:', pagefindJsResponse?.status());
    expect(pagefindJsResponse?.status()).toBe(200);
    
    // Go back to main page
    await page.goto('http://localhost:4324/en');
    
    // Step 2: Manually load pagefind and see what happens
    console.log('=== MANUAL PAGEFIND LOADING TEST ===');
    
    const manualLoadResult = await page.evaluate(async () => {
      console.log('Starting manual pagefind load test...');
      
      try {
        // Create script element
        const script = document.createElement('script');
        script.src = '/pagefind/pagefind.js';
        script.type = 'text/javascript';
        
        console.log('Created script element, adding to head...');
        
        // Wait for script to load
        const loadPromise = new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('Script onload fired');
            resolve('SCRIPT_LOADED');
          };
          script.onerror = (e) => {
            console.log('Script onerror fired:', e);
            reject('SCRIPT_ERROR');
          };
          
          // Timeout
          setTimeout(() => {
            reject('SCRIPT_TIMEOUT');
          }, 15000);
        });
        
        document.head.appendChild(script);
        console.log('Script appended to head');
        
        const scriptResult = await loadPromise;
        console.log('Script load result:', scriptResult);
        
        // Check if pagefind is available
        console.log('Checking for window.pagefind...');
        
        let attempts = 0;
        while (attempts < 50) {
          attempts++;
          console.log(`Attempt ${attempts}: window.pagefind exists?`, typeof (window as any).pagefind !== 'undefined');
          
          if ((window as any).pagefind) {
            console.log('Found pagefind object!');
            return {
              success: true,
              attempts: attempts,
              pagefindType: typeof (window as any).pagefind,
              pagefindKeys: Object.keys((window as any).pagefind || {})
            };
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return {
          success: false,
          attempts: attempts,
          windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('pagefind')),
          error: 'Pagefind object not found after 50 attempts'
        };
        
      } catch (error) {
        console.log('Manual load error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    console.log('=== MANUAL LOAD RESULT ===');
    console.log(JSON.stringify(manualLoadResult, null, 2));
    
    // Step 3: Now try the actual search modal
    console.log('=== TESTING ACTUAL SEARCH MODAL ===');
    const searchButton = page.locator('#search-button');
    await searchButton.click();
    
    // Wait longer for initialization
    await page.waitForTimeout(12000);
    
    const searchContainer = page.locator('#search-container');
    const content = await searchContainer.innerHTML();
    console.log('Search container HTML:', content);
    
    // Check for search input
    const hasSearchInput = await page.locator('#pagefind-search').isVisible();
    console.log('Has search input:', hasSearchInput);
    
    console.log('=== ALL CONSOLE LOGS ===');
    logs.forEach(log => console.log(log));
  });
});