/**
 * Simple fixed-window rate limiter (per server instance). Good enough for a single region deployment;
 * swap for Upstash/Redis when running many instances.
 * Memory-safe: enforces a strict upper bound on tracked keys to prevent DoS via heap exhaustion.
 */
const MAX_BUCKETS = 10_000;
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      // Purge expired entries first
      for (const [k, v] of buckets) {
        if (v.reset <= now) buckets.delete(k);
      }
      // If still at capacity, evict the oldest 20% to guarantee bounded memory
      if (buckets.size >= MAX_BUCKETS) {
        let toRemove = Math.floor(MAX_BUCKETS * 0.2);
        for (const k of buckets.keys()) {
          buckets.delete(k);
          if (--toRemove <= 0) break;
        }
      }
    }
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count++;
  return { ok: b.count <= limit, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

export function tooMany(retryAfter: number) {
  return new Response(JSON.stringify({ error: 'RATE_LIMITED' }), { status: 429, headers: { 'content-type': 'application/json', 'retry-after': String(retryAfter) } });
}
