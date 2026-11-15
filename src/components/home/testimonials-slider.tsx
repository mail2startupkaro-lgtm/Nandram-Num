'use client';
/**
 * "What Our Clients Say About Us" – animated testimonial slider shown above the footer on every public page.
 * 1 card on phones, 2 on tablets, 3 on desktop. Auto-plays (pauses on hover, focus, hidden tab and for reduced motion),
 * arrows, dots, keyboard ←/→ and swipe. The page's own service reviews come first.
 */
import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Pause, Play, Quote, Star } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Bi } from '@/components/i18n/bi';
import { cn } from '@/lib/utils';
import { HIDE_TESTIMONIALS_ON, orderForPath, serviceLabel, type Testimonial } from '@/lib/testimonials';

const AUTOPLAY_MS = 6000;

function usePerView() {
  const [n, setN] = React.useState(1);
  React.useEffect(() => {
    const lg = window.matchMedia('(min-width: 1024px)'), md = window.matchMedia('(min-width: 640px)');
    const upd = () => setN(lg.matches ? 3 : md.matches ? 2 : 1);
    upd(); lg.addEventListener('change', upd); md.addEventListener('change', upd);
    return () => { lg.removeEventListener('change', upd); md.removeEventListener('change', upd); };
  }, []);
  return n;
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

function Avatar({ t }: { t: Testimonial }) {
  return (
    <span aria-hidden className={cn('relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-serif text-lg font-semibold text-white shadow-md ring-2 ring-gold/60',
      t.gender === 'female' ? 'bg-gradient-to-br from-rose-500 via-fuchsia-600 to-amber-500' : 'bg-gradient-to-br from-indigo-600 via-violet-700 to-amber-500')}>
      {initials(t.name)}
      <span className="absolute -inset-1 -z-10 animate-pulse rounded-full bg-gold/20 blur-md" />
    </span>
  );
}

function Card({ t, active }: { t: Testimonial; active: boolean }) {
  const svc = serviceLabel(t.service);
  return (
    <figure className={cn('group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold/30 bg-card/70 p-6 shadow-lg backdrop-blur-md transition duration-500',
      'hover:-translate-y-1 hover:border-gold/70 hover:shadow-[0_18px_40px_-12px_hsl(var(--gold)/0.45)]', active ? 'opacity-100' : 'opacity-60')}>
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <Quote aria-hidden className="mb-3 h-8 w-8 rotate-180 text-gold/70" />
      {t.rating ? <div className="mb-2 flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} className={cn('h-4 w-4', i < t.rating! ? 'fill-gold text-gold' : 'text-muted-foreground/40')} />)}</div> : null}
      <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground/90">
        {t.quoteHi ? <Bi en={<>“{t.quoteEn}”</>} hi={<>“{t.quoteHi}”</>} /> : <span lang="en">“{t.quoteEn}”</span>}
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-gold/20 pt-4">
        <Avatar t={t} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{t.name}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {t.location && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{t.location}</span>}
            <span className="text-gold/90"><Bi en={svc.en} hi={svc.hi} /></span>
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

export function TestimonialsSlider({ items }: { items: Testimonial[] }) {
  const pathname = usePathname() ?? '/';
  const list = React.useMemo(() => orderForPath(items, pathname), [items, pathname]);
  const perView = usePerView();
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [stopped, setStopped] = React.useState(false); // user pressed pause
  const pages = Math.max(1, list.length - perView + 1);
  const go = React.useCallback((i: number) => setIndex(((i % pages) + pages) % pages), [pages]);
  React.useEffect(() => { setIndex(0); }, [pathname, perView]);

  React.useEffect(() => {
    if (reduce || paused || stopped || pages <= 1) return;
    const h = setInterval(() => { if (document.visibilityState === 'visible') setIndex((i) => (i + 1) % pages); }, AUTOPLAY_MS);
    return () => clearInterval(h);
  }, [reduce, paused, stopped, pages]);

  if (HIDE_TESTIMONIALS_ON.test(pathname) || list.length === 0) return null;

  return (
    <section aria-roledescription="carousel" aria-labelledby="testimonials-title" className="relative mx-auto mt-20 max-w-7xl px-4"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') go(index + 1); if (e.key === 'ArrowLeft') go(index - 1); }}>
      <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }} className="mb-8 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold"><Bi en="Client stories" hi="क्लाइंट्स के अनुभव" /></p>
        <h2 id="testimonials-title" className="font-serif text-3xl font-bold sm:text-4xl"><Bi en="What Our Clients Say About Us" hi="हमारे क्लाइंट्स हमारे बारे में क्या कहते हैं" /></h2>
        <div aria-hidden className="mx-auto mt-3 h-px w-40 bg-gradient-to-r from-transparent via-gold to-transparent" />
      </motion.div>

      <div className="relative">
        <div className="overflow-hidden px-1 py-3">
          <motion.ul className="flex" animate={{ x: `-${(index * 100) / perView}%` }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 80, damping: 20 }}
            drag={pages > 1 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
            onDragEnd={(_, info) => { if (info.offset.x < -60 || info.velocity.x < -400) go(index + 1); else if (info.offset.x > 60 || info.velocity.x > 400) go(index - 1); }}>
            {list.map((t, i) => {
              const visible = i >= index && i < index + perView;
              return (
                <li key={t.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${list.length}`} aria-hidden={!visible} className="shrink-0 px-2.5" style={{ width: `${100 / perView}%` }}>
                  <motion.div className="h-full" initial={reduce ? false : { opacity: 0, y: 30, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % perView) * 0.12 }}>
                    <Card t={t} active={visible} />
                  </motion.div>
                </li>
              );
            })}
          </motion.ul>
        </div>

        {pages > 1 && (<>
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous testimonials" className="absolute -left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/50 bg-card/90 shadow-lg backdrop-blur transition hover:scale-110 hover:bg-gold/20 sm:flex lg:-left-5"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next testimonials" className="absolute -right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/50 bg-card/90 shadow-lg backdrop-blur transition hover:scale-110 hover:bg-gold/20 sm:flex lg:-right-5"><ChevronRight className="h-5 w-5" /></button>
        </>)}
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2" role="tablist" aria-label="Choose testimonials">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`Show testimonial ${i + 1}`} onClick={() => go(i)}
                className={cn('h-2.5 rounded-full transition-all duration-500', i === index ? 'w-8 bg-gold' : 'w-2.5 bg-gold/30 hover:bg-gold/60')} />
            ))}
          </div>
          {!reduce && <button type="button" onClick={() => setStopped(!stopped)} aria-label={stopped ? 'Play testimonials' : 'Pause testimonials'} className="rounded-full p-1.5 text-muted-foreground hover:bg-gold/10 hover:text-foreground">{stopped ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}</button>}
        </div>
      )}
    </section>
  );
}
