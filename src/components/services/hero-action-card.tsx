'use client';
/**
 * Hero action card on every service page: two intents in one place.
 *  - "Free reading" tab (default): the mini-reading lead form – lowest-friction step for new visitors.
 *  - "Book" tab: the price / what's-included card for visitors who are ready to pay.
 * Any link to #book (sticky bar, sample report, hero button) switches to the Book tab; #free switches back.
 */
import * as React from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { trackEvent } from '@/lib/client/analytics';
import { cn } from '@/lib/utils';

type Tab = 'free' | 'book';

export function HeroActionCard({ free, book, freeTitle, priceHint }: { free: React.ReactNode; book: React.ReactNode | null; freeTitle: { en: string; hi: string }; priceHint?: string }) {
  const { lang } = useApp();
  const hi = lang === 'hi';
  const [tab, setTab] = React.useState<Tab>('free');
  const show = React.useCallback((t: Tab, source: string) => { setTab(t); trackEvent('hero_tab', { tab: t, source }); }, []);

  React.useEffect(() => {
    const fromHash = () => { if (location.hash === '#book') setTab('book'); else if (location.hash === '#free') setTab('free'); };
    fromHash();
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href="#book"], a[href="#free"]');
      if (a) setTab(a.getAttribute('href') === '#book' ? 'book' : 'free');
    };
    window.addEventListener('hashchange', fromHash);
    document.addEventListener('click', onClick, true);
    return () => { window.removeEventListener('hashchange', fromHash); document.removeEventListener('click', onClick, true); };
  }, []);

  const tabs: { id: Tab; label: React.ReactNode }[] = [
    { id: 'free', label: <><Gift className="h-4 w-4" />{hi ? 'मुफ़्त रीडिंग' : 'Free reading'}</> },
    ...(book ? [{ id: 'book' as Tab, label: <><Sparkles className="h-4 w-4" />{hi ? 'पूरी रिपोर्ट बुक करें' : 'Book full report'}{priceHint && <span className="hidden rounded-full bg-black/15 px-1.5 text-[11px] sm:inline">{priceHint}</span>}</> }] : []),
  ];

  return (
    <div className="sh-card relative rounded-2xl p-1.5">
      <div role="tablist" aria-label={hi ? 'विकल्प चुनें' : 'Choose an option'} className="grid gap-1 rounded-xl bg-background/50 p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" id={`sh-tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`sh-panel-${t.id}`} onClick={() => show(t.id, 'tab')}
            className={cn('inline-flex h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition', tab === t.id ? 'bg-gradient-to-r from-gold to-amber-500 text-black shadow-lg shadow-gold/20' : 'text-muted-foreground hover:bg-gold/10 hover:text-foreground')}>
            {t.label}
          </button>
        ))}
      </div>
      <div id="sh-panel-free" role="tabpanel" aria-labelledby="sh-tab-free" hidden={tab !== 'free'} className="p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{hi ? 'मुफ़्त · कोई भुगतान नहीं' : 'Free · no payment'}</p>
        <p className="mb-3 mt-1 font-cinzel text-lg font-bold leading-snug">{freeTitle[lang]}</p>
        {free}
        {book && <button type="button" onClick={() => show('book', 'switch')} className="mt-3 w-full text-center text-sm text-gold hover:underline">{hi ? 'सीधे पूरी रिपोर्ट चाहिए? बुक करें →' : 'Ready for the full report? Book it →'}</button>}
      </div>
      {book && <div id="sh-panel-book" role="tabpanel" aria-labelledby="sh-tab-book" hidden={tab !== 'book'} className="pt-1.5">{book}</div>}
    </div>
  );
}
