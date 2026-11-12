import { listServiceOrders, ServiceOrderUpdate, updateServiceOrder } from '@/lib/billing/services';
import { NotFoundError } from '@/lib/db/repo/profiles';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (req) => json({ orders: await listServiceOrders({ status: new URL(req.url).searchParams.get('status') ?? 'all' }) }));
export const PATCH = withAdmin(async (req) => {
  if (!(await updateServiceOrder(ServiceOrderUpdate.parse(await readJson(req))))) throw new NotFoundError('ORDER_NOT_FOUND');
  return json({ ok: true });
});
