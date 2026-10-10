// Full local render on a Mac (GPU + hardware H.264): image → audio → mux → copy to the output folder.
// Requires Google Chrome and Playwright:  npm i -D playwright   (no browser download needed, uses channel 'chrome')
// usage (from the city folder, e.g. zdroje-dilli, with `python3 server2.py` running):
//   node tools/render_local.js <audio page> <name> [output dir]
//   node tools/render_local.js audio_dl.html delhi ~/Documents/casosber/mesta/videa
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
(async () => {
  const [audioPage = 'audio_dl.html', name = 'city', outDir = path.join(os.homedir(), 'Documents/casosber/mesta/videa')] = process.argv.slice(2);
  const base = 'http://localhost:8766/';
  // headful + visible window: background tabs are throttled and the audio render would take many times longer
  const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1400,900', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  const status = async () => page.evaluate(() => (document.getElementById('status') || {}).textContent || '');
  const waitDone = async (fn, every = 15000) => { let last = ''; while (!(await page.evaluate(fn))) { await new Promise(r => setTimeout(r, every)); const s = await status(); if (s !== last) { console.log(new Date().toTimeString().slice(0, 8), s); last = s; } } };

  console.log('1/3 image render');
  await page.goto(base + 'run.html');
  await page.waitForFunction(() => window.READY || /^ERR/.test((document.getElementById('status') || {}).textContent || ''), null, { timeout: 0 });
  if (!(await page.evaluate(() => window.READY))) throw new Error(await status());
  await page.evaluate(() => exportTimeline());
  page.evaluate(n => startEncode({ name: n + '-silent.mp4' }), name).catch(e => console.log('encode error', e.message));
  await waitDone(() => !!window.DONE);

  console.log('2/3 audio + mux');
  await page.goto(base + audioPage);
  await page.waitForFunction(() => typeof window.makeAudio === 'function' && window.MB, null, { timeout: 0 });
  page.evaluate(n => makeAudio().then(() => muxVideo('out/' + n + '-silent.mp4', n + '-final.mp4')).then(r => { window.ALLDONE = r; }), name).catch(e => console.log('audio error', e.message));
  await waitDone(() => !!window.ALLDONE);
  await browser.close();

  console.log('3/3 copy');
  fs.mkdirSync(outDir, { recursive: true });
  const src = path.join('out', name + '-final.mp4'), dst = path.join(outDir, name + '-final.mp4');
  fs.copyFileSync(src, dst);
  console.log('DONE', dst, Math.round(fs.statSync(dst).size / 1e6) + ' MB');
})().catch(e => { console.error(e); process.exit(1); });
