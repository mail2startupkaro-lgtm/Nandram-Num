import { getBranding, saveBranding } from '@/lib/branding';
import { requireFeature } from '@/lib/billing/entitlements';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withUser(async (_req, user) => json({ branding: await getBranding(user.id) }));

export const PUT = withUser(async (req, user) => {
  await requireFeature(user, 'whiteLabel');
  if (Number(req.headers.get('content-length') ?? 0) > 2_000_000) return json({ error: 'TOO_LARGE' }, 413);
  return json({ branding: await saveBranding(user.id, await readJson(req)) });
});
