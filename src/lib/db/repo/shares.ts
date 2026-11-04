/** Expiring, optionally password-protected share links. Only a hash of the token is stored. */
import { and, desc, eq, sql } from 'drizzle-orm';
import { hashPassword, randomToken, sha256Hex, verifyPassword } from '@/lib/security/crypto';
import { getDb, type Db } from '../client';
import { reports, shareLinks } from '../schema';
import { getReport, hydrate } from './reports';

export async function createShareLink(ownerId: string, reportId: string, opts: { days?: number; password?: string } = {}, db: Db = getDb()) {
  await getReport(ownerId, reportId, db); // ownership check
  const days = Math.min(Math.max(Math.round(opts.days ?? 7), 1), 30);
  const token = randomToken(24);
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  const [row] = await db.insert(shareLinks).values({
    reportId, tokenHash: sha256Hex(token), expiresAt, passwordHash: opts.password ? hashPassword(opts.password) : null,
  }).returning({ id: shareLinks.id });
  return { id: row.id, token, expiresAt, passwordProtected: !!opts.password };
}

export async function listShareLinks(ownerId: string, reportId: string, db: Db = getDb()) {
  await getReport(ownerId, reportId, db);
  return db.select({ id: shareLinks.id, expiresAt: shareLinks.expiresAt, revokedAt: shareLinks.revokedAt, views: shareLinks.views, createdAt: shareLinks.createdAt, passwordProtected: sql<boolean>`${shareLinks.passwordHash} is not null` })
    .from(shareLinks).where(eq(shareLinks.reportId, reportId)).orderBy(desc(shareLinks.createdAt));
}

export async function revokeShareLink(ownerId: string, shareId: string, db: Db = getDb()) {
  const [s] = await db.select({ reportId: shareLinks.reportId }).from(shareLinks).where(eq(shareLinks.id, shareId)).limit(1);
  if (!s) return;
  await getReport(ownerId, s.reportId, db);
  await db.update(shareLinks).set({ revokedAt: new Date() }).where(eq(shareLinks.id, shareId));
}

export type ShareResolution =
  | { status: 'not_found' | 'expired' | 'revoked' | 'password_required' | 'wrong_password' }
  | { status: 'ok'; report: ReturnType<typeof hydrate>; expiresAt: Date };

export async function resolveShareLink(token: string, password?: string, opts: { countView?: boolean } = {}, db: Db = getDb()): Promise<ShareResolution> {
  if (!token || token.length > 100) return { status: 'not_found' };
  const [row] = await db.select({ s: shareLinks, r: reports }).from(shareLinks).innerJoin(reports, eq(reports.id, shareLinks.reportId))
    .where(eq(shareLinks.tokenHash, sha256Hex(token))).limit(1);
  if (!row) return { status: 'not_found' };
  if (row.s.revokedAt) return { status: 'revoked' };
  if (row.s.expiresAt.getTime() < Date.now()) return { status: 'expired' };
  if (row.s.passwordHash) {
    if (!password) return { status: 'password_required' };
    if (!verifyPassword(password, row.s.passwordHash)) return { status: 'wrong_password' };
  }
  if (opts.countView) await db.update(shareLinks).set({ views: sql`${shareLinks.views} + 1` }).where(and(eq(shareLinks.id, row.s.id)));
  return { status: 'ok', report: hydrate(row.r), expiresAt: row.s.expiresAt };
}
