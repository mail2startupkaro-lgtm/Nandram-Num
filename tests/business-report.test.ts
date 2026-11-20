import { describe, expect, it } from 'vitest';
import { analyseCompleteBusiness, businessYear, nameCorrections, parsePartners, splitNames, writeCompleteBusiness } from '@/lib/business/complete';
import { DEFAULT_SERVICES, INTAKE_FIELDS, parseIntake } from '@/lib/billing/services';
import { STANDARD_USD } from '@/lib/billing/currency';
import { servicePageByCode } from '@/lib/service-pages';
import { cleanIntake, missingIntake } from '@/lib/reading/intake';
import type { Service } from '@/lib/db/schema';

const asOf = { year: 2026, month: 11, day: 13 };
const input = { owner: { name: 'Riya Sharma', dob: '1992-08-14', gender: 'female' as const }, names: ['Riya Interiors', 'Sharma Interiors'], businessType: 'interior design', launchDate: '2024-04-10', partners: [{ name: 'Arjun Mehta', dob: '1990-01-03' }], asOf };

describe('Complete Business Numerology Report', () => {
  const d = analyseCompleteBusiness(input);
  it('scores names, partner, growth cycle (matches the sample on the service page)', () => {
    expect(d.owner.moolank).toBe(5); expect(d.owner.bhagyank).toBe(7);
    expect(d.names.map((n) => [n.text, n.compound, n.single, n.score])).toEqual([['RIYA INTERIORS', 35, 8, 36], ['SHARMA INTERIORS', 46, 1, 96]]);
    expect(d.best.text).toBe('SHARMA INTERIORS');
    expect(d.corrections.base.text).toBe('RIYA INTERIORS');
    expect(d.corrections.options[0]).toMatchObject({ text: 'RIYA INTERRIORS', compound: 37, single: 1, score: 96 });
    expect(d.partners[0]).toMatchObject({ moolank: 3, bhagyank: 5, harmony: 70, score: 78 });
    expect(d.years.slice(0, 3).map((y) => [y.year, y.biz, y.owner, y.score])).toEqual([[2026, 6, 5, 72], [2027, 7, 6, 50], [2028, 8, 7, 71]]);
    expect(d.overall).toBe(84);
    expect(d.item?.numbers).toEqual([6, 4, 3]);
  });
  it('business year follows the anniversary rule', () => {
    expect(businessYear({ year: 2024, month: 4, day: 10 }, 2026)).toBe(6);
    expect(businessYear({ year: 2020, month: 12, day: 29 }, 2027)).toBe(7); // 2+9 + 1+2 + 2+0+2+7 = 25 → 7
  });
  it('corrections only suggest better, readable spellings', () => {
    const c = nameCorrections('Riya Interiors', 7, 5, [6, 4, 3]);
    expect(c.options.length).toBeGreaterThan(2);
    for (const o of c.options) { expect(o.score).toBeGreaterThan(c.base.score); expect(o.category).not.toBe('unfavourable'); }
    expect(new Set(c.options.map((o) => o.how.en)).size).toBe(c.options.length);
  });
  it('writes all six requested parts in English and Hindi', () => {
    for (const lang of ['en', 'hi'] as const) {
      const w = writeCompleteBusiness(d, lang);
      expect(w.sections.map((s) => s.id)).toEqual(['overview', 'ceo', 'names', 'correction', 'brand', 'partners', 'growth', 'remedies']);
      for (const s of w.sections) expect(s.blocks.length).toBeGreaterThan(0);
    }
    expect(writeCompleteBusiness(d, 'en').sections.map((s) => s.title)).toEqual(expect.arrayContaining(['CEO Numerology Report', 'Business Name Analysis', 'Business Name Correction', 'Brand & Logo Numerology', 'Business Partner Compatibility', 'Business Growth Cycle Forecast']));
  });
  it('works without partners, opening date or business type', () => {
    const x = analyseCompleteBusiness({ owner: input.owner, names: ['Nest Studio'], asOf });
    expect(x.partners).toEqual([]); expect(x.launch).toBeNull(); expect(x.years[0].biz).toBeNull();
    expect(writeCompleteBusiness(x, 'hi').sections.find((s) => s.id === 'partners')!.blocks).toHaveLength(1);
  });
  it('parses booking text', () => {
    expect(parsePartners('Arjun Mehta – 03-01-1990\nKavita Rao, 1985-06-21\nno date here')).toEqual([{ name: 'Arjun Mehta', dob: '1990-01-03' }, { name: 'Kavita Rao', dob: '1985-06-21' }]);
    expect(splitNames('Sharma Interiors, Nest Studio\nशर्मा\n\nRiya Decor')).toEqual(['Sharma Interiors', 'Nest Studio', 'Riya Decor']);
  });
});

describe('Complete Business report service', () => {
  const svc = DEFAULT_SERVICES.find((s) => s.code === 'SVC_BUSINESS_COMPLETE')!;
  it('is a default service with intake, $ price and a service page', () => {
    expect(svc).toBeTruthy();
    for (const k of svc.intake) expect(INTAKE_FIELDS).toContain(k);
    expect(STANDARD_USD.SVC_BUSINESS_COMPLETE).toBeTruthy();
    expect(servicePageByCode('SVC_BUSINESS_COMPLETE')?.slug).toBe('business-numerology-report');
    expect(svc.en.short).toMatch(/business name selection, brand name correction, startup dates, partnership compatibility and entrepreneur numerology/);
  });
  it('validates booking details; business name is required, the rest optional', () => {
    const s = { ...svc, active: true } as unknown as Service;
    expect(missingIntake(svc.intake, { clientName: 'Riya Sharma', dob: '1992-08-14', gender: 'female' })).toEqual(['businessName']);
    const ok = parseIntake(s, cleanIntake(svc.intake, { clientName: 'Riya Sharma', dob: '1992-08-14', gender: 'female', businessName: 'Sharma Interiors', launchDate: '2027-01-10', partners: 'Arjun – 03-01-1990' }));
    expect(ok.launchDate).toBe('2027-01-10'); expect(ok.businessName).toBe('Sharma Interiors');
    expect(() => parseIntake(s, { clientName: 'Riya Sharma', dob: '1992-08-14', gender: 'female' })).toThrow();
  });
});
