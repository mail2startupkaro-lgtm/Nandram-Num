import Image from 'next/image';
import Link from 'next/link';
import { Calculator, Clock, Sparkles, UserRound } from 'lucide-react';
import { SITE_URL, jsonLd as toLd } from '@/lib/seo/site';
import { AcharyaProfile, BlogCta } from '@/components/blog/blog-parts';
import { Blocks } from '@/components/blog/blocks';
import { PostArt } from '@/components/blog/post-art';
import { Bi, BiBlock } from '@/components/i18n/bi';
import { TOPIC_CATS, TOPIC_POSTS, TOPIC_PUBLISHED, buildTopic, type TopicPost } from '@/lib/blog/topics';

const T = {
  en: { home: 'Home', blog: 'Blog', who: 'Acharya Nandram', whoSub: 'Numerologist · 15+ years experience', read: (m: number) => `${m} min read`, updated: (d: string) => `Updated ${d}`,
    onPage: 'On this page', expert: 'About Acharya Nandram', free: 'Free numerology reading', freeSub: 'Moolank, Bhagyank, Lo Shu & more', start: 'Get My Reading', service: 'Expert service', calcSub: 'Instant result, no sign-up',
    related: 'Related articles', more: 'Explore more guides', note: 'Numerology offers guidance based on traditional methods. It is not a substitute for professional medical, legal or financial advice.' },
  hi: { home: 'होम', blog: 'ब्लॉग', who: 'आचार्य नंदराम', whoSub: 'अंक ज्योतिषी · 15+ वर्षों का अनुभव', read: (m: number) => `${m} मिनट का पाठ`, updated: (d: string) => `अद्यतन: ${d}`,
    onPage: 'इस पेज पर', expert: 'आचार्य नंदराम के बारे में', free: 'मुफ़्त अंक ज्योतिष रीडिंग', freeSub: 'मूलांक, भाग्यांक, लो शू और बहुत कुछ', start: 'मेरी रीडिंग पाएँ', service: 'विशेषज्ञ सेवा', calcSub: 'तुरंत परिणाम, साइन-अप नहीं',
    related: 'संबंधित लेख', more: 'और मार्गदर्शिकाएँ देखें', note: 'अंक ज्योतिष पारंपरिक विधियों पर आधारित मार्गदर्शन देता है। यह चिकित्सा, कानूनी या वित्तीय पेशेवर सलाह का विकल्प नहीं है।' },
};

function SectionBody({ s, post, lang }: { s: TopicPost['sections'][number]; post: TopicPost; lang: 'en' | 'hi' }) {
  return (
    <>
      <h2 className="font-serif text-2xl font-bold sm:text-3xl">{s.title}</h2>
      <Blocks blocks={s.blocks} lang={lang} />
      {s.id === 'faq' && <div className="space-y-3">{post.faqs.map((f) => <details key={f.q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}</div>}
    </>
  );
}

/** Up to 8 neighbours in the same category, then the profile and one entry from each other category. */
function relatedSlugs(slug: string, cat: string) {
  const same = TOPIC_POSTS.filter((t) => t.cat === cat);
  const i = same.findIndex((t) => t.slug === slug);
  const near = Array.from({ length: Math.min(8, same.length - 1) }, (_, k) => same[(i + k + 1) % same.length].slug);
  const others = TOPIC_CATS.filter((c) => c.id !== cat).map((c) => TOPIC_POSTS.find((t) => t.cat === c.id)!.slug);
  return { near, others: [...new Set(['acharya-nandram-numerologist-profile', ...others])].filter((s) => s !== slug) };
}

export function TopicPostView({ slug }: { slug: string }) {
  const p = buildTopic(slug, 'en')!, ph = buildTopic(slug, 'hi')!;
  const B = (f: (t: typeof T.en, l: 'en' | 'hi') => React.ReactNode) => <Bi en={f(T.en, 'en')} hi={f(T.hi, 'hi')} />;
  const P = (l: 'en' | 'hi') => (l === 'hi' ? ph : p);
  const date = { en: new Date(TOPIC_PUBLISHED).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), hi: new Date(TOPIC_PUBLISHED).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }) };
  const cat = TOPIC_CATS.find((c) => c.id === p.cat)!;
  const url = `${SITE_URL}/blog/${p.slug}`;
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, image: [`${url}/opengraph-image`], datePublished: TOPIC_PUBLISHED, dateModified: TOPIC_PUBLISHED, inLanguage: ['en-IN', 'hi-IN'], wordCount: p.wordCount,
      author: { '@type': 'Person', '@id': `${SITE_URL}/#expert`, name: 'Acharya Nandram', url: `${SITE_URL}/about`, image: `${SITE_URL}/images/acharya-nandram-512.png`, description: 'Numerologist with more than 15 years of experience in Vedic, Chaldean and Lo Shu numerology.' },
      publisher: { '@type': 'Organization', name: 'myNumerologist.com' }, mainEntityOfPage: url, keywords: p.keywords.join(', ') },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', item: `${SITE_URL}/` }, { name: 'Blog', item: `${SITE_URL}/blog` }, { name: cat.en, item: `${SITE_URL}/blog#${cat.id}` }, { name: p.h1, item: url }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) },
  ];
  const tocIds = [...p.sections.map((s) => s.id), 'expert'];
  const tocTitle = (l: 'en' | 'hi', id: string) => id === 'expert' ? T[l].expert : P(l).sections.find((s) => s.id === id)?.title ?? id;
  const topic = { en: p.h1.split(':')[0], hi: ph.h1.split(':')[0] };
  const rel = relatedSlugs(p.slug, p.cat);
  const relLink = (s: string, strong = false) => <Link key={s} href={`/blog/${s}`} className={`rounded-full border px-3 py-1.5 text-sm hover:bg-gold/10 ${strong ? 'border-gold/40' : 'border-gold/25'}`}><Bi en={buildTopic(s, 'en')!.h1.split(':')[0]} hi={buildTopic(s, 'hi')!.h1.split(':')[0]} /></Link>;
  let ctaCount = 0;
  return (
    <article className="container max-w-6xl py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(jsonLd) }} />
      <nav aria-labelledby="bc-label" className="mb-4 text-xs text-muted-foreground"><span id="bc-label" className="sr-only"><Bi en="Breadcrumb" hi="पथ" /></span><Link href="/" className="hover:text-foreground">{B((t) => t.home)}</Link> / <Link href="/blog" className="hover:text-foreground">{B((t) => t.blog)}</Link> / <Link href={`/blog#${cat.id}`} className="hover:text-foreground"><Bi en={cat.en} hi={cat.hi} /></Link></nav>

      <header className="mk-rise relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-maroon/40 via-card/80 to-card/90 p-6 sm:p-10">
        <span className="mk-spin pointer-events-none absolute -right-14 -top-14 h-64 w-64 rounded-full border border-dashed border-gold/40" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-gold/20 px-3 py-1 font-semibold text-gold">{B((_, l) => P(l).kicker)}</span><span className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1"><Clock className="h-3 w-3" />{B((t, l) => t.read(P(l).readMinutes))}</span></div>
            <h1 className="font-cinzel mt-4 text-3xl font-bold leading-tight sm:text-4xl"><span className="gold-text">{B((_, l) => P(l).h1)}</span></h1>
            <p className="mt-4 text-lg text-muted-foreground">{B((_, l) => P(l).sub)}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
              <a href="#expert" className="inline-flex items-center gap-2 hover:text-gold"><Image src="/images/acharya-nandram-512.png" alt="Acharya Nandram" width={40} height={40} className="h-10 w-10 rounded-full border border-gold/50 object-cover object-top" /><span><b>{B((t) => t.who)}</b><span className="block text-xs text-muted-foreground">{B((t) => t.whoSub)}</span></span></a>
              <span className="text-xs text-muted-foreground">{B((t, l) => t.updated(date[l]))}</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gold/30 shadow-[0_0_40px_hsl(var(--gold)/0.18)]"><PostArt art={p.art} mode="both" title={p.h1} /></div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 space-y-8">
          {p.sections.map((s, i) => {
            const showCta = s.cta && ctaCount++ < 2;
            return (
              <div key={s.id} className="space-y-8">
                <section id={s.id} className="scroll-mt-24 space-y-4">
                  <BiBlock className="space-y-4" en={<SectionBody s={s} post={p} lang="en" />} hi={<SectionBody s={ph.sections[i]} post={ph} lang="hi" />} />
                </section>
                {showCta && <BlogCta topic={topic} />}
              </div>
            );
          })}
          <BlogCta topic={topic} variant="big" />
          <AcharyaProfile />
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold">{B((t) => t.related)}</h2>
            <div className="flex flex-wrap gap-2">{rel.near.map((s) => relLink(s, true))}</div>
            <h3 className="pt-2 font-serif text-lg font-semibold">{B((t) => t.more)}</h3>
            <div className="flex flex-wrap gap-2">{rel.others.map((s) => relLink(s))}<Link href="/blog" className="rounded-full px-3 py-1.5 text-sm text-gold hover:underline"><Bi en="All articles →" hi="सभी लेख →" /></Link></div>
          </section>
          <p className="text-xs text-muted-foreground">{B((t) => t.note)}</p>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <nav aria-labelledby="otp-label" className="glass rounded-xl border border-gold/25 p-4"><span id="otp-label" className="sr-only"><Bi en="On this page" hi="इस पेज पर" /></span><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold"><UserRound className="h-3 w-3" />{B((t) => t.onPage)}</p>
              <ul className="space-y-1.5 text-sm">{tocIds.map((id) => <li key={id}><a href={`#${id}`} className="text-muted-foreground hover:text-gold">{B((_, l) => tocTitle(l, id))}</a></li>)}</ul></nav>
            <Link href={p.calc.href} className="mk-card block rounded-xl border border-gold/30 p-4"><p className="flex items-center gap-2 font-semibold"><Calculator className="h-4 w-4 text-gold" />{B((_, l) => P(l).calc.label)}</p><p className="mt-1 text-xs text-muted-foreground">{B((t) => t.calcSub)}</p></Link>
            <Link href={p.service.href} className="mk-card block rounded-xl border border-gold/30 p-4"><p className="text-xs uppercase tracking-widest text-gold">{B((t) => t.service)}</p><p className="mt-1 flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-gold" />{B((_, l) => P(l).service.label)}</p></Link>
            <div className="mk-pulse rounded-xl border border-gold/40 bg-gradient-to-br from-gold/15 to-maroon/20 p-4 text-center"><p className="font-serif text-lg font-semibold">{B((t) => t.free)}</p><p className="mt-1 text-xs text-muted-foreground">{B((t) => t.freeSub)}</p><Link href="/reading" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] text-sm font-semibold text-[hsl(250_45%_10%)]">{B((t) => t.start)}</Link></div>
          </div>
        </aside>
      </div>
    </article>
  );
}
