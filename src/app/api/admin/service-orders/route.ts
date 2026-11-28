import { after } from 'next/server';
import { z } from 'zod';
import { getServiceOrderImage, getServiceOrderReport, listServiceOrders, removeServiceOrderReport, resetServiceOrderDelivery, saveServiceOrderReport, SERVICE_REPORT_MAX_BYTES, ServiceOrderUpdate, updateServiceOrder } from '@/lib/billing/services';
import { NotFoundError } from '@/lib/db/repo/profiles';
import { withAdmin } from '@/lib/server/admin';
import { json, pdfResponse, readJson } from '@/lib/server/http';
import { canAutoGenerate } from '@/lib/service-delivery';
import { deliverServiceOrder, runDueDeliveries, shouldKick } from '@/lib/server/service-delivery-run';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const Lang = z.enum(['en', 'hi']);

export const GET = withAdmin(async (req) => {
  const q = new URL(req.url).searchParams;
  // ?image=<order id> → the signature photo the client uploaded with that order.
  const imageFor = q.get('image');
  if (imageFor) {
    const image = await getServiceOrderImage(imageFor);
    if (!image) throw new NotFoundError('IMAGE_NOT_FOUND');
    return json({ image });
  }
  // ?report=<order id>&lang=en|hi → the finished report PDF stored on the order.
  const reportFor = q.get('report');
  if (reportFor) {
    const lang = Lang.safeParse(q.get('lang'));
    const r = await getServiceOrderReport(reportFor, undefined, lang.success ? lang.data : undefined);
    if (!r) throw new NotFoundError('REPORT_NOT_FOUND');
    return pdfResponse(r.pdf, r.fileName);
  }
  // Opening the orders also delivers anything past its 3-hour mark (in the background, at most once a minute).
  if (shouldKick('admin-orders')) after(() => runDueDeliveries({ budgetMs: 240_000 }).then(() => undefined).catch((e) => console.error('[admin] delivery sweep:', e)));
  const orders = await listServiceOrders({ status: q.get('status') ?? 'all' });
  return json({ orders: orders.map((o) => ({ ...o, canAuto: canAutoGenerate(o.serviceCode, o.details as Record<string, string | undefined>, { hasSignatureImage: o.hasSignatureImage }) })) });
});

/** Status / note / hold. Choosing "Delivered" is the numerologist's approval: the report is delivered now (see POST). */
export const PATCH = withAdmin(async (req) => {
  const u = ServiceOrderUpdate.parse(await readJson(req));
  if (u.status === 'delivered') {
    const { status: _s, ...rest } = u; void _s;
    if (!(await updateServiceOrder({ ...rest, onHold: false }))) throw new NotFoundError('ORDER_NOT_FOUND');
    const r = await deliverServiceOrder(u.id, { by: 'admin' });
    return json({ ok: r.result === 'delivered' || r.result === 'notified', delivery: r }, r.result === 'failed' ? 422 : 200);
  }
  if (!(await updateServiceOrder(u))) throw new NotFoundError('ORDER_NOT_FOUND');
  return json({ ok: true });
});

/**
 * Actions on one order:
 *   approve  – the numerologist approves: deliver now (missing language written by the system) + SMS / email to the client
 *   retry    – clear a failed automatic delivery so it is tried again now
 *   renotify – send the "report ready" SMS / email again
 */
const Action = z.object({ id: z.string().min(1).max(64), action: z.enum(['approve', 'retry', 'renotify']) });
export const POST = withAdmin(async (req) => {
  const b = Action.parse(await readJson(req));
  if (b.action === 'approve') {
    if (!(await updateServiceOrder({ id: b.id, onHold: false }))) throw new NotFoundError('ORDER_NOT_FOUND');
    const r = await deliverServiceOrder(b.id, { by: 'admin' });
    return json({ ok: r.result === 'delivered', delivery: r }, r.result === 'failed' ? 422 : 200);
  }
  if (!(await resetServiceOrderDelivery(b.id, { renotify: b.action === 'renotify' }))) throw new NotFoundError('ORDER_NOT_FOUND');
  const r = await deliverServiceOrder(b.id, { by: 'auto' });
  return json({ ok: r.result !== 'failed', delivery: r }, r.result === 'failed' ? 422 : 200);
});

/**
 * Upload the finished report PDF for an order: { id, fileName, pdf: base64, lang }. This is the numerologist's approval:
 * the order becomes Delivered, the other language is written by the system if it is missing, and the client is notified.
 */
const Upload = z.object({ id: z.string().min(1).max(64), fileName: z.string().trim().min(1).max(160), pdf: z.string().min(10).max(Math.ceil(SERVICE_REPORT_MAX_BYTES * 1.37)), lang: Lang.default('en') });
export const PUT = withAdmin(async (req) => {
  const b = Upload.parse(await readJson(req, Math.ceil(SERVICE_REPORT_MAX_BYTES * 1.4)));
  const bytes = new Uint8Array(Buffer.from(b.pdf.replace(/^data:application\/pdf;base64,/, ''), 'base64'));
  try {
    const name = /\.pdf$/i.test(b.fileName) ? b.fileName : `${b.fileName}.pdf`;
    if (!(await saveServiceOrderReport(b.id, bytes, name, { markDelivered: true, lang: b.lang, deliveredBy: 'admin' }))) throw new NotFoundError('ORDER_NOT_FOUND');
  } catch (e) {
    if (e instanceof Error && (e.message === 'NOT_A_PDF' || e.message === 'REPORT_TOO_LARGE')) return json({ error: e.message }, 400);
    throw e;
  }
  after(() => deliverServiceOrder(b.id, { by: 'admin' }).then(() => undefined).catch((e) => console.error('[admin] delivery after upload:', e)));
  return json({ ok: true });
});

/** ?id=<order id>&lang=en|hi → removes the stored report (one language, or both). */
export const DELETE = withAdmin(async (req) => {
  const q = new URL(req.url).searchParams;
  const id = q.get('id'); const lang = Lang.safeParse(q.get('lang'));
  if (!id || !(await removeServiceOrderReport(id, undefined, lang.success ? lang.data : undefined))) throw new NotFoundError('ORDER_NOT_FOUND');
  return json({ ok: true });
});
