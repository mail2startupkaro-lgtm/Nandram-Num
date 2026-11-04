import { z } from 'zod';
import type { NumerologyResult, ReportModule } from '@/lib/numerology';
import type { Narrative } from '@/lib/narrative/service';
import { getProfile } from '@/lib/db/repo/profiles';
import { createReport, listReports, regenerateReport } from '@/lib/db/repo/reports';
import { json, readJson, withUser } from '@/lib/server/http';
import { verifiedResult, writeNarrative } from '@/lib/server/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
type P = { id: string };

export const GET = withUser<P>(async (_req, user, { params }) => json({ reports: await listReports(user.id, params.id) }));

const Body = z.union([
  z.object({ mode: z.literal('save'), result: z.object({}).passthrough(), narrative: z.object({ sections: z.array(z.object({}).passthrough()) }).passthrough().nullable().optional(), theme: z.string().max(40).optional() }),
  z.object({ mode: z.literal('regenerate'), modules: z.array(z.enum(['dob', 'name', 'mobile', 'aadhaar', 'couple', 'complete'])).optional(), asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), aadhaar: z.string().optional(), writeNarrative: z.boolean().default(true), theme: z.string().max(40).optional() }),
]);

/** New report version: either save the reading shown on screen, or regenerate from the stored profile. */
export const POST = withUser<P>(async (req, user, { params }) => {
  const body = Body.parse(await readJson(req));
  if (body.mode === 'save') {
    const profile = await getProfile(user.id, params.id);
    const result = verifiedResult(profile.input, body.result as unknown as NumerologyResult);
    return json({ report: await createReport(user.id, params.id, { result, narrative: (body.narrative as unknown as Narrative) ?? null, theme: body.theme }) }, 201);
  }
  const report = await regenerateReport(user.id, params.id, {
    modules: body.modules as ReportModule[] | undefined, asOf: body.asOf, aadhaar: body.aadhaar, theme: body.theme,
    narrative: body.writeNarrative ? (r: NumerologyResult) => writeNarrative(r, undefined, { ownerId: user.id }) : undefined,
  });
  return json({ report }, 201);
});
