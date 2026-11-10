import Link from 'next/link';
import { BookOpen, Calculator, Clock, UserRound } from 'lucide-react';
import { jsonLd as toLd } from '@/lib/seo/site';
import { AcharyaProfile, BlogCta } from '@/components/blog/blog-parts';
import { Blocks } from '@/components/blog/blocks';
import { Bi, BiBlock } from '@/components/i18n/bi';
import { NUMBER_POSTS, NUMBER_POST_PUBLISHED, buildNumberPost, numberPostSlug, type NumKind, type NumberPost } from '@/lib/blog/numbers';

const T = {
  en: { home: 'Home', blog: 'Blog', kind: { mulank: 'Mulank', bhagyank: 'Bhagyank' }, guide: { mulank: 'Mulank guide · Root number', bhagyank: 'Bhagyank guide · Destiny number' },
    sub: { mulank: (n: number) => `Personality, career, marriage, health, money, lucky details and remedies for Mulank ${n}, explained by Acharya Nandram.`, bhagyank: (n: number) => `Life purpose, career, marriage, money, lucky details and remedies for Bhagyank ${n}, explained by Acharya Nandram.` },
    who: 'Acharya Nandram', whoSub: 'Numerologist · 15+ years experience', initials: 'AN', read: (m: number) => `${m} min read`, updated: (d: string) => `Updated ${d}`,
    onPage: 'On this page', expert: 'About Acharya Nandram', page: (k: string, n: number) => `${k} ${n} quick profile →`, calc: { mulank: 'Free Moolank calculator', bhagyank: 'Free Bhagyank calculator' }, calcSub: 'Instant result, no sign-up',
    free: 'Free numerology reading', freeSub: 'Moolank, Bhagyank, Lo Shu & more', start: 'Get My Reading',
    other: (k: string) => `Read the other ${k} guides`, cross: { mulank: 'Bhagyank (destiny number) guides', bhagyank: 'Mulank (root number) guides' },
    note: 'Numerology offers guidance based on traditional methods. It is not a substitute for professional medical, legal or financial advice.' },
  hi: { home: 'होम', blog: 'ब्लॉग', kind: { mulank: 'मूलांक', bhagyank: 'भाग्यांक' }, guide: { mulank: 'मूलांक मार्गदर्शिका · मूल अंक', bhagyank: 'भाग्यांक मार्गदर्शिका · भाग्य अंक' },
    sub: { mulank: (n: number) => `मूलांक ${n} का स्वभाव, करियर, विवाह, स्वास्थ्य, धन, शुभ विवरण और उपाय – आचार्य नंदराम द्वारा सरल भाषा में।`, bhagyank: (n: number) => `भाग्यांक ${n} का जीवन-उद्देश्य, करियर, विवाह, धन, शुभ विवरण और उपाय – आचार्य नंदराम द्वारा सरल भाषा में।` },
    who: 'आचार्य नंदराम', whoSub: 'अंक ज्योतिषी · 15+ वर्षों का अनुभव', initials: 'आ', read: (m: number) => `${m} मिनट का पाठ`, updated: (d: string) => `अद्यतन: ${d}`,
    onPage: 'इस पेज पर', expert: 'आचार्य नंदराम के बारे में', page: (k: string, n: number) => `${k} ${n} संक्षिप्त प्रोफ़ाइल →`, calc: { mulank: 'मुफ़्त मूलांक कैलकुलेटर', bhagyank: 'मुफ़्त भाग्यांक कैलकुलेटर' }, calcSub: 'तुरंत परिणाम, साइन-अप नहीं',
    free: 'मुफ़्त अंक ज्योतिष रीडिंग', freeSub: 'मूलांक, भाग्यांक, लो शू और बहुत कुछ', start: 'मेरी रीडिंग पाएँ',
    other: (k: string) => `अन्य ${k} मार्गदर्शिकाएँ पढ़ें`, cross: { mulank: 'भाग्यांक (भाग्य अंक) मार्गदर्शिकाएँ', bhagyank: 'मूलांक (मूल अंक) मार्गदर्शिकाएँ' },
    note: 'अंक ज्योतिष पारंपरिक विधियों पर आधारित मार्गदर्शन देता है। यह चिकित्सा, कानूनी या वित्तीय पेशेवर सलाह का विकल्प नहीं है।' },
};
const CALC_HREF: Record<NumKind, string> = { mulank: '/calculators/moolank-calculator', bhagyank: '/calculators/bhagyank-calculator' };

function SectionBody({ s, post, lang }: { s: NumberPost['sections'][number]; post: NumberPost; lang: 'en' | 'hi' }) {
  return (
    <>
      <h2 className="font-serif text-2xl font-bold sm:text-3xl">{s.title}</h2>
      <Blocks blocks={s.blocks} lang={/[ऀ-ॿ]/.test(s.title) ? 'hi' : 'en'} />
      {s.id === 'faq' && <div className="space-y-3">{post.faqs.map((f) => <details key={f.q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}</div>}
    </>
  );
}

export function NumberPostView({ kind, n }: { kind: NumKind; n: number }) {
  const p = buildNumberPost(kind, n, 'en');
  const ph = buildNumberPost(kind, n, 'hi');
  const K = { en: T.en.kind[kind], hi: T.hi.kind[kind] };
  const B = (f: (t: typeof T.en, l: 'en' | 'hi') => React.ReactNode) => <Bi en={f(T.en, 'en')} hi={f(T.hi, 'hi')} />;
  const date = { en: new Date(NUMBER_POST_PUBLISHED).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), hi: new Date(NUMBER_POST_PUBLISHED).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }) };
  const other = kind === 'mulank' ? 'bhagyank' : 'mulank';
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, datePublished: NUMBER_POST_PUBLISHED, dateModified: NUMBER_POST_PUBLISHED, inLanguage: ['en-IN', 'hi-IN'], wordCount: p.wordCount,
      author: { '@type': 'Person', name: 'Acharya Nandram', description: 'Numerologist with more than 15 years of experience in Vedic, Chaldean and Lo Shu numerology.' }, publisher: { '@type': 'Organization', name: 'myNumerologist.com' },
      mainEntityOfPage: `/blog/${p.slug}`, about: `${kind === 'mulank' ? 'Mulank (root number)' : 'Bhagyank (destiny number)'} ${n} in numerology`, keywords: p.keywords.join(', ') },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', item: '/' }, { name: 'Blog', item: '/blog' }, { name: `${K.en} ${n}`, item: `/blog/${p.slug}` }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) },
  ];
  const tocIds = [...p.sections.map((s) => s.id), 'expert'];
  const tocTitle = (l: 'en' | 'hi', id: string) => id === 'expert' ? T[l].expert : (l === 'hi' ? ph : p).sections.find((s) => s.id === id)?.title ?? id;
  const topic = { en: `${K.en} ${n}`, hi: `${K.hi} ${n}` };
  return (
    <article className="container max-w-6xl py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(jsonLd) }} />
      <nav aria-labelledby="bc-label" className="mb-4 text-xs text-muted-foreground"><span id="bc-label" className="sr-only"><Bi en="Breadcrumb" hi="पथ" /></span><Link href="/" className="hover:text-foreground">{B((t) => t.home)}</Link> / <Link href="/blog" className="hover:text-foreground">{B((t) => t.blog)}</Link> / {B((_, l) => `${K[l]} ${n}`)}</nav>

      <header className="mk-rise relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-maroon/40 via-card/80 to-card/90 p-6 sm:p-10">
        <span className="mk-spin pointer-events-none absolute -right-14 -top-14 h-64 w-64 rounded-full border border-dashed border-gold/40" />
        <span className="mk-spin-rev pointer-events-none absolute -right-6 -top-6 h-44 w-44 rounded-full border border-gold/25" />
        <span aria-hidden className="gold-text pointer-events-none absolute right-10 top-6 hidden font-cinzel text-[9rem] font-bold leading-none opacity-30 sm:block">{n}</span>
        <div className="relative max-w-3xl">
          <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-gold/20 px-3 py-1 font-semibold text-gold">{B((t) => t.guide[kind])}</span><span className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1"><Clock className="h-3 w-3" />{B((t) => t.read(p.readMinutes))}</span></div>
          <h1 className="font-cinzel mt-4 text-3xl font-bold leading-tight sm:text-5xl"><span className="gold-text">{B((_, l) => (l === 'hi' ? ph : p).h1)}</span></h1>
          <p className="mt-4 text-lg text-muted-foreground">{B((t) => t.sub[kind](n))}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm"><a href="#expert" className="inline-flex items-center gap-2 hover:text-gold"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-br from-[#2a0e1b] to-[#24130a] text-xs font-bold text-gold">{B((t) => t.initials)}</span><span><b>{B((t) => t.who)}</b><span className="block text-xs text-muted-foreground">{B((t) => t.whoSub)}</span></span></a>
            <span className="text-xs text-muted-foreground">{B((t, l) => t.updated(date[l]))}</span></div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 space-y-8">
          {p.sections.map((s, i) => (
            <div key={s.id} className="space-y-8">
              <section id={s.id} className="scroll-mt-24 space-y-4">
                <BiBlock className="space-y-4" en={<SectionBody s={s} post={p} lang="en" />} hi={<SectionBody s={ph.sections[i]} post={ph} lang="hi" />} />
              </section>
              {s.cta && <BlogCta topic={topic} />}
            </div>
          ))}
          <BlogCta topic={topic} variant="big" />
          <AcharyaProfile />
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold">{B((t, l) => t.other(K[l]))}</h2>
            <div className="flex flex-wrap gap-2">{NUMBER_POSTS.filter((x) => x.kind === kind && x.n !== n).map((x) => <Link key={x.slug} href={`/blog/${x.slug}`} className="rounded-full border border-gold/40 px-3 py-1.5 text-sm hover:bg-gold/10">{B((_, l) => `${K[l]} ${x.n}`)}</Link>)}</div>
            <h3 className="pt-2 font-serif text-lg font-semibold">{B((t) => t.cross[kind])}</h3>
            <div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => <Link key={x} href={`/blog/${numberPostSlug(other, x)}`} className="rounded-full border border-gold/25 px-3 py-1 text-sm hover:bg-gold/10">{B((t) => `${t.kind[other]} ${x}`)}</Link>)}</div>
          </section>
          <p className="text-xs text-muted-foreground">{B((t) => t.note)}</p>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <nav aria-labelledby="otp-label" className="glass rounded-xl border border-gold/25 p-4"><span id="otp-label" className="sr-only"><Bi en="On this page" hi="इस पेज पर" /></span><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold"><UserRound className="h-3 w-3" />{B((t) => t.onPage)}</p>
              <ul className="space-y-1.5 text-sm">{tocIds.map((id) => <li key={id}><a href={`#${id}`} className="text-muted-foreground hover:text-gold">{B((_, l) => tocTitle(l, id))}</a></li>)}</ul></nav>
            <Link href={CALC_HREF[kind]} className="mk-card block rounded-xl border border-gold/30 p-4"><p className="flex items-center gap-2 font-semibold"><Calculator className="h-4 w-4 text-gold" />{B((t) => t.calc[kind])}</p><p className="mt-1 text-xs text-muted-foreground">{B((t) => t.calcSub)}</p></Link>
            <Link href={`/${kind}/${n}`} className="flex items-center gap-2 px-1 text-sm text-gold hover:underline"><BookOpen className="h-4 w-4" />{B((t, l) => t.page(K[l], n))}</Link>
            <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/15 to-maroon/20 p-4 text-center"><p className="font-serif text-lg font-semibold">{B((t) => t.free)}</p><p className="mt-1 text-xs text-muted-foreground">{B((t) => t.freeSub)}</p><Link href="/reading" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] text-sm font-semibold text-[hsl(250_45%_10%)]">{B((t) => t.start)}</Link></div>
          </div>
        </aside>
      </div>
    </article>
  );
}
