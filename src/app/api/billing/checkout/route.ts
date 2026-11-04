import { z } from 'zod';
import { CheckoutError, createCheckout } from '@/lib/billing/checkout';
import { INDIAN_STATES } from '@/components/wizard/state';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withUser(async (req, user) => {
  const body = z.object({
    planCode: z.string().max(30), coupon: z.string().max(40).optional(), billingName: z.string().max(120).optional(),
    billingState: z.string().refine((s) => INDIAN_STATES.includes(s), 'Choose your state'), gstin: z.string().max(15).optional(),
  }).parse(await readJson(req));
  try {
    return json(await createCheckout(user, body), 201);
  } catch (e) {
    if (e instanceof CheckoutError) return json({ error: e.code }, 400);
    throw e;
  }
});
