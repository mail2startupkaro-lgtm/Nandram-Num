import { z } from 'zod';
import { ClientInputSchema, type NumerologyResult } from '@/lib/numerology';
import { createProfile, listProfiles, toStoredInput } from '@/lib/db/repo/profiles';
import { createReport } from '@/lib/db/repo/reports';
import { json, readJson, withUser } from '@/lib/server/http';
import { assertCanAddProfiles } from '@/lib/billing/entitlements';
import { verifiedResult } from '@/lib/server/reports';
import type { Narrative } from '@/lib/narrative/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withUser(async (req, user) => {
  const u = new URL(req.url);
  const res = await listProfiles(user.id, { q: u.searchParams.get('q') ?? undefined, limit: Number(u.searchParams.get('limit') ?? 50), offset: Number(u.searchParams.get('offset') ?? 0) });
  return json(res);
});

const Body = z.object({
  input: ClientInputSchema,
  result: z.object({}).passthrough().optional(),
  narrative: z.object({ sections: z.array(z.object({}).passthrough()) }).passthrough().nullable().optional(),
  theme: z.string().max(40).optional(),
});

/** Save a new client (and optionally the reading shown on screen) – Aadhaar is used in memory only. */
export const POST = withUser(async (req, user) => {
  const body = Body.parse(await readJson(req));
  await assertCanAddProfiles(user);
  const { stored } = toStoredInput(body.input);
  const result = body.result ? verifiedResult(stored, body.result as unknown as NumerologyResult) : null;
  const masked = result?.client.aadhaarMasked ?? null;
  const profile = await createProfile(user.id, body.input, undefined, { aadhaarLast4: masked ? masked.slice(-4) : null });
  let report = null;
  if (result) {
    report = await createReport(user.id, profile.id, { result, narrative: (body.narrative as unknown as Narrative) ?? null, theme: body.theme });
  }
  const { input: _i, inputEnc: _e, ...meta } = profile;
  return json({ profile: meta, report }, 201);
});
