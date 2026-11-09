/** Checkout: price → coupon → GST split → Cashfree order; fulfilment is idempotent (client verify + webhook). */
import { and, eq, sql } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { coupons, creditLedger, invoiceCounters, payments, subscriptions, users, type Coupon, type Plan, type User } from '@/lib/db/schema';
import { getSetting } from '@/lib/admin/settings';
import { financialYear, GSTIN_RE, splitGstInclusive } from './gst';
import { getPlan } from './plans';
import { CASHFREE_ORDER_PREFIX, cashfreeConfig, cashfreePhone, createCashfreeOrder, getCashfreeOrder, getCashfreePayments, isCashfreeOrder, newCashfreeOrderId, toPaise } from './cashfree';

export class CheckoutError extends Error { constructor(public code: string) { super(code); } }

export async function validateCoupon(code: string, plan: Plan, db: Db = getDb()): Promise<{ coupon: Coupon; discountPaise: number }> {
  const [c] = await db.select().from(coupons).where(eq(coupons.code, code.trim().toUpperCase())).limit(1);
  if (!c || !c.active) throw new CheckoutError('COUPON_INVALID');
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) throw new CheckoutError('COUPON_EXPIRED');
  if (c.maxUses !== null && c.used >= c.maxUses) throw new CheckoutError('COUPON_USED_UP');
  if (c.planCodes?.length && !c.planCodes.includes(plan.code)) throw new CheckoutError('COUPON_NOT_FOR_PLAN');
  let discountPaise = c.percentOff ? Math.round((plan.pricePaise * Math.min(c.percentOff, 100)) / 100) : (c.amountOffPaise ?? 0);
  discountPaise = Math.min(discountPaise, plan.pricePaise - 100); // gateway minimum charge ₹1
  return { coupon: c, discountPaise: Math.max(0, discountPaise) };
}

export interface CheckoutInput { planCode: string; coupon?: string; billingName?: string; billingState: string; gstin?: string; phone?: string }

/** Orders created without gateway keys in development (never in production). */
export const MOCK_ORDER_PREFIX = 'mock_';
export const isMockOrder = (orderId: string) => orderId.startsWith(MOCK_ORDER_PREFIX);

/**
 * Cashfree is the only payment gateway. Without CASHFREE_APP_ID / CASHFREE_SECRET_KEY a local development
 * server uses a test mode ("Simulate payment" button); production refuses to take orders.
 */
export function activeGateway(): 'cashfree' | 'mock' | null {
  if (cashfreeConfig()) return 'cashfree';
  return process.env.NODE_ENV === 'production' ? null : 'mock';
}

const httpsAppUrl = () => { const u = process.env.APP_URL?.trim().replace(/\/$/, ''); return u && u.startsWith('https://') ? u : null; };

export async function createCheckout(user: User, input: CheckoutInput, opts: { fetchImpl?: typeof fetch } = {}, db: Db = getDb()) {
  const plan = await getPlan(input.planCode, db);
  if (!plan || !plan.active || plan.pricePaise <= 0) throw new CheckoutError('PLAN_UNAVAILABLE');
  const gstin = input.gstin?.trim().toUpperCase() || undefined;
  if (gstin && !GSTIN_RE.test(gstin)) throw new CheckoutError('GSTIN_INVALID');
  const { discountPaise, coupon } = input.coupon ? await validateCoupon(input.coupon, plan, db) : { discountPaise: 0, coupon: null };
  const amountPaise = plan.pricePaise - discountPaise;
  const seller = await getSetting('seller', db);
  const gst = splitGstInclusive(amountPaise, input.billingState, seller.state);
  const billingName = input.billingName?.trim().slice(0, 120) || user.name;
  const row = {
    userId: user.id, planCode: plan.code, listPricePaise: plan.pricePaise, discountPaise, amountPaise,
    taxablePaise: gst.taxablePaise, cgstPaise: gst.cgstPaise, sgstPaise: gst.sgstPaise, igstPaise: gst.igstPaise,
    couponCode: coupon?.code ?? null, billingName, billingState: input.billingState, gstin,
  };

  const gateway = activeGateway();
  if (!gateway) throw new CheckoutError('GATEWAY_NOT_CONFIGURED');
  if (gateway === 'cashfree') {
    const cf = cashfreeConfig()!;
    const phone = cashfreePhone(input.phone) ?? cashfreePhone(user.phone);
    if (!phone) throw new CheckoutError('PHONE_REQUIRED');
    const orderId = newCashfreeOrderId();
    const base = httpsAppUrl();
    // Insert first so a webhook can never arrive for an order we don't know.
    await db.insert(payments).values({ ...row, gatewayOrderId: orderId });
    let order;
    try {
      order = await createCashfreeOrder(cf, {
        orderId, amountPaise, customer: { id: user.id, phone, email: user.email, name: billingName },
        returnUrl: base ? `${base}/pricing?cf_order={order_id}` : undefined,
        notifyUrl: base ? `${base}/api/billing/cashfree/webhook` : undefined,
        note: plan.name, tags: { plan: plan.code },
      }, opts.fetchImpl);
    } catch (e) {
      await db.update(payments).set({ status: 'failed' }).where(eq(payments.gatewayOrderId, orderId));
      throw e;
    }
    if (user.billingState !== input.billingState) await db.update(users).set({ billingState: input.billingState }).where(eq(users.id, user.id));
    return {
      gateway: 'cashfree' as const, mode: cf.mode, paymentSessionId: order.payment_session_id, mock: false,
      orderId, amountPaise, currency: 'INR' as const, discountPaise, plan: { code: plan.code, name: plan.name },
      prefill: { name: billingName ?? '', email: user.email ?? '', contact: phone },
    };
  }

  // Development test mode (no keys): the pricing dialog shows a "Simulate payment" button.
  const orderId = `${MOCK_ORDER_PREFIX}${newCashfreeOrderId().slice(CASHFREE_ORDER_PREFIX.length)}`;
  await db.insert(payments).values({ ...row, gatewayOrderId: orderId });
  if (user.billingState !== input.billingState) await db.update(users).set({ billingState: input.billingState }).where(eq(users.id, user.id));
  return {
    gateway: 'mock' as const, mode: 'mock', paymentSessionId: '', mock: true,
    orderId, amountPaise, currency: 'INR' as const, discountPaise, plan: { code: plan.code, name: plan.name },
    prefill: { name: billingName ?? '', email: user.email ?? '', contact: user.phone ?? '' },
  };
}

/** Marks an order paid exactly once and grants what was bought. Safe to call from both the client callback and the webhook. */
export async function fulfilPayment(orderId: string, paymentId: string, db: Db = getDb()) {
  return db.transaction(async (tx) => {
    const locked = await tx.execute(sql`select id from payments where razorpay_order_id = ${orderId} for update`);
    if (!locked.rows.length) throw new CheckoutError('ORDER_NOT_FOUND');
    const [p] = await tx.select().from(payments).where(eq(payments.gatewayOrderId, orderId)).limit(1);
    if (p.status === 'paid') return { payment: p, alreadyPaid: true };

    const plan = await getPlan(p.planCode, tx as unknown as Db);
    if (!plan) throw new CheckoutError('PLAN_UNAVAILABLE');
    const seller = await getSetting('seller', tx as unknown as Db);
    const fy = financialYear();
    const [counter] = await tx.insert(invoiceCounters).values({ fy, last: 1 })
      .onConflictDoUpdate({ target: invoiceCounters.fy, set: { last: sql`${invoiceCounters.last} + 1` } }).returning();
    const invoiceNumber = `${seller.invoicePrefix}/${fy}/${String(counter.last).padStart(5, '0')}`;

    const [paid] = await tx.update(payments).set({ status: 'paid', gatewayPaymentId: paymentId, paidAt: new Date(), invoiceNumber }).where(eq(payments.id, p.id)).returning();
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
  await db.update(payments).set({ status: 'failed' }).where(and(eq(payments.gatewayOrderId, orderId), eq(payments.status, 'created')));
}

/**
 * Asks Cashfree for the real state of an order and records it. Never trusts the browser:
 * the order must be PAID at Cashfree, with a SUCCESS payment for exactly the amount we charged.
 */
export async function syncCashfreeOrder(orderId: string, db: Db = getDb()): Promise<{ status: 'paid' | 'pending' | 'failed'; invoiceNumber?: string | null; paymentId?: string }> {
  if (!isCashfreeOrder(orderId)) throw new CheckoutError('ORDER_NOT_FOUND');
  const cf = cashfreeConfig();
  if (!cf) throw new Error('Cashfree is not configured (CASHFREE_APP_ID / CASHFREE_SECRET_KEY)');
  const [p] = await db.select().from(payments).where(eq(payments.gatewayOrderId, orderId)).limit(1);
  if (!p) throw new CheckoutError('ORDER_NOT_FOUND');
  if (p.status === 'paid') return { status: 'paid', invoiceNumber: p.invoiceNumber, paymentId: p.id };
  const order = await getCashfreeOrder(cf, orderId);
  if (order.order_status === 'PAID') {
    if (toPaise(order.order_amount) !== p.amountPaise) throw new CheckoutError('AMOUNT_MISMATCH');
    const pays = await getCashfreePayments(cf, orderId);
    const ok = pays.find((x) => x.payment_status === 'SUCCESS' && toPaise(x.payment_amount) === p.amountPaise);
    if (!ok) return { status: 'pending' };
    const { payment } = await fulfilPayment(orderId, String(ok.cf_payment_id), db);
    return { status: 'paid', invoiceNumber: payment.invoiceNumber, paymentId: payment.id };
  }
  if (order.order_status === 'EXPIRED' || order.order_status === 'TERMINATED') { await markPaymentFailed(orderId, db); return { status: 'failed' }; }
  // ACTIVE: not paid yet – the customer may still retry inside the same checkout.
  const pays = await getCashfreePayments(cf, orderId).catch(() => [] as { payment_status: string }[]);
  return { status: pays.length && pays.every((x) => ['FAILED', 'USER_DROPPED', 'CANCELLED', 'VOID'].includes(x.payment_status)) ? 'failed' : 'pending' };
}
