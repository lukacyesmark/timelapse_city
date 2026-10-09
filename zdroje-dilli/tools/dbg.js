const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
// usage: node dbg.js outdir "year,lat,lon,k,night" ...
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 300)));
  await page.goto('http://127.0.0.1:8766/run.html');
  await page.waitForFunction(() => window.READY, null, { timeout: 600000 });
  let i = 0;
  for (const spec of process.argv.slice(3)) {
    const [year, lat, lon, k, night] = spec.split(',').map(Number);
    const data = await page.evaluate(([year, lat, lon, k, night]) => { const [e, n] = ll(lat, lon); const S0 = { t: 100, sg: { k: 'gap' }, u: 0, year, cam: { e, n, k }, night: night || 0, flood: -1, ev: null, evp: 0, tint: 0 }; renderWorld(mg, S0, 100); return document.getElementById('c').toDataURL('image/jpeg', 0.85); }, [year, lat, lon, k, night]);
    fs.writeFileSync(`${out}/d${String(i++).padStart(2, '0')}.jpg`, Buffer.from(data.split(',')[1], 'base64'));
  }
  await browser.close();
})();
