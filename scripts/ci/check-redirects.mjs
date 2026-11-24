#!/usr/bin/env node
/**
 * Checks the redirect pages Astro writes for src/data/redirects.mjs.
 *
 * GitHub Pages cannot send real redirects, so each old URL is a small HTML page
 * with a meta refresh. Two things go wrong silently:
 *  - Astro 5 writes the wrong target for some entries (seen for /en/figuren/*:
 *    the page points to /en/fragmente/* instead of /en/fragments/*), which
 *    creates a chain of two meta refreshes.
 *  - A target that is itself a redirect also creates a chain.
 *
 * Without --fix the script fails on any mismatch. With --fix (used by `pnpm build`)
 * it rewrites the page to the target from the map and then fails only on chains
 * in the map itself.
 */
import fs from 'node:fs';
import path from 'node:path';
import { REDIRECTS } from '../../src/data/redirects.mjs';

const dist = path.resolve('dist');
const fix = process.argv.includes('--fix');
const strip = (p) => p.split('#')[0].replace(/\/+$/, '') || '/';
const problems = [];
let fixed = 0;

const page = (from, to) =>
  `<!doctype html><title>Redirecting to: ${to}</title><meta content="0;url=${to}" http-equiv="refresh">` +
  `<meta content="noindex" name="robots"><link href="https://seez.eu${to}" rel="canonical">` +
  `<body><a href="${to}">Redirecting from <code>${from}</code> to <code>${to}</code></a></body>`;

for (const [from, to] of Object.entries(REDIRECTS)) {
  if (REDIRECTS[strip(to)]) problems.push(`chain in map: ${from} -> ${to} -> ${REDIRECTS[strip(to)]}`);
  const file = path.join(dist, from, 'index.html');
  if (!fs.existsSync(file)) {
    problems.push(`missing redirect page: ${from}`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const target = (html.match(/content="0;url=([^"]+)"/) || [])[1];
  if (target !== to) {
    if (fix) {
      fs.writeFileSync(file, page(from, to));
      fixed++;
    } else problems.push(`wrong target: ${from} -> ${target} (map says ${to})`);
  }
}

if (fixed) console.log(`[check-redirects] rewrote ${fixed} redirect page(s) with the target from the map`);
if (problems.length) {
  console.error('[check-redirects] ' + problems.join('\n[check-redirects] '));
  process.exit(1);
}
console.log(`[check-redirects] ok: ${Object.keys(REDIRECTS).length} redirects, one hop each`);
