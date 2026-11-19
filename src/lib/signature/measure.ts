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
}

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

// ───────────────────────── main measurement
export function measureSignature(input: GrayImage, opts: { source?: SampleSource; maxSide?: number } = {}): SignatureMetrics {
  const source = opts.source ?? 'photo';
  const { img, scale } = downscale(input, opts.maxSide ?? 900);
  const { width: W, height: H, data } = img;
  const issues: string[] = [];

  // 1. Ink mask (Otsu, with a guard against inverted images and empty pages)
  let thr = otsu(data);
  let inkCount = 0; for (const v of data) if (v <= thr) inkCount++;
  let invert = false;
  if (inkCount / data.length > 0.5) { invert = true; inkCount = data.length - inkCount; }
  let sumAll = 0; for (let i = 0; i < data.length; i++) sumAll += data[i];
  const mean = sumAll / data.length;
  if (!invert && thr > mean - 8) thr = Math.min(thr, mean - 25); // faint background shading is not ink
  let mask = new Uint8Array(W * H);
  for (let i = 0; i < data.length; i++) mask[i] = (invert ? data[i] > thr : data[i] <= thr) ? 1 : 0;

  // 2. Remove specks
  const sw0 = strokeWidthOf(mask, W, H);
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
  const sliceRanges: number[] = [];
  for (let s = 0; s < nSlices; s++) {
    const xs = Math.floor(cx0 + s * sliceW), xe = Math.floor(cx0 + (s + 1) * sliceW);
    const ys: number[] = [];
    for (let x = xs; x < xe; x++) for (let y = cy0; y <= cy1; y++) if (body[y * W + x]) ys.push(y);
    if (ys.length < Math.max(4, sw * 2)) continue;
    ys.sort((a, b) => a - b);
    const q = (p: number) => ys[Math.min(ys.length - 1, Math.floor(p * (ys.length - 1)))];
    const xm = (xs + xe) / 2;
    basePts.push([xm, q(0.8)]); centPts.push([xm, q(0.5)]);
    sliceRanges.push(q(0.92) - q(0.08));
  }
  const bFit = theilSen(basePts), cFit = theilSen(centPts);
  const bAngle = -deg(Math.atan(bFit.m)), cAngle = -deg(Math.atan(cFit.m));
  const baseAngle = basePts.length >= 3 ? (bAngle * 0.6 + cAngle * 0.4) : 0;
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
  return {
    ok: issues.length === 0 || totalInk > 200,
    issues, source, work: { width: W, height: H, scale },
    crop: { x: cx0, y: cy0, w: cw, h: ch },
    inkRatio: r1(inkRatio * 100) / 100, strokeWidth: r1(sw), coreHeight: r1(coreH), aspect: r1(cw / ch),
    baseline: { angle: r1(baseAngle), waviness: Math.round(waviness * 100) / 100, confidence: Math.round(baseConf * 100) / 100,
      line: [cx0, bFit.m * cx0 + bFit.c, cx1, bFit.m * cx1 + bFit.c] },
    slant: { angle: all.angle, relative: r1(all.angle + (baseConf >= 0.3 ? baseAngle : 0)), left: left.angle, right: right.angle, mixed, confidence: Math.round(all.conf * 100) / 100 },
    firstLetter: { ratio: Math.round(firstRatio * 100) / 100, box: [mainLeft, fy0 === H ? cy0 : fy0, leftEnd, fy1 || cy1], confidence: fys.length > 20 ? 0.5 : 0.2 },
    ending: { angle: r1(endAngle), confidence: endPts.length >= 5 ? 0.55 : 0.2, from: [ex0, eFit.m * ex0 + eFit.c], to: [ex1, eFit.m * ex1 + eFit.c] },
    lines, dots: { end: endDots, below: belowDots, points: dotPts }, gaps, letterStrokes,
    pressure: { strokeRel: Math.round((sw / coreH) * 100) / 100, darkness: Math.round(darkness), confidence: source === 'drawn' ? 0 : 0.35 },
    sizeIndex: r1(coreH / sw), enclosed,
  };
}

// ───────────────────────── interpretation (feature ids/options match catalogue.ts)
export interface MeasuredFeature { option: string; value: string; confidence: number }
export type MeasuredFeatures = Record<string, MeasuredFeature>;

const signed = (v: number) => `${v > 0 ? '+' : ''}${v}°`;

/** Turns one sample's metrics into catalogue feature options. `letters` = letters in the signed name. */
export function classifyMetrics(m: SignatureMetrics, letters = 0): MeasuredFeatures {
  if (!m.ok && !m.strokeWidth) return {};
  const out: MeasuredFeatures = {};
  const b = m.baseline;
  out.baseline = {
    option: b.waviness > 0.32 && Math.abs(b.angle) < 6 ? 'wavy' : b.angle >= 3 ? 'rising' : b.angle <= -3 ? 'falling' : 'straight',
    value: `${signed(b.angle)} baseline, waviness ${Math.round(b.waviness * 100)}%`, confidence: b.confidence,
  };
  const s = m.slant;
  out.slant = { option: s.mixed ? 'mixed' : s.relative >= 8 ? 'right' : s.relative <= -8 ? 'left' : 'upright', value: s.mixed ? `left part ${signed(s.left)}, right part ${signed(s.right)}` : `${signed(s.relative)} from upright`, confidence: s.confidence };
  out.first = { option: m.firstLetter.ratio >= 1.6 ? 'bold' : m.firstLetter.ratio <= 1.0 ? 'small' : 'proportionate', value: `first letter ${m.firstLetter.ratio.toFixed(2)}× the rest`, confidence: m.firstLetter.confidence };
  const ul = m.lines.filter((l) => l.kind === 'underline').length, th = m.lines.some((l) => l.kind === 'through');
  out.underline = { option: th ? 'through' : ul >= 2 ? 'double' : ul === 1 ? 'single' : 'none', value: th ? 'a long stroke crosses the letters' : ul ? `${ul} line${ul > 1 ? 's' : ''} below the name` : 'no long line', confidence: m.lines.length ? 0.75 : 0.6 };
  out.ending = { option: m.ending.angle >= 15 ? 'upward' : m.ending.angle <= -15 ? 'downward' : 'flat', value: `last stroke ${signed(m.ending.angle)}`, confidence: m.ending.confidence };
  const two = m.dots.below >= 2 && m.dots.below <= 4;
  out.dots = { option: m.dots.end > 0 && m.dots.end <= 2 ? 'end' : two ? 'two' : 'none', value: m.dots.end > 0 && m.dots.end <= 2 ? 'dot after the signature' : two ? `${m.dots.below} dots below` : 'no dots', confidence: m.dots.end > 2 || m.dots.below > 4 ? 0.3 : 0.6 };
  out.spacing = { option: m.gaps > 0 ? 'gaps' : 'connected', value: m.gaps ? `${m.gaps} clear gap${m.gaps > 1 ? 's' : ''} between parts` : 'written in one flow', confidence: 0.55 };
  out.size = { option: m.sizeIndex >= 11 ? 'large' : m.sizeIndex <= 5.5 ? 'small' : 'medium', value: `letter height ≈ ${m.sizeIndex}× pen width (estimate)`, confidence: 0.3 };
  if (m.pressure.confidence > 0) out.pressure = { option: m.pressure.strokeRel >= 0.17 || (m.pressure.darkness < 45 && m.pressure.strokeRel >= 0.11) ? 'heavy' : m.pressure.strokeRel <= 0.07 && m.pressure.darkness > 105 ? 'light' : 'medium', value: `stroke ${Math.round(m.pressure.strokeRel * 100)}% of letter height (estimate)`, confidence: m.pressure.confidence };
  if (letters > 0) {
    const r = m.letterStrokes / letters;
    out.legibility = { option: r >= 0.9 ? 'clear' : r >= 0.5 ? 'partial' : 'illegible', value: `${m.letterStrokes} letter strokes for ${letters} letters (estimate)`, confidence: 0.35 };
  }
  out.enclosure = { option: m.enclosed ? 'circled' : 'open', value: m.enclosed ? 'signature is enclosed by a loop' : 'not enclosed', confidence: m.enclosed ? 0.6 : 0.5 };
  return out;
}

/** Combines several samples: majority option weighted by confidence; agreement raises confidence. */
export function combineSamples(list: MeasuredFeatures[]): MeasuredFeatures {
  if (list.length <= 1) return list[0] ?? {};
  const out: MeasuredFeatures = {};
  const keys = new Set(list.flatMap((x) => Object.keys(x)));
  for (const k of keys) {
    const votes = new Map<string, { w: number; n: number; value: string }>();
    let present = 0;
    for (const s of list) { const f = s[k]; if (!f) continue; present++; const v = votes.get(f.option) ?? { w: 0, n: 0, value: f.value }; v.w += f.confidence; v.n++; votes.set(f.option, v); }
    const [opt, v] = [...votes.entries()].sort((a, b) => b[1].w - a[1].w)[0];
    const agreement = v.n / present;
    out[k] = { option: opt, value: `${v.value}${present > 1 ? ` · ${v.n}/${present} samples agree` : ''}`, confidence: Math.round(clamp((v.w / v.n) * (0.6 + 0.6 * agreement), 0, 0.95) * 100) / 100 };
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
