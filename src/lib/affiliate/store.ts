/**
 * Affiliate program – storage and money logic.
 * Tables are created on first use (also shipped as drizzle/0013_affiliates.sql), so the program works before a migration.
 * Commission hooks never block a checkout or a payment: every call from the billing code is wrapped and only logged.
 */
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { affiliateClicks, affiliateCommissions, affiliatePayouts, affiliates, coupons, users, type Affiliate } from '@/lib/db/schema';
import { getSetting, type AffiliateSettings } from '@/lib/admin/settings';
import { decryptJson, encryptJson } from '@/lib/security/crypto';
import { codeBase, commissionFor, displayStatus, isAvailable, maskPayout, normalizeCode, parseRefCookie, type AffiliateStatus, type PayoutDetails, type PayoutMethod } from './program';

const DDL = [
  `CREATE TABLE IF NOT EXISTS "affiliates" ("id" text PRIMARY KEY DEFAULT gen_random_uuid()::text, "user_id" text NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE, "code" varchar(20) NOT NULL UNIQUE, "status" varchar(12) NOT NULL DEFAULT 'pending', "name" text, "phone" varchar(20), "channel" text, "audience" varchar(40), "promotion" text, "payout_method" varchar(10), "payout_enc" text, "commission_percent" integer, "admin_note" text, "approved_at" timestamp with time zone, "created_at" timestamp with time zone NOT NULL DEFAULT now(), "updated_at" timestamp with time zone NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS "affiliate_clicks" ("id" text PRIMARY KEY DEFAULT gen_random_uuid()::text, "affiliate_id" text NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE, "path" varchar(200), "created_at" timestamp with time zone NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS "affiliate_clicks_aff_idx" ON "affiliate_clicks" ("affiliate_id", "created_at")`,
  `CREATE TABLE IF NOT EXISTS "affiliate_payouts" ("id" text PRIMARY KEY DEFAULT gen_random_uuid()::text, "affiliate_id" text NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE, "currency" varchar(3) NOT NULL DEFAULT 'INR', "amount_paise" integer NOT NULL, "method" varchar(20), "reference" varchar(80), "note" text, "created_at" timestamp with time zone NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS "affiliate_payouts_aff_idx" ON "affiliate_payouts" ("affiliate_id", "created_at")`,
  `CREATE TABLE IF NOT EXISTS "affiliate_commissions" ("id" text PRIMARY KEY DEFAULT gen_random_uuid()::text, "affiliate_id" text NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE, "payment_id" text NOT NULL UNIQUE REFERENCES "payments"("id") ON DELETE CASCADE, "buyer_user_id" text, "plan_code" varchar(30) NOT NULL, "source" varchar(10) NOT NULL, "currency" varchar(3) NOT NULL DEFAULT 'INR', "sale_paise" integer NOT NULL, "rate_percent" integer NOT NULL, "commission_paise" integer NOT NULL, "status" varchar(12) NOT NULL DEFAULT 'awaiting', "earned_at" timestamp with time zone, "paid_at" timestamp with time zone, "payout_id" text, "created_at" timestamp with time zone NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS "affiliate_commissions_aff_idx" ON "affiliate_commissions" ("affiliate_id", "status")`,
];
const ready = new WeakMap<object, Promise<void>>();
export function ensureAffiliateTables(db: Db = getDb()): Promise<void> {
  let p = ready.get(db);
  if (!p) {
    p = (async () => { for (const s of DDL) await db.execute(sql.raw(s)); })();
    p.catch(() => ready.delete(db));
    ready.set(db, p);
  }
  return p;
}

export class AffiliateError extends Error { constructor(code: string, public status = 400) { super(code); } }

const settings = (db: Db) => getSetting('affiliate', db);
const rateOf = (a: Pick<Affiliate, 'commissionPercent'>, s: AffiliateSettings) => a.commissionPercent ?? s.defaultPercent;
const payoutOf = (a: Pick<Affiliate, 'payoutEnc'>): PayoutDetails | null => { try { return a.payoutEnc ? decryptJson<PayoutDetails>(a.payoutEnc) : null; } catch { return null; } };

// ---------------------------------------------------------------- affiliate's own side

export async function getAffiliateByUser(userId: string, db: Db = getDb()) {
  await ensureAffiliateTables(db);
  return (await db.select().from(affiliates).where(eq(affiliates.userId, userId)).limit(1))[0] ?? null;
}

async function codeTaken(code: string, db: Db) {
  const [a] = await db.select({ id: affiliates.id }).from(affiliates).where(eq(affiliates.code, code)).limit(1);
  const [c] = await db.select({ code: coupons.code }).from(coupons).where(eq(coupons.code, code)).limit(1);
  return !!(a || c);
}
async function uniqueCode(name: string | null | undefined, db: Db) {
  const base = codeBase(name);
  for (let i = 0; i < 40; i++) {
    const code = `${base}${10 + Math.floor(Math.random() * (i < 20 ? 90 : 900))}`;
    if (!(await codeTaken(code, db))) return code;
  }
  throw new AffiliateError('CODE_FAILED', 500);
}

export interface ApplyInput { name: string; phone?: string; channel?: string; audience?: string; promotion?: string; payoutMethod?: PayoutMethod; payout?: PayoutDetails }

export async function applyAffiliate(userId: string, input: ApplyInput, db: Db = getDb()) {
  await ensureAffiliateTables(db);
  const s = await settings(db);
  if (!s.enabled) throw new AffiliateError('PROGRAM_CLOSED', 403);
  const existing = await getAffiliateByUser(userId, db);
  if (existing) throw new AffiliateError('ALREADY_APPLIED', 409);
  const code = await uniqueCode(input.name, db);
  const [row] = await db.insert(affiliates).values({
    userId, code, status: 'pending', name: input.name.trim(), phone: input.phone?.trim() || null, channel: input.channel?.trim() || null,
    audience: input.audience || null, promotion: input.promotion?.trim() || null,
    payoutMethod: input.payoutMethod ?? null, payoutEnc: input.payoutMethod && input.payout ? encryptJson(input.payout) : null,
  }).returning();
  return row;
}

export async function updateAffiliateProfile(userId: string, input: Partial<ApplyInput>, db: Db = getDb()) {
  const a = await getAffiliateByUser(userId, db);
  if (!a) throw new AffiliateError('NOT_AFFILIATE', 404);
  const set: Partial<typeof affiliates.$inferInsert> = { updatedAt: new Date() };
  if (input.phone !== undefined) set.phone = input.phone.trim() || null;
  if (input.channel !== undefined) set.channel = input.channel.trim() || null;
  if (input.payoutMethod && input.payout) { set.payoutMethod = input.payoutMethod; set.payoutEnc = encryptJson(input.payout); }
  const [row] = await db.update(affiliates).set(set).where(eq(affiliates.id, a.id)).returning();
  return row;
}

/** Records a click on an approved affiliate's link. Returns false for unknown / inactive codes. */
export async function recordClick(rawCode: string, path: string | undefined, db: Db = getDb()) {
  const code = normalizeCode(rawCode);
  if (!code) return false;
  await ensureAffiliateTables(db);
  const [a] = await db.select({ id: affiliates.id }).from(affiliates).where(and(eq(affiliates.code, code), eq(affiliates.status, 'approved'))).limit(1);
  if (!a) return false;
  await db.insert(affiliateClicks).values({ affiliateId: a.id, path: (path ?? '').slice(0, 200) || null });
  return true;
}

type Sum = Record<string, number>; // currency → paise
const add = (m: Sum, cur: string, v: number) => { m[cur] = (m[cur] ?? 0) + v; };

/** Everything the affiliate dashboard shows. */
export async function affiliateDashboard(userId: string, db: Db = getDb()) {
  const a = await getAffiliateByUser(userId, db);
  const s = await settings(db);
  if (!a) return { affiliate: null, settings: s };
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const [clicks] = await db.select({ all: sql<number>`count(*)::int`, d30: sql<number>`count(*) filter (where ${affiliateClicks.createdAt} >= ${since30})::int` }).from(affiliateClicks).where(eq(affiliateClicks.affiliateId, a.id));
  const rows = await db.select().from(affiliateCommissions).where(and(eq(affiliateCommissions.affiliateId, a.id), inArray(affiliateCommissions.status, ['pending', 'paid', 'cancelled']))).orderBy(desc(affiliateCommissions.earnedAt)).limit(300);
  const onHold: Sum = {}, available: Sum = {}, paid: Sum = {};
  let sales = 0;
  for (const c of rows) {
    if (c.status === 'cancelled') continue;
    sales++;
    const st = displayStatus(c, s.holdDays);
    add(st === 'available' ? available : st === 'paid' ? paid : onHold, c.currency, c.commissionPaise);
  }
  const payouts = await db.select().from(affiliatePayouts).where(eq(affiliatePayouts.affiliateId, a.id)).orderBy(desc(affiliatePayouts.createdAt)).limit(100);
  return {
    affiliate: {
      code: a.code, status: a.status as AffiliateStatus, name: a.name, phone: a.phone, channel: a.channel, ratePercent: rateOf(a, s),
      payoutMethod: a.payoutMethod, payoutMasked: maskPayout(a.payoutMethod, payoutOf(a)), createdAt: a.createdAt, approvedAt: a.approvedAt,
    },
    settings: s,
    stats: { clicks: clicks?.all ?? 0, clicks30: clicks?.d30 ?? 0, sales, onHold, available, paid },
    commissions: rows.slice(0, 100).map((c) => ({ id: c.id, planCode: c.planCode, source: c.source, currency: c.currency, salePaise: c.salePaise, ratePercent: c.ratePercent, commissionPaise: c.commissionPaise, status: displayStatus(c, s.holdDays), earnedAt: c.earnedAt, paidAt: c.paidAt })),
    payouts: payouts.map((p) => ({ id: p.id, currency: p.currency, amountPaise: p.amountPaise, method: p.method, reference: p.reference, createdAt: p.createdAt })),
  };
}

// ---------------------------------------------------------------- billing hooks

export interface AttributionInput { paymentId: string; buyerUserId: string; planCode: string; currency: string; taxablePaise: number; couponCode?: string | null; refCookie?: string | null }

/**
 * Called at checkout (after the payment row exists). Links the order to an affiliate – coupon code first, then the
 * referral cookie – as an "awaiting" commission that only counts once the payment succeeds.
 */
export async function attributeCheckout(x: AttributionInput, db: Db = getDb()) {
  await ensureAffiliateTables(db);
  const s = await settings(db);
  if (!s.enabled || x.taxablePaise <= 0) return null;
  const find = async (code: string | null) => (code ? (await db.select().from(affiliates).where(and(eq(affiliates.code, code), eq(affiliates.status, 'approved'))).limit(1))[0] ?? null : null);
  let source: 'coupon' | 'link' = 'coupon';
  let a = await find(normalizeCode(x.couponCode));
  if (!a) { source = 'link'; a = await find(parseRefCookie(x.refCookie, s.cookieDays)); }
  if (!a || a.userId === x.buyerUserId) return null; // no self-referrals
  const rate = rateOf(a, s);
  const [row] = await db.insert(affiliateCommissions).values({
    affiliateId: a.id, paymentId: x.paymentId, buyerUserId: x.buyerUserId, planCode: x.planCode, source, currency: x.currency,
    salePaise: x.taxablePaise, ratePercent: rate, commissionPaise: commissionFor(x.taxablePaise, rate), status: 'awaiting',
  }).onConflictDoNothing().returning();
  return row ?? null;
}

/** Called after a payment is marked paid (idempotent): the awaiting commission is now earned. */
export async function markCommissionEarned(paymentId: string, db: Db = getDb()) {
  await ensureAffiliateTables(db);
  await db.update(affiliateCommissions).set({ status: 'pending', earnedAt: new Date() }).where(and(eq(affiliateCommissions.paymentId, paymentId), eq(affiliateCommissions.status, 'awaiting')));
}

// ---------------------------------------------------------------- admin

export async function listAffiliatesAdmin(db: Db = getDb()) {
  await ensureAffiliateTables(db);
  const s = await settings(db);
  const list = await db.select({ a: affiliates, email: users.email, userPhone: users.phone }).from(affiliates).innerJoin(users, eq(users.id, affiliates.userId)).orderBy(desc(affiliates.createdAt)).limit(1000);
  const ids = list.map((x) => x.a.id);
  const clicks = ids.length ? await db.select({ id: affiliateClicks.affiliateId, n: sql<number>`count(*)::int` }).from(affiliateClicks).where(inArray(affiliateClicks.affiliateId, ids)).groupBy(affiliateClicks.affiliateId) : [];
  const comms = ids.length ? await db.select().from(affiliateCommissions).where(and(inArray(affiliateCommissions.affiliateId, ids), inArray(affiliateCommissions.status, ['pending', 'paid']))) : [];
  return list.map(({ a, email, userPhone }) => {
    const mine = comms.filter((c) => c.affiliateId === a.id);
    const onHold: Sum = {}, available: Sum = {}, paid: Sum = {}, sales: Sum = {};
    for (const c of mine) { const st = displayStatus(c, s.holdDays); add(st === 'available' ? available : st === 'paid' ? paid : onHold, c.currency, c.commissionPaise); add(sales, c.currency, c.salePaise); }
    return {
      id: a.id, code: a.code, status: a.status, name: a.name, email, phone: a.phone ?? userPhone, channel: a.channel, audience: a.audience, promotion: a.promotion,
      commissionPercent: a.commissionPercent, ratePercent: rateOf(a, s), adminNote: a.adminNote, createdAt: a.createdAt, approvedAt: a.approvedAt,
      payoutMethod: a.payoutMethod, payout: payoutOf(a), clicks: clicks.find((c) => c.id === a.id)?.n ?? 0, orders: mine.length, sales, onHold, available, paid,
    };
  });
}

async function setCoupon(code: string, active: boolean, db: Db) {
  const s = await settings(db);
  if (active && s.customerDiscountPercent > 0) {
    await db.insert(coupons).values({ code, percentOff: s.customerDiscountPercent, active: true })
      .onConflictDoUpdate({ target: coupons.code, set: { percentOff: s.customerDiscountPercent, amountOffPaise: null, active: true } });
  } else {
    await db.update(coupons).set({ active: false }).where(eq(coupons.code, code));
  }
}

export interface AdminUpdate { status?: AffiliateStatus; code?: string; commissionPercent?: number | null; adminNote?: string }
export async function updateAffiliateAdmin(id: string, u: AdminUpdate, db: Db = getDb()) {
  await ensureAffiliateTables(db);
  const [a] = await db.select().from(affiliates).where(eq(affiliates.id, id)).limit(1);
  if (!a) throw new AffiliateError('NOT_FOUND', 404);
  const set: Partial<typeof affiliates.$inferInsert> = { updatedAt: new Date() };
  let code = a.code;
  if (u.code !== undefined) {
    const c = normalizeCode(u.code);
    if (!c) throw new AffiliateError('CODE_INVALID');
    if (c !== a.code) {
      if (await codeTaken(c, db)) throw new AffiliateError('CODE_TAKEN', 409);
      await db.update(coupons).set({ active: false }).where(eq(coupons.code, a.code)); // the old code stops working
      set.code = code = c;
    }
  }
  if (u.commissionPercent !== undefined) set.commissionPercent = u.commissionPercent;
  if (u.adminNote !== undefined) set.adminNote = u.adminNote.trim() || null;
  const status = u.status ?? a.status;
  if (u.status) { set.status = u.status; if (u.status === 'approved' && !a.approvedAt) set.approvedAt = new Date(); }
  const [row] = await db.update(affiliates).set(set).where(eq(affiliates.id, id)).returning();
  if (u.status || set.code) await setCoupon(code, status === 'approved', db);
  return row;
}

export async function listCommissionsAdmin(filter: { status?: string; affiliateId?: string } = {}, db: Db = getDb()) {
  await ensureAffiliateTables(db);
  const s = await settings(db);
  const statuses = filter.status && filter.status !== 'all' ? (filter.status === 'available' || filter.status === 'on_hold' ? ['pending'] : [filter.status]) : ['pending', 'paid', 'cancelled'];
  const rows = await db.select({ c: affiliateCommissions, code: affiliates.code, name: affiliates.name }).from(affiliateCommissions).innerJoin(affiliates, eq(affiliates.id, affiliateCommissions.affiliateId))
    .where(and(inArray(affiliateCommissions.status, statuses), filter.affiliateId ? eq(affiliateCommissions.affiliateId, filter.affiliateId) : undefined))
    .orderBy(desc(affiliateCommissions.earnedAt)).limit(500);
  return rows.map(({ c, code, name }) => ({ ...c, code, name, display: displayStatus(c, s.holdDays) }))
    .filter((x) => !['available', 'on_hold'].includes(filter.status ?? '') || x.display === filter.status);
}

/** Cancel (refund / fraud) or restore a commission. Paid commissions cannot be changed. */
export async function setCommissionStatus(id: string, status: 'cancelled' | 'pending', db: Db = getDb()) {
  await ensureAffiliateTables(db);
  const [c] = await db.select().from(affiliateCommissions).where(eq(affiliateCommissions.id, id)).limit(1);
  if (!c) throw new AffiliateError('NOT_FOUND', 404);
  if (c.status === 'paid' || c.status === 'awaiting') throw new AffiliateError('CANNOT_CHANGE', 409);
  const [row] = await db.update(affiliateCommissions).set({ status, earnedAt: c.earnedAt ?? new Date() }).where(eq(affiliateCommissions.id, id)).returning();
  return row;
}

/** Pays every available commission of one affiliate in one currency and records the transfer. */
export async function createPayout(input: { affiliateId: string; currency: 'INR' | 'USD'; method?: string; reference?: string; note?: string }, db: Db = getDb()) {
  await ensureAffiliateTables(db);
  const s = await settings(db);
  return db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    await tx.execute(sql`select id from affiliates where id = ${input.affiliateId} for update`);
    const due = (await t.select().from(affiliateCommissions).where(and(eq(affiliateCommissions.affiliateId, input.affiliateId), eq(affiliateCommissions.status, 'pending'), eq(affiliateCommissions.currency, input.currency))))
      .filter((c) => isAvailable(c, s.holdDays));
    const amount = due.reduce((x, c) => x + c.commissionPaise, 0);
    if (!due.length || amount <= 0) throw new AffiliateError('NOTHING_TO_PAY', 409);
    const [p] = await t.insert(affiliatePayouts).values({ affiliateId: input.affiliateId, currency: input.currency, amountPaise: amount, method: input.method?.trim() || null, reference: input.reference?.trim() || null, note: input.note?.trim() || null }).returning();
    await t.update(affiliateCommissions).set({ status: 'paid', paidAt: new Date(), payoutId: p.id }).where(inArray(affiliateCommissions.id, due.map((c) => c.id)));
    return { payout: p, commissions: due.length };
  });
}

export async function listPayoutsAdmin(db: Db = getDb()) {
  await ensureAffiliateTables(db);
  return db.select({ p: affiliatePayouts, code: affiliates.code, name: affiliates.name }).from(affiliatePayouts).innerJoin(affiliates, eq(affiliates.id, affiliatePayouts.affiliateId)).orderBy(desc(affiliatePayouts.createdAt)).limit(300);
}

/** Program totals for the admin header. */
export async function programTotals(db: Db = getDb()) {
  await ensureAffiliateTables(db);
  const s = await settings(db);
  const [counts] = await db.select({ total: sql<number>`count(*)::int`, pending: sql<number>`count(*) filter (where status = 'pending')::int`, approved: sql<number>`count(*) filter (where status = 'approved')::int` }).from(affiliates);
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const [clicks] = await db.select({ n: sql<number>`count(*)::int` }).from(affiliateClicks).where(gte(affiliateClicks.createdAt, since30));
  const comms = await db.select().from(affiliateCommissions).where(inArray(affiliateCommissions.status, ['pending', 'paid']));
  const sales: Sum = {}, onHold: Sum = {}, available: Sum = {}, paid: Sum = {};
  for (const c of comms) { add(sales, c.currency, c.salePaise); const st = displayStatus(c, s.holdDays); add(st === 'available' ? available : st === 'paid' ? paid : onHold, c.currency, c.commissionPaise); }
  return { affiliates: counts ?? { total: 0, pending: 0, approved: 0 }, clicks30: clicks?.n ?? 0, orders: comms.length, sales, onHold, available, paid };
}
