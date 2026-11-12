/**
 * Database + portability tests. Needs a Postgres: TEST_DATABASE_URL=postgres://user@localhost:5433/numerology_test
 * (skipped when not set).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/db/client';
import { ensureUser } from '@/lib/auth/current-user';
import { createProfile, deleteProfile, duplicateProfile, getProfile, listProfiles, NotFoundError, updateProfile } from '@/lib/db/repo/profiles';
import { createReport, getReport, listReports, regenerateReport, updateReport } from '@/lib/db/repo/reports';
import { createShareLink, resolveShareLink, revokeShareLink } from '@/lib/db/repo/shares';
import { exportBundle, exportProfile, importProfiles, parseImportCsv, parseImportJson, profilesToCsv } from '@/lib/portable';
import { decrypt, encrypt, hashPassword, verifyPassword } from '@/lib/security/crypto';
import { generateNumerology, verhoeffCheckDigit } from '@/lib/numerology';
import { generateNarrative } from '@/lib/narrative/service';

const URL = process.env.TEST_DATABASE_URL;
const aadhaar = '23456789012' + verhoeffCheckDigit('23456789012');
const asOf = '2026-11-03';
const input = {
  fullName: 'Rahul Kumar Sharma', commonName: 'Rahul Sharma', hindiName: 'राहुल शर्मा', gender: 'male' as const, dob: '28-08-1990', profession: 'Software engineer',
  maritalStatus: 'engaged' as const, concerns: ['career' as const, 'marriage' as const], mobile: '9876543210', aadhaar, aadhaarConsent: true, language: 'en' as const,
  partner: { name: 'Priya Verma', gender: 'female' as const, dob: '15-05-1992' },
};

describe('crypto', () => {
  it('encrypts with AES-GCM and detects tampering', () => {
    const c = encrypt('Rahul Sharma');
    expect(c).not.toContain('Rahul');
    expect(decrypt(c)).toBe('Rahul Sharma');
    const parts = c.split('.'); parts[3] = parts[3].slice(0, -2) + (parts[3].endsWith('A') ? 'BB' : 'AA');
    expect(() => decrypt(parts.join('.'))).toThrow();
  });
  it('supports key rotation', () => {
    const old = Buffer.alloc(32, 7).toString('base64'), next = Buffer.alloc(32, 9).toString('base64');
    process.env.ENCRYPTION_KEY = old; const c = encrypt('secret');
    process.env.ENCRYPTION_KEY = next; process.env.ENCRYPTION_KEY_PREVIOUS = old;
    expect(decrypt(c)).toBe('secret');
    delete process.env.ENCRYPTION_KEY; delete process.env.ENCRYPTION_KEY_PREVIOUS;
  });
  it('hashes share passwords', () => {
    const h = hashPassword('shubh123');
    expect(verifyPassword('shubh123', h)).toBe(true);
    expect(verifyPassword('wrong', h)).toBe(false);
  });
});

describe.skipIf(!URL)('database (Postgres)', () => {
  let pool: Pool; let db: Db; let owner: string; let other: string;

  beforeAll(async () => {
    pool = new Pool({ connectionString: URL });
    db = drizzle(pool, { schema });
    await db.execute(sql`drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;`);
    await migrate(db, { migrationsFolder: 'drizzle' });
    owner = (await ensureUser('expert@test.local', 'expert', db)).id;
    other = (await ensureUser('someone@test.local', 'expert', db)).id;
  });
  afterAll(async () => { await pool?.end(); });

  it('never stores the Aadhaar number; personal data is encrypted', async () => {
    const p = await createProfile(owner, input, db);
    const result = generateNumerology(input, { asOf });
    await createReport(owner, p.id, { result }, db);
    const dump = JSON.stringify((await db.execute(sql`select * from client_profiles, reports`)).rows);
    expect(dump).not.toContain(aadhaar);
    expect(dump).not.toContain('Kumar');           // full name only inside ciphertext
    expect(dump).not.toContain('9876543210');
    expect(dump).toContain(aadhaar.slice(-4));      // last 4 digits are kept
    expect((await getProfile(owner, p.id, db)).input).not.toHaveProperty('aadhaar');
  });

  it('refuses to store a result that contains a full 12-digit number', async () => {
    const p = await createProfile(owner, { ...input, aadhaar: undefined }, db);
    const result = generateNumerology(input, { asOf });
    const leaky = { ...result, client: { ...result.client, note: aadhaar } } as never;
    await expect(createReport(owner, p.id, { result: leaky }, db)).rejects.toThrow('REFUSING_TO_STORE');
  });

  it('versions reports, updates narrative, regenerates and lists', async () => {
    const p = await createProfile(owner, input, db);
    const r1 = await createReport(owner, p.id, { result: generateNumerology(input, { asOf }) }, db);
    const r2 = await regenerateReport(owner, p.id, { asOf, narrative: (r) => generateNarrative(r) }, db);
    expect([r1.version, r2.version]).toEqual([1, 2]);
    expect(r2.status).toBe('final');
    const full = await getReport(owner, r2.id, db);
    expect(full.result.results.aadhaar).toBeNull(); // Aadhaar not re-supplied → module skipped
    expect(full.narrative?.sections.length).toBeGreaterThan(10);
    const edited = { ...full.narrative!, status: 'awaiting_review' as const, sections: full.narrative!.sections.map((s, i) => (i === 0 ? { ...s, text: 'Edited intro.', source: 'expert' as const } : s)) };
    const u = await updateReport(owner, r2.id, { narrative: edited }, db);
    expect(u.status).toBe('awaiting_review');
    expect(u.narrative?.sections[0].text).toBe('Edited intro.');
    const list = await listReports(owner, p.id, db);
    expect(list.map((x) => x.version)).toEqual([2, 1]);
    expect(list[0].summary.moolank).toBe(1);
  });

  it('search, update, duplicate and delete (with cascade)', async () => {
    const p = await createProfile(owner, { ...input, commonName: 'Anita Desai', aadhaar: undefined }, db);
    await createReport(owner, p.id, { result: generateNumerology({ ...input, commonName: 'Anita Desai', aadhaar: undefined }, { asOf }) }, db);
    expect((await listProfiles(owner, { q: 'anita' }, db)).items.map((x) => x.id)).toContain(p.id);
    await updateProfile(owner, p.id, { ...input, commonName: 'Anita D.', aadhaar: undefined }, db);
    expect((await getProfile(owner, p.id, db)).displayName).toBe('Anita D.');
    const copy = await duplicateProfile(owner, p.id, db);
    expect(copy.displayName).toBe('Anita D. (copy)');
    expect((await listReports(owner, copy.id, db)).length).toBe(1);
    await deleteProfile(owner, p.id, db);
    await expect(getProfile(owner, p.id, db)).rejects.toBeInstanceOf(NotFoundError);
    expect((await db.execute(sql`select count(*)::int as n from reports where profile_id = ${p.id}`)).rows[0]).toEqual({ n: 0 });
  });

  it('isolates owners', async () => {
    const p = await createProfile(owner, { ...input, aadhaar: undefined }, db);
    await expect(getProfile(other, p.id, db)).rejects.toBeInstanceOf(NotFoundError);
    await expect(createReport(other, p.id, { result: generateNumerology(input, { asOf }) }, db)).rejects.toBeInstanceOf(NotFoundError);
    expect((await listProfiles(other, {}, db)).total).toBe(0);
  });

  it('share links: expiry, password, revoke; token never stored', async () => {
    const p = await createProfile(owner, { ...input, aadhaar: undefined }, db);
    const r = await createReport(owner, p.id, { result: generateNumerology(input, { asOf }) }, db);
    const open = await createShareLink(owner, r.id, { days: 7 }, db);
    expect((await resolveShareLink(open.token, undefined, { countView: true }, db)).status).toBe('ok');
    expect(JSON.stringify((await db.execute(sql`select * from share_links`)).rows)).not.toContain(open.token);
    const locked = await createShareLink(owner, r.id, { days: 1, password: 'shubh123' }, db);
    expect((await resolveShareLink(locked.token, undefined, {}, db)).status).toBe('password_required');
    expect((await resolveShareLink(locked.token, 'nope', {}, db)).status).toBe('wrong_password');
    expect((await resolveShareLink(locked.token, 'shubh123', {}, db)).status).toBe('ok');
    await db.execute(sql`update share_links set expires_at = now() - interval '1 minute' where id = ${locked.id}`);
    expect((await resolveShareLink(locked.token, 'shubh123', {}, db)).status).toBe('expired');
    await revokeShareLink(owner, open.id, db);
    expect((await resolveShareLink(open.token, undefined, {}, db)).status).toBe('revoked');
    expect((await resolveShareLink('made-up-token', undefined, {}, db)).status).toBe('not_found');
    await expect(createShareLink(other, r.id, {}, db)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('JSON export → import round-trip restores the profile exactly', async () => {
    const p = await createProfile(owner, input, db);
    const result = generateNumerology(input, { asOf });
    const narrative = await generateNarrative(result);
    await createReport(owner, p.id, { result, narrative, theme: 'cosmic-blue' }, db);
    await createReport(owner, p.id, { result: generateNumerology(input, { asOf, modules: ['name'] }), theme: 'minimal-white' }, db);
    const exported = await exportProfile(owner, p.id, {}, db);
    expect(JSON.stringify(exported)).not.toContain(aadhaar);
    expect(exported.profile.aadhaarMasked).toBe(`XXXX-XXXX-${aadhaar.slice(-4)}`);

    const parsed = parseImportJson(JSON.stringify(exported));
    expect(parsed.issues).toEqual([]);
    const outcome = await importProfiles(owner, parsed, {}, db);
    expect(outcome.issues).toEqual([]);
    expect(outcome.warnings).toEqual([]);
    const again = await exportProfile(owner, outcome.created[0].profileId, {}, db);
    const strip = (x: typeof exported) => ({ ...x.profile, reports: x.profile.reports.map(({ createdAt: _c, ...r }) => r) });
    expect(strip(again)).toEqual(strip(exported));
  });

  it('bundle export + CSV round-trip', async () => {
    const bundle = await exportBundle(owner, 'all', {}, db);
    expect(bundle.profiles.length).toBeGreaterThan(3);
    const csv = profilesToCsv(bundle.profiles);
    const back = parseImportCsv(csv);
    expect(back.issues).toEqual([]);
    expect(back.profiles.map((p) => p.input.fullName)).toEqual(bundle.profiles.map((p) => p.input.fullName));
    expect(back.profiles[0].input.partner?.name).toBe(bundle.profiles[0].input.partner?.name);
  });

  it('imports older formats and reports clear errors', async () => {
    // v1 = the results-page export from Phases 2–4
    const v1 = { ...generateNumerology(input, { asOf }), narrative: await generateNarrative(generateNumerology(input, { asOf })) };
    const p1 = parseImportJson(JSON.stringify(v1));
    expect(p1.sourceVersion).toBe('1');
    expect(p1.issues).toEqual([]);
    expect(p1.profiles[0].reports[0].narrative?.sections.length).toBe(18);

    expect(parseImportJson('{"schemaVersion": 9, "kind": "numerology.bundle"}').issues[0].message).toMatch(/newer version/);
    expect(parseImportJson('not json').issues[0].message).toMatch(/not valid JSON/);

    const csv = 'fullName,gender,dob,concerns\nAsha Rao,female,12-03-1988,career;money\nX,male,31-02-1990,\nRavi,robot,01-01-1990,\nMeena,female,01-01-1990,astrology';
    const c = parseImportCsv(csv);
    expect(c.profiles.map((p) => p.input.fullName)).toEqual(['Asha Rao']);
    expect(c.issues.map((i) => i.where)).toEqual(expect.arrayContaining(['row 3.fullName', 'row 3.dob', 'row 4.gender', 'row 5.concerns']));

    // tampered numbers are recalculated
    const tampered = JSON.parse(JSON.stringify(v1));
    tampered.results.dob.moolank.value = 9;
    const out = await importProfiles(owner, parseImportJson(JSON.stringify(tampered)), {}, db);
    expect(out.warnings[0].message).toMatch(/recalculated/);
    const rep = (await listReports(owner, out.created[0].profileId, db))[0];
    expect(rep.summary.moolank).toBe(1);
  });

  it('stores contact messages encrypted and lists them for the admin', async () => {
    const { createContactMessage, listContactMessages, updateContactMessage, deleteContactMessage } = await import('@/lib/contact');
    const row = await createContactMessage({ name: 'Sunita Devi', phone: '98765 12345', email: 'sunita@example.com', topic: 'service', subject: 'consultation', message: 'Please call me. Aadhaar 2345 6789 0123', language: 'hi' }, {}, db);
    const dump = JSON.stringify((await db.execute(sql`select * from contact_messages`)).rows);
    expect(dump).not.toContain('Sunita'); expect(dump).not.toContain('9876512345'); expect(dump).not.toContain('sunita@');
    expect(dump).toContain('"phone_last4":"2345"'); // last 4 of the phone kept for display
    const list = await listContactMessages({ status: 'new' }, db);
    const m = list.messages.find((x) => x.id === row.id)!;
    expect(m).toMatchObject({ name: 'Sunita Devi', phone: '+919876512345', email: 'sunita@example.com', topic: 'service', service: 'consultation', status: 'new', language: 'hi' });
    expect(m.message).toContain('XXXX-XXXX-0123'); expect(m.message).not.toContain('2345 6789');
    expect(list.counts.new).toBeGreaterThanOrEqual(1);
    expect(await updateContactMessage({ id: row.id, status: 'resolved', adminNote: 'Called back' }, db)).toBe(true);
    const after = (await listContactMessages({ status: 'resolved' }, db)).messages.find((x) => x.id === row.id)!;
    expect(after.adminNote).toBe('Called back');
    expect(await deleteContactMessage(row.id, db)).toBe(true);
    expect(await updateContactMessage({ id: row.id, status: 'new' }, db)).toBe(false);
  });

  it('account security: change password, sign out other devices, erase data', async () => {
    const { changePassword, signOutOtherSessions, eraseAccount } = await import('@/lib/auth/account-security');
    const { hashPassword: hp, verifyPassword: vp } = await import('@/lib/auth/password');
    const { createSession, userFromSession } = await import('@/lib/auth/session');
    const [u] = await db.insert(schema.users).values({ name: 'Erase Me', email: 'erase@test.local', phone: '+919811100000', passwordHash: await hp('oldpass123') }).returning();
    const t1 = await createSession(u.id, 'a', db), t2 = await createSession(u.id, 'b', db);
    await expect(changePassword(u, 'wrong', 'newpass123', t1, db)).rejects.toThrow();
    await expect(changePassword(u, 'oldpass123', 'short', t1, db)).rejects.toThrow();
    expect(await changePassword(u, 'oldpass123', 'newpass123', t1, db)).toBe(1);
    expect(await userFromSession(t1, db)).not.toBeNull(); expect(await userFromSession(t2, db)).toBeNull();
    const fresh = (await db.select().from(schema.users).where(sql`id = ${u.id}`))[0];
    expect(await vp('newpass123', fresh.passwordHash)).toBe(true);
    await createSession(u.id, 'c', db); expect(await signOutOtherSessions(u.id, t1, db)).toBe(1);
    // no paid orders → removed completely, with the saved readings
    const p = await createProfile(u.id, input, db);
    await expect(eraseAccount(fresh, 'bad', db)).rejects.toThrow();
    expect(await eraseAccount(fresh, 'newpass123', db)).toBe('deleted');
    expect((await db.execute(sql`select 1 from users where id = ${u.id}`)).rows.length).toBe(0);
    expect((await db.execute(sql`select 1 from client_profiles where id = ${p.id}`)).rows.length).toBe(0);
    // with a paid order → anonymised, invoice row kept
    const [v] = await db.insert(schema.users).values({ name: 'Paid User', email: 'paid@test.local', phone: '+919811100001', passwordHash: await hp('oldpass123') }).returning();
    await createProfile(v.id, input, db);
    await (await import('@/lib/billing/plans')).ensurePlans(db);
    await db.execute(sql`insert into payments (user_id, plan_code, amount_paise, list_price_paise, taxable_paise, status, razorpay_order_id) select ${v.id}, code, price_paise, price_paise, price_paise, 'paid', 'cf_test_erase' from plans limit 1`);
    const hadPlan = (await db.execute(sql`select 1 from payments where user_id = ${v.id}`)).rows.length;
    expect(hadPlan).toBe(1);
    {
      expect(await eraseAccount(v, 'oldpass123', db)).toBe('anonymised');
      const row = (await db.execute(sql`select name, email, phone, password_hash, disabled_at from users where id = ${v.id}`)).rows[0] as Record<string, unknown>;
      expect(row.name).toBeNull(); expect(row.email).toBeNull(); expect(row.phone).toBeNull(); expect(row.password_hash).toBeNull(); expect(row.disabled_at).not.toBeNull();
      expect((await db.execute(sql`select 1 from client_profiles where owner_id = ${v.id}`)).rows.length).toBe(0);
      expect((await db.execute(sql`select 1 from payments where user_id = ${v.id}`)).rows.length).toBe(1);
    }
  });

  it('services: draft prices are not payable; a paid service creates an encrypted order and an invoice', async () => {
    const svcLib = await import('@/lib/billing/services');
    const { createCheckout, fulfilPayment, CheckoutError } = await import('@/lib/billing/checkout');
    const list = await svcLib.listServices({}, db);
    expect(list.map((x) => x.code)).toEqual(['SVC_PERSONAL_REPORT', 'SVC_NAME_CORRECTION', 'SVC_LOSHU', 'SVC_MOBILE_NUMBER', 'SVC_BABY_NAME', 'SVC_COUPLE', 'SVC_BUSINESS_NAME', 'SVC_PERSONAL_YEAR']);
    expect(list.every((x) => !svcLib.isPayable(x))).toBe(true); // seeded with draft prices
    const [buyer] = await db.insert(schema.users).values({ name: 'Svc Buyer', email: 'svc@test.local', phone: '+919811100009' }).returning();
    const intake = { currentName: 'Sunil Kumar', dob: '1988-03-12', gender: 'male', questions: 'Aadhaar 2345 6789 0123 for reference' };
    await expect(createCheckout(buyer, { planCode: 'SVC_NAME_CORRECTION', billingState: 'Delhi', intake }, {}, db)).rejects.toThrow(CheckoutError);
    const nc = list.find((x) => x.code === 'SVC_NAME_CORRECTION')!;
    await svcLib.saveService({ ...nc, priceConfirmed: true, pricePaise: 151_000, mrpPaise: null }, db);
    await expect(createCheckout(buyer, { planCode: 'SVC_NAME_CORRECTION', billingState: 'Delhi', intake: { dob: '1988-03-12' } }, {}, db)).rejects.toThrow('DETAILS_INVALID');
    await expect(createCheckout(buyer, { planCode: 'SVC_NAME_CORRECTION', billingState: 'Delhi', intake: { ...intake, dob: '2999-01-01' } }, {}, db)).rejects.toThrow('DETAILS_INVALID');
    const order = await createCheckout(buyer, { planCode: 'SVC_NAME_CORRECTION', billingState: 'Delhi', intake: { ...intake, injected: 'x' } }, {}, db);
    expect(order.amountPaise).toBe(151_000);
    const raw = JSON.stringify((await db.execute(sql`select * from service_orders`)).rows);
    expect(raw).not.toContain('Sunil'); expect(raw).toContain('awaiting_payment');
    expect((await svcLib.listServiceOrders({}, db)).length).toBe(0); // unpaid orders are hidden from the admin list
    const res = await fulfilPayment(order.orderId, 'pay_test_svc', db);
    expect(res.payment.invoiceNumber).toBeTruthy();
    expect((await fulfilPayment(order.orderId, 'pay_test_svc', db)).alreadyPaid).toBe(true);
    const [o] = await svcLib.listServiceOrders({}, db);
    expect(o.status).toBe('paid'); expect(o.details.currentName).toBe('Sunil Kumar'); expect(o.details).not.toHaveProperty('injected');
    expect(o.details.questions).toContain('XXXX-XXXX-0123'); expect(o.details.questions).not.toContain('2345 6789');
    expect((await db.execute(sql`select credits from users where id = ${buyer.id}`)).rows[0]).toMatchObject({ credits: 0 });
    expect(await svcLib.updateServiceOrder({ id: o.id, status: 'delivered', adminNote: 'Sent on WhatsApp' }, db)).toBe(true);
    expect((await svcLib.listServiceOrders({ userId: buyer.id }, db))[0]).toMatchObject({ status: 'delivered', adminNote: 'Sent on WhatsApp' });
    expect(await svcLib.deleteService('SVC_NAME_CORRECTION', db)).toBe('in_use');
  });

  it('international pricing: USD plan price, USD order, ₹ coupon refused, finance kept separate', async () => {
    const { createCheckout, fulfilPayment } = await import('@/lib/billing/checkout');
    const { salesReport, parseRange } = await import('@/lib/admin/finance');
    const { buildInvoiceHtml } = await import('@/lib/billing/invoice');
    await db.update(schema.plans).set({ features: sql`features || '{"usdCents": 999, "usdMrpCents": 1999}'::jsonb` }).where(sql`code = 'SINGLE'`);
    await db.insert(schema.coupons).values([{ code: 'FLAT100', amountOffPaise: 10_000 }, { code: 'TEN', percentOff: 10 }]);
    const [buyer] = await db.insert(schema.users).values({ name: 'Intl Buyer', email: 'intl@test.local', phone: '+14155550123' }).returning();
    // Phone with country code is accepted for clients abroad (mock gateway in tests).
    const usd = await createCheckout(buyer, { planCode: 'SINGLE', billingState: 'Outside India', phone: '+1 415 555 0123', currency: 'USD', gstin: '07AAAAA0000A1Z5' }, {}, db);
    expect(usd).toMatchObject({ currency: 'USD', amountPaise: 999 });
    await expect(createCheckout(buyer, { planCode: 'SINGLE', billingState: 'Outside India', currency: 'USD', coupon: 'FLAT100' }, {}, db)).rejects.toThrow('COUPON_NOT_FOR_CURRENCY');
    const pct = await createCheckout(buyer, { planCode: 'SINGLE', billingState: 'Outside India', currency: 'USD', coupon: 'TEN' }, {}, db);
    expect(pct.amountPaise).toBe(899);
    // A plan without a USD price stays in ₹ even for a visitor abroad.
    const inr = await createCheckout(buyer, { planCode: 'PACK5', billingState: 'Outside India', currency: 'USD' }, {}, db);
    expect(inr.currency).toBe('INR');
    const { payment } = await fulfilPayment(usd.orderId, 'pay_usd_1', db);
    expect(payment).toMatchObject({ currency: 'USD', amountPaise: 999, gstin: null, billingState: 'Outside India' });
    expect(payment.taxablePaise + payment.igstPaise).toBe(999);
    const html = buildInvoiceHtml(payment, buyer, 'Single Report', { legalName: 'X', address: '', state: 'Rajasthan', stateCode: '08', gstin: '', email: '', sac: '999799', invoicePrefix: 'MN' } as never, { brandName: 'B' } as never);
    expect(html).toContain('$9.99'); expect(html).toContain('Nine US Dollars and Ninety Nine Cents Only'); expect(html).not.toContain('₹');
    const range = (c: string) => parseRange(new URLSearchParams({ from: '2000-01-01', to: '2999-12-31', currency: c }));
    const [inrRep, usdRep] = [await salesReport(range('INR'), db), await salesReport(range('USD'), db)];
    expect(usdRep.totals).toMatchObject({ orders: 1, gross: 999 });
    expect(inrRep.byPlan.some((x) => x.gross === 999)).toBe(false);
    // Services: $ fee only when the admin set one.
    const svcLib = await import('@/lib/billing/services');
    const loshu = (await svcLib.listServices({}, db)).find((x) => x.code === 'SVC_LOSHU')!;
    await svcLib.saveService({ ...loshu, priceConfirmed: true, usdCents: 2900, usdMrpCents: 100 }, db);
    const saved = await svcLib.getService('SVC_LOSHU', db);
    expect(saved).toMatchObject({ usdCents: 2900, usdMrpCents: null }); // a "was" price below the fee is dropped
    const svcUsd = await createCheckout(buyer, { planCode: 'SVC_LOSHU', billingState: 'Outside India', currency: 'USD', intake: { clientName: 'John Smith', dob: '1990-05-17', gender: 'male' } }, {}, db);
    expect(svcUsd).toMatchObject({ currency: 'USD', amountPaise: 2900 });
    const svcInr = await createCheckout(buyer, { planCode: 'SVC_LOSHU', billingState: 'Delhi', currency: 'INR', intake: { clientName: 'John Smith', dob: '1990-05-17', gender: 'male' } }, {}, db);
    expect(svcInr).toMatchObject({ currency: 'INR', amountPaise: loshu.pricePaise });
  });

  it('services seeding: a service the owner deleted is not re-created on restart', async () => {
    const svcLib = await import('@/lib/billing/services');
    expect(await svcLib.deleteService('SVC_BABY_NAME', db)).toBe('deleted');
    // On a cold start ensureServices reads this marker: every batch is done, so nothing is re-inserted.
    const marker = (await db.execute(sql`select value from app_settings where key = 'servicesSeed'`)).rows[0] as { value: number };
    expect(marker.value).toBe(2);
    expect((await svcLib.listServices({ includeInactive: true }, db)).some((x) => x.code === 'SVC_BABY_NAME')).toBe(false);
  });
});
