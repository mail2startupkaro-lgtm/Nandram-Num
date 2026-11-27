import { BOT_UA } from '@/lib/analytics/visits';
import { recordClick } from '@/lib/affiliate/store';
import { clientIp } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Counts a click on an affiliate link (?ref=CODE). The referral cookie itself is set by the middleware, so a sale is
 * credited even if this beacon is blocked. Always answers 204 quickly – tracking must never break the site.
 */
export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin');
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    if (origin) { try { if (new URL(origin).host !== host) return new Response(null, { status: 204 }); } catch { return new Response(null, { status: 204 }); } }
    if (BOT_UA.test(req.headers.get('user-agent') ?? '')) return new Response(null, { status: 204 });
    if (!rateLimit(`affclick:${clientIp(req)}`, 20, 60 * 60_000).ok) return new Response(null, { status: 204 });
    const text = await req.text();
    if (text.length > 1000) return new Response(null, { status: 204 });
    const b = JSON.parse(text) as { code?: unknown; path?: unknown };
    if (typeof b.code === 'string') await recordClick(b.code, typeof b.path === 'string' ? b.path : undefined);
  } catch { /* ignore */ }
  return new Response(null, { status: 204 });
}
