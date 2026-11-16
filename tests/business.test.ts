import { describe, expect, it } from 'vitest';
import { BUSINESSES, BUSINESS_COUNT, ITEMS, ITEM_BY_ID, SECTORS } from '@/lib/business/catalogue';
import { CATEGORY_GROUPS } from '@/lib/business/categories';
import { businessAnalytics, verdictOf } from '@/lib/business/engine';
import { ruleReport, dataText } from '@/lib/business/agent';
import { DEFAULT_SERVICES } from '@/lib/billing/services';
import { servicePageByCode } from '@/lib/service-pages';

const asOf = { day: 16, month: 11, year: 2026 };
const run = (over: Partial<Parameters<typeof businessAnalytics>[0]> = {}) => businessAnalytics({ fullName: 'Rahul Verma', dob: { year: 1988, month: 11, day: 26 }, gender: 'male', birthPlace: 'Delhi', mode: 'both', capital: 2, risk: 'medium', interests: [], asOf, ...over });

describe('business catalogue', () => {
  it('covers 1000+ unique business categories across every sector', () => {
    expect(BUSINESS_COUNT).toBeGreaterThanOrEqual(1000);
    expect(new Set(ITEMS.map((x) => x.id)).size).toBe(ITEMS.length);
    expect(new Set(BUSINESSES.map((x) => x.label.toLowerCase())).size).toBe(BUSINESSES.length);
    for (const s of SECTORS) expect(BUSINESSES.filter((b) => b.sector === s).length, s).toBeGreaterThanOrEqual(30);
    for (const gr of CATEGORY_GROUPS) expect(SECTORS as readonly string[]).toContain(gr.sector);
  });
  it('every category has 1–3 valid numbers, a capital level and a clean label', () => {
    for (const b of BUSINESSES) {
      expect(b.numbers.length, b.label).toBeGreaterThanOrEqual(1);
      expect(b.numbers.length).toBeLessThanOrEqual(3);
      for (const n of b.numbers) { expect(n).toBeGreaterThanOrEqual(1); expect(n).toBeLessThanOrEqual(9); }
      expect(new Set(b.numbers).size, b.label).toBe(b.numbers.length);
      expect([1, 2, 3]).toContain(b.capital);
      expect(b.label).not.toMatch(/[#@;]|\s{2}/);
      expect(b.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});

describe('business engine', () => {
  it('ranks every category, deterministically, with scores 5–97', () => {
    const a = run(); const b = run();
    expect(a.all.length).toBe(ITEMS.length);
    expect(a.totals.analysed).toBe(ITEMS.length);
    expect(a.all.map((x) => x.id)).toEqual(b.all.map((x) => x.id));
    for (let i = 1; i < a.all.length; i++) expect(a.all[i - 1].score).toBeGreaterThanOrEqual(a.all[i].score);
    for (const x of a.all) { expect(x.score).toBeGreaterThanOrEqual(5); expect(x.score).toBeLessThanOrEqual(97); }
    expect(a.top.length).toBe(12);
    expect(a.groupScores.length).toBe(new Set(ITEMS.map((x) => x.group)).size);
    expect(a.bestBySector.every((s) => s.items.length > 0)).toBe(true);
  });
  it('gives the shortlist its own verdict and rank', () => {
    const a = run({ shortlist: ['petrol-pump', 'cafe', 'petrol-pump', 'not-a-real-id'] });
    expect(a.checked.map((x) => x.id)).toEqual(['petrol-pump', 'cafe']);
    for (const c of a.checked) { expect(a.all[c.rank - 1].id).toBe(c.id); expect(c.verdict).toEqual(verdictOf(c.score)); }
  });
  it('respects mode, capital and risk', () => {
    expect(run({ mode: 'business' }).all.every((x) => x.kind === 'business')).toBe(true);
    expect(run({ mode: 'profession' }).all.every((x) => x.kind === 'profession')).toBe(true);
    const lo = run({ capital: 1, risk: 'low' }), hi = run({ capital: 3, risk: 'high' });
    const id = BUSINESSES.find((b) => b.capital === 3)!.id;
    expect(lo.all.find((x) => x.id === id)!.score).toBeLessThan(hi.all.find((x) => x.id === id)!.score);
  });
  it('verdict bands', () => {
    expect([verdictOf(80).key, verdictOf(62).key, verdictOf(50).key, verdictOf(20).key]).toEqual(['excellent', 'good', 'moderate', 'weak']);
  });
  it('rule-based report covers the shortlist and only recommends ranked items', () => {
    const a = run({ shortlist: ['cafe'] });
    const ctx = { fullName: 'Rahul Verma', dobText: '1988-11-26', birthPlace: 'Delhi', mode: 'business or profession', capitalLabel: 'Medium', risk: 'medium', interests: [], language: 'en' as const };
    const r = ruleReport(ctx, a);
    expect(r.shortlistAdvice).toContain('Café');
    for (const p of r.topPicks) expect(ITEM_BY_ID.has(p.id)).toBe(true);
    expect(dataText(ctx, a)).toContain('CLIENT SHORTLIST');
  });
});

describe('business compatibility service', () => {
  it('is a default service with its own landing page and business intake', () => {
    const s = DEFAULT_SERVICES.find((x) => x.code === 'SVC_BUSINESS_COMPAT')!;
    expect(s).toBeTruthy();
    expect(s.intake).toEqual(expect.arrayContaining(['clientName', 'dob', 'businesses']));
    expect(servicePageByCode('SVC_BUSINESS_COMPAT')!.slug).toBe('business-compatibility-numerology');
  });
  it('keeps the "businesses considering" intake field (optional)', async () => {
    const { parseIntake } = await import('@/lib/billing/services');
    const svc = { ...DEFAULT_SERVICES.find((x) => x.code === 'SVC_BUSINESS_COMPAT')!, active: true } as Parameters<typeof parseIntake>[0];
    expect(parseIntake(svc, { clientName: 'Riya Sharma', dob: '1992-08-14', gender: 'female', businesses: 'café, boutique' })).toMatchObject({ businesses: 'café, boutique' });
    expect(parseIntake(svc, { clientName: 'Riya Sharma', dob: '1992-08-14', gender: 'female' }).businesses).toBeUndefined();
  });
});

describe('free-text matching from the booking form', () => {
  it('maps common phrases and keeps unmatched text', async () => {
    const { matchCategories } = await import('@/lib/business/match');
    const r = matchCategories('cafe, cloth shop and CA practice / petrol pump; medical store aur bakery, xyz widgets');
    expect(r.ids).toEqual(['cafe', 'fabric-and-cloth-shop', 'ca-practice', 'petrol-pump', 'medical-store-chemist', 'bakery-and-cake-shop']);
    expect(r.unmatched).toEqual(['xyz widgets']);
  });
});
