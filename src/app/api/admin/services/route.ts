import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { deleteService, listServices, saveService, ServiceSchema } from '@/lib/billing/services';
import { withAdmin } from '@/lib/server/admin';
import { SERVICE_PAGES } from '@/lib/service-pages';

const refresh = () => { revalidatePath('/services'); for (const p of SERVICE_PAGES) revalidatePath(`/${p.slug}`); };
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async () => json({ services: await listServices({ includeInactive: true }) }));
export const PUT = withAdmin(async (req) => { await saveService(ServiceSchema.parse(await readJson(req, 50_000))); refresh(); return json({ ok: true }); });
export const DELETE = withAdmin(async (req) => {
  const { code } = z.object({ code: z.string().min(1) }).parse(await readJson(req));
  const r = await deleteService(code);
  if (r === 'deleted') refresh();
  return r === 'in_use' ? json({ error: 'SERVICE_IN_USE' }, 409) : json({ ok: true });
});
