// Rendert Bilder f0..f1 und gibt sie als JPEG-Strom an ffmpeg: node capture.js <w> <h> <f0> <f1> <out.mp4>
const { chromium } = require('playwright'); const { spawn } = require('child_process');
(async () => {
  const [w, h, f0, f1] = process.argv.slice(2, 6).map(Number); const out = process.argv[6];
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', '30', '-i', '-', '-vf', 'scale=1920:1080:flags=lanczos', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto(`http://localhost:8765/index.html?w=${w}&h=${h}`);
  await p.waitForFunction('window.ready === true', null, { timeout: 120000 });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    const d = await p.evaluate((t) => { window.renderFrame(t); return document.querySelector('canvas').toDataURL('image/jpeg', .95); }, f / 30);
    if (!ff.stdin.write(Buffer.from(d.slice(23), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 200 === 0) console.log(out, f - f0, '/', f1 - f0, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
})();
