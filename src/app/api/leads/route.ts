import { createLead, LeadInput, miniReading } from '@/lib/funnel/leads';
import { clientIp, json, readJson, withOptionalUser } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Services funnel lead form (free mini-reading / unlock sample report). Anonymous; rate-limited per IP; honeypot. */
export const POST = withOptionalUser(async (req, user) => {
  const ip = clientIp(req);
  const burst = rateLimit(`lead:${ip}`, 6, 10 * 60_000);
  if (!burst.ok) return tooMany(burst.retryAfter);
  const day = rateLimit(`lead-day:${ip}`, 30, 24 * 60 * 60_000);
  if (!day.ok) return tooMany(day.retryAfter);
  const raw = await readJson<Record<string, unknown>>(req, 10_000);
  if (typeof raw?.website === 'string' && raw.website.length > 0) { // bot: pretend success, store nothing
    const dob = typeof raw.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dob) ? raw.dob : '2000-01-01';
    try { return json({ ok: true, downloadUrl: '/ebooks/numerology-made-easy-guide.pdf', ...miniReading(dob) }, 201); } catch { return json({ ok: true, downloadUrl: '/ebooks/numerology-made-easy-guide.pdf', moolank: 1, bhagyank: 1 }, 201); }
  }
  const input = LeadInput.parse(raw);
  const r = await createLead(input, { ip, userAgent: req.headers.get('user-agent'), userId: user?.id ?? null });
  return json({ ok: true, moolank: r.moolank, bhagyank: r.bhagyank, downloadUrl: r.downloadUrl }, 201);
});
