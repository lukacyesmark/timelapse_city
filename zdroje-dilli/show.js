'use strict';
// ================= SHOW: story, timeline, world render, HUD, FX =================
const F = { cinzel: '700 {s}px Cinzel', fraktur: '400 {s}px UnifrakturMaguntia', garamond: '600 {s}px "EB Garamond"', bodoni: '700 {s}px "Bodoni Moda"', inter: '700 {s}px Inter' };
const fnt = (name, s) => F[name].replace('{s}', s);
const eraFont = y => y < 1206 ? 'cinzel' : y < 1803 ? 'garamond' : y < 1947 ? 'bodoni' : 'inter'; // ancient/Rajput, Sultanate+Mughal, Company+Raj, independent India
const L2 = (lat, lon) => ll(lat, lon);
// event: y, title, text, key, cam [lat, lon, k], drift (years of progression during hold), night, pins, age, fx
const EVENTS = [
  { y: -900, t: 'Indraprastha', x: 'Around 900 BCE, Painted Grey Ware settlers live on the mound of today\'s Purana Qila; legend calls it Indraprastha.', cam: [28.6096, 77.2437, 0.85], drift: 300, pins: [[28.6096, 77.2437, 'Purana Qila mound', 90, -80]] },
  { y: 1060, t: 'Lal Kot', x: 'According to tradition, the Tomar Rajputs fortify Lal Kot around 1060 – the first walled city of Delhi.', key: 1, cam: [28.5205, 77.1858, 0.62], drift: 40, age: 'Rajput Age', pins: [[28.5205, 77.1858, 'Lal Kot', 100, -90]] },
  { y: 1180, t: 'Qila Rai Pithora', x: 'Around 1180, Prithviraj Chauhan enlarges the fortress into Qila Rai Pithora.', cam: [28.5190, 77.1840, 0.6], drift: 12 },
  { y: 1206, t: 'The Delhi Sultanate', x: 'Qutb ud-Din Aibak founds the first Muslim dynasty to rule from Delhi.', key: 1, cam: [28.5245, 77.1855, 0.7], drift: 14, age: 'Sultanate Age' },
  { y: 1220, t: 'Qutb Minar', x: 'A 72-metre tower of red sandstone, the tallest brick minaret in the world.', cam: [28.5245, 77.1855, 1.15], drift: 8, pins: [[28.5245, 77.1855, 'Qutb Minar', 120, -90]] },
  { y: 1303, t: 'Siri', x: 'Alauddin Khalji builds a new city to defend against the Mongols.', cam: [28.5500, 77.2160, 0.6], drift: 12, pins: [[28.5500, 77.2160, 'Siri Fort', 100, -80]] },
  { y: 1321, t: 'Tughlaqabad', x: 'The Tughlaqs raise a stone fortress-city with walls up to 15 metres high.', cam: [28.5110, 77.2660, 0.7], drift: 8, pins: [[28.5110, 77.2660, 'Tughlaqabad', 100, -80]] },
  { y: 1327, t: 'The capital leaves', x: 'Muhammad bin Tughluq moves the court to Daulatabad. Delhi empties.', key: 1, cam: [28.5400, 77.2200, 0.42], drift: 8, night: 0.3 },
  { y: 1354, t: 'Firozabad', x: 'Feroz Shah builds a new city on the river and sets an Ashoka pillar in its palace.', cam: [28.6358, 77.2406, 0.8], drift: 6, pins: [[28.6358, 77.2406, 'Feroz Shah Kotla', 100, -80]] },
  { y: 1398, t: 'Timur sacks Delhi', x: 'Timur\'s army sacks and burns Delhi; the Tughlaq Sultanate never recovers.', key: 1, cam: [28.5450, 77.2170, 0.42], drift: 1.5, night: 0.35, fx: 'fire' },
  { y: 1526, t: 'The Mughals', x: 'Babur wins at Panipat and founds the Mughal Empire.', key: 1, cam: [28.6096, 77.2437, 0.5], drift: 14, age: 'Mughal Age' },
  { y: 1540, t: 'Shergarh', x: 'Sher Shah Suri builds the Purana Qila on the site of Humayun\'s Dinpanah.', cam: [28.6096, 77.2437, 0.9], drift: 8, pins: [[28.6096, 77.2437, 'Purana Qila', 100, -80]] },
  { y: 1572, t: "Humayun's Tomb", x: 'The first garden tomb of India: white dome, red sandstone, the model for the Taj Mahal.', cam: [28.5933, 77.2507, 1.3], drift: 6, pins: [[28.5933, 77.2507, "Humayun's Tomb", 100, -90]] },
  { y: 1648, t: 'Shahjahanabad', x: 'Shah Jahan inaugurates the Red Fort: the seventh city of Delhi.', key: 1, cam: [28.6520, 77.2330, 0.6], drift: 8, pins: [[28.6562, 77.2410, 'Red Fort', 110, -80]] },
  { y: 1656, t: 'Jama Masjid', x: 'India\'s largest mosque, with room for 25,000 worshippers.', cam: [28.6507, 77.2334, 1.0], drift: 4, pins: [[28.6507, 77.2334, 'Jama Masjid', 110, -90]] },
  { y: 1724, t: 'Jantar Mantar', x: 'Maharaja Jai Singh II builds a giant stone observatory of sundials.', cam: [28.6271, 77.2166, 1.05], drift: 6, pins: [[28.6271, 77.2166, 'Jantar Mantar', 100, -80]] },
  { y: 1739, t: 'Nadir Shah', x: 'The Persian king sacks Delhi and carries off the Peacock Throne.', key: 1, cam: [28.6520, 77.2300, 0.55], drift: 1.5, night: 0.4, fx: 'fire' },
  { y: 1803, t: 'The British arrive', x: 'The East India Company takes control of Delhi after the Battle of Delhi.', cam: [28.6600, 77.2290, 0.5], drift: 10, age: 'Company Rule' },
  { y: 1857, t: 'The Rebellion of 1857', x: 'Months of fighting end with the British storming the Kashmiri Gate.', key: 1, hold: 11, cam: [28.6640, 77.2290, 0.62], drift: 0.9, night: 0.4, fx: 'war' },
  { y: 1866, t: 'The iron bridge', x: 'An iron railway bridge opens across the Yamuna and links Delhi to the railway network.', cam: [28.6629, 77.2495, 0.9], drift: 6, pins: [[28.6629, 77.2495, 'Old Yamuna Bridge', 110, -90]] },
  { y: 1911, t: 'The capital moves', x: 'At the Delhi Durbar, King George V announces that the capital will move from Calcutta to Delhi.', key: 1, cam: [28.6800, 77.2170, 0.5], drift: 1, fx: 'durbar', promise: 1, age: 'Imperial Age' },
  { y: 1931, t: 'New Delhi', x: 'Lutyens and Baker\'s imperial capital opens with Rashtrapati Bhavan and India Gate.', key: 1, cam: [28.6140, 77.2145, 0.42], drift: 2, pins: [[28.6143, 77.1995, 'Rashtrapati Bhavan', 140, -80], [28.6129, 77.2295, 'India Gate', 130, -90]] },
  { y: 1947, t: 'Independence and Partition', x: 'India is free, and hundreds of thousands of refugees pour into Delhi (est.).', key: 1, hold: 11, cam: [28.6540, 77.2330, 0.5], drift: 0.8, fx: 'flag', age: 'Independent India', night: 0.15 },
  { y: 1950, t: 'Republic Day', x: 'India becomes a republic; the annual Republic Day parade later settles on Rajpath.', cam: [28.6129, 77.2200, 0.62], drift: 1, fx: 'parade', pins: [[28.6129, 77.2295, 'Rajpath', 120, -90]] },
  { y: 1962, t: 'The first Master Plan', x: 'New colonies and ring roads begin to swallow the villages around Delhi.', cam: [28.5900, 77.2200, 0.2], drift: 12 },
  { y: 1982, t: 'The Asian Games', x: 'Flyovers, stadiums and a new skyline transform the city.', cam: [28.5826, 77.2338, 0.55], drift: 2, night: 0.7 },
  { y: 1986, t: 'Lotus Temple', x: 'A white marble temple shaped like a lotus flower opens its doors.', cam: [28.5535, 77.2588, 1.05], drift: 1, pins: [[28.5535, 77.2588, 'Lotus Temple', 100, -90]] },
  { y: 2002, t: 'Delhi Metro', x: 'The first metro line opens; today the network is among the longest in the world.', key: 1, cam: [28.6600, 77.2500, 0.35], drift: 1, fx: 'metro', age: 'Modern Age', night: 0.3 },
  { y: 2005, t: 'Akshardham', x: 'A temple of pink sandstone and white marble rises on the Yamuna floodplain.', cam: [28.6127, 77.2773, 1.0], drift: 1, pins: [[28.6127, 77.2773, 'Akshardham', 100, -90]] },
  { y: 2010, t: 'Commonwealth Games', x: 'Delhi hosts the Games and builds the Games Village on the river.', cam: [28.5826, 77.2338, 0.5], drift: 1, night: 0.85, fx: 'fireworks' },
  { y: 2023, t: 'The Yamuna rises', x: 'In July the river reaches a record 208.66 metres and floods the floodplain.', cam: [28.6400, 77.2500, 0.42], drift: 0.3, fx: 'flood' },
  { y: 2025, t: 'Delhi', x: 'One river, eight cities in one, and about 22 million people (est.).', key: 1, hold: 9, cam: [28.6300, 77.2300, 0.26], drift: 0, night: 1, fx: 'finale' },
];
const POPT = [[-900, 500], [1200, 20000], [1300, 100000], [1650, 400000], [1700, 400000], [1800, 140000], [1857, 150000], [1881, 173393], [1891, 192579], [1901, 208575], [1911, 237944], [1921, 304420], [1931, 447442], [1941, 695686], [1951, 1437134], [1961, 2359408], [1971, 3647023], [1981, 5729283], [1991, 8419084], [2001, 12877470], [2011, 16787941], [2025, 22000000]]; // sparse anchors, linear in between (before 1881 rough estimates; 1881-2011 census figures; 2025 estimate)
const RULERS = [ // [from year, name, subtitle, flag stripes]
  [-900, 'Early settlers', 'Painted Grey Ware culture', ['#8a6a3a']], [1060, 'Tomar Rajputs', 'Lal Kot, the first walled city', [SAFFRON, '#b03a2e']], [1180, 'Chauhan dynasty', 'Prithviraj III and Qila Rai Pithora', ['#d4a017', '#8b1a1a']],
  [1206, 'Delhi Sultanate', 'Five dynasties, from Aibak to the Lodis', ['#2f7d4a', '#ffffff']], [1526, 'Mughal Empire', 'Babur and his successors', ['#2f8f4a', '#d4a017']], [1540, 'Sur Empire', 'Sher Shah Suri rules from Delhi', ['#6b8e23']], [1555, 'Mughal Empire', 'Humayun returns to Delhi', ['#2f8f4a', '#d4a017']], [1648, 'Mughal Empire', "Shah Jahan's Shahjahanabad", ['#2f8f4a', '#d4a017']],
  [1803, 'East India Company', 'British control of Delhi', ['#c8102e', '#ffffff', '#1f3a8a']], [1858, 'British Raj', 'Crown rule over India', ['#c8102e', '#ffffff', '#1f3a8a']], [1947, 'Dominion of India', 'Independence and Partition', [SAFFRON, '#ffffff', GREENIN]], [1950, 'Republic of India', 'Capital of the largest democracy', [SAFFRON, '#ffffff', GREENIN]]];
const CITY = [[-900, 'Indraprastha (legend)'], [1060, 'Lal Kot'], [1180, 'Qila Rai Pithora'], [1303, 'Siri & Mehrauli'], [1321, 'Tughlaqabad'], [1354, 'Firozabad'], [1540, 'Shergarh'], [1648, 'Shahjahanabad'], [1857, 'Delhi'], [1911.9, 'Delhi & New Delhi'], [1950, 'Delhi']];
const BRX = { 'Old Yamuna Bridge': [1866, 1e9, 1e9], 'ITO Bridge': [1965, 1e9, 1e9], 'Nizamuddin Bridge': [1971, 1e9, 1e9], 'DND Flyway': [2001, 1e9, 1e9] };
const AGE_PROMISE_T = [88, 92.5];
function tableAt(T, y) { let r = T[0][1]; for (const [a, b] of T) { if (y >= a) r = b; else break; } return r; }
function interp(T, y) { if (y <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (y <= T[i][0]) { const a = T[i - 1], b = T[i], u = (y - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } return T[T.length - 1][1]; }
function bridgesCount(y) { let c = 0; for (const k in BRX) { const [a, d, r] = BRX[k]; if (y >= a && !(y >= d && y < r)) c++; } return c; }
function fmtYear(y) { if (y < 0) return Math.round(-y) + ' BCE'; if (y < 1000) return 'AD ' + Math.max(1, Math.floor(y)); return String(Math.floor(y)); }
function fmtPop(y, p) { const pr = p < 1000 ? Math.round(p / 10) * 10 : p < 10000 ? Math.round(p / 100) * 100 : p < 100000 ? Math.round(p / 1000) * 1000 : Math.round(p / 10000) * 10000; return (y < 1951 || y > 2011 ? '~' : '') + pr.toLocaleString('en-US'); }

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
const HOOKCAM = () => ({ e: 2350, n: 5100, k: 0.42 });
function stateAt(t) {
  t = clamp(t, 0, TLN.total - 1e-6); const sg = TLN.segs.find(s => t >= s.t0 && t < s.t1); const u = (t - sg.t0) / (sg.t1 - sg.t0);
  const S0 = { t, sg, u, year: 0, cam: { e: 0, n: 0, k: 0.3 }, night: 0, flood: -1, ev: null, evp: 0, tint: 0 };
  const H = HOOKCAM();
  if (sg.k === 'hook') { S0.year = 1947.62; S0.cam = { e: H.e, n: H.n, k: H.k * (1 + 0.04 * u) }; S0.night = 0.25; return S0; }
  if (sg.k === 'rewind') { const s = u * u * (3 - 2 * u * 0.2); S0.year = lerp(1947.62, -960, clamp(u * u * 1.0 + u * 0.1)); S0.cam = { e: lerp(H.e, 0, u), n: lerp(H.n, 1200, u), k: lerp(H.k, 0.5, u) }; S0.night = lerp(0.25, 0, u); return S0; }
  if (sg.k === 'promise') { const e0 = EVENTS[0]; S0.year = lerp(-960, EVENTS[0].y - 4, smooth(u)); S0.cam = { e: lerp(0, e0.e[0], smooth(u)), n: lerp(1200, e0.e[1], smooth(u)), k: lerp(0.5, 0.62, smooth(u)) }; return S0; }
  if (sg.k === 'hold') { const E = EVENTS[sg.i]; S0.ev = E; S0.evp = u; S0.year = E.y + E.drift * u; const kk = E.cam[2] * (1 + 0.05 * u); S0.cam = { e: E.e[0] + (u - 0.5) * 14, n: E.e[1] + (u - 0.5) * 10, k: kk }; S0.night = E.night || 0; if (E.fx === 'flood') S0.flood = smooth(u * 3) * (1 - smooth((u - 0.55) * 2.2)); return S0; }
  if (sg.k === 'gap') { const A = EVENTS[sg.i - 1], B = EVENTS[sg.i], s = smoother(u), ya = A.y + A.drift; S0.year = lerp(ya, B.y, s); const k0 = A.cam[2] * 1.05, k1 = B.cam[2]; const kk = Math.exp(lerp(Math.log(k0), Math.log(k1), s)) * (1 - 0.34 * Math.sin(Math.PI * s)); S0.cam = { e: lerp(A.e[0], B.e[0], s), n: lerp(A.e[1], B.e[1], s), k: kk }; S0.night = lerp(A.night || 0, B.night || 0, s); S0.ev = null; return S0; }
  if (sg.k === 'split') { S0.year = 2025; S0.cam = { e: H.e, n: H.n, k: H.k * (1.04) }; S0.night = 1; S0.wipe = smoother(u); return S0; }
  S0.year = 2025; S0.cam = { e: H.e, n: H.n, k: H.k * 1.04 }; S0.night = 1; S0.wipe = 1; S0.endp = u; return S0;
}
// ---- tint/night/lights
const TINT = [[-1000, [255, 232, 196]], [1206, [248, 232, 204]], [1526, [252, 234, 208]], [1803, [250, 238, 214]], [1911, [242, 240, 234]], [1947, [230, 236, 244]], [1990, [255, 255, 255]]];
function tintAt(y) { let a = TINT[0], b = TINT[0]; for (let i = 0; i < TINT.length; i++) { if (y >= TINT[i][0]) a = TINT[i]; } const ia = TINT.indexOf(a), nb = TINT[Math.min(ia + 1, TINT.length - 1)], span = nb[0] - a[0] || 1, u = clamp((y - a[0]) / span); const sm = ia + 1 < TINT.length ? smooth(clamp((y - (nb[0] - 70)) / 70)) : 0; return mixc(a[1], nb[1], ia + 1 < TINT.length ? sm : 0); }
const URBCOL = y => y < 1206 ? [186, 154, 112] : y < 1526 ? [184, 150, 112] : y < 1803 ? [196, 150, 116] : y < 1947 ? [182, 156, 124] : y < 1990 ? [170, 152, 126] : [160, 148, 130];
const GLOW = (() => { const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d'), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24); gr.addColorStop(0, 'rgba(255,230,150,1)'); gr.addColorStop(0.25, 'rgba(255,190,90,0.55)'); gr.addColorStop(1, 'rgba(255,150,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 48, 48); return c; })();
const PUFF = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; })();
function drawLights(g, year, night, time) {
  if (night < 0.12 || year < 1905) return; const k = CAM.k, a = night * (year < 1930 ? 0.6 : 0.95); g.save(); g.globalCompositeOperation = 'lighter';
  const sz = clamp(k * 44, 5, 30), W2 = W / 2, H2 = H / 2;
  if (year > 1910) { g.globalAlpha = a * 0.5; g.strokeStyle = 'rgb(255,190,100)'; g.lineWidth = Math.max(1.4, k * 4.5); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); for (const r of ROADS) { if (r.c < 2 || r.y > year) continue; const p = r.pts; let st = false; for (let i = 0; i < p.length; i += 2) { const [x, y] = P(p[i], p[i + 1], hAt(p[i], p[i + 1]) + 0.3); if (x < -200 || x > W + 200 || y < -200 || y > H + 200) { st = false; continue; } if (!st) { g.moveTo(x, y); st = true; } else g.lineTo(x, y); } } g.stroke(); }
  g.globalAlpha = a;
  for (let q = 0; q < ITEMS.length; q++) { const it = ITEMS[q]; if (it.k !== 0 || it.s < 5 || it.s === 11 || it.y0 > year || it.y1 <= year) continue; const x = W2 + ((it.e - CAM.e) + (it.n - CAM.n)) * k, y = H2 + ((it.e - CAM.e) - (it.n - CAM.n)) * k * 0.5 - (it.h + 8) * k * VS; if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue; if (hash2(q, 3, 7) < (year > 1950 ? 0.6 : 0.25)) continue; g.drawImage(GLOW, x - sz * 0.85, y - sz * 0.85, sz * 1.7, sz * 1.7); }
  if (year > 1905) for (const b of BRIDGES) { const [a0, d, r] = BRX[b.name] || [0, 1e9, 1e9]; if (year < a0 || (year >= d && year < r)) continue; const pts = b.pts; g.globalAlpha = a * 0.8; g.strokeStyle = 'rgb(255,226,160)'; g.lineWidth = Math.max(2, k * 7); g.beginPath(); pts.forEach(([e, n], i) => { const [x, y] = P(e, n, 8); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.globalAlpha = a; for (let i = 0; i + 1 < pts.length; i++) { const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]), m = Math.max(1, Math.floor(L / 30)); for (let j = 0; j <= m; j++) { const e = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * j / m, n = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * j / m, [x, y] = P(e, n, 10); g.drawImage(GLOW, x - sz * 1.2, y - sz * 1.2, sz * 2.4, sz * 2.4); } } }
  for (const it of ITEMS) { if (it.k !== 2 || it.y0 > year || it.y1 <= year || !['indiagate', 'rbhavan', 'jama', 'tomb', 'lotus', 'akshardham', 'sansad', 'qutb', 'cp'].includes(it.lm)) continue; const [x, y] = P(it.e, it.n, it.h + 14); g.globalAlpha = a * 0.7; const rr = sz * 4.4; g.drawImage(GLOW, x - rr, y - rr * 1.1, rr * 2, rr * 2); }
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
const METRO = [[28.6733, 77.2893], [28.6718, 77.2782], [28.6695, 77.2680], [28.6687, 77.2520], [28.6678, 77.2287], [28.6668, 77.2160]];
const FLAGC = [SAFFRON, '#ffffff', GREENIN];
function drawFx(g, S, time) {
  const E = S.ev, year = S.year, k = CAM.k; const sz = clamp(k * 20, 4, 28);
  if (S.sg.k === 'hook' || (year > 1857.6 && year < 1859.0 && (S.sg.k === 'hold' || S.sg.k === 'gap'))) { // distant smoke plumes over the old city
    const inten = S.sg.k === 'hook' ? 0.75 : clamp(1 - (year - 1857.9) / 1.0); for (let j = 0; j < 14; j++) { const e = OLD[0] + (hash2(j, 1, 9) - 0.5) * 3600, n = OLD[1] + (hash2(j, 2, 9) - 0.5) * 3600, [x, y] = P(e, n, hAt(e, n)); if (x < -100 || x > W + 100 || y < -50 || y > H + 200) continue; smokeCol(g, x, y, 220 * k * 4 + 70, time + j * 0.37, 0.33 * inten, 20 * clamp(k * 3, 0.8, 3)); }
  }
  if (E && E.fx === 'war' && S.sg.k === 'hold') { // 1857: artillery on the walls, then the Kashmiri Gate is blown up
    const secs = S.evp * E.hk, gt = ll(28.6678, 77.2290), zs = clamp(k * 3, 0.7, 2.4);
    for (let j = 0; j < 6; j++) { const e = gt[0] + (hash2(j, 3, 4) - 0.5) * 900, n = gt[1] + (hash2(j, 4, 4) - 0.5) * 700, [x, y] = P(e, n, hAt(e, n) + 4), age = (secs - (0.5 + j * 0.9)) / 0.7; burst(g, x, y, 110 * zs, age); if (age > 0) smokeCol(g, x, y, 150 * zs, time + j, clamp(age * 2.5, 0, 0.5), 18 * zs); }
    const [x, y] = P(gt[0], gt[1], hAt(gt[0], gt[1]) + 6), age = (secs - 6.2) / 0.9; burst(g, x, y, 190 * zs, age); if (age > 0 && age < 1.2) { g.save(); g.strokeStyle = `rgba(255,230,190,${0.8 * (1 - age / 1.2)})`; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 40 + age * 260 * zs, 14 + age * 90 * zs, 0, 0, 7); g.stroke(); g.restore(); } if (age > 0) smokeCol(g, x, y, 220 * zs, time, clamp(age * 3, 0, 0.6), 24 * zs);
  }
  if (E && E.fx === 'fireworks') { // Commonwealth Games opening: fireworks over the stadium
    const c = P(ll(28.5826, 77.2338)[0], ll(28.5826, 77.2338)[1], 30); for (let j = 0; j < 9; j++) { const tt = (S.evp * 7.4 * 0.9 + j * 0.37) % 1.4, cyc = Math.floor(S.evp * 7.4 * 0.9 / 1.4 + j * 0.26), ex = c[0] + (hash2(j, cyc, 3) - 0.5) * 900, ey = c[1] - 160 - hash2(j, cyc, 4) * 250, age = tt / 1.4; if (age > 1) continue; g.save(); g.globalCompositeOperation = 'lighter'; const hue = hash2(j, cyc, 5) * 360; for (let r = 0; r < 28; r++) { const a = r / 28 * 6.283, d = Math.sqrt(age) * 110, px = ex + Math.cos(a) * d, py = ey + Math.sin(a) * d * 0.8 + age * age * 50; g.fillStyle = `hsla(${hue},95%,65%,${(1 - age) * 0.95})`; g.beginPath(); g.arc(px, py, 3.2 * (1 - age * 0.5), 0, 7); g.fill(); } g.restore(); }
  }
  if (E && E.fx === 'metro') { // first Delhi Metro line: a glowing red line is drawn from Shahdara to Tis Hazari, a train runs along it
    const pts = METRO.map(p => ll(p[0], p[1])), tot = pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0), prog = smooth(S.evp * 1.5) * tot, at = d => { let acc = 0; for (let i = 1; i < pts.length; i++) { const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (d <= acc + L) { const u = (d - acc) / L; return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]; } acc += L; } return pts[pts.length - 1]; };
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; for (const [lw, col] of [[Math.max(8, k * 38), 'rgba(224,58,62,0.30)'], [Math.max(4, k * 17), 'rgba(235,70,72,0.95)'], [Math.max(1.6, k * 6), '#fff2e0']]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (let d = 0; d <= prog; d += 30) { const q = at(d), [x, y] = P(q[0], q[1], hAt(q[0], q[1]) + 9); d ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    let acc = 0; for (let i = 0; i < pts.length; i++) { if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc > prog) break; const [x, y] = P(pts[i][0], pts[i][1], hAt(pts[i][0], pts[i][1]) + 9); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, Math.max(4, k * 14), 0, 7); g.fill(); g.strokeStyle = '#e03a3e'; g.lineWidth = 3; g.stroke(); }
    const tq = at(((time * 0.18) % 1) * prog), [tx, ty] = P(tq[0], tq[1], hAt(tq[0], tq[1]) + 12); g.fillStyle = '#fff'; g.fillRect(tx - Math.max(6, k * 24), ty - Math.max(3, k * 9), Math.max(12, k * 48), Math.max(6, k * 18)); g.restore();
  }
  if (E && E.fx === 'flag') { // Red Fort, Lahori Gate: the tricolour is raised
    const e = ll(28.6563, 77.2372), [x, y] = P(e[0], e[1], 40), s = clamp(k * 38, 10, 60); g.save(); g.strokeStyle = '#3a3836'; g.lineWidth = Math.max(1.5, s * 0.08); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - s * 2.6); g.stroke(); const fw = s * 2.3, fh = s * 1.5, slices = 28, appear = clamp(S.evp * 3), ry = y - s * 2.6 + (1 - smooth(S.evp * 2.2)) * s * 1.2; for (let i = 0; i < slices; i++) { const u = i / slices, wv = Math.sin(u * 7 - time * 6) * s * 0.09 * u; for (let r = 0; r < 3; r++) { g.fillStyle = FLAGC[r]; g.fillRect(x + u * fw * appear, ry + r * fh / 3 + wv, fw / slices * appear + 1, fh / 3 + 1); } } g.strokeStyle = '#1a2a6a'; g.lineWidth = Math.max(1, s * 0.05); g.beginPath(); g.arc(x + fw * 0.5 * appear, ry + fh / 2, fh * 0.14, 0, 7); g.stroke(); g.restore();
  }
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
  const SERIF = '600 {s}px "EB Garamond"', sf = n => SERIF.replace('{s}', n);
  if (sg.k !== 'end' && sg.k !== 'split') {
    g.textBaseline = 'alphabetic'; g.fillStyle = '#fff'; g.font = sf(112); const ys = (sg.k === 'hook') ? 'AD 1947' : fmtYear(year); shadowText(g, ys, 56, 846, 14);
    if (sg.k === 'hold' || sg.k === 'gap') { // ruler: flag + name + subtitle (top-left)
      const R = RULERS.filter(r => year >= r[0]).pop() || RULERS[0], cols = R[3], fx = 58, fy = 60, fw = 100, fh = 66; g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 8; cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(fx, fy + i * fh / cols.length, fw, fh / cols.length + 0.5); }); g.restore(); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2; g.strokeRect(fx, fy, fw, fh);
      g.fillStyle = '#fff'; g.font = sf(56); shadowText(g, R[1], 184, 98, 10); g.fillStyle = '#f4ead0'; g.font = sf(34); shadowText(g, R[2], 186, 138, 8); g.fillStyle = '#ffe9b8'; g.font = sf(30); shadowText(g, tableAt(CITY, year), 186, 176, 8); } }
  // population (top-right, with person icon)
  if (sg.k !== 'hook' && sg.k !== 'rewind' && sg.k !== 'promise' && sg.k !== 'end') { g.save(); g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = sf(58); shadowText(g, fmtPop(year, interp(POPT, year)), W - 60, 98, 10); const tw = g.measureText(fmtPop(year, interp(POPT, year))).width; g.textAlign = 'left'; g.fillStyle = '#fff'; g.beginPath(); g.arc(W - 60 - tw - 30, 62, 9, 0, 7); g.fill(); g.beginPath(); g.moveTo(W - 60 - tw - 42, 98); g.quadraticCurveTo(W - 60 - tw - 30, 66, W - 60 - tw - 18, 98); g.closePath(); g.fill(); g.restore(); }
  // minimap (AoE-style diamond), top-right
  { const mw = 300, mh = 150, mx = W - 60 - mw, my = 142; g.save(); g.fillStyle = 'rgba(8,10,14,0.72)'; g.strokeStyle = '#c9a44c'; g.lineWidth = 3; g.fillRect(mx - 8, my - 8, mw + 16, mh + 16); g.strokeRect(mx - 8, my - 8, mw + 16, mh + 16); const N = 48; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const e = BB[0] + (i + 0.5) / N * (BB[2] - BB[0]), n = BB[1] + (j + 0.5) / N * (BB[3] - BB[1]), x = mx + mw / 2 + ((e - BB[0]) / (BB[2] - BB[0]) + (n - BB[1]) / (BB[3] - BB[1]) - 1) * mw / 2, y = my + mh / 2 + ((e - BB[0]) / (BB[2] - BB[0]) - (n - BB[1]) / (BB[3] - BB[1])) * mh / 2; const wat = isWater(e, n), u = urbAt(e, n) <= year; g.fillStyle = wat ? '#2f6ea5' : u ? '#d9b36a' : (hAt(e, n) > 55 ? '#3b6b3c' : '#6f9a4a'); g.fillRect(x - 3.2, y - 1.8, 6.4, 3.6); }
    g.strokeStyle = '#fff'; g.lineWidth = 2; const vw = W / CAM.k, vh = H / CAM.k; const cx = mx + mw / 2 + ((CAM.e - BB[0]) / (BB[2] - BB[0]) + (CAM.n - BB[1]) / (BB[3] - BB[1]) - 1) * mw / 2, cy = my + mh / 2 + ((CAM.e - BB[0]) / (BB[2] - BB[0]) - (CAM.n - BB[1]) / (BB[3] - BB[1])) * mh / 2; const rw = clamp(vw / (BB[2] - BB[0]) * mw * 0.5, 6, mw * 0.45), rh = clamp(vh * 0.35 / (BB[3] - BB[1]) * mh, 4, mh * 0.45); g.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh); g.restore(); }
  // timeline (separate bar, ticks above, year labels below)
  { const x0 = 70, x1 = W - 70, yb = 916, tot = TLN.total, prog = t / tot, acc2 = '#ffb347', xOf = Ev => x0 + (Ev.t0 + Ev.hk * 0.5) / tot * (x1 - x0);
    g.fillStyle = 'rgba(6,8,12,0.66)'; g.fillRect(0, yb - 42, W, 86);
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(x0, yb - 4, x1 - x0, 8); g.fillStyle = acc2; g.fillRect(x0, yb - 4, (x1 - x0) * prog, 8);
    for (const Ev of EVENTS) { const xx = xOf(Ev); g.fillStyle = Ev.key ? '#ffffff' : 'rgba(255,255,255,0.5)'; const hh = Ev.key ? 26 : 13; g.fillRect(xx - (Ev.key ? 1.5 : 1), yb - 4 - hh, Ev.key ? 3 : 2, hh); }
    const prio = [2025, 1947, 1857, 1911, 1648, 1398, 1206, 1739, 1931, 1526, 2002, 1060, 1327, -900], placed = []; g.font = '600 24px Inter'; g.textAlign = 'center'; g.fillStyle = '#ffd27a';
    for (const y of prio) { const Ev = EVENTS.find(e => e.y === y); if (!Ev) continue; const xx = xOf(Ev); if (placed.some(p => Math.abs(p - xx) < 84)) continue; placed.push(xx); g.fillText(Ev.y > 2020 ? 'Today' : (Ev.y < 0 ? Math.round(-Ev.y) + ' BCE' : Ev.y < 1000 ? 'AD ' + Math.floor(Ev.y) : String(Math.floor(Ev.y))), xx, yb + 34); }
    g.textAlign = 'left'; const px = x0 + (x1 - x0) * prog; g.fillStyle = acc2; g.beginPath(); g.arc(px, yb, 10, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke(); }
  // event card
  if (E && sg.k === 'hold') { const T = E.hk, secs = S.evp * T, a = Math.min(smooth(secs / 0.55), smooth((T - secs) / 0.55)); if (a > 0.01) { g.save(); g.globalAlpha = a; const cx = 560, cw = 1300, cy = 668; const bg = g.createLinearGradient(0, cy - 40, 0, cy + 190); bg.addColorStop(0, 'rgba(6,8,12,0)'); bg.addColorStop(0.28, 'rgba(6,8,12,0.36)'); bg.addColorStop(1, 'rgba(6,8,12,0.5)'); g.fillStyle = bg; g.fillRect(cx - 40, cy - 60, cw + 40, 260);
      g.fillStyle = E.key ? '#ffe6a8' : '#fff'; g.font = sf(70); g.letterSpacing = '2px'; shadowText(g, E.t.toUpperCase(), cx, cy + 36, 10); g.letterSpacing = '0px'; g.font = sf(40); g.fillStyle = '#f6f2e6'; wrapText(g, E.x, cx, cy + 92, 1280, 46); g.restore(); } }
  // pins
  if (E && sg.k === 'hold' && E.pins) { const a = smooth((S.evp * E.hk - 0.7) / 0.5) * smooth((E.hk - S.evp * E.hk - 0.1) / 0.5); if (a > 0.01) for (const [la, lo, txt, dx, dy] of E.pins) { const [e, n] = ll(la, lo), [x, y] = P(e, n, hAt(e, n) + 10); g.save(); g.globalAlpha = a; g.strokeStyle = '#ffb347'; g.fillStyle = '#ffb347'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + dy); g.stroke(); g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.font = '700 32px Inter'; const tw = g.measureText(txt).width + 28, bx = dx < 0 ? x + dx - tw : x + dx; g.fillStyle = 'rgba(8,10,14,0.85)'; g.fillRect(bx, y + dy - 30, tw, 46); g.strokeStyle = '#ffb347'; g.lineWidth = 2; g.strokeRect(bx, y + dy - 30, tw, 46); g.fillStyle = '#fff'; g.fillText(txt, bx + 14, y + dy + 4); g.restore(); } }
  // age banner
  if (E && sg.k === 'hold' && E.age) { const secs = S.evp * E.hk, a = Math.min(smooth(secs / 0.4), smooth((2.8 - secs) / 0.5)); if (a > 0.01) { g.save(); g.globalAlpha = a; const bw = 640, bh = 96, bx = W / 2 - bw / 2 - 100, by = 56 + (1 - smooth(secs / 0.5)) * -30; const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#6b1520'); gr.addColorStop(0.5, '#a3202e'); gr.addColorStop(1, '#6b1520'); g.fillStyle = gr; g.fillRect(bx, by, bw, bh); g.strokeStyle = '#e6c15a'; g.lineWidth = 5; g.strokeRect(bx, by, bw, bh); g.fillStyle = '#f4dfa0'; g.font = '600 22px Inter'; g.textAlign = 'center'; g.fillText('NEW AGE', W / 2 - 100, by + 30); g.fillStyle = '#fff'; g.font = '700 46px Inter'; g.fillText(E.age.toUpperCase(), W / 2 - 100, by + 76); g.textAlign = 'left'; g.restore(); } }
  if (E && E.promise && sg.k === 'hold') { const secs = S.evp * E.hk, a = Math.min(smooth((secs - 0.5) / 0.4), smooth((4.8 - secs) / 0.5)); if (a > 0.01) { g.save(); g.globalAlpha = a; g.fillStyle = '#2f9e44'; g.fillRect(W / 2 - 110, 175, 330, 56); g.fillStyle = '#fff'; g.font = '800 30px Inter'; g.textAlign = 'center'; g.fillText('PROMISE KEPT ✓', W / 2 + 55, 214); g.textAlign = 'left'; g.restore(); } }
  // open loop at ~1:30
  if (t > AGE_PROMISE_T[0] && t < AGE_PROMISE_T[1]) { const a = Math.min(smooth((t - AGE_PROMISE_T[0]) / 0.4), smooth((AGE_PROMISE_T[1] - t) / 0.4)); g.save(); g.globalAlpha = a * 0.92; const sp = landmark('indiagate', 2); const sc = 1.15, px = W - 380, py = 520; g.shadowColor = '#ffd27a'; g.shadowBlur = 30; g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.55; g.drawImage(sp.c, px - sp.ox * sc, py - sp.oy * sc, sp.c.width * sc, sp.c.height * sc); g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0; g.globalAlpha = a; g.font = '800 64px Inter'; g.fillStyle = '#fff'; g.textAlign = 'center'; shadowText(g, 'Wait for 1911', W - 380, 600, 14); g.textAlign = 'left'; g.restore(); }
  // intro / outro texts
  if (sg.k === 'hook') { const a = Math.min(smooth(S.u * 8), 1) * (1 - smooth((S.u - 0.88) / 0.12)); g.save(); g.globalAlpha = a; g.font = '800 128px Inter'; g.textAlign = 'center'; g.fillStyle = '#fff'; shadowText(g, 'Half a million.', W / 2, 400, 20); g.fillStyle = '#ff9933'; shadowText(g, 'One summer.', W / 2, 540, 20); g.restore(); }
  if (sg.k === 'rewind') { g.save(); g.globalAlpha = 0.9; g.font = '800 120px Inter'; g.fillStyle = '#fff'; g.textAlign = 'right'; shadowText(g, '◀◀', W - 70, 190, 12); g.restore(); for (let i = 0; i < 36; i++) { const yy = (hash2(i, Math.floor(t * 20), 2) * H) | 0; g.fillStyle = `rgba(255,255,255,${0.05 + 0.1 * hash2(i, 3, 3)})`; g.fillRect(0, yy, W, 2 + hash2(i, 5, 5) * 5); } }
  if (sg.k === 'promise') { g.save(); g.textAlign = 'center'; g.font = '800 92px Inter'; const lines = ['3,000 years.', 'One river.', 'Eight cities that became one.']; const sz = [92, 92, 70]; lines.forEach((l, i) => { const a = smooth((S.u * 5 - i * 1.15) / 0.5) * (1 - smooth((S.u - 0.93) / 0.07)); g.globalAlpha = a; g.fillStyle = i === 2 ? '#ffd27a' : '#fff'; g.font = `800 ${sz[i]}px Inter`; shadowText(g, l, W / 2, 400 + i * 120, 20); }); g.restore(); }
  if (sg.k === 'end') { const a = smooth(S.u * 4); g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 380, W, 220); g.fillStyle = '#fff'; g.font = '800 84px Inter'; shadowText(g, 'Which city should we rewind next?', W / 2, 520, 18); g.restore(); }
  if (sg.k === 'split') { g.save(); g.textAlign = 'center'; g.font = '800 54px Inter'; g.fillStyle = '#fff'; const dv = W * S.wipe; if (S.wipe > 0.12) shadowText(g, 'TODAY', Math.max(260, dv * 0.5), 190, 14); if (S.wipe < 0.88) shadowText(g, 'AD 1947', Math.min(W - 260, dv + (W - dv) * 0.5), 190, 14); g.restore(); }
}
