'use strict';
// ================= SHOW: story, timeline, world render, HUD, FX =================
const F = { cinzel: '700 {s}px Cinzel', fraktur: '400 {s}px UnifrakturMaguntia', garamond: '600 {s}px "EB Garamond"', bodoni: '700 {s}px "Bodoni Moda"', inter: '700 {s}px Inter' };
const fnt = (name, s) => F[name].replace('{s}', s);
const eraFont = y => y < 896 ? 'cinzel' : y < 1458 ? 'fraktur' : y < 1800 ? 'garamond' : y < 1914 ? 'bodoni' : 'inter';
const L2 = (lat, lon) => ll(lat, lon);
// event: y, title, text, key, cam [lat, lon, k], drift (years of progression during hold), night, pins, age, fx
const EVENTS = [
  { y: -50, t: 'The Celts arrive', x: 'The Eravisci tribe builds a fortified settlement on Gellért Hill.', cam: [47.4872, 19.0455, 0.85], drift: 40, pins: [[47.4868, 19.0452, 'Gellért Hill', 90, -80]] },
  { y: 89, t: 'Rome takes the river', x: 'A Roman legion builds a camp here – the start of Aquincum.', key: 1, cam: [47.5390, 19.0425, 0.62], drift: 14, age: 'Roman Age', pins: [[47.5390, 19.0425, 'Aquincum', 110, -90]], fx: 'roman' },
  { y: 106, t: 'A Roman capital', x: 'Aquincum becomes capital of the province Pannonia Inferior.', cam: [47.5410, 19.0430, 0.5], drift: 6 },
  { y: 160, t: 'Two amphitheatres', x: 'Military and civil amphitheatres; around 30,000 people live here (est.).', cam: [47.5470, 19.0455, 0.75], drift: 20, pins: [[47.5445, 19.0478, 'Military amphitheatre', 100, 70], [47.5497, 19.0436, 'Civil amphitheatre', -120, -70]] },
  { y: 433, t: 'Rome withdraws', x: 'The empire collapses and the Huns rule the region.', cam: [47.5420, 19.0430, 0.45], drift: 40 },
  { y: 896, t: 'The Hungarians arrive', x: "Árpád's tribes settle the Carpathian Basin.", key: 1, cam: [47.4960, 19.0480, 0.38], drift: 30, age: 'Magyar Age', fx: 'tents' },
  { y: 1046, t: 'Bishop Gellért', x: 'According to legend, the bishop is thrown from the hill that now bears his name.', cam: [47.4872, 19.0455, 0.85], drift: 12, pins: [[47.4868, 19.0452, 'Gellért Hill', 90, -80]] },
  { y: 1241, t: 'The Mongol invasion', x: 'Pest is burned to the ground.', key: 1, cam: [47.4960, 19.0525, 0.6], drift: 1.2, night: 0.35, fx: 'fire' },
  { y: 1247, t: 'A castle on the hill', x: 'King Béla IV fortifies Castle Hill – Buda is born.', cam: [47.4961, 19.0399, 0.8], drift: 12, age: 'Castle Age', pins: [[47.4961, 19.0399, 'Castle Hill', 90, -90]] },
  { y: 1361, t: 'The royal seat', x: 'Buda becomes the capital of the Kingdom of Hungary.', cam: [47.4975, 19.0420, 0.55], drift: 10 },
  { y: 1458, t: 'Matthias Corvinus', x: 'A Renaissance court and one of Europe\'s greatest libraries.', cam: [47.4961, 19.0399, 0.95], drift: 10, age: 'Renaissance' },
  { y: 1526, t: 'Mohács', x: 'After the Hungarian defeat, Ottoman troops burn Buda.', cam: [47.4985, 19.0390, 0.6], drift: 1, night: 0.2, fx: 'fire' },
  { y: 1541, t: 'The Ottoman era begins', x: 'Buda falls to the Ottomans for 145 years.', key: 1, cam: [47.4975, 19.0420, 0.58], drift: 6, age: 'Ottoman Age', pins: [[47.4950, 19.0365, 'Minaret', -90, -90]] },
  { y: 1575, t: 'Turkish baths', x: 'Rudas and Király baths are built – still in use today.', cam: [47.4893, 19.0471, 1.0], drift: 8, pins: [[47.4893, 19.0471, 'Rudas Baths', 100, -90]] },
  { y: 1686, t: 'The siege of Buda', x: 'The Holy League retakes Buda after a brutal siege.', key: 1, cam: [47.4985, 19.0395, 0.62], drift: 1.4, night: 0.3, fx: 'fire', age: 'Habsburg Age' },
  { y: 1784, t: 'The university moves to Pest', x: 'Pest begins to overtake Buda.', cam: [47.4950, 19.0530, 0.6], drift: 8 },
  { y: 1838, t: 'The Great Flood', x: "The Danube destroys most of Pest's houses.", key: 1, cam: [47.4950, 19.0560, 0.5], drift: 2, fx: 'flood' },
  { y: 1848, t: 'Revolution', x: '15 March: the Hungarian revolution starts in Pest.', cam: [47.4950, 19.0540, 0.62], drift: 1, age: 'Age of Reform' },
  { y: 1849, t: 'The Chain Bridge', x: 'The first permanent bridge across the Danube opens.', key: 1, cam: [47.4992, 19.0437, 1.0], drift: 1, pins: [[47.4992, 19.0437, 'Chain Bridge', 100, -100]] },
  { y: 1873, t: 'Budapest is born', x: 'Buda, Óbuda and Pest merge into one city.', key: 1, cam: [47.5060, 19.0430, 0.26], drift: 2, age: 'Golden Age', fx: 'merge' },
  { y: 1876, t: 'Margaret Bridge', x: 'The second Danube bridge links Margaret Island.', cam: [47.5135, 19.0465, 0.8], drift: 1 },
  { y: 1884, t: 'The Opera House', x: 'Andrássy Avenue gets its jewel.', cam: [47.5025, 19.0580, 1.0], drift: 1, pins: [[47.5025, 19.0580, 'Opera House', 100, -100]] },
  { y: 1896, t: 'The Millennium', x: "1,000 years of Hungary: continental Europe's first underground railway.", key: 1, cam: [47.5060, 19.0470, 0.55], drift: 1, night: 0.85, fx: 'fireworks', promise: 1 },
  { y: 1904, t: 'Parliament completed', x: 'One of the largest parliament buildings in the world.', cam: [47.5071, 19.0446, 1.05], drift: 1, pins: [[47.5071, 19.0446, 'Parliament', 120, -80]] },
  { y: 1905, t: "St Stephen's Basilica", x: 'The basilica is finished after 54 years of construction.', cam: [47.5009, 19.0537, 1.05], drift: 1, pins: [[47.5009, 19.0537, "St Stephen's", 120, -80]] },
  { y: 1920, t: 'Treaty of Trianon', x: 'Hungary loses about two thirds of its territory.', cam: [47.5000, 19.0460, 0.3], drift: 2, age: 'Age of Wars' },
  { y: 1944.9, t: 'The Siege of Budapest', x: '50 days of fighting; every Danube bridge is blown up.', key: 1, hold: 11, cam: [47.5010, 19.0460, 0.42], drift: 0.9, night: 0.45, fx: 'war' },
  { y: 1950, t: 'Greater Budapest', x: 'Surrounding towns join; the city nearly doubles in size.', cam: [47.5000, 19.0480, 0.07], drift: 1, age: 'Socialist Age', fx: 'ring' },
  { y: 1956, t: 'The Uprising', x: 'Students topple the Stalin statue; the revolt is crushed.', key: 1, cam: [47.5125, 19.0820, 0.95], drift: 0.5, night: 0.75, fx: 'statue', pins: [[47.5125, 19.0820, 'Stalin statue', 110, -90]] },
  { y: 1987, t: 'UNESCO', x: 'The Danube banks and Buda Castle become World Heritage.', cam: [47.4990, 19.0420, 0.62], drift: 2, pins: [[47.4961, 19.0399, 'Buda Castle', 100, -90]] },
  { y: 1989, t: 'A new republic', x: 'Hungary is declared a republic on 23 October.', key: 1, cam: [47.5071, 19.0446, 0.95], drift: 0.2, age: 'Modern Age', fx: 'flag', night: 0.2 },
  { y: 2025, t: 'Budapest', x: 'One river, seven road bridges in the centre, 1.7 million people.', key: 1, hold: 9, cam: [47.5000, 19.0440, 0.32], drift: 0, night: 1, fx: 'finale' },
];
const POPT = [[-50, 600], [89, 1500], [106, 6000], [160, 30000], [250, 28000], [433, 6000], [600, 1500], [896, 2500], [1046, 4000], [1240, 6000], [1242, 1500], [1300, 5000], [1361, 9000], [1458, 20000], [1490, 25000], [1526, 22000], [1541, 16000], [1600, 14000], [1685, 12000], [1687, 1000], [1700, 6000], [1787, 46000], [1838, 90000], [1850, 178000], [1869, 280000], [1873, 300000], [1900, 730000], [1910, 880000], [1920, 930000], [1941, 1165000], [1944.8, 1100000], [1945.3, 830000], [1949, 1590000], [1956, 1800000], [1980, 2060000], [1989, 2110000], [2022, 1700000], [2025, 1690000]];
const RULERS = [[-200, 'Celtic tribes (Eravisci)'], [89, 'Roman Empire'], [433, 'Huns / Migration Period'], [896, 'Principality of Hungary'], [1000, 'Kingdom of Hungary'], [1541, 'Ottoman Empire (Buda)'], [1686, 'Habsburg Monarchy'], [1867, 'Austria-Hungary'], [1918, 'Kingdom of Hungary'], [1946, 'Republic of Hungary'], [1949, "Hungarian People's Republic"], [1989, 'Republic of Hungary']];
const CITY = [[-200, 'Eravisci settlement'], [89, 'Aquincum'], [433, 'Aquincum (ruins)'], [896, 'Pest & Óbuda'], [1247, 'Buda / Pest'], [1541, 'Budin / Pest'], [1686, 'Ofen & Pest'], [1873, 'Budapest']];
const BRX = { 'Széchenyi lánchíd': [1849, 1944.9, 1949.6], 'Margit híd': [1876, 1944.9, 1948.5], 'Szabadság híd': [1896, 1944.9, 1946.4], 'Erzsébet híd': [1903, 1944.9, 1964], 'Petőfi híd': [1937, 1944.9, 1952], 'Árpád híd': [1950, 1e9, 1e9], 'Rákóczi híd': [1995, 1e9, 1e9] };
const AGE_PROMISE_T = [88, 92.5];
function tableAt(T, y) { let r = T[0][1]; for (const [a, b] of T) { if (y >= a) r = b; else break; } return r; }
function interp(T, y) { if (y <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (y <= T[i][0]) { const a = T[i - 1], b = T[i], u = (y - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } return T[T.length - 1][1]; }
function bridgesCount(y) { let c = 0; for (const k in BRX) { const [a, d, r] = BRX[k]; if (y >= a && !(y >= d && y < r)) c++; } return c; }
function fmtYear(y) { if (y < 0) return Math.round(-y) + ' BCE'; if (y < 1000) return 'AD ' + Math.max(1, Math.floor(y)); return String(Math.floor(y)); }
function fmtPop(y, p) { const pr = p < 1000 ? Math.round(p / 10) * 10 : p < 10000 ? Math.round(p / 100) * 100 : p < 100000 ? Math.round(p / 1000) * 1000 : Math.round(p / 10000) * 10000; return (y < 1800 || (y > 1944 && y < 1946) ? '~' : '') + pr.toLocaleString('en-US'); }

// ---- timeline
const TLN = { segs: [], total: 0, ev: [] };
function compileTimeline() {
  const segs = []; let t = 0;
  segs.push({ k: 'hook', t0: 0, t1: 3.6 }); segs.push({ k: 'rewind', t0: 3.6, t1: 5.0 }); segs.push({ k: 'promise', t0: 5.0, t1: 10.0 }); t = 10;
  EVENTS.forEach((E, i) => {
    E.e = ll(E.cam[0], E.cam[1]); E.hk = E.hold || (E.key ? 8.2 : 4.8);
    if (i > 0) { const span = Math.abs(E.y - EVENTS[i - 1].y - EVENTS[i - 1].drift), g = 3.4 + Math.log2(1 + span / 20) * 1.0; segs.push({ k: 'gap', i, t0: t, t1: t + g }); t += g; }
    segs.push({ k: 'hold', i, t0: t, t1: t + E.hk }); E.t0 = t; E.t1 = t + E.hk; t += E.hk;
  });
  segs.push({ k: 'split', t0: t, t1: t + 7 }); t += 7; segs.push({ k: 'end', t0: t, t1: t + 4.5 }); t += 4.5;
  TLN.segs = segs; TLN.total = t;
}
const HOOKCAM = () => ({ e: 230, n: -90, k: 0.3 });
function stateAt(t) {
  t = clamp(t, 0, TLN.total - 1e-6); const sg = TLN.segs.find(s => t >= s.t0 && t < s.t1); const u = (t - sg.t0) / (sg.t1 - sg.t0);
  const S0 = { t, sg, u, year: 0, cam: { e: 0, n: 0, k: 0.3 }, night: 0, flood: -1, ev: null, evp: 0, tint: 0 };
  const H = HOOKCAM();
  if (sg.k === 'hook') { S0.year = 1945.35; S0.cam = { e: H.e, n: H.n, k: H.k * (1 + 0.04 * u) }; S0.night = 0.4; return S0; }
  if (sg.k === 'rewind') { const s = u * u * (3 - 2 * u * 0.2); S0.year = lerp(1945.35, -100, clamp(u * u * 1.0 + u * 0.1)); S0.cam = { e: lerp(H.e, 0, u), n: lerp(H.n, -900, u), k: lerp(H.k, 0.5, u) }; S0.night = lerp(0.4, 0, u); return S0; }
  if (sg.k === 'promise') { const e0 = EVENTS[0]; S0.year = lerp(-100, EVENTS[0].y - 4, smooth(u)); S0.cam = { e: lerp(0, e0.e[0], smooth(u)), n: lerp(-900, e0.e[1], smooth(u)), k: lerp(0.5, 0.62, smooth(u)) }; return S0; }
  if (sg.k === 'hold') { const E = EVENTS[sg.i]; S0.ev = E; S0.evp = u; S0.year = E.y + E.drift * u; const kk = E.cam[2] * (1 + 0.05 * u); S0.cam = { e: E.e[0] + (u - 0.5) * 14, n: E.e[1] + (u - 0.5) * 10, k: kk }; S0.night = E.night || 0; if (E.fx === 'flood') S0.flood = smooth(u * 3) * (1 - smooth((u - 0.55) * 2.2)); return S0; }
  if (sg.k === 'gap') { const A = EVENTS[sg.i - 1], B = EVENTS[sg.i], s = smoother(u), ya = A.y + A.drift; S0.year = lerp(ya, B.y, s); const k0 = A.cam[2] * 1.05, k1 = B.cam[2]; const kk = Math.exp(lerp(Math.log(k0), Math.log(k1), s)) * (1 - 0.34 * Math.sin(Math.PI * s)); S0.cam = { e: lerp(A.e[0], B.e[0], s), n: lerp(A.e[1], B.e[1], s), k: kk }; S0.night = lerp(A.night || 0, B.night || 0, s); S0.ev = null; return S0; }
  if (sg.k === 'split') { S0.year = 2025; S0.cam = { e: H.e, n: H.n, k: H.k * (1.04) }; S0.night = 1; S0.wipe = smoother(u); return S0; }
  S0.year = 2025; S0.cam = { e: H.e, n: H.n, k: H.k * 1.04 }; S0.night = 1; S0.wipe = 1; S0.endp = u; return S0;
}
// ---- tint/night/lights
const TINT = [[-1000, [255, 236, 202]], [430, [238, 234, 226]], [1000, [242, 234, 218]], [1541, [226, 242, 242]], [1686, [255, 246, 232]], [1840, [250, 238, 210]], [1914, [238, 240, 246]], [1945, [226, 232, 242]], [1990, [255, 255, 255]]];
function tintAt(y) { let a = TINT[0], b = TINT[0]; for (let i = 0; i < TINT.length; i++) { if (y >= TINT[i][0]) a = TINT[i]; } const ia = TINT.indexOf(a), nb = TINT[Math.min(ia + 1, TINT.length - 1)], span = nb[0] - a[0] || 1, u = clamp((y - a[0]) / span); const sm = ia + 1 < TINT.length ? smooth(clamp((y - (nb[0] - 70)) / 70)) : 0; return mixc(a[1], nb[1], ia + 1 < TINT.length ? sm : 0); }
const URBCOL = y => y < 1000 ? [158, 134, 100] : y < 1541 ? [150, 128, 98] : y < 1900 ? [172, 148, 112] : y < 1990 ? [140, 138, 132] : [128, 134, 134];
const GLOW = (() => { const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d'), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24); gr.addColorStop(0, 'rgba(255,230,150,1)'); gr.addColorStop(0.25, 'rgba(255,190,90,0.55)'); gr.addColorStop(1, 'rgba(255,150,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 48, 48); return c; })();
const PUFF = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; })();
function drawLights(g, year, night, time) {
  if (night < 0.12 || year < 1856) return; const k = CAM.k, a = night * (year < 1890 ? 0.6 : 0.95); g.save(); g.globalCompositeOperation = 'lighter';
  const sz = clamp(k * 44, 5, 30), W2 = W / 2, H2 = H / 2;
  if (year > 1860) { g.globalAlpha = a * 0.5; g.strokeStyle = 'rgb(255,190,100)'; g.lineWidth = Math.max(1.4, k * 4.5); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); for (const r of ROADS) { if (r.c < 2 || r.y > year) continue; const p = r.pts; let st = false; for (let i = 0; i < p.length; i += 2) { const [x, y] = P(p[i], p[i + 1], hAt(p[i], p[i + 1]) + 0.3); if (x < -200 || x > W + 200 || y < -200 || y > H + 200) { st = false; continue; } if (!st) { g.moveTo(x, y); st = true; } else g.lineTo(x, y); } } g.stroke(); }
  g.globalAlpha = a;
  for (let q = 0; q < ITEMS.length; q++) { const it = ITEMS[q]; if (it.k !== 0 || it.s < 5 || it.s === 11 || it.y0 > year || it.y1 <= year) continue; const x = W2 + ((it.e - CAM.e) + (it.n - CAM.n)) * k, y = H2 + ((it.e - CAM.e) - (it.n - CAM.n)) * k * 0.5 - (it.h + 8) * k * VS; if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue; if (hash2(q, 3, 7) < 0.25) continue; g.drawImage(GLOW, x - sz, y - sz, sz * 2, sz * 2); }
  if (year > 1870) for (const b of BRIDGES) { const [a0, d, r] = BRX[b.name] || [0, 1e9, 1e9]; if (year < a0 || (year >= d && year < r)) continue; const pts = b.pts; g.globalAlpha = a * 0.8; g.strokeStyle = 'rgb(255,226,160)'; g.lineWidth = Math.max(2, k * 7); g.beginPath(); pts.forEach(([e, n], i) => { const [x, y] = P(e, n, 8); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.globalAlpha = a; for (let i = 0; i + 1 < pts.length; i++) { const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]), m = Math.max(1, Math.floor(L / 30)); for (let j = 0; j <= m; j++) { const e = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * j / m, n = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * j / m, [x, y] = P(e, n, 10); g.drawImage(GLOW, x - sz * 1.2, y - sz * 1.2, sz * 2.4, sz * 2.4); } } }
  for (const it of ITEMS) { if (it.k !== 2 || it.y0 > year || it.y1 <= year || !['parliament', 'opera', 'basilica', 'palace', 'church', 'citadel'].includes(it.lm)) continue; const [x, y] = P(it.e, it.n, it.h + 14); g.globalAlpha = a * 0.7; const rr = sz * 4.4; g.drawImage(GLOW, x - rr, y - rr * 1.1, rr * 2, rr * 2); }
  g.restore();
}
function grade(g, year, night) {
  const t = tintAt(year); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgb(${t[0] | 0},${t[1] | 0},${t[2] | 0})`; g.fillRect(0, 0, W, H);
  if (night > 0.01) { const n = mixc([255, 255, 255], [84, 98, 156], night); g.fillStyle = `rgb(${n[0] | 0},${n[1] | 0},${n[2] | 0})`; g.fillRect(0, 0, W, H); }
  g.globalCompositeOperation = 'source-over'; const v = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.0); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.32)'); g.fillStyle = v; g.fillRect(0, 0, W, H); g.restore();
}
// ---- bridges with destruction & cables
function drawBridges(g, year, time) {
  const k = CAM.k; for (const b of BRIDGES) {
    const [a0, d, r] = BRX[b.name] || [b.year, 1e9, 1e9]; if (year < a0) continue; const broken = year >= d && year < r, pts = b.pts, wdt = Math.max(2.5, 17 * k * 1.1);
    const path = (f0, f1) => { g.beginPath(); const tot = pts.reduce((s, p, i) => i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0); let acc = 0, started = false; for (let i = 0; i < pts.length; i++) { if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); const u = acc / tot; if (u < f0 - 1e-6 && i < pts.length - 1) continue; const [x, y] = P(pts[i][0], pts[i][1], 7); if (!started) { g.moveTo(x, y); started = true; } else g.lineTo(x, y); if (u > f1) break; } };
    for (const pass of [0, 1]) { g.strokeStyle = pass === 0 ? '#2b2a2a' : (year > 1900 ? '#b4b3b0' : '#bfb08f'); g.lineWidth = pass === 0 ? wdt + 2.4 : wdt; g.lineCap = 'butt'; if (broken) { path(0, 0.2); g.stroke(); path(0.8, 1.01); g.stroke(); } else { path(0, 1.01); g.stroke(); } }
    if (broken) { const m = pts[Math.floor(pts.length / 2)], [x, y] = P(m[0], m[1], 0); g.fillStyle = 'rgba(40,40,44,0.8)'; g.beginPath(); g.ellipse(x, y, wdt * 3.2, wdt * 1.0, 0.3, 0, 7); g.fill(); }
    if (b.name === 'Széchenyi lánchíd' && !broken) { const A = P(pts[0][0], pts[0][1], 8), B = P(pts[pts.length - 1][0], pts[pts.length - 1][1], 8); g.strokeStyle = 'rgba(40,36,34,0.9)'; g.lineWidth = Math.max(1, k * 3.2); for (const off of [-1, 1]) { g.beginPath(); const sag = 1; for (let i = 0; i <= 24; i++) { const u = i / 24, bx = A[0] + (B[0] - A[0]) * u, by = A[1] + (B[1] - A[1]) * u, dip = Math.min(Math.sin(u * Math.PI * 2) ** 2, 1); const ty = -(1 - Math.abs(Math.cos(u * Math.PI * 2)) * 0.0) * 0; const yy = by - 40 * k * VS * Math.abs(Math.sin((u * 2 % 1) * Math.PI)) * 0.0 - 36 * k * VS * (1 - Math.pow(Math.abs(((u * 2) % 1) - 0.5) * 2, 2)) * (u < 0.14 || u > 0.86 ? 0.2 : 1) + off * 3; i ? g.lineTo(bx, yy) : g.moveTo(bx, yy); } g.stroke(); } }
  }
}
// ---- fx
function drawFires(g, year, time, boost) {
  const k = CAM.k, sz = clamp(k * 20, 4, 30), W2 = W / 2, H2 = H / 2; let n = 0; g.save();
  for (let q = 0; q < FIRES.length && n < 700; q++) { const it = FIRES[q]; if (year < it.y0 || year > it.y0 + it.f) continue; const x = W2 + ((it.e - CAM.e) + (it.n - CAM.n)) * k, y = H2 + ((it.e - CAM.e) - (it.n - CAM.n)) * k * 0.5 - it.h * k * VS; if (x < -80 || x > W + 80 || y < -200 || y > H + 80) continue; n++;
    const life = clamp(2.2 * (1 - (year - it.y0) / it.f)); for (let j = 0; j < 3; j++) { const ph = ((time * 0.8 + hash2(q, j, 5)) % 1), rise = ph * sz * 6;
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.34 * life * (1 - ph); const sm = sz * (1.2 + ph * 3.4); g.fillStyle = '#2a2624'; g.beginPath(); g.arc(x + ph * sz * 2.6 + (j - 1) * sz * 0.4, y - sz * 0.8 - rise * 1.6, sm * 0.55, 0, 7); g.fill();
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = (0.85 * life) * (1 - ph * 0.7); g.drawImage(GLOW, x + (j - 1) * sz * 0.5 - sz * 1.1, y - sz * 0.5 - rise * 0.6 - sz * 1.1, sz * 2.2, sz * 2.2); } }
  g.restore();
}
function burst(g, x, y, r, age, hue = 30) { if (age < 0 || age > 1) return; g.save(); g.globalCompositeOperation = 'lighter'; const a = 1 - age; const gr = g.createRadialGradient(x, y, 0, x, y, r * (0.4 + age * 1.6)); gr.addColorStop(0, `rgba(255,${230 - age * 80 | 0},${180 - age * 120 | 0},${a})`); gr.addColorStop(0.4, `rgba(255,${130 + hue},40,${a * 0.6})`); gr.addColorStop(1, 'rgba(255,60,10,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * (0.4 + age * 1.6), 0, 7); g.fill(); g.restore(); }
function smokeCol(g, x, y, h, time, a, w) { g.save(); for (let j = 0; j < 14; j++) { const ph = (time * 0.35 + j / 14) % 1, py = y - ph * h, px = x + Math.sin(ph * 5 + j) * w * ph + ph * w * 0.9, r = w * (0.5 + ph * 1.3); g.globalAlpha = a * (1 - ph) * (ph < 0.08 ? ph / 0.08 : 1); g.fillStyle = '#34302e'; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); } g.restore(); }
function drawFx(g, S, time) {
  const E = S.ev, year = S.year, k = CAM.k; const sz = clamp(k * 20, 4, 28);
  if (year > 1944.8 && year < 1948 && (E && E.fx === 'war' || S.sg.k === 'hook' || S.sg.k === 'gap' || S.sg.k === 'hold')) { // smoke over ruined core
    const inten = year < 1946 ? 1 : 1 - (year - 1946) / 2; for (let j = 0; j < 26; j++) { const e = CORE[0] + (hash2(j, 1, 9) - 0.5) * 3600, n = CORE[1] + (hash2(j, 2, 9) - 0.5) * 3600, [x, y] = P(e, n, hAt(e, n)); if (x < -100 || x > W + 100 || y < -50 || y > H + 200) continue; smokeCol(g, x, y, 260 * k * 4 + 80, time + j * 0.37, 0.4 * inten, 22 * clamp(k * 3, 0.8, 3)); }
  }
  if (E && E.fx === 'war' && S.sg.k === 'hold') { // explosions on bridges
    for (const b of BRIDGES) { const [a0, d, r] = BRX[b.name] || [0, 1e9, 1e9]; if (d > 2000) continue; const idx = Object.keys(BRX).indexOf(b.name), age = (year - d - idx * 0.012) / 0.06; const m = b.pts[Math.floor(b.pts.length / 2)], [x, y] = P(m[0], m[1], 8); burst(g, x, y, 150 * clamp(k * 3, 0.7, 2.4), age); if (age > 0 && age < 1.2) { g.save(); g.strokeStyle = `rgba(255,230,190,${0.8 * (1 - age / 1.2)})`; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 40 + age * 260 * clamp(k * 3, 0.7, 2), 14 + age * 90 * clamp(k * 3, 0.7, 2), 0, 0, 7); g.stroke(); g.restore(); } if (age > 0) smokeCol(g, x, y, 190 * clamp(k * 4, 1, 3), time + idx, clamp(age * 3, 0, 0.55), 22 * clamp(k * 3, 0.8, 2.6)); }
  }
  if (E && E.fx === 'fireworks') { // fireworks over the river
    const c = P(240, -60, 40); for (let j = 0; j < 9; j++) { const tt = (S.evp * 7.4 * 0.9 + j * 0.37) % 1.4, cyc = Math.floor(S.evp * 7.4 * 0.9 / 1.4 + j * 0.26), ex = c[0] + (hash2(j, cyc, 3) - 0.5) * 900, ey = c[1] - 160 - hash2(j, cyc, 4) * 250, age = tt / 1.4; if (age > 1) continue; g.save(); g.globalCompositeOperation = 'lighter'; const hue = hash2(j, cyc, 5) * 360; for (let r = 0; r < 28; r++) { const a = r / 28 * 6.283, d = Math.sqrt(age) * 110, px = ex + Math.cos(a) * d, py = ey + Math.sin(a) * d * 0.8 + age * age * 50; g.fillStyle = `hsla(${hue},95%,65%,${(1 - age) * 0.95})`; g.beginPath(); g.arc(px, py, 3.2 * (1 - age * 0.5), 0, 7); g.fill(); } g.restore(); }
  }
  if (E && E.fx === 'flood') { /* water drawn in shader */ }
  if (E && E.fx === 'merge') { const p = smooth(S.evp * 1.4), cs = [[NUC[0].p, [120, 190, 255]], [NUC[3].p, [255, 140, 120]], [NUC[4].p, [140, 235, 150]]]; g.save(); g.lineWidth = 5; for (const [c, col] of cs) { const e = lerp(c[0], CORE[0], p), n = lerp(c[1], CORE[1], p), r = lerp(1500, 3600, p), mixcol = mixc(col, [255, 214, 90], p); g.strokeStyle = `rgba(${mixcol[0] | 0},${mixcol[1] | 0},${mixcol[2] | 0},${0.9})`; g.fillStyle = `rgba(${mixcol[0] | 0},${mixcol[1] | 0},${mixcol[2] | 0},0.09)`; g.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * 6.283, [x, y] = P(e + Math.cos(a) * r, n + Math.sin(a) * r, 0); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fill(); g.stroke(); } g.restore(); }
  if (E && E.fx === 'ring') { const p = smooth(S.evp * 1.6), r = lerp(8000, 13500, p); g.save(); g.setLineDash([26, 14]); g.lineWidth = 6; g.strokeStyle = `rgba(255,214,90,0.95)`; g.beginPath(); for (let i = 0; i <= 96; i++) { const a = i / 96 * 6.283, [x, y] = P(CORE[0] + Math.cos(a) * r * 1.05, CORE[1] + Math.sin(a) * r, 0); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke(); g.setLineDash([]); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 96; i++) { const a = i / 96 * 6.283, [x, y] = P(CORE[0] + Math.cos(a) * 5200, CORE[1] + Math.sin(a) * 5000, 0); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke(); g.restore(); }
  if (E && E.fx === 'statue') { const e = ll(47.5125, 19.0820), [x, y] = P(e[0], e[1], hAt(e[0], e[1])), fall = smooth((S.evp - 0.45) / 0.3), s = clamp(k * 40, 6, 46); g.save(); g.translate(x, y); g.fillStyle = 'rgba(15,20,10,0.3)'; g.beginPath(); g.ellipse(s * 0.6, s * 0.1, s * 1.0, s * 0.35, 0, 0, 7); g.fill(); g.fillStyle = '#9b9a94'; g.fillRect(-s * 0.5, -s * 1.1, s, s * 1.1); g.strokeStyle = '#34322e'; g.lineWidth = 1.2; g.strokeRect(-s * 0.5, -s * 1.1, s, s * 1.1); g.translate(0, -s * 1.1); g.rotate(fall * 1.45); g.translate(fall * s * 0.4, 0); g.fillStyle = '#4a4c4a'; g.fillRect(-s * 0.28, -s * 2.0, s * 0.56, s * 2.0); g.beginPath(); g.arc(0, -s * 2.15, s * 0.3, 0, 7); g.fill(); g.restore(); if (fall > 0.9) smokeCol(g, x, y, 120, time, 0.45, 18); }
  if (E && E.fx === 'flag') { const e = ll(47.5071, 19.0446), [x, y] = P(e[0], e[1], 70), s = clamp(k * 38, 10, 60); g.save(); g.strokeStyle = '#3a3836'; g.lineWidth = Math.max(1.5, s * 0.08); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - s * 2.6); g.stroke(); const cols = ['#ce2939', '#ffffff', '#477050'], fw = s * 2.3, fh = s * 1.5, slices = 28, appear = clamp(S.evp * 3); for (let i = 0; i < slices; i++) { const u = i / slices, wv = Math.sin(u * 7 - time * 6) * s * 0.09 * u; for (let r = 0; r < 3; r++) { g.fillStyle = cols[r]; g.fillRect(x + u * fw * appear, y - s * 2.6 + r * fh / 3 + wv, fw / slices * appear + 1, fh / 3 + 1); } } g.restore(); }
  if (E && E.fx === 'roman') { /* walls draw themselves via year */ }
}
// ---- world render
function renderWorld(g, S, time, opt = {}) {
  CAM.e = S.cam.e; CAM.n = S.cam.n; CAM.k = S.cam.k; const year = S.year;
  drawTerrain(year, time, S.flood, URBCOL(year)); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.drawImage(glc, 0, 0);
  drawRoads(g, year); drawBridges(g, year, time); drawItems(g, year); drawAgents(g, S, time); drawActs(g, S, time); grade(g, year, S.night); drawFires(g, year, time); drawFx(g, S, time); drawActsFx(g, S, time); drawLights(g, year, S.night, time);
}
// ---- HUD
function wrapText(g, text, x, y, maxW, lh) { const words = text.split(' '); let line = ''; const lines = []; for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; } lines.push(line); lines.forEach((l, i) => g.fillText(l, x, y + i * lh)); return lines.length; }
function shadowText(g, txt, x, y, blur = 10) { g.save(); g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = blur; g.fillText(txt, x, y); g.restore(); }
const AGES_SHOWN = {};
function drawHUD(g, S) {
  const t = S.t, year = S.year, E = S.ev, sg = S.sg; const acc = '#ffb347';
  // top-left shading
  const sh = g.createRadialGradient(0, 0, 0, 0, 0, 760); sh.addColorStop(0, 'rgba(0,0,0,0.6)'); sh.addColorStop(0.6, 'rgba(0,0,0,0.25)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, 0, 800, 520);
  if (sg.k !== 'end' && sg.k !== 'split') {
    g.textBaseline = 'alphabetic'; g.fillStyle = '#fff'; g.font = '800 132px Inter'; const ys = (sg.k === 'hook') ? 'AD 1945' : fmtYear(year); shadowText(g, ys, 56, 150, 16);
    g.font = '600 46px Inter'; g.fillStyle = '#ffe9b8'; const cn = tableAt(CITY, year); shadowText(g, cn, 62, 206, 10);
  }
  // minimap (AoE-style diamond), top-right
  { const mw = 300, mh = 150, mx = W - 60 - mw, my = 56; g.save(); g.fillStyle = 'rgba(8,10,14,0.72)'; g.strokeStyle = '#c9a44c'; g.lineWidth = 3; g.fillRect(mx - 8, my - 8, mw + 16, mh + 16); g.strokeRect(mx - 8, my - 8, mw + 16, mh + 16); const N = 48; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const e = BB[0] + (i + 0.5) / N * (BB[2] - BB[0]), n = BB[1] + (j + 0.5) / N * (BB[3] - BB[1]), x = mx + mw / 2 + ((e - BB[0]) / (BB[2] - BB[0]) + (n - BB[1]) / (BB[3] - BB[1]) - 1) * mw / 2, y = my + mh / 2 + ((e - BB[0]) / (BB[2] - BB[0]) - (n - BB[1]) / (BB[3] - BB[1])) * mh / 2; const wat = isWater(e, n), u = urbAt(e, n) <= year; g.fillStyle = wat ? '#2f6ea5' : u ? '#d9b36a' : (hAt(e, n) > 55 ? '#3b6b3c' : '#6f9a4a'); g.fillRect(x - 3.2, y - 1.8, 6.4, 3.6); }
    g.strokeStyle = '#fff'; g.lineWidth = 2; const vw = W / CAM.k, vh = H / CAM.k; const cx = mx + mw / 2 + ((CAM.e - BB[0]) / (BB[2] - BB[0]) + (CAM.n - BB[1]) / (BB[3] - BB[1]) - 1) * mw / 2, cy = my + mh / 2 + ((CAM.e - BB[0]) / (BB[2] - BB[0]) - (CAM.n - BB[1]) / (BB[3] - BB[1])) * mh / 2; const rw = clamp(vw / (BB[2] - BB[0]) * mw * 0.5, 6, mw * 0.45), rh = clamp(vh * 0.35 / (BB[3] - BB[1]) * mh, 4, mh * 0.45); g.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh); g.restore(); }
  // stats (left, above timeline)
  if (sg.k !== 'hook' && sg.k !== 'rewind' && sg.k !== 'promise' && sg.k !== 'end') { const x0 = 58, y0 = 650; g.fillStyle = 'rgba(8,10,14,0.62)'; g.fillRect(x0 - 14, y0 - 34, 470, 236); g.strokeStyle = 'rgba(201,164,76,0.85)'; g.lineWidth = 3; g.strokeRect(x0 - 14, y0 - 34, 470, 236);
    const rows = [['POPULATION', fmtPop(year, interp(POPT, year))], ['RULED BY', tableAt(RULERS, year)], ['DANUBE BRIDGES', String(bridgesCount(year))]]; rows.forEach(([a, b], i) => { g.fillStyle = '#c9a44c'; g.font = '600 24px Inter'; g.fillText(a, x0, y0 + i * 72); g.fillStyle = '#fff'; g.font = '700 38px Inter'; let fs = 38; while (g.measureText(b).width > 440 && fs > 24) { fs -= 2; g.font = `700 ${fs}px Inter`; } g.fillText(b, x0, y0 + 40 + i * 72 - 4); }); }
  // timeline (separate bar, ticks above, year labels below)
  { const x0 = 70, x1 = W - 70, yb = 916, tot = TLN.total, prog = t / tot, acc2 = '#ffb347', xOf = Ev => x0 + (Ev.t0 + Ev.hk * 0.5) / tot * (x1 - x0);
    g.fillStyle = 'rgba(6,8,12,0.66)'; g.fillRect(0, yb - 42, W, 86);
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(x0, yb - 4, x1 - x0, 8); g.fillStyle = acc2; g.fillRect(x0, yb - 4, (x1 - x0) * prog, 8);
    for (const Ev of EVENTS) { const xx = xOf(Ev); g.fillStyle = Ev.key ? '#ffffff' : 'rgba(255,255,255,0.5)'; const hh = Ev.key ? 26 : 13; g.fillRect(xx - (Ev.key ? 1.5 : 1), yb - 4 - hh, Ev.key ? 3 : 2, hh); }
    const prio = [2025, 1944.9, 1896, 1873, 89, 1241, 1541, 1686, 896, 1956, 1989, 1849, 1838], placed = []; g.font = '600 24px Inter'; g.textAlign = 'center'; g.fillStyle = '#ffd27a';
    for (const y of prio) { const Ev = EVENTS.find(e => e.y === y); if (!Ev) continue; const xx = xOf(Ev); if (placed.some(p => Math.abs(p - xx) < 84)) continue; placed.push(xx); g.fillText(Ev.y > 2000 ? 'Today' : (Ev.y < 1000 ? 'AD ' + Math.floor(Ev.y) : String(Math.floor(Ev.y))), xx, yb + 34); }
    g.textAlign = 'left'; const px = x0 + (x1 - x0) * prog; g.fillStyle = acc2; g.beginPath(); g.arc(px, yb, 10, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke(); }
  // event card
  if (E && sg.k === 'hold') { const T = E.hk, secs = S.evp * T, a = Math.min(smooth(secs / 0.55), smooth((T - secs) / 0.55)); if (a > 0.01) { g.save(); g.globalAlpha = a; const cx = 560, cw = 1300, cy = 668; const bg = g.createLinearGradient(0, cy - 40, 0, cy + 190); bg.addColorStop(0, 'rgba(6,8,12,0)'); bg.addColorStop(0.28, 'rgba(6,8,12,0.72)'); bg.addColorStop(1, 'rgba(6,8,12,0.82)'); g.fillStyle = bg; g.fillRect(cx - 40, cy - 60, cw + 40, 260);
      const fn = eraFont(E.y); g.fillStyle = E.key ? '#ffd27a' : '#fff'; g.font = fnt(fn, 68); shadowText(g, E.t, cx, cy + 36, 8); g.fillStyle = '#f2f2f2'; g.font = '500 36px Inter'; wrapText(g, E.x, cx, cy + 96, 1280, 46); g.restore(); } }
  // pins
  if (E && sg.k === 'hold' && E.pins) { const a = smooth((S.evp * E.hk - 0.7) / 0.5) * smooth((E.hk - S.evp * E.hk - 0.1) / 0.5); if (a > 0.01) for (const [la, lo, txt, dx, dy] of E.pins) { const [e, n] = ll(la, lo), [x, y] = P(e, n, hAt(e, n) + 10); g.save(); g.globalAlpha = a; g.strokeStyle = '#ffb347'; g.fillStyle = '#ffb347'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + dy); g.stroke(); g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.font = '700 32px Inter'; const tw = g.measureText(txt).width + 28, bx = dx < 0 ? x + dx - tw : x + dx; g.fillStyle = 'rgba(8,10,14,0.85)'; g.fillRect(bx, y + dy - 30, tw, 46); g.strokeStyle = '#ffb347'; g.lineWidth = 2; g.strokeRect(bx, y + dy - 30, tw, 46); g.fillStyle = '#fff'; g.fillText(txt, bx + 14, y + dy + 4); g.restore(); } }
  // age banner
  if (E && sg.k === 'hold' && E.age) { const secs = S.evp * E.hk, a = Math.min(smooth(secs / 0.4), smooth((2.8 - secs) / 0.5)); if (a > 0.01) { g.save(); g.globalAlpha = a; const bw = 640, bh = 96, bx = W / 2 - bw / 2 - 100, by = 56 + (1 - smooth(secs / 0.5)) * -30; const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#6b1520'); gr.addColorStop(0.5, '#a3202e'); gr.addColorStop(1, '#6b1520'); g.fillStyle = gr; g.fillRect(bx, by, bw, bh); g.strokeStyle = '#e6c15a'; g.lineWidth = 5; g.strokeRect(bx, by, bw, bh); g.fillStyle = '#f4dfa0'; g.font = '600 22px Inter'; g.textAlign = 'center'; g.fillText('NEW AGE', W / 2 - 100, by + 30); g.fillStyle = '#fff'; g.font = '700 46px Inter'; g.fillText(E.age.toUpperCase(), W / 2 - 100, by + 76); g.textAlign = 'left'; g.restore(); } }
  if (E && E.promise && sg.k === 'hold') { const secs = S.evp * E.hk, a = Math.min(smooth((secs - 0.5) / 0.4), smooth((4.8 - secs) / 0.5)); if (a > 0.01) { g.save(); g.globalAlpha = a; g.fillStyle = '#2f9e44'; g.fillRect(W / 2 - 110, 175, 330, 56); g.fillStyle = '#fff'; g.font = '800 30px Inter'; g.textAlign = 'center'; g.fillText('PROMISE KEPT ✓', W / 2 + 55, 214); g.textAlign = 'left'; g.restore(); } }
  // open loop at ~1:30
  if (t > AGE_PROMISE_T[0] && t < AGE_PROMISE_T[1]) { const a = Math.min(smooth((t - AGE_PROMISE_T[0]) / 0.4), smooth((AGE_PROMISE_T[1] - t) / 0.4)); g.save(); g.globalAlpha = a * 0.92; const sp = landmark('parliament', 2); const sc = 1.1, px = W - 500, py = 470; g.shadowColor = '#ffd27a'; g.shadowBlur = 30; g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.55; g.drawImage(sp.c, px - sp.ox * sc, py - sp.oy * sc, sp.c.width * sc, sp.c.height * sc); g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0; g.globalAlpha = a; g.font = '800 64px Inter'; g.fillStyle = '#fff'; g.textAlign = 'center'; shadowText(g, 'Wait for 1896', W - 380, 560, 14); g.textAlign = 'left'; g.restore(); }
  // intro / outro texts
  if (sg.k === 'hook') { const a = Math.min(smooth(S.u * 8), 1) * (1 - smooth((S.u - 0.88) / 0.12)); g.save(); g.globalAlpha = a; g.font = '800 128px Inter'; g.textAlign = 'center'; g.fillStyle = '#fff'; shadowText(g, 'Every bridge.', W / 2, 400, 20); g.fillStyle = '#ff5a4a'; shadowText(g, 'Destroyed.', W / 2, 540, 20); g.restore(); }
  if (sg.k === 'rewind') { g.save(); g.globalAlpha = 0.9; g.font = '800 120px Inter'; g.fillStyle = '#fff'; g.textAlign = 'right'; shadowText(g, '◀◀', W - 70, 190, 12); g.restore(); for (let i = 0; i < 36; i++) { const yy = (hash2(i, Math.floor(t * 20), 2) * H) | 0; g.fillStyle = `rgba(255,255,255,${0.05 + 0.1 * hash2(i, 3, 3)})`; g.fillRect(0, yy, W, 2 + hash2(i, 5, 5) * 5); } }
  if (sg.k === 'promise') { g.save(); g.textAlign = 'center'; g.font = '800 92px Inter'; const lines = ['2,000 years.', 'One river.', 'Three cities that became one.']; const sz = [92, 92, 70]; lines.forEach((l, i) => { const a = smooth((S.u * 5 - i * 1.15) / 0.5) * (1 - smooth((S.u - 0.93) / 0.07)); g.globalAlpha = a; g.fillStyle = i === 2 ? '#ffd27a' : '#fff'; g.font = `800 ${sz[i]}px Inter`; shadowText(g, l, W / 2, 400 + i * 120, 20); }); g.restore(); }
  if (sg.k === 'end') { const a = smooth(S.u * 4); g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 380, W, 220); g.fillStyle = '#fff'; g.font = '800 84px Inter'; shadowText(g, 'Which city should we rewind next?', W / 2, 520, 18); g.restore(); }
  if (sg.k === 'split') { g.save(); g.textAlign = 'center'; g.font = '800 54px Inter'; g.fillStyle = '#fff'; const dv = W * S.wipe; if (S.wipe > 0.12) shadowText(g, 'TODAY', Math.max(260, dv * 0.5), 190, 14); if (S.wipe < 0.88) shadowText(g, 'AD 1945', Math.min(W - 260, dv + (W - dv) * 0.5), 190, 14); g.restore(); }
}
