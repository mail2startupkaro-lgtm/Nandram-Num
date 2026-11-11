import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AcharyaProfile, BlogCta } from '@/components/blog/blog-parts';
import { BlogExplorer } from '@/components/blog/blog-explorer';
import { CITIES, STATES } from '@/lib/blog/cities';
import { ALIAS_HI, cityHi, stateHi } from '@/lib/blog/cities-hi';
import { Bi } from '@/components/i18n/bi';
import { numberPostSlug } from '@/lib/blog/numbers';
import { mulankFor } from '@/lib/mulank-data';
import { bhagyankFor } from '@/lib/bhagyank-data';

export const metadata: Metadata = {
  title: 'Numerology Blog: Mulank, Bhagyank & City Guides',
  description: 'Complete Mulank 1–9 and Bhagyank 1–9 guides with career, marriage, lucky colours and remedies, plus numerology guides for 500+ Indian cities, by Acharya Nandram.',
  alternates: { canonical: '/blog' },
};

export default function BlogHome() {
  const lite = CITIES.map(({ slug, name, state, tier, alias }) => ({ slug, name, state, tier, alias, nameHi: cityHi(name), stateHi: stateHi(state), aliasHi: alias ? ALIAS_HI[alias] : undefined }));
  const t = [1, 2, 3].map((n) => CITIES.filter((c) => c.tier === n).length);
  const featured = ['mumbai', 'delhi', 'bengaluru', 'pune', 'hyderabad', 'chennai', 'kolkata', 'ahmedabad'].map((s) => CITIES.find((c) => c.slug === s)!).filter(Boolean);
  return (
    <div className="container max-w-6xl space-y-10 py-10 sm:py-14">
      <header className="mk-rise space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="Numerology blog · City guides" hi="अंक ज्योतिष ब्लॉग · शहर मार्गदर्शिकाएँ" /></p>
        <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text"><Bi en="Best Numerologist in Your City" hi="आपके शहर में सबसे अच्छे अंक ज्योतिषी" /></span></h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground"><Bi en={`City-wise guides for ${CITIES.length}+ cities across ${Object.keys(STATES).length} states and union territories, written to help you understand numerology and consult Acharya Nandram online.`} hi={`${Object.keys(STATES).length} राज्यों और केंद्र शासित प्रदेशों के ${CITIES.length}+ शहरों के लिए शहर-वार मार्गदर्शिकाएँ, जो अंक ज्योतिष को समझने और आचार्य नंदराम से ऑनलाइन परामर्श लेने में मदद करती हैं।`} /></p>
        <div className="mx-auto flex max-w-xl justify-center gap-6 pt-2 text-center">{[[String(t[0]), 'Tier 1 metros', 'टियर 1 महानगर'], [String(t[1]), 'Tier 2 cities', 'टियर 2 शहर'], [String(t[2]), 'Tier 3 cities', 'टियर 3 शहर']].map(([n, l, h]) => <div key={l}><p className="gold-text font-serif text-3xl font-bold">{n}</p><p className="text-xs text-muted-foreground"><Bi en={l} hi={h} /></p></div>)}</div>
      </header>

      <section aria-labelledby="fg-label" className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-maroon/40 via-card/80 to-card/90 p-6 sm:p-8"><span id="fg-label" className="sr-only"><Bi en="Featured guide" hi="विशेष मार्गदर्शिका" /></span>
        <span className="mk-spin pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full border border-dashed border-gold/40" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold"><Bi en="Featured guide" hi="विशेष मार्गदर्शिका" /></p>
        <h2 className="font-cinzel mt-1 text-2xl font-bold sm:text-3xl"><Bi en="Best Numerologist in Mumbai" hi="मुंबई में सबसे अच्छे अंक ज्योतिषी" /></h2>
        <p className="mt-2 max-w-2xl text-muted-foreground"><Bi en="Career, business, name, mobile number and marriage guidance for Mumbai, explained in plain language, with a free reading to start." hi="मुंबई के लिए करियर, व्यवसाय, नाम, मोबाइल नंबर और विवाह का मार्गदर्शन, सरल भाषा में, मुफ़्त रीडिंग के साथ शुरुआत।" /></p>
        <Link href="/blog/best-numerologist-in-mumbai" className="mk-shine mt-4 inline-flex h-11 items-center gap-2 rounded-md border border-gold/60 px-5 font-medium hover:bg-gold/10"><Bi en="Read the Mumbai guide" hi="मुंबई मार्गदर्शिका पढ़ें" /> <ArrowRight className="h-4 w-4" /></Link>
        <div className="mt-5 flex flex-wrap gap-2">{featured.filter((c) => c.slug !== 'mumbai').map((c) => <Link key={c.slug} href={`/blog/best-numerologist-in-${c.slug}`} className="rounded-full border border-gold/40 px-3 py-1 text-sm hover:bg-gold/10"><Bi en={c.name} hi={cityHi(c.name)} /></Link>)}</div>
      </section>

      <section aria-labelledby="ng-label" className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold"><Bi en="Number guides" hi="अंक मार्गदर्शिकाएँ" /></p>
          <h2 id="ng-label" className="font-cinzel mt-1 text-2xl font-bold sm:text-3xl"><Bi en="Mulank & Bhagyank 1–9: Complete Guides" hi="मूलांक और भाग्यांक 1–9: संपूर्ण मार्गदर्शिकाएँ" /></h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground"><Bi en="Personality, career, marriage compatibility, money, lucky colours and remedies for every number, with free calculators to find yours." hi="हर अंक का स्वभाव, करियर, विवाह अनुकूलता, धन, शुभ रंग और उपाय, साथ में अपना अंक जानने के लिए मुफ़्त कैलकुलेटर।" /></p>
        </div>
        {(['mulank', 'bhagyank'] as const).map((kind) => (
          <div key={kind}>
            <h3 className="mb-3 font-serif text-xl font-semibold">{kind === 'mulank' ? <Bi en="Mulank (root number) guides" hi="मूलांक (मूल अंक) मार्गदर्शिकाएँ" /> : <Bi en="Bhagyank (destiny number) guides" hi="भाग्यांक (भाग्य अंक) मार्गदर्शिकाएँ" />}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                const t = (l: 'en' | 'hi') => (kind === 'mulank' ? mulankFor(n, l)! : bhagyankFor(n, l)!);
                return (
                  <Link key={n} href={`/blog/${numberPostSlug(kind, n)}`} className="mk-card glass group flex items-center gap-4 rounded-xl border border-gold/25 p-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a] font-cinzel text-2xl font-bold gold-text">{n}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold group-hover:text-gold"><Bi en={`${kind === 'mulank' ? 'Mulank' : 'Bhagyank'} ${n}: ${t('en').title}`} hi={`${kind === 'mulank' ? 'मूलांक' : 'भाग्यांक'} ${n}: ${t('hi').title}`} /></span>
                      <span className="block text-xs text-muted-foreground"><Bi en={`${t('en').planet} · career, marriage, remedies`} hi={`${t('hi').planet} · करियर, विवाह, उपाय`} /></span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <p className="text-center text-sm"><Link href="/calculators" className="text-gold hover:underline"><Bi en="Find your number with the free calculators →" hi="मुफ़्त कैलकुलेटर से अपना अंक जानें →" /></Link></p>
      </section>

      <BlogExplorer cities={lite} />
      <BlogCta city="your city" cityHi="आपके शहर" variant="big" />
      <AcharyaProfile />
    </div>
  );
}
