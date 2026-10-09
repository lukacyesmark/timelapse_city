const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const times = process.argv.slice(2).map(Number);
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.type(), m.text().slice(0, 300)); });
  page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 400)));
  const t0 = Date.now();
  await page.goto('http://127.0.0.1:8766/run.html');
  await page.waitForFunction(() => window.READY || (document.getElementById('status') && /^ERR/.test(document.getElementById('status').textContent)), null, { timeout: 600000 });
  console.log('status:', await page.evaluate(() => document.getElementById('status').textContent), (Date.now() - t0) / 1000, 's');
  if (await page.evaluate(() => !window.READY)) { await browser.close(); process.exit(1); }
  for (const t of times) {
    const t1 = Date.now();
    const data = await page.evaluate((t) => { renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', 0.85); }, t);
    fs.writeFileSync((process.env.OUT || '/tmp/claude-0/shots') + '/t' + String(t).padStart(8, '0') + '.jpg', Buffer.from(data.split(',')[1], 'base64'));
    console.log('shot', t, (Date.now() - t1), 'ms');
  }
  await browser.close();
})();
