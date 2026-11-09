import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { brandings, subscriptions, users } from '@/lib/db/schema';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Expert listing: every account with the expert role or a saved expert branding. Logo/photo/signature data is never sent. */
export const GET = withAdmin(async (req) => {
  const q = new URL(req.url).searchParams.get('q')?.trim();
  const db = getDb();
  const isExpert = or(eq(users.role, 'expert'), sql`${brandings.userId} is not null`);
  const search = q ? or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`), ilike(users.phone, `%${q}%`), ilike(brandings.expertName, `%${q}%`), ilike(brandings.brandName, `%${q}%`)) : undefined;
  const rows = await db.select({
    id: users.id, email: users.email, phone: users.phone, name: users.name, role: users.role, credits: users.credits, disabledAt: users.disabledAt,
    createdAt: users.createdAt, lastLoginAt: users.lastLoginAt, proUntil: subscriptions.currentPeriodEnd, plan: subscriptions.planCode,
    brandName: brandings.brandName, expertName: brandings.expertName, expertTitle: brandings.expertTitle, contactLine: brandings.contactLine,
    website: brandings.website, bookingUrl: brandings.bookingUrl,
    hasLogo: sql<boolean>`${brandings.logo} is not null`, hasPhoto: sql<boolean>`${brandings.photo} is not null`, hasSignature: sql<boolean>`${brandings.signature} is not null`,
    clients: sql<number>`(select count(*)::int from client_profiles cp where cp.owner_id = ${users.id})`,
    reports: sql<number>`(select count(*)::int from reports r join client_profiles cp on cp.id = r.profile_id where cp.owner_id = ${users.id})`,
    customers: sql<number>`(select count(*)::int from users c where c.expert_id = ${users.id})`,
  }).from(users).leftJoin(brandings, eq(brandings.userId, users.id)).leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(search ? and(isExpert, search) : isExpert).orderBy(desc(users.createdAt)).limit(200);
  return json({ experts: rows });
});

const Fields = {
  expertName: z.string().trim().min(2).max(80), expertTitle: z.string().trim().max(120).optional(), brandName: z.string().trim().min(2).max(80).optional(),
  contactLine: z.string().trim().max(200).optional(), website: z.string().trim().max(200).optional(), bookingUrl: z.string().trim().max(300).optional(),
};
const nul = (v?: string) => (v ? v : null);

/** Make an existing account an expert (they must have signed up first) and save their listing details. */
const Add = z.object({ identifier: z.string().trim().min(5).max(320), ...Fields });
export const POST = withAdmin(async (req) => {
  const b = Add.parse(await readJson(req));
  const db = getDb();
  const id = b.identifier;
  const digits = id.replace(/\D/g, '');
  const where = id.includes('@') ? ilike(users.email, id) : digits.length >= 10 ? ilike(users.phone, `%${digits.slice(-10)}`) : undefined;
  const user = where ? (await db.select().from(users).where(where).limit(1))[0] : undefined;
  if (!user) return json({ error: 'USER_NOT_FOUND' }, 404);
  await db.transaction(async (tx) => {
    if (user.role === 'customer') await tx.update(users).set({ role: 'expert' }).where(eq(users.id, user.id));
    await tx.insert(brandings).values({ userId: user.id, brandName: b.brandName ?? b.expertName, expertName: b.expertName, expertTitle: nul(b.expertTitle), contactLine: nul(b.contactLine), website: nul(b.website), bookingUrl: nul(b.bookingUrl) })
      .onConflictDoUpdate({ target: brandings.userId, set: { brandName: b.brandName ?? b.expertName, expertName: b.expertName, expertTitle: nul(b.expertTitle), contactLine: nul(b.contactLine), website: nul(b.website), bookingUrl: nul(b.bookingUrl), updatedAt: new Date() } });
  });
  return json({ ok: true, id: user.id });
});

const Patch = z.object({ id: z.string(), removeExpert: z.boolean().optional(), expertName: Fields.expertName.optional(), expertTitle: Fields.expertTitle, brandName: Fields.brandName, contactLine: Fields.contactLine, website: Fields.website, bookingUrl: Fields.bookingUrl });
export const PATCH = withAdmin(async (req, admin) => {
  const b = Patch.parse(await readJson(req));
  const db = getDb();
  if (b.removeExpert) {
    if (b.id === admin.id) return json({ error: 'CANNOT_DEMOTE_SELF' }, 400);
    await db.update(users).set({ role: 'customer' }).where(and(eq(users.id, b.id), eq(users.role, 'expert')));
    return json({ ok: true });
  }
  const [row] = await db.select().from(brandings).where(eq(brandings.userId, b.id)).limit(1);
  if (!row && !b.expertName) return json({ error: 'EXPERT_NAME_REQUIRED' }, 400);
  const set = {
    ...(b.expertName !== undefined && { expertName: b.expertName }), ...(b.brandName !== undefined && { brandName: b.brandName }),
    ...(b.expertTitle !== undefined && { expertTitle: nul(b.expertTitle) }), ...(b.contactLine !== undefined && { contactLine: nul(b.contactLine) }),
    ...(b.website !== undefined && { website: nul(b.website) }), ...(b.bookingUrl !== undefined && { bookingUrl: nul(b.bookingUrl) }), updatedAt: new Date(),
  };
  if (row) await db.update(brandings).set(set).where(eq(brandings.userId, b.id));
  else await db.insert(brandings).values({ userId: b.id, expertName: b.expertName!, brandName: b.brandName ?? b.expertName!, expertTitle: nul(b.expertTitle), contactLine: nul(b.contactLine), website: nul(b.website), bookingUrl: nul(b.bookingUrl) });
  return json({ ok: true });
});
