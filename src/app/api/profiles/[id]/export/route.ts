import { exportProfile } from '@/lib/portable';
import { json, slug, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withUser<{ id: string }>(async (req, user, { params }) => {
  const data = await exportProfile(user.id, params.id, { allVersions: new URL(req.url).searchParams.get('all') === '1' });
  return json(data, 200, { 'content-disposition': `attachment; filename="${slug(data.profile.input.commonName || data.profile.input.fullName)}-profile.json"` });
});
