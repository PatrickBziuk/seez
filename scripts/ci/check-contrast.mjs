#!/usr/bin/env node
/**
 * Contrast check for the Seez design tokens (KONZEPT B2/B4, step B11-20).
 * Reads src/assets/styles/seez.css and src/data/figures.json and fails if any text
 * colour falls below WCAG 2.x AA (4.5:1) or a UI line below 3:1 on its background.
 * Same formula as docs/visual-konzept/tools/contrast.py.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const css = fs.readFileSync(path.join(root, 'src/assets/styles/seez.css'), 'utf8');
const figures = JSON.parse(fs.readFileSync(path.join(root, 'src/data/figures.json'), 'utf8')).figures;
const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found`);
  return m[1];
};
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const bg = token('bg');
const surface = token('surface');
const surface2 = token('surface-2');
const checks = [];
const add = (label, fg, back, min) => checks.push({ label, fg, back, min, r: ratio(fg, back) });

for (const [n, b] of [
  ['bg', bg],
  ['surface', surface],
  ['surface-2', surface2],
]) {
  add(`text on ${n}`, token('text'), b, 4.5);
  add(`text-muted on ${n}`, token('text-muted'), b, 4.5);
  add(`line-strong on ${n} (UI)`, token('line-strong'), b, 3);
  add(`focus on ${n} (UI)`, token('focus'), b, 3);
}
add('text-faint on bg (>= 18px only)', token('text-faint'), bg, 4.5);
add('invert-text on invert-bg (primary button)', token('invert-text'), token('invert-bg'), 4.5);
for (const f of figures) {
  add(`${f.name} accent on bg`, f.accent.dark, bg, 4.5);
  add(`${f.name} accent on surface`, f.accent.dark, surface, 4.5);
  add(`${f.name} accent on own ground ${f.ground}`, f.accent.dark, f.ground, 4.5);
  add(`${f.name} light accent on paper`, f.accent.light, '#F6F4EF', 4.5);
  if (f.media?.terminal) add(`${f.name} terminal on own ground`, f.media.terminal, f.ground, 4.5);
}
// Legacy Tailwind grays lifted in tailwind.config.js
add('gray-500 (#A9A6B6) on surface', '#A9A6B6', surface, 4.5);
add('gray-600 (#8A8797) on bg', '#8A8797', bg, 4.5);

let failed = 0;
for (const c of checks) {
  const ok = c.r >= c.min;
  if (!ok) failed += 1;
  if (!ok || process.argv.includes('--verbose')) {
    console.log(
      `${ok ? 'ok  ' : 'FAIL'} ${c.r.toFixed(2).padStart(5)}:1 (min ${c.min})  ${c.label}  ${c.fg} on ${c.back}`
    );
  }
}
console.log(`[contrast] ${checks.length - failed}/${checks.length} pairs pass`);
process.exit(failed ? 1 : 0);
