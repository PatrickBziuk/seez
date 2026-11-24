// @ts-nocheck
/* eslint-disable */
/* Kopie aus dem seez-kit (Video-Baukasten), unverändert. Wird nur geladen, wenn jemand das QUESTLOG-Spiel öffnet. */
/* medium-core.js · MX: Zeichenhelfer der Figuren-Reihe (mv5-Engine) für den Baukasten.
   Nur Werkzeuge, keine Daten und kein Renderer: Liedzeilen kommen aus Seez.lyrics, Schläge aus Seez.audio,
   Bilder als Parameter. Laden nach seez-core.js, vor seezler.js / rpg.js / street.js / notebook.js / szapps.js.
   Koordinaten: Bildpunkte eines 1920×1080-Bildes (wie alle Module). Deterministisch: nur MX.U.rng / h2 / noise1. */
'use strict';
(() => {
  const W = 1920, H = 1080;
  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u;
  const sst = (a, b, t) => { const u = clamp((t - a) / (b - a)); return u * u * (3 - 2 * u); };
  const lin = (a, b, t) => clamp((t - a) / (b - a));
  const ease = u => { u = clamp(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const eout = u => 1 - Math.pow(1 - clamp(u), 3);
  const eob = u => { u = clamp(u); const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const h2 = (a, b = 0) => { let n = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x7f4a7c15, 0xc2b2ae35); n ^= n >>> 15; n = Math.imul(n, 0x2c1b3c6d); n ^= n >>> 12; n = Math.imul(n, 0x297a2d39); n ^= n >>> 15; return (n >>> 0) / 4294967296; };
  const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const noise1 = (x, seed = 0) => { const i = Math.floor(x), u = x - i, s = u * u * (3 - 2 * u); return lerp(h2(i, seed), h2(i + 1, seed), s); };
  const strHash = s => { let n = 2166136261; for (const ch of String(s)) n = Math.imul(n ^ ch.codePointAt(0), 16777619); return n >>> 0; };
  const MX = window.MX = { W, H, U: { clamp, lerp, sst, lin, ease, eout, eob, h2, rng, noise1, strHash } };

  // ---------- Zeichnen ----------
  MX.rr = (c, x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  MX.box = (c, x, y, w, h, r, fill, stroke, lw = 1) => { MX.rr(c, x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } };
  MX.text = (c, s, x, y, font, col, align = 'left', base = 'alphabetic') => { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.fillText(s, x, y); };
  const dims = img => img.fw ? [img.fw, img.fh, img.src] : [img.width, img.height, img];
  MX.cover = (c, img, x, y, w, h, fx = .5, fy = .5, zoom = 1) => { const [iw, ih, src] = dims(img); const s = Math.max(w / iw, h / ih) * zoom, sw = w / s, sh = h / s; c.drawImage(src, (iw - sw) * fx, (ih - sh) * fy, sw, sh, x, y, w, h); };
  MX.contain = (c, img, x, y, w, h) => { const [iw, ih, src] = dims(img); const s = Math.min(w / iw, h / ih), dw = iw * s, dh = ih * s; c.drawImage(src, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); return [x + (w - dw) / 2, y + (h - dh) / 2, dw, dh]; };
  const pool = {};
  MX.off = (k, w = W, h = H) => { let c = pool[k]; if (!c || c.width !== w || c.height !== h) { c = pool[k] = document.createElement('canvas'); c.width = w; c.height = h; } const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, w, h); return [c, x]; };
  MX.canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return [c, c.getContext('2d', { willReadFrequently: true })]; };
  // Zwischenspeicher für einmalig gebaute Texturen: MX.memo('key', () => canvas)
  const memo = {}; MX.memo = (k, fn) => memo[k] || (memo[k] = fn());
  // Ausschnitt eines Bildes als Canvas (rect in Bildpixeln)
  MX.crop = (img, rect) => { const [iw, ih, src] = dims(img); const [x, y, w, h] = rect || [0, 0, iw, ih]; const [o, c] = MX.canvas(w, h); c.drawImage(src, x, y, w, h, 0, 0, w, h); return o; };
  // Figur aus Blatt mit hellem Hintergrund freistellen (Flutfüllung vom Rand), Ergebnis Canvas
  MX.cut = (img, rect, { thr = 34, feather = 26, trim = true } = {}) => {
    const [iw, ih, srcI] = dims(img); const [rx, ry, rw, rh] = rect || [0, 0, iw, ih]; const [cn, c] = MX.canvas(rw, rh); const w = cn.width, h = cn.height;
    c.drawImage(srcI, rx, ry, rw, rh, 0, 0, w, h); const id = c.getImageData(0, 0, w, h), d = id.data;
    const bg = [0, 0, 0]; let n = 0; for (let x = 0; x < w; x += 7) for (const y of [0, h - 1]) { const i = (y * w + x) * 4; bg[0] += d[i]; bg[1] += d[i + 1]; bg[2] += d[i + 2]; n++; } bg[0] /= n; bg[1] /= n; bg[2] /= n;
    const dist = i => Math.max(Math.abs(d[i] - bg[0]), Math.abs(d[i + 1] - bg[1]), Math.abs(d[i + 2] - bg[2]));
    const seen = new Uint8Array(w * h), st = []; const push = (x, y) => { const p = y * w + x; if (seen[p]) return; if (dist(p * 4) > thr + feather) return; seen[p] = 1; st.push(p); };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); } for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (st.length) { const p = st.pop(), x = p % w, y = (p / w) | 0; const dd = dist(p * 4); d[p * 4 + 3] = dd <= thr ? 0 : Math.round(255 * (dd - thr) / feather); if (dd > thr) continue; if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1); }
    c.putImageData(id, 0, 0); if (!trim) return cn;
    let x0 = w, y0 = h, x1 = 0, y1 = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0) return cn; const [o, oc] = MX.canvas(x1 - x0 + 1, y1 - y0 + 1); oc.drawImage(cn, -x0, -y0); return o;
  };
  MX.tint = (src, col) => { const [iw, ih, s] = dims(src); const [o, c] = MX.canvas(iw, ih); c.drawImage(s, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, o.width, o.height); return o; };
  const hx = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  MX.duo = (src, dark, light, { contrast = 1.15, gamma = 1 } = {}) => { const [iw, ih, s] = dims(src); const [o, c] = MX.canvas(iw, ih); c.drawImage(s, 0, 0); const id = c.getImageData(0, 0, o.width, o.height), d = id.data; const A = hx(dark), B = hx(light);
    for (let i = 0; i < d.length; i += 4) { let l = (d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114) / 255; l = clamp((l - .5) * contrast + .5); l = Math.pow(l, gamma); d[i] = A[0] + (B[0] - A[0]) * l; d[i + 1] = A[1] + (B[1] - A[1]) * l; d[i + 2] = A[2] + (B[2] - A[2]) * l; } c.putImageData(id, 0, 0); return o; };
  MX.pixel = (src, w, h, { palette = null, levels = 0, rect = null } = {}) => { const [iw, ih, s] = dims(src); const [o, c] = MX.canvas(w, h); c.imageSmoothingQuality = 'high'; const r = rect || [0, 0, iw, ih]; c.drawImage(s, r[0], r[1], r[2], r[3], 0, 0, w, h); const id = c.getImageData(0, 0, w, h), d = id.data; const pal = palette && palette.map(hx);
    for (let i = 0; i < d.length; i += 4) { d[i + 3] = d[i + 3] > 110 ? 255 : 0; if (!d[i + 3]) continue; if (pal) { let b = 0, bd = 1e9; for (let k = 0; k < pal.length; k++) { const p = pal[k], dd = (d[i] - p[0]) ** 2 * .9 + (d[i + 1] - p[1]) ** 2 * 1.2 + (d[i + 2] - p[2]) ** 2 * .7; if (dd < bd) { bd = dd; b = k; } } d[i] = pal[b][0]; d[i + 1] = pal[b][1]; d[i + 2] = pal[b][2]; } else if (levels) for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] / 255 * (levels - 1)) * 255 / (levels - 1); }
    c.putImageData(id, 0, 0); return o; };
  // Farben: '#rrggbb' mischen / aufhellen
  MX.mix = (a, b, u) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, '0')).join(''); };
  MX.rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
  let grainC = null;
  MX.grain = (c, t, a = .05) => { if (!grainC) { grainC = []; for (let k = 0; k < 6; k++) { const [g, gx] = MX.canvas(480, 270); const id = gx.createImageData(480, 270), r = rng(77 + k); for (let i = 0; i < id.data.length; i += 4) { const v = 255 * r(); id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } gx.putImageData(id, 0, 0); grainC.push(g); } }
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay'; c.imageSmoothingEnabled = false; c.drawImage(grainC[Math.floor(t * 15) % 6], 0, 0, W, H); c.restore(); };
  MX.vignette = (c, a = .5, col = '0,0,0') => { const g = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); };

  // ---------- Text ----------
  MX.wrap = (c, s, maxW) => { const out = []; for (const para of String(s).split('\n')) { let cur = ''; for (const w of para.split(' ')) { const tr = cur ? cur + ' ' + w : w; if (cur && c.measureText(tr).width > maxW) { out.push(cur); cur = w; } else cur = tr; } out.push(cur); } return out; };
  MX.layout = (c, words, maxW, lh) => { const sp = c.measureText(' ').width, items = []; let x = 0, line = 0; for (const w of words) { const ww = c.measureText(w.w).width; if (x > 0 && x + ww > maxW) { x = 0; line++; } items.push({ ...w, x, y: line * lh, width: ww, line }); x += ww + sp; } return { items, lines: line + 1, height: (line + 1) * lh }; };
  MX.flow = (c, words, x, y, t, { font, col = '#fff', dim = null, maxW = 1600, lh = null, align = 'left', mode = 'pop', lead = .04, hi = null, base = 'alphabetic' } = {}) => {
    c.save(); c.font = font; c.textBaseline = base; c.textAlign = 'left'; const size = parseFloat(/(\d+(\.\d+)?)px/.exec(font)[1]); lh = lh || size * 1.25; const L = MX.layout(c, words, maxW, lh); const a0 = c.globalAlpha;
    const lw = []; for (const it of L.items) lw[it.line] = it.x + it.width;
    for (const it of L.items) { const ox = align === 'center' ? -lw[it.line] / 2 : align === 'right' ? -lw[it.line] : 0, px = x + ox + it.x, py = y + it.y; const on = t >= it.s - lead;
      if (!on) { if (dim) { c.globalAlpha = a0; c.fillStyle = dim; c.fillText(it.w, px, py); } continue; }
      if (mode === 'type') { const n = Math.ceil(it.w.length * lin(it.s - lead, Math.max(it.s + .05, Math.min(it.e, it.s + .35)), t)); c.globalAlpha = a0; c.fillStyle = (hi && t < it.e) ? hi : col; c.fillText(it.w.slice(0, n), px, py); }
      else { const k = mode === 'all' ? 1 : sst(it.s - lead, it.s + .12, t); c.globalAlpha = a0 * k; c.fillStyle = (hi && t < it.e + .05) ? hi : col; c.fillText(it.w, px, py + (1 - k) * size * .18); } }
    c.restore(); return L; };
  MX.typed = (words, t, lead = .04) => { let s = ''; for (const w of words) { if (t < w.s - lead) break; const n = Math.ceil(w.w.length * lin(w.s - lead, Math.max(w.s + .05, Math.min(w.e, w.s + .3)), t)); s += (s ? ' ' : '') + w.w.slice(0, n); if (n < w.w.length) break; } return s; };
  // Liedzeile aus reinem Text mit gleichmäßig verteilten Wortzeiten (Entwürfe, Galerie); echte Zeilen kommen aus Seez.lyrics
  MX.line = (txt, s = 0, d = 3) => { const ws = String(txt).split(/\s+/).filter(Boolean); return { s, e: s + d, text: txt, words: ws.map((w, i) => ({ w, s: s + d * i / ws.length, e: s + d * (i + 1) / ws.length })) }; };
  // Ersatz-Audio, wenn keins übergeben wird (gleichmäßige Schläge)
  MX.audioOr = A => A || (MX._metro || (MX._metro = (window.Seez ? Seez.metronome(96, 600) : { pulse: () => 0, count: () => 0, hits: [], rms: () => .2, low: () => .2, mid: () => .2, high: () => .1, lastHit: () => -1 })));
})();

export {};
