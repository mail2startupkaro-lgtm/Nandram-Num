import { z } from 'zod';
import { generateNumerology, type NumerologyResult } from '@/lib/numerology';
import { getOptionalUser } from '@/lib/auth/current-user';
import { getAccount } from '@/lib/billing/entitlements';
import { pdfStyleFor } from '@/lib/branding';
import { clientIp, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import type { Narrative } from '@/lib/narrative/service';
import { configFromEnv, providerFromConfig } from '@/lib/narrative/providers/llm';
import { renderReportPdf } from '@/lib/pdf/render';
import { THEMES, type ThemeId } from '@/lib/pdf/themes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Body = z.object({
  result: z.object({ schemaVersion: z.number(), asOf: z.string(), client: z.object({ fullName: z.string() }).passthrough(), results: z.object({ dob: z.object({}).passthrough() }).passthrough() }).passthrough(),
  narrative: z.object({ status: z.enum(['awaiting_review', 'final']), language: z.enum(['en', 'hi', 'hinglish']), sections: z.array(z.object({ id: z.string(), title: z.string(), text: z.string() }).passthrough()) }).passthrough().optional(),
  theme: z.enum(Object.keys(THEMES) as [ThemeId, ...ThemeId[]]).optional(),
  language: z.enum(['en', 'hi', 'hinglish']).optional(),
  preview: z.boolean().optional(),
});

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

/**
 * POST { result, narrative?, theme?, language?, preview? } → application/pdf
 * Anonymous and free users get a watermarked Date-of-Birth preview; Pro/admin get the full report.
 * Paid single reports are downloaded from the saved report (/api/reports/:id/pdf).
 * Phase 6: the result/narrative are loaded from the database by report id and the watermark/branding come from the user's plan.
 */
export async function POST(req: Request) {
  let raw: unknown;
  try { raw = await readJson(req, 1_000_000); } catch { return json(400, { error: 'INVALID_JSON' }); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json(422, { error: 'VALIDATION' });
  if (JSON.stringify(parsed.data).match(/\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b|\b\d{12}\b/)) return json(422, { error: 'PII_REJECTED' });
  const narrative = parsed.data.narrative as Narrative | undefined;
  if (narrative?.status === 'awaiting_review') return json(409, { error: 'REVIEW_PENDING' });

  try {
    const user = await getOptionalUser(req);
    const full = !!user && (await getAccount(user.id)).features.fullReports;
    // Instant PDFs are for Pro consultants and admins. General clients submit the saved report and download it when it is ready.
    if (!full) return json(403, { error: 'REPORT_QUEUE' });
    if (!full) { const rl = rateLimit(`pdf:${clientIp(req)}`, 10, 3_600_000); if (!rl.ok) return tooMany(rl.retryAfter); }
    let result = parsed.data.result as unknown as NumerologyResult;
    if (!full) result = generateNumerology(result.client as never, { asOf: result.asOf, modules: ['dob'] }); // recomputed: DOB chapters only
    const style = await pdfStyleFor(user?.id ?? null, parsed.data.theme);
    const out = await renderReportPdf({
      result,
      narrative: full ? narrative : undefined,
      language: parsed.data.language ?? narrative?.language,
      ...style,
      watermark: !full ? 'FREE PREVIEW' : parsed.data.preview ? 'PREVIEW' : undefined,
      provider: full && !narrative ? providerFromConfig(configFromEnv()) : null,
    });
    const name = (result.client.commonName || result.client.fullName).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'report';
    return new Response(Buffer.from(out.pdf), {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${name}-numerology-report.pdf"`,
        'cache-control': 'no-store',
        'x-render-ms': String(out.ms),
        'x-page-count': String(out.pageCount),
        'x-report-tier': full ? 'full' : 'preview',
      },
    });
  } catch (e) {
    console.error('pdf failed error:', e instanceof Error ? (e.stack || e.message) : e);
    return json(500, { error: 'INTERNAL', message: e instanceof Error ? e.message : 'PDF rendering error' });
  }
}
