import { getServiceOrderReport, getUserServiceOrder, saveServiceOrderReport, updateServiceOrder } from '@/lib/billing/services';
import { pdfStyleFor } from '@/lib/branding';
import { generateNumerology } from '@/lib/numerology';
import { renderReportPdf } from '@/lib/pdf/render';
import { json, pdfResponse, slug, withUser } from '@/lib/server/http';
import { writeNarrative } from '@/lib/server/reports';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { AUTO_REPORTS, autoModules, deliveryState, intakeToClientInput, isAutoService } from '@/lib/service-delivery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * GET /api/service-orders/:id/pdf – the customer's finished report for a purchased service.
 *   409 REPORT_NOT_READY  (with the live delivery status) until the 3-hour mark / admin release
 *   409 DETAILS_INCOMPLETE when the booking lacks a name or date of birth for an automatic report
 * The first download of an automatic report generates it and stores it on the order, so later downloads are identical.
 */
export const GET = withUser<{ id: string }>(async (_req, user, { params }) => {
  const rl = rateLimit(`svcpdf:${user.id}`, 20, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const o = await getUserServiceOrder(user.id, params.id);
  if (!o) return json({ error: 'ORDER_NOT_FOUND' }, 404);
  const auto = isAutoService(o.serviceCode);
  const delivery = deliveryState({ status: o.status, paidAt: o.paidAt, deliveredAt: o.deliveredAt, onHold: o.onHold, hasFile: o.hasReportFile, auto });
  if (delivery.state !== 'ready') return json({ error: 'REPORT_NOT_READY', delivery }, 409);

  const stored = await getServiceOrderReport(o.id);
  if (stored) return pdfResponse(stored.pdf, stored.fileName);
  if (!auto) return json({ error: 'REPORT_NOT_READY', delivery }, 409); // marked delivered but no file uploaded – sent by email / Telegram

  const d = o.details as Record<string, string | undefined>;
  const input = intakeToClientInput(o.serviceCode, d, { email: user.email });
  if (!input) return json({ error: 'DETAILS_INCOMPLETE' }, 409);
  const spec = AUTO_REPORTS[o.serviceCode];
  const result = generateNumerology(input, { modules: autoModules(o.serviceCode, input) });
  const narrative = await writeNarrative(result, input.language, { ownerId: null });
  const style = await pdfStyleFor(null); // house branding (myNumerologist.com · Acharya Nandram)
  const lang = input.language === 'hi' ? 'hi' : 'en';
  const out = await renderReportPdf({ result, narrative, language: input.language, theme: style.theme, branding: style.branding, reportTitle: spec.title[lang], hiddenChapters: spec.hiddenChapters });
  const fileName = `${slug(input.fullName)}-${slug(spec.title.en)}.pdf`;
  await saveServiceOrderReport(o.id, out.pdf, fileName).catch((e) => console.error('[service-orders] could not store report:', e instanceof Error ? e.message : e));
  if (o.status === 'paid' || o.status === 'in_progress') await updateServiceOrder({ id: o.id, status: 'delivered' }).catch(() => undefined);
  return pdfResponse(out.pdf, fileName, { 'x-page-count': String(out.pageCount) });
});
