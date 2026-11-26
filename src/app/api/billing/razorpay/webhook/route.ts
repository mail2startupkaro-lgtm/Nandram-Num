import { syncRazorpayFromGateway } from '@/lib/billing/checkout';
import { isRazorpayOrder, razorpayConfig, verifyRazorpayWebhookSignature } from '@/lib/billing/razorpay';
import { json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Razorpay Webhook Handler
 * Endpoint: /api/billing/razorpay/webhook (Dashboard → Webhooks, with a secret = RAZORPAY_WEBHOOK_SECRET)
 * Events: order.paid, payment.captured, payment.failed.
 * The event only tells us which order to look at; the order's real state is fetched from Razorpay
 * (same rule as the Cashfree webhook). Requests without a valid signature are always rejected.
 */
export async function POST(req: Request) {
  const cfg = razorpayConfig();
  if (!cfg) return json({ error: 'NOT_CONFIGURED' }, 503);
  if (!cfg.webhookSecret) {
    console.error('[Razorpay] RAZORPAY_WEBHOOK_SECRET is not set – webhook rejected. Payments are still confirmed by the checkout callback.');
    return json({ error: 'WEBHOOK_SECRET_NOT_CONFIGURED' }, 503);
  }

  const declaredLen = Number(req.headers.get('content-length') ?? 0);
  if (declaredLen > 500_000) return json({ error: 'TOO_LARGE' }, 413);
  const raw = await req.text();
  if (raw.length > 500_000) return json({ error: 'TOO_LARGE' }, 413);
  if (!verifyRazorpayWebhookSignature(cfg.webhookSecret, raw, req.headers.get('x-razorpay-signature'))) {
    return json({ error: 'BAD_SIGNATURE' }, 400);
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: 'BAD_JSON' }, 400);
  }

  const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;
  if (!orderId || !isRazorpayOrder(orderId)) return json({ ok: true }); // test or unrelated event

  if (!['order.paid', 'payment.captured', 'payment.failed'].includes(event.event ?? '')) return json({ ok: true });

  try {
    await syncRazorpayFromGateway(orderId, undefined, event.payload?.payment?.entity?.id);
  } catch (e) {
    if (e instanceof Error && e.message === 'ORDER_NOT_FOUND') return json({ ok: true });
    console.error('Razorpay webhook processing error:', e instanceof Error ? e.message.slice(0, 160) : 'unknown');
    return json({ error: 'RETRY' }, 500); // Razorpay retries
  }
  return json({ ok: true });
}
