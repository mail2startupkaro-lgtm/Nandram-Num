'use client';
/** Admin → Offer & leads: the limited-time offer end date and the leads from the services funnel. */
import * as React from 'react';
import { Download, MessageCircle, RefreshCw, Save, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';
import type { OfferSettings } from '@/lib/admin/settings';

interface Lead { id: string; createdAt: string; name: string; phone: string | null; dob: string | null; moolank: number | null; bhagyank: number | null; service: string | null; magnet: string | null; language: string | null; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null }

/** ISO (UTC) ⇄ value for <input type="datetime-local"> shown in IST. */
const IST_MS = 330 * 60_000;
const toLocal = (iso: string) => (iso ? new Date(new Date(iso).getTime() + IST_MS).toISOString().slice(0, 16) : '');
const fromLocal = (v: string) => (v ? new Date(new Date(`${v}:00Z`).getTime() - IST_MS).toISOString() : '');
const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function FunnelAdmin() {
  const [o, setO] = React.useState<OfferSettings | null>(null);
  const [leads, setLeads] = React.useState<Lead[] | null>(null);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try { setO((await api<{ offer: OfferSettings }>('/api/admin/settings')).offer); } catch { setMsg({ ok: false, text: 'Could not load the offer settings.' }); }
    try { setLeads((await api<{ leads: Lead[] }>('/api/admin/leads')).leads); } catch { setLeads([]); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function save(next: OfferSettings) {
    setBusy(true); setMsg(null);
    try { await api('/api/admin/settings', { method: 'PUT', json: { key: 'offer', value: next } }); setO(next); setMsg({ ok: true, text: next.enabled ? `Offer is live until ${fmt(next.endsAt)} IST. Pages refresh within a minute.` : 'Offer switched off.' }); }
    catch (e) { setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Save failed.' }); }
    finally { setBusy(false); }
  }

  const ended = o?.enabled && o.endsAt && new Date(o.endsAt).getTime() <= Date.now();
  const quick = (days: number) => { const d = new Date(Date.now() + IST_MS); d.setUTCDate(d.getUTCDate() + days); d.setUTCHours(23, 59, 0, 0); return new Date(d.getTime() - IST_MS).toISOString(); };

  return (
    <div className="space-y-8">
      <section className="glass rounded-xl p-5">
        <h2 className="mb-1 flex items-center gap-2 font-serif text-xl font-semibold"><Timer className="h-5 w-5 text-gold" />Limited-time offer</h2>
        <p className="mb-4 text-sm text-muted-foreground">Shows a countdown on /services and every service page. The offer prices themselves are the fees in Services &amp; orders (Real price = struck-through, Offer price = what the client pays). The timer runs to the real date you set and disappears when it ends – it never restarts on its own, as required by the CCPA dark-pattern guidelines.</p>
        {!o ? <p className="text-sm">Loading…</p> : (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-gold" checked={o.enabled} onChange={(e) => setO({ ...o, enabled: e.target.checked })} />Show the offer countdown</label>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Offer ends (IST)" htmlFor="of-end"><Input id="of-end" type="datetime-local" value={toLocal(o.endsAt)} onChange={(e) => setO({ ...o, endsAt: fromLocal(e.target.value) })} /></Field>
              <Field label="Label (English)" htmlFor="of-en"><Input id="of-en" maxLength={60} value={o.labelEn} onChange={(e) => setO({ ...o, labelEn: e.target.value })} placeholder="Diwali offer" /></Field>
              <Field label="Label (Hindi)" htmlFor="of-hi"><Input id="of-hi" maxLength={60} value={o.labelHi} onChange={(e) => setO({ ...o, labelHi: e.target.value })} placeholder="दिवाली ऑफ़र" /></Field>
            </div>
            <div className="flex flex-wrap gap-2 text-xs"><span className="self-center text-muted-foreground">Quick end date:</span>{[3, 7, 15, 30].map((d) => <Button key={d} size="sm" variant="outline" onClick={() => setO({ ...o, endsAt: quick(d) })}>{d} days</Button>)}</div>
            {ended && <p className="rounded-md bg-warning/15 p-2 text-sm">This offer ended on {fmt(o.endsAt)} – it is no longer shown. Set a new end date to run another offer.</p>}
            <Button onClick={() => save(o)} disabled={busy}><Save className="h-4 w-4" />Save offer</Button>
            {msg && <p className={`text-sm ${msg.ok ? 'text-success' : 'text-danger'}`} role="status">{msg.text}</p>}
          </div>
        )}
      </section>

      <section className="glass rounded-xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-xl font-semibold">Leads from the services funnel {leads && <span className="text-sm text-muted-foreground">({leads.length}{leads.length === 300 ? '+' : ''})</span>}</h2>
          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" />Refresh</Button><a href="/api/admin/leads?format=csv" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gold/50 px-3 text-sm hover:bg-gold/10"><Download className="h-4 w-4" />CSV</a></div>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Visitors who asked for the free mini-reading or unlocked a sample report, with WhatsApp consent. UTM columns show which ad or post brought them.</p>
        {!leads ? <p className="text-sm">Loading…</p> : leads.length === 0 ? <p className="text-sm text-muted-foreground">No leads yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2 pr-2">When</th><th className="pr-2">Name</th><th className="pr-2">WhatsApp</th><th className="pr-2">DOB</th><th className="pr-2">M / B</th><th className="pr-2">Interested in</th><th className="pr-2">Source</th></tr></thead>
              <tbody>{leads.map((l) => { const wa = (l.phone ?? '').replace(/\D/g, ''); return (
                <tr key={l.id} className="border-b border-border/40">
                  <td className="py-2 pr-2 whitespace-nowrap">{fmt(l.createdAt)}</td><td className="pr-2">{l.name}</td>
                  <td className="pr-2">{wa ? <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Namaste ${l.name}, this is Acharya Nandram's team from myNumerologist.com.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-success hover:underline"><MessageCircle className="h-3.5 w-3.5" />{l.phone}</a> : '–'}</td>
                  <td className="pr-2 whitespace-nowrap">{l.dob ?? '–'}</td><td className="pr-2">{l.moolank ?? '–'} / {l.bhagyank ?? '–'}</td>
                  <td className="pr-2 text-xs">{l.service?.replace(/^SVC_/, '').replace(/_/g, ' ').toLowerCase() ?? '–'}<span className="block text-muted-foreground">{l.magnet}</span></td>
                  <td className="pr-2 text-xs">{[l.utmSource, l.utmMedium, l.utmCampaign].filter(Boolean).join(' / ') || 'direct'}</td>
                </tr>); })}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
