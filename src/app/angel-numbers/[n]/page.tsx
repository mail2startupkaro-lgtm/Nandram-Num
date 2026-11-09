import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Sparkles, TrendingUp } from 'lucide-react';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { AngelCta, AngelOrb, GOLD_BTN } from '@/components/angel/angel-parts';
import { AngelCalculator } from '@/components/angel/angel-calculator';
import { buildAngel, isAngelNumber, TOP_ANGEL, type Block } from '@/lib/angel/generate';
import { DIGITS } from '@/lib/angel/digits';

/** The 300 most-searched numbers are pre-built; any other 1–5 digit number is rendered on first visit and cached. */
export const dynamicParams = true;
export function generateStaticParams() { return TOP_ANGEL.slice(0, 300).map((n) => ({ n })); }

const UPDATED = '2026-11-09';

export function generateMetadata({ params }: { params: { n: string } }): Metadata {
  if (!isAngelNumber(params.n)) return {};
  const p = buildAngel(params.n);
  return {
    title: p.title, description: p.description, keywords: p.keywords, authors: [{ name: 'Acharya Nandram' }],
    alternates: { canonical: `/angel-numbers/${p.n}` },
    robots: p.indexed ? undefined : { index: false, follow: true },
    openGraph: { title: p.title, description: p.description, type: 'article', authors: ['Acharya Nandram'] },
    twitter: { card: 'summary_large_image', title: p.title, description: p.description },
  };
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'p': return <p key={i} className="leading-relaxed text-muted-foreground">{b.text}</p>;
          case 'list': return <ul key={i} className="space-y-2">{b.items.map((x) => <li key={x} className="flex gap-2 text-muted-foreground"><span className="mt-1 text-gold">✦</span><span>{x}</span></li>)}</ul>;
          case 'steps': return <ol key={i} className="grid gap-3 sm:grid-cols-2">{b.items.map((x, n) => <li key={x.title} className="rounded-lg border border-gold/20 bg-background/40 p-4"><span className="gold-text font-serif text-3xl font-bold">{n + 1}</span><p className="font-semibold">{x.title}</p><p className="text-sm text-muted-foreground">{x.text}</p></li>)}</ol>;
          case 'digits': return <div key={i} className="grid gap-3 sm:grid-cols-2">{b.items.map((x) => (
            <div key={x.d} className="mk-card rounded-xl border border-gold/25 bg-background/40 p-4">
              <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-br from-[#2a0e1b] to-[#24130a] font-cinzel text-2xl font-bold text-gold">{x.d}</span>
                <div><p className="font-serif text-lg font-semibold">{x.word}</p><p className="text-xs text-muted-foreground">{DIGITS[x.d].planet} · appears {x.count}×</p></div></div>
              <p className="mt-2 text-sm text-muted-foreground">{x.text}</p>
              <div className="mt-2 flex flex-wrap gap-1">{DIGITS[x.d].keywords.map((k) => <span key={k} className="rounded bg-gold/10 px-2 py-0.5 text-[11px]">{k}</span>)}</div>
            </div>))}</div>;
          case 'facts': return <dl key={i} className="grid gap-px overflow-hidden rounded-xl border border-gold/25 bg-gold/20 sm:grid-cols-2">{b.items.map(([k, v]) => <div key={k} className="bg-card/95 p-3"><dt className="text-[10px] uppercase tracking-widest text-gold">{k}</dt><dd className="mt-0.5 text-sm">{v}</dd></div>)}</dl>;
        }
      })}
    </>
  );
}

export default function AngelNumberPage({ params }: { params: { n: string } }) {
  if (!isAngelNumber(params.n)) notFound();
  const p = buildAngel(params.n);
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, dateModified: UPDATED, inLanguage: 'en-IN',
      author: { '@type': 'Person', name: 'Acharya Nandram', description: 'Numerologist with more than 15 years of experience in Vedic, Chaldean and Lo Shu numerology.' },
      publisher: { '@type': 'Organization', name: 'myNumerologist.com' }, mainEntityOfPage: `/angel-numbers/${p.n}`, keywords: p.keywords.join(', ') },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', '/'], ['Angel Numbers', '/angel-numbers'], [`${p.n} Angel Number`, `/angel-numbers/${p.n}`]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
  ];
  const LABEL: Record<string, string> = { meaning: 'Meaning', facts: 'At a glance', digits: 'Digit-by-digit meaning', spiritual: 'Spiritual meaning', love: 'Love & relationships', 'twin-flame': 'Twin flame', career: 'Career, money & manifestation', numerology: 'Numerology & root number', seeing: 'Why you keep seeing it', hindi: 'Meaning in Hindi', faq: 'FAQs' };
  const toc = [...p.sections.map((s) => ({ id: s.id, title: LABEL[s.id] ?? s.title })), { id: 'calculator', title: 'DOB Compatibility Check' }, { id: 'expert', title: 'About Acharya Nandram' }];
  const rows = p.sections;
  return (
    <article className="container max-w-6xl py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link> / <Link href="/angel-numbers" className="hover:text-foreground">Angel Numbers</Link> / {p.n}</nav>

      <header className="mk-rise relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-maroon/40 via-card/80 to-card/90 p-6 sm:p-10">
        <span className="mk-spin pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full border border-dashed border-gold/25" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap gap-2 text-xs">
              {p.rank && p.rank <= 50 && <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-3 py-1 font-semibold text-gold"><TrendingUp className="h-3 w-3" />#{p.rank} most searched angel number</span>}
              <span className="rounded-full border border-gold/40 px-3 py-1">Root number {p.root}{p.master ? ` · master ${p.master}` : ''}</span>
              {p.clock && <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1"><Clock className="h-3 w-3" />Also seen as {p.clock}</span>}
            </div>
            <h1 className="font-cinzel mt-4 text-3xl font-bold leading-tight sm:text-5xl"><span className="gold-text">{p.h1}</span><span className="mt-1 block text-xl font-normal text-muted-foreground sm:text-2xl">{p.theme}</span></h1>
            <div className="mt-5 rounded-xl border border-gold/30 bg-background/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Quick answer</p>
              <p className="mt-1 leading-relaxed">{p.summary}</p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
              <a href="#expert" className="inline-flex items-center gap-2 hover:text-gold"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-br from-[#2a0e1b] to-[#24130a] text-xs font-bold text-gold">AN</span><span><b>Acharya Nandram</b><span className="block text-xs text-muted-foreground">Numerologist · 15+ years experience</span></span></a>
              <a href="#calculator" className={`${GOLD_BTN} h-10 px-4 text-sm`}><Sparkles className="h-4 w-4" />Check {p.n} with my DOB</a>
            </div>
          </div>
          <div className="mx-auto hidden sm:block"><AngelOrb n={p.n} /></div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 space-y-8">
          {rows.map((s) => (
            <div key={s.id} className="space-y-8">
              <section id={s.id} className="scroll-mt-24 space-y-4">
                <h2 className="font-serif text-2xl font-bold sm:text-3xl">{s.title}</h2>
                {s.id === 'hindi' ? <p lang="hi" className="leading-relaxed text-muted-foreground">{p.hindi}</p> : <Blocks blocks={s.blocks} />}
                {s.id === 'faq' && <div className="space-y-3">{p.faqs.map((f) => <details key={f.q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}</div>}
              </section>
              {s.id === 'digits' && <AngelCta n={p.n} />}
              {s.id === 'numerology' && (
                <section id="calculator" className="scroll-mt-24 space-y-3">
                  <h2 className="font-serif text-2xl font-bold sm:text-3xl">Is {p.n} Compatible With Your Date of Birth?</h2>
                  <p className="text-muted-foreground">Enter your date of birth to see how strongly {p.n} aligns with your Mulank and Bhagyank, find your own angel numbers, or check a couple&apos;s angel number.</p>
                  <AngelCalculator initialTab="match" initialNumber={p.n} />
                </section>
              )}
            </div>
          ))}
          <AngelCta n={p.n} variant="big" />
          <AcharyaProfile />
          <section className="space-y-3"><h2 className="font-serif text-2xl font-bold">Related Angel Numbers</h2>
            <div className="flex flex-wrap gap-2">{p.related.map((r) => <Link key={r} href={`/angel-numbers/${r}`} className="rounded-full border border-gold/40 px-4 py-1.5 font-cinzel text-sm font-semibold hover:bg-gold/10">{r} angel number</Link>)}<Link href="/angel-numbers" className="rounded-full px-3 py-1.5 text-sm text-gold hover:underline">All angel numbers →</Link></div></section>
          <p className="text-xs text-muted-foreground">Angel numbers are a spiritual and symbolic tradition. This guidance is for reflection and is not a substitute for professional medical, legal or financial advice.</p>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <nav aria-label="On this page" className="glass rounded-xl border border-gold/25 p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">On this page</p>
              <ul className="space-y-1.5 text-sm">{toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-muted-foreground hover:text-gold">{t.title}</a></li>)}</ul></nav>
            <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/15 to-maroon/20 p-4 text-center"><div className="flex justify-center"><AngelOrb n={p.n} size="sm" /></div><p className="mt-2 font-serif text-lg font-semibold">What does {p.n} mean for you?</p><p className="mt-1 text-xs text-muted-foreground">Personal reading by Acharya Nandram</p><Link href="/reading" className={`${GOLD_BTN} mt-3 h-10 w-full text-sm`}>Get My Reading</Link></div>
          </div>
        </aside>
      </div>
    </article>
  );
}
