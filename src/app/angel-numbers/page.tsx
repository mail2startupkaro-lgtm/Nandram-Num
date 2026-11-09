import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calculator, Clock, Eye, Heart, Sparkles } from 'lucide-react';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { AngelCta, AngelOrb, GOLD_BTN } from '@/components/angel/angel-parts';
import { AngelCalculator } from '@/components/angel/angel-calculator';
import { AngelExplorer, type AngelLite } from '@/components/angel/angel-explorer';
import { analyse, buildAngel, TOP_ANGEL } from '@/lib/angel/generate';
import { DIGITS } from '@/lib/angel/digits';

export const metadata: Metadata = {
  title: 'Angel Numbers – Meanings of 1,400+ Angel Numbers (Love, Twin Flame, Career)',
  description: 'Meanings of every angel number, from 222, 777, 444 and 1111 to rare sequences, with love, twin flame, career, Hindi meaning and a free date-of-birth compatibility calculator by Acharya Nandram.',
  keywords: ['angel numbers', 'angel number meanings', 'all angel numbers', 'angel numbers list', 'angel number calculator', 'find my angel number', 'angel number meaning in hindi', 'twin flame numbers'],
  alternates: { canonical: '/angel-numbers' },
};

const FAQS = [
  { q: 'What are angel numbers?', a: 'Angel numbers are repeating or meaningful number sequences, such as 111, 222 or 11:11, that people notice again and again. In spiritual tradition they are read as gentle messages from the divine, your guides or your own intuition. Their meaning comes from the digits they contain.' },
  { q: 'How do I find my angel number?', a: 'Your personal angel number comes from your date of birth. Add all the digits of your birth date to get your Bhagyank (life path); repeating it gives your life path angel number, for example Bhagyank 7 gives 777. Use the free calculator on this page to find all four of your personal angel numbers.' },
  { q: 'Which angel number is the most powerful?', a: '1111 is the most famous because of its link with manifestation and 11:11 on the clock. By search interest in India, 222, 777 and 444 are the most looked-up. The most meaningful one for you is the number that keeps appearing in your life and aligns with your date of birth.' },
  { q: 'Are there bad angel numbers?', a: 'No. In angel-number tradition every number is guidance. Numbers such as 666 or 444 sometimes worry people, but they are read as calls to rebalance and to build stability, not as bad omens.' },
  { q: 'What does it mean when I see the same number on the clock?', a: 'Mirror and repeating times such as 11:11, 12:12 or 2:22 are among the most common forms of angel numbers. Look up the number on this page and notice what you were thinking at that moment.' },
  { q: 'Is angel number numerology the same as Indian numerology?', a: 'Angel numbers come from a modern spiritual tradition, while Indian numerology (Moolank, Bhagyank, Lo Shu grid) is a structured system. Our pages combine both: digit meanings with their Vedic ruling planets, and a compatibility check against your Moolank and Bhagyank.' },
];

export default function AngelHub() {
  const featured = TOP_ANGEL.slice(0, 12).map((n) => buildAngel(n));
  const items: AngelLite[] = TOP_ANGEL.map((n) => [n, analyse(n).pattern]);
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Angel Numbers', description: metadata.description, url: '/angel-numbers', author: { '@type': 'Person', name: 'Acharya Nandram' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
  return (
    <div className="container max-w-6xl space-y-12 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mk-rise relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-maroon/40 via-card/80 to-card/90 p-6 sm:p-10">
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Angel number guide</p>
            <h1 className="font-cinzel mt-2 text-4xl font-bold leading-tight sm:text-6xl"><span className="gold-text">Angel Numbers</span><span className="mt-2 block text-xl font-normal text-muted-foreground sm:text-2xl">Meanings of 1,400+ numbers, explained the Indian way</span></h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Keep seeing 222, 777, 444 or 11:11? Find out what your angel number means for love, twin flames, career and money, and check whether it matches your date of birth.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#calculator" className={`${GOLD_BTN} h-12 px-6`}><Calculator className="h-4 w-4" />Find My Angel Number</a>
              <a href="#all" className="inline-flex h-12 items-center rounded-md border border-gold/50 px-6 hover:bg-gold/10">Browse all numbers</a>
            </div>
          </div>
          <div className="mx-auto hidden sm:block"><AngelOrb n="1111" /></div>
        </div>
      </header>

      <section aria-labelledby="top" className="space-y-4">
        <h2 id="top" className="font-serif text-3xl font-bold">Most Searched Angel Numbers</h2>
        <p className="text-muted-foreground">Ranked by how often people in India search for them. Tap a number for its full meaning.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <Link key={p.n} href={`/angel-numbers/${p.n}`} className="mk-card glass group relative overflow-hidden rounded-xl border border-gold/25 p-5">
              <span className="absolute right-3 top-3 rounded-full border border-gold/30 px-2 py-0.5 text-[10px] text-muted-foreground">#{i + 1}</span>
              <div className="flex items-center gap-4"><AngelOrb n={p.n} size="sm" /><div><p className="gold-text font-cinzel text-3xl font-bold">{p.n}</p><p className="text-sm font-medium">{p.theme}</p></div></div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{p.summary}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-gold">Read meaning <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section id="calculator" aria-labelledby="calc" className="scroll-mt-24 space-y-4">
        <h2 id="calc" className="font-serif text-3xl font-bold">Angel Number Calculator by Date of Birth</h2>
        <p className="text-muted-foreground">Find your personal angel numbers, check whether the number you keep seeing is compatible with your date of birth, or discover your couple angel number.</p>
        <AngelCalculator />
      </section>

      <section aria-labelledby="what" className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 id="what" className="font-serif text-3xl font-bold">What Are Angel Numbers?</h2>
          <p className="text-muted-foreground">Angel numbers are number sequences that seem to follow you: 1:11 on the clock, 444 on a bill, 2222 on a number plate. In spiritual tradition they are read as gentle messages, reminders to pause, trust and notice what is happening in your life.</p>
          <p className="text-muted-foreground">Each digit carries a meaning, and repetition amplifies it. Acharya Nandram reads angel numbers alongside Indian numerology, so each digit is also linked with its ruling planet and checked against your Moolank and Bhagyank.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[{ i: <Eye className="h-5 w-5" />, t: 'Notice', d: 'Where and when you saw the number.' }, { i: <Sparkles className="h-5 w-5" />, t: 'Read', d: 'Look up its meaning and digits.' }, { i: <Heart className="h-5 w-5" />, t: 'Reflect', d: 'Connect it with your question.' }, { i: <Clock className="h-5 w-5" />, t: 'Act', d: 'Take one small aligned step.' }].map((x) => (
            <div key={x.t} className="glass rounded-xl border border-gold/20 p-4"><span className="text-gold">{x.i}</span><p className="mt-2 font-semibold">{x.t}</p><p className="text-sm text-muted-foreground">{x.d}</p></div>))}
        </div>
      </section>

      <section aria-labelledby="digits" className="space-y-4">
        <h2 id="digits" className="font-serif text-3xl font-bold">Meaning of Each Digit 0–9</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DIGITS.map((d) => (
            <Link key={d.d} href={`/angel-numbers/${d.d === 0 ? '000' : String(d.d).repeat(3)}`} className="mk-card rounded-xl border border-gold/25 bg-background/40 p-4">
              <p className="gold-text font-cinzel text-4xl font-bold">{d.d}</p><p className="font-semibold">{d.word}</p><p className="text-xs text-muted-foreground">{d.planet}</p>
              <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{d.core}</p>
            </Link>))}
        </div>
      </section>

      <AngelCta />

      <section id="all" aria-labelledby="alln" className="scroll-mt-24 space-y-4">
        <h2 id="alln" className="font-serif text-3xl font-bold">All Angel Numbers and Their Meanings</h2>
        <p className="text-muted-foreground">Every number below has its own detailed page: meaning, digits, spiritual meaning, love, twin flame, career, Hindi meaning and a date-of-birth compatibility check.</p>
        <AngelExplorer items={items} />
      </section>

      <section aria-labelledby="faq" className="space-y-3">
        <h2 id="faq" className="font-serif text-3xl font-bold">Angel Number FAQs</h2>
        {FAQS.map((f) => <details key={f.q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}
      </section>

      <AngelCta variant="big" />
      <AcharyaProfile />
    </div>
  );
}
