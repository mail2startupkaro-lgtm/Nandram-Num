import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { coupons } from '@/lib/db/schema';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async () => json({ coupons: await getDb().select().from(coupons).orderBy(desc(coupons.createdAt)) }));

const Body = z.object({
  code: z.string().trim().toUpperCase().pipe(z.string().regex(/^[A-Z0-9_-]{3,40}$/)),
  percentOff: z.number().int().min(1).max(100).nullable().optional(), amountOffPaise: z.number().int().min(100).nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(), planCodes: z.array(z.string()).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(), active: z.boolean().default(true),
}).refine((c) => !!c.percentOff !== !!c.amountOffPaise, 'Set either a percentage or a fixed amount');

export const POST = withAdmin(async (req) => {
  const b = Body.parse(await readJson(req));
  const row = { ...b, percentOff: b.percentOff ?? null, amountOffPaise: b.amountOffPaise ?? null, maxUses: b.maxUses ?? null, planCodes: b.planCodes?.length ? b.planCodes : null, expiresAt: b.expiresAt ? new Date(b.expiresAt) : null };
  await getDb().insert(coupons).values(row).onConflictDoUpdate({ target: coupons.code, set: row });
  return json({ ok: true }, 201);
});

export const PATCH = withAdmin(async (req) => {
  const b = z.object({ code: z.string(), active: z.boolean() }).parse(await readJson(req));
  await getDb().update(coupons).set({ active: b.active }).where(eq(coupons.code, b.code));
  return json({ ok: true });
});
