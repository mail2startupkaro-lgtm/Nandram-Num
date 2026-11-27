import { z } from 'zod';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { AffiliateError, createPayout, listPayoutsAdmin } from '@/lib/affiliate/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async () => json({ payouts: await listPayoutsAdmin() }));

/** Record a payout you have sent (UPI / bank): marks all of the affiliate's available commissions in that currency as paid. */
export const POST = withAdmin(async (req) => {
  const b = z.object({ affiliateId: z.string().max(64), currency: z.enum(['INR', 'USD']), method: z.string().max(20).optional(), reference: z.string().max(80).optional(), note: z.string().max(500).optional() }).parse(await readJson(req, 4000));
  try { return json(await createPayout(b), 201); }
  catch (e) { if (e instanceof AffiliateError) return json({ error: e.message }, e.status); throw e; }
});
