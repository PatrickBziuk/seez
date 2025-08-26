// Simplified test for manual verification in browser console
// Copy and paste this into the browser console while on the development site

console.log('🧪 Manual Header Testing Started...');

// Test 1: Header Navigation Active State Logic
function testIsLinkActiveLogic() {
  console.log('\n🧭 Testing isLinkActive logic...');
  
  // Simulate the isLinkActive function from our fix
  const isLinkActive = (href, currentPath) => {
    if (!href) return false;

    // Handle root/home page  
    const safeLocale = 'en'; // Assume English for testing
    if (href === `/${safeLocale}` || href === '/') {
      return currentPath === `/${safeLocale}` || currentPath === '/';
    }

    // For category pages like /en/books, /en/projects, etc.
    const normalizedHref = href.replace(/^\//, '').replace(/\/$/, '');
    const normalizedPath = currentPath.replace(/^\//, '').replace(/\/$/, '');

    // Exact match for the category itself
    if (normalizedPath === normalizedHref) {
      return true;
    }
    
    // For sub-pages, ensure we have a proper path separator to avoid partial matches
    if (normalizedPath.startsWith(normalizedHref + '/')) {
      return true;
    }
    
    return false;
  };

  // Test cases based on the original bug reports
  const testCases = [
    { href: '/en/books', path: '/en/books', expected: true, desc: 'Books exact match' },
    { href: '/en/books', path: '/en/books/', expected: true, desc: 'Books with trailing slash' },
    { href: '/en/books', path: '/en/books/sample-book', expected: true, desc: 'Books subpage' },
    { href: '/en/books', path: '/en/book', expected: false, desc: 'Partial match should fail' },
    { href: '/en/books', path: '/en/projects', expected: false, desc: 'Different category' },
    { href: '/en', path: '/en', expected: true, desc: 'Home page match' },
    { href: '/en', path: '/en/', expected: true, desc: 'Home page with slash' },
  ];

  testCases.forEach(test => {
    const result = isLinkActive(test.href, test.path);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`${status} ${test.desc}: href="${test.href}", path="${test.path}", result=${result}, expected=${test.expected}`);
  });
}

// Test 2: Check actual page elements
function checkPageElements() {
  console.log('\n🔍 Checking page elements...');
  
  const searchButton = document.getElementById('search-button');
  const searchModal = document.getElementById('search-modal');
  const searchContainer = document.getElementById('search-container');
  const mobileToggle = document.querySelector('[data-aw-toggle-menu]');
  const mobileNav = document.getElementById('mobile-navigation');
  
  console.log('Elements found:');
  console.log('- Search button:', !!searchButton);
  console.log('- Search modal:', !!searchModal);
  console.log('- Search container:', !!searchContainer);
  console.log('- Mobile toggle:', !!mobileToggle);
  console.log('- Mobile nav:', !!mobileNav);
  
  return { searchButton, searchModal, searchContainer, mobileToggle, mobileNav };
}

// Test 3: Test search modal in dev mode
async function testSearchModal() {
  console.log('\n🔍 Testing search modal...');
  
  const elements = checkPageElements();
  if (!elements.searchButton) {
    console.log('❌ Search button not found');
    return;
  }
  
  // Click search button
  console.log('Clicking search button...');
  elements.searchButton.click();
  
  // Wait for modal to appear
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (elements.searchModal) {
    const isVisible = !elements.searchModal.classList.contains('hidden') && 
                     elements.searchModal.style.display !== 'none';
    console.log(isVisible ? '✅ Search modal opened' : '❌ Search modal not visible');
    
    if (isVisible && elements.searchContainer) {
      const content = elements.searchContainer.textContent;
      console.log('Search container content preview:', content.substring(0, 100) + '...');
      
      if (content.includes('Development Mode')) {
        console.log('✅ Development mode message shown correctly');
      } else {
        console.log('❌ Expected development mode message not found');
      }
      
      // Test close button
      const closeButton = document.getElementById('search-close');
      if (closeButton) {
        console.log('Testing close button...');
        closeButton.click();
        
        await new Promise(resolve => setTimeout(resolve, 200));
        const isClosed = elements.searchModal.classList.contains('hidden') || 
                        elements.searchModal.style.display === 'none';
        console.log(isClosed ? '✅ Search modal closed correctly' : '❌ Search modal close failed');
      }
    }
  }
}

// Test 4: Test mobile navigation
async function testMobileNavigation() {
  console.log('\n📱 Testing mobile navigation...');
  
  const elements = checkPageElements();
  if (!elements.mobileToggle || !elements.mobileNav) {
    console.log('❌ Mobile navigation elements not found');
    return;
  }
  
  const initiallyHidden = elements.mobileNav.classList.contains('hidden');
  console.log('Mobile nav initially hidden:', initiallyHidden);
  
  // Click toggle
  console.log('Clicking mobile toggle...');
  elements.mobileToggle.click();
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const nowVisible = !elements.mobileNav.classList.contains('hidden');
  const toggleWorked = initiallyHidden ? nowVisible : !nowVisible;
  console.log(toggleWorked ? '✅ Mobile navigation toggle works' : '❌ Mobile navigation toggle failed');
  
  // Test outside click
  if (nowVisible) {
    console.log('Testing outside click to close...');
    document.body.click();
    
    await new Promise(resolve => setTimeout(resolve, 200));
    const closedByOutsideClick = elements.mobileNav.classList.contains('hidden');
    console.log(closedByOutsideClick ? '✅ Mobile nav closes on outside click' : '❌ Outside click failed');
  }
}

// Test 5: Check current navigation state
function checkCurrentNavigationState() {
  console.log('\n🧭 Current Navigation State:');
  console.log('Current URL:', window.location.pathname);
  
  // Find all navigation links
  const navLinks = document.querySelectorAll('nav a[href*="/"]');
  console.log(`Found ${navLinks.length} navigation links`);
  
  navLinks.forEach((link, index) => {
    const href = link.getAttribute('href');
    const text = link.textContent.trim();
    const isActive = link.classList.contains('text-primary') || 
                    link.getAttribute('aria-current') === 'page' ||
                    link.closest('li')?.classList.contains('active');
    
    if (isActive) {
      console.log(`✅ Active link ${index + 1}: "${text}" -> ${href}`);
    } else if (href && (href.includes('books') || href.includes('projects') || href.includes('lab'))) {
      console.log(`  Link ${index + 1}: "${text}" -> ${href}`);
    }
  });
}

// Main test runner
async function runManualTests() {
  console.log('🚀 Starting Manual Header Tests');
  console.log('=' .repeat(50));
  
  testIsLinkActiveLogic();
  checkCurrentNavigationState();
  await testSearchModal();
  await testMobileNavigation();
  
  console.log('=' .repeat(50));
  console.log('🏁 Manual tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Navigate to different sections (books, projects, lab)');
  console.log('2. Check that active states update correctly');
  console.log('3. Test search modal on each page');
  console.log('4. Try different screen sizes for mobile nav');
}

// Auto-run
runManualTests();