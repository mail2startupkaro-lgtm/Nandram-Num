'use client';
import * as React from 'react';
import Link from 'next/link';
import { Heart, Search, Sparkles, UserRound } from 'lucide-react';
import { todayIST } from '@/lib/numerology';
import { Field, Input } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { buildAngel, isAngelNumber } from '@/lib/angel/generate';
import { DIGITS } from '@/lib/angel/digits';
import { DIGITS_HI } from '@/lib/angel/digits-hi';
import { buildAngelHi } from '@/lib/angel/generate-hi';
import { useApp } from '@/components/layout/providers';
import { tr } from '@/lib/i18n/hi-terms';
import { angelCompatibility, coupleAngel, personalAngels } from '@/lib/angel/compat';

type Tab = 'mine' | 'match' | 'couple';
const TABS: { v: Tab; l: string; h: string; icon: React.ReactNode }[] = [
  { v: 'mine', l: 'Find My Angel Number', h: 'मेरा एंजेल नंबर खोजें', icon: <UserRound className="h-4 w-4" /> },
  { v: 'match', l: 'Angel Number × DOB Compatibility', h: 'एंजेल नंबर × जन्म तिथि अनुकूलता', icon: <Search className="h-4 w-4" /> },
  { v: 'couple', l: 'Couple Angel Number', h: 'जोड़ी का एंजेल नंबर', icon: <Heart className="h-4 w-4" /> },
];
/** Angel page data in the active language. */
const angelPage = (n: string, hi: boolean) => { const en = buildAngel(n); return hi ? buildAngelHi(n, en) : en; };
const parseIso = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? { year: +m[1], month: +m[2], day: +m[3] } : null; };
const REL = { friend: ['Friendly', 'text-emerald-400 border-emerald-400/50', 'मित्र'], neutral: ['Neutral', 'text-amber-300 border-amber-300/50', 'सम'], enemy: ['Challenging', 'text-rose-400 border-rose-400/50', 'चुनौतीपूर्ण'] } as const;
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

function AngelTile({ label, n, why, hi }: { label: string; n: string; why: string; hi: boolean }) {
  const p = angelPage(n, hi);
  return (
    <Link href={`/angel-numbers/${n}`} className="mk-card mk-rise group rounded-xl border border-gold/30 bg-background/40 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{label}</p>
      <p className="gold-text font-cinzel text-4xl font-bold">{n}</p>
      <p className="text-sm font-medium">{p.theme}</p>
      <p className="mt-1 text-xs text-muted-foreground">{why}</p>
      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{p.summary}</p>
      <span className="mt-2 inline-block text-sm text-gold group-hover:underline">{hi ? 'पूरा अर्थ पढ़ें →' : 'Read full meaning →'}</span>
    </Link>
  );
}

export function AngelCalculator({ initialTab = 'mine', initialNumber = '' }: { initialTab?: Tab; initialNumber?: string }) {
  const { lang } = useApp();
  const hi = lang === 'hi';
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
          className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors', tab === t.v ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:bg-muted')}>{t.icon}{hi ? t.h : t.l}</button>)}
      </div>
      <form className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); if (valid) setDone(true); }}>
        <Field label={tab === 'couple' ? (hi ? 'साथी 1 – जन्म तिथि' : 'Partner 1 – date of birth') : (hi ? 'आपकी जन्म तिथि' : 'Your date of birth')} htmlFor="an-dob"><Input id="an-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={`${today.year}-12-31`} /></Field>
        {tab === 'match' && <Field label={hi ? 'बार-बार दिखने वाला एंजेल नंबर' : 'Angel number you keep seeing'} htmlFor="an-n"><Input id="an-n" inputMode="numeric" value={angel} onChange={(e) => setAngel(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder={hi ? 'जैसे 222, 1111, 0909' : 'e.g. 222, 1111, 0909'} /></Field>}
        {tab === 'couple' && <Field label={hi ? 'साथी 2 – जन्म तिथि' : 'Partner 2 – date of birth'} htmlFor="an-dob2"><Input id="an-dob2" type="date" value={dob2} onChange={(e) => setDob2(e.target.value)} /></Field>}
        {tab === 'mine' && <div className="hidden sm:block" />}
        <button type="submit" disabled={!valid} className={GOLD_BTN}><Sparkles className="h-4 w-4" />{hi ? 'गणना करें' : 'Calculate'}</button>
      </form>

      {done && d1 && tab === 'mine' && (() => { const r = personalAngels(d1, today); return (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">{hi ? 'मूलांक' : 'Mulank'} <b className="text-gold">{r.moolank}</b> · {hi ? 'भाग्यांक' : 'Bhagyank'} <b className="text-gold">{r.master ? `${r.master}/${r.bhagyank}` : r.bhagyank}</b> · {hi ? 'वर्तमान व्यक्तिगत वर्ष' : 'Current personal year'}: <b className="text-gold">{r.personalYear}</b></p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{r.list.map((x) => <AngelTile key={x.key} label={hi ? x.labelHi : x.label} n={x.n} why={hi ? x.whyHi : x.why} hi={hi} />)}</div>
          <p className="text-xs text-muted-foreground">{hi ? 'जीवन-पथ एंजेल नंबर को सबसे निकट रखें। बाक़ी अंक आपका रोज़ का स्वभाव, आपका व्यक्तिगत घड़ी-संकेत और इस वर्ष का विषय बताते हैं।' : 'Your Life Path angel number is the one to keep closest. The others describe your daily nature, a personal clock sign and the theme of this year.'}</p>
        </div>); })()}

      {done && d1 && tab === 'match' && isAngelNumber(angel) && (() => { const c = angelCompatibility(angel, d1); const p = angelPage(angel, hi); return (
        <div className="mk-rise mt-6 grid gap-6 md:grid-cols-[auto_1fr]">
          <Ring value={c.score} label={hi ? 'अनुकूलता' : 'Alignment'} />
          <div className="space-y-3">
            <h3 className="font-cinzel text-2xl font-bold"><span className="gold-text">{angel}</span> × {hi ? 'आपकी जन्म तिथि' : 'your date of birth'}: {tr(lang, c.verdict)}</h3>
            {hi ? (
              <p className="text-sm text-muted-foreground">{angel} का मूल अंक <b className="text-gold">{c.root}</b> है। आपका भाग्यांक <b className="text-gold">{c.bhagyank}</b> और मूलांक <b className="text-gold">{c.moolank}</b> है।{' '}
                {c.root === 0 ? 'शून्य आधारित अंक सार्वभौमिक हैं और हर जन्म तिथि का साथ देते हैं।' : <>आपके भाग्यांक के लिए {c.root} <b>{REL[c.relB][2]}</b> है; आपके मूलांक के लिए यह <b>{REL[c.relM][2]}</b> है।</>}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{angel} reduces to root <b className="text-gold">{c.root}</b>. Your Bhagyank is <b className="text-gold">{c.bhagyank}</b> and Mulank is <b className="text-gold">{c.moolank}</b>.{' '}
                {c.root === 0 ? 'Zero-based numbers are universal and support every date of birth.' : <>For your Bhagyank, {c.root} is <b>{REL[c.relB][0].toLowerCase()}</b>; for your Mulank it is <b>{REL[c.relM][0].toLowerCase()}</b>.</>}</p>
            )}
            <div className="flex flex-wrap gap-2">{c.perDigit.map((x) => <span key={x.d} className={cn('rounded-full border px-3 py-1 text-xs', REL[x.rel][1])}>{x.d} · {hi ? DIGITS_HI[x.d].word : DIGITS[x.d].word} · {hi ? REL[x.rel][2] : REL[x.rel][0]}</span>)}</div>
            <p className="text-sm">{hi
              ? (c.score >= 62 ? `यह अंक आपकी ऊर्जा के अनुकूल है। इसका संदेश – ${p.theme} – आपको स्वाभाविक लगेगा, इसलिए आत्मविश्वास से उस पर काम करें।`
                : c.score >= 42 ? `यह अंक आपके लिए सम है। इसका संदेश – ${p.theme} – अपने-आप नहीं आता, बल्कि एक कौशल है जिसे विकसित करना है।`
                  : `यह अंक आपकी स्वाभाविक ऊर्जा को चुनौती देता है। इसे एक सबक की तरह पढ़ें: इसका विषय – ${p.theme} – वह क्षेत्र है जहाँ धैर्य और जागरूकता सबसे अधिक मदद करते हैं। यह अशुभ संकेत नहीं है।`)
              : (c.score >= 62
                ? `This number works with your energy. Its message of ${p.theme.toLowerCase()} is likely to feel natural, so act on it with confidence.`
                : c.score >= 42 ? `This number is neutral for you. Its message of ${p.theme.toLowerCase()} is a skill to develop rather than something that comes automatically.`
                  : `This number challenges your natural energy. Read it as a lesson: its theme of ${p.theme.toLowerCase()} is an area where patience and awareness help you most. It is not a bad omen.`)}</p>
            <p className="text-sm text-muted-foreground">{p.summary}</p>
            <div className="flex flex-wrap gap-2"><Link href={`/angel-numbers/${angel}`} className="inline-flex h-10 items-center rounded-md border border-gold/50 px-4 text-sm hover:bg-gold/10">{hi ? `${angel} का पूरा अर्थ` : `Full meaning of ${angel}`}</Link><Link href="/reading" className={GOLD_BTN}>{hi ? 'मेरी पूरी रीडिंग पाएँ' : 'Get my full reading'}</Link></div>
          </div>
        </div>); })()}

      {done && d1 && d2 && tab === 'couple' && (() => { const c = coupleAngel(d1, d2); return (
        <div className="mk-rise mt-6 grid gap-6 md:grid-cols-[auto_1fr]">
          <Ring value={c.harmony} label={hi ? 'सामंजस्य' : 'Harmony'} />
          <div className="space-y-3">
            <h3 className="font-cinzel text-2xl font-bold">{hi ? 'आपकी जोड़ी का एंजेल नंबर है' : 'Your couple angel number is'} <span className="gold-text">{c.angel}</span></h3>
            <p className="text-sm text-muted-foreground">{hi ? `भाग्यांक ${c.ba} + ${c.bb} का योग घटकर ${c.root} बनता है। मूलांक की जोड़ी: ${c.ma} और ${c.mb}। सामंजस्य आपके भाग्यांक और मूलांक की मित्रता पर आधारित है।` : `Bhagyank ${c.ba} + ${c.bb} reduces to ${c.root}. Mulank pair: ${c.ma} and ${c.mb}. Harmony is based on the friendship of your Bhagyank and Mulank numbers.`}</p>
            <p className="text-sm">{angelPage(c.angel, hi).summary}</p>
            <p className="text-sm text-muted-foreground">{hi ? (c.harmony >= 70 ? 'आपके अंक स्वाभाविक रूप से एक-दूसरे का साथ देते हैं।' : c.harmony >= 45 ? 'आपके अंक संतुलित हैं: कुछ क्षेत्र सहज चलते हैं, कुछ में सचेत प्रयास चाहिए।' : 'आपके अंक अलग-अलग दिशाओं में खींचते हैं, इसलिए आपसी समझ और उपाय अधिक महत्वपूर्ण हैं। पूरी जोड़ी रीडिंग बताती है कि कहाँ और कैसे।') : (c.harmony >= 70 ? 'Your numbers support each other naturally.' : c.harmony >= 45 ? 'Your numbers are balanced: some areas flow easily, others need conscious effort.' : 'Your numbers pull in different directions, so understanding and remedies matter more. A full couple reading explains where and how.')}</p>
            <div className="flex flex-wrap gap-2"><Link href={`/angel-numbers/${c.angel}`} className="inline-flex h-10 items-center rounded-md border border-gold/50 px-4 text-sm hover:bg-gold/10">{hi ? `${c.angel} का अर्थ` : `Meaning of ${c.angel}`}</Link><Link href="/reading" className={GOLD_BTN}>{hi ? 'जोड़ी मिलान रिपोर्ट पाएँ' : 'Get couple compatibility report'}</Link></div>
          </div>
        </div>); })()}
      <p className="mt-5 text-[11px] text-muted-foreground">{hi ? 'गणना पारंपरिक भारतीय अंक ज्योतिष (मूलांक, भाग्यांक और मित्र-अंक तालिका) पर आधारित है। यह केवल मार्गदर्शन है, पेशेवर सलाह का विकल्प नहीं।' : 'Calculations follow traditional Indian numerology (Mulank, Bhagyank and the friendly-number table). Guidance only, not a substitute for professional advice.'}</p>
    </div>
  );
}
