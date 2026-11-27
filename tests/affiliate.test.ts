/**
 * Affiliate program. Pure rules always run; the end-to-end flow (apply → approve → click → checkout → paid → payout)
 * needs a Postgres: TEST_DATABASE_URL=postgres://user@localhost:5433/numerology_test (skipped when not set).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/db/client';
import { codeBase, commissionFor, cookieFrom, displayStatus, exGst, isAvailable, maskPayout, normalizeCode, parseRefCookie, refCookieValue } from '@/lib/affiliate/program';

const DAY = 86_400_000;

describe('affiliate rules', () => {
  it('codes and the referral cookie', () => {
    expect(normalizeCode(' ravi25 ')).toBe('RAVI25');
    expect(normalizeCode('ab')).toBeNull();
    expect(normalizeCode('RAVI-25')).toBeNull();
    const now = Date.UTC(2026, 10, 27);
    const v = refCookieValue('RAVI25', now);
    expect(parseRefCookie(v, 30, now + 29 * DAY)).toBe('RAVI25');
    expect(parseRefCookie(v, 30, now + 31 * DAY)).toBeNull(); // older than the program's window
    expect(parseRefCookie('RAVI25', 30, now)).toBeNull();
    expect(cookieFrom('a=1; mn_ref=RAVI25.1795000000; nsid=x', 'mn_ref')).toBe('RAVI25.1795000000');
    expect(codeBase('Ravi Kumar')).toBe('RAVI');
    expect(codeBase('Al')).toBe('PARTNER');
  });
  it('commission, GST and the hold period', () => {
    expect(commissionFor(1_280_51, 20)).toBe(25_610);
    expect(exGst(1_511_00)).toBe(1_280_51);
    const now = Date.now();
    expect(isAvailable({ status: 'pending', earnedAt: new Date(now - 8 * DAY) }, 7, now)).toBe(true);
    expect(displayStatus({ status: 'pending', earnedAt: new Date(now - 2 * DAY) }, 7, now)).toBe('on_hold');
    expect(displayStatus({ status: 'paid', earnedAt: new Date(now - 20 * DAY) }, 7, now)).toBe('paid');
    expect(maskPayout('upi', { upi: 'ravikumar@okaxis' })).toBe('ra…@okaxis');
    expect(maskPayout('bank', { accountNumber: '123456789012', ifsc: 'SBIN0001234', bankName: 'SBI' })).toBe('SBI xxxx9012 · SBIN0001234');
  });
});

const URL = process.env.TEST_DATABASE_URL;
describe.skipIf(!URL)('affiliate program (Postgres)', () => {
  let pool: Pool; let db: Db;
  beforeAll(async () => {
    pool = new Pool({ connectionString: URL });
    db = drizzle(pool, { schema });
    await db.execute(sql`drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;`);
    await migrate(db, { migrationsFolder: 'drizzle' });
  });
  afterAll(async () => { await pool?.end(); });

  it('link and coupon sales earn commission only when paid; no self-referral; payout pays the available ones', async () => {
    const store = await import('@/lib/affiliate/store');
    const { createCheckout, fulfilPayment, validateCoupon } = await import('@/lib/billing/checkout');
    const svcLib = await import('@/lib/billing/services');
    const [aff] = await db.insert(schema.users).values({ name: 'Ravi Kumar', email: 'ravi@test.local', phone: '+919811100100' }).returning();
    const [buyer] = await db.insert(schema.users).values({ name: 'Buyer One', email: 'b1@test.local', phone: '+919811100101' }).returning();
    const [buyer2] = await db.insert(schema.users).values({ name: 'Buyer Two', email: 'b2@test.local', phone: '+919811100102' }).returning();

    // Apply → pending: the link does not earn yet.
    const a = await store.applyAffiliate(aff.id, { name: 'Ravi Kumar', channel: 'youtube.com/@ravi', payoutMethod: 'upi', payout: { upi: 'ravi@okaxis' } }, db);
    expect(a.status).toBe('pending'); expect(a.code).toMatch(/^RAVI\d{2,3}$/);
    expect(JSON.stringify((await db.execute(sql`select * from affiliates`)).rows)).not.toContain('ravi@okaxis'); // payout details encrypted
    await expect(store.applyAffiliate(aff.id, { name: 'Ravi' }, db)).rejects.toThrow('ALREADY_APPLIED');
    expect(await store.recordClick(a.code, '/', db)).toBe(false);

    // Approve → coupon with the customer discount is created.
    await store.updateAffiliateAdmin(a.id, { status: 'approved' }, db);
    expect(await store.recordClick(a.code.toLowerCase(), '/baby-name-numerology', db)).toBe(true);
    const nc = (await svcLib.listServices({}, db)).find((x) => x.code === 'SVC_NAME_CORRECTION')!;
    await svcLib.saveService({ ...nc, priceConfirmed: true, pricePaise: 1_511_00, mrpPaise: null }, db);
    expect((await validateCoupon(a.code, { code: 'SVC_NAME_CORRECTION', pricePaise: 1_511_00 }, db)).discountPaise).toBe(151_10);

    const intake = { currentName: 'Sunil Kumar', dob: '1988-03-12', gender: 'male' };
    const cookie = refCookieValue(a.code);
    // 1) Sale through the link.
    const o1 = await createCheckout(buyer, { planCode: 'SVC_NAME_CORRECTION', billingState: 'Delhi', intake, refCookie: cookie }, {}, db);
    // 2) Sale with the coupon (no cookie), 3) the affiliate buying through their own link, 4) an expired click.
    const o2 = await createCheckout(buyer2, { planCode: 'SVC_NAME_CORRECTION', billingState: 'Delhi', intake, coupon: a.code.toLowerCase() }, {}, db);
    await createCheckout(aff, { planCode: 'SVC_NAME_CORRECTION', billingState: 'Delhi', intake, refCookie: cookie }, {}, db);
    await createCheckout(buyer2, { planCode: 'SVC_NAME_CORRECTION', billingState: 'Delhi', intake, refCookie: refCookieValue(a.code, Date.now() - 40 * DAY) }, {}, db);
    let d = await store.affiliateDashboard(aff.id, db);
    expect(d.stats).toMatchObject({ clicks: 1, sales: 0 }); // nothing counts before payment

    await fulfilPayment(o1.orderId, 'pay_aff_1', db);
    await fulfilPayment(o1.orderId, 'pay_aff_1', db); // webhook repeat – still one commission
    await fulfilPayment(o2.orderId, 'pay_aff_2', db);
    d = await store.affiliateDashboard(aff.id, db);
    expect(d.stats!.sales).toBe(2);
    const link = d.commissions!.find((c) => c.source === 'link')!, coup = d.commissions!.find((c) => c.source === 'coupon')!;
    expect(link).toMatchObject({ salePaise: 1_280_51, ratePercent: 20, commissionPaise: 25_610, status: 'on_hold' }); // 20% of ₹1,511 excl. 18% GST
    expect(coup.salePaise).toBe(1_152_46); // after the 10% coupon, excl. GST
    expect(d.stats!.onHold.INR).toBe(25_610 + 23_049);
    expect((await db.execute(sql`select count(*)::int n from affiliate_commissions`)).rows[0]).toMatchObject({ n: 2 }); // self + expired ignored
    await expect(store.createPayout({ affiliateId: a.id, currency: 'INR' }, db)).rejects.toThrow('NOTHING_TO_PAY'); // still on hold

    // After the hold period: cancel one (refund), pay the rest.
    await db.execute(sql`update affiliate_commissions set earned_at = now() - interval '8 days'`);
    await store.setCommissionStatus(coup.id, 'cancelled', db);
    const p = await store.createPayout({ affiliateId: a.id, currency: 'INR', method: 'UPI', reference: 'UTR123' }, db);
    expect(p).toMatchObject({ commissions: 1, payout: { amountPaise: 25_610, reference: 'UTR123' } });
    d = await store.affiliateDashboard(aff.id, db);
    expect(d.stats).toMatchObject({ sales: 1, paid: { INR: 25_610 }, available: {}, onHold: {} });
    expect(d.payouts).toHaveLength(1);
    await expect(store.setCommissionStatus(link.id, 'cancelled', db)).rejects.toThrow('CANNOT_CHANGE');

    // Admin list shows payout details for paying; suspending switches the coupon off.
    const [row] = await store.listAffiliatesAdmin(db);
    expect(row).toMatchObject({ code: a.code, clicks: 1, orders: 1, payout: { upi: 'ravi@okaxis' } });
    await store.updateAffiliateAdmin(a.id, { status: 'suspended' }, db);
    await expect(validateCoupon(a.code, { code: 'SVC_NAME_CORRECTION', pricePaise: 1_511_00 }, db)).rejects.toThrow('COUPON_INVALID');
    expect((await store.programTotals(db)).affiliates).toMatchObject({ total: 1, approved: 0 });
  });
});
