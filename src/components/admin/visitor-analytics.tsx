'use client';
/** Admin → Visitor analytics: first-party visitors, countries, pages, time spent, sources, devices, conversions and a live visitor log. */
import * as React from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calculator, Clock, Download, Eye, Globe2, Lightbulb, MapPin, MousePointerClick, RefreshCw, Route, Smartphone, TrendingDown, TrendingUp, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api } from '@/lib/client/api';
import { cn } from '@/lib/utils';

// ───────────────────────── types
type Kpi = { pageviews: number; visitors: number; newVisitors: number; returningVisitors: number; sessions: number; avgSessionMs: number; avgPageMs: number; totalMs: number; pagesPerSession: number; bounceRate: number; live: number; livePages: number; converters: number; conversionRate: number };
type Report = {
  range: { from: string; to: string; days: number; bucket: 'day' | 'month' };
  totals: Kpi;
  previous: { visitorsChangePct: number | null; pageviewsChangePct: number | null; sessionsChangePct: number | null; avgSessionChangePct: number | null; bounceRate: number };
  series: { k: string; pageviews: number; visitors: number; sessions: number }[];
  countries: { country: string | null; visitors: number; sessions: number; pageviews: number; new_visitors: number; ms: number; avgSessionMs: number }[];
  cities: { country: string | null; region: string | null; city: string | null; visitors: number; pageviews: number; ms: number }[];
  pages: { path: string; title: string | null; views: number; visitors: number; avg_ms: number; scroll: number; entries: number }[];
  entries: { path: string; sessions: number; bounces: number }[];
  exits: { path: string; exits: number }[];
  channels: { channel: string; sessions: number; visitors: number; pageviews: number; ms: number; avgSessionMs: number }[];
  sources: { source: string; channel: string; sessions: number; visitors: number }[];
  campaigns: { campaign: string; source: string | null; medium: string | null; sessions: number; visitors: number }[];
  devices: Breakdown[]; browsers: Breakdown[]; oses: Breakdown[]; langs: Breakdown[];
  heat: { dow: number; hour: number; n: number }[];
  hours: { hour: number; n: number }[];
  engagement: { bucket: string; sessions: number }[];
  events: { name: string; n: number; visitors: number; value: number | null }[];
  outcomes: { leads: number | null; messages: number | null; serviceOrders: number | null; reports: number | null; paidOrders: number | null; revenuePaise: number | null };
  calculators?: CalcUsage;
};
type CalcUsage = {
  totals: { users: number; uses: number; pageVisitors: number };
  daily: { day: string; users: number; uses: number; pageVisitors: number }[];
  byTool: { tool: string; users: number; uses: number }[];
};
type Breakdown = { k: string; visitors: number; pageviews: number };
type SessionRow = { session_id: string; visitor_id: string; started_at: string; last_seen: string; pages: number; ms: number; entry: string; exit: string; country: string | null; region: string | null; city: string | null; device: string | null; browser: string | null; os: string | null; lang: string | null; channel: string; source: string | null; is_new: boolean; signed_in: boolean; max_scroll: number; events: number; visitor_sessions: number; live: boolean };
type Journey = {
  pages: { id: string; path: string; title: string | null; created_at: string; duration_ms: number; scroll_pct: number; channel: string; source: string | null; medium: string | null; campaign: string | null; referrer_host: string | null; country: string | null; region: string | null; city: string | null; device: string | null; browser: string | null; os: string | null; lang: string | null; tz: string | null; screen_w: number | null; is_new_visitor: boolean; visitor_id: string; signed_in: boolean }[];
  events: { name: string; path: string | null; label: string | null; value: string | null; created_at: string }[];
  history: { session_id: string; started_at: string; pages: number; ms: number; entry: string; channel: string }[];
};
type Filter = { from: string; to: string; country: string; channel: string; device: string; path: string };

// ───────────────────────── helpers
const ist = (d: Date) => new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);
const daysAgo = (n: number) => ist(new Date(Date.now() - n * 86_400_000));
function presets() {
  const t = ist(new Date()); const y = Number(t.slice(0, 4)), m = Number(t.slice(5, 7));
  const pm = m === 1 ? [y - 1, 12] : [y, m - 1];
  return [
    { id: 'today', label: 'Today', from: t, to: t },
    { id: 'yesterday', label: 'Yesterday', from: daysAgo(1), to: daysAgo(1) },
    { id: '7d', label: 'Last 7 days', from: daysAgo(6), to: t },
    { id: '30d', label: 'Last 30 days', from: daysAgo(29), to: t },
    { id: '90d', label: 'Last 90 days', from: daysAgo(89), to: t },
    { id: 'month', label: 'This month', from: `${t.slice(0, 7)}-01`, to: t },
    { id: 'lastMonth', label: 'Last month', from: `${pm[0]}-${String(pm[1]).padStart(2, '0')}-01`, to: ist(new Date(Date.UTC(y, m - 1, 0, 12))) },
    { id: '12m', label: 'Last 12 months', from: daysAgo(364), to: t },
  ];
}
let regionNames: Intl.DisplayNames | null = null;
const countryName = (c: string | null) => {
  if (!c) return 'Unknown';
  try { regionNames ??= new Intl.DisplayNames(['en'], { type: 'region' }); return regionNames.of(c) ?? c; } catch { return c; }
};
const flag = (c: string | null) => (c && /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map((ch) => 0x1f1a5 + ch.charCodeAt(0))) : '🌐');
export const dur = (ms: number) => {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
};
const fmt = (n: number) => n.toLocaleString('en-IN');
const share = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : '—');
const istDT = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const istT = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const qs = (f: Filter, extra: Record<string, string> = {}) => new URLSearchParams(Object.fromEntries(Object.entries({ ...f, ...extra }).filter(([, v]) => v))).toString();
const EVENT_LABEL: Record<string, string> = {
  whatsapp_click: 'WhatsApp click', call_click: 'Phone call click', telegram_click: 'Telegram click', email_click: 'Email click', outbound_click: 'Outbound link click',
  generate_lead: 'Lead form submitted', begin_checkout: 'Checkout started', purchase: 'Purchase', service_inquiry: 'Service enquiry', reading_generated: 'Reading generated',
  calculator_use: 'Free calculator used', pdf_download: 'PDF downloaded', download_ebook_click: 'E-book downloaded', sample_view: 'Sample report viewed', popup_manual_open: 'Offer popup opened', contact_submit: 'Contact form sent',
};
const CHANNEL_TONE: Record<string, string> = { 'Organic search': 'bg-emerald-500/15 text-emerald-400', Social: 'bg-sky-500/15 text-sky-400', WhatsApp: 'bg-green-500/15 text-green-400', Direct: 'bg-muted text-foreground', Referral: 'bg-violet-500/15 text-violet-400', Paid: 'bg-amber-500/15 text-amber-400', Email: 'bg-pink-500/15 text-pink-400', Campaign: 'bg-orange-500/15 text-orange-400' };

// ───────────────────────── small UI pieces
const Card = ({ title, icon, action, children, className }: { title?: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <section className={cn('glass rounded-lg p-5', className)}>
    {title && <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h3>{action}</div>}
    {children}
  </section>
);
const Stat = ({ label, value, sub, delta, invert }: { label: string; value: string; sub?: string; delta?: number | null; invert?: boolean }) => {
  const good = delta !== null && delta !== undefined && (invert ? delta <= 0 : delta >= 0);
  return (
    <div className="glass rounded-lg p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-serif text-2xl font-bold text-gold">{value}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {delta !== null && delta !== undefined && <span className={cn('inline-flex items-center gap-0.5', good ? 'text-success' : 'text-danger')}>{delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(delta)}%</span>}
        {sub}
      </p>
    </div>
  );
};
const Meter = ({ value, max }: { value: number; max: number }) => (
  <span className="block h-2 w-full rounded bg-muted"><span className="block h-2 rounded bg-gradient-to-r from-maroon to-gold" style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%` }} /></span>
);
function Table({ head, rows, empty = 'No visits in this period yet.', onRow }: { head: string[]; rows: React.ReactNode[][]; empty?: string; onRow?: (i: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-muted-foreground">{head.map((h, i) => <th key={h} className={cn('py-2 pr-3 font-medium', i > 0 && 'text-right')}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i} onClick={onRow ? () => onRow(i) : undefined} className={cn('border-b border-border/50', onRow && 'cursor-pointer hover:bg-gold/5')}>
            {r.map((c, j) => <td key={j} className={cn('py-1.5 pr-3 align-middle', j > 0 && 'text-right tabular-nums')}>{c}</td>)}
          </tr>
        ))}</tbody>
      </table>
      {!rows.length && <p className="py-3 text-sm text-muted-foreground">{empty}</p>}
    </div>
  );
}
function BarList({ data, total }: { data: { label: React.ReactNode; value: number; display?: string }[]; total?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="text-sm">
          <div className="mb-0.5 flex items-center justify-between gap-2"><span className="truncate">{d.label}</span><span className="shrink-0 tabular-nums text-muted-foreground">{d.display ?? fmt(d.value)}{total ? ` · ${share(d.value, total)}` : ''}</span></div>
          <Meter value={d.value} max={max} />
        </div>
      ))}
      {!data.length && <p className="text-sm text-muted-foreground">No data yet.</p>}
    </div>
  );
}
const ChannelBadge = ({ c }: { c: string }) => <span className={cn('inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium', CHANNEL_TONE[c] ?? 'bg-muted')}>{c}</span>;
const PathCell = ({ path, title }: { path: string; title?: string | null }) => (
  <span className="block max-w-[340px]"><span className="block truncate font-mono text-xs">{path}</span>{title && <span className="block truncate text-[11px] text-muted-foreground">{title}</span>}</span>
);

// ───────────────────────── main
const SUBTABS = [
  { id: 'overview', label: 'Overview', icon: Eye }, { id: 'geo', label: 'Countries & cities', icon: Globe2 }, { id: 'pages', label: 'Pages & time spent', icon: Clock },
  { id: 'sources', label: 'Sources & conversions', icon: MousePointerClick }, { id: 'calculators', label: 'Free calculators', icon: Calculator }, { id: 'tech', label: 'Devices', icon: Smartphone }, { id: 'log', label: 'Visitor log', icon: Route },
] as const;

export function VisitorAnalytics() {
  const ps = React.useMemo(presets, []);
  const [f, setF] = React.useState<Filter>(() => { const p = ps.find((x) => x.id === '30d')!; return { from: p.from, to: p.to, country: '', channel: '', device: '', path: '' }; });
  const [tab, setTab] = React.useState<(typeof SUBTABS)[number]['id']>('overview');
  const [r, setR] = React.useState<Report | null>(null);
  const [sessions, setSessions] = React.useState<SessionRow[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [auto, setAuto] = React.useState(true);
  const [journey, setJourney] = React.useState<string | null>(null);
  const [updated, setUpdated] = React.useState<Date | null>(null);

  const load = React.useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const [rep, ses] = await Promise.all([api<Report>(`/api/admin/visitors?${qs(f)}`), api<{ sessions: SessionRow[] }>(`/api/admin/visitors?${qs(f, { view: 'sessions', limit: '150' })}`)]);
      setR(rep); setSessions(ses.sessions); setUpdated(new Date());
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load visitor analytics'); }
    finally { setLoading(false); }
  }, [f]);
  React.useEffect(() => { void load(); }, [load]);
  React.useEffect(() => {
    if (!auto) return;
    const h = setInterval(() => { if (document.visibilityState === 'visible') void load(true); }, 30_000);
    return () => clearInterval(h);
  }, [auto, load]);

  const set = (patch: Partial<Filter>) => setF((x) => ({ ...x, ...patch }));
  const presetId = ps.find((p) => p.from === f.from && p.to === f.to)?.id ?? 'custom';
  const t = r?.totals;
  const chips = [
    f.country && { k: 'country' as const, label: `${flag(f.country === '??' ? null : f.country)} ${f.country === '??' ? 'Unknown country' : countryName(f.country)}` },
    f.channel && { k: 'channel' as const, label: `Source: ${f.channel}` },
    f.device && { k: 'device' as const, label: `Device: ${f.device}` },
    f.path && { k: 'path' as const, label: `Visited ${f.path}` },
  ].filter(Boolean) as { k: keyof Filter; label: string }[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/30 bg-gradient-to-r from-purple-950/40 via-background to-gold/10 p-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Users className="h-6 w-6 text-gold" />
            <h2 className="font-serif text-2xl font-bold">Visitor analytics</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>
              {t ? `${t.live} online now` : '…'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Your own visitor data – countries, pages, time spent, sources and enquiries. Your admin browsing is not counted. Times in IST.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-3.5 w-3.5 accent-[hsl(var(--primary))]" />Auto-refresh 30 s</label>
          <Button variant="outline" size="sm" onClick={() => load()}><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh</Button>
          <a href={`/api/admin/visitors?${qs(f, { view: 'csv' })}`} className="inline-flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-[hsl(250_45%_10%)] hover:bg-gold/90"><Download className="h-3.5 w-3.5" /> Export CSV</a>
        </div>
      </div>

      {/* Filters */}
      <div className="glass flex flex-wrap items-end gap-2 rounded-lg p-4">
        <Field label="Period"><Select value={presetId} onChange={(e) => { const p = ps.find((x) => x.id === e.target.value); if (p) set({ from: p.from, to: p.to }); }} className="w-40">
          {ps.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}<option value="custom">Custom</option></Select></Field>
        <Field label="From"><Input type="date" value={f.from} onChange={(e) => set({ from: e.target.value })} className="w-40" /></Field>
        <Field label="To"><Input type="date" value={f.to} onChange={(e) => set({ to: e.target.value })} className="w-40" /></Field>
        <Field label="Country"><Select value={f.country} onChange={(e) => set({ country: e.target.value })} className="w-44">
          <option value="">All countries</option>
          {f.country && !r?.countries.some((c) => (c.country ?? '??') === f.country) && <option value={f.country}>{countryName(f.country)}</option>}
          {r?.countries.map((c) => <option key={c.country ?? '??'} value={c.country ?? '??'}>{flag(c.country)} {countryName(c.country)}</option>)}
        </Select></Field>
        <Field label="Source"><Select value={f.channel} onChange={(e) => set({ channel: e.target.value })} className="w-40">
          <option value="">All sources</option>{['Organic search', 'Direct', 'Social', 'WhatsApp', 'Referral', 'Paid', 'Email', 'Campaign'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Device"><Select value={f.device} onChange={(e) => set({ device: e.target.value })} className="w-32">
          <option value="">All devices</option><option value="mobile">Mobile</option><option value="desktop">Desktop</option><option value="tablet">Tablet</option></Select></Field>
        {chips.length > 0 && <div className="flex flex-wrap gap-1.5 pb-1">{chips.map((c) => <button key={c.k} onClick={() => set({ [c.k]: '' })} className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs">{c.label}<X className="h-3 w-3" /></button>)}</div>}
        {updated && <span className="ml-auto pb-2 text-[11px] text-muted-foreground">Updated {updated.toLocaleTimeString('en-IN')}</span>}
      </div>

      {error && <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger" role="alert">{error}</p>}
      {!r ? <div className="glass h-64 animate-pulse rounded-lg" aria-busy="true" /> : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Visitors" value={fmt(t!.visitors)} delta={r.previous.visitorsChangePct} sub="vs previous period" />
            <Stat label="New / returning" value={`${fmt(t!.newVisitors)} / ${fmt(t!.returningVisitors)}`} sub={`${share(t!.newVisitors, t!.visitors)} new`} />
            <Stat label="Visits (sessions)" value={fmt(t!.sessions)} delta={r.previous.sessionsChangePct} />
            <Stat label="Page views" value={fmt(t!.pageviews)} delta={r.previous.pageviewsChangePct} sub={`${t!.pagesPerSession} pages / visit`} />
            <Stat label="Avg time per visit" value={dur(t!.avgSessionMs)} delta={r.previous.avgSessionChangePct} />
            <Stat label="Avg time on a page" value={dur(t!.avgPageMs)} sub={`${dur(t!.totalMs)} total time on site`} />
            <Stat label="Bounce rate" value={`${t!.bounceRate}%`} invert delta={r.previous.bounceRate ? Math.round((t!.bounceRate - r.previous.bounceRate) * 10) / 10 : null} sub="1 page & under 10 s" />
            <Stat label="Visitor → enquiry" value={`${t!.conversionRate}%`} sub={`${fmt(t!.converters)} visitors clicked WhatsApp / call / form / checkout`} />
          </div>

          {tab === 'overview' && <Outcomes o={r.outcomes} visitors={t!.visitors} calcUsers={r.calculators?.totals.users ?? null} />}

          <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1">
            {SUBTABS.map((x) => (
              <button key={x.id} onClick={() => setTab(x.id)} className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm', tab === x.id ? 'bg-card font-semibold shadow' : 'text-muted-foreground hover:text-foreground')}>
                <x.icon className="h-4 w-4 text-gold" />{x.label}{x.id === 'log' && sessions?.some((s) => s.live) && <span className="h-2 w-2 rounded-full bg-success" />}
              </button>
            ))}
          </div>

          {tab === 'overview' && <Overview r={r} onCountry={(c) => set({ country: c ?? '??' })} onPath={(p) => set({ path: p })} />}
          {tab === 'geo' && <Geo r={r} onCountry={(c) => set({ country: c ?? '??' })} />}
          {tab === 'pages' && <Pages r={r} onPath={(p) => { set({ path: p }); setTab('log'); }} />}
          {tab === 'sources' && <Sources r={r} onChannel={(c) => set({ channel: c })} />}
          {tab === 'calculators' && <FreeCalculators c={r.calculators} />}
          {tab === 'tech' && <Tech r={r} onDevice={(d) => set({ device: d })} />}
          {tab === 'log' && <VisitorLog rows={sessions ?? []} onOpen={setJourney} />}
          <Retention onDone={() => load()} />
        </>
      )}
      {journey && <JourneyDrawer sessionId={journey} onClose={() => setJourney(null)} onOpen={setJourney} />}
    </div>
  );
}

// ───────────────────────── sections
const CALC_NAME: Record<string, string> = {
  moolank: 'Moolank calculator', bhagyank: 'Bhagyank calculator', loshu: 'Lo Shu grid', name: 'Name numerology', mobile: 'Mobile number', kua: 'Kua number',
  'personal-year': 'Personal Year', vehicle: 'Vehicle number', house: 'House number', 'quick-reading': 'Home page quick reading', angel: 'Angel number calculator',
  'destiny-matrix': 'Destiny Matrix (free)', pythagoras: 'Pythagoras square (free)', signature: 'Signature check (free)', business: 'Business compatibility (free)',
};
const dayLabel = (d: string) => new Date(`${d}T00:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

/** Free calculator users, day by day (IST). */
export function FreeCalculators({ c }: { c?: CalcUsage }) {
  if (!c) return <Card title="Free calculator users"><p className="text-sm text-muted-foreground">Not available – refresh after the update is deployed.</p></Card>;
  const rows = [...c.daily].reverse(); // newest day first
  const best = c.daily.reduce((m, d) => (d.users > m.users ? d : m), { day: '', users: 0, uses: 0, pageVisitors: 0 });
  const activeDays = c.daily.filter((d) => d.users > 0).length;
  const csv = () => {
    const lines = ['Date (IST),Calculator users,Calculations,Calculator page visitors', ...c.daily.map((d) => `${d.day},${d.users},${d.uses},${d.pageVisitors}`)];
    const href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href, download: `free-calculator-users-${c.daily[0]?.day ?? ''}-to-${c.daily.at(-1)?.day ?? ''}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(href), 2000);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Calculator users" value={fmt(c.totals.users)} sub="unique visitors who got a result" />
        <Stat label="Calculations" value={fmt(c.totals.uses)} sub="once per visit per calculator" />
        <Stat label="Avg users per day" value={fmt(Math.round((c.totals.users / Math.max(1, c.daily.length)) * 10) / 10)} sub={`${activeDays} of ${c.daily.length} days with use`} />
        <Stat label="Best day" value={best.users ? fmt(best.users) : '—'} sub={best.users ? dayLabel(best.day) : 'no use yet'} />
      </div>
      <Card title="Free calculator users – day wise" icon={<Calculator className="h-5 w-5 text-gold" />}
        action={<Button size="sm" variant="outline" onClick={csv} disabled={!c.daily.length}><Download className="h-4 w-4" /> CSV</Button>}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={c.daily} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="day" tickFormatter={(v: string) => v.slice(5)} fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip labelFormatter={(v) => dayLabel(String(v))} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="users" name="Calculator users" fill="hsl(42 80% 55%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pageVisitors" name="Calculator page visitors" fill="hsl(270 60% 65%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          <b>Calculator users</b> = visitors who entered their details and saw a result in any free calculator (counted from this update onward).
          <b> Calculator page visitors</b> = visitors who opened a /calculators/… page or the angel number calculator (available for older days too).
        </p>
        <div className="mt-4 max-h-[420px] overflow-y-auto">
          <Table head={['Date (IST)', 'Calculator users', 'Calculations', 'Calculator page visitors']} empty="No days in this period."
            rows={rows.map((d) => [dayLabel(d.day), <b key="u" className={d.users ? 'text-gold' : 'text-muted-foreground'}>{fmt(d.users)}</b>, fmt(d.uses), fmt(d.pageVisitors)])} />
        </div>
      </Card>
      <Card title="Which free calculator is used most">
        {c.byTool.length
          ? <BarList total={c.totals.users} data={c.byTool.map((x) => ({ label: CALC_NAME[x.tool] ?? x.tool, value: x.users, display: `${fmt(x.users)} users · ${fmt(x.uses)} calculations` }))} />
          : <p className="text-sm text-muted-foreground">No free calculator use recorded in this period yet.</p>}
      </Card>
    </div>
  );
}

function Outcomes({ o, visitors, calcUsers }: { o: Report['outcomes']; visitors: number; calcUsers: number | null }) {
  const items = [
    ['Free calculator users', calcUsers], ['Leads captured', o.leads], ['Contact messages', o.messages], ['Service orders', o.serviceOrders], ['Reports generated', o.reports], ['Paid orders', o.paidOrders],
  ] as const;
  return (
    <Card title="What the traffic produced" icon={<MousePointerClick className="h-5 w-5 text-gold" />}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {items.map(([k, v]) => <div key={k} className="rounded-lg border border-border/60 p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</p><p className="text-xl font-bold">{v === null ? '—' : fmt(v)}</p>{v !== null && visitors > 0 && <p className="text-[11px] text-muted-foreground">{share(v, visitors)} of visitors</p>}</div>)}
        <div className="rounded-lg border border-gold/40 bg-gold/5 p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Revenue (₹)</p><p className="text-xl font-bold text-gold">{o.revenuePaise === null ? '—' : `₹${fmt(Math.round(o.revenuePaise / 100))}`}</p>{o.revenuePaise !== null && visitors > 0 && <p className="text-[11px] text-muted-foreground">₹{(o.revenuePaise / 100 / visitors).toFixed(1)} per visitor</p>}</div>
      </div>
    </Card>
  );
}

function Insights({ r }: { r: Report }) {
  const t = r.totals; const out: string[] = [];
  if (!t.visitors) return null;
  const top = r.countries[0];
  if (top) out.push(`${flag(top.country)} ${countryName(top.country)} brings ${share(top.visitors, t.visitors)} of your visitors.`);
  const intl = r.countries.filter((c) => c.country && c.country !== 'IN').reduce((a, c) => a + c.visitors, 0);
  if (intl) out.push(`${share(intl, t.visitors)} of visitors are from outside India – make sure $ pricing and the NRI pages are prominent.`);
  const mobile = r.devices.find((d) => d.k === 'mobile');
  if (mobile) out.push(`${share(mobile.visitors, t.visitors)} browse on mobile${mobile.visitors / t.visitors > 0.6 ? ' – keep the WhatsApp button and calculators thumb-friendly' : ''}.`);
  const engaging = r.pages.filter((p) => p.views >= 5).sort((a, b) => b.avg_ms - a.avg_ms)[0];
  if (engaging) out.push(`Most engaging page: ${engaging.path} (${dur(engaging.avg_ms)} average read).`);
  const leaky = r.entries.filter((e) => e.sessions >= 5).map((e) => ({ ...e, rate: e.bounces / e.sessions })).sort((a, b) => b.rate - a.rate)[0];
  if (leaky && leaky.rate > 0.5) out.push(`${Math.round(leaky.rate * 100)}% of visits that land on ${leaky.path} leave within 10 seconds – improve its first screen or add a clear call to action.`);
  const peak = [...r.hours].sort((a, b) => b.n - a.n)[0];
  if (peak) out.push(`Busiest hour: ${String(peak.hour).padStart(2, '0')}:00–${String((peak.hour + 1) % 24).padStart(2, '0')}:00 IST – a good time for YouTube Lives and WhatsApp replies.`);
  const best = r.channels.filter((c) => c.sessions >= 5).sort((a, b) => b.avgSessionMs - a.avgSessionMs)[0];
  if (best) out.push(`${best.channel} visitors stay longest (${dur(best.avgSessionMs)} per visit).`);
  return (
    <Card title="Insights" icon={<Lightbulb className="h-5 w-5 text-gold" />}>
      <ul className="space-y-1.5 text-sm">{out.map((x, i) => <li key={i} className="flex gap-2"><span className="text-gold">✦</span><span>{x}</span></li>)}</ul>
    </Card>
  );
}

function Trend({ r }: { r: Report }) {
  return (
    <Card title="Visitors & page views">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={r.series} margin={{ left: -16, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(42 80% 55%)" stopOpacity={0.5} /><stop offset="100%" stopColor="hsl(42 80% 55%)" stopOpacity={0} /></linearGradient>
              <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(270 60% 65%)" stopOpacity={0.35} /><stop offset="100%" stopColor="hsl(270 60% 65%)" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="k" tickFormatter={(v: string) => (r.range.bucket === 'day' ? v.slice(5) : v)} fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <YAxis allowDecimals={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="pageviews" name="Page views" stroke="hsl(270 60% 65%)" fill="url(#gp)" strokeWidth={2} />
            <Area type="monotone" dataKey="visitors" name="Visitors" stroke="hsl(42 80% 55%)" fill="url(#gv)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {!r.series.length && <p className="text-sm text-muted-foreground">No visits recorded in this period yet – data starts flowing as soon as the update is live.</p>}
    </Card>
  );
}

function Heatmap({ r }: { r: Report }) {
  const max = Math.max(1, ...r.heat.map((h) => h.n));
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <Card title="When visitors come (IST)">
      <div className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-[36px_repeat(24,1fr)] gap-0.5 text-[10px]">
          <span />{Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center text-muted-foreground">{h % 3 === 0 ? h : ''}</span>)}
          {days.map((d, di) => (
            <React.Fragment key={d}>
              <span className="pr-1 text-right text-muted-foreground">{d}</span>
              {Array.from({ length: 24 }, (_, h) => { const v = r.heat.find((x) => x.dow === di + 1 && x.hour === h)?.n ?? 0; return <span key={h} title={`${d} ${h}:00 – ${v} page views`} className="h-4 rounded-sm" style={{ background: v ? `hsl(42 80% 55% / ${0.12 + (v / max) * 0.88})` : 'hsl(var(--muted))' }} />; })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Overview({ r, onCountry, onPath }: { r: Report; onCountry: (c: string | null) => void; onPath: (p: string) => void }) {
  return (
    <div className="space-y-6">
      <Trend r={r} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Insights r={r} />
        <Card title="Top countries" icon={<Globe2 className="h-5 w-5 text-gold" />}>
          <BarList total={r.totals.visitors} data={r.countries.slice(0, 8).map((c) => ({ label: <button className="hover:text-gold" onClick={() => onCountry(c.country)}>{flag(c.country)} {countryName(c.country)}</button>, value: c.visitors }))} />
        </Card>
        <Card title="Top pages" icon={<Eye className="h-5 w-5 text-gold" />}>
          <BarList data={r.pages.slice(0, 8).map((p) => ({ label: <button className="font-mono text-xs hover:text-gold" onClick={() => onPath(p.path)}>{p.path}</button>, value: p.views, display: `${fmt(p.views)} · ${dur(p.avg_ms)}` }))} />
        </Card>
        <Card title="Where visitors come from" icon={<MousePointerClick className="h-5 w-5 text-gold" />}>
          <BarList total={r.totals.sessions} data={r.channels.map((c) => ({ label: <ChannelBadge c={c.channel} />, value: c.sessions }))} />
        </Card>
        <Card title="Time spent per visit" icon={<Clock className="h-5 w-5 text-gold" />}>
          <BarList total={r.totals.sessions} data={r.engagement.map((e) => ({ label: e.bucket, value: e.sessions }))} />
        </Card>
        <Heatmap r={r} />
      </div>
    </div>
  );
}

function Geo({ r, onCountry }: { r: Report; onCountry: (c: string | null) => void }) {
  const maxV = Math.max(1, ...r.countries.map((c) => c.visitors));
  return (
    <div className="space-y-6">
      <Card title="Country-wise visitors" icon={<Globe2 className="h-5 w-5 text-gold" />} action={<span className="text-xs text-muted-foreground">Click a country to filter the whole dashboard</span>}>
        <Table head={['Country', 'Visitors', 'New', 'Visits', 'Page views', 'Avg time / visit', 'Share', '']} onRow={(i) => onCountry(r.countries[i].country)}
          rows={r.countries.map((c) => [<span key="c" className="whitespace-nowrap">{flag(c.country)} {countryName(c.country)}</span>, fmt(c.visitors), fmt(c.new_visitors), fmt(c.sessions), fmt(c.pageviews), dur(c.avgSessionMs), share(c.visitors, r.totals.visitors), <span key="m" className="block w-24"><Meter value={c.visitors} max={maxV} /></span>])} />
      </Card>
      <Card title="Cities & states" icon={<MapPin className="h-5 w-5 text-gold" />}>
        <Table head={['City', 'State / region', 'Country', 'Visitors', 'Page views', 'Time on site']} empty="City data appears once the site runs on Vercel (or Cloudflare), which supplies visitor location."
          rows={r.cities.map((c) => [c.city ?? '—', c.region ?? '—', `${flag(c.country)} ${c.country ?? ''}`, fmt(c.visitors), fmt(c.pageviews), dur(c.ms)])} />
      </Card>
    </div>
  );
}

function Pages({ r, onPath }: { r: Report; onPath: (p: string) => void }) {
  return (
    <div className="space-y-6">
      <Card title="Page-wise report" icon={<Clock className="h-5 w-5 text-gold" />} action={<span className="text-xs text-muted-foreground">Click a page to see the visitors who opened it</span>}>
        <Table head={['Page', 'Views', 'Visitors', 'Avg time on page', 'Read depth', 'Landings']} onRow={(i) => onPath(r.pages[i].path)}
          rows={r.pages.map((p) => [<PathCell key="p" path={p.path} title={p.title} />, fmt(p.views), fmt(p.visitors), dur(p.avg_ms), p.scroll ? `${p.scroll}%` : '—', fmt(p.entries)])} />
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Landing pages (first page seen)">
          <Table head={['Page', 'Visits', 'Bounce']} rows={r.entries.map((e) => [<PathCell key="p" path={e.path} />, fmt(e.sessions), share(e.bounces, e.sessions)])} />
        </Card>
        <Card title="Exit pages (last page seen)">
          <Table head={['Page', 'Exits']} rows={r.exits.map((e) => [<PathCell key="p" path={e.path} />, fmt(e.exits)])} />
        </Card>
      </div>
    </div>
  );
}

function Sources({ r, onChannel }: { r: Report; onChannel: (c: string) => void }) {
  return (
    <div className="space-y-6">
      <Card title="Traffic channels" action={<span className="text-xs text-muted-foreground">Click to filter</span>}>
        <Table head={['Channel', 'Visits', 'Visitors', 'Page views', 'Avg time / visit', 'Share']} onRow={(i) => onChannel(r.channels[i].channel)}
          rows={r.channels.map((c) => [<ChannelBadge key="c" c={c.channel} />, fmt(c.sessions), fmt(c.visitors), fmt(c.pageviews), dur(c.avgSessionMs), share(c.sessions, r.totals.sessions)])} />
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Top sources / referrers">
          <Table head={['Source', 'Channel', 'Visits', 'Visitors']} rows={r.sources.map((s) => [<span key="s" className="font-mono text-xs">{s.source}</span>, <ChannelBadge key="c" c={s.channel} />, fmt(s.sessions), fmt(s.visitors)])} />
        </Card>
        <Card title="Campaigns (UTM links)">
          <Table head={['Campaign', 'Source / medium', 'Visits', 'Visitors']} empty="Add ?utm_source=youtube&utm_medium=live&utm_campaign=… to links you share to see them here."
            rows={r.campaigns.map((c) => [c.campaign, `${c.source ?? '—'} / ${c.medium ?? '—'}`, fmt(c.sessions), fmt(c.visitors)])} />
        </Card>
      </div>
      <Card title="Enquiries & interactions" icon={<MousePointerClick className="h-5 w-5 text-gold" />}>
        <Table head={['Action', 'Times', 'Visitors', '% of visitors', 'Value']} empty="No clicks or form submissions recorded in this period yet."
          rows={r.events.map((e) => [EVENT_LABEL[e.name] ?? e.name, fmt(e.n), fmt(e.visitors), share(e.visitors, r.totals.visitors), e.value ? `₹${fmt(Math.round(e.value))}` : '—'])} />
      </Card>
    </div>
  );
}

function Tech({ r, onDevice }: { r: Report; onDevice: (d: string) => void }) {
  const LANG: Record<string, string> = { en: 'English', hi: 'Hindi', mr: 'Marathi', gu: 'Gujarati', bn: 'Bengali', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', ur: 'Urdu', ne: 'Nepali' };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Device type"><BarList total={r.totals.visitors} data={r.devices.map((d) => ({ label: <button className="capitalize hover:text-gold" onClick={() => onDevice(d.k)}>{d.k}</button>, value: d.visitors }))} /></Card>
      <Card title="Browser"><BarList total={r.totals.visitors} data={r.browsers.map((d) => ({ label: d.k, value: d.visitors }))} /></Card>
      <Card title="Operating system"><BarList total={r.totals.visitors} data={r.oses.map((d) => ({ label: d.k, value: d.visitors }))} /></Card>
      <Card title="Browser language"><BarList total={r.totals.visitors} data={r.langs.map((d) => ({ label: LANG[d.k] ?? d.k, value: d.visitors }))} /></Card>
    </div>
  );
}

function VisitorLog({ rows, onOpen }: { rows: SessionRow[]; onOpen: (id: string) => void }) {
  return (
    <Card title="Visitor log – latest visits" icon={<Route className="h-5 w-5 text-gold" />} action={<span className="text-xs text-muted-foreground">Click a visit to see its page-by-page journey</span>}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 pr-3">When (IST)</th><th className="pr-3">Location</th><th className="pr-3">Came from</th><th className="pr-3">Landing → exit page</th><th className="pr-3 text-right">Pages</th><th className="pr-3 text-right">Time</th><th className="pr-3">Device</th><th className="pr-3">Visitor</th></tr></thead>
          <tbody>{rows.map((s) => (
            <tr key={s.session_id} onClick={() => onOpen(s.session_id)} className="cursor-pointer border-b border-border/50 hover:bg-gold/5">
              <td className="whitespace-nowrap py-1.5 pr-3">{s.live && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-success" title="Online now" />}{istDT(s.started_at)}</td>
              <td className="pr-3"><span className="whitespace-nowrap">{flag(s.country)} {s.city ? `${s.city}, ` : ''}{s.country ? (s.region && s.city ? s.region : countryName(s.country)) : 'Unknown'}</span></td>
              <td className="pr-3"><ChannelBadge c={s.channel} />{s.source && <span className="ml-1 text-[11px] text-muted-foreground">{s.source}</span>}</td>
              <td className="max-w-[260px] pr-3"><span className="block truncate font-mono text-xs">{s.entry}</span>{s.exit !== s.entry && <span className="block truncate font-mono text-[11px] text-muted-foreground">→ {s.exit}</span>}</td>
              <td className="pr-3 text-right tabular-nums">{s.pages}</td>
              <td className="pr-3 text-right tabular-nums">{dur(s.ms)}</td>
              <td className="whitespace-nowrap pr-3 text-xs capitalize">{s.device} · {s.browser}</td>
              <td className="whitespace-nowrap pr-3 text-xs">{s.is_new ? <Badge tone="good">New</Badge> : <Badge tone="gold">Returning ×{s.visitor_sessions}</Badge>}{s.signed_in && <Badge className="ml-1">Signed in</Badge>}{s.events > 0 && <Badge tone="warn" className="ml-1">{s.events} action{s.events > 1 ? 's' : ''}</Badge>}</td>
            </tr>
          ))}</tbody>
        </table>
        {!rows.length && <p className="py-3 text-sm text-muted-foreground">No visits in this period yet.</p>}
      </div>
    </Card>
  );
}

function JourneyDrawer({ sessionId, onClose, onOpen }: { sessionId: string; onClose: () => void; onOpen: (id: string) => void }) {
  const [j, setJ] = React.useState<Journey | null>(null);
  React.useEffect(() => { setJ(null); api<Journey>(`/api/admin/visitors?view=journey&session=${sessionId}`).then(setJ).catch(() => setJ({ pages: [], events: [], history: [] })); }, [sessionId]);
  React.useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const first = j?.pages[0];
  const timeline = j ? [...j.pages.map((p) => ({ kind: 'page' as const, at: p.created_at, p })), ...j.events.map((e) => ({ kind: 'event' as const, at: e.created_at, e }))].sort((a, b) => a.at.localeCompare(b.at)) : [];
  const total = j?.pages.reduce((a, p) => a + p.duration_ms, 0) ?? 0;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-label="Visit details">
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-gold/30 bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-xl font-bold">Visit details</h3><Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></div>
        {!j ? <div className="h-40 animate-pulse rounded-lg bg-muted" /> : !first ? <p className="text-sm text-muted-foreground">This visit has no recorded pages.</p> : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {([
                ['Location', `${flag(first.country)} ${[first.city, first.region, countryName(first.country)].filter(Boolean).join(', ')}`],
                ['Came from', `${first.channel}${first.source ? ` · ${first.source}` : ''}${first.campaign ? ` · ${first.campaign}` : ''}`],
                ['Device', `${first.device ?? '—'} · ${first.os ?? ''} · ${first.browser ?? ''}${first.screen_w ? ` · ${first.screen_w}px` : ''}`],
                ['Language / time zone', `${first.lang ?? '—'} · ${first.tz ?? '—'}`],
                ['Pages · time', `${j.pages.length} pages · ${dur(total)}`],
                ['Visitor', `${first.is_new_visitor ? 'New' : 'Returning'} · ${j.history.length} visit${j.history.length === 1 ? '' : 's'}${first.signed_in ? ' · signed in' : ''}`],
              ] as const).map(([k, v]) => <div key={k} className="rounded-md border border-border/60 p-2"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</p><p className="break-words">{v}</p></div>)}
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Journey</h4>
              <ol className="relative space-y-3 border-l border-gold/30 pl-4">
                {timeline.map((x, i) => x.kind === 'page' ? (
                  <li key={i}><span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
                    <p className="text-xs text-muted-foreground">{istT(x.at)}</p>
                    <p className="font-mono text-xs">{x.p.path}</p>
                    {x.p.title && <p className="text-xs text-muted-foreground">{x.p.title}</p>}
                    <p className="text-xs">⏱ {dur(x.p.duration_ms)}{x.p.scroll_pct ? ` · read ${x.p.scroll_pct}%` : ''}</p>
                  </li>
                ) : (
                  <li key={i}><span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-success" />
                    <p className="text-xs text-muted-foreground">{istT(x.at)}</p>
                    <p className="text-sm font-semibold text-success">{EVENT_LABEL[x.e.name] ?? x.e.name}{x.e.label ? ` – ${x.e.label}` : ''}</p>
                  </li>
                ))}
              </ol>
            </div>
            {j.history.length > 1 && (
              <div>
                <h4 className="mb-2 font-semibold">This visitor&apos;s visits</h4>
                <div className="space-y-1">{j.history.map((h) => (
                  <button key={h.session_id} onClick={() => onOpen(h.session_id)} className={cn('flex w-full items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-left text-xs', h.session_id === sessionId ? 'border-gold bg-gold/10' : 'border-border/60 hover:border-gold/50')}>
                    <span>{istDT(h.started_at)} · <span className="font-mono">{h.entry}</span></span><span className="shrink-0 text-muted-foreground">{h.pages} pages · {dur(h.ms)} · {h.channel}</span>
                  </button>
                ))}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Retention({ onDone }: { onDone: () => void }) {
  const [months, setMonths] = React.useState('13');
  const [msg, setMsg] = React.useState<string | null>(null);
  const purge = async () => {
    if (!window.confirm(`Delete visitor data older than ${months} months? This cannot be undone.`)) return;
    try { const r = await api<{ visits: number; events: number }>('/api/admin/visitors', { method: 'POST', json: { purgeMonths: Number(months) } }); setMsg(`Deleted ${fmt(r.visits)} page views and ${fmt(r.events)} events.`); onDone(); }
    catch { setMsg('Could not delete old data.'); }
  };
  return (
    <details className="glass rounded-lg p-4 text-sm">
      <summary className="cursor-pointer font-medium">Privacy & data retention</summary>
      <div className="mt-3 space-y-3 text-muted-foreground">
        <p>No IP addresses, names, phone numbers or emails are stored. Each browser gets a random visitor id; location (country, state, city) comes from your hosting provider. Visitors with &quot;Do Not Track&quot; switched on and your own admin browsing are skipped. Google Analytics keeps running alongside this.</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Delete data older than"><Select value={months} onChange={(e) => setMonths(e.target.value)} className="w-36">{['3', '6', '13', '24'].map((m) => <option key={m} value={m}>{m} months</option>)}</Select></Field>
          <Button variant="outline" size="sm" onClick={purge}>Delete old data</Button>
          {msg && <span className="pb-2 text-xs">{msg}</span>}
        </div>
      </div>
    </details>
  );
}
