'use client';
/** Browser helpers for signature photos: downsizing for upload, measuring (measure.ts) and drawing the measurement marks. */
import { measureSignature, rgbaToGray, type SignatureMetrics } from '@/lib/signature/measure';

const MAX_SIDE = 1200;
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

/** Measures a sample and draws the measurement overlay. */
export async function analyseSample(dataUrl: string, source: 'photo' | 'drawn'): Promise<{ metrics: SignatureMetrics | null; annotated: string | null; width: number; height: number }> {
  const img = await loadImg(dataUrl);
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, c.width, c.height);
  const m = measureSignature(rgbaToGray(px.data, c.width, c.height), { source });
  if (!m.strokeWidth) return { metrics: m, annotated: null, width: img.width, height: img.height };
  const k = m.work.scale, S = (v: number) => v * k;
  const lw = Math.max(2, Math.round(Math.max(c.width, c.height) / 400));
  ctx.lineCap = 'round';
  // crop frame
  ctx.setLineDash([lw * 3, lw * 3]); ctx.strokeStyle = 'rgba(120,120,140,.55)'; ctx.lineWidth = lw * 0.7;
  ctx.strokeRect(S(m.crop.x) - lw * 3, S(m.crop.y) - lw * 3, S(m.crop.w) + lw * 6, S(m.crop.h) + lw * 6); ctx.setLineDash([]);
  // baseline (gold)
  const [x1, y1, x2, y2] = m.baseline.line;
  ctx.strokeStyle = 'rgba(201,150,30,.95)'; ctx.lineWidth = lw * 1.3; ctx.beginPath(); ctx.moveTo(S(x1), S(y1)); ctx.lineTo(S(x2), S(y2)); ctx.stroke();
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
  return { metrics: m, annotated: c.toDataURL('image/jpeg', 0.9), width: img.width, height: img.height };
}

