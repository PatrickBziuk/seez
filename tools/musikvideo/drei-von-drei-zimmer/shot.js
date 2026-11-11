// Standbilder: node shot.js <w> <h> t1 t2 ...
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [w, h, ...ts] = process.argv.slice(2).map(Number);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text()); }); p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto(`http://localhost:8765/index.html?w=${w}&h=${h}`);
  await p.waitForFunction('window.ready === true', null, { timeout: 60000 });
  for (const t of ts) { const t0 = Date.now(); const d = await p.evaluate((t) => { window.renderFrame(t); return document.querySelector('canvas').toDataURL('image/jpeg', .9); }, t);
    fs.writeFileSync(`s_${String(t).padStart(6, '0')}.jpg`, Buffer.from(d.split(',')[1], 'base64')); console.log(t, Date.now() - t0, 'ms'); }
  await b.close();
})();
