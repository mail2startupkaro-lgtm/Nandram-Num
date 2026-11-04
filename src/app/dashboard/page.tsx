'use client';
import * as React from 'react';
import Link from 'next/link';
import { Copy, FileJson, FileSpreadsheet, Plus, Search, Trash2, Upload, Users } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, download, ApiError } from '@/lib/client/api';

interface Item {
  id: string; displayName: string; aadhaarLast4: string | null; updatedAt: string; reportCount: number;
  latest: { id: string; module: string; version: number; status: string; summary: { moolank: number; bhagyank: number; nameNumber: number | null; personalYear: number }; createdAt: string } | null;
}
interface ImportResult { created: { profileId: string; name: string; reports: number }[]; issues: { where: string; message: string }[]; warnings: { where: string; message: string }[] }

export default function Dashboard() {
  const { t, me } = useApp();
  const [q, setQ] = React.useState('');
  const [data, setData] = React.useState<{ items: Item[]; total: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [imp, setImp] = React.useState<ImportResult | null>(null);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async (query = q) => {
    try { setData(await api(`/api/profiles?q=${encodeURIComponent(query)}`)); setError(null); } catch (e) { setError(e instanceof Error ? e.message : t.err.server); }
  }, [q, t.err.server]);
  React.useEffect(() => { const h = setTimeout(() => load(q), 250); return () => clearTimeout(h); }, [q, load]);

  async function doImport(file: File) {
    setBusy(true); setImp(null);
    const fd = new FormData(); fd.append('file', file);
    try { setImp(await api<ImportResult>('/api/import?generate=1', { method: 'POST', body: fd })); }
    catch (e) { setImp(e instanceof ApiError ? { created: [], issues: e.status === 402 ? [{ where: 'plan', message: `${t.pricing.features.bulk} – ${t.account.upgrade}` }] : (e.body as ImportResult).issues ?? [{ where: 'file', message: e.message }], warnings: [] } : null); }
    finally { setBusy(false); load(); }
  }

  return (
    <div className="container space-y-6 py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold sm:text-4xl"><Users className="h-8 w-8 text-gold" />{t.dash.title}</h1>
          <p className="text-muted-foreground">{t.dash.sub}{data ? ` · ${data.total}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/reading?new=1" className={buttonVariants({ variant: 'gold' })}><Plus /> {t.dash.newReading}</Link>
          <Button variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}><Upload /> {t.dash.import}</Button>
          <input ref={fileRef} type="file" hidden accept=".json,.csv,application/json,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ''; }} />
          {me?.account?.features.bulk && <>
          <Button variant="ghost" onClick={() => download('/api/export?format=json')}><FileJson /> {t.dash.exportJson}</Button>
          <Button variant="ghost" onClick={() => download('/api/export?format=csv')}><FileSpreadsheet /> {t.dash.exportCsv}</Button>
          </>}
        </div>
      </div>

      {me?.account && (
        <div className="glass flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-sm">
          <span>{t.account.plan}: <b>{me.account.planName ?? t.account.freePlan}</b></span>
          <span>{t.account.credits}: <b className="text-gold">{me.account.credits}</b></span>
          {!me.account.features.fullReports && <Link href="/pricing" className={buttonVariants({ size: 'sm', variant: 'gold', className: 'ml-auto' })}>{t.account.upgrade}</Link>}
        </div>
      )}

      {imp && (
        <div className="glass space-y-2 rounded-lg p-4 text-sm" role="status">
          {imp.created.length > 0 && <p className="text-success">{t.dash.importDone}: {imp.created.map((c) => c.name).join(', ')}</p>}
          {imp.warnings.length > 0 && <div><p className="font-medium">{t.dash.warnings}</p><ul className="list-disc pl-5 text-muted-foreground">{imp.warnings.slice(0, 10).map((w, i) => <li key={i}>{w.where}: {w.message}</li>)}</ul></div>}
          {imp.issues.length > 0 && <div><p className="font-medium text-danger">{t.dash.importIssues}</p><ul className="list-disc pl-5">{imp.issues.slice(0, 15).map((w, i) => <li key={i}><code className="text-xs">{w.where}</code>: {w.message}</li>)}</ul></div>}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder={t.dash.search} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t.dash.search} />
      </div>

      {error && <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {data && data.items.length === 0 && <p className="glass rounded-lg p-8 text-center text-muted-foreground">{t.dash.empty}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((p) => (
          <div key={p.id} className="glass flex flex-col rounded-lg p-4">
            <Link href={`/dashboard/${p.id}`} className="group">
              <p className="font-serif text-xl font-semibold group-hover:text-gold">{p.displayName}</p>
              <p className="text-xs text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString('en-IN')} · {p.reportCount} {p.reportCount === 1 ? t.dash.report : t.dash.reports}{p.aadhaarLast4 ? ` · XXXX-${p.aadhaarLast4}` : ''}</p>
            </Link>
            {p.latest && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <Badge tone="gold">{t.preview.moolank} {p.latest.summary.moolank}</Badge>
                <Badge tone="gold">{t.preview.bhagyank} {p.latest.summary.bhagyank}</Badge>
                {p.latest.summary.nameNumber && <Badge>{t.preview.nameNo} {p.latest.summary.nameNumber}</Badge>}
                <Badge tone={p.latest.status === 'final' ? 'good' : p.latest.status === 'awaiting_review' ? 'warn' : 'default'}>{t.dash.statuses[p.latest.status]} · v{p.latest.version}</Badge>
              </div>
            )}
            <div className="mt-auto flex gap-1 pt-4">
              <Link href={`/dashboard/${p.id}`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>{t.dash.open}</Link>
              <Button size="sm" variant="ghost" onClick={async () => { await api(`/api/profiles/${p.id}/duplicate`, { method: 'POST' }); load(); }}><Copy /> {t.dash.duplicate}</Button>
              <Button size="sm" variant="ghost" className="ml-auto text-danger" aria-label={t.dash.delete} onClick={async () => { if (confirm(t.dash.confirmDelete)) { await api(`/api/profiles/${p.id}`, { method: 'DELETE' }); load(); } }}><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
