import { listPlans } from '@/lib/billing/plans';
import { errorResponse, json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plans = await listPlans();
    return json({ plans: plans.map(({ code, name, description, pricePaise, intervalDays, credits, features }) => ({ code, name, description, pricePaise, intervalDays, credits, features })) });
  } catch (e) { return errorResponse(e); }
}
