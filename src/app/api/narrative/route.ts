import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { NarrativeLanguage } from '@/lib/narrative/plan';
import { writeNarrative } from '@/lib/server/reports';
import type { NumerologyResult } from '@/lib/numerology';
import { getOptionalUser } from '@/lib/auth/current-user';
import { getAccount } from '@/lib/billing/entitlements';
import { clientIp, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

const Body = z.object({
  result: z.object({
    schemaVersion: z.number(),
    engineVersion: z.string(),
    asOf: z.string(),
    client: z.object({ fullName: z.string(), gender: z.enum(['male', 'female', 'other']) }).passthrough(),
    results: z.object({ dob: z.object({}).passthrough(), remedies: z.object({}).passthrough() }).passthrough(),
  }).passthrough(),
  language: z.enum(['en', 'hi', 'hinglish']).optional(),
  expertReview: z.boolean().optional(),
});

/**
 * POST { result: NumerologyResult, language?, expertReview? } → Narrative
 * The engine result is re-used as sent; in Phase 5 the server loads it from the database by report id instead.
 */
export async function POST(req: Request) {
  let json: unknown;
  try { json = await readJson(req, 500_000); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400, headers: NO_STORE }); }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION' }, { status: 422, headers: NO_STORE });

  const result = parsed.data.result as unknown as NumerologyResult;
  if (JSON.stringify(result).match(/\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b|\b\d{12}\b/)) return NextResponse.json({ error: 'PII_REJECTED' }, { status: 422, headers: NO_STORE });

  try {
    const user = await getOptionalUser(req);
    // The written report is part of the delivered report for general clients; only Pro consultants and admins write it instantly.
    if (!user || !(await getAccount(user.id)).features.fullReports) return NextResponse.json({ error: 'REPORT_QUEUE' }, { status: 403, headers: NO_STORE });
    const rl = rateLimit(`nar:${user?.id ?? clientIp(req)}`, user ? 60 : 10, 3_600_000);
    if (!rl.ok) return tooMany(rl.retryAfter);
    // The paid LLM writer is only used for signed-in users; anonymous visitors get the offline writer.
    const narrative = await writeNarrative(result, parsed.data.language as NarrativeLanguage | undefined, { llm: !!user, ownerId: user?.id ?? null });
    if (parsed.data.expertReview) narrative.status = 'awaiting_review';
    // Internal diagnostics (writer, warnings) stay server-side unless explicitly in dev.
    const exposeDiagnostics = process.env.NODE_ENV !== 'production';
    return NextResponse.json(exposeDiagnostics ? narrative : { ...narrative, writer: undefined, sections: narrative.sections.map(({ warnings: _w, ...s }) => s) }, { headers: NO_STORE });
  } catch (e) {
    console.error('narrative failed:', e instanceof Error ? e.name : 'unknown');
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500, headers: NO_STORE });
  }
}
