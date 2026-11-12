import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, CreditCard, FileText, Globe2, Languages, MessageCircle, ShieldCheck } from 'lucide-react';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { Bi } from '@/components/i18n/bi';
import { DisclaimerNote } from '@/components/legal/disclaimer-note';
import { EXPERT, SITE_URL, abs, jsonLd } from '@/lib/seo/site';

const TITLE = 'Online Numerologist for NRIs & Clients Abroad';
const DESC = 'Indian numerology consultation online from the USA, UK, Canada, UAE, Australia or anywhere: reports, name correction and lucky numbers by Acharya Nandram, payable in US dollars.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/international-numerology' },
  keywords: ['numerologist for NRI', 'online numerologist USA', 'Indian numerologist UK', 'numerology consultation Canada', 'numerologist Dubai', 'Vedic numerology online', 'name correction numerology online', 'Acharya Nandram'],
  openGraph: { title: TITLE, description: DESC, url: '/international-numerology', type: 'website', locale: 'en_US', alternateLocale: ['en_IN', 'en_GB', 'hi_IN'] },
};

const COUNTRIES: [string, string, string][] = [
  ['🇺🇸', 'USA', 'अमेरिका'], ['🇬🇧', 'United Kingdom', 'ब्रिटेन'], ['🇨🇦', 'Canada', 'कनाडा'], ['🇦🇪', 'UAE & Gulf', 'यूएई और खाड़ी देश'],
  ['🇦🇺', 'Australia', 'ऑस्ट्रेलिया'], ['🇳🇿', 'New Zealand', 'न्यूज़ीलैंड'], ['🇸🇬', 'Singapore', 'सिंगापुर'], ['🌍', 'Europe & rest of the world', 'यूरोप और बाकी दुनिया'],
];
const SERVED = ['US', 'GB', 'CA', 'AE', 'AU', 'NZ', 'SG', 'SA', 'QA', 'KW', 'OM', 'DE', 'NL', 'IE', 'MY', 'HK'];

const WHY = [
  { icon: Globe2, en: ['100% online, from anywhere', 'Share your details on the website and pay online. Reports are downloaded from your dashboard; personal services are delivered by email and WhatsApp. No visit needed.'], hi: ['पूरी तरह ऑनलाइन, कहीं से भी', 'वेबसाइट पर विवरण दें और ऑनलाइन भुगतान करें। रिपोर्ट आपके डैशबोर्ड से डाउनलोड होती है; व्यक्तिगत सेवाएँ ईमेल और WhatsApp पर मिलती हैं। आने की ज़रूरत नहीं।'] },
  { icon: CreditCard, en: ['Prices in US dollars', 'Visitors outside India see plans and services in $ and pay by international debit or credit card through Cashfree Payments.'], hi: ['अमेरिकी डॉलर में मूल्य', 'भारत के बाहर के विज़िटर प्लान और सेवाएँ $ में देखते हैं और Cashfree Payments द्वारा अंतरराष्ट्रीय डेबिट या क्रेडिट कार्ड से भुगतान करते हैं।'] },
  { icon: Clock, en: ['Your time zone', 'Report times are shown in your own local time. Reports are prepared between 8 am and 10 pm India time (IST, UTC+5:30).'], hi: ['आपका समय क्षेत्र', 'रिपोर्ट का समय आपके स्थानीय समय में दिखाया जाता है। रिपोर्ट भारतीय समय (IST, UTC+5:30) सुबह 8 से रात 10 बजे के बीच तैयार होती हैं।'] },
  { icon: Languages, en: ['English, Hindi or Hinglish', 'Clear explanations your whole family can read – including children who grew up abroad.'], hi: ['अंग्रेज़ी, हिंदी या हिंग्लिश', 'स्पष्ट व्याख्या जिसे आपका पूरा परिवार पढ़ सके – विदेश में पले-बढ़े बच्चे भी।'] },
  { icon: FileText, en: ['Works with foreign names & numbers', 'Chaldean name analysis works for any name written in English letters. Foreign mobile numbers can be analysed through the personal Mobile Number Numerology service.'], hi: ['विदेशी नाम और नंबर के साथ भी', 'अंग्रेज़ी अक्षरों में लिखे किसी भी नाम के लिए कैल्डियन नाम विश्लेषण। विदेशी मोबाइल नंबर का विश्लेषण व्यक्तिगत मोबाइल नंबर अंक ज्योतिष सेवा द्वारा किया जा सकता है।'] },
  { icon: ShieldCheck, en: ['Private and secure', 'Your date of birth and other details are encrypted and used only for your analysis. See our privacy policy.'], hi: ['निजी और सुरक्षित', 'आपकी जन्म तिथि और अन्य विवरण एन्क्रिप्ट किए जाते हैं और केवल आपके विश्लेषण के लिए उपयोग होते हैं। हमारी गोपनीयता नीति देखें।'] },
];

const STEPS = [
  { en: ['Try a free reading', 'Enter your name and date of birth for an instant on-screen reading – Moolank, Bhagyank, Lo Shu grid and more.'], hi: ['मुफ़्त रीडिंग आज़माएँ', 'तुरंत स्क्रीन पर रीडिंग के लिए अपना नाम और जन्म तिथि दर्ज करें – मूलांक, भाग्यांक, लो शू ग्रिड और अधिक।'] },
  { en: ['Choose a report or service', 'A Complete Life Report PDF, or a personal service such as name correction, baby name or couple compatibility.'], hi: ['रिपोर्ट या सेवा चुनें', 'संपूर्ण जीवन रिपोर्ट PDF, या नाम सुधार, शिशु नाम या दंपति मिलान जैसी व्यक्तिगत सेवा।'] },
  { en: ['Pay in dollars, receive online', 'Pay by international card. Download your report from your dashboard, or receive your personal analysis by email and WhatsApp – with an invoice in USD.'], hi: ['डॉलर में भुगतान, ऑनलाइन प्राप्त करें', 'अंतरराष्ट्रीय कार्ड से भुगतान करें। रिपोर्ट अपने डैशबोर्ड से डाउनलोड करें, या व्यक्तिगत विश्लेषण ईमेल और WhatsApp पर पाएँ – USD इनवॉइस के साथ।'] },
];

const FAQ: { en: [string, string]; hi: [string, string] }[] = [
  { en: ['Can I consult an Indian numerologist from the USA, UK or Canada?', 'Yes. Everything is online: you enter your details on the website, pay by international card, then download your report from your dashboard or receive your personal analysis by email and WhatsApp.'], hi: ['क्या मैं अमेरिका, ब्रिटेन या कनाडा से भारतीय अंक ज्योतिषी से परामर्श ले सकता हूँ?', 'हाँ। सब कुछ ऑनलाइन है: वेबसाइट पर विवरण दें, अंतरराष्ट्रीय कार्ड से भुगतान करें, फिर रिपोर्ट डैशबोर्ड से डाउनलोड करें या व्यक्तिगत विश्लेषण ईमेल व WhatsApp पर पाएँ।'] },
  { en: ['Which time zone is used for my numerology?', 'Numerology uses your calendar date of birth as written on your birth certificate, so the country you were born in does not change Moolank or Bhagyank. If you know your time and place of birth, add them for services that ask for it.'], hi: ['मेरे अंक ज्योतिष के लिए कौन-सा समय क्षेत्र उपयोग होता है?', 'अंक ज्योतिष आपके जन्म प्रमाणपत्र पर लिखी कैलेंडर जन्म तिथि का उपयोग करता है, इसलिए जन्म का देश मूलांक या भाग्यांक नहीं बदलता। जिन सेवाओं में जन्म समय और स्थान पूछा जाता है, वहाँ उन्हें जोड़ें।'] },
  { en: ['Do you analyse non-Indian names and foreign phone numbers?', 'Yes. Name numerology uses the Chaldean values of English letters, which work for any name. The free mobile calculator currently takes Indian 10-digit numbers; for a number from another country, book the personal Mobile Number Numerology service.'], hi: ['क्या आप गैर-भारतीय नाम और विदेशी फ़ोन नंबर का विश्लेषण करते हैं?', 'हाँ। नाम अंक ज्योतिष अंग्रेज़ी अक्षरों के कैल्डियन मानों का उपयोग करता है, जो किसी भी नाम पर लागू होते हैं। मुफ़्त मोबाइल कैलकुलेटर अभी भारतीय 10-अंकीय नंबर लेता है; दूसरे देश के नंबर के लिए व्यक्तिगत मोबाइल नंबर अंक ज्योतिष सेवा बुक करें।'] },
  { en: ['How do I pay from outside India?', 'Prices are shown in US dollars when you visit from outside India. You pay by international debit or credit card through Cashfree Payments and receive an invoice in USD. You can switch between ₹ and $ on the pricing page.'], hi: ['भारत के बाहर से भुगतान कैसे करें?', 'भारत के बाहर से आने पर मूल्य अमेरिकी डॉलर में दिखते हैं। आप Cashfree Payments द्वारा अंतरराष्ट्रीय डेबिट या क्रेडिट कार्ड से भुगतान करते हैं और USD में इनवॉइस पाते हैं। मूल्य पेज पर ₹ और $ के बीच बदल सकते हैं।'] },
  { en: ['When will I receive my report?', 'A Complete Life Report is usually ready about 2 hours after you submit it, within India working hours (8 am – 10 pm IST). The expected time is shown in your own local time. Personal services follow the delivery time shown on each service.'], hi: ['मेरी रिपोर्ट कब मिलेगी?', 'संपूर्ण जीवन रिपोर्ट आमतौर पर जमा करने के लगभग 2 घंटे बाद, भारतीय कार्य-समय (सुबह 8 – रात 10 बजे IST) में तैयार हो जाती है। अपेक्षित समय आपके स्थानीय समय में दिखाया जाता है। व्यक्तिगत सेवाओं का डिलीवरी समय हर सेवा पर लिखा है।'] },
];

export default function InternationalPage() {
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Service', name: 'Online numerology consultation for international clients', serviceType: 'Numerology consultation',
      provider: { '@id': `${SITE_URL}/#expert` }, brand: { '@id': `${SITE_URL}/#org` }, url: abs('/international-numerology'), description: DESC,
      areaServed: SERVED.map((c) => ({ '@type': 'Country', name: c })), availableChannel: { '@type': 'ServiceChannel', serviceUrl: abs('/international-numerology'), availableLanguage: ['English', 'Hindi'] } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.en[0], acceptedAnswer: { '@type': 'Answer', text: f.en[1] } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', item: abs('/') }, { name: 'International clients', item: abs('/international-numerology') }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, ...x })) },
  ];
  return (
    <div className="container max-w-5xl space-y-14 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <nav aria-labelledby="bc-int" className="text-xs text-muted-foreground"><span id="bc-int" className="sr-only"><Bi en="Breadcrumb" hi="पथ" /></span><Link href="/" className="hover:text-foreground"><Bi en="Home" hi="होम" /></Link> / <Bi en="International clients" hi="अंतरराष्ट्रीय क्लाइंट" /></nav>

      <header className="mk-rise mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="NRIs & clients worldwide" hi="एनआरआई और दुनिया भर के क्लाइंट" /></p>
        <h1 className="text-4xl font-bold sm:text-5xl"><span className="gold-text"><Bi en="Indian Numerology, Wherever You Live" hi="भारतीय अंक ज्योतिष, आप जहाँ भी रहें" /></span></h1>
        <p className="text-muted-foreground"><Bi en={`Vedic, Chaldean and Lo Shu numerology by ${EXPERT.name}, with more than 15 years of practice – fully online, in English or Hindi, with prices in US dollars for clients outside India.`} hi={`आचार्य नंदराम द्वारा वैदिक, कैल्डियन और लो शू अंक ज्योतिष, 15+ वर्षों का अनुभव – पूरी तरह ऑनलाइन, अंग्रेज़ी या हिंदी में, भारत के बाहर के क्लाइंट के लिए अमेरिकी डॉलर में मूल्य।`} /></p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/reading" className="cz-btn cz-btn-primary"><Bi en="Start my free reading" hi="मेरी मुफ़्त रीडिंग शुरू करें" /> <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/pricing" className="cz-btn cz-btn-ghost"><Bi en="See prices in $" hi="$ में मूल्य देखें" /></Link>
        </div>
      </header>

      <section aria-labelledby="int-countries" className="space-y-4">
        <h2 id="int-countries" className="text-center font-serif text-2xl font-semibold"><Bi en="Clients we serve online" hi="जिन देशों के क्लाइंट को हम ऑनलाइन सेवा देते हैं" /></h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COUNTRIES.map(([flag, en, hi]) => <li key={en} className="mk-card glass flex items-center gap-2 rounded-xl border border-gold/20 p-3 text-sm"><span aria-hidden className="text-xl">{flag}</span><Bi en={en} hi={hi} /></li>)}
        </ul>
      </section>

      <section aria-labelledby="int-why" className="space-y-5">
        <h2 id="int-why" className="text-center font-serif text-2xl font-semibold"><Bi en="Made for clients outside India" hi="भारत के बाहर के क्लाइंट के लिए बनाया गया" /></h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((w) => (
            <div key={w.en[0]} className="mk-card glass rounded-xl border border-gold/20 p-5">
              <w.icon className="h-6 w-6 text-gold" aria-hidden />
              <h3 className="mt-2 font-semibold"><Bi en={w.en[0]} hi={w.hi[0]} /></h3>
              <p className="mt-1 text-sm text-muted-foreground"><Bi en={w.en[1]} hi={w.hi[1]} /></p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="int-how" className="space-y-5">
        <h2 id="int-how" className="text-center font-serif text-2xl font-semibold"><Bi en="How it works" hi="यह कैसे काम करता है" /></h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.en[0]} className="glass rounded-xl border border-gold/20 p-5">
              <span className="font-cinzel text-3xl font-bold text-gold">{i + 1}</span>
              <h3 className="mt-1 font-semibold"><Bi en={s.en[0]} hi={s.hi[0]} /></h3>
              <p className="mt-1 text-sm text-muted-foreground"><Bi en={s.en[1]} hi={s.hi[1]} /></p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/services" className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-4 py-2 text-sm hover:bg-gold/10"><Bi en="Personal services" hi="व्यक्तिगत सेवाएँ" /> <ArrowRight className="h-3.5 w-3.5" /></Link>
          <Link href="/calculators" className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-4 py-2 text-sm hover:bg-gold/10"><Bi en="Free calculators" hi="मुफ़्त कैलकुलेटर" /> <ArrowRight className="h-3.5 w-3.5" /></Link>
          <Link href="/contact?topic=service" className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-4 py-2 text-sm hover:bg-gold/10"><MessageCircle className="h-3.5 w-3.5" /> <Bi en="Ask a question" hi="प्रश्न पूछें" /></Link>
        </div>
      </section>

      <AcharyaProfile />

      <section aria-labelledby="int-faq" className="mx-auto max-w-3xl space-y-3">
        <h2 id="int-faq" className="text-center font-serif text-2xl font-semibold"><Bi en="Questions from international clients" hi="अंतरराष्ट्रीय क्लाइंट के प्रश्न" /></h2>
        {FAQ.map((f) => <details key={f.en[0]} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium"><Bi en={f.en[0]} hi={f.hi[0]} /></summary><p className="mt-2 text-sm text-muted-foreground"><Bi en={f.en[1]} hi={f.hi[1]} /></p></details>)}
      </section>

      <DisclaimerNote />
    </div>
  );
}
