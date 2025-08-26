// Quick debug script to test pagefind accessibility
(async () => {
  console.log('Testing pagefind accessibility...');
  
  try {
    const response = await fetch('/pagefind/pagefind.js');
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      console.log('✅ Pagefind.js is accessible');
    } else {
      console.log('❌ Pagefind.js is not accessible');
    }
  } catch (error) {
    console.log('❌ Error accessing pagefind.js:', error);
  }
})();