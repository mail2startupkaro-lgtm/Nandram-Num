/** Plans (INR, GST-inclusive). Seeded on first use; prices and features are editable in the admin panel. */
import { asc, eq } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { plans, type Plan, type PlanFeatures } from '@/lib/db/schema';

export const FREE_FEATURES: PlanFeatures = { fullReports: false, whiteLabel: false, bulk: false, share: false, watermark: true, maxProfiles: 3 };
export const PRO_FEATURES: PlanFeatures = { fullReports: true, whiteLabel: true, bulk: true, share: true, watermark: false, maxProfiles: null };
const CREDIT_FEATURES: PlanFeatures = { ...FREE_FEATURES, maxProfiles: 25 };

export const DEFAULT_PLANS: (typeof plans.$inferInsert)[] = [
  { code: 'SINGLE', name: 'Single Report', description: 'One complete life report PDF (all modules) with remedies.', pricePaise: 49_900, intervalDays: null, credits: 1, features: { ...CREDIT_FEATURES, mrpPaise: 99_900 }, sort: 1 },
  { code: 'PACK5', name: '5 Report Credits', description: 'Five full reports – for families or occasional consultations.', pricePaise: 1_99_900, intervalDays: null, credits: 5, features: { ...CREDIT_FEATURES, mrpPaise: 4_99_500 }, sort: 2 },
  { code: 'PRO_MONTHLY', name: 'Pro Monthly', description: 'For consultants: unlimited reports, white-label PDFs, bulk import/export, share links.', pricePaise: 2_49_900, intervalDays: 30, credits: 0, features: { ...PRO_FEATURES, mrpPaise: 4_99_900 }, sort: 3 },
  { code: 'PRO_YEARLY', name: 'Pro Yearly', description: 'Everything in Pro Monthly, billed yearly (two months free).', pricePaise: 24_99_900, intervalDays: 365, credits: 0, features: { ...PRO_FEATURES, mrpPaise: 59_98_800 }, sort: 4 },
];

let seeded = false;
export async function ensurePlans(db: Db = getDb()) {
  if (seeded) return;
  // Seed only an empty table, so plans the admin deleted are not re-created on the next restart.
  const [any] = await db.select({ code: plans.code }).from(plans).limit(1);
  if (!any) await db.insert(plans).values(DEFAULT_PLANS).onConflictDoNothing();
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

export interface PlanPrices {
  realPricePaise: number;
  offerPricePaise: number;
  discountPaise: number;
  discountPercent: number;
}

export function getPlanPrices(p: {
  code: string;
  pricePaise: number;
  intervalDays?: number | null;
  credits?: number;
  features?: object | null;
  mrpPaise?: number | null;
}): PlanPrices {
  let realPrice = 0;
  const feat = p.features as Record<string, unknown> | undefined;

  if (p.mrpPaise && p.mrpPaise > p.pricePaise) {
    realPrice = p.mrpPaise;
  } else if (feat && typeof feat.mrpPaise === 'number' && feat.mrpPaise > p.pricePaise) {
    realPrice = feat.mrpPaise;
  } else if (p.code === 'SINGLE') {
    realPrice = 99_900; // Real: ₹999, Offer: ₹499 (50% OFF)
  } else if (p.code === 'PACK5') {
    realPrice = 4_99_500; // Real: ₹4,995 (5 x ₹999), Offer: ₹1,999 (60% OFF)
  } else if (p.code === 'PRO_MONTHLY') {
    realPrice = 4_99_900; // Real: ₹4,999, Offer: ₹2,499 (50% OFF)
  } else if (p.code === 'PRO_YEARLY') {
    realPrice = 59_98_800; // Real: ₹59,988, Offer: ₹24,999 (58% OFF)
  } else if (p.credits && p.credits > 1) {
    realPrice = Math.max(p.pricePaise * 1.5, p.credits * 99_900);
  } else {
    const approx = Math.round((p.pricePaise * 2) / 10000) * 10000 - 100;
    realPrice = approx > p.pricePaise ? approx : p.pricePaise * 2;
  }

  const offerPrice = p.pricePaise;
  const discountPaise = Math.max(0, realPrice - offerPrice);
  const discountPercent = realPrice > 0 ? Math.round((discountPaise / realPrice) * 100) : 0;

  return {
    realPricePaise: realPrice,
    offerPricePaise: offerPrice,
    discountPaise,
    discountPercent,
  };
}

export const formatInr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
