import type { Metadata } from 'next';
import { clipDescription, jsonLd as toLd, pageTitle } from '@/lib/seo/site';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calculator } from '@/components/calculators/calculator';
import { ExpertCard } from '@/components/calculators/expert-card';
import { CALCULATORS, calcBySlug } from '@/lib/seo/calculators';
import { Bi, BiBlock } from '@/components/i18n/bi';

export const dynamicParams = false;
export function generateStaticParams() { return CALCULATORS.map((c) => ({ slug: c.slug })); }

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const c = calcBySlug(params.slug);
  if (!c) return {};
  return { title: pageTitle(c.title), description: clipDescription(c.description), keywords: c.keywords, alternates: { canonical: `/calculators/${c.slug}` }, openGraph: { title: c.title, description: c.description, type: 'website', url: `/calculators/${c.slug}`, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: c.h1 }] } };
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
      <nav className="text-xs text-muted-foreground"><Link href="/calculators" className="hover:text-foreground"><Bi en="Free calculators" hi="मुफ़्त कैलकुलेटर" /></Link> / <Bi en={c.h1} hi={c.hi.h1} /></nav>
      <header className="space-y-3"><h1 className="text-4xl font-bold sm:text-5xl"><span className="gold-text"><Bi en={c.h1} hi={c.hi.h1} /></span></h1><BiBlock className="space-y-3" en={c.intro.map((p) => <p key={p} className="text-lg text-muted-foreground">{p}</p>)} hi={c.hi.intro.map((p) => <p key={p} className="text-lg text-muted-foreground">{p}</p>)} /><p className="text-sm text-gold">✦ <Bi en="Method by Acharya Nandram · 15+ years of Vedic, Chaldean & Lo Shu numerology" hi="आचार्य नंदराम की पद्धति · वैदिक, कैल्डियन और लो शू अंक ज्योतिष में 15+ वर्ष" /></p></header>
      <Calculator kind={c.kind} />
      <ExpertCard />
      <section className="space-y-4"><h2 className="text-2xl font-semibold"><Bi en="Frequently asked questions" hi="अक्सर पूछे जाने वाले प्रश्न" /></h2>{c.faq.map((f, i) => <details key={f.q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium"><Bi en={f.q} hi={c.hi.faq[i]?.q ?? f.q} /></summary><p className="mt-2 text-muted-foreground"><Bi en={f.a} hi={c.hi.faq[i]?.a ?? f.a} /></p></details>)}</section>
      <section className="glass rounded-lg p-5"><h2 className="mb-3 text-xl font-semibold"><Bi en="More free calculators" hi="और मुफ़्त कैलकुलेटर" /></h2><div className="flex flex-wrap gap-2">{CALCULATORS.filter((x) => x.slug !== c.slug).map((x) => <Link key={x.slug} href={`/calculators/${x.slug}`} className="rounded-full border border-gold/40 px-3 py-1.5 text-sm hover:bg-gold/10"><Bi en={x.h1.replace(/^Free /, '')} hi={x.hi.h1.replace(/^मुफ़्त /, '')} /></Link>)}</div></section>
    </div>
  );
}
