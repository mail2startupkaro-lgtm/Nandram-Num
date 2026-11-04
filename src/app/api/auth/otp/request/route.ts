import { z } from 'zod';
import { requestOtp } from '@/lib/auth/otp';
import { assertSameOrigin, clientIp, errorResponse, json } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ip = clientIp(req);
    const rl = rateLimit(`otp:${ip}`, 10, 10 * 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);
    const body = z.object({ channel: z.enum(['email', 'sms']), identifier: z.string().min(3).max(320) }).parse(await req.json());
    const out = await requestOtp(body.channel, body.identifier, { ip });
    return json({ sent: true, ...out });
  } catch (e) { return errorResponse(e); }
}
