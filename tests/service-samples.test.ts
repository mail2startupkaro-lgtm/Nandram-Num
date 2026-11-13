import { describe, expect, it } from 'vitest';
import { analyseCouple, analyseDob, analyseMobile, analyseName, analyseNameSystem } from '@/lib/numerology';
import { SAMPLE_NUMBERS as N, SERVICE_SAMPLES } from '@/lib/service-samples';
import { DEFAULT_SERVICES } from '@/lib/billing/services';
import { formatOfferEnd, liveOffer } from '@/lib/funnel/offer';
import { LeadInput, leadsCsv, miniReading } from '@/lib/funnel/leads';

const asOf = { day: 13, month: 11, year: 2026 };

describe('sample reports match the engine', () => {
  it('has one bilingual sample per default service, with locked sections', () => {
    for (const s of DEFAULT_SERVICES) {
      const x = SERVICE_SAMPLES.find((y) => y.code === s.code);
      expect(x, s.code).toBeTruthy();
      expect(x!.sections.length).toBeGreaterThan(x!.open);
      for (const sec of x!.sections) { expect(sec.h.hi).toBeTruthy(); expect(sec.p.hi.length).toBe(sec.p.en.length); }
    }
  });

  it('Riya – core numbers, Lo Shu, Kua, personal year and months', () => {
    const d = analyseDob({ dob: N.riya.dob, gender: N.riya.gender }, { asOf });
    expect([d.moolank.value, d.bhagyank.value, d.kua.value]).toEqual([N.riya.moolank, N.riya.bhagyank, N.riya.kua]);
    expect(d.loShu.missing).toEqual(N.riya.missing);
    expect(d.loShu.repeated.map((r: { number: number }) => r.number)).toEqual(N.riya.repeated);
    const grid = SERVICE_SAMPLES.find((s) => s.code === 'SVC_LOSHU')!.grid!;
    for (let n = 1; n <= 9; n++) expect(grid[n]).toBe(d.loShu.counts[n]);
    expect(d.kua.favourable.success).toBe('North-West');
    expect(d.loShu.arrowsOfStrength.map((a: { name: string }) => a.name)).toEqual(expect.arrayContaining(['Arrow of Intellect', 'Arrow of Determination']));
    const pc = d.personalCycles as unknown as { current: { personalYear: number; from: string }; detailed: { months: { month: number; year: number; personalMonth: number }[] }[] };
    expect(pc.current.personalYear).toBe(N.riya.personalYear);
    expect(pc.current.from).toBe('2026-08-14');
    for (const [m, y, pm] of N.months) expect(pc.detailed[0].months.find((x) => x.month === m && x.year === y)?.personalMonth).toBe(pm);
  });

  it('Riya – name and mobile', () => {
    const n = analyseName({ fullName: N.riya.name }, N.riya.moolank, N.riya.bhagyank);
    expect([n.chaldean.nameNumber.compound, n.chaldean.nameNumber.single, n.compatibilityScore]).toEqual([N.riya.nameCompound, N.riya.nameSingle, N.riya.nameScore]);
    const m = analyseMobile(N.riya.mobile, { moolank: N.riya.moolank, bhagyank: N.riya.bhagyank, missingNumbers: N.riya.missing });
    expect([m.total.compound, m.total.single, m.score, m.relationWithBhagyank]).toEqual([N.riya.mobileCompound, N.riya.mobileSingle, N.riya.mobileScore, 'enemy']);
    expect(m.conflictPairs).toEqual(['98', '87', '43']);
    expect(m.suggestion.idealTotals).toEqual([1, 3, 5, 6, 7]);
  });

  it('Rahul – name correction', () => {
    const d = analyseDob({ dob: N.rahul.dob, gender: 'male' }, { asOf });
    expect([d.moolank.value, d.bhagyank.value]).toEqual([N.rahul.moolank, N.rahul.bhagyank]);
    const n = analyseName({ fullName: N.rahul.name }, N.rahul.moolank, N.rahul.bhagyank);
    expect([n.chaldean.nameNumber.compound, n.chaldean.nameNumber.single, n.compatibilityScore]).toEqual([N.rahul.nameCompound, N.rahul.nameSingle, N.rahul.nameScore]);
    for (const f of N.rahul.fixes) {
      const x = analyseName({ fullName: f.name }, N.rahul.moolank, N.rahul.bhagyank);
      expect([x.chaldean.nameNumber.compound, x.chaldean.nameNumber.single, x.compatibilityScore], f.name).toEqual([f.compound, f.single, f.score]);
    }
  });

  it('baby names, couple and business names', () => {
    const b = analyseDob({ dob: N.baby.dob, gender: 'female' }, { asOf });
    expect([b.moolank.value, b.bhagyank.value]).toEqual([N.baby.moolank, N.baby.bhagyank]);
    for (const x of N.baby.names) { const r = analyseName({ fullName: x.name }, N.baby.moolank, N.baby.bhagyank); expect([r.chaldean.nameNumber.compound, r.chaldean.nameNumber.single, r.compatibilityScore], x.name).toEqual([x.compound, x.single, x.score]); }
    const c = analyseCouple({ name: N.riya.name, gender: 'female', dob: N.riya.dob }, { name: N.couple.partner.name, gender: N.couple.partner.gender, dob: N.couple.partner.dob }, { asOf });
    expect(c.overall).toBe(N.couple.overall);
    expect(c.areaScores).toMatchObject(N.couple.areas);
    expect([c.partnerB.moolank, c.partnerB.bhagyank, c.partnerB.nameNumber]).toEqual([N.couple.partner.moolank, N.couple.partner.bhagyank, N.couple.partner.nameSingle]);
    expect(c.combinedGrid.bothMissing).toEqual(N.couple.bothMissing);
    expect(c.marriage.auspiciousYears[0].year).toBe(N.couple.bestYear);
    for (const x of N.business) {
      const r = analyseNameSystem(x.name, 'chaldean').nameNumber; expect([r.compound, r.single], x.name).toEqual([x.compound, x.single]);
      if (x.score !== null) expect(analyseName({ fullName: x.name }, N.riya.moolank, N.riya.bhagyank).compatibilityScore).toBe(x.score);
    }
  });
});

describe('limited-time offer', () => {
  const base = { enabled: true, endsAt: '2026-11-30T18:29:00.000Z', labelEn: 'Diwali offer', labelHi: '' };
  it('is live only while enabled and before the real end date', () => {
    expect(liveOffer(base, new Date('2026-11-20T00:00:00Z'))?.label).toEqual({ en: 'Diwali offer', hi: 'सीमित समय का ऑफ़र' });
    expect(liveOffer(base, new Date('2026-11-30T18:29:00Z'))).toBeNull();
    expect(liveOffer({ ...base, enabled: false }, new Date('2026-11-20T00:00:00Z'))).toBeNull();
    expect(liveOffer({ ...base, endsAt: 'nope' })).toBeNull();
    expect(liveOffer({ ...base, endsAt: '' })).toBeNull();
  });
  it('formats the end in IST', () => { expect(formatOfferEnd(base.endsAt)).toMatch(/30 Nov 2026.*11:59.*IST/i); });
});

describe('funnel leads', () => {
  const ok = { name: 'Riya Sharma', phone: '98765 43210', dob: '1992-08-14', consent: true };
  it('validates the form and computes the mini-reading', () => {
    expect(LeadInput.parse(ok).magnet).toBe('mini-reading');
    expect(() => LeadInput.parse({ ...ok, consent: false })).toThrow();
    expect(() => LeadInput.parse({ ...ok, phone: '12345' })).toThrow();
    expect(() => LeadInput.parse({ ...ok, dob: '2099-01-01' })).toThrow();
    expect(() => LeadInput.parse({ ...ok, dob: '1992-02-30' })).toThrow();
    expect(() => LeadInput.parse({ ...ok, service: 'DROP TABLE' })).toThrow();
    expect(LeadInput.parse({ ...ok, phone: '+1 555 123 4567' }).phone).toBeTruthy();
    expect(miniReading('1992-08-14')).toEqual({ moolank: 5, bhagyank: 7 });
  });
  it('exports CSV that Excel will not execute', () => {
    const csv = leadsCsv([{ id: '1', createdAt: new Date('2026-11-13T00:00:00Z'), name: '=HYPERLINK("x")', phone: '+919876543210', dob: '1992-08-14', moolank: 5, bhagyank: 7, service: null, magnet: 'mini-reading', language: 'en', source: 'services-funnel', utmSource: 'facebook', utmMedium: null, utmCampaign: null, stage: 'lead' }]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"+919876543210"');
  });
});

describe.skipIf(!process.env.TEST_DATABASE_URL)('funnel leads (database)', () => {
  it('stores the lead with consent and lists it', async () => {
    const { Pool } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    const schema = await import('@/lib/db/schema');
    const { createLead, listLeads } = await import('@/lib/funnel/leads');
    const { eq } = await import('drizzle-orm');
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const db = drizzle(pool, { schema }) as unknown as import('@/lib/db/client').Db;
    await migrate(db as never, { migrationsFolder: 'drizzle' });
    const r = await createLead(LeadInput.parse({ name: 'Lead Test', phone: '9876543210', dob: '1992-08-14', consent: true, service: 'SVC_LOSHU', magnet: 'sample-report', utmSource: 'instagram' }), { ip: '1.2.3.4' }, db);
    expect([r.moolank, r.bhagyank]).toEqual([5, 7]);
    const rows = await listLeads({}, db);
    const mine = rows.find((x) => x.id === r.id)!;
    expect(mine).toMatchObject({ phone: '+919876543210', magnet: 'sample-report:SVC_LOSHU', utmSource: 'instagram', moolank: 5 });
    const consents = await db.select().from(schema.marketingConsents).where(eq(schema.marketingConsents.leadId, r.id));
    expect(consents[0]).toMatchObject({ channel: 'whatsapp', status: 'opted_in' });
    expect(mine.dob).toBe('1992-08-14');
    // the same phone again updates the lead instead of failing on the unique phone index
    const again = await createLead(LeadInput.parse({ name: 'Lead Test Two', phone: '+91 98765 43210', dob: '1990-01-03', consent: true }), {}, db);
    expect(again.id).toBe(r.id);
    expect((await listLeads({}, db)).filter((x) => x.phone === '+919876543210')).toHaveLength(1);
    expect((await db.select().from(schema.marketingConsents).where(eq(schema.marketingConsents.leadId, r.id)))).toHaveLength(2);
    await pool.end();
  });
});
