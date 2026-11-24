#!/usr/bin/env node
/**
 * Skizzenbuch 2011–2013: traces the scanned/photographed drawings in
 * src/assets/sketches/originals/ into light ink SVGs in public/sketches/.
 *
 * Steps per drawing: crop (and cover stray objects) → grey channel → flatten the
 * paper (divide by a heavy blur, removes shading and uneven light) → threshold →
 * potrace (speckles below turdSize dropped) → svgo (1 decimal) → fill="currentColor".
 *
 * Dev only. The site never runs this; the SVGs are committed. The tools are NOT
 * dependencies of the site, install them anywhere outside the repo:
 *
 *   mkdir -p /tmp/sketch-tools && cd /tmp/sketch-tools
 *   npm i potrace@2.1.8 sharp@0.34.1 svgo@3
 *   SKETCH_TOOLS=/tmp/sketch-tools node scripts/sketches/trace-sketches.mjs [id ...]
 *
 * Tuning lives in SKETCHES below (threshold 0–255 after flattening; higher = more ink).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const TOOLS = process.env.SKETCH_TOOLS;
if (!TOOLS) {
  console.error('SKETCH_TOOLS fehlt (Ordner mit node_modules/potrace, sharp, svgo). Siehe Kopf dieser Datei.');
  process.exit(1);
}
const req = createRequire(path.join(path.resolve(TOOLS), 'noop.js'));
const sharp = req('sharp');
const potrace = req('potrace');
const { optimize } = req('svgo');

const SRC = path.join(ROOT, 'src/assets/sketches/originals');
const OUT = path.join(ROOT, 'public/sketches');

/**
 * id: output name (public/sketches/<id>.svg)
 * crop: {left, top, width, height} in source pixels
 * cover: rectangles (source pixels, before crop) painted white first (pencils, table, notes)
 * erase: rectangles (source pixels) cleared after thresholding (paper edges, neighbours)
 * width: working width for tracing (smaller = lighter SVG)
 * channel: 'lum' (pencil, ink outlines) or 'min' (coloured marks count as ink)
 * blur: sigma of the paper estimate; threshold: ink below this (0–255)
 */
const SKETCHES = [
  {
    id: 'herz-dolch',
    file: 'herz-dolch.jpg',
    crop: { left: 30, top: 80, width: 1870, height: 1390 },
    cover: [{ left: 1740, top: 0, width: 260, height: 360 }],
    erase: [
      { left: 1745, top: 0, width: 400, height: 440 },
      { left: 1705, top: 0, width: 400, height: 350 },
      { left: 1880, top: 0, width: 200, height: 1500 },
    ],
    width: 1400,
    threshold: 210,
    turdSize: 24,
  },
  {
    id: 'auge-absperrband',
    file: 'auge-absperrband.jpg',
    crop: { left: 215, top: 135, width: 1640, height: 1290 },
    erase: [{ left: 0, top: 1360, width: 2000, height: 200 }],
    width: 1200,
    blur: 14,
    threshold: 196,
    turdSize: 40,
  },
  {
    id: 'graffiti-seez',
    file: 'graffiti-seez.jpg',
    width: 1300,
    threshold: 112,
    turdSize: 30,
  },
  {
    id: 'schablone-seez',
    file: 'schablonen-seez.jpg',
    crop: { left: 990, top: 370, width: 1000, height: 790 },
    width: 700,
    channel: 'min',
    blur: 120,
    threshold: 170,
    turdSize: 60,
  },
  {
    id: 'kapuze-tusche',
    file: 'kapuze-tusche.jpg',
    crop: { left: 20, top: 0, width: 570, height: 800 },
    erase: [
      { left: 0, top: 0, width: 150, height: 110 },
      { left: 575, top: 0, width: 40, height: 800 },
    ],
    width: 1000,
    blur: 14,
    threshold: 190,
    turdSize: 30,
  },
  {
    id: 'elysium',
    file: 'elysium.jpg',
    crop: { left: 70, top: 60, width: 1930, height: 1344 },
    width: 1300,
    blur: 12,
    threshold: 200,
    turdSize: 40,
    optTolerance: 1,
  },
  {
    id: 'fischdrache',
    file: 'elysium.jpg',
    crop: { left: 1240, top: 870, width: 490, height: 534 },
    width: 800,
    blur: 14,
    threshold: 200,
    turdSize: 20,
  },
  {
    id: 'forgive',
    file: 'forgive.jpg',
    width: 1200,
    blur: 10,
    threshold: 200,
    turdSize: 40,
    optTolerance: 1,
  },
  {
    id: 'hurt-time',
    file: 'hurt-time.jpg',
    crop: { left: 180, top: 60, width: 1820, height: 1300 },
    width: 1400,
    threshold: 200,
    turdSize: 24,
  },
  {
    id: 'riss-gesicht',
    file: 'riss-gesicht.jpg',
    crop: { left: 0, top: 0, width: 1457, height: 1960 },
    width: 1100,
    threshold: 214,
    turdSize: 24,
  },
  {
    id: 'schloss-love',
    file: 'schloss-love.jpg',
    crop: { left: 60, top: 330, width: 1320, height: 1640 },
    width: 1100,
    threshold: 196,
    turdSize: 24,
  },
];

async function grey(cfg) {
  let img = sharp(path.join(SRC, cfg.file));
  if (cfg.cover?.length) {
    const meta = await img.metadata();
    const composites = cfg.cover.map((r) => ({
      input: { create: { width: r.width, height: r.height, channels: 3, background: '#ffffff' } },
      left: r.left,
      top: r.top,
    }));
    img = sharp(await img.composite(composites).toBuffer(), { limitInputPixels: meta.width * meta.height * 4 });
  }
  if (cfg.crop) img = img.extract(cfg.crop);
  img = img.resize({ width: cfg.width, kernel: 'lanczos3' }).removeAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  const g = Buffer.alloc(n);
  for (let i = 0, p = 0; i < n; i++, p += info.channels) {
    const r = data[p];
    const gg = data[p + 1];
    const b = data[p + 2];
    g[i] = cfg.channel === 'min' ? Math.min(r, gg, b) : Math.round(0.299 * r + 0.587 * gg + 0.114 * b);
  }
  return { g, w: info.width, h: info.height };
}

async function binarise(cfg) {
  const { g, w, h } = await grey(cfg);
  const scale = w / (cfg.crop?.width ?? (await sharp(path.join(SRC, cfg.file)).metadata()).width);
  const paper = await sharp(g, { raw: { width: w, height: h, channels: 1 } })
    .blur(cfg.blur ?? 60)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const bin = Buffer.alloc(w * h);
  for (let i = 0; i < g.length; i++) {
    const flat = Math.min(255, (g[i] / Math.max(1, paper[i])) * 255);
    bin[i] = flat < cfg.threshold ? 0 : 255;
  }
  for (const r of cfg.erase ?? []) {
    const x0 = Math.max(0, Math.floor((r.left - (cfg.crop?.left ?? 0)) * scale));
    const y0 = Math.max(0, Math.floor((r.top - (cfg.crop?.top ?? 0)) * scale));
    const x1 = Math.min(w, Math.ceil((r.left + r.width - (cfg.crop?.left ?? 0)) * scale));
    const y1 = Math.min(h, Math.ceil((r.top + r.height - (cfg.crop?.top ?? 0)) * scale));
    for (let y = y0; y < y1; y++) bin.fill(255, y * w + x0, y * w + Math.max(x0, x1));
  }
  const png = await sharp(bin, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer();
  return { png, w, h };
}

function trace(png, cfg) {
  return new Promise((resolve, reject) => {
    potrace.trace(
      png,
      {
        threshold: 128,
        turdSize: cfg.turdSize ?? 20,
        optTolerance: cfg.optTolerance ?? 0.6,
        alphaMax: 1,
        turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
        color: '#000',
        background: 'transparent',
      },
      (err, svg) => (err ? reject(err) : resolve(svg))
    );
  });
}

function finish(svg, w, h) {
  const d = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]).join(' ');
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path id="ink" fill="currentColor" fill-rule="evenodd" d="${d}"/></svg>`;
  return optimize(raw, {
    multipass: true,
    floatPrecision: 1,
    plugins: [
      {
        name: 'preset-default',
        params: { overrides: { cleanupIds: false, removeViewBox: false } },
      },
    ],
  }).data;
}

const only = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
for (const cfg of SKETCHES) {
  if (only.length && !only.includes(cfg.id)) continue;
  const { png, w, h } = await binarise(cfg);
  if (process.env.SKETCH_DEBUG) fs.writeFileSync(path.join(process.env.SKETCH_DEBUG, `${cfg.id}.png`), png);
  const svg = finish(await trace(png, cfg), w, h);
  fs.writeFileSync(path.join(OUT, `${cfg.id}.svg`), svg);
  console.log(`${cfg.id}.svg  ${w}×${h}  ${(svg.length / 1024).toFixed(0)} KB`);
}
