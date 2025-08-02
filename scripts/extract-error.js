// scripts/extract-error.js
// Extracts the first error message and context from a build log for CI issue reporting
import fs from 'node:fs';
const path = process.argv[2];
const log = fs.readFileSync(path, 'utf8');

// Try to find the first error block (Astro/Vite/Node)
const errorMatch = log.match(/(Error:.*?)(\n\s*at |\n\s*\[|\n\s*$)/s);
const fileLineMatch = log.match(/(\S+\.(js|ts|astro|mdx|jsx|tsx)):(\d+):(\d+)/);

if (errorMatch) {
  console.log('Error:', errorMatch[1].trim());
  if (fileLineMatch) {
    console.log('File:', fileLineMatch[1]);
    console.log('Line:', fileLineMatch[3]);
    console.log('Column:', fileLineMatch[4]);
  }
} else {
  // Fallback: print first 10 lines
  console.log('Unknown error. Log excerpt:');
  console.log(log.split('\n').slice(0, 10).join('\n'));
}
