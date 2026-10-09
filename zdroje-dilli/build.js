'use strict';
// ================= BUILD: city generation, lifecycles, landmarks, walls =================
let ITEMS = [], FIRES = [], NBLD = 0;
const OLD = ll(28.6520, 77.2300), NEWD = ll(28.6150, 77.2150), CIVIL = ll(28.6800, 77.2250), SIRI = ll(28.5500, 77.2160), TUGH = ll(28.5110, 77.2660), FIROZ = ll(28.6358, 77.2406), PURANA = ll(28.6096, 77.2437), LALKOT = ll(28.5205, 77.1858);
const CORE = OLD; // focal point of the city for agents / fx
const dist2 = (e, n, c) => Math.hypot(e - c[0], n - c[1]);
function styleFor(y, e, n, r, h) {
  const dold = dist2(e, n, OLD), dnew = dist2(e, n, NEWD), dciv = dist2(e, n, CIVIL), old = dold < 2700, nw = dnew < 5400 && y > 1911;
  if (y < -300) return 0;
  if (y < 1206) return 1;
  if (y < 1526) return 3;
  if (y < 1648) return r < 0.6 ? 4 : 3;
  if (y < 1803) return old ? (r < 0.7 ? 5 : 4) : (r < 0.6 ? 4 : 3);
  if (y < 1912) return old ? (r < 0.75 ? 5 : 4) : (dciv < 2300 ? (r < 0.5 ? 6 : 10) : (r < 0.6 ? 5 : 4));
  if (y < 1947) return nw ? (r < 0.5 ? 10 : r < 0.8 ? 6 : 7) : old ? (r < 0.6 ? 5 : 7) : (r < 0.4 ? 7 : r < 0.7 ? 5 : 4);
  if (y < 1990) return nw ? (r < 0.45 ? 10 : r < 0.75 ? 7 : 8) : old ? (r < 0.5 ? 5 : r < 0.8 ? 7 : 8) : (r < 0.35 ? 8 : r < 0.7 ? 7 : 10);
  return nw ? (r < 0.3 ? 10 : r < 0.6 ? 9 : 7) : old ? (r < 0.4 ? 7 : r < 0.7 ? 5 : 9) : (r < 0.25 ? 9 : r < 0.6 ? 7 : 8);
}
const DESTR = [ // sacks and sieges: y, centre, radius, fraction destroyed, rebuild delay [min,max] (years), fire duration
  { y: 1398.95, c: ll(28.5420, 77.2200), r: 3300, frac: 0.55, delay: [6, 30], fire: 2.2 },
  { y: 1739.2, c: OLD, r: 2500, frac: 0.38, delay: [4, 25], fire: 1.7 },
  { y: 1857.7, c: ll(28.6600, 77.2290), r: 2500, frac: 0.42, delay: [3, 14], fire: 1.5 },
];
function genBuildings() {
  seedv = 4242; ITEMS = []; const items = ITEMS;
  // road proximity grid
  const CS = 30, grid = new Map();
  const put = (e, n) => { const k = Math.floor(e / CS) * 100003 + Math.floor(n / CS); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(e, n); };
  for (const r of ROADS) { const p = r.pts; for (let i = 0; i + 3 < p.length; i += 2) { const dx = p[i + 2] - p[i], dy = p[i + 3] - p[i + 1], L = Math.hypot(dx, dy), m = Math.max(1, Math.ceil(L / 12)); for (let q = 0; q <= m; q++) put(p[i] + dx * q / m, p[i + 1] + dy * q / m); } }
  const nearRoad = (e, n, rr) => { const cx = Math.floor(e / CS), cy = Math.floor(n / CS); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const arr = grid.get((cx + a) * 100003 + cy + b); if (!arr) continue; for (let i = 0; i < arr.length; i += 2) { const dx = arr[i] - e, dy = arr[i + 1] - n; if (dx * dx + dy * dy < rr * rr) return true; } } return false; };
  const Zs = 1500, du = 46, dv = 58;
  for (let zi = Math.floor(BB[0] / Zs); zi <= Math.floor(BB[2] / Zs); zi++) for (let zj = Math.floor(BB[1] / Zs); zj <= Math.floor(BB[3] / Zs); zj++) {
    const ze = (zi + 0.5) * Zs, zn = (zj + 0.5) * Zs, th = -0.3 + (fbm2(zi * 0.55 + 3, zj * 0.55 + 1, 2, 4) - 0.5) * 1.5, ct = Math.cos(th), st = Math.sin(th);
    for (let iu = -Math.ceil(Zs * 0.8 / du); iu <= Math.ceil(Zs * 0.8 / du); iu++) for (let iv = -Math.ceil(Zs * 0.8 / dv); iv <= Math.ceil(Zs * 0.8 / dv); iv++) {
      if (((iu % 5) + 5) % 5 === 4 || ((iv % 6) + 6) % 6 === 5) continue;
      const u = iu * du, v = iv * dv, e = ze + u * ct - v * st + (rnd() - 0.5) * 9, n = zn + u * st + v * ct + (rnd() - 0.5) * 9;
      if (Math.abs(e - ze) >= Zs / 2 || Math.abs(n - zn) >= Zs / 2) continue;
      if (e < BB[0] + 60 || e > BB[2] - 60 || n < BB[1] + 60 || n > BB[3] - 60) continue;
      const U = urbAt(e, n); if (U > 2100) continue;
      const h = hAt(e, n); if (h < 0.3) continue;
      const sl = Math.hypot(hAt(e + 12, n) - hAt(e - 12, n), hAt(e, n + 12) - hAt(e, n - 12)) / 24; if (sl > 0.5) continue;
      if (nearRoad(e, n, 14)) continue;
      const r1 = rnd(), spread = (U > 1636 && U < 1662 && dist2(e, n, OLD) < 1800) || (U > 1911 && U < 1936 && dist2(e, n, NEWD) < 3800) ? 9 : U < 450 ? 10 : U < 1700 ? 40 : 28, y0 = U + 2 + rnd() * spread;
      if (y0 > 2024) continue;
      // density thinning near edges of growth & hills
      if (h > 60 && rnd() < 0.5) continue; if (h > 45 && rnd() < 0.15) continue;
      let sty = styleFor(y0, e, n, r1, h);
      const sc = 0.82 + rnd() * 0.42, vr = Math.floor(rnd() * 16);
      const seg = { e, n, h, y0, y1: 1e9, s: sty, v: vr, sc, k: 0, f: 0 };
      // Siri / Tughlaqabad / Firozabad fade after the sack of 1398 and stay ruined until modern Delhi swallows them
      { const dS = Math.min(dist2(e, n, SIRI), dist2(e, n, TUGH), dist2(e, n, FIROZ)); if (y0 < 1400 && dS < 1500 && rnd() < 0.8) { seg.y1 = 1398.9 + rnd() * 60; items.push(seg); const re = rnd() < 0.55 ? 1935 + rnd() * 40 : 1e9; items.push({ e, n, h, y0: seg.y1, y1: re, s: 2, v: vr, sc: 1, k: 0, f: 0 }); if (re < 1e9) items.push({ e, n, h, y0: re, y1: 1e9, s: styleFor(re, e, n, rnd(), h), v: vr, sc, k: 0, f: 0 }); continue; } }
      // villages cleared for the Lutyens plan of New Delhi (1912-1931)
      if (y0 < 1912 && dist2(e, n, NEWD) < 3000 && rnd() < 0.8) { const yr = 1912 + rnd() * 16; seg.y1 = yr; items.push(seg); items.push({ e, n, h, y0: yr, y1: 1e9, s: styleFor(yr + 1, e, n, rnd(), h), v: vr, sc, k: 0, f: 0 }); continue; }
      items.push(seg);
    }
  }
  NBLD = items.length;
  // destruction events
  const ev = DESTR.slice().sort((a, b) => a.y - b.y);
  for (const E of ev) {
    const cur = items.length;
    for (let i = 0; i < cur; i++) {
      const it = items[i]; if (it.k !== 0 || it.s === 11 || !(it.y0 < E.y && it.y1 > E.y)) continue;
      if (Math.hypot(it.e - E.c[0], it.n - E.c[1]) > E.r) continue; if (E.flood && !(waterFar(it.e, it.n) > 0.07 && it.h < 30)) continue;
      const fr = E.frac * (E.flood ? 1 : (1 - 0.35 * Math.hypot(it.e - E.c[0], it.n - E.c[1]) / E.r)); if (rnd() > fr) continue;
      const delay = E.delay[0] + rnd() * (E.delay[1] - E.delay[0]); it.y1 = E.y;
      items.push({ e: it.e, n: it.n, h: it.h, y0: E.y, y1: E.y + delay, s: 11, v: it.v, sc: 1, k: 0, f: E.fire });
      const ny = E.y + delay + 1, ns = styleFor(ny, it.e, it.n, rnd(), it.h);
      items.push({ e: it.e, n: it.n, h: it.h, y0: E.y + delay, y1: 1e9, s: E.y > 1900 && ns === 6 ? 7 : ns, v: it.v, sc: it.sc, k: 0, f: 0 });
    }
  }
  // fires list
  FIRES = items.filter(i => i.f > 0);
  NBLD = items.length;
  // trees
  const TS = 34;
  for (let e = BB[0] + 100; e < BB[2] - 100; e += TS) for (let n = BB[1] + 100; n < BB[3] - 100; n += TS) {
    const ee = e + (rnd() - 0.5) * TS, nn = n + (rnd() - 0.5) * TS; if (isWater(ee, nn)) continue; const h = hAt(ee, nn); if (h < 0.5) continue;
    const U = urbAt(ee, nn); const park = inPark(ee, nn);
    const dens = park ? 0.55 : h > 30 ? 0.6 : h > 14 ? 0.16 : 0.05; if (rnd() > dens) continue;
    const sl = Math.hypot(hAt(ee + 12, nn) - hAt(ee - 12, nn), hAt(ee, nn + 12) - hAt(ee, nn - 12)) / 24; if (sl > 0.75) continue;
    const y1 = park ? 1e9 : (U > 2100 ? 1e9 : U + 10 + rnd() * 25); if (!park && U < 2100 && h < 14) continue;
    items.push({ e: ee, n: nn, h, y0: -9999, y1, s: 20, v: Math.floor(rnd() * 16), sc: 0.8 + rnd() * 0.6, k: 1, f: 0 });
  }
  // landmarks
  addLandmarks(items);
  for (const it of items) it.key = (it.e - it.n);
  items.sort((a, b) => a.key - b.key);
  return items.length;
}
function peakNear(c, r) { let best = -1, be = c[0], bn = c[1]; for (let e = c[0] - r; e <= c[0] + r; e += 12) for (let n = c[1] - r; n <= c[1] + r; n += 12) { const h = hAt(e, n); if (h > best) { best = h; be = e; bn = n; } } return [be, bn, best]; }
function lmk(items, name, lat, lon, y0, y1, sc = 1, extra = {}) { const [e, n] = Array.isArray(lat) ? lat : ll(lat, lon); items.push(Object.assign({ e, n, h: hAt(e, n), y0, y1, s: 100, lm: name, v: 0, sc, k: 2, f: 0 }, extra)); }
function addLandmarks(items) {
  // Painted Grey Ware huts on the Purana Qila mound
  for (let i = 0; i < 18; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 170, e = PURANA[0] + Math.cos(a) * r, n = PURANA[1] + Math.sin(a) * r * 0.8; if (isWater(e, n) || hAt(e, n) < 0.5) { i--; continue; } items.push({ e, n, h: hAt(e, n), y0: -900 + rnd() * 20, y1: 1e9, s: 0, v: i, sc: 0.9 + rnd() * 0.4, k: 0, f: 0 }); }
  // Timur's camp across the Yamuna (1398) and the Delhi Durbar tent city (1911)
  { const tc = ll(28.6420, 77.2760); for (let i = 0; i < 40; i++) { const e = tc[0] + (rnd() - 0.5) * 1500, n = tc[1] + (rnd() - 0.5) * 1100; if (isWater(e, n) || hAt(e, n) < 0.3) { i--; continue; } items.push({ e, n, h: hAt(e, n), y0: 1398.6 + rnd() * 0.2, y1: 1399.3, s: 22, v: i, sc: 1.6, k: 0, f: 0 }); } }
  { const dc = ll(28.6800, 77.2170); for (let i = 0; i < 70; i++) { const e = dc[0] + (rnd() - 0.5) * 2200, n = dc[1] + (rnd() - 0.5) * 1500; if (isWater(e, n) || hAt(e, n) < 0.3 || inPark(e, n)) { i--; continue; } items.push({ e, n, h: hAt(e, n), y0: 1911.5 + rnd() * 0.2, y1: 1912.4, s: 22, v: i, sc: 1.7, k: 0, f: 0 }); } }
  // Qutb complex
  lmk(items, 'qutb', 28.5245, 77.1855, 1200, 1e9, 1.5); lmk(items, 'mosque', 28.5252, 77.1845, 1193, 1e9, 1.1);
  lmk(items, 'tomb2', 28.5105, 77.2640, 1325, 1e9, 1.0); lmk(items, 'tomb2', 28.5494, 77.1935, 1352, 1e9, 1.2);
  lmk(items, 'pillar', 28.6358, 77.2406, 1356, 1e9, 1.4);
  lmk(items, 'tomb2', 28.5925, 77.2205, 1517, 1e9, 1.1); lmk(items, 'tomb2', 28.5930, 77.2232, 1494, 1e9, 1.3);
  lmk(items, 'mosque', 28.6100, 77.2440, 1541, 1e9, 1.1);
  lmk(items, 'tomb', 28.5933, 77.2507, 1572, 1e9, 1.0);
  lmk(items, 'pavilion', 28.6565, 77.2402, 1648, 1e9, 1.0); lmk(items, 'pavilion', 28.6540, 77.2425, 1648, 1e9, 0.9);
  lmk(items, 'jama', 28.6507, 77.2334, 1656, 1e9, 1.0);
  lmk(items, 'jantar', 28.6271, 77.2166, 1724, 1e9, 1.0);
  lmk(items, 'tomb2', 28.5893, 77.2108, 1754, 1e9, 2.0);
  lmk(items, 'rbhavan', 28.6143, 77.1995, 1929, 1e9, 1.0); lmk(items, 'secr', 28.6180, 77.2058, 1927, 1e9, 1.0); lmk(items, 'secr', 28.6106, 77.2058, 1927, 1e9, 1.0); lmk(items, 'sansad', 28.6173, 77.2092, 1927, 1e9, 1.0);
  lmk(items, 'indiagate', 28.6129, 77.2295, 1931, 1e9, 1.0); lmk(items, 'cp', 28.6315, 77.2167, 1933, 1e9, 1.0);
  lmk(items, 'lotus', 28.5535, 77.2588, 1986, 1e9, 1.0); lmk(items, 'akshardham', 28.6127, 77.2773, 2005, 1e9, 1.0);
}
// ---- wall segments (the seven historic cities, Purana Qila, Red Fort, Shahjahanabad)
let WALLS = [];
function addWalls() {
  WALLS = [];
  const add = (a, b, y0, y1, ht, col, tw) => WALLS.push({ a, b, y0, y1, ht, col, tw: tw || 0 });
  const ring = (llpts, closed, y0, y1, ht, col, o = {}) => { const pts = llpts.map(p => ll(p[0], p[1])); if (closed) pts.push(pts[0]); const tot = pts.reduce((s, p, i) => i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0); let acc = 0; for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.round(L / (o.step || 28))); for (let q = 0; q < m; q++) { const u = (acc + L * q / m) / tot, yy = y0 + (o.span || 4) * u, y1b = typeof y1 === 'function' ? y1(i, q) : y1; add([a[0] + (b[0] - a[0]) * q / m, a[1] + (b[1] - a[1]) * q / m], [a[0] + (b[0] - a[0]) * (q + 1) / m, a[1] + (b[1] - a[1]) * (q + 1) / m], yy, y1b, ht, col, (o.tw || 6) && q % (o.tw || 6) === 0); } acc += L; } };
  const oval = (lat, lon, ra, rb, n = 22) => Array.from({ length: n }, (_, i) => { const a = i / n * 6.283, c = ll(lat, lon); return [lat + Math.sin(a) * rb / 110574, lon + Math.cos(a) * ra / (111320 * Math.cos(lat * D2R))]; });
  ring([[28.5225, 77.1790], [28.5225, 77.1900], [28.5150, 77.1900], [28.5150, 77.1790]], true, 1060, 1e9, 8, [182, 164, 132], { span: 20 });          // Lal Kot
  ring([[28.5265, 77.1750], [28.5265, 77.1925], [28.5115, 77.1925], [28.5115, 77.1750]], true, 1180, 1e9, 10, [186, 166, 132], { span: 12, tw: 8 }); // Qila Rai Pithora
  ring(oval(28.5500, 77.2160, 820, 760), true, 1303, 1e9, 11, [170, 150, 120], { span: 7, tw: 5 });                                                 // Siri
  ring([[28.5130, 77.2570], [28.5130, 77.2700], [28.5035, 77.2720], [28.5025, 77.2590]], true, 1321, 1e9, 18, [146, 130, 110], { span: 6, tw: 4 });   // Tughlaqabad
  ring([[28.5290, 77.1960], [28.5400, 77.1990], [28.5500, 77.2000]], false, 1326, 1e9, 8, [170, 154, 126], { span: 1, tw: 0 });                    // Jahanpanah
  ring([[28.6390, 77.2395], [28.6390, 77.2425], [28.6340, 77.2425], [28.6340, 77.2395]], true, 1354, 1e9, 12, [186, 168, 138], { span: 3, tw: 4 });   // Firozabad (Kotla)
  ring([[28.6140, 77.2428], [28.6140, 77.2465], [28.6055, 77.2465], [28.6055, 77.2428]], true, 1533, 1e9, 17, [176, 98, 72], { span: 12, tw: 5 });    // Purana Qila
  ring([[28.6600, 77.2380], [28.6600, 77.2440], [28.6520, 77.2440], [28.6520, 77.2380]], true, 1639, 1e9, 20, [168, 62, 44], { span: 9, tw: 5 });     // Red Fort
  const sw = [[28.6590, 77.2380], [28.6678, 77.2290], [28.6660, 77.2235], [28.6565, 77.2175], [28.6435, 77.2255], [28.6428, 77.2373], [28.6395, 77.2396], [28.6445, 77.2425], [28.6520, 77.2405]];
  ring(sw, false, 1650, (i, q) => 1862 + 40 * hash2(i, q, 17) * (hash2(i, q, 3) < 0.35 ? 1 : 0) + (hash2(i, q, 3) < 0.35 ? 0 : 1e9), 9, [196, 172, 142], { span: 8, tw: 7 }); // Shahjahanabad wall (mostly demolished after 1857)
  for (const w of WALLS) { w.e = (w.a[0] + w.b[0]) / 2; w.n = (w.a[1] + w.b[1]) / 2; w.h = hAt(w.e, w.n); w.k = 3; w.s = 0; w.sc = 1; w.v = 0; w.f = 0; w.key = w.e - w.n; ITEMS.push(w); }
  ITEMS.sort((a, b) => a.key - b.key);
}
// ---- drawing
function drawItems(g, year, o = {}) {
  const k = CAM.k, lod = k < 0.2 ? 0 : k < 0.55 ? 1 : 2, W2 = W / 2, H2 = H / 2, ce = CAM.e, cn = CAM.n, treeOn = k > 0.13, brokenBridgeTowers = o.towerState;
  const wallW = Math.max(1.2, k * 5);
  for (let q = 0; q < ITEMS.length; q++) {
    const it = ITEMS[q]; if (it.y0 > year || it.y1 <= year) continue;
    const x = W2 + ((it.e - ce) + (it.n - cn)) * k, yb = H2 + ((it.e - ce) - (it.n - cn)) * k * 0.5 - it.h * k * VS;
    if (x < -260 || x > W + 260 || yb < -140 || yb > H + 420) continue;
    switch (it.k) {
      case 0: { const sp = getSpr(it.s, it.v, lod), sc = k / sp.s * it.sc; g.drawImage(sp.c, x - sp.ox * sc, yb - sp.oy * sc, sp.c.width * sc, sp.c.height * sc); break; }
      case 1: { if (!treeOn) break; const sp = getSpr(it.s, it.v, lod), sc = k / sp.s * it.sc; g.drawImage(sp.c, x - sp.ox * sc, yb - sp.oy * sc, sp.c.width * sc, sp.c.height * sc); break; }
      case 2: { if (it.destroyYear !== undefined && year >= it.destroyYear && year < it.rebuildYear) break; const sp = landmark(it.lm, lod), sc = k / sp.s * it.sc; g.drawImage(sp.c, x - sp.ox * sc, yb - sp.oy * sc, sp.c.width * sc, sp.c.height * sc); break; }
      case 3: { // wall segment
        const [x1, y1] = P(it.a[0], it.a[1], hAt(it.a[0], it.a[1])), [x2, y2] = P(it.b[0], it.b[1], hAt(it.b[0], it.b[1])), ht = it.ht * k * VS * 0.85;
        g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x2, y2 - ht); g.lineTo(x1, y1 - ht); g.closePath(); const dx = x2 - x1; g.fillStyle = rgb(it.col, dx >= 0 ? 0.74 : 0.92); g.fill();
        g.strokeStyle = 'rgba(30,20,10,0.55)'; g.lineWidth = Math.max(0.8, k * 2.4); g.stroke(); g.beginPath(); g.moveTo(x1, y1 - ht); g.lineTo(x2, y2 - ht); g.strokeStyle = rgb(it.col, 1.15); g.lineWidth = Math.max(1.2, k * 5.5); g.stroke();
        if (it.tw && k > 0.1) { const r = Math.max(2, k * 12); g.beginPath(); g.rect(x1 - r, y1 - ht - r * 1.4, r * 2, r * 1.6); g.fillStyle = rgb(it.col, 0.95); g.fill(); g.strokeStyle = 'rgba(30,20,10,0.6)'; g.lineWidth = 1; g.stroke(); }
        break;
      }
    }
  }
}
