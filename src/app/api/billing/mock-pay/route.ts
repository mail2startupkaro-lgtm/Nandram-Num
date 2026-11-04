import { z } from 'zod';
import { mockPaymentSignature, razorpayConfig } from '@/lib/billing/razorpay';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Development only: simulates Razorpay Checkout when no keys are configured. */
export const POST = withUser(async (req) => {
  const cfg = razorpayConfig();
  if (!cfg.mock || process.env.NODE_ENV === 'production') return json({ error: 'NOT_AVAILABLE' }, 404);
  const { orderId } = z.object({ orderId: z.string().startsWith('order_mock_') }).parse(await readJson(req));
  return json(mockPaymentSignature(cfg, orderId));
});
