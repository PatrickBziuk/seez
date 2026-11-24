/**
 * Videothek media integration.
 *
 * - Build: copies exactly the media pinned in src/data/videothek/releases.json
 *   into dist/videothek/media/. Each file comes from the local cache or the
 *   GitHub release "videothek-media" and must match its sha256, else the build fails.
 *   Nothing else is ever copied, so unreleased films have no public media.
 * - Dev: serves pinned media from the cache and, for the draft preview,
 *   the current local files under /videothek/media/preview/<id>/<kind>.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  CACHE_DIR,
  PUBLIC_PREFIX,
  assetDownloadUrl,
  allReleasedAssets,
  localMediaPath,
  readReleases,
  releaseAssets,
  sha256File,
  trackAssets,
} from '../utils/videothek-media.mjs';

type Asset = { asset: string; sha256: string; bytes: number };

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4a': 'audio/mp4',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

function serveFile(req: IncomingMessage, res: ServerResponse, file: string) {
  const stat = fs.statSync(file);
  const type = MIME[path.extname(file)] || 'application/octet-stream';
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Number(range[2]) : stat.size - 1;
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(file).pipe(res);
}

async function ensureCached(root: string, a: Asset): Promise<string> {
  const cached = path.join(root, CACHE_DIR, a.asset);
  if (fs.existsSync(cached) && sha256File(cached) === a.sha256) return cached;
  const url = assetDownloadUrl(a.asset);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`[videothek] ${a.asset}: download failed (${res.status}) from ${url}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(cached), { recursive: true });
  fs.writeFileSync(cached, buf);
  const got = sha256File(cached);
  if (got !== a.sha256) {
    fs.rmSync(cached);
    throw new Error(`[videothek] ${a.asset}: sha256 mismatch (pinned ${a.sha256}, got ${got})`);
  }
  return cached;
}

export default function videothek(): AstroIntegration {
  let root = process.cwd();
  return {
    name: 'seez-videothek',
    hooks: {
      'astro:config:setup': ({ config }) => {
        root = fileURLToPath(config.root);
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(PUBLIC_PREFIX, (req, res, next) => {
          const rel = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\/+/, '');
          // Draft preview: /videothek/media/preview/<id>/<full|cover|clip|thumb-N>
          const pv = /^preview\/([a-z0-9_]+)\/(full|cover|clip|thumb-(\d+))$/.exec(rel);
          if (pv) {
            const kind = pv[2].startsWith('thumb') ? 'thumb' : pv[2];
            const file = localMediaPath(pv[1], kind, pv[3] ? Number(pv[3]) : undefined);
            if (fs.existsSync(file)) return serveFile(req, res, file);
            res.statusCode = 404;
            return res.end('no local file');
          }
          // Released asset: serve from cache (fetched on demand).
          const all = allReleasedAssets(readReleases(root)) as Asset[];
          const a = all.find((x) => x.asset === rel);
          if (!a) return next();
          ensureCached(root, a)
            .then((file) => serveFile(req, res, file))
            .catch((e) => {
              res.statusCode = 502;
              res.end(String(e));
            });
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = path.join(fileURLToPath(dir), PUBLIC_PREFIX);
        const data = readReleases(root);
        const releases = data.films || {};
        const tracks = data.tracks || {};
        let n = 0;
        let bytes = 0;
        for (const [id, rel] of Object.entries(releases)) {
          for (const a of releaseAssets(rel) as Asset[]) {
            if (!a.asset.startsWith(`${id}--`))
              throw new Error(`[videothek] asset ${a.asset} does not belong to ${id}`);
            const src = await ensureCached(root, a);
            fs.mkdirSync(out, { recursive: true });
            fs.copyFileSync(src, path.join(out, a.asset));
            n++;
            bytes += a.bytes;
          }
        }
        for (const [slug, t] of Object.entries(tracks)) {
          for (const a of trackAssets(t) as Asset[]) {
            if (!a.asset.startsWith(`track-${slug}--`))
              throw new Error(`[videothek] asset ${a.asset} does not belong to track ${slug}`);
            const src = await ensureCached(root, a);
            fs.mkdirSync(out, { recursive: true });
            fs.copyFileSync(src, path.join(out, a.asset));
            n++;
            bytes += a.bytes;
          }
        }
        logger.info(
          `${Object.keys(releases).length} released film(s), ${Object.keys(tracks).length} track(s), ${n} media file(s), ${(bytes / 1048576).toFixed(1)} MiB`
        );
      },
    },
  };
}
