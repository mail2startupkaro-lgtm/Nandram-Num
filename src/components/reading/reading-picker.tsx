'use client';
import * as React from 'react';
import Link from 'next/link';
import { Baby, Briefcase, Building2, CalendarDays, Gift, Grid3x3, Heart, MessageCircle, PenLine, Signature, Smartphone, Sparkles, UserRound, type LucideIcon } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { buttonVariants } from '@/components/ui/button';
import { api } from '@/lib/client/api';
import { formatMoney } from '@/lib/billing/currency';
import { useDisplayCurrency } from '@/lib/client/currency';
import { servicePageByCode } from '@/lib/service-pages';
import type { PublicService } from '@/components/services/book-service';
import { FLOW } from './labels';

export const SERVICE_ICON: Record<string, LucideIcon> = {
  SVC_PERSONAL_REPORT: UserRound, SVC_NAME_CORRECTION: PenLine, SVC_MOBILE_NUMBER: Smartphone, SVC_BABY_NAME: Baby, SVC_LOSHU: Grid3x3,
  SVC_COUPLE: Heart, SVC_BUSINESS_NAME: Building2, SVC_BUSINESS_COMPAT: Briefcase, SVC_PERSONAL_YEAR: CalendarDays, SVC_SIGNATURE: Signature,
};

export const inr = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** Offer price (and struck-through real price) in the visitor's display currency. */
export function priceOf(s: PublicService, usd: boolean) {
  if (!s.payable || !s.pricePaise) return null;
  if (usd && s.usdCents) return { fee: formatMoney(s.usdCents, 'USD'), mrp: s.usdMrpCents && s.usdMrpCents > s.usdCents ? formatMoney(s.usdMrpCents, 'USD') : null, off: s.usdMrpCents && s.usdMrpCents > s.usdCents ? Math.round((1 - s.usdCents / s.usdMrpCents) * 100) : 0 };
  return { fee: inr(s.pricePaise), mrp: s.mrpPaise && s.mrpPaise > s.pricePaise ? inr(s.mrpPaise) : null, off: s.mrpPaise && s.mrpPaise > s.pricePaise ? Math.round((1 - s.pricePaise / s.mrpPaise) * 100) : 0 };
}

/** Short "we will ask for" list per reading. */
function asks(s: PublicService, lang: 'en' | 'hi') {
  const short: Record<string, string> = lang === 'hi'
    ? { clientName: 'नाम', dob: 'जन्म तिथि', gender: 'लिंग', tob: 'जन्म समय', pob: 'जन्म स्थान', mobile: 'मोबाइल', currentName: s.code === 'SVC_SIGNATURE' ? 'हस्ताक्षर-नाम' : s.code === 'SVC_BUSINESS_NAME' ? 'व्यवसाय नाम' : 'वर्तमान नाम', parents: 'माता-पिता', letters: 'अक्षर', partnerName: 'जीवनसाथी', businesses: 'व्यवसाय', questions: 'प्रश्न' }
    : { clientName: 'Name', dob: 'Date of birth', gender: 'Gender', tob: 'Birth time', pob: 'Birth place', mobile: 'Mobile', currentName: s.code === 'SVC_SIGNATURE' ? 'Signed name' : s.code === 'SVC_BUSINESS_NAME' ? 'Business names' : 'Current name', parents: 'Parents', letters: 'Letters', partnerName: 'Partner', businesses: 'Businesses', questions: 'Questions' };
  return s.intake.filter((k) => k !== 'partnerDob').map((k) => short[k] ?? k);
}

/** Step 1 of "Get your reading": choose the type of reading. */
export function ReadingPicker({ onPick }: { onPick: (code: string) => void }) {
  const { lang } = useApp();
  const t = FLOW[lang];
  const usd = useDisplayCurrency() === 'USD';
  const [list, setList] = React.useState<PublicService[] | null>(null);
  React.useEffect(() => { api<{ services: PublicService[] }>('/api/services').then((r) => setList(r.services)).catch(() => setList([])); }, []);

  return (
    <div className="container max-w-6xl py-8 sm:py-12">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{t.pickKicker}</p>
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{t.pickTitle}</h1>
        <p className="mt-3 text-muted-foreground">{t.pickSub}</p>
      </div>
      <StepBar step={0} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="glass group relative flex flex-col rounded-xl border border-success/40 p-5 transition hover:border-success/80 hover:shadow-lg">
          <button type="button" onClick={() => onPick('free')} className="absolute inset-0 z-0 rounded-xl focus:outline-none" aria-label={t.free} tabIndex={-1} />
          <span className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">{t.freeTag}</span>
          <Gift className="relative z-10 h-8 w-8 text-gold transition-transform group-hover:scale-105" aria-hidden />
          <h2 className="relative z-10 mt-3 font-serif text-lg font-semibold transition-colors group-hover:text-success">{t.free}</h2>
          <p className="relative z-10 mt-1 flex-1 text-sm text-muted-foreground">{t.freeShort}</p>
          <p className="relative z-10 mt-3 font-serif text-2xl font-bold text-success">{lang === 'hi' ? '₹0' : 'Free'}</p>
          <button type="button" onClick={() => onPick('free')} className={buttonVariants({ variant: 'outline', className: 'relative z-10 mt-4 w-full' })}>{t.freeCta}</button>
        </article>
        {list === null && Array.from({ length: 5 }, (_, i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-muted/40" />)}
        {list?.map((s) => {
          const Icon = SERVICE_ICON[s.code] ?? Sparkles;
          const p = priceOf(s, usd);
          const text = s[lang];
          const page = servicePageByCode(s.code);
          const href = page ? `/${page.slug}` : `/services#${s.code.toLowerCase()}`;
          return (
            <article key={s.code} className="glass group relative flex flex-col rounded-xl border border-gold/30 p-5 transition hover:border-gold/70 hover:shadow-lg">
              <Link href={href} className="absolute inset-0 z-0 rounded-xl focus:outline-none" aria-label={text.name} tabIndex={-1} />
              {p?.off ? <span className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-black">{p.off}% {t.off}</span> : null}
              <Icon className="relative z-10 h-8 w-8 text-gold transition-transform group-hover:scale-105" aria-hidden />
              <h2 className="relative z-10 mt-3 pr-14 font-serif text-lg font-semibold leading-snug transition-colors group-hover:text-gold">{text.name}</h2>
              <p className="relative z-10 mt-1 flex-1 text-sm text-muted-foreground">{text.short}</p>
              <p className="relative z-10 mt-3 text-xs text-muted-foreground"><b className="text-foreground/80">{t.needs}:</b> {asks(s, lang).join(' · ')}</p>
              <p className="relative z-10 mt-1 text-xs text-muted-foreground"><b className="text-foreground/80">{t.delivery}:</b> {text.delivery}</p>
              <div className="relative z-10 mt-3 flex items-baseline gap-2">{p ? <><span className="font-serif text-2xl font-bold text-gold">{p.fee}</span>{p.mrp && <s className="text-sm text-muted-foreground">{p.mrp}</s>}</> : <span className="text-sm text-muted-foreground">{t.priceSoon}</span>}</div>
              {s.payable
                ? <Link href={href} className={buttonVariants({ variant: 'gold', className: 'relative z-10 mt-4 w-full' })}><Sparkles className="h-4 w-4" />{t.choose}</Link>
                : <Link href="/contact?topic=service" className={buttonVariants({ variant: 'outline', className: 'relative z-10 mt-4 w-full' })}><MessageCircle className="h-4 w-4" />{t.enquire}</Link>}
            </article>
          );
        })}
      </div>
    </div>
  );
}

/** Reading → Details → Account → Payment progress bar. */
export function StepBar({ step, skipAccount = false }: { step: number; skipAccount?: boolean }) {
  const { lang } = useApp();
  const steps = FLOW[lang].steps.filter((_, i) => !(skipAccount && i === 2));
  const at = skipAccount && step > 2 ? step - 1 : step;
  return (
    <ol className="mx-auto flex max-w-xl items-center justify-between gap-2" aria-label={lang === 'hi' ? 'चरण' : 'Steps'}>
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === at ? 'step' : undefined}>
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${i < at ? 'bg-success text-white' : i === at ? 'bg-gold text-black' : 'border border-border text-muted-foreground'}`}>{i < at ? '✓' : i + 1}</span>
          <span className={`hidden text-xs sm:inline ${i === at ? 'font-semibold' : 'text-muted-foreground'}`}>{s}</span>
          {i < steps.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
