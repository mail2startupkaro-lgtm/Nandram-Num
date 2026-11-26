/**
 * First-party visitor analytics: page views, time on page, scroll depth, sources, location and conversion events.
 * Privacy: no IP address, name, phone or email is stored. A visitor is a random id kept in the browser;
 * country / region / city come from the hosting edge headers (Vercel / Cloudflare) or, failing that, the browser time zone.
 */
import { sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type Db } from '@/lib/db/client';

// ───────────────────────── tables (created on first use, also shipped as drizzle/0010_site_analytics.sql)
const g = globalThis as unknown as { __siteAnalyticsReady?: Promise<void> };
export function ensureAnalyticsTables(db: Db = getDb()): Promise<void> {
  if (!g.__siteAnalyticsReady) {
    g.__siteAnalyticsReady = (async () => {
      for (const stmt of DDL.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean)) {
        await db.execute(sql.raw(stmt));
      }
    })().catch((e) => { g.__siteAnalyticsReady = undefined; throw e; });
  }
  return g.__siteAnalyticsReady;
}
/** Same statements as drizzle/0010_site_analytics.sql (kept inline so serverless bundles need no file access). */
const DDL = `CREATE TABLE IF NOT EXISTS site_visits (id bigserial PRIMARY KEY, visitor_id varchar(40) NOT NULL, session_id varchar(40) NOT NULL, user_id text, path varchar(300) NOT NULL, title varchar(200), referrer_host varchar(120), source varchar(80), medium varchar(60), campaign varchar(120), channel varchar(20) NOT NULL DEFAULT 'Direct', country varchar(2), region varchar(80), city varchar(80), device varchar(10), browser varchar(30), os varchar(30), lang varchar(12), tz varchar(60), screen_w smallint, is_new_visitor boolean NOT NULL DEFAULT false, is_entry boolean NOT NULL DEFAULT false, duration_ms integer NOT NULL DEFAULT 0, scroll_pct smallint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS site_visits_created_idx ON site_visits (created_at)
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS site_visits_session_idx ON site_visits (session_id, created_at)
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS site_visits_updated_idx ON site_visits (updated_at)
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS site_events (id bigserial PRIMARY KEY, visitor_id varchar(40) NOT NULL, session_id varchar(40) NOT NULL, visit_id bigint, name varchar(40) NOT NULL, path varchar(300), label varchar(120), value numeric(12,2), country varchar(2), created_at timestamptz NOT NULL DEFAULT now())
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS site_events_created_idx ON site_events (created_at)
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS site_events_session_idx ON site_events (session_id)`;

// ───────────────────────── input from the browser beacon
const id = z.string().regex(/^[A-Za-z0-9_-]{8,40}$/);
const str = (n: number) => z.string().max(2000).optional().transform((s) => (s ? s.slice(0, n) : undefined));
export const Beacon = z.discriminatedUnion('t', [
  z.object({
    t: z.literal('pv'), v: id, s: id, nv: z.boolean().optional(), en: z.boolean().optional(),
    p: z.string().min(1).max(2000), ti: str(200), r: str(500), us: str(80), um: str(60), uc: str(120),
    l: str(12), tz: str(60), w: z.number().int().min(0).max(20000).optional(),
  }),
  z.object({ t: z.literal('end'), s: id, id: z.number().int().positive(), ms: z.number().int().min(0), sc: z.number().int().min(0).max(100).optional() }),
  z.object({ t: z.literal('ev'), v: id, s: id, id: z.number().int().positive().optional(), n: z.string().regex(/^[a-z0-9_]{2,40}$/), p: str(300), lb: str(120), val: z.number().finite().optional() }),
]);
export type Beacon = z.infer<typeof Beacon>;

export const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|axios|node-fetch|vercel-screenshot|prerender/i;

export function parseUa(ua: string) {
  const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua) ? 'tablet' : /mobi|iphone|ipod|android.*mobile|opera mini/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /edg\//i.test(ua) ? 'Edge' : /opr\/|opera/i.test(ua) ? 'Opera' : /samsungbrowser/i.test(ua) ? 'Samsung Internet' : /ucbrowser/i.test(ua) ? 'UC Browser'
    : /fbav|fban|instagram/i.test(ua) ? 'In-app (Meta)' : /firefox|fxios/i.test(ua) ? 'Firefox' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Other';
  const os = /windows/i.test(ua) ? 'Windows' : /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /mac os x|macintosh/i.test(ua) ? 'macOS' : /cros/i.test(ua) ? 'ChromeOS' : /linux/i.test(ua) ? 'Linux' : 'Other';
  return { device, browser, os };
}

const SEARCH = /(^|\.)(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia|startpage|search\.brave|naver)\./i;
const SOCIAL = /(^|\.)(facebook|fb|instagram|t\.co|twitter|x\.com|linkedin|lnkd|pinterest|pin\.it|youtube|youtu\.be|reddit|quora|telegram|t\.me|threads|snapchat|sharechat|koo)/i;
/** GA-style default channel grouping. */
export function channelFor(refHost: string | null, src?: string, med?: string): string {
  const m = (med ?? '').toLowerCase(), s = (src ?? '').toLowerCase();
  if (/^(cpc|ppc|paid|paidsearch|paid_social|paidsocial|display|cpm|ads?)$/.test(m)) return 'Paid';
  if (/whatsapp|wa\.me/.test(s) || /whatsapp|wa\.me/.test(refHost ?? '')) return 'WhatsApp';
  if (m === 'email' || /mail/.test(s)) return 'Email';
  if (/social/.test(m) || (s && SOCIAL.test(s + '.'))) return 'Social';
  if (s || m) return 'Campaign';
  if (!refHost) return 'Direct';
  if (SEARCH.test(refHost)) return 'Organic search';
  if (SOCIAL.test(refHost)) return 'Social';
  return 'Referral';
}

/** Browser time zone → country, used only when the host sends no geo headers (e.g. local / own server). */
const TZ_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Kathmandu': 'NP', 'Asia/Katmandu': 'NP', 'Asia/Dhaka': 'BD', 'Asia/Karachi': 'PK', 'Asia/Colombo': 'LK', 'Asia/Dubai': 'AE',
  'Asia/Muscat': 'OM', 'Asia/Qatar': 'QA', 'Asia/Riyadh': 'SA', 'Asia/Kuwait': 'KW', 'Asia/Bahrain': 'BH', 'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Bangkok': 'TH',
  'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH', 'Asia/Hong_Kong': 'HK', 'Asia/Shanghai': 'CN', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Thimphu': 'BT',
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES', 'Europe/Lisbon': 'PT', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Vienna': 'AT', 'Europe/Warsaw': 'PL', 'Europe/Moscow': 'RU',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Phoenix': 'US', 'America/Los_Angeles': 'US', 'America/Anchorage': 'US', 'Pacific/Honolulu': 'US',
  'America/Detroit': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR', 'America/Port_of_Spain': 'TT', 'America/Guyana': 'GY', 'America/Paramaribo': 'SR', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Pacific/Auckland': 'NZ', 'Pacific/Fiji': 'FJ', 'Indian/Mauritius': 'MU', 'Africa/Johannesburg': 'ZA', 'Africa/Nairobi': 'KE',
  'Africa/Lagos': 'NG', 'Africa/Dar_es_Salaam': 'TZ', 'Africa/Kampala': 'UG', 'Africa/Cairo': 'EG',
};

function decodeHeader(v: string | null, max: number) {
  if (!v) return null;
  try { return decodeURIComponent(v).slice(0, max) || null; } catch { return v.slice(0, max); }
}
export function geoFrom(headers: Headers, tz?: string) {
  let country = (headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || headers.get('x-country-code') || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(country) || country === 'XX' || country === 'T1') country = '';
  const region = country ? decodeHeader(headers.get('x-vercel-ip-country-region') || headers.get('cf-region'), 80) : null;
  const city = country ? decodeHeader(headers.get('x-vercel-ip-city') || headers.get('cf-ipcity'), 80) : null;
  if (!country && tz && TZ_COUNTRY[tz]) country = TZ_COUNTRY[tz];
  return { country: country || null, region, city };
}

function cleanPath(p: string) {
  try {
    const u = new URL(p, 'https://x.invalid');
    // Query strings are dropped (UTM values are stored in their own columns; others could carry personal data). Only ?lang= is kept.
    const keep = new URLSearchParams();
    const lang = u.searchParams.get('lang'); if (lang === 'hi' || lang === 'en') keep.set('lang', lang);
    const q = keep.toString();
    // Share tokens, report ids and long numbers are collapsed so no private link or number is stored.
    const clean = decodeURIComponent(u.pathname).split('/').map((seg) => (/^[A-Za-z0-9_-]{16,}$/.test(seg) && /\d/.test(seg) ? ':id' : seg.replace(/\d{8,}/g, '…'))).join('/');
    return (clean + (q ? `?${q}` : '')).slice(0, 300);
  } catch { return p.slice(0, 300); }
}
function refHostOf(r: string | undefined, ownHost: string | null) {
  if (!r) return null;
  try { const h = new URL(r).hostname.replace(/^www\./, '').toLowerCase(); return h && h !== ownHost?.replace(/^www\./, '').toLowerCase() ? h.slice(0, 120) : null; } catch { return null; }
}

export type BeaconMeta = { headers: Headers; userId: string | null };

export async function recordBeacon(b: Beacon, meta: BeaconMeta, db: Db = getDb()): Promise<{ id?: number }> {
  await ensureAnalyticsTables(db);
  if (b.t === 'pv') {
    const ua = meta.headers.get('user-agent') ?? '';
    const { device, browser, os } = parseUa(ua);
    const { country, region, city } = geoFrom(meta.headers, b.tz);
    const ownHost = meta.headers.get('x-forwarded-host') ?? meta.headers.get('host');
    const refHost = b.en ? refHostOf(b.r, ownHost?.split(':')[0] ?? null) : null;
    const channel = b.en ? channelFor(refHost, b.us, b.um) : 'Internal';
    const [row] = (await db.execute(sql`
      insert into site_visits (visitor_id, session_id, user_id, path, title, referrer_host, source, medium, campaign, channel, country, region, city, device, browser, os, lang, tz, screen_w, is_new_visitor, is_entry)
      values (${b.v}, ${b.s}, ${meta.userId}, ${cleanPath(b.p)}, ${b.ti ?? null}, ${refHost}, ${b.en ? (b.us ?? refHost) : null}, ${b.en ? b.um ?? null : null}, ${b.en ? b.uc ?? null : null}, ${channel},
        ${country}, ${region}, ${city}, ${device}, ${browser}, ${os}, ${b.l ?? null}, ${b.tz ?? null}, ${b.w ?? null}, ${!!b.nv}, ${!!b.en})
      returning id`)).rows as { id: string | number }[];
    return { id: Number(row.id) };
  }
  if (b.t === 'end') {
    // Only the session that created the row can update it; capped at 30 minutes per page.
    await db.execute(sql`update site_visits set duration_ms = greatest(duration_ms, ${Math.min(b.ms, 1_800_000)}), scroll_pct = greatest(scroll_pct, ${b.sc ?? 0}), updated_at = now()
      where id = ${b.id} and session_id = ${b.s} and created_at > now() - interval '6 hours'`);
    return {};
  }
  const { country } = geoFrom(meta.headers);
  await db.execute(sql`insert into site_events (visitor_id, session_id, visit_id, name, path, label, value, country)
    values (${b.v}, ${b.s}, ${b.id ?? null}, ${b.n}, ${b.p ? cleanPath(b.p) : null}, ${b.lb ?? null}, ${b.val ?? null}, ${country})`);
  return {};
}

// ───────────────────────── reports
export type VisitorFilter = { from: string; to: string; country?: string | null; channel?: string | null; device?: string | null; path?: string | null };
const n = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
async function q<T>(db: Db, query: SQL) { return (await db.execute(query)).rows as T[]; }

/** IST calendar dates → UTC instants. */
function bounds(f: VisitorFilter) {
  const start = new Date(`${f.from}T00:00:00+05:30`);
  const end = new Date(new Date(`${f.to}T00:00:00+05:30`).getTime() + 86_400_000);
  return { start, end, days: Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000)) };
}
function where(start: Date, end: Date, f: VisitorFilter, alias = '') {
  const c = (col: string) => sql.raw(alias ? `${alias}.${col}` : col);
  const parts: SQL[] = [sql`${c('created_at')} >= ${start} and ${c('created_at')} < ${end}`];
  if (f.country) parts.push(f.country === '??' ? sql`${c('country')} is null` : sql`${c('country')} = ${f.country}`);
  if (f.device) parts.push(sql`${c('device')} = ${f.device}`);
  // Channel and page filters apply to whole sessions.
  if (f.channel) parts.push(sql`${c('session_id')} in (select session_id from site_visits where is_entry and channel = ${f.channel} and created_at >= ${new Date(start.getTime() - 86_400_000)} and created_at < ${end})`);
  if (f.path) parts.push(sql`${c('session_id')} in (select session_id from site_visits where path = ${f.path} and created_at >= ${start} and created_at < ${end})`);
  return sql.join(parts, sql` and `);
}

async function kpis(db: Db, start: Date, end: Date, f: VisitorFilter) {
  const W = where(start, end, f);
  const [t] = await q<Record<string, unknown>>(db, sql`
    with v as (select * from site_visits where ${W}),
    s as (select session_id, count(*) pv, sum(duration_ms) ms from v group by 1)
    select (select count(*) from v)::int pageviews,
           (select count(distinct visitor_id) from v)::int visitors,
           (select count(distinct visitor_id) from v where is_new_visitor)::int new_visitors,
           (select count(*) from s)::int sessions,
           (select coalesce(avg(ms),0) from s)::int avg_session_ms,
           (select coalesce(avg(duration_ms) filter (where duration_ms > 0),0) from v)::int avg_page_ms,
           (select count(*) from s where pv = 1 and ms < 10000)::int bounces,
           (select coalesce(sum(duration_ms),0) from v)::bigint total_ms`);
  const o = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, n(v)])) as Record<string, number>;
  return {
    pageviews: o.pageviews, visitors: o.visitors, newVisitors: o.new_visitors, returningVisitors: Math.max(0, o.visitors - o.new_visitors), sessions: o.sessions,
    avgSessionMs: o.avg_session_ms, avgPageMs: o.avg_page_ms, totalMs: o.total_ms,
    pagesPerSession: o.sessions ? Math.round((o.pageviews / o.sessions) * 100) / 100 : 0,
    bounceRate: o.sessions ? Math.round((o.bounces / o.sessions) * 1000) / 10 : 0,
  };
}
const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 1000) / 10 : null);

export async function visitorReport(f: VisitorFilter, db: Db = getDb()) {
  await ensureAnalyticsTables(db);
  const { start, end, days } = bounds(f);
  const span = end.getTime() - start.getTime();
  const pStart = new Date(start.getTime() - span);
  const W = where(start, end, f);
  const WE = where(start, end, { ...f, path: null, channel: null, device: null }); // events: date + country
  const bucket = days > 92 ? 'month' : 'day';
  const fmt = bucket === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';

  const [cur, prev, live, series, countries, cities, pages, entries, exits, channels, sources, campaigns, devices, browsers, oses, langs, heat, engagement, events, conv, hours] = await Promise.all([
    kpis(db, start, end, f),
    kpis(db, pStart, start, f),
    q<{ visitors: number; pages: number }>(db, sql`select count(distinct visitor_id)::int visitors, count(*)::int pages from site_visits where updated_at > now() - interval '5 minutes'`),
    q<{ k: string; pageviews: number; visitors: number; sessions: number }>(db, sql`
      select to_char(date_trunc(${bucket}, created_at at time zone 'Asia/Kolkata'), ${fmt}) k, count(*)::int pageviews, count(distinct visitor_id)::int visitors, count(distinct session_id)::int sessions
      from site_visits where ${W} group by 1 order by 1`),
    q<{ country: string | null; visitors: number; sessions: number; pageviews: number; new_visitors: number; ms: string }>(db, sql`
      select country, count(distinct visitor_id)::int visitors, count(distinct session_id)::int sessions, count(*)::int pageviews,
        count(distinct visitor_id) filter (where is_new_visitor)::int new_visitors, coalesce(sum(duration_ms),0)::bigint ms
      from site_visits where ${W} group by 1 order by 2 desc limit 100`),
    q<{ country: string | null; region: string | null; city: string | null; visitors: number; pageviews: number; ms: string }>(db, sql`
      select country, region, city, count(distinct visitor_id)::int visitors, count(*)::int pageviews, coalesce(sum(duration_ms),0)::bigint ms
      from site_visits where ${W} and city is not null group by 1, 2, 3 order by 4 desc limit 50`),
    q<{ path: string; title: string | null; views: number; visitors: number; avg_ms: number; scroll: number; entries: number }>(db, sql`
      select path, max(title) title, count(*)::int views, count(distinct visitor_id)::int visitors,
        coalesce(avg(duration_ms) filter (where duration_ms > 0),0)::int avg_ms, coalesce(avg(scroll_pct) filter (where scroll_pct > 0),0)::int scroll,
        count(*) filter (where is_entry)::int entries
      from site_visits where ${W} group by 1 order by 3 desc limit 100`),
    q<{ path: string; sessions: number; bounces: number }>(db, sql`
      with s as (select session_id, count(*) pv, sum(duration_ms) ms, (array_agg(path order by created_at))[1] entry from site_visits where ${W} group by 1)
      select entry path, count(*)::int sessions, count(*) filter (where pv = 1 and ms < 10000)::int bounces from s group by 1 order by 2 desc limit 25`),
    q<{ path: string; exits: number }>(db, sql`
      with s as (select session_id, (array_agg(path order by created_at desc))[1] last from site_visits where ${W} group by 1)
      select last path, count(*)::int exits from s group by 1 order by 2 desc limit 25`),
    q<{ channel: string; sessions: number; visitors: number; pageviews: number; ms: string }>(db, sql`
      with s as (select session_id, max(visitor_id) visitor_id, count(*) pv, sum(duration_ms) ms,
                 coalesce((array_agg(channel order by created_at) filter (where is_entry))[1], 'Direct') channel from site_visits where ${W} group by 1)
      select channel, count(*)::int sessions, count(distinct visitor_id)::int visitors, sum(pv)::int pageviews, coalesce(sum(ms),0)::bigint ms from s group by 1 order by 2 desc`),
    q<{ source: string; channel: string; sessions: number; visitors: number }>(db, sql`
      select coalesce(source, referrer_host, '(direct)') source, channel, count(distinct session_id)::int sessions, count(distinct visitor_id)::int visitors
      from site_visits where ${W} and is_entry group by 1, 2 order by 3 desc limit 30`),
    q<{ campaign: string; source: string | null; medium: string | null; sessions: number; visitors: number }>(db, sql`
      select campaign, max(source) source, max(medium) medium, count(distinct session_id)::int sessions, count(distinct visitor_id)::int visitors
      from site_visits where ${W} and is_entry and campaign is not null group by 1 order by 4 desc limit 30`),
    q<{ k: string; visitors: number; pageviews: number }>(db, sql`select coalesce(device,'unknown') k, count(distinct visitor_id)::int visitors, count(*)::int pageviews from site_visits where ${W} group by 1 order by 2 desc`),
    q<{ k: string; visitors: number; pageviews: number }>(db, sql`select coalesce(browser,'Other') k, count(distinct visitor_id)::int visitors, count(*)::int pageviews from site_visits where ${W} group by 1 order by 2 desc limit 10`),
    q<{ k: string; visitors: number; pageviews: number }>(db, sql`select coalesce(os,'Other') k, count(distinct visitor_id)::int visitors, count(*)::int pageviews from site_visits where ${W} group by 1 order by 2 desc limit 10`),
    q<{ k: string; visitors: number; pageviews: number }>(db, sql`select coalesce(split_part(lang,'-',1),'?') k, count(distinct visitor_id)::int visitors, count(*)::int pageviews from site_visits where ${W} group by 1 order by 2 desc limit 10`),
    q<{ dow: number; hour: number; n: number }>(db, sql`
      select extract(isodow from created_at at time zone 'Asia/Kolkata')::int dow, extract(hour from created_at at time zone 'Asia/Kolkata')::int "hour", count(*)::int n
      from site_visits where ${W} group by 1, 2`),
    q<{ bucket: string; sessions: number }>(db, sql`
      with s as (select session_id, sum(duration_ms) ms from site_visits where ${W} group by 1)
      select case when ms < 10000 then '0–10 s' when ms < 30000 then '10–30 s' when ms < 60000 then '30–60 s' when ms < 180000 then '1–3 min'
                  when ms < 600000 then '3–10 min' else '10+ min' end bucket, count(*)::int sessions
      from s group by 1`),
    q<{ name: string; n: number; visitors: number; value: string | null }>(db, sql`
      select name, count(*)::int n, count(distinct visitor_id)::int visitors, sum(value) value from site_events where ${WE} group by 1 order by 2 desc`),
    q<{ converters: number }>(db, sql`
      select count(distinct visitor_id)::int converters from site_events where ${WE} and name in ('generate_lead','begin_checkout','purchase','service_inquiry','whatsapp_click','call_click','contact_submit')`),
    q<{ hour: number; n: number }>(db, sql`select extract(hour from created_at at time zone 'Asia/Kolkata')::int "hour", count(distinct session_id)::int n from site_visits where ${W} group by 1 order by 1`),
  ]);

  const outcomes = await businessOutcomes(db, start, end);
  const calculators = await calculatorUsage(db, start, end, WE);
  const order = ['0–10 s', '10–30 s', '30–60 s', '1–3 min', '3–10 min', '10+ min'];
  return {
    range: { from: f.from, to: f.to, days, bucket },
    totals: { ...cur, live: n(live[0]?.visitors), livePages: n(live[0]?.pages), converters: n(conv[0]?.converters),
      conversionRate: cur.visitors ? Math.round((n(conv[0]?.converters) / cur.visitors) * 1000) / 10 : 0 },
    previous: { visitors: prev.visitors, pageviews: prev.pageviews, sessions: prev.sessions, avgSessionMs: prev.avgSessionMs, bounceRate: prev.bounceRate,
      visitorsChangePct: pct(cur.visitors, prev.visitors), pageviewsChangePct: pct(cur.pageviews, prev.pageviews), sessionsChangePct: pct(cur.sessions, prev.sessions),
      avgSessionChangePct: pct(cur.avgSessionMs, prev.avgSessionMs) },
    series,
    countries: countries.map((c) => ({ ...c, ms: n(c.ms), avgSessionMs: c.sessions ? Math.round(n(c.ms) / c.sessions) : 0 })),
    cities: cities.map((c) => ({ ...c, ms: n(c.ms) })),
    pages, entries, exits,
    channels: channels.map((c) => ({ ...c, ms: n(c.ms), avgSessionMs: c.sessions ? Math.round(n(c.ms) / c.sessions) : 0 })),
    sources, campaigns, devices, browsers, oses, langs, heat, hours,
    engagement: order.map((b) => ({ bucket: b, sessions: engagement.find((e) => e.bucket === b)?.sessions ?? 0 })),
    events: events.map((e) => ({ ...e, value: e.value === null ? null : n(e.value) })),
    outcomes,
    calculators,
  };
}

/** Pages that are a free calculator (also counts past days, before calculator_use events existed). */
const CALC_PAGES = sql`(path like '/calculators/%' or path = '/angel-numbers/calculator')`;

/**
 * Free calculator users, day by day (IST), filtered by date + country only.
 *  - users / uses: visitors who got a result from a free calculator (`calculator_use` event, once per tab session per calculator).
 *  - pageVisitors: visitors who opened a calculator page (/calculators/…, /angel-numbers/calculator) – available for older days too.
 * Every day in the range is listed, with 0 for quiet days.
 */
async function calculatorUsage(db: Db, start: Date, end: Date, WE: SQL) {
  const [daily, byTool, [tot]] = await Promise.all([
    q<{ day: string; users: number; uses: number; page_visitors: number }>(db, sql`
      with d as (select g::date dt from generate_series(date_trunc('day', ${start}::timestamptz at time zone 'Asia/Kolkata'),
                                        date_trunc('day', (${end}::timestamptz - interval '1 second') at time zone 'Asia/Kolkata'), interval '1 day') g),
      e as (select (created_at at time zone 'Asia/Kolkata')::date dt, count(distinct visitor_id)::int users, count(*)::int uses
            from site_events where ${WE} and name = 'calculator_use' group by 1),
      v as (select (created_at at time zone 'Asia/Kolkata')::date dt, count(distinct visitor_id)::int page_visitors
            from site_visits where ${WE} and ${CALC_PAGES} group by 1)
      select to_char(d.dt, 'YYYY-MM-DD') "day", coalesce(e.users, 0)::int users, coalesce(e.uses, 0)::int uses, coalesce(v.page_visitors, 0)::int page_visitors
      from d left join e on e.dt = d.dt left join v on v.dt = d.dt order by 1`),
    q<{ tool: string; users: number; uses: number }>(db, sql`
      select coalesce(label, 'other') tool, count(distinct visitor_id)::int users, count(*)::int uses
      from site_events where ${WE} and name = 'calculator_use' group by 1 order by 2 desc, 3 desc`),
    q<{ users: number; uses: number; page_visitors: number }>(db, sql`
      select (select count(distinct visitor_id) from site_events where ${WE} and name = 'calculator_use')::int users,
             (select count(*) from site_events where ${WE} and name = 'calculator_use')::int uses,
             (select count(distinct visitor_id) from site_visits where ${WE} and ${CALC_PAGES})::int page_visitors`),
  ]);
  return {
    totals: { users: n(tot?.users), uses: n(tot?.uses), pageVisitors: n(tot?.page_visitors) },
    daily: daily.map((r) => ({ day: r.day, users: n(r.users), uses: n(r.uses), pageVisitors: n(r.page_visitors) })),
    byTool: byTool.map((r) => ({ tool: r.tool, users: n(r.users), uses: n(r.uses) })),
  };
}

/** What the traffic produced, from the site's own tables (not filtered by country / channel). */
async function businessOutcomes(db: Db, start: Date, end: Date) {
  const one = async (query: SQL) => { try { return n((await q<{ n: unknown }>(db, query))[0]?.n); } catch { return null; } };
  const [leads, messages, serviceOrders, reports, paidOrders, revenuePaise] = await Promise.all([
    one(sql`select count(*) n from marketing_leads where created_at >= ${start} and created_at < ${end}`),
    one(sql`select count(*) n from contact_messages where created_at >= ${start} and created_at < ${end}`),
    one(sql`select count(*) n from service_orders where created_at >= ${start} and created_at < ${end}`),
    one(sql`select count(*) n from reports where created_at >= ${start} and created_at < ${end}`),
    one(sql`select count(*) n from payments where status = 'paid' and paid_at >= ${start} and paid_at < ${end}`),
    one(sql`select coalesce(sum(amount_paise),0) n from payments where status = 'paid' and currency = 'INR' and paid_at >= ${start} and paid_at < ${end}`),
  ]);
  return { leads, messages, serviceOrders, reports, paidOrders, revenuePaise };
}

/** Latest sessions for the "Visitor log" (one row per visit/session). */
export async function recentSessions(f: VisitorFilter & { limit?: number }, db: Db = getDb()) {
  await ensureAnalyticsTables(db);
  const { start, end } = bounds(f);
  const W = where(start, end, f);
  const rows = await q<Record<string, unknown>>(db, sql`
    with s as (
      select session_id, max(visitor_id) visitor_id, min(created_at) started_at, max(updated_at) last_seen, count(*)::int pages, sum(duration_ms)::bigint ms,
        (array_agg(path order by created_at))[1] entry, (array_agg(path order by created_at desc))[1] exit,
        max(country) country, max(region) region, max(city) city, max(device) device, max(browser) browser, max(os) os, max(lang) lang,
        coalesce((array_agg(channel order by created_at) filter (where is_entry))[1], 'Direct') channel,
        (array_agg(coalesce(source, referrer_host) order by created_at) filter (where is_entry))[1] source,
        bool_or(is_new_visitor) is_new, bool_or(user_id is not null) signed_in, max(scroll_pct)::int max_scroll
      from site_visits where ${W} group by 1 order by 3 desc limit ${Math.min(f.limit ?? 100, 500)})
    select s.*, (select count(*)::int from site_events e where e.session_id = s.session_id) events,
      (select count(distinct session_id)::int from site_visits x where x.visitor_id = s.visitor_id) visitor_sessions
    from s order by started_at desc`);
  return rows.map((r) => ({ ...r, ms: n(r.ms), live: new Date(String(r.last_seen)).getTime() > Date.now() - 5 * 60_000 }));
}

/** One session's page-by-page path with events, plus that visitor's other visits. */
export async function sessionJourney(sessionId: string, db: Db = getDb()) {
  await ensureAnalyticsTables(db);
  const pages = await q<Record<string, unknown>>(db, sql`
    select id, path, title, created_at, duration_ms, scroll_pct, channel, source, medium, campaign, referrer_host, country, region, city, device, browser, os, lang, tz, screen_w, is_new_visitor, visitor_id, user_id is not null signed_in
    from site_visits where session_id = ${sessionId} order by created_at limit 300`);
  const events = await q<Record<string, unknown>>(db, sql`select name, path, label, value, created_at from site_events where session_id = ${sessionId} order by created_at limit 300`);
  const visitorId = pages[0]?.visitor_id as string | undefined;
  const history = visitorId ? await q<Record<string, unknown>>(db, sql`
    select session_id, min(created_at) started_at, count(*)::int pages, sum(duration_ms)::bigint ms, (array_agg(path order by created_at))[1] entry,
      coalesce((array_agg(channel order by created_at) filter (where is_entry))[1], 'Direct') channel
    from site_visits where visitor_id = ${visitorId} group by 1 order by 2 desc limit 30`) : [];
  return { pages, events, history: history.map((h) => ({ ...h, ms: n(h.ms) })) };
}

/** Raw page views as CSV (max 50,000 rows). */
export async function visitsCsv(f: VisitorFilter, db: Db = getDb()) {
  await ensureAnalyticsTables(db);
  const { start, end } = bounds(f);
  const rows = await q<Record<string, unknown>>(db, sql`
    select to_char(created_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI:SS') time_ist, visitor_id, session_id, path, title, channel, source, medium, campaign, referrer_host,
      country, region, city, device, browser, os, lang, round(duration_ms / 1000.0, 1) seconds_on_page, scroll_pct, is_entry, is_new_visitor
    from site_visits where ${where(start, end, f)} order by created_at desc limit 50000`);
  const head = ['time_ist', 'visitor_id', 'session_id', 'path', 'title', 'channel', 'source', 'medium', 'campaign', 'referrer_host', 'country', 'region', 'city', 'device', 'browser', 'os', 'lang', 'seconds_on_page', 'scroll_pct', 'is_entry', 'is_new_visitor'];
  const esc = (v: unknown) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : s; };
  return [head.join(','), ...rows.map((r) => head.map((h) => esc(r[h])).join(','))].join('\r\n');
}

/** Deletes visit data older than `months` (retention). */
export async function purgeOlderThan(months: number, db: Db = getDb()) {
  await ensureAnalyticsTables(db);
  const m = Math.max(1, Math.min(60, Math.round(months)));
  const a = await db.execute(sql`delete from site_visits where created_at < now() - make_interval(months => ${m})`);
  const b = await db.execute(sql`delete from site_events where created_at < now() - make_interval(months => ${m})`);
  return { visits: a.rowCount ?? 0, events: b.rowCount ?? 0 };
}
