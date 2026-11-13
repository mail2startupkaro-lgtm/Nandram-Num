'use client';
import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Baby, Briefcase, CalendarDays, ChevronDown, FileText, Grid3x3, Heart, Smartphone, Type } from 'lucide-react';
import { SERVICE_PAGES } from '@/lib/service-pages';
import { useApp } from './providers';

const ICONS: Record<string, typeof FileText> = {
  'personal-numerology-report': FileText, 'name-numerology': Type, 'lo-shu-grid': Grid3x3, 'mobile-number-numerology': Smartphone,
  'baby-name-numerology': Baby, 'couple-compatibility-report': Heart, 'business-name-numerology': Briefcase, 'personal-year-consultancy': CalendarDays,
};

/** Header "Services" dropdown: the eight service pages + all services & fees. */
export function ServicesMenu() {
  const { t, lang } = useApp();
  const hi = lang === 'hi';
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrap = React.useRef<HTMLDivElement>(null);
  const show = () => { clearTimeout(timer.current); setOpen(true); };
  const hide = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(false), 160); };
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey); document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [open]);
  return (
    <div ref={wrap} className="relative hidden md:block" onMouseEnter={show} onMouseLeave={hide}>
      <button type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}
        className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[12.5px] font-medium text-foreground/85 hover:bg-gold/10 hover:text-gold transition-colors">
        {t.nav.services}<ChevronDown className={`h-3 w-3 text-gold/70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="fixed inset-x-0 top-[65px] z-50 mx-auto w-[min(92vw,760px)] pt-2">
          <span aria-hidden className="absolute -top-4 inset-x-0 h-6" />
          <div className="mk-drop glass overflow-hidden rounded-xl border border-gold/30 bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">{hi ? 'आचार्य नंदराम की सेवाएँ' : 'Services by Acharya Nandram'}</p>
            <ul className="grid gap-1 sm:grid-cols-2">
              {SERVICE_PAGES.map((p) => { const I = ICONS[p.slug] ?? FileText; return (
                <li key={p.slug}><Link href={`/${p.slug}`} onClick={() => setOpen(false)} className="group flex items-start gap-3 rounded-lg p-2.5 hover:bg-gold/10">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-gold/30 bg-gold/5"><I className="h-4 w-4 text-gold" /></span>
                  <span><span className="block text-sm font-semibold group-hover:text-gold">{p.menu[lang]}</span><span className="block text-xs text-muted-foreground">{p.menuSub[lang]}</span></span>
                </Link></li>
              ); })}
            </ul>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-2 pt-3 text-sm">
              <Link href="/services" onClick={() => setOpen(false)} className="inline-flex items-center gap-1 font-medium text-gold hover:underline">{hi ? 'सभी सेवाएँ और शुल्क' : 'All services & fees'} <ArrowRight className="h-3.5 w-3.5" /></Link>
              <Link href="/pricing" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">{hi ? 'संपूर्ण जीवन रिपोर्ट प्लान →' : 'Complete Life Report plans →'}</Link>
              <Link href="/international-numerology" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">{hi ? 'भारत के बाहर से? अंतरराष्ट्रीय क्लाइंट →' : 'Outside India? International clients →'}</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
