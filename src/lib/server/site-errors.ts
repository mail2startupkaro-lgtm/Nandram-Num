/**
 * Website error tracking (Admin → Website Health).
 *
 * recordSiteError() is called from: every API error that ends in a 500 (lib/server/http.ts), uncaught server errors in
 * pages and routes (src/instrumentation.ts → onRequestError), errors in visitors' browsers (/api/errors), and
 * problems in the automatic report delivery, notifications and payment checks.
 *
 * - Same kind of error → one row (fingerprint of source + message shape + route) with a counter and first/last seen,
 *   so a repeating error never floods the database. A resolved error that comes back is re-opened.
 * - Personal data is masked before saving (emails, phone / card-like numbers, tokens).
 * - Never throws and never blocks the request: if the database itself is down, the error is only logged.
 */
import { createHash } from 'node:crypto';
import { and, desc, eq, gte, ilike, isNotNull, isNull, lt, or, sql, type SQL } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { siteErrorDays, siteErrors } from '@/lib/db/schema';

export const ERROR_SOURCES = ['server', 'api', 'client', 'delivery', 'notify', 'payment', 'pdf', 'cron'] as const;
export type ErrorSource = (typeof ERROR_SOURCES)[number];
export interface SiteErrorInput {
  source: ErrorSource; level?: 'error' | 'warning'; message: string; stack?: string | null;
  route?: string | null; method?: string | null; status?: number | null; meta?: Record<string, unknown> | null;
}

/** Masks personal data and secrets in error text. */
export function redact(s: string): string {
  return s
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\b(Bearer|Basic)\s+[\w\-.~+/=]+/gi, '$1 [token]')
    .replace(/\b(key|token|secret|password|pass|otp|signature)=([^&\s]+)/gi, '$1=[hidden]')
    .replace(/(?<![\w-])\+?\d[\d\s-]{8,}\d(?![\w-])/g, '[number]');
}

/** Groups errors of the same kind: ids, numbers and quoted values do not create new rows. */
export function fingerprintOf(e: Pick<SiteErrorInput, 'source' | 'level' | 'message' | 'route'>): string {
  const shape = (s: string) => s.toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<id>')
    .replace(/\b[0-9a-f]{16,}\b/g, '<hex>')
    .replace(/(["'`]).*?\1/g, '<str>')
    .replace(/\d+/g, '#')
    .slice(0, 300);
  const route = (e.route ?? '').split('?')[0].replace(/\/[0-9a-f-]{16,}(?=\/|$)/gi, '/:id').replace(/\/\d+(?=\/|$)/g, '/:n');
  return createHash('sha256').update(`${e.source}|${e.level ?? 'error'}|${shape(e.message)}|${route}`).digest('hex').slice(0, 40);
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS "site_errors" ("id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "fingerprint" varchar(64) NOT NULL UNIQUE, "source" varchar(20) NOT NULL, "level" varchar(10) DEFAULT 'error' NOT NULL, "message" text NOT NULL, "stack" text, "route" varchar(300), "method" varchar(10), "status" integer, "count" integer DEFAULT 1 NOT NULL, "meta" jsonb, "first_seen" timestamp with time zone DEFAULT now() NOT NULL, "last_seen" timestamp with time zone DEFAULT now() NOT NULL, "resolved_at" timestamp with time zone)`,
  `CREATE INDEX IF NOT EXISTS "site_errors_last_idx" ON "site_errors" ("last_seen")`,
  `CREATE TABLE IF NOT EXISTS "site_error_days" ("day" varchar(10) NOT NULL, "source" varchar(20) NOT NULL, "level" varchar(10) NOT NULL, "count" integer DEFAULT 0 NOT NULL, PRIMARY KEY ("day", "source", "level"))`,
];
const ready = new WeakMap<object, Promise<void>>();
export function ensureSiteErrorTables(db: Db = getDb()): Promise<void> {
  let p = ready.get(db);
  if (!p) {
    p = (async () => { for (const q of DDL) await db.execute(sql.raw(q)); })().catch((e) => { ready.delete(db); throw e; });
    ready.set(db, p);
  }
  return p;
}

const istDay = (d = new Date()) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);

/** Per server: the same error is written at most every 10 s; repeats in between are added to the counter. */
const pending = new Map<string, { last: number; skipped: number }>();
const THROTTLE_MS = 10_000;

export async function recordSiteError(e: SiteErrorInput, db?: Db): Promise<void> {
  try {
    const level = e.level ?? 'error';
    const message = redact(String(e.message || 'Unknown error')).slice(0, 1000);
    const route = e.route ? redact(e.route).slice(0, 300) : null;
    const fp = fingerprintOf({ source: e.source, level, message, route });
    const now = Date.now();
    const p = pending.get(fp);
    if (p && now - p.last < THROTTLE_MS) { p.skipped++; return; }
    const add = 1 + (p?.skipped ?? 0);
    pending.set(fp, { last: now, skipped: 0 });
    if (pending.size > 2000) for (const [k, v] of pending) if (now - v.last > 60_000) pending.delete(k);

    const d = db ?? getDb();
    await ensureSiteErrorTables(d);
    const stack = e.stack ? redact(e.stack).slice(0, 4000) : null;
    const meta = e.meta ? safeMeta(e.meta) : null;
    await d.insert(siteErrors).values({ fingerprint: fp, source: e.source, level, message, stack, route, method: e.method?.slice(0, 10) ?? null, status: e.status ?? null, count: add, meta })
      .onConflictDoUpdate({ target: siteErrors.fingerprint, set: {
        count: sql`${siteErrors.count} + ${add}`, lastSeen: sql`now()`, resolvedAt: null, message, status: e.status ?? null,
        stack: sql`coalesce(${stack}, ${siteErrors.stack})`, meta: sql`coalesce(${meta ? JSON.stringify(meta) : null}::jsonb, ${siteErrors.meta})`,
      } });
    await d.insert(siteErrorDays).values({ day: istDay(), source: e.source, level, count: add })
      .onConflictDoUpdate({ target: [siteErrorDays.day, siteErrorDays.source, siteErrorDays.level], set: { count: sql`${siteErrorDays.count} + ${add}` } });
    if (Math.random() < 0.02) await d.delete(siteErrors).where(lt(siteErrors.lastSeen, new Date(now - 90 * 86_400_000))).catch(() => undefined);
  } catch (x) {
    console.error('[site-errors] could not record:', x instanceof Error ? x.message : x, '| original:', String(e.message).slice(0, 200));
  }
}

function safeMeta(m: Record<string, unknown>): Record<string, unknown> {
  const text = redact(JSON.stringify(m));
  if (text.length <= 4000) { try { return JSON.parse(text) as Record<string, unknown>; } catch { /* fall through */ } }
  return { note: 'details too long', preview: text.slice(0, 1000) };
}

/** Fire-and-forget form for hot paths. */
export function reportSiteError(e: SiteErrorInput) { void recordSiteError(e); }

/* ---------- admin queries ---------- */
export interface ErrorFilter { source?: string; level?: string; status?: 'open' | 'resolved' | 'all'; q?: string; sinceHours?: number; limit?: number }
export async function listSiteErrors(f: ErrorFilter = {}, db: Db = getDb()) {
  await ensureSiteErrorTables(db);
  const w: (SQL | undefined)[] = [
    f.source && f.source !== 'all' ? eq(siteErrors.source, f.source) : undefined,
    f.level && f.level !== 'all' ? eq(siteErrors.level, f.level) : undefined,
    f.status === 'resolved' ? isNotNull(siteErrors.resolvedAt) : f.status === 'all' ? undefined : isNull(siteErrors.resolvedAt),
    f.q ? or(ilike(siteErrors.message, `%${f.q}%`), ilike(siteErrors.route, `%${f.q}%`)) : undefined,
    f.sinceHours ? gte(siteErrors.lastSeen, new Date(Date.now() - f.sinceHours * 3_600_000)) : undefined,
  ];
  return db.select().from(siteErrors).where(and(...w)).orderBy(desc(siteErrors.lastSeen)).limit(Math.min(f.limit ?? 200, 1000));
}

export async function errorSummary(db: Db = getDb()) {
  await ensureSiteErrorTables(db);
  const since24 = new Date(Date.now() - 86_400_000), since7 = new Date(Date.now() - 7 * 86_400_000);
  const [open] = (await db.execute(sql`select count(*)::int as n, coalesce(sum(case when level = 'error' then 1 else 0 end), 0)::int as errors from site_errors where resolved_at is null`)).rows as { n: number; errors: number }[];
  const [recent] = (await db.execute(sql`select count(*)::int as kinds from site_errors where last_seen >= ${since24.toISOString()}::timestamptz`)).rows as { kinds: number }[];
  const days: string[] = Array.from({ length: 14 }, (_, i) => istDay(new Date(Date.now() - (13 - i) * 86_400_000)));
  const dayRows = await db.select().from(siteErrorDays).where(gte(siteErrorDays.day, days[0]));
  const daily = days.map((day) => ({ day, error: dayRows.filter((r) => r.day === day && r.level === 'error').reduce((a, r) => a + r.count, 0), warning: dayRows.filter((r) => r.day === day && r.level === 'warning').reduce((a, r) => a + r.count, 0) }));
  const bySource = ERROR_SOURCES.map((s) => ({ source: s, today: dayRows.filter((r) => r.source === s && r.day === days[13]).reduce((a, r) => a + r.count, 0), week: dayRows.filter((r) => r.source === s && r.day >= days[7]).reduce((a, r) => a + r.count, 0) }));
  const top = await db.select({ id: siteErrors.id, message: siteErrors.message, source: siteErrors.source, level: siteErrors.level, route: siteErrors.route, count: siteErrors.count, lastSeen: siteErrors.lastSeen })
    .from(siteErrors).where(gte(siteErrors.lastSeen, since7)).orderBy(desc(siteErrors.count)).limit(10);
  const today = daily[13];
  return { openKinds: open?.n ?? 0, openErrors: open?.errors ?? 0, kinds24h: recent?.kinds ?? 0, today: today.error + today.warning, daily, bySource, top };
}

export async function resolveSiteErrors(ids: string[] | 'all', resolved = true, db: Db = getDb()) {
  await ensureSiteErrorTables(db);
  const set = { resolvedAt: resolved ? new Date() : null };
  if (ids === 'all') await db.update(siteErrors).set(set).where(isNull(siteErrors.resolvedAt));
  else if (ids.length) await db.update(siteErrors).set(set).where(or(...ids.map((id) => eq(siteErrors.id, id))));
}

export async function deleteResolvedSiteErrors(db: Db = getDb()) {
  await ensureSiteErrorTables(db);
  const r = await db.delete(siteErrors).where(isNotNull(siteErrors.resolvedAt)).returning({ id: siteErrors.id });
  return r.length;
}
