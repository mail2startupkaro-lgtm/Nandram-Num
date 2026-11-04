import { fulfilPayment, markPaymentFailed } from '@/lib/billing/checkout';
import { razorpayConfig, verifyWebhookSignature } from '@/lib/billing/razorpay';
import { json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Razorpay webhook (Dashboard → Webhooks): events payment.captured, order.paid, payment.failed. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(razorpayConfig(), raw, req.headers.get('x-razorpay-signature'))) return json({ error: 'BAD_SIGNATURE' }, 400);
  let evt: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try { evt = JSON.parse(raw); } catch { return json({ error: 'BAD_JSON' }, 400); }
  const pay = evt.payload?.payment?.entity;
  try {
    if ((evt.event === 'payment.captured' || evt.event === 'order.paid') && pay?.order_id && pay.id) await fulfilPayment(pay.order_id, pay.id);
    else if (evt.event === 'payment.failed' && pay?.order_id) await markPaymentFailed(pay.order_id);
  } catch (e) {
    if (!(e instanceof Error && e.message === 'ORDER_NOT_FOUND')) { console.error('webhook error:', e instanceof Error ? e.message : 'unknown'); return json({ error: 'RETRY' }, 500); }
  }
  return json({ ok: true });
}
