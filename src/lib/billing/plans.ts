/** Plans (INR, GST-inclusive). Seeded on first use; prices and features are editable in the admin panel. */
import { asc, eq } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { plans, type Plan, type PlanFeatures } from '@/lib/db/schema';

export const FREE_FEATURES: PlanFeatures = { fullReports: false, whiteLabel: false, bulk: false, share: false, watermark: true, maxProfiles: 3 };
export const PRO_FEATURES: PlanFeatures = { fullReports: true, whiteLabel: true, bulk: true, share: true, watermark: false, maxProfiles: null };
const CREDIT_FEATURES: PlanFeatures = { ...FREE_FEATURES, maxProfiles: 25 };

export const DEFAULT_PLANS: (typeof plans.$inferInsert)[] = [
  { code: 'SINGLE', name: 'Single Report', description: 'One complete life report PDF (all modules) with remedies.', pricePaise: 49_900, intervalDays: null, credits: 1, features: CREDIT_FEATURES, sort: 1 },
  { code: 'PACK5', name: '5 Report Credits', description: 'Five full reports – for families or occasional consultations.', pricePaise: 1_99_900, intervalDays: null, credits: 5, features: CREDIT_FEATURES, sort: 2 },
  { code: 'PRO_MONTHLY', name: 'Pro Monthly', description: 'For consultants: unlimited reports, white-label PDFs, bulk import/export, share links.', pricePaise: 2_49_900, intervalDays: 30, credits: 0, features: PRO_FEATURES, sort: 3 },
  { code: 'PRO_YEARLY', name: 'Pro Yearly', description: 'Everything in Pro Monthly, billed yearly (two months free).', pricePaise: 24_99_900, intervalDays: 365, credits: 0, features: PRO_FEATURES, sort: 4 },
];

let seeded = false;
export async function ensurePlans(db: Db = getDb()) {
  if (seeded) return;
  await db.insert(plans).values(DEFAULT_PLANS).onConflictDoNothing();
  seeded = true;
}

export async function listPlans(opts: { includeInactive?: boolean } = {}, db: Db = getDb()): Promise<Plan[]> {
  await ensurePlans(db);
  const all = await db.select().from(plans).orderBy(asc(plans.sort));
  return opts.includeInactive ? all : all.filter((p) => p.active);
}

export async function getPlan(code: string, db: Db = getDb()): Promise<Plan | undefined> {
  await ensurePlans(db);
  return (await db.select().from(plans).where(eq(plans.code, code)).limit(1))[0];
}

export const formatInr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
