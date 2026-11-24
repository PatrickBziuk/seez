// @ts-nocheck
/* eslint-disable */
/* Kopie aus dem seez-kit (Video-Baukasten), unverändert. Wird nur geladen, wenn jemand das QUESTLOG-Spiel öffnet. */
/* rpg.js · Rpg — Medium „16-Bit-Rollenspiel“ der Figuren-Reihe (Vorlage: LUMEs QUESTLOG, mv5/lume/video).
   Laden nach seez-core.js + medium-core.js, danach rpg-parts.js (Kacheln, Oberwelt, besondere Momente).

   Technik wie im Original: alles wird in ein Spielbild 320×180 gezeichnet und hart ×6 auf 1920×1080 hochskaliert
   (imageSmoothing aus), dazu feine Rasterlinien und leichte Vignette. Zwei Ebenen:
   1) Szenen-Bausteine (c, t, o) im 1920×1080-Bild, rufen intern Rpg.stage auf (rpg-parts.js):
        Rpg.hook        Oberwelt (Tag/Nacht/Morgen) mit Laufen, Kamera, Begleiter, Textbox, Auswahl, Leiste, Fundzähler (wiederkehrende Hook-Ansicht; rpg_choice = Option choice)
        Rpg.title       Titelbild (Logo als Parameter), „Drücke Start“, Menü, Spielstand-Auswahl (rpg_title)
        Rpg.inventory   Bilanz-Inventar mit Waage, Gegenstände fallen auf Wortzeiten (rpg_inventory)
        Rpg.questlog    Questlog-Liste klickt Wort für Wort weiter
        Rpg.status      Statusfenster (Porträt, Name, Stufe, Herzen, Werte) über dem Archiv
        Rpg.portal      Liedzeile leuchtet im Raum und rollt sich zum Portal, Iris → Level aus Kacheln (line_portal)
        Rpg.fog         Kartenrand im Nebel, „Zustand: müde“ → „aber wach“ (rpg_fog)
        Rpg.savePoint   Speicherpunkt im Dunkeln, eine Kachel, Kristall, „Gespeichert.“ (save_point)
        Rpg.mode7       Weltkarte in Mode-7-Schrägsicht, Orte leuchten nacheinander (mode7_map)
        Rpg.credits     Spielabspann: Credits-Band, Figur läuft weiter, „Fortsetzen?“ (rpg_credits)
   2) Primitive im Spielbild Rpg.px.* (g = 320×180-Kontext, Spielpixel; 1 Spielpixel = 6 Bildpixel), für eigene Szenen
      über Rpg.stage(c, t, o, g => { … }):
        text measure typeLine (Bitmap-Schrift 5×7 mit Umlauten, wortgenaues Tippen), frame (Fenster), cursor, choice, bar, hearts,
        notice, counter, portrait, textbox, status, questlog, hero (Figuren-Sprite 16×24), companion (Falter), glow, spark …
   Figur tauschen (nur Parameter): th = Rpg.theme(Seez.CHAR[x], over) · look = Rpg.look(key, C) (Sprite: Kopfform long/short/hood/helmet/cap,
   Gesicht eyes/glasses/visor/mask, Farben) · port = Rpg.portrait(bild, { head:[cx,cy,größe] }) · Name, Titel, Liedzeilen, Optionen,
   Orte, Credits, Zeiten.
   Quelle: mv5/lume/video/scenes 00_lib (Bühne, Mosaik/Blende), 01_font, 02_ui, 03_sprite (Pixeldaten LUME), 04_tiles, 05_world,
   10_intro, 20_hook1, 30_v1a, 31_v1b, 40_hook2, 50_v2a, 60_bridge, 65_map, 80_credits.
   Beispiel-Ablauf (QUESTLOG, nur als Beispiel): title 1.4–10.8 → hook(day) 10.6–28 → Archiv/status → inventory → questlog → portal
   → hook(night) → fog → savePoint → mode7 → hook(dawn) → credits. Deterministisch: nur MX.U.rng/h2/noise1. */
'use strict';
(() => {
  const { clamp, lerp, eout, rng } = MX.U;
  const LW = 320, LH = 180, SC = 6;
  const Rpg = window.Rpg = { LW, LH, SC };
  const px = Rpg.px = {};
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
  const mix = (a, b, u) => MX.mix(a, b, u);
  const rgba = (col, a) => col[0] === '#' ? MX.rgba(col, a) : col;
  Rpg.mk = mk;

  // ---------- Pixel-Helfer (im Spielbild) ----------
  px.rect = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  px.dot = (g, x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  px.dith = (g, x, y, w, h, col, ph = 0) => { g.fillStyle = col; x = Math.round(x); y = Math.round(y); for (let j = 0; j < h; j++) for (let i = (j + ph) & 1; i < w; i += 2) g.fillRect(x + i, y + j, 1, 1); };
  // Pixelmatrix (Strings) + Palette {Zeichen: Farbe} → Canvas; '.' = durchsichtig
  px.mat = (rows, pal) => { const h = rows.length, w = Math.max(...rows.map(r => r.length)); const [c, x] = mk(w, h);
    for (let j = 0; j < h; j++) for (let i = 0; i < rows[j].length; i++) { const k = rows[j][i]; if (k === '.' || !pal[k]) continue; x.fillStyle = pal[k]; x.fillRect(i, j, 1, 1); } return c; };
  px.flipH = src => { const [c, x] = mk(src.width, src.height); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c; };
  px.draw = (g, img, x, y) => g.drawImage(img, Math.round(x), Math.round(y));
  px.glow = (g, x, y, r, col, a = 1) => { if (r <= 0 || a <= 0) return; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = clamp(a); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(col, .9)); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); };
  px.spark = (g, x, y, k, col = '#ffe58a') => { x = Math.round(x); y = Math.round(y); if (k <= 0) return; g.fillStyle = col; g.fillRect(x, y, 1, 1); if (k > .35) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } if (k > .7) { g.fillStyle = '#f6f2ff'; g.fillRect(x, y, 1, 1); g.fillStyle = col; g.fillRect(x - 2, y, 1, 1); g.fillRect(x + 2, y, 1, 1); g.fillRect(x, y - 2, 1, 1); g.fillRect(x, y + 2, 1, 1); } };
  Rpg.win = (t, a, b, fi = .15, fo = .15) => t < a - 1e-6 || t > b ? 0 : Math.min(clamp((t - a) / fi), clamp((b - t) / fo));

  // ---------- Bühne: Spielbild → 1920×1080 ----------
  // o: bg, fade, fadeCol, white, mosaic (Blockgröße ≥1), scan (0 = ohne Rasterlinien), vignette (0 = ohne), x, y (Versatz im Bild)
  let SCAN = null;
  Rpg.stage = (c, t, o, draw) => {
    if (typeof o === 'function') { draw = o; o = {}; } o = o || {};
    const [gc, g] = MX.off('rpg.g', LW, LH); g.imageSmoothingEnabled = false; g.fillStyle = o.bg || '#06060f'; g.fillRect(0, 0, LW, LH);
    if (draw) { g.save(); draw(g, t); g.restore(); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (o.fade > 0) { g.globalAlpha = clamp(o.fade); g.fillStyle = o.fadeCol || '#000'; g.fillRect(0, 0, LW, LH); g.globalAlpha = 1; }
    if (o.white > 0) { g.globalAlpha = clamp(o.white); g.fillStyle = '#fff8e8'; g.fillRect(0, 0, LW, LH); g.globalAlpha = 1; }
    const X = o.x || 0, Y = o.y || 0, m = Math.round(o.mosaic || 1);
    c.save(); c.imageSmoothingEnabled = false;
    if (m > 1) { const w = Math.ceil(LW / m), h = Math.ceil(LH / m); const [mc, mx] = MX.off('rpg.m', LW, LH); mx.imageSmoothingEnabled = false; mx.drawImage(gc, 0, 0, w, h); c.drawImage(mc, 0, 0, w, h, X, Y, w * m * SC, h * m * SC); }
    else c.drawImage(gc, X, Y, LW * SC, LH * SC);
    if (o.scan !== 0) { if (!SCAN) { const [sc, sx] = mk(1920, 1080); sx.fillStyle = 'rgba(0,0,0,0.13)'; for (let y = 5; y < 1080; y += 6) sx.fillRect(0, y, 1920, 1); SCAN = sc; } c.drawImage(SCAN, X, Y); }
    if (o.vignette !== 0) MX.vignette(c, o.vignette == null ? .28 : o.vignette);
    c.restore();
  };

  // ---------- Bitmap-Schrift (proportional, Versalhöhe 7, Unterlänge 2, Akzentzeile 0) ----------
  const F = {
    A: [1, '.###./#...#/#...#/#####/#...#/#...#/#...#'], B: [1, '####./#...#/#...#/####./#...#/#...#/####.'], C: [1, '.###./#...#/#..../#..../#..../#...#/.###.'],
    D: [1, '###../#..#./#...#/#...#/#...#/#..#./###..'], E: [1, '#####/#..../#..../####./#..../#..../#####'], F: [1, '#####/#..../#..../####./#..../#..../#....'],
    G: [1, '.###./#...#/#..../#.###/#...#/#...#/.####'], H: [1, '#...#/#...#/#...#/#####/#...#/#...#/#...#'], I: [1, '###/.#./.#./.#./.#./.#./###'],
    J: [1, '..###/...#./...#./...#./#..#./#..#./.##..'], K: [1, '#...#/#..#./#.#../##.../#.#../#..#./#...#'], L: [1, '#..../#..../#..../#..../#..../#..../#####'],
    M: [1, '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#'], N: [1, '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#'], O: [1, '.###./#...#/#...#/#...#/#...#/#...#/.###.'],
    P: [1, '####./#...#/#...#/####./#..../#..../#....'], Q: [1, '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#'], R: [1, '####./#...#/#...#/####./#.#../#..#./#...#'],
    S: [1, '.####/#..../#..../.###./....#/....#/####.'], T: [1, '#####/..#../..#../..#../..#../..#../..#..'], U: [1, '#...#/#...#/#...#/#...#/#...#/#...#/.###.'],
    V: [1, '#...#/#...#/#...#/#...#/#...#/.#.#./..#..'], W: [1, '#...#/#...#/#...#/#.#.#/#.#.#/#.#.#/.#.#.'], X: [1, '#...#/#...#/.#.#./..#../.#.#./#...#/#...#'],
    Y: [1, '#...#/#...#/.#.#./..#../..#../..#../..#..'], Z: [1, '#####/....#/...#./..#../.#.../#..../#####'],
    'Ä': [0, '.#.#./...../.###./#...#/#####/#...#/#...#/#...#'], 'Ö': [0, '.#.#./...../.###./#...#/#...#/#...#/#...#/.###.'], 'Ü': [0, '.#.#./...../#...#/#...#/#...#/#...#/#...#/.###.'],
    a: [3, '.###./....#/.####/#...#/.####'], b: [1, '#..../#..../####./#...#/#...#/#...#/####.'], c: [3, '.###/#.../#.../#.../.###'],
    d: [1, '....#/....#/.####/#...#/#...#/#...#/.####'], e: [3, '.###./#...#/#####/#..../.###.'], f: [1, '..##/.#../###./.#../.#../.#../.#..'],
    g: [3, '.####/#...#/#...#/#...#/.####/....#/.###.'], h: [1, '#..../#..../####./#...#/#...#/#...#/#...#'], i: [1, '#/./#/#/#/#/#'],
    j: [1, '..#/.../..#/..#/..#/..#/..#/..#/##.'], k: [1, '#.../#.../#..#/#.#./##../#.#./#..#'], l: [1, '#./#./#./#./#./#./.#'],
    m: [3, '##.#./#.#.#/#.#.#/#.#.#/#.#.#'], n: [3, '####./#...#/#...#/#...#/#...#'], o: [3, '.###./#...#/#...#/#...#/.###.'],
    p: [3, '####./#...#/#...#/#...#/####./#..../#....'], q: [3, '.####/#...#/#...#/#...#/.####/....#/....#'], r: [3, '#.##/##../#.../#.../#...'],
    s: [3, '.####/#..../.###./....#/####.'], t: [1, '.#../.#../###./.#../.#../.#../..##'], u: [3, '#...#/#...#/#...#/#...#/.####'],
    v: [3, '#...#/#...#/#...#/.#.#./..#..'], w: [3, '#...#/#...#/#.#.#/#.#.#/.#.#.'], x: [3, '#...#/.#.#./..#../.#.#./#...#'],
    y: [3, '#...#/#...#/#...#/#...#/.####/....#/.###.'], z: [3, '#####/...#./..#../.#.../#####'],
    'ä': [1, '.#.#./...../.###./....#/.####/#...#/.####'], 'ö': [1, '.#.#./...../.###./#...#/#...#/#...#/.###.'], 'ü': [1, '.#.#./...../#...#/#...#/#...#/#...#/.####'],
    'ß': [1, '.##./#..#/#..#/#.#./#..#/#..#/#.#.'], 'é': [1, '..#../...../.###./#...#/#####/#..../.###.'], 'è': [1, '.#.../...../.###./#...#/#####/#..../.###.'],
    0: [1, '.###./#...#/#..##/#.#.#/##..#/#...#/.###.'], 1: [1, '..#../.##../..#../..#../..#../..#../.###.'], 2: [1, '.###./#...#/....#/...#./..#../.#.../#####'],
    3: [1, '####./....#/....#/.###./....#/....#/####.'], 4: [1, '...#./..##./.#.#./#..#./#####/...#./...#.'], 5: [1, '#####/#..../####./....#/....#/#...#/.###.'],
    6: [1, '.###./#..../#..../####./#...#/#...#/.###.'], 7: [1, '#####/....#/...#./..#../.#.../.#.../.#...'], 8: [1, '.###./#...#/#...#/.###./#...#/#...#/.###.'],
    9: [1, '.###./#...#/#...#/.####/....#/....#/.###.'],
    '.': [7, '#'], ',': [7, '.#/#.'], ';': [4, '.#/../../.#/#.'], ':': [4, '#/./././#'], '?': [1, '.###./#...#/....#/...#./..#../...../..#..'],
    '!': [1, '#/#/#/#/#/./#'], '-': [5, '###'], '–': [5, '####'], '✓': [2, '....#/...#./#.#../.#...'], '’': [1, '.#/.#/#.'], "'": [1, '#/#'], '„': [7, '.#.#/#.#.'], '“': [1, '.#.#/#.#./#.#.'],
    '"': [1, '#.#/#.#'], '(': [1, '.#/#./#./#./#./#./.#'], ')': [1, '#./.#/.#/.#/.#/.#/#.'], '/': [1, '...#/...#/..#./.#../.#../#.../#...'], '&': [1, '.##../#..#./.##../.#.#./#..#./#..#./.##.#'],
    '·': [4, '#'], '+': [3, '..#../..#../#####/..#../..#..'], '×': [3, '#...#/.#.#./..#../.#.#./#...#'], '…': [7, '#.#.#'], '<': [2, '...#/..#./.#../#.../.#../..#./...#'],
    '>': [2, '#.../.#../..#./...#/..#./.#../#...'], '_': [8, '#####'], '%': [1, '##..#/##..#/...#./..#../.#.../#..##/#..##'], '=': [3, '####/..../####'], '#': [2, '.#.#./#####/.#.#./#####/.#.#.'],
    '♥': [2, '.#.#./#####/#####/.###./..#..'], '◆': [2, '..#../.###./#####/.###./..#..']
  };
  const GL = {}; let ax = 0;
  for (const [ch, [top, s]] of Object.entries(F)) { const rows = s.split('/'), w = Math.max(...rows.map(r => r.length)); GL[ch] = { w, top, rows, ax }; ax += w + 1; }
  let AC = null; const atl = {};
  const atlas = col => { if (atl[col]) return atl[col]; if (!AC) { const [c, x] = mk(ax, 10); x.fillStyle = '#fff'; for (const gl of Object.values(GL)) gl.rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') x.fillRect(gl.ax + i, gl.top + j, 1, 1); }); AC = c; }
    const [c, x] = mk(ax, 10); x.drawImage(AC, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, ax, 10); return atl[col] = c; };
  const SP = 3, FONT_LH = 11; Rpg.FONT_LH = FONT_LH;
  const glyph = ch => GL[ch] || GL[ch.toUpperCase()] || GL[ch.normalize('NFD')[0]] || GL['?'];
  const cw = ch => ch === ' ' ? SP : glyph(ch).w;
  Rpg.measure = (s, sc = 1) => { let w = 0; for (const ch of String(s)) w += cw(ch) + 1; return Math.max(0, w - 1) * sc; };
  // (x, y) = linke obere Ecke der Zeile (Zeile 0 = Akzentzeile). o: sh (Schatten, null = ohne), sc (ganzzahlig), al, n (nur n Zeichen)
  px.text = (g, s, x, y, col = '#f6f2ff', { sh = '#0d0b1e', sc = 1, al = 'left', n = 1e9 } = {}) => {
    s = String(s); if (al !== 'left') x -= al === 'center' ? Rpg.measure(s, sc) / 2 : Rpg.measure(s, sc); x = Math.round(x); y = Math.round(y);
    const A = atlas(col), S = sh ? atlas(sh) : null; let k = 0;
    for (const ch of s) { if (k++ >= n) break; if (ch === ' ') { x += (SP + 1) * sc; continue; } const gl = glyph(ch);
      if (S) g.drawImage(S, gl.ax, 0, gl.w, 10, x + sc, y + sc, gl.w * sc, 10 * sc);
      g.drawImage(A, gl.ax, 0, gl.w, 10, x, y, gl.w * sc, 10 * sc); x += (gl.w + 1) * sc; }
    return x; };
  // Text auf Breite kürzen (…)
  Rpg.fit = (s, maxW, sc = 1) => { s = String(s); if (Rpg.measure(s, sc) <= maxW) return s; while (s.length > 1 && Rpg.measure(s + '…', sc) > maxW) s = s.slice(0, -1); return s.replace(/[ ,.;:]+$/, '') + '…'; };
  Rpg.wrapWords = (words, maxW) => { const out = []; let x = 0, row = 0; for (const w of words) { const ww = Rpg.measure(w.w); if (x > 0 && x + ww > maxW) { x = 0; row++; } out.push({ ...w, x, row, ww }); x += ww + SP + 1; } return out; };
  // Schlüsselwörter: Liste von Wortstämmen (Farbe = def) oder { stamm: farbe }
  const keyCol = (w, keys, def) => { if (!keys) return null; const k = w.toLowerCase().replace(/[.,;:!?„“"’()]/g, '');
    if (Array.isArray(keys)) return keys.some(s => s && k.startsWith(s.toLowerCase())) ? def : null; for (const s in keys) if (k.startsWith(s.toLowerCase())) return keys[s]; return null; };
  // Liedzeile im Takt tippen: jedes Wort tippt sich zwischen s-lead und s+.02 ein. words = [{w,s,e}]
  px.typeLine = (g, words, x, y, maxW, t, { lead = .14, col = '#f6f2ff', sh = '#0d0b1e', lh = FONT_LH, keys = null, keyCol: kc = '#ffe58a' } = {}) => {
    const L = Rpg.wrapWords(words, maxW); let last = null;
    for (const it of L) { const a = it.s - lead, b = it.s + .02; if (t < a) break; const n = Math.ceil(it.w.length * clamp((t - a) / (b - a)));
      px.text(g, it.w, x + it.x, y + it.row * lh, keyCol(it.w, keys, kc) || col, { sh, n }); last = it; }
    return { L, rows: L.length ? L[L.length - 1].row + 1 : 0, last }; };

  // ---------- Thema aus Seez-Palette ----------
  // Medium-typisch bleibt: blaue Spielfenster, Goldrahmen, Goldzeiger, rote Herzen. Aus der Figur: Fensterton (leicht), Schlüsselwörter, Leiste, Begleiter, Name.
  Rpg.STY = {
    blue: { top: '#3d50b4', bot: '#121a4e', o: '#0a0820', l1: '#eceaff', l2: '#a8b4ec', sh: '#0e1440' },
    dark: { top: '#1c2050', bot: '#07081a', o: '#000000', l1: '#b8bce0', l2: '#5c6290', sh: '#04050f' },
    plain: { top: '#0b0b18', bot: '#0b0b18', o: '#000000', l1: '#d8d8e8', l2: '#3a3a52', sh: '#000000' },
    paper: { top: '#f4ead2', bot: '#e2d2ae', o: '#2a1e14', l1: '#8a6a44', l2: '#c8ae84', sh: '#bfa67c' },
    gold: { top: '#4a3a8a', bot: '#1a1446', o: '#0a0820', l1: '#ffe58a', l2: '#c0903a', sh: '#120e30' }
  };
  Rpg.theme = (C = (window.Seez ? Seez.CHAR.lume : { name: 'LUME', col: '#b48cff', hi: '#f1e8ff', bg: '#0b0716', ink: '#130b24', acc: '#ffd6f0' }), over = {}) => {
    const win = { ...Rpg.STY.blue, top: mix('#3d50b4', C.col, .2), bot: mix('#121a4e', C.ink || '#0a0820', .3), l2: mix('#a8b4ec', C.col, .25) };
    return Object.assign({ name: C.name, col: C.col, acc: C.acc || C.col, hi: C.hi || '#f6f2ff', ink: C.ink || '#0d0b1e', win, gold: '#ffe58a', goldD: '#c08a28',
      key: mix(C.col, '#ffffff', .3), bar: mix(C.col, '#ffffff', .2), bar2: mix(C.col, '#000000', .45), companion: mix(C.col, '#ffffff', .35),
      magic: mix(C.col, '#6ff0ff', .45), white: '#f6f2ff', grey: '#9aa0c0', soft: mix(C.col, '#e8e0ff', .55), heart: '#e8506a' }, over);
  };
  const DEF_TH = () => Rpg._th || (Rpg._th = Rpg.theme());
  Rpg.defTheme = DEF_TH;

  // ---------- Fenster ----------
  const rr = (c, x, y, w, h, r, col) => { c.fillStyle = col; if (r >= 2) { c.fillRect(x + 2, y, w - 4, h); c.fillRect(x + 1, y + 1, w - 2, h - 2); c.fillRect(x, y + 2, w, h - 4); } else if (r === 1) { c.fillRect(x + 1, y, w - 2, h); c.fillRect(x, y + 1, w, h - 2); } else c.fillRect(x, y, w, h); };
  const fcache = {};
  const styOf = s => typeof s === 'string' ? (Rpg.STY[s] || Rpg.STY.blue) : s || Rpg.STY.blue;
  Rpg.frameImg = (w, h, sty = 'blue') => { const S = styOf(sty), k = w + 'x' + h + Object.values(S).join(''); if (fcache[k]) return fcache[k]; const [cv, c] = mk(w, h);
    rr(c, 0, 0, w, h, 2, S.o); rr(c, 1, 1, w - 2, h - 2, 2, S.l1); rr(c, 2, 2, w - 4, h - 4, 1, S.l2);
    const ih = h - 6, bands = Math.max(2, Math.min(9, Math.round(ih / 5)));
    for (let j = 0; j < ih; j++) { const u = j / Math.max(1, ih - 1) * (bands - 1), b0 = Math.floor(u), fr = u - b0; const ca = mix(S.top, S.bot, b0 / (bands - 1)), cb = mix(S.top, S.bot, Math.min(bands - 1, b0 + 1) / (bands - 1));
      c.fillStyle = ca; c.fillRect(3, 3 + j, w - 6, 1); if (fr > .6) { c.fillStyle = cb; for (let i = (j & 1); i < w - 6; i += 2) c.fillRect(3 + i, 3 + j, 1, 1); } }
    c.fillStyle = S.sh; c.fillRect(3, 3, w - 6, 1); c.fillRect(3, 3, 1, h - 6);
    if (h >= 20 && w >= 20) { c.fillStyle = S.l1; for (const [x, y] of [[4, 4], [w - 5, 4], [4, h - 5], [w - 5, h - 5]]) c.fillRect(x, y, 1, 1); }
    return fcache[k] = cv; };
  // Fenster; k = Öffnung 0..1 (vertikal aus der Mitte). true = ganz offen (Inhalt zeichnen)
  px.frame = (g, x, y, w, h, sty = 'blue', k = 1) => { if (k <= 0) return false; x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); if (k >= 1) { g.drawImage(Rpg.frameImg(w, h, sty), x, y); return true; }
    const hh = Math.max(6, Math.round(h * eout(k))); g.drawImage(Rpg.frameImg(w, hh, sty), x, Math.round(y + (h - hh) / 2)); return false; };

  // ---------- Zeiger, Weiter-Pfeil, Auswahl ----------
  const CUR = px.mat(['KK.....', 'KyKK...', 'KyyyKK.', 'KyyyyyK', 'KyyyKK.', 'KyKK...', 'KK.....'], { K: '#2a1a08', y: '#ffd860' });
  const CUR2 = px.mat(['KK.....', 'KwKK...', 'KwwwKK.', 'KwwwwwK', 'KwwwKK.', 'KwKK...', 'KK.....'], { K: '#2a1a08', w: '#fff8e0' });
  px.cursor = (g, x, y, t, flash = 0) => { const bob = Math.floor(t * 4) % 2; px.draw(g, flash > 0 && Math.floor(t * 20) % 2 ? CUR2 : CUR, x - bob, y); };
  const ARROW = px.mat(['KKKKKKK', 'KwwwwwK', '.KwwwK.', '..KwK..', '...K...'], { K: '#0a0820', w: '#fff1b8' });
  px.more = (g, x, y, t) => { if (Math.floor(t * 3.2) % 2 === 0) return; px.draw(g, ARROW, x, y + (Math.floor(t * 6.4) % 2)); };
  // Auswahlmenü: items, sel (Index), k (Öffnung), flash (Zeit der Bestätigung → Zeiger blitzt)
  px.choice = (g, t, { x = 192, y = 86, items = ['Ja', 'Nein'], sel = 0, w = null, k = 1, flash = -1, sty = null, th = DEF_TH(), maxW = 160 } = {}) => {
    const its = items.map(s => Rpg.fit(s, maxW)); const ww = w || Math.max(...its.map(s => Rpg.measure(s))) + 24, hh = its.length * 12 + 9;
    if (!px.frame(g, x, y, ww, hh, sty || th.win, k)) return [ww, hh];
    its.forEach((s, i) => px.text(g, s, x + 15, y + 4 + i * 12, i === sel ? th.white : '#aab0d8'));
    px.cursor(g, x + 5, y + 6 + sel * 12, t, flash >= 0 && t > flash && t < flash + .5 ? 1 : 0); return [ww, hh]; };

  // ---------- Leisten, Herzen, Meldungen, Zähler ----------
  px.bar = (g, x, y, w, label, v, { col = DEF_TH().bar, col2 = DEF_TH().bar2, lab = '#f6f2ff', glitch = 0, t = 0, hiCol = '#e8ffff' } = {}) => { const lw = label ? Rpg.measure(label) + 5 : 0;
    if (label) px.text(g, label, x, y - 1, lab);
    const bx = x + lw, by = y + 1; px.rect(g, bx - 1, by - 1, w + 2, 8, '#0a0820'); px.rect(g, bx, by, w, 6, '#262c5c'); px.rect(g, bx, by, w, 1, '#1a1e44');
    const fw = Math.round(w * clamp(v)); if (fw > 0) { px.rect(g, bx, by, fw, 6, col2); px.rect(g, bx, by, fw, 3, col); px.rect(g, bx, by, fw, 1, hiCol); }
    for (let i = 8; i < w; i += 8) px.rect(g, bx + i, by, 1, 6, 'rgba(10,8,32,0.35)');
    if (glitch > 0) { const r = rng(Math.floor(t * 12) * 7 + 3); for (let i = 0; i < 6 * glitch; i++) px.rect(g, bx + r() * w, by + r() * 6 - 2, 1 + r() * 4, 1, r() < .5 ? '#f4b6c8' : '#6ff0ff'); }
    return bx + w; };
  const heartImg = col => MX.memo('rpg.heart.' + col, () => [px.mat(['.KK.KK.', 'KrrKrrK', 'KrwrrrK', 'KrrrrrK', '.KrrrK.', '..KrK..', '...K...'], { K: '#2a0a14', r: col, w: mix(col, '#ffffff', .7) }),
    px.mat(['.KK.KK.', 'KddKddK', 'KdddddK', 'KdddddK', '.KdddK.', '..KdK..', '...K...'], { K: '#2a0a14', d: '#4a2440' })]);
  px.hearts = (g, x, y, n, v, t = 0, { glitch = 0, col = '#e8506a' } = {}) => { const [HZ, HE] = heartImg(col); for (let i = 0; i < n; i++) { const f = clamp(v * n - i); let gx = 0, gy = 0;
    if (glitch > 0) { const r = rng(i * 31 + Math.floor(t * 10)); if (r() < glitch * .6) { gx = Math.round((r() - .5) * 4 * glitch); gy = Math.round((r() - .5) * 2 * glitch); } }
    px.draw(g, f >= .5 ? HZ : HE, x + i * 8 + gx, y + gy); } };
  // Systemmeldung oben mittig zwischen a und b
  px.notice = (g, t, s, a, b, { y = 8, sty = 'dark', col = '#f6f2ff' } = {}) => { if (t < a || t > b) return; const k = Math.min(clamp((t - a) / .12), clamp((b - t) / .12)); s = Rpg.fit(s, 290); const w = Rpg.measure(s) + 16; px.frame(g, 160 - w / 2, y, w, 17, sty, k); if (k >= 1) px.text(g, s, 160, y + 3, col, { al: 'center' }); };
  // Fundzähler oben rechts: n (Zahl), pulse 0..1 (springt auf Schlägen)
  px.counter = (g, t, { n = 0, pulse = 0, icon = '◆', x = 266, y = 4, col = '#ffe58a' } = {}) => { px.frame(g, x, y, 50, 15, 'dark'); px.text(g, icon, x + 6, y + 2 - (pulse > .5 ? 1 : 0), col); px.text(g, String(n).padStart(3, '0'), x + 44, y + 2, pulse > .5 ? col : '#f6f2ff', { al: 'right' }); };

  // ---------- Porträt aus beliebigem Figurenbild ----------
  // img: Image/Canvas oder Seez.sprite. head: [cx, cy, größe] als Bruchteile (cx, cy von Breite/Höhe, größe von der Höhe) ODER rect: [x,y,w,h] in Bildpixeln.
  // Palette: pal (Liste '#rrggbb') oder automatisch (Median-Schnitt auf colors Farben). Danach Einzelpixel-Bereinigung und dunkle Kontur (wie mv5 02_ui).
  const PC = new WeakMap();
  const medianCut = (d, n) => { let boxes = [[]]; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 110) boxes[0].push([d[i], d[i + 1], d[i + 2]]); if (!boxes[0].length) return ['#000000'];
    while (boxes.length < n) { let bi = -1, bc = -1, br = 0; boxes.forEach((b, i) => { if (b.length < 2) return; for (let c = 0; c < 3; c++) { let lo = 255, hi = 0; for (const p of b) { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c]; } if (hi - lo > br) { br = hi - lo; bi = i; bc = c; } } });
      if (bi < 0) break; const b = boxes[bi].sort((p, q) => p[bc] - q[bc]); boxes.splice(bi, 1, b.slice(0, b.length >> 1), b.slice(b.length >> 1)); }
    return boxes.filter(b => b.length).map(b => '#' + [0, 1, 2].map(c => Math.round(b.reduce((s, p) => s + p[c], 0) / b.length).toString(16).padStart(2, '0')).join('')); };
  const cleanPix = (d, w, h) => { const o = new Uint8ClampedArray(d); const key = q => d[q + 3] ? (d[q] << 16 | d[q + 1] << 8 | d[q + 2]) : -1;
    for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) { const q = (j * w + i) * 4, me = key(q); if (me < 0) continue; const cnt = new Map(); let same = 0;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { if (!a && !b) continue; const k = key(((j + b) * w + i + a) * 4); if (k === me) same++; else if (k >= 0) cnt.set(k, (cnt.get(k) || 0) + 1); }
      if (same <= 1) { let bk = -1, bn = 0; for (const [k, n] of cnt) if (n > bn) { bn = n; bk = k; } if (bn >= 4) { o[q] = bk >> 16 & 255; o[q + 1] = bk >> 8 & 255; o[q + 2] = bk & 255; } } }
    return o; };
  Rpg.portrait = (img, { head = [.5, .12, .2], rect = null, size = 34, colors = 16, pal = null, outline = '#1d1630' } = {}) => {
    const src = img.fw ? img.src : img, iw = img.fw || img.width, ih = img.fh || img.height; const key = (rect || head).join(',') + '|' + size + '|' + colors + '|' + (pal || []).join('');
    let m = PC.get(src); if (!m) PC.set(src, m = {}); if (m[key]) return m[key];
    const r = rect || (() => { const s = head[2] * ih; return [head[0] * iw - s / 2, head[1] * ih - s / 2, s, s]; })();
    let P = pal; if (!P) { const [, sx] = MX.canvas(size, size); sx.imageSmoothingQuality = 'high'; sx.drawImage(src, r[0], r[1], r[2], r[3], 0, 0, size, size); P = medianCut(sx.getImageData(0, 0, size, size).data, colors); }
    const p = MX.pixel(img.fw ? { fw: iw, fh: ih, src } : img, size, size, { palette: P, rect: r });
    const [c, x] = mk(size, size); x.drawImage(p, 0, 0); const id = x.getImageData(0, 0, size, size); const d = cleanPix(cleanPix(id.data, size, size), size, size); const o = new Uint8ClampedArray(d); const [orr, og, ob] = [1, 3, 5].map(i => parseInt(outline.slice(i, i + 2), 16));
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { const q = (j * size + i) * 4; if (d[q + 3]) continue; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const ii = i + a, jj = j + b; return ii >= 0 && jj >= 0 && ii < size && jj < size && d[(jj * size + ii) * 4 + 3]; })) { o[q] = orr; o[q + 1] = og; o[q + 2] = ob; o[q + 3] = 255; } }
    x.putImageData(new ImageData(o, size, size), 0, 0); return m[key] = c; };
  // Optional: LUMEs Kopfblatt aus mv5 (assets/rpg/lume_heads.png, 2×2 Köpfe à 136 px: neugierig, müde, lächelnd, neutral) mit der Originalpalette.
  // const img = await Seez.img('assets/rpg/lume_heads.png'); const port = Rpg.LUME_PORT.rects.map(rect => Rpg.portrait(img, { rect, pal: Rpg.LUME_PORT.pal }));
  Rpg.LUME_PORT = { src: 'assets/rpg/lume_heads.png', rects: [[0, 0, 136, 136], [136, 0, 136, 136], [0, 136, 136, 136], [136, 136, 136, 136]],
    pal: ['#1d1630', '#2e2a58', '#d6e8fc', '#a4c2f0', '#7896dc', '#5466b0', '#fae2cc', '#eebca4', '#d89a88', '#b07070', '#fff0a0', '#f0c050', '#3c4890', '#d4b8ee', '#a88ad4', '#7a62ae', '#f2ece0', '#c85a6a'] };
  // Porträt im Goldrahmen (40×40). port = Canvas aus Rpg.portrait (oder Liste → ex wählt den Ausdruck)
  px.portrait = (g, x, y, port, t = 0, { ex = 0, th = DEF_TH(), glow = 0 } = {}) => { px.frame(g, x, y, 40, 40, 'gold'); px.rect(g, x + 3, y + 3, 34, 34, mix('#141a44', th.ink, .3)); px.dith(g, x + 3, y + 21, 34, 16, mix('#1e2660', th.col, .15), 0);
    const P = Array.isArray(port) ? port[Math.min(port.length - 1, ex)] : port; if (P) g.drawImage(P, 0, 0, P.width, P.height, x + 3, y + 3, 34, 34);
    if (glow > 0) px.glow(g, x + 20, y + 35, 4 + (.5 + .5 * Math.sin(t * 5.2)) * 2, '#ffe678', .5 * glow); };

  // ---------- Textbox mit Porträt und Namensschild ----------
  // o: line {words}, port (Canvas/Liste/null), name (null = ohne Schild), open/close (Zeiten), sty, keys (Schlüsselwörter), y, ex
  Rpg.TB = { x: 4, y: 128, w: 312, h: 48 };
  px.textbox = (g, t, { line = null, port = null, name, open = null, close = null, sty = null, keys = null, y = Rpg.TB.y, ex = 0, th = DEF_TH(), lead = .14, glow = 0 } = {}) => {
    const B = Rpg.TB; let k = 1; if (open !== null) k = clamp((t - open) / .16); if (close !== null) k = Math.min(k, clamp((close - t) / .16)); if (k <= 0) return null;
    if (!px.frame(g, B.x, y, B.w, B.h, sty || th.win, k)) return null; if (name === undefined) name = th.name;
    let tx = B.x + 10, mw = B.w - 20; if (port) { px.portrait(g, B.x + 4, y + 4, port, t, { ex, th, glow }); tx = B.x + 50; mw = B.w - 58; }
    if (name) { const nm = Rpg.fit(name, 90), nw = Math.max(36, Rpg.measure(nm) + 12); px.frame(g, B.x + (port ? 6 : 8), y - 11, nw, 15, 'gold'); px.text(g, nm, B.x + (port ? 6 : 8) + nw / 2, y - 8, th.gold, { al: 'center' }); }
    if (!line || !line.words || !line.words.length) return null;
    const L = px.typeLine(g, line.words, tx, y + 5, mw, t, { keys, keyCol: th.key, lead });
    const lw = line.words[line.words.length - 1]; if (t > lw.s + .25) px.more(g, B.x + B.w - 13, y + B.h - 9, t);
    return L; };

  // ---------- Statusfenster ----------
  // o: k, port, look, name, sub, lv, hearts [n, v], stats [[label, v 0..1, zahl, farbe]], state, th
  px.status = (g, t, { k = 1, port = null, look = null, name = DEF_TH().name, sub = '', lv = 'Lv 17', hearts = [6, .8], stats = [], state = '', th = DEF_TH(), heartCol = th.heart } = {}) => {
    if (!px.frame(g, 8, 6, 304, 114, th.win, k)) return; if (port) px.portrait(g, 16, 14, port, t, { th }); px.frame(g, 16, 58, 40, 50, 'dark');
    if (look) { const dirs = ['down', 'right', 'up', 'left']; px.hero(g, 36, 100, dirs[Math.floor(t * 2.6) % 4], t, { look, light: .4 }); }
    const nm = Rpg.fit(name, 170, 2); px.text(g, nm, 66, 12, th.white, { sc: 2 }); px.text(g, lv, 300, 14, th.gold, { al: 'right' }); if (sub) px.text(g, Rpg.fit(sub, 230), 66, 34, th.soft);
    px.rect(g, 66, 46, 236, 1, th.win.l2); px.rect(g, 66, 47, 236, 1, '#141c50');
    px.text(g, 'Leben', 66, 52, th.white); px.hearts(g, 130, 54, hearts[0], hearts[1], t, { col: heartCol });
    stats.slice(0, 2).forEach(([lab, v, num, col], i) => { const y = 68 + i * 16; px.text(g, Rpg.fit(lab, 60), 66, y, th.white); px.bar(g, 130, y + 1, 120, '', v, { col: col || th.bar, col2: mix(col || th.bar, '#000000', .45) }); px.text(g, String(num == null ? Math.round(v * 99) : num), 300, y, th.white, { al: 'right' }); });
    if (state) px.text(g, Rpg.fit(state, 230), 66, 100, th.grey); };

  // ---------- Questlog-Liste ----------
  px.questlog = (g, t, { k = 1, sel = 0, sc = 0, done = () => false, title = 'QUESTLOG', count = '248 Einträge', hi = -1, list = ['…'], flash = -1, h = 114, nr0 = 101, th = DEF_TH() } = {}) => {
    if (!px.frame(g, 8, 6, 304, h, th.win, k)) return;
    px.text(g, title, 18, 10, th.gold); px.text(g, count, 300, 10, th.grey, { al: 'right' }); px.rect(g, 16, 22, 288, 1, th.win.l2); px.rect(g, 16, 23, 288, 1, '#141c50');
    g.save(); g.beginPath(); g.rect(14, 26, 276, h - 24); g.clip(); const y0 = 28 - (sc % 1) * 12, i0 = Math.floor(sc);
    for (let r = 0; r < 9; r++) { const i = i0 + r, y = Math.round(y0 + r * 12), s = Rpg.fit(list[((i % list.length) + list.length) % list.length], 200), on = i === sel;
      if (on) px.rect(g, 16, y - 1, 272, 12, i === hi ? '#5a4a20' : mix('#2c3c96', th.col, .15));
      px.rect(g, 30, y + 2, 7, 7, '#0a0e30'); px.rect(g, 31, y + 3, 5, 5, done(i) ? '#2a8a5a' : '#1a2058'); if (done(i)) px.text(g, '✓', 31, y, th.white, { sh: null });
      px.text(g, s, 42, y, i === hi ? th.gold : done(i) ? '#8a90c0' : th.white); px.text(g, 'Nr. ' + (i + nr0), 284, y, '#6a70a8', { al: 'right' }); if (on) px.cursor(g, 18, y + 1, t, flash >= 0 && t - flash < .15 ? 1 : 0); }
    g.restore(); const tb = 10; px.rect(g, 296, 26, 4, h - 30, '#0a0e30'); px.rect(g, 296, 26 + ((sc * 3) % (h - 30 - tb)), 4, tb, th.soft); };

  // ---------- Figuren-Sprite 16×24 ----------
  // Zeichen: K Kontur · h H d Haar hell/mittel/dunkel · s S Haut · g Brille · e Augen · m Mund · p P q Mantel/Jacke · w Hemd · a Akzent (Amulett/Aufnäher)
  // c C Hose · o O Schuhe · y Y z Kopfbedeckung (mittel/hell/dunkel) · v V Visier hell/dunkel · x X Maske · r Reflexstreifen
  const FRONT = ['......KKKK......', '....KKhhhhKK....', '...KhhhhhhhhK...', '..KhhhHhhHhhhK..', '..KhHHhhhhHHhK..', '.KhHhsssssshHhK.', '.KhHhggssgghHhK.', '.KhHhgessegHhhK.', '.KhHhSssssShHhK.', '.KhHhhssmshhHhK.',
    '.KHhKqPssPqKhHK.', '.KHhqpPwwPpqhHK.', '.KHqpPwaawPpqHK.', '.KdqpPwwwwPpqdK.', 'KdqppPwwwwPppqdK', 'KqppPPwwwwPPppqK', 'KsqpPPPPPPPPpqsK', '.KqpPccccccPpqK.', '.KqpPccCCccPpqK.', '..KqPccCCccPqK..', '...KcccKKcccK...', '...KccCKKCccK...', '...KooOKKOooK...', '...KKKK..KKKK...'];
  const BACK = ['......KKKK......', '....KKhhhhKK....', '...KhhhhhhhhK...', '..KhhHhhhhHhhK..', '..KhHHhhhhHHhK..', '.KhHhhdhhdhhHhK.', '.KhHhHdhhdHhHhK.', '.KhHhHdhhdHhHhK.', '.KHhhHdHhdHhhHK.', '.KHhdHhHHhHdhHK.',
    '.KqHdHhHHhHdHqK.', '.KpqdHhHHhHdqpK.', '.KpPqdHhhHdqPpK.', 'KppPqdHhhHdqPppK', 'KppPPqdHHdqPPppK', 'KqpPPPqddqPPPpqK', 'KsqpPPPqqPPPpqsK', '.KqpPPPPPPPPpqK.', '.KqpPccccccPpqK.', '..KqPccCCccPqK..', '...KcccKKcccK...', '...KccCKKCccK...', '...KOooKKooOK...', '...KKKK..KKKK...'];
  const SIDE = ['.....KKKKK......', '...KKhhhhhKK....', '..KhhhhhhhhhK...', '.KhhHHhhhhhhhK..', '.KhHHdHHhhhhhK..', '.KHHdHHhhhKsssK.', '.KHdHHdHhhhsgsK.', '.KHdHHdHHhhsegsK', '.KHdHHdHHhhSsssK', '.KdHdHHdHhhhSmK.',
    '.KdHdHdHhKqPsK..', '.KddHdHdqpPPwwK.', '.KdHdHdqpPPPwaK.', '..KddHdqppPPPwK.', '..KdddqpPPPPPqK.', '...KKqpPqqPPPqK.', '....KqpPqsPPPqK.', '....KqpPccccPqK.', '....KqpPccCcPqK.', '.....KqPccCcqK..', '......KccCcK....', '......KccCcK....', '......KooooOK...', '......KKKKKKK...'];
  const legsFB = [null, ['...KcccKKcccK...', '...KccCK.KCcK...', '...KooOK.KccK...', '...KKKK..KOoK...'], null, ['...KcccKKcccK...', '...KcCK.KCccK...', '...KccK.KOooK...', '...KoOK..KKKK...']];
  const legsS = [null, ['.....KccKKcCK...', '....KccK..KcCK..', '...KooOK...KooOK', '...KKKKK...KKKKK'], null, ['......KcCcK.....', '......KccCK.....', '......KoooOK....', '......KKKKKK....']];
  // Köpfe (Zeilen 0–9) je Kopfform: f = vorn, s = Seite (nach rechts), n = Zeile 10 vorn (Halsansatz, optional)
  const HEADS = {
    short: { f: ['................', '.....KKKKKK.....', '...KKhhHhhhKK...', '..KhhhhhHhhhhK..', '..KhHhhhhhhHhK..', '..KhhsssssshhK..', '..KHssssssssHK..', '...KsesSSsesK...', '...KSssssssSK...', '....KSsmmsSK....'],
      s: ['................', '....KKKKK.......', '...KhhhhhKK.....', '..KhhhHhhhhK....', '..KhHhhhhhhhK...', '..KhHhhhhsssK...', '..KhHhhhssesK...', '..KhhhhsssssK...', '...KhhSsssSK....', '....KKSsmsK.....'] },
    hood: { f: ['.....KKKKKK.....', '...KKpppppPKK...', '..KpppPPPPpppK..', '..KppPqqqqPppK..', '.KppPqqqqqqPppK.', '.KppqssssssqppK.', '.KppqSssssSqppK.', '.KppqseSSesqppK.', '.KpPqSssssSqPpK.', '.KpPPqSmmSqPPpK.'], n: '.KppPqPssPqPppK.',
      s: ['................', '....KKKKKK......', '...KpppppPK.....', '..KpppPPPppK....', '.KppPPPqqqqqK...', '.KppPPqssssK....', '.KppPPqssesK....', '.KppPPqsssssK...', '.KpppPqSsssK....', '..KppPqSmsK.....'] },
    helmet: { f: ['................', '.....KKKKKK.....', '...KKyyyyYyKK...', '..KyyyyyyyYyyK..', '..KyyyyyyyyyyK..', '.KzzzzzzzzzzzzK.', '..KHssssssssHK..', '...KsesSSsesK...', '...KSssssssSK...', '....KSsmmsSK....'],
      s: ['................', '....KKKKK.......', '...KyyyyyKK.....', '..KyyyyyYyyK....', '..KyyyyyyyyyK...', '..KzzzzzzzzzzzK.', '..KhHhhhssesK...', '..KhhhhsssssK...', '...KhhSsssSK....', '....KKSsmsK.....'] },
    cap: { f: ['................', '.....KKKKKK.....', '...KKyyyyYyKK...', '..KyyyyyyyYyyK..', '.KzzzzzzzzzzzzK.', '..KhhsssssshhK..', '..KHssssssssHK..', '...KsesSSsesK...', '...KSssssssSK...', '....KSsmmsSK....'],
      s: ['................', '....KKKKK.......', '...KyyyyyKK.....', '..KyyyyyYyyK....', '..KyyyyyyyyzzzK.', '..KhHhhhhsssK...', '..KhHhhhssesK...', '..KhhhhsssssK...', '...KhhSsssSK....', '....KKSsmsK.....'] },
  };
  const FACE = new Set('sSemgvVxX');
  const pad = r => (r + '................').slice(0, 16);
  const subRows = (rows, a, b, fn) => rows.map((r, j) => j < a || j > b ? r : r.split('').map((ch, i) => fn(ch, i, j) || ch).join(''));
  // verwaiste Konturpunkte entfernen, fehlende Kontur ergänzen (für umgebaute Bilder)
  const fixOutline = rows => { const A = rows.map(r => pad(r).split('')), h = A.length, w = 16; const col = (i, j) => j >= 0 && j < h && i >= 0 && i < w && A[j][i] !== '.' && A[j][i] !== 'K';
    const B = A.map(r => r.slice()); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if (A[j][i] === 'K') { let n = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if (col(i + a, j + b)) n++; if (!n) B[j][i] = '.'; } else if (A[j][i] === '.' && (col(i - 1, j) || col(i + 1, j) || col(i, j - 1) || col(i, j + 1))) B[j][i] = 'K'; }
    return B.map(r => r.join('')); };
  const faceSub = (rows, face) => { if (face === 'glasses') { const out = rows.map(r => r.split('')); rows.forEach((r, j) => { if (j > 9) return; for (let i = 0; i < 16; i++) if (r[i] === 'e') for (const [a, b] of [[-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]]) { const ch = out[j + b] && out[j + b][i + a]; if (ch === 's' || ch === 'S') out[j + b][i + a] = 'g'; } }); return out.map(r => r.join('')); }
    if (face === 'visor') { const ej = rows.findIndex((r, j) => j <= 9 && r.includes('e')); return subRows(rows, 0, 9, (ch, i, j) => FACE.has(ch) ? (j === ej ? 'v' : 'V') : null); }
    if (face === 'mask') return subRows(rows, 0, 9, ch => ch === 's' ? 'x' : ch === 'S' || ch === 'm' ? 'X' : null);
    return rows; };
  const buildSet = look => {
    const head = look.head || 'short', face = look.face || 'eyes', P = look.pal || Rpg.palette(look.spec || {});
    let F, B, S;
    if (head === 'long') { F = FRONT.slice(); B = BACK.slice(); S = SIDE.slice(); }
    else { const H = HEADS[head] || HEADS.short, toBody = (rows, mode) => rows.map((r, j) => j === 0 && mode !== 'side' ? null : r.replace(/[hHd]/g, ch => mode === 'side' || j === 0 ? '.' : { h: 'p', H: 'P', d: 'q' }[ch]));
      const bf = toBody(FRONT.slice(10), 'front'); bf[0] = H.n || '....KqPssPqK....';
      const bb = toBody(BACK.slice(10), 'back'); bb[0] = (H.n || '....KqPssPqK....').replace(/s/g, 'P');
      const back = H.f.map(r => r.replace(/[sSemgvVxX]/g, ch => head === 'hood' ? 'P' : ch === 'S' ? 'H' : 'h'));
      F = H.f.map(pad).concat(bf); B = back.map(pad).concat(bb); S = H.s.map(pad).concat(toBody(SIDE.slice(10), 'side')); }
    if (face !== 'eyes' && !(head === 'long' && face === 'glasses')) { F = faceSub(F, face); S = faceSub(S, face); }
    if (look.coat === 'jacket') { const jf = ['...KccccccccK...', '...KcccCCcccK...', '...KcccCCcccK...']; F.splice(17, 3, ...jf); B.splice(17, 3, ...jf); S = S.map((r, j) => j >= 17 && j <= 19 ? r.replace(/[pP]/g, 'c').replace(/q/g, 'C') : r); }
    const fr = (base, legs, side) => [0, 1, 2, 3].map(f => { let rows = base.slice(); if (legs[f]) for (let i = 0; i < 4; i++) rows[20 + i] = legs[f][i];
      if (look.stripe) rows = rows.map((r, j) => j === 14 || j === 21 ? r.replace(/[pPqcCw]/g, 'r') : r);
      if (head !== 'long' || look.coat === 'jacket') rows = fixOutline(rows); return px.mat(rows, P); });
    const set = { down: fr(F, legsFB), up: fr(B, legsFB), right: fr(S, legsS) }; set.left = set.right.map(px.flipH);
    const bl = F.slice(); for (let j = 0; j < 10; j++) if (bl[j].includes('e') && face !== 'visor') bl[j] = bl[j].replace(/e/g, face === 'glasses' ? 'g' : 'S');
    set.blink = px.mat(head === 'long' && look.coat !== 'jacket' ? bl : fixOutline(bl), P);
    const jp = F.slice(); jp[14] = jp[14].replace(/^K./, 'Ks').replace(/.K$/, 'sK'); jp[16] = jp[16].replace(/s/g, 'q'); jp[20] = '...KcccKKcccK...'; jp[21] = '....KcCKKCcK....'; jp[22] = '....KoOKKOoK....'; jp[23] = '....KKK..KKK....'; set.jump = px.mat(head === 'long' && look.coat !== 'jacket' ? jp : fixOutline(jp), P);
    set.amu = look.amulet ? { down: [[7, 12], [8, 12]], right: [[13, 12]], left: [[2, 12]], up: [] } : { down: [], right: [], left: [], up: [] };
    return set; };
  // Palette aus Grundfarben: { outline, hair, skin, glasses, eyes, mouth, coat, shirt, acc, pants, shoes, hat, visor, mask, stripe }
  const t3 = col => [mix(col, '#ffffff', .28), col, mix(col, '#000000', .38)];
  Rpg.palette = (s = {}) => { const hair = t3(s.hair || '#3a2a30'), coat = t3(s.coat || '#5a6aa8'), hat = t3(s.hat || s.coat || '#5a6aa8'), skin = s.skin || '#f2d0b4', pants = s.pants || '#4a5068', shoes = s.shoes || '#2a2630', vis = s.visor || '#36f57a', mask = s.mask || '#e8e4ec';
    return { K: s.outline || '#1a1426', h: hair[0], H: hair[1], d: hair[2], s: skin, S: mix(skin, '#7a3a30', .28), g: s.glasses || '#f6c64a', e: s.eyes || '#1e1a2a', m: s.mouth || mix(skin, '#9a3a3a', .45),
      p: coat[0], P: coat[1], q: coat[2], w: s.shirt || '#e8e4dc', a: s.acc || '#ffe680', c: pants, C: mix(pants, '#000000', .3), o: shoes, O: mix(shoes, '#000000', .3),
      y: hat[1], Y: hat[0], z: hat[2], v: vis, V: mix(vis, '#000000', .85), x: mask, X: mix(mask, '#000000', .3), r: s.stripe || '#d8f23a' }; };
  const LUME_PAL = { K: '#241a3a', h: '#bcd8f8', H: '#86a8e2', d: '#5a72b8', s: '#f8dcc6', S: '#dca890', g: '#f6c64a', e: '#2a2040', m: '#c87a7a', p: '#d2bcf2', P: '#a48ed8', q: '#7462aa', w: '#f2ece0', a: '#ffe680', c: '#8494b4', C: '#5c6888', o: '#f2eee6', O: '#b8b0a4' };
  // Aussehen je Figur (Tabelle; neue Figuren: Eintrag ergänzen oder Rpg.look(key, C) leitet eins aus der Palette ab)
  Rpg.LOOKS = {
    lume: { head: 'long', face: 'glasses', coat: 'long', amulet: true, pal: LUME_PAL, glow: '#ffdc78' },
    shift: { head: 'helmet', face: 'eyes', coat: 'jacket', stripe: true, spec: { hair: '#3a2a20', skin: '#e2a882', coat: '#2f5ac0', shirt: '#24479a', acc: '#d8f23a', pants: '#24479a', shoes: '#3a2c22', hat: '#2f62c8', stripe: '#d8f23a', outline: '#0b1626' } },
    gl1tch: { head: 'hood', face: 'visor', coat: 'jacket', spec: { coat: '#2c333a', shirt: '#14181c', acc: '#e9fff0', pants: '#1c2126', shoes: '#e9fff0', visor: '#36f57a', outline: '#020806' }, glow: '#36f57a' },
    unknown: { head: 'hood', face: 'glasses', coat: 'jacket', spec: { skin: '#b07a52', glasses: '#14161c', eyes: '#5a6070', coat: '#2c2e36', shirt: '#121418', acc: '#e7c36a', pants: '#3c4c66', shoes: '#e8e4dc', outline: '#07080c' } },
    drift: { head: 'cap', face: 'eyes', coat: 'jacket', spec: { hair: '#1a1a1e', skin: '#ecc4a2', coat: '#2a2a30', shirt: '#2a2a30', acc: '#f4f4f4', pants: '#30333a', shoes: '#ddd8ce', hat: '#202024', outline: '#061824' } },
    splinter: { head: 'hood', face: 'mask', coat: 'jacket', spec: { coat: '#2e252c', shirt: '#151015', acc: '#ff3fb4', pants: '#201a1e', shoes: '#2c2c30', mask: '#e4e0ea', eyes: '#ff3fb4', outline: '#3c0a28' }, glow: '#ff3fb4' },
  };
  Rpg.look = (key, C, over) => { let L = Rpg.LOOKS[key]; if (!L && C) L = MX.memo('rpg.look.' + C.col + C.acc, () => ({ head: 'short', face: 'eyes', coat: 'jacket', spec: { hair: mix(C.col, '#000000', .5), coat: C.col, shirt: C.ink || '#1a1a24', acc: C.acc, pants: mix(C.col, '#1a1a24', .65), outline: C.ink } }));
    L = L || Rpg.LOOKS.lume; return over ? MX.memo('rpg.look.' + key + JSON.stringify(over), () => ({ ...L, ...over })) : L; };
  const SC_ = new WeakMap();
  Rpg.sprite = look => { let s = SC_.get(look); if (!s) SC_.set(look, s = buildSet(look)); return s; };
  // Figur zeichnen; (x, y) = Fußpunkt Mitte. dir down/up/left/right, walk = Laufphase (float) oder null, light 0..1 (Leuchten, Amulett)
  px.hero = (g, x, y, dir, t, { look = Rpg.LOOKS.lume, walk = null, blink = false, jump = 0, light = .5, shadow = true, pulse = 0 } = {}) => {
    const SP = Rpg.sprite(look); let f = walk !== null ? Math.floor(walk) % 4 : 0; const bob = walk !== null && (f === 1 || f === 3) ? -1 : 0;
    let img = SP[dir][f]; if (blink && dir === 'down') img = SP.blink; if (jump > 0 && dir === 'down') img = SP.jump;
    const pxx = Math.round(x - 8), py = Math.round(y - 24 + bob - jump);
    if (shadow) { g.fillStyle = 'rgba(10,8,30,0.35)'; g.fillRect(pxx + 4, Math.round(y) - 2, 8, 2); g.fillRect(pxx + 3, Math.round(y) - 1, 10, 1); }
    const p = .5 + .5 * Math.sin(t * 5.2) + pulse * .6, A = SP.amu[dir], gc = look.glow || '#ffdc78';
    if (light > 0 && (A.length || !look.amulet)) px.glow(g, x, y - (A.length ? 8 : 12), 10 + light * 14 + p * 3, gc, (A.length ? .18 + .3 * light : .12 * light));
    g.drawImage(img, pxx, py);
    if (A.length) { const col = p > .9 ? '#fffbe0' : p > .45 ? '#ffe680' : '#f0c050'; for (const [ax, ay] of A) { g.fillStyle = col; g.fillRect(pxx + ax, py + ay, 1, 1); }
      if (light > 0) { const [ax, ay] = A[0]; px.glow(g, pxx + ax + (dir === 'down' ? 1 : .5), py + ay + .5, 3 + p * 1.5, '#ffec96', .5); } } };
  // Begleiter (Falter 3×3, zwei Flügelbilder) in Figurfarbe
  px.companion = (g, x, y, t, { col = '#7ff0ff', glow = .4 } = {}) => { const BF = MX.memo('rpg.bf.' + col, () => [px.mat(['c.c', '.k.', 'c.c'], { c: col, k: '#24304a' }), px.mat(['...', 'ckc', '...'], { c: mix(col, '#ffffff', .5), k: '#24304a' })]);
    px.draw(g, BF[Math.floor(t * 9) % 2], x - 1, y - 1); if (glow > 0) px.glow(g, x + .5, y + .5, 6, col, glow); };
  Rpg.bfPath = (cx, cy, t, r = 12) => [cx + Math.sin(t * 1.3) * r + Math.sin(t * 3.1) * 2, cy + Math.sin(t * 2.6) * r * .35 + Math.cos(t * 4.3) * 1.5];
  // Gehstrecke mit Pausen: x(t) = x0 + v · (gelaufene Zeit)
  Rpg.walkX = (t, ts, x0, pauses = [], v = 34) => { let w = Math.max(0, t - ts); for (const [a, b] of pauses) w -= clamp(t - a, 0, b - a); return x0 + v * Math.max(0, w); };
  Rpg.inPause = (t, pauses = []) => pauses.some(([a, b]) => t >= a && t < b);
  // Zeile, die gerade in der Textbox steht (zuletzt begonnene)
  Rpg.lineAt = (lines, t, lead = .2) => { let k = null; for (const l of lines || []) if (t >= l.s - lead) k = l; return k; };
  Rpg.wordAt = (line, i) => line && line.words.length ? line.words[Math.max(0, Math.min(line.words.length - 1, i < 0 ? line.words.length + i : i))] : { s: 0, e: 0, w: '' };
})();

export {};
