/** Self-service account security: change password, sign out other devices, erase my data (DPDP "right to erasure"). */
import { and, eq, ne } from 'drizzle-orm';
import { AuthError } from '@/lib/auth/otp';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { getDb, type Db } from '@/lib/db/client';
import { brandings, clientProfiles, payments, serviceOrders, sessions, users, type User, marketingLeads } from '@/lib/db/schema';
import { encryptJson } from '@/lib/security/crypto';
import { sha256Hex } from '@/lib/security/crypto';

export const MIN_PASSWORD = 8;

export async function changePassword(user: User, current: string, next: string, keepToken: string | null, db: Db = getDb()) {
  if (next.length < MIN_PASSWORD) throw new AuthError('WEAK_PASSWORD', 400);
  // Accounts created with Google have no password yet: they may set one without a current password.
  if (user.passwordHash && !(await verifyPassword(current, user.passwordHash))) throw new AuthError('INVALID_CREDENTIALS', 401);
  if (user.passwordHash && (await verifyPassword(next, user.passwordHash))) throw new AuthError('SAME_PASSWORD', 400);
  await db.update(users).set({ passwordHash: await hashPassword(next), passwordUpdatedAt: new Date(), failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  return signOutOtherSessions(user.id, keepToken, db);
}

/** Ends every session of the user except the one making the request. Returns how many were ended. */
export async function signOutOtherSessions(userId: string, keepToken: string | null, db: Db = getDb()) {
  const where = keepToken ? and(eq(sessions.userId, userId), ne(sessions.tokenHash, sha256Hex(keepToken))) : eq(sessions.userId, userId);
  return (await db.delete(sessions).where(where).returning({ t: sessions.tokenHash })).length;
}

/**
 * Erases the user's personal data. Saved readings, reports, share links, branding and sessions are deleted.
 * If the account has paid orders, the tax records (invoices) must be kept by law, so the account is anonymised and
 * disabled instead of removed; otherwise the user row is deleted completely.
 */
export async function eraseAccount(user: User, password: string, db: Db = getDb()): Promise<'deleted' | 'anonymised'> {
  if (user.role === 'super_admin') throw new AuthError('ADMIN_CANNOT_SELF_DELETE', 400);
  if (user.passwordHash && !(await verifyPassword(password, user.passwordHash))) throw new AuthError('INVALID_CREDENTIALS', 401);
  return db.transaction(async (tx) => {
    await tx.delete(marketingLeads).where(eq(marketingLeads.userId, user.id)); // CRM contact, timeline, tasks, consents
    const [paid] = await tx.select({ id: payments.id }).from(payments).where(and(eq(payments.userId, user.id), eq(payments.status, 'paid'))).limit(1);
    if (!paid) { await tx.delete(users).where(eq(users.id, user.id)); return 'deleted' as const; }
    await tx.delete(clientProfiles).where(eq(clientProfiles.ownerId, user.id)); // reports and share links cascade
    await tx.delete(brandings).where(eq(brandings.userId, user.id));
    await tx.update(serviceOrders).set({ detailsEnc: encryptJson({ erased: true }) }).where(eq(serviceOrders.userId, user.id));
    await tx.delete(sessions).where(eq(sessions.userId, user.id));
    await tx.update(users).set({ name: null, email: null, phone: null, googleSub: null, passwordHash: null, disabledAt: new Date(), credits: 0 }).where(eq(users.id, user.id));
    return 'anonymised' as const;
  });
}
