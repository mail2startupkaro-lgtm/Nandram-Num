import { getOptionalUser } from '@/lib/auth/current-user';
import { Beacon, BOT_UA, recordBeacon } from '@/lib/analytics/visits';
import { clientIp, json } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * First-party visitor beacon (page views, time on page, conversion events). Sent with navigator.sendBeacon (text/plain),
 * so the body is read as text. Always answers 200/204 quickly – tracking must never break the site.
 */
export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin');
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    if (origin) { try { if (new URL(origin).host !== host) return new Response(null, { status: 204 }); } catch { return new Response(null, { status: 204 }); } }
    if (BOT_UA.test(req.headers.get('user-agent') ?? '')) return new Response(null, { status: 204 });
    if (!rateLimit(`beacon:${clientIp(req)}`, 300, 60_000).ok) return new Response(null, { status: 204 });
    const text = await req.text();
    if (text.length > 8_000) return new Response(null, { status: 204 });
    const parsed = Beacon.safeParse(JSON.parse(text));
    if (!parsed.success) return new Response(null, { status: 204 });
    let userId: string | null = null;
    if (parsed.data.t === 'pv') {
      const user = await getOptionalUser(req).catch(() => null);
      if (user?.role === 'super_admin') return json({ skip: true }); // the owner's own browsing is not counted
      userId = user?.id ?? null;
    }
    const r = await recordBeacon(parsed.data, { headers: req.headers, userId });
    return r.id ? json({ id: r.id }) : new Response(null, { status: 204 });
  } catch (e) {
    console.error('analytics beacon:', e instanceof Error ? e.message.slice(0, 120) : 'unknown');
    return new Response(null, { status: 204 });
  }
}
