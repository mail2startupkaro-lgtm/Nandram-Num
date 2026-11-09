import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { AuthError, detectChannel, isSuperAdmin, normaliseIdentifier } from '@/lib/auth/otp';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, sessionCookie } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { assertSameOrigin, clientIp, errorResponse, json } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60_000;

/** Sign in with email OR mobile number + password. */
const Body = z.object({
  identifier: z.string().trim().min(3).max(320),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const rl = rateLimit(`login:${clientIp(req)}`, 20, 10 * 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);
    const body = Body.parse(await req.json());
    const channel = detectChannel(body.identifier);
    let id: string | null = null;
    try { id = normaliseIdentifier(channel, body.identifier); } catch { /* fall through to generic error */ }

    const db = getDb();
    const [u] = id ? await db.select().from(users).where(channel === 'email' ? eq(users.email, id) : eq(users.phone, id)).limit(1) : [];
    if (u?.lockedUntil && u.lockedUntil.getTime() > Date.now()) throw new AuthError('ACCOUNT_LOCKED', 429);

    const ok = await verifyPassword(body.password, u?.passwordHash);
    if (!u || !ok) {
      if (u) {
        const failed = (u.failedLogins ?? 0) + 1;
        await db.update(users).set(failed >= MAX_FAILED ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } : { failedLogins: failed }).where(eq(users.id, u.id));
      }
      throw new AuthError('INVALID_CREDENTIALS', 401);
    }
    if (u.disabledAt) throw new AuthError('ACCOUNT_DISABLED', 403);

    const role = isSuperAdmin(u.email, u.phone) ? ('super_admin' as const) : u.role;
    await db.update(users).set({ lastLoginAt: new Date(), role, failedLogins: 0, lockedUntil: null }).where(eq(users.id, u.id));
    const token = await createSession(u.id, req.headers.get('user-agent'));
    return json({ user: { id: u.id, name: u.name, role } }, 200, { 'set-cookie': sessionCookie(token) });
  } catch (e) { return errorResponse(e); }
}
