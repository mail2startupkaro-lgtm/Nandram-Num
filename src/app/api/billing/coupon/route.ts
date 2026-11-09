import { z } from 'zod';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { CheckoutError, validateCoupon } from '@/lib/billing/checkout';
import { getPlan } from '@/lib/billing/plans';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withUser(async (req, user) => {
  const rl = rateLimit(`coupon:${user.id}`, 20, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const { planCode, code } = z.object({ planCode: z.string(), code: z.string().max(40) }).parse(await readJson(req));
  const plan = await getPlan(planCode);
  if (!plan) return json({ error: 'PLAN_UNAVAILABLE' }, 400);
  try {
    const { discountPaise } = await validateCoupon(code, plan);
    return json({ valid: true, discountPaise, amountPaise: plan.pricePaise - discountPaise });
  } catch (e) {
    if (e instanceof CheckoutError) return json({ valid: false, error: e.code }, 400);
    throw e;
  }
});
