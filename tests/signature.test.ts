/** Signature analysis: pixel measurements on synthetic signatures, numerology facts and the offline analyst. */
import { describe, expect, it } from 'vitest';
import { classifyMetrics, combineSamples, consistencyScore, measureSignature, type GrayImage } from '@/lib/signature/measure';
import { signatureNumbers, signingVariants } from '@/lib/signature/numbers';
import { effectiveFeatures, engineScores, ruleBasedAnalysis, runSignatureAgent, AnalysisSchema } from '@/lib/signature/agent';
import { buildSignatureReportHtml } from '@/lib/signature/report';
import { resolveTheme, DEFAULT_BRANDING } from '@/lib/pdf/themes';
import { parseDate } from '@/lib/numerology';

/** Draws a fake handwritten line: `n` letter strokes with a slant, on a baseline at `angle`°, plus optional extras. */
function fake(o: { angle?: number; slant?: number; n?: number; underline?: boolean; through?: boolean; dot?: boolean; bigFirst?: boolean; endUp?: boolean } = {}): GrayImage {
  const W = 900, H = 360, data = new Uint8Array(W * H).fill(250);
  const dot = (x: number, y: number, r = 2.5) => { for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) if (xx >= 0 && yy >= 0 && xx < W && yy < H && (xx - x) ** 2 + (yy - y) ** 2 <= r * r) data[yy * W + xx] = 25; };
  const line = (x0: number, y0: number, x1: number, y1: number, r = 2.5) => { const L = Math.hypot(x1 - x0, y1 - y0); for (let i = 0; i <= L; i += 0.7) dot(x0 + ((x1 - x0) * i) / L, y0 + ((y1 - y0) * i) / L, r); };
  const tA = Math.tan(((o.angle ?? 0) * Math.PI) / 180), tS = Math.tan(((o.slant ?? 0) * Math.PI) / 180);
  const n = o.n ?? 14, x0 = 120, step = 42, base = 220;
  const by = (x: number) => base - (x - x0) * tA;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step, h = i === 0 && o.bigFirst ? 120 : i % 3 === 1 ? 70 : 40;
    line(x, by(x), x + h * tS, by(x) - h);                       // up-stroke
    line(x + h * tS, by(x) - h, x + step * 0.6, by(x + step * 0.6)); // down-stroke to the next letter
  }
  const xEnd = x0 + n * step;
  if (o.endUp) line(xEnd - 10, by(xEnd - 10), xEnd + 50, by(xEnd + 50) - 45);
  if (o.underline) line(x0, by(x0) + 30, xEnd, by(xEnd) + 30, 2.2);
  if (o.through) line(x0 - 10, by(x0) - 22, xEnd, by(xEnd) - 22, 2.2);
  if (o.dot) dot(xEnd + 80, by(xEnd) - 4, 5);
  return { width: W, height: H, data };
}
const cls = (o: Parameters<typeof fake>[0]) => classifyMetrics(measureSignature(fake(o)), 14);

describe('signature measurements', () => {
  it('reads a rising, a falling and a straight baseline', () => {
    expect(measureSignature(fake({ angle: 10 })).baseline.angle).toBeGreaterThan(6);
    expect(measureSignature(fake({ angle: -10 })).baseline.angle).toBeLessThan(-6);
    expect(Math.abs(measureSignature(fake({})).baseline.angle)).toBeLessThan(3);
    expect(cls({ angle: 10 }).baseline.option).toBe('rising');
    expect(cls({ angle: -10 }).baseline.option).toBe('falling');
  });
  it('reads right and left slant relative to the baseline', () => {
    expect(cls({ slant: 25 }).slant.option).toBe('right');
    expect(cls({ slant: -25 }).slant.option).toBe('left');
    expect(cls({ slant: 0 }).slant.option).toBe('upright');
  });
  it('tells an underline from a stroke cutting through the name', () => {
    expect(cls({ underline: true }).underline.option).toBe('single');
    expect(cls({ through: true }).underline.option).toBe('through');
    expect(cls({}).underline.option).toBe('none');
    expect(cls({ angle: 9, underline: true }).underline.option).toBe('single'); // tilted with the baseline
    expect(cls({ angle: -8, through: true }).underline.option).toBe('through');
  });
  it('finds a full stop, a prominent first letter and an upward ending', () => {
    expect(cls({ dot: true }).dots.option).toBe('end');
    expect(cls({}).dots.option).toBe('none');
    expect(measureSignature(fake({ bigFirst: true })).firstLetter.ratio).toBeGreaterThan(measureSignature(fake({})).firstLetter.ratio + 0.4);
    expect(cls({ endUp: true }).ending.option).toBe('upward');
  });
  it('handles a blank page and combines samples', () => {
    const blank = measureSignature({ width: 400, height: 200, data: new Uint8Array(80000).fill(255) });
    expect(blank.ok).toBe(false);
    expect(classifyMetrics(blank)).toEqual({});
    const a = measureSignature(fake({ angle: 8 })), b = measureSignature(fake({ angle: 9 })), c = measureSignature(fake({ angle: -9, slant: 25 }));
    expect(consistencyScore([a, b])!).toBeGreaterThan(consistencyScore([a, c])!);
    const comb = combineSamples([classifyMetrics(a, 14), classifyMetrics(b, 14), classifyMetrics(c, 14)]);
    expect(comb.baseline.option).toBe('rising');
    expect(comb.baseline.value).toMatch(/2\/3 samples agree/);
  });
});

describe('signature numerology', () => {
  const n = signatureNumbers({ fullName: 'Rahul Kumar Sharma', signatureName: 'R K Sharma', dob: parseDate('28-08-1990'), professionId: 'business', asOf: parseDate('19-11-2026') });
  it('computes Moolank, Bhagyank and Chaldean name numbers', () => {
    expect(n.moolank).toBe(1); expect(n.bhagyank).toBe(1);
    expect(n.signName.compound).toBe(20); expect(n.signName.single).toBe(2);
    expect(n.firstLetter).toMatchObject({ letter: 'R', value: 2, planet: 'Moon' });
    expect(n.signName.meaning).toMatch(/Awakening/);
  });
  it('ranks signing-name options with the current form first', () => {
    expect(n.nameOptions[0].current).toBe(true);
    const rest = n.nameOptions.slice(1).map((o) => o.score);
    expect(rest).toEqual([...rest].sort((a, b) => b - a));
    expect(signingVariants('Rahul Kumar Sharma').map((v) => v.text)).toContain('R SHARMA');
  });
  it('suggests start dates on the ruling planet’s weekday', () => {
    expect(n.startDates.length).toBeGreaterThan(0);
    for (const d of n.startDates) { expect(new Date(`${d.iso}T12:00:00Z`).getUTCDay()).toBe(0); expect(d.iso > '2026-11-19').toBe(true); }
  });
});

describe('offline analyst and report', () => {
  const n = signatureNumbers({ fullName: 'Rahul Kumar Sharma', dob: parseDate('28-08-1990'), professionId: 'business', asOf: parseDate('19-11-2026') });
  const measured = cls({ angle: -10, through: true, dot: true });
  const input = { fullName: 'Rahul Kumar Sharma', dobText: '28-08-1990', profession: 'Business', goals: ['Wealth & finance'], language: 'en' as const, observations: { slant: 'left' }, measured };
  it('lets expert observations override measurements and scores a weak signature lower', async () => {
    const fs = effectiveFeatures(input);
    expect(fs.find((f) => f.id === 'slant')).toMatchObject({ by: 'expert', option: 'left' });
    expect(fs.find((f) => f.id === 'baseline')).toMatchObject({ by: 'measured', option: 'falling' });
    const good = engineScores({ ...input, observations: {}, measured: cls({ angle: 10, underline: true, endUp: true }) }, n, effectiveFeatures({ ...input, observations: {}, measured: cls({ angle: 10, underline: true, endUp: true }) }));
    expect(engineScores(input, n, fs).overall).toBeLessThan(good.overall);
    const r = await runSignatureAgent(input, n, { env: {} });
    expect(r.source).toBe('rules');
    expect(AnalysisSchema.safeParse(r.analysis).success).toBe(true);
    expect(r.analysis.corrections.map((c) => c.title).join(' | ')).toMatch(/cutting through|baseline rise|full stop/i);
  });
  it('builds a 5-section report in English and Hindi with escaped text', () => {
    const fs = effectiveFeatures(input);
    const analysis = ruleBasedAnalysis({ ...input, fullName: '<b>Rahul</b>' }, n, fs);
    for (const language of ['en', 'hi'] as const) {
      const html = buildSignatureReportHtml({ client: { fullName: '<b>Rahul</b>', dob: '1990-08-28', profession: 'Business', goals: [], language }, preparedBy: 'Acharya Nandram', numbers: n,
        result: { analysis, source: 'rules', scores: engineScores(input, n, fs), features: fs }, generatedAt: '2026-11-19T10:00:00Z' }, resolveTheme('royal-gold-maroon'), DEFAULT_BRANDING);
      expect(html).not.toContain('<b>Rahul</b>');
      expect((html.match(/class="sec-h"/g) ?? []).length).toBe(5);
      if (language === 'hi') expect(html).toContain('हस्ताक्षर विश्लेषण रिपोर्ट');
    }
  });
});
