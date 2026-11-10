'use client';
import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useApp } from '@/components/layout/providers';

export type AngelLite = [string, string]; // [number, pattern]
const FILTERS = [
  { v: '', l: 'All numbers', h: 'सभी अंक' }, { v: 'repeat', l: 'Repeating (111, 2222)', h: 'दोहराव वाले (111, 2222)' }, { v: 'mirror', l: 'Mirror (1212, 0909)', h: 'दर्पण (1212, 0909)' },
  { v: 'palindrome', l: 'Palindrome (1221, 717)', h: 'पैलिंड्रोम (1221, 717)' }, { v: 'seq', l: 'Sequences (1234, 321)', h: 'क्रम (1234, 321)' }, { v: 'pairs', l: 'Double pairs (1144)', h: 'दोहरी जोड़ियाँ (1144)' }, { v: 'other', l: 'Other combinations', h: 'अन्य संयोजन' },
];
const PAGE = 120;

export function AngelExplorer({ items }: { items: AngelLite[] }) {
  const { lang } = useApp();
  const hi = lang === 'hi';
  const [q, setQ] = React.useState('');
  const [f, setF] = React.useState('');
  const [shown, setShown] = React.useState(PAGE);
  const list = React.useMemo(() => items.filter(([n, p]) => {
    if (q && !n.includes(q)) return false;
    if (!f) return true;
    if (f === 'seq') return p === 'ascending' || p === 'descending';
    if (f === 'other') return p === 'mixed' || p === 'dominant' || p === 'single';
    return p === f;
  }), [items, q, f]);
  React.useEffect(() => setShown(PAGE), [q, f]);
  const go = (e: React.FormEvent) => { e.preventDefault(); if (/^\d{1,5}$/.test(q)) window.location.assign(`/angel-numbers/${q}`); };
  return (
    <div className="space-y-4">
      <form onSubmit={go} className="glass flex flex-col gap-3 rounded-xl border border-gold/25 p-4 sm:flex-row">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input aria-label={hi ? 'एंजेल नंबर खोजें' : 'Search an angel number'} inputMode="numeric" placeholder={hi ? 'बार-बार दिखने वाला कोई भी अंक लिखें, जैसे 1144' : 'Type any number you keep seeing, e.g. 1144'} value={q} onChange={(e) => setQ(e.target.value.replace(/\D/g, '').slice(0, 5))} className="pl-9" /></div>
        <button type="submit" disabled={!q} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-5 text-sm font-semibold text-[hsl(250_45%_10%)] disabled:opacity-50">{hi ? 'अर्थ देखें' : 'Show meaning'} <ArrowRight className="h-4 w-4" /></button>
      </form>
      <div className="flex flex-wrap gap-2" role="group" aria-label={hi ? 'क्रम के अनुसार छाँटें' : 'Filter by pattern'}>{FILTERS.map((x) => <button key={x.v} type="button" aria-pressed={f === x.v} onClick={() => setF(x.v)} className={cn('rounded-full border px-3 py-1.5 text-xs sm:text-sm', f === x.v ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:bg-muted')}>{hi ? x.h : x.l}</button>)}</div>
      <p className="text-sm text-muted-foreground" aria-live="polite">{hi ? `${list.length} एंजेल नंबर, सबसे अधिक खोजे गए पहले` : `${list.length} angel numbers, most searched first`}</p>
      <div className="flex flex-wrap gap-2">
        {list.slice(0, shown).map(([n]) => <Link key={n} href={`/angel-numbers/${n}`} className="mk-card min-w-[4.5rem] rounded-lg border border-gold/25 bg-background/40 px-3 py-2 text-center font-cinzel text-lg font-bold hover:text-gold">{n}</Link>)}
      </div>
      {list.length === 0 && <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{hi ? <>यह अभी हमारी सूची में नहीं है – <b>अर्थ देखें</b> दबाएँ, हम {q || 'इसका'} अर्थ इसके अंकों से बताएँगे।</> : <>Not in our list yet – press <b>Show meaning</b> and we will interpret {q || 'it'} from its digits.</>}</p>}
      {shown < list.length && <div className="text-center"><button type="button" onClick={() => setShown(shown + PAGE * 2)} className="rounded-md border border-gold/50 px-6 py-2.5 text-sm hover:bg-gold/10">{hi ? 'और अंक देखें' : 'Show more numbers'}</button></div>}
    </div>
  );
}
