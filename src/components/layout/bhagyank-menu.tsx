'use client';
import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { BHAGYANK_NUMBERS, bhagyankFor } from '@/lib/bhagyank-data';
import { useApp } from './providers';

/** Header "Bhagyank" mega-menu: number grid + animated preview of the destiny number. */
export function BhagyankMenu() {
  const { t, lang } = useApp();
  const hi = lang === 'hi';
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(1);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrap = React.useRef<HTMLDivElement>(null);
  const m = bhagyankFor(active, lang)!;

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
        {t.nav.bhagyank}<ChevronDown className={`h-3 w-3 text-gold/70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="fixed inset-x-0 top-[65px] z-50 mx-auto w-[min(92vw,820px)] pt-2">
         <span aria-hidden className="absolute -top-4 inset-x-0 h-6" />
         <div className="mk-drop glass overflow-hidden rounded-xl border border-gold/30 bg-background/95 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-[250px_1fr]">
            {/* number grid */}
            <div className="border-r border-gold/20 bg-gradient-to-b from-gold/5 to-transparent p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">{hi ? 'अपना भाग्यांक चुनें' : 'Choose your Bhagyank'}</p>
              <div className="grid grid-cols-3 gap-2">
                {BHAGYANK_NUMBERS.map((n) => (
                  <Link key={n} href={`/bhagyank/${n}`} onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(n)} onFocus={() => setActive(n)}
                    className={`group flex flex-col items-center rounded-lg border py-2 transition-all ${active === n ? 'border-gold bg-gold/15 shadow-[0_0_16px_hsl(var(--gold)/0.3)]' : 'border-gold/20 hover:border-gold/60'}`}>
                    <span className="gold-text font-cinzel text-2xl font-bold leading-none">{n}</span>
                    <span className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">{bhagyankFor(n, lang)!.planet.split(' ')[0]}</span>
                  </Link>
                ))}
              </div>
              <Link href="/bhagyank" onClick={() => setOpen(false)} className="mt-4 flex items-center gap-1 text-xs text-gold hover:underline">{hi ? 'सभी भाग्यांक' : 'All Bhagyank numbers'} <ArrowRight className="h-3 w-3" /></Link>
              <p className="mt-3 text-[11px] leading-snug text-muted-foreground">{hi ? 'भाग्यांक = पूरी जन्म तिथि के सभी अंकों का योग (जैसे 15-08-1990 → 33 → 6)।' : 'Bhagyank = all digits of your full date of birth added (e.g. 15-08-1990 → 33 → 6).'}</p>
              <Link href="/calculators/bhagyank-calculator" onClick={() => setOpen(false)} className="mt-2 flex items-center gap-1 text-xs text-gold hover:underline">{hi ? 'भाग्यांक कैलकुलेटर' : 'Bhagyank calculator'} <ArrowRight className="h-3 w-3" /></Link>
            </div>
            {/* animated preview */}
            <div key={active} className="mk-fade p-5">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  <span className="mk-spin absolute inset-0 rounded-full border border-dashed border-gold/60" />
                  <span className="mk-spin-rev absolute inset-2 rounded-full border border-gold/30" />
                  <span className="mk-pulse absolute inset-3 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a]">
                    <span className="gold-text font-cinzel text-3xl font-bold">{m.n}</span>
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-cinzel text-xl font-bold gold-text">{hi ? 'भाग्यांक' : 'Bhagyank'} {m.n} · {m.title}</h3>
                  <p className="text-sm italic text-muted-foreground">{m.tagline}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-full border border-gold/40 px-2 py-0.5">{m.planet}</span>
                    <span className="rounded-full border border-gold/40 px-2 py-0.5">{m.luckyDays[0]}</span>
                    <span className="rounded-full border border-gold/40 px-2 py-0.5">{m.luckyColors.slice(0, 2).join(', ')}</span>
                    {m.master && <span className="rounded-full border border-gold/60 bg-gold/10 px-2 py-0.5 text-gold">{hi ? 'मास्टर' : 'Master'} {m.n === 2 ? 11 : m.n === 4 ? 22 : 33}</span>}
                  </div>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{m.intro}</p>
              <div className="mt-4 rounded-lg border border-gold/25 bg-gold/5 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold"><Sparkles className="h-3 w-3" />{hi ? 'जीवन का उद्देश्य' : 'Life purpose'}</p>
                <p className="text-xs">{m.purpose}</p>
                <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{hi ? 'जीवन के सबक' : 'Life lessons'}</p>
                <div className="flex flex-wrap gap-1.5">{m.lessons.map((x) => <span key={x} className="rounded bg-gold/10 px-2 py-0.5 text-[11px]">{x}</span>)}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/bhagyank/${m.n}`} onClick={() => setOpen(false)} className="mk-shine inline-flex items-center gap-1 rounded-md border border-gold/60 px-3 py-2 text-sm font-medium hover:bg-gold/10">{hi ? `भाग्यांक ${m.n} के बारे में पढ़ें` : `Read about Bhagyank ${m.n}`} <ArrowRight className="h-3.5 w-3.5" /></Link>
                <Link href="/reading" onClick={() => setOpen(false)} className="inline-flex items-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-3 py-2 text-sm font-semibold text-[hsl(250_45%_10%)] hover:brightness-105">{hi ? 'मेरी रीडिंग पाएँ' : 'Get my reading'}</Link>
              </div>
            </div>
          </div>
         </div>
        </div>
      )}
    </div>
  );
}
