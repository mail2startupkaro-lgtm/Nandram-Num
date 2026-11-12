import { z } from 'zod';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { CheckoutError, getPurchasable, validateCoupon } from '@/lib/billing/checkout';
import { json, readJson, withUser } from '@/lib/server/http';
import { currencyForRequest } from '@/lib/billing/currency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withUser(async (req, user) => {
  const rl = rateLimit(`coupon:${user.id}`, 20, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const { planCode, code } = z.object({ planCode: z.string(), code: z.string().max(40) }).parse(await readJson(req));
  const { currency } = currencyForRequest(req);
  const plan = await getPurchasable(planCode, undefined, currency);
  if (!plan) return json({ error: 'PLAN_UNAVAILABLE' }, 400);
  try {
    const { discountPaise } = await validateCoupon(code, plan, undefined, plan.currency);
    return json({ valid: true, discountPaise, amountPaise: plan.pricePaise - discountPaise, currency: plan.currency });
  } catch (e) {
    if (e instanceof CheckoutError) return json({ valid: false, error: e.code }, 400);
    throw e;
  }
});
