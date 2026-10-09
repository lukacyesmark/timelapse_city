'use strict';
// ================= WORLD: urban growth field, roads, bridges =================
const NUC = [ // growth cores: r = [[year, radius m], ...] (stylised; roughly follows the "cities of Delhi")
  { n: 'purana', p: ll(28.6096, 77.2437), r: [[-900, 0], [-880, 160], [-300, 260], [1000, 300], [1540, 320], [1545, 1000], [1700, 1100], [1900, 1300], [1947, 1500]] },
  { n: 'lalkot', p: ll(28.5190, 77.1840), r: [[1060, 0], [1075, 350], [1180, 800], [1206, 1000], [1300, 1150], [1700, 1250], [1857, 1500], [1950, 2300], [1962, 4800], [1990, 7000]] },
  { n: 'siri', p: ll(28.5500, 77.2160), r: [[1303, 0], [1310, 400], [1327, 1150], [1450, 1200], [1700, 1250], [1950, 1500], [1962, 4200], [1990, 6500]] },
  { n: 'tughlaq', p: ll(28.5110, 77.2660), r: [[1321, 0], [1325, 400], [1330, 700], [1400, 760], [1960, 900], [1980, 3000], [2005, 5200]] },
  { n: 'firoz', p: ll(28.6358, 77.2406), r: [[1354, 0], [1360, 500], [1400, 560], [1638, 600]] },
  { n: 'shahj', p: ll(28.6520, 77.2300), r: [[1638, 0], [1640, 300], [1648, 1000], [1700, 1500], [1739, 1700], [1857, 2000], [1900, 2900], [1931, 3500], [1947, 4300], [1962, 6500], [1990, 9500]] },
  { n: 'civil', p: ll(28.6800, 77.2250), r: [[1803, 0], [1805, 250], [1850, 900], [1858, 1100], [1912, 1500], [1947, 2600], [1970, 4500], [1990, 6500]] },
  { n: 'newdelhi', p: ll(28.6150, 77.2150), r: [[1911.9, 0], [1913, 300], [1925, 1300], [1931, 2700], [1947, 3400], [1960, 5600], [1985, 7600], [2005, 9600]] },
  { n: 'east', p: ll(28.6450, 77.2900), r: [[1890, 0], [1920, 400], [1947, 900], [1960, 2300], [1975, 4600], [2000, 7600]] },
  { n: 'west', p: ll(28.6500, 77.1450), r: [[1930, 0], [1948, 800], [1962, 2600], [1978, 5200], [2000, 8200]] },
  { n: 'v1', p: ll(28.6143, 77.2000), r: [[1200, 0], [1210, 260], [1900, 320]] }, { n: 'v2', p: ll(28.6270, 77.2170), r: [[1700, 0], [1705, 220], [1900, 300]] }, { n: 'v3', p: ll(28.5570, 77.1730), r: [[1300, 0], [1310, 260], [1960, 340]] },
  { n: 'v4', p: ll(28.5330, 77.2200), r: [[1350, 0], [1360, 240], [1960, 320]] }, { n: 'v5', p: ll(28.5494, 77.1935), r: [[1352, 0], [1360, 300], [1960, 380]] }, { n: 'v6', p: ll(28.5890, 77.2480), r: [[1565, 0], [1572, 380], [1930, 420]] },
  { n: 'v7', p: ll(28.6700, 77.2900), r: [[1650, 0], [1660, 300], [1900, 380]] }, { n: 'v8', p: ll(28.6000, 77.2000), r: [[1450, 0], [1460, 280], [1910, 340]] }, { n: 'v9', p: ll(28.5600, 77.2500), r: [[1500, 0], [1510, 260], [1960, 320]] },
  { n: 'okhla', p: ll(28.5420, 77.2750), r: [[1960, 0], [1975, 2000], [2000, 4600]] },
];
function invR(r, d) { // year at which radius reaches d (piecewise linear, non-decreasing)
  if (d <= 0) return r[0][0];
  for (let i = 1; i < r.length; i++) { if (d <= r[i][1]) { const a = r[i - 1], b = r[i]; return b[1] === a[1] ? b[0] : a[0] + (b[0] - a[0]) * (d - a[1]) / (b[1] - a[1]); } }
  return 9999;
}
const PARKS = [ // the Ridge (3 pieces), Lodhi Garden, Hauz Khas deer park, Delhi Zoo
  { p: ll(28.6880, 77.2090), a: 2400, b: 420, rot: 1.22 }, { p: ll(28.6230, 77.1880), a: 3800, b: 430, rot: 1.2 }, { p: ll(28.5680, 77.1720), a: 2600, b: 520, rot: 1.2 },
  { p: ll(28.5931, 77.2197), a: 460, b: 330, rot: 0 }, { p: ll(28.5500, 77.1960), a: 420, b: 380, rot: 0 }, { p: ll(28.6040, 77.2480), a: 360, b: 300, rot: 0 },
];
function inPark(e, n) {
  for (const k of PARKS) { const dx = e - k.p[0], dy = n - k.p[1], c = Math.cos(k.rot), s = Math.sin(k.rot), u = dx * c + dy * s, v = -dx * s + dy * c; if ((u / k.a) ** 2 + (v / k.b) ** 2 < 1) return true; }
  return false;
}
function urbanYear(e, n) {
  if (isWater(e, n)) return 9999;
  const h = hAt(e, n);
  if (inPark(e, n) || h > 95) return 9999;
  let best = 9999;
  const wob = 0.72 + 0.56 * fbm2(e / 1300, n / 1300, 3, 21), jit = 0.93 + 0.14 * hash2(Math.floor(e / 40), Math.floor(n / 40), 8);
  for (const nu of NUC) { const d = Math.hypot(e - nu.p[0], n - nu.p[1]) * wob * jit; const y = invR(nu.r, d); if (y < best) best = y; }
  if (h > 70) best += 55; else if (h > 45) best += 15;
  { const wf = waterFar(e, n); if (wf > 0.45) best = Math.max(best, 1985 + 25 * hash2(Math.floor(e / 300), Math.floor(n / 300), 31)); else if (wf > 0.3) best = Math.max(best, 1950 + 40 * hash2(Math.floor(e / 300), Math.floor(n / 300), 32)); }
  return best;
}
let URB; // Float32 urban year per UT cell
const UT = 2048;
function buildUrban() {
  URB = new Float32Array(UT * UT); const data = new Uint8Array(UT * UT * 4), ew = BB[2] - BB[0], nh = BB[3] - BB[1];
  for (let y = 0; y < UT; y++) for (let x = 0; x < UT; x++) {
    const e = BB[0] + (x + 0.5) / UT * ew, n = BB[1] + (y + 0.5) / UT * nh, u = urbanYear(e, n); URB[y * UT + x] = u;
    const code = clamp((u + 200) / 2400) * 65535 | 0, k = (y * UT + x) * 4; data[k] = code >> 8; data[k + 1] = code & 255; data[k + 3] = 255;
  }
  return data;
}
const urbAt = (e, n) => { const x = Math.floor((e - BB[0]) / (BB[2] - BB[0]) * UT), y = Math.floor((n - BB[1]) / (BB[3] - BB[1]) * UT); return (x < 0 || y < 0 || x >= UT || y >= UT) ? 9999 : URB[y * UT + x]; };

// ---- roads & bridges
let ROADS = [], BRIDGES = [];
async function loadRoads() {
  const r = await (await fetch('data/roads.json')).json();
  ROADS = r.filter(q => !q.b).map(q => { const p = q.p, pts = []; for (let i = 0; i < p.length; i += 2) pts.push(p[i], p[i + 1]); const m = pts.length >> 1; const mid = urbAt(pts[(m >> 1) * 2], pts[(m >> 1) * 2 + 1]); return { c: q.c, pts, y: mid - q.c * 25 - 15, n: q.n }; }).filter(q => q.y < 2100);
  BRIDGES = await (await fetch('data/bridges.json')).json();
}
function drawRoads(g, year, yrNow) {
  const k = CAM.k, wMul = clamp(k * 14, 0.8, 6);
  const cols = year < 430 ? ['#a98b5f', '#8b7048'] : year < 1800 ? ['#b49a74', '#6f5c40'] : year < 1900 ? ['#c4b79e', '#6b6050'] : ['#8d8d92', '#4a4a50'];
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const pass of [0, 1]) {
    g.strokeStyle = cols[pass === 0 ? 1 : 0];
    for (let c = 1; c <= 5; c++) {
      g.lineWidth = (pass === 0 ? (1.2 + c * 0.9) * wMul + 1.6 : (1.2 + c * 0.9) * wMul); g.beginPath(); let any = false;
      for (const r of ROADS) {
        if (r.c !== c || r.y > year) continue; const p = r.pts; let started = false;
        for (let i = 0; i < p.length; i += 2) {
          const [x, y] = P(p[i], p[i + 1], hAt(p[i], p[i + 1]) + 0.3);
          if (x < -200 || x > W + 200 || y < -200 || y > H + 200) { started = false; continue; }
          if (!started) { g.moveTo(x, y); started = true; } else g.lineTo(x, y); any = true;
        }
      }
      if (any) g.stroke();
    }
  }
}
function drawBridgeDecks(g, year, destroyed) {
  for (const b of BRIDGES) {
    if (year < b.year) continue; const pts = b.pts, wdt = Math.max(2.5, 17 * CAM.k * 1.1);
    const fall = destroyed && destroyed(b); if (fall && fall.skip) continue;
    for (const pass of [0, 1]) {
      g.strokeStyle = pass === 0 ? '#2b2a2a' : (year > 1900 ? '#a7a6a3' : '#b8aa8f'); g.lineWidth = pass === 0 ? wdt + 2.4 : wdt; g.lineCap = 'butt'; g.beginPath();
      pts.forEach(([e, n], i) => { const [x, y] = P(e, n, 7); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    }
    // side rail shade
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = Math.max(1, wdt * 0.25); g.beginPath(); pts.forEach(([e, n], i) => { const [x, y] = P(e, n, 5.5); i ? g.lineTo(x, y + wdt * 0.7) : g.moveTo(x, y + wdt * 0.7); }); g.stroke();
  }
}
