/**
 * Signature measurement engine – deterministic computer vision on the signature image (no AI).
 * Runs in the browser on a canvas bitmap and is unit-tested with synthetic images.
 *
 * Measures: baseline angle and waviness, letter slant (shear-projection method), first-letter prominence,
 * underline / strike-through / overline, ending-stroke direction, full stop and dots, word gaps, stroke width
 * (pen-pressure proxy), approximate letter formation (legibility proxy), enclosure, and – across several
 * samples – consistency. Every reading carries a confidence (0–1); low-confidence readings are shown as estimates.
 */

export interface GrayImage { width: number; height: number; data: Uint8Array | Uint8ClampedArray }
export type SampleSource = 'photo' | 'drawn';
export interface LineBand { kind: 'underline' | 'through' | 'overline'; y: number; ya: number; yb: number; x1: number; x2: number; thickness: number }

export interface SignatureMetrics {
  ok: boolean;
  issues: string[];
  source: SampleSource;
  /** Working-image size the coordinates below refer to, and the factor back to the original image. */
  work: { width: number; height: number; scale: number };
  crop: { x: number; y: number; w: number; h: number };
  inkRatio: number;
  strokeWidth: number;
  coreHeight: number;
  aspect: number;
  baseline: { angle: number; waviness: number; confidence: number; line: [number, number, number, number] };
  /** angle: from the page vertical; relative: from the perpendicular to the signature's own baseline (used for reading). */
  slant: { angle: number; relative: number; left: number; right: number; mixed: boolean; confidence: number };
  firstLetter: { ratio: number; box: [number, number, number, number]; confidence: number };
  ending: { angle: number; confidence: number; from: [number, number]; to: [number, number] };
  lines: LineBand[];
  dots: { end: number; below: number; points: [number, number][] };
  gaps: number;
  letterStrokes: number;
  pressure: { strokeRel: number; darkness: number; confidence: number };
  sizeIndex: number;
  enclosed: boolean;
  /** Shape of the writing line: first-half and last-part angles (relative to the page). */
  curve: { shape: CurveShape; startAngle: number; endAngle: number; confidence: number };
  /** Upper and lower zone extensions as a share of the middle-zone height. */
  zones: { upper: number; lower: number; confidence: number };
  /** Closed loops (holes) inside the letters. */
  loops: number;
  /** Letter height in the last third ÷ the first third (first letter left out). */
  progression: { ratio: number; confidence: number };
  /** Separate pen strokes (pen lifts + 1), dots left out. */
  pieces: number;
  /** Pairs of name parts written over / under each other. */
  overlap: number;
  /** Ruled paper lines found and removed; angle = tilt of the paper in the photo. */
  ruled: { count: number; angle: number };
  /** Photo quality: 0–100, with the problems found. */
  quality: { score: number; contrast: number; edgeWidth: number; unevenLight: number; issues: string[] };
  /** Ink colour, read from the colour photo (set by the browser helper). */
  ink?: { colour: InkColour; confidence: number; rgb: [number, number, number] };
  /** featureId → share of re-measurements (other scales / thresholds) that gave the same reading. */
  stability?: Record<string, number>;
}
export type CurveShape = 'even' | 'arched' | 'dip' | 'dropEnd';
export type InkColour = 'blue' | 'black' | 'red' | 'green' | 'other';

// ───────────────────────── image helpers
export function rgbaToGray(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number): GrayImage {
  const out = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < out.length; i++, p += 4) {
    const a = rgba[p + 3] / 255;
    const l = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
    out[i] = Math.round(l * a + 255 * (1 - a)); // transparent → white paper
  }
  return { width, height, data: out };
}

function downscale(img: GrayImage, maxSide: number): { img: GrayImage; scale: number } {
  const k = Math.max(img.width, img.height) / maxSide;
  if (k <= 1) return { img, scale: 1 };
  const w = Math.max(1, Math.round(img.width / k)), h = Math.max(1, Math.round(img.height / k));
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * k), y1 = Math.min(img.height, Math.max(y0 + 1, Math.floor((y + 1) * k)));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * k), x1 = Math.min(img.width, Math.max(x0 + 1, Math.floor((x + 1) * k)));
      let s = 0, n = 0, mn = 255;
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const v = img.data[yy * img.width + xx]; s += v; n++; if (v < mn) mn = v; }
      out[y * w + x] = Math.round(0.5 * (s / n) + 0.5 * mn); // keep thin strokes visible when shrinking
    }
  }
  return { img: { width: w, height: h, data: out }, scale: k };
}

function otsu(data: Uint8Array | Uint8ClampedArray): number {
  const hist = new Array(256).fill(0);
  for (const v of data) hist[v]++;
  const total = data.length;
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, thr = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]; if (!wB) continue;
    const wF = total - wB; if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; thr = t; }
  }
  return thr;
}

const median = (xs: number[]) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r1 = (v: number) => Math.round(v * 10) / 10;
const deg = (rad: number) => (rad * 180) / Math.PI;

/** Robust line fit (Theil–Sen): slope and intercept of y = m·x + c. */
function theilSen(pts: [number, number][]): { m: number; c: number } {
  if (pts.length < 2) return { m: 0, c: pts[0]?.[1] ?? 0 };
  const slopes: number[] = [];
  const step = Math.max(1, Math.floor(pts.length / 60));
  for (let i = 0; i < pts.length; i += step) for (let j = i + 1; j < pts.length; j += step) {
    const dx = pts[j][0] - pts[i][0]; if (Math.abs(dx) > 1e-6) slopes.push((pts[j][1] - pts[i][1]) / dx);
  }
  const m = median(slopes);
  return { m, c: median(pts.map(([x, y]) => y - m * x)) };
}

interface Comp { area: number; x0: number; y0: number; x1: number; y1: number; label: number }

/** 8-connected components of a binary mask. */
function components(mask: Uint8Array, w: number, h: number): { labels: Int32Array; comps: Comp[] } {
  const labels = new Int32Array(w * h).fill(-1);
  const comps: Comp[] = [];
  const stack: number[] = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || labels[i] >= 0) continue;
    const c: Comp = { area: 0, x0: w, y0: h, x1: 0, y1: 0, label: comps.length };
    labels[i] = c.label; stack.push(i);
    while (stack.length) {
      const p = stack.pop()!; const x = p % w, y = (p / w) | 0;
      c.area++; if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx; if (mask[q] && labels[q] < 0) { labels[q] = c.label; stack.push(q); }
      }
    }
    comps.push(c);
  }
  return { labels, comps };
}

function strokeWidthOf(mask: Uint8Array, w: number, h: number): number {
  let ink = 0, edge = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!mask[i]) continue; ink++;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !mask[i - 1] || !mask[i + 1] || !mask[i - w] || !mask[i + w]) edge++;
  }
  return edge ? clamp((2 * ink) / edge, 1, 40) : 1;
}

/**
 * Removes shadows and uneven light: estimates the paper brightness per block (90th percentile, spread to the
 * neighbours so thick ink does not count as paper, then smoothed) and divides it out. Returns the unevenness too.
 */
export function flattenBackground(img: GrayImage): { img: GrayImage; unevenness: number } {
  const { width: W, height: H, data } = img;
  const B = Math.max(12, Math.round(Math.max(W, H) / 30));
  const gw = Math.ceil(W / B), gh = Math.ceil(H / B);
  const grid = new Float32Array(gw * gh);
  const hist = new Uint32Array(256);
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    hist.fill(0); let n = 0;
    for (let y = gy * B; y < Math.min(H, (gy + 1) * B); y++) for (let x = gx * B; x < Math.min(W, (gx + 1) * B); x++) { hist[data[y * W + x]]++; n++; }
    let acc = 0, v = 255; const target = 0.9 * n;
    for (let t = 0; t < 256; t++) { acc += hist[t]; if (acc >= target) { v = t; break; } }
    grid[gy * gw + gx] = v;
  }
  let gs = 0, gq = 0; for (const v of grid) { gs += v; gq += v * v; }
  const gm = gs / grid.length, unevenness = gm ? Math.sqrt(Math.max(0, gq / grid.length - gm * gm)) / gm : 0;
  const pass = (src: Float32Array, op: 'max' | 'mean') => {
    const out = new Float32Array(src.length);
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
      let m = op === 'max' ? 0 : 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = gx + dx, y = gy + dy; if (x < 0 || y < 0 || x >= gw || y >= gh) continue;
        const v = src[y * gw + x]; if (op === 'max') m = Math.max(m, v); else { m += v; c++; }
      }
      out[gy * gw + gx] = op === 'max' ? m : m / c;
    }
    return out;
  };
  const bg = pass(pass(pass(grid, 'max'), 'mean'), 'mean');
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const fy = clamp(y / B - 0.5, 0, gh - 1), y0 = Math.floor(fy), y1 = Math.min(gh - 1, y0 + 1), ty = fy - y0;
    for (let x = 0; x < W; x++) {
      const fx = clamp(x / B - 0.5, 0, gw - 1), x0 = Math.floor(fx), x1 = Math.min(gw - 1, x0 + 1), tx = fx - x0;
      const b = (bg[y0 * gw + x0] * (1 - tx) + bg[y0 * gw + x1] * tx) * (1 - ty) + (bg[y1 * gw + x0] * (1 - tx) + bg[y1 * gw + x1] * tx) * ty;
      out[y * W + x] = Math.min(255, Math.round((255 * data[y * W + x]) / Math.max(40, b)));
    }
  }
  return { img: { width: W, height: H, data: out }, unevenness: Math.round(unevenness * 1000) / 1000 };
}

/**
 * Finds ruled paper lines: at least two long, parallel straight lines running across the whole photo.
 * They are removed from the mask (pixels where a letter crosses a line are kept). A single line is left alone,
 * because it may be the person's own underline.
 */
function removeRuledLines(mask: Uint8Array, W: number, H: number, sw: number, detect: Uint8Array = mask): { count: number; angle: number } {
  if (W < 150) return { count: 0, angle: 0 };
  const minRun = 0.85 * W;
  let best: { m: number; bands: [number, number][] } = { m: 0, bands: [] };
  for (let a = -8; a <= 8; a += 0.5) {
    const m = -Math.tan((a * Math.PI) / 180);
    const lo = Math.floor(-Math.max(0, m * W)) - 1, hi = Math.ceil(H - Math.min(0, m * W)) + 1;
    const rows: number[] = [];
    for (let o = lo; o <= hi; o++) {
      let cnt = 0;
      for (let x = 0; x < W; x += 3) { const y = Math.round(o + m * x); if (y >= 0 && y < H && detect[y * W + x]) cnt++; }
      if (cnt * 3 < 0.4 * W) continue;
      let run = 0, rs = 0, gap = 0, bestRun = 0, bs = 0;
      for (let x = 0; x <= W; x++) {
        const y = Math.round(o + m * x); const on = x < W && y >= 0 && y < H && detect[y * W + x] === 1;
        if (on) { if (!run) rs = x; run += 1 + gap; gap = 0; } else if (run && gap < 3 && x < W) gap++; else { if (run > bestRun) { bestRun = run; bs = rs; } run = 0; gap = 0; }
      }
      // A ruled line runs from one edge of the photo to another (left/right, or out through the top/bottom when tilted).
      const be = bs + bestRun - 1, ys = o + m * bs, ye = o + m * be;
      const atStart = bs <= 0.06 * W || ys <= 2 || ys >= H - 3, atEnd = be >= 0.94 * W || ye <= 2 || ye >= H - 3;
      if (atStart && atEnd && bestRun >= (bs <= 0.06 * W && be >= 0.94 * W ? minRun : 0.45 * W)) rows.push(o);
    }
    const bands: [number, number][] = [];
    for (const o of rows) { const l = bands[bands.length - 1]; if (l && o - l[1] <= 1) l[1] = o; else bands.push([o, o]); }
    const thin = bands.filter(([a0, a1]) => a1 - a0 + 1 <= Math.max(5, 3 * sw + 2));
    if (thin.length > best.bands.length) best = { m, bands: thin };
  }
  if (best.bands.length < 2) return { count: 0, angle: 0 };
  const m = best.m;
  for (const [o0, o1] of best.bands) for (let x = 0; x < W; x++) {
    const yu = Math.round(o0 - 2 + m * x), yd = Math.round(o1 + 2 + m * x);
    if (yu >= 0 && yd < H && mask[yu * W + x] && mask[yd * W + x]) continue; // a letter crosses the line here
    for (let o = o0 - 1; o <= o1 + 1; o++) { const y = Math.round(o + m * x); if (y >= 0 && y < H) mask[y * W + x] = 0; }
  }
  return { count: best.bands.length, angle: r1(-deg(Math.atan(m))) };
}

/** Typical width (px) of the ink edge: contrast ÷ gradient at the stroke border. Wide edges mean a blurred photo. */
function edgeWidthOf(data: Uint8Array | Uint8ClampedArray, mask: Uint8Array, W: number, H: number, contrast: number): number {
  const widths: number[] = [];
  const step = Math.max(1, Math.floor((W * H) / 250000));
  for (let y = 1; y < H - 1; y += step) for (let x = 1; x < W - 1; x += step) {
    const i = y * W + x; if (!mask[i] || (mask[i - 1] && mask[i + 1] && mask[i - W] && mask[i + W])) continue;
    const gx = data[i + 1 - W] + 2 * data[i + 1] + data[i + 1 + W] - data[i - 1 - W] - 2 * data[i - 1] - data[i - 1 + W];
    const gy = data[i + W - 1] + 2 * data[i + W] + data[i + W + 1] - data[i - W - 1] - 2 * data[i - W] - data[i - W + 1];
    const g = Math.hypot(gx, gy) / 8;
    if (g > 1) widths.push(contrast / g);
    if (widths.length > 6000) break;
  }
  return widths.length ? r1(clamp(median(widths), 0.5, 30)) : 0;
}

// ───────────────────────── main measurement
export interface MeasureOptions { source?: SampleSource; maxSide?: number; /** Shifts the ink threshold (re-measurement passes). */ thresholdShift?: number; /** Shadow / uneven-light correction (default on). */ flatten?: boolean }

export function measureSignature(input: GrayImage, opts: MeasureOptions = {}): SignatureMetrics {
  const source = opts.source ?? 'photo';
  const { img: raw, scale } = downscale(input, opts.maxSide ?? 900);
  const { width: W, height: H } = raw;
  const issues: string[] = [];
  let rawSum = 0; for (let i = 0; i < raw.data.length; i++) rawSum += raw.data[i];
  // Light-on-dark images are not flattened (the "paper" there is dark).
  const flat = opts.flatten !== false && rawSum / raw.data.length >= 110 ? flattenBackground(raw) : { img: raw, unevenness: 0 };
  const data = flat.img.data;

  // 1. Ink mask (Otsu, with a guard against inverted images and empty pages)
  let thr = otsu(data);
  let inkCount = 0; for (const v of data) if (v <= thr) inkCount++;
  let invert = false;
  if (inkCount / data.length > 0.5) { invert = true; inkCount = data.length - inkCount; }
  let sumAll = 0; for (let i = 0; i < data.length; i++) sumAll += data[i];
  const mean = sumAll / data.length;
  if (!invert && thr > mean - 8) thr = Math.min(thr, mean - 25); // faint background shading is not ink
  if (opts.thresholdShift) thr = clamp(thr + (invert ? -opts.thresholdShift : opts.thresholdShift), 10, 245);
  let mask = new Uint8Array(W * H);
  for (let i = 0; i < data.length; i++) mask[i] = (invert ? data[i] > thr : data[i] <= thr) ? 1 : 0;

  // 2. Ruled paper lines, then specks
  const sw0 = strokeWidthOf(mask, W, H);
  // Printed lines are usually lighter than ink, so they are searched for in a looser mask.
  const loose = new Uint8Array(W * H);
  if (!invert) for (let i = 0; i < data.length; i++) loose[i] = data[i] <= Math.max(thr, 215) ? 1 : 0;
  const ruled = invert ? { count: 0, angle: 0 } : removeRuledLines(mask, W, H, sw0, loose);
  let cc = components(mask, W, H);
  const minArea = Math.max(3, Math.round(sw0 * sw0 * 0.7));
  const keep = cc.comps.filter((c) => c.area >= minArea && !(c.x1 - c.x0 > 0.97 * W && c.y1 - c.y0 < 4)); // page edges / scanner lines
  const keepSet = new Set(keep.map((c) => c.label));
  const clean = new Uint8Array(W * H);
  for (let i = 0; i < clean.length; i++) if (mask[i] && keepSet.has(cc.labels[i])) clean[i] = 1;
  mask = clean;
  cc = components(mask, W, H);
  const comps = cc.comps;
  const totalInk = comps.reduce((a, c) => a + c.area, 0);

  const empty: SignatureMetrics = {
    ok: false, issues: ['No signature ink found – use a clear photo on plain white paper.'], source, work: { width: W, height: H, scale }, crop: { x: 0, y: 0, w: W, h: H },
    inkRatio: 0, strokeWidth: 0, coreHeight: 0, aspect: 0, baseline: { angle: 0, waviness: 0, confidence: 0, line: [0, 0, 0, 0] }, slant: { angle: 0, relative: 0, left: 0, right: 0, mixed: false, confidence: 0 },
    firstLetter: { ratio: 1, box: [0, 0, 0, 0], confidence: 0 }, ending: { angle: 0, confidence: 0, from: [0, 0], to: [0, 0] }, lines: [], dots: { end: 0, below: 0, points: [] }, gaps: 0, letterStrokes: 0,
    pressure: { strokeRel: 0, darkness: 0, confidence: 0 }, sizeIndex: 0, enclosed: false,
    curve: { shape: 'even', startAngle: 0, endAngle: 0, confidence: 0 }, zones: { upper: 0, lower: 0, confidence: 0 }, loops: 0, progression: { ratio: 1, confidence: 0 },
    pieces: 0, overlap: 0, ruled, quality: { score: 0, contrast: 0, edgeWidth: 0, unevenLight: flat.unevenness, issues: [] },
  };
  if (totalInk < 30) return empty;

  // 3. Crop to the ink
  const cx0 = Math.min(...comps.map((c) => c.x0)), cy0 = Math.min(...comps.map((c) => c.y0));
  const cx1 = Math.max(...comps.map((c) => c.x1)), cy1 = Math.max(...comps.map((c) => c.y1));
  const cw = cx1 - cx0 + 1, ch = cy1 - cy0 + 1;
  const inkRatio = totalInk / (cw * ch);
  if (totalInk / (W * H) > 0.35) issues.push('The photo has a lot of dark area – crop it to the signature on white paper for an accurate reading.');
  if (cw < 120) issues.push('The signature is small in the image – a closer, sharper photo gives a better reading.');
  const sw = strokeWidthOf(mask, W, H);

  // 4. Long straight lines (underline / strike-through / overline) – searched along slopes up to ±20°,
  //    because people usually draw the underline parallel to their own (often tilted) baseline.
  const minLen = Math.max(40, 0.45 * cw);
  type Band = { o0: number; o1: number; x1: number; x2: number; m: number; len: number };
  const scan = (m: number): Band[] => {
    const lo = Math.floor(cy0 - Math.max(0, m * cw)) - 1, hi = Math.ceil(cy1 - Math.min(0, m * cw)) + 1;
    const rows: { o: number; x1: number; x2: number }[] = [];
    for (let o = lo; o <= hi; o++) {
      let best = 0, bs = 0, run = 0, rs = 0, gap = 0;
      for (let x = cx0; x <= cx1 + 3; x++) {
        const y = Math.round(o + m * (x - cx0));
        const on = x <= cx1 && y >= 0 && y < H && mask[y * W + x] === 1;
        if (on) { if (!run) rs = x; run += 1 + gap; gap = 0; }
        else if (run && gap < 2) gap++;
        else { if (run > best) { best = run; bs = rs; } run = 0; gap = 0; }
      }
      if (best >= minLen) rows.push({ o, x1: bs, x2: bs + best - 1 });
    }
    const bands: Band[] = [];
    for (const r of rows) {
      const last = bands[bands.length - 1];
      if (last && r.o - last.o1 <= 1) { last.o1 = r.o; last.x1 = Math.min(last.x1, r.x1); last.x2 = Math.max(last.x2, r.x2); last.len = Math.max(last.len, r.x2 - r.x1 + 1); }
      else bands.push({ o0: r.o, o1: r.o, x1: r.x1, x2: r.x2, m, len: r.x2 - r.x1 + 1 });
    }
    return bands.filter((b) => b.o1 - b.o0 + 1 <= Math.max(5, 4 * sw + Math.abs(m) * 6));
  };
  // Preliminary tilt of the writing (lower edge of ink per slice) – long lines are searched finely around it.
  const pre: [number, number][] = [];
  for (let s0 = 0; s0 < 12; s0++) {
    const xs = Math.floor(cx0 + (s0 * cw) / 12), xe = Math.floor(cx0 + ((s0 + 1) * cw) / 12); const ys: number[] = [];
    for (let x = xs; x < xe; x++) for (let y = cy0; y <= cy1; y++) if (mask[y * W + x]) ys.push(y);
    if (ys.length > 4) { ys.sort((a, b) => a - b); pre.push([(xs + xe) / 2, ys[Math.floor(0.8 * (ys.length - 1))]]); }
  }
  const preM = clamp(theilSen(pre).m, -0.36, 0.36);
  const slopes = new Set<number>();
  for (let a = -20; a <= 20; a += 1.5) slopes.add(-Math.tan((a * Math.PI) / 180));
  const fine = Math.max(0.0015, 1.5 / cw);
  for (const c of [0, preM]) for (let k = -12; k <= 12; k++) slopes.add(c + k * fine);
  let lineBands: Band[] = [];
  let bestScore = 0;
  for (const m of slopes) {
    if (Math.abs(m) > 0.37) continue;
    const bands = scan(m);
    const score = bands.reduce((t, b) => t + b.len, 0) * (1 - Math.abs(m) / 8);
    if (score > bestScore * 1.02) { bestScore = score; lineBands = bands; }
  }
  const yAt = (b: Band, x: number, o = b.o0) => o + b.m * (x - cx0);
  // Body mask without the long lines (pixels of letters crossing a line are kept)
  const body = mask.slice();
  for (const b of lineBands) for (let x = b.x1; x <= b.x2; x++) {
    const yu = Math.round(yAt(b, x, b.o0 - 2)), yd = Math.round(yAt(b, x, b.o1 + 2));
    const crossing = yu >= 0 && yd < H && mask[yu * W + x] && mask[yd * W + x];
    if (crossing) continue;
    for (let o = b.o0 - 1; o <= b.o1 + 1; o++) { const y = Math.round(yAt(b, x, o)); if (y >= 0 && y < H) body[y * W + x] = 0; }
  }

  // Row / column profiles of the body
  const rowInk = new Array(ch).fill(0), colInk = new Array(cw).fill(0);
  let bodyInk = 0, darkSum = 0;
  for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) if (body[y * W + x]) { rowInk[y - cy0]++; colInk[x - cx0]++; bodyInk++; darkSum += data[y * W + x]; }
  const pctRow = (p: number) => { let acc = 0; for (let i = 0; i < ch; i++) { acc += rowInk[i]; if (acc >= p * bodyInk) return i + cy0; } return cy1; };
  const coreTop = pctRow(0.15), coreBot = pctRow(0.85);
  const coreH = Math.max(3, coreBot - coreTop);

  const lines: LineBand[] = [];
  for (const b of lineBands) {
    let above = 0, below = 0, inRange = 0;
    for (let x = b.x1; x <= b.x2; x++) {
      const yTop = yAt(b, x, b.o0) - 1, yBot = yAt(b, x, b.o1) + 1;
      for (let y = cy0; y <= cy1; y++) if (body[y * W + x]) { inRange++; if (y < yTop) above++; else if (y > yBot) below++; }
    }
    const fa = inRange ? above / inRange : 0, fb = inRange ? below / inRange : 0;
    const kind: LineBand['kind'] = fa >= 0.2 && fb >= 0.2 ? 'through' : fb < 0.2 && fa >= fb ? 'underline' : 'overline';
    const mid = (b.o0 + b.o1) / 2;
    lines.push({ kind, y: yAt(b, (b.x1 + b.x2) / 2, mid), ya: yAt(b, b.x1, mid), yb: yAt(b, b.x2, mid), x1: b.x1, x2: b.x2, thickness: b.o1 - b.o0 + 1 });
  }

  // 5. Small components: dots / full stops
  const bodyCc = components(body, W, H);
  const dotMax = Math.max(14, (3.2 * sw) ** 2);
  const big = bodyCc.comps.filter((c) => c.area > dotMax);
  const mainRight = big.length ? Math.max(...big.map((c) => c.x1)) : cx1;
  const mainLeft = big.length ? Math.min(...big.map((c) => c.x0)) : cx0;
  const dotPts: [number, number][] = [];
  let endDots = 0, belowDots = 0;
  for (const c of bodyCc.comps) {
    const w = c.x1 - c.x0 + 1, h = c.y1 - c.y0 + 1;
    if (c.area > dotMax || w > 5 * sw + 3 || h > 5 * sw + 3 || Math.max(w, h) / Math.max(1, Math.min(w, h)) > 2.6) continue;
    const x = (c.x0 + c.x1) / 2, y = (c.y0 + c.y1) / 2;
    // fragments left where a long line was removed are not dots
    if (lines.some((l) => x >= l.x1 - 2 * sw && x <= l.x2 + 2 * sw && Math.abs(y - (l.ya + ((l.yb - l.ya) * (x - l.x1)) / Math.max(1, l.x2 - l.x1))) <= l.thickness + 3 * sw)) continue;
    if (x > mainRight - sw) { endDots++; dotPts.push([x, y]); }
    else if (y > coreBot + 0.25 * coreH) { belowDots++; dotPts.push([x, y]); }
  }

  // 6. Baseline: lower edge (80th percentile) per slice, robust fit
  const nSlices = clamp(Math.round(cw / Math.max(8, coreH * 0.9)), 6, 16);
  const sliceW = cw / nSlices;
  const basePts: [number, number][] = [], centPts: [number, number][] = [];
  const sliceRanges: number[] = [], sliceTall: number[] = [];
  for (let s = 0; s < nSlices; s++) {
    const xs = Math.floor(cx0 + s * sliceW), xe = Math.floor(cx0 + (s + 1) * sliceW);
    const ys: number[] = [];
    for (let x = xs; x < xe; x++) for (let y = cy0; y <= cy1; y++) if (body[y * W + x]) ys.push(y);
    if (ys.length < Math.max(4, sw * 2)) continue;
    ys.sort((a, b) => a - b);
    const q = (p: number) => ys[Math.min(ys.length - 1, Math.floor(p * (ys.length - 1)))];
    const xm = (xs + xe) / 2;
    basePts.push([xm, q(0.8)]); centPts.push([xm, q(0.5)]);
    sliceRanges.push(q(0.92) - q(0.08)); sliceTall.push(q(0.98) - q(0.02));
  }
  const bFit = theilSen(basePts), cFit = theilSen(centPts);
  const bAngle = -deg(Math.atan(bFit.m)), cAngle = -deg(Math.atan(cFit.m));
  // On ruled paper the lines show how the photo is tilted: the baseline is read relative to them.
  const pageA = ruled.count ? ruled.angle : 0;
  const baseAngle = basePts.length >= 3 ? (bAngle * 0.6 + cAngle * 0.4) - pageA : 0;
  const resid = basePts.map(([x, y]) => Math.abs(y - (bFit.m * x + bFit.c)));
  const waviness = basePts.length >= 3 ? median(resid) / coreH : 0;
  const baseConf = basePts.length < 3 ? 0 : clamp(0.9 - Math.abs(bAngle - cAngle) / 25 - waviness * 0.8, 0.25, 0.92);

  // 7. Slant: shear projection – the shear that makes strokes most vertical gives the slant
  const pts: number[] = [];
  const stepPix = Math.max(1, Math.floor(Math.sqrt(bodyInk / 40000)));
  for (let y = cy0; y <= cy1; y += stepPix) for (let x = cx0; x <= cx1; x += stepPix) if (body[y * W + x]) pts.push(x, y);
  const ymid = (coreTop + coreBot) / 2;
  const shear = (filter: (x: number) => boolean) => {
    let bestA = 0, bestS = -1, sumS = 0, n = 0; let bestHist: Map<number, number> | null = null;
    for (let a = -45; a <= 45; a += 1.5) {
      const t = Math.tan((a * Math.PI) / 180);
      const hist = new Map<number, number>();
      let cnt = 0;
      for (let i = 0; i < pts.length; i += 2) {
        if (!filter(pts[i])) continue;
        const b = Math.round(pts[i] + (pts[i + 1] - ymid) * t);
        hist.set(b, (hist.get(b) ?? 0) + 1); cnt++;
      }
      if (!cnt) return { angle: 0, conf: 0, hist: null as Map<number, number> | null };
      let s = 0; for (const v of hist.values()) s += v * v; s /= cnt;
      sumS += s; n++;
      if (s > bestS) { bestS = s; bestA = a; bestHist = hist; }
    }
    const ratio = bestS / (sumS / n);
    return { angle: bestA, conf: clamp((ratio - 1) * 3, 0.15, 0.9), hist: bestHist };
  };
  const mid = cx0 + cw / 2;
  const all = shear(() => true), left = shear((x) => x < mid), right = shear((x) => x >= mid);
  const mixed = Math.sign(left.angle) !== Math.sign(right.angle) && Math.abs(left.angle) >= 8 && Math.abs(right.angle) >= 8 && Math.abs(left.angle - right.angle) >= 18;

  // Letter-stroke count (peaks of the de-slanted projection) – a legibility proxy
  let letterStrokes = 0;
  if (all.hist) {
    const keys = [...all.hist.keys()].sort((a, b) => a - b);
    const lo = keys[0], hi = keys[keys.length - 1];
    const arr = new Array(hi - lo + 1).fill(0); for (const [k, v] of all.hist) arr[k - lo] = v;
    const rad = Math.max(1, Math.round(sw / 2));
    const sm = arr.map((_, i) => { let s = 0, c = 0; for (let j = i - rad; j <= i + rad; j++) if (j >= 0 && j < arr.length) { s += arr[j]; c++; } return s / c; });
    const mx = Math.max(...sm), minSep = Math.max(2, Math.round(sw * 1.8));
    let lastPeak = -1e9;
    for (let i = 1; i < sm.length - 1; i++) if (sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && sm[i] >= 0.3 * mx && i - lastPeak >= minSep) { letterStrokes++; lastPeak = i; }
  }

  // 8. First-letter prominence
  const inkCols: number[] = []; colInk.forEach((v, i) => { if (v) inkCols.push(i + cx0); });
  const leftEnd = mainLeft + Math.max(4, 0.16 * (mainRight - mainLeft));
  let fy0 = H, fy1 = 0; const fys: number[] = [];
  for (let x = mainLeft; x <= leftEnd; x++) for (let y = cy0; y <= cy1; y++) if (body[y * W + x]) { fys.push(y); if (y < fy0) fy0 = y; if (y > fy1) fy1 = y; }
  fys.sort((a, b) => a - b);
  const fq = (p: number) => fys[Math.min(fys.length - 1, Math.floor(p * (fys.length - 1)))] ?? 0;
  const firstRange = fys.length ? fq(0.97) - fq(0.03) : 0;
  const restRanges = sliceRanges.slice(Math.max(1, Math.round(nSlices * 0.16)));
  const refRange = Math.max(3, median(restRanges.length ? restRanges : sliceRanges));
  const firstRatio = refRange ? firstRange / refRange : 1;

  // 9. Ending stroke: direction of the last ~12% of the main writing
  const endStart = mainRight - Math.max(4, 0.12 * (mainRight - mainLeft));
  const endPts: [number, number][] = [];
  for (let x = Math.floor(endStart); x <= mainRight; x++) {
    let s = 0, c = 0; for (let y = cy0; y <= cy1; y++) if (body[y * W + x]) { s += y; c++; }
    if (c) endPts.push([x, s / c]);
  }
  const eFit = theilSen(endPts);
  const endAngle = endPts.length >= 3 ? -deg(Math.atan(eFit.m)) : 0;
  const ex0 = endPts[0]?.[0] ?? mainRight, ex1 = endPts[endPts.length - 1]?.[0] ?? mainRight;

  // 10. Word gaps (empty column runs inside the writing)
  const gapMin = Math.max(0.55 * coreH, 5 * sw);
  let gaps = 0, run = 0;
  for (let i = mainLeft - cx0; i <= mainRight - cx0; i++) { if (!colInk[i]) run++; else { if (run >= gapMin) gaps++; run = 0; } }

  // 11. Enclosure: ink running along all four sides of the crop
  const sideCover = (horiz: boolean, at: number) => {
    let c = 0; const len = horiz ? cw : ch; const band = Math.max(2, Math.round((horiz ? ch : cw) * 0.06));
    for (let i = 0; i < len; i++) {
      let hit = false;
      for (let d = 0; d < band && !hit; d++) {
        const x = horiz ? cx0 + i : at === 0 ? cx0 + d : cx1 - d; const y = horiz ? (at === 0 ? cy0 + d : cy1 - d) : cy0 + i;
        if (mask[y * W + x]) hit = true;
      }
      if (hit) c++;
    }
    return c / len;
  };
  const enclosed = cw > 60 && ch > 30 && sideCover(true, 0) > 0.55 && sideCover(true, 1) > 0.55 && sideCover(false, 0) > 0.4 && sideCover(false, 1) > 0.4;

  const darkness = bodyInk ? darkSum / bodyInk : 0;

  // 12. Shape of the writing line: does it rise and then fall (arch), sink and recover (dip), or drop at the end?
  const angOf = (p: [number, number][]) => -deg(Math.atan(theilSen(p).m)) - pageA;
  const nb = basePts.length;
  let curve: SignatureMetrics['curve'] = { shape: 'even', startAngle: r1(baseAngle), endAngle: r1(baseAngle), confidence: 0 };
  if (nb >= 6) {
    const half = Math.floor(nb / 2);
    const a1 = angOf(basePts.slice(0, half + 1)), a2 = angOf(basePts.slice(half));
    const aEnd = angOf(basePts.slice(nb - Math.max(3, Math.round(nb * 0.3))));
    const shape: CurveShape = a1 >= 4 && a2 <= -4 && a1 - a2 >= 10 ? 'arched' : a1 <= -4 && a2 >= 4 && a2 - a1 >= 10 ? 'dip' : aEnd <= -8 && aEnd - baseAngle <= -10 ? 'dropEnd' : 'even';
    curve = { shape, startAngle: r1(a1), endAngle: r1(shape === 'dropEnd' ? aEnd : a2), confidence: Math.round(clamp(baseConf * 0.85, 0.25, 0.8) * 100) / 100 };
  }

  // 13. Zones: middle zone = the dense band around the writing line; upper / lower = loops and stems beyond it
  const res: number[] = [];
  for (let i = 0; i < pts.length; i += 2) res.push(pts[i + 1] - (bFit.m * pts[i] + bFit.c));
  let zones: SignatureMetrics['zones'] = { upper: 0, lower: 0, confidence: 0 };
  if (res.length > 60) {
    const lo = Math.floor(Math.min(...res)), hi = Math.ceil(Math.max(...res));
    const hist = new Array(hi - lo + 1).fill(0); for (const r of res) hist[Math.round(r) - lo]++;
    const rad = Math.max(1, Math.round(sw));
    const sm = hist.map((_, i) => { let s = 0, c = 0; for (let j = i - rad; j <= i + rad; j++) if (j >= 0 && j < hist.length) { s += hist[j]; c++; } return s / c; });
    let pk = 0; sm.forEach((v, i) => { if (v > sm[pk]) pk = i; });
    let zt = pk, zb = pk; while (zt > 0 && sm[zt - 1] >= 0.35 * sm[pk]) zt--; while (zb < sm.length - 1 && sm[zb + 1] >= 0.35 * sm[pk]) zb++;
    const zh = Math.max(2, zb - zt + 1);
    const sr = [...res].sort((a, b) => a - b), pq = (p: number) => sr[Math.floor(p * (sr.length - 1))] - lo;
    zones = { upper: Math.round(Math.max(0, zt - pq(0.02)) / zh * 100) / 100, lower: Math.round(Math.max(0, pq(0.98) - zb) / zh * 100) / 100, confidence: zh >= 3 * sw ? 0.4 : 0.25 };
  }

  // 14. Loops: closed holes inside the letters (background regions not reaching the edge of the writing)
  let loops = 0;
  {
    const bw = cw + 2, bh = ch + 2; const seen = new Uint8Array(bw * bh);
    const isBg = (x: number, y: number) => { const ox = x - 1 + cx0, oy = y - 1 + cy0; return ox < cx0 || oy < cy0 || ox > cx1 || oy > cy1 || !body[oy * W + ox]; };
    const minHole = Math.max(6, (1.2 * sw) ** 2), maxHole = 0.2 * cw * ch; const st: number[] = [];
    for (let s = 0; s < bw * bh; s++) {
      if (seen[s]) continue; const sx = s % bw, sy = (s / bw) | 0; if (!isBg(sx, sy)) continue;
      let area = 0, edge = false; seen[s] = 1; st.push(s);
      while (st.length) {
        const p = st.pop()!; const x = p % bw, y = (p / bw) | 0; area++; if (x === 0 || y === 0 || x === bw - 1 || y === bh - 1) edge = true;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue; const q = ny * bw + nx; if (!seen[q] && isBg(nx, ny)) { seen[q] = 1; st.push(q); } }
      }
      if (!edge && area >= minHole && area <= maxHole) loops++;
    }
  }

  // 15. Size progression: letter height in the last third vs the first third (first letter and final stroke left out)
  const tallRest = sliceTall.slice(Math.max(1, Math.round(nSlices * 0.16)));
  const prog = tallRest.slice(0, Math.max(0, tallRest.length - 1));
  let progression: SignatureMetrics['progression'] = { ratio: 1, confidence: 0 };
  if (prog.length >= 4) {
    const t = Math.max(1, Math.floor(prog.length / 3));
    const env = (xs: number[]) => { const q = [...xs].sort((u, v) => u - v); return q[Math.min(q.length - 1, Math.floor(0.75 * q.length))]; }; // upper envelope: tall letters count
    const a = env(prog.slice(0, t)), z = env(prog.slice(prog.length - t));
    progression = { ratio: Math.round((a ? z / a : 1) * 100) / 100, confidence: prog.length >= 6 ? 0.45 : 0.3 };
  }

  // 16. Pen lifts and crowding
  const parts = big.filter((c) => c.x1 - c.x0 + 1 > 0.5 * coreH && c.y1 - c.y0 + 1 > 0.6 * coreH).sort((p, q) => p.x0 - q.x0);
  let overlap = 0;
  for (let p = 0; p < parts.length; p++) for (let q = p + 1; q < parts.length; q++) {
    const ov = Math.min(parts[p].x1, parts[q].x1) - Math.max(parts[p].x0, parts[q].x0);
    if (ov > 0.5 * Math.min(parts[p].x1 - parts[p].x0, parts[q].x1 - parts[q].x0)) overlap++;
  }

  // 17. Photo quality
  let rawInk = 0, rawInkN = 0, rawPaper = 0, rawPaperN = 0;
  for (let y = cy0; y <= cy1; y += stepPix) for (let x = cx0; x <= cx1; x += stepPix) { const v = raw.data[y * W + x]; if (mask[y * W + x]) { rawInk += v; rawInkN++; } else { rawPaper += v; rawPaperN++; } }
  const contrast = Math.round(Math.abs((rawPaperN ? rawPaper / rawPaperN : 255) - (rawInkN ? rawInk / rawInkN : 0)));
  const edgeWidth = edgeWidthOf(raw.data, mask, W, H, Math.max(20, contrast));
  const qIssues: string[] = []; let qScore = 100;
  if (flat.unevenness > 0.1) { qScore -= 15; qIssues.push('Uneven light or a shadow was found and corrected automatically; an evenly lit photo is still more reliable.'); }
  if (contrast < 60 && !invert) { qScore -= 20; qIssues.push('The ink is faint against the paper – a darker pen or better light gives a surer reading.'); }
  if (source === 'photo' && edgeWidth > Math.max(3, 1.2 * sw)) { qScore -= 25; qIssues.push('The photo looks blurred – hold the phone steady and tap the signature to focus.'); }
  if (ruled.count) { qScore -= 8; qIssues.push(`${ruled.count} ruled paper lines were found and removed; plain unruled paper gives the most accurate reading.`); }
  if (cw < 120) qScore -= 20;
  if (totalInk / (W * H) > 0.35) qScore -= 20;
  issues.push(...qIssues);

  const rawBase = baseAngle + pageA;
  return {
    ok: issues.length === 0 || totalInk > 200,
    issues, source, work: { width: W, height: H, scale },
    crop: { x: cx0, y: cy0, w: cw, h: ch },
    inkRatio: r1(inkRatio * 100) / 100, strokeWidth: r1(sw), coreHeight: r1(coreH), aspect: r1(cw / ch),
    baseline: { angle: r1(baseAngle), waviness: Math.round(waviness * 100) / 100, confidence: Math.round(baseConf * 100) / 100,
      line: [cx0, bFit.m * cx0 + bFit.c, cx1, bFit.m * cx1 + bFit.c] },
    slant: { angle: all.angle, relative: r1(all.angle + (baseConf >= 0.3 ? rawBase : pageA)), left: left.angle, right: right.angle, mixed, confidence: Math.round(all.conf * 100) / 100 },
    firstLetter: { ratio: Math.round(firstRatio * 100) / 100, box: [mainLeft, fy0 === H ? cy0 : fy0, leftEnd, fy1 || cy1], confidence: fys.length > 20 ? 0.5 : 0.2 },
    ending: { angle: r1(endAngle - pageA), confidence: endPts.length >= 5 ? 0.55 : 0.2, from: [ex0, eFit.m * ex0 + eFit.c], to: [ex1, eFit.m * ex1 + eFit.c] },
    lines, dots: { end: endDots, below: belowDots, points: dotPts }, gaps, letterStrokes,
    pressure: { strokeRel: Math.round((sw / coreH) * 100) / 100, darkness: Math.round(darkness), confidence: source === 'drawn' ? 0 : 0.35 },
    sizeIndex: r1(coreH / sw), enclosed,
    curve, zones, loops, progression, pieces: big.length, overlap, ruled,
    quality: { score: clamp(qScore, 10, 100), contrast, edgeWidth, unevenLight: flat.unevenness, issues: qIssues },
  };
}

/**
 * Measures the same sample several times – at three image sizes and with a lighter and a darker ink threshold –
 * and records, for every feature, how many passes agree with the main reading. Stable readings earn more
 * confidence; readings that change with the photo settings earn less.
 */
export function measureMultiPass(input: GrayImage, opts: { source?: SampleSource } = {}): SignatureMetrics {
  const main = measureSignature(input, { source: opts.source });
  if (!main.strokeWidth) return main;
  const variants: MeasureOptions[] = [{ maxSide: 650 }, { thresholdShift: -15 }, { thresholdShift: 15 }];
  if (Math.max(input.width, input.height) > 950) variants.push({ maxSide: 1200 });
  const passes = variants.map((v) => measureSignature(input, { ...v, source: opts.source })).filter((m) => m.strokeWidth > 0);
  const base = classifyMetrics(main, 0);
  const stability: Record<string, number> = {};
  for (const k of Object.keys(base)) {
    const same = passes.filter((p) => classifyMetrics(p, 0)[k]?.option === base[k].option).length;
    stability[k] = Math.round(((same + 1) / (passes.length + 1)) * 100) / 100;
  }
  const ls = [main, ...passes].map((m) => m.letterStrokes), lm = ls.reduce((a, b) => a + b, 0) / ls.length;
  stability.legibility = lm ? Math.round(clamp(1 - Math.sqrt(ls.reduce((a, b) => a + (b - lm) ** 2, 0) / ls.length) / lm * 2, 0, 1) * 100) / 100 : 0;
  return { ...main, stability };
}

// ───────────────────────── ink colour (needs the colour pixels, so the browser helper calls it)
/**
 * Reads the ink colour. Each ink pixel is divided by the paper colour first (white balance), so a warm or blue
 * room light does not turn black ink brown or blue. Pixels that are clearly coloured vote for a hue.
 */
export function inkColourOf(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number): SignatureMetrics['ink'] {
  const gray = rgbaToGray(rgba, width, height).data;
  const thr = Math.min(otsu(gray), 170);
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 400000)));
  let pr = 0, pg = 0, pb = 0, pn = 0;
  for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) { const i = y * width + x; if (gray[i] >= 200) { pr += rgba[i * 4]; pg += rgba[i * 4 + 1]; pb += rgba[i * 4 + 2]; pn++; } }
  const paper: [number, number, number] = pn ? [pr / pn, pg / pn, pb / pn] : [255, 255, 255];
  const votes = { blue: 0, red: 0, green: 0, other: 0 }; let ink = 0, sr = 0, sg = 0, sb = 0;
  for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
    const i = y * width + x; if (gray[i] > thr) continue; ink++;
    const r = Math.min(255, (rgba[i * 4] * 255) / Math.max(60, paper[0])), g = Math.min(255, (rgba[i * 4 + 1] * 255) / Math.max(60, paper[1])), b = Math.min(255, (rgba[i * 4 + 2] * 255) / Math.max(60, paper[2]));
    sr += r; sg += g; sb += b;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
    if (sat < 0.28 || mx < 35) continue;
    let h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h *= 60; if (h < 0) h += 360;
    if (h >= 190 && h < 275) votes.blue++; else if (h >= 330 || h < 22) votes.red++; else if (h >= 75 && h < 170) votes.green++; else votes.other++;
  }
  if (ink < 40) return undefined;
  const rgb: [number, number, number] = [Math.round(sr / ink), Math.round(sg / ink), Math.round(sb / ink)];
  const [top, n] = (Object.entries(votes) as [InkColour, number][]).sort((a, b) => b[1] - a[1])[0];
  const share = n / ink;
  if (share < 0.3) return { colour: 'black', confidence: Math.round(clamp(0.85 - share, 0.5, 0.85) * 100) / 100, rgb };
  return { colour: top, confidence: Math.round(clamp(0.45 + share * 0.5, 0.5, 0.9) * 100) / 100, rgb };
}

// ───────────────────────── interpretation (feature ids/options match catalogue.ts)
/** `value` is shown in English reports, `valueHi` in Hindi reports. */
export interface MeasuredFeature { option: string; value: string; valueHi?: string; confidence: number }
export type MeasuredFeatures = Record<string, MeasuredFeature>;

const signed = (v: number) => `${v > 0 ? '+' : ''}${v}°`;
const pct = (v: number) => `${Math.round(v * 100)}%`;

/**
 * Turns one sample's metrics into catalogue feature options. `letters` = letters in the signed name.
 * Confidence is scaled by photo quality and by how stable each reading was across the re-measurement passes.
 */
export function classifyMetrics(m: SignatureMetrics, letters = 0): MeasuredFeatures {
  if (!m.ok && !m.strokeWidth) return {};
  const out: MeasuredFeatures = {};
  const q = m.quality?.score ? 0.65 + 0.35 * (m.quality.score / 100) : 1;
  const put = (id: string, option: string, value: string, valueHi: string, confidence: number) => {
    const st = m.stability?.[id];
    const c = confidence * q * (st == null ? 1 : 0.55 + 0.45 * st) + (st === 1 ? 0.05 : 0);
    out[id] = { option, value, valueHi, confidence: Math.round(clamp(c, 0, 0.95) * 100) / 100 };
  };
  const b = m.baseline;
  put('baseline', b.waviness > 0.32 && Math.abs(b.angle) < 6 ? 'wavy' : b.angle >= 3 ? 'rising' : b.angle <= -3 ? 'falling' : 'straight',
    `${signed(b.angle)} baseline${m.ruled?.count ? ' (against the paper lines)' : ''}, waviness ${pct(b.waviness)}`, `रेखा ${signed(b.angle)}${m.ruled?.count ? ' (काग़ज़ की लाइनों के सापेक्ष)' : ''}, लहर ${pct(b.waviness)}`, b.confidence);
  const s = m.slant;
  put('slant', s.mixed ? 'mixed' : s.relative >= 8 ? 'right' : s.relative <= -8 ? 'left' : 'upright',
    s.mixed ? `left part ${signed(s.left)}, right part ${signed(s.right)}` : `${signed(s.relative)} from upright`,
    s.mixed ? `बायाँ भाग ${signed(s.left)}, दायाँ भाग ${signed(s.right)}` : `सीधी खड़ी रेखा से ${signed(s.relative)}`, s.confidence);
  const fr = m.firstLetter.ratio.toFixed(2);
  put('first', m.firstLetter.ratio >= 1.6 ? 'bold' : m.firstLetter.ratio <= 1.0 ? 'small' : 'proportionate', `first letter ${fr}× the rest`, `पहला अक्षर बाक़ी अक्षरों का ${fr} गुना`, m.firstLetter.confidence);
  const ul = m.lines.filter((l) => l.kind === 'underline').length, th = m.lines.some((l) => l.kind === 'through');
  put('underline', th ? 'through' : ul >= 2 ? 'double' : ul === 1 ? 'single' : 'none',
    th ? 'a long stroke crosses the letters' : ul ? `${ul} line${ul > 1 ? 's' : ''} below the name` : 'no long line',
    th ? 'एक लंबी लाइन अक्षरों को काटती है' : ul ? `नाम के नीचे ${ul} रेखा` : 'कोई लंबी रेखा नहीं', m.lines.length ? 0.75 : 0.6);
  put('ending', m.ending.angle >= 15 ? 'upward' : m.ending.angle <= -15 ? 'downward' : 'flat', `last stroke ${signed(m.ending.angle)}`, `आख़िरी स्ट्रोक ${signed(m.ending.angle)}`, m.ending.confidence);
  const two = m.dots.below >= 2 && m.dots.below <= 4, endDot = m.dots.end > 0 && m.dots.end <= 2;
  put('dots', endDot ? 'end' : two ? 'two' : 'none', endDot ? 'dot after the signature' : two ? `${m.dots.below} dots below` : 'no dots',
    endDot ? 'हस्ताक्षर के बाद बिंदु' : two ? `नीचे ${m.dots.below} बिंदु` : 'कोई बिंदु नहीं', m.dots.end > 2 || m.dots.below > 4 ? 0.3 : 0.6);
  const crowded = (m.overlap ?? 0) > 0 && m.gaps === 0;
  put('spacing', crowded ? 'overlap' : m.gaps > 0 ? 'gaps' : 'connected',
    crowded ? 'name parts written over each other' : m.gaps ? `${m.gaps} clear gap${m.gaps > 1 ? 's' : ''} between parts` : 'written in one flow',
    crowded ? 'नाम के हिस्से एक-दूसरे पर चढ़े हुए' : m.gaps ? `हिस्सों के बीच ${m.gaps} साफ़ जगह` : 'एक ही प्रवाह में लिखा', crowded ? 0.4 : 0.55);
  put('size', m.sizeIndex >= 11 ? 'large' : m.sizeIndex <= 5.5 ? 'small' : 'medium', `letter height ≈ ${m.sizeIndex}× pen width (estimate)`, `अक्षरों की ऊँचाई ≈ पेन की मोटाई का ${m.sizeIndex} गुना (अनुमान)`, 0.3);
  if (m.pressure.confidence > 0) put('pressure', m.pressure.strokeRel >= 0.17 || (m.pressure.darkness < 45 && m.pressure.strokeRel >= 0.11) ? 'heavy' : m.pressure.strokeRel <= 0.07 && m.pressure.darkness > 105 ? 'light' : 'medium',
    `stroke ${Math.round(m.pressure.strokeRel * 100)}% of letter height (estimate)`, `स्ट्रोक की मोटाई अक्षर की ऊँचाई का ${Math.round(m.pressure.strokeRel * 100)}% (अनुमान)`, m.pressure.confidence);
  if (letters > 0) {
    const r = m.letterStrokes / letters;
    put('legibility', r >= 0.9 ? 'clear' : r >= 0.5 ? 'partial' : 'illegible', `${m.letterStrokes} letter strokes for ${letters} letters (estimate)`, `${letters} अक्षरों के लिए ${m.letterStrokes} अक्षर-स्ट्रोक (अनुमान)`, 0.35);
  }
  put('enclosure', m.enclosed ? 'circled' : 'open', m.enclosed ? 'signature is enclosed by a loop' : 'not enclosed', m.enclosed ? 'हस्ताक्षर एक घेरे में बंद है' : 'कोई घेरा नहीं', m.enclosed ? 0.6 : 0.5);
  if (m.curve?.confidence) {
    const c = m.curve;
    put('curve', c.shape, c.shape === 'dropEnd' ? `steady, then drops ${signed(c.endAngle)} at the end` : `first half ${signed(c.startAngle)}, second half ${signed(c.endAngle)}`,
      c.shape === 'dropEnd' ? `पहले स्थिर, फिर अंत में ${signed(c.endAngle)} गिरता` : `पहला आधा ${signed(c.startAngle)}, दूसरा आधा ${signed(c.endAngle)}`, c.confidence);
  }
  if (m.zones?.confidence) {
    const z = m.zones;
    put('zones', z.upper >= 1.2 && z.upper >= 1.6 * z.lower ? 'upper' : z.lower >= 1.2 && z.lower >= 1.6 * z.upper ? 'lower' : 'balanced',
      `upper zone ${pct(z.upper)}, lower zone ${pct(z.lower)} of the middle height`, `ऊपरी भाग ${pct(z.upper)}, निचला भाग ${pct(z.lower)} (बीच की ऊँचाई के अनुपात में)`, z.confidence);
  }
  const count = letters || m.letterStrokes;
  if (count > 0 && m.loops != null) {
    const per = m.loops / count;
    put('loops', per >= 0.55 ? 'rounded' : per <= 0.12 ? 'angular' : 'balanced', `${m.loops} closed loop${m.loops === 1 ? '' : 's'} for ${count} letters`, `${count} अक्षरों में ${m.loops} बंद लूप`, letters ? 0.4 : 0.25);
  }
  if (m.progression?.confidence) {
    const r = m.progression.ratio;
    put('progression', r >= 1.3 ? 'growing' : r <= 0.75 ? 'shrinking' : 'even', `last letters ${r.toFixed(2)}× the height of the early ones`, `आख़िरी अक्षर शुरुआती अक्षरों की ऊँचाई के ${r.toFixed(2)} गुना`, m.progression.confidence);
  }
  if (count > 0 && m.pieces) {
    const per = m.pieces / count;
    put('fluency', m.pieces <= 2 || per <= 0.3 ? 'fluent' : per <= 0.7 ? 'steady' : 'broken', `${m.pieces} separate pen stroke${m.pieces === 1 ? '' : 's'} for ${count} letters`, `${count} अक्षरों के लिए ${m.pieces} अलग-अलग स्ट्रोक`, m.strokeWidth < 2 ? 0.3 : 0.45);
  }
  if (m.ink && m.source === 'photo') put('ink', m.ink.colour, 'read from the photo colours, corrected for room light', 'फ़ोटो के रंगों से पढ़ा गया, कमरे की रोशनी का असर हटाकर', m.ink.confidence);
  return out;
}

/** Combines several samples: majority option weighted by confidence; agreement raises confidence. */
export function combineSamples(list: MeasuredFeatures[]): MeasuredFeatures {
  if (list.length <= 1) return list[0] ?? {};
  const out: MeasuredFeatures = {};
  const keys = new Set(list.flatMap((x) => Object.keys(x)));
  for (const k of keys) {
    const votes = new Map<string, { w: number; n: number; value: string; valueHi?: string }>();
    let present = 0;
    for (const s of list) { const f = s[k]; if (!f) continue; present++; const v = votes.get(f.option) ?? { w: 0, n: 0, value: f.value, valueHi: f.valueHi }; v.w += f.confidence; v.n++; votes.set(f.option, v); }
    const [opt, v] = [...votes.entries()].sort((a, b) => b[1].w - a[1].w)[0];
    const agreement = v.n / present;
    out[k] = { option: opt, value: `${v.value}${present > 1 ? ` · ${v.n}/${present} samples agree` : ''}`,
      valueHi: v.valueHi ? `${v.valueHi}${present > 1 ? ` · ${present} में से ${v.n} नमूने एक जैसे` : ''}` : undefined,
      confidence: Math.round(clamp((v.w / v.n) * (0.6 + 0.6 * agreement), 0, 0.95) * 100) / 100 };
  }
  return out;
}

/** 0–100: how alike several samples are (baseline, slant, proportions, first letter). */
export function consistencyScore(ms: SignatureMetrics[]): number | null {
  const ok = ms.filter((m) => m.strokeWidth > 0);
  if (ok.length < 2) return null;
  const sd = (xs: number[]) => { const a = xs.reduce((p, x) => p + x, 0) / xs.length; return Math.sqrt(xs.reduce((p, x) => p + (x - a) ** 2, 0) / xs.length); };
  const aspects = ok.map((m) => m.aspect); const am = aspects.reduce((a, x) => a + x, 0) / aspects.length;
  const penalty = sd(ok.map((m) => m.baseline.angle)) * 3 + sd(ok.map((m) => m.slant.angle)) * 1.5 + (sd(aspects) / Math.max(0.1, am)) * 80 + sd(ok.map((m) => m.firstLetter.ratio)) * 25;
  return Math.round(clamp(100 - penalty, 10, 100));
}
