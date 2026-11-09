import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { AuthError } from '@/lib/auth/otp';
import { listPlans } from '@/lib/billing/plans';
import { getDb } from '@/lib/db/client';
import { plans } from '@/lib/db/schema';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Plans with usage counts (paid orders, revenue, active subscribers) so the admin knows what is safe to delete. */
export const GET = withAdmin(async () => {
  const db = getDb();
  const list = await listPlans({ includeInactive: true });
  const usage = (await db.execute(sql`
    select p.code,
      (select count(*)::int from payments x where x.plan_code = p.code) orders,
      (select count(*)::int from payments x where x.plan_code = p.code and x.status = 'paid') paid,
      (select coalesce(sum(amount_paise),0)::bigint from payments x where x.plan_code = p.code and x.status = 'paid') revenue,
      (select count(*)::int from subscriptions s where s.plan_code = p.code and s.current_period_end > now()) "activeSubs"
    from plans p`)).rows as { code: string; orders: number; paid: number; revenue: string | number; activeSubs: number }[];
  const by = Object.fromEntries(usage.map((u) => [u.code, { orders: u.orders, paid: u.paid, revenue: Number(u.revenue), activeSubs: u.activeSubs }]));
  return json({ plans: list.map((p) => ({ ...p, usage: by[p.code] ?? { orders: 0, paid: 0, revenue: 0, activeSubs: 0 } })) });
});

const Features = z.object({ fullReports: z.boolean(), whiteLabel: z.boolean(), bulk: z.boolean(), share: z.boolean(), watermark: z.boolean(), maxProfiles: z.number().int().positive().max(100000).nullable() });
const Body = z.object({
  code: z.string().trim().toUpperCase().pipe(z.string().regex(/^[A-Z0-9_]{2,30}$/, 'Code: 2–30 letters, digits or _')),
  name: z.string().trim().min(2).max(60), description: z.string().max(300).default(''),
  pricePaise: z.number().int().min(100, 'Minimum price is ₹1').max(10_000_000), intervalDays: z.number().int().min(1).max(3650).nullable(), credits: z.number().int().min(0).max(1000),
  features: Features, active: z.boolean(), sort: z.number().int().min(0).max(1000).default(0),
});

/** Create a new plan (fails if the code exists). */
export const POST = withAdmin(async (req) => {
  const b = Body.parse(await readJson(req));
  const db = getDb();
  const [exists] = await db.select({ code: plans.code }).from(plans).where(eq(plans.code, b.code)).limit(1);
  if (exists) throw new AuthError('PLAN_CODE_EXISTS', 409);
  const [plan] = await db.insert(plans).values(b).returning();
  return json({ plan }, 201);
});

/** Update an existing plan (all fields except the code). */
export const PUT = withAdmin(async (req) => {
  const b = Body.parse(await readJson(req));
  const { code, ...rest } = b;
  const [plan] = await getDb().update(plans).set({ ...rest, updatedAt: new Date() }).where(eq(plans.code, code)).returning();
  if (!plan) throw new AuthError('PLAN_NOT_FOUND', 404);
  return json({ plan });
});

/**
 * Delete a plan. Plans that already have orders or subscribers are kept for invoices and reports –
 * those can only be deactivated (hidden from the pricing page).
 */
export const DELETE = withAdmin(async (req) => {
  const code = new URL(req.url).searchParams.get('code') ?? '';
  const db = getDb();
  const [{ n }] = (await db.execute(sql`select
      (select count(*)::int from payments where plan_code = ${code}) + (select count(*)::int from subscriptions where plan_code = ${code}) as n`)).rows as { n: number }[];
  if (n > 0) throw new AuthError('PLAN_IN_USE', 409);
  const del = await db.delete(plans).where(eq(plans.code, code)).returning({ code: plans.code });
  if (!del.length) throw new AuthError('PLAN_NOT_FOUND', 404);
  return json({ deleted: code });
});
