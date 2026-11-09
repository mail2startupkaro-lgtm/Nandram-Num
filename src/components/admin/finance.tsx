'use client';
/** Admin → Sales report and Payment report (register, GST summary, audit checks). */
import * as React from 'react';
import { AlertTriangle, CheckCircle2, Download, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api } from '@/lib/client/api';
import { cn } from '@/lib/utils';

export const inr = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
const ist = (d: Date) => new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);
const istDT = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

function presets() {
  const now = new Date(); const t = ist(now);
  const y = Number(t.slice(0, 4)), m = Number(t.slice(5, 7));
  const first = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, '0')}-01`;
  const lastOf = (yy: number, mm: number) => ist(new Date(Date.UTC(yy, mm, 0, 12)));
  const pm = m === 1 ? [y - 1, 12] : [y, m - 1];
  const fyStart = m >= 4 ? y : y - 1;
  const qStartMonth = [4, 7, 10, 1][Math.floor(((m + 8) % 12) / 3)];
  const qYear = qStartMonth === 1 && m < 4 ? y : qStartMonth === 1 ? y + 1 : y;
  return [
    { id: 'today', label: 'Today', from: t, to: t },
    { id: '7d', label: 'Last 7 days', from: ist(new Date(now.getTime() - 6 * 86_400_000)), to: t },
    { id: '30d', label: 'Last 30 days', from: ist(new Date(now.getTime() - 29 * 86_400_000)), to: t },
    { id: 'month', label: 'This month', from: first(y, m), to: t },
    { id: 'lastMonth', label: 'Last month', from: first(pm[0], pm[1]), to: lastOf(pm[0], pm[1]) },
    { id: 'quarter', label: 'This quarter', from: first(qYear, qStartMonth), to: t },
    { id: 'fy', label: `FY ${fyStart}-${String(fyStart + 1).slice(2)}`, from: `${fyStart}-04-01`, to: t },
    { id: 'lastFy', label: `FY ${fyStart - 1}-${String(fyStart).slice(2)}`, from: `${fyStart - 1}-04-01`, to: `${fyStart}-03-31` },
  ];
}

function RangePicker({ v, onChange }: { v: { from: string; to: string }; onChange: (v: { from: string; to: string }) => void }) {
  const ps = React.useMemo(presets, []);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field label="Period"><Select value={ps.find((p) => p.from === v.from && p.to === v.to)?.id ?? 'custom'} onChange={(e) => { const p = ps.find((x) => x.id === e.target.value); if (p) onChange({ from: p.from, to: p.to }); }} className="w-40">
        {ps.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}<option value="custom">Custom</option></Select></Field>
      <Field label="From"><Input type="date" value={v.from} onChange={(e) => onChange({ ...v, from: e.target.value })} className="w-40" /></Field>
      <Field label="To"><Input type="date" value={v.to} onChange={(e) => onChange({ ...v, to: e.target.value })} className="w-40" /></Field>
    </div>
  );
}
const useRange = () => React.useState(() => { const p = presets().find((x) => x.id === 'month')!; return { from: p.from, to: p.to }; });

const Card = ({ title, children, className, action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) => (
  <section className={cn('glass rounded-lg p-5', className)}>{title && <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{title}</h2>{action}</div>}{children}</section>
);
const Stat = ({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: number | null }) => (
  <div className="glass rounded-lg p-4">
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-serif text-2xl font-bold text-gold">{value}</p>
    {(sub || delta !== undefined) && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
      {delta !== undefined && delta !== null && <span className={cn('inline-flex items-center gap-0.5', delta >= 0 ? 'text-success' : 'text-danger')}>{delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(delta)}%</span>}{sub}</p>}
  </div>
);
const T = ({ head, rows, empty = 'No data for this period.' }: { head: string[]; rows: React.ReactNode[][]; empty?: string }) => (
  <div className="overflow-x-auto"><table className="w-full text-sm">
    <thead><tr className="border-b border-border text-left text-muted-foreground">{head.map((h, i) => <th key={h} className={cn('py-2 pr-3 font-medium', i > 0 && 'text-right')}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-border/50">{r.map((c, j) => <td key={j} className={cn('py-1.5 pr-3', j > 0 && 'text-right tabular-nums')}>{c}</td>)}</tr>)}</tbody>
  </table>{!rows.length && <p className="py-3 text-sm text-muted-foreground">{empty}</p>}</div>
);
const csvHref = (params: Record<string, string>) => `/api/admin/finance?${new URLSearchParams({ ...params, format: 'csv' })}`;

type Sales = {
  range: { from: string; to: string; days: number; bucket: 'day' | 'month' };
  totals: { orders: number; gross: number; list: number; discount: number; taxable: number; cgst: number; sgst: number; igst: number; gst: number; customers: number; aov: number; newCustomers: number; repeatCustomers: number; avgPerDay: number };
  previous: { gross: number; orders: number; grossChangePct: number | null; ordersChangePct: number | null };
  series: { key: string; orders: number; gross: number; taxable: number }[];
  byPlan: { code: string; name: string; orders: number; gross: number; discount: number; taxable: number; share: number }[];
  byCoupon: { code: string; uses: number; discount: number; gross: number }[];
  byState: { state: string; orders: number; taxable: number; cgst: number; sgst: number; igst: number; gross: number }[];
  funnel: { attempts: number; paid: number; failed: number; pending: number; successRate: number | null; lostValue: number };
  topCustomers: { who: string; contact: string; orders: number; gross: number }[];
  credits: { issued: number; used: number; outstanding: number };
  subscriptions: { active: number; mrr: number; byPlan: { code: string; subs: number; mrr: number }[] };
};

export function SalesReport() {
  const [range, setRange] = useRange();
  const [s, setS] = React.useState<Sales | null>(null);
  const [loading, setLoading] = React.useState(false);
  const load = React.useCallback(() => { setLoading(true); api<Sales>(`/api/admin/finance?report=sales&from=${range.from}&to=${range.to}`).then(setS).finally(() => setLoading(false)); }, [range]);
  React.useEffect(() => { load(); }, [load]);
  const max = Math.max(1, ...(s?.series.map((x) => x.gross) ?? [1]));
  return (
    <div className="space-y-6">
      <Card title="Sales report" action={<div className="flex gap-2"><Button size="sm" variant="ghost" onClick={load}><RefreshCw className={cn(loading && 'animate-spin')} /> Refresh</Button><a href={csvHref({ report: 'sales', ...range })}><Button size="sm" variant="outline"><Download /> Export CSV</Button></a></div>}>
        <RangePicker v={range} onChange={setRange} />
        <p className="mt-2 text-xs text-muted-foreground">Sales are counted on the payment date (IST). Amounts include GST unless marked taxable. Compared with the previous {s?.range.days ?? ''} days.</p>
      </Card>
      {!s ? <div className="h-40 animate-pulse rounded-lg bg-muted" /> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Gross sales" value={inr(s.totals.gross)} delta={s.previous.grossChangePct} sub={`prev ${inr(s.previous.gross)}`} />
            <Stat label="Net (taxable) revenue" value={inr(s.totals.taxable)} sub="excl. GST" />
            <Stat label="GST collected" value={inr(s.totals.gst)} sub={`CGST ${inr(s.totals.cgst)} · SGST ${inr(s.totals.sgst)} · IGST ${inr(s.totals.igst)}`} />
            <Stat label="Discounts given" value={inr(s.totals.discount)} sub={s.totals.list ? `${Math.round((s.totals.discount / s.totals.list) * 1000) / 10}% of list price` : undefined} />
            <Stat label="Paid orders" value={String(s.totals.orders)} delta={s.previous.ordersChangePct} sub={`prev ${s.previous.orders}`} />
            <Stat label="Avg order value" value={inr(s.totals.aov)} sub={`${inr(s.totals.avgPerDay)} / day`} />
            <Stat label="Customers" value={String(s.totals.customers)} sub={`${s.totals.newCustomers} new · ${s.totals.repeatCustomers} repeat`} />
            <Stat label="Payment success" value={s.funnel.successRate === null ? '—' : `${s.funnel.successRate}%`} sub={`${s.funnel.failed} failed · ${s.funnel.pending} abandoned`} />
          </div>
          <Card title={s.range.bucket === 'month' ? 'Sales by month' : 'Sales by day'}>
            {s.series.length ? (
              <div className="flex h-48 items-end gap-1 overflow-x-auto pb-6">{s.series.map((x) => (
                <div key={x.key} className="group relative flex min-w-[14px] flex-1 flex-col items-center justify-end" title={`${x.key}: ${inr(x.gross)} · ${x.orders} orders`}>
                  <div className="w-full rounded-t bg-gradient-to-t from-maroon to-gold" style={{ height: `${Math.max(2, (x.gross / max) * 100)}%` }} />
                  <span className="absolute -bottom-5 text-[9px] text-muted-foreground">{s.range.bucket === 'month' ? x.key.slice(2) : x.key.slice(8)}</span>
                </div>
              ))}</div>
            ) : <p className="text-sm text-muted-foreground">No sales in this period.</p>}
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="By plan"><T head={['Plan', 'Orders', 'Gross', 'Taxable', 'Share']} rows={s.byPlan.map((x) => [x.name, x.orders, inr(x.gross), inr(x.taxable), `${x.share}%`])} /></Card>
            <Card title="Coupons used"><T head={['Coupon', 'Uses', 'Discount', 'Sales']} rows={s.byCoupon.map((x) => [<span key="c" className="font-mono">{x.code}</span>, x.uses, inr(x.discount), inr(x.gross)])} empty="No coupons used." /></Card>
            <Card title="By state (place of supply)"><T head={['State', 'Orders', 'Taxable', 'CGST+SGST', 'IGST']} rows={s.byState.map((x) => [x.state, x.orders, inr(x.taxable), inr(x.cgst + x.sgst), inr(x.igst)])} /></Card>
            <Card title="Top customers"><T head={['Customer', 'Orders', 'Spent']} rows={s.topCustomers.map((x) => [<span key="w">{x.who}<br /><span className="text-xs text-muted-foreground">{x.contact}</span></span>, x.orders, inr(x.gross)])} /></Card>
            <Card title="Subscriptions (now)">
              <div className="mb-3 grid grid-cols-2 gap-3"><Stat label="Active subscribers" value={String(s.subscriptions.active)} /><Stat label="Monthly recurring (est.)" value={inr(s.subscriptions.mrr)} sub="incl. GST" /></div>
              <T head={['Plan', 'Subscribers', 'MRR']} rows={s.subscriptions.byPlan.map((x) => [x.code, x.subs, inr(x.mrr)])} empty="No active subscriptions." />
            </Card>
            <Card title="Report credits">
              <div className="grid grid-cols-3 gap-3"><Stat label="Issued" value={String(s.credits.issued)} sub="this period" /><Stat label="Used" value={String(s.credits.used)} sub="this period" /><Stat label="Unused (all users)" value={String(s.credits.outstanding)} sub="owed to customers" /></div>
              <p className="mt-3 text-xs text-muted-foreground">Unused credits are reports customers have paid for but not yet taken – useful for your accountant (advance received).</p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

type Pay = { id: string; createdAt: string; paidAt: string | null; status: string; planCode: string; planName: string | null; customer: string | null; email: string | null; phone: string | null; billingName: string | null; billingState: string | null; gstin: string | null; listPaise: number; discountPaise: number; couponCode: string | null; taxablePaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number; amountPaise: number; invoiceNumber: string | null; orderId: string; paymentId: string | null };
type Gst = { range: { from: string; to: string }; sellerGstin: string; sellerState: string; sac: string; rate: number; b2b: { invoiceNumber: string; date: string; gstin: string; billingName: string; placeOfSupply: string; invoiceValue: number; taxable: number; cgst: number; sgst: number; igst: number }[]; b2cs: { placeOfSupply: string; invoices: number; taxable: number; cgst: number; sgst: number; igst: number; gross: number }[]; hsn: { sac: string; quantity: number; taxable: number; cgst: number; sgst: number; igst: number; total: number }; documents: { count: number; first: string | null; last: string | null } };
type Audit = { paidWithoutInvoice: { id: string; orderId: string }[]; amountMismatch: { id: string; invoiceNumber: string | null; amount: number; parts: number; list: number; discount: number }[]; pendingOver30Min: { id: string; orderId: string; createdAt: string; amount: number; email: string | null; phone: string | null }[]; invoiceGaps: { series: string; missing: number[] }[]; invalidGstin: { invoiceNumber: string | null; gstin: string }[] };

export function PaymentReport() {
  const [range, setRange] = useRange();
  const [view, setView] = React.useState<'register' | 'gst' | 'audit'>('register');
  const [f, setF] = React.useState({ status: '', plan: '', q: '' });
  const [list, setList] = React.useState<Pay[] | null>(null);
  const [gst, setGst] = React.useState<Gst | null>(null);
  const [audit, setAudit] = React.useState<Audit | null>(null);
  const [open, setOpen] = React.useState<string | null>(null);
  const [recheck, setRecheck] = React.useState<Record<string, string>>({});
  const [plans, setPlans] = React.useState<{ code: string; name: string }[]>([]);
  React.useEffect(() => { api<{ plans: { code: string; name: string }[] }>('/api/admin/plans').then((r) => setPlans(r.plans)).catch(() => {}); }, []);
  const params = { report: 'payments', ...range, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) };

  React.useEffect(() => {
    if (view !== 'register') return;
    const h = setTimeout(() => { setList(null); api<{ payments: Pay[] }>(`/api/admin/finance?${new URLSearchParams(params)}`).then((r) => setList(r.payments)); }, 250);
    return () => clearTimeout(h);
  }, [view, range, f]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { if (view === 'gst') { setGst(null); api<Gst>(`/api/admin/finance?report=gst&from=${range.from}&to=${range.to}`).then(setGst); } }, [view, range]);
  React.useEffect(() => { if (view === 'audit') { setAudit(null); api<Audit>('/api/admin/finance?report=audit').then(setAudit); } }, [view]);

  const sum = (k: keyof Pay) => (list ?? []).filter((p) => p.status === 'paid').reduce((a, p) => a + (p[k] as number), 0);
  const auditCount = audit ? audit.paidWithoutInvoice.length + audit.amountMismatch.length + audit.pendingOver30Min.length + audit.invoiceGaps.length + audit.invalidGstin.length : 0;

  return (
    <div className="space-y-6">
      <Card title="Payment report">
        <div className="mb-4 inline-flex rounded-md bg-muted p-1 text-sm">
          {([['register', 'Payment register'], ['gst', 'GST summary (GSTR-1)'], ['audit', 'Reconciliation checks']] as const).map(([id, l]) => (
            <button key={id} onClick={() => setView(id)} className={cn('rounded px-3 py-1.5', view === id ? 'bg-card font-semibold shadow' : 'text-muted-foreground')}>{l}</button>
          ))}
        </div>
        {view !== 'audit' && <RangePicker v={range} onChange={setRange} />}
        {view === 'register' && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <Field label="Status"><Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="w-36"><option value="">All</option><option value="paid">Paid</option><option value="created">Pending / abandoned</option><option value="failed">Failed</option></Select></Field>
            <Field label="Plan"><Select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })} className="w-44"><option value="">All plans</option>{plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</Select></Field>
            <Field label="Search"><Input placeholder="Name, email, mobile, invoice, order id, GSTIN" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} className="w-72" /></Field>
            <a href={csvHref(params)}><Button variant="outline"><Download /> Export CSV</Button></a>
          </div>
        )}
      </Card>

      {view === 'register' && (
        <Card>
          {!list ? <div className="h-32 animate-pulse rounded bg-muted" /> : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                <Stat label="Transactions" value={String(list.length)} sub={`${list.filter((p) => p.status === 'paid').length} paid`} />
                <Stat label="Collected" value={inr(sum('amountPaise'))} />
                <Stat label="Taxable" value={inr(sum('taxablePaise'))} />
                <Stat label="GST" value={inr(sum('cgstPaise') + sum('sgstPaise') + sum('igstPaise'))} />
                <Stat label="Discounts" value={inr(sum('discountPaise'))} />
              </div>
              <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2">Date (IST)</th><th>Customer</th><th>Plan</th><th className="text-right">Amount</th><th className="text-right">GST</th><th>Coupon</th><th>Status</th><th>Invoice</th></tr></thead>
                <tbody>{list.map((p) => (
                  <React.Fragment key={p.id}>
                    <tr className="cursor-pointer border-b border-border/50 hover:bg-muted/40" onClick={() => setOpen(open === p.id ? null : p.id)}>
                      <td className="py-2 text-xs">{istDT(p.paidAt ?? p.createdAt)}</td>
                      <td><span className="font-medium">{p.customer ?? p.billingName ?? '—'}</span><br /><span className="text-xs text-muted-foreground">{p.email ?? p.phone}</span></td>
                      <td>{p.planName ?? p.planCode}</td>
                      <td className="text-right tabular-nums">{inr(p.amountPaise)}{p.discountPaise ? <span className="block text-xs text-muted-foreground">-{inr(p.discountPaise)}</span> : null}</td>
                      <td className="text-right tabular-nums text-xs">{inr(p.cgstPaise + p.sgstPaise + p.igstPaise)}<br /><span className="text-muted-foreground">{p.igstPaise ? 'IGST' : 'CGST+SGST'}</span></td>
                      <td className="font-mono text-xs">{p.couponCode ?? ''}</td>
                      <td><Badge tone={p.status === 'paid' ? 'good' : p.status === 'failed' ? 'bad' : 'warn'}>{p.status === 'created' ? 'pending' : p.status}</Badge></td>
                      <td>{p.invoiceNumber && <a onClick={(e) => e.stopPropagation()} className="text-gold underline" href={`/api/billing/invoices/${p.id}`}>{p.invoiceNumber}</a>}</td>
                    </tr>
                    {open === p.id && (
                      <tr className="border-b border-border/50 bg-muted/30"><td colSpan={8} className="p-3 text-xs">
                        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-3">
                          <span>List price: <b>{inr(p.listPaise)}</b></span><span>Discount: <b>{inr(p.discountPaise)}</b></span><span>Taxable: <b>{inr(p.taxablePaise)}</b></span>
                          <span>CGST: <b>{inr(p.cgstPaise)}</b></span><span>SGST: <b>{inr(p.sgstPaise)}</b></span><span>IGST: <b>{inr(p.igstPaise)}</b></span>
                          <span>Billing name: <b>{p.billingName ?? '—'}</b></span><span>State: <b>{p.billingState ?? '—'}</b></span><span>GSTIN: <b>{p.gstin ?? '—'}</b></span>
                          <span>Created: <b>{istDT(p.createdAt)}</b></span><span>{p.orderId.startsWith('cf_') ? 'Cashfree' : p.orderId.startsWith('mock_') ? 'Test-mode' : 'Older (Razorpay)'} order: <b className="font-mono">{p.orderId}</b></span><span>Payment id: <b className="font-mono">{p.paymentId ?? '—'}</b></span>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}</tbody>
              </table>{!list.length && <p className="py-3 text-sm text-muted-foreground">No payments match.</p>}</div>
              {list.length >= 2000 && <p className="mt-2 text-xs text-warning">Showing the latest 2,000 – narrow the period or export CSV.</p>}
            </>
          )}
        </Card>
      )}

      {view === 'gst' && (!gst ? <div className="h-40 animate-pulse rounded-lg bg-muted" /> : (
        <>
          {!gst.sellerGstin && <p className="glass flex items-center gap-2 rounded-lg p-3 text-sm text-warning"><AlertTriangle className="h-4 w-4" />Your GSTIN is not set – add it in Admin → Invoice settings.</p>}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Invoices issued" value={String(gst.documents.count)} sub={gst.documents.first ? `${gst.documents.first} → ${gst.documents.last}` : undefined} />
            <Stat label="Taxable value" value={inr(gst.hsn.taxable)} />
            <Stat label="CGST + SGST" value={inr(gst.hsn.cgst + gst.hsn.sgst)} sub={`intra-state (${gst.sellerState || 'your state'})`} />
            <Stat label="IGST" value={inr(gst.hsn.igst)} sub="inter-state" />
          </div>
          <Card title="B2C (small) – by place of supply" action={<a href={csvHref({ report: 'gst', kind: 'b2cs', ...range })}><Button size="sm" variant="outline"><Download /> B2CS CSV</Button></a>}>
            <T head={['Place of supply', 'Invoices', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total']} rows={gst.b2cs.map((x) => [x.placeOfSupply, x.invoices, inr(x.taxable), inr(x.cgst), inr(x.sgst), inr(x.igst), inr(x.gross)])} />
          </Card>
          <Card title="B2B – invoices with customer GSTIN" action={<a href={csvHref({ report: 'gst', kind: 'b2b', ...range })}><Button size="sm" variant="outline"><Download /> B2B CSV</Button></a>}>
            <T head={['Invoice', 'Date', 'GSTIN', 'Taxable', 'CGST+SGST', 'IGST', 'Value']} rows={gst.b2b.map((x) => [`${x.invoiceNumber} · ${x.billingName}`, x.date, x.gstin, inr(x.taxable), inr(x.cgst + x.sgst), inr(x.igst), inr(x.invoiceValue)])} empty="No B2B invoices in this period." />
          </Card>
          <Card title="SAC summary" action={<a href={csvHref({ report: 'gst', kind: 'hsn', ...range })}><Button size="sm" variant="outline"><Download /> HSN/SAC CSV</Button></a>}>
            <T head={['SAC', 'Qty', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total']} rows={[[gst.hsn.sac || '—', gst.hsn.quantity, inr(gst.hsn.taxable), inr(gst.hsn.cgst), inr(gst.hsn.sgst), inr(gst.hsn.igst), inr(gst.hsn.total)]]} />
            <p className="mt-3 text-xs text-muted-foreground">Invoice date = payment date (IST). These files follow the GSTR-1 table layout to help your accountant – have them check before filing.</p>
          </Card>
        </>
      ))}

      {view === 'audit' && (!audit ? <div className="h-40 animate-pulse rounded-lg bg-muted" /> : (
        <Card title="Reconciliation checks" action={auditCount ? <Badge tone="warn">{auditCount} item(s) to review</Badge> : <Badge tone="good">all clear</Badge>}>
          <div className="space-y-5 text-sm">
            <AuditBlock ok={!audit.pendingOver30Min.length} title="Pending orders older than 30 minutes" hint="The customer may have paid but the confirmation didn't arrive. For Cashfree orders press Re-check – if Cashfree shows it paid, the order is completed and the invoice issued. Older Razorpay orders (if any) must be checked in the Razorpay dashboard.">
              {audit.pendingOver30Min.map((x) => <li key={x.id}><span className="font-mono">{x.orderId}</span> · {inr(x.amount)} · {x.email ?? x.phone} · {istDT(x.createdAt)}
                {x.orderId.startsWith('cf_') && <> · <button className="text-gold underline" onClick={async () => {
                  try { const r = await api<{ status: string; invoiceNumber?: string }>('/api/admin/finance', { method: 'POST', json: { orderId: x.orderId } }); setRecheck({ ...recheck, [x.orderId]: r.status === 'paid' ? `paid – invoice ${r.invoiceNumber}` : r.status }); }
                  catch { setRecheck({ ...recheck, [x.orderId]: 'could not reach Cashfree' }); }
                }}>Re-check with Cashfree</button>{recheck[x.orderId] && <b className="ml-1">{recheck[x.orderId]}</b>}</>}
              </li>)}
            </AuditBlock>
            <AuditBlock ok={!audit.paidWithoutInvoice.length} title="Paid orders without an invoice number">
              {audit.paidWithoutInvoice.map((x) => <li key={x.id} className="font-mono">{x.orderId}</li>)}
            </AuditBlock>
            <AuditBlock ok={!audit.amountMismatch.length} title="Amounts that don't add up" hint="Checks: amount = taxable + GST, and amount = list price − discount.">
              {audit.amountMismatch.map((x) => <li key={x.id}>{x.invoiceNumber ?? x.id}: amount {inr(x.amount)}, taxable+GST {inr(x.parts)}, list−discount {inr(x.list - x.discount)}</li>)}
            </AuditBlock>
            <AuditBlock ok={!audit.invoiceGaps.length} title="Gaps in invoice numbering" hint="GST law expects one continuous series per financial year.">
              {audit.invoiceGaps.map((x) => <li key={x.series}><span className="font-mono">{x.series}</span> missing {x.missing.join(', ')}</li>)}
            </AuditBlock>
            <AuditBlock ok={!audit.invalidGstin.length} title="Invalid customer GSTIN format">
              {audit.invalidGstin.map((x, i) => <li key={i}>{x.invoiceNumber}: <span className="font-mono">{x.gstin}</span></li>)}
            </AuditBlock>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AuditBlock({ ok, title, hint, children }: { ok: boolean; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-2 font-medium">{ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-warning" />}{title}</p>
      {hint && <p className="ml-6 text-xs text-muted-foreground">{hint}</p>}
      {!ok && <ul className="ml-6 mt-1 list-disc space-y-0.5 pl-4 text-xs">{children}</ul>}
    </div>
  );
}
