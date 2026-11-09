import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { activeGateway, fulfilPayment, isMockOrder } from '@/lib/billing/checkout';
import { getDb } from '@/lib/db/client';
import { payments } from '@/lib/db/schema';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Development only: completes a test-mode order when no Cashfree keys are configured. Disabled in production. */
export const POST = withUser(async (req, user) => {
  if (process.env.NODE_ENV === 'production' || activeGateway() !== 'mock') return json({ error: 'NOT_AVAILABLE' }, 404);
  const { orderId } = z.object({ orderId: z.string().max(60).refine(isMockOrder) }).parse(await readJson(req));
  const [p] = await getDb().select({ userId: payments.userId }).from(payments).where(eq(payments.gatewayOrderId, orderId)).limit(1);
  if (!p || p.userId !== user.id) return json({ error: 'ORDER_NOT_FOUND' }, 404);
  const { payment } = await fulfilPayment(orderId, `mockpay_${orderId.slice(5, 21)}`);
  return json({ ok: true, invoiceNumber: payment.invoiceNumber, paymentId: payment.id });
});
