import { z } from 'zod';
import { generateNumerology, type NumerologyResult } from '@/lib/numerology';
import { getOptionalUser } from '@/lib/auth/current-user';
import { getAccount } from '@/lib/billing/entitlements';
import { pdfStyleFor } from '@/lib/branding';
import { clientIp, json, readJson, slug } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import type { Narrative } from '@/lib/narrative/service';
import { configFromEnv, providerFromConfig } from '@/lib/narrative/providers/llm';
import { renderReportPdf } from '@/lib/pdf/render';
import { THEMES, type ThemeId } from '@/lib/pdf/themes';
import { sendReportEmail } from '@/lib/email/report-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Body = z.object({
  result: z.object({ schemaVersion: z.number(), asOf: z.string(), client: z.object({ fullName: z.string() }).passthrough(), results: z.object({ dob: z.object({}).passthrough() }).passthrough() }).passthrough(),
  narrative: z.object({ status: z.enum(['awaiting_review', 'final']), language: z.enum(['en', 'hi', 'hinglish']), sections: z.array(z.object({ id: z.string(), title: z.string(), text: z.string() }).passthrough()) }).passthrough().optional(),
  theme: z.enum(Object.keys(THEMES) as [ThemeId, ...ThemeId[]]).optional(),
  language: z.enum(['en', 'hi', 'hinglish']).optional(),
  preview: z.boolean().optional(),
  email: z.string().trim().email().optional(),
});

/**
 * POST /api/pdf/email
 * Sends the generated report PDF to the client's email ID.
 * Pro / admin users get the full report; free/preview users get the preview PDF.
 */
export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await readJson(req, 1_000_000);
  } catch {
    return json({ error: 'INVALID_JSON' }, 400);
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ error: 'VALIDATION', issues: parsed.error.issues }, 422);

  try {
    const user = await getOptionalUser(req);
    const full = !!user && (await getAccount(user.id)).features.fullReports;

    const rl = rateLimit(`pdf-email:${user ? user.id : clientIp(req)}`, 10, 3_600_000);
    if (!rl.ok) return tooMany(rl.retryAfter);

    let result = parsed.data.result as unknown as NumerologyResult;
    const targetEmail = (parsed.data.email || result.client.email || user?.email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      return json({ error: 'EMAIL_REQUIRED', message: 'Please provide a valid email ID to receive your report.' }, 400);
    }

    const narrative = parsed.data.narrative as Narrative | undefined;
    if (narrative?.status === 'awaiting_review') return json({ error: 'REVIEW_PENDING' }, 409);

    if (!full) result = generateNumerology(result.client as never, { asOf: result.asOf, modules: ['dob'] });
    const style = await pdfStyleFor(user?.id ?? null, parsed.data.theme);

    const out = await renderReportPdf({
      result,
      narrative: full ? narrative : undefined,
      language: parsed.data.language ?? narrative?.language,
      ...style,
      watermark: !full ? 'FREE PREVIEW' : parsed.data.preview ? 'PREVIEW' : undefined,
      provider: full && !narrative ? providerFromConfig(configFromEnv()) : null,
    });

    const clientName = result.client.commonName || result.client.fullName || 'Client';
    const name = slug(clientName) || 'report';
    const fileName = `${name}-numerology-report.pdf`;

    const emailRes = await sendReportEmail({
      to: targetEmail,
      clientName,
      reportPdf: out.pdf,
      fileName,
      language: parsed.data.language ?? narrative?.language,
      brandName: style.branding?.brandName,
      expertName: style.branding?.expertName,
    });

    if (!emailRes.ok) {
      return json({ error: 'DELIVERY_FAILED', message: emailRes.error || 'Failed to send report email.' }, 500);
    }

    return json({ ok: true, sentTo: targetEmail, dev: emailRes.dev });
  } catch (e) {
    console.error('pdf email failed:', e);
    return json({ error: 'INTERNAL', message: e instanceof Error ? e.message : 'Error delivering report email' }, 500);
  }
}
