import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { listPlans } from '@/lib/billing/plans';
import { getDb } from '@/lib/db/client';
import { plans } from '@/lib/db/schema';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async () => json({ plans: await listPlans({ includeInactive: true }) }));

const Features = z.object({ fullReports: z.boolean(), whiteLabel: z.boolean(), bulk: z.boolean(), share: z.boolean(), watermark: z.boolean(), maxProfiles: z.number().int().positive().nullable() });
const Body = z.object({
  code: z.string().regex(/^[A-Z0-9_]{2,30}$/), name: z.string().min(2).max(60), description: z.string().max(300).default(''),
  pricePaise: z.number().int().min(100).max(10_000_000), intervalDays: z.number().int().min(1).max(3650).nullable(), credits: z.number().int().min(0).max(1000),
  features: Features, active: z.boolean(), sort: z.number().int().default(0),
});

export const PUT = withAdmin(async (req) => {
  const b = Body.parse(await readJson(req));
  await getDb().insert(plans).values(b).onConflictDoUpdate({ target: plans.code, set: { ...b, updatedAt: new Date() } });
  return json({ plan: (await getDb().select().from(plans).where(eq(plans.code, b.code)))[0] });
});
