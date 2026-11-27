import { z } from 'zod';
import { getServiceOrderImage, getServiceOrderReport, listServiceOrders, removeServiceOrderReport, saveServiceOrderReport, SERVICE_REPORT_MAX_BYTES, ServiceOrderUpdate, updateServiceOrder } from '@/lib/billing/services';
import { NotFoundError } from '@/lib/db/repo/profiles';
import { withAdmin } from '@/lib/server/admin';
import { json, pdfResponse, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (req) => {
  const q = new URL(req.url).searchParams;
  // ?image=<order id> → the signature photo the client uploaded with that order.
  const imageFor = q.get('image');
  if (imageFor) {
    const image = await getServiceOrderImage(imageFor);
    if (!image) throw new NotFoundError('IMAGE_NOT_FOUND');
    return json({ image });
  }
  // ?report=<order id> → the finished report PDF stored on the order.
  const reportFor = q.get('report');
  if (reportFor) {
    const r = await getServiceOrderReport(reportFor);
    if (!r) throw new NotFoundError('REPORT_NOT_FOUND');
    return pdfResponse(r.pdf, r.fileName);
  }
  return json({ orders: await listServiceOrders({ status: q.get('status') ?? 'all' }) });
});

export const PATCH = withAdmin(async (req) => {
  if (!(await updateServiceOrder(ServiceOrderUpdate.parse(await readJson(req))))) throw new NotFoundError('ORDER_NOT_FOUND');
  return json({ ok: true });
});

/** Upload the finished report PDF for an order: { id, fileName, pdf: base64 }. The order becomes Delivered and the client can download it. */
const Upload = z.object({ id: z.string().min(1).max(64), fileName: z.string().trim().min(1).max(160), pdf: z.string().min(10).max(Math.ceil(SERVICE_REPORT_MAX_BYTES * 1.37)) });
export const PUT = withAdmin(async (req) => {
  const b = Upload.parse(await readJson(req, Math.ceil(SERVICE_REPORT_MAX_BYTES * 1.4)));
  const bytes = new Uint8Array(Buffer.from(b.pdf.replace(/^data:application\/pdf;base64,/, ''), 'base64'));
  try {
    const name = /\.pdf$/i.test(b.fileName) ? b.fileName : `${b.fileName}.pdf`;
    if (!(await saveServiceOrderReport(b.id, bytes, name, { markDelivered: true }))) throw new NotFoundError('ORDER_NOT_FOUND');
  } catch (e) {
    if (e instanceof Error && (e.message === 'NOT_A_PDF' || e.message === 'REPORT_TOO_LARGE')) return json({ error: e.message }, 400);
    throw e;
  }
  return json({ ok: true });
});

/** ?id=<order id> → removes the stored report (e.g. a wrong file was uploaded). */
export const DELETE = withAdmin(async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  if (!id || !(await removeServiceOrderReport(id))) throw new NotFoundError('ORDER_NOT_FOUND');
  return json({ ok: true });
});
