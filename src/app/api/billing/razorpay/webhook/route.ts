import { fulfilPayment, markPaymentFailed } from '@/lib/billing/checkout';
import { isRazorpayOrder, razorpayConfig, verifyRazorpayWebhookSignature } from '@/lib/billing/razorpay';
import { json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Razorpay Webhook Handler
 * Endpoint: /api/billing/razorpay/webhook
 * Handled events:
 *   - order.paid
 *   - payment.captured
 *   - payment.failed
 */
export async function POST(req: Request) {
  const cfg = razorpayConfig();
  if (!cfg) return json({ error: 'NOT_CONFIGURED' }, 503);

  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (cfg.webhookSecret) {
    const valid = verifyRazorpayWebhookSignature(cfg.webhookSecret, raw, signature);
    if (!valid) return json({ error: 'BAD_SIGNATURE' }, 400);
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; status?: string } };
      order?: { entity?: { id?: string; status?: string } };
    };
  };

  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: 'BAD_JSON' }, 400);
  }

  const paymentEntity = event.payload?.payment?.entity;
  const orderEntity = event.payload?.order?.entity;
  const orderId = paymentEntity?.order_id || orderEntity?.id;
  const paymentId = paymentEntity?.id;

  if (!orderId || !isRazorpayOrder(orderId)) {
    return json({ ok: true }); // ignore test or unrelated events
  }

  try {
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      if (paymentId) {
        await fulfilPayment(orderId, paymentId);
      }
    } else if (event.event === 'payment.failed') {
      await markPaymentFailed(orderId);
    }
  } catch (e) {
    console.error('Razorpay webhook processing error:', e);
    return json({ error: 'RETRY' }, 500);
  }

  return json({ ok: true });
}
