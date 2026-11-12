import { z } from 'zod';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { resolveShareLink } from '@/lib/db/repo/shares';
import { clientIp, errorResponse, json, readJson } from '@/lib/server/http';
import type { NumerologyResult } from '@/lib/numerology';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { clientProfiles } from '@/lib/db/schema';
import { getAccount } from '@/lib/billing/entitlements';
import { queueState, usesQueue } from '@/lib/report-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUS: Record<string, number> = { not_found: 404, expired: 410, revoked: 410, password_required: 401, wrong_password: 403 };

/** Strips unmasked mobile numbers, partner contact info, and private concerns before public display */
function sanitizePublicResult(r: NumerologyResult): NumerologyResult {
  const c = r.client;
  const maskedMobile = r.results.mobile?.masked ?? (c.mobile ? `+91 ******${c.mobile.slice(-4)}` : undefined);
  return {
    ...r,
    client: {
      fullName: c.fullName,
      commonName: c.commonName,
      hindiName: c.hindiName,
      gender: c.gender,
      dob: c.dob,
      language: c.language,
      aadhaarConsent: false,
      concerns: [],
      mobile: maskedMobile,
      aadhaarMasked: c.aadhaarMasked,
      partner: c.partner ? {
        name: c.partner.name,
        gender: c.partner.gender,
        dob: c.partner.dob,
      } : undefined,
    },
  };
}

/** Public: POST { password? } → the shared report (no login). */
export async function POST(req: Request, props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const ip = clientIp(req);
  const rl = rateLimit(`share:${ip}`, 30, 10 * 60_000); // slows password guessing
  if (!rl.ok) return tooMany(rl.retryAfter);
  const rlToken = rateLimit(`sharetok:${params.token}:${ip}`, 12, 10 * 60_000);
  if (!rlToken.ok) return tooMany(rlToken.retryAfter);

  try {
    const raw = await readJson<{ password?: unknown }>(req, 10_000).catch(() => ({}));
    const { password } = z.object({ password: z.string().max(64).optional() }).parse(raw);
    const r = await resolveShareLink(params.token, password, { countView: true });
    if (r.status !== 'ok') return json({ status: r.status }, STATUS[r.status] ?? 400);
    const { report } = r;
    const [owner] = await getDb().select({ ownerId: clientProfiles.ownerId }).from(clientProfiles).where(eq(clientProfiles.id, report.profileId)).limit(1);
    const ready = !owner || !usesQueue(await getAccount(owner.ownerId)) || queueState(report).state === 'ready';
    return json({
      status: 'ok',
      expiresAt: r.expiresAt,
      report: {
        module: report.module,
        version: report.version,
        asOf: report.asOf,
        summary: report.summary,
        result: sanitizePublicResult(report.result),
        narrative: ready && report.narrative?.status === 'final' ? report.narrative : null,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
