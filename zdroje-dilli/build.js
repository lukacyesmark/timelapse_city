'use strict';
// ================= BUILD: city generation, lifecycles, landmarks, walls =================
let ITEMS = [], FIRES = [], NBLD = 0;
const PEST = ll(47.4960, 19.0525), BUDA = ll(47.4985, 19.0385);
const CORE = [(PEST[0] + BUDA[0]) / 2, (PEST[1] + BUDA[1]) / 2];
const dist2 = (e, n, c) => Math.hypot(e - c[0], n - c[1]);
function styleFor(y, e, n, r, h) {
  const dp = dist2(e, n, PEST), core = dp < 3600;
  if (y < 430) return 1;
  if (y < 1541) return 3;
  if (y < 1686) return r < 0.7 ? 4 : 3;
  if (y < 1860) return (core || y < 1800) ? 5 : (r < 0.5 ? 10 : 5);
  if (y < 1914) return core ? (r < 0.8 ? 6 : 5) : (dp < 6000 ? (r < 0.5 ? 6 : 10) : (r < 0.7 ? 10 : 5));
  if (y < 1945) return core ? (r < 0.65 ? 7 : 6) : (dp < 6500 ? (r < 0.5 ? 7 : 10) : 10);
  if (y < 1990) return core ? (r < 0.5 ? 7 : r < 0.75 ? 8 : 6) : (r < 0.5 ? 8 : r < 0.75 ? 10 : 7);
  return core ? (r < 0.4 ? 9 : r < 0.75 ? 7 : 6) : (r < 0.25 ? 9 : r < 0.6 ? 10 : 7);
}
const DESTR = [
  { y: 1241, c: PEST, r: 900, frac: 0.95, delay: [8, 30], fire: 2 },
  { y: 1526, c: BUDA, r: 1500, frac: 0.45, delay: [12, 30], fire: 1.5 },
  { y: 1686, c: BUDA, r: 1700, frac: 0.92, delay: [10, 50], fire: 2.8 },
  { y: 1838, c: PEST, r: 4200, frac: 0.86, delay: [2, 12], fire: 0, flood: 9.5 },
  { y: 1944.9, c: CORE, r: 4600, frac: 0.55, delay: [3, 10], fire: 1.1 },
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
      const r1 = rnd(), spread = U < 450 ? 10 : U < 1700 ? 40 : 28, y0 = U + 2 + rnd() * spread;
      if (y0 > 2024) continue;
      // density thinning near edges of growth & hills
      if (h > 75 && rnd() < 0.5) continue; if (h > 55 && rnd() < 0.15) continue;
      let sty = styleFor(y0, e, n, r1, h); if (h > 38 && y0 > 1860 && rnd() < 0.6) sty = 10;
      const sc = 0.82 + rnd() * 0.42, vr = Math.floor(rnd() * 16);
      const seg = { e, n, h, y0, y1: 1e9, s: sty, v: vr, sc, k: 0, f: 0 };
      // roman abandonment
      if (sty === 1) { seg.y1 = 430 + rnd() * 70; items.push(seg); const re = rnd() < 0.55 ? 1150 + rnd() * 700 : 1e9; items.push({ e, n, h, y0: seg.y1, y1: re, s: 2, v: vr, sc: 1, k: 0, f: 0 }); if (re < 1e9) { const y2 = re, st2 = styleFor(y2, e, n, rnd(), h); items.push({ e, n, h, y0: y2, y1: 1e9, s: st2, v: vr, sc, k: 0, f: 0 }); } continue; }
      // 19th century replacement of old houses in the Pest core
      if (y0 < 1860 && sty !== 1) { const dp = dist2(e, n, PEST), dbu = dist2(e, n, BUDA), castle = dbu < 800 && h > 25; const rep = castle ? 0 : (dp < 3400 ? 0.85 : dbu < 2400 ? 0.4 : 0.2); if (rnd() < rep) { const yr = 1866 + rnd() * 44; seg.y1 = yr; items.push(seg); items.push({ e, n, h, y0: yr, y1: 1e9, s: styleFor(yr + 1, e, n, rnd(), h), v: vr, sc, k: 0, f: 0 }); continue; } }
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
    const dens = park ? 0.55 : h > 42 ? 0.7 : h > 20 ? 0.18 : 0.04; if (rnd() > dens) continue;
    const sl = Math.hypot(hAt(ee + 12, nn) - hAt(ee - 12, nn), hAt(ee, nn + 12) - hAt(ee, nn - 12)) / 24; if (sl > 0.75) continue;
    const y1 = park ? 1e9 : (U > 2100 ? 1e9 : U + 10 + rnd() * 25); if (!park && U < 2100 && h < 20) continue;
    items.push({ e: ee, n: nn, h, y0: -9999, y1, s: h > 70 && rnd() < 0.55 ? 21 : 20, v: Math.floor(rnd() * 16), sc: 0.8 + rnd() * 0.6, k: 1, f: 0 });
  }
  // landmarks
  addLandmarks(items);
  for (const it of items) it.key = (it.e - it.n);
  items.sort((a, b) => a.key - b.key);
  return items.length;
}
function peakNear(c, r) { let best = -1, be = c[0], bn = c[1]; for (let e = c[0] - r; e <= c[0] + r; e += 12) for (let n = c[1] - r; n <= c[1] + r; n += 12) { const h = hAt(e, n); if (h > best) { best = h; be = e; bn = n; } } return [be, bn, best]; }
let GELLERT, CASTLEHILL;
function lmk(items, name, lat, lon, y0, y1, sc = 1, extra = {}) { const [e, n] = Array.isArray(lat) ? lat : ll(lat, lon); items.push(Object.assign({ e, n, h: hAt(e, n), y0, y1, s: 100, lm: name, v: 0, sc, k: 2, f: 0 }, extra)); }
function addLandmarks(items) {
  GELLERT = peakNear(ll(47.4862, 19.0452), 350);
  // Celtic oppidum: huts on Gellért Hill
  for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 150, e = GELLERT[0] + Math.cos(a) * r, n = GELLERT[1] + Math.sin(a) * r * 0.8; if (hAt(e, n) < GELLERT[2] * 0.55) { i--; if (rnd() < 0.2) i++; continue; } items.push({ e, n, h: hAt(e, n), y0: -85 + rnd() * 25, y1: 98 + rnd() * 10, s: 0, v: i, sc: 0.9 + rnd() * 0.4, k: 0, f: 0 }); }
  // Hungarian tents (896) near Pest
  { const pc = ll(47.4965, 19.0520); for (let i = 0; i < 44; i++) { const e = pc[0] + (rnd() - 0.5) * 1100, n = pc[1] + (rnd() - 0.5) * 900; if (isWater(e, n) || hAt(e, n) < 0.5) { i--; continue; } items.push({ e, n, h: hAt(e, n), y0: 896 + rnd() * 10, y1: 1060, s: 22, v: i + 3, sc: 1.5, k: 0, f: 0 }); } }
  // Roman amphitheatres (approximate)
  lmk(items, 'amph', 47.5445, 19.0478, 140, 430, 1.0); lmk(items, 'amph', 47.5497, 19.0436, 160, 430, 0.9);
  // Roman Contra-Aquincum fort small hall; Buda castle & palace
  CASTLEHILL = ll(47.4961, 19.0399);
  lmk(items, 'castle', CASTLEHILL, 0, 1255, 1686, 1.0); lmk(items, 'church', 47.5019, 19.0343, 1260, 1e9, 1.0);
  lmk(items, 'palace', CASTLEHILL, 0, 1749, 1944.9, 1.0); lmk(items, 'palace', CASTLEHILL, 0, 1961, 1e9, 1.0, { rb: 1 });
  lmk(items, 'citadel', 47.4864, 19.0460, 1854, 1e9, 1.0);
  lmk(items, 'bath', 47.4893, 19.0471, 1572, 1e9, 1.0); lmk(items, 'bath', 47.5069, 19.0361, 1578, 1e9, 0.9);
  for (const [la, lo] of [[47.4950, 19.0365], [47.5010, 19.0330], [47.4975, 19.0545], [47.4930, 19.0555], [47.5035, 19.0390]]) lmk(items, 'minaret', la, lo, 1543, 1700 + hash2(la * 1e4 | 0, lo * 1e4 | 0, 2) * 20, 1.0);
  lmk(items, 'parliament', 47.5071, 19.0446, 1896, 1e9, 1.0); lmk(items, 'opera', 47.5025, 19.0580, 1884, 1e9, 1.0); lmk(items, 'basilica', 47.5009, 19.0537, 1905, 1e9, 1.0);
  // Chain Bridge towers
  const cb = BRIDGES.find(b => b.name === 'Széchenyi lánchíd'); if (cb) { const [a, b] = [cb.pts[0], cb.pts[cb.pts.length - 1]]; for (const t of [0.14, 0.86]) lmk(items, 'bridge_tower', [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], 0, 1849, 1e9, 1.0, { h: 0, destroyYear: 1944.9, rebuildYear: 1949.6 }); }
}
// ---- wall segments (Roman fort, Pest wall, castle-hill walls, palisade)
let WALLS = [];
function contour(cx, cy, half, level, step = 14) {
  const out = [], nx = Math.floor(2 * half / step); const g = []; for (let j = 0; j <= nx; j++) { g.push([]); for (let i = 0; i <= nx; i++) g[j].push(hAt(cx - half + i * step, cy - half + j * step)); }
  for (let j = 0; j < nx; j++) for (let i = 0; i < nx; i++) {
    const v = [g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]], px = [[0, 0], [1, 0], [1, 1], [0, 1]], pts = [];
    for (let q = 0; q < 4; q++) { const a = v[q], b = v[(q + 1) % 4]; if ((a < level) !== (b < level)) { const t = (level - a) / (b - a), pa = px[q], pb = px[(q + 1) % 4]; pts.push([cx - half + (i + pa[0] + (pb[0] - pa[0]) * t) * step, cy - half + (j + pa[1] + (pb[1] - pa[1]) * t) * step]); } }
    if (pts.length >= 2) out.push([pts[0], pts[1]]); if (pts.length === 4) out.push([pts[2], pts[3]]);
  }
  return out;
}
function addWalls() {
  WALLS = [];
  const add = (a, b, y0, y1, ht, col, tw) => WALLS.push({ a, b, y0, y1, ht, col, tw: tw || 0 });
  // Roman castra (legionary fortress, Óbuda) – rotated rectangle with towers
  const c = ll(47.5395, 19.0415), rot = 0.33, hw = 225, hl = 270, R = (u, v) => [c[0] + u * Math.cos(rot) + v * Math.sin(rot), c[1] - u * Math.sin(rot) + v * Math.cos(rot)];
  const cs = [R(-hw, -hl), R(hw, -hl), R(hw, hl), R(-hw, hl)];
  for (let i = 0; i < 4; i++) { const a = cs[i], b = cs[(i + 1) % 4], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 30)); for (let q = 0; q < m; q++) add([a[0] + (b[0] - a[0]) * q / m, a[1] + (b[1] - a[1]) * q / m], [a[0] + (b[0] - a[0]) * (q + 1) / m, a[1] + (b[1] - a[1]) * (q + 1) / m], 89 + (i + q * 0.02) * 1.5, 440, 12, [196, 170, 130], q % 6 === 0); }
  // Pest town wall (stylised along today's Small Boulevard)
  const pw = [[47.4868, 19.0535], [47.4874, 19.0577], [47.4916, 19.0611], [47.4948, 19.0616], [47.4975, 19.0560], [47.4985, 19.0495], [47.4996, 19.0462]].map(p => ll(p[0], p[1]));
  for (let i = 0; i + 1 < pw.length; i++) { const a = pw[i], b = pw[i + 1], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 28)); for (let q = 0; q < m; q++) add([a[0] + (b[0] - a[0]) * q / m, a[1] + (b[1] - a[1]) * q / m], [a[0] + (b[0] - a[0]) * (q + 1) / m, a[1] + (b[1] - a[1]) * (q + 1) / m], 1250 + (q % 3) * 6, 1790 + hash2(i, q, 5) * 60, 8, [196, 184, 160], q % 4 === 0); }
  // Buda castle-hill walls from terrain contour
  const ch = peakNear(CASTLEHILL, 200), lv = ch[2] * 0.72, seg = contour(CASTLEHILL[0], CASTLEHILL[1] + 20, 620, lv, 16);
  seg.forEach(([a, b], i) => { if (Math.hypot(a[0] - CASTLEHILL[0], a[1] - CASTLEHILL[1]) < 560) add(a, b, 1255 + (i % 7) * 4, 1850 + (i % 9) * 8, 8, [196, 182, 156], i % 5 === 0); });
  // Celtic palisade on Gellért Hill
  const gl = GELLERT[2] * 0.66, seg2 = contour(GELLERT[0], GELLERT[1], 380, gl, 14); seg2.forEach(([a, b], i) => add(a, b, -80, 100, 3.2, [150, 112, 70], 0));
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
