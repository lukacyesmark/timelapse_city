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
const PAL = {
  roman: [[226, 200, 158], [214, 182, 140], [232, 210, 170]], romanRoof: [[190, 92, 56], [176, 84, 52]],
  med: [[206, 190, 158], [196, 176, 142], [214, 198, 168]], medRoof: [[118, 70, 52], [98, 62, 50], [132, 82, 58]],
  ott: [[242, 232, 212], [236, 222, 196], [228, 214, 190]], ottRoof: [[178, 100, 66], [164, 92, 62]],
  bar: [[236, 200, 120], [226, 160, 150], [166, 198, 218], [232, 218, 180], [190, 214, 170]], barRoof: [[140, 76, 62], [120, 70, 60]],
  hist: [[234, 222, 192], [222, 206, 172], [206, 190, 162], [226, 196, 160]], histRoof: [[88, 100, 114], [100, 108, 112]],
  inter: [[216, 202, 172], [202, 192, 178], [226, 214, 190]],
  panel: [[176, 176, 166], [190, 184, 172], [162, 164, 160]],
  mod: [[134, 178, 208], [100, 144, 176], [208, 214, 218]],
  villa: [[232, 218, 192], [224, 200, 170], [208, 214, 196]], villaRoof: [[172, 72, 52], [150, 64, 52]],
};
const pick = (arr, v) => arr[v % arr.length];
// ---- building sprite specs: (style, variant, s) -> sprite
function buildingSprite(style, v, s) {
  const r = (i) => hash2(v, i, style * 13);
  switch (style) {
    case 0: return newSpr(22, 12, s, c => { c.shadow(10, 10, 6); const wc = [150, 118, 80]; c.cyl(5.5, 3.4, 0, wc); c.cone(7, 6.5, 3.4, [206, 176, 96]); });
    case 1: { const a = 26 + (v % 3) * 4, b = 18 + (v % 2) * 4, W = pick(PAL.roman, v), R = pick(PAL.romanRoof, v >> 1), rg = v % 2 ? 'n' : 'e'; return newSpr(a + b + 4, 12, s, c => { c.shadow(a, b, 8); c.box(a, b, 6, 0, W, { win: [70, 40, 30] }); c.gable(a, b, 6, 3.4, R, W, rg, 0.6); }); }
    case 2: { const a = 24, b = 18; return newSpr(a + b, 5, s, c => { const W = [150, 144, 132]; c.box(a, b, 2.4 + (v % 3), 0, W, { ol: 0.5 }); c.flat(a, b, 2.4 + (v % 3), [124, 120, 108], 1.0); for (let i = 0; i < 4; i++) { const e = (r(i) - 0.5) * a * 0.7, n = (r(i + 5) - 0.5) * b * 0.7; c.box(4, 4, 1.4 + r(i + 9) * 2, 2.4, [136, 130, 118], { ol: 0.4 }); } }); }
    case 3: { const a = 18 + (v % 3) * 3, b = 12 + (v % 2) * 3, W = pick(PAL.med, v), R = pick(PAL.medRoof, v >> 1); return newSpr(a + b + 4, 17, s, c => { c.shadow(a, b, 12); c.box(a, b, 7, 0, W, { win: [60, 40, 30], floors: 2 }); c.gable(a, b, 7, 7.5, R, W, v % 2 ? 'n' : 'e', 0.8); }); }
    case 4: { const a = 22 + (v % 2) * 4, b = 18, W = pick(PAL.ott, v), R = pick(PAL.ottRoof, v); return newSpr(a + b + 4, 14, s, c => { c.shadow(a, b, 8); c.box(a, b, 6, 0, W, { win: [80, 90, 100], floors: 2 }); c.hip(a, b, 6, 3.4, R, 0.5); if (v % 4 === 0) c.dome(4.2, 4, 6.2, [150, 158, 168], 4, -3); }); }
    case 5: { const a = 26 + (v % 3) * 3, b = 20 + (v % 2) * 3, W = pick(PAL.bar, v), R = pick(PAL.barRoof, v >> 2); return newSpr(a + b + 4, 22, s, c => { c.shadow(a, b, 14); c.box(a, b, 11, 0, W, { win: [60, 70, 90], floors: 3 }); c.hip(a, b, 11, 6, R, 0.4); }); }
    case 6: { const a = 38 + (v % 3) * 5, b = 28 + (v % 2) * 4, W = pick(PAL.hist, v), R = pick(PAL.histRoof, v >> 1); return newSpr(a + b + 4, 36, s, c => { c.shadow(a, b, 26); c.box(a, b, 22, 0, W, { win: [58, 70, 92], floors: 5 }); c.flat(a, b, 22, mixc(W, [90, 80, 70], 0.25), 0.95); c.hip(a - 3, b - 3, 22, 6.5, R, 0.55, 1.2); if (v % 5 === 0) c.cone(3.4, 8, 28.5, [92, 120, 112], a * 0.3, 0); }); }
    case 7: { const a = 34 + (v % 3) * 4, b = 26, W = pick(PAL.inter, v); return newSpr(a + b + 4, 26, s, c => { c.shadow(a, b, 20); c.box(a, b, 19, 0, W, { win: [60, 70, 86], floors: 5 }); c.flat(a, b, 19, [124, 120, 114], 1.0); c.box(8, 8, 3, 19, mixc(W, [120, 110, 100], 0.4), { ol: 0.4 }); }); }
    case 8: { const long = v % 2, a = long ? 14 : 66, b = long ? 66 : 14, W = pick(PAL.panel, v >> 1); return newSpr(a + b + 6, 38, s, c => { c.shadow(a, b, 30, 0.8); c.box(a, b, 30, 0, W, { win: [84, 94, 108], floors: 9 }); c.flat(a, b, 30, [104, 108, 108], 0.96); }); }
    case 9: { const a = 32 + (v % 2) * 4, b = 28, W = pick(PAL.mod, v), ht = 30 + (v % 3) * 10; return newSpr(a + b + 4, ht + 10, s, c => { c.shadow(a, b, ht + 4); c.box(a, b, ht, 0, W, { win: [236, 244, 250], floors: Math.round(ht / 4) }); c.flat(a, b, ht, mixc(W, [240, 240, 240], 0.35), 1.12); }); }
    case 10: { const a = 14 + (v % 2) * 2, b = 11, W = pick(PAL.villa, v), R = pick(PAL.villaRoof, v >> 1); return newSpr(a + b + 4, 13, s, c => { c.shadow(a, b, 8); c.box(a, b, 5, 0, W, { win: [70, 60, 56], floors: 1 }); c.gable(a, b, 5, 4.2, R, W, v % 2 ? 'n' : 'e', 0.7); }); }
    case 11: return newSpr(22, 8, s, c => { // rubble
      const cols = [[92, 84, 78], [70, 64, 60], [118, 108, 98]]; for (let i = 0; i < 7; i++) { const e = (r(i) - 0.5) * 16, n = (r(i + 7) - 0.5) * 12, a = 5 + r(i + 3) * 5, b = 4 + r(i + 11) * 4; c.box(a, b, 1 + r(i + 4) * 2.4, 0, cols[i % 3], { ol: 0.35 }); } });
    case 22: return newSpr(14, 14, s, c => { c.g.fillStyle = 'rgba(15,20,10,0.25)'; const [x, y] = c.pt(4, -1, 0); c.g.beginPath(); c.g.ellipse(x, y, 5.5 * s, 2.4 * s, 0, 0, 7); c.g.fill(); c.cyl(5, 3, 0, [238, 232, 214]); c.cone(5.6, 5.8, 3, [236, 228, 208]); c.cone(1.1, 3.4, 8.6, [190, 40, 40]); });
    case 20: return newSpr(14, 16, s, c => { c.g.fillStyle = 'rgba(15,20,10,0.25)'; const [x, y] = c.pt(3.5, -1, 0); c.g.beginPath(); c.g.ellipse(x, y, 5 * s, 2.4 * s, 0, 0, 7); c.g.fill(); c.cyl(0.7, 4.4, 0, [96, 66, 40]); const gs = [[62, 118, 52], [48, 100, 46], [78, 134, 58]]; const [bx, by] = c.pt(0, 0, 4.4); const g = c.g; for (let i = 0; i < 3; i++) { const k = i === 0 ? [0, 0, 5.2] : i === 1 ? [-2, 0.6, 4.0] : [2, -0.8, 4.1]; const [x2, y2] = c.pt(k[0], k[1], 4.4 + (i === 0 ? 2.0 : 0.6)); g.beginPath(); g.arc(x2, y2, k[2] * s * 0.95, 0, 7); g.fillStyle = rgb(gs[(i + v) % 3], i === 0 ? 1.1 : 0.92); g.fill(); g.strokeStyle = 'rgba(20,40,14,0.45)'; g.lineWidth = Math.max(0.6, s * 0.5); g.stroke(); } });
    case 21: return newSpr(12, 18, s, c => { c.g.fillStyle = 'rgba(15,20,10,0.25)'; const [x, y] = c.pt(3, -1, 0); c.g.beginPath(); c.g.ellipse(x, y, 4 * s, 2 * s, 0, 0, 7); c.g.fill(); c.cyl(0.6, 3, 0, [90, 62, 40]); for (let i = 0; i < 3; i++) { c.cone(4.4 - i * 1.1, 4.4, 2.2 + i * 3.1, [34 + i * 6, 88 + i * 8, 54], 0, 0); } });
  }
  return newSpr(10, 6, s, c => { c.box(8, 8, 4, 0, [200, 200, 200]); });
}
const SPR = {};
function getSpr(style, v, lod) { const key = style * 1000 + (v & 15) * 4 + lod; let o = SPR[key]; if (!o) { o = buildingSprite(style, v & 15, LODS[lod]); SPR[key] = o; } return o; }

// ---- landmark sprites
const LM = {};
function landmark(name, lod) {
  const key = name + lod; if (LM[key]) return LM[key]; const s = LODS[lod]; let o;
  switch (name) {
    case 'castle': o = newSpr(150, 60, s, c => { // medieval castle: curtain + keep
      c.shadow(120, 80, 30); c.box(110, 70, 8, 0, [186, 172, 150], { win: [60, 50, 44], floors: 1 }); c.flat(110, 70, 8, [170, 158, 138], 1.0);
      for (const [e, n] of [[-55, -35], [55, -35], [55, 35], [-55, 35]]) { c.cyl(7, 20, 0, [196, 182, 158], e, n); c.cone(8.5, 10, 20, [132, 74, 56], e, n); }
      c.box(34, 30, 24, 8, [200, 186, 160], { win: [60, 50, 44], floors: 3 }); c.gable(34, 30, 32, 11, [128, 70, 54], [200, 186, 160], 'e', 1.2); c.cyl(5.5, 16, 32, [196, 182, 158], 12, 8); c.cone(7, 9, 48, [128, 70, 54], 12, 8); }); break;
    case 'palace': o = newSpr(210, 70, s, c => {
      c.shadow(190, 60, 26); c.box(190, 56, 18, 0, [238, 224, 190], { win: [64, 76, 96], floors: 4 }); c.hip(190, 56, 18, 7, [118, 148, 132], 0.8, 1.2);
      c.box(46, 80, 18, 0, [238, 224, 190], { win: [64, 76, 96], floors: 4 }); c.hip(46, 80, 18, 7, [118, 148, 132], 0.5, 1.2); c.cyl(15, 14, 24, [238, 224, 190], 0, 0); c.dome(15.5, 17, 38, [112, 150, 134], 0, 0); c.cone(2, 8, 55, [196, 170, 90], 0, 0); }); break;
    case 'church': o = newSpr(80, 70, s, c => { c.shadow(54, 24, 30); c.box(54, 24, 19, 0, [232, 222, 196], { win: [60, 60, 80], floors: 1 }); c.gable(54, 24, 19, 14, [196, 120, 70], [232, 222, 196], 'e', 1.0); c.box(11, 11, 40, 0, [232, 222, 196], { win: [60, 60, 80], floors: 4 }); c.hip(11, 11, 40, 20, [86, 130, 120], 0.05, 0.6); const [x, y] = c.pt(0, 0, 61); c.g.fillStyle = '#c8a850'; c.g.fillRect(x - 0.5 * s, y - 3 * s, s, 3 * s); }); break;
    case 'parliament': o = newSpr(280, 60, s, c => {
      c.shadow(80, 262, 26, 0.5); c.box(70, 262, 18, 0, [236, 230, 218], { win: [70, 76, 96], floors: 3 }); c.gable(70, 262, 18, 12, [150, 72, 60], [236, 230, 218], 'n', 1.2);
      c.box(40, 56, 24, 0, [236, 230, 218], { win: [70, 76, 96], floors: 3 }); c.cyl(18, 22, 18, [236, 230, 218], 0, 0); c.dome(19, 22, 40, [160, 170, 168], 0, 0); c.cone(1.8, 12, 62, [200, 172, 90], 0, 0);
      for (const n of [-120, -70, 70, 120]) { c.cyl(3, 22, 18, [232, 226, 212], 20, n); c.cone(3.8, 9, 40, [150, 72, 60], 20, n); } for (const n of [-100, 100]) { c.box(14, 30, 30, 0, [236, 230, 218], { win: [70, 76, 96], floors: 3 }); c.gable(14, 30, 30, 10, [150, 72, 60], [236, 230, 218], 'n', 0.6); } }); break;
    case 'opera': o = newSpr(90, 50, s, c => { c.shadow(60, 44, 24); c.box(60, 44, 22, 0, [232, 214, 174], { win: [60, 60, 80], floors: 3 }); c.hip(60, 44, 22, 6, [112, 134, 124], 0.6, 1); c.cyl(9, 8, 22, [232, 214, 174], 0, 0); c.dome(9.5, 9, 30, [112, 150, 134], 0, 0); }); break;
    case 'basilica': o = newSpr(90, 80, s, c => { c.shadow(66, 66, 30); c.box(66, 66, 26, 0, [232, 222, 196], { win: [60, 60, 80], floors: 3 }); c.flat(66, 66, 26, [200, 190, 166], 1); c.cyl(15, 22, 26, [232, 222, 196], 0, 0); c.dome(16, 20, 48, [120, 164, 140], 0, 0); for (const n of [-21, 21]) { c.box(10, 10, 34, 0, [232, 222, 196], { win: [60, 60, 80], floors: 3 }); } }); break;
    case 'citadel': o = newSpr(180, 30, s, c => { c.shadow(140, 50, 12); c.box(150, 44, 10, 0, [178, 170, 150]); c.flat(150, 44, 10, [158, 150, 132], 1); for (const [e, n] of [[-75, -22], [75, -22], [75, 22], [-75, 22], [0, 22]]) { c.box(18, 18, 14, 0, [180, 172, 152]); c.flat(18, 18, 14, [160, 152, 134], 1); } c.box(46, 22, 18, 0, [190, 180, 160], { win: [60, 60, 70], floors: 2 }); c.gable(46, 22, 18, 7, [140, 74, 56], [190, 180, 160], 'e', 0.8); }); break;
    case 'bath': o = newSpr(70, 30, s, c => { c.shadow(44, 30, 10); c.box(44, 30, 8, 0, [226, 214, 190], { win: [60, 70, 80], floors: 1 }); c.flat(44, 30, 8, [196, 186, 164]); c.dome(12, 8, 8, [150, 164, 176], 0, 0); for (const [e, n] of [[-14, 8], [14, -6], [10, 8]]) c.dome(5, 4, 8, [150, 164, 176], e, n); }); break;
    case 'minaret': o = newSpr(14, 52, s, c => { c.g.fillStyle = 'rgba(15,20,10,0.25)'; const [x, y] = c.pt(8, -2, 0); c.g.beginPath(); c.g.ellipse(x, y, 5 * s, 2.2 * s, 0, 0, 7); c.g.fill(); c.cyl(3.4, 4, 0, [226, 220, 204]); c.cyl(2.2, 34, 4, [236, 232, 220]); c.cyl(3.4, 1.4, 25, [214, 206, 188]); c.cone(2.9, 12, 38, [124, 140, 150]); c.cone(0.5, 4, 50, [200, 170, 80]); }); break;
    case 'amph': o = newSpr(104, 14, s, c => { const g = c.g; for (const [r, z, col] of [[44, 0, [214, 188, 142]], [44, 7, [224, 198, 152]]]) { const [cx, cy] = c.pt(0, 0, z), rx = r * 1.4142 * s * 0.55, ry = r * 0.7071 * s * 0.55; g.beginPath(); g.ellipse(cx, cy, rx * 1.0, ry * 1.0, 0, 0, 7); g.fillStyle = rgb(col, z ? 1.05 : 0.7); g.fill(); g.strokeStyle = 'rgba(25,15,8,0.5)'; g.lineWidth = Math.max(0.7, s * 0.6); g.stroke(); } const [cx, cy] = c.pt(0, 0, 7); g.beginPath(); g.ellipse(cx, cy, 14 * 1.4142 * s * 0.55, 14 * 0.7071 * s * 0.55, 0, 0, 7); g.fillStyle = 'rgb(206,176,120)'; g.fill(); g.stroke(); }); break;
    case 'bridge_tower': o = newSpr(22, 52, s, c => { c.shadow(10, 14, 36); c.box(10, 14, 40, 0, [206, 198, 176], { win: [70, 70, 76], floors: 4 }); c.flat(10, 14, 40, [170, 160, 140]); c.box(8, 12, 6, 40, [226, 218, 196]); c.hip(8, 12, 46, 6, [92, 118, 106], 0.1, 0.4); }); break;
    case 'hall': o = newSpr(60, 22, s, c => { c.shadow(46, 24, 10); c.box(46, 24, 8, 0, [200, 184, 156], { win: [60, 50, 44], floors: 1 }); c.gable(46, 24, 8, 9, [150, 90, 60], [200, 184, 156], 'e', 1.0); c.box(8, 8, 18, 0, [200, 184, 156]); c.pyramid(8, 8, 18, 8, [130, 74, 56]); }); break;
  }
  LM[key] = o; return o;
}
