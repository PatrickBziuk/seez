import { getLocalizedUrl } from './src/utils/i18n.ts';

console.log('Testing getLocalizedUrl function:');
console.log('getLocalizedUrl("/", "en"):', getLocalizedUrl('/', 'en'));
console.log('getLocalizedUrl("/", "de"):', getLocalizedUrl('/', 'de'));
console.log('Expected: /en and /de (no trailing slash)');

console.log('\nTesting with other paths:');
console.log('getLocalizedUrl("/books", "en"):', getLocalizedUrl('/books', 'en'));
console.log('getLocalizedUrl("/projects", "en"):', getLocalizedUrl('/projects', 'en'));
