import { z } from 'zod';
import { ContactUpdate, deleteContactMessage, listContactMessages, updateContactMessage } from '@/lib/contact';
import { CONTACT_STATUSES } from '@/lib/contact-options';
import { withAdmin } from '@/lib/server/admin';
import { NotFoundError } from '@/lib/db/repo/profiles';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (req) => {
  const u = new URL(req.url);
  const status = z.enum([...CONTACT_STATUSES, 'all']).catch('all').parse(u.searchParams.get('status') ?? 'all');
  const topic = u.searchParams.get('topic') ?? 'all';
  return json(await listContactMessages({ status, topic }));
});

export const PATCH = withAdmin(async (req) => {
  if (!(await updateContactMessage(ContactUpdate.parse(await readJson(req))))) throw new NotFoundError('MESSAGE_NOT_FOUND');
  return json({ ok: true });
});

export const DELETE = withAdmin(async (req) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(await readJson(req));
  if (!(await deleteContactMessage(id))) throw new NotFoundError('MESSAGE_NOT_FOUND');
  return json({ ok: true });
});
