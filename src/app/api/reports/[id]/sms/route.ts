import { z } from 'zod';
import { getReport } from '@/lib/db/repo/reports';
import { getAccount, isReportUnlocked } from '@/lib/billing/entitlements';
import { appOrigin, json, readJson, withUser } from '@/lib/server/http';
import { queueState, usesQueue } from '@/lib/report-queue';
import { deliverReportBySms } from '@/lib/server/report-sms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Body = z.object({
  phone: z.string().trim().optional(),
});

/**
 * POST /api/reports/:id/sms
 * Sends the numerology report link to the client's mobile number via Fast2SMS.
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

  let body: { phone?: string } = {};
  try {
    body = Body.parse(await readJson(req).catch(() => ({})));
  } catch {
    // optional body
  }

  const res = await deliverReportBySms({
    reportId: params.id,
    targetPhone: body.phone,
    appOrigin: appOrigin(req),
  });

  if (!res.ok) {
    if (res.reason === 'NO_PHONE_PROVIDED') {
      return json({ error: 'PHONE_REQUIRED', message: 'No phone number was provided for this client.' }, 400);
    }
    if (res.reason === 'INVALID_PHONE') {
      return json({ error: 'INVALID_PHONE', message: res.error || 'Invalid 10-digit mobile number.' }, 400);
    }
    return json({ error: res.reason, message: res.error || 'Failed to deliver report SMS.' }, 500);
  }

  return json({
    ok: true,
    sentTo: res.sentTo,
    requestId: res.requestId,
    reportUrl: res.reportUrl,
  });
});
