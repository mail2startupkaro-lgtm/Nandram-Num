/**
 * Razorpay Payments API integration.
 * Used primarily for International Transactions (USD, EUR, GBP, etc.) or multi-currency checkout.
 * Env / AppSettings:
 *   RAZORPAY_KEY_ID / key_id
 *   RAZORPAY_KEY_SECRET / key_secret
 *   RAZORPAY_WEBHOOK_SECRET / webhook_secret
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const RAZORPAY_ORDER_PREFIX = 'order_';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

export function razorpayConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '';

  if (!keyId || !keySecret) return null;
  return { keyId, keySecret, webhookSecret: webhookSecret || undefined };
}

export const isRazorpayOrder = (orderId: string) => orderId.startsWith(RAZORPAY_ORDER_PREFIX);

async function callRazorpay<T>(
  cfg: RazorpayConfig,
  path: string,
  init: { method?: string; body?: unknown } = {},
  fetchImpl: typeof fetch = fetch
): Promise<T> {
  const auth = Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64');
  const res = await fetchImpl(`https://api.razorpay.com/v1${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    const err = data as { error?: { code?: string; description?: string } } | null;
    throw new Error(`Razorpay ${res.status}: ${err?.error?.code ?? ''} ${err?.error?.description ?? ''}`.trim());
  }

  return data as T;
}

export interface RazorpayOrder {
  id: string;
  entity: 'order';
  amount: number; // in smallest currency unit (paise/cents)
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes?: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentItem {
  id: string;
  entity: 'payment';
  amount: number;
  currency: string;
  status: 'captured' | 'authorized' | 'failed' | 'refunded';
  order_id: string;
  method: string;
  email?: string;
  contact?: string;
}

export async function createRazorpayOrder(
  cfg: RazorpayConfig,
  o: {
    amountPaise: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
  },
  fetchImpl?: typeof fetch
): Promise<RazorpayOrder> {
  return callRazorpay<RazorpayOrder>(
    cfg,
    '/orders',
    {
      method: 'POST',
      body: {
        amount: o.amountPaise,
        currency: o.currency.toUpperCase(),
        receipt: (o.receipt ?? '').slice(0, 40) || undefined,
        notes: o.notes,
      },
    },
    fetchImpl
  );
}

export async function getRazorpayOrder(
  cfg: RazorpayConfig,
  orderId: string,
  fetchImpl?: typeof fetch
): Promise<RazorpayOrder> {
  return callRazorpay<RazorpayOrder>(cfg, `/orders/${encodeURIComponent(orderId)}`, {}, fetchImpl);
}

export async function getRazorpayOrderPayments(
  cfg: RazorpayConfig,
  orderId: string,
  fetchImpl?: typeof fetch
): Promise<{ items: RazorpayPaymentItem[] }> {
  return callRazorpay<{ items: RazorpayPaymentItem[] }>(
    cfg,
    `/orders/${encodeURIComponent(orderId)}/payments`,
    {},
    fetchImpl
  );
}

/**
 * Verify Razorpay frontend payment signature (HMAC SHA256 of order_id + "|" + razorpay_payment_id).
 */
export function verifyRazorpayPaymentSignature(
  cfg: RazorpayConfig,
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!orderId || !paymentId || !signature) return false;
  const expected = createHmac('sha256', cfg.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Verify Razorpay Webhook Signature: HMAC SHA256 of rawBody with webhookSecret.
 */
export function verifyRazorpayWebhookSignature(
  webhookSecret: string,
  rawBody: string,
  signature: string | null | undefined
): boolean {
  if (!signature || !webhookSecret) return false;
  const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}
