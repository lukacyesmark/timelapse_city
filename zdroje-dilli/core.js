'use strict';
// ================= CORE: projection, data, terrain (WebGL2) =================
const W = 1920, H = 1080, D2R = Math.PI / 180;
const LAT0 = 28.60, LON0 = 77.21, KX = 111320 * Math.cos(LAT0 * D2R), KY = 110574;
const ll = (lat, lon) => [(lon - LON0) * KX, (lat - LAT0) * KY];
const SAFFRON = '#ff9933', GREENIN = '#138808';
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const smoother = t => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const yieldUI = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
const S = m => { const el = document.getElementById('status'); if (el) el.textContent = m; };
// ---- noise
function hash2(i, j, s) { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function noise2(x, y, s = 0) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v; }
function fbm2(x, y, o = 3, s = 0) { let t = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { t += a * noise2(x * f, y * f, s + i * 7); n += a; a *= 0.5; f *= 2.03; } return t / n; }
let seedv = 99; const rnd = () => (seedv = (seedv * 16807) % 2147483647) / 2147483647;

// ---- state
const CAM = { e: 0, n: 0, k: 0.25 }, VEX = 1.7, VS = 1.2247 * VEX;
let BB, GH = 1024, HM, WAT, WATB, WFAR, WN = 2048, DEMMETA;
function waterFar(e, n) { const x = Math.floor((e - BB[0]) / (BB[2] - BB[0]) * WN), y = Math.floor((n - BB[1]) / (BB[3] - BB[1]) * WN); if (x < 0 || y < 0 || x >= WN || y >= WN) return 0; return WFAR[(y * WN + x) * 4] / 255; }
const sxp = (e) => 0; // placeholder (see P)
function P(e, n, h) { return [W / 2 + ((e - CAM.e) + (n - CAM.n)) * CAM.k, H / 2 + ((e - CAM.e) - (n - CAM.n)) * CAM.k * 0.5 - (h || 0) * CAM.k * VS]; }
function hAt(e, n) {
  const u = (e - BB[0]) / (BB[2] - BB[0]) * (GH - 1), v = (n - BB[1]) / (BB[3] - BB[1]) * (GH - 1);
  if (u < 0 || v < 0 || u >= GH - 1 || v >= GH - 1) return 0;
  const x = Math.floor(u), y = Math.floor(v), fx = u - x, fy = v - y, i = y * GH + x;
  return (HM[i] * (1 - fx) + HM[i + 1] * fx) * (1 - fy) + (HM[i + GH] * (1 - fx) + HM[i + GH + 1] * fx) * fy;
}
function isWater(e, n) {
  const x = Math.floor((e - BB[0]) / (BB[2] - BB[0]) * WN), y = Math.floor((n - BB[1]) / (BB[3] - BB[1]) * WN);
  if (x < 0 || y < 0 || x >= WN || y >= WN) return false; return WAT[y * WN + x] > 127;
}

// ---- data loading
async function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img ' + src)); i.src = src; }); }
async function loadData() {
  const wj = await (await fetch('data/water.json')).json(); BB = wj.bb;
  // water mask
  const c = document.createElement('canvas'); c.width = WN; c.height = WN; const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000'; g.fillRect(0, 0, WN, WN); g.fillStyle = '#fff'; g.beginPath();
  for (const r of wj.rings) { r.forEach(([e, n], i) => { const x = (e - BB[0]) / (BB[2] - BB[0]) * WN, y = (n - BB[1]) / (BB[3] - BB[1]) * WN; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); }
  g.fill('evenodd');
  const d = g.getImageData(0, 0, WN, WN).data; WAT = new Uint8Array(WN * WN); for (let i = 0; i < WN * WN; i++) WAT[i] = d[i * 4];
  const c2 = document.createElement('canvas'); c2.width = WN; c2.height = WN; const g2 = c2.getContext('2d', { willReadFrequently: true }); g2.filter = 'blur(2.5px)'; g2.drawImage(c, 0, 0);
  const d2 = g2.getImageData(0, 0, WN, WN).data; WATB = new Uint8Array(WN * WN * 4); for (let i = 0; i < WN * WN; i++) { WATB[i * 4] = d2[i * 4]; WATB[i * 4 + 3] = 255; }
  // DEM
  DEMMETA = await (await fetch('data/dem.json')).json(); const M = DEMMETA, nx = M.x1 - M.x0 + 1, ny = M.y1 - M.y0 + 1;
  const mc = document.createElement('canvas'); mc.width = nx * 256; mc.height = ny * 256; const mg = mc.getContext('2d', { willReadFrequently: true });
  const jobs = []; for (let x = M.x0; x <= M.x1; x++) for (let y = M.y0; y <= M.y1; y++) jobs.push(loadImg(`data/dem/${x}_${y}.png`).then(im => mg.drawImage(im, (x - M.x0) * 256, (y - M.y0) * 256)));
  await Promise.all(jobs);
  const dd = mg.getImageData(0, 0, mc.width, mc.height).data, MW = mc.width, MH = mc.height, Z = new Float32Array(MW * MH);
  for (let i = 0; i < MW * MH; i++) Z[i] = dd[i * 4] * 256 + dd[i * 4 + 1] + dd[i * 4 + 2] / 256 - 32768;
  const nT = 2 ** M.z; HM = new Float32Array(GH * GH);
  for (let j = 0; j < GH; j++) {
    const n = BB[1] + j / (GH - 1) * (BB[3] - BB[1]), lat = (LAT0 + n / KY) * D2R, Y = (1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2 * nT, py = (Y - M.y0) * 256 - 0.5;
    for (let i = 0; i < GH; i++) {
      const e = BB[0] + i / (GH - 1) * (BB[2] - BB[0]), lon = LON0 + e / KX, X = (lon + 180) / 360 * nT, px = (X - M.x0) * 256 - 0.5;
      const x0 = clamp(Math.floor(px), 0, MW - 2), y0 = clamp(Math.floor(py), 0, MH - 2), fx = clamp(px - x0, 0, 1), fy = clamp(py - y0, 0, 1), k = y0 * MW + x0;
      HM[j * GH + i] = (Z[k] * (1 - fx) + Z[k + 1] * fx) * (1 - fy) + (Z[k + MW] * (1 - fx) + Z[k + MW + 1] * fx) * fy;
    }
  }
  // (Delhi: river is a stylised polygon, DEM flood-extension disabled)
  const added = 0;
  window.WATADDED = added;
  { const c5 = document.createElement('canvas'); c5.width = WN; c5.height = WN; const g5 = c5.getContext('2d', { willReadFrequently: true }); g5.fillStyle = '#000'; g5.fillRect(0, 0, WN, WN); const c6 = document.createElement('canvas'); c6.width = WN; c6.height = WN; const g6 = c6.getContext('2d'), id6 = g6.createImageData(WN, WN); for (let i = 0; i < WN * WN; i++) { id6.data[i * 4] = id6.data[i * 4 + 1] = id6.data[i * 4 + 2] = WAT[i]; id6.data[i * 4 + 3] = 255; } g6.putImageData(id6, 0, 0); g5.filter = 'blur(45px)'; g5.drawImage(c6, 0, 0); const d5 = g5.getImageData(0, 0, WN, WN).data; WFAR = new Uint8Array(WN * WN * 4); for (let i = 0; i < WN * WN; i++) { WFAR[i * 4] = d5[i * 4]; WFAR[i * 4 + 3] = 255; } }
  // relative heights: river level = 0
  const rivAt = n => 193.6 + 7.0 * (n - BB[1]) / (BB[3] - BB[1]);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GH; i++) {
    const wx = Math.floor(i / (GH - 1) * (WN - 1)), wy = Math.floor(j / (GH - 1) * (WN - 1));
    HM[j * GH + i] = WAT[wy * WN + wx] > 127 ? 0 : Math.max(0.4, HM[j * GH + i] - rivAt(BB[1] + j / (GH - 1) * (BB[3] - BB[1])));
  }
  // light smoothing (3x3) to remove DEM noise
  const T = new Float32Array(HM); for (let j = 1; j < GH - 1; j++) for (let i = 1; i < GH - 1; i++) { const k = j * GH + i; if (HM[k] === 0) continue; let s = 0, w = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const v = HM[k + dj * GH + di]; if (v === 0) continue; s += v; w++; } T[k] = s / w; } HM = T;
}

// ---- albedo texture (land colours baked once)
function buildAlbedo() {
  const A = 2048, c = document.createElement('canvas'); c.width = A; c.height = A; const g = c.getContext('2d'), id = g.createImageData(A, A), d = id.data;
  const ew = BB[2] - BB[0], nh = BB[3] - BB[1];
  for (let y = 0; y < A; y++) for (let x = 0; x < A; x++) {
    const e = BB[0] + (x + 0.5) / A * ew, n = BB[1] + (y + 0.5) / A * nh, h = hAt(e, n);
    const hx = hAt(e + 25, n) - hAt(e - 25, n), hy = hAt(e, n + 25) - hAt(e, n - 25), sl = Math.hypot(hx, hy) / 50;
    const nz = fbm2(e / 90, n / 90, 3, 5), nz2 = fbm2(e / 600, n / 600, 2, 9);
    let r = 128 + 24 * nz, gg = 138 + 14 * nz, b = 82 + 14 * nz;
    if (sl < 0.12 && h < 90) { // fields
      const zone = hash2(Math.floor(e / 2600), Math.floor(n / 2600), 11), ang = [0.25, 0.9, -0.45][Math.floor(zone * 3)], ca = Math.cos(ang), sa = Math.sin(ang), u = (e * ca + n * sa) / 170, v = (-e * sa + n * ca) / 260, cell = hash2(Math.floor(u), Math.floor(v), 3);
      if (cell > 0.45 && nz2 > 0.42) { const p = hash2(Math.floor(u), Math.floor(v), 4); const cols = [[170, 160, 84], [196, 172, 96], [128, 150, 68], [156, 126, 76], [140, 156, 76]]; const q = cols[Math.floor(p * 5)]; const uf = ((u % 1) + 1) % 1, vf = ((v % 1) + 1) % 1; const fe = (uf < 0.06 || uf > 0.94 || vf < 0.05 || vf > 0.95) ? 0.82 : 1; const st = 0.96 + 0.06 * Math.sin(vf * 60); r = lerp(r, q[0], 0.8) * fe * st; gg = lerp(gg, q[1], 0.8) * fe * st; b = lerp(b, q[2], 0.8) * fe * st; }
    }
    if (h > 26 + 20 * nz2 && sl < 0.6) { const t = clamp((h - 26) / 30); r = lerp(r, 92 + 10 * nz, t * 0.7); gg = lerp(gg, 112 + 10 * nz, t * 0.7); b = lerp(b, 62, t * 0.7); }
    if (sl > 0.32) { const t = clamp((sl - 0.32) / 0.3); r = lerp(r, 134, t); gg = lerp(gg, 120, t); b = lerp(b, 98, t); }
    const wi = (Math.floor(y / A * WN) * WN + Math.floor(x / A * WN)); const wb = WATB[wi * 4]; { const wf = WFAR[wi * 4] / 255; if (wf > 0.22 && wb < 6) { const t = clamp((wf - 0.22) / 0.4) * 0.8; r = lerp(r, 104 + 20 * nz, t); gg = lerp(gg, 152 + 12 * nz, t); b = lerp(b, 64, t); } }
    if (wb > 6 && wb < 250) { r = lerp(r, 205, 0.7); gg = lerp(gg, 195, 0.7); b = lerp(b, 158, 0.7); }
    const k = (y * A + x) * 4; d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
  }
  g.putImageData(id, 0, 0); return c;
}

// ---- WebGL terrain
const glc = document.createElement('canvas'); glc.width = W; glc.height = H;
const gl = glc.getContext('webgl2', { antialias: true, alpha: false, premultipliedAlpha: false });
let GLP, GLU = {}, GLN = 0, TEX = {};
const VSRC = `#version 300 es
precision highp float; precision highp sampler2D;
uniform sampler2D uH; uniform vec4 uBB; uniform vec2 uCam; uniform float uK, uVs; uniform int uGN;
out vec2 vUV; out float vH;
void main(){
  int i = gl_VertexID % uGN, j = gl_VertexID / uGN;
  vec2 uv = vec2(float(i), float(j)) / float(uGN - 1);
  float h = textureLod(uH, uv, 0.0).r;
  float e = mix(uBB.x, uBB.z, uv.x), n = mix(uBB.y, uBB.w, uv.y);
  float sx = ((e - uCam.x) + (n - uCam.y)) * uK;
  float sy = ((e - uCam.x) - (n - uCam.y)) * uK * 0.5 - h * uVs * uK;
  float dep = ((e - uCam.x) - (n - uCam.y)) * 0.6124 + h * 0.5;
  gl_Position = vec4(sx / ${W / 2}.0, -sy / ${H / 2}.0, -dep / 40000.0, 1.0);
  vUV = uv; vH = h;
}`;
const FSRC = `#version 300 es
precision highp float; precision highp sampler2D;
uniform sampler2D uAlb, uUY, uWat, uH, uWF; uniform float uYear, uTime, uFlood, uK; uniform vec3 uUrb; uniform vec2 uCell;
in vec2 vUV; in float vH; out vec4 o;
float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1,0)), f.x), mix(hs(i + vec2(0,1)), hs(i + vec2(1,1)), f.x), f.y); }
void main(){
  vec3 col = texture(uAlb, vUV).rgb;
  vec4 u = texture(uUY, vUV); float code = (floor(u.r * 255.0 + 0.5) * 256.0 + floor(u.g * 255.0 + 0.5)) / 65535.0;
  float ty = code * 2400.0 - 200.0;
  float urb = smoothstep(ty, ty + 25.0, uYear) * (ty < 2150.0 ? 1.0 : 0.0);
  float tex = 0.88 + 0.24 * vn(vUV * 900.0);
  col = mix(col, uUrb * tex, urb * 0.78);
  vec2 ts = 1.0 / vec2(textureSize(uH, 0));
  float hl = texture(uH, vUV - vec2(ts.x, 0.0)).r, hr = texture(uH, vUV + vec2(ts.x, 0.0)).r, hd = texture(uH, vUV - vec2(0.0, ts.y)).r, hu = texture(uH, vUV + vec2(0.0, ts.y)).r;
  vec3 N = normalize(vec3(2.2 * (hl - hr) / (2.0 * uCell.x), 2.2 * (hd - hu) / (2.0 * uCell.y), 1.0));
  vec3 L = normalize(vec3(-0.5, 0.45, 0.75));
  float sh = clamp(dot(N, L), 0.0, 1.0);
  float wat = texture(uWat, vUV).r;
  vec3 c = col * (0.40 + 0.85 * sh);
  if (wat > 0.5 || (vH < 0.01)) {
    float t = uTime * 0.6; vec2 p = vUV * vec2(520.0, 560.0);
    float w1 = vn(p + vec2(t, t * 0.7)), w2 = vn(p * 2.1 - vec2(t * 0.8, t));
    float shore = smoothstep(0.55, 0.98, wat);
    vec3 deep = vec3(0.14, 0.32, 0.36), shal = vec3(0.38, 0.56, 0.50);
    vec3 wc = mix(shal, deep, shore) * (0.86 + 0.28 * w1);
    float gl = smoothstep(0.78, 0.92, w2 * w1 + 0.15 * sin(p.x * 0.7 + t * 2.0));
    wc += vec3(0.20, 0.24, 0.26) * gl;
    c = wc;
  } else if (uFlood > 0.001 && texture(uWF, vUV).r > 0.55 - 0.5 * uFlood && vH < 30.0) {
    vec3 fw = mix(vec3(0.33, 0.50, 0.58), vec3(0.20, 0.38, 0.52), vn(vUV * 400.0 + uTime));
    c = mix(c, fw, 0.82);
  }
  o = vec4(c, 1.0);
}`;
function mkTex(unit, w, h, internal, fmt, type, data, linear) {
  const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  if (data instanceof HTMLCanvasElement) gl.texImage2D(gl.TEXTURE_2D, 0, internal, fmt, type, data); else gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, fmt, type, data);
  return t;
}
function glSetup(albedoCanvas, UYdata) {
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  GLP = gl.createProgram(); gl.attachShader(GLP, sh(gl.VERTEX_SHADER, VSRC)); gl.attachShader(GLP, sh(gl.FRAGMENT_SHADER, FSRC)); gl.linkProgram(GLP);
  if (!gl.getProgramParameter(GLP, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(GLP));
  for (const n of ['uH', 'uBB', 'uCam', 'uK', 'uVs', 'uGN', 'uAlb', 'uUY', 'uWat', 'uYear', 'uTime', 'uFlood', 'uUrb', 'uCell', 'uWF']) GLU[n] = gl.getUniformLocation(GLP, n);
  const lin = !!gl.getExtension('OES_texture_float_linear');
  mkTex(0, GH, GH, gl.R32F, gl.RED, gl.FLOAT, HM, lin);
  mkTex(1, 2048, 2048, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, albedoCanvas, true);
  mkTex(2, 2048, 2048, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, UYdata, false);
  mkTex(3, WN, WN, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, WATB, true);
  mkTex(4, WN, WN, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, WFAR, true);
  // grid mesh
  const GN = 768; GLN = (GN - 1) * (GN - 1) * 6; const idx = new Uint32Array(GLN); let q = 0;
  for (let j = 0; j < GN - 1; j++) for (let i = 0; i < GN - 1; i++) { const a = j * GN + i, b = a + 1, c = a + GN, d = c + 1; idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c; }
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao); const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  gl.useProgram(GLP); gl.uniform1i(GLU.uH, 0); gl.uniform1i(GLU.uAlb, 1); gl.uniform1i(GLU.uUY, 2); gl.uniform1i(GLU.uWat, 3); gl.uniform1i(GLU.uWF, 4); gl.uniform1i(GLU.uGN, GN);
  gl.uniform4f(GLU.uBB, BB[0], BB[1], BB[2], BB[3]); gl.uniform2f(GLU.uCell, (BB[2] - BB[0]) / (GH - 1), (BB[3] - BB[1]) / (GH - 1));
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.viewport(0, 0, W, H);
}
function drawTerrain(year, time, flood, urbCol) {
  gl.useProgram(GLP); gl.clearColor(0.03, 0.045, 0.07, 1); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniform2f(GLU.uCam, CAM.e, CAM.n); gl.uniform1f(GLU.uK, CAM.k); gl.uniform1f(GLU.uVs, VS); gl.uniform1f(GLU.uYear, year); gl.uniform1f(GLU.uTime, time); gl.uniform1f(GLU.uFlood, flood > 0 ? flood : 0);
  gl.uniform3f(GLU.uUrb, urbCol[0] / 255, urbCol[1] / 255, urbCol[2] / 255);
  gl.drawElements(gl.TRIANGLES, GLN, gl.UNSIGNED_INT, 0);
}
