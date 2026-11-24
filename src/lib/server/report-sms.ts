import { eq } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { clientProfiles, reports, users } from '@/lib/db/schema';
import { hydrate } from '@/lib/db/repo/reports';
import { createShareLink } from '@/lib/db/repo/shares';
import { sendReportSms, normalizeIndianMobile, type Fast2SmsResult } from '@/lib/sms/fast2sms';
import { decryptJson } from '@/lib/security/crypto';
import type { StoredInput } from '@/lib/numerology/schemas';
import { pdfStyleFor } from '@/lib/branding';

export interface DeliverReportSmsOptions {
  reportId: string;
  targetPhone?: string;
  db?: Db;
  appOrigin?: string;
}

export type DeliverReportSmsResult =
  | { ok: true; sentTo: string; requestId?: string; reportUrl: string }
  | {
      ok: false;
      reason: 'REPORT_NOT_FOUND' | 'NO_PHONE_PROVIDED' | 'INVALID_PHONE' | 'DELIVERY_FAILED';
      error?: string;
    };

/**
 * Resolves client phone, creates a public share link, and sends the link via Fast2SMS SMS.
 */
export async function deliverReportBySms(opts: DeliverReportSmsOptions): Promise<DeliverReportSmsResult> {
  const db = opts.db || getDb();

  const [row] = await db
    .select({
      r: reports,
      ownerId: clientProfiles.ownerId,
      profileInputEnc: clientProfiles.inputEnc,
      userPhone: users.phone,
    })
    .from(reports)
    .innerJoin(clientProfiles, eq(clientProfiles.id, reports.profileId))
    .innerJoin(users, eq(users.id, clientProfiles.ownerId))
    .where(eq(reports.id, opts.reportId))
    .limit(1);

  if (!row) return { ok: false, reason: 'REPORT_NOT_FOUND' };

  const hydrated = hydrate(row.r);
  let profilePhone: string | undefined;
  try {
    const profileInput = decryptJson<StoredInput>(row.profileInputEnc);
    profilePhone = (profileInput as any).phone || (profileInput as any).mobile;
  } catch {
    // profile input decrypt fallback
  }

  const rawPhone = (
    opts.targetPhone?.trim() ||
    (hydrated.result.client as any).phone ||
    (hydrated.result.client as any).mobile ||
    profilePhone ||
    row.userPhone ||
    ''
  ).trim();

  if (!rawPhone) {
    return { ok: false, reason: 'NO_PHONE_PROVIDED' };
  }

  const validPhone = normalizeIndianMobile(rawPhone);
  if (!validPhone) {
    return {
      ok: false,
      reason: 'INVALID_PHONE',
      error: `Invalid Indian mobile number: ${rawPhone}. Must be 10 digits.`,
    };
  }

  // Create or get a share link valid for 30 days
  const share = await createShareLink(row.ownerId, opts.reportId, { days: 30 });
  const origin = (opts.appOrigin || process.env.APP_URL || 'https://www.mynumerologist.com').replace(/\/$/, '');
  const reportUrl = `${origin}/s/${share.token}`;

  const clientName = hydrated.result.client.commonName || hydrated.result.client.fullName || 'Client';
  const style = await pdfStyleFor(row.ownerId, hydrated.theme);
  const brandName = style.branding?.brandName || 'myNumerologist.com';

  const smsRes: Fast2SmsResult = await sendReportSms({
    to: validPhone,
    clientName,
    reportUrl,
    brandName,
  });

  if (!smsRes.ok) {
    return {
      ok: false,
      reason: 'DELIVERY_FAILED',
      error: smsRes.message || 'Fast2SMS delivery failed',
    };
  }

  return {
    ok: true,
    sentTo: validPhone,
    requestId: smsRes.requestId,
    reportUrl,
  };
}
