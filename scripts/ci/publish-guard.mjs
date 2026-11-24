#!/usr/bin/env node
/**
 * Publish guard — runs after every build (postbuild) and in CI before deploy.
 * Fails the build if the finished site contains anything that is not released:
 *
 *  1. Content entries that are not `publicationStatus: published` (or are `draft: true`):
 *     no page at their slug, and their title nowhere in the site.
 *  2. Videothek: dist/videothek/media holds exactly the files pinned in
 *     releases.json, byte-identical (sha256); no draft-preview URLs; no trace
 *     of unreleased film ids.
 *  3. No local file paths and no draft-preview banners anywhere.
 *
 *   node scripts/ci/publish-guard.mjs [distDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  readCatalog,
  readReleases,
  releaseAssets,
  trackAssets,
  sha256File,
  PUBLIC_PREFIX,
} from '../../src/utils/videothek-media.mjs';

const root = process.cwd();
const dist = path.resolve(process.argv[2] || 'dist');
const GATED = ['books', 'projects', 'lab', 'life', 'music', 'pages', 'fragments', 'texts', 'artifacts'];
const TEXT_EXT = new Set(['.html', '.xml', '.json', '.js', '.txt', '.webmanifest']);

const problems = [];
const fail = (msg) => problems.push(msg);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

if (!fs.existsSync(dist)) {
  console.error(`[publish-guard] ${dist} does not exist, build first.`);
  process.exit(1);
}

const files = walk(dist);
const textFiles = files.filter((f) => TEXT_EXT.has(path.extname(f)) && !f.includes(`${path.sep}pagefind${path.sep}`));
const texts = new Map(textFiles.map((f) => [f, fs.readFileSync(f, 'utf8')]));
const rel = (f) => path.relative(dist, f);
const findText = (needle) => [...texts].filter(([, t]) => t.includes(needle)).map(([f]) => rel(f));

// ---------- 1. Content collections ----------
function frontmatter(file) {
  const src = fs.readFileSync(file, 'utf8');
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return fm;
}

const entries = [];
for (const col of GATED) {
  for (const f of walk(path.join(root, 'src/content', col))) {
    if (!/\.mdx?$/.test(f)) continue;
    const fm = frontmatter(f);
    const published = fm.publicationStatus === 'published' && fm.draft !== 'true';
    entries.push({
      col,
      file: path.relative(root, f),
      slug: path.basename(f).replace(/\.mdx?$/, ''),
      title: fm.title || '',
      published,
    });
  }
}
const publishedSlugs = new Set(entries.filter((e) => e.published).map((e) => e.slug));
const publishedTitles = new Set(entries.filter((e) => e.published).map((e) => e.title));
const pagePaths = files.filter((f) => f.endsWith('.html')).map(rel);

let drafts = 0;
for (const e of entries.filter((x) => !x.published)) {
  drafts++;
  if (!publishedSlugs.has(e.slug)) {
    const hit = pagePaths.filter((p) => p.split(path.sep).includes(e.slug) || p.endsWith(`${e.slug}.html`));
    if (hit.length) fail(`draft ${e.file} has a page: ${hit.slice(0, 3).join(', ')}`);
  }
  if (e.title && e.title.length > 6 && !publishedTitles.has(e.title)) {
    const hit = findText(e.title);
    if (hit.length) fail(`draft title "${e.title}" (${e.file}) appears in: ${hit.slice(0, 3).join(', ')}`);
  }
}

// ---------- 2. Videothek ----------
const releases = readReleases(root).films || {};
const catalog = readCatalog(root);
const pinned = new Map();
for (const [id, r] of Object.entries(releases)) {
  if (!catalog.films.some((f) => f.id === id)) fail(`releases.json pins unknown film "${id}"`);
  for (const a of releaseAssets(r)) pinned.set(a.asset, a);
}
const releasedTracks = readReleases(root).tracks || {};
for (const [slug, t] of Object.entries(releasedTracks)) {
  for (const a of trackAssets(t)) pinned.set(a.asset, a);
  if (!t.audio?.asset?.startsWith(`track-${slug}--`)) fail(`releases.json track "${slug}" has a foreign asset`);
}
const mediaDir = path.join(dist, PUBLIC_PREFIX);
const mediaFiles = walk(mediaDir);
for (const f of mediaFiles) {
  const name = path.relative(mediaDir, f);
  const a = pinned.get(name);
  if (!a) fail(`unreleased media file in site: ${rel(f)}`);
  else if (sha256File(f) !== a.sha256) fail(`media file differs from the released version: ${rel(f)}`);
}
for (const name of pinned.keys()) {
  if (!fs.existsSync(path.join(mediaDir, name))) fail(`released media missing from site: ${name}`);
}
const previewRefs = findText(`${PUBLIC_PREFIX}preview/`);
if (previewRefs.length) fail(`draft-preview media URLs in site: ${previewRefs.slice(0, 3).join(', ')}`);
for (const f of catalog.films) {
  if (releases[f.id]) continue;
  for (const needle of [`film-${f.id}"`, `data-film="${f.id}"`, `data-film-detail="${f.id}"`, `${f.id}--`]) {
    const hit = findText(needle);
    if (hit.length) fail(`unreleased film "${f.id}" appears in: ${hit.slice(0, 3).join(', ')}`);
  }
}
if (Object.keys(releases).length === 0) {
  const vt = pagePaths.filter((p) => p.split(path.sep).includes('videothek'));
  if (vt.length) fail(`Videothek page built although no film is released: ${vt.join(', ')}`);
}

// ---------- 3. Leaks ----------
for (const [needle, what] of [
  ['/Users/', 'local file path'],
  ['~/Movies', 'local file path'],
  ['Application Support/Claude', 'local file path'],
  ['ENTWURFSVORSCHAU', 'draft-preview banner'],
  ['DRAFT PREVIEW, local only', 'draft-preview banner'],
]) {
  const hit = findText(needle);
  if (hit.length) fail(`${what} ("${needle}") in: ${hit.slice(0, 3).join(', ')}`);
}

// ---------- 4. Privacy: no cookies, no browser storage, no third-party loads ----------
// seez.eu promises in its privacy notice that it sets no cookies, stores nothing in the
// visitor's browser and loads nothing from other hosts. Links to other sites are fine.
for (const [needle, what] of [
  ['document.cookie', 'cookie access'],
  ['localStorage.setItem', 'localStorage write'],
  ['localStorage[', 'localStorage write'],
  ['sessionStorage', 'sessionStorage use'],
  ['indexedDB.open', 'IndexedDB use'],
]) {
  const hit = findText(needle);
  if (hit.length) fail(`${what} ("${needle}") in: ${hit.slice(0, 3).join(', ')}`);
}
const OWN_HOST = /^https?:\/\/(www\.)?seez\.eu(\/|$)/;
const THIRD_PARTY = [
  /<script\b[^>]*\bsrc="(https?:\/\/[^"]+)"/g,
  /<iframe\b[^>]*\bsrc="(https?:\/\/[^"]+)"/g,
  /<(?:img|audio|video|source|track|embed)\b[^>]*\bsrc="(https?:\/\/[^"]+)"/g,
  /<link\b(?=[^>]*\brel="(?:stylesheet|preconnect|dns-prefetch|preload|prefetch|modulepreload|icon)")[^>]*\bhref="(https?:\/\/[^"]+)"/g,
  /@import\s+url\((?:'|")?(https?:\/\/[^'")]+)/g,
];
const thirdParty = new Map();
for (const [f, t] of texts) {
  if (!f.endsWith('.html')) continue;
  for (const re of THIRD_PARTY) {
    for (const m of t.matchAll(re)) {
      if (OWN_HOST.test(m[1])) continue;
      const host = new URL(m[1]).host;
      if (!thirdParty.has(host)) thirdParty.set(host, rel(f));
    }
  }
}
for (const [host, f] of thirdParty) fail(`third-party resource from ${host} (first in ${f})`);

// ---------- Result ----------
const summary = `${entries.length - drafts} published / ${drafts} unreleased entries, ${Object.keys(releases).length} released film(s), ${Object.keys(releasedTracks).length} released track(s), ${mediaFiles.length} media file(s)`;
if (problems.length) {
  console.error(`\n[publish-guard] BLOCKED, ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error(`\n  ${summary}\n`);
  process.exit(1);
}
console.log(`[publish-guard] ok: ${summary}`);
