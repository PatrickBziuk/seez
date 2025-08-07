#!/usr/bin/env tsx

/**
 * Simple test script to debug canonical system
 */

console.log('🚀 Testing canonical system...');

try {
  import('../content/content-canonical-system.js')
    .then((module) => {
      console.log('✅ Module loaded successfully');
      console.log('Running scan...');
      module.scanAndUpdateContent();
    })
    .catch((error) => {
      console.error('❌ Import error:', error);
    });
} catch (error) {
  console.error('❌ Error:', error);
}
