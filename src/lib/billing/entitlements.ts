/** What a user may do: Pro subscription, credits, admin. Reports are unlocked once (per profile + report type). */
import { and, eq, gt, isNotNull, sql } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { clientProfiles, creditLedger, reports, subscriptions, users, type PlanFeatures, type User } from '@/lib/db/schema';
import { PaymentRequiredError } from '@/lib/server/http';
import { FREE_FEATURES, getPlan, PRO_FEATURES } from './plans';

export interface Account { planCode: string | null; planName: string | null; proUntil: string | null; credits: number; features: PlanFeatures; isAdmin: boolean }

export async function getAccount(userId: string, db: Db = getDb()): Promise<Account> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [sub] = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, userId), gt(subscriptions.currentPeriodEnd, new Date()))).limit(1);
  const plan = sub ? await getPlan(sub.planCode, db) : undefined;
  const isAdmin = u?.role === 'super_admin';
  const features = isAdmin ? PRO_FEATURES : plan ? plan.features : u && u.credits > 0 ? { ...FREE_FEATURES, maxProfiles: 25 } : FREE_FEATURES;
  return { planCode: sub?.planCode ?? null, planName: plan?.name ?? null, proUntil: sub?.currentPeriodEnd.toISOString() ?? null, credits: u?.credits ?? 0, features, isAdmin };
}

export async function requireFeature(user: User, feature: keyof Omit<PlanFeatures, 'maxProfiles'>, db: Db = getDb()) {
  const a = await getAccount(user.id, db);
  if (!a.features[feature]) throw new PaymentRequiredError(`feature:${feature}`);
  return a;
}

export async function assertCanAddProfiles(user: User, adding = 1, db: Db = getDb()) {
  const a = await getAccount(user.id, db);
  if (a.features.maxProfiles === null) return;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(clientProfiles).where(eq(clientProfiles.ownerId, user.id));
  if (n + adding > a.features.maxProfiles) throw new PaymentRequiredError(`max_profiles:${a.features.maxProfiles}`);
}

/** Is this report (or an earlier version of the same profile + type) already unlocked? */
export async function isReportUnlocked(reportId: string, db: Db = getDb()): Promise<boolean> {
  const [r] = await db.select({ profileId: reports.profileId, module: reports.module, unlockedAt: reports.unlockedAt }).from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!r) return false;
  if (r.unlockedAt) return true;
  const [sib] = await db.select({ id: reports.id }).from(reports).where(and(eq(reports.profileId, r.profileId), eq(reports.module, r.module), isNotNull(reports.unlockedAt))).limit(1);
  if (sib) { await db.update(reports).set({ unlockedAt: new Date() }).where(eq(reports.id, reportId)); return true; }
  return false;
}

/**
 * Unlocks the full report: free for Pro/admin, otherwise consumes one credit when `useCredit` is true.
 * Throws PaymentRequiredError('credit_required' | 'no_credits').
 */
export async function unlockReport(user: User, reportId: string, opts: { useCredit?: boolean } = {}, db: Db = getDb()): Promise<'already' | 'plan' | 'credit'> {
  if (await isReportUnlocked(reportId, db)) return 'already';
  const a = await getAccount(user.id, db);
  if (a.features.fullReports) { await db.update(reports).set({ unlockedAt: new Date() }).where(eq(reports.id, reportId)); return 'plan'; }
  if (a.credits <= 0) throw new PaymentRequiredError('no_credits');
  if (!opts.useCredit) throw new PaymentRequiredError('credit_required');
  return db.transaction(async (tx) => {
    const [u] = await tx.update(users).set({ credits: sql`${users.credits} - 1` }).where(and(eq(users.id, user.id), gt(users.credits, 0))).returning({ credits: users.credits });
    if (!u) throw new PaymentRequiredError('no_credits');
    await tx.update(reports).set({ unlockedAt: new Date() }).where(eq(reports.id, reportId));
    await tx.insert(creditLedger).values({ userId: user.id, delta: -1, reason: 'unlock', reportId });
    return 'credit' as const;
  });
}
