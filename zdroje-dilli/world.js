'use strict';
// ================= WORLD: urban growth field, roads, bridges =================
const NUC = [
  { n: 'obuda', p: ll(47.5395, 19.0420), r: [[88, 0], [94, 330], [106, 520], [200, 1100], [430, 1200], [1000, 1200], [1400, 1400], [1700, 1800], [1850, 2200], [1873, 2800], [1900, 4300], [1930, 6000], [1949, 6500], [1950.3, 8500], [1985, 11000]] },
  { n: 'civil', p: ll(47.5645, 19.0436), r: [[104, 0], [130, 300], [200, 700], [430, 800], [1900, 800], [1930, 1500], [1960, 3500], [1990, 6000]] },
  { n: 'contra', p: ll(47.4910, 19.0516), r: [[290, 0], [310, 150], [430, 170], [1000, 170]] },
  { n: 'pest', p: ll(47.4960, 19.0525), r: [[1000, 0], [1046, 300], [1241, 800], [1300, 1000], [1458, 1400], [1541, 1500], [1686, 1500], [1790, 2200], [1838, 2600], [1848, 3100], [1873, 4300], [1896, 5200], [1910, 7200], [1930, 8000], [1949, 9000], [1950.3, 12500], [1985, 16000]] },
  { n: 'buda', p: ll(47.4985, 19.0385), r: [[1000, 0], [1247, 0], [1255, 200], [1361, 700], [1458, 1200], [1700, 1300], [1800, 1700], [1873, 2700], [1900, 4000], [1930, 6000], [1949, 7000], [1950.3, 9000], [1985, 12000]] },
];
function invR(r, d) { // year at which radius reaches d (piecewise linear, non-decreasing)
  if (d <= 0) return r[0][0];
  for (let i = 1; i < r.length; i++) { if (d <= r[i][1]) { const a = r[i - 1], b = r[i]; return b[1] === a[1] ? b[0] : a[0] + (b[0] - a[0]) * (d - a[1]) / (b[1] - a[1]); } }
  return 9999;
}
const PARKS = [{ p: ll(47.5258, 19.0468), a: 1450, b: 260, rot: 0.32 }, { p: ll(47.5165, 19.0805), a: 560, b: 560, rot: 0 }, { p: ll(47.4858, 19.0452), a: 430, b: 430, rot: 0 }];
function inPark(e, n) {
  for (const k of PARKS) { const dx = e - k.p[0], dy = n - k.p[1], c = Math.cos(k.rot), s = Math.sin(k.rot), u = dx * c + dy * s, v = -dx * s + dy * c; if ((u / k.a) ** 2 + (v / k.b) ** 2 < 1) return true; }
  return false;
}
function urbanYear(e, n) {
  if (isWater(e, n)) return 9999;
  const h = hAt(e, n);
  if (inPark(e, n) || h > 78) return 9999;
  let best = 9999;
  const wob = 0.72 + 0.56 * fbm2(e / 1300, n / 1300, 3, 21), jit = 0.93 + 0.14 * hash2(Math.floor(e / 40), Math.floor(n / 40), 8);
  for (const nu of NUC) { const d = Math.hypot(e - nu.p[0], n - nu.p[1]) * wob * jit; const y = invR(nu.r, d); if (y < best) best = y; }
  if (h > 70) best += 55; else if (h > 45) best += 15;
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
