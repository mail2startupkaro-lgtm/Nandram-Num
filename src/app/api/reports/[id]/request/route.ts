import { getAccount, unlockReport } from '@/lib/billing/entitlements';
import { getReport, updateReport } from '@/lib/db/repo/reports';
import { markRequested, queueState } from '@/lib/report-queue';
import { json, withUser } from '@/lib/server/http';
import { writeNarrative } from '@/lib/server/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * "Submit for report": spends one report credit (or uses the plan), prepares the report text and puts the report
 * in the delivery queue. Answers 402 when the client has no credit (→ choose a plan).
 */
export const POST = withUser<{ id: string }>(async (_req, user, { params }) => {
  const r = await getReport(user.id, params.id); // ownership
  if (r.status === 'awaiting_review') return json({ error: 'REVIEW_PENDING' }, 409);
  await unlockReport(user, r.id, { useCredit: true }); // throws 402 without a credit; free if already unlocked
  if (!r.narrative) {
    const narrative = await writeNarrative(r.result, r.language as 'en', { ownerId: user.id });
    await updateReport(user.id, r.id, { narrative: { ...narrative, status: 'final' }, status: 'final' });
  }
  await markRequested(r.id);
  const fresh = await getReport(user.id, r.id);
  return json({ queue: queueState(fresh), account: await getAccount(user.id) });
});
