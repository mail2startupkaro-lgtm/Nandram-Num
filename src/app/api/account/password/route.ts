import { z } from 'zod';
import { changePassword } from '@/lib/auth/account-security';
import { readCookie } from '@/lib/auth/session';
import { json, readJson, withUser } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Change (or, for Google-only accounts, set) the password. Other devices are signed out. */
export const POST = withUser(async (req, user) => {
  const rl = rateLimit(`pwchange:${user.id}`, 8, 15 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const b = z.object({ current: z.string().max(200).default(''), next: z.string().min(1).max(200) }).parse(await readJson(req, 10_000));
  const ended = await changePassword(user, b.current, b.next, readCookie(req) ?? null);
  return json({ ok: true, sessionsEnded: ended });
});
