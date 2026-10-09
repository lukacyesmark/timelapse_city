// Render frames [from,to) in headless Chromium and pipe them as JPEG to ffmpeg (libx264). usage: node pump.js from to out.mp4
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
(async () => {
  const [from, to, out] = [+process.argv[2], +process.argv[3], process.argv[4]];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-threads', '2', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 300)));
  await page.goto('http://127.0.0.1:8766/run.html');
  await page.waitForFunction(() => window.READY, null, { timeout: 900000 });
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    const data = await page.evaluate(f => { renderFrame(f / 30); return document.getElementById('c').toDataURL('image/jpeg', 0.95).slice(23); }, f);
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(new Date().toISOString().slice(11, 19), 'frame', f, 'of', to, ((Date.now() - t0) / 1000 / Math.max(1, f - from)).toFixed(3), 's/frame');
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); console.log('done', out);
})();
