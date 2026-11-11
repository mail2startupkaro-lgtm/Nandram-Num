import type { Metadata } from 'next';
import { clipDescription, jsonLd as toLd } from '@/lib/seo/site';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Sparkles, TrendingUp } from 'lucide-react';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { AngelCta, AngelOrb, GOLD_BTN } from '@/components/angel/angel-parts';
import { AngelCalculator } from '@/components/angel/angel-calculator';
import { buildAngel, isAngelNumber, TOP_ANGEL, type AngelPage, type Block } from '@/lib/angel/generate';
import { DIGITS } from '@/lib/angel/digits';
import { DIGITS_HI } from '@/lib/angel/digits-hi';
import { buildAngelHi } from '@/lib/angel/generate-hi';
import { Bi, BiBlock } from '@/components/i18n/bi';

/** The 300 most-searched numbers are pre-built; any other 1–5 digit number is rendered on first visit and cached. */
export const dynamicParams = true;
export function generateStaticParams() { return TOP_ANGEL.slice(0, 300).map((n) => ({ n })); }

const UPDATED = '2026-11-09';

export async function generateMetadata(props: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isAngelNumber(params.n)) return {};
  const p = buildAngel(params.n);
  return {
    title: { absolute: p.title }, description: clipDescription(p.description), keywords: p.keywords, authors: [{ name: 'Acharya Nandram' }],
    alternates: { canonical: `/angel-numbers/${p.n}` },
    robots: p.indexed ? undefined : { index: false, follow: true },
    openGraph: { title: p.title, description: p.description, url: `/angel-numbers/${p.n}`, siteName: 'myNumerologist.com', locale: 'en_IN', type: 'article', authors: ['Acharya Nandram'] },
    twitter: { card: 'summary_large_image', title: p.title, description: p.description },
  };
}

function Blocks({ blocks, lang = 'en' }: { blocks: Block[]; lang?: 'en' | 'hi' }) {
  const D = lang === 'hi' ? DIGITS_HI : DIGITS;
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
                <div><p className="font-serif text-lg font-semibold">{x.word}</p><p className="text-xs text-muted-foreground">{D[x.d].planet} · {lang === 'hi' ? `${x.count} बार` : `appears ${x.count}×`}</p></div></div>
              <p className="mt-2 text-sm text-muted-foreground">{x.text}</p>
              <div className="mt-2 flex flex-wrap gap-1">{D[x.d].keywords.map((k) => <span key={k} className="rounded bg-gold/10 px-2 py-0.5 text-[11px]">{k}</span>)}</div>
            </div>))}</div>;
          case 'facts': return <dl key={i} className="grid gap-px overflow-hidden rounded-xl border border-gold/25 bg-gold/20 sm:grid-cols-2">{b.items.map(([k, v]) => <div key={k} className="bg-card/95 p-3"><dt className="text-[10px] uppercase tracking-widest text-gold">{k}</dt><dd className="mt-0.5 text-sm">{v}</dd></div>)}</dl>;
        }
      })}
    </>
  );
}

const T = {
  en: { home: 'Home', angel: 'Angel Numbers', most: (r: number) => `#${r} most searched angel number`, root: (r: number, m: number | null) => `Root number ${r}${m ? ` · master ${m}` : ''}`,
    clock: (c: string) => `Also seen as ${c}`, quick: 'Quick answer', who: 'Acharya Nandram', whoSub: 'Numerologist · 15+ years experience', initials: 'AN', check: (n: string) => `Check ${n} with my DOB`,
    calcH: (n: string) => `Is ${n} Compatible With Your Date of Birth?`, calcP: (n: string) => `Enter your date of birth to see how strongly ${n} aligns with your Mulank and Bhagyank, find your own angel numbers, or check a couple's angel number.`,
    related: 'Related Angel Numbers', relItem: (r: string) => `${r} angel number`, all: 'All angel numbers →',
    note: 'Angel numbers are a spiritual and symbolic tradition. This guidance is for reflection and is not a substitute for professional medical, legal or financial advice.',
    onPage: 'On this page', side: (n: string) => `What does ${n} mean for you?`, sideP: 'Personal reading by Acharya Nandram', get: 'Get My Reading',
    toc: { meaning: 'Meaning', facts: 'At a glance', digits: 'Digit-by-digit meaning', spiritual: 'Spiritual meaning', love: 'Love & relationships', 'twin-flame': 'Twin flame', career: 'Career, money & manifestation', numerology: 'Numerology & root number', seeing: 'Why you keep seeing it', hindi: 'Meaning in Hindi', faq: 'FAQs', calculator: 'DOB Compatibility Check', expert: 'About Acharya Nandram' } as Record<string, string> },
  hi: { home: 'होम', angel: 'एंजेल नंबर', most: (r: number) => `सबसे अधिक खोजे जाने वाले एंजेल नंबरों में #${r}`, root: (r: number, m: number | null) => `मूल अंक ${r}${m ? ` · मास्टर ${m}` : ''}`,
    clock: (c: string) => `घड़ी पर ${c} के रूप में भी`, quick: 'संक्षिप्त उत्तर', who: 'आचार्य नंदराम', whoSub: 'अंक ज्योतिषी · 15+ वर्षों का अनुभव', initials: 'आ', check: (n: string) => `${n} को मेरी जन्म तिथि से जाँचें`,
    calcH: (n: string) => `क्या ${n} आपकी जन्म तिथि से मेल खाता है?`, calcP: (n: string) => `अपनी जन्म तिथि दर्ज करें और देखें कि ${n} आपके मूलांक और भाग्यांक से कितना मेल खाता है, अपने एंजेल नंबर जानें, या किसी जोड़ी का एंजेल नंबर निकालें।`,
    related: 'संबंधित एंजेल नंबर', relItem: (r: string) => `${r} एंजेल नंबर`, all: 'सभी एंजेल नंबर →',
    note: 'एंजेल नंबर एक आध्यात्मिक और प्रतीकात्मक परंपरा है। यह मार्गदर्शन चिंतन के लिए है और चिकित्सा, कानूनी या वित्तीय पेशेवर सलाह का विकल्प नहीं है।',
    onPage: 'इस पेज पर', side: (n: string) => `${n} का आपके लिए क्या अर्थ है?`, sideP: 'आचार्य नंदराम द्वारा व्यक्तिगत रीडिंग', get: 'मेरी रीडिंग पाएँ',
    toc: { meaning: 'अर्थ', facts: 'एक नज़र में', digits: 'अंक-दर-अंक अर्थ', spiritual: 'आध्यात्मिक अर्थ', love: 'प्रेम और रिश्ते', 'twin-flame': 'ट्विन फ्लेम', career: 'करियर, धन और मैनिफेस्टेशन', numerology: 'अंक ज्योतिष और मूल अंक', seeing: 'यह बार-बार क्यों दिखता है', hindi: 'सरल शब्दों में', faq: 'प्रश्नोत्तर', calculator: 'जन्म तिथि से अनुकूलता जाँच', expert: 'आचार्य नंदराम के बारे में' } as Record<string, string> },
};

export default async function AngelNumberPage(props: { params: Promise<{ n: string }> }) {
  const params = await props.params;
  if (!isAngelNumber(params.n)) notFound();
  const p = buildAngel(params.n);
  const ph = buildAngelHi(params.n, p);
  const P = { en: p, hi: ph };
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, dateModified: UPDATED, inLanguage: ['en-IN', 'hi-IN'],
      author: { '@type': 'Person', name: 'Acharya Nandram', description: 'Numerologist with more than 15 years of experience in Vedic, Chaldean and Lo Shu numerology.' },
      publisher: { '@type': 'Organization', name: 'myNumerologist.com' }, mainEntityOfPage: `/angel-numbers/${p.n}`, keywords: p.keywords.join(', ') },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', '/'], ['Angel Numbers', '/angel-numbers'], [`${p.n} Angel Number`, `/angel-numbers/${p.n}`]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
  ];
  const tocIds = [...p.sections.map((s) => s.id), 'calculator', 'expert'];
  const B = (f: (t: typeof T.en, l: 'en' | 'hi') => React.ReactNode) => <Bi en={f(T.en, 'en')} hi={f(T.hi, 'hi')} />;
  return (
    <article className="container max-w-6xl py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(jsonLd) }} />
      <nav aria-labelledby="bc-label" className="mb-4 text-xs text-muted-foreground"><span id="bc-label" className="sr-only"><Bi en="Breadcrumb" hi="पथ" /></span><Link href="/" className="hover:text-foreground">{B((t) => t.home)}</Link> / <Link href="/angel-numbers" className="hover:text-foreground">{B((t) => t.angel)}</Link> / {p.n}</nav>

      <header className="mk-rise relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-maroon/40 via-card/80 to-card/90 p-6 sm:p-10">
        <span className="mk-spin pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full border border-dashed border-gold/25" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap gap-2 text-xs">
              {p.rank && p.rank <= 50 && <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-3 py-1 font-semibold text-gold"><TrendingUp className="h-3 w-3" />{B((t) => t.most(p.rank!))}</span>}
              <span className="rounded-full border border-gold/40 px-3 py-1">{B((t) => t.root(p.root, p.master))}</span>
              {p.clock && <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1"><Clock className="h-3 w-3" />{B((t) => t.clock(p.clock!))}</span>}
            </div>
            <h1 className="font-cinzel mt-4 text-3xl font-bold leading-tight sm:text-5xl"><span className="gold-text">{B((_, l) => P[l].h1)}</span><span className="mt-1 block text-xl font-normal text-muted-foreground sm:text-2xl">{B((_, l) => P[l].theme)}</span></h1>
            <div className="mt-5 rounded-xl border border-gold/30 bg-background/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">{B((t) => t.quick)}</p>
              <p className="mt-1 leading-relaxed">{B((_, l) => P[l].summary)}</p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
              <a href="#expert" className="inline-flex items-center gap-2 hover:text-gold"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-br from-[#2a0e1b] to-[#24130a] text-xs font-bold text-gold">{B((t) => t.initials)}</span><span><b>{B((t) => t.who)}</b><span className="block text-xs text-muted-foreground">{B((t) => t.whoSub)}</span></span></a>
              <a href="#calculator" className={`${GOLD_BTN} h-10 px-4 text-sm`}><Sparkles className="h-4 w-4" />{B((t) => t.check(p.n))}</a>
            </div>
          </div>
          <div className="mx-auto hidden sm:block"><AngelOrb n={p.n} /></div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 space-y-8">
          {p.sections.map((s, idx) => (
            <div key={s.id} className="space-y-8">
              <section id={s.id} className="scroll-mt-24 space-y-4">
                <BiBlock className="space-y-4" en={<SectionBody s={s} page={p} lang="en" />} hi={<SectionBody s={ph.sections[idx]} page={ph} lang="hi" />} />
              </section>
              {s.id === 'digits' && <AngelCta n={p.n} />}
              {s.id === 'numerology' && (
                <section id="calculator" className="scroll-mt-24 space-y-3">
                  <h2 className="font-serif text-2xl font-bold sm:text-3xl">{B((t) => t.calcH(p.n))}</h2>
                  <p className="text-muted-foreground">{B((t) => t.calcP(p.n))}</p>
                  <AngelCalculator initialTab="match" initialNumber={p.n} />
                </section>
              )}
            </div>
          ))}
          <AngelCta n={p.n} variant="big" />
          <AcharyaProfile />
          <section className="space-y-3"><h2 className="font-serif text-2xl font-bold">{B((t) => t.related)}</h2>
            <div className="flex flex-wrap gap-2">{p.related.map((r) => <Link key={r} href={`/angel-numbers/${r}`} className="rounded-full border border-gold/40 px-4 py-1.5 font-cinzel text-sm font-semibold hover:bg-gold/10">{B((t) => t.relItem(r))}</Link>)}<Link href="/angel-numbers" className="rounded-full px-3 py-1.5 text-sm text-gold hover:underline">{B((t) => t.all)}</Link></div></section>
          <p className="text-xs text-muted-foreground">{B((t) => t.note)}</p>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <nav aria-labelledby="otp-label" className="glass rounded-xl border border-gold/25 p-4"><span id="otp-label" className="sr-only"><Bi en="On this page" hi="इस पेज पर" /></span><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">{B((t) => t.onPage)}</p>
              <ul className="space-y-1.5 text-sm">{tocIds.map((id) => <li key={id}><a href={`#${id}`} className="text-muted-foreground hover:text-gold">{B((t) => t.toc[id] ?? id)}</a></li>)}</ul></nav>
            <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/15 to-maroon/20 p-4 text-center"><div className="flex justify-center"><AngelOrb n={p.n} size="sm" /></div><p className="mt-2 font-serif text-lg font-semibold">{B((t) => t.side(p.n))}</p><p className="mt-1 text-xs text-muted-foreground">{B((t) => t.sideP)}</p><Link href="/reading" className={`${GOLD_BTN} mt-3 h-10 w-full text-sm`}>{B((t) => t.get)}</Link></div>
          </div>
        </aside>
      </div>
    </article>
  );
}

function SectionBody({ s, page, lang }: { s: AngelPage['sections'][number]; page: AngelPage; lang: 'en' | 'hi' }) {
  return (
    <>
      <h2 className="font-serif text-2xl font-bold sm:text-3xl">{s.title}</h2>
      {s.id === 'hindi' ? <p lang="hi" className="leading-relaxed text-muted-foreground">{page.hindi}</p> : <Blocks blocks={s.blocks} lang={lang} />}
      {s.id === 'faq' && <div className="space-y-3">{page.faqs.map((f) => <details key={f.q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}</div>}
    </>
  );
}
