'use client';
/** Services funnel: limited-time offer countdown, free mini-reading lead form, sample report previews (blur + unlock). */
import * as React from 'react';
import { CheckCircle2, Gift, Lock, MessageCircle, Sparkles, Timer, X } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';
import { trackEvent } from '@/lib/client/analytics';
import { todayIST, toIso } from '@/lib/numerology';
import type { ServiceSample } from '@/lib/service-samples';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'hi';
const CONSENT = {
  en: 'I agree that Acharya Nandram / myNumerologist.com may contact me on WhatsApp or phone about my reading and services. I can opt out any time by replying STOP.',
  hi: 'मैं सहमत हूँ कि आचार्य नंदराम / myNumerologist.com मेरी रीडिंग और सेवाओं के बारे में मुझसे WhatsApp या फ़ोन पर संपर्क कर सकते हैं। मैं कभी भी STOP लिखकर मना कर सकता/सकती हूँ।',
};

/* ---------------- offer countdown ---------------- */
const pad = (n: number) => String(n).padStart(2, '0');
function useRemaining(endsAt: string) {
  const [now, setNow] = React.useState<number | null>(null); // null until mounted → no hydration mismatch
  React.useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  if (now === null) return null;
  return Math.max(0, new Date(endsAt).getTime() - now);
}

/** Counts down to the owner's real end date; renders nothing once it has passed. */
export function OfferCountdown({ endsAt, label, endText, variant = 'bar' }: { endsAt: string; label: { en: string; hi: string }; endText: { en: string; hi: string }; variant?: 'bar' | 'inline' }) {
  const { lang } = useApp();
  const ms = useRemaining(endsAt);
  if (ms === 0) return null;
  const s = Math.floor((ms ?? 0) / 1000);
  const parts = [[Math.floor(s / 86400), lang === 'hi' ? 'दिन' : 'days'], [Math.floor((s % 86400) / 3600), lang === 'hi' ? 'घंटे' : 'hrs'], [Math.floor((s % 3600) / 60), lang === 'hi' ? 'मिनट' : 'min'], [s % 60, lang === 'hi' ? 'सेकंड' : 'sec']] as const;
  if (variant === 'inline') return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-danger" role="timer" aria-live="off">
      <Timer className="h-3.5 w-3.5" />{label[lang]} · {lang === 'hi' ? 'समाप्ति' : 'ends in'} {ms === null ? '…' : `${parts[0][0]}${lang === 'hi' ? 'दि' : 'd'} ${pad(parts[1][0])}:${pad(parts[2][0])}:${pad(parts[3][0])}`}
    </p>
  );
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/40 bg-gradient-to-r from-danger/15 via-gold/10 to-danger/15 p-4 text-center sm:flex-row sm:justify-between sm:text-left" role="timer" aria-live="off">
      <div>
        <p className="flex items-center justify-center gap-2 font-cinzel text-lg font-bold sm:justify-start"><Gift className="h-5 w-5 text-gold" />{label[lang]}</p>
        <p className="text-xs text-muted-foreground">{lang === 'hi' ? 'ऑफ़र मूल्य इस तिथि तक मान्य:' : 'Offer prices valid until'} {endText[lang]}</p>
      </div>
      <div className="flex gap-2">
        {parts.map(([v, u]) => (
          <div key={u} className="min-w-[58px] rounded-lg border border-gold/40 bg-background/70 px-2 py-1.5 text-center">
            <span className="block font-mono text-2xl font-bold tabular-nums text-gold">{ms === null ? '--' : pad(v)}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{u}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- unlock state (per browser) ---------------- */
const KEY = 'mn-sample-unlocked';
const EVT = 'mn-sample-unlocked';
function useUnlocked(): [boolean, () => void] {
  const [u, setU] = React.useState(false);
  React.useEffect(() => {
    try { setU(localStorage.getItem(KEY) === '1'); } catch { /* storage blocked */ }
    const on = () => setU(true);
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  const unlock = React.useCallback(() => { try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ } setU(true); window.dispatchEvent(new Event(EVT)); }, []);
  return [u, unlock];
}

/* ---------------- lead form ---------------- */
const ONE_LINE: Record<number, { en: string; hi: string }> = {
  1: { en: 'Sun – a born leader, independent and ambitious.', hi: 'सूर्य – जन्मजात नेता, स्वतंत्र और महत्वाकांक्षी।' },
  2: { en: 'Moon – caring, intuitive and diplomatic.', hi: 'चंद्र – स्नेही, अंतर्ज्ञानी और कूटनीतिक।' },
  3: { en: 'Jupiter – wise, expressive and a natural guide.', hi: 'गुरु – ज्ञानी, अभिव्यक्तिशील और स्वाभाविक मार्गदर्शक।' },
  4: { en: 'Rahu – practical, original and hard-working.', hi: 'राहु – व्यावहारिक, मौलिक और परिश्रमी।' },
  5: { en: 'Mercury – quick, versatile and a great communicator.', hi: 'बुध – तेज़, बहुमुखी और उत्तम संवादक।' },
  6: { en: 'Venus – loving, artistic and family-minded.', hi: 'शुक्र – प्रेमपूर्ण, कलात्मक और परिवार-प्रिय।' },
  7: { en: 'Ketu – deep thinker, intuitive and spiritual.', hi: 'केतु – गहरे विचारक, अंतर्ज्ञानी और आध्यात्मिक।' },
  8: { en: 'Saturn – patient, disciplined and built for lasting success.', hi: 'शनि – धैर्यवान, अनुशासित और स्थायी सफलता के लिए बने।' },
  9: { en: 'Mars – energetic, brave and driven.', hi: 'मंगल – ऊर्जावान, साहसी और लक्ष्य-प्रेरित।' },
};

function utmFromUrl() {
  try {
    const q = new URLSearchParams(window.location.search);
    const g = (k: string) => q.get(k)?.slice(0, 100) || undefined;
    return { utmSource: g('utm_source'), utmMedium: g('utm_medium'), utmCampaign: q.get('utm_campaign')?.slice(0, 150) || undefined, utmTerm: g('utm_term'), utmContent: g('utm_content') };
  } catch { return {}; }
}

export interface FunnelService { code: string; name: { en: string; hi: string } }

export function LeadForm({ services, defaultService = '', magnet = 'mini-reading', whatsapp, onDone, compact, bookHref = '#services' }: { services: FunnelService[]; defaultService?: string; magnet?: 'mini-reading' | 'sample-report'; whatsapp: string; onDone?: () => void; compact?: boolean; bookHref?: string }) {
  const { lang } = useApp();
  const [, unlock] = useUnlocked();
  const [f, setF] = React.useState({ name: '', phone: '', dob: '', service: defaultService, consent: false, website: '' });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [res, setRes] = React.useState<{ moolank: number; bhagyank: number } | null>(null);
  const hi = lang === 'hi';
  const ok = f.name.trim().length >= 2 && f.phone.replace(/\D/g, '').length >= 10 && !!f.dob && f.consent;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!ok) return;
    setBusy(true); setErr(null);
    try {
      const r = await api<{ moolank: number; bhagyank: number }>('/api/leads', { method: 'POST', json: { name: f.name.trim(), phone: f.phone.trim(), dob: f.dob, service: f.service || undefined, magnet, language: lang, consent: true, website: f.website, page: window.location.pathname, referrer: document.referrer || undefined, ...utmFromUrl() } });
      setRes(r); unlock();
      trackEvent('generate_lead', { lead_magnet: magnet, service: f.service || 'none' });
      onDone?.();
    } catch (e2) {
      const issue = e2 instanceof ApiError ? e2.body.issues?.[0] : undefined;
      setErr(issue?.path === 'phone' ? (hi ? 'कृपया सही मोबाइल/WhatsApp नंबर लिखें।' : 'Please enter a valid mobile / WhatsApp number.')
        : issue?.path === 'dob' ? (hi ? 'कृपया सही जन्म तिथि चुनें।' : 'Please choose a valid date of birth.')
        : e2 instanceof ApiError && e2.status === 429 ? (hi ? 'बहुत अधिक प्रयास। कुछ मिनट बाद पुनः प्रयास करें।' : 'Too many tries. Please try again in a few minutes.')
        : (hi ? 'कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें या WhatsApp करें।' : 'Something went wrong. Please try again or message us on WhatsApp.'));
    } finally { setBusy(false); }
  }

  if (res) {
    const svc = services.find((s) => s.code === f.service);
    const text = hi ? `नमस्ते आचार्य जी, मैं ${f.name.trim()} हूँ। मेरा मूलांक ${res.moolank} और भाग्यांक ${res.bhagyank} है।${svc ? ` मुझे "${svc.name.hi}" के बारे में जानना है।` : ''}` : `Namaste Acharya ji, I am ${f.name.trim()}. My Moolank is ${res.moolank} and Bhagyank ${res.bhagyank}.${svc ? ` I would like to know about "${svc.name.en}".` : ''}`;
    return (
      <div className="space-y-4 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <p className="font-cinzel text-xl font-bold">{hi ? `${f.name.trim()}, आपके अंक` : `${f.name.trim()}, your numbers`}</p>
        <div className="grid grid-cols-2 gap-3">
          {([[hi ? 'मूलांक' : 'Moolank', res.moolank], [hi ? 'भाग्यांक' : 'Bhagyank', res.bhagyank]] as const).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-gold/40 bg-gold/5 p-3"><p className="text-xs uppercase tracking-widest text-muted-foreground">{k}</p><p className="gold-text font-cinzel text-4xl font-bold">{v}</p><p className="mt-1 text-xs text-muted-foreground">{ONE_LINE[v]?.[lang]}</p></div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{hi ? 'नमूना रिपोर्ट अब पूरी खुल गई है। अपने अंकों पर व्यक्तिगत सलाह के लिए आचार्य नंदराम को WhatsApp करें।' : 'The sample reports are now fully unlocked. For personal guidance on your numbers, message Acharya Nandram on WhatsApp.'}</p>
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('whatsapp_click', { source: 'lead_result' })} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-success px-5 font-semibold text-white hover:brightness-110"><MessageCircle className="h-5 w-5" />{hi ? 'WhatsApp पर बात करें' : 'Chat on WhatsApp'}</a>
        <a href={bookHref} className="block text-sm text-gold hover:underline">{hi ? 'ऑफ़र मूल्य पर सेवा बुक करें →' : 'Book a service at the offer price →'}</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className={cn('grid gap-3', !compact && 'sm:grid-cols-2')}>
        <Field label={hi ? 'आपका नाम' : 'Your name'} htmlFor="ld-name" required><Input id="ld-name" autoComplete="name" maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={hi ? 'WhatsApp नंबर' : 'WhatsApp number'} htmlFor="ld-ph" required><Input id="ld-ph" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" maxLength={18} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label={hi ? 'जन्म तिथि' : 'Date of birth'} htmlFor="ld-dob" required><Input id="ld-dob" type="date" min="1900-01-01" max={toIso(todayIST())} value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} /></Field>
        <Field label={hi ? 'किस सेवा में रुचि है?' : 'Interested in'} htmlFor="ld-svc"><Select id="ld-svc" value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })}><option value="">{hi ? 'अभी तय नहीं' : 'Not sure yet'}</option>{services.map((s) => <option key={s.code} value={s.code}>{s.name[lang]}</option>)}</Select></Field>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
      <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-gold" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} /><span>{CONSENT[lang]}</span></label>
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy || !ok}><Sparkles className="h-4 w-4" />{busy ? (hi ? 'गणना हो रही है…' : 'Calculating…') : magnet === 'sample-report' ? (hi ? 'पूरी नमूना रिपोर्ट मुफ़्त खोलें' : 'Unlock the full sample – free') : (hi ? 'मेरी मुफ़्त मिनी-रीडिंग देखें' : 'Show my free mini-reading')}</Button>
      {err && <p className="text-sm text-danger" role="alert">{err}</p>}
      <p className="text-center text-[11px] text-muted-foreground">{hi ? 'कोई स्पैम नहीं। आपकी जानकारी कभी बेची नहीं जाती।' : 'No spam. Your details are never sold.'}</p>
    </form>
  );
}

function LeadDialog({ onClose, ...p }: React.ComponentProps<typeof LeadForm> & { onClose: () => void }) {
  const { lang } = useApp();
  React.useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="ld-title" onClick={onClose}>
      <div className="glass my-8 w-full max-w-md rounded-xl bg-background p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><p className="text-xs uppercase tracking-widest text-gold">{lang === 'hi' ? 'मुफ़्त' : 'Free'}</p><h2 id="ld-title" className="font-serif text-xl font-semibold">{lang === 'hi' ? 'पूरी नमूना रिपोर्ट + आपके अंक' : 'Full sample report + your numbers'}</h2></div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={lang === 'hi' ? 'बंद करें' : 'Close'}><X /></Button>
        </div>
        <LeadForm {...p} compact />
      </div>
    </div>
  );
}

/* ---------------- sample report ---------------- */
function Grid({ counts }: { counts: Record<number, number> }) {
  const layout = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
  return (
    <div className="mx-auto grid w-40 grid-cols-3 overflow-hidden rounded-md border-2 border-gold/60" aria-label="Lo Shu grid">
      {layout.flat().map((n) => <div key={n} className={cn('grid h-12 place-items-center border border-gold/30 font-cinzel text-base font-bold', counts[n] ? 'bg-gold/10' : 'bg-muted/40 text-muted-foreground/60')}>{counts[n] ? String(n).repeat(counts[n]) : '–'}</div>)}
    </div>
  );
}

function SamplePaper({ s, lang, unlocked, onUnlock }: { s: ServiceSample; lang: Lang; unlocked: boolean; onUnlock: () => void }) {
  const open = s.sections.slice(0, s.open), locked = s.sections.slice(s.open);
  const Sec = ({ x }: { x: ServiceSample['sections'][number] }) => (
    <section className="space-y-2">
      <h4 className="font-serif text-base font-bold text-maroon dark:text-gold">{x.h[lang]}</h4>
      {x.p[lang].map((t) => <p key={t} className="text-sm leading-relaxed">{t}</p>)}
      {x.rows && <table className="w-full text-sm"><tbody>{x.rows.map((r) => <tr key={r.k.en} className="border-b border-gold/20 last:border-0"><th scope="row" className="py-1.5 pr-3 text-left align-top font-semibold">{r.k[lang]}</th><td className="py-1.5 text-muted-foreground">{r.v[lang]}</td></tr>)}</tbody></table>}
    </section>
  );
  return (
    <div lang={lang} className="relative overflow-hidden rounded-xl border-2 border-gold/50 bg-[hsl(42_60%_97%)] p-5 text-[hsl(20_30%_15%)] shadow-xl dark:bg-[hsl(25_25%_10%)] dark:text-foreground sm:p-7">
      <span aria-hidden className="pointer-events-none absolute right-[-40px] top-6 rotate-45 bg-danger px-12 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white">{lang === 'hi' ? 'नमूना' : 'Sample'}</span>
      <header className="border-b-2 border-double border-gold/50 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">myNumerologist.com · {lang === 'hi' ? 'आचार्य नंदराम' : 'Acharya Nandram'}</p>
        <h3 className="mt-1 font-cinzel text-lg font-bold sm:text-xl">{s.title[lang]}</h3>
        <p className="text-xs text-muted-foreground">{s.client[lang]} <span className="italic">({lang === 'hi' ? 'काल्पनिक क्लाइंट' : 'fictional client'})</span></p>
      </header>
      <div className="my-4 flex flex-wrap gap-2">
        {s.tiles.map((t) => <div key={t.k.en} className="min-w-[84px] flex-1 rounded-lg border border-gold/40 bg-gold/5 px-2 py-2 text-center"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.k[lang]}</p><p className="font-cinzel text-lg font-bold text-gold">{t.v}</p>{t.note && <p className="text-[10px] font-semibold text-danger">{t.note[lang]}</p>}</div>)}
      </div>
      {s.grid && <div className="mb-4"><Grid counts={s.grid} /></div>}
      <div className="space-y-4">{open.map((x) => <Sec key={x.h.en} x={x} />)}</div>
      {locked.length > 0 && (
        <div className="relative mt-4">
          <div className={cn('space-y-4 transition', !unlocked && 'pointer-events-none max-h-56 select-none overflow-hidden blur-[5px]')} aria-hidden={!unlocked}>{locked.map((x) => <Sec key={x.h.en} x={x} />)}</div>
          {!unlocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-transparent via-background/60 to-background/90 p-4 text-center">
              <Lock className="h-6 w-6 text-gold" />
              <p className="max-w-xs text-sm font-semibold">{lang === 'hi' ? `${locked.length} और खंड – अपनी जन्म तिथि डालकर मुफ़्त में पढ़ें` : `${locked.length} more section${locked.length > 1 ? 's' : ''} – read free with your date of birth`}</p>
              <Button variant="gold" onClick={onUnlock}><Sparkles className="h-4 w-4" />{lang === 'hi' ? 'मुफ़्त में खोलें' : 'Unlock free'}</Button>
            </div>
          )}
        </div>
      )}
      <p className="mt-5 border-t border-gold/30 pt-3 text-[11px] text-muted-foreground">{lang === 'hi' ? 'यह काल्पनिक क्लाइंट की नमूना रिपोर्ट का अंश है। आपकी रिपोर्ट आपके अपने अंकों पर आचार्य नंदराम स्वयं तैयार करते हैं और इससे लंबी होती है।' : 'Excerpt from a sample report for a fictional client. Your report is prepared personally by Acharya Nandram on your own numbers and is longer than this.'}</p>
    </div>
  );
}

/** One sample (service pages) or a tabbed set (all services page). */
export function SampleReports({ samples, services, whatsapp, initial, bookHref }: { samples: ServiceSample[]; services: FunnelService[]; whatsapp: string; initial?: string; bookHref?: string }) {
  const { lang } = useApp();
  const [unlocked] = useUnlocked();
  const [code, setCode] = React.useState(initial ?? samples[0]?.code);
  const [dialog, setDialog] = React.useState(false);
  React.useEffect(() => { // "See sample" links on the service cards: #sample-SVC_CODE
    const on = () => { const m = /^#sample-(SVC_[A-Z0-9_]+)$/.exec(window.location.hash); if (m && samples.some((x) => x.code === m[1])) { setCode(m[1]); document.getElementById('samples')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
    on(); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on);
  }, [samples]);
  const s = samples.find((x) => x.code === code) ?? samples[0];
  if (!s) return null;
  const name = (c: string) => services.find((x) => x.code === c)?.name[lang] ?? c;
  return (
    <div className="space-y-4">
      {samples.length > 1 && (
        <div role="tablist" aria-label={lang === 'hi' ? 'नमूना रिपोर्ट चुनें' : 'Choose a sample report'} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
          {samples.map((x) => <button key={x.code} role="tab" aria-selected={x.code === s.code} onClick={() => { setCode(x.code); trackEvent('sample_view', { service: x.code }); }} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-sm transition', x.code === s.code ? 'border-gold bg-gold/20 font-semibold' : 'border-gold/30 hover:bg-gold/10')}>{name(x.code)}</button>)}
        </div>
      )}
      <div className="mx-auto max-w-3xl"><SamplePaper s={s} lang={lang} unlocked={unlocked} onUnlock={() => setDialog(true)} /></div>
      {dialog && <LeadDialog services={services} defaultService={s.code} magnet="sample-report" whatsapp={whatsapp} bookHref={bookHref} onClose={() => setDialog(false)} />}
    </div>
  );
}

/** Mobile bottom bar: book + WhatsApp, always within thumb reach. */
export function StickyCta({ whatsapp, bookHref = '#services' }: { whatsapp: string; bookHref?: string }) {
  const { lang } = useApp();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-gold/30 bg-background/95 p-2 backdrop-blur md:hidden">
      <a href={bookHref} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-gold to-amber-500 font-semibold text-black"><Sparkles className="h-4 w-4" />{lang === 'hi' ? 'अभी बुक करें' : 'Book now'}</a>
      <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('whatsapp_click', { source: 'sticky' })} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-success font-semibold text-white"><MessageCircle className="h-4 w-4" />WhatsApp</a>
    </div>
  );
}
