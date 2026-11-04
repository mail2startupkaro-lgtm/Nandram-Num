import { z } from 'zod';
import type { Narrative } from '@/lib/narrative/service';
import { deleteReport, getReport, updateReport } from '@/lib/db/repo/reports';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type P = { id: string };

export const GET = withUser<P>(async (_req, user, { params }) => {
  const r = await getReport(user.id, params.id);
  return json({ report: r });
});

const Patch = z.object({
  narrative: z.object({ status: z.enum(['awaiting_review', 'final']), sections: z.array(z.object({ id: z.string(), title: z.string(), text: z.string().max(20000) }).passthrough()).max(40) }).passthrough().nullable().optional(),
  status: z.enum(['draft', 'awaiting_review', 'final']).optional(),
  theme: z.enum(['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white']).optional(),
  language: z.enum(['en', 'hi', 'hinglish']).optional(),
});

export const PATCH = withUser<P>(async (req, user, { params }) => {
  const body = Patch.parse(await readJson(req));
  const r = await updateReport(user.id, params.id, { ...body, narrative: body.narrative as unknown as Narrative | null | undefined });
  return json({ report: r });
});

export const DELETE = withUser<P>(async (_req, user, { params }) => {
  await deleteReport(user.id, params.id);
  return json({ ok: true });
});
