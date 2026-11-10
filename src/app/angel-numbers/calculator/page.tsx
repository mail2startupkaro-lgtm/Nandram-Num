import type { Metadata } from 'next';
import { jsonLd as toLd } from '@/lib/seo/site';
import Link from 'next/link';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { AngelCta } from '@/components/angel/angel-parts';
import { AngelCalculator } from '@/components/angel/angel-calculator';
import { TOP_ANGEL } from '@/lib/angel/generate';
import { Bi } from '@/components/i18n/bi';

export const metadata: Metadata = {
  title: 'Angel Number Calculator – Find Your Angel Number by Date of Birth',
  description: 'Free angel number calculator: find your life path, Mulank, birthday and personal year angel numbers from your date of birth, check any angel number\'s compatibility with your DOB, and get your couple angel number.',
  keywords: ['angel number calculator', 'find my angel number', 'birthday angel number', 'my angel number', 'angel number by date of birth', 'angel number compatibility', 'couple angel number'],
  alternates: { canonical: '/angel-numbers/calculator' },
};

const FAQS = [
  { q: 'How is my angel number calculated from my date of birth?', a: 'We add every digit of your date of birth (DD-MM-YYYY) to get your Bhagyank, also called life path number. Repeating it three times gives your life path angel number, e.g. Bhagyank 4 → 444. Master numbers 11, 22 and 33 give 1111, 2222 and 3333.' },
  { q: 'What is a birthday angel number?', a: 'Your birthday angel number is your day of birth mirrored, for example the 7th gives 0707 and the 23rd gives 2323. It often shows up on clocks as a personal sign.' },
  { q: 'How does the compatibility score work?', a: 'The angel number is reduced to its root digit and compared with your Bhagyank and Mulank using the traditional friendly, neutral and enemy number table. Digits you share with the number add to the score.' },
  { q: 'What if my compatibility score is low?', a: 'A low score does not make the number bad. It means its message is a lesson for you rather than a natural strength. A full reading explains how to work with it.' },
];

const FAQS_HI = [
  { q: 'मेरी जन्म तिथि से मेरा एंजेल नंबर कैसे निकाला जाता है?', a: 'हम आपकी जन्म तिथि (DD-MM-YYYY) के सभी अंक जोड़कर भाग्यांक निकालते हैं, जिसे जीवन-पथ अंक भी कहते हैं। उसे तीन बार दोहराने पर आपका जीवन-पथ एंजेल नंबर बनता है, जैसे भाग्यांक 4 → 444। मास्टर नंबर 11, 22 और 33 से 1111, 2222 और 3333 बनते हैं।' },
  { q: 'जन्मदिन एंजेल नंबर क्या है?', a: 'आपका जन्मदिन एंजेल नंबर आपकी जन्म तारीख़ को दोहराकर बनता है, जैसे 7 तारीख़ से 0707 और 23 तारीख़ से 2323। यह अक्सर घड़ी पर एक व्यक्तिगत संकेत के रूप में दिखता है।' },
  { q: 'अनुकूलता स्कोर कैसे निकलता है?', a: 'एंजेल नंबर को घटाकर उसका मूल अंक निकाला जाता है और पारंपरिक मित्र, सम और शत्रु अंक तालिका से आपके भाग्यांक व मूलांक से मिलाया जाता है। जो अंक आपके और उस नंबर में समान हैं, वे स्कोर बढ़ाते हैं।' },
  { q: 'यदि मेरा अनुकूलता स्कोर कम हो तो?', a: 'कम स्कोर का अर्थ यह नहीं कि अंक बुरा है। इसका अर्थ है कि उसका संदेश आपके लिए स्वाभाविक शक्ति नहीं, बल्कि एक सबक है। पूरी रीडिंग बताती है कि उसके साथ कैसे काम करें।' },
];

export default function AngelCalculatorPage() {
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Angel Number Calculator', applicationCategory: 'LifestyleApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, author: { '@type': 'Person', name: 'Acharya Nandram' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
  return (
    <div className="container max-w-5xl space-y-10 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(jsonLd) }} />
      <nav aria-labelledby="bc-label" className="text-xs text-muted-foreground"><span id="bc-label" className="sr-only"><Bi en="Breadcrumb" hi="पथ" /></span><Link href="/" className="hover:text-foreground"><Bi en="Home" hi="होम" /></Link> / <Link href="/angel-numbers" className="hover:text-foreground"><Bi en="Angel Numbers" hi="एंजेल नंबर" /></Link> / <Bi en="Calculator" hi="कैलकुलेटर" /></nav>
      <header className="text-center">
        <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text"><Bi en="Angel Number Calculator" hi="एंजेल नंबर कैलकुलेटर" /></span></h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground"><Bi en="Find your personal angel numbers from your date of birth, check the number you keep seeing, or discover your couple angel number." hi="अपनी जन्म तिथि से अपने व्यक्तिगत एंजेल नंबर जानें, बार-बार दिखने वाले अंक की जाँच करें, या अपनी जोड़ी का एंजेल नंबर खोजें।" /></p>
      </header>
      <AngelCalculator />
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold"><Bi en="Popular Angel Numbers" hi="लोकप्रिय एंजेल नंबर" /></h2>
        <div className="flex flex-wrap gap-2">{TOP_ANGEL.slice(0, 30).map((n) => <Link key={n} href={`/angel-numbers/${n}`} className="rounded-full border border-gold/40 px-4 py-1.5 font-cinzel text-sm font-semibold hover:bg-gold/10">{n}</Link>)}<Link href="/angel-numbers#all" className="px-3 py-1.5 text-sm text-gold hover:underline"><Bi en="All numbers →" hi="सभी अंक →" /></Link></div>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold"><Bi en="How the Angel Number Calculator Works" hi="एंजेल नंबर कैलकुलेटर कैसे काम करता है" /></h2>
        {FAQS.map((f, i) => <details key={f.q} className="glass rounded-lg p-4" open={i === 0}><summary className="cursor-pointer font-medium"><Bi en={f.q} hi={FAQS_HI[i].q} /></summary><p className="mt-2 text-sm text-muted-foreground"><Bi en={f.a} hi={FAQS_HI[i].a} /></p></details>)}
      </section>
      <AngelCta variant="big" />
      <AcharyaProfile />
    </div>
  );
}
