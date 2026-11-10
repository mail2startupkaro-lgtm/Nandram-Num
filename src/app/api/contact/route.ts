import { ContactInput, createContactMessage } from '@/lib/contact';
import { clientIp, json, readJson, withOptionalUser } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public Contact Us form. Anonymous visitors allowed; rate-limited per IP; a filled honeypot is silently accepted and dropped. */
export const POST = withOptionalUser(async (req, user) => {
  const ip = clientIp(req);
  const burst = rateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!burst.ok) return tooMany(burst.retryAfter);
  const day = rateLimit(`contact-day:${ip}`, 20, 24 * 60 * 60_000);
  if (!day.ok) return tooMany(day.retryAfter);
  const raw = await readJson<Record<string, unknown>>(req, 20_000);
  if (typeof raw?.website === 'string' && raw.website.length > 0) return json({ ok: true }, 201);
  const input = ContactInput.parse(raw);
  const row = await createContactMessage(input, { userId: user?.id ?? null });
  return json({ ok: true, id: row.id }, 201);
});
