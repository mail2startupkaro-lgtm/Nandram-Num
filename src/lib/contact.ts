/** Contact Us messages: validation, storage (encrypted) and the admin inbox. */
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type Db } from '@/lib/db/client';
import { contactMessages } from '@/lib/db/schema';
import { decryptJson, encryptJson } from '@/lib/security/crypto';
import { normalizeIndianMobile } from '@/lib/numerology';
import { CONTACT_STATUSES, CONTACT_SUBJECTS, CONTACT_TOPICS, type ContactStatus } from './contact-options';

/** Indian 10-digit mobiles become +91XXXXXXXXXX; other countries are accepted in +<country><number> form. */
export function normaliseContactPhone(raw: string): string | null {
  try { return `+91${normalizeIndianMobile(raw)}`; } catch { /* not Indian */ }
  const t = raw.trim();
  const d = t.replace(/\D/g, '');
  return t.startsWith('+') && d.length >= 8 && d.length <= 15 ? `+${d}` : null;
}

/** Never keep an Aadhaar-like 12-digit number in a free-text message. */
export const redactLongNumbers = (s: string) => s.replace(/\b(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})\b/g, (_m, _a, _b, c) => `XXXX-XXXX-${c}`);

export const ContactInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().max(320).email().optional().or(z.literal('').transform(() => undefined)),
  topic: z.enum(CONTACT_TOPICS),
  subject: z.string().max(40).optional(),
  message: z.string().trim().min(5).max(3000),
  language: z.enum(['en', 'hi']).default('en'),
  page: z.string().max(200).optional(),
  website: z.string().max(0).optional(), // honeypot – bots fill it, people never see it
}).superRefine((v, ctx) => {
  if (!normaliseContactPhone(v.phone)) ctx.addIssue({ code: 'custom', path: ['phone'], message: 'PHONE_INVALID' });
  if (v.subject && !CONTACT_SUBJECTS[v.topic].some((s) => s.id === v.subject)) ctx.addIssue({ code: 'custom', path: ['subject'], message: 'SUBJECT_INVALID' });
});
export type ContactInput = z.infer<typeof ContactInput>;

export interface ContactDetails { name: string; phone: string; email: string | null; message: string }

export async function createContactMessage(input: ContactInput, opts: { userId?: string | null } = {}, db: Db = getDb()) {
  const phone = normaliseContactPhone(input.phone)!;
  const details: ContactDetails = { name: input.name, phone, email: input.email?.toLowerCase() ?? null, message: redactLongNumbers(input.message) };
  const [row] = await db.insert(contactMessages).values({
    topic: input.topic, service: input.subject ?? null, detailsEnc: encryptJson(details), phoneLast4: phone.slice(-4),
    language: input.language, userId: opts.userId ?? null, page: input.page?.slice(0, 200) ?? null,
  }).returning({ id: contactMessages.id, createdAt: contactMessages.createdAt });
  return row;
}

export async function listContactMessages(filter: { status?: ContactStatus | 'all'; topic?: string; limit?: number } = {}, db: Db = getDb()) {
  const where = and(
    filter.status && filter.status !== 'all' ? eq(contactMessages.status, filter.status) : undefined,
    filter.topic && filter.topic !== 'all' ? eq(contactMessages.topic, filter.topic) : undefined,
  );
  const rows = await db.select().from(contactMessages).where(where).orderBy(desc(contactMessages.createdAt)).limit(Math.min(filter.limit ?? 200, 500));
  const counts = await db.select({ status: contactMessages.status, n: count() }).from(contactMessages).groupBy(contactMessages.status);
  return {
    messages: rows.map(({ detailsEnc, ...r }) => ({ ...r, ...decryptJson<ContactDetails>(detailsEnc) })),
    counts: Object.fromEntries(CONTACT_STATUSES.map((s) => [s, counts.find((c) => c.status === s)?.n ?? 0])) as Record<ContactStatus, number>,
  };
}

export const ContactUpdate = z.object({ id: z.string().min(1), status: z.enum(CONTACT_STATUSES).optional(), adminNote: z.string().max(2000).nullable().optional() });

export async function updateContactMessage(u: z.infer<typeof ContactUpdate>, db: Db = getDb()) {
  const set: Partial<typeof contactMessages.$inferInsert> = { updatedAt: sql`now()` as unknown as Date };
  if (u.status) set.status = u.status;
  if (u.adminNote !== undefined) set.adminNote = u.adminNote?.trim() || null;
  const [row] = await db.update(contactMessages).set(set).where(eq(contactMessages.id, u.id)).returning({ id: contactMessages.id });
  return !!row;
}

export async function deleteContactMessage(id: string, db: Db = getDb()) {
  const [row] = await db.delete(contactMessages).where(eq(contactMessages.id, id)).returning({ id: contactMessages.id });
  return !!row;
}

export async function newContactCount(db: Db = getDb()) {
  const [r] = await db.select({ n: count() }).from(contactMessages).where(eq(contactMessages.status, 'new'));
  return r?.n ?? 0;
}
