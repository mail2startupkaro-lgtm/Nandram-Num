import { z } from 'zod';
import { ClientInputSchema } from '@/lib/numerology';
import { deleteProfile, getProfile, updateProfile } from '@/lib/db/repo/profiles';
import { listReports } from '@/lib/db/repo/reports';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type P = { id: string };

export const GET = withUser<P>(async (_req, user, { params }) => {
  const p = await getProfile(user.id, params.id);
  return json({ profile: p, reports: await listReports(user.id, params.id) });
});

export const PATCH = withUser<P>(async (req, user, { params }) => {
  const { input } = z.object({ input: ClientInputSchema }).parse(await readJson(req));
  return json({ profile: await updateProfile(user.id, params.id, input) });
});

/** DPDP erasure: deletes the profile, all its reports and share links. */
export const DELETE = withUser<P>(async (_req, user, { params }) => {
  await deleteProfile(user.id, params.id);
  return json({ ok: true });
});
