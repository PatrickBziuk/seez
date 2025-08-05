// Translation key completeness test for CI
import fs from 'fs';
import path from 'path';

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/locales/en.json'), 'utf8'));
const de = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/locales/de.json'), 'utf8'));

function flatten(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix ? `${prefix}.` : '';
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(acc, flatten(obj[k], pre + k));
    } else {
      acc[pre + k] = String(obj[k]);
    }
    return acc;
  }, {});
}

const enFlat = flatten(en);
const deFlat = flatten(de);

const missingInDe = Object.keys(enFlat).filter((key) => !(key in deFlat));
const missingInEn = Object.keys(deFlat).filter((key) => !(key in enFlat));

if (missingInDe.length || missingInEn.length) {
  console.error('Missing translation keys:');
  if (missingInDe.length) console.error('In de.json:', missingInDe);
  if (missingInEn.length) console.error('In en.json:', missingInEn);
  process.exit(1);
} else {
  console.log('All translation keys are present in both en.json and de.json.');
  process.exit(0);
}
