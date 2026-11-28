'use client';
/**
 * Admin → Website Health: live errors (server, API, visitors' browsers, report delivery, SMS / email, payments),
 * problems that need attention now, the website's running requirements (database, settings, PDF engine, email, SMS,
 * AI, automation) with one-click tests, and a 14-day error report. Refreshes itself every 30 seconds while open.
 */
import * as React from 'react';
import { Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Download, FileText, Mail, MessageSquare, Play, RefreshCw, Server, ShieldAlert, Sparkles, Trash2, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError, download } from '@/lib/client/api';
import { cn } from '@/lib/utils';

type Status = 'ok' | 'warn' | 'fail' | 'info';
interface Check { id: string; group: string; label: string; status: Status; detail: string; fix?: string }
interface Problem { id: string; label: string; status: Status; count: number; detail: string; items?: { id: string; text: string; at?: string }[]; tab?: string }
interface Summary { openKinds: number; openErrors: number; kinds24h: number; today: number; daily: { day: string; error: number; warning: number }[]; bySource: { source: string; today: number; week: number }[];
  top: { id: string; message: string; source: string; level: string; route: string | null; count: number; lastSeen: string }[] }
interface AiHealth { configured: boolean; provider: string; model: string; status: Status; stateLabel: string; detail: string; lastTestAt?: string; latencyMs?: number; error?: string }
interface Health { summary: Summary | null; problems: Problem[]; requirements: Check[]; ai?: AiHealth | null; status: { requirements: Status; problems: Status; errors: Status };
  runtime: { node: string; platform: string; environment: string; host: string; commit: string | null; commitMessage: string | null; uptimeMin: number; memoryMb: number; heapMb: number; serverTime: string } }
interface SiteError { id: string; source: string; level: string; message: string; stack: string | null; route: string | null; method: string | null; status: number | null; count: number; meta: Record<string, unknown> | null; firstSeen: string; lastSeen: string; resolvedAt: string | null }

const SOURCE_LABEL: Record<string, string> = { server: 'Server (pages)', api: 'API', client: "Visitor's browser", delivery: 'Report delivery', notify: 'SMS / email', payment: 'Payments', pdf: 'PDF engine', cron: 'Scheduler' };
const ICON: Record<Status, typeof CheckCircle2> = { ok: CheckCircle2, warn: AlertTriangle, fail: XCircle, info: Activity };
const TONE: Record<Status, string> = { ok: 'text-success', warn: 'text-warning', fail: 'text-danger', info: 'text-muted-foreground' };
const ago = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function SiteHealth({ onOpen }: { onOpen?: (tab: string) => void }) {
  const [view, setView] = React.useState<'errors' | 'problems' | 'requirements' | 'reports'>('errors');
  const [h, setH] = React.useState<Health | null>(null);
  const [live, setLive] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [updated, setUpdated] = React.useState<Date | null>(null);
  const load = React.useCallback(async () => {
    setLoading(true);
    try { setH(await api<Health>('/api/admin/health')); setUpdated(new Date()); } catch { /* keep the last data */ } finally { setLoading(false); }
  }, []);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { if (!live) return; const t = setInterval(load, 30_000); return () => clearInterval(t); }, [live, load]);

  const reqBad = h?.requirements.filter((r) => r.status === 'fail').length ?? 0;
  const reqWarn = h?.requirements.filter((r) => r.status === 'warn').length ?? 0;
  const probBad = h?.problems.filter((p) => p.status === 'fail' || p.status === 'warn').length ?? 0;
  const overallStatus: Status = !h ? 'info' : reqBad || h.problems.some((p) => p.status === 'fail') ? 'fail' : reqWarn || probBad || (h.summary?.openErrors ?? 0) ? 'warn' : 'ok';
  const OI = ICON[overallStatus];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><ShieldAlert className="h-6 w-6 text-gold" />Website health</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="accent-[hsl(var(--primary))]" />
            Live {live && <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>}</label>
          {updated && <span>updated {updated.toLocaleTimeString('en-IN')}</span>}
          <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi icon={<OI className={cn('h-5 w-5', TONE[overallStatus])} />} label="Overall" value={!h ? '…' : overallStatus === 'ok' ? 'All good' : overallStatus === 'fail' ? 'Needs action' : 'Check warnings'} sub={h ? `${reqBad} failing · ${reqWarn} warnings · ${probBad} problems` : ''} onClick={() => setView(reqBad ? 'requirements' : 'problems')} />
        <Kpi icon={<Sparkles className={cn('h-5 w-5', h?.ai ? TONE[h.ai.status] : 'text-gold')} />} label="AI engine" value={h?.ai?.stateLabel ?? '…'} sub={h?.ai ? `${h.ai.detail}${h.ai.lastTestAt ? ` · ${ago(h.ai.lastTestAt)}` : ''}` : ''} onClick={() => setView('requirements')} />
        <Kpi icon={<XCircle className="h-5 w-5 text-danger" />} label="Open errors" value={String(h?.summary?.openErrors ?? '–')} sub={`${h?.summary?.openKinds ?? 0} open issues incl. warnings`} onClick={() => setView('errors')} />
        <Kpi icon={<Activity className="h-5 w-5 text-gold" />} label="Errors today" value={String(h?.summary?.today ?? '–')} sub={`${h?.summary?.kinds24h ?? 0} different issues in 24 h`} onClick={() => setView('reports')} />
        <Kpi icon={<Server className="h-5 w-5 text-gold" />} label="Server" value={h?.runtime.host ?? '…'} sub={h ? `${h.runtime.environment} · Node ${h.runtime.node}${h.runtime.commit ? ` · ${h.runtime.commit}` : ''}` : ''} onClick={() => setView('requirements')} />
      </div>

      <div className="flex flex-wrap gap-1 rounded-md border border-border p-1 text-sm">
        {([['errors', 'Live errors', h?.summary?.openKinds], ['problems', 'Problems', probBad], ['requirements', 'Running requirements', reqBad + reqWarn], ['reports', 'Reports', 0]] as const).map(([v, l, n]) => (
          <button key={v} type="button" onClick={() => setView(v)} className={cn('flex items-center gap-1.5 rounded px-3 py-1.5', view === v ? 'bg-gold/20 font-semibold' : 'hover:bg-muted')}>
            {l}{n ? <span className="rounded-full bg-gold px-1.5 text-[11px] font-bold text-[hsl(250_45%_10%)]">{n}</span> : null}
          </button>
        ))}
      </div>

      {view === 'errors' && <ErrorsView onChanged={load} />}
      {view === 'problems' && <ProblemsView problems={h?.problems ?? null} onOpen={onOpen} />}
      {view === 'requirements' && <RequirementsView h={h} onChanged={load} />}
      {view === 'reports' && <ReportsView s={h?.summary ?? null} />}
    </div>
  );
}

function Kpi({ icon, label, value, sub, onClick }: { icon: React.ReactNode; label: string; value: string; sub?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="glass rounded-lg p-4 text-left transition hover:border-gold/60">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">{icon}{label}</p>
      <p className="mt-1 truncate font-serif text-2xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
    </button>
  );
}

/* ---------- Live errors ---------- */
function ErrorsView({ onChanged }: { onChanged: () => void }) {
  const [f, setF] = React.useState({ source: 'all', level: 'all', status: 'open', q: '' });
  const [rows, setRows] = React.useState<SiteError[] | null>(null);
  const [open, setOpen] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const qs = `source=${f.source}&level=${f.level}&status=${f.status}${f.q.trim() ? `&q=${encodeURIComponent(f.q.trim())}` : ''}`;
  const load = React.useCallback(() => { api<{ errors: SiteError[] }>(`/api/admin/health?view=errors&${qs}`).then((r) => setRows(r.errors)).catch(() => setRows([])); }, [qs]);
  React.useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, [load]);
  const act = async (action: string, ids?: string[], ok?: string) => {
    setMsg(null);
    try { await api('/api/admin/health', { method: 'POST', json: { action, ids } }); if (ok) setMsg(ok); load(); onChanged(); } catch { setMsg('Could not save.'); }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="h-9 w-32 text-sm" aria-label="Status"><option value="open">Open</option><option value="resolved">Resolved</option><option value="all">All</option></Select>
        <Select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} className="h-9 w-44 text-sm" aria-label="Where"><option value="all">Everywhere</option>{Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <Select value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })} className="h-9 w-40 text-sm" aria-label="Level"><option value="all">Errors + warnings</option><option value="error">Errors</option><option value="warning">Warnings</option></Select>
        <Input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Search message or page…" className="h-9 w-56 text-sm" />
        <div className="ml-auto flex flex-wrap gap-2">
          {f.status === 'open' && rows?.length ? <Button size="sm" variant="outline" onClick={() => { if (confirm('Mark all open errors as resolved?')) act('resolve-all', undefined, 'All marked resolved.'); }}><CheckCircle2 className="h-4 w-4" /> Resolve all</Button> : null}
          <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete all resolved errors permanently?')) act('delete-resolved', undefined, 'Resolved errors deleted.'); }}><Trash2 className="h-4 w-4" /> Delete resolved</Button>
          <Button size="sm" variant="ghost" onClick={() => download(`/api/admin/health?view=csv&${qs.replace('status=open', 'status=all')}`).catch(() => setMsg('Could not download.'))}><Download className="h-4 w-4" /> CSV</Button>
        </div>
      </div>
      {msg && <p className="text-xs text-muted-foreground" role="status">{msg}</p>}
      {!rows ? <div className="glass h-32 animate-pulse rounded-lg" />
        : rows.length === 0 ? <p className="glass flex items-center justify-center gap-2 rounded-lg p-8 text-center text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-success" />{f.status === 'open' ? 'No open errors – the website is running cleanly.' : 'Nothing found.'}</p>
          : (
            <div className="glass divide-y divide-border/60 rounded-lg">
              {rows.map((r) => (
                <div key={r.id} className={cn('p-3 text-sm', r.resolvedAt && 'opacity-60')}>
                  <div className="flex flex-wrap items-start gap-2">
                    <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} className="mt-0.5 text-muted-foreground" aria-label="Details">{open === r.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
                    <Badge tone={r.level === 'error' ? 'bad' : 'warn'}>{r.level}</Badge>
                    <Badge>{SOURCE_LABEL[r.source] ?? r.source}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium">{r.message}</p>
                      <p className="text-xs text-muted-foreground">{r.method ? `${r.method} ` : ''}{r.route ?? '—'}{r.status ? ` · ${r.status}` : ''} · <b>{r.count}×</b> · last {ago(r.lastSeen)} · first {when(r.firstSeen)}{r.resolvedAt ? ` · resolved ${when(r.resolvedAt)}` : ''}</p>
                    </div>
                    {r.resolvedAt ? <Button size="sm" variant="ghost" onClick={() => act('reopen', [r.id])}>Reopen</Button> : <Button size="sm" variant="outline" onClick={() => act('resolve', [r.id])}><CheckCircle2 className="h-4 w-4" /> Resolve</Button>}
                  </div>
                  {open === r.id && (
                    <div className="mt-2 space-y-2 pl-6">
                      {r.meta && <pre className="overflow-x-auto rounded bg-muted/40 p-2 text-[11px]">{JSON.stringify(r.meta, null, 2)}</pre>}
                      {r.stack ? <pre className="max-h-72 overflow-auto rounded bg-muted/40 p-2 text-[11px] leading-snug">{r.stack}</pre> : <p className="text-xs text-muted-foreground">No stack trace.</p>}
                      <p className="text-xs text-muted-foreground">{HINT[r.source] ?? ''}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      <p className="text-xs text-muted-foreground">Recorded automatically: server and API failures, errors in visitors&apos; browsers, report delivery, SMS / email and payment checks. The same error is grouped with a counter; a resolved error that happens again re-opens. Emails, phone numbers and keys are masked. Kept for 90 days.</p>
    </div>
  );
}
const HINT: Record<string, string> = {
  client: 'Happened in a visitor\'s browser. "Page code failed to load" after a deployment is normal for old open tabs; repeated errors on one page need a fix.',
  api: 'An API request failed with a server error. The route and stack show where.',
  server: 'A page or route crashed while rendering on the server.',
  delivery: 'The automatic report delivery could not write or deliver a report – see Service orders for the order and use Retry / Approve.',
  notify: 'The report-ready SMS or email failed – check the SMS / email settings under Running requirements and use "Send SMS + email again".',
  payment: 'A payment could not be confirmed with the gateway – check the gateway keys and the Payment report.',
  pdf: 'The PDF engine failed – use "Test PDF engine" under Running requirements.',
};

/* ---------- Problems ---------- */
function ProblemsView({ problems, onOpen }: { problems: Problem[] | null; onOpen?: (tab: string) => void }) {
  if (!problems) return <div className="glass h-32 animate-pulse rounded-lg" />;
  return (
    <div className="space-y-3">
      {problems.map((p) => { const I = ICON[p.status]; return (
        <div key={p.id} className={cn('glass rounded-lg border p-4', p.status === 'fail' ? 'border-danger/60' : p.status === 'warn' ? 'border-warning/60' : 'border-border')}>
          <div className="flex flex-wrap items-start gap-3">
            <I className={cn('mt-0.5 h-5 w-5 shrink-0', TONE[p.status])} />
            <div className="min-w-0 flex-1"><p className="font-semibold">{p.label}{p.count ? <span className="ml-2 rounded-full bg-muted px-2 text-sm">{p.count}</span> : null}</p><p className="text-sm text-muted-foreground">{p.detail}</p></div>
            {p.tab && onOpen && <Button size="sm" variant="outline" onClick={() => onOpen(p.tab!)}>Open</Button>}
          </div>
          {p.items?.length ? <ul className="mt-2 space-y-1 pl-8 text-xs">{p.items.map((x) => <li key={x.id} className="text-muted-foreground"><b className="text-foreground">{x.text}</b>{x.at ? ` · ${when(x.at)}` : ''} · <span className="font-mono">{x.id.slice(0, 8)}</span></li>)}</ul> : null}
        </div>
      ); })}
    </div>
  );
}

/* ---------- Running requirements ---------- */
function RequirementsView({ h, onChanged }: { h: Health | null; onChanged: () => void }) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [out, setOut] = React.useState<Record<string, { ok: boolean; detail: string }>>({});
  async function test(action: string) {
    setBusy(action);
    try { const r = await api<{ ok: boolean; detail: string }>('/api/admin/health', { method: 'POST', json: { action } }); setOut((o) => ({ ...o, [action]: r })); }
    catch (e) { setOut((o) => ({ ...o, [action]: { ok: false, detail: e instanceof ApiError ? String((e.body as Record<string, unknown>).detail ?? e.message) : 'Failed' } })); }
    finally { setBusy(null); onChanged(); }
  }
  if (!h) return <div className="glass h-32 animate-pulse rounded-lg" />;
  const groups = [...new Set(h.requirements.map((r) => r.group))];
  const tests: [string, string, typeof FileText][] = [['test-ai', 'Test AI engine', Sparkles], ['test-pdf', 'Test PDF engine', FileText], ['test-email', 'Send test email to me', Mail], ['test-sms', 'Send test SMS to me', MessageSquare], ['run-delivery', 'Run automatic delivery now', Play], ['test-error', 'Record a test error', Zap]];
  return (
    <div className="space-y-4">
      <div className="glass rounded-lg p-4">
        <p className="mb-2 font-semibold">Live tests</p>
        <div className="flex flex-wrap gap-2">{tests.map(([a, l, I]) => <Button key={a} size="sm" variant="outline" disabled={!!busy} onClick={() => test(a)}>{busy === a ? <RefreshCw className="h-4 w-4 animate-spin" /> : <I className="h-4 w-4" />} {l}</Button>)}</div>
        {Object.entries(out).map(([k, v]) => <p key={k} className={cn('mt-2 text-xs', v.ok ? 'text-success' : 'text-danger')}>{tests.find((t) => t[0] === k)?.[1]}: {v.detail}</p>)}
      </div>
      {groups.map((g) => (
        <div key={g} className="glass rounded-lg">
          <p className="border-b border-border/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</p>
          <div className="divide-y divide-border/50">
            {h.requirements.filter((r) => r.group === g).map((r) => { const I = ICON[r.status]; return (
              <div key={r.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                <I className={cn('mt-0.5 h-4 w-4 shrink-0', TONE[r.status])} />
                <div className="min-w-0 flex-1"><p className="font-medium">{r.label}</p><p className="text-xs text-muted-foreground">{r.detail}</p>{r.fix && r.status !== 'ok' && <p className="mt-0.5 text-xs text-gold">{r.fix}</p>}</div>
              </div>
            ); })}
          </div>
        </div>
      ))}
      <div className="glass grid gap-2 rounded-lg p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {[['Host', h.runtime.host], ['Environment', h.runtime.environment], ['Node.js', h.runtime.node], ['Platform', h.runtime.platform], ['Version', h.runtime.commit ? `${h.runtime.commit}${h.runtime.commitMessage ? ` – ${h.runtime.commitMessage}` : ''}` : 'local'],
          ['Server up for', `${h.runtime.uptimeMin} min`], ['Memory', `${h.runtime.memoryMb} MB (heap ${h.runtime.heapMb} MB)`], ['Server time', when(h.runtime.serverTime)]].map(([k, v]) => <p key={k}><span className="text-muted-foreground">{k}: </span>{v}</p>)}
      </div>
    </div>
  );
}

/* ---------- Reports ---------- */
function ReportsView({ s }: { s: Summary | null }) {
  if (!s) return <div className="glass h-32 animate-pulse rounded-lg" />;
  const max = Math.max(1, ...s.daily.map((d) => d.error + d.warning));
  return (
    <div className="space-y-4">
      <div className="glass rounded-lg p-4">
        <p className="mb-3 font-semibold">Errors per day – last 14 days</p>
        <div className="flex h-40 items-end gap-1.5">
          {s.daily.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${d.error} errors, ${d.warning} warnings`}>
              <span className="text-[10px] text-muted-foreground">{d.error + d.warning || ''}</span>
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-t" style={{ height: `${Math.round(((d.error + d.warning) / max) * 110)}px` }}>
                <div className="bg-warning/80" style={{ height: `${d.error + d.warning ? (d.warning / (d.error + d.warning)) * 100 : 0}%` }} />
                <div className="flex-1 bg-danger/80" />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><i className="inline-block h-2 w-3 bg-danger/80" />errors</span><span className="flex items-center gap-1"><i className="inline-block h-2 w-3 bg-warning/80" />warnings</span></p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-lg p-4">
          <p className="mb-2 font-semibold">By area</p>
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1">Where</th><th>Today</th><th>7 days</th></tr></thead>
            <tbody>{s.bySource.map((b) => <tr key={b.source} className="border-t border-border/50"><td className="py-1">{SOURCE_LABEL[b.source] ?? b.source}</td><td className={b.today ? 'font-semibold text-danger' : ''}>{b.today}</td><td>{b.week}</td></tr>)}</tbody></table>
        </div>
        <div className="glass rounded-lg p-4">
          <p className="mb-2 font-semibold">Most frequent – last 7 days</p>
          {s.top.length ? <ol className="space-y-1.5 text-sm">{s.top.map((t, i) => <li key={t.id} className="flex gap-2"><span className="w-5 text-muted-foreground">{i + 1}.</span><span className="min-w-0 flex-1 break-words">{t.message}<span className="block text-xs text-muted-foreground">{SOURCE_LABEL[t.source] ?? t.source} · {t.route ?? '—'} · last {ago(t.lastSeen)}</span></span><b>{t.count}×</b></li>)}</ol> : <p className="text-sm text-muted-foreground">No errors in the last 7 days.</p>}
        </div>
      </div>
    </div>
  );
}
