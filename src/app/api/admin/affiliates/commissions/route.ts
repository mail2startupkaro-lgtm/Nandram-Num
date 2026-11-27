import { z } from 'zod';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { AffiliateError, listCommissionsAdmin, setCommissionStatus } from '@/lib/affiliate/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (req) => {
  const u = new URL(req.url);
  return json({ commissions: await listCommissionsAdmin({ status: u.searchParams.get('status') ?? undefined, affiliateId: u.searchParams.get('affiliate') ?? undefined }) });
});

/** Cancel a commission (refund / fraud) or restore it. */
export const PATCH = withAdmin(async (req) => {
  const b = z.object({ id: z.string().max(64), status: z.enum(['cancelled', 'pending']) }).parse(await readJson(req, 2000));
  try { return json({ commission: await setCommissionStatus(b.id, b.status) }); }
  catch (e) { if (e instanceof AffiliateError) return json({ error: e.message }, e.status); throw e; }
});
