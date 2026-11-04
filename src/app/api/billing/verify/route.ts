import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { fulfilPayment } from '@/lib/billing/checkout';
import { razorpayConfig, verifyPaymentSignature } from '@/lib/billing/razorpay';
import { getDb } from '@/lib/db/client';
import { payments } from '@/lib/db/schema';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Called by the checkout success handler. The webhook fulfils too, so either path is enough. */
export const POST = withUser(async (req, user) => {
  const b = z.object({ razorpay_order_id: z.string().max(60), razorpay_payment_id: z.string().max(60), razorpay_signature: z.string().max(200) }).parse(await readJson(req));
  const [p] = await getDb().select({ userId: payments.userId }).from(payments).where(eq(payments.razorpayOrderId, b.razorpay_order_id)).limit(1);
  if (!p || p.userId !== user.id) return json({ error: 'ORDER_NOT_FOUND' }, 404);
  if (!verifyPaymentSignature(razorpayConfig(), b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) return json({ error: 'BAD_SIGNATURE' }, 400);
  const { payment } = await fulfilPayment(b.razorpay_order_id, b.razorpay_payment_id);
  return json({ ok: true, invoiceNumber: payment.invoiceNumber, paymentId: payment.id });
});
