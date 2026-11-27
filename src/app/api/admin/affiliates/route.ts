import { z } from 'zod';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { AffiliateError, listAffiliatesAdmin, programTotals, updateAffiliateAdmin } from '@/lib/affiliate/store';
import { getSetting } from '@/lib/admin/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admin → Affiliate Marketing: all affiliates (with payout details for paying them) and program totals. */
export const GET = withAdmin(async () => json({ affiliates: await listAffiliatesAdmin(), totals: await programTotals(), settings: await getSetting('affiliate') }));

const Body = z.object({
  id: z.string().max(64),
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
  code: z.string().trim().max(20).optional(),
  commissionPercent: z.number().int().min(0).max(90).nullable().optional(),
  adminNote: z.string().max(2000).optional(),
});

/** Approve / reject / suspend, change the code, set a personal commission rate or a note. */
export const PATCH = withAdmin(async (req) => {
  const b = Body.parse(await readJson(req, 10_000));
  try { return json({ affiliate: await updateAffiliateAdmin(b.id, b) }); }
  catch (e) { if (e instanceof AffiliateError) return json({ error: e.message }, e.status); throw e; }
});
