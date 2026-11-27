import { isPayable, listServices } from '@/lib/billing/services';
import { serviceUsd } from '@/lib/billing/currency';
import { errorResponse, json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Shared CDN cache: the list is public and changes only when the admin edits a service. */
const CACHE = { 'cache-control': 'public, s-maxage=120, stale-while-revalidate=600' };

/** Public list of active services. Unconfirmed (draft) prices are not exposed. */
export async function GET() {
  try {
    const list = await listServices();
    return json({ services: list.map((s) => ({ code: s.code, en: s.en, hi: s.hi, intake: s.intake, featured: s.featured, payable: isPayable(s), pricePaise: isPayable(s) ? s.pricePaise : null, mrpPaise: isPayable(s) ? s.mrpPaise : null, usdCents: isPayable(s) ? serviceUsd(s).usd : null, usdMrpCents: isPayable(s) ? serviceUsd(s).usdMrp : null })) }, 200, CACHE);
  } catch (e) { return errorResponse(e); }
}
