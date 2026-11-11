import type { Metadata } from 'next';
import Link from 'next/link';
import { MULANK, mulankFor } from '@/lib/mulank-data';
import { ForLang } from '@/components/i18n/bi';
import { mulankServices } from '@/lib/mulank-services';

export const metadata: Metadata = {
  title: { absolute: 'Mulank 1 to 9: Meaning, Planet, Lucky Colour & Remedies' },
  description: 'Find your Mulank (root number) from your day of birth. Read the personality, career, relationships, lucky colours and remedies for Mulank 1 to 9.',
  alternates: { canonical: '/mulank' },
};

const L = {
  en: { eyebrow: 'Root number · मूलांक', h1: 'Discover your Mulank', p: 'Your Mulank is your day of birth reduced to a single digit. It shows your core nature, ruling planet and the energy others feel first. Pick your number to explore.',
    root: 'Mulank', born: 'Born on:', lucky: 'Lucky:', explore: (n: number) => `Explore Mulank ${n} →`, offer: 'What we offer' },
  hi: { eyebrow: 'मूल अंक · मूलांक', h1: 'अपना मूलांक जानें', p: 'मूलांक आपकी जन्म तारीख़ (दिन) को एक अंक तक जोड़कर निकलता है। यह आपका मूल स्वभाव, स्वामी ग्रह और वह ऊर्जा दिखाता है जो लोग आपसे सबसे पहले महसूस करते हैं। जानने के लिए अपना अंक चुनें।',
    root: 'मूलांक', born: 'जन्म तिथि:', lucky: 'शुभ रंग:', explore: (n: number) => `मूलांक ${n} देखें →`, offer: 'हमारी सेवाएँ' },
};

export default function MulankIndex() {
  return <ForLang>{(l) => <MulankIndexView lang={l} />}</ForLang>;
}

function MulankIndexView({ lang }: { lang: 'en' | 'hi' }) {
  const t = L[lang];
  return (
    <div className="container max-w-6xl space-y-12 py-10 sm:py-14">
      <header className="mk-rise space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">{t.eyebrow}</p>
        <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text">{t.h1}</span></h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{t.p}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MULANK.map((x, i) => { const m = mulankFor(x.n, lang)!; return (
          <Link key={m.n} href={`/mulank/${m.n}`} style={{ animationDelay: `${i * 70}ms` }} className="mk-rise mk-card glass group relative overflow-hidden rounded-xl border border-gold/25 p-5">
            <span className="mk-spin pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-dashed border-gold/40" />
            <div className="flex items-center gap-4">
              <span className="mk-pulse flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a] font-cinzel text-3xl font-bold gold-text">{m.n}</span>
              <div><h2 className="font-cinzel text-lg font-bold">{t.root} {m.n} · {m.title}</h2><p className="text-xs text-gold">{m.planet}</p></div>
            </div>
            <p className="mt-3 text-sm italic text-muted-foreground">{m.tagline}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t.born} {m.famousDates.replace('Born on ', '').replace('जन्म तिथि ', '')} · {t.lucky} {m.luckyColors.slice(0, 2).join(', ')}</p>
            <span className="mt-3 inline-block text-sm text-gold group-hover:underline">{t.explore(m.n)}</span>
          </Link>
        ); })}
      </div>
      <section className="glass rounded-xl border border-gold/25 p-6">
        <h2 className="mb-4 font-cinzel text-2xl font-bold gold-text">{t.offer}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mulankServices(0, lang).map((s) => (
            <Link key={s.title} href={s.href} className="mk-card rounded-lg border border-gold/20 p-4"><span className="text-xl text-gold">{s.icon}</span><h3 className="mt-1 font-semibold">{s.title}</h3><p className="mt-1 text-sm text-muted-foreground">{s.desc}</p></Link>
          ))}
        </div>
      </section>
    </div>
  );
}
