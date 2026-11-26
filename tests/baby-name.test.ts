import { describe, expect, it } from 'vitest';
import { analyseBabyName, letterClass } from '@/lib/baby-name/analysis';
import { buildBabyCoverHtml, buildBabyReportHtml } from '@/lib/baby-name/report';
import { NAME_BANK, parseLetters, startsWithAny } from '@/lib/baby-name/names';
import { DEFAULT_BRANDING, resolveTheme } from '@/lib/pdf/themes';

// Hand-checked: 14-10-2026 → Moolank 1+4 = 5, Bhagyank 1+4+1+0+2+0+2+6 = 16 → 7.
// Chaldean: ABHINAV = 1+2+5+1+5+1+6 = 21 → 3; SHARMA = 3+5+1+2+4+1 = 16; ABHINAV SHARMA = 37 → 1 (friend of 7).
const base = { dob: '2026-10-14', gender: 'boy' as const, surname: 'Sharma', fatherName: 'Rahul Sharma', motherName: 'Priya Sharma', letters: 'A, Sh', candidates: ['Aarav', 'Shaurya', 'Vivaan'], asOf: '2026-11-26' };

describe('baby name analysis', () => {
  const r = analyseBabyName(base);
  it('birth numbers and lucky totals', () => {
    expect(r.core.moolank.value).toBe(5);
    expect(r.core.bhagyank.value).toBe(7);
    expect(r.lucky.singles).toEqual([1, 7]); // friends of 7 = 1,2,4,7; 2 is against Moolank 5; 4 is heavy
    expect(r.grid.missing).toEqual([3, 8, 9]);
  });
  it('scores names with the Chaldean chart', () => {
    const a = r.ranked.find((x) => x.first === 'Abhinav')!;
    expect(a.firstNum).toMatchObject({ compound: 21, single: 3 });
    expect(a.fullNum).toMatchObject({ compound: 37, single: 1 });
    expect(a.relB).toBe('friend');
    expect(a.fillsMissing).toBe(true);
    const aarav = r.family.find((x) => x.first === 'Aarav')!;
    expect(aarav.fullNum).toMatchObject({ compound: 27, single: 9 }); // 9 is against Bhagyank 7
    expect(aarav.score).toBeLessThanOrEqual(55);
    expect(aarav.tweaks.every((t) => t.score > aarav.score)).toBe(true);
  });
  it('ranks names in the preferred letters first and keeps family names', () => {
    expect(r.family.map((x) => x.first)).toEqual(['Aarav', 'Shaurya', 'Vivaan']);
    expect(r.top).toHaveLength(3);
    expect(r.top.every((x) => x.score >= 65 && startsWithAny(x.first, ['A', 'SH']))).toBe(true);
    const band = (x: (typeof r.ranked)[number]) => (x.score >= 65 && (x.source === 'family' || x.matchesLetters) ? 0 : 1);
    for (let i = 1; i < r.ranked.length; i++) {
      expect(band(r.ranked[i - 1])).toBeLessThanOrEqual(band(r.ranked[i]));
      if (band(r.ranked[i - 1]) === band(r.ranked[i])) expect(r.ranked[i - 1].score).toBeGreaterThanOrEqual(r.ranked[i].score);
    }
  });
  it('letters and ceremony dates', () => {
    expect(letterClass(1, 5, 7)).toBe('lucky'); // A
    expect(letterClass(2, 5, 7)).toBe('avoid'); // B – 2 is against Moolank 5
    expect(r.ceremony.length).toBeGreaterThan(0);
    expect(r.ceremony[0].iso >= '2026-11-26').toBe(true);
    expect(r.ceremony.every((d) => [1, 7].includes(d.dateNumber))).toBe(true);
  });
  it('works without surname, parents or candidates', () => {
    const x = analyseBabyName({ dob: '2025-03-09', gender: 'girl', asOf: '2026-01-01' });
    expect(x.family).toHaveLength(0);
    expect(x.ranked.every((e) => e.fullNum === null && e.parts.family === null)).toBe(true);
    expect(x.suggestions.every((e) => e.bank && e.bank.g !== 'b')).toBe(true);
  });
  it('rejects an empty request', () => {
    expect(() => analyseBabyName({ dob: '2025-03-09', suggest: false })).toThrow();
  });
  it('report HTML: cover, fresh-page sections, CTA', () => {
    const t = resolveTheme('royal-gold-maroon');
    for (const lang of ['en', 'hi'] as const) {
      const html = buildBabyReportHtml(r, t, DEFAULT_BRANDING, { lang, preparedBy: 'Acharya Nandram' });
      expect((html.match(/<section class="page">/g) ?? []).length).toBe(9);
      expect(html).toContain('class="cta"');
      const cover = buildBabyCoverHtml(r, t, DEFAULT_BRANDING, { lang, preparedBy: 'Acharya Nandram' });
      expect(cover).toContain(r.top[0].full);
    }
  });
});

describe('name bank', () => {
  it('has unique, valid entries', () => {
    expect(NAME_BANK.length).toBeGreaterThan(180);
    expect(new Set(NAME_BANK.map((x) => x.n)).size).toBe(NAME_BANK.length);
    expect(NAME_BANK.every((x) => /^[A-Z][a-z]+$/.test(x.n) && x.hi && x.en && x.hm)).toBe(true);
  });
  it('parses letters', () => {
    expect(parseLetters('a, Sh / k;  a')).toEqual(['A', 'SH', 'K']);
  });
});
