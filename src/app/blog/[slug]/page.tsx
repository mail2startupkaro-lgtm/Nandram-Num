import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, MapPin, UserRound } from 'lucide-react';
import { AcharyaProfile, BlogCta } from '@/components/blog/blog-parts';
import { CITIES, TIER_LABEL, cityFromPostSlug, postSlug } from '@/lib/blog/cities';
import { buildPost, type Block } from '@/lib/blog/generate';
import { MULANK } from '@/lib/mulank-data';

export const dynamicParams = false;
export function generateStaticParams() { return CITIES.map((c) => ({ slug: postSlug(c) })); }

const PUBLISHED = '2026-11-09';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = cityFromPostSlug(params.slug);
  if (!c) return {};
  const p = buildPost(c);
  return {
    title: p.title, description: p.description, keywords: p.keywords, authors: [{ name: 'Acharya Nandram' }],
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { title: p.title, description: p.description, type: 'article', publishedTime: PUBLISHED, authors: ['Acharya Nandram'] },
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
          case 'cards': return <div key={i} className="grid gap-3 sm:grid-cols-2">{b.items.map((x) => <Link key={x.title} href={x.href ?? '/reading'} className="mk-card rounded-lg border border-gold/25 bg-background/40 p-4"><p className="font-serif text-lg font-semibold text-gold">{x.title}</p><p className="mt-1 text-sm text-muted-foreground">{x.text}</p><span className="mt-2 inline-block text-sm text-gold">Learn more →</span></Link>)}</div>;
          case 'steps': return <ol key={i} className="grid gap-3 sm:grid-cols-2">{b.items.map((x, n) => <li key={x.title} className="rounded-lg border border-gold/20 bg-background/40 p-4"><span className="gold-text font-serif text-3xl font-bold">{n + 1}</span><p className="font-semibold">{x.title}</p><p className="text-sm text-muted-foreground">{x.text}</p></li>)}</ol>;
          case 'table': return <div key={i} className="overflow-x-auto rounded-lg border border-gold/20"><table className="w-full min-w-[460px] text-sm"><thead><tr className="border-b border-gold/20 bg-gold/5 text-left">{b.head.map((h) => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr></thead><tbody>{b.rows.map((r) => <tr key={r[0]} className="border-b border-border/50 last:border-0 hover:bg-gold/5">{r.map((c, n) => <td key={n} className={n === 0 ? 'p-3 font-serif text-lg font-bold text-gold' : 'p-3 text-muted-foreground'}>{c}</td>)}</tr>)}</tbody></table></div>;
          case 'mulank': return <div key={i} className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">{MULANK.map((m) => <Link key={m.n} href={`/mulank/${m.n}`} className="mk-card rounded-lg border border-gold/25 p-2 text-center"><span className="gold-text font-cinzel text-2xl font-bold">{m.n}</span><span className="block text-[10px] uppercase tracking-wide text-muted-foreground">{m.planet.split(' ')[0]}</span></Link>)}</div>;
        }
      })}
    </>
  );
}

export default function CityPost({ params }: { params: { slug: string } }) {
  const c = cityFromPostSlug(params.slug);
  if (!c) notFound();
  const p = buildPost(c);
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, datePublished: PUBLISHED, dateModified: PUBLISHED, inLanguage: 'en-IN', wordCount: p.wordCount,
      author: { '@type': 'Person', name: 'Acharya Nandram', description: 'Numerologist with more than 15 years of experience in Vedic, Chaldean and Lo Shu numerology.' }, publisher: { '@type': 'Organization', name: 'myNumerologist.com' },
      mainEntityOfPage: `/blog/${p.slug}`, about: `Numerology consultation for ${c.name}, ${c.state}`, keywords: p.keywords.join(', ') },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', item: '/' }, { name: 'Blog', item: '/blog' }, { name: c.state, item: `/blog?state=${encodeURIComponent(c.state)}` }, { name: `Best Numerologist in ${c.name}`, item: `/blog/${p.slug}` }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) },
  ];
  const toc = [...p.sections.map((s) => ({ id: s.id, title: s.title })), { id: 'expert', title: 'About Acharya Nandram' }];
  return (
    <article className="container max-w-6xl py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link> / <Link href="/blog" className="hover:text-foreground">Blog</Link> / <Link href={`/blog?state=${encodeURIComponent(c.state)}`} className="hover:text-foreground">{c.state}</Link> / {c.name}</nav>

      <header className="mk-rise relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-maroon/40 via-card/80 to-card/90 p-6 sm:p-10">
        <span className="mk-spin pointer-events-none absolute -right-14 -top-14 h-64 w-64 rounded-full border border-dashed border-gold/40" />
        <span className="mk-spin-rev pointer-events-none absolute -right-6 -top-6 h-44 w-44 rounded-full border border-gold/25" />
        <div className="relative max-w-3xl">
          <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-gold/20 px-3 py-1 font-semibold text-gold">{TIER_LABEL[c.tier]}</span><span className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1"><MapPin className="h-3 w-3" />{c.name}, {c.state}</span><span className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1"><Clock className="h-3 w-3" />{p.readMinutes} min read</span></div>
          <h1 className="font-cinzel mt-4 text-3xl font-bold leading-tight sm:text-5xl"><span className="gold-text">{p.h1}</span>{c.alias && <span className="block text-xl font-normal text-muted-foreground sm:text-2xl">also searched as Numerologist in {c.alias}</span>}</h1>
          <p className="mt-4 text-lg text-muted-foreground">Online Vedic, Chaldean and Lo Shu numerology for people in {c.name}, with personal reports and remedies by Acharya Nandram.</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm"><a href="#expert" className="inline-flex items-center gap-2 hover:text-gold"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-br from-[#2a0e1b] to-[#24130a] text-xs font-bold text-gold">AN</span><span><b>Acharya Nandram</b><span className="block text-xs text-muted-foreground">Numerologist · 15+ years experience</span></span></a>
            <span className="text-xs text-muted-foreground">Updated {new Date(PUBLISHED).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 space-y-8">
          {p.sections.map((s, i) => (
            <div key={s.id} className="space-y-8">
              <section id={s.id} className="scroll-mt-24 space-y-4">
                <h2 className="font-serif text-2xl font-bold sm:text-3xl">{s.title}</h2>
                <Blocks blocks={s.blocks} />
                {s.id === 'faq' && <div className="space-y-3">{p.faqs.map((f) => <details key={f.q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}</div>}
              </section>
              {s.cta && <BlogCta city={c.name} />}
              {i === 6 && <BlogCta city={c.name} />}
            </div>
          ))}
          <BlogCta city={c.name} variant="big" />
          <AcharyaProfile city={c.name} />
          <section className="space-y-3"><h2 className="font-serif text-2xl font-bold">More City Guides{c.state ? ` in ${c.state}` : ''}</h2><p className="text-sm text-muted-foreground">Acharya Nandram works online with people across India. Read the guide for another city:</p>
            <div className="flex flex-wrap gap-2">{p.related.map((r) => <Link key={r.slug} href={`/blog/${postSlug(r)}`} className="rounded-full border border-gold/40 px-3 py-1.5 text-sm hover:bg-gold/10">Best Numerologist in {r.name}</Link>)}<Link href="/blog" className="rounded-full px-3 py-1.5 text-sm text-gold hover:underline">All 500+ cities →</Link></div></section>
          <p className="text-xs text-muted-foreground">Numerology offers guidance based on traditional methods. It is not a substitute for professional medical, legal or financial advice. Reports and consultations are delivered online.</p>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <nav aria-label="On this page" className="glass rounded-xl border border-gold/25 p-4"><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold"><UserRound className="h-3 w-3" />On this page</p>
              <ul className="space-y-1.5 text-sm">{toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-muted-foreground hover:text-gold">{t.title}</a></li>)}</ul></nav>
            <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/15 to-maroon/20 p-4 text-center"><p className="font-serif text-lg font-semibold">Free numerology reading</p><p className="mt-1 text-xs text-muted-foreground">For {c.name} and all of India</p><Link href="/reading" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] text-sm font-semibold text-[hsl(250_45%_10%)]">Get My Reading</Link></div>
          </div>
        </aside>
      </div>
    </article>
  );
}
