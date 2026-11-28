/** Baby Name report: best career path for the child from the baby's numbers. */
import { describe, expect, it } from 'vitest';
import { babyCareer, NUMBER_CAREER } from '@/lib/baby-name/career';
import { analyseBabyName } from '@/lib/baby-name/analysis';
import { buildBabyReportHtml } from '@/lib/baby-name/report';
import { DEFAULT_BRANDING, resolveTheme, type Branding } from '@/lib/pdf/themes';

describe('baby career path', () => {
  it('has complete English and Hindi guidance for every number', () => {
    for (let n = 1; n <= 9; n++) {
      const c = NUMBER_CAREER[n];
      expect(c.fields.length).toBeGreaterThanOrEqual(6);
      for (const x of [c.theme, c.talents, c.subjects, c.avoid, ...c.nurture, ...c.fields.map((f) => f.label)]) { expect(x.en.length).toBeGreaterThan(5); expect(x.hi).toMatch(/[ऀ-ॿ]/); }
    }
  });
  it('ranks fields by Bhagyank first and always shows Moolank and name-number fields', () => {
    const c = babyCareer({ moolank: 1, bhagyank: 3, nameNumber: 5, gridNumbers: [1, 2, 6, 8, 9], missing: [3, 4, 5, 7] });
    expect(c.fields).toHaveLength(7);
    expect(c.fields[0].label.en).toBe(NUMBER_CAREER[3].fields[0].label.en);
    expect(c.fields.some((f) => f.numbers.includes(1))).toBe(true);
    expect(c.fields.some((f) => f.numbers.includes(5))).toBe(true);
    expect(c.fields.every((f, i, a) => i === 0 || a[i - 1].score >= f.score)).toBe(true);
    expect(c.aptitudes.map((a) => a.en.split(':')[0])).toEqual(['Action plane (8-1-6)']);
    expect(c.build.map((b) => b.n)).toEqual([3, 4, 5, 7]);
    expect(c.nurture).toHaveLength(3);
  });
  it('fields supported by two numbers rank as a strong match', () => {
    const c = babyCareer({ moolank: 4, bhagyank: 7, gridNumbers: [], missing: [] }); // 4 and 7 share research and IT
    const shared = c.fields.filter((f) => f.numbers.length > 1);
    expect(shared.length).toBeGreaterThan(0);
    expect(shared[0].why.en).toMatch(/strong match/);
    expect(c.fields[0].numbers.length).toBe(2);
  });
  it('appears in the report in English and Hindi', () => {
    const r = analyseBabyName({ dob: '2026-10-01', gender: 'girl', surname: 'Gupta' });
    expect(r.career.primary).toBe(r.core.bhagyank.value);
    const theme = resolveTheme('royal-gold-maroon', DEFAULT_BRANDING as Branding);
    const en = buildBabyReportHtml(r, theme, DEFAULT_BRANDING as Branding, { lang: 'en' });
    const hi = buildBabyReportHtml(r, theme, DEFAULT_BRANDING as Branding, { lang: 'hi' });
    expect(en).toContain('Best career path for your child'); expect(en).toContain(r.career.fields[0].label.en.replace(/&/g, '&amp;'));
    expect(hi).toContain('बच्चे के लिए सर्वश्रेष्ठ करियर पथ'); expect(hi).toContain(r.career.fields[0].label.hi.replace(/&/g, '&amp;'));
  });
});
