/** Phase 6: auth, billing, entitlements, admin settings, white-label. Needs TEST_DATABASE_URL (Postgres). */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq, sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/db/client';
import { AuthError, requestOtp, upsertVerifiedUser, verifyOtp } from '@/lib/auth/otp';
import { createSession, destroySession, userFromSession } from '@/lib/auth/session';
import { exchangeGoogleCode } from '@/lib/auth/google';
import { financialYear, splitGstInclusive } from '@/lib/billing/gst';
import { rupeesInWords, renderInvoicePdf } from '@/lib/billing/invoice';
import { activeGateway, CheckoutError, createCheckout, fulfilPayment, isMockOrder, validateCoupon } from '@/lib/billing/checkout';
import { cashfreeConfig, cashfreePhone, createCashfreeOrder, verifyCashfreeWebhook } from '@/lib/billing/cashfree';
import { assertCanAddProfiles, getAccount, isReportUnlocked, unlockReport } from '@/lib/billing/entitlements';
import { getPlan } from '@/lib/billing/plans';
import { pdfStyleFor, saveBranding, validateImageDataUrl } from '@/lib/branding';
import { getSetting, setSetting } from '@/lib/admin/settings';
import { overview } from '@/lib/admin/analytics';
import { loadKnowledgeBase } from '@/lib/narrative/knowledge/db';
import { generateNarrative } from '@/lib/narrative/service';
import { systemPrompt } from '@/lib/narrative/prompts';
import { createProfile } from '@/lib/db/repo/profiles';
import { createReport } from '@/lib/db/repo/reports';
import { generateNumerology } from '@/lib/numerology';
import { closeBrowser } from '@/lib/pdf/render';
import { PaymentRequiredError } from '@/lib/server/http';

const URL = process.env.TEST_DATABASE_URL;
const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('pure helpers', () => {
  it('splits GST-inclusive prices', () => {
    expect(splitGstInclusive(49_900, 'Rajasthan', 'Rajasthan')).toEqual({ taxablePaise: 42_288, cgstPaise: 3806, sgstPaise: 3806, igstPaise: 0, gstPaise: 7612 });
    expect(splitGstInclusive(49_900, 'Delhi', 'Rajasthan')).toEqual({ taxablePaise: 42_288, cgstPaise: 0, sgstPaise: 0, igstPaise: 7612, gstPaise: 7612 });
  });
  it('financial year changes on 1 April IST', () => {
    expect(financialYear(new Date('2027-03-31T18:00:00Z'))).toBe('2026-27'); // 31 Mar 23:30 IST
    expect(financialYear(new Date('2027-03-31T18:31:00Z'))).toBe('2027-28'); // 1 Apr 00:01 IST
  });
  it('writes amounts in Indian words', () => {
    expect(rupeesInWords(2_49_900)).toBe('Two Thousand Four Hundred Ninety Nine Rupees Only');
    expect(rupeesInWords(24_99_900)).toBe('Twenty Four Thousand Nine Hundred Ninety Nine Rupees Only');
    expect(rupeesInWords(1_25_00_050)).toBe('One Lakh Twenty Five Thousand Rupees and Fifty Paise Only');
  });
  it('Cashfree webhook signature (base64 HMAC of timestamp + body)', () => {
    const cfg = { appId: 'app', secretKey: 'cfsk_ma_test_secret', mode: 'sandbox' as const, baseUrl: 'https://sandbox.cashfree.com/pg' };
    const body = '{"type":"PAYMENT_SUCCESS_WEBHOOK","data":{"order":{"order_id":"cf_1"}}}';
    const sig = require('node:crypto').createHmac('sha256', cfg.secretKey).update('1700000000' + body).digest('base64');
    expect(verifyCashfreeWebhook(cfg, body, sig, '1700000000')).toBe(true);
    expect(verifyCashfreeWebhook(cfg, body + ' ', sig, '1700000000')).toBe(false);
    expect(verifyCashfreeWebhook(cfg, body, sig, '1700000001')).toBe(false);
    expect(verifyCashfreeWebhook(cfg, body, 'é'.repeat(sig.length), '1700000000')).toBe(false); // multi-byte, same string length
    expect(verifyCashfreeWebhook(cfg, body, null, '1700000000')).toBe(false);
  });
  it('Cashfree config: mode from key, env override, phone normalisation', () => {
    const old = { ...process.env };
    process.env.CASHFREE_APP_ID = 'app'; process.env.CASHFREE_SECRET_KEY = 'cfsk_ma_prod_x'; delete process.env.CASHFREE_ENV;
    expect(cashfreeConfig()?.mode).toBe('production');
    expect(cashfreeConfig()?.baseUrl).toBe('https://api.cashfree.com/pg');
    expect(activeGateway()).toBe('cashfree');
    process.env.CASHFREE_ENV = 'sandbox';
    expect(cashfreeConfig()?.baseUrl).toBe('https://sandbox.cashfree.com/pg');
    delete process.env.CASHFREE_APP_ID;
    expect(cashfreeConfig()).toBeNull();
    expect(activeGateway()).toBe('mock'); // test / development
    process.env = old;
    expect(cashfreePhone('+91 98765 43210')).toBe('9876543210');
    expect(cashfreePhone('12345')).toBeNull();
  });
  it('creates Cashfree orders with API headers and checks the amount', async () => {
    const cfg = { appId: 'app', secretKey: 'sec', mode: 'sandbox' as const, baseUrl: 'https://sandbox.cashfree.com/pg' };
    const f = vi.fn(async () => new Response(JSON.stringify({ cf_order_id: 1, order_id: 'cf_x', order_amount: 499, order_currency: 'INR', order_status: 'ACTIVE', payment_session_id: 'sess' }), { status: 200 }));
    const o = await createCashfreeOrder(cfg, { orderId: 'cf_x', amountPaise: 49_900, customer: { id: 'u-1', phone: '9876543210' } }, f as unknown as typeof fetch);
    expect(o.payment_session_id).toBe('sess');
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://sandbox.cashfree.com/pg/orders');
    expect((init.headers as Record<string, string>)['x-client-id']).toBe('app');
    expect((init.headers as Record<string, string>)['x-api-version']).toBe('2023-08-01');
    await expect(createCashfreeOrder(cfg, { orderId: 'cf_x', amountPaise: 50_000, customer: { id: 'u', phone: '9876543210' } }, f as unknown as typeof fetch)).rejects.toThrow(/amount mismatch/);
  });
  it('rejects unsafe or fake images for branding', () => {
    expect(validateImageDataUrl(PNG_1PX)).toBe(PNG_1PX);
    expect(() => validateImageDataUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')).toThrow();
    expect(() => validateImageDataUrl(`data:image/png;base64,${Buffer.from('not really a png').toString('base64')}`)).toThrow();
  });
  it('Google code exchange', async () => {
    const f = vi.fn(async (url: string) => url.includes('token')
      ? new Response(JSON.stringify({ access_token: 'at' }))
      : new Response(JSON.stringify({ sub: 'g-123', email: 'Meera@Example.com', email_verified: true, name: 'Meera' })));
    const p = await exchangeGoogleCode('code', 'verifier', 'http://x/cb', f as unknown as typeof fetch);
    expect(p).toEqual({ sub: 'g-123', email: 'meera@example.com', emailVerified: true, name: 'Meera' });
  });
  it('admin prompt additions reach the system prompt', () => {
    expect(systemPrompt({ expertName: 'Acharya X', brandName: 'B' }, 'en', 'Always mention Ganesh ji first.')).toContain('Always mention Ganesh ji first.');
  });
});

describe.skipIf(!URL)('database-backed', () => {
  let pool: Pool; let db: Db;
  const codes: string[] = [];
  const sender = async (d: { code: string }) => { codes.push(d.code); };

  beforeAll(async () => {
    pool = new Pool({ connectionString: URL });
    db = drizzle(pool, { schema });
    await db.execute(sql`drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;`);
    await migrate(db, { migrationsFolder: 'drizzle' });
    process.env.SUPER_ADMIN_EMAILS = 'owner@brand.in';
  });
  afterAll(async () => { await closeBrowser(); await pool?.end(); });

  const ageCodes = () => db.execute(sql`update otp_codes set created_at = created_at - interval '40 seconds'`);

  it('email OTP: verify, wrong code limit, resend gap, super admin bootstrap', async () => {
    await requestOtp('email', ' Owner@Brand.in ', { sender }, db);
    const u = await verifyOtp('email', 'owner@brand.in', codes.at(-1)!, { name: 'Owner' }, db);
    expect(u.role).toBe('super_admin');
    expect(u.emailVerifiedAt).not.toBeNull();
    await expect(verifyOtp('email', 'owner@brand.in', codes.at(-1)!, {}, db)).rejects.toMatchObject({ code: 'CODE_EXPIRED' }); // single use

    await ageCodes();
    await requestOtp('email', 'asha@example.com', { sender }, db);
    await expect(requestOtp('email', 'asha@example.com', { sender }, db)).rejects.toMatchObject({ code: 'WAIT_BEFORE_RESEND' });
    for (let i = 0; i < 4; i++) await expect(verifyOtp('email', 'asha@example.com', '000000' === codes.at(-1) ? '111111' : '000000', {}, db)).rejects.toMatchObject({ code: 'WRONG_CODE' });
    await expect(verifyOtp('email', 'asha@example.com', codes.at(-1) === '999999' ? '999998' : '999999', {}, db)).rejects.toMatchObject({ code: 'TOO_MANY_ATTEMPTS' });
    await expect(verifyOtp('email', 'asha@example.com', codes.at(-1)!, {}, db)).rejects.toMatchObject({ code: 'TOO_MANY_ATTEMPTS' }); // locked even with right code
    await expect(requestOtp('email', 'not-an-email', { sender }, db)).rejects.toBeInstanceOf(AuthError);
  });

  it('mobile OTP normalises Indian numbers and limits requests per hour', async () => {
    await requestOtp('sms', '+91 98765 43210', { sender }, db);
    const u = await verifyOtp('sms', '09876543210', codes.at(-1)!, {}, db);
    expect(u.phone).toBe('+919876543210');
    for (let i = 0; i < 4; i++) { await ageCodes(); await requestOtp('sms', '9876543210', { sender }, db); }
    await ageCodes();
    await expect(requestOtp('sms', '9876543210', { sender }, db)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
  });

  it('sessions: resolve, expire, destroy, disabled users', async () => {
    const u = await upsertVerifiedUser({ email: 'ravi@example.com' }, 'Ravi', db);
    const t = await createSession(u.id, 'test', db);
    expect((await userFromSession(t, db))?.id).toBe(u.id);
    expect(JSON.stringify((await db.execute(sql`select * from sessions`)).rows)).not.toContain(t);
    await db.update(schema.users).set({ disabledAt: new Date() }).where(eq(schema.users.id, u.id));
    expect(await userFromSession(t, db)).toBeNull();
    await db.update(schema.users).set({ disabledAt: null }).where(eq(schema.users.id, u.id));
    await db.execute(sql`update sessions set expires_at = now() - interval '1 second'`);
    expect(await userFromSession(t, db)).toBeNull();
    const t2 = await createSession(u.id, 'test', db);
    await destroySession(t2, db);
    expect(await userFromSession(t2, db)).toBeNull();
  });

  it('Google sign-in links to an existing email account', async () => {
    const existing = await upsertVerifiedUser({ email: 'meera@example.com' }, 'Meera', db);
    const g = await upsertVerifiedUser({ googleSub: 'g-123', email: 'meera@example.com' }, 'Meera', db);
    expect(g.id).toBe(existing.id);
    expect(g.googleSub).toBe('g-123');
  });

  it('coupons', async () => {
    const plan = (await getPlan('SINGLE', db))!;
    await db.insert(schema.coupons).values([
      { code: 'DIWALI20', percentOff: 20 }, { code: 'FLAT100', amountOffPaise: 10_000, planCodes: ['SINGLE'] },
      { code: 'OLD', percentOff: 50, expiresAt: new Date(Date.now() - 1000) }, { code: 'ONCE', percentOff: 10, maxUses: 1, used: 1 },
      { code: 'PROONLY', percentOff: 10, planCodes: ['PRO_YEARLY'] },
    ]);
    expect((await validateCoupon('diwali20', plan, db)).discountPaise).toBe(9980);
    expect((await validateCoupon('FLAT100', plan, db)).discountPaise).toBe(10_000);
    for (const [c, err] of [['OLD', 'COUPON_EXPIRED'], ['ONCE', 'COUPON_USED_UP'], ['PROONLY', 'COUPON_NOT_FOR_PLAN'], ['NOPE', 'COUPON_INVALID']]) {
      await expect(validateCoupon(c, plan, db)).rejects.toMatchObject({ code: err });
    }
  });

  it('checkout → verify → fulfil is idempotent; invoices are sequential; credits & Pro granted', async () => {
    const buyer = await upsertVerifiedUser({ email: 'buyer@example.com' }, 'Buyer', db);
    expect(activeGateway()).toBe('mock'); // no Cashfree keys in tests → development test mode
    await expect(createCheckout(buyer, { planCode: 'SINGLE', billingState: 'Delhi', gstin: 'BAD' }, {}, db)).rejects.toBeInstanceOf(CheckoutError);

    const c1 = await createCheckout(buyer, { planCode: 'PACK5', billingState: 'Rajasthan', coupon: 'DIWALI20' }, {}, db);
    expect(c1.amountPaise).toBe(1_99_900 - 39_980);
    expect(isMockOrder(c1.orderId)).toBe(true);
    const f1 = await fulfilPayment(c1.orderId, 'mockpay_1', db);
    const again = await fulfilPayment(c1.orderId, 'mockpay_1', db); // webhook arrives too
    expect(again.alreadyPaid).toBe(true);
    expect((await getAccount(buyer.id, db)).credits).toBe(5);
    expect(f1.payment.cgstPaise + f1.payment.sgstPaise).toBe(f1.payment.amountPaise - f1.payment.taxablePaise);
    expect(f1.payment.invoiceNumber).toMatch(/^INV\/\d{4}-\d{2}\/00001$/);
    expect((await db.select().from(schema.coupons).where(eq(schema.coupons.code, 'DIWALI20')))[0].used).toBe(1);

    // two payments fulfilled concurrently still get distinct invoice numbers
    const [a, b] = await Promise.all([createCheckout(buyer, { planCode: 'SINGLE', billingState: 'Delhi' }, {}, db), createCheckout(buyer, { planCode: 'PRO_MONTHLY', billingState: 'Delhi' }, {}, db)]);
    const [fa, fb] = await Promise.all([fulfilPayment(a.orderId, 'pay_a', db), fulfilPayment(b.orderId, 'pay_b', db)]);
    expect(new Set([fa.payment.invoiceNumber, fb.payment.invoiceNumber, f1.payment.invoiceNumber]).size).toBe(3);
    expect(fa.payment.igstPaise).toBeGreaterThan(0);
    const acct = await getAccount(buyer.id, db);
    expect(acct.planCode).toBe('PRO_MONTHLY');
    expect(acct.features.whiteLabel).toBe(true);
    expect((await db.select().from(schema.users).where(eq(schema.users.id, buyer.id)))[0].role).toBe('expert');

    const inv = await renderInvoicePdf(f1.payment, buyer, 'PACK5', await getSetting('seller', db));
    expect(inv.pageCount).toBe(1);
  }, 60_000);

  it('entitlements: free → credit → later versions stay unlocked; Pro is unlimited; profile limit', async () => {
    const free = await upsertVerifiedUser({ email: 'free@example.com' }, 'Free', db);
    const input = { fullName: 'Asha Rao', gender: 'female' as const, dob: '12-03-1988', aadhaarConsent: false, concerns: [], language: 'en' as const };
    const p = await createProfile(free.id, input, db);
    const r1 = await createReport(free.id, p.id, { result: generateNumerology(input, { asOf: '2026-11-03' }) }, db);
    await expect(unlockReport(free, r1.id, { useCredit: true }, db)).rejects.toMatchObject({ message: 'no_credits' });
    await db.update(schema.users).set({ credits: 1 }).where(eq(schema.users.id, free.id));
    await expect(unlockReport(free, r1.id, {}, db)).rejects.toBeInstanceOf(PaymentRequiredError); // must opt in to spend
    expect(await unlockReport(free, r1.id, { useCredit: true }, db)).toBe('credit');
    expect((await getAccount(free.id, db)).credits).toBe(0);
    const r2 = await createReport(free.id, p.id, { result: generateNumerology(input, { asOf: '2026-11-04' }) }, db);
    expect(await isReportUnlocked(r2.id, db)).toBe(true); // new version of the same report
    const r3 = await createReport(free.id, p.id, { result: generateNumerology(input, { asOf: '2026-11-04', modules: ['name'] }) }, db);
    expect(await isReportUnlocked(r3.id, db)).toBe(false); // a different report type

    for (let i = 0; i < 2; i++) await createProfile(free.id, { ...input, fullName: `Client ${i}` }, db);
    await expect(assertCanAddProfiles(free, 1, db)).rejects.toBeInstanceOf(PaymentRequiredError); // free plan: 3 profiles

    const buyer = (await db.select().from(schema.users).where(eq(schema.users.email, 'buyer@example.com')))[0];
    const bp = await createProfile(buyer.id, input, db);
    const br = await createReport(buyer.id, bp.id, { result: generateNumerology(input, { asOf: '2026-11-03' }) }, db);
    expect(await unlockReport(buyer, br.id, {}, db)).toBe('plan');
  });

  it('white-label branding applies only on plans that include it', async () => {
    const buyer = (await db.select().from(schema.users).where(eq(schema.users.email, 'buyer@example.com')))[0];
    const free = (await db.select().from(schema.users).where(eq(schema.users.email, 'free@example.com')))[0];
    await saveBranding(buyer.id, { brandName: 'Shubh Ank', expertName: 'Acharya Meera', logo: PNG_1PX, colours: { primary: '#123456' }, defaultTheme: 'cosmic-blue' }, db);
    await saveBranding(free.id, { brandName: 'Free Brand', expertName: 'Someone' }, db);
    const s = await pdfStyleFor(buyer.id, null, db);
    expect(s.theme).toBe('cosmic-blue');
    expect(s.branding?.expertName).toBe('Acharya Meera');
    expect(s.branding?.colours?.primary).toBe('#123456');
    expect((await pdfStyleFor(free.id, null, db)).branding?.expertName).toBeUndefined();
    await setSetting('themes', { defaultTheme: 'saffron-cream', enabled: ['saffron-cream', 'minimal-white'], overrides: {} }, db);
    expect((await pdfStyleFor(free.id, 'cosmic-blue', db)).theme).toBe('saffron-cream'); // disabled theme falls back
    await setSetting('themes', { defaultTheme: 'royal-gold-maroon', enabled: ['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white'], overrides: {} }, db);
  });

  it('knowledge-base edits change the report text and its cache key', async () => {
    const result = generateNumerology({ fullName: 'Rahul Sharma', gender: 'male', dob: '28-08-1990' }, { asOf: '2026-11-03' });
    const before = await loadKnowledgeBase('en', db);
    await db.insert(schema.knowledgeEntries).values({ key: 'MOOLANK_1', language: 'en', title: 'Moolank One', body: 'Custom expert note about leadership and the Sun.' });
    const after = await loadKnowledgeBase('en', db);
    expect(after.fingerprint).not.toBe(before.fingerprint);
    const n = await generateNarrative(result, { kb: after.kb, kbFingerprint: after.fingerprint, sections: ['moolank'] });
    expect(n.sections[0].text).toContain('Custom expert note about leadership');
  });

  it('admin overview aggregates', async () => {
    const o = await overview(db);
    expect(o.totals.paid).toBe(3);
    expect(o.totals.revenue).toBeGreaterThan(0);
    expect(o.byModule.find((m) => m.module === 'complete')?.n).toBeGreaterThan(0);
  });
});
