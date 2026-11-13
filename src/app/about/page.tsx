import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Award, BookOpen, Calculator, FileText, Heart, Languages, ShieldCheck, Sparkles } from 'lucide-react';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { Bi } from '@/components/i18n/bi';
import { EXPERT, SITE_URL, abs, jsonLd as toLd } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'About Acharya Nandram – Numerologist (15+ Years)',
  description: 'Acharya Nandram is an Indian numerologist with more than 15 years of experience in Vedic, Chaldean and Lo Shu numerology. His method, services and approach.',
  alternates: { canonical: '/about' },
  openGraph: { title: 'About Acharya Nandram – Numerologist', description: 'More than 15 years of Vedic, Chaldean and Lo Shu numerology.', url: '/about', type: 'profile', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Acharya Nandram, numerologist' }] },
};

const METHOD = [
  { icon: Calculator, en: ['Exact, traditional calculations', 'Moolank and Bhagyank from the date of birth, Chaldean values for names and mobile numbers, the Lo Shu grid and Kua – calculated the same way every time.'], hi: ['सटीक, पारंपरिक गणना', 'जन्म तिथि से मूलांक और भाग्यांक, नाम व मोबाइल नंबर के लिए कैल्डियन मान, लो शू ग्रिड और कुआ – हर बार एक ही विधि से।'] },
  { icon: BookOpen, en: ['Every number read together', 'A single number never decides your life. Date of birth, name, mobile and partner numbers are read as one chart.'], hi: ['सभी अंक एक साथ', 'कोई एक अंक आपका जीवन तय नहीं करता। जन्म तिथि, नाम, मोबाइल और जीवनसाथी के अंक एक ही चार्ट के रूप में पढ़े जाते हैं।'] },
  { icon: Heart, en: ['Guidance, not fear', 'Practical remedies – colours, days, name spelling, habits – without frightening predictions or expensive rituals.'], hi: ['डर नहीं, मार्गदर्शन', 'व्यावहारिक उपाय – रंग, दिन, नाम-वर्तनी, आदतें – बिना डराने वाली भविष्यवाणियों या महँगे अनुष्ठानों के।'] },
  { icon: Languages, en: ['Your language', 'Explanations in plain English, Hindi or Hinglish that the whole family can read.'], hi: ['आपकी भाषा में', 'सरल अंग्रेज़ी, हिंदी या हिंग्लिश में व्याख्या, जिसे पूरा परिवार पढ़ सके।'] },
];

const WORK = [
  { href: '/services', icon: Sparkles, en: ['Personal services', 'Personal report, name correction, lucky mobile number and baby name – prepared by Acharya Nandram himself.'], hi: ['व्यक्तिगत सेवाएँ', 'व्यक्तिगत रिपोर्ट, नाम सुधार, शुभ मोबाइल नंबर और शिशु नाम – स्वयं आचार्य नंदराम द्वारा तैयार।'] },
  { href: '/pricing', icon: FileText, en: ['Complete Life Report', 'A designed Complete Life Report PDF based on his method, ready about 2 hours after you submit your details.'], hi: ['संपूर्ण जीवन रिपोर्ट', 'उनकी विधि पर आधारित डिज़ाइन की हुई संपूर्ण जीवन रिपोर्ट PDF, विवरण जमा करने के लगभग 2 घंटे बाद तैयार।'] },
  { href: '/calculators', icon: Calculator, en: ['Free calculators', 'Moolank, Bhagyank, Lo Shu grid, name, mobile, Kua, personal year, vehicle and house number.'], hi: ['मुफ़्त कैलकुलेटर', 'मूलांक, भाग्यांक, लो शू ग्रिड, नाम, मोबाइल, कुआ, व्यक्तिगत वर्ष, वाहन और मकान नंबर।'] },
  { href: '/blog', icon: BookOpen, en: ['Guides & articles', 'Complete guides to Mulank and Bhagyank 1–9, angel numbers and more.'], hi: ['मार्गदर्शिकाएँ और लेख', 'मूलांक और भाग्यांक 1–9, एंजेल नंबर और बहुत कुछ की संपूर्ण मार्गदर्शिकाएँ।'] },
];

export default function AboutPage() {
  const ld = [
    { '@context': 'https://schema.org', '@type': 'ProfilePage', url: abs('/about'), name: `About ${EXPERT.name}`,
      mainEntity: { '@type': 'Person', '@id': `${SITE_URL}/#expert`, name: EXPERT.name, jobTitle: EXPERT.jobTitle, description: EXPERT.description, image: abs('/images/acharya-nandram.png'), knowsAbout: EXPERT.knowsAbout, knowsLanguage: ['en', 'hi'], url: abs('/about'), worksFor: { '@id': `${SITE_URL}/#org` } } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') }, { '@type': 'ListItem', position: 2, name: 'About', item: abs('/about') }] },
  ];
  return (
    <div className="container max-w-5xl space-y-14 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(ld) }} />
      <header className="grid items-center gap-8 md:grid-cols-[220px_1fr]">
        <div className="relative mx-auto h-52 w-52">
          <span className="mk-spin absolute inset-0 rounded-full border border-dashed border-gold/60" />
          <span className="mk-spin-rev absolute inset-4 rounded-full border border-gold/30" />
          <div className="absolute inset-7 overflow-hidden rounded-full border border-gold/40 bg-gradient-to-br from-[#2a0e1b] via-[#1a0b12] to-[#24130a] shadow-[0_0_25px_hsl(var(--gold)/0.3)]">
            <Image
              src="/images/acharya-nandram.png"
              alt="Acharya Nandram – Numerologist"
              width={208}
              height={208}
              priority
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>
        <div className="mk-rise space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="About the numerologist" hi="अंक ज्योतिषी के बारे में" /></p>
          <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text"><Bi en="Acharya Nandram" hi="आचार्य नंदराम" /></span></h1>
          <p className="inline-flex items-center gap-2 rounded-md bg-gold/15 px-3 py-1 text-sm font-semibold text-gold"><Award className="h-4 w-4" /><Bi en="Numerologist · Experience: 15+ Years" hi="अंक ज्योतिषी · अनुभव: 15+ वर्ष" /></p>
          <p className="text-lg text-muted-foreground"><Bi en="For more than 15 years Acharya Nandram has practised Vedic, Chaldean and Lo Shu grid numerology, guiding thousands of individuals and families towards clarity, success and prosperity through precise number vibrations and personal remedies." hi="15 वर्षों से अधिक समय से आचार्य नंदराम वैदिक, कैल्डियन और लो शू ग्रिड अंक ज्योतिष का अभ्यास कर रहे हैं और सटीक अंक-कंपन तथा व्यक्तिगत उपायों के माध्यम से हज़ारों व्यक्तियों और परिवारों को स्पष्टता, सफलता और समृद्धि की राह दिखा चुके हैं।" /></p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/services" className="inline-flex h-11 items-center gap-2 rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-5 font-semibold text-[hsl(250_45%_10%)]"><Sparkles className="h-4 w-4" /><Bi en="See services & fees" hi="सेवाएँ और शुल्क देखें" /></Link>
            <Link href="/contact" className="inline-flex h-11 items-center rounded-md border border-gold/50 px-5 hover:bg-gold/10"><Bi en="Contact" hi="संपर्क करें" /></Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="method-h" className="space-y-5">
        <h2 id="method-h" className="font-cinzel text-3xl font-bold"><Bi en="His Method" hi="उनकी पद्धति" /></h2>
        <div className="grid gap-4 sm:grid-cols-2">{METHOD.map((m) => <div key={m.en[0]} className="glass rounded-xl border border-gold/20 p-5"><m.icon className="h-5 w-5 text-gold" /><h3 className="mt-2 font-semibold"><Bi en={m.en[0]} hi={m.hi[0]} /></h3><p className="mt-1 text-sm text-muted-foreground"><Bi en={m.en[1]} hi={m.hi[1]} /></p></div>)}</div>
      </section>

      <AcharyaProfile />

      <section aria-labelledby="work-h" className="space-y-5">
        <h2 id="work-h" className="font-cinzel text-3xl font-bold"><Bi en="Work With Acharya Nandram" hi="आचार्य नंदराम के साथ काम करें" /></h2>
        <div className="grid gap-4 sm:grid-cols-2">{WORK.map((w) => <Link key={w.href} href={w.href} className="mk-card glass rounded-xl border border-gold/25 p-5"><w.icon className="h-5 w-5 text-gold" /><h3 className="mt-2 font-semibold"><Bi en={w.en[0]} hi={w.hi[0]} /></h3><p className="mt-1 text-sm text-muted-foreground"><Bi en={w.en[1]} hi={w.hi[1]} /></p></Link>)}</div>
      </section>

      <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><Bi en="Numerology offers guidance based on traditional methods. It is not a substitute for professional medical, legal or financial advice." hi="अंक ज्योतिष पारंपरिक विधियों पर आधारित मार्गदर्शन देता है। यह चिकित्सा, कानूनी या वित्तीय पेशेवर सलाह का विकल्प नहीं है।" /></p>
    </div>
  );
}
