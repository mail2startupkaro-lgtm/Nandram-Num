'use client';
import { STANDARD_USD } from '@/lib/billing/currency';
import * as React from 'react';
import { Download, FileUp, ImageIcon, Mail, MessageCircle, Pause, Phone, Play, Plus, RefreshCw, Save, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError, download } from '@/lib/client/api';
import { deliveryState, isAutoService } from '@/lib/service-delivery';
import type { Service, ServiceIntakeField } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/billing/currency';

const INTAKE: { k: ServiceIntakeField; label: string }[] = [
  { k: 'clientName', label: 'Full name' }, { k: 'currentName', label: 'Current name spelling' }, { k: 'dob', label: 'Date of birth' }, { k: 'gender', label: 'Gender' },
  { k: 'maritalStatus', label: 'Marital status' },
  { k: 'tob', label: 'Time of birth' }, { k: 'pob', label: 'Place of birth' }, { k: 'mobile', label: 'Mobile to analyse' }, { k: 'parents', label: "Parents' names" },
  { k: 'letters', label: 'Preferred letters' }, { k: 'partnerName', label: "Partner's name" }, { k: 'partnerDob', label: "Partner's DOB" }, { k: 'businesses', label: 'Businesses considering / type' }, { k: 'businessName', label: 'Business names' }, { k: 'launchDate', label: 'Business opening date' }, { k: 'partners', label: 'Business partners' }, { k: 'brand', label: 'Brand colours / tagline' },
  { k: 'challenges', label: 'Problems & challenges facing' },
  { k: 'questions', label: 'Questions / notes' },
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

export interface Order { id: string; serviceCode: string; status: string; adminNote: string | null; createdAt: string; deliveredAt: string | null; details: Record<string, string>; payment: { amountPaise: number; currency?: string; invoiceNumber: string | null; billingName: string | null; paidAt: string | null }; userId: string | null; /** The client uploaded a signature photo with the booking (fetch with ?image=<id>). */ hasSignatureImage?: boolean; /** A finished report PDF is stored on the order (client can download it). */ hasReportFile?: boolean; onHold?: boolean;
  hasReportEn?: boolean; hasReportHi?: boolean; /** The system can write this report from the booking details. */ canAuto?: boolean;
  deliveredBy?: 'admin' | 'auto' | null; deliveryError?: string | null; deliveryAttempts?: number; notifiedAt?: string | null;
  notify?: { sms?: NotifyResult; email?: NotifyResult } | null }
interface NotifyResult { ok: boolean; to?: string; error?: string; skipped?: string; at: string }

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
  const rows = [...(d.forRelation ? [['Reading for', d.forRelation === 'self' ? 'Customer themself' : `Customer's ${d.forRelation} (saved in their family list)`]] : []), ...(d.babyName ? [['Baby current name', d.babyName]] : []), ...(d.nameType ? [['Name wanted', d.nameType === 'formal' ? 'Formal name' : d.nameType === 'nickname' ? 'Nickname' : 'Formal name & nickname']] : []), ...INTAKE.filter((f) => d[f.k]).map((f) => [f.label, d[f.k]])];
  return (
    <article className={cn('glass rounded-xl border p-4', o.status === 'paid' ? 'border-gold/60' : 'border-border')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="font-semibold">{name} <Badge tone={o.status === 'delivered' ? 'good' : o.status === 'cancelled' ? 'bad' : o.status === 'paid' ? 'warn' : 'gold'} className="ml-1">{STATUS_LABEL[o.status]}</Badge></p>
          <p className="text-xs text-muted-foreground">{o.payment.paidAt ? `Paid ${new Date(o.payment.paidAt).toLocaleString('en-IN')}` : new Date(o.createdAt).toLocaleString('en-IN')} · {formatMoney(o.payment.amountPaise, o.payment.currency === 'USD' ? 'USD' : 'INR')}{o.payment.invoiceNumber ? ` · ${o.payment.invoiceNumber}` : ''} · billed to {o.payment.billingName ?? '—'}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {onGenerateReport && (
            <Button size="sm" variant="gold" onClick={() => onGenerateReport(o)} title={o.serviceCode === 'SVC_BUSINESS_COMPAT' ? 'Open in the Business compatibility report generator' : o.serviceCode === 'SVC_DESTINY_MATRIX' ? 'Open in Destiny Matrix analysis with the client details filled in' : o.serviceCode === 'SVC_BIRTH_CHART' ? 'Open in the Pythagorean birth chart generator with the client details filled in' : o.serviceCode === 'SVC_SIGNATURE' ? 'Open in Signature analysis with the client details filled in' : o.serviceCode === 'SVC_MOBILE_NUMBER' ? 'Open in Advanced mobile + DOB report with the client details filled in' : o.serviceCode === 'SVC_BABY_NAME' ? 'Open in Baby name analysis with the baby details filled in' : 'Generate tailored service report in Report Studio'}>
              <Sparkles className="h-4 w-4" /> Generate Report
            </Button>
          )}
          <Select value={o.status} onChange={(e) => patch({ status: e.target.value }, e.target.value === 'delivered' ? 'Approved – delivered to the client (English + Hindi) and notified' : 'Status updated')} className="h-8 w-40 text-sm" aria-label="Status">{STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</Select>
        </div>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{rows.map(([k, v]) => <div key={k} className={k === 'Questions / notes' ? 'sm:col-span-2' : ''}><dt className="inline text-muted-foreground">{k}: </dt><dd className="inline whitespace-pre-wrap">{v}</dd></div>)}</dl>
      <OrderDelivery o={o} onChanged={onChanged} patch={patch} />
      {o.hasSignatureImage && <OrderSignaturePhoto id={o.id} name={d.clientName ?? d.currentName ?? 'client'} />}
      {o.serviceCode === 'SVC_SIGNATURE' && !o.hasSignatureImage && <p className="mt-2 text-xs text-muted-foreground">No signature photo uploaded – ask the client to send it on WhatsApp.</p>}
      {wa.length >= 10 && <div className="mt-2 flex gap-3 text-sm"><a href={`tel:${d.mobile}`} className="inline-flex items-center gap-1 hover:text-gold"><Phone className="h-4 w-4 text-gold" />{d.mobile}</a><a href={`https://wa.me/${wa.length === 10 ? `91${wa}` : wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-success"><MessageCircle className="h-4 w-4" />WhatsApp</a></div>}
      <p className="mt-1 text-xs text-muted-foreground"><Mail className="mr-1 inline h-3 w-3" />Customer contact (email / mobile) is on the customer's account – see Users.</p>
      <div className="mt-3 flex flex-wrap items-end gap-2"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} placeholder="Internal note" aria-label="Internal note" className="min-w-[240px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <Button size="sm" variant="outline" disabled={note === (o.adminNote ?? '')} onClick={() => patch({ adminNote: note }, 'Note saved')}><Save className="h-4 w-4" /> Save note</Button></div>
      {msg && <p className="mt-1 text-xs text-muted-foreground" role="status">{msg}</p>}
    </article>
  );
}

/**
 * Client delivery. Approve (or upload the finished PDF) to deliver now; otherwise the system writes the report and
 * delivers it automatically 3 hours after payment. Every delivery: English + Hindi in the client's report area, then SMS + email.
 */
function OrderDelivery({ o, onChanged, patch }: { o: Order; onChanged: () => void; patch: (b: Record<string, unknown>, ok: string) => Promise<void> }) {
  const auto = o.canAuto ?? isAutoService(o.serviceCode);
  const dl = deliveryState({ status: o.status, paidAt: o.payment.paidAt, deliveredAt: o.deliveredAt, onHold: o.onHold, hasFile: !!o.hasReportFile, auto });
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [upLang, setUpLang] = React.useState<'en' | 'hi'>('en');
  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const when = (s: string) => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const delivered = o.status === 'delivered';
  async function upload(f: File) {
    setErr(null); setInfo(null);
    if (f.type && f.type !== 'application/pdf') { setErr('Choose a PDF file.'); return; }
    if (f.size > 15 * 1024 * 1024) { setErr('The PDF is larger than 15 MB.'); return; }
    setBusy('upload');
    try {
      const b64 = await new Promise<string>((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result).replace(/^data:[^,]*,/, '')); r.onerror = () => bad(r.error); r.readAsDataURL(f); });
      await api('/api/admin/service-orders', { method: 'PUT', json: { id: o.id, fileName: f.name, pdf: b64, lang: upLang } });
      setInfo(`${upLang === 'hi' ? 'Hindi' : 'English'} PDF saved and delivered. ${auto ? 'The other language is written by the system and' : 'The client'} is notified by SMS + email in a minute.`);
      onChanged(); setTimeout(onChanged, 60_000);
    } catch (e) { setErr(e instanceof ApiError && e.body.error === 'NOT_A_PDF' ? 'That file is not a PDF.' : e instanceof ApiError && e.status === 413 ? 'The file is too large for the server.' : 'Upload failed. Please try again.'); }
    finally { setBusy(null); }
  }
  async function action(a: 'approve' | 'retry' | 'renotify') {
    setErr(null); setInfo(null); setBusy(a);
    try {
      const r = await api<{ ok: boolean; delivery: { result: string; error?: string; reason?: string; notify?: Order['notify'] } }>('/api/admin/service-orders', { method: 'POST', json: { id: o.id, action: a } });
      setInfo(r.delivery.result === 'delivered' ? 'Delivered to the client (English + Hindi) and notified.' : r.delivery.result === 'notified' ? 'Notification sent.' : `Nothing to do (${r.delivery.reason ?? r.delivery.result}).`);
      onChanged();
    } catch (e) { setErr(e instanceof ApiError ? `Could not deliver: ${((e.body as Record<string, unknown>).delivery as { error?: string } | undefined)?.error ?? e.message}` : 'Could not deliver.'); onChanged(); }
    finally { setBusy(null); }
  }
  const channel = (label: string, c?: NotifyResult) => !c ? null : (
    <span className={cn('inline-flex items-center gap-1', c.ok ? 'text-success' : c.skipped ? 'text-muted-foreground' : 'text-danger')}>
      {label} {c.ok ? `✓ ${c.to ?? ''}` : c.skipped ? `– ${c.skipped}` : `✗ ${c.error ?? 'failed'}`}
    </span>
  );
  if (o.status === 'cancelled') return null;
  return (
    <div className="mt-3 space-y-2 rounded-lg border border-border/70 bg-background/40 p-3 text-sm">
      <p className="font-medium">Client delivery {auto ? <Badge tone="gold" className="ml-1">Auto-delivers after 3 h</Badge> : <Badge tone="warn" className="ml-1">Needs your PDF</Badge>}
        {delivered && o.deliveredBy && <Badge tone={o.deliveredBy === 'admin' ? 'good' : 'gold'} className="ml-1">{o.deliveredBy === 'admin' ? 'Approved by admin' : 'Delivered automatically'}</Badge>}</p>
      <p className="text-xs text-muted-foreground">
        {dl.state === 'ready'
          ? (delivered ? `In the client's report area since ${when(o.deliveredAt ?? dl.readyAt)}.` : `3-hour mark passed ${when(dl.readyAt)} – being delivered automatically now.`)
          : dl.state === 'preparing'
            ? (o.onHold ? 'On hold – will NOT be delivered automatically until you remove the hold or approve it.'
              : auto ? `Waiting for your approval. If not approved by ${when(dl.readyAt)}, the system writes the report and delivers it automatically in English + Hindi, then sends the client an SMS and email.`
                : `Due ${when(dl.readyAt)}. The system cannot write this report from the booking (missing details${o.serviceCode === 'SVC_SIGNATURE' ? ' or signature photo' : ''}) – upload the finished PDF to deliver it.${dl.overdue ? ' (overdue)' : ''}`)
            : 'Waiting for payment.'}
      </p>
      <p className="text-xs">Stored: English {o.hasReportEn ? '✓' : '–'} · Hindi {o.hasReportHi ? '✓' : '–'}{(o.notify?.sms || o.notify?.email) && <> · Notified: {channel('SMS', o.notify?.sms)} · {channel('Email', o.notify?.email)}</>}</p>
      {o.deliveryError && <p className="rounded bg-danger/10 p-2 text-xs text-danger">Last delivery problem{o.deliveryAttempts ? ` (attempt ${o.deliveryAttempts})` : ''}: {o.deliveryError}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {!delivered && (auto || o.hasReportFile) && <Button size="sm" variant="gold" disabled={!!busy} onClick={() => action('approve')}><Send className="h-4 w-4" /> {busy === 'approve' ? 'Delivering… (up to 2 min)' : 'Approve & deliver now'}</Button>}
        {o.hasReportEn && <Button size="sm" variant="outline" onClick={() => download(`/api/admin/service-orders?report=${encodeURIComponent(o.id)}&lang=en`).catch(() => setErr('Could not download.'))}><Download className="h-4 w-4" /> English PDF</Button>}
        {o.hasReportHi && <Button size="sm" variant="outline" onClick={() => download(`/api/admin/service-orders?report=${encodeURIComponent(o.id)}&lang=hi`).catch(() => setErr('Could not download.'))}><Download className="h-4 w-4" /> Hindi PDF</Button>}
        <span className="inline-flex items-center gap-1">
          <Select value={upLang} onChange={(e) => setUpLang(e.target.value as 'en' | 'hi')} className="h-8 w-28 text-sm" aria-label="Language of the PDF to upload"><option value="en">English</option><option value="hi">Hindi</option></Select>
          <Button size="sm" variant={auto ? 'outline' : 'gold'} disabled={!!busy} onClick={() => fileRef.current?.click()}><FileUp className="h-4 w-4" /> {busy === 'upload' ? 'Uploading…' : (upLang === 'en' ? o.hasReportEn : o.hasReportHi) ? 'Replace PDF' : 'Upload PDF'}</Button>
        </span>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
        {o.hasReportFile && <Button size="sm" variant="ghost" className="text-danger" onClick={async () => { if (!confirm('Remove the stored report PDFs (English and Hindi) from this order?')) return; try { await api(`/api/admin/service-orders?id=${encodeURIComponent(o.id)}`, { method: 'DELETE' }); onChanged(); } catch { setErr('Could not remove.'); } }}><Trash2 className="h-4 w-4" /> Remove PDFs</Button>}
        {dl.state === 'preparing' && (o.onHold
          ? <Button size="sm" variant="ghost" onClick={() => patch({ onHold: false }, 'Hold removed')}><Play className="h-4 w-4" /> Remove hold</Button>
          : <Button size="sm" variant="ghost" onClick={() => patch({ onHold: true }, 'On hold')}><Pause className="h-4 w-4" /> Hold</Button>)}
        {o.deliveryError && !delivered && <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => action('retry')}><RefreshCw className="h-4 w-4" /> {busy === 'retry' ? 'Retrying…' : 'Retry now'}</Button>}
        {delivered && <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => action('renotify')}><MessageCircle className="h-4 w-4" /> {busy === 'renotify' ? 'Sending…' : 'Send SMS + email again'}</Button>}
      </div>
      {info && <p className="text-xs text-success" role="status">{info}</p>}
      {err && <p className="text-xs text-danger" role="alert">{err}</p>}
    </div>
  );
}

/** The one signature photo the client uploaded with a Signature Analysis order (loaded on demand). */
function OrderSignaturePhoto({ id, name }: { id: string; name: string }) {
  const [img, setImg] = React.useState<string | null>(null);
  const [state, setState] = React.useState<'idle' | 'loading' | 'error'>('idle');
  const load = async () => { setState('loading'); try { const r = await api<{ image: string }>(`/api/admin/service-orders?image=${encodeURIComponent(id)}`); setImg(r.image); setState('idle'); } catch { setState('error'); } };
  const ext = img?.startsWith('data:image/png') ? 'png' : img?.startsWith('data:image/webp') ? 'webp' : 'jpg';
  return (
    <div className="mt-3 rounded-lg border border-gold/40 bg-gold/5 p-3 text-sm">
      <p className="mb-2 flex items-center gap-1 font-medium"><ImageIcon className="h-4 w-4 text-gold" />Signature photo uploaded by the client</p>
      {img ? (
        <div className="flex flex-wrap items-end gap-3">
          <img src={img} alt={`Signature of ${name}`} className="max-h-48 max-w-full rounded border border-border bg-white object-contain p-1" />
          <a href={img} download={`signature-${name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client'}.${ext}`} className="inline-flex items-center gap-1 text-gold hover:underline"><Download className="h-4 w-4" />Download</a>
        </div>
      ) : <Button size="sm" variant="outline" disabled={state === 'loading'} onClick={load}>{state === 'loading' ? 'Loading…' : 'Show photo'}</Button>}
      {state === 'error' && <p className="mt-1 text-xs text-danger">Could not load the photo.</p>}
    </div>
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
            <Field label="Fee $ (outside India)" htmlFor="sv-usd" hint={STANDARD_USD[sel.code] ? `Blank = standard $${STANDARD_USD[sel.code][0] / 100}` : 'Blank = ₹ only'}><Input id="sv-usd" type="number" min={1} step="0.01" value={rupees(sel.usdCents)} placeholder={STANDARD_USD[sel.code] ? String(STANDARD_USD[sel.code][0] / 100) : 'e.g. 29'} onChange={(e) => setSel({ ...sel, usdCents: e.target.value ? toPaise(e.target.value) : null })} /></Field>
            <Field label="Was $ (optional)" htmlFor="sv-usdmrp" hint={!sel.usdCents && STANDARD_USD[sel.code] ? `Blank = standard $${STANDARD_USD[sel.code][1] / 100}` : undefined}><Input id="sv-usdmrp" type="number" min={0} step="0.01" value={rupees(sel.usdMrpCents)} placeholder={STANDARD_USD[sel.code] ? String(STANDARD_USD[sel.code][1] / 100) : undefined} onChange={(e) => setSel({ ...sel, usdMrpCents: e.target.value ? toPaise(e.target.value) : null })} /></Field>
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
