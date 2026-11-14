import { z } from 'zod';
import { getReport } from '@/lib/db/repo/reports';
import { getAccount, isReportUnlocked } from '@/lib/billing/entitlements';
import { json, readJson, withUser } from '@/lib/server/http';
import { queueState, usesQueue } from '@/lib/report-queue';
import { deliverReportByEmail } from '@/lib/server/report-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Body = z.object({
  email: z.string().trim().email().optional().or(z.literal('').transform(() => undefined)),
  theme: z.string().max(40).optional(),
});

/**
 * POST /api/reports/:id/email
 * Sends the generated report PDF to the client's email ID.
 * The report is also available for direct download via /api/reports/:id/pdf.
 */
export const POST = withUser<{ id: string }>(async (req, user, { params }) => {
  const r = await getReport(user.id, params.id);
  const acct = await getAccount(user.id);

  if (usesQueue(acct)) {
    const q = queueState(r);
    if (q.state === 'not_requested') return json({ error: 'REQUEST_REQUIRED' }, 409);
    if (q.state !== 'ready') return json({ error: 'REPORT_NOT_READY', queue: q }, 409);
  }

  const unlocked = acct.features.fullReports || (await isReportUnlocked(r.id));
  if (!unlocked) return json({ error: 'PAYMENT_REQUIRED' }, 402);
  if (r.status === 'awaiting_review') return json({ error: 'REVIEW_PENDING' }, 409);

  let body: { email?: string; theme?: string } = {};
  try {
    body = Body.parse(await readJson(req).catch(() => ({})));
  } catch {
    // optional body
  }

  const res = await deliverReportByEmail({
    reportId: params.id,
    targetEmail: body.email,
    theme: body.theme || r.theme,
  });

  if (!res.ok) {
    if (res.reason === 'NO_EMAIL_PROVIDED') {
      return json({ error: 'EMAIL_REQUIRED', message: 'No email ID was provided for this client.' }, 400);
    }
    return json({ error: res.reason, message: res.error || 'Failed to deliver report email.' }, 500);
  }

  return json({ ok: true, sentTo: res.sentTo, dev: res.dev });
});
