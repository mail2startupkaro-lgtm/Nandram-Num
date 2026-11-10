'use client';
import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useApp } from '@/components/layout/providers';

export interface CityLite { slug: string; name: string; state: string; tier: 1 | 2 | 3; alias?: string; nameHi?: string; stateHi?: string; aliasHi?: string }
const TIERS = [{ v: 0, l: 'All cities', h: 'सभी शहर' }, { v: 1, l: 'Tier 1 · Metros', h: 'टियर 1 · महानगर' }, { v: 2, l: 'Tier 2', h: 'टियर 2' }, { v: 3, l: 'Tier 3', h: 'टियर 3' }] as const;
const PAGE = 36;

export function BlogExplorer({ cities }: { cities: CityLite[] }) {
  const { lang } = useApp();
  const hi = lang === 'hi';
  const [q, setQ] = React.useState('');
  const [tier, setTier] = React.useState<0 | 1 | 2 | 3>(0);
  const [state, setState] = React.useState('');
  const [shown, setShown] = React.useState(PAGE);
  React.useEffect(() => { const s = new URLSearchParams(window.location.search).get('state'); if (s) setState(s); }, []);
  const states = React.useMemo(() => Array.from(new Set(cities.map((c) => c.state))).sort(), [cities]);
  const list = React.useMemo(() => {
    const n = q.trim().toLowerCase();
    return cities.filter((c) => (!tier || c.tier === tier) && (!state || c.state === state) && (!n || c.name.toLowerCase().includes(n) || (c.alias ?? '').toLowerCase().includes(n) || c.state.toLowerCase().includes(n) || (c.nameHi ?? '').includes(n) || (c.stateHi ?? '').includes(n)));
  }, [cities, q, tier, state]);
  React.useEffect(() => setShown(PAGE), [q, tier, state]);
  return (
    <div className="space-y-5">
      <div className="glass flex flex-col gap-3 rounded-xl border border-gold/25 p-4 md:flex-row md:items-center">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label={hi ? 'शहर या राज्य खोजें' : 'Search city or state'} placeholder={hi ? 'अपना शहर या राज्य खोजें, जैसे जयपुर, केरल…' : 'Search your city or state, e.g. Jaipur, Kerala…'} value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" /></div>
        <select aria-label={hi ? 'राज्य के अनुसार छाँटें' : 'Filter by state'} value={state} onChange={(e) => setState(e.target.value)} className="h-10 rounded-md border border-input bg-background/70 px-3 text-sm md:w-56"><option value="">{hi ? 'सभी राज्य और केंद्र शासित प्रदेश' : 'All states & UTs'}</option>{states.map((s) => <option key={s} value={s}>{hi ? cities.find((c) => c.state === s)?.stateHi ?? s : s}</option>)}</select>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={hi ? 'शहर की श्रेणी के अनुसार छाँटें' : 'Filter by city tier'}>{TIERS.map((t) => <button key={t.v} type="button" aria-pressed={tier === t.v} onClick={() => setTier(t.v)} className={cn('rounded-full border px-4 py-1.5 text-sm', tier === t.v ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:bg-muted')}>{hi ? t.h : t.l}</button>)}</div>
      <p className="text-sm text-muted-foreground" aria-live="polite">{hi ? `${list.length} में से ${Math.min(shown, list.length)} शहर मार्गदर्शिकाएँ` : `Showing ${Math.min(shown, list.length)} of ${list.length} city guides`}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.slice(0, shown).map((c) => (
          <Link key={c.slug} href={`/blog/best-numerologist-in-${c.slug}`} className="mk-card glass group rounded-xl border border-gold/20 p-4">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-gold" />{hi ? c.stateHi ?? c.state : c.state}</span><span className="rounded-full border border-gold/30 px-2 py-0.5">{c.tier === 1 ? (hi ? 'महानगर' : 'Metro') : hi ? `टियर ${c.tier}` : `Tier ${c.tier}`}</span></div>
            <h3 className="mt-2 font-serif text-lg font-semibold group-hover:text-gold">{hi ? `${c.nameHi ?? c.name} में सबसे अच्छे अंक ज्योतिषी` : `Best Numerologist in ${c.name}`}</h3>
            {c.alias && <p className="text-xs text-muted-foreground">{hi ? `${c.aliasHi ?? c.alias} नाम से भी` : `Also: Numerologist in ${c.alias}`}</p>}
            <span className="mt-2 inline-flex items-center gap-1 text-sm text-gold">{hi ? 'मार्गदर्शिका पढ़ें' : 'Read guide'} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        ))}
      </div>
      {list.length === 0 && <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{hi ? <>कोई शहर नहीं मिला। आचार्य नंदराम ऑनलाइन काम करते हैं, इसलिए आप भारत में कहीं से भी <Link href="/reading" className="text-gold underline">अपनी रीडिंग पा सकते हैं</Link>।</> : <>No city found. Acharya Nandram works online, so you can still <Link href="/reading" className="text-gold underline">get your reading</Link> from anywhere in India.</>}</p>}
      {shown < list.length && <div className="text-center"><button type="button" onClick={() => setShown(shown + PAGE)} className="rounded-md border border-gold/50 px-6 py-2.5 text-sm hover:bg-gold/10">{hi ? 'और शहर देखें' : 'Show more cities'}</button></div>}
    </div>
  );
}
