import { exportBundle, profilesToCsv } from '@/lib/portable';
import { json, withUser } from '@/lib/server/http';
import { requireFeature } from '@/lib/billing/entitlements';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** GET ?format=json|csv&ids=a,b (default: all) – bulk export for the expert. */
export const GET = withUser(async (req, user) => {
  await requireFeature(user, 'bulk');
  const u = new URL(req.url);
  const ids = u.searchParams.get('ids')?.split(',').filter(Boolean);
  const bundle = await exportBundle(user.id, ids?.length ? ids : 'all', { allVersions: u.searchParams.get('all') === '1' });
  const stamp = new Date().toISOString().slice(0, 10);
  if (u.searchParams.get('format') === 'csv') {
    return new Response(profilesToCsv(bundle.profiles), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="clients-${stamp}.csv"`, 'cache-control': 'no-store' } });
  }
  return json(bundle, 200, { 'content-disposition': `attachment; filename="clients-${stamp}.json"` });
});
