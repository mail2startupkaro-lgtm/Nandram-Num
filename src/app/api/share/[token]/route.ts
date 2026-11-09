import { z } from 'zod';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { resolveShareLink } from '@/lib/db/repo/shares';
import { clientIp, errorResponse, json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUS: Record<string, number> = { not_found: 404, expired: 410, revoked: 410, password_required: 401, wrong_password: 403 };

/** Public: POST { password? } → the shared report (no login). */
export async function POST(req: Request, props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const rl = rateLimit(`share:${clientIp(req)}`, 30, 10 * 60_000); // slows password guessing
  if (!rl.ok) return tooMany(rl.retryAfter);
  try {
    const { password } = z.object({ password: z.string().max(64).optional() }).parse(await req.json().catch(() => ({})));
    const r = await resolveShareLink(params.token, password, { countView: true });
    if (r.status !== 'ok') return json({ status: r.status }, STATUS[r.status] ?? 400);
    const { report } = r;
    return json({ status: 'ok', expiresAt: r.expiresAt, report: { module: report.module, version: report.version, asOf: report.asOf, summary: report.summary, result: report.result, narrative: report.narrative?.status === 'final' ? report.narrative : null } });
  } catch (e) {
    return errorResponse(e);
  }
}
