/** Checkout: price → coupon → GST split → Cashfree order; fulfilment is idempotent (client verify + webhook). */
import { and, eq, sql } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { coupons, creditLedger, invoiceCounters, payments, subscriptions, users, type Coupon, type Plan, type User } from '@/lib/db/schema';
import { getSetting } from '@/lib/admin/settings';
import { financialYear, GSTIN_RE, splitGstInclusive } from './gst';
import { getPlan } from './plans';
import { intlPhone, OUTSIDE_INDIA, planPrice, serviceUsd, type Currency } from './currency';
import { getPerson } from '@/lib/db/repo/people';
import { createServiceOrder, getService, isPayable, isServiceCode, markServiceOrderPaid, parseIntake } from './services';
import { CASHFREE_ORDER_PREFIX, cashfreeConfig, cashfreePhone, createCashfreeOrder, getCashfreeOrder, getCashfreePayments, isCashfreeOrder, newCashfreeOrderId, toPaise } from './cashfree';
import { createRazorpayOrder, getRazorpayOrder, getRazorpayOrderPayments, isRazorpayOrder, razorpayConfig, verifyRazorpayPaymentSignature } from './razorpay';

export class CheckoutError extends Error { constructor(public code: string) { super(code); } }

/** `plan.pricePaise` is the price in the checkout currency's minor unit; fixed-amount (₹) coupons only apply to INR orders. */
export async function validateCoupon(code: string, plan: Pick<Plan, 'code' | 'pricePaise'>, db: Db = getDb(), currency: Currency = 'INR'): Promise<{ coupon: Coupon; discountPaise: number }> {
  const [c] = await db.select().from(coupons).where(eq(coupons.code, code.trim().toUpperCase())).limit(1);
  if (!c || !c.active) throw new CheckoutError('COUPON_INVALID');
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) throw new CheckoutError('COUPON_EXPIRED');
  if (c.maxUses !== null && c.used >= c.maxUses) throw new CheckoutError('COUPON_USED_UP');
  if (c.planCodes?.length && !c.planCodes.includes(plan.code)) throw new CheckoutError('COUPON_NOT_FOR_PLAN');
  if (currency !== 'INR' && !c.percentOff) throw new CheckoutError('COUPON_NOT_FOR_CURRENCY');
  let discountPaise = c.percentOff ? Math.round((plan.pricePaise * Math.min(c.percentOff, 100)) / 100) : (c.amountOffPaise ?? 0);
  discountPaise = Math.min(discountPaise, plan.pricePaise - 100); // gateway minimum charge ₹1 / $1
  return { coupon: c, discountPaise: Math.max(0, discountPaise) };
}

export interface CheckoutInput { planCode: string; coupon?: string; billingName?: string; billingState: string; gstin?: string; phone?: string; intake?: unknown; currency?: Currency; /** Saved person (self / family member) the service is for. */ profileId?: string; /** One signature photo (data URL), Signature Analysis only. */ signatureImage?: string }

/** What is being bought: a report plan (credits / Pro) or an expert service (SVC_…). */
export async function getPurchasable(code: string, db: Db = getDb(), want: Currency = 'INR') {
  if (isServiceCode(code)) {
    const s = await getService(code, db);
    if (!s || !isPayable(s)) return null;
    const usd = want === 'USD' ? serviceUsd(s).usd : null; // admin's $ fee, else the standard $ fee
    return { kind: 'service' as const, code: s.code, name: s.en.name, pricePaise: usd ?? s.pricePaise, currency: (usd ? 'USD' : 'INR') as Currency, service: s };
  }
  const plan = await getPlan(code, db);
  if (!plan || !plan.active || plan.pricePaise <= 0) return null;
  const price = planPrice(plan, want); // USD only when the admin set a USD price for this plan
  return { kind: 'plan' as const, code: plan.code, name: plan.name, pricePaise: price.price, currency: price.currency, plan };
}

/** Orders created without gateway keys in development (never in production). */
export const MOCK_ORDER_PREFIX = 'mock_';
export const isMockOrder = (orderId: string) => orderId.startsWith(MOCK_ORDER_PREFIX);

/**
 * Active gateway determined per order currency and configuration:
 * - If USD or client outside India and Razorpay is configured -> razorpay
 * - If Cashfree is configured -> cashfree
 * - If Razorpay is configured -> razorpay
 * - Mock in development
 */
export function activeGateway(currency: Currency = 'INR', billingState?: string): 'cashfree' | 'razorpay' | 'mock' | null {
  const rzp = razorpayConfig();
  const cf = cashfreeConfig();

  // For international transactions (USD or Outside India), prioritize Razorpay if available
  if ((currency === 'USD' || billingState === OUTSIDE_INDIA) && rzp) {
    return 'razorpay';
  }

  if (cf) return 'cashfree';
  if (rzp) return 'razorpay';

  if (process.env.ALLOW_MOCK_PAYMENTS === '1' || process.env.ALLOW_MOCK_PAYMENTS === 'true') return 'mock';
  return process.env.NODE_ENV === 'production' ? null : 'mock';
}

const httpsAppUrl = () => { const u = process.env.APP_URL?.trim().replace(/\/$/, ''); return u && u.startsWith('https://') ? u : null; };

export async function createCheckout(user: User, input: CheckoutInput, opts: { fetchImpl?: typeof fetch } = {}, db: Db = getDb()) {
  const plan = await getPurchasable(input.planCode, db, input.currency ?? 'INR');
  if (!plan) throw new CheckoutError('PLAN_UNAVAILABLE');
  const currency = plan.currency;
  if (currency === 'USD') input = { ...input, gstin: undefined }; // GSTIN is for Indian business invoices only
  // Services need the client's details (name, date of birth…) before payment, validated per service.
  const intake = plan.kind === 'service' ? (() => { try { return parseIntake(plan.service, input.intake); } catch { throw new CheckoutError('DETAILS_INVALID'); } })() : null;
  if (intake && input.profileId) {
    const person = await getPerson(user.id, input.profileId, db).catch(() => { throw new CheckoutError('PERSON_NOT_FOUND'); });
    intake.forProfileId = person.id; intake.forRelation = person.relation;
  }
  // Added after parseIntake on purpose: its number masking must not touch the image data.
  if (intake && plan.kind === 'service' && plan.service.code === 'SVC_SIGNATURE' && input.signatureImage) intake.signatureImage = input.signatureImage;
  const returnPath = plan.kind === 'service' ? '/services' : '/pricing';
  const gstin = input.gstin?.trim().toUpperCase() || undefined;
  if (gstin && !GSTIN_RE.test(gstin)) throw new CheckoutError('GSTIN_INVALID');
  if (input.billingState === OUTSIDE_INDIA && gstin) throw new CheckoutError('GSTIN_INVALID');
  const { discountPaise, coupon } = input.coupon ? await validateCoupon(input.coupon, plan, db, currency) : { discountPaise: 0, coupon: null };
  const amountPaise = plan.pricePaise - discountPaise;
  const seller = await getSetting('seller', db);
  const gst = splitGstInclusive(amountPaise, input.billingState, seller.state);
  const billingName = input.billingName?.trim().slice(0, 120) || user.name;
  const row = {
    userId: user.id, planCode: plan.code, currency, listPricePaise: plan.pricePaise, discountPaise, amountPaise,
    taxablePaise: gst.taxablePaise, cgstPaise: gst.cgstPaise, sgstPaise: gst.sgstPaise, igstPaise: gst.igstPaise,
    couponCode: coupon?.code ?? null, billingName, billingState: input.billingState, gstin,
  };

  const gateway = activeGateway(currency, input.billingState);
  if (!gateway) {
    console.error('[Billing] Payment gateway not configured. Please ensure CASHFREE_APP_ID/CASHFREE_SECRET_KEY or RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are set.');
    throw new CheckoutError('GATEWAY_NOT_CONFIGURED');
  }

  if (gateway === 'razorpay') {
    const rzp = razorpayConfig()!;
    const phone = cashfreePhone(input.phone) ?? cashfreePhone(user.phone) ?? intlPhone(input.phone) ?? intlPhone(user.phone);
    let order;
    try {
      order = await createRazorpayOrder(rzp, {
        amountPaise,
        currency,
        receipt: `rcpt_${Date.now()}`.slice(0, 40),
        notes: { planCode: plan.code, planName: plan.name, userId: user.id },
      }, opts.fetchImpl);
    } catch (e) {
      console.error('[Billing] Razorpay order creation failed:', e);
      throw e;
    }
    const [inserted] = await db.insert(payments).values({ ...row, gatewayOrderId: order.id }).returning({ id: payments.id });
    if (intake) await createServiceOrder(inserted.id, user.id, plan.code, intake, db);
    if (user.billingState !== input.billingState) await db.update(users).set({ billingState: input.billingState }).where(eq(users.id, user.id));

    return {
      gateway: 'razorpay' as const,
      keyId: rzp.keyId,
      orderId: order.id,
      amountPaise,
      currency,
      discountPaise,
      plan: { code: plan.code, name: plan.name },
      mock: false,
      paymentSessionId: order.id,
      prefill: { name: billingName ?? '', email: user.email ?? '', contact: phone ?? '' },
    };
  }

  if (gateway === 'cashfree') {
    const cf = cashfreeConfig()!;
    const phone = cashfreePhone(input.phone) ?? cashfreePhone(user.phone) ?? intlPhone(input.phone) ?? intlPhone(user.phone);
    if (!phone) throw new CheckoutError('PHONE_REQUIRED');
    const orderId = newCashfreeOrderId();
    const base = httpsAppUrl();
    // Insert first so a webhook can never arrive for an order we don't know.
    const [inserted] = await db.insert(payments).values({ ...row, gatewayOrderId: orderId }).returning({ id: payments.id });
    if (intake) await createServiceOrder(inserted.id, user.id, plan.code, intake, db);
    let order;
    try {
      order = await createCashfreeOrder(cf, {
        orderId, amountPaise, currency, customer: { id: user.id, phone, email: user.email, name: billingName },
        returnUrl: base ? `${base}${returnPath}?cf_order={order_id}` : undefined,
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
      orderId, amountPaise, currency, discountPaise, plan: { code: plan.code, name: plan.name },
      prefill: { name: billingName ?? '', email: user.email ?? '', contact: phone },
    };
  }

  // Development test mode (no keys): the pricing dialog shows a "Simulate payment" button.
  const orderId = `${MOCK_ORDER_PREFIX}${newCashfreeOrderId().slice(CASHFREE_ORDER_PREFIX.length)}`;
  const [inserted] = await db.insert(payments).values({ ...row, gatewayOrderId: orderId }).returning({ id: payments.id });
  if (intake) await createServiceOrder(inserted.id, user.id, plan.code, intake, db);
  if (user.billingState !== input.billingState) await db.update(users).set({ billingState: input.billingState }).where(eq(users.id, user.id));
  return {
    gateway: 'mock' as const, mode: 'mock', paymentSessionId: '', mock: true,
    orderId, amountPaise, currency, discountPaise, plan: { code: plan.code, name: plan.name },
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

    // A paid service keeps its row even if the service was later edited or switched off.
    const plan = isServiceCode(p.planCode) ? { credits: 0, intervalDays: null as number | null, code: p.planCode } : await getPlan(p.planCode, tx as unknown as Db);
    if (!plan) throw new CheckoutError('PLAN_UNAVAILABLE');
    const seller = await getSetting('seller', tx as unknown as Db);
    const fy = financialYear();
    const [counter] = await tx.insert(invoiceCounters).values({ fy, last: 1 })
      .onConflictDoUpdate({ target: invoiceCounters.fy, set: { last: sql`${invoiceCounters.last} + 1` } }).returning();
    const invoiceNumber = `${seller.invoicePrefix}/${fy}/${String(counter.last).padStart(5, '0')}`;

    const [paid] = await tx.update(payments).set({ status: 'paid', gatewayPaymentId: paymentId, paidAt: new Date(), invoiceNumber }).where(eq(payments.id, p.id)).returning();
    if (isServiceCode(p.planCode)) await markServiceOrderPaid(p.id, tx as unknown as Db);
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

/**
 * Verifies and syncs a Razorpay payment after checkout callback.
 */
export async function syncRazorpayOrder(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}, db: Db = getDb()): Promise<{ status: 'paid' | 'pending' | 'failed'; invoiceNumber?: string | null; paymentId?: string }> {
  const { orderId, paymentId, signature } = params;
  if (!isRazorpayOrder(orderId)) throw new CheckoutError('ORDER_NOT_FOUND');
  const rzp = razorpayConfig();
  if (!rzp) throw new Error('Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)');

  const [p] = await db.select().from(payments).where(eq(payments.gatewayOrderId, orderId)).limit(1);
  if (!p) throw new CheckoutError('ORDER_NOT_FOUND');
  if (p.status === 'paid') return { status: 'paid', invoiceNumber: p.invoiceNumber, paymentId: p.id };

  const valid = verifyRazorpayPaymentSignature(rzp, orderId, paymentId, signature);
  if (!valid) {
    console.error(`[Razorpay] Invalid payment signature for order ${orderId}`);
    return { status: 'failed' };
  }

  // The signature only proves the browser saw this payment; the money state always comes from Razorpay.
  return syncRazorpayFromGateway(orderId, db, paymentId);
}

/**
 * Asks Razorpay for the real state of an order and records it (used by the client verify and the webhook).
 * Never trusts the browser or the webhook body: the order must be paid at Razorpay, in the currency we charged,
 * with a CAPTURED payment for exactly the amount we charged. An "authorized" payment is not money received
 * (Razorpay voids uncaptured payments), so it stays pending until the payment.captured webhook arrives.
 */
export async function syncRazorpayFromGateway(orderId: string, db: Db = getDb(), preferPaymentId?: string): Promise<{ status: 'paid' | 'pending' | 'failed'; invoiceNumber?: string | null; paymentId?: string }> {
  if (!isRazorpayOrder(orderId)) throw new CheckoutError('ORDER_NOT_FOUND');
  const rzp = razorpayConfig();
  if (!rzp) throw new Error('Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)');
  const [p] = await db.select().from(payments).where(eq(payments.gatewayOrderId, orderId)).limit(1);
  if (!p) throw new CheckoutError('ORDER_NOT_FOUND');
  if (p.status === 'paid') return { status: 'paid', invoiceNumber: p.invoiceNumber, paymentId: p.id };

  const rzpOrder = await getRazorpayOrder(rzp, orderId);
  if (rzpOrder.amount !== p.amountPaise || rzpOrder.currency.toUpperCase() !== String(p.currency ?? 'INR').toUpperCase()) throw new CheckoutError('AMOUNT_MISMATCH');

  const pays = await getRazorpayOrderPayments(rzp, orderId);
  const good = (x: { status: string; amount: number; currency: string }) =>
    x.status === 'captured' && x.amount === p.amountPaise && x.currency.toUpperCase() === rzpOrder.currency.toUpperCase();
  const ok = pays.items.find((x) => x.id === preferPaymentId && good(x)) ?? pays.items.find(good);
  if (ok) {
    const { payment } = await fulfilPayment(orderId, ok.id, db);
    return { status: 'paid', invoiceNumber: payment.invoiceNumber, paymentId: payment.id };
  }
  // A failed attempt does not end the order: the customer can retry inside the same checkout.
  return { status: pays.items.length && pays.items.every((x) => x.status === 'failed') ? 'failed' : 'pending' };
}
