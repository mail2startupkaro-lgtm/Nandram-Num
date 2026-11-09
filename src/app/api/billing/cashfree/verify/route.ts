import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { CheckoutError, syncCashfreeOrder } from '@/lib/billing/checkout';
import { getDb } from '@/lib/db/client';
import { payments } from '@/lib/db/schema';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Called after the Cashfree checkout closes (or on return from a UPI app). The server asks Cashfree directly – the browser's word is never trusted. */
export const POST = withUser(async (req, user) => {
  const { orderId } = z.object({ orderId: z.string().startsWith('cf_').max(45) }).parse(await readJson(req));
  const [p] = await getDb().select({ userId: payments.userId }).from(payments).where(eq(payments.gatewayOrderId, orderId)).limit(1);
  if (!p || p.userId !== user.id) return json({ error: 'ORDER_NOT_FOUND' }, 404);
  try {
    return json(await syncCashfreeOrder(orderId));
  } catch (e) {
    if (e instanceof CheckoutError) return json({ error: e.code }, 400);
    if (e instanceof Error && e.message.startsWith('Cashfree')) { console.error('cashfree verify:', e.message); return json({ status: 'pending' }); }
    throw e;
  }
});
