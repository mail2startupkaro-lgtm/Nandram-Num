import { eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { AuthError, isSuperAdmin, normaliseIdentifier } from '@/lib/auth/otp';
import { hashPassword } from '@/lib/auth/password';
import { createSession, destroySession, readCookie, sessionCookie } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { assertSameOrigin, clientIp, errorResponse, json, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Create an account: name + email + mobile + password. */
const Body = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().min(3).max(320),
  mobile: z.string().trim().min(10).max(20),
  password: z.string().max(200),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const rl = rateLimit(`signup:${clientIp(req)}`, 10, 10 * 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);
    const body = Body.parse(await readJson(req, 10_000));
    if (body.password.length < 8) throw new AuthError('WEAK_PASSWORD', 400);
    const email = normaliseIdentifier('email', body.email);
    const phone = normaliseIdentifier('sms', body.mobile);
    const db = getDb();

    const existing = await db.select().from(users).where(or(eq(users.email, email), eq(users.phone, phone)));
    const byEmail = existing.find((u) => u.email === email);
    const byPhone = existing.find((u) => u.phone === phone);
    // An existing email/mobile can't be claimed by signing up again (no proof of ownership) – the owner signs in instead.
    if (byEmail) throw new AuthError('EMAIL_TAKEN', 409);
    if (byPhone) throw new AuthError('MOBILE_TAKEN', 409);

    const oldToken = readCookie(req);
    if (oldToken) await destroySession(oldToken, db);

    const now = new Date();
    const passwordHash = await hashPassword(body.password);
    const [user] = await db.insert(users).values({
      name: body.name, email, phone, passwordHash, passwordUpdatedAt: now, lastLoginAt: now,
      role: isSuperAdmin(email, phone) ? 'super_admin' : 'customer',
    }).returning();
    if (user.disabledAt) throw new AuthError('ACCOUNT_DISABLED', 403);
    const token = await createSession(user.id, req.headers.get('user-agent'));
    return json({ user: { id: user.id, name: user.name, role: user.role } }, 200, { 'set-cookie': sessionCookie(token) });
  } catch (e) { return errorResponse(e); }
}
