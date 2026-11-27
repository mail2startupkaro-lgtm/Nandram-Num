'use client';
/**
 * Admin → Affiliate Marketing.
 * Affiliates: applications to approve, codes, personal rates, payout details and "Pay now".
 * Commissions: every referred sale (on hold / available / paid / cancelled) – cancel for refunds.
 * Payouts: history of transfers. Settings: commission, tracking days, hold, minimum payout, customer discount.
 */
import * as React from 'react';
import { Check, Copy, Loader2, Save, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import { money } from '@/lib/affiliate/program';
import { cn } from '@/lib/utils';

type Sum = Record<string, number>;
interface Settings { enabled: boolean; defaultPercent: number; cookieDays: number; holdDays: number; minPayoutInr: number; minPayoutUsd: number; customerDiscountPercent: number }
interface Aff {
  id: string; code: string; status: string; name: string | null; email: string | null; phone: string | null; channel: string | null; audience: string | null; promotion: string | null;
  commissionPercent: number | null; ratePercent: number; adminNote: string | null; createdAt: string; approvedAt: string | null; payoutMethod: string | null;
  payout: { upi?: string; accountName?: string; accountNumber?: string; ifsc?: string; bankName?: string } | null;
  clicks: number; orders: number; sales: Sum; onHold: Sum; available: Sum; paid: Sum;
}
interface Totals { affiliates: { total: number; pending: number; approved: number }; clicks30: number; orders: number; sales: Sum; onHold: Sum; available: Sum; paid: Sum }
const sumText = (m: Sum | undefined) => { const e = Object.entries(m ?? {}).filter(([, v]) => v > 0); return e.length ? e.map(([c, v]) => money(v, c)).join(' + ') : '₹0'; };
const dt = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '–');
const ERR: Record<string, string> = { CODE_TAKEN: 'That code is already used by another affiliate or coupon.', CODE_INVALID: 'Codes are 4–20 letters or digits.', NOTHING_TO_PAY: 'Nothing is available to pay yet (commissions are still on hold or already paid).', CANNOT_CHANGE: 'Paid commissions cannot be changed.' };
const errText = (e: unknown) => (e instanceof ApiError ? ERR[e.body.error ?? ''] ?? e.message : 'Something went wrong');
const STATUS_TONE: Record<string, 'good' | 'warn' | 'bad' | 'gold' | 'default'> = { approved: 'good', pending: 'warn', rejected: 'bad', suspended: 'bad', paid: 'good', available: 'gold', on_hold: 'warn', cancelled: 'bad' };
const LABEL: Record<string, string> = { on_hold: 'On hold', available: 'Available', paid: 'Paid', cancelled: 'Cancelled', approved: 'Approved', pending: 'Pending review', rejected: 'Rejected', suspended: 'Suspended' };
const AUD: Record<string, string> = { under1k: '< 1k', '1k-10k': '1k–10k', '10k-50k': '10k–50k', '50k-1L': '50k–1L', over1L: '1L+', offline: 'Offline / clients' };

function Copyable({ text }: { text: string }) {
  const [ok, setOk] = React.useState(false);
  return <button type="button" className="ml-1 inline-flex align-middle text-muted-foreground hover:text-gold" aria-label="Copy" onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1200); } catch { /* ignore */ } }}>{ok ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}</button>;
}

function TotalsBar({ t }: { t: Totals }) {
  const items = [['Affiliates', `${t.affiliates.approved} active`, t.affiliates.pending ? `${t.affiliates.pending} to review` : `${t.affiliates.total} in total`], ['Clicks (30 days)', String(t.clicks30), ''], ['Referred orders', String(t.orders), sumText(t.sales) + ' sales'], ['Commission on hold', sumText(t.onHold), ''], ['To pay now', sumText(t.available), ''], ['Paid out', sumText(t.paid), '']];
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{items.map(([k, v, s]) => <div key={k} className="glass rounded-lg p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{k}</p><p className="font-serif text-xl font-bold text-gold">{v}</p>{s && <p className="text-xs text-muted-foreground">{s}</p>}</div>)}</div>;
}

function AffiliateCard({ a, s, onChanged }: { a: Aff; s: Settings; onChanged: () => void }) {
  const [code, setCode] = React.useState(a.code);
  const [rate, setRate] = React.useState(a.commissionPercent == null ? '' : String(a.commissionPercent));
  const [note, setNote] = React.useState(a.adminNote ?? '');
  const [ref, setRef] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; t: string } | null>(null);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setBusy(true); setMsg(null); try { await fn(); setMsg({ ok: true, t: ok }); onChanged(); } catch (e) { setMsg({ ok: false, t: errText(e) }); } finally { setBusy(false); } };
  const patch = (b: Record<string, unknown>, ok: string) => run(() => api('/api/admin/affiliates', { method: 'PATCH', json: { id: a.id, ...b } }), ok);
  const pay = (currency: 'INR' | 'USD') => run(() => api('/api/admin/affiliates/payouts', { method: 'POST', json: { affiliateId: a.id, currency, method: a.payoutMethod === 'bank' ? 'Bank transfer' : 'UPI', reference: ref || undefined } }), 'Payout recorded – commissions marked paid');
  const p = a.payout;
  const min = (c: string) => (c === 'USD' ? s.minPayoutUsd : s.minPayoutInr) * 100;
  const dirty = code !== a.code || rate !== (a.commissionPercent == null ? '' : String(a.commissionPercent)) || note !== (a.adminNote ?? '');
  return (
    <article className={cn('glass space-y-3 rounded-xl border p-4', a.status === 'pending' ? 'border-gold/60' : 'border-border')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{a.name ?? '—'} <Badge tone={STATUS_TONE[a.status]} className="ml-1">{LABEL[a.status] ?? a.status}</Badge> <span className="ml-1 font-mono text-sm text-gold">{a.code}</span></p>
          <p className="text-xs text-muted-foreground">{a.email ?? ''}{a.phone ? ` · ${a.phone}` : ''} · applied {dt(a.createdAt)}{a.approvedAt ? ` · approved ${dt(a.approvedAt)}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {a.status !== 'approved' && <Button size="sm" variant="gold" disabled={busy} onClick={() => patch({ status: 'approved' }, 'Approved – link and coupon are live')}><Check className="h-4 w-4" />Approve</Button>}
          {a.status === 'pending' && <Button size="sm" variant="outline" disabled={busy} onClick={() => patch({ status: 'rejected' }, 'Rejected')}><X className="h-4 w-4" />Reject</Button>}
          {a.status === 'approved' && <Button size="sm" variant="outline" disabled={busy} onClick={() => { if (confirm('Pause this affiliate? Their link and coupon stop working; earned commissions stay.')) patch({ status: 'suspended' }, 'Suspended'); }}>Suspend</Button>}
        </div>
      </div>
      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {a.channel && <div className="sm:col-span-2"><dt className="inline text-muted-foreground">Promotes on: </dt><dd className="inline break-all">{/^https?:\/\//.test(a.channel) ? <a href={a.channel} target="_blank" rel="noopener noreferrer" className="text-gold underline">{a.channel}</a> : a.channel}</dd></div>}
        {a.audience && <div><dt className="inline text-muted-foreground">Audience: </dt><dd className="inline">{AUD[a.audience] ?? a.audience}</dd></div>}
        {a.promotion && <div className="sm:col-span-2"><dt className="inline text-muted-foreground">Plan: </dt><dd className="inline whitespace-pre-wrap">{a.promotion}</dd></div>}
        <div><dt className="inline text-muted-foreground">Clicks · orders: </dt><dd className="inline">{a.clicks} · {a.orders} ({sumText(a.sales)} sales)</dd></div>
        <div><dt className="inline text-muted-foreground">On hold · available · paid: </dt><dd className="inline">{sumText(a.onHold)} · <b className="text-gold">{sumText(a.available)}</b> · {sumText(a.paid)}</dd></div>
        <div className="sm:col-span-2"><dt className="inline text-muted-foreground">Payout to: </dt><dd className="inline">{!p ? <span className="text-warning">not added yet</span> : a.payoutMethod === 'upi' ? <>UPI <b>{p.upi}</b><Copyable text={p.upi ?? ''} /></> : <>{p.accountName} · A/c <b>{p.accountNumber}</b><Copyable text={p.accountNumber ?? ''} /> · IFSC <b>{p.ifsc}</b><Copyable text={p.ifsc ?? ''} />{p.bankName ? ` · ${p.bankName}` : ''}</>}</dd></div>
      </dl>
      {Object.entries(a.available).some(([, v]) => v > 0) && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-gold/40 bg-gold/5 p-3">
          <Field label="Transfer reference (UTR)" htmlFor={`ref-${a.id}`} className="min-w-[200px] flex-1"><Input id={`ref-${a.id}`} value={ref} onChange={(e) => setRef(e.target.value)} maxLength={80} placeholder="e.g. UPI ref / UTR no." /></Field>
          {Object.entries(a.available).filter(([, v]) => v > 0).map(([c, v]) => (
            <Button key={c} size="sm" variant="gold" disabled={busy || !p} title={!p ? 'The affiliate has not added payout details' : v < min(c) ? 'Below the minimum payout – you can still pay' : ''} onClick={() => { if (confirm(`Record a payout of ${money(v, c)} to ${a.name}? Send the money first, then record it here.`)) pay(c as 'INR' | 'USD'); }}>
              <Wallet className="h-4 w-4" />Mark {money(v, c)} paid{v < min(c) ? ' (below min.)' : ''}
            </Button>
          ))}
        </div>
      )}
      <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Code, personal rate, note</summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-[160px_160px_1fr_auto] sm:items-end">
          <Field label="Code / coupon" htmlFor={`c-${a.id}`}><Input id={`c-${a.id}`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={20} /></Field>
          <Field label={`Rate % (default ${s.defaultPercent})`} htmlFor={`r-${a.id}`}><Input id={`r-${a.id}`} type="number" min={0} max={90} value={rate} onChange={(e) => setRate(e.target.value)} placeholder={String(s.defaultPercent)} /></Field>
          <Field label="Internal note" htmlFor={`n-${a.id}`}><Input id={`n-${a.id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} /></Field>
          <Button size="sm" variant="outline" disabled={busy || !dirty} onClick={() => patch({ code, commissionPercent: rate === '' ? null : Number(rate), adminNote: note }, 'Saved')}><Save className="h-4 w-4" />Save</Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Changing the code turns off the old link and coupon. A personal rate applies to new sales only.</p>
      </details>
      {msg && <p className={cn('text-sm', msg.ok ? 'text-success' : 'text-danger')} role="status">{busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : msg.t}</p>}
    </article>
  );
}

function AffiliatesList() {
  const [d, setD] = React.useState<{ affiliates: Aff[]; totals: Totals; settings: Settings } | null>(null);
  const [filter, setFilter] = React.useState('all');
  const [q, setQ] = React.useState('');
  const load = React.useCallback(() => { api<{ affiliates: Aff[]; totals: Totals; settings: Settings }>('/api/admin/affiliates').then(setD).catch(() => setD(null)); }, []);
  React.useEffect(load, [load]);
  if (!d) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  const list = d.affiliates.filter((a) => (filter === 'all' || (filter === 'topay' ? Object.values(a.available).some((v) => v > 0) : a.status === filter)) && (!q || `${a.name} ${a.email} ${a.code} ${a.phone}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-5">
      <TotalsBar t={d.totals} />
      <div className="glass flex flex-wrap items-end gap-3 rounded-lg p-4">
        <Field label="Show" htmlFor="af-f"><Select id="af-f" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All ({d.affiliates.length})</option><option value="pending">Pending review ({d.totals.affiliates.pending})</option><option value="approved">Approved</option><option value="topay">To pay now</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option></Select></Field>
        <Field label="Search" htmlFor="af-q" className="min-w-[200px] flex-1"><Input id="af-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, code" /></Field>
        <a href="/affiliate-program" target="_blank" className="text-sm text-gold underline-offset-2 hover:underline">Open the public program page ↗</a>
      </div>
      {!d.settings.enabled && <p className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">The program is switched off: new applications are closed and links do not earn. Turn it on in Program settings.</p>}
      {list.length ? list.map((a) => <AffiliateCard key={a.id} a={a} s={d.settings} onChanged={load} />) : <p className="glass rounded-lg p-5 text-sm text-muted-foreground">No affiliates here yet. Share the program page (footer → “Affiliate Program”) with creators and clients.</p>}
    </div>
  );
}

function CommissionsList() {
  type C = { id: string; code: string; name: string | null; planCode: string; source: string; currency: string; salePaise: number; ratePercent: number; commissionPaise: number; status: string; display: string; earnedAt: string | null; paidAt: string | null };
  const [status, setStatus] = React.useState('all');
  const [rows, setRows] = React.useState<C[] | null>(null);
  const [msg, setMsg] = React.useState('');
  const load = React.useCallback(() => { api<{ commissions: C[] }>(`/api/admin/affiliates/commissions?status=${status}`).then((r) => setRows(r.commissions)).catch(() => setRows([])); }, [status]);
  React.useEffect(load, [load]);
  const set = async (id: string, st: 'cancelled' | 'pending') => { setMsg(''); try { await api('/api/admin/affiliates/commissions', { method: 'PATCH', json: { id, status: st } }); load(); } catch (e) { setMsg(errText(e)); } };
  return (
    <div className="glass space-y-3 rounded-lg p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Commissions</h2><p className="text-sm text-muted-foreground">One row per paid order that came through an affiliate. Cancel a commission when you refund the order.</p></div>
        <Field label="Status" htmlFor="cm-s"><Select id="cm-s" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option><option value="on_hold">On hold</option><option value="available">Available to pay</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></Select></Field>
      </div>
      {msg && <p className="text-sm text-danger">{msg}</p>}
      {!rows ? <div className="h-24 animate-pulse rounded bg-muted" /> : !rows.length ? <p className="text-sm text-muted-foreground">No commissions.</p> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-3">Date</th><th className="pr-3">Affiliate</th><th className="pr-3">Product</th><th className="pr-3">Via</th><th className="pr-3 text-right">Order excl. GST</th><th className="pr-3 text-right">Rate</th><th className="pr-3 text-right">Commission</th><th className="pr-3">Status</th><th /></tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id} className="border-b border-border/50">
              <td className="py-2 pr-3">{dt(c.earnedAt)}</td><td className="pr-3">{c.name} <span className="font-mono text-xs text-gold">{c.code}</span></td><td className="pr-3">{c.planCode}</td><td className="pr-3">{c.source}</td>
              <td className="pr-3 text-right">{money(c.salePaise, c.currency)}</td><td className="pr-3 text-right">{c.ratePercent}%</td><td className="pr-3 text-right font-semibold">{money(c.commissionPaise, c.currency)}</td>
              <td className="pr-3"><Badge tone={STATUS_TONE[c.display]}>{LABEL[c.display] ?? c.display}</Badge></td>
              <td className="text-right">{c.status === 'pending' ? <Button size="sm" variant="ghost" onClick={() => { if (confirm('Cancel this commission (e.g. the order was refunded)?')) set(c.id, 'cancelled'); }}>Cancel</Button> : c.status === 'cancelled' ? <Button size="sm" variant="ghost" onClick={() => set(c.id, 'pending')}>Restore</Button> : null}</td>
            </tr>))}</tbody>
        </table></div>
      )}
    </div>
  );
}

function PayoutsList() {
  type P = { p: { id: string; currency: string; amountPaise: number; method: string | null; reference: string | null; note: string | null; createdAt: string }; code: string; name: string | null };
  const [rows, setRows] = React.useState<P[] | null>(null);
  React.useEffect(() => { api<{ payouts: P[] }>('/api/admin/affiliates/payouts').then((r) => setRows(r.payouts)).catch(() => setRows([])); }, []);
  const total: Sum = {}; for (const r of rows ?? []) total[r.p.currency] = (total[r.p.currency] ?? 0) + r.p.amountPaise;
  return (
    <div className="glass space-y-3 rounded-lg p-5">
      <h2 className="text-xl font-semibold">Payouts</h2>
      <p className="text-sm text-muted-foreground">Transfers you have recorded. To pay someone, open Affiliates → filter “To pay now”, send the money by UPI / bank, then press “Mark … paid” with the reference.</p>
      {!rows ? <div className="h-24 animate-pulse rounded bg-muted" /> : !rows.length ? <p className="text-sm text-muted-foreground">No payouts yet.</p> : (
        <>
          <p className="text-sm">Total paid: <b className="text-gold">{sumText(total)}</b></p>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-3">Date</th><th className="pr-3">Affiliate</th><th className="pr-3">Method</th><th className="pr-3">Reference</th><th className="text-right">Amount</th></tr></thead>
            <tbody>{rows.map(({ p, code, name }) => <tr key={p.id} className="border-b border-border/50"><td className="py-2 pr-3">{dt(p.createdAt)}</td><td className="pr-3">{name} <span className="font-mono text-xs text-gold">{code}</span></td><td className="pr-3">{p.method ?? '–'}</td><td className="pr-3">{p.reference ?? '–'}</td><td className="text-right font-semibold">{money(p.amountPaise, p.currency)}</td></tr>)}</tbody>
          </table></div>
        </>
      )}
    </div>
  );
}

function ProgramSettings() {
  const [v, setV] = React.useState<Settings | null>(null);
  const [msg, setMsg] = React.useState<{ ok: boolean; t: string } | null>(null);
  React.useEffect(() => { api<{ affiliate: Settings }>('/api/admin/settings').then((r) => setV(r.affiliate)); }, []);
  if (!v) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  const n = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: Number(e.target.value) });
  const save = async () => { setMsg(null); try { await api('/api/admin/settings', { method: 'PUT', json: { key: 'affiliate', value: v } }); setMsg({ ok: true, t: 'Saved' }); } catch (e) { setMsg({ ok: false, t: errText(e) }); } };
  return (
    <div className="glass space-y-5 rounded-lg p-5">
      <div><h2 className="text-xl font-semibold">Program settings</h2><p className="text-sm text-muted-foreground">These rules are shown on the public program page and used for every new sale. Commissions already earned keep their rate.</p></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.enabled} onChange={(e) => setV({ ...v, enabled: e.target.checked })} /> Program open (accept applications, links earn commission)</label>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Commission %" htmlFor="as-p" hint="Of the order value excluding GST"><Input id="as-p" type="number" min={1} max={90} value={v.defaultPercent} onChange={n('defaultPercent')} /></Field>
        <Field label="Customer discount with affiliate code %" htmlFor="as-d" hint="0 = no coupon codes"><Input id="as-d" type="number" min={0} max={50} value={v.customerDiscountPercent} onChange={n('customerDiscountPercent')} /></Field>
        <Field label="Link tracking (days)" htmlFor="as-c" hint="Sale counts if bought within this many days of the click"><Input id="as-c" type="number" min={1} max={90} value={v.cookieDays} onChange={n('cookieDays')} /></Field>
        <Field label="Hold period (days)" htmlFor="as-h" hint="Refund window before a commission can be paid"><Input id="as-h" type="number" min={0} max={60} value={v.holdDays} onChange={n('holdDays')} /></Field>
        <Field label="Minimum payout (₹)" htmlFor="as-mi"><Input id="as-mi" type="number" min={0} value={v.minPayoutInr} onChange={n('minPayoutInr')} /></Field>
        <Field label="Minimum payout ($)" htmlFor="as-mu"><Input id="as-mu" type="number" min={0} value={v.minPayoutUsd} onChange={n('minPayoutUsd')} /></Field>
      </div>
      <p className="text-xs text-muted-foreground">A new customer discount applies to coupons created from now on (when you approve an affiliate). To update an existing affiliate&apos;s coupon, edit it in Sales &amp; Accounts → Coupons.</p>
      <Button onClick={save}><Save className="h-4 w-4" />Save settings</Button>
      {msg && <p className={cn('text-sm', msg.ok ? 'text-success' : 'text-danger')} role="status">{msg.t}</p>}
    </div>
  );
}

export function AffiliatesAdmin({ view }: { view: 'affiliates' | 'commissions' | 'payouts' | 'settings' }) {
  return view === 'affiliates' ? <AffiliatesList /> : view === 'commissions' ? <CommissionsList /> : view === 'payouts' ? <PayoutsList /> : <ProgramSettings />;
}
