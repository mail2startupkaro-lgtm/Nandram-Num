import { z } from 'zod';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { resolveShareLink } from '@/lib/db/repo/shares';
import { isReportUnlocked } from '@/lib/billing/entitlements';
import { pdfStyleFor } from '@/lib/branding';
import { getDb } from '@/lib/db/client';
import { clientProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { renderReportPdf } from '@/lib/pdf/render';
import type { ThemeId } from '@/lib/pdf/themes';
import { clientIp, errorResponse, json, pdfResponse, slug } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Public: POST { password? } → PDF of the shared report (only if its text has been finalised). */
export async function POST(req: Request, props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const rl = rateLimit(`sharepdf:${clientIp(req)}`, 10, 10 * 60_000); // slows password guessing
  if (!rl.ok) return tooMany(rl.retryAfter);
  try {
    const { password } = z.object({ password: z.string().max(64).optional() }).parse(await req.json().catch(() => ({})));
    const r = await resolveShareLink(params.token, password);
    if (r.status !== 'ok') return json({ status: r.status }, r.status === 'not_found' ? 404 : r.status === 'password_required' ? 401 : 403);
    const rep = r.report;
    if (!rep.narrative || rep.narrative.status !== 'final' || !(await isReportUnlocked(rep.id))) return json({ status: 'not_ready' }, 409);
    const [owner] = await getDb().select({ ownerId: clientProfiles.ownerId }).from(clientProfiles).where(eq(clientProfiles.id, rep.profileId)).limit(1);
    const style = await pdfStyleFor(owner?.ownerId ?? null, rep.theme as ThemeId);
    const out = await renderReportPdf({ result: rep.result, narrative: rep.narrative, ...style });
    return pdfResponse(out.pdf, `${slug(rep.result.client.commonName || rep.result.client.fullName)}-numerology-report.pdf`);
  } catch (e) {
    return errorResponse(e);
  }
}
