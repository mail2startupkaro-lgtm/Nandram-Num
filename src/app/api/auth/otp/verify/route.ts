import { z } from 'zod';
import { verifyOtp } from '@/lib/auth/otp';
import { createSession, sessionCookie } from '@/lib/auth/session';
import { assertSameOrigin, clientIp, errorResponse, json } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const rl = rateLimit(`otpv:${clientIp(req)}`, 20, 10 * 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);
    const body = z.object({
      channel: z.enum(['email', 'sms']),
      identifier: z.string().min(3).max(320),
      code: z.string().regex(/^\d{6}$/),
      name: z.string().max(120).optional(),
    }).parse(await req.json());
    const user = await verifyOtp(body.channel, body.identifier, body.code, { name: body.name });
    const token = await createSession(user.id, req.headers.get('user-agent'));
    return json({ user: { id: user.id, name: user.name, role: user.role } }, 200, { 'set-cookie': sessionCookie(token) });
  } catch (e) {
    return errorResponse(e);
  }
}
