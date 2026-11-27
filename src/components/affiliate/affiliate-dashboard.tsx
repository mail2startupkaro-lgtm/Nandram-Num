'use client';
/**
 * My account → Affiliate program. Not yet an affiliate: the application form. Pending / rejected / suspended: status.
 * Approved: referral link + coupon, live stats, a link for every service with "you earn", ready-made share messages,
 * commissions, payouts and payout details.
 */
import * as React from 'react';
import Link from 'next/link';
import { Check, Clock, Copy, Gift, IndianRupee, Link2, Loader2, MessageCircle, MousePointerClick, Send, ShoppingBag, Wallet } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import { commissionFor, exGst, money, REF_PARAM } from '@/lib/affiliate/program';
import { cn } from '@/lib/utils';

type Sum = Record<string, number>;
interface Data {
  affiliate: null | { code: string; status: 'pending' | 'approved' | 'rejected' | 'suspended'; name: string | null; phone: string | null; channel: string | null; ratePercent: number; payoutMethod: string | null; payoutMasked: string; createdAt: string };
  settings: { enabled: boolean; defaultPercent: number; cookieDays: number; holdDays: number; minPayoutInr: number; minPayoutUsd: number; customerDiscountPercent: number };
  stats?: { clicks: number; clicks30: number; sales: number; onHold: Sum; available: Sum; paid: Sum };
  commissions?: { id: string; planCode: string; source: string; currency: string; salePaise: number; ratePercent: number; commissionPaise: number; status: string; earnedAt: string | null }[];
  payouts?: { id: string; currency: string; amountPaise: number; method: string | null; reference: string | null; createdAt: string }[];
  names: Record<string, { en: string; hi: string }>;
  products: { code: string; name: { en: string; hi: string }; path: string; pricePaise: number; usdCents: number | null }[];
  user: { name: string | null; phone: string | null };
}

const sumText = (m: Sum | undefined) => { const e = Object.entries(m ?? {}).filter(([, v]) => v > 0); return e.length ? e.map(([c, v]) => money(v, c)).join(' + ') : '₹0'; };
const dt = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '–');

function CopyBtn({ text, label, small }: { text: string; label: string; small?: boolean }) {
  const [ok, setOk] = React.useState(false);
  return (
    <Button type="button" size="sm" variant={small ? 'ghost' : 'outline'} onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* ignore */ } }} aria-label={label}>
      {ok ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}{!small && <span>{label}</span>}
    </Button>
  );
}

/** UPI or bank fields; returns { payoutMethod, payout } or null when empty. */
function PayoutFields({ hi, value, onChange }: { hi: boolean; value: { method: 'upi' | 'bank'; upi: string; accountName: string; accountNumber: string; ifsc: string; bankName: string }; onChange: (v: typeof value) => void }) {
  const set = (k: keyof typeof value) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={hi ? 'भुगतान का तरीका' : 'Payout method'} htmlFor="af-pm"><Select id="af-pm" value={value.method} onChange={set('method')}><option value="upi">UPI</option><option value="bank">{hi ? 'बैंक ट्रांसफ़र' : 'Bank transfer'}</option></Select></Field>
      {value.method === 'upi' ? (
        <Field label="UPI ID" htmlFor="af-upi" hint="name@okaxis"><Input id="af-upi" value={value.upi} onChange={set('upi')} autoComplete="off" /></Field>
      ) : (
        <>
          <Field label={hi ? 'खाताधारक का नाम' : 'Account holder name'} htmlFor="af-an"><Input id="af-an" value={value.accountName} onChange={set('accountName')} autoComplete="off" /></Field>
          <Field label={hi ? 'खाता संख्या' : 'Account number'} htmlFor="af-ac"><Input id="af-ac" inputMode="numeric" value={value.accountNumber} onChange={set('accountNumber')} autoComplete="off" /></Field>
          <Field label="IFSC" htmlFor="af-ifsc"><Input id="af-ifsc" value={value.ifsc} onChange={(e) => onChange({ ...value, ifsc: e.target.value.toUpperCase() })} autoComplete="off" /></Field>
          <Field label={hi ? 'बैंक का नाम' : 'Bank name'} htmlFor="af-bn"><Input id="af-bn" value={value.bankName} onChange={set('bankName')} autoComplete="off" /></Field>
        </>
      )}
    </div>
  );
}
const emptyPayout = { method: 'upi' as 'upi' | 'bank', upi: '', accountName: '', accountNumber: '', ifsc: '', bankName: '' };
const payoutBody = (p: typeof emptyPayout) => (p.method === 'upi'
  ? (p.upi.trim() ? { payoutMethod: 'upi', payout: { upi: p.upi.trim() } } : {})
  : (p.accountNumber.trim() ? { payoutMethod: 'bank', payout: { accountName: p.accountName, accountNumber: p.accountNumber.replace(/\s/g, ''), ifsc: p.ifsc, bankName: p.bankName || undefined } } : {}));
const errText = (e: unknown, hi: boolean) => (e instanceof ApiError ? (e.body.error === 'PROGRAM_CLOSED' ? (hi ? 'अभी नए आवेदन बंद हैं।' : 'Applications are closed right now.') : e.message) : (hi ? 'कुछ गलत हुआ, फिर से प्रयास करें।' : 'Something went wrong – please try again.'));

function ApplyForm({ d, hi, onDone }: { d: Data; hi: boolean; onDone: () => void }) {
  const [f, setF] = React.useState({ name: d.user.name ?? '', phone: d.user.phone ?? '', channel: '', audience: '', promotion: '' });
  const [p, setP] = React.useState(emptyPayout);
  const [agree, setAgree] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api('/api/affiliate/me', { method: 'POST', json: { ...f, audience: f.audience || undefined, agree, ...payoutBody(p) } }); onDone(); }
    catch (x) { setErr(errText(x, hi)); } finally { setBusy(false); }
  }
  const s = d.settings;
  return (
    <form onSubmit={submit} className="glass space-y-5 rounded-xl border border-gold/30 p-5 sm:p-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold">{hi ? 'एफ़िलिएट के रूप में आवेदन करें' : 'Apply to become an affiliate'}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{hi ? `हर सशुल्क ऑर्डर पर ${s.defaultPercent}% कमीशन (GST छोड़कर)। आवेदन की जाँच के बाद आपका लिंक सक्रिय होगा।` : `Earn ${s.defaultPercent}% on every paid order (excl. GST). Your link goes live once we approve your application.`} <Link href="/affiliate-program" className="text-gold underline-offset-2 hover:underline">{hi ? 'प्रोग्राम विवरण' : 'Program details'}</Link></p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={hi ? 'आपका नाम' : 'Your name'} htmlFor="af-name" required><Input id="af-name" value={f.name} onChange={set('name')} maxLength={120} required /></Field>
        <Field label={hi ? 'मोबाइल / WhatsApp' : 'Mobile / WhatsApp'} htmlFor="af-ph"><Input id="af-ph" value={f.phone} onChange={set('phone')} maxLength={20} inputMode="tel" /></Field>
        <Field label={hi ? 'आप कहाँ प्रमोट करेंगे? (लिंक)' : 'Where will you promote? (link)'} htmlFor="af-ch" hint={hi ? 'YouTube, Instagram, वेबसाइट, Telegram…' : 'YouTube, Instagram, website, Telegram…'}><Input id="af-ch" value={f.channel} onChange={set('channel')} maxLength={300} placeholder="youtube.com/@…" /></Field>
        <Field label={hi ? 'आपके दर्शक / फ़ॉलोअर्स' : 'Audience / followers'} htmlFor="af-au">
          <Select id="af-au" value={f.audience} onChange={set('audience')}>
            <option value="">{hi ? 'चुनें' : 'Choose'}</option><option value="under1k">{hi ? '1,000 से कम' : 'Under 1,000'}</option><option value="1k-10k">1,000 – 10,000</option><option value="10k-50k">10,000 – 50,000</option><option value="50k-1L">50,000 – 1,00,000</option><option value="over1L">{hi ? '1 लाख से अधिक' : 'Over 1 lakh'}</option><option value="offline">{hi ? 'ऑफ़लाइन / अपने क्लाइंट' : 'Offline / my own clients'}</option>
          </Select>
        </Field>
      </div>
      <Field label={hi ? 'आप कैसे प्रमोट करेंगे?' : 'How will you promote us?'} htmlFor="af-pr"><textarea id="af-pr" value={f.promotion} onChange={set('promotion')} maxLength={1500} rows={3} className="w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm" placeholder={hi ? 'जैसे: लाइव सत्र में, वीडियो विवरण में, WhatsApp ग्रुप में…' : 'e.g. in my live sessions, video descriptions, WhatsApp group…'} /></Field>
      <div className="space-y-2">
        <p className="text-sm font-semibold">{hi ? 'भुगतान विवरण (बाद में भी जोड़ सकते हैं)' : 'Payout details (you can add these later)'}</p>
        <PayoutFields hi={hi} value={p} onChange={setP} />
        <p className="text-xs text-muted-foreground">{hi ? 'आपका विवरण एन्क्रिप्ट करके सुरक्षित रखा जाता है और केवल भुगतान के लिए उपयोग होता है।' : 'Stored encrypted and used only to pay you.'}</p>
      </div>
      <Checkbox id="af-agree" checked={agree} onChange={setAgree} label={<>{hi ? 'मैं ' : 'I agree to the '}<Link href="/affiliate-program#terms" target="_blank" className="text-gold underline">{hi ? 'प्रोग्राम के नियमों' : 'program rules'}</Link>{hi ? ' से सहमत हूँ (कोई स्पैम या भ्रामक दावे नहीं)।' : ' (no spam or misleading claims).'}</>} />
      {err && <p className="text-sm text-danger" role="alert">{err}</p>}
      <Button type="submit" variant="gold" disabled={busy || !agree || f.name.trim().length < 2}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{hi ? 'आवेदन भेजें' : 'Submit application'}</Button>
    </form>
  );
}

function PayoutEdit({ d, hi, onDone }: { d: Data; hi: boolean; onDone: () => void }) {
  const [open, setOpen] = React.useState(!d.affiliate?.payoutMethod);
  const [p, setP] = React.useState(emptyPayout);
  const [msg, setMsg] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  async function save() {
    setBusy(true); setMsg('');
    try { await api('/api/affiliate/me', { method: 'PATCH', json: payoutBody(p) }); setOpen(false); onDone(); }
    catch (x) { setMsg(errText(x, hi)); } finally { setBusy(false); }
  }
  return (
    <section className="glass space-y-3 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold"><Wallet className="h-5 w-5 text-gold" />{hi ? 'भुगतान विवरण' : 'Payout details'}</h3>
        {!open && <Button size="sm" variant="outline" onClick={() => setOpen(true)}>{hi ? 'बदलें' : 'Change'}</Button>}
      </div>
      {d.affiliate?.payoutMasked ? <p className="text-sm">{d.affiliate.payoutMethod === 'upi' ? 'UPI' : (hi ? 'बैंक' : 'Bank')}: <b>{d.affiliate.payoutMasked}</b></p> : <p className="text-sm text-warning">{hi ? 'भुगतान पाने के लिए UPI या बैंक विवरण जोड़ें।' : 'Add your UPI or bank details to receive payouts.'}</p>}
      {open && <><PayoutFields hi={hi} value={p} onChange={setP} /><div className="flex gap-2"><Button size="sm" variant="gold" onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{hi ? 'सहेजें' : 'Save'}</Button>{d.affiliate?.payoutMethod && <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>{hi ? 'रद्द' : 'Cancel'}</Button>}</div></>}
      {msg && <p className="text-sm text-danger">{msg}</p>}
    </section>
  );
}

export function AffiliateDashboard() {
  const { lang } = useApp();
  const hi = lang === 'hi';
  const [d, setD] = React.useState<Data | null>(null);
  const [err, setErr] = React.useState(false);
  const load = React.useCallback(() => { api<Data>('/api/affiliate/me').then((x) => { setD(x); setErr(false); }).catch(() => setErr(true)); }, []);
  React.useEffect(load, [load]);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.mynumerologist.com';

  if (err) return <div className="container max-w-md py-16 text-center"><p className="text-danger">{hi ? 'लोड नहीं हो सका।' : 'Could not load.'}</p><Button className="mt-3" variant="outline" onClick={load}>{hi ? 'पुनः प्रयास करें' : 'Try again'}</Button></div>;
  if (!d) return <div className="container py-12"><div className="h-40 animate-pulse rounded-lg bg-muted" /></div>;
  const a = d.affiliate, s = d.settings;
  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{hi ? 'मेरा खाता' : 'My account'}</p><h1 className="font-serif text-3xl font-bold sm:text-4xl">{hi ? 'एफ़िलिएट प्रोग्राम' : 'Affiliate program'}</h1></div>
      <Link href="/account" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>{hi ? '← खाते पर वापस' : '← Back to account'}</Link>
    </div>
  );
  if (!a) return <div className="container max-w-3xl space-y-6 py-8 sm:py-12">{header}{s.enabled ? <ApplyForm d={d} hi={hi} onDone={load} /> : <p className="glass rounded-lg p-5 text-sm">{hi ? 'अभी नए आवेदन रुके हुए हैं।' : 'New applications are paused right now.'}</p>}</div>;
  if (a.status !== 'approved') {
    const t = a.status === 'pending'
      ? { tone: 'warn' as const, en: ['Application under review', `Thank you! We usually review applications within 1–2 working days. Your code ${a.code} is reserved and your link starts working once approved.`], hi: ['आवेदन की जाँच चल रही है', `धन्यवाद! हम प्रायः 1–2 कार्य-दिवस में आवेदन देखते हैं। आपका कोड ${a.code} आरक्षित है और स्वीकृति के बाद लिंक काम करने लगेगा।`] }
      : a.status === 'rejected'
        ? { tone: 'bad' as const, en: ['Application not approved', 'Sorry, we could not approve your application this time. You can message us on Telegram if you have questions.'], hi: ['आवेदन स्वीकृत नहीं हुआ', 'क्षमा करें, इस बार हम आपका आवेदन स्वीकृत नहीं कर सके। प्रश्न हों तो टेलीग्राम पर संदेश भेजें।'] }
        : { tone: 'bad' as const, en: ['Account paused', 'Your affiliate account is paused. Please contact us on Telegram.'], hi: ['खाता रोका गया', 'आपका एफ़िलिएट खाता रोका गया है। कृपया टेलीग्राम पर संपर्क करें।'] };
    return (
      <div className="container max-w-3xl space-y-6 py-8 sm:py-12">{header}
        <div className="glass space-y-2 rounded-xl border border-gold/30 p-6"><Badge tone={t.tone}>{hi ? t.hi[0] : t.en[0]}</Badge><p className="text-sm">{hi ? t.hi[1] : t.en[1]}</p></div>
        {a.status === 'pending' && <PayoutEdit d={d} hi={hi} onDone={load} />}
      </div>
    );
  }

  const st = d.stats!;
  const home = `${origin}/?${REF_PARAM}=${a.code}`;
  const discount = s.customerDiscountPercent;
  const share = hi
    ? `🙏 अपनी जन्म तिथि और नाम से जानें अपना भाग्य – आचार्य नंदराम की अंक ज्योतिष रिपोर्ट, 3 घंटे में, हिंदी या अंग्रेज़ी में।${discount ? ` कोड ${a.code} से ${discount}% छूट पाएँ।` : ''}\n${home}`
    : `🙏 Discover what your date of birth and name say about you – Acharya Nandram's numerology reports, delivered in 3 hours, in English or Hindi.${discount ? ` Use code ${a.code} for ${discount}% off.` : ''}\n${home}`;
  const cards = [
    { icon: MousePointerClick, k: hi ? 'क्लिक (30 दिन)' : 'Clicks (30 days)', v: String(st.clicks30), s: hi ? `कुल ${st.clicks}` : `${st.clicks} all time` },
    { icon: ShoppingBag, k: hi ? 'बिक्री' : 'Sales', v: String(st.sales), s: st.clicks ? `${((st.sales / st.clicks) * 100).toFixed(1)}% ${hi ? 'रूपांतरण' : 'conversion'}` : '' },
    { icon: Clock, k: hi ? 'होल्ड पर' : 'On hold', v: sumText(st.onHold), s: hi ? `${s.holdDays} दिन की रिफ़ंड अवधि` : `${s.holdDays}-day refund window` },
    { icon: Wallet, k: hi ? 'भुगतान के लिए उपलब्ध' : 'Available', v: sumText(st.available), s: hi ? `न्यूनतम ₹${s.minPayoutInr}` : `paid from ₹${s.minPayoutInr}` },
    { icon: IndianRupee, k: hi ? 'कुल भुगतान' : 'Paid to you', v: sumText(st.paid), s: hi ? `${d.payouts?.length ?? 0} भुगतान` : `${d.payouts?.length ?? 0} payouts` },
  ];
  const statusBadge = (x: string) => <Badge tone={x === 'paid' ? 'good' : x === 'available' ? 'gold' : x === 'cancelled' ? 'bad' : 'warn'}>{hi ? ({ paid: 'भुगतान हुआ', available: 'उपलब्ध', cancelled: 'रद्द', on_hold: 'होल्ड पर' } as Record<string, string>)[x] ?? x : ({ paid: 'Paid', available: 'Available', cancelled: 'Cancelled', on_hold: 'On hold' } as Record<string, string>)[x] ?? x}</Badge>;

  return (
    <div className="container max-w-5xl space-y-6 py-8 sm:py-12">
      {header}
      <section className="sh-hero relative overflow-hidden rounded-2xl p-5 sm:p-6">
        <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0 space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-gold"><Link2 className="h-4 w-4" />{hi ? 'आपका रेफ़रल लिंक' : 'Your referral link'} · {a.ratePercent}% {hi ? 'कमीशन' : 'commission'}</p>
            <div className="flex flex-wrap items-center gap-2"><code className="min-w-0 max-w-full truncate rounded-md border border-gold/30 bg-background/70 px-3 py-2 text-sm">{home}</code><CopyBtn text={home} label={hi ? 'कॉपी' : 'Copy link'} /></div>
            <p className="text-xs text-muted-foreground">{hi ? `किसी भी पेज के अंत में ?${REF_PARAM}=${a.code} जोड़ें – ${s.cookieDays} दिन तक की बिक्री आपकी।` : `Add ?${REF_PARAM}=${a.code} to any page on the site – sales within ${s.cookieDays} days are yours.`}</p>
          </div>
          {discount > 0 && (
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-center">
              <p className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wider text-gold"><Gift className="h-3.5 w-3.5" />{hi ? 'आपका कूपन कोड' : 'Your coupon code'}</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider">{a.code}</p>
              <p className="text-xs text-muted-foreground">{hi ? `ग्राहक को ${discount}% छूट` : `${discount}% off for your audience`}</p>
              <div className="mt-2"><CopyBtn text={a.code} label={hi ? 'कोड कॉपी' : 'Copy code'} /></div>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((c) => <div key={c.k} className="glass rounded-lg p-4"><p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><c.icon className="h-3.5 w-3.5 text-gold" />{c.k}</p><p className="mt-1 font-serif text-xl font-bold text-gold">{c.v}</p>{c.s && <p className="text-xs text-muted-foreground">{c.s}</p>}</div>)}
      </div>

      <section className="glass space-y-3 rounded-xl p-5">
        <h2 className="text-xl font-semibold">{hi ? 'साझा करने के लिए तैयार संदेश' : 'Ready-to-share message'}</h2>
        <p className="whitespace-pre-line rounded-lg border border-gold/20 bg-background/60 p-3 text-sm">{share}</p>
        <div className="flex flex-wrap gap-2">
          <CopyBtn text={share} label={hi ? 'संदेश कॉपी करें' : 'Copy message'} />
          <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}><MessageCircle className="h-4 w-4" />WhatsApp</a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(home)}&text=${encodeURIComponent(share.split('\n')[0])}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}><Send className="h-4 w-4" />Telegram</a>
        </div>
      </section>

      <section className="glass space-y-3 rounded-xl p-5">
        <h2 className="text-xl font-semibold">{hi ? 'हर सेवा का लिंक' : 'Links for every service'}</h2>
        <p className="text-sm text-muted-foreground">{hi ? 'वीडियो या पोस्ट के विषय से मेल खाता लिंक दें – सही पेज पर पहुँचने वाले ज़्यादा ख़रीदते हैं।' : 'Share the link that matches your video or post – people who land on the right page buy more often.'}</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-3">{hi ? 'सेवा' : 'Service'}</th><th className="pr-3 text-right">{hi ? 'मूल्य' : 'Price'}</th><th className="pr-3 text-right">{hi ? 'आपकी कमाई' : 'You earn'}</th><th className="text-right">{hi ? 'लिंक' : 'Link'}</th></tr></thead>
          <tbody>{d.products.map((p) => { const url = `${origin}${p.path}?${REF_PARAM}=${a.code}`; return (
            <tr key={p.code} className="border-b border-border/50">
              <td className="py-2 pr-3 font-medium">{hi ? p.name.hi : p.name.en}</td>
              <td className="pr-3 text-right text-muted-foreground">{money(p.pricePaise, 'INR')}</td>
              <td className="pr-3 text-right font-semibold text-gold">{money(commissionFor(exGst(p.pricePaise), a.ratePercent), 'INR')}</td>
              <td className="text-right"><CopyBtn text={url} label={hi ? 'लिंक कॉपी' : 'Copy link'} small /></td>
            </tr>); })}</tbody>
        </table></div>
      </section>

      <section className="glass space-y-3 rounded-xl p-5">
        <h2 className="text-xl font-semibold">{hi ? 'आपकी बिक्री और कमीशन' : 'Your sales and commissions'}</h2>
        {!d.commissions?.length ? <p className="text-sm text-muted-foreground">{hi ? 'अभी कोई बिक्री नहीं। अपना लिंक साझा करें – पहली बिक्री यहाँ दिखेगी।' : 'No sales yet. Share your link – your first sale will show here.'}</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-3">{hi ? 'तिथि' : 'Date'}</th><th className="pr-3">{hi ? 'सेवा' : 'Service'}</th><th className="pr-3">{hi ? 'स्रोत' : 'Via'}</th><th className="pr-3 text-right">{hi ? 'ऑर्डर (GST छोड़कर)' : 'Order (excl. GST)'}</th><th className="pr-3 text-right">{hi ? 'कमीशन' : 'Commission'}</th><th>{hi ? 'स्थिति' : 'Status'}</th></tr></thead>
            <tbody>{d.commissions.map((c) => (
              <tr key={c.id} className="border-b border-border/50">
                <td className="py-2 pr-3">{dt(c.earnedAt)}</td><td className="pr-3">{(hi ? d.names[c.planCode]?.hi : d.names[c.planCode]?.en) ?? c.planCode}</td>
                <td className="pr-3 text-muted-foreground">{c.source === 'coupon' ? (hi ? 'कूपन' : 'Coupon') : (hi ? 'लिंक' : 'Link')}</td>
                <td className="pr-3 text-right">{money(c.salePaise, c.currency)}</td><td className={cn('pr-3 text-right font-semibold', c.status === 'cancelled' ? 'text-muted-foreground line-through' : 'text-gold')}>{money(c.commissionPaise, c.currency)}</td>
                <td>{statusBadge(c.status)}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <PayoutEdit d={d} hi={hi} onDone={load} />
        <section className="glass space-y-3 rounded-xl p-5">
          <h3 className="font-semibold">{hi ? 'भुगतान इतिहास' : 'Payout history'}</h3>
          {!d.payouts?.length ? <p className="text-sm text-muted-foreground">{hi ? `अभी कोई भुगतान नहीं। उपलब्ध राशि ₹${s.minPayoutInr} होने पर हम भुगतान करते हैं।` : `No payouts yet. We pay once your available balance reaches ₹${s.minPayoutInr}.`}</p> : (
            <ul className="space-y-1 text-sm">{d.payouts.map((p) => <li key={p.id} className="flex justify-between border-b border-border/40 py-1"><span>{dt(p.createdAt)} · {p.method ?? ''}{p.reference ? ` · ${p.reference}` : ''}</span><b className="text-success">{money(p.amountPaise, p.currency)}</b></li>)}</ul>
          )}
        </section>
      </div>
      <p className="text-xs text-muted-foreground">{hi ? 'नियम: ' : 'Rules: '}<Link href="/affiliate-program#terms" className="text-gold underline-offset-2 hover:underline">{hi ? 'प्रोग्राम के नियम देखें' : 'see the program rules'}</Link></p>
    </div>
  );
}
