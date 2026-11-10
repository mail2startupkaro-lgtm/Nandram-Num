import type { Metadata } from 'next';
import { jsonLd as toLd } from '@/lib/seo/site';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, MapPin, UserRound } from 'lucide-react';
import { AcharyaProfile, BlogCta } from '@/components/blog/blog-parts';
import { CITIES, TIER_LABEL, cityFromPostSlug, postSlug } from '@/lib/blog/cities';
import { buildPost, type Block, type Post } from '@/lib/blog/generate';
import { Blocks } from '@/components/blog/blocks';
import { buildPostHi } from '@/lib/blog/generate-hi';
import { cityHi, stateHi, ALIAS_HI } from '@/lib/blog/cities-hi';
import { Bi, BiBlock } from '@/components/i18n/bi';
import { NumberPostView } from '@/components/blog/number-post';
import { NUMBER_POSTS, NUMBER_POST_PUBLISHED, buildNumberPost, numberPostBySlug } from '@/lib/blog/numbers';

export const dynamicParams = false;
export function generateStaticParams() { return [...NUMBER_POSTS.map((p) => ({ slug: p.slug })), ...CITIES.map((c) => ({ slug: postSlug(c) }))]; }

const PUBLISHED = '2026-11-09';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const np = numberPostBySlug(params.slug);
  if (np) {
    const p = buildNumberPost(np.kind, np.n, 'en');
    return {
      title: { absolute: p.title }, description: p.description, keywords: p.keywords, authors: [{ name: 'Acharya Nandram' }],
      alternates: { canonical: `/blog/${p.slug}` },
      openGraph: { title: p.title, description: p.description, url: `/blog/${p.slug}`, siteName: 'myNumerologist.com', locale: 'en_IN', type: 'article', publishedTime: NUMBER_POST_PUBLISHED, authors: ['Acharya Nandram'] },
      twitter: { card: 'summary_large_image', title: p.title, description: p.description },
    };
  }
  const c = cityFromPostSlug(params.slug);
  if (!c) return {};
  const p = buildPost(c);
  return {
    title: { absolute: p.title }, description: p.description, keywords: p.keywords, authors: [{ name: 'Acharya Nandram' }],
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { title: p.title, description: p.description, url: `/blog/${p.slug}`, siteName: 'myNumerologist.com', locale: 'en_IN', type: 'article', publishedTime: PUBLISHED, authors: ['Acharya Nandram'] },
    twitter: { card: 'summary_large_image', title: p.title, description: p.description },
  };
}

const T = {
  en: { home: 'Home', blog: 'Blog', alias: (a: string) => `also searched as Numerologist in ${a}`, sub: (c: string) => `Online Vedic, Chaldean and Lo Shu numerology for people in ${c}, with personal reports and remedies by Acharya Nandram.`,
    who: 'Acharya Nandram', whoSub: 'Numerologist · 15+ years experience', initials: 'AN', read: (m: number) => `${m} min read`, updated: (d: string) => `Updated ${d}`,
    tier: { 1: 'Tier 1 · Metro', 2: 'Tier 2', 3: 'Tier 3' } as Record<number, string>, more: (s: string) => `More City Guides in ${s}`, moreP: 'Acharya Nandram works online with people across India. Read the guide for another city:',
    rel: (c: string) => `Best Numerologist in ${c}`, all: 'All city guides →', note: 'Numerology offers guidance based on traditional methods. It is not a substitute for professional medical, legal or financial advice. Reports and consultations are delivered online.',
    onPage: 'On this page', expert: 'About Acharya Nandram', free: 'Free numerology reading', forCity: (c: string) => `For ${c} and all of India`, start: 'Get My Reading' },
  hi: { home: 'होम', blog: 'ब्लॉग', alias: (a: string) => `${a} के अंक ज्योतिषी के रूप में भी खोजा जाता है`, sub: (c: string) => `${c} के लोगों के लिए ऑनलाइन वैदिक, कैल्डियन और लो शू अंक ज्योतिष, आचार्य नंदराम की व्यक्तिगत रिपोर्ट और उपायों के साथ।`,
    who: 'आचार्य नंदराम', whoSub: 'अंक ज्योतिषी · 15+ वर्षों का अनुभव', initials: 'आ', read: (m: number) => `${m} मिनट का पाठ`, updated: (d: string) => `अद्यतन: ${d}`,
    tier: { 1: 'टियर 1 · महानगर', 2: 'टियर 2', 3: 'टियर 3' } as Record<number, string>, more: (s: string) => `${s} के अन्य शहरों की मार्गदर्शिकाएँ`, moreP: 'आचार्य नंदराम पूरे भारत के लोगों के साथ ऑनलाइन काम करते हैं। किसी अन्य शहर की मार्गदर्शिका पढ़ें:',
    rel: (c: string) => `${c} में सबसे अच्छे अंक ज्योतिषी`, all: 'सभी शहरों की मार्गदर्शिकाएँ →', note: 'अंक ज्योतिष पारंपरिक विधियों पर आधारित मार्गदर्शन देता है। यह चिकित्सा, कानूनी या वित्तीय पेशेवर सलाह का विकल्प नहीं है। रिपोर्ट और परामर्श ऑनलाइन दिए जाते हैं।',
    onPage: 'इस पेज पर', expert: 'आचार्य नंदराम के बारे में', free: 'मुफ़्त अंक ज्योतिष रीडिंग', forCity: (c: string) => `${c} और पूरे भारत के लिए`, start: 'मेरी रीडिंग पाएँ' },
};

function SectionBody({ s, post, lang }: { s: Post['sections'][number]; post: Post; lang: 'en' | 'hi' }) {
  return (
    <>
      <h2 className="font-serif text-2xl font-bold sm:text-3xl">{s.title}</h2>
      <Blocks blocks={s.blocks} lang={lang} />
      {s.id === 'faq' && <div className="space-y-3">{post.faqs.map((f) => <details key={f.q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}</div>}
    </>
  );
}

export default async function CityPost(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const np = numberPostBySlug(params.slug);
  if (np) return <NumberPostView kind={np.kind} n={np.n} />;
  const c = cityFromPostSlug(params.slug);
  if (!c) notFound();
  const p = buildPost(c);
  const ph = buildPostHi(c, p);
  const N = { en: c.name, hi: cityHi(c.name) }, S = { en: c.state, hi: stateHi(c.state) };
  const date = { en: new Date(PUBLISHED).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), hi: new Date(PUBLISHED).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }) };
  const B = (f: (t: typeof T.en, l: 'en' | 'hi') => React.ReactNode) => <Bi en={f(T.en, 'en')} hi={f(T.hi, 'hi')} />;
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, datePublished: PUBLISHED, dateModified: PUBLISHED, inLanguage: ['en-IN', 'hi-IN'], wordCount: p.wordCount,
      author: { '@type': 'Person', name: 'Acharya Nandram', description: 'Numerologist with more than 15 years of experience in Vedic, Chaldean and Lo Shu numerology.' }, publisher: { '@type': 'Organization', name: 'myNumerologist.com' },
      mainEntityOfPage: `/blog/${p.slug}`, about: `Numerology consultation for ${c.name}, ${c.state}`, keywords: p.keywords.join(', ') },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', item: '/' }, { name: 'Blog', item: '/blog' }, { name: c.state, item: `/blog?state=${encodeURIComponent(c.state)}` }, { name: `Best Numerologist in ${c.name}`, item: `/blog/${p.slug}` }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) },
  ];
  const tocIds = [...p.sections.map((s) => s.id), 'expert'];
  const tocTitle = (l: 'en' | 'hi', id: string) => id === 'expert' ? T[l].expert : (l === 'hi' ? ph : p).sections.find((s) => s.id === id)?.title ?? id;
  return (
    <article className="container max-w-6xl py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(jsonLd) }} />
      <nav aria-labelledby="bc-label" className="mb-4 text-xs text-muted-foreground"><span id="bc-label" className="sr-only"><Bi en="Breadcrumb" hi="पथ" /></span><Link href="/" className="hover:text-foreground">{B((t) => t.home)}</Link> / <Link href="/blog" className="hover:text-foreground">{B((t) => t.blog)}</Link> / <Link href={`/blog?state=${encodeURIComponent(c.state)}`} className="hover:text-foreground">{B((_, l) => S[l])}</Link> / {B((_, l) => N[l])}</nav>

      <header className="mk-rise relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-maroon/40 via-card/80 to-card/90 p-6 sm:p-10">
        <span className="mk-spin pointer-events-none absolute -right-14 -top-14 h-64 w-64 rounded-full border border-dashed border-gold/40" />
        <span className="mk-spin-rev pointer-events-none absolute -right-6 -top-6 h-44 w-44 rounded-full border border-gold/25" />
        <div className="relative max-w-3xl">
          <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-gold/20 px-3 py-1 font-semibold text-gold">{B((t) => t.tier[c.tier])}</span><span className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1"><MapPin className="h-3 w-3" />{B((_, l) => `${N[l]}, ${S[l]}`)}</span><span className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1"><Clock className="h-3 w-3" />{B((t) => t.read(p.readMinutes))}</span></div>
          <h1 className="font-cinzel mt-4 text-3xl font-bold leading-tight sm:text-5xl"><span className="gold-text">{B((_, l) => (l === 'hi' ? ph : p).h1)}</span>{c.alias && <span className="block text-xl font-normal text-muted-foreground sm:text-2xl">{B((t, l) => t.alias(l === 'hi' ? ALIAS_HI[c.alias!] ?? c.alias! : c.alias!))}</span>}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{B((t, l) => t.sub(N[l]))}</p>
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
              {s.cta && <BlogCta city={c.name} cityHi={N.hi} />}
              {i === 6 && <BlogCta city={c.name} cityHi={N.hi} />}
            </div>
          ))}
          <BlogCta city={c.name} cityHi={N.hi} variant="big" />
          <AcharyaProfile city={c.name} cityHi={N.hi} />
          <section className="space-y-3"><h2 className="font-serif text-2xl font-bold">{B((t, l) => t.more(S[l]))}</h2><p className="text-sm text-muted-foreground">{B((t) => t.moreP)}</p>
            <div className="flex flex-wrap gap-2">{p.related.map((r) => <Link key={r.slug} href={`/blog/${postSlug(r)}`} className="rounded-full border border-gold/40 px-3 py-1.5 text-sm hover:bg-gold/10">{B((t, l) => t.rel(l === 'hi' ? cityHi(r.name) : r.name))}</Link>)}<Link href="/blog" className="rounded-full px-3 py-1.5 text-sm text-gold hover:underline">{B((t) => t.all)}</Link></div></section>
          <p className="text-xs text-muted-foreground">{B((t) => t.note)}</p>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <nav aria-labelledby="otp-label" className="glass rounded-xl border border-gold/25 p-4"><span id="otp-label" className="sr-only"><Bi en="On this page" hi="इस पेज पर" /></span><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold"><UserRound className="h-3 w-3" />{B((t) => t.onPage)}</p>
              <ul className="space-y-1.5 text-sm">{tocIds.map((id) => <li key={id}><a href={`#${id}`} className="text-muted-foreground hover:text-gold">{B((_, l) => tocTitle(l, id))}</a></li>)}</ul></nav>
            <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/15 to-maroon/20 p-4 text-center"><p className="font-serif text-lg font-semibold">{B((t) => t.free)}</p><p className="mt-1 text-xs text-muted-foreground">{B((t, l) => t.forCity(N[l]))}</p><Link href="/reading" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] text-sm font-semibold text-[hsl(250_45%_10%)]">{B((t) => t.start)}</Link></div>
          </div>
        </aside>
      </div>
    </article>
  );
}
