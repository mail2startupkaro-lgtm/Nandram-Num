'use client';
import * as React from 'react';
import Link from 'next/link';
import { Check, Crown, Languages, Minus, Receipt, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { INDIAN_STATES } from '@/components/wizard/state';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';

interface Plan { code: string; name: string; description: string; pricePaise: number; intervalDays: number | null; credits: number; features: Record<string, boolean | number | null> }
interface Order { gateway: 'cashfree' | 'mock'; mode: string; paymentSessionId: string; mock: boolean; orderId: string; amountPaise: number; discountPaise: number; plan: { code: string; name: string }; prefill: { name: string; email: string; contact: string } }
type CashfreeResult = { error?: { message?: string }; redirect?: boolean; paymentDetails?: { paymentMessage?: string } };
declare global { interface Window {
  Cashfree?: (o: { mode: string }) => { checkout: (o: { paymentSessionId: string; redirectTarget?: string }) => Promise<CashfreeResult> };
} }

function loadCashfreeJs(): Promise<void> {
  return new Promise((res, rej) => {
    if (window.Cashfree) return res();
    const s = Object.assign(document.createElement('script'), { src: 'https://sdk.cashfree.com/js/v3/cashfree.js', async: true });
    s.onload = () => res(); s.onerror = () => rej(new Error('Could not load Cashfree'));
    document.body.appendChild(s);
  });
}

/** Asks our server (which asks Cashfree) a few times, because UPI confirmations can take a few seconds. */
async function confirmCashfree(orderId: string, tries = 6): Promise<'paid' | 'pending' | 'failed'> {
  for (let i = 0; i < tries; i++) {
    const r = await api<{ status: 'paid' | 'pending' | 'failed' }>('/api/billing/cashfree/verify', { method: 'POST', json: { orderId } });
    if (r.status !== 'pending') return r.status;
    await new Promise((ok) => setTimeout(ok, 2500));
  }
  return 'pending';
}

const inr = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

export default function PricingPage() {
  const { t, me, refreshMe } = useApp();
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [chosen, setChosen] = React.useState<Plan | null>(null);
  React.useEffect(() => { api<{ plans: Plan[] }>('/api/billing/plans').then((r) => setPlans(r.plans)).catch(() => setPlans([])); }, []);
  const [returned, setReturned] = React.useState<'paid' | 'pending' | 'failed' | 'checking' | null>(null);
  React.useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('cf_order');
    if (!id || !id.startsWith('cf_') || !me?.user) return;
    setReturned('checking');
    confirmCashfree(id).then(async (st) => { setReturned(st); if (st === 'paid') await refreshMe(); }).catch(() => setReturned('pending'))
      .finally(() => window.history.replaceState(null, '', '/pricing'));
  }, [me?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPro = (p: Plan) => !!p.features.fullReports;
  const credit = plans.filter((p) => !isPro(p));
  const pro = plans.filter(isPro);
  const single = credit.filter((p) => p.credits === 1).sort((x, y) => x.pricePaise - y.pricePaise)[0];
  const monthly = pro.find((p) => p.intervalDays && p.intervalDays <= 31);
  const perReport = (p: Plan) => (p.credits > 0 ? Math.round(p.pricePaise / p.credits) : 0);

  /** Badge, price-per-unit line and saving, all derived from the live plan data (nothing hard-coded). */
  function extras(p: Plan): { badge?: string; hot?: boolean; sub?: string; save?: string } {
    if (isPro(p)) {
      const yearly = !!p.intervalDays && p.intervalDays > 31;
      if (yearly) {
        const sav = monthly ? monthly.pricePaise * 12 - p.pricePaise : 0;
        return { badge: sav > 0 ? 'Best value' : undefined, sub: `≈ ${inr(Math.round(p.pricePaise / 12))} / month`, save: sav > 0 ? `Save ${inr(sav)} a year vs monthly` : undefined };
      }
      return { badge: 'Most popular', hot: true, sub: 'Billed monthly' };
    }
    if (p.credits > 1) {
      const pct = single && single.credits === 1 ? Math.round((1 - perReport(p) / single.pricePaise) * 100) : 0;
      return { badge: pct > 0 ? 'Best for families' : undefined, sub: `${inr(perReport(p))} per report`, save: pct > 0 ? `Save ${pct}% per report` : undefined };
    }
    return { sub: p.credits === 1 ? 'Try one full report' : undefined };
  }

  const featureList = (p: Plan) => isPro(p)
    ? [t.pricing.features.fullReports, t.pricing.features.whiteLabel, t.pricing.features.bulk, t.pricing.features.share, 'Unlimited saved clients', 'GST invoice for every payment']
    : [`${p.credits} ${p.credits === 1 ? t.pricing.credit : t.pricing.credits}`, t.pricing.features.single, t.pricing.features.credits, `Save up to ${p.features.maxProfiles ?? 'unlimited'} readings`, 'Hindi, English & Hinglish', 'GST invoice for every payment'];

  function renderCard(p: Plan, i: number) {
    const x = extras(p);
    const pr = isPro(p);
    return (
      <div key={p.code} style={{ animationDelay: `${i * 90}ms` }} className={`mk-rise mk-card glass relative flex flex-col rounded-2xl p-6 ${x.hot ? 'border-2 border-gold shadow-[0_0_34px_hsl(var(--gold)/0.28)]' : ''}`}>
        {x.badge && <span className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${x.hot ? 'bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] text-[hsl(250_45%_10%)]' : 'border border-gold/60 bg-background text-gold'}`}>{x.badge}</span>}
        <div className="flex items-center justify-between">
          <p className="font-serif text-xl font-semibold">{p.name}</p>
          {pr ? <Crown className="h-5 w-5 text-gold" /> : <Zap className="h-5 w-5 text-gold/70" />}
        </div>
        <p className="mt-4 font-serif text-4xl font-bold"><span className="gold-text">{inr(p.pricePaise)}</span> <span className="font-sans text-sm font-normal text-muted-foreground">{p.intervalDays ? (p.intervalDays > 31 ? t.pricing.perYear : t.pricing.perMonth) : t.pricing.oneTime}</span></p>
        <p className="text-xs text-muted-foreground">incl. 18% GST</p>
        {x.sub && <p className="mt-1 text-sm text-gold">{x.sub}</p>}
        {x.save && <p className="mt-2 inline-block self-start rounded-md bg-success/15 px-2 py-0.5 text-xs font-medium text-success">{x.save}</p>}
        <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
        <ul className="my-5 space-y-2 text-sm">{featureList(p).map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{f}</li>)}</ul>
        {me?.user
          ? <Button variant={pr || x.hot ? 'gold' : 'outline'} size="lg" className="mt-auto" onClick={() => setChosen(p)}><Sparkles /> {t.pricing.buy}</Button>
          : <Link href="/login?next=/pricing" className={buttonVariants({ variant: pr || x.hot ? 'gold' : 'outline', size: 'lg', className: 'mt-auto' })}>{t.pricing.loginToBuy}</Link>}
      </div>
    );
  }

  const freeCard = (
    <div className="mk-rise mk-card glass flex flex-col rounded-2xl p-6">
      <div className="flex items-center justify-between"><p className="font-serif text-xl font-semibold">{t.pricing.free}</p><Sparkles className="h-5 w-5 text-gold/70" /></div>
      <p className="mt-4 font-serif text-4xl font-bold"><span className="gold-text">₹0</span></p>
      <p className="text-xs text-muted-foreground">Free forever</p>
      <p className="mt-3 text-sm text-muted-foreground">{t.pricing.freeDesc}</p>
      <ul className="my-5 space-y-2 text-sm">{['Free numerology calculators', 'On-screen reading (instant)', 'Watermarked Date of Birth preview PDF', 'Up to 3 saved readings'].map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{f}</li>)}</ul>
      <Link href="/reading" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'mt-auto' })}>{t.nav.reading}</Link>
    </div>
  );

  /** Feature comparison rows, driven by each plan's real feature flags. */
  const cols: { name: string; pro: boolean; paid: boolean; credits: number; f: Plan['features'] }[] = [
    { name: t.pricing.free, pro: false, paid: false, credits: 0, f: { maxProfiles: 3 } },
    ...plans.map((p) => ({ name: p.name, pro: isPro(p), paid: true, credits: p.credits, f: p.features })),
  ];
  const rows: { label: string; cell: (c: (typeof cols)[number]) => React.ReactNode }[] = [
    { label: 'Calculators & on-screen reading', cell: () => 'yes' },
    { label: 'Full Complete Life Report PDF (all chapters)', cell: (c) => (c.paid ? 'yes' : 'Preview only') },
    { label: 'Report credits', cell: (c) => (c.pro ? 'Unlimited' : c.credits > 0 ? String(c.credits) : 'no') },
    { label: 'Saved readings', cell: (c) => (c.f.maxProfiles == null ? 'Unlimited' : String(c.f.maxProfiles)) },
    { label: 'White-label PDFs (logo, signature, colours)', cell: (c) => (c.f.whiteLabel ? 'yes' : 'no') },
    { label: 'Bulk import & export', cell: (c) => (c.f.bulk ? 'yes' : 'no') },
    { label: 'Share links for every report', cell: (c) => (c.f.share ? 'yes' : 'no') },
    { label: 'GST invoice', cell: (c) => (c.paid ? 'yes' : 'no') },
  ];
  const cellView = (v: React.ReactNode) => v === 'yes' ? <Check className="mx-auto h-4 w-4 text-success" aria-label="Included" /> : v === 'no' ? <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not included" /> : <span className="font-medium">{v}</span>;

  const trust = [
    { icon: ShieldCheck, title: 'Secure payment', text: 'UPI, cards and net banking through Cashfree Payments.' },
    { icon: Receipt, title: 'GST invoice', text: 'A proper GST invoice for every paid order.' },
    { icon: Languages, title: 'Hindi, English & Hinglish', text: 'Choose the language of your report.' },
    { icon: Zap, title: 'Instant PDF', text: 'Your designed report is ready in seconds.' },
  ];
  const faq = [
    ['What is a report credit?', 'One credit unlocks one full Complete Life Report PDF for any client. Single Report gives 1 credit and the 5-credit pack gives 5.'],
    ['Which plan is right for me?', 'Choose Single Report for yourself or one family member, the 5-credit pack for a family or a few consultations, and Pro if you are a consultant who creates reports regularly and wants white-label PDFs.'],
    ['Which payment methods can I use?', 'UPI, debit and credit cards and net banking, processed securely by Cashfree Payments. All prices include 18% GST.'],
    ['Do I get a GST invoice?', 'Yes. Enter your billing state (and GSTIN for a business invoice) at checkout and the invoice is generated with your payment.'],
  ];

  return (
    <div className="container space-y-12 py-10 sm:py-14">
      <div className="mk-rise mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Simple · Transparent · GST included</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl"><span className="gold-text">{t.pricing.title}</span></h1>
        <p className="mt-3 text-muted-foreground">{t.pricing.sub}</p>
      </div>
      {returned && (
        <p role="status" className={`mx-auto max-w-xl rounded-md p-3 text-center text-sm ${returned === 'paid' ? 'bg-success/15 text-success' : returned === 'failed' ? 'bg-danger/10 text-danger' : 'bg-muted'}`}>
          {returned === 'paid' ? t.pricing.success : returned === 'failed' ? t.pricing.failed : t.pricing.pending}
          {returned === 'paid' && <> <Link href="/dashboard" className="underline">{t.nav.dashboard}</Link></>}
        </p>
      )}

      <section className="space-y-5">
        <div className="text-center"><h2 className="font-serif text-2xl font-semibold">For you & your family</h2><p className="text-sm text-muted-foreground">Start free, then pay only for the reports you need.</p></div>
        <div className="mx-auto grid max-w-5xl gap-6 pt-3 md:grid-cols-3">{freeCard}{credit.map((p, i) => renderCard(p, i + 1))}</div>
      </section>

      {pro.length > 0 && (
        <section className="space-y-5">
          <div className="text-center"><h2 className="font-serif text-2xl font-semibold">For consultants & professionals</h2><p className="text-sm text-muted-foreground">Unlimited reports with your own branding on every PDF.</p></div>
          <div className="mx-auto grid max-w-3xl gap-6 pt-3 md:grid-cols-2">{pro.map((p, i) => renderCard(p, i))}</div>
        </section>
      )}

      {plans.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-center font-serif text-2xl font-semibold">Compare Plans</h2>
          <div className="glass mx-auto max-w-5xl overflow-x-auto rounded-2xl border border-gold/20">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-gold/20"><th className="p-3 text-left font-medium text-muted-foreground">Feature</th>{cols.map((c) => <th key={c.name} className={`p-3 text-center font-serif font-semibold ${c.pro ? 'text-gold' : ''}`}>{c.name}</th>)}</tr></thead>
              <tbody>{rows.map((r) => <tr key={r.label} className="border-b border-border/50 last:border-0 hover:bg-gold/5"><td className="p-3">{r.label}</td>{cols.map((c) => <td key={c.name} className="p-3 text-center">{cellView(r.cell(c))}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {trust.map((x, i) => (
          <div key={x.title} style={{ animationDelay: `${i * 80}ms` }} className="mk-rise mk-card rounded-xl border border-gold/20 p-4 text-center">
            <x.icon className="mx-auto h-6 w-6 text-gold" /><p className="mt-2 font-medium">{x.title}</p><p className="mt-1 text-xs text-muted-foreground">{x.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl space-y-3">
        <h2 className="text-center font-serif text-2xl font-semibold">Pricing Questions</h2>
        {faq.map(([q, a]) => <details key={q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-2 text-sm text-muted-foreground">{a}</p></details>)}
        <p className="text-center text-xs text-muted-foreground">See our <Link href="/refund" className="underline">Refund Policy</Link> and <Link href="/terms" className="underline">Terms of Service</Link>.</p>
      </section>

      {me?.account && (
        <p className="text-center text-sm text-muted-foreground">
          {t.account.plan}: <b>{me.account.planName ?? t.account.freePlan}</b>{me.account.proUntil ? ` (${t.account.until} ${new Date(me.account.proUntil).toLocaleDateString('en-IN')})` : ''} · {t.account.credits}: <b>{me.account.credits}</b>
        </p>
      )}
      {chosen && <CheckoutDialog plan={chosen} onClose={() => setChosen(null)} onPaid={async () => { await refreshMe(); }} />}
    </div>
  );
}

function CheckoutDialog({ plan, onClose, onPaid }: { plan: Plan; onClose: () => void; onPaid: () => Promise<void> }) {
  const { t, me } = useApp();
  const [state, setState] = React.useState(me?.user?.billingState ?? '');
  const [billingName, setBillingName] = React.useState(me?.user?.name ?? '');
  const [gstin, setGstin] = React.useState('');
  const [phone, setPhone] = React.useState((me?.user?.phone ?? '').replace(/^\+91/, ''));
  const [pending, setPending] = React.useState(false);
  const [coupon, setCoupon] = React.useState('');
  const [discount, setDiscount] = React.useState(0);
  const [couponMsg, setCouponMsg] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [order, setOrder] = React.useState<Order | null>(null);
  const [done, setDone] = React.useState<'ok' | 'fail' | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function applyCoupon() {
    setCouponMsg(null);
    try { const r = await api<{ discountPaise: number }>('/api/billing/coupon', { method: 'POST', json: { planCode: plan.code, code: coupon } }); setDiscount(r.discountPaise); setCouponMsg(`-${inr(r.discountPaise)}`); }
    catch (e) { setDiscount(0); setCouponMsg(e instanceof ApiError ? (e.body as { error?: string }).error ?? 'Invalid' : 'Invalid'); }
  }

  async function simulatePayment(orderId: string) {
    await api('/api/billing/mock-pay', { method: 'POST', json: { orderId } });
    setDone('ok'); await onPaid();
  }

  async function pay() {
    setBusy(true); setError(null);
    try {
      const o = await api<Order>('/api/billing/checkout', { method: 'POST', json: { planCode: plan.code, billingState: state, billingName, gstin: gstin || undefined, coupon: discount ? coupon : undefined, phone: phone || undefined } });
      setOrder(o);
      if (o.gateway === 'cashfree') {
        await loadCashfreeJs();
        const cf = window.Cashfree!({ mode: o.mode === 'production' ? 'production' : 'sandbox' });
        const r = await cf.checkout({ paymentSessionId: o.paymentSessionId, redirectTarget: '_modal' });
        if (r.redirect) return; // the bank page took over; we check again when the customer returns
        setPending(true);
        const st = await confirmCashfree(o.orderId);
        setPending(false);
        if (st === 'paid') { setDone('ok'); await onPaid(); }
        else if (st === 'failed' || r.error) setDone('fail');
        else setError(t.pricing.pending);
        setBusy(false);
        return;
      }
      setBusy(false); // test mode (no Cashfree keys, development only): the dialog shows a "simulate" button
    } catch (e) { setPending(false); setError(e instanceof ApiError ? (t.pricing.errors[e.body.error ?? ''] ?? e.message) : t.err.server); setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="glass w-full max-w-md rounded-lg bg-background p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-semibold">{plan.name}</h2><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button></div>
        {done === 'ok' ? (
          <div className="space-y-4 text-center"><p className="text-success">{t.pricing.success}</p><Link href="/dashboard" className={buttonVariants({ variant: 'gold' })}>{t.nav.dashboard}</Link></div>
        ) : (
          <div className="space-y-3">
            <Field label={t.pricing.billingName} htmlFor="bn"><Input id="bn" value={billingName} onChange={(e) => setBillingName(e.target.value)} /></Field>
            <Field label={t.pricing.state} htmlFor="st" required><Select id="st" value={state} onChange={(e) => setState(e.target.value)}><option value="">{t.f.select}</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label={t.pricing.gstin} htmlFor="gst"><Input id="gst" maxLength={15} value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} /></Field>
            <Field label={t.pricing.phone} htmlFor="ph" required><Input id="ph" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={14} placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <div className="flex items-end gap-2"><Field label={t.pricing.coupon} htmlFor="cp" className="flex-1"><Input id="cp" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} /></Field><Button variant="outline" onClick={applyCoupon} disabled={!coupon}>{t.pricing.apply}</Button></div>
            {couponMsg && <p className={`text-xs ${discount ? 'text-success' : 'text-danger'}`}>{couponMsg}</p>}
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex justify-between"><span>{plan.name}</span><span>{inr(plan.pricePaise)}</span></div>
              {discount > 0 && <div className="flex justify-between text-success"><span>{t.pricing.discount}</span><span>-{inr(discount)}</span></div>}
              <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold"><span>{t.pricing.total} (incl. GST)</span><span>{inr(plan.pricePaise - discount)}</span></div>
            </div>
            {order?.mock ? (
              <div className="space-y-2 rounded-md border border-warning/40 bg-warning/10 p-3">
                <p className="text-xs">{t.pricing.mockNote}</p>
                <Button variant="gold" className="w-full" onClick={async () => { try { await simulatePayment(order.orderId); } catch { setDone('fail'); } }}>{t.pricing.simulate}</Button>
              </div>
            ) : (
              <Button variant="gold" className="w-full" disabled={busy || !state} onClick={pay}>{pending ? t.pricing.pending : busy ? t.pricing.paying : `${t.pricing.pay} ${inr(plan.pricePaise - discount)}`}</Button>
            )}
            {done === 'fail' && <p className="text-sm text-danger">{t.pricing.failed}</p>}
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
