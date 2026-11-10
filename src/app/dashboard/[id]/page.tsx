'use client';
import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Eye, FileJson, FileText, Pencil, RefreshCw, Share2, Sparkles, Trash2 } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { ShareDialog } from '@/components/dashboard/share-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError, download } from '@/lib/client/api';

interface ReportMeta { id: string; module: string; version: number; status: string; theme: string; language: string; asOf: string; createdAt: string; summary: { moolank: number; bhagyank: number; kua: number; nameNumber: number | null; personalYear: number; nameScore: number | null; mobileScore: number | null; coupleScore: number | null; sections: number } }
interface ProfileData { profile: { id: string; displayName: string; aadhaarLast4: string | null; input: { fullName: string; dob: string; gender: string; city?: string; state?: string; mobile?: string; partner?: { name: string } } }; reports: ReportMeta[] }

const THEMES = ['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white'] as const;
const fmtDate = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d.split('-').reverse().join('-') : d);

export default function ProfilePage() {
  const { t, me, refreshMe, lang } = useApp();
  const MOD_HI: Record<string, string> = { complete: 'संपूर्ण', dob: 'जन्म तिथि', name: 'नाम', mobile: 'मोबाइल', aadhaar: 'आधार', couple: 'दंपति' };
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = React.useState<ProfileData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [share, setShare] = React.useState<string | null>(null);
  const [theme, setTheme] = React.useState<string>('royal-gold-maroon');

  const load = React.useCallback(async () => {
    try { setData(await api<ProfileData>(`/api/profiles/${id}`)); } catch (e) { setError(e instanceof Error ? e.message : t.err.server); }
  }, [id, t.err.server]);
  React.useEffect(() => { load(); }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key); setError(null);
    try { await fn(); } catch (e) {
      if (e instanceof ApiError && e.status === 402) setError(`${t.account.unlockNone} → ${t.account.upgrade}: /pricing`);
      else setError(e instanceof Error ? e.message : t.err.server);
    } finally { setBusy(null); }
  };

  /** Full report: unlocks with the plan, or asks before spending a credit. */
  async function downloadReport(reportId: string) {
    const url = `/api/reports/${reportId}/pdf?kind=report&theme=${theme}`;
    try { await download(url); }
    catch (e) {
      if (!(e instanceof ApiError) || e.status !== 402) throw e;
      const reason = (e.body as { reason?: string }).reason;
      const credits = me?.account?.credits ?? 0;
      if (reason === 'credit_required' && credits > 0 && confirm(`${t.account.unlockAsk} ${credits}.`)) { await download(`${url}&useCredit=1`); await refreshMe(); }
      else if (reason !== 'credit_required' || credits === 0) router.push('/pricing');
    }
    await load();
  }

  if (!data) return <div className="container py-12">{error ? <p className="text-danger">{error}</p> : <div className="h-40 animate-pulse rounded-lg bg-muted" />}</div>;
  const p = data.profile;

  return (
    <div className="container space-y-6 py-8 sm:py-12">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> {t.dash.back}</Link>

      <div className="glass rounded-lg p-5 sm:p-7">
        <p className="text-sm uppercase tracking-[0.2em] text-gold">{t.dash.profile}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{p.displayName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {p.input.fullName} · {fmtDate(p.input.dob)} · {[p.input.city, p.input.state].filter(Boolean).join(', ')}{p.input.mobile ? ` · ${p.input.mobile}` : ''}{p.aadhaarLast4 ? ` · Aadhaar XXXX-XXXX-${p.aadhaarLast4}` : ''}{p.input.partner ? ` · ♥ ${p.input.partner.name}` : ''}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/reading?profile=${p.id}`} className={buttonVariants({ variant: 'outline' })}><Pencil /> {t.dash.editDetails}</Link>
          <Button variant="gold" disabled={!!busy} onClick={() => run('regen', async () => { await api(`/api/profiles/${p.id}/reports`, { method: 'POST', json: { mode: 'regenerate', theme } }); await load(); })}>
            <RefreshCw className={busy === 'regen' ? 'animate-spin' : ''} /> {t.dash.newVersion}
          </Button>
          <Button variant="ghost" disabled={!!busy} onClick={() => run('in', () => download(`/api/profiles/${p.id}/input-sheet?theme=${theme}`))}><FileText /> {t.dash.inputSheet}</Button>
          <Button variant="ghost" onClick={() => download(`/api/profiles/${p.id}/export?all=1`)}><FileJson /> {t.dash.exportProfile}</Button>
          <Button variant="ghost" className="text-danger" onClick={() => run('del', async () => { if (confirm(t.dash.confirmDelete)) { await api(`/api/profiles/${p.id}`, { method: 'DELETE' }); router.push('/dashboard'); } })}><Trash2 /> {t.dash.delete}</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t.dash.aadhaarNote}</p>
      </div>

      {error && <p className="rounded-md bg-danger/10 p-3 text-sm text-danger" role="alert">{error}</p>}

      <section className="glass rounded-lg p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t.dash.history}</h2>
          <Select aria-label={t.pdf.theme} value={theme} onChange={(e) => setTheme(e.target.value)} className="w-48 text-xs">{THEMES.map((x) => <option key={x} value={x}>{t.pdf.themes[x]}</option>)}</Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 font-medium">{t.dash.version}</th><th className="py-2 font-medium">{t.dash.module}</th><th className="py-2 font-medium">{t.dash.date}</th>
              <th className="py-2 font-medium">{t.dash.scores}</th><th className="py-2 font-medium">{t.dash.status}</th><th className="py-2 text-right font-medium">{t.dash.actions}</th>
            </tr></thead>
            <tbody>
              {data.reports.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="py-2 font-serif text-lg font-semibold">v{r.version}</td>
                  <td className="py-2 capitalize">{lang === 'hi' ? MOD_HI[r.module] ?? r.module : r.module}</td>
                  <td className="py-2 text-muted-foreground">{fmtDate(r.asOf)}</td>
                  <td className="py-2"><span className="flex flex-wrap gap-1">
                    <Badge tone="gold">{r.summary.moolank}/{r.summary.bhagyank}</Badge>
                    {r.summary.nameScore !== null && <Badge>{t.preview.nameNo} {r.summary.nameScore}</Badge>}
                    {r.summary.mobileScore !== null && <Badge>📱 {r.summary.mobileScore}</Badge>}
                    {r.summary.coupleScore !== null && <Badge>♥ {r.summary.coupleScore}%</Badge>}
                  </span></td>
                  <td className="py-2"><Badge tone={r.status === 'final' ? 'good' : r.status === 'awaiting_review' ? 'warn' : 'default'}>{t.dash.statuses[r.status]}</Badge></td>
                  <td className="py-2"><span className="flex justify-end gap-1">
                    <Link href={`/reading?report=${r.id}`} className={buttonVariants({ size: 'sm', variant: 'outline' })}><Eye /> {t.dash.open}</Link>
                    <Button size="sm" variant="ghost" disabled={!!busy || r.status === 'awaiting_review'} title={r.status === 'awaiting_review' ? t.pdf.reviewFirst : undefined} onClick={() => run(`pdf-${r.id}`, () => downloadReport(r.id))}>
                      <Download className={busy === `pdf-${r.id}` ? 'animate-bounce' : ''} /> PDF
                    </Button>
                    <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run(`out-${r.id}`, () => download(`/api/reports/${r.id}/pdf?kind=output&theme=${theme}`))}><Sparkles /> {t.dash.outputSheet}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShare(r.id)}><Share2 /> {t.dash.share}</Button>
                    <Button size="sm" variant="ghost" className="text-danger" aria-label={t.dash.delete} onClick={() => run('d', async () => { if (confirm(`${t.dash.delete} v${r.version}?`)) { await api(`/api/reports/${r.id}`, { method: 'DELETE' }); await load(); } })}><Trash2 /></Button>
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {share && <ShareDialog reportId={share} onClose={() => setShare(null)} />}
    </div>
  );
}
