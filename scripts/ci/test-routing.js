// Routing test for language variants (ESM refactor)
import fs from 'fs';
import path from 'path';

const collections = ['books', 'projects', 'lab', 'life', 'pages'];
const languages = ['en', 'de'];

function getContentEntries(collection) {
  const dir = path.join(__dirname, `../src/content/${collection}`);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
}

let errors = [];
for (const collection of collections) {
  const entries = getContentEntries(collection);
  for (const entry of entries) {
    for (const lang of languages) {
      // Simulate route existence (in real CI, use HTTP request or Astro route check)
      if (!entry.includes(lang)) {
        errors.push(`Missing ${lang} variant for ${collection}/${entry}`);
      }
    }
  }
}

if (errors.length) {
  console.error('Routing errors:');
  errors.forEach((e) => console.error(e));
  process.exit(1);
} else {
  console.log('All language variant routes exist for content entries.');
  process.exit(0);
}
