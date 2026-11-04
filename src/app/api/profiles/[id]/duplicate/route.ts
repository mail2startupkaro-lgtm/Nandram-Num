import { duplicateProfile } from '@/lib/db/repo/profiles';
import { json, withUser } from '@/lib/server/http';
import { assertCanAddProfiles } from '@/lib/billing/entitlements';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withUser<{ id: string }>(async (_req, user, { params }) => {
  await assertCanAddProfiles(user);
  const copy = await duplicateProfile(user.id, params.id);
  return json({ profile: { id: copy.id, displayName: copy.displayName } }, 201);
});
