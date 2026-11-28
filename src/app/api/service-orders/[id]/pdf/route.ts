import { after } from 'next/server';
import { getServiceOrderImage, getServiceOrderReport, getUserServiceOrder, saveServiceOrderReport } from '@/lib/billing/services';
import { json, pdfResponse, withUser } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { canAutoGenerate, deliveryState } from '@/lib/service-delivery';
import { DetailsIncompleteError, generateServiceReport } from '@/lib/server/service-report';
import { deliverServiceOrder } from '@/lib/server/service-delivery-run';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * GET /api/service-orders/:id/pdf?lang=en|hi – the customer's finished report for a purchased service, in English or Hindi.
 *   409 REPORT_NOT_READY  (with the live delivery status) until the numerologist approves it or the 3-hour mark passes
 *   409 DETAILS_INCOMPLETE when the booking lacks the details the report needs
 * A language that is not stored yet is written by the system and stored, so later downloads are identical; when the
 * report is due but not yet delivered, the full delivery (both languages + SMS / email) runs right after this response.
 */
export const GET = withUser<{ id: string }>(async (req, user, { params }) => {
  const rl = rateLimit(`svcpdf:${user.id}`, 20, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const o = await getUserServiceOrder(user.id, params.id);
  if (!o) return json({ error: 'ORDER_NOT_FOUND' }, 404);
  const d = o.details as Record<string, string | undefined>;
  const canWrite = canAutoGenerate(o.serviceCode, d, { hasSignatureImage: o.hasSignatureImage });
  const delivery = deliveryState({ status: o.status, paidAt: o.paidAt, deliveredAt: o.deliveredAt, onHold: o.onHold, hasFile: o.hasReportFile, auto: canWrite });
  if (delivery.state !== 'ready') return json({ error: 'REPORT_NOT_READY', delivery }, 409);

  const q = new URL(req.url).searchParams.get('lang');
  const lang: 'en' | 'hi' = q === 'hi' ? 'hi' : q === 'en' ? 'en' : d.language === 'hi' ? 'hi' : 'en';
  if (o.status !== 'delivered') after(() => deliverServiceOrder(o.id, { by: 'auto' }).then(() => undefined).catch((e) => console.error('[service-orders] delivery:', e)));

  const stored = await getServiceOrderReport(o.id, undefined, lang);
  if (stored) return pdfResponse(stored.pdf, stored.fileName);
  if (!canWrite) {
    // Only the other language was uploaded and the system cannot write this one from the booking.
    const other = await getServiceOrderReport(o.id);
    if (other && !q) return pdfResponse(other.pdf, other.fileName);
    return json({ error: other ? 'LANGUAGE_NOT_AVAILABLE' : 'DETAILS_INCOMPLETE', available: other?.lang ?? null }, 409);
  }
  try {
    const signatureImage = o.serviceCode === 'SVC_SIGNATURE' ? await getServiceOrderImage(o.id) : null;
    const out = await generateServiceReport({ serviceCode: o.serviceCode, details: d, signatureImage }, lang, { email: user.email });
    await saveServiceOrderReport(o.id, out.pdf, out.fileName, { lang }).catch((e) => console.error('[service-orders] could not store report:', e instanceof Error ? e.message : e));
    return pdfResponse(out.pdf, out.fileName, { 'x-page-count': String(out.pageCount) });
  } catch (e) {
    if (e instanceof DetailsIncompleteError) return json({ error: 'DETAILS_INCOMPLETE' }, 409);
    throw e;
  }
});
