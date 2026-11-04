/** Opaque session tokens in an httpOnly cookie; only a SHA-256 of the token is stored. */
import { and, eq, gt, lt } from 'drizzle-orm';
import { randomToken, sha256Hex } from '@/lib/security/crypto';
import { getDb, type Db } from '@/lib/db/client';
import { sessions, users, type User } from '@/lib/db/schema';

export const SESSION_COOKIE = 'nsid';
export const SESSION_DAYS = 30;

export function sessionCookie(token: string, maxAgeSec = SESSION_DAYS * 86400) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}
export const clearSessionCookie = () => sessionCookie('', 0);

export async function createSession(userId: string, userAgent?: string | null, db: Db = getDb()): Promise<string> {
  const token = randomToken(32);
  await db.insert(sessions).values({ tokenHash: sha256Hex(token), userId, userAgent: userAgent?.slice(0, 300), expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) });
  // opportunistic clean-up of expired sessions
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  return token;
}

export async function userFromSession(token: string | undefined, db: Db = getDb()): Promise<User | null> {
  if (!token || token.length > 100) return null;
  const [row] = await db.select({ u: users }).from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256Hex(token)), gt(sessions.expiresAt, new Date()))).limit(1);
  if (!row || row.u.disabledAt) return null;
  return row.u;
}

export async function destroySession(token: string | undefined, db: Db = getDb()) {
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256Hex(token)));
}

export async function destroyAllSessions(userId: string, db: Db = getDb()) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export function readCookie(req: Request, name = SESSION_COOKIE): string | undefined {
  const raw = req.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}
