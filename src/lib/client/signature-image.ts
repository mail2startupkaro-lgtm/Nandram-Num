'use client';
/**
 * Browser helpers for signature photos: downsizing for upload, measuring (measure.ts – several passes, ink colour,
 * photo quality), the close-up views sent to the AI inspector, and drawing the measurement marks.
 */
import { flattenBackground, inkColourOf, measureMultiPass, rgbaToGray, type GrayImage, type SignatureMetrics } from '@/lib/signature/measure';
import type { ViewKind } from '@/lib/signature/agent';

const MAX_SIDE = 1200;
const VIEW_SIDE = 640;
const loadImg = (src: string) => new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = src; });

/** Reads an image file, downsizes it and returns a JPEG data URL small enough to upload. */
export async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    const k = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.88);
  } finally { URL.revokeObjectURL(url); }
}

export interface SampleView { kind: ViewKind; dataUrl: string }
export interface SampleAnalysis { metrics: SignatureMetrics | null; annotated: string | null; views: SampleView[]; width: number; height: number }

/** Canvas → JPEG data URL, scaled so the longer side is at most `max`. */
function toJpeg(src: HTMLCanvasElement, sx: number, sy: number, sw: number, sh: number, max = VIEW_SIDE, upscale = 2.5): string {
  const k = Math.min(upscale, max / Math.max(sw, sh));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(sw * k)); c.height = Math.max(1, Math.round(sh * k));
  const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = 'high'; ctx.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.82);
}

/** Cleaned view of the signature area: shadows and paper tint removed, levels stretched so the ink stands out. */
function cleanedCanvas(gray: GrayImage, box: { x: number; y: number; w: number; h: number }): HTMLCanvasElement {
  const x0 = Math.max(0, Math.floor(box.x)), y0 = Math.max(0, Math.floor(box.y));
  const w = Math.min(gray.width - x0, Math.ceil(box.w)), h = Math.min(gray.height - y0, Math.ceil(box.h));
  const sub = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) sub.set(gray.data.subarray((y0 + y) * gray.width + x0, (y0 + y) * gray.width + x0 + w), y * w);
  const flat = flattenBackground({ width: w, height: h, data: sub }).img.data;
  const sorted = Uint8Array.from(flat).sort();
  const lo = sorted[Math.floor(sorted.length * 0.01)], hi = sorted[Math.floor(sorted.length * 0.6)];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d')!; const out = ctx.createImageData(w, h);
  for (let i = 0; i < flat.length; i++) {
    const t = Math.min(1, Math.max(0, (flat[i] - lo) / Math.max(8, hi - lo)));
    const v = Math.round(255 * t ** 1.6);
    out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = v; out.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  return c;
}

/** Measures a sample (several passes), reads the ink colour, makes the close-up views and draws the measurement overlay. */
export async function analyseSample(dataUrl: string, source: 'photo' | 'drawn'): Promise<SampleAnalysis> {
  const img = await loadImg(dataUrl);
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, c.width, c.height);
  const gray = rgbaToGray(px.data, c.width, c.height);
  const m0 = measureMultiPass(gray, { source });
  if (!m0.strokeWidth) return { metrics: m0, annotated: null, views: [], width: img.width, height: img.height };
  const m: SignatureMetrics = source === 'photo' ? { ...m0, ink: inkColourOf(px.data, c.width, c.height) } : m0;
  const k = m.work.scale, S = (v: number) => v * k;

  // Close-up views for the AI inspector (made before the marks are drawn)
  const pad = Math.max(12, S(m.coreHeight) * 0.6);
  const box = { x: S(m.crop.x) - pad, y: S(m.crop.y) - pad, w: S(m.crop.w) + 2 * pad, h: S(m.crop.h) + 2 * pad };
  const views: SampleView[] = [];
  try {
    const clean = cleanedCanvas(gray, box);
    views.push({ kind: 'clean', dataUrl: toJpeg(clean, 0, 0, clean.width, clean.height, 900, 1.5) });
    const [fx0, fy0, fx1, fy1] = m.firstLetter.box;
    const fp = S(m.coreHeight) * 0.5;
    views.push({ kind: 'first', dataUrl: toJpeg(c, Math.max(0, S(fx0) - fp), Math.max(0, S(fy0) - fp), Math.min(c.width, S(fx1 - fx0) + 2 * fp), Math.min(c.height, S(fy1 - fy0) + 2 * fp)) });
    const ew = S(m.crop.w) * 0.28;
    views.push({ kind: 'end', dataUrl: toJpeg(c, Math.max(0, S(m.crop.x + m.crop.w) - ew - pad / 2), Math.max(0, box.y), Math.min(c.width, ew + pad), Math.min(c.height, box.h)) });
  } catch { /* views are optional */ }

  const lw = Math.max(2, Math.round(Math.max(c.width, c.height) / 400));
  ctx.lineCap = 'round';
  // crop frame
  ctx.setLineDash([lw * 3, lw * 3]); ctx.strokeStyle = 'rgba(120,120,140,.55)'; ctx.lineWidth = lw * 0.7;
  ctx.strokeRect(S(m.crop.x) - lw * 3, S(m.crop.y) - lw * 3, S(m.crop.w) + lw * 6, S(m.crop.h) + lw * 6); ctx.setLineDash([]);
  // baseline (gold)
  const [x1, y1, x2, y2] = m.baseline.line;
  ctx.strokeStyle = 'rgba(201,150,30,.95)'; ctx.lineWidth = lw * 1.3; ctx.beginPath(); ctx.moveTo(S(x1), S(y1)); ctx.lineTo(S(x2), S(y2)); ctx.stroke();
  // shape of the line: arch / drop shown as a dashed orange bend over the second half
  if (m.curve.shape !== 'even' && m.curve.confidence >= 0.3) {
    const xm = (x1 + x2) / 2, ym = (y1 + y2) / 2, t = Math.tan((m.curve.endAngle * Math.PI) / 180);
    ctx.setLineDash([lw * 2, lw * 2]); ctx.strokeStyle = 'rgba(230,110,20,.9)'; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(S(xm), S(ym)); ctx.lineTo(S(x2), S(ym - (x2 - xm) * t)); ctx.stroke(); ctx.setLineDash([]);
  }
  // first letter (blue box)
  const [fx0, fy0, fx1, fy1] = m.firstLetter.box;
  ctx.strokeStyle = 'rgba(40,90,200,.8)'; ctx.lineWidth = lw; ctx.strokeRect(S(fx0) - lw * 2, S(fy0) - lw * 2, S(fx1 - fx0) + lw * 4, S(fy1 - fy0) + lw * 4);
  // long lines: red if crossing the name, green if below
  for (const l of m.lines) { ctx.strokeStyle = l.kind === 'through' ? 'rgba(210,40,40,.9)' : 'rgba(40,150,80,.85)'; ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(S(l.x1), S(l.ya) + lw * 3); ctx.lineTo(S(l.x2), S(l.yb) + lw * 3); ctx.stroke(); }
  // ending arrow (purple)
  const [ax, ay] = m.ending.from, [bx, by] = m.ending.to;
  if (bx - ax > 2) {
    const ang = Math.atan2(S(by - ay), S(bx - ax)), L = lw * 6;
    ctx.strokeStyle = 'rgba(130,60,190,.9)'; ctx.lineWidth = lw * 1.2;
    ctx.beginPath(); ctx.moveTo(S(ax), S(ay) - lw * 6); ctx.lineTo(S(bx), S(by) - lw * 6); ctx.lineTo(S(bx) - L * Math.cos(ang - 0.5), S(by) - lw * 6 - L * Math.sin(ang - 0.5)); ctx.moveTo(S(bx), S(by) - lw * 6); ctx.lineTo(S(bx) - L * Math.cos(ang + 0.5), S(by) - lw * 6 - L * Math.sin(ang + 0.5)); ctx.stroke();
  }
  // dots
  ctx.strokeStyle = 'rgba(210,40,40,.9)'; ctx.lineWidth = lw;
  for (const [x, y] of m.dots.points) { ctx.beginPath(); ctx.arc(S(x), S(y), lw * 5, 0, Math.PI * 2); ctx.stroke(); }
  return { metrics: m, annotated: c.toDataURL('image/jpeg', 0.9), views, width: img.width, height: img.height };
}
