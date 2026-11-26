import { getServiceOrderImage, listServiceOrders, ServiceOrderUpdate, updateServiceOrder } from '@/lib/billing/services';
import { NotFoundError } from '@/lib/db/repo/profiles';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';

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
  return json({ orders: await listServiceOrders({ status: q.get('status') ?? 'all' }) });
});
export const PATCH = withAdmin(async (req) => {
  if (!(await updateServiceOrder(ServiceOrderUpdate.parse(await readJson(req))))) throw new NotFoundError('ORDER_NOT_FOUND');
  return json({ ok: true });
});
