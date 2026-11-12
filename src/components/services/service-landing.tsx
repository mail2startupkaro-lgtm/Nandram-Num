import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, FileText, LockKeyhole, Send, Users } from 'lucide-react';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { Calculator } from '@/components/calculators/calculator';
import { Bi, BiBlock } from '@/components/i18n/bi';
import { BookService, ServiceReturnBanner, type PublicService } from '@/components/services/book-service';
import { DEFAULT_SERVICES, getService, isPayable } from '@/lib/billing/services';
import { formatInr as inr } from '@/lib/billing/plans';
import type { Service } from '@/lib/db/schema';
import { SERVICE_PAGES, servicePageBySlug } from '@/lib/service-pages';
import { abs, EXPERT, jsonLd as toLd } from '@/lib/seo/site';
import { DisclaimerNote } from '@/components/legal/disclaimer-note';

export function serviceMetadata(slug: string): Metadata {
  const p = servicePageBySlug(slug)!;
  return {
    title: { absolute: p.title }, description: p.description, alternates: { canonical: `/${p.slug}` },
    openGraph: { title: p.title, description: p.description, url: `/${p.slug}`, type: 'website', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: p.h1.en }] },
    twitter: { card: 'summary_large_image', title: p.title, description: p.description },
  };
}

async function loadService(code: string): Promise<PublicService | null> {
  let s: Service | undefined;
  try { s = await getService(code); } catch { const d = DEFAULT_SERVICES.find((x) => x.code === code); s = d ? ({ ...d, mrpPaise: null, priceConfirmed: false, active: true, featured: !!d.featured, sort: d.sort ?? 0, updatedAt: new Date() } as Service) : undefined; }
  if (!s || !s.active) return null;
  return { code: s.code, en: s.en, hi: s.hi, intake: s.intake, payable: isPayable(s), pricePaise: isPayable(s) ? s.pricePaise : null, mrpPaise: isPayable(s) ? s.mrpPaise : null };
}

const STEPS = [
  { icon: FileText, en: 'Book and share the details', hi: 'बुक करें और विवरण दें' },
  { icon: LockKeyhole, en: 'Pay securely online', hi: 'सुरक्षित ऑनलाइन भुगतान करें' },
  { icon: Clock, en: 'Acharya Nandram prepares it personally', hi: 'आचार्य नंदराम स्वयं तैयार करते हैं' },
  { icon: Send, en: 'Delivered on email & WhatsApp', hi: 'ईमेल और WhatsApp पर डिलीवरी' },
];

export async function ServiceLanding({ slug }: { slug: string }) {
  const page = servicePageBySlug(slug)!;
  const svc = await loadService(page.serviceCode);
  const others = SERVICE_PAGES.filter((x) => x.slug !== slug);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Service', name: page.h1.en, description: page.description, serviceType: 'Numerology consultation', areaServed: 'IN', url: abs(`/${page.slug}`), availableLanguage: ['English', 'Hindi'],
      provider: { '@type': 'Person', name: EXPERT.name, url: abs('/about') },
      ...(svc?.pricePaise ? { offers: { '@type': 'Offer', price: (svc.pricePaise / 100).toFixed(2), priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: abs(`/${page.slug}`) } } : {}) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: f.en[0], acceptedAnswer: { '@type': 'Answer', text: f.en[1] } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', item: abs('/') }, { name: 'Services', item: abs('/services') }, { name: page.h1.en, item: abs(`/${page.slug}`) }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, ...x })) },
  ];
  const offer = svc && (
    <div className="glass rounded-2xl border border-gold/40 p-5 sm:p-6">
      <BiBlock en={<OfferText t={svc.en} />} hi={<OfferText t={svc.hi} />} />
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-border/50 pt-4">
        <div>
          {svc.pricePaise ? (
            (() => {
              const real = svc.mrpPaise && svc.mrpPaise > svc.pricePaise ? svc.mrpPaise : svc.pricePaise * 2;
              const pct = Math.round(((real - svc.pricePaise) / real) * 100);
              return (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground font-medium">1 · <Bi en="Real Price" hi="वास्तविक मूल्य" />:</span>
                    <span className="line-through text-muted-foreground decoration-danger decoration-[1.5px]">{inr(real)}</span>
                    <span className="rounded bg-danger/15 px-1.5 py-0.2 text-[10px] font-bold text-danger">{pct}% <Bi en="OFF" hi="छूट" /></span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gold">2 · <Bi en="Offer Price" hi="ऑफ़र मूल्य" />:</span>
                    <span className="font-serif text-3xl font-bold"><span className="gold-text">{inr(svc.pricePaise)}</span></span>
                  </div>
                  <p className="text-xs text-muted-foreground"><Bi en="incl. 18% GST · secure payment by Cashfree" hi="18% GST सहित · Cashfree द्वारा सुरक्षित भुगतान" /></p>
                </div>
              );
            })()
          ) : (
            <div>
              <p className="font-serif text-xl font-semibold text-gold"><Bi en="Price on request" hi="मूल्य पूछताछ पर" /></p>
              <p className="text-xs text-muted-foreground"><Bi en="Send an enquiry for the fee" hi="शुल्क जानने के लिए पूछताछ भेजें" /></p>
            </div>
          )}
        </div>
        <BookService svc={svc} className="min-w-[180px]" />
      </div>
    </div>
  );
  return (
    <div className="container max-w-6xl space-y-12 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(ld) }} />
      <nav aria-labelledby="bc-label" className="text-xs text-muted-foreground"><span id="bc-label" className="sr-only"><Bi en="Breadcrumb" hi="पथ" /></span><Link href="/" className="hover:text-foreground"><Bi en="Home" hi="होम" /></Link> / <Link href="/services" className="hover:text-foreground"><Bi en="Services" hi="सेवाएँ" /></Link> / <Bi en={page.h1.en} hi={page.h1.hi} /></nav>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <header className="mk-rise space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en={`By ${EXPERT.name} · 15+ years`} hi="आचार्य नंदराम द्वारा · 15+ वर्ष" /></p>
          <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text"><Bi en={page.h1.en} hi={page.h1.hi} /></span></h1>
          <BiBlock className="space-y-3" en={page.intro.en.map((x) => <p key={x} className="text-lg text-muted-foreground">{x}</p>)} hi={page.intro.hi.map((x) => <p key={x} className="text-lg text-muted-foreground">{x}</p>)} />
        </header>
        <div className="lg:sticky lg:top-24 lg:self-start">{offer}</div>
      </div>
      <ServiceReturnBanner />

      {page.calculator && (
        <section aria-labelledby="calc-h" className="space-y-4">
          <h2 id="calc-h" className="font-cinzel text-2xl font-bold sm:text-3xl"><Bi en={page.calculator.title.en} hi={page.calculator.title.hi} /></h2>
          <Calculator kind={page.calculator.kind} />
        </section>
      )}

      <section aria-labelledby="who-h" className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-2xl border border-gold/20 p-6"><h2 id="who-h" className="mb-3 flex items-center gap-2 font-cinzel text-2xl font-bold"><Users className="h-5 w-5 text-gold" /><Bi en="Who It Is For" hi="यह किनके लिए है" /></h2>
          <BiBlock en={<ul className="space-y-2">{page.forWho.en.map((x) => <li key={x} className="flex gap-2 text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>)}</ul>} hi={<ul className="space-y-2">{page.forWho.hi.map((x) => <li key={x} className="flex gap-2 text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>)}</ul>} /></div>
        <div className="glass rounded-2xl border border-gold/20 p-6"><h2 className="mb-3 font-cinzel text-2xl font-bold"><Bi en="How It Works" hi="प्रक्रिया" /></h2>
          <ol className="space-y-3">{STEPS.map((s, i) => <li key={s.en} className="flex items-center gap-3"><span className="gold-text w-6 font-cinzel text-2xl font-bold">{i + 1}</span><s.icon className="h-4 w-4 text-gold" /><Bi en={s.en} hi={s.hi} /></li>)}</ol></div>
      </section>

      <section aria-labelledby="faq-h" className="mx-auto max-w-3xl space-y-3">
        <h2 id="faq-h" className="text-center font-cinzel text-3xl font-bold"><Bi en="Frequently Asked Questions" hi="अक्सर पूछे जाने वाले प्रश्न" /></h2>
        {page.faq.map((f) => <details key={f.en[0]} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium"><Bi en={f.en[0]} hi={f.hi[0]} /></summary><p className="mt-2 text-sm text-muted-foreground"><Bi en={f.en[1]} hi={f.hi[1]} /></p></details>)}
      </section>

      {offer && <div className="mx-auto max-w-2xl">{offer}</div>}
      <AcharyaProfile />

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold"><Bi en="Related" hi="संबंधित" /></h2>
        <div className="flex flex-wrap gap-2">{page.related.map((r) => <Link key={r.href} href={r.href} className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-3 py-1.5 text-sm hover:bg-gold/10"><Bi en={r.label.en} hi={r.label.hi} /> <ArrowRight className="h-3 w-3" /></Link>)}</div>
        <h3 className="pt-2 font-serif text-lg font-semibold"><Bi en="Other services" hi="अन्य सेवाएँ" /></h3>
        <div className="flex flex-wrap gap-2">{others.map((o) => <Link key={o.slug} href={`/${o.slug}`} className="rounded-full border border-gold/25 px-3 py-1 text-sm hover:bg-gold/10"><Bi en={o.menu.en} hi={o.menu.hi} /></Link>)}<Link href="/services" className="px-3 py-1 text-sm text-gold hover:underline"><Bi en="All services & fees →" hi="सभी सेवाएँ और शुल्क →" /></Link></div>
      </section>
      <DisclaimerNote />
    </div>
  );
}

function OfferText({ t }: { t: { name: string; includes: string[]; delivery: string } }) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{t.name}</p>
      <ul className="mt-3 space-y-1.5 text-sm">{t.includes.map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>)}</ul>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 text-gold" />{t.delivery}</p>
    </>
  );
}
