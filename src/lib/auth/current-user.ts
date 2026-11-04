/**
 * Resolves the signed-in user from the session cookie.
 * Development/test only: AUTH_DEV_BYPASS_EMAIL signs every request in as that account (ignored in production).
 */
import { eq } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { users, type User } from '@/lib/db/schema';
import { readCookie, userFromSession } from './session';

export class UnauthorizedError extends Error { constructor() { super('UNAUTHORIZED'); } }
export class ForbiddenError extends Error { constructor(code = 'FORBIDDEN') { super(code); } }

export async function ensureUser(email: string, role: User['role'] = 'expert', db: Db = getDb()): Promise<User> {
  const [found] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (found) return found;
  const [created] = await db.insert(users).values({ email, role, name: email.split('@')[0] }).onConflictDoNothing().returning();
  return created ?? (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
}

export async function getOptionalUser(req?: Request): Promise<User | null> {
  const bypass = process.env.NODE_ENV !== 'production' ? process.env.AUTH_DEV_BYPASS_EMAIL : undefined;
  if (bypass) return ensureUser(bypass, 'super_admin');
  let token: string | undefined;
  if (req) token = readCookie(req);
  else {
    const { cookies } = await import('next/headers');
    token = cookies().get('nsid')?.value;
  }
  return userFromSession(token);
}

export async function getCurrentUser(req?: Request): Promise<User> {
  const u = await getOptionalUser(req);
  if (!u) throw new UnauthorizedError();
  return u;
}

export function requireRole(u: User, ...roles: User['role'][]) {
  if (!roles.includes(u.role)) throw new ForbiddenError();
}
