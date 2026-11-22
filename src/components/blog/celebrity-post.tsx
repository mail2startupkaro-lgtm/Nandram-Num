/** Public view of a published Celebrity Numerology post (server component). */
import Link from 'next/link';
import { Calculator, Clock, Star, UserRound } from 'lucide-react';
import { SITE_URL, jsonLd as toLd } from '@/lib/seo/site';
import { AcharyaProfile, BlogCta } from '@/components/blog/blog-parts';
import { CelebNumbersPanel } from '@/components/blog/celeb-numbers';
import { Bi, BiBlock } from '@/components/i18n/bi';
import { readMinutes, wordCount, type CelebContent } from '@/lib/celebrity/post';
import type { CelebListItem, CelebRow } from '@/lib/celebrity/store';

type Lang = 'en' | 'hi';
const T = {
  en: { home: 'Home', blog: 'Blog', celeb: 'Celebrity numerology', who: 'Acharya Nandram', whoSub: 'Numerologist · 15+ years experience', read: (m: number) => `${m} min read`, pub: (d: string) => `Published ${d}`,
    onPage: 'On this page', faq: 'Frequently asked questions', expert: 'About Acharya Nandram', free: 'Find your own numbers', freeSub: 'Mulank, Bhagyank, name number & Lo Shu', start: 'Get My Reading',
    calcs: 'Free calculators', more: 'More celebrity numerology', all: 'All celebrity readings →', note: 'This article reads publicly known birth details through traditional numerology for education and entertainment. It is not a statement about the person’s private life and not a substitute for professional advice.' },
  hi: { home: 'होम', blog: 'ब्लॉग', celeb: 'सेलिब्रिटी अंक ज्योतिष', who: 'आचार्य नंदराम', whoSub: 'अंक ज्योतिषी · 15+ वर्षों का अनुभव', read: (m: number) => `${m} मिनट का पाठ`, pub: (d: string) => `प्रकाशित: ${d}`,
    onPage: 'इस पेज पर', faq: 'अक्सर पूछे जाने वाले प्रश्न', expert: 'आचार्य नंदराम के बारे में', free: 'अपने अंक जानें', freeSub: 'मूलांक, भाग्यांक, नामांक और लो शू', start: 'मेरी रीडिंग पाएँ',
    calcs: 'मुफ़्त कैलकुलेटर', more: 'और सेलिब्रिटी अंक ज्योतिष', all: 'सभी सेलिब्रिटी रीडिंग →', note: 'यह लेख सार्वजनिक रूप से ज्ञात जन्म विवरण को पारंपरिक अंक ज्योतिष से शिक्षा और मनोरंजन के लिए पढ़ता है। यह व्यक्ति के निजी जीवन पर कोई कथन नहीं है और पेशेवर सलाह का विकल्प नहीं है।' },
};

function Body({ c, px = '' }: { c: CelebContent; px?: string }) {
  return (
    <div className="space-y-8">
      {c.sections.map((s) => (
        <section key={s.id} id={`${px}${s.id}`} className="scroll-mt-24 space-y-4">
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">{s.h2}</h2>
          {s.paras.map((p, i) => <p key={i} className="leading-relaxed text-foreground/90">{p}</p>)}
          {!!s.bullets?.length && <ul className="space-y-2">{s.bullets.map((b, i) => <li key={i} className="flex gap-2"><Star className="mt-1 h-4 w-4 shrink-0 text-gold" /><span>{b}</span></li>)}</ul>}
        </section>
      ))}
    </div>
  );
}

function Faqs({ c, lang }: { c: CelebContent; lang: Lang }) {
  return (
    <section id={lang === 'hi' ? 'hi-faq' : 'faq'} className="scroll-mt-24 space-y-3">
      <h2 className="font-serif text-2xl font-bold sm:text-3xl">{T[lang].faq}</h2>
      {c.faqs.map((f) => <details key={f.q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}
    </section>
  );
}

export function CelebrityPostView({ row, related }: { row: CelebRow; related: CelebListItem[] }) {
  const p = row.post, en = p.en, hi = p.hi ?? p.en;
  const C = (l: Lang) => (l === 'hi' ? hi : en);
  const n = p.numbers;
  const B = (f: (t: typeof T.en, l: Lang) => React.ReactNode) => <Bi en={f(T.en, 'en')} hi={f(T.hi, 'hi')} />;
  const when = row.publishedAt ?? row.updatedAt;
  const date = { en: new Date(when).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), hi: new Date(when).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }) };
  const url = `${SITE_URL}/blog/celebrity/${row.slug}`;
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: en.seoTitle, description: en.metaDescription, image: [`${url}/opengraph-image`], datePublished: row.publishedAt ?? row.createdAt, dateModified: row.updatedAt,
      inLanguage: p.hi ? ['en-IN', 'hi-IN'] : 'en-IN', wordCount: wordCount(en), keywords: en.keywords.join(', '), articleSection: 'Celebrity numerology',
      author: { '@type': 'Person', '@id': `${SITE_URL}/#expert`, name: 'Acharya Nandram', url: `${SITE_URL}/about`, image: `${SITE_URL}/images/acharya-nandram-512.png` },
      publisher: { '@type': 'Organization', name: 'myNumerologist.com', url: SITE_URL }, mainEntityOfPage: url,
      about: { '@type': 'Person', name: p.name, birthDate: p.dob, ...(p.profile.profession ? { jobTitle: p.profile.profession } : {}), ...(p.profile.knownFor ? { description: p.profile.knownFor } : {}) } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: en.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', item: `${SITE_URL}/` }, { name: 'Blog', item: `${SITE_URL}/blog` }, { name: 'Celebrity numerology', item: `${SITE_URL}/blog/celebrity` }, { name: en.h1, item: url }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) },
  ];
  const px = (l: Lang) => (l === 'hi' ? 'hi-' : '');
  const toc = (l: Lang) => [...C(l).sections.map((s) => [`${px(l)}${s.id}`, s.h2] as const), [`${px(l)}faq`, T[l].faq] as const, ['expert', T[l].expert] as const];
  const topic = { en: `${p.name} numerology`, hi: `${p.name} अंक ज्योतिष` };
  const calcs: [string, string, string][] = [
    [`/mulank/${n.moolank.value}`, `Mulank ${n.moolank.value} guide`, `मूलांक ${n.moolank.value} मार्गदर्शिका`],
    [`/bhagyank/${n.bhagyank.value}`, `Bhagyank ${n.bhagyank.value} guide`, `भाग्यांक ${n.bhagyank.value} मार्गदर्शिका`],
    ['/calculators/name-numerology-calculator', 'Name numerology calculator', 'नाम अंक ज्योतिष कैलकुलेटर'],
    ['/calculators/lo-shu-grid-calculator', 'Lo Shu grid calculator', 'लो शू ग्रिड कैलकुलेटर'],
    ['/calculators/personal-year-calculator', 'Personal year calculator', 'व्यक्तिगत वर्ष कैलकुलेटर'],
  ];
  const mid = Math.min(3, en.sections.length);
  return (
    <article className="container max-w-6xl py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">{B((t) => t.home)}</Link> / <Link href="/blog" className="hover:text-foreground">{B((t) => t.blog)}</Link> / <Link href="/blog/celebrity" className="hover:text-foreground">{B((t) => t.celeb)}</Link> / {p.name}</nav>

      <header className="mk-rise relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-maroon/40 via-card/80 to-card/90 p-6 sm:p-10">
        <span className="mk-spin pointer-events-none absolute -right-14 -top-14 h-64 w-64 rounded-full border border-dashed border-gold/40" />
        <div className="relative max-w-3xl">
          <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-gold/20 px-3 py-1 font-semibold text-gold">{B((t) => t.celeb)}</span>{p.profile.profession && <span className="rounded-full border border-gold/40 px-3 py-1">{p.profile.profession}</span>}<span className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1"><Clock className="h-3 w-3" />{B((t, l) => t.read(readMinutes(C(l))))}</span></div>
          <h1 className="font-cinzel mt-4 text-3xl font-bold leading-tight sm:text-5xl"><span className="gold-text"><Bi en={en.h1} hi={hi.h1} /></span></h1>
          <BiBlock className="mt-4 space-y-3 text-lg text-muted-foreground" en={en.intro.map((x, i) => <p key={i}>{x}</p>)} hi={hi.intro.map((x, i) => <p key={i}>{x}</p>)} />
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm"><a href="#expert" className="inline-flex items-center gap-2 hover:text-gold"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-br from-[#2a0e1b] to-[#24130a] text-xs font-bold text-gold">AN</span><span><b>{B((t) => t.who)}</b><span className="block text-xs text-muted-foreground">{B((t) => t.whoSub)}</span></span></a>
            <time dateTime={when} className="text-xs text-muted-foreground">{B((t, l) => t.pub(date[l]))}</time></div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 space-y-8">
          <BiBlock en={<CelebNumbersPanel n={n} lang="en" />} hi={<CelebNumbersPanel n={n} lang="hi" />} />
          <BiBlock en={<Body c={{ ...en, sections: en.sections.slice(0, mid) }} />} hi={<Body px="hi-" c={{ ...hi, sections: hi.sections.slice(0, mid) }} />} />
          <BlogCta topic={topic} />
          <BiBlock en={<Body c={{ ...en, sections: en.sections.slice(mid) }} />} hi={<Body px="hi-" c={{ ...hi, sections: hi.sections.slice(mid) }} />} />
          <BiBlock en={<Faqs c={en} lang="en" />} hi={<Faqs c={hi} lang="hi" />} />
          {(en.conclusion || hi.conclusion) && <BiBlock className="rounded-xl border-l-4 border-gold bg-gold/10 p-4" en={<p>{en.conclusion}</p>} hi={<p>{hi.conclusion ?? en.conclusion}</p>} />}
          <section aria-label="Calculators" className="space-y-3"><h2 className="flex items-center gap-2 font-serif text-xl font-bold"><Calculator className="h-5 w-5 text-gold" />{B((t) => t.calcs)}</h2>
            <div className="flex flex-wrap gap-2">{calcs.map(([href, e, h]) => <Link key={href} href={href} className="rounded-full border border-gold/40 px-3 py-1.5 text-sm hover:bg-gold/10"><Bi en={e} hi={h} /></Link>)}</div></section>
          <BlogCta topic={topic} variant="big" />
          <AcharyaProfile />
          {related.length > 0 && <section className="space-y-3"><h2 className="font-serif text-2xl font-bold">{B((t) => t.more)}</h2>
            <div className="grid gap-3 sm:grid-cols-2">{related.map((r) => <Link key={r.slug} href={`/blog/celebrity/${r.slug}`} className="mk-card glass rounded-xl border border-gold/25 p-4 hover:text-gold"><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.profession ? `${r.profession} · ` : ''}Mulank {r.moolank} · Bhagyank {r.bhagyank}</p></Link>)}</div>
            <Link href="/blog/celebrity" className="text-sm text-gold hover:underline">{B((t) => t.all)}</Link></section>}
          <p className="text-xs text-muted-foreground">{B((t) => t.note)}</p>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <nav aria-label="On this page" className="glass rounded-xl border border-gold/25 p-4"><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold"><UserRound className="h-3 w-3" />{B((t) => t.onPage)}</p>
              <BiBlock en={<ul className="space-y-1.5 text-sm">{toc('en').map(([id, h]) => <li key={id}><a href={`#${id}`} className="text-muted-foreground hover:text-gold">{h}</a></li>)}</ul>} hi={<ul className="space-y-1.5 text-sm">{toc('hi').map(([id, h]) => <li key={id}><a href={`#${id}`} className="text-muted-foreground hover:text-gold">{h}</a></li>)}</ul>} /></nav>
            <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/15 to-maroon/20 p-4 text-center"><p className="font-serif text-lg font-semibold">{B((t) => t.free)}</p><p className="mt-1 text-xs text-muted-foreground">{B((t) => t.freeSub)}</p><Link href="/reading" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] text-sm font-semibold text-[hsl(250_45%_10%)]">{B((t) => t.start)}</Link></div>
          </div>
        </aside>
      </div>
    </article>
  );
}
