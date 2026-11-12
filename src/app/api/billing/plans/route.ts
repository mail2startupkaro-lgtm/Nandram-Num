import { listPlans } from '@/lib/billing/plans';
import { currencyForRequest, planPrice, usdPrice } from '@/lib/billing/currency';
import { errorResponse, json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Active plans priced for this visitor: ₹ in India, $ elsewhere (for plans that have a USD price). */
export async function GET(req: Request) {
  try {
    const { currency, country, chosen } = currencyForRequest(req);
    const plans = await listPlans();
    return json({
      currency, country, chosen,
      usdAvailable: plans.some((p) => !!usdPrice(p)),
      plans: plans.map(({ code, name, description, pricePaise, intervalDays, credits, features }) => {
        const { usdCents, usdMrpCents, mrpPaise, ...rest } = features ?? ({} as typeof features);
        void usdCents; void usdMrpCents; void mrpPaise;
        return { code, name, description, pricePaise, intervalDays, credits, features: rest, price: planPrice({ code, pricePaise, credits, features }, currency) };
      }),
    }, 200, { vary: 'cookie, x-vercel-ip-country' });
  } catch (e) { return errorResponse(e); }
}
