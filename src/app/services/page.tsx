import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, FileText, Languages, LockKeyhole, Send, ShieldCheck } from 'lucide-react';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { Bi, BiBlock } from '@/components/i18n/bi';
import { BookService, ServiceReturnBanner, type PublicService } from '@/components/services/book-service';
import { formatInr as inr } from '@/lib/billing/plans';
import { DEFAULT_SERVICES, isPayable, listServices } from '@/lib/billing/services';
import { servicePageByCode } from '@/lib/service-pages';
import type { Service } from '@/lib/db/schema';
import { abs, EXPERT, jsonLd as toLd } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'Numerology Services & Fees – Acharya Nandram',
  description: 'Numerology services by Acharya Nandram: personal report, name, Lo Shu, mobile, baby name, couple, business name and personal year. Pay securely online.',
  alternates: { canonical: '/services' },
  openGraph: { title: 'Numerology Services & Fees – Acharya Nandram', description: 'Personal report, name correction, lucky mobile number and baby name by Acharya Nandram.', url: '/services', type: 'website', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Numerology services by Acharya Nandram' }] },
};
export const revalidate = 300; // prices edited in Admin appear within 5 minutes

async function load(): Promise<PublicService[]> {
  let rows: Service[];
  try { rows = await listServices(); } catch { rows = DEFAULT_SERVICES.map((s) => ({ ...s, mrpPaise: null, priceConfirmed: false, active: true, featured: !!s.featured, sort: s.sort ?? 0, updatedAt: new Date() }) as Service); }
  return rows.map((s) => ({ code: s.code, en: s.en, hi: s.hi, intake: s.intake, payable: isPayable(s), pricePaise: isPayable(s) ? s.pricePaise : null, mrpPaise: isPayable(s) ? s.mrpPaise : null }));
}

const STEPS = [
  { icon: FileText, en: ['Choose a service', 'Pick the service you need and click Book & pay.'], hi: ['सेवा चुनें', 'अपनी ज़रूरत की सेवा चुनें और "बुक करें और भुगतान करें" दबाएँ।'] },
  { icon: LockKeyhole, en: ['Share details & pay', 'Enter the date of birth and names, then pay securely by UPI, card or net banking.'], hi: ['विवरण दें और भुगतान करें', 'जन्म तिथि और नाम दर्ज करें, फिर UPI, कार्ड या नेट बैंकिंग से सुरक्षित भुगतान करें।'] },
  { icon: Clock, en: ['Personal analysis', 'Acharya Nandram studies your numbers himself – no generic copy-paste text.'], hi: ['व्यक्तिगत विश्लेषण', 'आचार्य नंदराम स्वयं आपके अंकों का अध्ययन करते हैं – कोई सामान्य कॉपी-पेस्ट पाठ नहीं।'] },
  { icon: Send, en: ['Delivered to you', 'Your result arrives on email and WhatsApp within the delivery time shown.'], hi: ['आप तक डिलीवरी', 'आपका परिणाम बताए गए समय में ईमेल और WhatsApp पर पहुँचता है।'] },
];

const FAQ: { en: [string, string]; hi: [string, string] }[] = [
  { en: ['How do I pay?', 'Online through Cashfree Payments by UPI, debit or credit card or net banking. Every fee includes 18% GST and you get a GST invoice.'], hi: ['भुगतान कैसे करें?', 'Cashfree Payments के माध्यम से UPI, डेबिट या क्रेडिट कार्ड अथवा नेट बैंकिंग द्वारा ऑनलाइन। हर शुल्क में 18% GST शामिल है और आपको GST इनवॉइस मिलता है।'] },
  { en: ['How will I receive my analysis?', 'On the email and WhatsApp number you give while booking, within the delivery time shown for the service. You can also see the status under My account.'], hi: ['मुझे विश्लेषण कैसे मिलेगा?', 'बुकिंग के समय दिए गए ईमेल और WhatsApp नंबर पर, सेवा के लिए बताए गए समय में। स्थिति "मेरा खाता" में भी देख सकते हैं।'] },
  { en: ['In which language?', 'English, Hindi or Hinglish – mention your choice in the notes.'], hi: ['किस भाषा में?', 'अंग्रेज़ी, हिंदी या हिंग्लिश – अपनी पसंद टिप्पणी में लिखें।'] },
  { en: ['How is this different from the Complete Life Report plans?', 'The Complete Life Report follows a standard format and is ready about 2 hours after you submit it. These services are prepared personally by Acharya Nandram and answer your own questions.'], hi: ['संपूर्ण जीवन रिपोर्ट प्लान से क्या अंतर है?', 'संपूर्ण जीवन रिपोर्ट एक मानक प्रारूप में होती है और जमा करने के लगभग 2 घंटे बाद तैयार होती है। ये सेवाएँ आचार्य नंदराम स्वयं तैयार करते हैं और आपके अपने प्रश्नों के उत्तर देती हैं।'] },
  { en: ['Is my information safe?', 'Yes. Your details are stored encrypted, used only for your analysis and never sold or shared.'], hi: ['क्या मेरी जानकारी सुरक्षित है?', 'हाँ। आपकी जानकारी एन्क्रिप्टेड रखी जाती है, केवल आपके विश्लेषण के लिए उपयोग होती है और कभी बेची या साझा नहीं की जाती।'] },
];

function Card({ s, lang }: { s: PublicService; lang: 'en' | 'hi' }) {
  const t = s[lang];
  return (
    <>
      <h3 className="font-cinzel text-xl font-bold">{t.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t.short}</p>
      <ul className="my-4 space-y-1.5 text-sm">{t.includes.map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>)}</ul>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 text-gold" />{t.delivery}</p>
    </>
  );
}

export default async function ServicesPage() {
  const list = await load();
  const ld = [
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Numerology services by Acharya Nandram', itemListElement: list.map((s, i) => ({ '@type': 'ListItem', position: i + 1,
      item: { '@type': 'Service', name: s.en.name, description: s.en.short, serviceType: 'Numerology consultation', areaServed: 'IN', availableLanguage: ['English', 'Hindi'],
        provider: { '@type': 'Person', name: EXPERT.name, url: abs('/about') },
        ...(s.pricePaise ? { offers: { '@type': 'Offer', price: (s.pricePaise / 100).toFixed(2), priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: abs('/services') } } : {}) } })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.en[0], acceptedAnswer: { '@type': 'Answer', text: f.en[1] } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') }, { '@type': 'ListItem', position: 2, name: 'Services', item: abs('/services') }] },
  ];
  return (
    <div className="container max-w-6xl space-y-14 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(ld) }} />
      <header className="mk-rise space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="Services · Fees · Book online" hi="सेवाएँ · शुल्क · ऑनलाइन बुकिंग" /></p>
        <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text"><Bi en="Numerology Services by Acharya Nandram" hi="आचार्य नंदराम की अंक ज्योतिष सेवाएँ" /></span></h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground"><Bi en="Personal analysis from an experienced numerologist – not an automated printout. Clear fees including GST, secure online payment and delivery to your email and WhatsApp." hi="अनुभवी अंक ज्योतिषी द्वारा व्यक्तिगत विश्लेषण – कोई स्वचालित प्रिंटआउट नहीं। GST सहित स्पष्ट शुल्क, सुरक्षित ऑनलाइन भुगतान और आपके ईमेल व WhatsApp पर डिलीवरी।" /></p>
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          {[[ShieldCheck, 'Secure payment by Cashfree', 'Cashfree द्वारा सुरक्षित भुगतान'], [FileText, 'GST invoice', 'GST इनवॉइस'], [Languages, 'English · हिंदी · Hinglish', 'अंग्रेज़ी · हिंदी · हिंग्लिश'], [LockKeyhole, 'Private & encrypted', 'गोपनीय और एन्क्रिप्टेड']].map(([I, en, hi]) => { const Icon = I as typeof ShieldCheck; return <span key={en as string} className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1"><Icon className="h-3.5 w-3.5 text-gold" /><Bi en={en as string} hi={hi as string} /></span>; })}
        </div>
      </header>

      <ServiceReturnBanner />

      <section aria-labelledby="svc-h" className="space-y-6">
        <h2 id="svc-h" className="sr-only"><Bi en="Services and fees" hi="सेवाएँ और शुल्क" /></h2>
        <div className="grid gap-6 md:grid-cols-2">
          {list.map((s, i) => (
            <article key={s.code} id={s.code.toLowerCase()} style={{ animationDelay: `${i * 80}ms` }} className="mk-rise mk-card glass flex flex-col rounded-2xl border border-gold/30 p-6">
              <BiBlock className="flex-1" en={<Card s={s} lang="en" />} hi={<Card s={s} lang="hi" />} />
              {servicePageByCode(s.code) && <Link href={`/${servicePageByCode(s.code)!.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm text-gold hover:underline"><Bi en="Learn more" hi="और जानें" /> <ArrowRight className="h-3.5 w-3.5" /></Link>}
              <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-border/50 pt-4">
                <div>
                  {s.pricePaise ? (
                    <p className="font-serif text-3xl font-bold"><span className="gold-text">{inr(s.pricePaise)}</span>{s.mrpPaise ? <span className="ml-2 text-base font-normal text-muted-foreground line-through">{inr(s.mrpPaise)}</span> : null}</p>
                  ) : <p className="font-serif text-xl font-semibold text-gold"><Bi en="Price on request" hi="मूल्य पूछताछ पर" /></p>}
                  <p className="text-xs text-muted-foreground"><Bi en={s.pricePaise ? 'incl. 18% GST · one-time' : 'Send an enquiry for the fee'} hi={s.pricePaise ? '18% GST सहित · एक बार' : 'शुल्क जानने के लिए पूछताछ भेजें'} /></p>
                </div>
                <BookService svc={s} className="min-w-[170px]" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-h" className="space-y-6">
        <h2 id="how-h" className="text-center font-cinzel text-3xl font-bold"><Bi en="How It Works" hi="प्रक्रिया कैसे चलती है" /></h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((st, i) => <li key={st.en[0]} className="glass rounded-xl border border-gold/20 p-5"><span className="gold-text font-cinzel text-3xl font-bold">{i + 1}</span><st.icon className="mt-2 h-5 w-5 text-gold" /><p className="mt-2 font-semibold"><Bi en={st.en[0]} hi={st.hi[0]} /></p><p className="mt-1 text-sm text-muted-foreground"><Bi en={st.en[1]} hi={st.hi[1]} /></p></li>)}
        </ol>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 via-card/70 to-maroon/25 p-6 sm:p-8">
        <div className="grid items-center gap-5 md:grid-cols-[1fr_auto]">
          <div><h2 className="font-cinzel text-2xl font-bold"><Bi en="Looking for a Standard Report?" hi="क्या आपको मानक रिपोर्ट चाहिए?" /></h2>
            <p className="mt-2 text-muted-foreground"><Bi en="The Complete Life Report PDF covers your date of birth, name and mobile number in a standard format. Submit your details and it is ready in about 2 hours (8 am – 10 pm IST)." hi="संपूर्ण जीवन रिपोर्ट PDF आपकी जन्म तिथि, नाम और मोबाइल नंबर को एक मानक प्रारूप में कवर करती है। विवरण जमा करें, यह लगभग 2 घंटे में तैयार हो जाती है (सुबह 8 – रात 10 बजे IST)।" /></p></div>
          <div className="flex flex-wrap gap-3"><Link href="/pricing" className="inline-flex h-11 items-center gap-2 rounded-md border border-gold/60 px-5 font-medium hover:bg-gold/10"><Bi en="Report plans & prices" hi="रिपोर्ट प्लान और मूल्य" /> <ArrowRight className="h-4 w-4" /></Link><Link href="/calculators" className="inline-flex h-11 items-center px-3 text-sm text-gold hover:underline"><Bi en="Free calculators →" hi="मुफ़्त कैलकुलेटर →" /></Link></div>
        </div>
      </section>

      <AcharyaProfile />
      <p className="-mt-8 text-center text-sm"><Link href="/about" className="text-gold hover:underline"><Bi en="Read Acharya Nandram's full profile →" hi="आचार्य नंदराम की पूरी प्रोफ़ाइल पढ़ें →" /></Link></p>

      <section aria-labelledby="faq-h" className="mx-auto max-w-3xl space-y-3">
        <h2 id="faq-h" className="text-center font-cinzel text-3xl font-bold"><Bi en="Questions About Our Services" hi="सेवाओं से जुड़े प्रश्न" /></h2>
        {FAQ.map((f) => <details key={f.en[0]} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium"><Bi en={f.en[0]} hi={f.hi[0]} /></summary><p className="mt-2 text-sm text-muted-foreground"><Bi en={f.en[1]} hi={f.hi[1]} /></p></details>)}
        <p className="text-center text-xs text-muted-foreground"><Bi en={<>See our <Link href="/refund" className="underline">Refund Policy</Link> and <Link href="/terms" className="underline">Terms of Service</Link>. Numerology is guidance, not a substitute for medical, legal or financial advice.</>} hi={<>हमारी <Link href="/refund" className="underline">रिफ़ंड नीति</Link> और <Link href="/terms" className="underline">सेवा की शर्तें</Link> देखें। अंक ज्योतिष मार्गदर्शन है, चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं।</>} /></p>
      </section>
    </div>
  );
}
