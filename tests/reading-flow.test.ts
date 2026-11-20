/** "Get your reading" flow: reading type → details → account → payment; saved family members; report covers. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq, sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/db/client';
import { cleanIntake, intakeToPerson, missingIntake, personToIntake, toIsoDate } from '@/lib/reading/intake';
import { coverDocument, coverInner } from '@/lib/pdf/cover';
import { DEFAULT_BRANDING, THEMES, type Branding } from '@/lib/pdf/themes';
import { upsertVerifiedUser } from '@/lib/auth/otp';
import { FAMILY_LIMIT, findSamePerson, listPeople, savePerson, FamilyLimitError } from '@/lib/db/repo/people';
import { CheckoutError, createCheckout } from '@/lib/billing/checkout';
import { listServiceOrders, getService, saveService } from '@/lib/billing/services';
import { buildSignatureCoverHtml } from '@/lib/signature/report';

const URL = process.env.TEST_DATABASE_URL;
const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('booking details ↔ saved person', () => {
  const asha = { id: 'p1', relation: 'self' as const, fullName: 'Asha Rao', gender: 'female' as const, dob: '12-03-1988', timeOfBirth: '06:30', placeOfBirth: 'Pune', mobile: '9876543210', signedName: 'A. Rao' };

  it('converts DD-MM-YYYY to the date-input format', () => {
    expect(toIsoDate('12-03-1988')).toBe('1988-03-12');
    expect(toIsoDate('1988-03-12')).toBe('1988-03-12');
    expect(toIsoDate('2/7/2001')).toBe('2001-07-02');
    expect(toIsoDate('')).toBe('');
  });

  it('pre-fills only the boxes each reading asks for', () => {
    expect(personToIntake('SVC_PERSONAL_REPORT', ['clientName', 'dob', 'gender', 'tob', 'pob', 'mobile', 'questions'], asha))
      .toEqual({ clientName: 'Asha Rao', dob: '1988-03-12', gender: 'female', tob: '06:30', pob: 'Pune', mobile: '9876543210' });
    expect(personToIntake('SVC_SIGNATURE', ['clientName', 'dob', 'gender', 'currentName', 'questions'], asha).currentName).toBe('A. Rao');
    expect(personToIntake('SVC_NAME_CORRECTION', ['currentName', 'dob', 'gender', 'mobile', 'questions'], asha).currentName).toBe('Asha Rao');
    expect(personToIntake('SVC_BUSINESS_NAME', ['clientName', 'dob', 'gender', 'currentName', 'questions'], asha).currentName).toBeUndefined(); // business names, not hers
    const ravi = { relation: 'spouse' as const, fullName: 'Ravi Rao', gender: 'male' as const, dob: '1985-01-20' };
    expect(personToIntake('SVC_COUPLE', ['clientName', 'dob', 'gender', 'partnerName', 'partnerDob', 'questions'], asha, ravi)).toMatchObject({ partnerName: 'Ravi Rao', partnerDob: '1985-01-20' });
    expect(personToIntake('SVC_LOSHU', ['clientName', 'dob'], null)).toEqual({});
  });

  it('turns booking details into the person to save', () => {
    expect(intakeToPerson('SVC_SIGNATURE', { clientName: 'Asha Rao', dob: '1988-03-12', gender: 'female', currentName: 'A. Rao' }, 'self'))
      .toEqual({ relation: 'self', fullName: 'Asha Rao', gender: 'female', dob: '1988-03-12', signedName: 'A. Rao' });
    expect(intakeToPerson('SVC_NAME_CORRECTION', { currentName: 'Asha Rao', dob: '1988-03-12', gender: 'female' }, 'self')?.fullName).toBe('Asha Rao');
    expect(intakeToPerson('SVC_BABY_NAME', { dob: '2026-03-21', gender: 'female', parents: 'Ravi & Asha' }, 'daughter', {}, 'Baby')).toMatchObject({ fullName: 'Baby', relation: 'daughter', dob: '2026-03-21' });
    expect(intakeToPerson('SVC_COUPLE', { clientName: 'Asha Rao', dob: '1988-03-12', gender: 'female', partnerName: 'Ravi Rao', partnerDob: '1985-01-20' }, 'self')?.partner).toEqual({ name: 'Ravi Rao', gender: 'male', dob: '1985-01-20' });
    expect(intakeToPerson('SVC_LOSHU', { clientName: 'आशा', dob: '1988-03-12' }, 'self')).toBeNull(); // must be in English letters
    expect(intakeToPerson('SVC_LOSHU', { clientName: 'Asha', dob: '' }, 'self')).toBeNull();
  });

  it('knows which required boxes are empty and sends only the asked boxes', () => {
    expect(missingIntake(['clientName', 'dob', 'gender', 'questions'], { clientName: 'Asha', gender: 'female' })).toEqual(['dob']);
    expect(missingIntake(['clientName', 'dob', 'questions'], { clientName: 'Asha', dob: '1988-03-12' })).toEqual([]);
    expect(cleanIntake(['clientName', 'questions'], { clientName: ' Asha ', questions: '  ', dob: '1988-03-12' })).toEqual({ clientName: 'Asha' });
  });
});

describe('report cover page', () => {
  const t = THEMES['royal-gold-maroon']; const b = DEFAULT_BRANDING as Branding;
  it('prints title, client, facts and expert, and escapes input', () => {
    const html = coverInner({ title: 'Business Compatibility Report', clientName: '<b>asha rao</b>', facts: [['Date of birth', '12-03-1988'], ['Empty', '']], lang: 'en', theme: t, branding: b });
    expect(html).toContain('Business Compatibility Report');
    expect(html).toContain('&lt;b&gt;asha Rao&lt;/b&gt;');
    expect(html).not.toContain('<b>asha');
    expect(html).toContain('Date of birth');
    expect(html).not.toContain('>Empty<');
    expect(html).toContain('Prepared for');
  });
  it('accepts only data: images on the cover', () => {
    expect(coverInner({ title: 'X', clientName: 'A', facts: [], imageDataUrl: 'https://evil.example/x.png', lang: 'en', theme: t, branding: b })).not.toContain('evil.example');
    expect(coverInner({ title: 'X', clientName: 'A', facts: [], imageDataUrl: PNG_1PX, lang: 'en', theme: t, branding: b })).toContain('data:image/png');
  });
  it('is a full A4 page with zero margins, in Hindi too', () => {
    const doc = coverDocument({ title: 'हस्ताक्षर विश्लेषण', clientName: 'Asha', facts: [], lang: 'hi', theme: t, branding: b });
    expect(doc).toContain('@page{size:A4;margin:0}');
    expect(doc).toContain('के लिए तैयार');
    expect(doc).toContain('lang="hi"');
  });
  it('signature report cover shows the client, date of birth and signature', () => {
    const html = buildSignatureCoverHtml({ client: { fullName: 'Rahul Sharma', dob: '1990-08-28', profession: 'Business', goals: [], language: 'en' }, preparedBy: 'Acharya Nandram', generatedAt: '2026-11-20T10:00:00+05:30', annotated: PNG_1PX } as never, t, b);
    expect(html).toContain('Rahul Sharma');
    expect(html).toContain('28-08-1990');
    expect(html).toContain('data:image/png');
    expect(html).toContain('Acharya Nandram');
  });
});

describe.skipIf(!URL)('database-backed: saved people and paid readings', () => {
  let pool: Pool; let db: Db;
  beforeAll(async () => {
    pool = new Pool({ connectionString: URL });
    db = drizzle(pool, { schema });
    await db.execute(sql`drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;`);
    await migrate(db, { migrationsFolder: 'drizzle' });
  });
  afterAll(async () => { await pool?.end(); });

  it('saves self and family members, keeps extra fields on update, finds repeats, enforces the limit', async () => {
    const u = await upsertVerifiedUser({ email: 'family@example.com' }, 'Asha', db);
    const me = await savePerson(u.id, { relation: 'self', fullName: 'Asha Rao', gender: 'female', dob: '1988-03-12', mobile: '9876543210' }, undefined, db);
    const son = await savePerson(u.id, { relation: 'son', fullName: 'Kabir Rao', gender: 'male', dob: '2015-06-01' }, undefined, db);
    await savePerson(u.id, { relation: 'spouse', fullName: 'Ravi Rao', gender: 'male', dob: '1985-01-20' }, undefined, db);
    const list = await listPeople(u.id, db);
    expect(list.map((p) => p.relation)).toEqual(['self', 'spouse', 'son']); // self first
    const upd = await savePerson(u.id, { relation: 'self', fullName: 'Asha Rao', gender: 'female', dob: '1988-03-12', signedName: 'A. Rao' }, me.id, db);
    expect(upd.signedName).toBe('A. Rao');
    expect(upd.mobile).toBe('9876543210'); // kept
    expect(findSamePerson(await listPeople(u.id, db), 'ASHA  rao', '1988-03-12')?.id).toBe(me.id);
    expect(son.id).not.toBe(me.id);
    const other = await upsertVerifiedUser({ email: 'other@example.com' }, 'Other', db);
    expect(await listPeople(other.id, db)).toEqual([]); // scoped to the owner
    await expect(savePerson(other.id, { relation: 'self', fullName: 'X', gender: 'male', dob: '1990-01-01' }, me.id, db)).rejects.toThrow(); // not theirs
    for (let i = 0; i < FAMILY_LIMIT - 3; i++) await savePerson(u.id, { relation: 'relative', fullName: `Relative ${String.fromCharCode(65 + i)}`, gender: 'male', dob: '1970-01-01' }, undefined, db);
    await expect(savePerson(u.id, { relation: 'friend', fullName: 'One More', gender: 'male', dob: '1970-01-01' }, undefined, db)).rejects.toBeInstanceOf(FamilyLimitError);
  });

  it('links a paid reading to the saved person and refuses someone else\'s person', async () => {
    const u = await upsertVerifiedUser({ email: 'buyer2@example.com', phone: '+919812345678' }, 'Buyer', db);
    const kid = await savePerson(u.id, { relation: 'daughter', fullName: 'Meera Rao', gender: 'female', dob: '2012-02-02' }, undefined, db);
    const svc = (await getService('SVC_LOSHU', db))!;
    await saveService({ ...svc, mrpPaise: svc.mrpPaise ?? null, usdCents: null, usdMrpCents: null, priceConfirmed: true }, db);
    const o = await createCheckout(u, { planCode: 'SVC_LOSHU', billingState: 'Rajasthan', intake: { clientName: 'Meera Rao', dob: '2012-02-02', gender: 'female' }, profileId: kid.id }, {}, db);
    expect(o.mock).toBe(true);
    const [order] = await listServiceOrders({ userId: u.id, status: 'all' }, db);
    expect(order.details).toMatchObject({ clientName: 'Meera Rao', forProfileId: kid.id, forRelation: 'daughter' });
    const stranger = await upsertVerifiedUser({ email: 'stranger@example.com', phone: '+919811111111' }, 'S', db);
    await expect(createCheckout(stranger, { planCode: 'SVC_LOSHU', billingState: 'Rajasthan', intake: { clientName: 'Meera Rao', dob: '2012-02-02', gender: 'female' }, profileId: kid.id }, {}, db))
      .rejects.toMatchObject({ code: 'PERSON_NOT_FOUND' });
    expect(CheckoutError).toBeDefined();
    const rows = await db.select().from(schema.serviceOrders).where(eq(schema.serviceOrders.userId, stranger.id));
    expect(rows).toHaveLength(0);
  });
});

describe('client-facing text never mentions AI tools', () => {
  it('scrubs self-references from signature / business text but keeps codes', async () => {
    const { scrubText, scrubDeep } = await import('@/lib/narrative/filter');
    expect(scrubText('As an AI language model, your signature shows drive.')).toBe('Your signature shows drive.');
    expect(scrubText('This was generated by AI for you.')).not.toMatch(/\bAI\b/);
    expect(scrubDeep({ id: 'cafe', why: 'Furthermore, it suits you.' })).toEqual({ id: 'cafe', why: 'It suits you.' });
  });
  it('signature report pages carry no AI wording (EN + HI)', async () => {
    const { buildSignatureReportHtml } = await import('@/lib/signature/report');
    const { signatureNumbers } = await import('@/lib/signature/numbers');
    const { effectiveFeatures, engineScores, ruleBasedAnalysis } = await import('@/lib/signature/agent');
    const { parseDate } = await import('@/lib/numerology');
    const n = signatureNumbers({ fullName: 'Rahul Kumar Sharma', dob: parseDate('28-08-1990'), professionId: 'business', asOf: parseDate('20-11-2026') });
    const input = { fullName: 'Rahul Kumar Sharma', dobText: '28-08-1990', profession: 'Business', goals: [], language: 'en' as const, observations: { slant: 'right', baseline: 'rising' } } as never;
    const fs = effectiveFeatures(input);
    for (const language of ['en', 'hi'] as const) {
      for (const source of ['ai', 'rules'] as const) {
        const html = buildSignatureReportHtml({ client: { fullName: 'Rahul Kumar Sharma', dob: '1990-08-28', profession: 'Business', goals: [], language }, preparedBy: 'Acharya Nandram', numbers: n,
          result: { analysis: ruleBasedAnalysis(input, n, fs), source, scores: engineScores(input, n, fs), features: fs }, generatedAt: '2026-11-20T10:00:00Z' } as never, THEMES['royal-gold-maroon'], DEFAULT_BRANDING as Branding);
        const text = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
        expect(text).not.toMatch(/\bAI\b|artificial intelligence|language model|Gemini|Claude|OpenAI|GPT/i);
        expect(text).toContain('Acharya Nandram');
      }
    }
  });
});

describe('Hindi reports', () => {
  const englishSentence = /\b(the|and|your|with|is|are|to)\b [a-z]+ [a-z]+/;
  it('signature analysis is fully Hindi when the language is Hindi', async () => {
    const { signatureNumbers } = await import('@/lib/signature/numbers');
    const { effectiveFeatures, ruleBasedAnalysis } = await import('@/lib/signature/agent');
    const { parseDate } = await import('@/lib/numerology');
    const n = signatureNumbers({ fullName: 'Rahul Kumar Sharma', signatureName: 'R K Sharma', dob: parseDate('28-08-1990'), professionId: 'business', asOf: parseDate('20-11-2026') });
    const input = { fullName: 'Rahul Kumar Sharma', dobText: '28-08-1990', profession: 'Business', goals: [], language: 'hi' as const, observations: { slant: 'left', baseline: 'falling', dots: 'end', first: 'small', underline: 'through' } } as never;
    const a = ruleBasedAnalysis(input, n, effectiveFeatures(input));
    const all = JSON.stringify(a);
    expect(all).toMatch(/[ऀ-ॿ]/);
    expect(all.replace(/Rahul Kumar Sharma|R K SHARMA|R K Sharma/g, '')).not.toMatch(englishSentence);
    expect(a.corrections.length).toBeGreaterThan(2);
  });
  it('business built-in report is in Hindi when the language is Hindi', async () => {
    const { businessAnalytics } = await import('@/lib/business/engine');
    const { ruleReport } = await import('@/lib/business/agent');
    const { parseDate } = await import('@/lib/numerology');
    const a = businessAnalytics({ fullName: 'Rahul Kumar Sharma', dob: parseDate('28-08-1990'), gender: 'male', birthPlace: 'Jaipur', mode: 'both', capital: 2, risk: 'medium', interests: [], asOf: parseDate('20-11-2026') });
    const r = ruleReport({ fullName: 'Rahul Kumar Sharma', dobText: '28-08-1990', birthPlace: 'Jaipur', mode: 'both', capitalLabel: 'Medium', risk: 'medium', interests: [], language: 'hi' } as never, a);
    expect(r.summary).toMatch(/भाग्यांक/);
    expect(r.closing).toMatch(/[ऀ-ॿ]/);
    for (const x of [r.summary, r.avoidNote, r.partnership, r.timingAdvice, ...r.remedies, ...r.actionPlan]) expect(x).not.toMatch(/Best suited|Least suited|Start important work|Partners whose/);
  });
});
