import { syncCashfreeOrder } from '@/lib/billing/checkout';
import { cashfreeConfig, isCashfreeOrder, verifyCashfreeWebhook } from '@/lib/billing/cashfree';
import { json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cashfree webhook (Dashboard → Developers → Webhooks → {APP_URL}/api/billing/cashfree/webhook, API version 2023-08-01).
 * Events: PAYMENT_SUCCESS_WEBHOOK, PAYMENT_FAILED_WEBHOOK, PAYMENT_USER_DROPPED_WEBHOOK.
 * The event only tells us which order to look at; the order's real state is fetched from Cashfree.
 */
export async function POST(req: Request) {
  const cfg = cashfreeConfig();
  if (!cfg) return json({ error: 'NOT_CONFIGURED' }, 503);
  const declaredLen = Number(req.headers.get('content-length') ?? 0);
  if (declaredLen > 500_000) return json({ error: 'TOO_LARGE' }, 413);
  const raw = await req.text();
  if (raw.length > 500_000) return json({ error: 'TOO_LARGE' }, 413);
  if (!verifyCashfreeWebhook(cfg, raw, req.headers.get('x-webhook-signature'), req.headers.get('x-webhook-timestamp'))) return json({ error: 'BAD_SIGNATURE' }, 400);
  let evt: { type?: string; data?: { order?: { order_id?: string } } };
  try { evt = JSON.parse(raw); } catch { return json({ error: 'BAD_JSON' }, 400); }
  const orderId = evt.data?.order?.order_id;
  if (!orderId || !isCashfreeOrder(orderId)) return json({ ok: true }); // not ours (e.g. a dashboard test event)
  try {
    await syncCashfreeOrder(orderId);
  } catch (e) {
    if (e instanceof Error && e.message === 'ORDER_NOT_FOUND') return json({ ok: true });
    console.error('cashfree webhook:', e instanceof Error ? e.message.slice(0, 160) : 'unknown');
    return json({ error: 'RETRY' }, 500); // Cashfree retries
  }
  return json({ ok: true });
}
