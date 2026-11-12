import { isPayable, listServices } from '@/lib/billing/services';
import { errorResponse, json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public list of active services. Unconfirmed (draft) prices are not exposed. */
export async function GET() {
  try {
    const list = await listServices();
    return json({ services: list.map((s) => ({ code: s.code, en: s.en, hi: s.hi, intake: s.intake, featured: s.featured, payable: isPayable(s), pricePaise: isPayable(s) ? s.pricePaise : null, mrpPaise: isPayable(s) ? s.mrpPaise : null, usdCents: isPayable(s) ? s.usdCents : null, usdMrpCents: isPayable(s) ? s.usdMrpCents : null })) });
  } catch (e) { return errorResponse(e); }
}
