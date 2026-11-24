/**
 * QUESTLOG – kleines spielbares Stück aus Lumes Medium (16-Bit-Rollenspiel).
 * Lume läuft nachts durch die Oberwelt, sammelt zwölf Restlichter (je eine Zeile aus QUESTLOG)
 * und bringt sie zum Speicherpunkt. Ein dreizehntes Licht ist versteckt.
 * Engine: Kopie des seez-kit (medium-core, rpg, rpg-parts), erst beim Öffnen geladen.
 * Kein Speicher, keine Cookies, nichts von außen.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Dir = 'up' | 'down' | 'left' | 'right';

export interface GameText {
  lines: string[];
  secret: string;
  finale: string;
  intro: string;
  hint: string;
  sign1: string;
  sign2: string;
  missing: string;
  found: string;
  secretFound: string;
  saved: string;
}

interface Box {
  text: string;
  t0: number;
  dur: number;
  name: string | null;
}

let kit: Promise<void> | null = null;
const loadKit = () =>
  (kit ||= (async () => {
    await import('./seez-kit/medium-core.js');
    await import('./seez-kit/rpg.js');
    await import('./seez-kit/rpg-parts.js');
  })());

// Bitmap-Schrift kennt kein gerades Apostroph
const clean = (s: string) => s.replace(/'/g, '’').replace(/ - /g, ' – ').replace(/[,]$/, '').replace(/ -$/, ' –');

export async function startGame(
  canvas: HTMLCanvasElement,
  T: GameText,
  hooks: { onLine: (s: string) => void; onEnd: () => void }
) {
  await loadKit();
  const W = window as any;
  const Rpg = W.Rpg,
    MX = W.MX,
    px = Rpg.px;
  const g = canvas.getContext('2d')!;
  g.imageSmoothingEnabled = false;

  const M = Rpg.world({ region: 'night', seed: 0 });
  const TS = 16,
    CAMY = Rpg.OW.CAMY,
    WORLD_W = Rpg.OW.TW * TS;
  const th = Rpg.theme();
  const look = Rpg.LOOKS.lume;
  const isWater = (x: number, y: number) => {
    const c = Math.floor(x / TS),
      r = Math.floor(y / TS);
    if (c < 0 || c >= Rpg.OW.TW || r < 0 || r >= Rpg.OW.TH) return true;
    return M.g[r][c] === 'W';
  };
  const free = (x: number, y: number) =>
    x > 8 && x < WORLD_W - 8 && y > 52 && y < 142 && !isWater(x - 4, y - 1) && !isWater(x + 4, y - 1);

  // Restlichter: über die Welt verteilt, nie im Wasser
  const cols = [9, 17, 25, 33, 42, 49, 58, 66, 74, 88, 97, 107];
  const rowsTry = [
    [4, 7],
    [7, 4],
    [3, 8],
    [8, 3],
  ];
  const lights = cols.map((c, i) => {
    for (const r of [...rowsTry[i % 4], 5, 6]) {
      const x = c * TS + 8,
        y = r * TS + 12;
      if (free(x, y)) return { x, y, got: false };
    }
    return { x: c * TS + 8, y: 6 * TS + 4, got: false };
  });
  const secret = { x: 1 * TS + 8, y: 4 * TS + 2, got: false };
  const signs = (M.Lo.signs as number[]).map((s, i) => ({
    x: s * TS + 6,
    y: 92,
    text: i ? T.sign2 : T.sign1,
    near: false,
  }));
  const crystal = { x: 114 * TS + 8, y: 100, near: false };

  const S = {
    x: 14 * TS,
    y: 98,
    dir: 'right' as Dir,
    walk: 0,
    cam: 0,
    n: 0,
    box: null as Box | null,
    queue: [] as Box[],
    notice: null as null | { s: string; a: number },
    ended: false,
  };
  const keys = new Set<string>();
  let t = 0,
    last = 0,
    raf = 0,
    running = false;

  const say = (text: string, name: string | null = 'LUME', speak = true) => {
    const tx = clean(text);
    const words = tx.split(/\s+/).length;
    const b: Box = { text: tx, t0: 0, dur: Math.max(0.8, words * 0.16), name };
    if (speak) hooks.onLine(text);
    if (S.box) S.queue.push(b);
    else {
      b.t0 = t;
      S.box = b;
    }
  };
  const notice = (s: string) => (S.notice = { s: clean(s), a: t });

  const confirm = () => {
    const b = S.box;
    if (!b) return;
    if (t < b.t0 + 0.25 + b.dur) {
      b.t0 = t - b.dur - 0.3; // fertig tippen
      return;
    }
    S.box = S.queue.shift() || null;
    if (S.box) S.box.t0 = t;
    else if (S.ended) hooks.onEnd();
  };

  const step = (dt: number) => {
    if (!S.box && !S.ended) {
      let dx = 0,
        dy = 0;
      if (keys.has('left')) dx -= 1;
      if (keys.has('right')) dx += 1;
      if (keys.has('up')) dy -= 1;
      if (keys.has('down')) dy += 1;
      if (dx || dy) {
        const v = 74 * dt * (dx && dy ? 0.7071 : 1);
        if (dx && free(S.x + dx * v, S.y)) S.x += dx * v;
        if (dy && free(S.x, S.y + dy * v)) S.y += dy * v;
        S.dir = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
        S.walk += dt * 8;
      } else S.walk = 0;
    }
    S.cam += (S.x - 160 - S.cam) * Math.min(1, dt * 6);

    for (const L of lights) {
      if (L.got || Math.hypot(L.x - S.x, L.y - S.y - 4) > 13) continue;
      L.got = true;
      S.n++;
      notice(T.found.replace('{n}', String(S.n)));
      say(T.lines[lights.indexOf(L)] || '');
    }
    if (!secret.got && Math.hypot(secret.x - S.x, secret.y - S.y - 4) <= 13) {
      secret.got = true;
      notice(T.secretFound);
      say(T.secret);
    }
    for (const s of signs) {
      const near = Math.abs(s.x - S.x) < 14 && Math.abs(s.y - S.y) < 18;
      if (near && !s.near) say(s.text, null, false);
      s.near = near;
    }
    const nearC = Math.abs(crystal.x - S.x) < 14 && Math.abs(crystal.y - S.y) < 16;
    if (nearC && !crystal.near && !S.ended) {
      if (S.n >= lights.length) {
        S.ended = true;
        notice(T.saved);
        say(T.finale);
      } else say(T.missing.replace('{n}', String(lights.length - S.n)), null, false);
    }
    crystal.near = nearC;
  };

  const draw = () => {
    const cam = px.world(g, M, S.cam, t);
    const sy = (y: number) => y - CAMY;
    // Kristall (Speicherpunkt)
    px.crystal(g, crystal.x - cam, sy(crystal.y), S.n >= lights.length ? 1 : 0.15, t, th.col);
    // Restlichter
    const drawLight = (L: { x: number; y: number }, i: number, col: string) => {
      const x = L.x - cam,
        y = sy(L.y) - 10 + Math.sin(t * 2.6 + i) * 2;
      if (x < -20 || x > 340) return;
      px.glow(g, x, y, 9 + Math.sin(t * 4 + i) * 2, col, 0.7);
      px.spark(g, x, y, 0.55 + 0.45 * Math.sin(t * 5 + i * 1.7), col);
    };
    lights.forEach((L, i) => !L.got && drawLight(L, i, '#ffe58a'));
    if (!secret.got) drawLight(secret, 7, '#ffb4e6');
    // Lume und der Falter
    const hx = S.x - cam,
      hy = sy(S.y);
    px.hero(g, hx, hy, S.dir, t, { look, walk: S.walk ? S.walk : null, light: 0.7 });
    const [bx, by] = Rpg.bfPath(hx - (S.dir === 'left' ? -12 : 12), hy - 30, t, 9);
    px.companion(g, bx, by, t, { col: th.companion, glow: 0.5 });
    // Zähler
    px.frame(g, 262, 4, 54, 15, 'dark');
    px.text(g, '◆', 268, 6, '#ffe58a');
    px.text(g, `${S.n}/${lights.length}`, 310, 6, '#f6f2ff', { al: 'right' });
    if (secret.got) px.text(g, '+1', 258, 6, '#ffb4e6', { al: 'right' });
    // Meldung oben
    if (S.notice) {
      if (t > S.notice.a + 2.4) S.notice = null;
      else px.notice(g, t, S.notice.s, S.notice.a, S.notice.a + 2.4, { y: 22 });
    }
    // Textbox
    const b = S.box;
    if (b) {
      const line = MX.line(b.text, b.t0 + 0.2, b.dur);
      px.textbox(g, t, {
        line,
        name: b.name,
        open: b.t0,
        th,
        keys: ['restlicht', 'quest', 'licht', 'speicher', 'portal', 'level'],
      });
    }
  };

  const frame = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    t += dt;
    step(dt);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#06060f';
    g.fillRect(0, 0, 320, 180);
    draw();
    raf = requestAnimationFrame(frame);
  };

  const reset = () => {
    lights.forEach((L) => (L.got = false));
    secret.got = false;
    Object.assign(S, {
      x: 14 * TS,
      y: 98,
      dir: 'right',
      walk: 0,
      cam: 0,
      n: 0,
      box: null,
      queue: [],
      notice: null,
      ended: false,
    });
    t = 0;
    say(T.intro, 'LUME', false);
    notice(T.hint);
  };
  reset();
  if (import.meta.env.DEV) W.__qgame = { S, lights, crystal, signs };

  return {
    key(name: string, down: boolean) {
      if (name === 'ok') {
        if (down) confirm();
        return;
      }
      if (down) keys.add(name);
      else keys.delete(name);
    },
    resume() {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    },
    pause() {
      running = false;
      keys.clear();
      cancelAnimationFrame(raf);
    },
    reset,
  };
}
