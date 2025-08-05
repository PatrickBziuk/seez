/**
 * Simple test to analyze tags - debugging version
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting simple tag analysis test...');
console.log('Current directory:', __dirname);

const contentDir = path.join(__dirname, '../../src/content');
console.log('Content directory:', contentDir);
console.log('Content dir exists:', fs.existsSync(contentDir));

// Test reading a specific file
const testFile = path.join(contentDir, 'projects/en/meine-musik.mdx');
console.log('Test file:', testFile);
console.log('Test file exists:', fs.existsSync(testFile));

if (fs.existsSync(testFile)) {
  const content = fs.readFileSync(testFile, 'utf-8');
  console.log('File content:');
  console.log(content.substring(0, 200) + '...');
}

// List directories
console.log('\\nContent subdirectories:');
try {
  const dirs = fs.readdirSync(contentDir);
  dirs.forEach((dir) => {
    const dirPath = path.join(contentDir, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      console.log(`  📁 ${dir}`);

      // List files in each directory
      const files = fs.readdirSync(dirPath, { recursive: true });
      files.forEach((file) => {
        if (file.toString().endsWith('.md') || file.toString().endsWith('.mdx')) {
          console.log(`    📄 ${file}`);
        }
      });
    }
  });
} catch (error) {
  console.error('Error reading content directory:', error);
}
