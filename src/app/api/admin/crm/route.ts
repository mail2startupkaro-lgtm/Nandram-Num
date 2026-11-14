import { z } from 'zod';
import {
  addActivity, autoSync, bulk, contactsCsv, createContact, createTask, dashboard, deleteContacts, deleteTag, getContact, importContacts,
  ListFilter, listContacts, listTags, listTasks, owners, setTags, setWhatsappConsent, syncContacts, upcomingBirthdays, updateContact, updateTask, deleteTask,
} from '@/lib/crm';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admin → CRM (read). ?view=dashboard | contacts | contact&id= | tasks&tasks=open|overdue|today|upcoming|done | tags | owners | birthdays&days= ; contacts&format=csv */
export const GET = withAdmin(async (req) => {
  const u = new URL(req.url);
  const p = Object.fromEntries(u.searchParams.entries());
  switch (p.view) {
    case 'dashboard': { const synced = await autoSync(); return json({ ...(await dashboard()), synced }); }
    case 'contact': return json(await getContact(z.string().parse(p.id)));
    case 'tasks': return json(await listTasks(z.enum(['open', 'overdue', 'today', 'upcoming', 'done']).catch('open').parse(p.tasks)));
    case 'tags': return json({ tags: await listTags() });
    case 'owners': return json({ owners: await owners() });
    case 'birthdays': return json({ birthdays: await upcomingBirthdays(z.coerce.number().int().min(0).max(60).catch(30).parse(p.days)) });
    default: {
      const csv = p.format === 'csv';
      const f = ListFilter.parse({ ...p, ...(csv ? { page: 1, pageSize: 5000 } : {}) });
      const r = await listContacts(f);
      if (!csv) return json(r);
      return new Response('﻿' + contactsCsv(r.contacts), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="crm-contacts-${new Date().toISOString().slice(0, 10)}.csv"`, 'cache-control': 'no-store' } });
    }
  }
});

const Op = z.object({ op: z.string(), id: z.string().optional() }).passthrough();

/** Admin → CRM (write). Body: { op, ... } */
export const POST = withAdmin(async (req, user) => {
  const body = Op.parse(await readJson(req, 5_000_000));
  const by = user.id;
  const { op, id, ...rest } = body;
  switch (op) {
    case 'create': return json(await createContact(rest, by), 201);
    case 'update': await updateContact(z.string().parse(id), rest, by); return json({ ok: true });
    case 'delete': return json({ ok: true, n: await deleteContacts([z.string().parse(id)]) });
    case 'activity': return json(await addActivity(z.string().parse(id), rest, by), 201);
    case 'consent': await setWhatsappConsent(z.string().parse(id), z.boolean().parse(rest.on), by); return json({ ok: true });
    case 'tag': { const t = z.object({ tag: z.string().trim().min(1).max(60), remove: z.boolean().default(false) }).parse(rest); await setTags([z.string().parse(id)], [t.tag], t.remove ? 'remove' : 'add'); return json({ ok: true }); }
    case 'tagDelete': await deleteTag(z.string().parse(id)); return json({ ok: true });
    case 'task': return json(await createTask(rest, by), 201);
    case 'taskUpdate': return json(await updateTask({ ...rest, id }, by));
    case 'taskDelete': return json(await deleteTask(z.string().parse(id)));
    case 'bulk': return json(await bulk(rest, by));
    case 'sync': return json(await syncContacts(by));
    case 'import': return json(await importContacts(z.array(z.record(z.unknown())).max(5000).parse(rest.rows), by));
    default: return json({ error: 'UNKNOWN_OP' }, 400);
  }
});
