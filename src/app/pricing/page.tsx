'use client';
import * as React from 'react';
import Link from 'next/link';
import { Check, Crown, Sparkles, X } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { INDIAN_STATES } from '@/components/wizard/state';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';

interface Plan { code: string; name: string; description: string; pricePaise: number; intervalDays: number | null; credits: number; features: Record<string, boolean | number | null> }
interface Order { gateway: 'cashfree' | 'razorpay'; mode: string; paymentSessionId: string; keyId: string; mock: boolean; orderId: string; amountPaise: number; discountPaise: number; plan: { code: string; name: string }; prefill: { name: string; email: string; contact: string } }
type CashfreeResult = { error?: { message?: string }; redirect?: boolean; paymentDetails?: { paymentMessage?: string } };
declare global { interface Window {
  Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
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

function loadCheckoutJs(): Promise<void> {
  return new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = Object.assign(document.createElement('script'), { src: 'https://checkout.razorpay.com/v1/checkout.js', async: true });
    s.onload = () => res(); s.onerror = () => rej(new Error('Could not load Razorpay'));
    document.body.appendChild(s);
  });
}

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

  const featureList = (p: Plan) => p.features.fullReports
    ? [t.pricing.features.fullReports, t.pricing.features.whiteLabel, t.pricing.features.bulk, t.pricing.features.share]
    : [`${p.credits} ${p.credits === 1 ? t.pricing.credit : t.pricing.credits}`, t.pricing.features.single, t.pricing.features.credits];

  return (
    <div className="container space-y-8 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold sm:text-5xl"><span className="gold-text">{t.pricing.title}</span></h1>
        <p className="mt-3 text-muted-foreground">{t.pricing.sub}</p>
      </div>
      {returned && (
        <p role="status" className={`mx-auto max-w-xl rounded-md p-3 text-center text-sm ${returned === 'paid' ? 'bg-success/15 text-success' : returned === 'failed' ? 'bg-danger/10 text-danger' : 'bg-muted'}`}>
          {returned === 'paid' ? t.pricing.success : returned === 'failed' ? t.pricing.failed : t.pricing.pending}
          {returned === 'paid' && <> <Link href="/dashboard" className="underline">{t.nav.dashboard}</Link></>}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="glass flex flex-col rounded-lg p-5">
          <p className="font-serif text-xl font-semibold">{t.pricing.free}</p>
          <p className="my-3 font-serif text-3xl font-bold">₹0</p>
          <p className="text-sm text-muted-foreground">{t.pricing.freeDesc}</p>
          <Link href="/reading" className={buttonVariants({ variant: 'outline', className: 'mt-auto' })}>{t.nav.reading}</Link>
        </div>
        {plans.map((p) => {
          const pro = !!p.features.fullReports;
          return (
            <div key={p.code} className={`glass relative flex flex-col rounded-lg p-5 ${p.code === 'PRO_MONTHLY' ? 'ring-2 ring-gold' : ''}`}>
              {pro && <Crown className="absolute right-4 top-4 h-5 w-5 text-gold" />}
              <p className="font-serif text-xl font-semibold">{p.name}</p>
              <p className="my-3 font-serif text-3xl font-bold">{inr(p.pricePaise)} <span className="font-sans text-sm font-normal text-muted-foreground">{p.intervalDays ? (p.intervalDays > 31 ? t.pricing.perYear : t.pricing.perMonth) : t.pricing.oneTime}</span></p>
              <p className="mb-3 text-sm text-muted-foreground">{p.description}</p>
              <ul className="mb-5 space-y-1.5 text-sm">{featureList(p).map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{f}</li>)}</ul>
              {me?.user
                ? <Button variant={pro ? 'gold' : 'outline'} className="mt-auto" onClick={() => setChosen(p)}><Sparkles /> {t.pricing.buy}</Button>
                : <Link href="/login?next=/pricing" className={buttonVariants({ variant: 'outline', className: 'mt-auto' })}>{t.pricing.loginToBuy}</Link>}
            </div>
          );
        })}
      </div>
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

  async function verify(resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    await api('/api/billing/verify', { method: 'POST', json: resp });
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
      if (o.mock) return; // test mode: the dialog shows a "simulate" button
      await loadCheckoutJs();
      const rz = new window.Razorpay!({
        key: o.keyId, order_id: o.orderId, amount: o.amountPaise, currency: 'INR', name: t.brand, description: o.plan.name, prefill: o.prefill,
        theme: { color: '#7A1E2C' }, handler: (resp: never) => verify(resp).catch(() => setDone('fail')), modal: { ondismiss: () => setBusy(false) },
      });
      rz.on('payment.failed', () => setDone('fail'));
      rz.open();
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
                <Button variant="gold" className="w-full" onClick={async () => { try { await verify(await api('/api/billing/mock-pay', { method: 'POST', json: { orderId: order.orderId } })); } catch { setDone('fail'); } }}>{t.pricing.simulate}</Button>
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
