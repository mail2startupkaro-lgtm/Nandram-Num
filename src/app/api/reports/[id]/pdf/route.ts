import { getProfile } from '@/lib/db/repo/profiles';
import { getReport, updateReport } from '@/lib/db/repo/reports';
import { getAccount, isReportUnlocked, unlockReport } from '@/lib/billing/entitlements';
import { pdfStyleFor } from '@/lib/branding';
import { renderReportPdf } from '@/lib/pdf/render';
import { renderInputSheetPdf, renderOutputSheetPdf } from '@/lib/pdf/sheets';
import { json, pdfResponse, slug, withUser } from '@/lib/server/http';
import { writeNarrative } from '@/lib/server/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * GET ?kind=report|output|input&theme=…&useCredit=1
 *   report – needs an unlocked report (Pro plan, or one credit with useCredit=1) → 402 otherwise
 *   output – one-page snapshot; watermarked until the report is unlocked
 *   input  – input sheet, always available to the owner
 */
export const GET = withUser<{ id: string }>(async (req, user, { params }) => {
  const u = new URL(req.url);
  const kind = u.searchParams.get('kind') ?? 'report';
  const r = await getReport(user.id, params.id);
  const style = await pdfStyleFor(user.id, u.searchParams.get('theme') ?? r.theme);
  const name = slug(r.result.client.commonName || r.result.client.fullName);

  if (kind === 'input') {
    const p = await getProfile(user.id, r.profileId);
    return pdfResponse((await renderInputSheetPdf({ input: p.input, aadhaarLast4: p.aadhaarLast4, consentAt: p.consentAt, profileId: p.id, isoDate: r.asOf }, { ...style, language: p.input.language })).pdf, `${name}-input-sheet.pdf`);
  }
  const acct = await getAccount(user.id);
  if (kind === 'output') {
    const unlocked = acct.features.fullReports || (await isReportUnlocked(r.id));
    return pdfResponse((await renderOutputSheetPdf(r.result, { ...style, language: r.language, watermark: unlocked ? undefined : 'FREE PREVIEW' })).pdf, `${name}-snapshot.pdf`);
  }
  if (r.status === 'awaiting_review') return json({ error: 'REVIEW_PENDING' }, 409);
  await unlockReport(user, r.id, { useCredit: u.searchParams.get('useCredit') === '1' }); // throws 402 when payment is needed
  let narrative = r.narrative;
  if (!narrative) { // first download writes and stores the narrative so later downloads are identical
    narrative = await writeNarrative(r.result, r.language as 'en', { ownerId: user.id });
    await updateReport(user.id, r.id, { narrative: { ...narrative, status: 'final' }, status: 'final' });
  }
  const out = await renderReportPdf({ result: r.result, narrative, ...style });
  return pdfResponse(out.pdf, `${name}-numerology-report-v${r.version}.pdf`, { 'x-render-ms': String(out.ms) });
});
