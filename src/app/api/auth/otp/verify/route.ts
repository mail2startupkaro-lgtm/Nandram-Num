import { z } from 'zod';
import { AuthError, detectChannel, isVerifiedSuperAdmin, verifyOtp } from '@/lib/auth/otp';
import { createSession, destroySession, readCookie, sessionCookie } from '@/lib/auth/session';
import { assertSameOrigin, clientIp, errorResponse, json, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  channel: z.enum(['email', 'sms']).optional(),
  identifier: z.string().trim().min(3).max(320),
  code: z.string().trim().length(6),
  name: z.string().trim().max(120).optional(),
});

/**
 * POST /api/auth/otp/verify
 * Verifies one-time login code and establishes an authenticated session.
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ip = clientIp(req);
    const rl = rateLimit(`otp-verify:${ip}`, 15, 10 * 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);

    const body = Body.parse(await readJson(req, 10_000));
    const channel = body.channel || detectChannel(body.identifier);

    const db = getDb();
    const user = await verifyOtp(channel, body.identifier, body.code, { name: body.name }, db);

    if (user.disabledAt) throw new AuthError('ACCOUNT_DISABLED', 403);

    // Clean up any stale session
    const oldToken = readCookie(req);
    if (oldToken) await destroySession(oldToken, db);

    const role = isVerifiedSuperAdmin(user) ? ('super_admin' as const) : user.role;
    if (role !== user.role) {
      await db.update(users).set({ role }).where(eq(users.id, user.id));
    }

    const token = await createSession(user.id, req.headers.get('user-agent'));
    return json({ user: { id: user.id, name: user.name, role } }, 200, { 'set-cookie': sessionCookie(token) });
  } catch (e) {
    return errorResponse(e);
  }
}
