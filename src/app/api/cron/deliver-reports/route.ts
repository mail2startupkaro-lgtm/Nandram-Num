import { json } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { runDueDeliveries } from '@/lib/server/service-delivery-run';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * GET /api/cron/deliver-reports – delivers every purchased-service report whose 3-hour mark has passed without the
 * numerologist's approval (English + Hindi PDF in the client's report area, then SMS + email), and retries
 * notifications that did not go out. Safe to call as often as you like: each order is delivered and notified once.
 *
 * Called by Vercel Cron (vercel.json), the GitHub Actions schedule (.github/workflows/deliver-reports.yml) or any
 * scheduler such as cron-job.org. When CRON_SECRET is set, the caller must send `Authorization: Bearer <CRON_SECRET>`
 * (Vercel Cron does this by itself) or `?key=<CRON_SECRET>`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const url = new URL(req.url);
  if (secret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}` && url.searchParams.get('key') !== secret) return json({ error: 'UNAUTHORIZED' }, 401);
  } else {
    // No secret configured: still works (it only delivers reports that are due anyway), but at most once a minute per caller.
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    const rl = rateLimit(`cron-deliver:${ip}`, 1, 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);
  }
  const t0 = Date.now();
  const out = await runDueDeliveries({ budgetMs: 240_000 });
  const count = (r: string) => out.filter((x) => x.result === r).length;
  return json({ ok: true, checked: out.length, delivered: count('delivered'), notified: count('notified'), failed: count('failed'), skipped: count('skipped'),
    results: out.map((x) => ({ id: x.id, result: x.result, ...('error' in x ? { error: x.error } : {}), ...('reason' in x ? { reason: x.reason } : {}) })), ms: Date.now() - t0 });
}
