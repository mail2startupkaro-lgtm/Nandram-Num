'use client';
/** Admin → Limited-time offer: the offer end date (funnel leads are in Admin → CRM). */
import * as React from 'react';
import { Save, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';
import type { OfferSettings } from '@/lib/admin/settings';


/** ISO (UTC) ⇄ value for <input type="datetime-local"> shown in IST. */
const IST_MS = 330 * 60_000;
const toLocal = (iso: string) => (iso ? new Date(new Date(iso).getTime() + IST_MS).toISOString().slice(0, 16) : '');
const fromLocal = (v: string) => (v ? new Date(new Date(`${v}:00Z`).getTime() - IST_MS).toISOString() : '');
const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function FunnelAdmin() {
  const [o, setO] = React.useState<OfferSettings | null>(null);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try { setO((await api<{ offer: OfferSettings }>('/api/admin/settings')).offer); } catch { setMsg({ ok: false, text: 'Could not load the offer settings.' }); }
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

      <p className="text-sm text-muted-foreground">Leads from the services funnel and the free e-book popup now live in <strong>Admin → CRM</strong> (pipeline, follow-ups, WhatsApp templates, tags, CSV export).</p>
    </div>
  );
}
