'use client';
import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, MessageCircle, Sparkles, X } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { INDIAN_STATES } from '@/components/wizard/state';
import { Button, buttonVariants } from '@/components/ui/button';
import { ChipGroup, Field, Input, Select } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';
import { confirmCashfreeOrder, loadCashfree } from '@/lib/client/cashfree';
import { todayIST, toIso } from '@/lib/numerology';
import type { ServiceIntakeField, ServiceText } from '@/lib/db/schema';
import { DisclaimerNote } from '@/components/legal/disclaimer-note';

export interface PublicService { code: string; en: ServiceText; hi: ServiceText; intake: ServiceIntakeField[]; payable: boolean; pricePaise: number | null; mrpPaise: number | null }
interface Order { gateway: 'cashfree' | 'mock'; mode: string; paymentSessionId: string; mock: boolean; orderId: string; amountPaise: number }

export const inr = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

const T = {
  en: { book: 'Book & pay', enquire: 'Enquire', title: 'Book', details: 'Details for the analysis', billing: 'Billing & contact', total: 'Total (incl. GST)',
    f: { clientName: 'Full name (spelling you use)', dob: 'Date of birth', dobBaby: "Baby's date of birth", gender: 'Gender', tob: 'Time of birth (optional)', pob: 'Place of birth (optional)', mobile: 'Mobile number to analyse (optional)', mobileMain: 'Current mobile number', currentName: 'Your name as you write it now', parents: "Father's and mother's names (optional)", letters: 'Preferred starting letters (optional)', partnerName: "Partner's full name", partnerDob: "Partner's date of birth", business: 'Business / brand names you are considering', questions: 'Your questions or notes (optional)' },
    male: 'Male', female: 'Female', other: 'Other', billName: 'Name on invoice', email: 'Email (for delivery & invoice)', phone: 'Mobile number (for payment & updates)', state: 'State (for GST)', select: 'Select…', gstin: 'GSTIN (optional)',
    pay: (a: string) => `Pay ${a} securely`, paying: 'Opening payment…', confirming: 'Confirming your payment with the bank…', ok: 'Payment received – thank you!', okText: 'Acharya Nandram will start your analysis. You will receive it on your email and WhatsApp within the delivery time. You can see the status under My account.', account: 'My account', failed: 'The payment did not complete. You have not been charged; please try again.', mock: 'Test mode – no real payment is taken.', simulate: 'Simulate successful payment', priceSoon: 'Price on request', loginHint: 'Already have an account?', signIn: 'Sign in', privacy: 'Your details are encrypted and used only for this analysis.' },
  hi: { book: 'बुक करें और भुगतान करें', enquire: 'पूछताछ करें', title: 'बुक करें', details: 'विश्लेषण के लिए विवरण', billing: 'बिलिंग और संपर्क', total: 'कुल (GST सहित)',
    f: { clientName: 'पूरा नाम (जिस वर्तनी में आप लिखते हैं)', dob: 'जन्म तिथि', dobBaby: 'शिशु की जन्म तिथि', gender: 'लिंग', tob: 'जन्म समय (वैकल्पिक)', pob: 'जन्म स्थान (वैकल्पिक)', mobile: 'विश्लेषण हेतु मोबाइल नंबर (वैकल्पिक)', mobileMain: 'वर्तमान मोबाइल नंबर', currentName: 'आपका नाम, जैसे आप अभी लिखते हैं', parents: 'पिता और माता के नाम (वैकल्पिक)', letters: 'पसंदीदा आरंभिक अक्षर (वैकल्पिक)', partnerName: 'जीवनसाथी का पूरा नाम', partnerDob: 'जीवनसाथी की जन्म तिथि', business: 'व्यवसाय / ब्रांड के नाम जिन पर आप विचार कर रहे हैं', questions: 'आपके प्रश्न या टिप्पणी (वैकल्पिक)' },
    male: 'पुरुष', female: 'महिला', other: 'अन्य', billName: 'इनवॉइस पर नाम', email: 'ईमेल (डिलीवरी और इनवॉइस के लिए)', phone: 'मोबाइल नंबर (भुगतान और अपडेट के लिए)', state: 'राज्य (GST हेतु)', select: 'चुनें…', gstin: 'GSTIN (वैकल्पिक)',
    pay: (a: string) => `${a} सुरक्षित भुगतान करें`, paying: 'भुगतान खुल रहा है…', confirming: 'बैंक से आपके भुगतान की पुष्टि हो रही है…', ok: 'भुगतान प्राप्त हुआ – धन्यवाद!', okText: 'आचार्य नंदराम आपका विश्लेषण शुरू करेंगे। डिलीवरी समय के भीतर यह आपको ईमेल और WhatsApp पर मिलेगा। स्थिति "मेरा खाता" में देख सकते हैं।', account: 'मेरा खाता', failed: 'भुगतान पूरा नहीं हुआ। आपसे कोई राशि नहीं ली गई; कृपया फिर प्रयास करें।', mock: 'टेस्ट मोड – कोई वास्तविक भुगतान नहीं।', simulate: 'सफल भुगतान का अनुकरण करें', priceSoon: 'मूल्य पूछताछ पर', loginHint: 'पहले से खाता है?', signIn: 'साइन इन करें', privacy: 'आपकी जानकारी एन्क्रिप्टेड रहती है और केवल इसी विश्लेषण के लिए उपयोग होती है।' },
};

/** "Book & pay" button (or "Enquire" while the owner has not confirmed a price) and the booking dialog. */
export function BookService({ svc, className }: { svc: PublicService; className?: string }) {
  const { lang } = useApp();
  const t = T[lang];
  const [open, setOpen] = React.useState(false);
  if (!svc.payable) return <Link href={`/contact?topic=service`} className={buttonVariants({ variant: 'outline', className })}><MessageCircle className="h-4 w-4" />{t.enquire}</Link>;
  return (
    <>
      <Button variant="gold" className={className} onClick={() => setOpen(true)}><Sparkles className="h-4 w-4" />{t.book}</Button>
      {open && <BookDialog svc={svc} onClose={() => setOpen(false)} />}
    </>
  );
}

function BookDialog({ svc, onClose }: { svc: PublicService; onClose: () => void }) {
  const { lang, me, t: dict, refreshMe } = useApp();
  const t = T[lang]; const text = svc[lang];
  const u = me?.user;
  const [d, setD] = React.useState<Record<string, string>>({ clientName: u?.name ?? '', gender: 'male' });
  const [bill, setBill] = React.useState({ name: u?.name ?? '', email: u?.email ?? '', phone: (u?.phone ?? '').replace(/^\+91/, ''), state: u?.billingState ?? '', gstin: '' });
  const [busy, setBusy] = React.useState(false);
  const [stage, setStage] = React.useState<'form' | 'confirming' | 'ok' | 'fail'>('form');
  const [order, setOrder] = React.useState<Order | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value });
  const has = (k: ServiceIntakeField) => svc.intake.includes(k);
  const required: ServiceIntakeField[] = ['clientName', 'dob', 'gender', 'currentName', 'partnerName', 'partnerDob'];
  const missing = svc.intake.some((k) => required.includes(k) && !(d[k] ?? '').trim()) || !bill.state || (!u && (!bill.email.trim() || !bill.phone.trim())) || (u && !bill.phone.trim() && !u.phone);
  const label = (k: ServiceIntakeField) => (k === 'dob' && has('parents') ? t.f.dobBaby : k === 'mobile' && svc.code === 'SVC_MOBILE_NUMBER' ? t.f.mobileMain : k === 'currentName' && svc.code === 'SVC_BUSINESS_NAME' ? t.f.business : t.f[k]);

  async function pay() {
    setBusy(true); setError(null);
    try {
      const intake = Object.fromEntries(svc.intake.map((k) => [k, (d[k] ?? '').trim()]).filter(([, v]) => v));
      const o = await api<Order>('/api/billing/checkout', { method: 'POST', json: { planCode: svc.code, intake, billingState: bill.state, billingName: bill.name || undefined, email: u ? undefined : bill.email.trim(), phone: bill.phone || undefined, gstin: bill.gstin || undefined } });
      setOrder(o);
      if (!u) await refreshMe(); // a new account was created for the guest
      if (o.gateway === 'cashfree') {
        const Cashfree = await loadCashfree();
        const r = await Cashfree({ mode: o.mode === 'production' ? 'production' : 'sandbox' }).checkout({ paymentSessionId: o.paymentSessionId, redirectTarget: '_modal' });
        if (r.redirect) return;
        setStage('confirming');
        const st = await confirmCashfreeOrder(o.orderId);
        setStage(st === 'paid' ? 'ok' : st === 'failed' || r.error ? 'fail' : 'confirming');
      }
    } catch (e) {
      setError(e instanceof ApiError ? (dict.pricing.errors[e.body.error ?? ''] ?? e.message) : dict.err.server);
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="bk-title" onClick={onClose}>
      <div className="glass my-8 w-full max-w-lg rounded-xl bg-background p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-gold">{t.title}</p><h2 id="bk-title" className="font-serif text-xl font-semibold">{text.name}</h2><p className="text-xs text-muted-foreground">{text.delivery}</p></div><Button variant="ghost" size="icon" onClick={onClose} aria-label={lang === 'hi' ? 'बंद करें' : 'Close'}><X /></Button></div>
        {stage === 'ok' ? (
          <div className="space-y-3 py-4 text-center" role="status"><CheckCircle2 className="mx-auto h-12 w-12 text-success" /><p className="font-semibold">{t.ok}</p><p className="text-sm text-muted-foreground">{t.okText}</p><Link href="/account" className={buttonVariants({ variant: 'gold' })}>{t.account}</Link></div>
        ) : stage === 'confirming' ? (
          <p className="py-6 text-center text-sm" role="status">{t.confirming}</p>
        ) : (
          <div className="space-y-4">
            <fieldset className="space-y-3"><legend className="mb-1 text-sm font-semibold">{t.details}</legend>
              {has('currentName') && <Field label={label('currentName')} htmlFor="bk-cn" required><Input id="bk-cn" value={d.currentName ?? ''} onChange={set('currentName')} maxLength={120} /></Field>}
              {has('clientName') && <Field label={t.f.clientName} htmlFor="bk-name" required><Input id="bk-name" value={d.clientName ?? ''} onChange={set('clientName')} maxLength={120} /></Field>}
              <div className="grid gap-3 sm:grid-cols-2">
                {has('dob') && <Field label={label('dob')} htmlFor="bk-dob" required><Input id="bk-dob" type="date" min="1900-01-01" max={toIso(todayIST())} value={d.dob ?? ''} onChange={set('dob')} /></Field>}
                {has('gender') && <Field label={t.f.gender}><ChipGroup options={[{ value: 'male', label: t.male }, { value: 'female', label: t.female }]} value={[d.gender ?? 'male']} onChange={(v) => setD({ ...d, gender: v[0] ?? 'male' })} /></Field>}
                {has('tob') && <Field label={t.f.tob} htmlFor="bk-tob"><Input id="bk-tob" type="time" value={d.tob ?? ''} onChange={set('tob')} /></Field>}
                {has('pob') && <Field label={t.f.pob} htmlFor="bk-pob"><Input id="bk-pob" value={d.pob ?? ''} onChange={set('pob')} maxLength={120} /></Field>}
                {has('mobile') && <Field label={label('mobile')} htmlFor="bk-mob"><Input id="bk-mob" type="tel" inputMode="numeric" value={d.mobile ?? ''} onChange={set('mobile')} maxLength={20} /></Field>}
                {has('letters') && <Field label={t.f.letters} htmlFor="bk-let"><Input id="bk-let" value={d.letters ?? ''} onChange={set('letters')} maxLength={60} /></Field>}
              </div>
              {has('partnerName') && <div className="grid gap-3 sm:grid-cols-2"><Field label={t.f.partnerName} htmlFor="bk-pn" required><Input id="bk-pn" value={d.partnerName ?? ''} onChange={set('partnerName')} maxLength={120} /></Field>{has('partnerDob') && <Field label={t.f.partnerDob} htmlFor="bk-pd" required><Input id="bk-pd" type="date" min="1900-01-01" max={toIso(todayIST())} value={d.partnerDob ?? ''} onChange={set('partnerDob')} /></Field>}</div>}
              {has('parents') && <Field label={t.f.parents} htmlFor="bk-par"><Input id="bk-par" value={d.parents ?? ''} onChange={set('parents')} maxLength={200} /></Field>}
              {has('questions') && <Field label={t.f.questions} htmlFor="bk-q"><textarea id="bk-q" rows={3} maxLength={2000} value={d.questions ?? ''} onChange={set('questions')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></Field>}
            </fieldset>
            <fieldset className="space-y-3"><legend className="mb-1 text-sm font-semibold">{t.billing}</legend>
              {!u && <p className="text-xs text-muted-foreground">{t.loginHint} <Link href="/login?next=/services" className="text-gold underline">{t.signIn}</Link></p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.billName} htmlFor="bk-bn"><Input id="bk-bn" value={bill.name} onChange={(e) => setBill({ ...bill, name: e.target.value })} maxLength={120} /></Field>
                {!u && <Field label={t.email} htmlFor="bk-em" required><Input id="bk-em" type="email" value={bill.email} onChange={(e) => setBill({ ...bill, email: e.target.value })} /></Field>}
                {(!u || !u.phone) && <Field label={t.phone} htmlFor="bk-ph" required><Input id="bk-ph" type="tel" inputMode="numeric" placeholder="98765 43210" value={bill.phone} onChange={(e) => setBill({ ...bill, phone: e.target.value })} maxLength={14} /></Field>}
                <Field label={t.state} htmlFor="bk-st" required><Select id="bk-st" value={bill.state} onChange={(e) => setBill({ ...bill, state: e.target.value })}><option value="">{t.select}</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
                <Field label={t.gstin} htmlFor="bk-gst"><Input id="bk-gst" maxLength={15} value={bill.gstin} onChange={(e) => setBill({ ...bill, gstin: e.target.value.toUpperCase() })} /></Field>
              </div>
            </fieldset>
            <div className="flex items-center justify-between rounded-md bg-muted p-3 text-sm font-semibold"><span>{t.total}</span><span>{inr(svc.pricePaise ?? 0)}</span></div>
            <p className="text-xs text-muted-foreground">{t.privacy}</p>
            <DisclaimerNote agree />
            {order?.mock ? (
              <div className="space-y-2 rounded-md border border-warning/40 bg-warning/10 p-3"><p className="text-xs">{t.mock}</p>
                <Button variant="gold" className="w-full" onClick={async () => { try { await api('/api/billing/mock-pay', { method: 'POST', json: { orderId: order.orderId } }); setStage('ok'); } catch { setStage('fail'); } }}>{t.simulate}</Button></div>
            ) : (
              <Button variant="gold" size="lg" className="w-full" disabled={busy || !!missing} onClick={pay}>{busy ? t.paying : t.pay(inr(svc.pricePaise ?? 0))}</Button>
            )}
            {stage === 'fail' && <p className="text-sm text-danger" role="alert">{t.failed}</p>}
            {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Shown on /services after a bank redirect (?cf_order=…). */
export function ServiceReturnBanner() {
  const { lang, me } = useApp();
  const [st, setSt] = React.useState<'checking' | 'paid' | 'pending' | 'failed' | null>(null);
  React.useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('cf_order');
    if (!id || !id.startsWith('cf_') || !me?.user) return;
    setSt('checking');
    confirmCashfreeOrder(id).then(setSt).catch(() => setSt('pending')).finally(() => window.history.replaceState(null, '', '/services'));
  }, [me?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!st) return null;
  const t = T[lang];
  return <p role="status" className={`mx-auto max-w-xl rounded-md p-3 text-center text-sm ${st === 'paid' ? 'bg-success/15 text-success' : st === 'failed' ? 'bg-danger/10 text-danger' : 'bg-muted'}`}>{st === 'paid' ? `${t.ok} ${t.okText}` : st === 'failed' ? t.failed : t.confirming}</p>;
}
