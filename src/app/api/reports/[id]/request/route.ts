import { z } from 'zod';
import { getAccount, unlockReport } from '@/lib/billing/entitlements';
import { getReport, updateReport } from '@/lib/db/repo/reports';
import { getProfile, updateProfile } from '@/lib/db/repo/profiles';
import { markRequested, queueState, usesQueue } from '@/lib/report-queue';
import { json, readJson, withUser } from '@/lib/server/http';
import { writeNarrative } from '@/lib/server/reports';
import { deliverReportByEmail } from '@/lib/server/report-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Body = z.object({
  email: z.string().trim().email().optional().or(z.literal('').transform(() => undefined)),
});

/**
 * "Submit for report": spends one report credit (or uses the plan), prepares the report text and puts the report
 * in the delivery queue. Answers 402 when the client has no credit (→ choose a plan).
 * If email is provided, the report will be delivered to that email ID and remains available for download.
 */
export const POST = withUser<{ id: string }>(async (req, user, { params }) => {
  const r = await getReport(user.id, params.id); // ownership
  if (r.status === 'awaiting_review') return json({ error: 'REVIEW_PENDING' }, 409);

  let email: string | undefined;
  try {
    const b = Body.parse(await readJson(req).catch(() => ({})));
    email = b.email;
  } catch {
    // optional body
  }

  // If email was provided in submission, update profile so it persists
  if (email) {
    try {
      const p = await getProfile(user.id, r.profileId);
      if (p.input.email !== email) {
        await updateProfile(user.id, r.profileId, { ...p.input, email });
      }
    } catch {
      // ignore profile update error
    }
  }

  await unlockReport(user, r.id, { useCredit: true }); // throws 402 without a credit; free if already unlocked
  if (!r.narrative) {
    const narrative = await writeNarrative(r.result, r.language as 'en', { ownerId: user.id });
    await updateReport(user.id, r.id, { narrative: { ...narrative, status: 'final' }, status: 'final' });
  }
  await markRequested(r.id);

  const acct = await getAccount(user.id);
  const fresh = await getReport(user.id, r.id);

  // Pro consultants and admins don't use queue – send immediately if email is provided
  if (!usesQueue(acct)) {
    deliverReportByEmail({ reportId: r.id, targetEmail: email }).catch((err) => {
      console.warn('[Report Queue] Immediate email delivery error:', err);
    });
  }

  return json({ queue: queueState(fresh), account: acct });
});
