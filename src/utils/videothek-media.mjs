// Shared helpers for Videothek media: used by the Astro integration, the page
// helpers and the release / guard scripts. Plain ESM so node scripts can import it.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const RELEASE_TAG = 'videothek-media';
export const RELEASE_REPO = 'PatrickBziuk/seez';
export const PUBLIC_PREFIX = '/videothek/media/';
export const CACHE_DIR = '.videothek-cache';

/** Local Videothek folder (source for previews and releases). */
export function localVideothekDir() {
  return process.env.SEEZ_VIDEOTHEK_DIR || path.join(os.homedir(), 'Movies/seez/_videothek');
}

/** Where a film's current local file of a given kind lives. */
export function localMediaPath(id, kind, n) {
  const base = localVideothekDir();
  switch (kind) {
    case 'full':
      return path.join(base, 'full', `${id}.mp4`);
    case 'cover':
      return path.join(base, 'covers', `${id}.jpg`);
    case 'clip':
      return path.join(base, 'clips', `${id}.mp4`);
    case 'thumb':
      return path.join(base, 'thumbs', `${id}_${n}.jpg`);
    case 'audio':
      // EP track audio (AAC), encoded from the masters; id = EP track slug
      return path.join(base, 'audio', `${id}.m4a`);
    default:
      throw new Error(`unknown media kind ${kind}`);
  }
}

export function assetDownloadUrl(asset) {
  return `https://github.com/${RELEASE_REPO}/releases/download/${RELEASE_TAG}/${asset}`;
}

export function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** All pinned media entries of one release record, flattened. */
export function releaseAssets(release) {
  const m = release.media || {};
  return [m.full, m.cover, m.clip, ...(m.thumbs || [])].filter(Boolean);
}

/** Audio of one released EP track (releases.json "tracks"). */
export function trackAssets(track) {
  return [track?.audio].filter(Boolean);
}

/** Every pinned asset of releases.json: films and EP track audio. */
export function allReleasedAssets(data) {
  return [
    ...Object.values(data.films || {}).flatMap((r) => releaseAssets(r)),
    ...Object.values(data.tracks || {}).flatMap((t) => trackAssets(t)),
  ];
}

export function readReleases(root = process.cwd()) {
  const file = path.join(root, 'src/data/videothek/releases.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function readCatalog(root = process.cwd()) {
  const file = path.join(root, 'src/data/videothek/catalog.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
