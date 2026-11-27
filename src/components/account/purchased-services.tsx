'use client';
/**
 * "My purchased readings" – the client's report area for paid services.
 * Live, animated status per order: Details received → Preparing your report → Final checks → Ready for download.
 * Polls the server every 30 s while a report is being prepared and counts down to the ready time every second.
 */
import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ClipboardCheck, Clock, Download, Feather, Loader2, Mail, PauseCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button, buttonVariants } from '@/components/ui/button';
import { api, ApiError, download } from '@/lib/client/api';
import { confirmCashfreeOrder } from '@/lib/client/cashfree';
import { useTimeZone } from '@/lib/client/currency';
import { isIST } from '@/lib/client/working-hours';
import type { DeliveryState } from '@/lib/service-delivery';
import { cn } from '@/lib/utils';

export interface MyServiceOrder {
  id: string; serviceCode: string; name: { en: string; hi: string } | null; status: string; createdAt: string; paidAt: string | null; deliveredAt: string | null;
  invoiceNumber: string | null; forName: string | null; forRelation: string | null; forProfileId: string | null; auto: boolean; needsDetails: boolean; delivery: DeliveryState;
}

const T = {
  en: {
    title: 'My purchased readings', sub: 'Your report appears here automatically – no need to refresh the page.', sla: 'Ready within 3 hours',
    steps: (auto: boolean) => [
      ['Details received', 'Payment confirmed and your details are saved.'],
      ['Acharya Nandram – preparing your report', auto ? 'Your report is being prepared with Acharya Nandram\'s numerology method.' : 'Acharya Nandram is preparing your report.'],
      ['Final checks', 'Numbers, remedies and the design are being checked.'],
      ['Ready for download', 'Your PDF report is ready.'],
    ] as [string, string][],
    working: ['Calculating your Moolank and Bhagyank…', 'Placing your numbers in the Lo Shu grid…', 'Reading your name and mobile vibrations…', 'Working out your personal year and timing…', 'Choosing remedies that suit your chart…', 'Designing your PDF report…'],
    readyIn: (s: string) => `Ready in ${s}`, expected: (t: string) => `Expected by ${t}`, almost: 'Almost ready – final touches…', hold: 'Your report is taking a little longer. We will update you here shortly.',
    download: 'Download report (PDF)', downloading: 'Preparing your PDF…', firstTime: 'The first download can take up to a minute while your PDF is created.',
    emailed: 'Your report has been delivered by email / Telegram. For a fresh copy, message us on Telegram @MYNUMEROLOGIST8.',
    forWho: 'Reading for', paid: 'Paid', invoice: 'Invoice', cancelled: 'Cancelled – please contact us if this is unexpected.', details: 'Some details are missing for this report. Please message us on Telegram @MYNUMEROLOGIST8 so we can complete it.',
    statusReady: 'Ready', statusPrep: 'In preparation', another: 'Book another reading', err: 'Could not download right now. Please try again in a minute.',
    paidBanner: 'Payment received – thank you! Your report has started below.', pendingBanner: 'We are confirming your payment with the bank. This page updates by itself.', failedBanner: 'The payment did not complete. You have not been charged.',
  },
  hi: {
    title: 'मेरी ख़रीदी गई रीडिंग', sub: 'आपकी रिपोर्ट यहाँ अपने-आप दिखेगी – पेज रिफ़्रेश करने की ज़रूरत नहीं।', sla: '3 घंटे के भीतर तैयार',
    steps: (auto: boolean) => [
      ['विवरण प्राप्त', 'भुगतान की पुष्टि हुई और आपका विवरण सहेज लिया गया है।'],
      ['आचार्य नंदराम – आपकी रिपोर्ट तैयार हो रही है', auto ? 'आपकी रिपोर्ट आचार्य नंदराम की अंक ज्योतिष पद्धति से तैयार की जा रही है।' : 'आचार्य नंदराम आपकी रिपोर्ट तैयार कर रहे हैं।'],
      ['अंतिम जाँच', 'अंक, उपाय और डिज़ाइन की जाँच हो रही है।'],
      ['डाउनलोड के लिए तैयार', 'आपकी PDF रिपोर्ट तैयार है।'],
    ] as [string, string][],
    working: ['आपके मूलांक और भाग्यांक की गणना…', 'लो शू ग्रिड में आपके अंक रखे जा रहे हैं…', 'नाम और मोबाइल के कंपन पढ़े जा रहे हैं…', 'व्यक्तिगत वर्ष और समय की गणना…', 'आपकी कुंडली के अनुकूल उपाय चुने जा रहे हैं…', 'आपकी PDF रिपोर्ट डिज़ाइन हो रही है…'],
    readyIn: (s: string) => `${s} में तैयार`, expected: (t: string) => `अपेक्षित समय: ${t}`, almost: 'लगभग तैयार – अंतिम काम…', hold: 'आपकी रिपोर्ट में थोड़ा अधिक समय लग रहा है। हम जल्द ही यहाँ अपडेट देंगे।',
    download: 'रिपोर्ट डाउनलोड करें (PDF)', downloading: 'आपकी PDF तैयार हो रही है…', firstTime: 'पहली बार डाउनलोड में PDF बनने तक एक मिनट लग सकता है।',
    emailed: 'आपकी रिपोर्ट ईमेल / टेलीग्राम पर भेज दी गई है। नई कॉपी के लिए टेलीग्राम @MYNUMEROLOGIST8 पर संदेश भेजें।',
    forWho: 'रीडिंग', paid: 'भुगतान', invoice: 'इनवॉइस', cancelled: 'रद्द – अगर यह अनपेक्षित है तो कृपया हमसे संपर्क करें।', details: 'इस रिपोर्ट के लिए कुछ विवरण अधूरे हैं। कृपया टेलीग्राम @MYNUMEROLOGIST8 पर संदेश भेजें।',
    statusReady: 'तैयार', statusPrep: 'तैयारी में', another: 'एक और रीडिंग बुक करें', err: 'अभी डाउनलोड नहीं हो सका। कृपया एक मिनट बाद फिर प्रयास करें।',
    paidBanner: 'भुगतान प्राप्त हुआ – धन्यवाद! आपकी रिपोर्ट नीचे शुरू हो गई है।', pendingBanner: 'बैंक से आपके भुगतान की पुष्टि हो रही है। यह पेज अपने-आप अपडेट होगा।', failedBanner: 'भुगतान पूरा नहीं हुआ। आपसे कोई राशि नहीं ली गई।',
  },
};

const REL: Record<string, { en: string; hi: string }> = {
  self: { en: 'Myself', hi: 'स्वयं' }, spouse: { en: 'Spouse', hi: 'जीवनसाथी' }, son: { en: 'Son', hi: 'पुत्र' }, daughter: { en: 'Daughter', hi: 'पुत्री' }, father: { en: 'Father', hi: 'पिता' },
  mother: { en: 'Mother', hi: 'माता' }, brother: { en: 'Brother', hi: 'भाई' }, sister: { en: 'Sister', hi: 'बहन' }, grandparent: { en: 'Grandparent', hi: 'दादा-दादी / नाना-नानी' }, relative: { en: 'Relative', hi: 'रिश्तेदार' }, friend: { en: 'Friend', hi: 'मित्र' }, other: { en: 'Other', hi: 'अन्य' },
};

const fallbackName = (code: string) => code.replace(/^SVC_/, '').replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

function useNow(active: boolean) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => { if (!active) return; const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, [active]);
  return now;
}

function countdown(ms: number, hi: boolean) {
  const s = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (hi) return h ? `${h} घंटे ${m} मिनट` : m ? `${m} मिनट ${sec} सेकंड` : `${sec} सेकंड`;
  return h ? `${h} h ${m} min` : m ? `${m} min ${String(sec).padStart(2, '0')} s` : `${sec} s`;
}

const STEP_ICON = [ClipboardCheck, Feather, ShieldCheck, Download];

/** Animated four-step tracker for one order. */
export function DeliveryTracker({ delivery, auto }: { delivery: Extract<DeliveryState, { state: 'preparing' | 'ready' }>; auto: boolean }) {
  const { lang } = useApp(); const t = T[lang]; const hi = lang === 'hi';
  const tz = useTimeZone();
  const preparing = delivery.state === 'preparing';
  const now = useNow(preparing);
  const steps = t.steps(auto);
  const stage = delivery.stage;
  const left = new Date(delivery.readyAt).getTime() - now;
  // Progress moves smoothly between server polls.
  const total = new Date(delivery.readyAt).getTime() - new Date(delivery.paidAt).getTime();
  const pct = preparing ? Math.min(97, Math.max(delivery.progress, Math.round(((now - new Date(delivery.paidAt).getTime()) / Math.max(1, total)) * 100))) : 100;
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => { if (!preparing || stage !== 2) return; const id = setInterval(() => setTick((x) => x + 1), 3500); return () => clearInterval(id); }, [preparing, stage]);
  const at = new Date(delivery.readyAt).toLocaleString(hi ? 'hi-IN' : isIST(tz) ? 'en-IN' : 'en-US', { timeZone: tz, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', ...(isIST(tz) ? {} : { timeZoneName: 'short' as const }) });

  return (
    <div className="space-y-3" aria-live="polite">
      <ol className="relative grid gap-3 sm:grid-cols-4">
        {steps.map(([name, text], i) => {
          const n = i + 1; const done = n < stage || stage === 4; const current = n === stage && stage !== 4;
          const Icon = STEP_ICON[i];
          return (
            <motion.li key={name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={cn('relative flex gap-3 rounded-xl border p-3 sm:flex-col sm:items-center sm:text-center', done ? 'border-success/40 bg-success/10' : current ? 'border-gold bg-gold/10 shadow-[0_0_24px_-6px_rgba(212,175,55,.55)]' : 'border-border/60 opacity-60')}>
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                {current && <span className="absolute inset-0 animate-ping rounded-full bg-gold/30" />}
                <span className={cn('relative flex h-10 w-10 items-center justify-center rounded-full border-2', done ? 'border-success bg-success text-background' : current ? 'border-gold bg-background text-gold' : 'border-border bg-background text-muted-foreground')}>
                  <AnimatePresence mode="wait" initial={false}>
                    {done ? <motion.span key="d" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}><Check className="h-5 w-5" /></motion.span>
                      : <motion.span key="i" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>{current && n !== 1 ? <Icon className={cn('h-5 w-5', n === 2 && 'animate-pulse')} /> : <Icon className="h-5 w-5" />}</motion.span>}
                  </AnimatePresence>
                </span>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug">{name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
                {current && n === 2 && (
                  <AnimatePresence mode="wait"><motion.p key={tick} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1 flex items-center gap-1 text-xs text-gold sm:justify-center"><Loader2 className="h-3 w-3 animate-spin" />{t.working[tick % t.working.length]}</motion.p></AnimatePresence>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <motion.div className={cn('absolute inset-y-0 left-0 rounded-full', preparing ? 'bg-gradient-to-r from-amber-600 via-gold to-amber-300' : 'bg-success')} initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
        {preparing && <motion.div className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/40 to-transparent" animate={{ x: ['-100%', '450%'] }} transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }} />}
      </div>
      {preparing && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {delivery.onHold ? <span className="inline-flex items-center gap-1 text-warning"><PauseCircle className="h-3.5 w-3.5" />{t.hold}</span>
            : left > 0 ? <><span className="inline-flex items-center gap-1 font-semibold text-gold"><Clock className="h-3.5 w-3.5" />{t.readyIn(countdown(left, hi))}</span><span>{t.expected(at)}</span></>
              : <span className="inline-flex items-center gap-1 text-gold"><Loader2 className="h-3.5 w-3.5 animate-spin" />{t.almost}</span>}
        </p>
      )}
    </div>
  );
}

function OrderCard({ o, onReload }: { o: MyServiceOrder; onReload: () => void }) {
  const { lang } = useApp(); const t = T[lang]; const hi = lang === 'hi';
  const [busyLang, setBusyLang] = React.useState<'en' | 'hi' | 'default' | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const d = o.delivery;
  const name = o.name ? o.name[lang] : fallbackName(o.serviceCode);
  const ready = d.state === 'ready';
  async function get(targetLang?: 'en' | 'hi') {
    setBusyLang(targetLang ?? 'default'); setErr(null);
    try { await download(`/api/service-orders/${o.id}/pdf${targetLang ? `?lang=${targetLang}` : ''}`); }
    catch (e) { setErr(e instanceof ApiError && e.body.error === 'DETAILS_INCOMPLETE' ? t.details : t.err); if (e instanceof ApiError && e.status === 409) onReload(); }
    finally { setBusyLang(null); }
  }
  return (
    <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('space-y-4 rounded-xl border bg-background/60 p-4 sm:p-5', ready ? 'border-success/50' : 'border-gold/40')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-serif text-lg font-semibold leading-tight">{name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {o.forName && <>{t.forWho}: <b className="text-foreground">{o.forName}</b>{o.forRelation && REL[o.forRelation] ? ` · ${REL[o.forRelation][lang]}` : ''} · </>}
            {t.paid} {new Date(o.paidAt ?? o.createdAt).toLocaleString(hi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            {o.invoiceNumber ? ` · ${t.invoice} ${o.invoiceNumber}` : ''}
          </p>
        </div>
        {d.state !== 'cancelled' && d.state !== 'awaiting_payment' && (
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', ready ? 'bg-success/15 text-success' : 'bg-gold/15 text-gold')}>
            {ready ? <Check className="h-3.5 w-3.5" /> : <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-gold" /></span>}
            {ready ? t.statusReady : t.statusPrep}
          </span>
        )}
      </div>
      {d.state === 'cancelled' ? <p className="text-sm text-muted-foreground">{t.cancelled}</p>
        : d.state === 'awaiting_payment' ? null
          : <DeliveryTracker delivery={d} auto={o.auto} />}
      {o.needsDetails && d.state !== 'cancelled' && <p className="rounded-md bg-warning/10 p-2 text-xs text-warning">{t.details}</p>}
      {ready && d.state === 'ready' && (d.download ? (
        <div className="space-y-1.5">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }} className="flex flex-wrap gap-2">
            {o.auto ? (
              <>
                <Button variant="gold" size="lg" disabled={busyLang !== null} onClick={() => get('en')} className="shadow-lg shadow-gold/30">
                  {busyLang === 'en' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {busyLang === 'en' ? t.downloading : (hi ? 'अंग्रेज़ी PDF डाउनलोड' : 'Download English (PDF)')}
                </Button>
                <Button variant="outline" size="lg" disabled={busyLang !== null} onClick={() => get('hi')} className="border-gold/60 text-gold hover:bg-gold/10">
                  {busyLang === 'hi' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {busyLang === 'hi' ? t.downloading : (hi ? 'हिंदी PDF डाउनलोड' : 'Download Hindi (PDF)')}
                </Button>
              </>
            ) : (
              <Button variant="gold" size="lg" disabled={busyLang !== null} onClick={() => get()} className="shadow-lg shadow-gold/30">
                {busyLang !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{busyLang !== null ? t.downloading : t.download}
              </Button>
            )}
          </motion.div>
          {busyLang !== null && <p className="text-xs text-muted-foreground">{t.firstTime}</p>}
        </div>
      ) : <p className="flex items-start gap-1.5 text-sm text-muted-foreground"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{t.emailed}</p>)}
      {err && <p className="text-sm text-danger" role="alert">{err}</p>}
    </motion.article>
  );
}

/**
 * Self-loading section (used in My reports and My account). Hidden when the customer has no paid services.
 * Also confirms a Cashfree payment when the bank redirects back with ?cf_order=…
 */
export function PurchasedServices({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { lang, me } = useApp(); const t = T[lang];
  const [orders, setOrders] = React.useState<MyServiceOrder[] | null>(null);
  const [banner, setBanner] = React.useState<'paid' | 'pending' | 'failed' | null>(null);
  const load = React.useCallback(async () => {
    try { const r = await api<{ serviceOrders?: MyServiceOrder[] }>('/api/account'); setOrders(r.serviceOrders ?? []); } catch { setOrders((x) => x ?? []); }
  }, []);
  React.useEffect(() => { if (me?.user) load(); }, [me?.user, load]);
  // Bank / UPI redirect back from Cashfree.
  React.useEffect(() => {
    if (!me?.user) return;
    const id = new URLSearchParams(window.location.search).get('cf_order');
    if (!id || !id.startsWith('cf_')) return;
    setBanner('pending');
    confirmCashfreeOrder(id).then((st) => { setBanner(st); load(); }).catch(() => setBanner('pending'))
      .finally(() => { const u = new URL(window.location.href); u.searchParams.delete('cf_order'); window.history.replaceState(null, '', u.pathname + u.search + u.hash); });
  }, [me?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Live updates: every 30 s while something is being prepared, and right when a countdown reaches zero.
  const preparing = orders?.filter((o) => o.delivery.state === 'preparing') ?? [];
  React.useEffect(() => {
    if (!preparing.length && banner !== 'pending') return;
    const id = setInterval(load, 30_000);
    const next = Math.min(...preparing.map((o) => (o.delivery.state === 'preparing' ? new Date(o.delivery.readyAt).getTime() : Infinity)));
    const wait = next - Date.now();
    const at = Number.isFinite(next) && wait > 0 && wait < 2 ** 31 - 1 ? setTimeout(load, wait + 1500) : undefined;
    return () => { clearInterval(id); if (at) clearTimeout(at); };
  }, [preparing.length, preparing.map((o) => o.id + o.delivery.state).join(), banner, load]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!orders || (!orders.length && !banner)) return null;
  const shown = compact ? orders.slice(0, 3) : orders;
  return (
    <section className={cn('glass space-y-4 rounded-xl border border-gold/40 bg-gold/5 p-4 sm:p-5', className)} aria-labelledby="ps-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="ps-h" className="flex items-center gap-2 font-serif text-xl font-bold text-gold"><Sparkles className="h-5 w-5" />{t.title}</h2>
          {!compact && <p className="text-xs text-muted-foreground">{t.sub}</p>}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-gold"><Clock className="h-3.5 w-3.5" />{t.sla}</span>
      </div>
      {banner && <p role="status" className={cn('rounded-md p-3 text-sm', banner === 'paid' ? 'bg-success/15 text-success' : banner === 'failed' ? 'bg-danger/10 text-danger' : 'bg-muted')}>{banner === 'paid' ? t.paidBanner : banner === 'failed' ? t.failedBanner : t.pendingBanner}</p>}
      <div className="space-y-3">{shown.map((o) => <OrderCard key={o.id} o={o} onReload={load} />)}</div>
      {compact && orders.length > shown.length && <Link href="/dashboard" className="text-sm text-gold underline-offset-2 hover:underline">+{orders.length - shown.length}</Link>}
      {!compact && <Link href="/reading" className={buttonVariants({ variant: 'outline', size: 'sm' })}>{t.another}</Link>}
    </section>
  );
}
