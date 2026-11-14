/**
 * CRM for Admin → CRM. One contact = one row in marketing_leads (unique phone / email).
 * Contacts come from the services funnel, the free e-book popup, sign-ups, paying customers, the Contact Us form,
 * manual entry and CSV import. Timeline = crm_activities, follow-ups = crm_tasks, tags = marketing_tags / lead_tags.
 * Server-only. All SQL uses bound parameters.
 */
import { sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type Db } from '@/lib/db/client';
import { decryptJson } from '@/lib/security/crypto';
import { normaliseContactPhone } from '@/lib/contact';
import { bhagyank, moolank, parseDate, personalYearOn, todayIST, toIso } from '@/lib/numerology';

export const STAGES = ['new', 'contacted', 'interested', 'consultation', 'proposal', 'won', 'lost'] as const;
export type Stage = (typeof STAGES)[number];
export const OPEN_STAGES: Stage[] = ['new', 'contacted', 'interested', 'consultation', 'proposal'];
export const ACTIVITY_TYPES = ['note', 'call', 'whatsapp', 'email', 'meeting'] as const;
export const PRIORITIES = ['low', 'normal', 'high'] as const;
export const SOURCES = ['manual', 'services-funnel', 'website', 'signup', 'purchase', 'contact-form', 'import', 'whatsapp', 'youtube-live', 'instagram', 'facebook', 'referral', 'walk-in'] as const;

const rows = async <T,>(db: Db, q: SQL) => ((await db.execute(q)) as unknown as { rows: T[] }).rows;
const one = async <T,>(db: Db, q: SQL) => (await rows<T>(db, q))[0];
const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => { try { const d = parseDate(s); return d.year >= 1900 && toIso(d) <= toIso(todayIST()); } catch { return false; } }, 'DOB_INVALID');
const opt = (n: number) => z.string().trim().max(n).optional().nullable().transform((v) => (v ? v : null));

/** Business-rule error; http.ts turns it into { error: code, ...extra } with this status. */
export class CrmError extends Error { readonly crm = true; constructor(public code: string, public status = 400, public extra: Record<string, unknown> = {}) { super(code); this.name = 'CrmError'; } }

function numbers(dob: string | null) {
  if (!dob) return { moolank: null as number | null, bhagyank: null as number | null };
  try { const d = parseDate(dob); return { moolank: moolank(d.day).value, bhagyank: bhagyank(d).value }; } catch { return { moolank: null, bhagyank: null }; }
}
const lower = (e: string | null | undefined) => (e ? e.trim().toLowerCase() : null);

// ---------------------------------------------------------------- list / filters
export const ListFilter = z.object({
  q: z.string().trim().max(100).optional(),
  stage: z.enum([...STAGES, 'open', 'all']).default('all'),
  source: z.string().max(80).optional(),
  tag: z.string().uuid().optional(),
  owner: z.string().max(60).optional(), // user id | 'none'
  priority: z.enum(PRIORITIES).optional(),
  moolank: z.coerce.number().int().min(1).max(9).optional(),
  bhagyank: z.coerce.number().int().min(1).max(9).optional(),
  language: z.enum(['en', 'hi']).optional(),
  consent: z.enum(['whatsapp', 'none']).optional(),
  followUp: z.enum(['overdue', 'today', 'week', 'none']).optional(),
  birthday: z.enum(['today', 'week', 'month']).optional(),
  stale: z.coerce.number().int().min(1).max(365).optional(), // open contacts not contacted for N days
  sort: z.enum(['recent', 'created', 'name', 'followup', 'value', 'score']).default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(5000).default(50),
});
export type ListFilter = z.infer<typeof ListFilter>;

const IST = sql`(now() AT TIME ZONE 'Asia/Kolkata')`;
function whereFor(f: ListFilter): SQL {
  const w: SQL[] = [sql`true`];
  if (f.q) { const like = `%${f.q.replace(/[%_\\]/g, (m) => '\\' + m)}%`; const digits = f.q.replace(/\D/g, ''); w.push(sql`(l.full_name ILIKE ${like} OR l.email ILIKE ${like} OR l.city ILIKE ${like}${digits.length >= 4 ? sql` OR l.phone LIKE ${'%' + digits + '%'}` : sql``})`); }
  if (f.stage === 'open') w.push(sql`l.crm_stage NOT IN ('won','lost')`); else if (f.stage !== 'all') w.push(sql`l.crm_stage = ${f.stage}`);
  if (f.source) w.push(sql`l.lead_source = ${f.source}`);
  if (f.tag) w.push(sql`EXISTS (SELECT 1 FROM lead_tags lt WHERE lt.lead_id = l.id AND lt.tag_id = ${f.tag}::uuid)`);
  if (f.owner === 'none') w.push(sql`l.owner_id IS NULL`); else if (f.owner) w.push(sql`l.owner_id = ${f.owner}`);
  if (f.priority) w.push(sql`l.priority = ${f.priority}`);
  if (f.moolank) w.push(sql`l.moolank = ${f.moolank}`);
  if (f.bhagyank) w.push(sql`l.bhagyank = ${f.bhagyank}`);
  if (f.language) w.push(sql`l.language = ${f.language}`);
  const consent = sql`EXISTS (SELECT 1 FROM marketing_consents c WHERE c.lead_id = l.id AND c.channel = 'whatsapp' AND c.status = 'opted_in')`;
  if (f.consent === 'whatsapp') w.push(consent); else if (f.consent === 'none') w.push(sql`NOT ${consent}`);
  if (f.followUp === 'overdue') w.push(sql`l.next_follow_up_at < now()`);
  else if (f.followUp === 'today') w.push(sql`(l.next_follow_up_at AT TIME ZONE 'Asia/Kolkata')::date = ${IST}::date`);
  else if (f.followUp === 'week') w.push(sql`l.next_follow_up_at < now() + interval '7 days'`);
  else if (f.followUp === 'none') w.push(sql`l.next_follow_up_at IS NULL AND l.crm_stage NOT IN ('won','lost')`);
  if (f.birthday) {
    const days = f.birthday === 'today' ? 0 : f.birthday === 'week' ? 6 : 30;
    w.push(sql`l.dob IS NOT NULL AND EXISTS (SELECT 1 FROM generate_series(0, ${days}) g(n) WHERE to_char(${IST}::date + g.n, 'MM-DD') = to_char(l.dob, 'MM-DD'))`);
  }
  if (f.stale) w.push(sql`l.crm_stage NOT IN ('won','lost') AND COALESCE(l.last_contacted_at, l.created_at) < now() - make_interval(days => ${f.stale})`);
  return sql.join(w, sql` AND `);
}

const SELECT = sql`
  l.id, l.full_name AS name, l.email, l.phone, l.dob::text AS dob, l.gender, l.city, l.state, l.country, l.language,
  l.moolank, l.bhagyank, l.primary_concern AS service, l.lead_source AS source, l.lead_magnet AS magnet,
  l.lifecycle_stage AS lifecycle, l.crm_stage AS stage, l.owner_id AS "ownerId", ou.name AS "ownerName", l.deal_value_paise AS "dealValuePaise",
  l.priority, l.next_follow_up_at AS "nextFollowUpAt", l.last_contacted_at AS "lastContactedAt", l.stage_changed_at AS "stageChangedAt",
  l.lost_reason AS "lostReason", l.notes, l.user_id AS "userId", l.utm_source AS "utmSource", l.utm_medium AS "utmMedium", l.utm_campaign AS "utmCampaign",
  l.created_at AS "createdAt", l.updated_at AS "updatedAt",
  EXISTS (SELECT 1 FROM marketing_consents c WHERE c.lead_id = l.id AND c.channel = 'whatsapp' AND c.status = 'opted_in') AS "waConsent",
  COALESCE((SELECT json_agg(json_build_object('id', t.id, 'name', t.name) ORDER BY t.name) FROM lead_tags lt JOIN marketing_tags t ON t.id = lt.tag_id WHERE lt.lead_id = l.id), '[]'::json) AS tags,
  (SELECT count(*)::int FROM crm_tasks k WHERE k.lead_id = l.id AND k.done_at IS NULL) AS "openTasks",
  (SELECT count(*)::int FROM crm_activities a WHERE a.lead_id = l.id AND a.type IN ('call','whatsapp','email','meeting')) AS touches,
  COALESCE((SELECT sum(p.amount_paise)::int FROM payments p WHERE l.user_id IS NOT NULL AND p.user_id = l.user_id AND p.status = 'paid' AND COALESCE(p.currency,'INR') = 'INR'), 0) AS "paidPaise",
  (SELECT count(*)::int FROM payments p WHERE l.user_id IS NOT NULL AND p.user_id = l.user_id AND p.status = 'paid') AS "paidOrders"`;

export interface ContactRow {
  id: string; name: string; email: string | null; phone: string | null; dob: string | null; gender: string | null; city: string | null; state: string | null; country: string | null; language: string | null;
  moolank: number | null; bhagyank: number | null; service: string | null; source: string; magnet: string | null; lifecycle: string; stage: Stage; ownerId: string | null; ownerName: string | null;
  dealValuePaise: number | null; priority: string; nextFollowUpAt: string | null; lastContactedAt: string | null; stageChangedAt: string; lostReason: string | null; notes: string | null; userId: string | null;
  utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; createdAt: string; updatedAt: string; waConsent: boolean; tags: { id: string; name: string }[];
  openTasks: number; touches: number; paidPaise: number; paidOrders: number; score: number;
}

/** 0–100 lead score: how complete, how engaged and how warm the contact is. */
export function leadScore(r: Omit<ContactRow, 'score'>): number {
  let s = 0;
  if (r.phone) s += 10; if (r.email) s += 5; if (r.dob) s += 10; if (r.waConsent) s += 10;
  if (r.service) s += 10; if (r.magnet?.startsWith('sample-report')) s += 10; if (r.userId) s += 10;
  if (r.priority === 'high') s += 10;
  s += Math.min(15, r.touches * 5);
  const last = r.lastContactedAt ? new Date(r.lastContactedAt).getTime() : 0;
  if (last && Date.now() - last < 7 * 864e5) s += 10;
  if (r.paidOrders > 0) s += 20;
  if (r.stage === 'consultation' || r.stage === 'proposal') s += 10;
  if (r.stage === 'lost') s = Math.min(s, 20);
  return Math.min(100, s);
}

export async function listContacts(f: ListFilter, db: Db = getDb()) {
  const where = whereFor(f);
  const order = { recent: sql`l.updated_at DESC`, created: sql`l.created_at DESC`, name: sql`l.full_name ASC`, followup: sql`l.next_follow_up_at ASC NULLS LAST`, value: sql`l.deal_value_paise DESC NULLS LAST`, score: sql`l.updated_at DESC` }[f.sort];
  const list = await rows<Omit<ContactRow, 'score'>>(db, sql`SELECT ${SELECT} FROM marketing_leads l LEFT JOIN users ou ON ou.id = l.owner_id WHERE ${where} ORDER BY ${order} LIMIT ${f.pageSize} OFFSET ${(f.page - 1) * f.pageSize}`);
  const total = (await one<{ n: number }>(db, sql`SELECT count(*)::int AS n FROM marketing_leads l WHERE ${where}`))?.n ?? 0;
  const contacts: ContactRow[] = list.map((r) => ({ ...r, score: leadScore(r) }));
  if (f.sort === 'score') contacts.sort((a, b) => b.score - a.score);
  return { contacts, total, page: f.page, pageSize: f.pageSize };
}

// ---------------------------------------------------------------- dashboard
export async function dashboard(db: Db = getDb()) {
  const stages = await rows<{ stage: Stage; n: number; value: number }>(db, sql`SELECT crm_stage AS stage, count(*)::int AS n, COALESCE(sum(deal_value_paise),0)::int AS value FROM marketing_leads GROUP BY 1`);
  const k = await one<Record<string, number>>(db, sql`SELECT
    count(*)::int AS total,
    count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS "new7",
    count(*) FILTER (WHERE created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days')::int AS "newPrev7",
    count(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS "new30",
    count(*) FILTER (WHERE next_follow_up_at < now() AND crm_stage NOT IN ('won','lost'))::int AS overdue,
    count(*) FILTER (WHERE (next_follow_up_at AT TIME ZONE 'Asia/Kolkata')::date = ${IST}::date)::int AS "dueToday",
    count(*) FILTER (WHERE next_follow_up_at IS NULL AND crm_stage NOT IN ('won','lost'))::int AS "noFollowUp",
    count(*) FILTER (WHERE crm_stage NOT IN ('won','lost') AND COALESCE(last_contacted_at, created_at) < now() - interval '7 days')::int AS stale,
    count(*) FILTER (WHERE crm_stage = 'won' AND stage_changed_at >= now() - interval '30 days')::int AS "won30",
    count(*) FILTER (WHERE crm_stage = 'lost' AND stage_changed_at >= now() - interval '30 days')::int AS "lost30",
    count(*) FILTER (WHERE crm_stage = 'new' AND last_contacted_at IS NULL AND created_at < now() - interval '1 day')::int AS "uncontacted"
    FROM marketing_leads`);
  const revenue = await one<{ paise: number; customers: number }>(db, sql`SELECT COALESCE(sum(p.amount_paise),0)::int AS paise, count(DISTINCT p.user_id)::int AS customers FROM payments p WHERE p.status = 'paid' AND COALESCE(p.currency,'INR') = 'INR' AND p.paid_at >= now() - interval '30 days' AND p.user_id IN (SELECT user_id FROM marketing_leads WHERE user_id IS NOT NULL)`);
  const sources = await rows<{ source: string; n: number; won: number }>(db, sql`SELECT lead_source AS source, count(*)::int AS n, count(*) FILTER (WHERE crm_stage = 'won')::int AS won FROM marketing_leads GROUP BY 1 ORDER BY 2 DESC LIMIT 12`);
  const campaigns = await rows<{ campaign: string; n: number; won: number }>(db, sql`SELECT COALESCE(NULLIF(concat_ws(' / ', utm_source, utm_medium, utm_campaign), ''), 'direct') AS campaign, count(*)::int AS n, count(*) FILTER (WHERE crm_stage = 'won')::int AS won FROM marketing_leads WHERE created_at >= now() - interval '90 days' GROUP BY 1 ORDER BY 2 DESC LIMIT 8`);
  const interests = await rows<{ service: string; n: number }>(db, sql`SELECT primary_concern AS service, count(*)::int AS n FROM marketing_leads WHERE primary_concern IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 8`);
  const daily = await rows<{ day: string; n: number }>(db, sql`SELECT to_char(d, 'YYYY-MM-DD') AS day, (SELECT count(*)::int FROM marketing_leads WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = d) AS n FROM generate_series(${IST}::date - 29, ${IST}::date, interval '1 day') d`);
  const tasks = await rows<TaskRow>(db, sql`${TASK_SELECT} WHERE k.done_at IS NULL AND k.due_at < (${IST}::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata' ORDER BY k.due_at LIMIT 15`);
  const birthdays = await upcomingBirthdays(7, db);
  const recent = await rows<{ id: string; type: string; body: string | null; createdAt: string; leadId: string; name: string }>(db, sql`SELECT a.id, a.type, a.body, a.created_at AS "createdAt", a.lead_id AS "leadId", l.full_name AS name FROM crm_activities a JOIN marketing_leads l ON l.id = a.lead_id ORDER BY a.created_at DESC LIMIT 12`);
  const closed = (k?.won30 ?? 0) + (k?.lost30 ?? 0);
  return {
    kpi: { ...k, revenue30: revenue?.paise ?? 0, customers30: revenue?.customers ?? 0, winRate30: closed ? Math.round(((k?.won30 ?? 0) / closed) * 100) : null },
    stages: STAGES.map((s) => ({ stage: s, n: stages.find((x) => x.stage === s)?.n ?? 0, value: stages.find((x) => x.stage === s)?.value ?? 0 })),
    sources, campaigns, interests, daily, tasks, birthdays, recent,
  };
}

export async function upcomingBirthdays(days: number, db: Db = getDb()) {
  const list = await rows<{ id: string; name: string; phone: string | null; dob: string; language: string | null; stage: Stage; inDays: number; waConsent: boolean }>(db, sql`
    SELECT l.id, l.full_name AS name, l.phone, l.dob::text AS dob, l.language, l.crm_stage AS stage, g.n AS "inDays",
      EXISTS (SELECT 1 FROM marketing_consents c WHERE c.lead_id = l.id AND c.channel = 'whatsapp' AND c.status = 'opted_in') AS "waConsent"
    FROM marketing_leads l JOIN generate_series(0, ${days}) g(n) ON to_char(${IST}::date + g.n, 'MM-DD') = to_char(l.dob, 'MM-DD')
    WHERE l.dob IS NOT NULL ORDER BY g.n, l.full_name LIMIT 200`);
  const today = todayIST();
  return list.map((b) => {
    const d = parseDate(b.dob);
    const on = new Date(Date.UTC(today.year, today.month - 1, today.day + b.inDays));
    const date = { year: on.getUTCFullYear(), month: on.getUTCMonth() + 1, day: on.getUTCDate() };
    return { ...b, age: date.year - d.year, newPersonalYear: personalYearOn(d, date) };
  });
}

// ---------------------------------------------------------------- contact detail
export async function getContact(id: string, db: Db = getDb()) {
  uuid.parse(id);
  const c = await one<Omit<ContactRow, 'score'>>(db, sql`SELECT ${SELECT} FROM marketing_leads l LEFT JOIN users ou ON ou.id = l.owner_id WHERE l.id = ${id}::uuid`);
  if (!c) throw new CrmError('CONTACT_NOT_FOUND', 404);
  const activities = await rows<{ id: string; type: string; body: string | null; meta: Record<string, unknown>; createdAt: string; by: string | null }>(db, sql`SELECT a.id, a.type, a.body, a.meta, a.created_at AS "createdAt", u.name AS by FROM crm_activities a LEFT JOIN users u ON u.id = a.created_by WHERE a.lead_id = ${id}::uuid ORDER BY a.created_at DESC LIMIT 200`);
  const tasks = await rows<TaskRow>(db, sql`${TASK_SELECT} WHERE k.lead_id = ${id}::uuid ORDER BY k.done_at IS NOT NULL, k.due_at LIMIT 100`);
  const consents = await rows<{ channel: string; status: string; purpose: string; optedInAt: string; optedOutAt: string | null }>(db, sql`SELECT channel, status, purpose, opted_in_at AS "optedInAt", opted_out_at AS "optedOutAt" FROM marketing_consents WHERE lead_id = ${id}::uuid ORDER BY opted_in_at DESC`);
  const events = await rows<{ eventName: string; occurredAt: string }>(db, sql`SELECT event_name AS "eventName", occurred_at AS "occurredAt" FROM marketing_events WHERE lead_id = ${id}::uuid ORDER BY occurred_at DESC LIMIT 50`).catch(() => []);
  let purchases: { id: string; plan: string; amountPaise: number; currency: string | null; status: string; invoice: string | null; at: string }[] = [];
  let orders: { id: string; service: string; status: string; at: string; deliveredAt: string | null }[] = [];
  let account: { email: string | null; phone: string | null; credits: number; lastLoginAt: string | null; createdAt: string } | undefined;
  let reportsCount = 0;
  if (c.userId) {
    purchases = await rows(db, sql`SELECT id, plan_code AS plan, amount_paise AS "amountPaise", currency, status::text AS status, invoice_number AS invoice, COALESCE(paid_at, created_at) AS at FROM payments WHERE user_id = ${c.userId} ORDER BY created_at DESC LIMIT 50`);
    orders = await rows(db, sql`SELECT id, service_code AS service, status, created_at AS at, delivered_at AS "deliveredAt" FROM service_orders WHERE user_id = ${c.userId} ORDER BY created_at DESC LIMIT 50`);
    account = await one(db, sql`SELECT email, phone, credits, last_login_at AS "lastLoginAt", created_at AS "createdAt" FROM users WHERE id = ${c.userId}`);
    reportsCount = (await one<{ n: number }>(db, sql`SELECT count(*)::int AS n FROM reports r JOIN client_profiles p ON p.id = r.profile_id WHERE p.owner_id = ${c.userId}`).catch(() => ({ n: 0 })))?.n ?? 0;
  }
  let numerology: { moolank: number | null; bhagyank: number | null; personalYear: number | null; age: number | null } = { moolank: c.moolank, bhagyank: c.bhagyank, personalYear: null, age: null };
  if (c.dob) { try { const d = parseDate(c.dob), t = todayIST(); numerology = { ...numbers(c.dob), personalYear: personalYearOn(d, t), age: t.year - d.year - (t.month < d.month || (t.month === d.month && t.day < d.day) ? 1 : 0) }; } catch { /* keep stored */ } }
  return { contact: { ...c, score: leadScore(c) }, activities, tasks, consents, events, purchases, orders, account, reportsCount, numerology };
}

// ---------------------------------------------------------------- create / update / delete
export const ContactInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: opt(20), email: z.string().trim().toLowerCase().email().max(320).optional().nullable().or(z.literal('')).transform((v) => v || null),
  dob: isoDate.optional().nullable().or(z.literal('')).transform((v) => v || null),
  gender: z.enum(['male', 'female', 'other']).optional().nullable().or(z.literal('')).transform((v) => v || null),
  city: opt(100), state: opt(100), country: opt(100),
  language: z.enum(['en', 'hi']).default('en'),
  service: opt(50), source: z.string().trim().max(80).default('manual'),
  stage: z.enum(STAGES).default('new'), priority: z.enum(PRIORITIES).default('normal'),
  ownerId: opt(60), dealValueRupees: z.coerce.number().min(0).max(10_000_000).optional().nullable(),
  notes: opt(4000), whatsappConsent: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
});
export type ContactInput = z.input<typeof ContactInput>;

export async function findDuplicate(phone: string | null, email: string | null, db: Db = getDb(), exceptId?: string) {
  if (!phone && !email) return null;
  const r = await one<{ id: string; name: string }>(db, sql`SELECT id, full_name AS name FROM marketing_leads WHERE (${phone}::text IS NOT NULL AND phone = ${phone}) OR (${email}::text IS NOT NULL AND lower(email) = ${email}) ${exceptId ? sql`AND id <> ${exceptId}::uuid` : sql``} LIMIT 1`);
  return r ?? null;
}

function cleanPhone(raw: string | null | undefined) {
  if (!raw) return null;
  const p = normaliseContactPhone(raw);
  if (!p) throw new CrmError('PHONE_INVALID', 422);
  return p;
}

export async function createContact(raw: unknown, by: string | null, db: Db = getDb()) {
  const v = ContactInput.parse(raw);
  const phone = cleanPhone(v.phone), email = lower(v.email);
  if (!phone && !email) throw new CrmError('PHONE_OR_EMAIL_REQUIRED', 422);
  const dup = await findDuplicate(phone, email, db);
  if (dup) throw new CrmError('DUPLICATE_CONTACT', 409, { id: dup.id, name: dup.name });
  const n = numbers(v.dob);
  const r = await one<{ id: string }>(db, sql`INSERT INTO marketing_leads (full_name, phone, email, dob, gender, city, state, country, language, moolank, bhagyank, primary_concern, lead_source, crm_stage, lifecycle_stage, priority, owner_id, deal_value_paise, notes)
    VALUES (${v.name}, ${phone}, ${email}, ${v.dob}::date, ${v.gender}, ${v.city}, ${v.state}, ${v.country ?? 'India'}, ${v.language}, ${n.moolank}, ${n.bhagyank}, ${v.service}, ${v.source}, ${v.stage}, ${v.stage === 'won' ? 'customer' : 'lead'}::lead_lifecycle_stage, ${v.priority}, ${v.ownerId}, ${v.dealValueRupees != null ? Math.round(v.dealValueRupees * 100) : null}, ${v.notes})
    RETURNING id`);
  if (v.whatsappConsent && phone) await db.execute(sql`INSERT INTO marketing_consents (lead_id, channel, purpose, consent_text) VALUES (${r!.id}::uuid, 'whatsapp', 'numerology-services', 'Consent recorded by admin (verbal / written consent given by the client).')`);
  if (v.tags.length) await setTags([r!.id], v.tags, 'add', db);
  await logActivity(r!.id, 'system', `Contact added (${v.source}).`, by, {}, db);
  return { id: r!.id };
}

export const ContactPatch = ContactInput.partial().extend({
  lostReason: opt(500), nextFollowUpAt: z.string().datetime({ offset: true }).optional().nullable(),
}).omit({ tags: true, whatsappConsent: true });

export async function updateContact(id: string, raw: unknown, by: string | null, db: Db = getDb()) {
  uuid.parse(id);
  const v = ContactPatch.parse(raw);
  const cur = await one<{ stage: Stage; phone: string | null; email: string | null; name: string }>(db, sql`SELECT crm_stage AS stage, phone, email, full_name AS name FROM marketing_leads WHERE id = ${id}::uuid`);
  if (!cur) throw new CrmError('CONTACT_NOT_FOUND', 404);
  const set: SQL[] = [sql`updated_at = now()`];
  const put = (col: string, val: unknown) => set.push(sql`${sql.raw(col)} = ${val}`);
  if (v.name !== undefined) put('full_name', v.name);
  if (v.phone !== undefined) { const p = cleanPhone(v.phone); if (p && (await findDuplicate(p, null, db, id))) throw new CrmError('DUPLICATE_CONTACT', 409); put('phone', p); }
  if (v.email !== undefined) { const e = lower(v.email); if (e && (await findDuplicate(null, e, db, id))) throw new CrmError('DUPLICATE_CONTACT', 409); put('email', e); }
  if (v.dob !== undefined) { const n = numbers(v.dob); set.push(sql`dob = ${v.dob}::date`, sql`moolank = ${n.moolank}`, sql`bhagyank = ${n.bhagyank}`); }
  for (const [k, col] of [['gender', 'gender'], ['city', 'city'], ['state', 'state'], ['country', 'country'], ['language', 'language'], ['service', 'primary_concern'], ['source', 'lead_source'], ['priority', 'priority'], ['ownerId', 'owner_id'], ['notes', 'notes'], ['lostReason', 'lost_reason']] as const) if (v[k] !== undefined) put(col, v[k]);
  if (v.dealValueRupees !== undefined) put('deal_value_paise', v.dealValueRupees == null ? null : Math.round(v.dealValueRupees * 100));
  if (v.nextFollowUpAt !== undefined) set.push(sql`next_follow_up_at = ${v.nextFollowUpAt}::timestamptz`);
  if (v.stage !== undefined && v.stage !== cur.stage) {
    set.push(sql`crm_stage = ${v.stage}`, sql`stage_changed_at = now()`);
    if (v.stage === 'won') set.push(sql`lifecycle_stage = 'customer'`);
    if (v.stage === 'won' || v.stage === 'lost') set.push(sql`next_follow_up_at = NULL`);
  }
  await db.execute(sql`UPDATE marketing_leads SET ${sql.join(set, sql`, `)} WHERE id = ${id}::uuid`);
  if (v.stage !== undefined && v.stage !== cur.stage) {
    await logActivity(id, 'stage', `${cur.stage} → ${v.stage}${v.stage === 'lost' && v.lostReason ? ` (${v.lostReason})` : ''}`, by, { from: cur.stage, to: v.stage }, db);
    if (v.stage === 'won' || v.stage === 'lost') await db.execute(sql`UPDATE crm_tasks SET done_at = now() WHERE lead_id = ${id}::uuid AND done_at IS NULL`);
  }
  return { ok: true };
}

export async function deleteContacts(ids: string[], db: Db = getDb()) {
  ids.forEach((i) => uuid.parse(i));
  if (!ids.length) return 0;
  const r = await db.execute(sql`DELETE FROM marketing_leads WHERE id IN (${sql.join(ids.map((i) => sql`${i}::uuid`), sql`, `)})`);
  return (r as unknown as { rowCount: number }).rowCount ?? 0;
}

/** Consent changes are kept as an audit trail (DPDP): opt-out marks every opted-in row; opt-in adds a new row. */
export async function setWhatsappConsent(id: string, on: boolean, by: string | null, db: Db = getDb()) {
  uuid.parse(id);
  if (on) await db.execute(sql`INSERT INTO marketing_consents (lead_id, channel, purpose, consent_text) VALUES (${id}::uuid, 'whatsapp', 'numerology-services', 'Consent recorded by admin (client agreed to WhatsApp / phone contact).')`);
  else await db.execute(sql`UPDATE marketing_consents SET status = 'opted_out', opted_out_at = now(), opt_out_reason = 'Marked by admin (client asked to stop)' WHERE lead_id = ${id}::uuid AND channel = 'whatsapp' AND status = 'opted_in'`);
  await logActivity(id, 'system', on ? 'WhatsApp consent recorded.' : 'Client opted out of WhatsApp messages.', by, {}, db);
}

// ---------------------------------------------------------------- activities
export const ActivityInput = z.object({ type: z.enum(ACTIVITY_TYPES), body: z.string().trim().max(4000).optional().default(''), outcome: z.string().max(40).optional(), template: z.string().max(60).optional() });

export async function logActivity(leadId: string, type: string, body: string | null, by: string | null, meta: Record<string, unknown> = {}, db: Db = getDb()) {
  await db.execute(sql`INSERT INTO crm_activities (lead_id, type, body, meta, created_by) VALUES (${leadId}::uuid, ${type}, ${body}, ${JSON.stringify(meta)}::jsonb, ${by})`);
}

/** A call / WhatsApp / email / meeting counts as contact: updates "last contacted" and moves a New contact to Contacted. */
export async function addActivity(leadId: string, raw: unknown, by: string | null, db: Db = getDb()) {
  uuid.parse(leadId);
  const v = ActivityInput.parse(raw);
  if (v.type === 'note' && !v.body) throw new CrmError('NOTE_EMPTY', 422);
  await logActivity(leadId, v.type, v.body || null, by, { ...(v.outcome ? { outcome: v.outcome } : {}), ...(v.template ? { template: v.template } : {}) }, db);
  if (v.type !== 'note') {
    const cur = await one<{ stage: Stage }>(db, sql`SELECT crm_stage AS stage FROM marketing_leads WHERE id = ${leadId}::uuid`);
    if (!cur) throw new CrmError('CONTACT_NOT_FOUND', 404);
    const advance = cur.stage === 'new';
    await db.execute(sql`UPDATE marketing_leads SET last_contacted_at = now(), updated_at = now()${advance ? sql`, crm_stage = 'contacted', stage_changed_at = now()` : sql``} WHERE id = ${leadId}::uuid`);
    if (advance) await logActivity(leadId, 'stage', 'new → contacted', by, { from: 'new', to: 'contacted', auto: true }, db);
  } else await db.execute(sql`UPDATE marketing_leads SET updated_at = now() WHERE id = ${leadId}::uuid`);
  return { ok: true };
}

// ---------------------------------------------------------------- tasks / follow-ups
export interface TaskRow { id: string; leadId: string; name: string; phone: string | null; stage: Stage; title: string; dueAt: string; priority: string; doneAt: string | null; createdAt: string }
const TASK_SELECT = sql`SELECT k.id, k.lead_id AS "leadId", l.full_name AS name, l.phone, l.crm_stage AS stage, k.title, k.due_at AS "dueAt", k.priority, k.done_at AS "doneAt", k.created_at AS "createdAt" FROM crm_tasks k JOIN marketing_leads l ON l.id = k.lead_id`;
export const TaskInput = z.object({ leadId: z.string().uuid(), title: z.string().trim().min(2).max(200), dueAt: z.string().datetime({ offset: true }), priority: z.enum(PRIORITIES).default('normal') });
export const TaskPatch = z.object({ id: z.string().uuid(), done: z.boolean().optional(), dueAt: z.string().datetime({ offset: true }).optional(), title: z.string().trim().min(2).max(200).optional(), priority: z.enum(PRIORITIES).optional() });

/** Keeps marketing_leads.next_follow_up_at = the earliest open task. */
async function syncFollowUp(leadId: string, db: Db) {
  await db.execute(sql`UPDATE marketing_leads SET next_follow_up_at = (SELECT min(due_at) FROM crm_tasks WHERE lead_id = ${leadId}::uuid AND done_at IS NULL), updated_at = now() WHERE id = ${leadId}::uuid`);
}

export async function listTasks(view: 'open' | 'overdue' | 'today' | 'upcoming' | 'done', db: Db = getDb()) {
  const endToday = sql`((${IST}::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')`, startToday = sql`((${IST}::date)::timestamp AT TIME ZONE 'Asia/Kolkata')`;
  const where = { open: sql`k.done_at IS NULL`, overdue: sql`k.done_at IS NULL AND k.due_at < ${startToday}`, today: sql`k.done_at IS NULL AND k.due_at >= ${startToday} AND k.due_at < ${endToday}`, upcoming: sql`k.done_at IS NULL AND k.due_at >= ${endToday}`, done: sql`k.done_at IS NOT NULL` }[view];
  const list = await rows<TaskRow>(db, sql`${TASK_SELECT} WHERE ${where} ORDER BY ${view === 'done' ? sql`k.done_at DESC` : sql`k.due_at ASC`} LIMIT 500`);
  const c = await one<Record<string, number>>(db, sql`SELECT count(*) FILTER (WHERE done_at IS NULL AND due_at < ${startToday})::int AS overdue, count(*) FILTER (WHERE done_at IS NULL AND due_at >= ${startToday} AND due_at < ${endToday})::int AS today, count(*) FILTER (WHERE done_at IS NULL AND due_at >= ${endToday})::int AS upcoming, count(*) FILTER (WHERE done_at IS NULL)::int AS open FROM crm_tasks`);
  return { tasks: list, counts: c };
}

export async function createTask(raw: unknown, by: string | null, db: Db = getDb()) {
  const v = TaskInput.parse(raw);
  const r = await one<{ id: string }>(db, sql`INSERT INTO crm_tasks (lead_id, title, due_at, priority, created_by) VALUES (${v.leadId}::uuid, ${v.title}, ${v.dueAt}::timestamptz, ${v.priority}, ${by}) RETURNING id`);
  await syncFollowUp(v.leadId, db);
  return { id: r!.id };
}

export async function updateTask(raw: unknown, by: string | null, db: Db = getDb()) {
  const v = TaskPatch.parse(raw);
  const t = await one<{ leadId: string; title: string; doneAt: string | null }>(db, sql`SELECT lead_id AS "leadId", title, done_at AS "doneAt" FROM crm_tasks WHERE id = ${v.id}::uuid`);
  if (!t) throw new CrmError('TASK_NOT_FOUND', 404);
  const set: SQL[] = [];
  if (v.done !== undefined) set.push(sql`done_at = ${v.done ? sql`now()` : sql`NULL`}`);
  if (v.dueAt) set.push(sql`due_at = ${v.dueAt}::timestamptz`);
  if (v.title) set.push(sql`title = ${v.title}`);
  if (v.priority) set.push(sql`priority = ${v.priority}`);
  if (set.length) await db.execute(sql`UPDATE crm_tasks SET ${sql.join(set, sql`, `)} WHERE id = ${v.id}::uuid`);
  if (v.done === true && !t.doneAt) await logActivity(t.leadId, 'task', `Done: ${v.title ?? t.title}`, by, {}, db);
  await syncFollowUp(t.leadId, db);
  return { ok: true };
}

export async function deleteTask(id: string, db: Db = getDb()) {
  uuid.parse(id);
  const t = await one<{ leadId: string }>(db, sql`DELETE FROM crm_tasks WHERE id = ${id}::uuid RETURNING lead_id AS "leadId"`);
  if (t) await syncFollowUp(t.leadId, db);
  return { ok: Boolean(t) };
}

// ---------------------------------------------------------------- tags
const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9ऀ-ॿ]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'tag';
export async function listTags(db: Db = getDb()) {
  return rows<{ id: string; name: string; slug: string; category: string; n: number }>(db, sql`SELECT t.id, t.name, t.slug, t.category, (SELECT count(*)::int FROM lead_tags lt WHERE lt.tag_id = t.id) AS n FROM marketing_tags t ORDER BY t.name`);
}
async function ensureTags(names: string[], db: Db) {
  const ids: string[] = [];
  for (const name of [...new Set(names.map((n) => n.trim()).filter(Boolean))]) {
    const r = await one<{ id: string }>(db, sql`INSERT INTO marketing_tags (slug, name) VALUES (${slugify(name)}, ${name}) ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id`);
    ids.push(r!.id);
  }
  return ids;
}
export async function setTags(leadIds: string[], names: string[], mode: 'add' | 'remove', db: Db = getDb()) {
  leadIds.forEach((i) => uuid.parse(i));
  const tagIds = mode === 'add' ? await ensureTags(names, db) : (await rows<{ id: string }>(db, sql`SELECT id FROM marketing_tags WHERE slug IN (${sql.join(names.map((n) => sql`${slugify(n)}`), sql`, `)})`)).map((r) => r.id);
  for (const l of leadIds) for (const t of tagIds) {
    if (mode === 'add') await db.execute(sql`INSERT INTO lead_tags (lead_id, tag_id) VALUES (${l}::uuid, ${t}::uuid) ON CONFLICT DO NOTHING`);
    else await db.execute(sql`DELETE FROM lead_tags WHERE lead_id = ${l}::uuid AND tag_id = ${t}::uuid`);
  }
}
export async function deleteTag(id: string, db: Db = getDb()) { uuid.parse(id); await db.execute(sql`DELETE FROM marketing_tags WHERE id = ${id}::uuid`); }

// ---------------------------------------------------------------- bulk
export const BulkInput = z.discriminatedUnion('action', [
  z.object({ action: z.literal('stage'), ids: z.array(z.string().uuid()).min(1).max(2000), stage: z.enum(STAGES) }),
  z.object({ action: z.literal('owner'), ids: z.array(z.string().uuid()).min(1).max(2000), ownerId: z.string().max(60).nullable() }),
  z.object({ action: z.literal('priority'), ids: z.array(z.string().uuid()).min(1).max(2000), priority: z.enum(PRIORITIES) }),
  z.object({ action: z.literal('tag'), ids: z.array(z.string().uuid()).min(1).max(2000), tag: z.string().trim().min(1).max(60) }),
  z.object({ action: z.literal('untag'), ids: z.array(z.string().uuid()).min(1).max(2000), tag: z.string().trim().min(1).max(60) }),
  z.object({ action: z.literal('followup'), ids: z.array(z.string().uuid()).min(1).max(500), title: z.string().trim().min(2).max(200), dueAt: z.string().datetime({ offset: true }) }),
  z.object({ action: z.literal('delete'), ids: z.array(z.string().uuid()).min(1).max(2000) }),
]);
export async function bulk(raw: unknown, by: string | null, db: Db = getDb()) {
  const v = BulkInput.parse(raw);
  if (v.action === 'stage') { for (const id of v.ids) await updateContact(id, { stage: v.stage }, by, db); }
  else if (v.action === 'owner') await db.execute(sql`UPDATE marketing_leads SET owner_id = ${v.ownerId}, updated_at = now() WHERE id IN (${sql.join(v.ids.map((i) => sql`${i}::uuid`), sql`, `)})`);
  else if (v.action === 'priority') await db.execute(sql`UPDATE marketing_leads SET priority = ${v.priority}, updated_at = now() WHERE id IN (${sql.join(v.ids.map((i) => sql`${i}::uuid`), sql`, `)})`);
  else if (v.action === 'tag' || v.action === 'untag') await setTags(v.ids, [v.tag], v.action === 'tag' ? 'add' : 'remove', db);
  else if (v.action === 'followup') { for (const id of v.ids) await createTask({ leadId: id, title: v.title, dueAt: v.dueAt }, by, db); }
  else if (v.action === 'delete') return { ok: true, n: await deleteContacts(v.ids, db) };
  return { ok: true, n: v.ids.length };
}

// ---------------------------------------------------------------- sync from the rest of the site
/**
 * Brings every customer touch-point into the CRM (idempotent; matched by phone, then email):
 * registered customers, paying customers (→ Won), service orders and Contact Us messages.
 * Contact-form senders get no marketing consent – they can be replied to, but are left out of WhatsApp broadcast lists.
 */
export async function syncContacts(by: string | null, db: Db = getDb()) {
  const stats = { added: 0, linked: 0, won: 0 };
  type Cand = { name: string; phone: string | null; email: string | null; userId: string | null; source: string; note: string; dob?: string | null; at?: string };
  const cands: Cand[] = [];
  const us = await rows<{ id: string; name: string | null; email: string | null; phone: string | null; createdAt: string }>(db, sql`SELECT id, name, email, phone, created_at AS "createdAt" FROM users WHERE role = 'customer' AND disabled_at IS NULL`);
  for (const u of us) cands.push({ name: u.name || u.email?.split('@')[0] || 'Customer', phone: u.phone ? normaliseContactPhone(u.phone) : null, email: lower(u.email), userId: u.id, source: 'signup', note: 'Created an account on the website.' });
  const msgs = await rows<{ id: string; detailsEnc: string; userId: string | null; topic: string; service: string | null }>(db, sql`SELECT id, details_enc AS "detailsEnc", user_id AS "userId", topic, service FROM contact_messages ORDER BY created_at`);
  for (const m of msgs) {
    try { const d = decryptJson<{ name: string; phone: string; email: string | null; erased?: boolean }>(m.detailsEnc); if (d.erased || !d.name) continue; cands.push({ name: d.name, phone: d.phone ? normaliseContactPhone(d.phone) : null, email: lower(d.email), userId: m.userId, source: 'contact-form', note: `Sent a Contact Us message (${m.topic}${m.service ? `: ${m.service}` : ''}).` }); } catch { /* unreadable */ }
  }
  const sos = await rows<{ detailsEnc: string; userId: string | null; service: string }>(db, sql`SELECT details_enc AS "detailsEnc", user_id AS "userId", service_code AS service FROM service_orders WHERE status <> 'awaiting_payment'`);
  for (const o of sos) {
    try { const d = decryptJson<Record<string, string>>(o.detailsEnc); if (d.erased || !d.clientName) continue; const ph = d.mobile ? normaliseContactPhone(d.mobile) : null; if (!ph) continue; cands.push({ name: d.clientName, phone: ph, email: null, userId: null, source: 'purchase', note: `Client in a ${o.service} order.`, dob: d.dob && /^\d{4}-\d{2}-\d{2}$/.test(d.dob) ? d.dob : null }); } catch { /* skip */ }
  }
  for (const c of cands) {
    if (!c.phone && !c.email) continue;
    const dup = await findDuplicate(c.phone, c.email, db);
    if (dup) {
      if (c.userId) { const r = await db.execute(sql`UPDATE marketing_leads SET user_id = ${c.userId} WHERE id = ${dup.id}::uuid AND user_id IS NULL`); if ((r as unknown as { rowCount: number }).rowCount) { stats.linked++; await logActivity(dup.id, 'system', 'Linked to the website account.', by, {}, db); } }
      continue;
    }
    const n = numbers(c.dob ?? null);
    const r = await one<{ id: string }>(db, sql`INSERT INTO marketing_leads (full_name, phone, email, dob, moolank, bhagyank, user_id, lead_source) VALUES (${c.name.slice(0, 120)}, ${c.phone}, ${c.email}, ${c.dob ?? null}::date, ${n.moolank}, ${n.bhagyank}, ${c.userId}, ${c.source}) ON CONFLICT DO NOTHING RETURNING id`);
    if (r) { stats.added++; await logActivity(r.id, 'system', c.note, by, { sync: c.source }, db); }
  }
  // Anyone linked to an account with a paid order is a customer.
  const won = await rows<{ id: string }>(db, sql`UPDATE marketing_leads l SET crm_stage = 'won', lifecycle_stage = 'customer', stage_changed_at = now(), next_follow_up_at = NULL, updated_at = now()
    WHERE l.user_id IS NOT NULL AND l.crm_stage NOT IN ('won') AND EXISTS (SELECT 1 FROM payments p WHERE p.user_id = l.user_id AND p.status = 'paid') RETURNING l.id`);
  for (const w of won) await logActivity(w.id, 'stage', '→ won (paid on the website)', by, { to: 'won', auto: true }, db);
  stats.won = won.length;
  return stats;
}

const g = globalThis as unknown as { __crmSyncAt?: number };
/** Runs syncContacts at most every 5 minutes (called when the CRM dashboard opens). */
export async function autoSync(db: Db = getDb()) {
  if (g.__crmSyncAt && Date.now() - g.__crmSyncAt < 5 * 60_000) return null;
  g.__crmSyncAt = Date.now();
  try { return await syncContacts(null, db); } catch (e) { console.error('crm sync failed:', e instanceof Error ? e.message.slice(0, 120) : 'unknown'); return null; }
}

// ---------------------------------------------------------------- import / export
export const ImportRow = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().optional(), email: z.string().optional(), dob: z.string().optional(), city: z.string().max(100).optional(), state: z.string().max(100).optional(), language: z.string().optional(), source: z.string().max(80).optional(), stage: z.string().optional(), service: z.string().max(50).optional(), tags: z.string().max(300).optional(), notes: z.string().max(4000).optional(), whatsappConsent: z.string().optional() });

/** Accepts DD-MM-YYYY / DD/MM/YYYY / YYYY-MM-DD. */
function importDob(s?: string) { if (!s?.trim()) return null; try { const d = parseDate(s.trim()); return toIso(d) <= toIso(todayIST()) && d.year >= 1900 ? toIso(d) : null; } catch { return null; } }

export async function importContacts(list: unknown[], by: string | null, db: Db = getDb()) {
  const out = { added: 0, duplicates: 0, invalid: 0, errors: [] as { row: number; error: string }[] };
  for (const [i, raw] of list.slice(0, 5000).entries()) {
    const p = ImportRow.safeParse(raw);
    if (!p.success) { out.invalid++; out.errors.push({ row: i + 2, error: 'name missing or too long' }); continue; }
    const v = p.data;
    const stage = (STAGES as readonly string[]).includes(v.stage?.trim().toLowerCase() ?? '') ? v.stage!.trim().toLowerCase() : 'new';
    const yes = /^(y|yes|true|1|haan|हाँ)$/i.test(v.whatsappConsent?.trim() ?? '');
    try {
      await createContact({ name: v.name, phone: v.phone?.trim() || null, email: v.email?.trim() || null, dob: importDob(v.dob), city: v.city || null, state: v.state || null, language: v.language?.trim().toLowerCase().startsWith('h') ? 'hi' : 'en', source: v.source?.trim() || 'import', stage, service: v.service || null, notes: v.notes || null, whatsappConsent: yes, tags: (v.tags ?? '').split(/[;|,]/).map((t) => t.trim()).filter(Boolean) }, by, db);
      out.added++;
    } catch (e) {
      if (e instanceof CrmError && e.code === 'DUPLICATE_CONTACT') out.duplicates++;
      else { out.invalid++; if (out.errors.length < 50) out.errors.push({ row: i + 2, error: e instanceof CrmError ? e.code : e instanceof z.ZodError ? e.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ') : 'invalid' }); }
    }
  }
  return out;
}

/** Excel-safe CSV (formula-looking cells are prefixed). */
export function contactsCsv(list: ContactRow[]) {
  const cell = (v: unknown) => { let s = v == null ? '' : Array.isArray(v) ? v.map((t) => (t as { name: string }).name).join('; ') : String(v); if (/^[=+\-@]/.test(s) && !/^\+\d/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
  const cols: [keyof ContactRow, string][] = [['name', 'Name'], ['phone', 'Phone'], ['email', 'Email'], ['dob', 'DOB'], ['moolank', 'Moolank'], ['bhagyank', 'Bhagyank'], ['city', 'City'], ['state', 'State'], ['language', 'Language'], ['stage', 'Stage'], ['priority', 'Priority'], ['score', 'Score'], ['source', 'Source'], ['service', 'Interested in'], ['tags', 'Tags'], ['ownerName', 'Owner'], ['dealValuePaise', 'Deal value (paise)'], ['paidPaise', 'Paid (paise)'], ['nextFollowUpAt', 'Next follow-up'], ['lastContactedAt', 'Last contacted'], ['waConsent', 'WhatsApp consent'], ['utmSource', 'UTM source'], ['utmMedium', 'UTM medium'], ['utmCampaign', 'UTM campaign'], ['createdAt', 'Added'], ['notes', 'Notes']];
  return [cols.map((c) => c[1]).join(','), ...list.map((r) => cols.map(([k]) => cell(r[k])).join(','))].join('\r\n');
}

export async function owners(db: Db = getDb()) {
  return rows<{ id: string; name: string | null; email: string | null; role: string }>(db, sql`SELECT id, name, email, role::text AS role FROM users WHERE role IN ('super_admin','expert') AND disabled_at IS NULL ORDER BY role, name`);
}
