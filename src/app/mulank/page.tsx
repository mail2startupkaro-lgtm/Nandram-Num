import type { Metadata } from 'next';
import Link from 'next/link';
import { MULANK } from '@/lib/mulank-data';
import { mulankServices } from '@/lib/mulank-services';

export const metadata: Metadata = {
  title: 'Mulank 1 to 9 – Root Number Meaning, Planet, Lucky Colour & Remedies',
  description: 'Find your Mulank (root number) from your day of birth. Read the personality, career, relationships, lucky colours and remedies for Mulank 1 to 9.',
  alternates: { canonical: '/mulank' },
};

export default function MulankIndex() {
  return (
    <div className="container max-w-6xl space-y-12 py-10 sm:py-14">
      <header className="mk-rise space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Root number · मूलांक</p>
        <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text">Discover your Mulank</span></h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">Your Mulank is your day of birth reduced to a single digit. It shows your core nature, ruling planet and the energy others feel first. Pick your number to explore.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MULANK.map((m, i) => (
          <Link key={m.n} href={`/mulank/${m.n}`} style={{ animationDelay: `${i * 70}ms` }} className="mk-rise mk-card glass group relative overflow-hidden rounded-xl border border-gold/25 p-5">
            <span className="mk-spin pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-dashed border-gold/40" />
            <div className="flex items-center gap-4">
              <span className="mk-pulse flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a] font-cinzel text-3xl font-bold gold-text">{m.n}</span>
              <div><h2 className="font-cinzel text-lg font-bold">Mulank {m.n} · {m.title}</h2><p className="text-xs text-gold">{m.planet}</p></div>
            </div>
            <p className="mt-3 text-sm italic text-muted-foreground">{m.tagline}</p>
            <p className="mt-2 text-xs text-muted-foreground">Born on: {m.famousDates.replace('Born on ', '')} · Lucky: {m.luckyColors.slice(0, 2).join(', ')}</p>
            <span className="mt-3 inline-block text-sm text-gold group-hover:underline">Explore Mulank {m.n} →</span>
          </Link>
        ))}
      </div>
      <section className="glass rounded-xl border border-gold/25 p-6">
        <h2 className="mb-4 font-cinzel text-2xl font-bold gold-text">What we offer</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mulankServices(0).map((s) => (
            <Link key={s.title} href={s.href} className="mk-card rounded-lg border border-gold/20 p-4"><span className="text-xl text-gold">{s.icon}</span><h3 className="mt-1 font-semibold">{s.title.replace('Mulank 0 ', 'Mulank ')}</h3><p className="mt-1 text-sm text-muted-foreground">{s.desc.replace('Mulank 0', 'your Mulank')}</p></Link>
          ))}
        </div>
      </section>
    </div>
  );
}
