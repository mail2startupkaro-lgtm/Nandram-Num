/** Checkout: price → coupon → GST split → Razorpay order; fulfilment is idempotent (client verify + webhook). */
import { and, eq, sql } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { coupons, creditLedger, invoiceCounters, payments, subscriptions, users, type Coupon, type Plan, type User } from '@/lib/db/schema';
import { getSetting } from '@/lib/admin/settings';
import { financialYear, GSTIN_RE, splitGstInclusive } from './gst';
import { getPlan } from './plans';
import { createRazorpayOrder, razorpayConfig } from './razorpay';

export class CheckoutError extends Error { constructor(public code: string) { super(code); } }

export async function validateCoupon(code: string, plan: Plan, db: Db = getDb()): Promise<{ coupon: Coupon; discountPaise: number }> {
  const [c] = await db.select().from(coupons).where(eq(coupons.code, code.trim().toUpperCase())).limit(1);
  if (!c || !c.active) throw new CheckoutError('COUPON_INVALID');
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) throw new CheckoutError('COUPON_EXPIRED');
  if (c.maxUses !== null && c.used >= c.maxUses) throw new CheckoutError('COUPON_USED_UP');
  if (c.planCodes?.length && !c.planCodes.includes(plan.code)) throw new CheckoutError('COUPON_NOT_FOR_PLAN');
  let discountPaise = c.percentOff ? Math.round((plan.pricePaise * Math.min(c.percentOff, 100)) / 100) : (c.amountOffPaise ?? 0);
  discountPaise = Math.min(discountPaise, plan.pricePaise - 100); // Razorpay minimum charge ₹1
  return { coupon: c, discountPaise: Math.max(0, discountPaise) };
}

export interface CheckoutInput { planCode: string; coupon?: string; billingName?: string; billingState: string; gstin?: string }

export async function createCheckout(user: User, input: CheckoutInput, opts: { fetchImpl?: typeof fetch } = {}, db: Db = getDb()) {
  const plan = await getPlan(input.planCode, db);
  if (!plan || !plan.active || plan.pricePaise <= 0) throw new CheckoutError('PLAN_UNAVAILABLE');
  const gstin = input.gstin?.trim().toUpperCase() || undefined;
  if (gstin && !GSTIN_RE.test(gstin)) throw new CheckoutError('GSTIN_INVALID');
  const { discountPaise, coupon } = input.coupon ? await validateCoupon(input.coupon, plan, db) : { discountPaise: 0, coupon: null };
  const amountPaise = plan.pricePaise - discountPaise;
  const seller = await getSetting('seller', db);
  const gst = splitGstInclusive(amountPaise, input.billingState, seller.state);
  const cfg = razorpayConfig();
  const receipt = `r_${Date.now().toString(36)}_${user.id.slice(0, 8)}`;
  const order = await createRazorpayOrder(cfg, amountPaise, receipt, { userId: user.id, plan: plan.code }, opts.fetchImpl);
  await db.insert(payments).values({
    userId: user.id, planCode: plan.code, razorpayOrderId: order.id, listPricePaise: plan.pricePaise, discountPaise, amountPaise,
    taxablePaise: gst.taxablePaise, cgstPaise: gst.cgstPaise, sgstPaise: gst.sgstPaise, igstPaise: gst.igstPaise,
    couponCode: coupon?.code ?? null, billingName: input.billingName?.trim().slice(0, 120) || user.name, billingState: input.billingState, gstin,
  });
  if (user.billingState !== input.billingState) await db.update(users).set({ billingState: input.billingState }).where(eq(users.id, user.id));
  return {
    keyId: cfg.keyId, mock: cfg.mock, orderId: order.id, amountPaise, currency: 'INR' as const, discountPaise, plan: { code: plan.code, name: plan.name },
    prefill: { name: input.billingName || user.name || '', email: user.email ?? '', contact: user.phone ?? '' },
  };
}

/** Marks an order paid exactly once and grants what was bought. Safe to call from both the client callback and the webhook. */
export async function fulfilPayment(orderId: string, paymentId: string, db: Db = getDb()) {
  return db.transaction(async (tx) => {
    const locked = await tx.execute(sql`select id from payments where razorpay_order_id = ${orderId} for update`);
    if (!locked.rows.length) throw new CheckoutError('ORDER_NOT_FOUND');
    const [p] = await tx.select().from(payments).where(eq(payments.razorpayOrderId, orderId)).limit(1);
    if (p.status === 'paid') return { payment: p, alreadyPaid: true };

    const plan = await getPlan(p.planCode, tx as unknown as Db);
    if (!plan) throw new CheckoutError('PLAN_UNAVAILABLE');
    const seller = await getSetting('seller', tx as unknown as Db);
    const fy = financialYear();
    const [counter] = await tx.insert(invoiceCounters).values({ fy, last: 1 })
      .onConflictDoUpdate({ target: invoiceCounters.fy, set: { last: sql`${invoiceCounters.last} + 1` } }).returning();
    const invoiceNumber = `${seller.invoicePrefix}/${fy}/${String(counter.last).padStart(5, '0')}`;

    const [paid] = await tx.update(payments).set({ status: 'paid', razorpayPaymentId: paymentId, paidAt: new Date(), invoiceNumber }).where(eq(payments.id, p.id)).returning();
    if (p.couponCode) await tx.update(coupons).set({ used: sql`${coupons.used} + 1` }).where(eq(coupons.code, p.couponCode));
    if (plan.credits > 0) {
      await tx.update(users).set({ credits: sql`${users.credits} + ${plan.credits}` }).where(eq(users.id, p.userId));
      await tx.insert(creditLedger).values({ userId: p.userId, delta: plan.credits, reason: 'purchase', paymentId: p.id });
    }
    if (plan.intervalDays) {
      const [sub] = await tx.select().from(subscriptions).where(eq(subscriptions.userId, p.userId)).limit(1);
      const base = sub && sub.currentPeriodEnd.getTime() > Date.now() ? sub.currentPeriodEnd.getTime() : Date.now(); // renewals extend
      const end = new Date(base + plan.intervalDays * 86_400_000);
      await tx.insert(subscriptions).values({ userId: p.userId, planCode: plan.code, currentPeriodEnd: end })
        .onConflictDoUpdate({ target: subscriptions.userId, set: { planCode: plan.code, currentPeriodEnd: end, updatedAt: new Date() } });
      if ((await tx.select({ role: users.role }).from(users).where(eq(users.id, p.userId)))[0]?.role === 'customer') {
        await tx.update(users).set({ role: 'expert' }).where(eq(users.id, p.userId)); // Pro buyers are consultants
      }
    }
    return { payment: paid, alreadyPaid: false };
  });
}

export async function markPaymentFailed(orderId: string, db: Db = getDb()) {
  await db.update(payments).set({ status: 'failed' }).where(and(eq(payments.razorpayOrderId, orderId), eq(payments.status, 'created')));
}
