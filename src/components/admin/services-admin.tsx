'use client';
import * as React from 'react';
import { Mail, MessageCircle, Phone, Plus, RefreshCw, Save, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import type { Service, ServiceIntakeField } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/billing/currency';

const INTAKE: { k: ServiceIntakeField; label: string }[] = [
  { k: 'clientName', label: 'Full name' }, { k: 'currentName', label: 'Current name spelling' }, { k: 'dob', label: 'Date of birth' }, { k: 'gender', label: 'Gender' },
  { k: 'tob', label: 'Time of birth' }, { k: 'pob', label: 'Place of birth' }, { k: 'mobile', label: 'Mobile to analyse' }, { k: 'parents', label: "Parents' names" },
  { k: 'letters', label: 'Preferred letters' }, { k: 'partnerName', label: "Partner's name" }, { k: 'partnerDob', label: "Partner's DOB" }, { k: 'questions', label: 'Questions / notes' },
];
const STATUS = ['paid', 'in_progress', 'delivered', 'cancelled'] as const;
const STATUS_LABEL: Record<string, string> = { awaiting_payment: 'Awaiting payment', paid: 'Paid – to do', in_progress: 'In progress', delivered: 'Delivered', cancelled: 'Cancelled' };
const inr = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const rupees = (p: number | null | undefined) => (p == null ? '' : String(p / 100));
const toPaise = (s: string) => Math.round(Number(s || 0) * 100);

/** Admin → Services: edit services & fees, and work through paid service orders. */
export function ServicesAdmin({ onGenerateReport }: { onGenerateReport?: (order: Order) => void } = {}) {
  const [view, setView] = React.useState<'orders' | 'catalogue'>('orders');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-2xl font-semibold">Services</h2>
        <div className="flex gap-1 rounded-md border border-border p-1 text-sm">{(['orders', 'catalogue'] as const).map((v) => <button key={v} onClick={() => setView(v)} className={cn('rounded px-3 py-1', view === v ? 'bg-gold/20 font-semibold' : 'hover:bg-muted')}>{v === 'orders' ? 'Orders' : 'Services & fees'}</button>)}</div></div>
      {view === 'orders' ? <Orders onGenerateReport={onGenerateReport} /> : <Catalogue />}
    </div>
  );
}

export interface Order { id: string; serviceCode: string; status: string; adminNote: string | null; createdAt: string; deliveredAt: string | null; details: Record<string, string>; payment: { amountPaise: number; currency?: string; invoiceNumber: string | null; billingName: string | null; paidAt: string | null }; userId: string | null }

function Orders({ onGenerateReport }: { onGenerateReport?: (order: Order) => void }) {
  const [status, setStatus] = React.useState('all');
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [names, setNames] = React.useState<Record<string, string>>({});
  const load = React.useCallback(() => { api<{ orders: Order[] }>(`/api/admin/service-orders?status=${status}`).then((r) => setOrders(r.orders)).catch(() => setOrders([])); }, [status]);
  React.useEffect(() => { load(); api<{ services: Service[] }>('/api/admin/services').then((r) => setNames(Object.fromEntries(r.services.map((s) => [s.code, s.en.name])))).catch(() => {}); }, [load]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {['all', ...STATUS].map((s) => <button key={s} onClick={() => setStatus(s)} className={cn('rounded-full border px-3 py-1 text-sm', status === s ? 'border-gold bg-gold/20 font-semibold' : 'border-border')}>{s === 'all' ? 'All paid' : STATUS_LABEL[s]}</button>)}
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>
      <p className="text-xs text-muted-foreground">Only paid orders appear here. Client details are stored encrypted. Payments and GST invoices are also in the Payment report.</p>
      {!orders ? <div className="glass h-32 animate-pulse rounded-lg" /> : orders.length === 0 ? <p className="glass rounded-lg p-6 text-center text-muted-foreground">No service orders yet.</p> : orders.map((o) => <OrderCard key={o.id} o={o} name={names[o.serviceCode] ?? o.serviceCode} onChanged={load} onGenerateReport={onGenerateReport} />)}
    </div>
  );
}

function OrderCard({ o, name, onChanged, onGenerateReport }: { o: Order; name: string; onChanged: () => void; onGenerateReport?: (order: Order) => void }) {
  const [note, setNote] = React.useState(o.adminNote ?? '');
  const [msg, setMsg] = React.useState<string | null>(null);
  const patch = async (b: Record<string, unknown>, ok: string) => { setMsg(null); try { await api('/api/admin/service-orders', { method: 'PATCH', json: { id: o.id, ...b } }); setMsg(ok); onChanged(); } catch { setMsg('Could not save'); } };
  const d = o.details; const wa = (d.mobile ?? '').replace(/\D/g, '');
  const rows = INTAKE.filter((f) => d[f.k]).map((f) => [f.label, d[f.k]]);
  return (
    <article className={cn('glass rounded-xl border p-4', o.status === 'paid' ? 'border-gold/60' : 'border-border')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="font-semibold">{name} <Badge tone={o.status === 'delivered' ? 'good' : o.status === 'cancelled' ? 'bad' : o.status === 'paid' ? 'warn' : 'gold'} className="ml-1">{STATUS_LABEL[o.status]}</Badge></p>
          <p className="text-xs text-muted-foreground">{o.payment.paidAt ? `Paid ${new Date(o.payment.paidAt).toLocaleString('en-IN')}` : new Date(o.createdAt).toLocaleString('en-IN')} · {formatMoney(o.payment.amountPaise, o.payment.currency === 'USD' ? 'USD' : 'INR')}{o.payment.invoiceNumber ? ` · ${o.payment.invoiceNumber}` : ''} · billed to {o.payment.billingName ?? '—'}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {onGenerateReport && (
            <Button size="sm" variant="gold" onClick={() => onGenerateReport(o)} title="Generate tailored service report in Report Studio">
              <Sparkles className="h-4 w-4" /> Generate Report
            </Button>
          )}
          <Select value={o.status} onChange={(e) => patch({ status: e.target.value }, 'Status updated')} className="h-8 w-40 text-sm" aria-label="Status">{STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</Select>
        </div>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{rows.map(([k, v]) => <div key={k} className={k === 'Questions / notes' ? 'sm:col-span-2' : ''}><dt className="inline text-muted-foreground">{k}: </dt><dd className="inline whitespace-pre-wrap">{v}</dd></div>)}</dl>
      {wa.length >= 10 && <div className="mt-2 flex gap-3 text-sm"><a href={`tel:${d.mobile}`} className="inline-flex items-center gap-1 hover:text-gold"><Phone className="h-4 w-4 text-gold" />{d.mobile}</a><a href={`https://wa.me/${wa.length === 10 ? `91${wa}` : wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-success"><MessageCircle className="h-4 w-4" />WhatsApp</a></div>}
      <p className="mt-1 text-xs text-muted-foreground"><Mail className="mr-1 inline h-3 w-3" />Customer contact (email / mobile) is on the customer's account – see Users.</p>
      <div className="mt-3 flex flex-wrap items-end gap-2"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} placeholder="Internal note" aria-label="Internal note" className="min-w-[240px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <Button size="sm" variant="outline" disabled={note === (o.adminNote ?? '')} onClick={() => patch({ adminNote: note }, 'Note saved')}><Save className="h-4 w-4" /> Save note</Button></div>
      {msg && <p className="mt-1 text-xs text-muted-foreground" role="status">{msg}</p>}
    </article>
  );
}

const blank = (): Service => ({ code: 'SVC_', en: { name: '', short: '', includes: [], delivery: '' }, hi: { name: '', short: '', includes: [], delivery: '' }, pricePaise: 100_000, mrpPaise: null, usdCents: null, usdMrpCents: null, priceConfirmed: false, intake: ['clientName', 'dob', 'gender', 'questions'], active: true, featured: false, sort: 10, updatedAt: new Date() });

function Catalogue() {
  const [list, setList] = React.useState<Service[] | null>(null);
  const [sel, setSel] = React.useState<Service | null>(null);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const load = () => api<{ services: Service[] }>('/api/admin/services').then((r) => setList(r.services)).catch(() => setList([]));
  React.useEffect(() => { load(); }, []);
  async function save() {
    if (!sel) return; setMsg(null);
    const { updatedAt: _u, ...body } = sel; // eslint-disable-line @typescript-eslint/no-unused-vars
    const clean = { ...body, en: { ...body.en, includes: body.en.includes.filter(Boolean) }, hi: { ...body.hi, includes: body.hi.includes.filter(Boolean) } };
    try { await api('/api/admin/services', { method: 'PUT', json: clean }); setMsg({ ok: true, text: 'Saved. The Services page is updated.' }); load(); }
    catch (e) { setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Could not save' }); }
  }
  async function remove() {
    if (!sel || !window.confirm(`Delete ${sel.en.name}? (Services with orders can only be switched off.)`)) return;
    try { await api('/api/admin/services', { method: 'DELETE', json: { code: sel.code } }); setSel(null); load(); }
    catch (e) { setMsg({ ok: false, text: e instanceof ApiError && e.body.error === 'SERVICE_IN_USE' ? 'This service has orders – untick “Show on website” instead.' : 'Could not delete' }); }
  }
  const T = (lang: 'en' | 'hi', k: 'name' | 'short' | 'delivery', v: string) => sel && setSel({ ...sel, [lang]: { ...sel[lang], [k]: v } });
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <div className="glass space-y-1 rounded-lg p-2">
        {(list ?? []).map((s) => <button key={s.code} onClick={() => { setSel(s); setMsg(null); }} className={cn('w-full rounded px-3 py-2 text-left text-sm', sel?.code === s.code ? 'bg-gold/20' : 'hover:bg-muted')}><span className="block font-medium">{s.en.name}</span><span className="text-xs text-muted-foreground">{inr(s.pricePaise)} · {s.priceConfirmed ? <span className="text-success">price confirmed</span> : <span className="text-warning">draft price – not payable</span>}{s.active ? '' : ' · hidden'}</span></button>)}
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => { setSel(blank()); setMsg(null); }}><Plus className="h-4 w-4" /> New service</Button>
      </div>
      {!sel ? <p className="glass rounded-lg p-6 text-sm text-muted-foreground">Choose a service to edit its fee and text. A service can be paid online only after you tick “Price confirmed”; until then the website shows “Price on request”.</p> : (
        <div className="glass space-y-4 rounded-lg p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Code" htmlFor="sv-code"><Input id="sv-code" value={sel.code} onChange={(e) => setSel({ ...sel, code: e.target.value.toUpperCase() })} disabled={!!list?.some((s) => s.code === sel.code)} /></Field>
            <Field label="Fee ₹ (incl. GST)" htmlFor="sv-price"><Input id="sv-price" type="number" min={1} step="1" value={rupees(sel.pricePaise)} onChange={(e) => setSel({ ...sel, pricePaise: toPaise(e.target.value), priceConfirmed: false })} /></Field>
            <Field label="Was ₹ (optional)" htmlFor="sv-mrp"><Input id="sv-mrp" type="number" min={0} value={rupees(sel.mrpPaise)} onChange={(e) => setSel({ ...sel, mrpPaise: e.target.value ? toPaise(e.target.value) : null })} /></Field>
            <Field label="Fee $ (outside India)" htmlFor="sv-usd" hint="Blank = ₹ only"><Input id="sv-usd" type="number" min={1} step="0.01" value={rupees(sel.usdCents)} placeholder="e.g. 29" onChange={(e) => setSel({ ...sel, usdCents: e.target.value ? toPaise(e.target.value) : null })} /></Field>
            <Field label="Was $ (optional)" htmlFor="sv-usdmrp"><Input id="sv-usdmrp" type="number" min={0} step="0.01" value={rupees(sel.usdMrpCents)} onChange={(e) => setSel({ ...sel, usdMrpCents: e.target.value ? toPaise(e.target.value) : null })} /></Field>
            <Field label="Order on page" htmlFor="sv-sort"><Input id="sv-sort" type="number" min={0} value={sel.sort} onChange={(e) => setSel({ ...sel, sort: Number(e.target.value) })} /></Field>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={sel.priceConfirmed} onChange={(e) => setSel({ ...sel, priceConfirmed: e.target.checked })} />Price confirmed – accept online payment</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={sel.active} onChange={(e) => setSel({ ...sel, active: e.target.checked })} />Show on website</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={sel.featured} onChange={(e) => setSel({ ...sel, featured: e.target.checked })} />Featured</label>
          </div>
          {(['en', 'hi'] as const).map((lang) => (
            <fieldset key={lang} className="space-y-2 rounded-md border border-border/60 p-3"><legend className="px-1 text-sm font-semibold">{lang === 'en' ? 'English' : 'Hindi (हिंदी)'}</legend>
              <Field label="Service name"><Input value={sel[lang].name} onChange={(e) => T(lang, 'name', e.target.value)} /></Field>
              <Field label="Short description"><Input value={sel[lang].short} onChange={(e) => T(lang, 'short', e.target.value)} /></Field>
              <Field label="What's included (one per line)"><textarea rows={4} value={sel[lang].includes.join('\n')} onChange={(e) => setSel({ ...sel, [lang]: { ...sel[lang], includes: e.target.value.split('\n').map((x) => x.trimStart()).filter((x, i, a) => x || i < a.length - 1) } })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></Field>
              <Field label="Delivery time"><Input value={sel[lang].delivery} onChange={(e) => T(lang, 'delivery', e.target.value)} /></Field>
            </fieldset>
          ))}
          <Field label="Details asked from the customer before payment"><div className="flex flex-wrap gap-3 text-sm">{INTAKE.map((f) => <label key={f.k} className="flex items-center gap-1.5"><input type="checkbox" checked={sel.intake.includes(f.k)} onChange={(e) => setSel({ ...sel, intake: e.target.checked ? [...sel.intake, f.k] : sel.intake.filter((x) => x !== f.k) })} />{f.label}</label>)}</div></Field>
          <div className="flex flex-wrap gap-2"><Button variant="gold" onClick={save}><Save className="h-4 w-4" /> Save</Button>{list?.some((s) => s.code === sel.code) && <Button variant="ghost" onClick={remove}><Trash2 className="h-4 w-4 text-danger" /> Delete</Button>}</div>
          {msg && <p className={cn('text-sm', msg.ok ? 'text-success' : 'text-danger')} role="status">{msg.text}</p>}
        </div>
      )}
    </div>
  );
}
