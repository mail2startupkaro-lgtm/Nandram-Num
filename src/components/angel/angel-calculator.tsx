'use client';
import * as React from 'react';
import Link from 'next/link';
import { Heart, Search, Sparkles, UserRound } from 'lucide-react';
import { todayIST } from '@/lib/numerology';
import { Field, Input } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { buildAngel, isAngelNumber } from '@/lib/angel/generate';
import { DIGITS } from '@/lib/angel/digits';
import { angelCompatibility, coupleAngel, personalAngels } from '@/lib/angel/compat';

type Tab = 'mine' | 'match' | 'couple';
const TABS: { v: Tab; l: string; icon: React.ReactNode }[] = [
  { v: 'mine', l: 'Find My Angel Number', icon: <UserRound className="h-4 w-4" /> },
  { v: 'match', l: 'Angel Number × DOB Compatibility', icon: <Search className="h-4 w-4" /> },
  { v: 'couple', l: 'Couple Angel Number', icon: <Heart className="h-4 w-4" /> },
];
const parseIso = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? { year: +m[1], month: +m[2], day: +m[3] } : null; };
const REL = { friend: ['Friendly', 'text-emerald-400 border-emerald-400/50'], neutral: ['Neutral', 'text-amber-300 border-amber-300/50'], enemy: ['Challenging', 'text-rose-400 border-rose-400/50'] } as const;
const GOLD_BTN = 'inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-5 text-sm font-semibold text-[hsl(250_45%_10%)] hover:brightness-105 disabled:opacity-50';

function Ring({ value, label }: { value: number; label: string }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#ag)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset 900ms ease' }} />
        <defs><linearGradient id="ag" x1="0" x2="1"><stop offset="0" stopColor="hsl(345 60% 40%)" /><stop offset="1" stopColor="hsl(43 85% 58%)" /></linearGradient></defs></svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="gold-text font-serif text-4xl font-bold">{value}%</span><span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span></div>
    </div>
  );
}

function AngelTile({ label, n, why }: { label: string; n: string; why: string }) {
  const p = buildAngel(n);
  return (
    <Link href={`/angel-numbers/${n}`} className="mk-card mk-rise group rounded-xl border border-gold/30 bg-background/40 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{label}</p>
      <p className="gold-text font-cinzel text-4xl font-bold">{n}</p>
      <p className="text-sm font-medium">{p.theme}</p>
      <p className="mt-1 text-xs text-muted-foreground">{why}</p>
      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{p.summary}</p>
      <span className="mt-2 inline-block text-sm text-gold group-hover:underline">Read full meaning →</span>
    </Link>
  );
}

export function AngelCalculator({ initialTab = 'mine', initialNumber = '' }: { initialTab?: Tab; initialNumber?: string }) {
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [dob, setDob] = React.useState('');
  const [dob2, setDob2] = React.useState('');
  const [angel, setAngel] = React.useState(initialNumber);
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('n');
    if (q && isAngelNumber(q)) { setAngel(q); setTab('match'); }
    else if (window.location.hash === '#couple') setTab('couple');
  }, []);
  React.useEffect(() => setDone(false), [tab, dob, dob2, angel]);
  const today = todayIST();
  const d1 = parseIso(dob), d2 = parseIso(dob2);
  const valid = tab === 'mine' ? !!d1 : tab === 'match' ? !!d1 && isAngelNumber(angel) : !!d1 && !!d2;

  return (
    <div className="glass rounded-2xl border border-gold/30 p-4 sm:p-6">
      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => <button key={t.v} role="tab" aria-selected={tab === t.v} type="button" onClick={() => setTab(t.v)}
          className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors', tab === t.v ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:bg-muted')}>{t.icon}{t.l}</button>)}
      </div>
      <form className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); if (valid) setDone(true); }}>
        <Field label={tab === 'couple' ? 'Partner 1 – date of birth' : 'Your date of birth'} htmlFor="an-dob"><Input id="an-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={`${today.year}-12-31`} /></Field>
        {tab === 'match' && <Field label="Angel number you keep seeing" htmlFor="an-n"><Input id="an-n" inputMode="numeric" value={angel} onChange={(e) => setAngel(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="e.g. 222, 1111, 0909" /></Field>}
        {tab === 'couple' && <Field label="Partner 2 – date of birth" htmlFor="an-dob2"><Input id="an-dob2" type="date" value={dob2} onChange={(e) => setDob2(e.target.value)} /></Field>}
        {tab === 'mine' && <div className="hidden sm:block" />}
        <button type="submit" disabled={!valid} className={GOLD_BTN}><Sparkles className="h-4 w-4" />Calculate</button>
      </form>

      {done && d1 && tab === 'mine' && (() => { const r = personalAngels(d1, today); return (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">Mulank <b className="text-gold">{r.moolank}</b> · Bhagyank <b className="text-gold">{r.master ? `${r.master}/${r.bhagyank}` : r.bhagyank}</b> · Personal year {today.year}: <b className="text-gold">{r.personalYear}</b></p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{r.list.map((x) => <AngelTile key={x.key} label={x.label} n={x.n} why={x.why} />)}</div>
          <p className="text-xs text-muted-foreground">Your Life Path angel number is the one to keep closest. The others describe your daily nature, a personal clock sign and the theme of this year.</p>
        </div>); })()}

      {done && d1 && tab === 'match' && isAngelNumber(angel) && (() => { const c = angelCompatibility(angel, d1); const p = buildAngel(angel); return (
        <div className="mk-rise mt-6 grid gap-6 md:grid-cols-[auto_1fr]">
          <Ring value={c.score} label="Alignment" />
          <div className="space-y-3">
            <h3 className="font-cinzel text-2xl font-bold"><span className="gold-text">{angel}</span> × your date of birth: {c.verdict}</h3>
            <p className="text-sm text-muted-foreground">{angel} reduces to root <b className="text-gold">{c.root}</b>. Your Bhagyank is <b className="text-gold">{c.bhagyank}</b> and Mulank is <b className="text-gold">{c.moolank}</b>.{' '}
              {c.root === 0 ? 'Zero-based numbers are universal and support every date of birth.' : <>For your Bhagyank, {c.root} is <b>{REL[c.relB][0].toLowerCase()}</b>; for your Mulank it is <b>{REL[c.relM][0].toLowerCase()}</b>.</>}</p>
            <div className="flex flex-wrap gap-2">{c.perDigit.map((x) => <span key={x.d} className={cn('rounded-full border px-3 py-1 text-xs', REL[x.rel][1])}>{x.d} · {DIGITS[x.d].word} · {REL[x.rel][0]}</span>)}</div>
            <p className="text-sm">{c.score >= 62
              ? `This number works with your energy. Its message of ${p.theme.toLowerCase()} is likely to feel natural, so act on it with confidence.`
              : c.score >= 42 ? `This number is neutral for you. Its message of ${p.theme.toLowerCase()} is a skill to develop rather than something that comes automatically.`
                : `This number challenges your natural energy. Read it as a lesson: its theme of ${p.theme.toLowerCase()} is an area where patience and awareness help you most. It is not a bad omen.`}</p>
            <p className="text-sm text-muted-foreground">{p.summary}</p>
            <div className="flex flex-wrap gap-2"><Link href={`/angel-numbers/${angel}`} className="inline-flex h-10 items-center rounded-md border border-gold/50 px-4 text-sm hover:bg-gold/10">Full meaning of {angel}</Link><Link href="/reading" className={GOLD_BTN}>Get my full reading</Link></div>
          </div>
        </div>); })()}

      {done && d1 && d2 && tab === 'couple' && (() => { const c = coupleAngel(d1, d2); return (
        <div className="mk-rise mt-6 grid gap-6 md:grid-cols-[auto_1fr]">
          <Ring value={c.harmony} label="Harmony" />
          <div className="space-y-3">
            <h3 className="font-cinzel text-2xl font-bold">Your couple angel number is <span className="gold-text">{c.angel}</span></h3>
            <p className="text-sm text-muted-foreground">Bhagyank {c.ba} + {c.bb} reduces to {c.root}. Mulank pair: {c.ma} and {c.mb}. Harmony is based on the friendship of your Bhagyank and Mulank numbers.</p>
            <p className="text-sm">{buildAngel(c.angel).summary}</p>
            <p className="text-sm text-muted-foreground">{c.harmony >= 70 ? 'Your numbers support each other naturally.' : c.harmony >= 45 ? 'Your numbers are balanced: some areas flow easily, others need conscious effort.' : 'Your numbers pull in different directions, so understanding and remedies matter more. A full couple reading explains where and how.'}</p>
            <div className="flex flex-wrap gap-2"><Link href={`/angel-numbers/${c.angel}`} className="inline-flex h-10 items-center rounded-md border border-gold/50 px-4 text-sm hover:bg-gold/10">Meaning of {c.angel}</Link><Link href="/reading" className={GOLD_BTN}>Get couple compatibility report</Link></div>
          </div>
        </div>); })()}
      <p className="mt-5 text-[11px] text-muted-foreground">Calculations follow traditional Indian numerology (Mulank, Bhagyank and the friendly-number table). Guidance only, not a substitute for professional advice.</p>
    </div>
  );
}
