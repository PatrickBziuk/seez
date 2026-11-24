// @ts-nocheck
/* eslint-disable */
/* Kopie aus dem seez-kit (Video-Baukasten), unverändert. Wird nur geladen, wenn jemand das QUESTLOG-Spiel öffnet. */
/* rpg-parts.js · Rpg, Teil 2: Kachelsatz, Oberwelt-Generator, Archiv, Nebel, Kristall, Portal und die Szenen-Bausteine (c, t, o).
   Braucht rpg.js. Quelle: mv5/lume/video/scenes 04_tiles, 05_world, 10_intro, 20_hook1, 30_v1a, 31_v1b, 40_hook2, 50_v2a, 60_bridge, 65_map, 80_credits.
   Gemeinsame Optionen aller Szenen: th (Rpg.theme), look (Rpg.look), port (Rpg.portrait), name (Namensschild, Standard th.name),
   line / lines (Liedzeilen {s,e,words}), keys (Schlüsselwörter), A (Seez.audio), fade / mosaic / white (Bühne). */
'use strict';
(() => {
  const { clamp, lerp, ease, eout, eob, rng, h2, noise1 } = MX.U;
  const px = Rpg.px, mk = Rpg.mk, DEF = () => Rpg.defTheme(), mix = MX.mix;
  const r8 = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

  // ---------- Regionen / Tageszeit (Paletten aus 04_tiles) ----------
  Rpg.PALS = {
    day: { g0: '#5fae4e', g1: '#4c9644', g2: '#80c85c', g3: '#3a7c3e', gh: '#a8e07c', p0: '#dcbc84', p1: '#c6a26c', p2: '#ecd6a6', pd: '#a27e52', w0: '#3c6cd2', w1: '#4e8aea', w2: '#92c6ff', wf: '#e4f6ff', wd: '#284a9e',
      t0: '#2e6c3c', t1: '#40904a', t2: '#62b45a', t3: '#1c4a32', th: '#94d870', tr: '#7c5234', trd: '#4e3020', f1: '#f6b4c8', f2: '#ffe48a', f3: '#c8acf2', fw: '#ffffff', s0: '#9ea4bc', s1: '#767c98', s2: '#c8cedf', ol: '#1c2a26', sh: 'rgba(16,30,40,0.28)' },
    night: { g0: '#1f4a5a', g1: '#183c4e', g2: '#2a6070', g3: '#12303f', gh: '#3c8a94', p0: '#4c5478', p1: '#3e4666', p2: '#646e96', pd: '#2c3250', w0: '#0f1f50', w1: '#18306c', w2: '#2e6ab0', wf: '#7ff0ff', wd: '#0a1638',
      t0: '#123446', t1: '#1a4858', t2: '#286470', t3: '#0a2030', th: '#3e8a90', tr: '#3e3046', trd: '#261c30', f1: '#7ff0ff', f2: '#ffe48a', f3: '#9ad8ff', fw: '#e8ffff', s0: '#4a5274', s1: '#363c5a', s2: '#6a7498', ol: '#060c18', sh: 'rgba(0,0,10,0.35)' },
    dawn: { g0: '#7aa858', g1: '#669450', g2: '#9cc46c', g3: '#527c48', gh: '#d4e494', p0: '#ecc8a4', p1: '#d8ac8c', p2: '#f8e2c4', pd: '#b08470', w0: '#9a7cc0', w1: '#c49ad0', w2: '#f4c4d4', wf: '#fff0e8', wd: '#6c5aa0',
      t0: '#4a7a5a', t1: '#5e9466', t2: '#88b878', t3: '#33583e', th: '#c8e0a0', tr: '#8a5a44', trd: '#5a3a30', f1: '#ffc4d4', f2: '#ffe8a0', f3: '#e0c4f8', fw: '#ffffff', s0: '#b8a8b8', s1: '#907c94', s2: '#e0d0dc', ol: '#2a2030', sh: 'rgba(60,30,50,0.25)', bl0: '#f2a8c0', bl1: '#ffd0dc', bl2: '#d27c9c' }
  };
  // ---------- Kacheln und Objekte (16×16 Raster) ----------
  const T = Rpg.tiles = {};
  T.grass = (c, ox, oy, P, v, seed) => { const r = rng(seed * 97 + v * 13 + 5); r8(c, ox, oy, 16, 16, P.g0);
    for (let k = 0; k < 7 + v * 2; k++) r8(c, ox + Math.floor(r() * 15), oy + Math.floor(r() * 15), 2, 1, P.g1);
    for (let k = 0; k < 5; k++) { const x = 1 + Math.floor(r() * 13), y = 2 + Math.floor(r() * 12); r8(c, ox + x, oy + y, 1, 1, P.g3); r8(c, ox + x - 1, oy + y - 1, 1, 1, P.g2); r8(c, ox + x + 1, oy + y - 1, 1, 1, P.g2); }
    if (v >= 2) for (let k = 0; k < 3; k++) { const x = 2 + Math.floor(r() * 12), y = 2 + Math.floor(r() * 12); r8(c, ox + x, oy + y, 1, 2, P.g2); r8(c, ox + x, oy + y - 1, 1, 1, P.gh); }
    if (v === 3) for (let k = 0; k < 2; k++) { const x = 3 + Math.floor(r() * 10), y = 3 + Math.floor(r() * 10), col = [P.f1, P.f2, P.f3][Math.floor(r() * 3)];
      r8(c, ox + x, oy + y - 1, 1, 1, col); r8(c, ox + x - 1, oy + y, 3, 1, col); r8(c, ox + x, oy + y + 1, 1, 1, col); r8(c, ox + x, oy + y, 1, 1, P.f2); r8(c, ox + x, oy + y + 2, 1, 1, P.g3); } };
  T.path = (c, ox, oy, P, seed) => { const r = rng(seed * 61 + 7); r8(c, ox, oy, 16, 16, P.p0); for (let k = 0; k < 10; k++) r8(c, ox + Math.floor(r() * 16), oy + Math.floor(r() * 16), 1, 1, r() < .5 ? P.p1 : P.p2);
    for (let k = 0; k < 2; k++) { const x = 1 + Math.floor(r() * 13), y = 1 + Math.floor(r() * 13); r8(c, ox + x, oy + y, 2, 1, P.pd); r8(c, ox + x, oy + y - 1, 2, 1, P.p2); } };
  T.water = (c, ox, oy, P, f, seed) => { const r = rng(seed * 41 + 3); r8(c, ox, oy, 16, 16, P.w0);
    for (let k = 0; k < 4; k++) { const x = Math.floor(r() * 12), y = 1 + Math.floor(r() * 14), w = 2 + Math.floor(r() * 3), dx = f ? 2 : 0; r8(c, ox + (x + dx) % 14, oy + y, w, 1, P.w1); if (k < 2) r8(c, ox + (x + dx + 1) % 14, oy + y - 1, w - 1, 1, P.w2); }
    if ((seed + f) % 3 === 0) r8(c, ox + 4 + f * 5, oy + 6 + f * 3, 1, 1, P.wf); };
  T.stone = (c, ox, oy, seed, s0 = '#6c6a88', s1 = '#585672', s2 = '#8a88a8', sd = '#3e3c56') => { const r = rng(seed * 17 + 1); r8(c, ox, oy, 16, 16, s0); r8(c, ox, oy + 7, 16, 1, sd); r8(c, ox, oy + 15, 16, 1, sd); const a = (seed % 2) * 8; r8(c, ox + 3 + a, oy, 1, 7, sd); r8(c, ox + 11 - a, oy + 8, 1, 7, sd);
    r8(c, ox, oy, 16, 1, s2); r8(c, ox, oy + 8, 16, 1, s2); for (let k = 0; k < 6; k++) r8(c, ox + Math.floor(r() * 16), oy + Math.floor(r() * 16), 1, 1, s1); };
  T.wood = (c, ox, oy, seed) => { const r = rng(seed * 23 + 9); r8(c, ox, oy, 16, 16, '#9a6a44'); for (let j = 0; j < 4; j++) { r8(c, ox, oy + j * 4 + 3, 16, 1, '#5c3a26'); r8(c, ox, oy + j * 4, 16, 1, '#b07e54'); r8(c, ox + Math.floor(r() * 16), oy + j * 4, 1, 3, '#5c3a26'); r8(c, ox + Math.floor(r() * 14), oy + j * 4 + 1, 3, 1, '#86583a'); } };
  T.tree = (c, cx, by, P, seed, blossom = false) => { const r = rng(seed * 7 + 11); const rad = 11 + Math.floor(r() * 3), cy = by - 14 - rad + 4; const L = blossom ? [P.bl2, P.bl0, P.bl1, P.fw] : [P.t3, P.t0, P.t1, P.t2];
    c.fillStyle = P.sh; c.fillRect(cx - 9, by - 3, 18, 3); c.fillRect(cx - 7, by, 14, 1);
    r8(c, cx - 2, by - 12, 5, 12, P.tr); r8(c, cx + 1, by - 12, 2, 12, P.trd); r8(c, cx - 3, by - 2, 7, 2, P.trd); r8(c, cx - 2, by - 9, 1, 3, P.trd);
    const bumps = []; for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + r(); bumps.push([Math.cos(a) * rad * .62, Math.sin(a) * rad * .5, rad * .5 + r() * 2]); } bumps.push([0, 0, rad * .8]);
    const inside = (x, y) => bumps.some(([bx, by2, br]) => (x - bx) ** 2 + (y - by2) ** 2 <= br * br);
    for (let y = -rad - 2; y <= rad + 2; y++) for (let x = -rad - 3; x <= rad + 3; x++) { if (!inside(x, y)) continue; const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      const lv = .55 - (x + y) / (rad * 2.6) + (inside(x + 2, y + 2) ? 0 : -.35) + (inside(x - 2, y - 2) ? 0 : .3); let k = lv < .25 ? 0 : lv < .55 ? 1 : lv < .85 ? 2 : 3; if ((k === 1 || k === 2) && ((x + y) & 1) && Math.abs(lv - (k === 1 ? .55 : .85)) < .08) k++;
      c.fillStyle = edge ? P.ol : L[Math.min(3, k)]; c.fillRect(cx + x, cy + y, 1, 1); }
    for (let k = 0; k < 6; k++) { const x = Math.round((r() - .7) * rad), y = Math.round((r() - .75) * rad); if (inside(x, y) && inside(x + 1, y + 1)) r8(c, cx + x, cy + y, 2, 1, blossom ? P.fw : P.th); }
    if (!blossom && r() < .4) { r8(c, cx + 4, cy + 2, 1, 1, P.f1); r8(c, cx - 5, cy + 5, 1, 1, P.f1); } };
  T.bush = (c, cx, by, P, seed) => { const r = rng(seed * 3 + 2); c.fillStyle = P.sh; c.fillRect(cx - 7, by - 1, 15, 2);
    const ins = (x, y) => (x / 7.2) ** 2 + ((y + 4) / 4.8) ** 2 <= 1 || ((x + 3) / 3.6) ** 2 + ((y + 7) / 2.6) ** 2 <= 1 || ((x - 3) / 3.4) ** 2 + ((y + 6.5) / 2.8) ** 2 <= 1;
    for (let y = -10; y <= 0; y++) for (let x = -8; x <= 8; x++) { if (!ins(x, y)) continue; const e = !ins(x - 1, y) || !ins(x + 1, y) || !ins(x, y - 1) || !ins(x, y + 1); const top = !ins(x, y - 2), bot = !ins(x, y + 2);
      c.fillStyle = e ? P.ol : top && x < 3 ? P.t2 : bot ? P.t3 : ((x * 3 + y * 5 + seed) % 7 === 0 ? P.t2 : P.t0); c.fillRect(cx + x, by + y, 1, 1); }
    r8(c, cx - 4, by - 8, 2, 1, P.th); r8(c, cx + 2, by - 8, 1, 1, P.th); if (r() < .6) { r8(c, cx + 2, by - 4, 1, 1, P.f1); r8(c, cx - 2, by - 3, 1, 1, P.f1); r8(c, cx + 4, by - 2, 1, 1, P.f1); } };
  T.rock = (c, cx, by, P) => { c.fillStyle = P.sh; c.fillRect(cx - 5, by - 1, 11, 2); r8(c, cx - 4, by - 6, 9, 6, P.ol); r8(c, cx - 3, by - 7, 7, 1, P.ol); r8(c, cx - 3, by - 6, 7, 5, P.s1); r8(c, cx - 3, by - 6, 5, 3, P.s0); r8(c, cx - 2, by - 6, 2, 1, P.s2); };
  T.sign = (c, cx, by, P) => { r8(c, cx - 1, by - 8, 2, 8, P.trd); r8(c, cx - 6, by - 14, 12, 7, P.ol); r8(c, cx - 5, by - 13, 10, 5, '#b8864e'); r8(c, cx - 5, by - 13, 10, 1, '#d8a46a'); r8(c, cx - 4, by - 11, 7, 1, '#6a4428'); r8(c, cx - 4, by - 9, 5, 1, '#6a4428'); };
  T.lantern = (c, cx, by) => { r8(c, cx - 1, by - 14, 2, 14, '#2a2438'); r8(c, cx - 3, by - 2, 6, 2, '#2a2438'); r8(c, cx - 3, by - 20, 6, 7, '#2a2438'); r8(c, cx - 2, by - 19, 4, 5, '#ffd870'); r8(c, cx - 1, by - 18, 2, 3, '#fff6c8'); r8(c, cx - 4, by - 21, 8, 1, '#3a3450'); };
  // Speicherpunkt-Kristall (k = Leuchten 0..1), Farbe col
  px.crystal = (g, cx, by, k, t, col = '#6ff0ff') => { const cy = by - 12 + Math.round(Math.sin(t * 2.4) * 1.2); const A = k > .5 ? [mix(col, '#ffffff', .8), col, mix(col, '#000000', .3), mix(col, '#000000', .7)] : ['#8a90b8', '#5a6090', '#3a3e66', '#1e2040'];
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(cx - 4, by - 1, 9, 2);
    ['....K....', '...KaK...', '..KabcK..', '..KabcK..', '.KaabccK.', '.KabbccK.', 'KaabbcccK', '.KbbccdK.', '.KbccddK.', '..KcddK..', '..KcddK..', '...KdK...', '....K....'].forEach((s, j) => { for (let i = 0; i < 9; i++) { const ch = s[i]; if (ch === '.') continue; g.fillStyle = ch === 'K' ? '#0a0a1e' : A['abcd'.indexOf(ch)]; g.fillRect(cx - 4 + i, cy - 6 + j, 1, 1); } });
    if (k > 0) { px.glow(g, cx + .5, cy, 10 + k * 18, col, .55 * k); px.spark(g, cx + 3, cy - 5, (Math.sin(t * 6) * .5 + .5) * k, mix(col, '#ffffff', .6)); } };
  // Portal-Ring (Radius r, Öffnung k), Randfarbe col
  px.portalRing = (g, cx, cy, r, k, t, col = '#6ff0ff') => { if (k <= 0) return; const rx = Math.max(1, r * .75 * k), ry = Math.max(1, r * k); px.glow(g, cx, cy, r * 2, mix(col, '#6e8cff', .4), .45 * k);
    const S = ['#0c0828', '#1c1450', '#2e2478', '#4a3aa8', '#7a6ad8'], hi = mix(col, '#ffffff', .8), dk = mix(col, '#000000', .3);
    for (let y = Math.floor(-ry); y <= ry; y++) for (let x = Math.floor(-rx); x <= rx; x++) { const d = Math.hypot(x / rx, y / ry); if (d > 1) continue; let cc;
      if (d > .9) cc = ((Math.atan2(y, x) * 8 + t * 9) | 0) % 3 === 0 ? hi : col; else if (d > .8) cc = dk; else { const sw = Math.sin(Math.atan2(y, x) * 3 + d * 9 - t * 7); cc = S[Math.max(0, Math.min(4, Math.floor(d * 3 + sw * 1.2)))]; }
      g.fillStyle = cc; g.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1); }
    for (let i = 0; i < 8; i++) { const a = t * 2.4 + i * .785, q = .55 + .3 * (((t * .7 + i * .13) % 1)); px.dot(g, cx + Math.cos(a) * rx * q, cy + Math.sin(a) * ry * q, '#d4c4ff'); } };

  // ---------- Oberwelt-Generator (120×12 Kacheln, Weg in der Mitte, Fluss unten, Bach mit Brücke, Teich) ----------
  const TW = 120, TH = 12, TS = 16; Rpg.OW = { TW, TH, PY: 103, CAMY: 4 };
  const layout = seed => { if (!seed) return { br: [[14, 2], [62, 0], [96, 2]], creek: 52, pond: 81, signs: [18, 104] };
    const r = rng(seed * 7919 + 13), b1 = 8 + Math.floor(r() * 14), cr = 30 + Math.floor(r() * 14), b2 = 56 + Math.floor(r() * 10), pd = 74 + Math.floor(r() * 10), b3 = 90 + Math.floor(r() * 16);
    return { br: [[b1, Math.floor(r() * 3)], [b2, Math.floor(r() * 3)], [b3, Math.floor(r() * 3)]], creek: cr, pond: pd, signs: [b1 + 4, Math.min(116, b3 + 8)] }; };
  const terrain = (Lo, seed) => { const g = []; for (let y = 0; y < TH; y++) g.push(new Array(TW).fill('G')); for (let x = 0; x < TW; x++) { g[5][x] = 'P'; g[6][x] = 'P'; }
    for (const [x0, y0] of Lo.br) for (let x = x0; x <= x0 + 1; x++) for (let y = y0; y < 5; y++) g[y][x] = 'P';
    for (let x = 0; x < TW; x++) { const b = 9 + Math.round(noise1(x * .18, 4 + seed) * 1.6); for (let y = b; y < TH; y++) g[y][x] = 'W'; }
    for (let y = 0; y < TH; y++) { if (g[y][Lo.creek] !== 'P') g[y][Lo.creek] = 'W'; if (y < 5 || y > 6) g[y][Lo.creek + 1] = 'W'; }
    for (let y = 0; y < 4; y++) for (let x = Lo.pond - 3; x < Lo.pond + 3; x++) if ((x - Lo.pond) ** 2 / 9 + (y - 1) ** 2 / 4 < 1.1 && g[y][x] !== 'P') g[y][x] = 'W';
    return g; };
  const isP = (g, x, y) => x >= 0 && y >= 0 && x < TW && y < TH && g[y][x] === 'P', isW = (g, x, y) => !(x < 0 || y < 0 || x >= TW || y >= TH) && g[y][x] === 'W';
  const objects = (g, region, seed, Lo) => { const r = rng((region === 'day' ? 11 : region === 'night' ? 23 : 37) + seed * 1000), O = [];
    for (let x = 0; x < TW; x++) { if (x === Lo.creek || x === Lo.creek + 1) continue; if (r() < .62 && !isP(g, x, 2) && !isW(g, x, 1)) O.push({ k: 'tree', x: x * 16 + 8 + Math.round((r() - .5) * 6), y: 28 + Math.round(r() * 12), s: x * 3 + 1 + seed }); }
    for (let x = 0; x < TW; x += 2) { const y = 3 + Math.floor(r() * 2); if (g[y][x] !== 'G' || g[y + 1] && g[y + 1][x] === 'P' && r() < .5) continue; const q = r();
      if (q < .22) O.push({ k: 'bush', x: x * 16 + 8, y: y * 16 + 13, s: x }); else if (q < .3) O.push({ k: 'rock', x: x * 16 + 8, y: y * 16 + 12 }); }
    for (let x = 1; x < TW; x += 3) { const y = 7 + Math.floor(r() * 2); if (g[y][x] !== 'G') continue; const q = r(); if (q < .25) O.push({ k: 'bush', x: x * 16 + 8, y: y * 16 + 12, s: x + 50 }); else if (q < .33) O.push({ k: 'rock', x: x * 16 + 6, y: y * 16 + 12 }); }
    for (let x = 4; x < TW; x += 11) if (x !== Lo.creek && x !== Lo.creek + 1) O.push({ k: region === 'night' ? 'lantern' : 'bush', x: x * 16 + 4, y: 78, s: x + 99 });
    for (const sx of Lo.signs) O.push({ k: 'sign', x: sx * 16 + 6, y: 78 });
    return O.sort((a, b) => a.y - b.y); };
  // Karte bauen (einmal je Region/Seed): { region, P, g, maps[2 Wasserbilder], O, lan, fl, GF }
  Rpg.world = ({ region = 'day', seed = 0 } = {}) => MX.memo('rpg.world.' + region + '.' + seed, () => {
    const P = Rpg.PALS[region] || Rpg.PALS.day, Lo = layout(seed), g = terrain(Lo, seed), maps = [], O = objects(g, region, seed, Lo), GF = [];
    { const r = rng(808 + seed); for (let k = 0; k < 140; k++) { const x = Math.floor(r() * TW), y = [3, 4, 7, 8][Math.floor(r() * 4)]; if (g[y][x] === 'G') GF.push([x * 16 + 3 + Math.floor(r() * 10), y * 16 + 3 + Math.floor(r() * 10)]); } }
    for (let f = 0; f < 2; f++) { const [cv, c] = mk(TW * TS, TH * TS);
      for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { const s = x * 31 + y * 7, ox = x * TS, oy = y * TS;
        if (g[y][x] === 'G') { const h = h2(x + seed * 131, y + 3); T.grass(c, ox, oy, P, h < .45 ? 0 : h < .8 ? 1 : h < .93 ? 2 : 3, s); } else if (g[y][x] === 'P') T.path(c, ox, oy, P, s); else T.water(c, ox, oy, P, f, s); }
      for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { if (!isP(g, x, y)) continue; const ox = x * TS, oy = y * TS;
        for (let i = 0; i < 16; i++) { const n = h2(x * 16 + i, y * 5 + 1), d = n < .3 ? 0 : n < .8 ? 1 : 2;
          if (!isP(g, x, y - 1) && !isW(g, x, y - 1)) { r8(c, ox + i, oy, 1, d + 1, P.g1); r8(c, ox + i, oy + d + 1, 1, 1, P.pd); }
          if (!isP(g, x, y + 1) && !isW(g, x, y + 1)) { r8(c, ox + i, oy + 15 - d, 1, d + 1, P.g0); r8(c, ox + i, oy + 15 - d, 1, 1, P.g2); }
          if (!isP(g, x - 1, y) && !isW(g, x - 1, y)) { r8(c, ox, oy + i, d + 1, 1, P.g1); r8(c, ox + d + 1, oy + i, 1, 1, P.pd); }
          if (!isP(g, x + 1, y) && !isW(g, x + 1, y)) r8(c, ox + 15 - d, oy + i, d + 1, 1, P.g1); } }
      for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { if (!isW(g, x, y)) continue; const ox = x * TS, oy = y * TS;
        if (y > 0 && !isW(g, x, y - 1)) { r8(c, ox, oy, 16, 1, P.ol); r8(c, ox, oy + 1, 16, 2, P.wd); for (let i = 0; i < 16; i++) if (h2(x * 16 + i + f * 3, y) < .45) r8(c, ox + i, oy + 3, 1, 1, P.wf); }
        if (x > 0 && !isW(g, x - 1, y)) { r8(c, ox, oy, 2, 16, P.wd); r8(c, ox, oy, 1, 16, P.ol); }
        if (x < TW - 1 && !isW(g, x + 1, y)) { r8(c, ox + 14, oy, 2, 16, P.wd); r8(c, ox + 15, oy, 1, 16, P.ol); }
        if (y < TH - 1 && !isW(g, x, y + 1)) r8(c, ox, oy + 15, 16, 1, P.g3); }
      const bx = Lo.creek * TS; r8(c, bx - 2, 5 * TS - 2, 36, 36, P.ol); for (let i = 0; i < 8; i++) { r8(c, bx - 1, 5 * TS - 1 + i * 4, 34, 4, i % 2 ? '#8a5a36' : '#a06c42'); r8(c, bx - 1, 5 * TS + 2 + i * 4, 34, 1, '#5a3820'); }
      r8(c, bx - 2, 5 * TS - 3, 36, 2, '#5a3820'); r8(c, bx - 2, 7 * TS, 36, 2, '#5a3820');
      if (region === 'night') for (const [fx, fy] of GF) { r8(c, fx, fy + 1, 1, 3, '#0a2a30'); r8(c, fx - 1, fy, 3, 1, '#7ff0ff'); r8(c, fx, fy - 1, 1, 3, '#7ff0ff'); r8(c, fx, fy, 1, 1, '#e8ffff'); }
      for (const o of O) { if (o.k === 'tree') T.tree(c, o.x, o.y, P, o.s, region === 'dawn' && o.s % 4 === 1); else if (o.k === 'bush') T.bush(c, o.x, o.y, P, o.s); else if (o.k === 'rock') T.rock(c, o.x, o.y, P); else if (o.k === 'sign') T.sign(c, o.x, o.y, P); else T.lantern(c, o.x, o.y); }
      maps.push(cv); }
    const fl = [], r = rng(region.length * 131 + seed); for (let k = 0; k < 40; k++) fl.push([r() * TW * TS, 20 + r() * 150, r() * 10]);
    return { region, P, g, maps, O, lan: O.filter(o => o.k === 'lantern'), fl, GF, Lo }; });
  let CL = null;
  const cloud = () => CL || (CL = (() => { const [c, x] = mk(110, 52), r = rng(5), b = []; for (let k = 0; k < 7; k++) b.push([22 + r() * 66, 16 + r() * 20, 9 + r() * 11]);
    x.fillStyle = 'rgba(16,24,60,0.13)'; for (let j = 0; j < 52; j++) for (let i = 0; i < 110; i++) if (b.some(([bx, by, br]) => Math.hypot(i - bx, (j - by) * 1.5) < br)) x.fillRect(i, j, 1, 1); return c; })());
  // Oberwelt zeichnen (Licht je Region: Tag = Wolkenschatten, Nacht = Laternen/Glühwürmchen/Leuchtblumen, Morgen = Lichtbahnen). Gibt camX zurück.
  px.world = (g, M, camX, t, { dark = 0 } = {}) => { camX = Math.round(clamp(camX, 0, TW * TS - 320)); g.drawImage(M.maps[Math.floor(t * 2.2) % 2], camX, Rpg.OW.CAMY, 320, 180, 0, 0, 320, 180);
    if (M.region !== 'night') { const C = cloud(); for (let k = 0; k < 4; k++) { const sx = ((k * 211 + t * 9 - camX * .35) % 560 + 560) % 560 - 120, sy = 10 + k * 37 % 120; g.drawImage(C, Math.round(sx), Math.round(sy)); } }
    if (M.region === 'night') { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(70,80,150)'; g.globalAlpha = .55; g.fillRect(0, 0, 320, 180); g.restore();
      for (const o of M.lan) { const x = o.x - camX, y = o.y - Rpg.OW.CAMY - 16; if (x < -40 || x > 360) continue; const f = .9 + .1 * Math.sin(t * 9 + o.x); px.glow(g, x, y, 26 * f, '#ffc85a', .55); px.glow(g, x, y + 16, 34, '#ffbe5a', .25); }
      for (const [fx, fy] of M.GF) { const x = fx - camX, y = fy - Rpg.OW.CAMY; if (x < -6 || x > 326) continue; px.glow(g, x + .5, y + .5, 6, '#6ff0ff', .3 + .15 * Math.sin(t * 2 + fx)); }
      for (const [fx, fy, ph] of M.fl) { const x = ((fx + Math.sin(t * .7 + ph) * 14 - camX) % 640 + 640) % 640 - 160, y = fy + Math.sin(t * 1.1 + ph * 2) * 8; if (x < -4 || x > 324) continue; const on = .5 + .5 * Math.sin(t * 3 + ph * 5);
        if (on > .3) { px.dot(g, x, y, on > .7 ? '#f8ffb0' : '#d8f070'); px.glow(g, x + .5, y + .5, 5, '#dcff8c', .5 * on); } } }
    if (M.region === 'dawn') { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const x0 = ((k * 97 - camX * .5) % 420 + 420) % 420 - 60; g.globalAlpha = .07 + .03 * Math.sin(t + k); g.fillStyle = '#ffc8a0'; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 26, 0); g.lineTo(x0 - 50, 180); g.lineTo(x0 - 80, 180); g.fill(); } g.restore();
      g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,170,140,0.35)'; g.fillRect(0, 0, 320, 180); g.restore(); }
    if (dark > 0) { g.fillStyle = `rgba(4,4,14,${dark})`; g.fillRect(0, 0, 320, 180); }
    return camX; };
  // Kacheln einer Region fliegen aus dem Dunkel an ihren Platz (Level baut sich), ab at
  px.assemble = (g, t, { at = 0, region = 'night', seed = 0, cam = 372 } = {}) => { const M = Rpg.world({ region, seed }); if (t >= at + 2.4) { px.world(g, M, cam, t); return; }
    const tiles = MX.memo('rpg.asm', () => { const r = rng(171), o = []; for (let j = 0; j < 12; j++) for (let i = 0; i < 20; i++) { const d = Math.hypot(i - 9.5, (j - 5.5) * 1.6) / 11; o.push({ i, j, dt: .02 + d * 1.2 + r() * .4, a: r() * Math.PI * 2, rr: 160 + r() * 140 }); } return o; });
    px.rect(g, 0, 0, 320, 180, '#04040e'); for (let k = 0; k < 40; k++) px.dot(g, (k * 71) % 320, (k * 37) % 180, k % 3 ? '#2a2a5a' : '#6a6aaa'); const f = Math.floor(t * 2.2) % 2;
    for (const q of tiles) { const ts = at + q.dt; if (t < ts) continue; const u = eout(clamp((t - ts) / .5)), x = q.i * 16 + Math.cos(q.a) * q.rr * (1 - u), y = q.j * 16 + Math.sin(q.a) * q.rr * (1 - u);
      g.drawImage(M.maps[f], cam + q.i * 16, Rpg.OW.CAMY + q.j * 16, 16, 16, Math.round(x), Math.round(y), 16, 16); if (u < 1) { px.rect(g, x, y, 16, 1, 'rgba(160,240,255,0.7)'); px.rect(g, x, y + 15, 16, 1, 'rgba(10,10,30,0.6)'); } }
    if (region === 'night') { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(70,80,150)'; g.globalAlpha = .55; g.fillRect(0, 0, 320, 180); g.restore(); } };

  // ---------- Archiv (Innenraum, ein Bildschirm) ----------
  const SPINE = ['#c84a5a', '#4a7ac8', '#e0b048', '#6ab86a', '#a07cd8', '#e88a4a', '#4ab8b0', '#d8d0c0', '#7a5a8a', '#3a5aa0'];
  T.shelf = (c, x, y, seed, h = 32) => { const r = rng(seed * 13 + 1); r8(c, x, y, 16, h, '#2a160c'); r8(c, x + 1, y + 1, 14, h - 2, '#7a4a2a'); r8(c, x + 2, y + 2, 12, h - 4, '#4a2a18');
    const rows = Math.floor((h - 4) / 10); for (let k = 0; k < rows; k++) { const by = y + 2 + k * 10 + 9; r8(c, x + 1, by, 14, 1, '#9a6238'); let bx = x + 2;
      while (bx < x + 14) { const q = r(); if (q < .18) { if (bx + 4 > x + 14) break; r8(c, bx, by - 7, 4, 7, '#8a8ea8'); r8(c, bx + 1, by - 5, 2, 3, SPINE[Math.floor(r() * SPINE.length)]); r8(c, bx, by - 7, 4, 1, '#b8bcd0'); bx += 4; }
        else if (q < .26) bx += 1; else { const w = 1 + (r() < .4 ? 1 : 0), hh = 6 + Math.floor(r() * 3); if (bx + w > x + 14) break; r8(c, bx, by - hh, w, hh, SPINE[Math.floor(r() * SPINE.length)]); r8(c, bx, by - hh, w, 1, 'rgba(255,255,255,0.25)'); bx += w; } } }
    r8(c, x + 1, y + 1, 14, 1, '#b07848'); };
  const ARCH = () => MX.memo('rpg.archive', () => { const [cv, c] = mk(320, 192); for (let y = 0; y < 12; y++) for (let x = 0; x < 20; x++) { if (y >= 3 && x >= 7 && x <= 12) T.stone(c, x * 16, y * 16, x + y * 3); else T.wood(c, x * 16, y * 16, x * 7 + y); }
    r8(c, 136, 48, 48, 144, '#5a2a4a'); r8(c, 138, 48, 44, 144, '#8a3a5a'); r8(c, 140, 48, 1, 144, '#e0b048'); r8(c, 179, 48, 1, 144, '#e0b048'); for (let y = 52; y < 192; y += 8) r8(c, 156, y, 8, 3, '#a84a6a');
    r8(c, 0, 0, 320, 48, '#2c2440'); for (let x = 0; x < 320; x += 16) T.shelf(c, x, 2, x + 3, 42); r8(c, 0, 44, 320, 4, '#1a1428'); r8(c, 0, 44, 320, 1, '#3e3458');
    for (const [x0, y0] of [[16, 72], [64, 72], [208, 72], [256, 72], [16, 128], [64, 128], [208, 128], [256, 128]]) { c.fillStyle = 'rgba(10,6,20,0.35)'; c.fillRect(x0, y0 + 30, 32, 4); T.shelf(c, x0, y0, x0 + y0, 32); T.shelf(c, x0 + 16, y0, x0 * 3 + y0, 32); }
    return cv; });
  px.archive = (g, t, { dim = 0 } = {}) => { g.drawImage(ARCH(), 0, -8);
    for (const lx of [80, 240]) { px.rect(g, lx, 0, 1, 6, '#3a3050'); px.rect(g, lx - 3, 6, 7, 3, '#e0b048'); px.rect(g, lx - 2, 9, 5, 1, '#fff0a0'); px.glow(g, lx, 10, 46 + Math.sin(t * 2 + lx) * 2, '#ffc878', .22); }
    for (let k = 0; k < 16; k++) { const ph = k * 1.7, x = (k * 41 + Math.sin(t * .4 + ph) * 12) % 320, y = ((k * 23 + t * 4) % 110) + 10; if (Math.sin(t * 1.3 + ph) > 0) px.dot(g, x, y, 'rgba(255,240,200,0.55)'); }
    if (dim > 0) px.rect(g, 0, 0, 320, 180, `rgba(6,6,20,${dim})`); };
  const backdrop = (g, t, b, dim) => { if (typeof b === 'function') b(g, t); else if (b && b.region) px.world(g, Rpg.world(b), b.cam || 372, t, { dark: dim }); else px.archive(g, t, { dim }); };

  // ---------- Nebel (geordnetes Dithering über weichem Rauschen, zwei Ebenen) ----------
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const fogTex = () => MX.memo('rpg.fogtex', () => [0, 1].map(L => { const [c, x] = mk(640, 180); x.fillStyle = L ? '#9a96c8' : '#c8c4e8';
    for (let j = 0; j < 180; j++) for (let i = 0; i < 640; i++) { const n = .62 * noise1(i * .021 + j * .013 + L * 7, 3 + L) + .38 * noise1(j * .045 - i * .006, 8 + L); if (BAY[(j & 3) * 4 + (i & 3)] / 16 < (n - .25) * 1.5) x.fillRect(i, j, 1, 1); } return c; }));
  // Nebel ab Bildspalte x0 nach rechts (Übergangsbreite w), Stärke a
  px.fog = (g, t, x0, a = 1, w = 90) => { const F = fogTex(); const [oc, ox] = MX.off('rpg.fog', 320, 180); ox.imageSmoothingEnabled = false;
    for (let L = 0; L < 2; L++) { ox.globalAlpha = L ? .55 : .8; ox.drawImage(F[L], Math.round((t * (6 + L * 5)) % 320), 0, 320, 180, 0, 0, 320, 180); }
    ox.globalAlpha = 1; ox.globalCompositeOperation = 'destination-in'; const gr = ox.createLinearGradient(x0, 0, x0 + w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${clamp(a)})`); ox.fillStyle = gr; ox.fillRect(0, 0, 320, 180);
    ox.globalCompositeOperation = 'source-over'; g.drawImage(oc, 0, 0); };

  // ================= Szenen-Bausteine (c, t, o) =================
  const common = o => ({ th: o.th || DEF(), look: o.look || Rpg.LOOKS.lume, A: MX.audioOr(o.A) });
  const tb = (g, t, o, th, line, extra = {}) => px.textbox(g, t, { line, port: o.port === undefined ? null : o.port, name: o.name, keys: o.keys, th, ex: o.ex || 0, ...extra });

  /* Rpg.hook — wiederkehrende Oberwelt-Ansicht. o: region 'day'|'night'|'dawn', seed, ts (Laufbeginn), x0 (Kartenpixel), speed, walk:false (steht),
     line / lines (Textbox), choice { items, at, selAt, okAt, until, sel } (Zeiger springt bei selAt, blitzt bei okAt; Figur bleibt stehen),
     bar { label, v0, v1, line } (füllt sich wortweise) | false, counter { base } | false, companion { join } | false, notice [text, a, b], close */
  Rpg.hook = (c, t, o = {}) => { const { th, look, A } = common(o), region = o.region || 'day', M = Rpg.world({ region, seed: o.seed || 0 }), lines = o.lines || (o.line ? [o.line] : []), ch = o.choice;
    const pauses = o.pauses || (ch ? [[ch.at - .1, ch.until + .2]] : []), ts = o.ts || 0, x0 = o.x0 == null ? 500 : o.x0, night = region === 'night';
    Rpg.stage(c, t, o, g => {
      const x = o.walk === false ? x0 : Rpg.walkX(t, ts, x0, pauses, o.speed || 34), walking = o.walk !== false && t >= ts && !Rpg.inPause(t, pauses);
      const camX = px.world(g, M, x - (o.camAt == null ? 128 : o.camAt), t, { dark: o.dark || 0 }), sx = x - camX, sy = Rpg.OW.PY - Rpg.OW.CAMY;
      px.hero(g, sx, sy, walking ? 'right' : 'down', t, { look, walk: walking ? t * 5.8 : null, light: night ? 1 : .35, blink: !walking && (t % 2.9) < .12, pulse: A.pulse(t, .18) });
      if (o.companion !== false) { const cj = o.companion && o.companion.join; let [bx, by] = Rpg.bfPath(sx, sy - 30, t), on = true;
        if (cj != null) { const k = eout(clamp((t - (cj - .9)) / .9)); on = t >= cj - .9; bx = lerp(330, bx, k); by = lerp(10, by, k) + Math.sin(t * 7) * 3 * (1 - k); }
        if (on) px.companion(g, bx, by, t, { col: th.companion, glow: night ? .7 : .3 }); }
      if (ch && t > ch.at + .2 && t < ch.okAt + .2) { const bx = sx + 6, by = sy - 34; px.frame(g, bx, by, 15, 11, th.win); for (let i = 0; i < 3; i++) if (Math.floor(t * 4) % 4 > i) px.dot(g, bx + 4 + i * 3, by + 6, th.white); }
      if (ch && t > ch.okAt && t < ch.okAt + .6) px.spark(g, sx + 5, sy - 30, 1 - (t - ch.okAt) / .6, th.gold);
      if (o.counter !== false) px.counter(g, t, { n: ((o.counter && o.counter.base) || 0) + A.count(t, ts), pulse: A.pulse(t, .12, ts), col: th.gold });
      if (o.bar !== false) { const B = o.bar || {}, bl = B.line || lines[lines.length - 1], on = B.at == null ? (bl ? bl.s - .25 : 0) : B.at; if (t > on) { const k = clamp((t - on) / .15); px.frame(g, 4, 4, 104, 16, 'dark', k);
        if (k >= 1) { const v0 = B.v0 || 0, v1 = B.v1 == null ? .62 : B.v1; let v = v0; if (bl) bl.words.forEach((w, i) => { if (t >= w.s) v = lerp(v0, v1, (i + 1) / bl.words.length); });
          const pk = bl ? A.pulse(t, .15, bl.s) : 0; px.bar(g, 9, 7, 46, Rpg.fit(B.label || 'Neugier', 44), v, { col: pk > .5 ? '#e8ffff' : th.bar, col2: th.bar2 }); if (v >= .999) px.text(g, 'MAX', 104, 7, th.gold, { al: 'right' }); } } }
      tb(g, t, o, th, Rpg.lineAt(lines, t), { open: lines[0] ? lines[0].s - .45 : null, close: o.close == null ? null : o.close });
      if (ch && t > ch.at - .1 && t < ch.until + .05) { const k = clamp((t - (ch.at - .1)) / .15) * clamp((ch.until + .05 - t) / .12), its = ch.items.map(s => Rpg.fit(s, 176)), w = Math.max(...its.map(s => Rpg.measure(s))) + 24;
        px.choice(g, t, { x: 316 - w, y: 128 - 9 - (its.length * 12 + 9), items: its, sel: t >= ch.selAt ? (ch.sel == null ? 1 : ch.sel) : 0, w, k, flash: ch.okAt, th }); }
      if (o.notice) px.notice(g, t, o.notice[0], o.notice[1], o.notice[2], { y: 26 });
    }); };

  /* Rpg.title — Titelbild + Spielstand. o: title ('QUESTLOG'), sub, press ('Drücke Start'), menu [2], slots [{name, info, place, hearts} | null],
     times { logo, press, menu, down, ok, save, slot, go, fade } (Standard: alles in 6 s; im Original 1,4–10,8 s) */
  const SKY = () => MX.memo('rpg.sky', () => { const [cv, c] = mk(640, 180), bands = ['#0e1030', '#141640', '#1c1c52', '#262462', '#342c70', '#45357a', '#5a4084', '#74508c'];
    for (let j = 0; j < 180; j++) { const u = Math.min(bands.length - 1.001, j / 140 * (bands.length - 1)), b = Math.floor(u), f = u - b; r8(c, 0, j, 640, 1, bands[b]); if (f > .55) { c.fillStyle = bands[b + 1]; for (let i = j & 1; i < 640; i += 2) c.fillRect(i, j, 1, 1); } }
    const r = rng(9); for (let k = 0; k < 140; k++) r8(c, Math.floor(r() * 640), Math.floor(r() * 110), 1, 1, r() < .2 ? '#ffe9b0' : '#c8d0ff');
    const ridge = (y0, amp, fr, col, lit, seed) => { for (let x = 0; x < 640; x++) { const h = Math.round(y0 - amp * (noise1(x * fr, seed) * .8 + noise1(x * fr * 3.1, seed + 1) * .2)); r8(c, x, h, 1, 180 - h, col); r8(c, x, h, 1, 1, lit); } };
    ridge(120, 50, .02, '#2a2258', '#5a4a96', 3); ridge(140, 30, .035, '#1c1844', '#3e3478', 7); ridge(160, 16, .05, '#120f30', '#2c2860', 11); return cv; });
  Rpg.logo = (s, { stops = ['#fff4c0', '#ffe58a', '#f6c64a', '#e8a838', '#c87c28', '#a85c20'], edge = '#1a0e2a' } = {}) => MX.memo('rpg.logo.' + s + stops.join(''), () => {
    const sc = Rpg.measure(s, 3) + 8 <= 300 ? 3 : 2, w = Rpg.measure(s, sc) + 8, h = 10 * sc + 8; const [cv, c] = mk(w, h), [m, mc] = mk(w, h); px.text(mc, s, 4, 2, '#ffffff', { sc, sh: null });
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1], [2, 2], [0, 3], [2, 3]]) px.text(c, s, 4 + dx, 2 + dy, edge, { sc, sh: null });
    const [gcv, gx] = mk(w, h); for (let j = 0; j < h; j++) r8(gx, 0, j, w, 1, stops[Math.min(stops.length - 1, Math.max(0, Math.floor((j - 5) / (sc * 1.4))))]);
    gx.globalCompositeOperation = 'destination-in'; gx.drawImage(m, 0, 0); c.drawImage(gcv, 0, 0); return cv; });
  Rpg.title = (c, t, o = {}) => { const { th, look } = common(o), T = { logo: .1, press: .7, menu: 1.5, down: 2.1, ok: 2.6, save: 2.9, slot: 3.5, go: 4.7, fade: 5.4, ...(o.times || {}) };
    const title = o.title || 'QUESTLOG', menu = o.menu || ['Spiel starten', 'Fortsetzen'], slots = o.slots || [{ name: th.name + ' · Lv 17', info: 'Spielzeit 412:07', place: 'Weidenpfad', hearts: 5 }, null, null];
    Rpg.stage(c, t, { white: clamp(1 - (t - T.logo + .1) / .25) * .9, fade: clamp((t - T.fade) / .4), ...o }, g => {
      const pan = Math.round(t * 6); g.drawImage(SKY(), pan % 320, 0, 320, 180, 0, 0, 320, 180);
      for (let k = 0; k < 7; k++) { const tw = Math.sin(t * 3 + k * 2.1); if (tw > .6) px.spark(g, (k * 53 + 17) % 320, 12 + (k * 29) % 70, tw, '#e8ecff'); }
      px.rect(g, 0, 160, 320, 20, '#0c0a22'); for (let x = 0; x < 320; x++) { const h = 156 + Math.round(noise1((x + pan * 1.6) * .03, 21) * 8); px.rect(g, x, h, 1, 180 - h, '#0c0a22'); px.dot(g, x, h, '#2a2456'); }
      px.hero(g, 232, 160, 'up', t, { look, light: 1, shadow: false }); const [bx, by] = Rpg.bfPath(232, 128, t, 9); px.companion(g, bx, by, t, { col: th.companion, glow: .6 });
      const L = Rpg.logo(title, o.logo || {}), k = eob(clamp((t - T.logo) / .5)), ly = Math.round(lerp(-50, 22, k) - ease(clamp((t - T.save) / .4)) * 14), la = 1 - clamp((t - T.save) / .3), lx0 = Math.round(160 - L.width / 2);
      g.globalAlpha = la; g.drawImage(L, lx0, ly); g.globalAlpha = 1;
      if (t > T.logo + .6 && la > .5) [[6, 4], [52, 2], [96, 26], [138, 6], [30, 28]].forEach(([sx, sy], i) => { const ph = ((t - T.logo - .6) * 1.3 + i * .37) % 1.8; if (ph < .45 && sx < L.width) px.spark(g, lx0 + sx, ly + sy, Math.sin(ph / .45 * Math.PI), '#fff8d0'); });
      if (t > T.logo + .5 && t < T.save) px.text(g, Rpg.fit(o.sub || 'ein Rollenspiel von Seez', 300), 160, ly + L.height + 1, th.soft, { al: 'center' });
      if (t > T.press && t < T.menu && Math.floor(t * 2.5) % 2 === 0) px.text(g, o.press || 'Drücke Start', 160, 112, th.white, { al: 'center' });
      if (t >= T.menu && t < T.save + .2) px.choice(g, t, { x: 110, y: 100, items: menu, sel: t >= T.down ? 1 : 0, w: 100, k: clamp((t - T.menu) / .16) * clamp((T.save + .2 - t) / .16), flash: T.ok, th });
      if (t >= T.save) { const k3 = clamp((t - T.save) / .2); px.rect(g, 0, 0, 320, 180, `rgba(8,6,24,${.45 * k3})`); const x = 22, y = 66 + Math.round((1 - eout(k3)) * 120);
        px.frame(g, x, y - 15, 120, 15, 'gold'); px.text(g, o.slotTitle || 'Spielstand wählen', x + 8, y - 13, th.gold);
        slots.slice(0, 3).forEach((s, i) => { const yy = y + 2 + i * 30; px.frame(g, x, yy, 276, 28, th.win); px.text(g, 'Slot ' + (i + 1), x + 16, yy + 3, t >= T.slot && i === 0 ? th.gold : th.grey);
          if (s) { px.hero(g, x + 70, yy + 26, 'down', t, { look, light: .3, shadow: false }); px.text(g, Rpg.fit(s.name, 128), x + 86, yy + 3, th.white); px.text(g, Rpg.fit(s.info || '', 120), x + 86, yy + 15, th.soft);
            px.text(g, Rpg.fit(s.place || '', 60), x + 268, yy + 15, th.grey, { al: 'right' }); px.text(g, '♥'.repeat(s.hearts == null ? 5 : s.hearts), x + 268, yy + 3, th.heart, { al: 'right' }); }
          else px.text(g, '– leer –', x + 150, yy + 9, '#6a70a0', { al: 'center' }); });
        if (t >= T.slot) px.cursor(g, x + 4, y + 12, t, t > T.go && t < T.go + .5 ? 1 : 0); } }); };

  /* Rpg.inventory — Bilanz mit Waage. Graue Gegenstände fallen auf die erste Hälfte der Wörter, leuchtende auf die zweite, Waage pendelt bei balanceAt ein.
     o: line, title ('Bilanz'), tag ('Inventar'), left ('Pech der Jahre'), right ('Momente'), grey [Symbole], glow [Symbole], split (Wortindex), balanceAt, backdrop */
  const GP = { K: '#1a1a2a', g: '#5a5e78', G: '#8a8ea8', b: '#6a7ab0', y: '#ffd860', Y: '#fff4c0', o: '#e8a838', c: '#6ff0ff', C: '#d8ffff', w: '#f6f2ff' };
  const IT = { stone: ['.........', '...KKK...', '..KgGgK..', '.KgGggK..', '.KgggggK.', '.KgggggK.', '..KKKKK..'], rain: ['...KKK...', '.KKgGgKK.', 'KgggGgggK', 'KgggggggK', '.KKKKKKK.', '..b..b...', '.b..b..b.'],
    key: ['.KKK.....', 'KG.GK....', 'KG.GKKKKK', '.KKK.K.K.', '.........', '..KK.KK..', '..K...K..'], page: ['KKKKKK...', 'KGGGGKK..', 'KGKKGGK..', 'KGGGG.K..', 'KGKK..K..', 'KGG...K..', 'KKKKKKK..'],
    star: ['....K....', '...KyK...', '.KKKyKKK.', 'KyyyYyyyK', '.KyyyyyK.', '..KyyyK..', '.KyKKKyK.', '.KK...KK.'], bulb: ['..KKKK...', '.KyYyyK..', 'KyYyyyyK.', 'KyyyyyyK.', '.KyyyyK..', '..KooK...', '..KooK...', '...KK....'],
    fly: ['.........', 'KK...KK..', 'KcCK.KCcK', 'KccCKCccK', '.KcKwKcK.', '.KcK.KcK.', '..K...K..'], note: ['....KKKK.', '....KyyK.', '....K..K.', '....K..K.', '..KKK.KK.', '.KyyK.KyK', '..KK...K.'],
    heart: ['.KK.KK...', 'KyyKyyK..', 'KyYyyyK..', 'KyyyyyK..', '.KyyyK...', '..KyK....', '...K.....'] };
  const ICON = n => MX.memo('rpg.icon.' + n, () => px.mat(IT[n] || IT.stone, GP)); Rpg.ICONS = Object.keys(IT);
  const slot = (g, x, y, glow, th) => { px.rect(g, x, y, 14, 14, '#0a0e30'); px.rect(g, x + 1, y + 1, 12, 12, glow ? '#2a2a6a' : '#1a2058'); if (glow) px.rect(g, x, y, 14, 1, th.gold); };
  Rpg.inventory = (c, t, o = {}) => { const { th } = common(o), line = o.line, ws = line ? line.words : [{ s: 0, w: '' }], n = ws.length, split = o.split == null ? Math.max(1, Math.ceil(n * .55)) : o.split;
    const grey = o.grey || ['stone', 'rain', 'key', 'page', 'rain', 'stone', 'page', 'key', 'stone', 'rain', 'page', 'stone'], glow = o.glow || ['star', 'bulb', 'fly', 'note'];
    const t0 = line ? line.s : 0, tA = o.balanceAt == null ? ws[n - 1].s : o.balanceAt, tG = ws[Math.min(n - 1, split)].s;
    Rpg.stage(c, t, o, g => { backdrop(g, t, o.backdrop, .35); const k = Rpg.win(t, o.open == null ? t0 - .3 : o.open, o.close == null ? 1e9 : o.close);
      if (px.frame(g, 8, 6, 304, 114, th.win, k)) { px.text(g, o.title || 'Bilanz', 18, 10, th.gold); px.text(g, o.tag || 'Inventar', 300, 10, th.grey, { al: 'right' }); px.rect(g, 16, 22, 288, 1, th.win.l2);
        px.text(g, Rpg.fit(o.left || 'Pech der Jahre', 110), 20, 28, '#a0a4c8'); px.text(g, Rpg.fit(o.right || 'Momente', 100), 300, 28, th.gold, { al: 'right' });
        grey.slice(0, 12).forEach((nm, i) => { const ts = ws[Math.min(split - 1, Math.floor(i / grey.length * split))].s + (i % 3) * .06, x = 20 + (i % 6) * 17, y = 42 + Math.floor(i / 6) * 17; slot(g, x, y, false, th); if (t >= ts) px.draw(g, ICON(nm), x + 3, y + 3 + (t < ts + .1 ? -1 : 0)); });
        glow.slice(0, 4).forEach((nm, i) => { const ts = ws[Math.min(n - 1, split + Math.floor(i * Math.max(1, n - split) / 4))].s, x = 230 + (i % 2) * 34, y = 42 + Math.floor(i / 2) * 22; slot(g, x, y, t >= ts, th);
          if (t >= ts) { px.glow(g, x + 7, y + 7, 12, '#ffdc78', .4 + .2 * Math.sin(t * 5 + i)); px.draw(g, ICON(nm), x + 3, y + 3); if (t < ts + .3) px.spark(g, x + 12, y + 2, 1 - (t - ts) / .3); } });
        const tilt = t < tA ? lerp(0, .32, clamp((t - t0 - .25) / .8)) - clamp((t - tG) / 1) * .2 : .12 * Math.exp(-(t - tA) * 4) * Math.cos((t - tA) * 18);
        const cx = 160, cy = 64; px.rect(g, cx - 1, cy, 3, 26, '#c8a050'); px.rect(g, cx - 9, cy + 26, 19, 3, '#c8a050'); px.rect(g, cx - 9, cy + 29, 19, 1, '#6a4a20');
        for (let i = -24; i <= 24; i++) px.dot(g, cx + i, cy + Math.round(i * Math.sin(tilt)), '#ffe08a');
        for (const sg of [-1, 1]) { const qx = cx + sg * 24, qy = cy + Math.round(sg * 24 * Math.sin(tilt)); px.rect(g, qx, qy, 1, 10, '#a08040'); px.rect(g, qx - 7, qy + 10, 15, 2, sg < 0 ? '#8a8ea8' : '#ffd860'); px.rect(g, qx - 6, qy + 12, 13, 1, '#6a4a20'); }
        px.rect(g, cx - 2, cy - 3, 5, 4, '#ffe08a'); if (t >= tA) { px.text(g, '=', cx, cy + 34, th.gold, { al: 'center' }); if (t < tA + .5) px.spark(g, cx, cy - 6, 1 - (t - tA) / .5); } }
      tb(g, t, o, th, line, { open: t0 - .4, close: o.close == null ? null : o.close }); }); };

  /* Rpg.questlog — Liste klickt auf den Wörtern der Zeile weiter (Haken hinter dem Zeiger), letzter Eintrag golden. o: line, list, title, count, nr0 */
  Rpg.QUESTS = ['Backlog sichten', 'Leuchtkäfer zählen', 'Altes Modul reparieren', 'Karte vom Nebel zeichnen', 'Zwischenwelt finden', 'Falter folgen', 'Speicherpunkt suchen', 'Schalterrätsel lösen', 'Fehlende Seiten finden', 'Neues Level bauen', 'Lagerfeuer anzünden', 'Turm im Osten'];
  Rpg.questlog = (c, t, o = {}) => { const { th } = common(o), line = o.line, ws = line ? line.words : [], list = o.list || Rpg.QUESTS;
    Rpg.stage(c, t, o, g => { backdrop(g, t, o.backdrop, .35); let n = 0; for (const w of ws) if (t >= w.s) n++; const sel = Math.max(0, n - 1), tl = ws.length ? ws[sel].s : 0;
      const sc = lerp(Math.max(0, sel - 4), Math.max(0, sel - 3), clamp((t - tl) / .12)), k = Rpg.win(t, line ? line.s - .3 : 0, o.close == null ? 1e9 : o.close);
      px.questlog(g, t, { k, sel, sc, done: i => i < sel, hi: n === ws.length && n ? sel : -1, list, flash: tl, h: o.h || 96, title: o.title || 'QUESTLOG', count: o.count || '248 Einträge', nr0: o.nr0 || 101, th });
      tb(g, t, o, th, line, { open: line ? line.s - .4 : null }); }); };

  /* Rpg.status — Statusfenster über dem Archiv. o: line, name, sub, lv, hearts [n, v0, v1], stats [[label, v0, v1, farbe]], state, lifeAt, statAt (Standard: Wortzeiten) */
  Rpg.status = (c, t, o = {}) => { const { th, look } = common(o), line = o.line, lifeAt = o.lifeAt == null ? Rpg.wordAt(line, 1).s : o.lifeAt, statAt = o.statAt == null ? Rpg.wordAt(line, 3).s : o.statAt;
    const H = o.hearts || [6, .5, 1], S = o.stats || [['Chaos', .3, .99, '#ffd860'], ['Neugier', .62, .62, null]];
    Rpg.stage(c, t, o, g => { backdrop(g, t, o.backdrop, .35); px.rect(g, 0, 0, 320, 180, 'rgba(6,6,20,0.45)'); const k = Rpg.win(t, (line ? line.s : 0) - .3, o.close == null ? 1e9 : o.close);
      const lu = clamp((t - lifeAt) / .4), su = eout(clamp((t - statAt) / .35));
      px.status(g, t, { k, port: o.port, look, name: o.name || th.name, sub: o.sub || '', lv: o.lv || 'Lv 17', hearts: [H[0], lerp(H[1], H[2], lu)], stats: S.map(([l, a, b, col]) => { const v = lerp(a, b, su); return [l, v, Math.round(v * 99), col]; }), state: o.state || 'Zustand: wach', th });
      if (t >= statAt && t < statAt + .5) px.spark(g, 250, 72, 1 - (t - statAt) / .5, th.gold);
      tb(g, t, o, th, line, { open: line ? line.s - .4 : null }); }); };

  /* Rpg.portal — die Liedzeile leuchtet im Raum, rollt sich ab curlAt zum Portalring (ringAt), Figur geht hinein (walkAt), Iris öffnet ein neues Level (irisAt).
     o: line, ringAt, curlAt, walkAt, irisAt (null = ohne), level { region, seed, cam }, ringCol, backdrop, after (Liedzeile in der Textbox nach der Iris) */
  Rpg.portal = (c, t, o = {}) => { const { th, look } = common(o), line = o.line || MX.line('jede Zeile wird zum Portal', 0, 3), ws = line.words, last = ws[ws.length - 1];
    const ringAt = o.ringAt == null ? last.s : o.ringAt, curlAt = o.curlAt == null ? last.e + .15 : o.curlAt, walkAt = o.walkAt == null ? curlAt + .3 : o.walkAt, irisAt = o.irisAt === undefined ? walkAt + .7 : o.irisAt, col = o.ringCol || th.magic || '#6ff0ff';
    const L = Rpg.wrapWords(ws, 296), rows = L.length ? L[L.length - 1].row + 1 : 1, rw = []; for (const it of L) rw[it.row] = it.x + it.ww;
    const chars = []; L.forEach((it, wi) => { let x = 160 - rw[it.row] / 2 + it.x; for (const ch of it.w) { chars.push({ ch, x, y: 93 - (rows - 1) * 6 + it.row * 12, wi }); x += Rpg.measure(ch) + 1; } });
    Rpg.stage(c, t, o, g => {
      if (irisAt === null || t < irisAt + .55) { backdrop(g, t, o.backdrop, .35); px.rect(g, 0, 0, 320, 180, `rgba(6,6,20,${.6 * clamp((t - line.s + .2) / .3)})`);
        const curl = ease(clamp((t - curlAt) / .5)); px.portalRing(g, 160, 56, 30, clamp((t - ringAt) / .5), t, col);
        chars.forEach((q, i) => { const w = ws[q.wi]; if (t < w.s - .12) return; const a = i / chars.length * Math.PI * 2 - Math.PI / 2 + curl * 1.2;
          const x = lerp(q.x, 160 + Math.cos(a) * 26 - 2, curl), y = lerp(q.y, 52 + Math.sin(a) * 33, curl), kc = o.keys && o.keys.some(k => w.w.toLowerCase().startsWith(k.toLowerCase())) ? th.key : th.gold;
          px.text(g, q.ch, x, y, curl > .5 ? col : (t < w.e + .1 ? kc : th.white), { sh: '#1a1040' }); });
        px.glow(g, 160, 97, 120, '#788cff', .15);
        const lk = clamp((t - walkAt) / .55); px.hero(g, lerp(292, 160, ease(lk)), lerp(127, 84, ease(lk)), lk > 0 ? 'up' : 'left', t, { look, walk: lk > 0 && lk < 1 ? t * 5.8 : null, light: 1, shadow: lk < 1 }); }
      if (irisAt !== null && t >= irisAt) { const ir = ease(clamp((t - irisAt) / .55)) * 220; g.save(); g.beginPath(); g.ellipse(160, 56, Math.max(1, ir * .8), Math.max(1, ir), 0, 0, Math.PI * 2); g.clip();
        px.assemble(g, t, { at: irisAt, ...(o.level || {}) }); g.restore(); }
      if (o.after) tb(g, t, o, th, o.after, { open: o.after.s - .15 }); }); };

  /* Rpg.fog — Kartenrand: Grenzsteine mit Lichtwand, Risse (crackAt[2]), Bruch (breakAt), Figur geht in den Nebel; ab inAt: im Nebel,
     „Zustand: müde“ ab sleepAt (Augen zu, z), „aber wach“ ab wakeAt. o: line, region, seed, state, wake, label, hearts [n, v], border:false */
  const STONE = () => MX.memo('rpg.stone', () => [px.mat(['.KKKK.', 'KsSSsK', 'KScSSK', 'KSccSK', 'KSScSK', 'KsSSsK', 'KSSSSK', 'KKKKKK'], { K: '#0a0c1e', s: '#7a80a8', S: '#4a5078', c: '#6ff0ff' }),
    px.mat(['.KKKK.', 'KsSSsK', 'KScSSK', 'KSccSK', 'KSScSK', 'KsSSsK', 'KSSSSK', 'KKKKKK'], { K: '#0a0c1e', s: '#7a80a8', S: '#4a5078', c: '#2a3050' })]);
  Rpg.fog = (c, t, o = {}) => { const { th, look } = common(o), line = o.line, ws = line ? line.words : [{ s: 1 }, { s: 2 }, { s: 3 }], n = ws.length, BX = 210;
    const inAt = o.inAt == null ? (line ? line.s + (line.e - line.s) * .45 : 2) : o.inAt, breakAt = o.breakAt == null ? inAt - .9 : o.breakAt, crack = o.crackAt || [breakAt - .7, breakAt - .35], tIn = breakAt + .3;
    const sleepAt = o.sleepAt == null ? Math.max(inAt + .2, ws[Math.min(n - 1, Math.floor(n / 2))].s) : o.sleepAt, wakeAt = o.wakeAt == null ? ws[n - 1].s : o.wakeAt, M = Rpg.world({ region: o.region || 'night', seed: o.seed || 0 }), t0 = o.t0 == null ? -.2 : o.t0;
    const SH = MX.memo('rpg.shards', () => { const r = rng(404), a = []; for (let i = 0; i < 40; i++) a.push({ x: r() * 6, y: 30 + r() * 96, vx: (r() - .3) * 1.6, vy: (r() - .7) * 1.2, w: 1 + Math.floor(r() * 3), c: r() < .4 ? '#6ff0ff' : r() < .7 ? '#7a80a8' : '#4a5078' }); return a; });
    Rpg.stage(c, t, o, g => {
      if (t < inAt) { px.world(g, M, 1600, t);
        if (o.border !== false) { const ck = (t >= crack[0] ? 1 : 0) + (t >= crack[1] ? 1 : 0);
          if (t < breakAt) { for (let y = 34; y < 124; y += 3) px.rect(g, BX + 2, y, 2, 2, `rgba(111,240,255,${.25 + .15 * Math.sin(t * 6 + y * .3)})`); px.glow(g, BX + 3, 80, 40, '#6ff0ff', .25 + .1 * Math.sin(t * 4));
            for (let k = 0; k < 6; k++) { const y = 30 + k * 16; g.drawImage(STONE()[ck ? 1 : 0], BX, y); if (ck >= 1) { px.dot(g, BX + 2, y + 2, '#0a0c1e'); px.dot(g, BX + 3, y + 3, '#0a0c1e'); } if (ck >= 2) { px.dot(g, BX + 3, y + 5, '#0a0c1e'); px.dot(g, BX + 4, y + 6, '#0a0c1e'); } } }
          else { const p = t - breakAt; for (const s of SH) if (p < 1.2) px.rect(g, BX + s.x + s.vx * p * 60, s.y + s.vy * p * 60 + p * p * 120, s.w, s.w, p < .15 ? '#e8ffff' : s.c); if (p < .3) px.glow(g, BX + 3, 80, 80, '#c8ffff', .7 * (1 - p / .3)); } }
        px.fog(g, t, BX + 6 + (t > breakAt ? (t - breakAt) * -40 : 0), .95, 50 + (t > breakAt ? (t - breakAt) * 60 : 0));
        let x = lerp(30, 176, clamp((t - t0) / Math.max(.5, breakAt - t0 - .6))), walk = x < 176 ? t * 5.8 : null; if (t > tIn) { x += (t - tIn) * 34; walk = t * 5.8; }
        px.hero(g, x, 99, 'right', t, { look, walk, light: 1 }); const [bx, by] = Rpg.bfPath(x - 4, 66, t, 9); px.companion(g, bx, by, t, { col: th.companion, glow: .7 });
        if (t > tIn) px.fog(g, t, x - 40, clamp((t - tIn) / 1.2), 40); }
      else { px.rect(g, 0, 0, 320, 180, '#5a5888'); px.fog(g, t, -100, 1, 10); px.rect(g, 0, 0, 320, 180, 'rgba(30,26,70,0.35)');
        const zz = t > sleepAt && t < wakeAt; px.hero(g, 160, 100, 'down', t, { look, blink: zz && ((t - sleepAt) % 1.1) < .8, light: .8, shadow: false }); const [bx, by] = Rpg.bfPath(160, 66, t, 10); px.companion(g, bx, by, t, { col: th.companion, glow: .4 });
        if (zz) for (let i = 0; i < 3; i++) { const p = ((t - sleepAt) * .8 + i * .33) % 1; px.text(g, 'z', 170 + p * 18 + i * 2, 70 - p * 24, `rgba(246,242,255,${(1 - p).toFixed(2)})`, { sh: null }); }
        if (t > wakeAt && t < wakeAt + .5) { px.spark(g, 157, 80, 1 - (t - wakeAt) / .5, th.key); px.spark(g, 164, 80, 1 - (t - wakeAt) / .5, th.key); }
        if (t > sleepAt - .1) { const k = clamp((t - sleepAt + .1) / .15), lab = o.label || 'Zustand:', H = o.hearts || [3, .5]; if (px.frame(g, 8, 8, 128, t > wakeAt ? 42 : 30, 'dark', k)) { px.text(g, lab, 16, 14, th.grey); px.text(g, Rpg.fit(o.state || 'müde', 60), 18 + Rpg.measure(lab) + 4, 14, '#f4b6c8'); px.hearts(g, 16, 24, H[0], H[1], t); if (t > wakeAt) px.text(g, Rpg.fit(o.wake || 'aber wach', 110), 16, 34, th.key); } } }
      tb(g, t, o, th, line, { open: line ? line.s - .4 : null }); }); };

  /* Rpg.savePoint — fast schwarz, Figur auf einer einzelnen Kachel, Kristall leuchtet ab lightAt, „Gespeichert.“ ab savedAt, schlichte Box ohne Porträt.
     o: line, lightAt, savedAt, text, tile ('day'|'night'|'dawn'), crystal (Farbe) */
  Rpg.savePoint = (c, t, o = {}) => { const { th, look } = common(o), line = o.line, ws = line ? line.words : [{ s: 1 }, { s: 2 }], n = ws.length;
    const lightAt = o.lightAt == null ? ws[Math.floor(n / 2)].s : o.lightAt, savedAt = o.savedAt == null ? ws[n - 1].s + .1 : o.savedAt, P = Rpg.PALS[o.tile || 'day'];
    const TILE = MX.memo('rpg.tile.' + (o.tile || 'day'), () => { const [cv, x] = mk(16, 16); T.grass(x, 0, 0, P, 3, 77); x.fillStyle = P.f2; x.fillRect(4, 5, 1, 1); return cv; });
    Rpg.stage(c, t, o, g => { px.rect(g, 0, 0, 320, 180, '#020206'); const lit = clamp((t - lightAt) / .8);
      px.glow(g, 158, 84, 34 + Math.sin(t * 2.2) * 3 + lit * 20, look.glow || '#ffdc82', .3 + lit * .1);
      g.drawImage(TILE, 150, 82); px.rect(g, 150, 98, 16, 3, '#0a0a14'); px.rect(g, 150, 98, 16, 1, '#3a2a20');
      px.hero(g, 158, 94, t < lightAt ? 'down' : 'right', t, { look, light: 1, blink: (t % 3.7) < .14 }); const [bx, by] = Rpg.bfPath(158, 60, t * .6, 8); px.companion(g, bx, by, t, { col: th.companion, glow: .5 });
      px.crystal(g, 196, 100, lit, t, o.crystal || th.magic || '#6ff0ff'); if (lit > 0) for (let i = 0; i < 6; i++) { const p = ((t - lightAt) * .6 + i / 6) % 1; px.dot(g, 196 + Math.sin(i * 2.3 + t) * 8, 100 - p * 40, MX.rgba(mix(o.crystal || th.magic || '#6ff0ff', '#ffffff', .4), ((1 - p) * lit).toFixed(2))); }
      if (t > savedAt) px.notice(g, t, o.text || 'Gespeichert.', savedAt, 1e9, { y: 34 });
      px.textbox(g, t, { line, port: null, name: null, sty: 'plain', th, keys: o.keys, open: line ? line.s - .4 : null }); }); };

  /* Rpg.mode7 — Weltkarte in Schrägsicht, die Figur springt von Ort zu Ort (times, sonst gleichmäßig), Orte leuchten auf.
     o: places [{ name, x, y, col }] oder Namen (Lage aus der Vorlage), times, seed, title ('Weltkarte'), t0, dur */
  const SPOTS = [['Weidenpfad', 62, 150, '#7ad86a'], ['Archiv der Welten', 84, 112, '#e0b048'], ['Laternenwald', 146, 74, '#6ff0ff'], ['Kartenrand', 206, 98, '#c8c4e8'], ['Schalterturm', 190, 156, '#9a98c8'], ['Morgenhügel', 122, 200, '#f6b4c8']];
  const MAP7 = seed => MX.memo('rpg.map7.' + seed, () => { const [cv, c] = mk(256, 256); const land = (x, y) => { const d = Math.hypot((x - 128) / 104, (y - 134) / 100); return d + (noise1(x * .06 + y * .02, 5 + seed) - .5) * .45 + (noise1(y * .07 - x * .01, 9 + seed) - .5) * .3 < .9; };
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { let col;
      if (!land(x, y)) { col = (x * 3 + y * 7) % 23 === 0 ? '#5a8ae8' : noise1(x * .1 + y * .05, 2) > .6 ? '#2a52b0' : '#22449a'; if (land(x + 2, y) || land(x - 2, y) || land(x, y + 2) || land(x, y - 2)) col = '#8ac8ff'; }
      else { const coast = !land(x + 1, y) || !land(x - 1, y) || !land(x, y + 1) || !land(x, y - 1), q = noise1(x * .15 + y * .09, 4 + seed);
        col = x > 180 ? ((x + y) % 2 ? '#a8a4c8' : '#8884b0') : y < 100 && x > 110 ? (q > .55 ? '#1c4a58' : '#2a6070') : y > 175 ? (q > .6 ? '#f4c8b0' : '#9cc46c') : x > 160 && y > 130 ? (q > .5 ? '#7a78a0' : '#6a6888') : q > .62 ? '#3e8a44' : q > .3 ? '#5fae4e' : '#80c85c';
        if (coast) col = '#e8d8a0'; }
      c.fillStyle = col; c.fillRect(x, y, 1, 1); }
    const r = rng(66 + seed); for (let k = 0; k < 260; k++) { const x = Math.floor(r() * 256), y = Math.floor(r() * 256); if (!land(x, y) || x > 180) continue; r8(c, x, y, 2, 2, y < 100 && x > 110 ? '#0c2a38' : '#2e6c3c'); if (!(y < 100 && x > 110)) r8(c, x, y, 1, 1, '#62b45a'); }
    return cv; });
  const SKY7 = () => MX.memo('rpg.sky7', () => { const [cv, c] = mk(320, 60), B = ['#1a1840', '#2a2458', '#46356e', '#6a4a7e', '#9a6080', '#d88a7a']; for (let j = 0; j < 60; j++) { const u = j / 59 * (B.length - 1), b = Math.floor(u); r8(c, 0, j, 320, 1, B[b]); if (u - b > .5) { c.fillStyle = B[Math.min(B.length - 1, b + 1)]; for (let i = j & 1; i < 320; i += 2) c.fillRect(i, j, 1, 1); } }
    const r = rng(3); for (let k = 0; k < 50; k++) r8(c, Math.floor(r() * 320), Math.floor(r() * 30), 1, 1, '#c8d0ff'); return cv; });
  const MARK = () => MX.memo('rpg.mark', () => px.mat(['.KKKKKKK.', 'KyyyyyyyK', 'KyyyKyyyK', 'KyyyKyyyK', 'KyyyKyyyK', 'KyyyyyyyK', 'KyyyKyyyK', 'KyyyyyyyK', '.KKKKKKK.', '...KyK...', '....K....'], { K: '#2a1a08', y: '#ffd860' }));
  Rpg.mode7 = (c, t, o = {}) => { const { th, look } = common(o), seed = o.seed || 0, YH = 44, Z0 = 6400;
    const SP = (o.places || SPOTS.map(s => s[0])).slice(0, 6).map((p, i) => typeof p === 'string' ? [p, SPOTS[i][1], SPOTS[i][2], SPOTS[i][3]] : [p.name, p.x == null ? SPOTS[i][1] : p.x, p.y == null ? SPOTS[i][2] : p.y, p.col || SPOTS[i][3]]);
    const t0 = o.t0 || 0, dur = o.dur || 6, TT = o.times || SP.map((_, i) => t0 + .5 + i * (dur - 1) / SP.length), MAP = MAP7(seed);
    Rpg.stage(c, t, o, g => { let i = 0; while (i < SP.length - 1 && t >= TT[i + 1]) i++;
      const u = ease(clamp((t - TT[i]) / .6)), a = SP[Math.max(0, i - 1)], b = SP[i], fx = t < TT[0] ? SP[0][1] : lerp(a[1], b[1], i ? u : 1), fy = t < TT[0] ? SP[0][2] : lerp(a[2], b[2], i ? u : 1);
      const lt = t - t0, ang = -.3 + lt * .07, back = 88 - lt * 2, cx = fx + Math.sin(ang) * back, cy = fy + Math.cos(ang) * back;
      const [rc, rx] = MX.off('rpg.m7', 600, 600); rx.imageSmoothingEnabled = false; rx.fillStyle = '#22449a'; rx.fillRect(0, 0, 600, 600); rx.translate(300, 300); rx.rotate(ang); rx.translate(-cx, -cy); rx.drawImage(MAP, 0, 0);
      // Weg zwischen den Orten (goldene Punkte)
      for (let k = 0; k < SP.length - 1; k++) { const [, x0, y0] = SP[k], [, x1, y1] = SP[k + 1], m = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4); for (let j = 0; j <= m; j++) { rx.fillStyle = j % 2 ? '#ffe58a' : '#c08a28'; rx.fillRect(Math.round(lerp(x0, x1, j / m)), Math.round(lerp(y0, y1, j / m)), 1, 1); } }
      rx.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(SKY7(), 0, 0, 320, 60, 0, YH - 44, 320, 60); px.rect(g, 0, 0, 320, YH - 44 + 1, '#1a1840');
      px.rect(g, 0, YH, 320, 180 - YH, '#22449a'); for (let y = YH + 1; y < 180; y++) { const z = Z0 / (y - YH); if (z > 299) continue; const w = z * .95; g.drawImage(rc, 300 - w, 300 - z, w * 2, 1, 0, y, 320, 1); }
      for (let j = 0; j < 10; j++) px.rect(g, 0, YH + j, 320, 1, `rgba(216,138,122,${(.5 - j * .05).toFixed(2)})`);
      const proj = (qx, qy) => { const dx = qx - cx, dy = qy - cy, r2 = dx * Math.cos(ang) - dy * Math.sin(ang), z = -(dx * Math.sin(ang) + dy * Math.cos(ang)); return z < 4 ? null : [160 + r2 / (z * .95) * 160, YH + Z0 / z]; };
      SP.forEach(([, qx, qy, col], k) => { const p = proj(qx, qy); if (!p) return; const on = k <= i, pu = .5 + .5 * Math.sin(t * 5 + k); px.glow(g, p[0], p[1] - 2, on ? 14 : 6, col, on ? .4 + .2 * pu : .15); px.rect(g, p[0] - 1, p[1] - 4, 3, 3, on ? col : '#3a3a5a'); px.dot(g, p[0], p[1] - 5, '#ffffff'); });
      const pl = proj(fx, fy); if (pl) { px.hero(g, pl[0], pl[1] + 2, 'up', t, { look, walk: t - TT[i] < .6 && i > 0 ? t * 6 : null, light: .8 }); px.draw(g, MARK(), Math.round(pl[0] - 4), Math.round(pl[1] - 40 - Math.abs(Math.sin(t * 5)) * 2)); }
      px.frame(g, 4, 4, 150, 30, th.win); px.text(g, o.title || 'Weltkarte', 12, 7, th.gold); px.text(g, Rpg.fit(SP[i][0], 134), 12, 19, th.white); px.text(g, `Orte ${i + 1}/${SP.length}`, 148, 7, th.grey, { al: 'right' }); }); };

  /* Rpg.credits — Abspann im Spielstil: Figur läuft über die Oberwelt, Credits scrollen im Band rechts, Morgen → Tag (dayAt), am Ende „Fortsetzen?“ (contAt).
     o: lines [[text, sc, farbe] | text], t0, speed (Spielpixel/s), region ('dawn'), dayAt, contAt, cont ('Fortsetzen?'), seed */
  Rpg.credits = (c, t, o = {}) => { const { th, look } = common(o), t0 = o.t0 || 0, sp = o.speed || 15.5, lt = t - t0, seed = o.seed || 0;
    const CR = (o.lines || [['QUESTLOG', 2, th.gold], '', [th.name + ' · 2026', 1, th.white], '', ['Musik und Figurenbilder KI-gestützt', 1, th.soft], '', ['Begleiter: Falter', 1, th.key], ['Questlog: endlos', 1, th.gold], '', ['Danke fürs Spielen.', 1, th.white]]).map(l => typeof l === 'string' ? [l, 1, th.white] : l);
    const blend = o.dayAt == null ? 0 : clamp((t - o.dayAt) / 1.6), M = Rpg.world({ region: blend > .5 ? 'day' : (o.region || 'dawn'), seed });
    Rpg.stage(c, t, o, g => { const x = (o.x0 || 500) + lt * 24, camX = px.world(g, M, x - 54, t); if (blend > 0 && blend < 1) { g.globalAlpha = (blend < .5 ? blend : 1 - blend) * 1.6; px.rect(g, 0, 0, 320, 180, '#fff4e0'); g.globalAlpha = 1; }
      px.hero(g, x - camX, Rpg.OW.PY - Rpg.OW.CAMY, 'right', t, { look, walk: t * 5, light: .3 }); const [bx, by] = Rpg.bfPath(x - camX, 66, t, 10); px.companion(g, bx, by, t, { col: th.companion, glow: .3 });
      const k = clamp((lt - .3) / .6) * (o.contAt == null ? 1 : clamp((o.contAt - t) / .4)); if (k > 0) { g.globalAlpha = .66 * k; px.rect(g, 104, 0, 212, 180, '#0a0a20'); px.rect(g, 104, 0, 1, 180, th.win.l2); px.rect(g, 315, 0, 1, 180, th.win.l2); g.globalAlpha = 1;
        let y = 184 - (lt - .6) * sp; for (const [s, sc, col] of CR) { const h = sc === 2 ? 24 : 14; if (s && y > -24 && y < 182) px.text(g, Rpg.fit(s, 200, sc), 210, Math.round(y), col || th.white, { al: 'center', sc }); y += h; } }
      if (o.contAt != null && t > o.contAt) { const kk = clamp((t - o.contAt) / .2), w = 112; px.rect(g, 0, 0, 320, 180, `rgba(5,5,12,${(.7 * kk).toFixed(2)})`); if (px.frame(g, 160 - w / 2, 64, w, 44, th.win, kk)) { px.text(g, o.cont || 'Fortsetzen?', 160, 68, th.white, { al: 'center' }); px.text(g, 'Ja', 140, 84, th.white); px.text(g, 'Nein', 140, 95, '#aab0d8'); px.cursor(g, 128, 86, t); } } }); };
})();

export {};
