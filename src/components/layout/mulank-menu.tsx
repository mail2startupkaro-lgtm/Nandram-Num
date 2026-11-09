'use client';
import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { MULANK } from '@/lib/mulank-data';
import { mulankServices } from '@/lib/mulank-services';
import { useApp } from './providers';

/** Header "Mulank" mega-menu: number grid + animated preview with traits and our services. */
export function MulankMenu() {
  const { t } = useApp();
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(1);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrap = React.useRef<HTMLDivElement>(null);
  const m = MULANK.find((x) => x.n === active)!;
  const services = mulankServices(active).slice(0, 3);

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
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-muted">
        {t.nav.mulank}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="fixed inset-x-0 top-[65px] z-50 mx-auto w-[min(92vw,820px)] pt-2">
         <span aria-hidden className="absolute -top-4 inset-x-0 h-6" />
         <div className="mk-drop glass overflow-hidden rounded-xl border border-gold/30 bg-background/95 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-[250px_1fr]">
            {/* number grid */}
            <div className="border-r border-gold/20 bg-gradient-to-b from-gold/5 to-transparent p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Choose your Mulank</p>
              <div className="grid grid-cols-3 gap-2">
                {MULANK.map((x) => (
                  <Link key={x.n} href={`/mulank/${x.n}`} onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(x.n)} onFocus={() => setActive(x.n)}
                    className={`group flex flex-col items-center rounded-lg border py-2 transition-all ${active === x.n ? 'border-gold bg-gold/15 shadow-[0_0_16px_hsl(var(--gold)/0.3)]' : 'border-gold/20 hover:border-gold/60'}`}>
                    <span className="gold-text font-cinzel text-2xl font-bold leading-none">{x.n}</span>
                    <span className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">{x.planet.split(' ')[0]}</span>
                  </Link>
                ))}
              </div>
              <Link href="/mulank" onClick={() => setOpen(false)} className="mt-4 flex items-center gap-1 text-xs text-gold hover:underline">All Mulank numbers <ArrowRight className="h-3 w-3" /></Link>
              <p className="mt-3 text-[11px] leading-snug text-muted-foreground">Mulank = your day of birth reduced to one digit (e.g. 28 → 2+8 = 10 → 1).</p>
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
                  <h3 className="font-cinzel text-xl font-bold gold-text">Mulank {m.n} · {m.title}</h3>
                  <p className="text-sm italic text-muted-foreground">{m.tagline}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-full border border-gold/40 px-2 py-0.5">{m.planet}</span>
                    <span className="rounded-full border border-gold/40 px-2 py-0.5">{m.luckyDays[0]}</span>
                    <span className="rounded-full border border-gold/40 px-2 py-0.5">{m.luckyColors.slice(0, 2).join(', ')}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{m.intro}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.traits.slice(0, 4).map((tr) => <span key={tr} className="rounded bg-gold/10 px-2 py-0.5 text-[11px]">{tr}</span>)}
              </div>
              <div className="mt-4 rounded-lg border border-gold/25 bg-gold/5 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold"><Sparkles className="h-3 w-3" />What we offer for Mulank {m.n}</p>
                <ul className="space-y-1.5">
                  {services.map((s) => (
                    <li key={s.title}><Link href={s.href} onClick={() => setOpen(false)} className="group flex items-start gap-2 text-xs hover:text-gold">
                      <span className="mt-0.5 w-5 shrink-0 text-center text-gold">{s.icon}</span>
                      <span><span className="font-medium">{s.title}</span><span className="block text-muted-foreground">{s.desc}</span></span>
                    </Link></li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/mulank/${m.n}`} onClick={() => setOpen(false)} className="mk-shine inline-flex items-center gap-1 rounded-md border border-gold/60 px-3 py-2 text-sm font-medium hover:bg-gold/10">Read about Mulank {m.n} <ArrowRight className="h-3.5 w-3.5" /></Link>
                <Link href="/reading" onClick={() => setOpen(false)} className="inline-flex items-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-3 py-2 text-sm font-semibold text-[hsl(250_45%_10%)] hover:brightness-105">Get my reading</Link>
              </div>
            </div>
          </div>
         </div>
        </div>
      )}
    </div>
  );
}
