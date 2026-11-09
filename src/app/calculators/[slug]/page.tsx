import type { Metadata } from 'next';
import { jsonLd as toLd } from '@/lib/seo/site';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calculator } from '@/components/calculators/calculator';
import { ExpertCard } from '@/components/calculators/expert-card';
import { CALCULATORS, calcBySlug } from '@/lib/seo/calculators';

export const dynamicParams = false;
export function generateStaticParams() { return CALCULATORS.map((c) => ({ slug: c.slug })); }

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const c = calcBySlug(params.slug);
  if (!c) return {};
  return { title: c.title, description: c.description, keywords: c.keywords, alternates: { canonical: `/calculators/${c.slug}` }, openGraph: { title: c.title, description: c.description, type: 'website' } };
}

export default async function CalculatorPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const c = calcBySlug(params.slug);
  if (!c) notFound();
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: c.h1, applicationCategory: 'LifestyleApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' } },
  ];
  return (
    <div className="container max-w-4xl space-y-8 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(jsonLd) }} />
      <nav className="text-xs text-muted-foreground"><Link href="/calculators" className="hover:text-foreground">Free calculators</Link> / {c.h1}</nav>
      <header className="space-y-3"><h1 className="text-4xl font-bold sm:text-5xl"><span className="gold-text">{c.h1}</span></h1>{c.intro.map((p) => <p key={p} className="text-lg text-muted-foreground">{p}</p>)}<p className="text-sm text-gold">✦ Method by Acharya Nandram · 15+ years of Vedic, Chaldean &amp; Lo Shu numerology</p></header>
      <Calculator kind={c.kind} />
      <ExpertCard />
      <section className="space-y-4"><h2 className="text-2xl font-semibold">Frequently asked questions</h2>{c.faq.map((f) => <details key={f.q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-2 text-muted-foreground">{f.a}</p></details>)}</section>
      <section className="glass rounded-lg p-5"><h2 className="mb-3 text-xl font-semibold">More free calculators</h2><div className="flex flex-wrap gap-2">{CALCULATORS.filter((x) => x.slug !== c.slug).map((x) => <Link key={x.slug} href={`/calculators/${x.slug}`} className="rounded-full border border-gold/40 px-3 py-1.5 text-sm hover:bg-gold/10">{x.h1.replace(/^Free /, '')}</Link>)}</div></section>
    </div>
  );
}
