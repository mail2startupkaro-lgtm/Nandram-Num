/** Signature analysis v4: photo clean-up, new measured aspects, multi-pass stability, ink colour and the AI cross-check. */
import { describe, expect, it, vi } from 'vitest';
import { classifyMetrics, inkColourOf, measureMultiPass, measureSignature, type GrayImage } from '@/lib/signature/measure';
import { fuseFeatures, letterSimilarity, runSignatureAgent, AnalysisSchema, type Inspection } from '@/lib/signature/agent';
import { featureHi } from '@/lib/signature/hindi';
import { FEATURES } from '@/lib/signature/catalogue';
import { OPTION_HI, FEATURE_NAME_HI } from '@/lib/signature/hindi';
import { signatureNumbers } from '@/lib/signature/numbers';
import { parseDate } from '@/lib/numerology';

interface Opt { angle?: number; arch?: number; shadow?: boolean; ruled?: number; ruledTilt?: number; underline?: boolean; shrink?: boolean }
/** Synthetic signature: letter strokes along a line that may tilt, arch, shrink, sit on ruled paper or under a shadow. */
function fake(o: Opt = {}): GrayImage {
  const W = 1000, H = 420, data = new Uint8Array(W * H);
  const tilt = Math.tan(((o.ruledTilt ?? 0) * Math.PI) / 180);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) data[y * W + x] = o.shadow ? Math.round(245 - 120 * (x / W) * (y / H)) : 248;
  const ink = (x: number, y: number, r = 2.6, v = 20) => { for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) if (xx >= 0 && yy >= 0 && xx < W && yy < H && (xx - x) ** 2 + (yy - y) ** 2 <= r * r) data[yy * W + xx] = Math.min(data[yy * W + xx], v); };
  const line = (x0: number, y0: number, x1: number, y1: number, r = 2.6, v = 20) => { const L = Math.hypot(x1 - x0, y1 - y0); for (let i = 0; i <= L; i += 0.7) ink(x0 + ((x1 - x0) * i) / L, y0 + ((y1 - y0) * i) / L, r, v); };
  if (o.ruled) for (let k = 0; k < o.ruled; k++) { const y0 = 60 + k * 90; line(0, y0, W - 1, y0 - (W - 1) * tilt, 1.2, 150); }
  const n = 15, x0 = 130, step = 44, base = 250, tA = Math.tan(((o.angle ?? 0) * Math.PI) / 180) ;
  const by = (x: number) => { const t = (x - x0) / (n * step); return base - (x - x0) * tA - (o.arch ? o.arch * 4 * t * (1 - t) : 0) - (x - x0) * tilt; };
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step, scale = o.shrink ? 1 - (0.7 * i) / n : 1, h = (i % 3 === 1 ? 72 : 42) * scale;
    line(x, by(x), x + h * 0.2, by(x) - h); line(x + h * 0.2, by(x) - h, x + step * 0.6, by(x + step * 0.6));
  }
  if (o.underline) line(x0, by(x0) + 30, x0 + n * step, by(x0 + n * step) + 30, 2.2);
  return { width: W, height: H, data };
}
const cls = (o: Opt) => classifyMetrics(measureSignature(fake(o)), 15);

describe('photo clean-up', () => {
  it('reads a shadowed photo like a clean one', () => {
    const clean = measureSignature(fake({ angle: 8 })), shadow = measureSignature(fake({ angle: 8, shadow: true }));
    expect(shadow.strokeWidth).toBeGreaterThan(0);
    expect(Math.abs(shadow.baseline.angle - clean.baseline.angle)).toBeLessThan(2.5);
    expect(shadow.crop.w).toBeLessThan(clean.crop.w + 60);
    expect(cls({ angle: 8, shadow: true }).baseline.option).toBe('rising');
  });
  it('removes ruled paper lines and reads the baseline against them', () => {
    const m = measureSignature(fake({ ruled: 4, ruledTilt: 5 }));
    expect(m.ruled.count).toBeGreaterThanOrEqual(2);
    expect(Math.abs(m.ruled.angle - 5)).toBeLessThan(1.2);
    expect(Math.abs(m.baseline.angle)).toBeLessThan(3); // straight on the paper, although tilted in the photo
    expect(classifyMetrics(m, 15).underline.option).toBe('none');
    expect(m.quality.issues.join(' ')).toMatch(/ruled/);
  });
  it('keeps a single long line as an underline (not ruled paper)', () => {
    expect(cls({ underline: true }).underline.option).toBe('single');
  });
});

describe('new measured aspects', () => {
  it('finds an arched line and shrinking letters', () => {
    expect(measureSignature(fake({ arch: 90 })).curve.shape).toBe('arched');
    expect(measureSignature(fake({})).curve.shape).toBe('even');
    expect(cls({ shrink: true }).progression.option).toBe('shrinking');
    expect(cls({}).progression.option).toBe('even');
  });
  it('gives every reading a Hindi value and a catalogue option with a Hindi label', () => {
    const c = cls({ arch: 90, shrink: true });
    for (const [id, f] of Object.entries(c)) {
      expect(FEATURES.find((x) => x.id === id)?.options.some((o) => o.id === f.option)).toBe(true);
      expect(f.valueHi).toBeTruthy();
      expect(f.valueHi).not.toMatch(/[A-Za-z]{3,}/);
    }
    for (const f of FEATURES) { expect(FEATURE_NAME_HI[f.id]).toBeTruthy(); for (const o of f.options) expect(OPTION_HI[`${f.id}:${o.id}`]).toBeTruthy(); }
  });
  it('re-measures each sample and records stability', () => {
    const m = measureMultiPass(fake({ angle: 9 }));
    expect(m.stability?.baseline).toBeGreaterThanOrEqual(0.75);
    expect(classifyMetrics(m, 15).baseline.confidence).toBeGreaterThan(0.5);
  });
  it('reads ink colour with white balance', () => {
    const W = 200, H = 100, px = new Uint8ClampedArray(W * H * 4);
    const paint = (r: number, g: number, b: number, pr = 250, pg = 235, pb = 200) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, on = y > 40 && y < 60 && x > 20 && x < 180; px[i] = on ? r : pr; px[i + 1] = on ? g : pg; px[i + 2] = on ? b : pb; px[i + 3] = 255; } return inkColourOf(px, W, H)!.colour; };
    expect(paint(30, 50, 170)).toBe('blue');
    expect(paint(190, 30, 35)).toBe('red');
    expect(paint(40, 36, 28)).toBe('black'); // dark brown under warm light is black ink
  });
});

describe('AI cross-check', () => {
  const n = signatureNumbers({ fullName: 'Rahul Kumar Sharma', signatureName: 'R Sharma', dob: parseDate('28-08-1990'), professionId: 'business', asOf: parseDate('27-11-2026') });
  const measured = cls({ angle: -9 });
  const base = { fullName: 'Rahul Kumar Sharma', signatureName: 'R Sharma', dobText: '28-08-1990', profession: 'Business', goals: [], language: 'en' as const, observations: {}, measured };
  const ins: Inspection = { readsAs: 'R Sharma', photoIssues: [], extras: [{ feature: 'Starting stroke', observed: 'a short hook before the R' }],
    features: [{ id: 'baseline', option: 'falling', evidence: 'line drops to the right', confidence: 'high' }, { id: 'underline', option: 'through', evidence: 'a stroke crosses the surname', confidence: 'low' }, { id: 'size', option: 'large', evidence: 'fills the box', confidence: 'medium' }] };
  it('raises certainty when both readers agree and lists contradictions', () => {
    const f = fuseFeatures(base, ins);
    const bl = f.features.find((x) => x.id === 'baseline')!;
    expect(bl).toMatchObject({ by: 'fused', option: 'falling', agreement: 'agree' });
    expect(bl.confidence).toBeGreaterThan(measured.baseline.confidence);
    const ul = f.features.find((x) => x.id === 'underline')!;
    expect(ul.option).toBe('none'); // the confident pixel reading wins over a low-confidence visual guess
    expect(f.conflicts.map((c) => c.id)).toContain('underline');
    expect(f.features.find((x) => x.id === 'legibility')).toMatchObject({ option: 'clear' }); // read correctly by the inspector
    expect(letterSimilarity('R Sharma', 'R. SHARMA')).toBe(1);
  });
  it('expert observations still win', () => {
    expect(fuseFeatures({ ...base, observations: { baseline: 'straight' } }, ins).features.find((x) => x.id === 'baseline')).toMatchObject({ by: 'expert', option: 'straight' });
  });
  it('runs the inspection pass, then the written pass, with the close-up views attached', async () => {
    const analysis = { overallScore: 60, headline: 'Rahul, two changes will help', summary: 'I looked at your signature closely and the line falls to the right, which I suggest correcting first.',
      observations: [{ featureId: 'baseline', feature: 'Baseline', observed: 'Falling', meaning: 'Pressure', impact: 'watch', confidence: 'high' }], personality: ['Steady.'], career: { fit: 'Good.', advice: 'Keep going.' },
      strengths: [], watchouts: [], corrections: [{ title: 'Make the baseline rise', detail: 'Let it rise gently.', priority: 'high' }], idealSignature: { steps: ['Rise gently.'], startDay: 'Sunday', inkColour: 'Blue', practice: '21 days' }, closing: 'Rahul, begin on Sunday.' };
    const replies = [ins, analysis];
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(replies.shift()) }] } }] }), { status: 200 }));
    const img = { mediaType: 'image/jpeg' as const, base64: 'AAAA' };
    const r = await runSignatureAgent({ ...base, images: [img], views: [{ sample: 0, kind: 'clean', image: img }, { sample: 0, kind: 'first', image: img }], quality: [82] }, n,
      { env: { LLM_PROVIDER: 'gemini', GEMINI_API_KEY: 'k', LLM_MODEL: 'gemini-2.0-flash' }, fetchImpl: fetchMock as unknown as typeof fetch });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(first.contents[0].parts.filter((p: { inlineData?: unknown }) => p.inlineData).length).toBe(3);
    expect(first.contents[0].parts.at(-1).text).toMatch(/close-up of the first letter/);
    const second = JSON.parse(String((fetchMock.mock.calls[1] as unknown as [string, RequestInit])[1].body));
    expect(second.contents[0].parts.at(-1).text).toMatch(/CROSS-CHECKED FEATURES/);
    expect(r.source).toBe('ai');
    expect(r.inspection).toMatchObject({ readsAs: 'R Sharma' });
    expect(r.inspection!.conflicts.length).toBeGreaterThan(0);
    expect(AnalysisSchema.safeParse(r.analysis).success).toBe(true);
  });
  it('shows measured values in Hindi in Hindi reports', () => {
    const f = fuseFeatures(base, null).features.find((x) => x.id === 'baseline')!;
    const h = featureHi(f);
    expect(h.value).toMatch(/रेखा/);
    expect(h.value).not.toMatch(/baseline|waviness/);
  });
});
