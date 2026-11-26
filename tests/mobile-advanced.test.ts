import { describe, it, expect } from 'vitest';
import { analyseMobileAdvanced, adviceOf, verdictOf } from '@/lib/mobile-advanced/analysis';
import { buildMobileCoverHtml, buildMobileReportHtml, subScores } from '@/lib/mobile-advanced/report';
import { checkText, L } from '@/lib/mobile-advanced/text';
import { DEFAULT_BRANDING, resolveTheme } from '@/lib/pdf/themes';

const base = { fullName: 'Rahul Sharma', dob: '1990-08-14', gender: 'male' as const, mobile: '+91 98765 43210', asOf: '2026-11-26' };

describe('Advanced mobile number analysis with DOB', () => {
  it('hand-checked example: 14-08-1990 with 98765 43210', () => {
    // Moolank 1+4 = 5 · Bhagyank 1+4+0+8+1+9+9+0 = 32 → 5 · mobile 9+8+7+6+5+4+3+2+1+0 = 45 → 9 (neutral to 5)
    const r = analyseMobileAdvanced(base);
    expect(r.core.moolank.value).toBe(5);
    expect(r.core.bhagyank.value).toBe(5);
    expect(r.mobile.total).toMatchObject({ compound: 45, single: 9, category: 'favourable' });
    expect(r.mobile.relB).toBe('neutral');
    // 9-8, 8-7 and 4-3 are mutual enemies in the house table; no hard malefic pairs
    expect(r.mobile.conflict).toEqual(['98', '87', '43']);
    expect(r.mobile.malefic).toEqual([]);
    // last four 3+2+1+0 = 6, a friend of 5
    expect(r.mobile.last4).toMatchObject({ digits: '3210', single: 6, relationWithBhagyank: 'friend' });
    expect(r.checks).toHaveLength(10);
    expect(r.checks.find((c) => c.id === 'lastDigit')?.status).toBe('warn'); // ends in 0
    expect(r.score).toBe(66);
    expect(r.verdict).toBe('good');
    expect(r.months).toHaveLength(12);
    expect(r.months.every((m) => m.good === r.blueprint.idealTotals.includes(m.personalMonth))).toBe(true);
  });

  it('grid after adding the mobile digits only fills, never removes', () => {
    const r = analyseMobileAdvanced(base);
    for (const n of r.grid.missing) expect(r.dobGrid.missing).toContain(n);
    expect(r.grid.newlyFilled.every((n) => r.dobGrid.missing.includes(n))).toBe(true);
    expect(r.lifeAreas).toHaveLength(6);
  });

  it('compares shortlisted numbers, skips invalid and duplicates, marks the best', () => {
    const r = analyseMobileAdvanced({ ...base, alternates: ['9123456789', 'abc', '98765 43210', '+91 94155 16635'] });
    expect(r.invalidAlternates).toEqual(['abc']);
    expect(r.comparison).toHaveLength(3);
    expect(r.comparison.filter((x) => x.current)).toHaveLength(1);
    const top = Math.max(...r.comparison.map((x) => x.score));
    expect(r.comparison[0].score).toBe(top);
    expect(r.comparison.filter((x) => x.best).every((x) => x.score === top)).toBe(true);
  });

  it('rejects bad input with clear errors', () => {
    expect(() => analyseMobileAdvanced({ ...base, mobile: '12345' })).toThrow(/10-digit/);
    expect(() => analyseMobileAdvanced({ ...base, fullName: '  ' })).toThrow(/name/);
    expect(() => analyseMobileAdvanced({ ...base, dob: '2030-01-01' })).toThrow(/after the report date/);
  });

  it('verdict and advice bands', () => {
    expect([verdictOf(80), verdictOf(65), verdictOf(45), verdictOf(44)]).toEqual(['excellent', 'good', 'neutral', 'change']);
    expect([adviceOf(80), adviceOf(50), adviceOf(49)]).toEqual(['keep', 'keepRemedies', 'change']);
  });

  it('report HTML: cover + summary + 8 sections, each on a fresh page, ending with profile and CTA', () => {
    const r = analyseMobileAdvanced({ ...base, alternates: ['9123456789'] });
    const t = resolveTheme('royal-gold-maroon');
    for (const lang of ['en', 'hi'] as const) {
      const html = buildMobileReportHtml(r, t, DEFAULT_BRANDING, { lang, preparedBy: 'Acharya Nandram' }, { qrWhatsapp: '<svg></svg>', qrWebsite: '<svg></svg>' });
      expect(html.match(/<section class="page">/g)).toHaveLength(8);
      expect(html).toContain('class="prof"');
      expect(html).toContain('class="cta"');
      expect(html).toContain(L[lang].s8);
      expect(html).toContain(L[lang].compareH);
      const cover = buildMobileCoverHtml(r, t, DEFAULT_BRANDING, { lang, preparedBy: 'Acharya Nandram' });
      expect(cover).toContain('class="sc"');
      expect(cover).toContain('Rahul Sharma');
    }
    const masked = buildMobileCoverHtml(r, t, DEFAULT_BRANDING, { lang: 'en', preparedBy: 'X', showFullNumber: false });
    expect(masked).not.toContain('<i>7</i>');
    for (const c of r.checks) expect(checkText(c, L.en, 'en').title).not.toBe(c.id);
    expect(Object.values(subScores(r)).every((v) => v >= 0 && v <= 100)).toBe(true);
  });
});
