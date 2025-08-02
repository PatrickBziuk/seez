// Test script for getLocalizedUrl function
import { getLocalizedUrl } from './src/utils/i18n.ts';

console.log('Testing getLocalizedUrl function:');
console.log('From /en/ to de:', getLocalizedUrl('/en/', 'de'));
console.log('From /en to de:', getLocalizedUrl('/en', 'de'));
console.log('From / to de:', getLocalizedUrl('/', 'de'));
console.log('From /en/about to de:', getLocalizedUrl('/en/about', 'de'));
console.log('From /de/ to en:', getLocalizedUrl('/de/', 'en'));
