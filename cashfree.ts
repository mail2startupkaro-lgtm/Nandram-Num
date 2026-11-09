/**
 * Cashfree Payments (PG API v2023-08-01).
 * Env: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV=production|sandbox (auto-detected from the key if blank).
 *   Create order → payment_session_id → Cashfree JS checkout (modal) → server re-fetches the order from Cashfree
 *   before fulfilling. Webhook: x-webhook-signature = base64(HMAC_SHA256(timestamp + rawBody, secret key)).
 */
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const CASHFREE_API_VERSION = '2023-08-01';
export const CASHFREE_ORDER_PREFIX = 'cf_';

export interface CashfreeConfig { appId: string; secretKey: string; mode: 'production' | 'sandbox'; baseUrl: string }

export function cashfreeConfig(): CashfreeConfig | null {
  const appId = process.env.CASHFREE_APP_ID?.trim() ?? '', secretKey = process.env.CASHFREE_SECRET_KEY?.trim() ?? '';
  if (!appId || !secretKey) return null;
  const env = process.env.CASHFREE_ENV?.trim().toLowerCase();
  const mode = env === 'sandbox' || env === 'test' ? 'sandbox' : env === 'production' || env === 'prod' ? 'production' : /_prod_/.test(secretKey) ? 'production' : 'sandbox';
  return { appId, secretKey, mode, baseUrl: mode === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg' };
}

export const isCashfreeOrder = (orderId: string) => orderId.startsWith(CASHFREE_ORDER_PREFIX);
export const newCashfreeOrderId = () => `${CASHFREE_ORDER_PREFIX}${randomUUID().replace(/-/g, '')}`; // 35 chars, [a-z0-9_]

async function call<T>(cfg: CashfreeConfig, path: string, init: { method?: string; body?: unknown } = {}, fetchImpl: typeof fetch = fetch): Promise<T> {
  const res = await fetchImpl(`${cfg.baseUrl}${path}`, {
    method: init.method ?? 'GET',
    headers: { 'x-client-id': cfg.appId, 'x-client-secret': cfg.secretKey, 'x-api-version': CASHFREE_API_VERSION, 'content-type': 'application/json', accept: 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON error page */ }
  if (!res.ok) {
    const msg = (data as { message?: string; code?: string } | null);
    // Message only – never log credentials or customer data.
    throw new Error(`Cashfree ${res.status}: ${msg?.code ?? ''} ${msg?.message ?? ''}`.trim().slice(0, 200));
  }
  return data as T;
}

export interface CashfreeOrder {
  cf_order_id: string | number; order_id: string; order_amount: number; order_currency: string;
  order_status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'TERMINATED' | 'TERMINATION_REQUESTED'; payment_session_id: string;
}
export interface CashfreePayment { cf_payment_id: string | number; order_id: string; payment_status: string; payment_amount: number; payment_time?: string; payment_group?: string }

export const toPaise = (rupees: number) => Math.round(Number(rupees) * 100);

export async function createCashfreeOrder(cfg: CashfreeConfig, o: {
  orderId: string; amountPaise: number; customer: { id: string; phone: string; email?: string | null; name?: string | null };
  returnUrl?: string; notifyUrl?: string; note?: string; tags?: Record<string, string>;
}, fetchImpl?: typeof fetch): Promise<CashfreeOrder> {
  const order = await call<CashfreeOrder>(cfg, '/orders', {
    method: 'POST',
    body: {
      order_id: o.orderId,
      order_amount: Number((o.amountPaise / 100).toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: o.customer.id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 50) || 'customer',
        customer_phone: o.customer.phone,
        ...(o.customer.email ? { customer_email: o.customer.email } : {}),
        ...(o.customer.name ? { customer_name: o.customer.name.slice(0, 100) } : {}),
      },
      order_meta: { ...(o.returnUrl ? { return_url: o.returnUrl } : {}), ...(o.notifyUrl ? { notify_url: o.notifyUrl } : {}) },
      ...(o.note ? { order_note: o.note.slice(0, 200) } : {}),
      ...(o.tags ? { order_tags: o.tags } : {}),
    },
  }, fetchImpl);
  if (toPaise(order.order_amount) !== o.amountPaise) throw new Error('Cashfree order amount mismatch');
  if (!order.payment_session_id) throw new Error('Cashfree did not return a payment session');
  return order;
}

export const getCashfreeOrder = (cfg: CashfreeConfig, orderId: string, fetchImpl?: typeof fetch) =>
  call<CashfreeOrder>(cfg, `/orders/${encodeURIComponent(orderId)}`, {}, fetchImpl);

export const getCashfreePayments = (cfg: CashfreeConfig, orderId: string, fetchImpl?: typeof fetch) =>
  call<CashfreePayment[]>(cfg, `/orders/${encodeURIComponent(orderId)}/payments`, {}, fetchImpl);

/** Webhook signature check. Replays are harmless: fulfilment re-fetches the order from Cashfree and is idempotent. */
export function verifyCashfreeWebhook(cfg: CashfreeConfig, rawBody: string, signature: string | null, timestamp: string | null): boolean {
  if (!signature || !timestamp) return false;
  const expected = createHmac('sha256', cfg.secretKey).update(timestamp + rawBody).digest('base64');
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Indian 10-digit mobile from "+91XXXXXXXXXX" / "0XXXXXXXXXX" / "XXXXXXXXXX", or null. */
export function cashfreePhone(raw?: string | null): string | null {
  const d = (raw ?? '').replace(/\D/g, '');
  const ten = d.length === 12 && d.startsWith('91') ? d.slice(2) : d.length === 11 && d.startsWith('0') ? d.slice(1) : d;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}
