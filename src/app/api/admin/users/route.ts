import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { destroyAllSessions } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { creditLedger, subscriptions, users } from '@/lib/db/schema';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (req) => {
  const rawQ = new URL(req.url).searchParams.get('q')?.trim();
  const q = rawQ?.replace(/[%_\\]/g, '\\$&');
  const db = getDb();
  const where = q ? or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`), ilike(users.phone, `%${q}%`)) : undefined;
  const rows = await db.select({
    id: users.id, email: users.email, phone: users.phone, name: users.name, role: users.role, credits: users.credits, disabledAt: users.disabledAt,
    lastLoginAt: users.lastLoginAt, createdAt: users.createdAt, proUntil: subscriptions.currentPeriodEnd, plan: subscriptions.planCode,
    profiles: sql<number>`(select count(*)::int from client_profiles cp where cp.owner_id = ${users.id})`,
  }).from(users).leftJoin(subscriptions, eq(subscriptions.userId, users.id)).where(where).orderBy(desc(users.createdAt)).limit(200);
  return json({ users: rows });
});

const Patch = z.object({
  id: z.string(), role: z.enum(['super_admin', 'expert', 'customer']).optional(), addCredits: z.number().int().min(-1000).max(1000).optional(),
  disabled: z.boolean().optional(), proDays: z.number().int().min(0).max(3650).optional(), note: z.string().max(200).optional(),
});

export const PATCH = withAdmin(async (req, admin) => {
  const b = Patch.parse(await readJson(req));
  const db = getDb();
  if (b.id === admin.id && (b.role && b.role !== 'super_admin' || b.disabled)) return json({ error: 'CANNOT_DEMOTE_SELF' }, 400);
  await db.transaction(async (tx) => {
    if (b.role) await tx.update(users).set({ role: b.role }).where(eq(users.id, b.id));
    if (b.disabled !== undefined) await tx.update(users).set({ disabledAt: b.disabled ? new Date() : null }).where(eq(users.id, b.id));
    if (b.addCredits) {
      await tx.update(users).set({ credits: sql`greatest(0, ${users.credits} + ${b.addCredits})` }).where(eq(users.id, b.id));
      await tx.insert(creditLedger).values({ userId: b.id, delta: b.addCredits, reason: 'admin', note: b.note ?? `by ${admin.email ?? admin.id}` });
    }
    if (b.proDays !== undefined) {
      const end = new Date(Date.now() + b.proDays * 86_400_000);
      await tx.insert(subscriptions).values({ userId: b.id, planCode: 'PRO_MONTHLY', currentPeriodEnd: end })
        .onConflictDoUpdate({ target: subscriptions.userId, set: { currentPeriodEnd: end, updatedAt: new Date() } });
    }
  });
  if (b.disabled) await destroyAllSessions(b.id);
  return json({ ok: true });
});
