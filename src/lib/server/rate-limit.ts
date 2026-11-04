/**
 * Simple fixed-window rate limiter (per server instance). Good enough for a single region deployment;
 * swap for Upstash/Redis when running many instances.
 */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    return { ok: true, retryAfter: 0 };
  }
  b.count++;
  return { ok: b.count <= limit, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

export function tooMany(retryAfter: number) {
  return new Response(JSON.stringify({ error: 'RATE_LIMITED' }), { status: 429, headers: { 'content-type': 'application/json', 'retry-after': String(retryAfter) } });
}
