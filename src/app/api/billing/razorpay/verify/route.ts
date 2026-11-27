import { z } from 'zod';
import { CheckoutError, syncRazorpayOrder } from '@/lib/billing/checkout';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Called by the browser after the Razorpay checkout returns. The money state always comes from Razorpay.
 * A temporary gateway / network error answers "pending" (the client keeps checking and the webhook finishes the order),
 * never "failed" – telling a customer whose money was taken that the payment failed was a real bug.
 */
export async function POST(req: Request) {
  let body: { orderId: string; paymentId: string; signature: string };
  try {
    body = z.object({ orderId: z.string().min(1).max(60), paymentId: z.string().min(1).max(60), signature: z.string().min(1).max(200) }).parse(await readJson(req));
  } catch {
    return json({ status: 'failed', error: 'VALIDATION' }, 400);
  }
  try {
    return json(await syncRazorpayOrder(body));
  } catch (e) {
    if (e instanceof CheckoutError) return json({ status: 'failed', error: e.code }, 400);
    console.error('Razorpay verify error:', e instanceof Error ? e.message.slice(0, 200) : e);
    return json({ status: 'pending' });
  }
}
