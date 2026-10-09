'use strict';
// ================= SPRITES: procedural isometric buildings (AoE2-like) =================
const BZ = 1.2247 * 1.45, LODS = [0.45, 1.1, 2.6];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, f = 1, a = 1) => `rgba(${Math.max(0, Math.min(255, c[0] * f)) | 0},${Math.max(0, Math.min(255, c[1] * f)) | 0},${Math.max(0, Math.min(255, c[2] * f)) | 0},${a})`;
class SC { // sprite context
  constructor(w, hh, s) { this.s = s; this.pad = 4; this.W = Math.ceil(w * s + 8); this.Hh = Math.ceil(hh * s * BZ + (w * 0.25) * s + 8); this.c = document.createElement('canvas'); this.c.width = this.W; this.c.height = this.Hh; this.g = this.c.getContext('2d'); this.ox = this.W / 2; this.oy = this.Hh - 4 - (w * 0.25) * s; this.g.lineJoin = 'round'; }
  pt(e, n, z) { return [this.ox + (e + n) * this.s, this.oy + (e - n) * 0.5 * this.s - z * this.s * BZ]; }
  poly(pts, col, f, ol = 0.5) { const g = this.g; g.beginPath(); pts.forEach(([e, n, z], i) => { const [x, y] = this.pt(e, n, z); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fillStyle = rgb(col, f); g.fill(); if (ol > 0) { g.strokeStyle = `rgba(25,15,8,${ol})`; g.lineWidth = Math.max(0.6, this.s * 0.55); g.stroke(); } }
  shadow(a, b, ht, len = 0.7) {
    const g = this.g, dx = ht * len, pts = [[-a / 2, -b / 2], [a / 2, -b / 2], [a / 2, b / 2], [-a / 2, b / 2]]; const all = []; for (const [e, n] of pts) { all.push(this.pt(e, n, 0)); all.push(this.pt(e + dx, n - dx * 0.2, 0)); }
    const hull = (P) => { P = P.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o, a2, b2) => (a2[0] - o[0]) * (b2[1] - o[1]) - (a2[1] - o[1]) * (b2[0] - o[0]); const lo = []; for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } const up = []; for (const p of P.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
    const h = hull(all); g.beginPath(); h.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = 'rgba(15,20,10,0.26)'; g.fill();
  }
  box(a, b, ht, z0, wall, o = {}) { // walls only (south, east faces)
    const A = -a / 2, B = a / 2, Cn = -b / 2, D = b / 2, z1 = z0 + ht;
    this.poly([[A, Cn, z0], [B, Cn, z0], [B, Cn, z1], [A, Cn, z1]], wall, 0.88, o.ol ?? 0.55);
    this.poly([[B, Cn, z0], [B, D, z0], [B, D, z1], [B, Cn, z1]], wall, 0.62, o.ol ?? 0.55);
    if (o.win) this.windows(a, b, ht, z0, o.win, o.floors || Math.max(1, Math.round(ht / 4.2)));
  }
  windows(a, b, ht, z0, wc, floors) {
    if (this.s < 0.9) return; const g = this.g, nS = Math.max(2, Math.round(a / 7)), nE = Math.max(2, Math.round(b / 7));
    for (let f = 0; f < floors; f++) {
      const zc = z0 + (f + 0.55) * ht / floors, zh = ht / floors * 0.38;
      for (let i = 0; i < nS; i++) { const e = -a / 2 + (i + 0.5) * a / nS, we = a / nS * 0.28; this.quad([[e - we, -b / 2, zc - zh / 2], [e + we, -b / 2, zc - zh / 2], [e + we, -b / 2, zc + zh / 2], [e - we, -b / 2, zc + zh / 2]], wc, 0.85); }
      for (let i = 0; i < nE; i++) { const n = -b / 2 + (i + 0.5) * b / nE, wn = b / nE * 0.28; this.quad([[a / 2, n - wn, zc - zh / 2], [a / 2, n + wn, zc - zh / 2], [a / 2, n + wn, zc + zh / 2], [a / 2, n - wn, zc + zh / 2]], wc, 0.55); }
    }
  }
  quad(pts, col, f) { const g = this.g; g.beginPath(); pts.forEach(([e, n, z], i) => { const [x, y] = this.pt(e, n, z); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fillStyle = rgb(col, f); g.fill(); }
  flat(a, b, z, col, f = 1.08) { this.poly([[-a / 2, -b / 2, z], [a / 2, -b / 2, z], [a / 2, b / 2, z], [-a / 2, b / 2, z]], col, f, 0.55); }
  gable(a, b, z, rh, roof, wall, ridge, over = 0) { // ridge: 'n' (ridge along n) or 'e'
    const A = -a / 2 - over, B = a / 2 + over, Cn = -b / 2 - over, D = b / 2 + over, zt = z + rh;
    if (ridge === 'n') {
      this.poly([[A, Cn, z], [A, D, z], [0, D, zt], [0, Cn, zt]], roof, 1.02, 0.5);
      this.poly([[-a / 2, -b / 2, z], [a / 2, -b / 2, z], [0, -b / 2, zt]], wall, 0.88, 0.5);
      this.poly([[B, Cn, z], [B, D, z], [0, D, zt], [0, Cn, zt]], roof, 0.72, 0.5);
    } else {
      this.poly([[A, D, z], [B, D, z], [B, 0, zt], [A, 0, zt]], roof, 1.04, 0.5);
      this.poly([[a / 2, -b / 2, z], [a / 2, b / 2, z], [a / 2, 0, zt]], wall, 0.62, 0.5);
      this.poly([[A, Cn, z], [B, Cn, z], [B, 0, zt], [A, 0, zt]], roof, 0.9, 0.5);
    }
  }
  hip(a, b, z, rh, roof, ridgeFrac = 0.35, over = 0.8) {
    const A = -a / 2 - over, B = a / 2 + over, Cn = -b / 2 - over, D = b / 2 + over, zt = z + rh, ra = a * ridgeFrac * 0.5, rb = b * ridgeFrac * 0.5;
    const R = [[-ra, -rb], [ra, -rb], [ra, rb], [-ra, rb]];
    this.poly([[A, D, z], [B, D, z], [R[2][0], R[2][1], zt], [R[3][0], R[3][1], zt]], roof, 1.05, 0.5);
    this.poly([[A, Cn, z], [A, D, z], [R[3][0], R[3][1], zt], [R[0][0], R[0][1], zt]], roof, 0.98, 0.5);
    this.poly([[A, Cn, z], [B, Cn, z], [R[1][0], R[1][1], zt], [R[0][0], R[0][1], zt]], roof, 0.9, 0.5);
    this.poly([[B, Cn, z], [B, D, z], [R[2][0], R[2][1], zt], [R[1][0], R[1][1], zt]], roof, 0.7, 0.5);
  }
  pyramid(a, b, z, rh, roof) { const A = -a / 2, B = a / 2, Cn = -b / 2, D = b / 2, zt = z + rh; this.poly([[A, D, z], [B, D, z], [0, 0, zt]], roof, 1.0, 0.5); this.poly([[A, Cn, z], [A, D, z], [0, 0, zt]], roof, 0.95, 0.5); this.poly([[A, Cn, z], [B, Cn, z], [0, 0, zt]], roof, 0.88, 0.5); this.poly([[B, Cn, z], [B, D, z], [0, 0, zt]], roof, 0.68, 0.5); }
  cyl(r, ht, z0, col, e = 0, n = 0, segs = 16) { // vertical cylinder body
    const g = this.g, [cx, cy] = this.pt(e, n, z0), [tx, ty] = this.pt(e, n, z0 + ht), rx = r * Math.SQRT2 * this.s, ry = r * Math.SQRT1_2 * this.s;
    const gr = g.createLinearGradient(cx - rx, 0, cx + rx, 0); gr.addColorStop(0, rgb(col, 1.05)); gr.addColorStop(0.55, rgb(col, 0.88)); gr.addColorStop(1, rgb(col, 0.58));
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); g.lineTo(tx - rx, ty); g.ellipse(tx, ty, rx, ry, 0, Math.PI, 0, true); g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(25,15,8,0.5)'; g.lineWidth = Math.max(0.6, this.s * 0.5); g.stroke();
    g.beginPath(); g.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = rgb(col, 1.1); g.fill(); g.stroke();
  }
  cone(r, rh, z, col, e = 0, n = 0) {
    const g = this.g, [cx, cy] = this.pt(e, n, z), [tx, ty] = this.pt(e, n, z + rh), rx = r * Math.SQRT2 * this.s, ry = r * Math.SQRT1_2 * this.s;
    const gr = g.createLinearGradient(cx - rx, 0, cx + rx, 0); gr.addColorStop(0, rgb(col, 1.05)); gr.addColorStop(0.6, rgb(col, 0.85)); gr.addColorStop(1, rgb(col, 0.55));
    g.beginPath(); g.moveTo(cx - rx, cy); g.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); g.lineTo(tx, ty); g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(25,15,8,0.5)'; g.lineWidth = Math.max(0.6, this.s * 0.5); g.stroke();
  }
  dome(r, rh, z, col, e = 0, n = 0) {
    const g = this.g, [cx, cy] = this.pt(e, n, z), rx = r * Math.SQRT2 * this.s, ry = r * Math.SQRT1_2 * this.s, hh = rh * this.s * BZ;
    const gr = g.createRadialGradient(cx - rx * 0.35, cy - hh * 0.7, 1, cx, cy - hh * 0.3, rx * 1.1); gr.addColorStop(0, rgb(col, 1.25)); gr.addColorStop(0.6, rgb(col, 0.92)); gr.addColorStop(1, rgb(col, 0.55));
    g.beginPath(); g.moveTo(cx - rx, cy); g.bezierCurveTo(cx - rx, cy - hh * 1.33, cx + rx, cy - hh * 1.33, cx + rx, cy); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(25,15,8,0.5)'; g.lineWidth = Math.max(0.6, this.s * 0.5); g.stroke();
  }
}
function newSpr(w, hz, s, fn) { const c = new SC(w, hz, s); fn(c); return { c: c.c, ox: c.ox, oy: c.oy, s }; }

// ---- palettes
const PAL = { // keys keep Budapest names; colours are Delhi: sandstone, ochre, Mughal pink, colonial cream
  roman: [[222, 190, 142], [210, 176, 128], [226, 200, 154]], romanRoof: [[170, 120, 84], [158, 112, 80]],
  med: [[214, 184, 140], [204, 170, 124], [220, 192, 150]], medRoof: [[172, 126, 88], [160, 116, 84], [182, 138, 96]],
  ott: [[238, 226, 200], [232, 214, 184], [226, 206, 176]], ottRoof: [[226, 220, 206], [214, 208, 194]],
  bar: [[232, 176, 136], [224, 150, 130], [236, 204, 120], [214, 190, 160], [200, 160, 140]], barRoof: [[170, 120, 96], [150, 108, 90]],
  hist: [[238, 230, 208], [230, 218, 186], [222, 206, 170], [236, 214, 176]], histRoof: [[150, 92, 72], [136, 86, 70]],
  inter: [[220, 208, 184], [206, 196, 180], [228, 216, 192]],
  panel: [[204, 184, 156], [214, 192, 162], [192, 176, 154]],
  mod: [[140, 176, 200], [112, 148, 172], [208, 212, 216]],
  villa: [[240, 232, 214], [232, 220, 196], [226, 226, 214]], villaRoof: [[196, 120, 90], [176, 108, 84]],
};
const pick = (arr, v) => arr[v % arr.length];
// ---- building sprite specs: (style, variant, s) -> sprite
function buildingSprite(style, v, s) {
  const r = (i) => hash2(v, i, style * 13);
  switch (style) {
    case 0: return newSpr(22, 12, s, c => { c.shadow(10, 10, 6); const wc = [150, 118, 80]; c.cyl(5.5, 3.4, 0, wc); c.cone(7, 6.5, 3.4, [206, 176, 96]); });
    case 1: { const a = 24 + (v % 3) * 4, b = 18 + (v % 2) * 4, W = pick(PAL.roman, v), R = pick(PAL.romanRoof, v >> 1); return newSpr(a + b + 4, 12, s, c => { c.shadow(a, b, 8); c.box(a, b, 6, 0, W, { win: [70, 40, 30] }); c.flat(a, b, 6, mixc(W, [110, 90, 70], 0.3), 0.98); c.box(a * 0.5, b * 0.45, 1.2, 6, R, { ol: 0.4 }); }); }
    case 2: { const a = 24, b = 18; return newSpr(a + b, 5, s, c => { const W = [150, 144, 132]; c.box(a, b, 2.4 + (v % 3), 0, W, { ol: 0.5 }); c.flat(a, b, 2.4 + (v % 3), [124, 120, 108], 1.0); for (let i = 0; i < 4; i++) { const e = (r(i) - 0.5) * a * 0.7, n = (r(i + 5) - 0.5) * b * 0.7; c.box(4, 4, 1.4 + r(i + 9) * 2, 2.4, [136, 130, 118], { ol: 0.4 }); } }); }
    case 3: { const a = 18 + (v % 3) * 3, b = 14 + (v % 2) * 3, W = pick(PAL.med, v), R = pick(PAL.medRoof, v >> 1); return newSpr(a + b + 4, 17, s, c => { c.shadow(a, b, 12); c.box(a, b, 7.5, 0, W, { win: [60, 40, 30], floors: 2 }); c.flat(a, b, 7.5, mixc(W, [100, 82, 66], 0.3), 0.98); if (v % 3 === 0) c.dome(3.6, 3.4, 7.7, [236, 228, 208], a * 0.2, -b * 0.15); else c.box(a * 0.4, b * 0.4, 2.0, 7.5, R, { ol: 0.4 }); }); }
    case 4: { const a = 22 + (v % 2) * 4, b = 18, W = pick(PAL.ott, v), R = pick(PAL.ottRoof, v); return newSpr(a + b + 4, 16, s, c => { c.shadow(a, b, 9); c.box(a, b, 7, 0, W, { win: [80, 70, 60], floors: 2 }); c.flat(a, b, 7, mixc(W, [120, 100, 80], 0.25), 0.98); c.dome(5.2, 5.6, 7, R, 0, 0); if (v % 2 === 0) { c.dome(2.4, 2.6, 7, R, a * 0.34, b * 0.3); c.dome(2.4, 2.6, 7, R, -a * 0.34, -b * 0.3); } }); }
    case 5: { const a = 24 + (v % 3) * 3, b = 20 + (v % 2) * 3, W = pick(PAL.bar, v), R = pick(PAL.barRoof, v >> 2); return newSpr(a + b + 4, 20, s, c => { c.shadow(a, b, 14); c.box(a, b, 11.5, 0, W, { win: [60, 56, 70], floors: 3 }); c.flat(a, b, 11.5, mixc(W, [110, 90, 80], 0.3), 0.98); for (const [e, n] of [[-a * 0.32, -b * 0.28], [a * 0.32, b * 0.28]]) { c.box(3.4, 3.4, 3.2, 11.5, W, { ol: 0.4 }); c.dome(2.6, 2.2, 14.7, R, e, n); } c.box(a * 0.5, b * 0.4, 1.4, 11.5, R, { ol: 0.4 }); }); }
    case 6: { const a = 36 + (v % 3) * 5, b = 26 + (v % 2) * 4, W = pick(PAL.hist, v), R = pick(PAL.histRoof, v >> 1); return newSpr(a + b + 4, 28, s, c => { c.shadow(a, b, 20); c.box(a, b, 14, 0, W, { win: [60, 68, 82], floors: 3 }); c.flat(a, b, 14, mixc(W, [90, 80, 70], 0.2), 0.98); c.hip(a * 0.7, b * 0.7, 14, 4.6, R, 0.5, 1.0); if (v % 4 === 0) c.dome(4.2, 4.4, 14, [236, 232, 218], a * 0.3, 0); }); }
    case 7: { const a = 34 + (v % 3) * 4, b = 26, W = pick(PAL.inter, v); return newSpr(a + b + 4, 26, s, c => { c.shadow(a, b, 20); c.box(a, b, 19, 0, W, { win: [60, 70, 86], floors: 5 }); c.flat(a, b, 19, [124, 120, 114], 1.0); c.box(8, 8, 3, 19, mixc(W, [120, 110, 100], 0.4), { ol: 0.4 }); }); }
    case 8: { const long = v % 2, a = long ? 14 : 66, b = long ? 66 : 14, W = pick(PAL.panel, v >> 1); return newSpr(a + b + 6, 38, s, c => { c.shadow(a, b, 30, 0.8); c.box(a, b, 30, 0, W, { win: [84, 94, 108], floors: 9 }); c.flat(a, b, 30, [104, 108, 108], 0.96); }); }
    case 9: { const a = 32 + (v % 2) * 4, b = 28, W = pick(PAL.mod, v), ht = 30 + (v % 3) * 10; return newSpr(a + b + 4, ht + 10, s, c => { c.shadow(a, b, ht + 4); c.box(a, b, ht, 0, W, { win: [236, 244, 250], floors: Math.round(ht / 4) }); c.flat(a, b, ht, mixc(W, [240, 240, 240], 0.35), 1.12); }); }
    case 10: { const a = 15 + (v % 2) * 2, b = 12, W = pick(PAL.villa, v), R = pick(PAL.villaRoof, v >> 1); return newSpr(a + b + 4, 12, s, c => { c.shadow(a, b, 7); c.box(a, b, 5.2, 0, W, { win: [70, 60, 56], floors: 1 }); c.flat(a, b, 5.2, mixc(W, [120, 110, 100], 0.2), 1.0); c.box(a * 0.62, b * 0.56, 1.0, 5.2, R, { ol: 0.4 }); }); }
    case 11: return newSpr(22, 8, s, c => { // rubble
      const cols = [[92, 84, 78], [70, 64, 60], [118, 108, 98]]; for (let i = 0; i < 7; i++) { const e = (r(i) - 0.5) * 16, n = (r(i + 7) - 0.5) * 12, a = 5 + r(i + 3) * 5, b = 4 + r(i + 11) * 4; c.box(a, b, 1 + r(i + 4) * 2.4, 0, cols[i % 3], { ol: 0.35 }); } });
    case 22: return newSpr(14, 14, s, c => { c.g.fillStyle = 'rgba(15,20,10,0.25)'; const [x, y] = c.pt(4, -1, 0); c.g.beginPath(); c.g.ellipse(x, y, 5.5 * s, 2.4 * s, 0, 0, 7); c.g.fill(); const tc = [[238, 232, 214], [222, 120, 70], [226, 196, 110], [120, 150, 200]][v % 4]; c.cyl(5, 3, 0, tc); c.cone(5.6, 5.8, 3, mixc(tc, [255, 255, 255], 0.1)); c.cone(1.1, 3.4, 8.6, [190, 40, 40]); });
    case 20: return newSpr(14, 16, s, c => { c.g.fillStyle = 'rgba(15,20,10,0.25)'; const [x, y] = c.pt(3.5, -1, 0); c.g.beginPath(); c.g.ellipse(x, y, 5 * s, 2.4 * s, 0, 0, 7); c.g.fill(); c.cyl(0.7, 4.4, 0, [96, 66, 40]); const gs = [[62, 118, 52], [48, 100, 46], [78, 134, 58]]; const [bx, by] = c.pt(0, 0, 4.4); const g = c.g; for (let i = 0; i < 3; i++) { const k = i === 0 ? [0, 0, 5.2] : i === 1 ? [-2, 0.6, 4.0] : [2, -0.8, 4.1]; const [x2, y2] = c.pt(k[0], k[1], 4.4 + (i === 0 ? 2.0 : 0.6)); g.beginPath(); g.arc(x2, y2, k[2] * s * 0.95, 0, 7); g.fillStyle = rgb(gs[(i + v) % 3], i === 0 ? 1.1 : 0.92); g.fill(); g.strokeStyle = 'rgba(20,40,14,0.45)'; g.lineWidth = Math.max(0.6, s * 0.5); g.stroke(); } });
    case 21: return newSpr(12, 18, s, c => { c.g.fillStyle = 'rgba(15,20,10,0.25)'; const [x, y] = c.pt(3, -1, 0); c.g.beginPath(); c.g.ellipse(x, y, 4 * s, 2 * s, 0, 0, 7); c.g.fill(); c.cyl(0.6, 3, 0, [90, 62, 40]); for (let i = 0; i < 3; i++) { c.cone(4.4 - i * 1.1, 4.4, 2.2 + i * 3.1, [34 + i * 6, 88 + i * 8, 54], 0, 0); } });
  }
  return newSpr(10, 6, s, c => { c.box(8, 8, 4, 0, [200, 200, 200]); });
}
const SPR = {};
function getSpr(style, v, lod) { const key = style * 1000 + (v & 15) * 4 + lod; let o = SPR[key]; if (!o) { o = buildingSprite(style, v & 15, LODS[lod]); SPR[key] = o; } return o; }

// ---- landmark sprites (units = metres)
const LM = {};
const SANDST = [176, 74, 52], SANDST2 = [196, 98, 66], MARBLE = [240, 236, 224], CREAM = [232, 214, 170], PINK = [226, 150, 126];
function landmark(name, lod) {
  const key = name + lod; if (LM[key]) return LM[key]; const s = LODS[lod]; let o;
  switch (name) {
    case 'qutb': o = newSpr(72, 90, s, c => { // Qutb Minar: five tapering storeys with balconies
      c.g.fillStyle = 'rgba(15,20,10,0.25)'; const [x, y] = c.pt(30, -4, 0); c.g.beginPath(); c.g.ellipse(x, y, 20 * s, 5 * s, 0, 0, 7); c.g.fill();
      c.box(34, 34, 2.4, 0, [188, 170, 140], { ol: 0.4 });
      const st = [[7.1, 26, 0, SANDST], [5.6, 14, 26, SANDST2], [4.4, 11, 40, SANDST], [3.4, 8, 51, [196, 130, 96]], [2.6, 5.6, 59, MARBLE], [2.1, 4.4, 64.6, [226, 206, 170]]];
      st.forEach(([r, h, z, col], i) => { c.cyl(r, h, z + 2.4, col); c.cyl(r + 0.9, 0.9, z + 2.4 + h - 0.9, [150, 62, 44]); });
      c.dome(1.9, 2.4, 71.4, [232, 220, 196]); }); break;
    case 'jama': o = newSpr(214, 52, s, c => { // Jama Masjid: platform, prayer hall, 3 striped domes, 2 minarets
      c.shadow(110, 92, 8); c.box(110, 92, 6, 0, [190, 90, 62], { ol: 0.5 }); c.flat(110, 92, 6, [214, 190, 150], 1.0);
      c.box(66, 24, 12, 6, [220, 120, 84], { win: [80, 50, 40], floors: 1 }); c.flat(66, 24, 18, [200, 110, 78], 1.0);
      c.cyl(8, 8, 18, MARBLE, 0, 0); c.dome(9, 11, 26, MARBLE, 0, 0); c.cone(0.7, 5, 37, [210, 170, 90], 0, 0);
      for (const e of [-20, 20]) { c.cyl(6.2, 5, 18, MARBLE, e, 0); c.dome(7, 8, 23, [226, 224, 214], e, 0); }
      for (const [e, n] of [[-54, 44], [54, 44]]) { c.cyl(3.2, 38, 6, [224, 110, 78], e, n); c.cyl(3.8, 1.2, 28, MARBLE, e, n); c.cone(3.2, 5, 44, MARBLE, e, n); }
      c.box(18, 14, 10, 6, [214, 100, 70], { win: [80, 50, 40], floors: 1 }); }); break;
    case 'tomb': o = newSpr(204, 62, s, c => { // Humayun's Tomb: sandstone plinth, white double dome
      c.shadow(100, 100, 14); c.box(100, 100, 7, 0, [196, 92, 62], { ol: 0.5 }); c.flat(100, 100, 7, [206, 170, 126], 1.0);
      c.box(56, 56, 13, 7, [200, 84, 56], { win: [240, 236, 226], floors: 2 }); c.flat(56, 56, 20, [230, 220, 200], 1.0);
      for (const [e, n] of [[-24, -24], [24, -24], [24, 24], [-24, 24]]) c.dome(3.2, 4, 20, MARBLE, e, n);
      c.cyl(13, 9, 20, [226, 224, 216], 0, 0); c.dome(14, 15, 29, MARBLE, 0, 0); c.cone(0.8, 5, 43, [210, 170, 90], 0, 0); }); break;
    case 'tomb2': o = newSpr(72, 30, s, c => { // smaller domed tomb (Lodi, Tughlaq, Safdarjung-style)
      c.shadow(34, 34, 12); c.box(34, 34, 3, 0, [170, 160, 140], { ol: 0.4 }); c.box(24, 24, 9, 3, [150, 140, 126], { win: [50, 46, 44], floors: 1 }); c.flat(24, 24, 12, [166, 154, 138], 1.0); c.cyl(7, 3, 12, [158, 148, 132], 0, 0); c.dome(7.6, 7, 15, [176, 166, 150], 0, 0); }); break;
    case 'mosque': o = newSpr(84, 26, s, c => { c.shadow(46, 30, 9); c.box(46, 30, 8, 0, [204, 120, 90], { win: [70, 50, 40], floors: 1 }); c.flat(46, 30, 8, [188, 108, 80], 1.0); for (const e of [-13, 0, 13]) c.dome(5.6, 6.4, 8, [236, 230, 214], e, 0); c.cyl(2.2, 16, 8, [214, 110, 80], -22, 15); c.cone(2.4, 3, 24, MARBLE, -22, 15); }); break;
    case 'pavilion': o = newSpr(74, 24, s, c => { c.shadow(44, 24, 10); c.box(44, 24, 8, 0, MARBLE, { win: [150, 120, 100], floors: 1 }); c.flat(44, 24, 8, [220, 214, 200], 1.0); for (const [e, n] of [[-17, -8], [17, -8], [17, 8], [-17, 8]]) { c.cyl(2.2, 4, 8, MARBLE, e, n); c.dome(2.6, 2.6, 12, [214, 140, 96], e, n); } c.dome(5, 4, 8, [214, 140, 96], 0, 0); }); break;
    case 'pillar': o = newSpr(10, 26, s, c => { c.g.fillStyle = 'rgba(15,20,10,0.25)'; const [x, y] = c.pt(6, -1, 0); c.g.beginPath(); c.g.ellipse(x, y, 4 * s, 1.8 * s, 0, 0, 7); c.g.fill(); c.box(5, 5, 3, 0, [200, 184, 150], { ol: 0.4 }); c.cyl(1.0, 13, 3, [214, 196, 160]); c.cyl(1.5, 1.4, 16, [200, 180, 140]); }); break;
    case 'jantar': o = newSpr(72, 26, s, c => { // Samrat Yantra: giant sundial
      c.shadow(26, 36, 10); c.box(26, 40, 3, 0, [226, 206, 170], { ol: 0.4 }); const A = -9, B = 9; c.poly([[A, -18, 3], [B, -18, 3], [B, -18, 18], [A, -18, 3]], [236, 228, 208], 0.9, 0.5); c.poly([[A, -18, 3], [A, 18, 3], [A, 18, 3], [A, -18, 3]], [210, 190, 150], 0.7, 0); c.poly([[B, -18, 3], [B, 18, 3], [B, -18, 18]], [244, 238, 224], 0.7, 0.5); c.poly([[A, -18, 18], [B, -18, 18], [B, 18, 3], [A, 18, 3]], [224, 96, 70], 1.0, 0.5); }); break;
    case 'indiagate': o = newSpr(100, 52, s, c => { // India Gate: 42 m sandstone arch, the opening faces south/north
      c.shadow(34, 22, 42, 0.6); c.box(46, 40, 3, 0, [218, 168, 128], { ol: 0.4 }); c.flat(46, 40, 3, [206, 156, 118], 1.0);
      const A = 17, N0 = -9; c.box(34, 18, 40, 3, [222, 152, 112], { ol: 0.5 }); c.flat(34, 18, 43, [204, 134, 98], 1.0);
      const arch = [[-8, N0, 3], [-8, N0, 27]]; for (let i = 0; i <= 8; i++) { const t = i / 8 * Math.PI; arch.push([-8 * Math.cos(t), N0, 27 + 8 * Math.sin(t)]); } arch.push([8, N0, 3]);
      c.poly(arch, [58, 40, 34], 1.0, 0.5); c.box(34, 18, 4, 36, [234, 170, 130], { ol: 0.4 }); c.box(38, 22, 2.4, 43, [226, 160, 122], { ol: 0.4 }); c.flat(38, 22, 45.4, [212, 142, 106], 1.0); c.cyl(3, 2, 45.4, [200, 130, 96], 0, 0); }); break;
    case 'rbhavan': o = newSpr(250, 58, s, c => { // Rashtrapati Bhavan: long cream-sandstone palace, central copper dome
      c.shadow(190, 120, 22, 0.6); c.box(190, 20, 16, 0, CREAM, { win: [100, 70, 56], floors: 3 }); c.flat(190, 20, 16, [214, 196, 152], 1.0);
      c.box(30, 150, 14, 0, CREAM, { win: [100, 70, 56], floors: 3 }); c.flat(30, 150, 14, [214, 196, 152], 1.0);
      c.box(60, 60, 20, 0, [238, 220, 176], { win: [100, 70, 56], floors: 3 }); c.flat(60, 60, 20, [214, 196, 152], 1.0); c.cyl(14, 14, 20, [238, 224, 188], 0, 0); c.dome(15, 16, 34, [110, 150, 126], 0, 0); c.cone(0.8, 6, 50, [210, 170, 90], 0, 0);
      for (const [e, n] of [[-86, -6], [86, -6], [-86, 6], [86, 6]]) c.dome(3, 3.2, 16, [210, 120, 90], e, n);
      for (const e of [-50, 50]) { c.box(26, 22, 18, 0, [238, 220, 176], { win: [100, 70, 56], floors: 3 }); } }); break;
    case 'secr': o = newSpr(206, 34, s, c => { c.shadow(160, 40, 16); c.box(160, 36, 14, 0, [226, 170, 126], { win: [100, 60, 50], floors: 3 }); c.flat(160, 36, 14, [208, 150, 108], 1.0); for (const e of [-70, 70]) { c.box(18, 30, 4, 14, [226, 170, 126], { ol: 0.4 }); c.dome(5, 4.6, 18, [120, 150, 130], e, 0); } c.dome(7, 6, 14, [120, 150, 130], 0, 0); }); break;
    case 'sansad': o = newSpr(250, 26, s, c => { // Parliament House: circular colonnaded building
      c.shadow(170, 170, 12, 0.5); c.cyl(85, 12, 0, [228, 200, 156], 0, 0, 40); c.cyl(70, 4, 12, [212, 184, 140], 0, 0, 40); c.cyl(46, 5, 12, [236, 214, 170], 0, 0, 40); c.dome(30, 8, 17, [218, 200, 160], 0, 0); }); break;
    case 'cp': o = newSpr(320, 20, s, c => { // Connaught Place: circular colonnaded colonial ring
      c.shadow(220, 220, 10, 0.4); c.cyl(112, 11, 0, [240, 232, 214], 0, 0, 48); c.cyl(92, 5, 11, [214, 206, 180], 0, 0, 48); c.cyl(72, 2, 11, [112, 150, 96], 0, 0, 48); }); break;
    case 'lotus': o = newSpr(100, 40, s, c => { // Lotus Temple: white marble petals
      c.shadow(60, 60, 20); c.cyl(34, 2.4, 0, [214, 208, 190], 0, 0, 36); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, e = Math.cos(a) * 15, n = Math.sin(a) * 15; c.cone(7.2, 22, 2.4, [246, 244, 238], e, n); } for (let i = 0; i < 9; i++) { const a = (i + 0.5) / 9 * 6.283, e = Math.cos(a) * 7, n = Math.sin(a) * 7; c.cone(6.2, 28, 2.4, [250, 248, 244], e, n); } }); break;
    case 'akshardham': o = newSpr(190, 56, s, c => { // Akshardham: pink sandstone temple, many spires
      c.shadow(100, 80, 18); c.box(100, 80, 3, 0, [230, 200, 176], { ol: 0.4 }); c.box(74, 56, 15, 3, PINK, { win: [100, 60, 56], floors: 2 }); c.flat(74, 56, 18, [214, 150, 126], 1.0);
      for (const [e, n] of [[-30, -22], [30, -22], [30, 22], [-30, 22], [0, -22], [0, 22], [-30, 0], [30, 0]]) { c.cyl(3, 3, 18, PINK, e, n); c.dome(3.6, 4, 21, [236, 214, 186], e, n); }
      c.box(26, 26, 8, 18, PINK, { win: [100, 60, 56], floors: 1 }); c.cone(10, 18, 26, [226, 162, 136], 0, 0); c.cone(0.8, 5, 44, [210, 170, 90], 0, 0); }); break;
  }
  LM[key] = o; return o;
}
