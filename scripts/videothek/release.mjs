#!/usr/bin/env node
/**
 * Release (or withdraw) a film for seez.eu. Run only after an explicit yes.
 *
 *   node scripts/videothek/release.mjs <id> [--note "…"]   pin the current local files
 *   node scripts/videothek/release.mjs <id> --upload        also upload them to GitHub
 *   node scripts/videothek/release.mjs --withdraw <id>     remove the film from the site
 *   node scripts/videothek/release.mjs --list              show what is released
 *
 * Pinning copies the film's current local media (full, cover, clip, thumbs) into
 * .videothek-cache/ under versioned names and records their sha256 in
 * src/data/videothek/releases.json. Later edits of the local files do not change
 * the site until the film is released again. Nothing is public before the
 * assets are uploaded and the changed releases.json is deployed.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  CACHE_DIR,
  RELEASE_REPO,
  RELEASE_TAG,
  localMediaPath,
  readCatalog,
  readReleases,
  releaseAssets,
  sha256File,
} from '../../src/utils/videothek-media.mjs';

const root = process.cwd();
const releasesFile = path.join(root, 'src/data/videothek/releases.json');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
const id =
  args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--note' && args[i - 1] !== '--withdraw') ||
  opt('--withdraw');

const data = readReleases(root);
const save = () => fs.writeFileSync(releasesFile, JSON.stringify(data, null, 2) + '\n');
const mib = (b) => (b / 1048576).toFixed(1) + ' MiB';

if (flag('--list')) {
  const ids = Object.keys(data.films);
  if (!ids.length) console.log('No film released.');
  for (const k of ids) {
    const r = data.films[k];
    const bytes = releaseAssets(r).reduce((s, a) => s + a.bytes, 0);
    console.log(`${k}  v${r.version}  approved ${r.approvedAt}  ${mib(bytes)}`);
  }
  process.exit(0);
}

if (!id) {
  console.error('usage: release.mjs <id> [--upload] [--note "…"] | --withdraw <id> | --list');
  process.exit(1);
}

if (flag('--withdraw')) {
  if (!data.films[id]) {
    console.error(`${id} is not released.`);
    process.exit(1);
  }
  const assets = releaseAssets(data.films[id]).map((a) => a.asset);
  delete data.films[id];
  save();
  console.log(`Withdrawn ${id} from releases.json. After the next deploy it is gone from seez.eu.`);
  console.log(`Its files stay in the GitHub release "${RELEASE_TAG}" until removed:`);
  for (const a of assets) console.log(`  gh release delete-asset ${RELEASE_TAG} ${a} -R ${RELEASE_REPO} -y`);
  process.exit(0);
}

const film = readCatalog(root).films.find((f) => f.id === id);
if (!film) {
  console.error(
    `Unknown film "${id}". Known: ${readCatalog(root)
      .films.map((f) => f.id)
      .join(', ')}`
  );
  process.exit(1);
}

// Pin current local files.
const sources = [
  ['full', localMediaPath(id, 'full')],
  ['cover', localMediaPath(id, 'cover')],
  ['clip', localMediaPath(id, 'clip')],
  ...Array.from({ length: film.thumbs || 5 }, (_, i) => [`thumb${i + 1}`, localMediaPath(id, 'thumb', i + 1)]),
];
for (const [, p] of sources) {
  if (!fs.existsSync(p)) {
    console.error(`Missing local file: ${p}`);
    process.exit(1);
  }
}
const hashes = sources.map(([kind, p]) => ({ kind, p, sha256: sha256File(p), bytes: fs.statSync(p).size }));
const version = hashes[0].sha256.slice(0, 8);
fs.mkdirSync(path.join(root, CACHE_DIR), { recursive: true });
const pinnedOf = (h) => {
  const asset = `${id}--${version}--${h.kind}${path.extname(h.p)}`;
  fs.copyFileSync(h.p, path.join(root, CACHE_DIR, asset));
  return { asset, sha256: h.sha256, bytes: h.bytes };
};
const pinned = hashes.map(pinnedOf);
const record = {
  approvedAt: new Date().toISOString().slice(0, 10),
  version,
  ...(opt('--note') ? { note: opt('--note') } : {}),
  media: { full: pinned[0], cover: pinned[1], clip: pinned[2], thumbs: pinned.slice(3) },
};
const before = data.films[id];
data.films[id] = record;
save();
const total = pinned.reduce((s, a) => s + a.bytes, 0);
console.log(
  `${before ? 'Re-pinned' : 'Pinned'} ${id} as v${version} (${pinned.length} files, ${mib(total)})${before ? `, was v${before.version}` : ''}.`
);

if (flag('--upload')) {
  try {
    execFileSync('gh', ['release', 'view', RELEASE_TAG, '-R', RELEASE_REPO], { stdio: 'ignore' });
  } catch {
    execFileSync(
      'gh',
      [
        'release',
        'create',
        RELEASE_TAG,
        '-R',
        RELEASE_REPO,
        '--title',
        'Videothek media',
        '--notes',
        'Released Videothek media for seez.eu. Files are pinned by sha256 in src/data/videothek/releases.json.',
        '--latest=false',
      ],
      { stdio: 'inherit' }
    );
  }
  execFileSync(
    'gh',
    [
      'release',
      'upload',
      RELEASE_TAG,
      '-R',
      RELEASE_REPO,
      '--clobber',
      ...pinned.map((a) => path.join(root, CACHE_DIR, a.asset)),
    ],
    {
      stdio: 'inherit',
    }
  );
  console.log(
    `Uploaded to github.com/${RELEASE_REPO}/releases/tag/${RELEASE_TAG}. Commit releases.json and deploy to put it on seez.eu.`
  );
} else {
  console.log(
    'Not uploaded yet (local only). Re-run with --upload after the yes, then commit releases.json and deploy.'
  );
}
