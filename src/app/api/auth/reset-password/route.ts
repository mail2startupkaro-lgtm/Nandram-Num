import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { AuthError, detectChannel, normaliseIdentifier, verifyOtp } from '@/lib/auth/otp';
import { hashPassword } from '@/lib/auth/password';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { assertSameOrigin, clientIp, errorResponse, json } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Reset password: verify OTP + set a new password in one step. */
const Body = z.object({
  identifier: z.string().trim().min(3).max(320),
  code: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const rl = rateLimit(`reset-pw:${clientIp(req)}`, 10, 10 * 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);
    const body = Body.parse(await req.json());
    const channel = detectChannel(body.identifier);
    const ident = normaliseIdentifier(channel, body.identifier);

    // Only existing accounts can reset a password – "Forgot password" must not become a way to sign up
    // without the details the sign-up form requires.
    const db = getDb();
    const [existing] = await db.select({ id: users.id }).from(users).where(channel === 'email' ? eq(users.email, ident) : eq(users.phone, ident)).limit(1);
    if (!existing) throw new AuthError('INVALID_CREDENTIALS', 400);

    const user = await verifyOtp(channel, body.identifier, body.code);
    if (user.id !== existing.id) throw new AuthError('INVALID_CREDENTIALS', 400);

    const passwordHash = await hashPassword(body.newPassword);
    await db.update(users).set({
      passwordHash,
      passwordUpdatedAt: new Date(),
      failedLogins: 0,
      lockedUntil: null,
    }).where(eq(users.id, user.id));

    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
