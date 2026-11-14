import { and, eq } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { clientProfiles, reports, users } from '@/lib/db/schema';
import { hydrate, updateReport } from '@/lib/db/repo/reports';
import { pdfStyleFor } from '@/lib/branding';
import { renderReportPdf } from '@/lib/pdf/render';
import { writeNarrative } from '@/lib/server/reports';
import { sendReportEmail, type ReportEmailResult } from '@/lib/email/report-email';
import { slug } from '@/lib/server/http';
import { decryptJson } from '@/lib/security/crypto';
import type { StoredInput } from '@/lib/numerology/schemas';

export interface DeliverReportOptions {
  reportId: string;
  targetEmail?: string;
  theme?: string;
  db?: Db;
}

export type DeliverReportResult =
  | { ok: true; sentTo: string; id?: string; dev?: boolean }
  | { ok: false; reason: 'REPORT_NOT_FOUND' | 'NO_EMAIL_PROVIDED' | 'DELIVERY_FAILED'; error?: string };

/**
 * Renders the complete PDF report and sends it to the client's email ID if provided.
 * Resolves the recipient email in order of priority:
 *   1. targetEmail passed explicitly
 *   2. report.result.client.email
 *   3. clientProfile.input.email
 *   4. user.email
 */
export async function deliverReportByEmail(opts: DeliverReportOptions): Promise<DeliverReportResult> {
  const db = opts.db || getDb();

  const [row] = await db
    .select({
      r: reports,
      ownerId: clientProfiles.ownerId,
      profileInputEnc: clientProfiles.inputEnc,
      userEmail: users.email,
    })
    .from(reports)
    .innerJoin(clientProfiles, eq(clientProfiles.id, reports.profileId))
    .innerJoin(users, eq(users.id, clientProfiles.ownerId))
    .where(eq(reports.id, opts.reportId))
    .limit(1);

  if (!row) return { ok: false, reason: 'REPORT_NOT_FOUND' };

  const hydrated = hydrate(row.r);
  let profileEmail: string | undefined;
  try {
    const profileInput = decryptJson<StoredInput>(row.profileInputEnc);
    profileEmail = profileInput.email;
  } catch {
    // profile input decrypt fallback
  }

  const recipient = (
    opts.targetEmail?.trim() ||
    hydrated.result.client.email ||
    profileEmail ||
    row.userEmail ||
    ''
  ).trim();

  if (!recipient || !recipient.includes('@')) {
    return { ok: false, reason: 'NO_EMAIL_PROVIDED' };
  }

  // Ensure narrative exists
  let narrative = hydrated.narrative;
  if (!narrative) {
    narrative = await writeNarrative(hydrated.result, hydrated.language as 'en', { ownerId: row.ownerId });
    await updateReport(row.ownerId, opts.reportId, { narrative: { ...narrative, status: 'final' }, status: 'final' }, db);
  }

  // Render PDF
  const style = await pdfStyleFor(row.ownerId, opts.theme || hydrated.theme);
  const out = await renderReportPdf({
    result: hydrated.result,
    narrative,
    ...style,
  });

  const clientName = hydrated.result.client.commonName || hydrated.result.client.fullName || 'Client';
  const nameSlug = slug(clientName);
  const fileName = `${nameSlug}-numerology-report-v${hydrated.version}.pdf`;
  const appUrl = process.env.APP_URL || '';
  const reportUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/reading?report=${hydrated.id}` : undefined;

  const emailRes: ReportEmailResult = await sendReportEmail({
    to: recipient,
    clientName,
    reportPdf: out.pdf,
    fileName,
    reportUrl,
    language: hydrated.language as 'en' | 'hi' | 'hinglish',
    brandName: style.branding?.brandName,
    expertName: style.branding?.expertName,
  });

  if (!emailRes.ok) {
    return { ok: false, reason: 'DELIVERY_FAILED', error: emailRes.error };
  }

  return { ok: true, sentTo: recipient, id: emailRes.id, dev: emailRes.dev };
}
