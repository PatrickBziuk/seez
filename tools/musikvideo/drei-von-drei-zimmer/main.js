// DREI VON DREI · LUME · "Ein Zimmer, drei Lampen"
// Jedes Bild folgt allein aus der Zeit: window.renderFrame(t) zeichnet den Zustand zur Sekunde t.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080);
const D = await (await fetch('data.json')).json();
const LINES = D.lines, BEATS = D.beats, END = 223.99, TOTAL = 229;
for (const L of LINES) { L.s = L.t[0][0]; L.e = Math.min(L.t[L.t.length - 1][1], END); }
const SEC = {};
for (const L of LINES) (SEC[L.sec] ||= []).push(L);

// ---------- kleine Helfer ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, f) => a + (b - a) * f;
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const rnd = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
function beatI(t) { let lo = 0, hi = BEATS.length; while (lo < hi) { const m = (lo + hi) >> 1; if (BEATS[m] <= t) lo = m + 1; else hi = m; } return lo - 1; }
function pulse(t, k = 6) { const i = beatI(t); return i < 0 ? 0 : Math.exp(-k * (t - BEATS[i])); }
function beatPhase(t) { const i = beatI(t); if (i < 0) return 0; if (i >= BEATS.length - 1) return i; return i + (t - BEATS[i]) / (BEATS[i + 1] - BEATS[i]); }
function wordT(L, frag) { for (let i = 0; i < L.words.length; i++) if (L.words[i].toLowerCase().includes(frag.toLowerCase())) return L.t[i][0]; return L.s; }
function curLine(t) { let k = null; for (const L of LINES) if (t >= L.s - 0.05) k = L; return k; }
function shown(L, t) { const out = []; for (let i = 0; i < L.words.length; i++) { if (t >= L.t[i][0]) out.push(L.words[i]); else break; } return out; }
function keyed(keys, t) { // [[t, v], ...] linear
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const f = (t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]); return lerp(keys[i - 1][1], keys[i][1], f); }
  return keys[keys.length - 1][1];
}
const S = n => SEC[n][0].s;

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0c1e, 0.018);
const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);

// ---------- Texturen aus dem Code ----------
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const woodTex = canvasTex(1024, 1024, (g, w, h) => {
  for (let i = 0; i < 12; i++) {
    const y = i * h / 12; const base = 70 + rnd() * 26;
    g.fillStyle = `rgb(${base + 38},${base + 8},${base - 18})`; g.fillRect(0, y, w, h / 12);
    for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(${40 + rnd() * 40},${20 + rnd() * 20},10,${0.05 + rnd() * 0.1})`; g.fillRect(rnd() * w, y + rnd() * h / 12, 60 + rnd() * 240, 1 + rnd() * 2); }
    g.fillStyle = 'rgba(20,10,5,.55)'; g.fillRect(0, y, w, 2);
    for (let k = 0; k < 3; k++) g.fillRect((hash(i * 7 + k) * w) | 0, y, 2, h / 12);
  }
});
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(2, 1.5);
const wallTex = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#5d5a86'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() > .5 ? 255 : 0},${rnd() > .5 ? 255 : 0},255,${rnd() * 0.035})`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2 + rnd() * 3); }
  g.strokeStyle = 'rgba(233,201,121,.16)'; g.lineWidth = 2;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { // kleine Falter und Sterne als Tapete
    const cx = x * 128 + (y % 2 ? 64 : 0) + 30, cy = y * 128 + 50;
    g.beginPath();
    if ((x + y) % 2) { g.moveTo(cx, cy); g.quadraticCurveTo(cx - 22, cy - 22, cx - 16, cy + 4); g.quadraticCurveTo(cx - 12, cy + 16, cx, cy); g.quadraticCurveTo(cx + 22, cy - 22, cx + 16, cy + 4); g.quadraticCurveTo(cx + 12, cy + 16, cx, cy); }
    else { for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; g.moveTo(cx - 9 * Math.cos(a), cy - 9 * Math.sin(a)); g.lineTo(cx + 9 * Math.cos(a), cy + 9 * Math.sin(a)); } }
    g.stroke();
  }
});
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(3, 1.4);
const rugTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#3d2f66'; g.fillRect(0, 0, w, h);
  for (let r = 240; r > 20; r -= 34) { g.strokeStyle = r % 68 ? '#e9c979' : '#9ad0f5'; g.globalAlpha = .55; g.lineWidth = 6; g.beginPath(); g.ellipse(256, 256, r, r, 0, 0, 7); g.stroke(); }
  g.globalAlpha = 1;
});
const glowTex = canvasTex(256, 256, (g, w) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(.25, 'rgba(255,200,110,.55)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
});
const loader = new THREE.TextureLoader();
const load = n => new Promise(res => loader.load(`tex/${n}.png`, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }));
const TEX = {};
for (const n of ['side', 'hold', 'face1', 'face2', 'face3', 'p0_0', 'p0_1', 'p1_0', 'prop2']) TEX[n] = await load(n);

// ---------- Raum ----------
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, ...o });
function box(w, h, d, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
  m.castShadow = o.cast !== false; m.receiveShadow = true; if (o.ry) m.rotation.y = o.ry; (o.parent || scene).add(m); return m;
}
const RW = 8, RD = 6.4, RH = 3.5, ZB = -3;       // Rückwand bei z = -3
const floor = box(RW + 6, .2, RD + 8, new THREE.MeshStandardMaterial({ map: woodTex, roughness: .55 }), 0, -.1, .8, { cast: false });
const wallM = new THREE.MeshStandardMaterial({ map: wallTex, roughness: .95 });
// Rückwand mit Fensteröffnung (x -0.9..0.7, y 1.05..2.55)
box(3.1 + 3, RH, .2, wallM, -4 - 3 + (3.1 + 3) / 2 + 0, RH / 2, ZB - .1);          // links vom Fenster
box(3.3 + 3, RH, .2, wallM, .7 + (3.3 + 3) / 2, RH / 2, ZB - .1);                  // rechts
box(1.6, 1.05, .2, wallM, -.1, .525, ZB - .1); box(1.6, RH - 2.55, .2, wallM, -.1, 2.55 + (RH - 2.55) / 2, ZB - .1);
box(.2, RH, RD + 6, wallM, -4.1, RH / 2, .2);                                       // linke Wand
box(.2, RH, RD + 6, wallM, 4.1, RH / 2, .2);                                        // rechte Wand
box(RW + 6, .2, RD + 8, M(0x2a2846), 0, RH + .1, .8, { cast: true });               // Decke (hält das Mondlicht draußen)
const frameM = M(0xe8dcc8, { roughness: .6 });
box(1.72, .08, .26, frameM, -.1, 1.02, ZB); box(1.72, .08, .26, frameM, -.1, 2.58, ZB);
box(.08, 1.6, .26, frameM, -.94, 1.8, ZB); box(.08, 1.6, .26, frameM, .74, 1.8, ZB); box(.05, 1.5, .1, frameM, -.1, 1.8, ZB); box(1.6, .05, .1, frameM, -.1, 1.8, ZB);
box(1.9, .06, .4, frameM, -.1, .99, ZB + .12);
const skyMat = new THREE.MeshBasicMaterial({ color: 0x0b1030, fog: false });
const sky = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), skyMat); sky.position.set(0, 3, ZB - 6); scene.add(sky);
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(.5, 32), new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false })); scene.add(sunDisc);
const rug = new THREE.Mesh(new THREE.CircleGeometry(1.7, 48), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(.4, .012, .3); rug.receiveShadow = true; scene.add(rug);
// Sockelleiste
box(RW, .12, .04, frameM, 0, .06, ZB + .02, { cast: false });

// --- Ecke 1: Schreibtisch (Arbeit) ---
const woodM = M(0x8a5a3a, { roughness: .6 }), darkM = M(0x23233a, { roughness: .5 });
box(1.9, .06, .8, woodM, -2.7, .78, -2.5); for (const dx of [-.88, .88]) box(.06, .78, .7, woodM, -2.7 + dx, .39, -2.5);
box(.9, .55, .04, darkM, -2.7, 1.3, -2.74); box(.08, .2, .08, darkM, -2.7, .92, -2.74); box(.34, .02, .2, darkM, -2.7, .82, -2.72);
const screenC = document.createElement('canvas'); screenC.width = 512; screenC.height = 300;
const screenTex = new THREE.CanvasTexture(screenC); screenTex.colorSpace = THREE.SRGBColorSpace;
const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
const screen = new THREE.Mesh(new THREE.PlaneGeometry(.84, .49), screenMat); screen.position.set(-2.7, 1.3, -2.715); scene.add(screen);
box(.5, .03, .18, M(0xd8d4e8), -2.7, .825, -2.35); box(.5, .5, .06, M(0x4a3f7a), -2.7, .75, -1.62); box(.5, .06, .5, M(0x4a3f7a), -2.7, .48, -1.85);
for (const [dx, dz] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) box(.05, .46, .05, darkM, -2.7 + dx, .23, -1.85 + dz);
const noteTex = TEX.p1_0.clone(); noteTex.repeat.set(1, .47); noteTex.offset.set(0, .53); noteTex.needsUpdate = true;
const note = new THREE.Mesh(new THREE.PlaneGeometry(.42, .3), new THREE.MeshStandardMaterial({ map: noteTex, transparent: true, alphaTest: .3, roughness: .9 }));
note.rotation.x = -Math.PI / 2; note.rotation.z = .3; note.position.set(-3.25, .815, -2.4); scene.add(note);
for (let i = 0; i < 5; i++) box(.1, .1, .003, M([0xffe27a, 0xff9ec4, 0x9ad0f5, 0xc6f0a0, 0xffe27a][i], { emissive: 0x332a10 }), -3.45 + i * .16 + hash(i) * .03, 1.7 + hash(i + 9) * .25, ZB + .005, { cast: false });
// --- Wandkalender ---
const calC = document.createElement('canvas'); calC.width = 384; calC.height = 512;
const calTex = new THREE.CanvasTexture(calC); calTex.colorSpace = THREE.SRGBColorSpace;
const cal = new THREE.Mesh(new THREE.PlaneGeometry(.66, .88), new THREE.MeshStandardMaterial({ map: calTex, roughness: .9, emissive: 0xffffff, emissiveMap: calTex, emissiveIntensity: .12 }));
cal.position.set(-1.42, 1.95, ZB + .012); scene.add(cal);
// --- Ecke 2: Tisch an der Tür (Freunde) ---
const TBL = new THREE.Vector3(-1.7, 0, 1.0);
const tbl = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .06, 40), woodM); tbl.position.set(TBL.x, .74, TBL.z); tbl.castShadow = tbl.receiveShadow = true; scene.add(tbl);
const leg = new THREE.Mesh(new THREE.CylinderGeometry(.07, .2, .72, 16), woodM); leg.position.set(TBL.x, .36, TBL.z); leg.castShadow = true; scene.add(leg);
const SEATS = [[-1.05, .1], [-.75, -.75], [.95, -.35], [.5, .85]].map(([dx, dz]) => new THREE.Vector3(TBL.x + dx, 0, TBL.z + dz));
for (const s of SEATS) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.2, .17, .46, 20), M(0x6a4a8a)); st.position.set(s.x, .23, s.z); st.castShadow = st.receiveShadow = true; scene.add(st); }
const cards = [];
for (let i = 0; i < 14; i++) { const c = box(.09, .004, .13, M([0xf6f1e4, 0xd9624f, 0x4f7fd0][i % 3], { roughness: .5 }), TBL.x + (hash(i) - .5) * .9, .775 + i * .0005, TBL.z + (hash(i + 20) - .5) * .8, { ry: hash(i + 40) * 3 }); cards.push(c); }
box(.06, 2.1, 1.0, M(0x7a5236, { roughness: .6 }), -3.98, 1.05, 1.0); box(.04, .06, .06, M(0xe9c979, { metalness: .8, roughness: .3 }), -3.93, 1.0, 1.38);
// --- Ecke 3: Bett und Regal (Ich) ---
box(1.7, .32, 2.3, M(0x6a4a3a), 3.05, .2, -1.75); box(1.62, .2, 2.2, M(0x9a90c0), 3.05, .46, -1.75);
box(1.64, .1, 1.3, M(0x8f7fd0), 3.05, .56, -1.3); box(.9, .14, .45, M(0xb8b0d8), 3.05, .6, -2.6); box(1.7, .9, .1, M(0x6a4a3a), 3.05, .6, -2.93);
box(1.0, 2.0, .34, woodM, 1.55, 1.0, -2.8);
for (let r = 0; r < 4; r++) { box(.92, .03, .36, M(0x6e4528), 1.55, .32 + r * .46, -2.78);
  let x = 1.13; while (x < 1.95) { const w = .03 + hash(x * 31 + r) * .05, h = .26 + hash(x * 17 + r) * .14; box(w, h, .22, M(new THREE.Color().setHSL(.55 + hash(x * 5 + r) * .35, .35, .45 + hash(x + r) * .2)), x + w / 2, .34 + r * .46 + h / 2, -2.74); x += w + .006; } }
const console3d = new THREE.Mesh(new THREE.PlaneGeometry(.5, .17), new THREE.MeshStandardMaterial({ map: TEX.p0_1, transparent: true, alphaTest: .3, emissive: 0xffffff, emissiveMap: TEX.p0_1, emissiveIntensity: .25 }));
console3d.rotation.x = -Math.PI / 2; console3d.rotation.z = -.4; console3d.position.set(2.7, .62, -1.1); scene.add(console3d);
// Pflanze, Lichterkette
box(.26, .3, .26, M(0xc9744a), .95, .15, -2.6); for (let i = 0; i < 7; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 10), M(0x3f8a5a)); lf.scale.set(.5, 1.5, .5); lf.position.set(.95 + Math.sin(i * 2.4) * .14, .62 + hash(i) * .25, -2.6 + Math.cos(i * 2.4) * .14); lf.rotation.z = Math.sin(i * 2.4) * .5; lf.castShadow = true; scene.add(lf); }
const fairy = [];
for (let i = 0; i < 26; i++) { const f = i / 25; const m = new THREE.Mesh(new THREE.SphereGeometry(.028, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd58a })); m.position.set(lerp(.9, 3.95, f), 3.05 - Math.sin(f * Math.PI * 3) ** 2 * .22, ZB + .06); scene.add(m); fairy.push(m); }
// Stapel verschweißter Spiele
const GAMES = [];
const gcol = [0x9bbc0f, 0xf2c14e, 0x4c7c2c, 0xe8c547, 0xf08a24, 0x6daa2c, 0x6b9be8, 0x00c060, 0xc8a250, 0xc8b48a, 0xffffff, 0x7ba4ff, 0xd9b8ef, 0xff60a0];
for (let i = 0; i < 46; i++) {
  const col = i % 2, lvl = (i / 2) | 0;
  const g = box(.3, .045, .22, new THREE.MeshStandardMaterial({ color: gcol[i % gcol.length], roughness: .12, metalness: .05 }), 1.5 + col * .42 + (hash(i) - .5) * .05, .0225 + lvl * .046, -1.95 + (hash(i + 3) - .5) * .05, { ry: (hash(i + 7) - .5) * .5 });
  g.userData.y = g.position.y; g.visible = false; GAMES.push(g);
}
// Zettel-Liste über dem Bett
const POST = [];
function postit(txt, col, i) {
  const t = canvasTex(256, 256, (g) => { g.fillStyle = col; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 0, 256, 36); g.fillStyle = '#2a2140'; g.font = 'italic 700 40px "Liberation Serif", serif'; g.textAlign = 'center';
    const ws = txt.split(' '); ws.forEach((w, k) => g.fillText(w, 128, 140 + (k - (ws.length - 1) / 2) * 46)); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.42, .42), new THREE.MeshStandardMaterial({ map: t, roughness: .9, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .18 }));
  m.position.set(2.45 + (i % 3) * .48, 2.35 - ((i / 3) | 0) * .5, ZB + .01); m.rotation.z = (hash(i + 2) - .5) * .16; m.visible = false; scene.add(m); POST.push(m);
}
[['Zeit für mich', '#d9b8ef'], ['Wäsche machen', '#ffe27a'], ['einkaufen', '#ffe27a'], ['ordentlich sein', '#ffe27a'], ['Nichtstun', '#c6f0a0'], ['Liste', '#9ad0f5']].forEach(([s, c], i) => postit(s, c, i));

// ---------- Licht ----------
const hemi = new THREE.HemisphereLight(0x8fa8ff, 0x2a1f3a, .25); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 6, bottom: -4, near: 1, far: 30 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .03; scene.add(sun); scene.add(sun.target);
const LAMP = [new THREE.Vector3(-2.7, 2.35, -2.0), new THREE.Vector3(-1.7, 2.35, 1.0), new THREE.Vector3(3.0, 2.35, -1.6)];
const LABEL = ['ARBEIT', 'FREUNDE', 'ZEIT FÜR MICH'];
const lamps = LAMP.map((p, i) => {
  const sp = new THREE.SpotLight(0xffc98a, 0, 9, .95, .75, 1.3); sp.position.copy(p); sp.target.position.set(p.x, 0, p.z); sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); sp.shadow.bias = -.001; scene.add(sp); scene.add(sp.target);
  const cord = box(.012, RH - p.y - .2, .012, darkM, p.x, (RH + p.y + .2) / 2, p.z, { cast: false });
  const bulbM = new THREE.MeshBasicMaterial({ map: TEX.p0_0, transparent: true, alphaTest: .2, toneMapped: false });
  const bulb = new THREE.Mesh(new THREE.PlaneGeometry(.42, .575), bulbM); bulb.position.set(p.x, p.y, p.z); scene.add(bulb);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); glow.position.set(p.x, p.y - .12, p.z + .02); scene.add(glow);
  const lt = canvasTex(1024, 256, (g) => { g.fillStyle = '#fff'; g.font = '800 150px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(LABEL[i], 512, 132, 980); });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .475), new THREE.MeshBasicMaterial({ map: lt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffd9a0, opacity: 0 }));
  lab.rotation.x = -Math.PI / 2; lab.position.set(p.x + (i === 0 ? .25 : i === 2 ? -.6 : .3), .02, p.z + (i === 1 ? 1.25 : 1.75)); scene.add(lab);
  return { sp, bulb, bulbM, glow, lab };
});
// Nachtlicht für die Ecke, die ruhen darf
const nl = new THREE.Mesh(new THREE.PlaneGeometry(.34, .4), new THREE.MeshBasicMaterial({ map: TEX.prop2, transparent: true, alphaTest: .2, toneMapped: false })); nl.visible = false; scene.add(nl);
const nlLight = new THREE.PointLight(0xffc070, 0, 4, 1.6); scene.add(nlLight);
const nlGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); scene.add(nlGlow);

// ---------- LUME: Ausschnitte aus den Figurenblättern ----------
const POSES = {};
function cutMat(tex) {
  return new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: .35, roughness: .9, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .24 });
}
const lume = new THREE.Group(); scene.add(lume);
for (const [n, hgt] of [['side', 1.66], ['hold', 1.66]]) {
  const t = TEX[n], asp = t.image.width / t.image.height;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(hgt * asp, hgt), cutMat(t)); m.position.y = hgt / 2; m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: .35 });
  m.customDistanceMaterial = new THREE.MeshDistanceMaterial({ map: t, alphaTest: .35 });
  lume.add(m); POSES[n] = m;
}
const FACES = {};
for (const n of ['face1', 'face2', 'face3']) { const t = TEX[n], asp = t.image.width / t.image.height; const m = new THREE.Mesh(new THREE.PlaneGeometry(.95 * asp, .95), cutMat(t)); m.position.y = 1.3; m.visible = false; lume.add(m); FACES[n] = m; }
const amu = new THREE.PointLight(0xffc070, 1.2, 5, 1.6); amu.position.set(0, 1.12, .35); lume.add(amu);
const amuGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); amuGlow.position.set(0, 1.19, .06); lume.add(amuGlow);

// Freunde als Papierfiguren aus dem Code
const FRIENDS = [0xb8574a, 0x4f8f6a, 0xc98f3a].map((col, i) => {
  const t = canvasTex(256, 512, (g) => {
    const c = '#' + col.toString(16).padStart(6, '0');
    const draw = (grow, fill) => { g.fillStyle = fill;
      g.beginPath(); g.roundRect(44 - grow, 196 - grow, 168 + 2 * grow, 330, 78); g.fill();
      g.beginPath(); g.arc(128, 116, 62 + grow, 0, 7); g.fill();
      if (i === 0) { g.beginPath(); g.roundRect(58 - grow, 70, 140 + 2 * grow, 190, 60); g.fill(); }
      if (i === 1) { g.beginPath(); g.arc(128, 48, 30 + grow, 0, 7); g.fill(); }
      if (i === 2) { g.beginPath(); g.arc(128, 96, 70 + grow, Math.PI, 0); g.fill(); } };
    draw(8, '#f3e6d0'); draw(0, c);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.roundRect(44, 330, 168, 200, 0); g.fill();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.75, 1.5), cutMat(t)); m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: .35 });
  m.material.emissiveIntensity = .06; m.visible = false; scene.add(m); return m;
});

// Staub im Licht
const dustN = 500, dustP = new Float32Array(dustN * 3), dustS = [];
for (let i = 0; i < dustN; i++) dustS.push([rnd() * 8 - 4, rnd() * 3.2, rnd() * 6 - 2.8, rnd() * 6.28, .2 + rnd() * .5]);
const dustG = new THREE.BufferGeometry(); dustG.setAttribute('position', new THREE.BufferAttribute(dustP, 3));
const dustM = new THREE.PointsMaterial({ color: 0xffe9c0, size: .022, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false });
scene.add(new THREE.Points(dustG, dustM));

// ---------- Songtext als Lichtschrift auf der Wand ----------
const txtC = document.createElement('canvas'); txtC.width = 2048; txtC.height = 512;
const txtTex = new THREE.CanvasTexture(txtC); txtTex.colorSpace = THREE.SRGBColorSpace; txtTex.anisotropy = 8;
const txtMat = new THREE.MeshBasicMaterial({ map: txtTex, transparent: true, depthWrite: false, toneMapped: false, fog: false });
const txt = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), txtMat); txt.renderOrder = 5; scene.add(txt);
let lastTxt = '';
function drawText(L, t) {
  const words = L ? shown(L, t) : [];
  const fade = L ? clamp(1 - (t - L.e - 1.4) / .5) : 0;
  const key = (L ? L.text : '') + '|' + words.length + '|' + fade.toFixed(2);
  if (key === lastTxt) return; lastTxt = key;
  const g = txtC.getContext('2d'); g.clearRect(0, 0, 2048, 512);
  if (!L || fade <= 0) { txtTex.needsUpdate = true; return; }
  g.font = 'italic 700 132px "Liberation Serif", "DejaVu Serif", serif'; g.textBaseline = 'middle';
  const all = L.text.replace(' – ', ' – ').split(' ');
  const lines = [[]]; let wsum = 0;
  for (const w of all) { const ww = g.measureText(w + ' ').width; if (wsum + ww > 1940 && lines[lines.length - 1].length) { lines.push([]); wsum = 0; } lines[lines.length - 1].push(w); wsum += ww; }
  const nShown = shown(L, t).join(' ').length;
  let count = 0;
  lines.forEach((ln, i) => {
    const full = ln.join(' '); const x0 = 1024 - g.measureText(full).width / 2; const y = 256 + (i - (lines.length - 1) / 2) * 150;
    const part = full.slice(0, Math.max(0, nShown - count)); count += full.length + 1;
    if (!part) return;
    g.globalAlpha = fade; g.shadowColor = 'rgba(255,170,70,.95)'; g.shadowBlur = 34; g.fillStyle = '#ffe9bf'; g.fillText(part, x0, y);
    g.shadowBlur = 0; g.fillStyle = '#fffaf0'; g.fillText(part, x0, y);
  });
  txtTex.needsUpdate = true;
}

// ---------- Drehbuch ----------
const T = { v1a: S('v1a'), v1b: S('v1b'), pre1: S('pre1'), h1: S('hook1'), v2a: S('v2a'), v2b: S('v2b'), pre2: S('pre2'), h2: S('hook2'), v3a: S('v3a'), v3b: S('v3b'), br: S('bridge'), h3: S('hook3'), out: S('outro') };
const BL = wordT(SEC.bridge[1], 'passen');           // die Sicherung fliegt
const REST = SEC.hook3[5].s;                          // "darf auch mal etwas ... ruh'n"
// Tageszeit: 0 Mitternacht, .25 Sonnenaufgang, .5 Mittag, .75 Sonnenuntergang
const DAY = [[0, .6], [10.6, .66], [T.v1a, .7], [T.v1b, 3.2], [T.pre1 - .5, 5.72], [T.h1, 5.88], [71, 5.98], [T.v2a, 6.72], [T.v2b - .5, 6.8], [T.v2b + 2, 6.9], [T.pre2, 7.0],
  [T.v3a - 1, 7.05], [T.v3a, 7.34], [T.v3b, 7.6], [T.br, 7.86], [T.h3, 7.95], [196, 8.05], [205, 8.22], [T.out, 8.7], [TOTAL, 8.79]];
// Kamera: [Zeit, Ort A, Ziel A, Ort B, Ziel B, Brennweite]
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SHOTS = [
  [0, V(.2, 2.3, 9.4), V(0, 1.45, -1), V(.5, 2.2, 8.2), V(0, 1.4, -1), 34],
  [10.6, V(.5, 2.2, 8.2), V(0, 1.4, -1), V(.6, 1.6, 1.3), V(-2.75, 1.3, -1.7), 34],
  [T.v1a - .1, V(.6, 1.6, 1.3), V(-2.75, 1.3, -1.7), V(.1, 1.55, .7), V(-2.75, 1.3, -1.7), 34],
  [T.v1b - .05, V(.0, 1.1, 1.6), V(1.9, .95, -2.2), V(.5, 1.5, 2.6), V(2.0, 1.2, -2.2), 34],
  [T.pre1 - .08, V(.4, 2.3, 7.8), V(0, 1.65, -1), V(.4, 2.3, 7.4), V(0, 1.65, -1), 36],
  [T.h1 - .1, V(-1.2, 2.5, 7.6), V(0, 1.55, -1), V(1.6, 2.3, 7.2), V(0, 1.55, -1), 36],
  [71.2, V(1.6, 2.3, 7.2), V(0, 1.55, -1), V(1.4, 1.7, 5.6), V(-1.8, 1.4, .6), 34],
  [T.v2a - .1, V(1.4, 1.7, 5.6), V(-1.8, 1.4, .6), V(1.0, 1.6, 5.0), V(-1.9, 1.4, .6), 34],
  [SEC.v2a[1].s - .05, V(.6, 1.9, 3.4), V(-1.5, 1.75, -3), V(.3, 1.9, 2.4), V(-1.5, 1.8, -3), 34],
  [T.v2b - .1, V(1.2, 1.5, 4.8), V(-1.8, 1.35, .8), V(.6, 1.45, 4.4), V(-1.8, 1.35, .8), 34],
  [T.pre2 - .05, V(.4, 2.7, 7.8), V(0, 1.5, -.8), V(.4, 2.6, 7.4), V(0, 1.5, -.8), 36],
  [T.h2 - .1, V(1.8, 2.4, 7.6), V(0, 1.55, -1), V(-1.4, 2.3, 7.2), V(0, 1.55, -1), 36],
  [T.v3a - .08, V(.4, 1.7, 4.4), V(2.5, 1.5, -2.4), V(.9, 1.7, 3.8), V(2.6, 1.5, -2.4), 34],
  [T.v3b - .3, V(.4, 1.9, 7.4), V(.2, 1.55, -1), V(.4, 1.8, 6.6), V(.2, 1.55, -1), 36],
  [T.br - .05, V(.5, 1.8, 6.6), V(.3, 1.55, -1), V(.4, 1.7, 5.4), V(.3, 1.5, -1), 36],
  [BL, V(.3, 1.42, 3.3), V(.3, 1.36, .2), V(.3, 1.4, 2.7), V(.3, 1.34, .2), 30],
  [T.h3 - .12, V(-1.4, 2.4, 7.6), V(0, 1.55, -1), V(1.4, 2.3, 7.0), V(0, 1.55, -1), 36],
  [196.4, V(1.4, 2.3, 7.0), V(0, 1.55, -1), V(.4, 2.6, 9.6), V(0, 1.4, -1), 34],
  [T.out - .5, V(.6, 1.5, 4.2), V(2.6, 1.15, -1.6), V(.9, 1.5, 3.7), V(2.6, 1.15, -1.6), 34],
];
// Wo die Lichtschrift steht: [ab Zeit, Ort, Drehung y, Breite]
const BACK = (x, y, w) => [V(x, y, ZB + .03), 0, w], LEFT = (z, y, w) => [V(-3.97, y, z), Math.PI / 2, w];
const TEXTS = [[0, ...BACK(0, 2.86, 6.2)], [T.v1a - .1, ...LEFT(-1.1, 2.5, 2.6)], [T.v1b - .05, ...BACK(2.8, 1.8, 2.9)], [T.pre1 - .08, ...BACK(0, 2.86, 6.2)], [T.h1 - .1, ...BACK(0, 2.86, 6.2)],
  [T.v2a - .1, ...LEFT(.6, 2.35, 3.2)], [SEC.v2a[1].s - .05, ...BACK(-1.4, 2.85, 3.0)], [T.v2b - .1, ...LEFT(.6, 2.3, 3.2)], [T.pre2 - .05, ...BACK(0, 2.86, 6.2)],
  [T.v3a - .08, ...BACK(2.6, 2.95, 3.0)], [T.v3b - .3, ...BACK(.2, 2.86, 5.6)], [BL, V(.3, 1.95, .1), 0, 1.5],
  [T.h3 - .12, ...BACK(0, 2.86, 6.2)], [T.out - .5, ...BACK(2.75, 2.84, 2.6)]];
// LUMEs Weg: [Ankunftszeit, x, z, Pose]
const P = { desk: [-2.7, -1.25], table: [-.7, 1.75], bed: [2.55, -.35], mid: [.3, .2], tower: [1.1, -1.2] };
const WAY = [[0, ...P.mid, 'hold'], [17.5, -2.1, -.6, 'hold'], [20.2, ...P.desk, 'desk'], [T.pre1 + 1.2, -1.9, -.9, 'hold']];
function hookWalk(sec, calmFrom) {
  const ls = SEC[sec]; const b0 = Math.round(beatPhase(ls[0].s));
  for (let b = 0; b < 52; b += 4) {
    const bi = b0 + b; if (bi >= BEATS.length) break; const tt = BEATS[bi]; if (tt > ls[7].e + 1) break;
    if (calmFrom && tt > calmFrom) break;
    const st = starvedAt(sec, tt + .1); const lit = [0, 1, 2].filter(i => i !== st); const go = lit[(b / 4) % 2];
    WAY.push([tt + 1.3, ...[P.desk, P.table, P.bed][go].map((v, i) => v * .72 + [.2, .5][i] * .28), 'hold']);
  }
}
function starvedAt(sec, t) { const b = Math.floor(beatPhase(t) - beatPhase(SEC[sec][0].s)); return ((Math.floor(b / 4) % 3) + 3) % 3; }
hookWalk('hook1'); WAY.push([73.5, ...P.mid, 'hold'], [T.v2a + .2, ...P.table, 'hold'], [SEC.v2a[1].s + 1.2, -1.2, -1.9, 'hold'], [T.v2b - .3, ...P.table, 'hold'], [T.pre2 + 1.5, ...P.mid, 'hold']);
hookWalk('hook2'); WAY.push([T.v3a - .2, ...P.bed, 'hold'], [wordT(SEC.v3a[1], 'Wäsche') + .8, 1.9, .4, 'hold'], [SEC.v3a[2].s + .6, ...P.tower, 'hold'], [SEC.v3a[3].s + 1.4, 2.3, -.5, 'hold'],
  [T.v3b + .4, ...P.mid, 'hold'], [T.br, ...P.mid, 'hold'], [T.h3 - .1, ...P.mid, 'hold']);
hookWalk('hook3', REST - 1.6); WAY.push([REST + 1.4, 2.3, .1, 'hold'], [197, ...P.mid, 'hold'], [T.out - .6, ...P.bed, 'hold'], [TOTAL, ...P.bed, 'hold']);
WAY.sort((a, b) => a[0] - b[0]);

function lampState(t) {
  let a = [0, 0, 0];
  const hook = (sec) => { const st = starvedAt(sec, t), prev = starvedAt(sec, t - .35); return [0, 1, 2].map(i => i === st ? (prev === st ? 0 : 1 - ease((t % 1e9 - (t - .35)) / .35)) : 1).map((v, i) => (i === st ? 0 : 1)); };
  const smooth = (sec) => { const cur = [0, 1, 2].map(i => i === starvedAt(sec, t) ? 0 : 1), old = [0, 1, 2].map(i => i === starvedAt(sec, t - .4) ? 0 : 1); let f = 1; const b = beatPhase(t) - beatPhase(SEC[sec][0].s); f = ease((b - Math.floor(b / 4) * 4) / .7); return cur.map((c, i) => lerp(old[i], c, f)); };
  if (t < 10.6) a = [0, 0, 0];
  else if (t < T.v1b) a = [ease((t - 18.5) / 1.5), 0, 0];
  else if (t < T.pre1) a = [1, 0, .4];
  else if (t < T.h1) a = [1, 0, 0];
  else if (t < 71.2) { a = smooth('hook1'); const L1 = SEC.hook1[1]; if (t < L1.s + 2.5) a = [t >= wordT(L1, 'Arbeit') ? 1 : (t < L1.s ? 1 : 0), t >= wordT(L1, 'Freunde') ? a[1] : 0, t >= wordT(L1, 'Zeit') ? a[2] : 0]; if (t < L1.s) a = [1, 0, 0]; }
  else if (t < T.v2a) a = [0, ease((t - 76) / 3), 1 - ease((t - 75) / 3)];
  else if (t < SEC.v2a[1].s) a = [0, 1, 0];
  else if (t < T.v2b) a = [0, .35, 0];
  else if (t < T.pre2) a = [0, lerp(1.25, .45, ease((t - wordT(SEC.v2b[1], 'los')) / 7)), 0];
  else if (t < T.h2) a = [.3, .3, .3];
  else if (t < T.v3a - .1) a = smooth('hook2');
  else if (t < T.v3b) a = [0, 0, .5];
  else if (t < T.br) { const l = SEC.v3b; a = [0, 0, 1]; if (t >= wordT(l[0], 'ab')) a = [0, 0, 1]; if (t >= l[1].s) a = [0, 1, 0]; if (t >= wordT(l[1], 'Ruhe')) a = [0, 1, .15]; if (t >= l[2].s) a = [.6, .6, .6]; if (t >= wordT(l[2], 'Energie')) { const fl = .22 + .1 * Math.sin(t * 31) * Math.sin(t * 7); a = [fl, fl, fl]; } }
  else if (t < BL) { const l = SEC.bridge[0]; a = [t >= wordT(l, 'erfolgreich') ? 1.5 : .2, t >= wordT(l, 'gesellig') ? 1.5 : .2, t >= wordT(l, 'achte') ? 1.5 : .2]; if (t > SEC.bridge[1].s) { const f = 1.5 + (t - SEC.bridge[1].s) * .5 + .3 * Math.sin(t * 40); a = [f, f, f]; } }
  else if (t < T.h3 - .12) a = [0, 0, 0];
  else if (t < REST) { a = smooth('hook3'); if (t < T.h3 + 1.2) a = a.map(v => v * ease((t - T.h3 + .12) / 1.2)); }
  else if (t < T.out - .5) { const f = ease((t - REST) / 1.2); const s = smooth('hook3'); a = [lerp(s[0], 1, f), lerp(s[1], 1, f), lerp(s[2], 0, f)]; const g = 1 - .75 * ease((t - 197) / 8); a = a.map(v => v * g); }
  else a = [0, 0, .55];
  return a;
}
function friendsState(t) { // je Freund: Sichtbarkeit 0..1 und Versatz zur Tür
  const out = [0, 1, 2].map(() => ({ v: 0, d: 0, laugh: 0 }));
  const a = SEC.v2a, b = SEC.v2b;
  if (t >= wordT(a[0], 'irgendwer') - .2 && t < a[1].s + 1.2) out.forEach((o, i) => { o.v = ease((t - wordT(a[0], 'irgendwer') + .2 - i * .12) / .35) * (1 - ease((t - a[1].s - i * .2) / .8)); });
  if (t >= T.v2b - 2.2 && t < T.pre2 + 2) {
    const leave = [wordT(b[1], 'los') + .1, wordT(b[2], 'früh') + .1, b[3].s + .5];
    out.forEach((o, i) => { o.v = ease((t - (T.v2b - 2.2) - i * .3) / .6); o.d = ease((t - leave[i]) / 1.6); if (o.d >= 1) o.v = 0; o.laugh = (t >= wordT(b[0], 'lachen') && t < b[1].s) ? 1 : 0; });
  }
  return out;
}

// ---------- Nachbearbeitung ----------
const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .55, .7, .82); composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uFade: { value: 1 }, uFlash: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uT,uFade,uFlash; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233))+uT*7.13)*43758.5453); }
    void main(){ vec2 d=vUv-.5; float r=dot(d,d);
      vec3 c=vec3(texture2D(tDiffuse,vUv+d*r*.006).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-d*r*.006).b);
      c*=smoothstep(.95,.18,r*1.9); c+= (h(vUv*vec2(1920.,1080.))-.5)*.035; c=mix(c,vec3(1.),uFlash); gl_FragColor=vec4(c*uFade,1.); }`,
});
composer.addPass(grade); composer.addPass(new OutputPass());

// ---------- ein Bild ----------
const cA = new THREE.Color(), cB = new THREE.Color();
function drawScreen(t) {
  const g = screenC.getContext('2d'); g.fillStyle = '#10182c'; g.fillRect(0, 0, 512, 300);
  g.fillStyle = '#1e2a4a'; g.fillRect(0, 0, 512, 34); g.fillStyle = '#9ad0f5'; g.font = '700 20px Inter, sans-serif'; g.fillText('SeezMail', 12, 24);
  const n = 3 + Math.floor(clamp((t - T.v1a) / 22) * 60); g.fillStyle = '#ff7a6a'; g.fillText(n + ' ungelesen', 370, 24);
  for (let i = 0; i < 7; i++) { g.fillStyle = i === ((beatI(t) % 7) + 7) % 7 ? '#2f4170' : '#18223c'; g.fillRect(10, 44 + i * 36, 492, 30); g.fillStyle = '#cdd7f8'; g.fillRect(22, 54 + i * 36, 60 + hash(i + Math.floor(t)) * 90, 9); g.fillStyle = '#6a7aa8'; g.fillRect(180, 54 + i * 36, 120 + hash(i * 3 + Math.floor(t)) * 170, 9); }
  screenTex.needsUpdate = true;
}
let lastCal = '';
function drawCal(t) {
  let head = 'MO', sub = 'Woche 12', mark = -1, cross = false;
  if (t >= T.v1a && t < T.pre1) { const d = Math.floor(keyed(DAY, t) - .25 + .5) % 7; head = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'][clamp(d, 0, 6)]; }
  else if (t >= T.pre1 && t < T.v2a) head = 'FR';
  else if (t >= T.v2a && t < T.v2b) { const l = SEC.v2a; const m = Math.floor(clamp((t - wordT(l[1], 'nächste')) / 1.2) * 6); head = ['MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP'][m]; sub = m ? '+' + m + ' Monate' : 'Spieleabend?'; if (t >= l[2].s) { mark = t >= wordT(l[2], 'sieben') ? 3 : t >= wordT(l[2], 'samstags') ? 2 : 1; cross = t >= wordT(l[2], 'raus'); } }
  else if (t >= T.v2b && t < T.v3a) head = 'SA';
  else if (t >= T.v3a) { head = 'SO'; sub = 'Zeit für mich'; }
  const key = head + sub + mark + cross; if (key === lastCal) return; lastCal = key;
  const g = calC.getContext('2d'); g.fillStyle = '#f6f1e4'; g.fillRect(0, 0, 384, 512); g.fillStyle = '#b8483c'; g.fillRect(0, 0, 384, 70);
  g.fillStyle = '#2a2140'; g.textAlign = 'center'; g.font = '800 150px Inter, sans-serif'; g.fillText(head, 192, 230); g.font = '600 34px Inter, sans-serif'; g.fillText(sub, 192, 290);
  for (let i = 0; i < 21; i++) { const x = 30 + (i % 7) * 47, y = 330 + Math.floor(i / 7) * 54; g.strokeStyle = '#c8bfa8'; g.lineWidth = 2; g.strokeRect(x, y, 42, 48);
    if (mark > 0 && i >= 11 && i < 11 + mark) { g.fillStyle = ['#d9624f', '#9ad0f5', '#8a8a99'][i - 11]; g.beginPath(); g.arc(x + 21, y + 24, 15, 0, 7); g.fill(); if (cross) { g.strokeStyle = '#b02020'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 4, y + 4); g.lineTo(x + 38, y + 44); g.stroke(); } } }
  calTex.needsUpdate = true;
}

function update(t) {
  // Kamera
  let si = 0; while (si < SHOTS.length - 1 && SHOTS[si + 1][0] <= t) si++;
  const sh = SHOTS[si], t1 = si < SHOTS.length - 1 ? SHOTS[si + 1][0] : TOTAL; const cf = clamp((t - sh[0]) / (t1 - sh[0])); const ce = (si === 1 || si === 6) ? ease(cf) : cf;
  camera.position.lerpVectors(sh[1], sh[3], ce); camera.position.y += Math.sin(t * .5) * .012; camera.position.x += Math.sin(t * .37) * .015;
  const tg = cA; const tv = new THREE.Vector3().lerpVectors(sh[2], sh[4], ce); camera.fov = sh[5]; camera.updateProjectionMatrix(); camera.lookAt(tv);
  // Tageszeit und Fensterlicht
  const p = keyed(DAY, t); const ang = (p - .25) * Math.PI * 2; const elev = Math.sin(ang), az = Math.cos(ang);
  const dayF = clamp(elev * 3 + .15), goldF = clamp(1 - Math.abs(elev) * 2.6);
  const sx = az * 5.5, sy = 1.9 + Math.max(elev, -.1) * 5.5;
  if (elev > -.08) { sun.position.set(-.1 + sx, sy, ZB - 6); sun.color.copy(cA.set(0xff8a3c).lerp(cB.set(0xfff4e0), clamp(elev * 1.6))); sun.intensity = clamp(elev * 4 + .35) * 3.2; }
  else { sun.position.set(2.4, 5.2, ZB - 6); sun.color.set(0x8fa8ff); sun.intensity = .32; }
  sun.target.position.set(-.1 - (sun.position.x + .1) * .45, .2, 1.2);
  sunDisc.position.set(sun.position.x * 1.05, sun.position.y + .3, ZB - 5.9); sunDisc.material.color.copy(elev > -.08 ? cA.set(0xffd9a0).lerp(cB.set(0xffffff), clamp(elev)) : cA.set(0xd8e0ff)); sunDisc.scale.setScalar(elev > -.08 ? 1 : .6);
  cA.set(0x070a22).lerp(cB.set(0x86bdf5), dayF); cA.lerp(cB.set(0xff8a50), goldF * .75 * clamp(dayF * 4 + .3)); skyMat.color.copy(cA);
  hemi.intensity = .42 + dayF * 1.5; hemi.color.copy(cA.set(0x6a7cff).lerp(cB.set(0xfff0e0), dayF));
  scene.fog.color.copy(cA.set(0x070818).lerp(cB.set(0x3a3550), dayF));
  // Lampen
  const a = lampState(t); const inHook = (t >= T.h1 && t < 72) || (t >= T.h2 && t < T.v3a - .1) || (t >= T.h3 && t < 205);
  lamps.forEach((l, i) => {
    const v = Math.max(0, a[i]); l.sp.intensity = v * 36 * (1 + .04 * Math.sin(t * 23 + i)); l.bulbM.color.setScalar(.22 + v * 1.5); l.glow.scale.setScalar(.01 + v * 1.25); l.glow.material.opacity = clamp(v);
    l.bulb.lookAt(camera.position.x, l.bulb.position.y, camera.position.z); l.bulb.rotateZ(Math.sin(t * .9 + i * 2) * .035);
    let lv = 0; if (inHook) { const sec = t < 72 ? 'hook1' : t < T.h3 ? 'hook2' : 'hook3'; const L1 = SEC[sec][1]; lv = t >= wordT(L1, ['Arbeit', 'Freunde', 'Zeit'][i]) ? (.18 + .82 * clamp(v)) : 0; if (sec === 'hook3' && i === 2 && t > REST) lv = .5; }
    l.lab.material.opacity = lv;
  });
  // Nachtlicht in der dritten Ecke
  const nf = ease((t - REST - 1.4) / 1.0) * (t < T.out - .5 ? 1 : 1);
  nl.visible = nf > 0; nl.position.set(2.05, .2 + .0, .2); nl.lookAt(camera.position.x, .2, camera.position.z); nlLight.position.set(2.05, .45, .3); nlLight.intensity = nf * 2.2 * (1 + .05 * Math.sin(t * 3)); nlGlow.position.set(2.05, .28, .25); nlGlow.material.opacity = nf * .9; nlGlow.scale.setScalar(.9);
  // Lichterkette und Staub
  fairy.forEach((f, i) => f.material.color.setScalar(.25 + .75 * clamp(1 - dayF * 1.2) * (.7 + .3 * Math.sin(t * 2 + i))).multiply(cA.set(0xffd58a)));
  for (let i = 0; i < dustN; i++) { const s = dustS[i]; dustP[i * 3] = s[0] + Math.sin(t * .11 * s[4] + s[3]) * .5; dustP[i * 3 + 1] = (s[1] + t * .02 * s[4]) % 3.2; dustP[i * 3 + 2] = s[2] + Math.cos(t * .09 * s[4] + s[3]) * .5; }
  dustG.attributes.position.needsUpdate = true; dustM.opacity = .12 + .45 * dayF;
  // LUME
  let i = 0; while (i < WAY.length - 1 && WAY[i + 1][0] <= t) i++;
  const cur = WAY[i], nxt = WAY[Math.min(i + 1, WAY.length - 1)];
  const dist = Math.hypot(nxt[1] - cur[1], nxt[2] - cur[2]); const dur = Math.min(nxt[0] - cur[0], Math.max(.9, dist / 1.5));
  const f = dist > .05 ? ease((t - (nxt[0] - dur)) / dur) : 0; const moving = f > 0 && f < 1;
  const x = lerp(cur[1], nxt[1], f), z = lerp(cur[2], nxt[2], f);
  let pose = moving ? 'side' : (f >= 1 ? nxt[3] : cur[3]); const atDesk = pose === 'desk'; if (atDesk) pose = 'side';
  const black = t >= BL && t < T.h3 - .12;
  const sc = t < 6.8 ? .56 : lerp(.56, 1, ease((t - 6.8) / 1.5));
  lume.position.set(x, 0, z); lume.scale.setScalar(sc);
  lume.rotation.y = atDesk ? .96 : Math.atan2(camera.position.x - x, camera.position.z - z) * .85;
  for (const n in POSES) { POSES[n].visible = n === pose && !black; }
  POSES.side.scale.x = 1; POSES.side.position.y = .83; POSES.side.rotation.z = atDesk ? Math.sin(t * 11) * .004 : 0;
  if (moving) { POSES.side.scale.x = (nxt[1] - cur[1]) < 0 ? -1 : 1; POSES.side.position.y = .83 + Math.abs(Math.sin(t * 9)) * .035; POSES.side.rotation.z = Math.sin(t * 9) * .025; }
  const br = 1 + Math.sin(t * 1.7) * .006 + pulse(t, 8) * .012;
  for (const n of ['hold']) { POSES[n].scale.set(1, br, 1); POSES[n].position.y = .83 * br; POSES[n].rotation.z = Math.sin(t * .8) * .008 + (pose === 'back' && t < T.pre1 ? Math.sin(t * 11) * .004 : 0); }
  for (const n in FACES) FACES[n].visible = false;
  if (black) { const fn = t < SEC.bridge[2].s ? 'face1' : t < wordT(SEC.bridge[2], 'vielleicht') + 1.0 ? 'face3' : 'face1'; FACES[fn].visible = true; FACES[fn].position.y = 1.3 + Math.sin(t * 1.5) * .006; }
  const energy = t >= T.v3b && t < T.br ? lerp(1, .45, clamp((t - T.v3b) / 10)) : 1;
  amu.intensity = (black ? 2.3 + .5 * Math.sin(t * 2.2) : 1.1 + .35 * pulse(t, 5)) * energy * (t < 6.8 ? .6 : 1);
  amu.position.set(0, black ? 1.0 : 1.12, black ? .5 : .35);
  amuGlow.visible = pose === 'hold' || black; amuGlow.scale.setScalar((black ? .5 : .3) * (1 + .15 * pulse(t, 5)) * energy); amuGlow.position.set(pose === 'hold' ? -.02 : 0, black ? 1.0 : 1.2, .07);
  // Freunde
  const fs = friendsState(t);
  FRIENDS.forEach((m, k) => { const o = fs[k], s = SEATS[k]; m.visible = o.v > .02; if (!m.visible) return;
    const dx = lerp(s.x, -3.6, o.d), dz = lerp(s.z, 1.0, o.d);
    m.position.set(dx, .75 * o.v + .32 * (1 - o.d) + o.laugh * Math.abs(Math.sin(t * 13 + k * 2)) * .07 + (o.d > 0 ? Math.abs(Math.sin(t * 9)) * .03 : 0) - .32 + .32, dz);
    m.scale.set(1, o.v, 1); m.rotation.y = Math.atan2(camera.position.x - dx, camera.position.z - dz); m.rotation.z = o.laugh * Math.sin(t * 13 + k) * .06; });
  cards.forEach((c, k) => c.visible = t >= T.v2b - .5 + k * .12 && t < T.pre2 + 30);
  // Spielestapel wächst
  const ng = Math.floor(keyed([[0, 2], [T.v1b, 4], [T.pre1, 20], [T.h1, 20], [T.v3a, 24], [SEC.v3a[2].s, 26], [SEC.v3a[2].e + 1, 44], [T.out, 44], [TOTAL, 44]], t));
  GAMES.forEach((g, k) => { g.visible = k < ng; if (k === ng - 1) g.position.y = g.userData.y + .0; });
  if (t > 221) { const top = GAMES[43]; const f2 = ease((t - 221) / 1.5); top.position.set(lerp(1.92, 2.5, f2), lerp(top.userData.y, .66, f2) + Math.sin(f2 * Math.PI) * .5, lerp(-1.95, -.9, f2)); top.material.roughness = lerp(.12, .8, f2); }
  // Zettel
  const l3 = SEC.v3a; const pt = [wordT(l3[0], 'Zeit'), wordT(l3[1], 'Wäsche'), wordT(l3[1], 'einkaufen'), wordT(l3[1], 'ordentlich'), wordT(l3[3], 'Nichtstun'), wordT(l3[3], 'Liste')];
  POST.forEach((m, k) => { m.visible = t >= pt[k]; const pop = 1 + .5 * clamp(1 - (t - pt[k]) / .25); m.scale.setScalar(pop); });
  // Lichtschrift
  let ti = 0; while (ti < TEXTS.length - 1 && TEXTS[ti + 1][0] <= t) ti++;
  const tx = TEXTS[ti]; txt.position.copy(tx[1]); txt.rotation.set(0, tx[2], 0); txt.scale.set(tx[3] / 4, tx[3] / 4, 1);
  if (black) { txt.position.set(.3, 1.93, .3); txt.scale.set(1.25 / 4, 1.25 / 4, 1); }
  const L = curLine(t); drawText(L, t); txtMat.opacity = .96;
  drawScreen(t); drawCal(t);
  // Schnittblitz, Sicherung, Abblende
  let flash = 0; for (const s of SHOTS) { const dt = t - s[0]; if (s[0] > 0 && dt >= 0 && dt < .16 && s !== SHOTS[1] && s !== SHOTS[6] && s !== SHOTS[17] && s[0] !== BL) flash = Math.max(flash, .22 * (1 - dt / .16)); }
  if (t >= BL - .05 && t < BL + .12) flash = .9 * (1 - (t - BL + .05) / .17);
  grade.uniforms.uFlash.value = clamp(flash); grade.uniforms.uT.value = t;
  grade.uniforms.uFade.value = clamp(t / .8) * clamp((TOTAL - t) / 1.0) * (t >= BL + .12 && t < BL + .5 ? clamp((t - BL - .12) / .38) : 1);
  bloom.strength = .5 + .12 * pulse(t, 5);
  renderer.toneMappingExposure = 1.22;
}

// Abspann als Lichtschrift
const CREDIT = { text: 'DREI VON DREI · LUME · 2026', words: ['DREI', 'VON', 'DREI', '·', 'LUME', '·', '2026'], t: [], s: 224.9, e: 240 };
CREDIT.t = CREDIT.words.map((_, i) => [224.9 + i * .12, 225 + i * .12]);
const _cur = curLine; // eslint-disable-line
function curLine2(t) { return t >= 224.9 ? CREDIT : _cur(t); }

window.renderFrame = (t) => { update(t); if (t >= 224.9) { drawText(CREDIT, t); } composer.render(); return true; };
window.TOTAL = TOTAL; window.ready = true;
if (Q.get('t')) window.renderFrame(+Q.get('t'));
