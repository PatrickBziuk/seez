import { getWordCount, getReadingTime, getReadingStats } from './src/utils/reading-stats.js';

// Test content
const testContent = `
# Test Article

This is a test article with some content to verify the reading statistics are working correctly.

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Main Content

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Subsection

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

## Conclusion

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
`;

console.log('Testing reading statistics...');
console.log('Word count:', getWordCount(testContent));
console.log('Reading time (fast):', getReadingTime(testContent, 'fast'));
console.log('Reading time (normal):', getReadingTime(testContent, 'normal'));
console.log('Reading time (slow):', getReadingTime(testContent, 'slow'));

const stats = getReadingStats(testContent);
console.log('Full stats:', stats);
