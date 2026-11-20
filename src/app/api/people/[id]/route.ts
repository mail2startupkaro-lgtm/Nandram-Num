import { getPerson, PersonSchema, savePerson } from '@/lib/db/repo/people';
import { deleteProfile } from '@/lib/db/repo/profiles';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type P = { id: string };

export const GET = withUser<P>(async (_req, user, { params }) => json({ person: await getPerson(user.id, params.id) }));

export const PATCH = withUser<P>(async (req, user, { params }) => {
  const input = PersonSchema.parse(await readJson(req, 20_000));
  return json({ person: await savePerson(user.id, input, params.id) });
});

/** Removes the person together with their saved readings (DPDP erasure). Paid service orders are kept. */
export const DELETE = withUser<P>(async (_req, user, { params }) => {
  await deleteProfile(user.id, params.id);
  return json({ ok: true });
});
