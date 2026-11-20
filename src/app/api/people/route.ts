import { FamilyLimitError, FAMILY_LIMIT, listPeople, PersonSchema, savePerson } from '@/lib/db/repo/people';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The signed-in customer's saved people: themselves and family members (details kept for future readings). */
export const GET = withUser(async (_req, user) => json({ people: await listPeople(user.id), limit: FAMILY_LIMIT }));

export const POST = withUser(async (req, user) => {
  const input = PersonSchema.parse(await readJson(req, 20_000));
  try {
    return json({ person: await savePerson(user.id, input) }, 201);
  } catch (e) {
    if (e instanceof FamilyLimitError) return json({ error: 'FAMILY_LIMIT', issues: [{ path: 'people', message: `You can save up to ${FAMILY_LIMIT} people. Remove someone first.` }] }, 409);
    throw e;
  }
});
