/**
 * Razorpay Orders + Checkout. Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET.
 * Development without keys uses a local "mock" gateway that signs exactly like Razorpay, so the same
 * verification path is exercised (never available in production).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { randomToken } from '@/lib/security/crypto';

export interface RazorpayConfig { keyId: string; keySecret: string; webhookSecret: string; mock: boolean }

export function razorpayConfig(): RazorpayConfig {
  const keyId = process.env.RAZORPAY_KEY_ID ?? '', keySecret = process.env.RAZORPAY_KEY_SECRET ?? '';
  if (keyId && keySecret) return { keyId, keySecret, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '', mock: false };
  if (process.env.NODE_ENV === 'production') throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are required in production');
  return { keyId: 'rzp_mock', keySecret: 'mock_secret', webhookSecret: 'mock_webhook_secret', mock: true };
}

export interface RazorpayOrder { id: string; amount: number; currency: 'INR'; receipt: string }

export async function createRazorpayOrder(cfg: RazorpayConfig, amountPaise: number, receipt: string, notes: Record<string, string>, fetchImpl: typeof fetch = fetch): Promise<RazorpayOrder> {
  if (cfg.mock) return { id: `order_mock_${randomToken(10)}`, amount: amountPaise, currency: 'INR', receipt };
  const res = await fetchImpl('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { authorization: `Basic ${Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64')}`, 'content-type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes }),
  });
  if (!res.ok) throw new Error(`Razorpay order error ${res.status}`);
  const o = (await res.json()) as RazorpayOrder;
  if (o.amount !== amountPaise) throw new Error('Razorpay order amount mismatch');
  return o;
}

const hmac = (secret: string, data: string) => createHmac('sha256', secret).update(data).digest('hex');
const safeEq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Checkout success handler signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(cfg: RazorpayConfig, orderId: string, paymentId: string, signature: string): boolean {
  return safeEq(hmac(cfg.keySecret, `${orderId}|${paymentId}`), String(signature));
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret) in X-Razorpay-Signature. */
export function verifyWebhookSignature(cfg: RazorpayConfig, rawBody: string, signature: string | null): boolean {
  if (!cfg.webhookSecret || !signature) return false;
  return safeEq(hmac(cfg.webhookSecret, rawBody), signature);
}

export function mockPaymentSignature(cfg: RazorpayConfig, orderId: string) {
  if (!cfg.mock) throw new Error('Mock payments are disabled');
  const paymentId = `pay_mock_${randomToken(10)}`;
  return { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: hmac(cfg.keySecret, `${orderId}|${paymentId}`) };
}
