import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Award, BadgePercent, CheckCircle2, Clock, Eye, FileText, Gift, Languages, LockKeyhole, MessageCircle, Send, ShieldCheck, UserCheck } from 'lucide-react';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { Bi, BiBlock } from '@/components/i18n/bi';
import { BookService, ServiceReturnBanner, type PublicService } from '@/components/services/book-service';
import { formatInr as inr } from '@/lib/billing/plans';
import { DEFAULT_SERVICES, isPayable, listServices } from '@/lib/billing/services';
import { servicePageByCode } from '@/lib/service-pages';
import type { Service } from '@/lib/db/schema';
import { abs, EXPERT, jsonLd as toLd } from '@/lib/seo/site';
import { ServicePrice, serviceReal } from '@/components/services/service-price';
import { LeadForm, OfferCountdown, SampleReports, StickyCta, type FunnelService } from '@/components/services/funnel';
import { formatOfferEnd, funnelWhatsapp, getLiveOffer } from '@/lib/funnel/offer';
import { SERVICE_SAMPLES } from '@/lib/service-samples';

export const metadata: Metadata = {
  title: 'Numerology Services & Fees – Acharya Nandram',
  description: 'Numerology services by Acharya Nandram: personal report, name, Lo Shu, mobile, baby name, couple, business name and personal year. Pay securely online.',
  alternates: { canonical: '/services' },
  openGraph: { title: 'Numerology Services & Fees – Acharya Nandram', description: 'Personal report, name correction, lucky mobile number and baby name by Acharya Nandram.', url: '/services', type: 'website', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Numerology services by Acharya Nandram' }] },
};
export const revalidate = 300; // prices edited in Admin appear within 5 minutes

async function load(): Promise<PublicService[]> {
  let rows: Service[];
  try { rows = await listServices(); } catch { rows = DEFAULT_SERVICES.map((s) => ({ ...s, mrpPaise: null, usdCents: null, usdMrpCents: null, priceConfirmed: false, active: true, featured: !!s.featured, sort: s.sort ?? 0, updatedAt: new Date() }) as Service); }
  return rows.map((s) => ({ code: s.code, en: s.en, hi: s.hi, intake: s.intake, payable: isPayable(s), pricePaise: isPayable(s) ? s.pricePaise : null, mrpPaise: isPayable(s) ? s.mrpPaise : null, usdCents: isPayable(s) ? s.usdCents : null, usdMrpCents: isPayable(s) ? s.usdMrpCents : null }));
}

const STEPS = [
  { icon: FileText, en: ['Choose a service', 'Pick the service you need and click Book & pay.'], hi: ['सेवा चुनें', 'अपनी ज़रूरत की सेवा चुनें और "बुक करें और भुगतान करें" दबाएँ।'] },
  { icon: LockKeyhole, en: ['Share details & pay', 'Enter the date of birth and names, then pay securely by UPI, card or net banking – or by international card from outside India.'], hi: ['विवरण दें और भुगतान करें', 'जन्म तिथि और नाम दर्ज करें, फिर UPI, कार्ड या नेट बैंकिंग से सुरक्षित भुगतान करें। भारत के बाहर से अंतरराष्ट्रीय कार्ड द्वारा भी भुगतान कर सकते हैं।'] },
  { icon: Clock, en: ['Personal analysis', 'Acharya Nandram studies your numbers himself – no generic copy-paste text.'], hi: ['व्यक्तिगत विश्लेषण', 'आचार्य नंदराम स्वयं आपके अंकों का अध्ययन करते हैं – कोई सामान्य कॉपी-पेस्ट पाठ नहीं।'] },
  { icon: Send, en: ['Delivered to you', 'Your result arrives on email and WhatsApp within the delivery time shown.'], hi: ['आप तक डिलीवरी', 'आपका परिणाम बताए गए समय में ईमेल और WhatsApp पर पहुँचता है।'] },
];

const FAQ: { en: [string, string]; hi: [string, string] }[] = [
  { en: ['How do I pay?', 'Online through Cashfree Payments by UPI, debit or credit card or net banking. Every fee includes 18% GST and you get a GST invoice. Clients outside India can pay by international card, in US dollars where a $ fee is shown.'], hi: ['भुगतान कैसे करें?', 'Cashfree Payments के माध्यम से UPI, डेबिट या क्रेडिट कार्ड अथवा नेट बैंकिंग द्वारा ऑनलाइन। हर शुल्क में 18% GST शामिल है और आपको GST इनवॉइस मिलता है। भारत के बाहर के क्लाइंट अंतरराष्ट्रीय कार्ड से भुगतान कर सकते हैं (जहाँ $ शुल्क दिखाया गया है, वहाँ अमेरिकी डॉलर में)।'] },
  { en: ['How will I receive my analysis?', 'On the email and WhatsApp number you give while booking, within the delivery time shown for the service. You can also see the status under My account.'], hi: ['मुझे विश्लेषण कैसे मिलेगा?', 'बुकिंग के समय दिए गए ईमेल और WhatsApp नंबर पर, सेवा के लिए बताए गए समय में। स्थिति "मेरा खाता" में भी देख सकते हैं।'] },
  { en: ['In which language?', 'English, Hindi or Hinglish – mention your choice in the notes.'], hi: ['किस भाषा में?', 'अंग्रेज़ी, हिंदी या हिंग्लिश – अपनी पसंद टिप्पणी में लिखें।'] },
  { en: ['How is this different from the Complete Life Report plans?', 'The Complete Life Report follows a standard format and is ready about 2 hours after you submit it. These services are prepared personally by Acharya Nandram and answer your own questions.'], hi: ['संपूर्ण जीवन रिपोर्ट प्लान से क्या अंतर है?', 'संपूर्ण जीवन रिपोर्ट एक मानक प्रारूप में होती है और जमा करने के लगभग 2 घंटे बाद तैयार होती है। ये सेवाएँ आचार्य नंदराम स्वयं तैयार करते हैं और आपके अपने प्रश्नों के उत्तर देती हैं।'] },
  { en: ['Is my information safe?', 'Yes. Your details are stored encrypted, used only for your analysis and never sold or shared.'], hi: ['क्या मेरी जानकारी सुरक्षित है?', 'हाँ। आपकी जानकारी एन्क्रिप्टेड रखी जाती है, केवल आपके विश्लेषण के लिए उपयोग होती है और कभी बेची या साझा नहीं की जाती।'] },
];

const WHY = [
  { icon: UserCheck, en: ['Read by a person, not a machine', 'Acharya Nandram studies every chart himself and answers your own questions.'], hi: ['मशीन नहीं, व्यक्ति द्वारा पढ़ा गया', 'आचार्य नंदराम हर चार्ट स्वयं पढ़ते हैं और आपके अपने प्रश्नों के उत्तर देते हैं।'] },
  { icon: Award, en: ['15+ years of practice', 'Vedic, Chaldean and Lo Shu methods combined in one clear reading.'], hi: ['15+ वर्षों का अनुभव', 'वैदिक, कैल्डियन और लो शू पद्धतियाँ एक स्पष्ट रीडिंग में।'] },
  { icon: Gift, en: ['Remedies you can follow', 'Colours, days, placement and habits – no costly rituals or gemstones pushed.'], hi: ['अपनाने योग्य उपाय', 'रंग, दिन, स्थान और आदतें – कोई महँगे अनुष्ठान या रत्न नहीं थोपे जाते।'] },
  { icon: Languages, en: ['Your language', 'English, Hindi or Hinglish – delivered on email and WhatsApp.'], hi: ['आपकी भाषा', 'अंग्रेज़ी, हिंदी या हिंग्लिश – ईमेल और WhatsApp पर।'] },
];

function Card({ s, lang }: { s: PublicService; lang: 'en' | 'hi' }) {
  const t = s[lang];
  return (
    <>
      <h3 className="pr-16 font-cinzel text-xl font-bold">{t.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t.short}</p>
      <ul className="my-4 space-y-1.5 text-sm">{t.includes.map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>)}</ul>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 text-gold" />{t.delivery}</p>
    </>
  );
}

const pctOff = (s: PublicService) => { if (!s.pricePaise) return 0; const r = serviceReal(s, 'INR'); return r > s.pricePaise ? Math.round(((r - s.pricePaise) / r) * 100) : 0; };

export default async function ServicesPage() {
  const [list, offer] = await Promise.all([load(), getLiveOffer()]);
  const wa = funnelWhatsapp();
  const funnelServices: FunnelService[] = list.map((s) => ({ code: s.code, name: { en: s.en.name, hi: s.hi.name } }));
  const samples = SERVICE_SAMPLES.filter((x) => list.some((s) => s.code === x.code));
  const maxOff = Math.max(0, ...list.map(pctOff));
  const endText = offer ? { en: formatOfferEnd(offer.endsAt, 'en'), hi: formatOfferEnd(offer.endsAt, 'hi') } : null;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Numerology services by Acharya Nandram', itemListElement: list.map((s, i) => ({ '@type': 'ListItem', position: i + 1,
      item: { '@type': 'Service', name: s.en.name, description: s.en.short, serviceType: 'Numerology consultation', areaServed: 'IN', availableLanguage: ['English', 'Hindi'],
        provider: { '@type': 'Person', name: EXPERT.name, url: abs('/about') },
        ...(s.pricePaise ? { offers: { '@type': 'Offer', price: (s.pricePaise / 100).toFixed(2), priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: abs('/services'), ...(offer ? { priceValidUntil: offer.endsAt.slice(0, 10) } : {}) } } : {}) } })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.en[0], acceptedAnswer: { '@type': 'Answer', text: f.en[1] } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') }, { '@type': 'ListItem', position: 2, name: 'Services', item: abs('/services') }] },
  ];
  return (
    <div className="container max-w-6xl space-y-14 pb-24 pt-6 sm:pt-10 md:pb-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(ld) }} />
      {offer && endText && <OfferCountdown endsAt={offer.endsAt} label={offer.label} endText={endText} />}

      <header className="mk-rise grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="Acharya Nandram · 15+ years · 8 services" hi="आचार्य नंदराम · 15+ वर्ष · 8 सेवाएँ" /></p>
          <h1 className="font-cinzel text-4xl font-bold leading-tight sm:text-5xl"><span className="gold-text"><Bi en="Numerology Services by Acharya Nandram" hi="आचार्य नंदराम की अंक ज्योतिष सेवाएँ" /></span></h1>
          <p className="text-lg text-muted-foreground"><Bi en="Your name, date of birth and mobile number decide which doors open easily and which stay stuck. Get a personal analysis – not an automated printout – with remedies you can start today." hi="आपका नाम, जन्म तिथि और मोबाइल नंबर तय करते हैं कि कौन-से द्वार आसानी से खुलेंगे और कौन-से अटके रहेंगे। व्यक्तिगत विश्लेषण पाएँ – स्वचालित प्रिंटआउट नहीं – ऐसे उपायों के साथ जिन्हें आप आज से शुरू कर सकें।" /></p>
          {maxOff > 0 && <p className="inline-flex items-center gap-2 rounded-full bg-danger/15 px-4 py-1.5 text-sm font-bold text-danger"><BadgePercent className="h-4 w-4" /><Bi en={`Save up to ${maxOff}% on every service${offer ? ' – limited time' : ''}`} hi={`हर सेवा पर ${maxOff}% तक बचत${offer ? ' – सीमित समय' : ''}`} /></p>}
          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <a href="#services" className="inline-flex h-12 items-center gap-2 rounded-md bg-gradient-to-r from-gold to-amber-500 px-6 font-semibold text-black shadow-lg hover:brightness-110"><Bi en="See services & offer prices" hi="सेवाएँ और ऑफ़र मूल्य देखें" /> <ArrowRight className="h-4 w-4" /></a>
            <a href="#samples" className="inline-flex h-12 items-center gap-2 rounded-md border border-gold/60 px-5 font-medium hover:bg-gold/10"><Eye className="h-4 w-4" /><Bi en="View sample reports" hi="नमूना रिपोर्ट देखें" /></a>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs lg:justify-start">
            {[[ShieldCheck, 'Secure payment by Cashfree', 'Cashfree द्वारा सुरक्षित भुगतान'], [FileText, 'GST invoice', 'GST इनवॉइस'], [Languages, 'English · हिंदी · Hinglish', 'अंग्रेज़ी · हिंदी · हिंग्लिश'], [LockKeyhole, 'Private & encrypted', 'गोपनीय और एन्क्रिप्टेड']].map(([I, en, hi]) => { const Icon = I as typeof ShieldCheck; return <span key={en as string} className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1"><Icon className="h-3.5 w-3.5 text-gold" /><Bi en={en as string} hi={hi as string} /></span>; })}
          </div>
        </div>
        <div id="free-reading" className="glass scroll-mt-24 rounded-2xl border-2 border-gold/50 p-5 shadow-2xl sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold"><Bi en="Free · 30 seconds" hi="मुफ़्त · 30 सेकंड" /></p>
          <h2 className="mt-1 font-cinzel text-2xl font-bold"><Bi en="Get your free mini-reading" hi="अपनी मुफ़्त मिनी-रीडिंग पाएँ" /></h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground"><Bi en="See your Moolank and Bhagyank instantly and unlock every sample report below." hi="अपना मूलांक और भाग्यांक तुरंत देखें और नीचे की हर नमूना रिपोर्ट खोलें।" /></p>
          <LeadForm services={funnelServices} whatsapp={wa} />
        </div>
      </header>

      <ServiceReturnBanner />

      <section id="services" aria-labelledby="svc-h" className="scroll-mt-20 space-y-6">
        <div className="text-center">
          <h2 id="svc-h" className="font-cinzel text-3xl font-bold"><Bi en="Choose Your Service" hi="अपनी सेवा चुनें" /></h2>
          <p className="mt-2 text-muted-foreground"><Bi en="Real price, offer price and your saving – all fees include GST." hi="वास्तविक मूल्य, ऑफ़र मूल्य और आपकी बचत – सभी शुल्क GST सहित।" /></p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {list.map((s, i) => { const off = pctOff(s); return (
            <article key={s.code} id={s.code.toLowerCase()} style={{ animationDelay: `${i * 80}ms` }} className="mk-rise mk-card glass relative flex flex-col overflow-hidden rounded-2xl border border-gold/30 p-6">
              {off > 0 && <span className="absolute right-0 top-0 rounded-bl-xl bg-danger px-3 py-1.5 text-sm font-bold text-white">{off}% <Bi en="OFF" hi="छूट" /></span>}
              <BiBlock className="flex-1" en={<Card s={s} lang="en" />} hi={<Card s={s} lang="hi" />} />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {samples.some((x) => x.code === s.code) && <a href={`#sample-${s.code}`} className="inline-flex items-center gap-1 text-gold hover:underline"><Eye className="h-3.5 w-3.5" /><Bi en="See sample report" hi="नमूना रिपोर्ट देखें" /></a>}
                {servicePageByCode(s.code) && <Link href={`/${servicePageByCode(s.code)!.slug}`} className="inline-flex items-center gap-1 text-gold hover:underline"><Bi en="Learn more" hi="और जानें" /> <ArrowRight className="h-3.5 w-3.5" /></Link>}
              </div>
              <div className="mt-5 space-y-2 border-t border-border/50 pt-4">
                {offer && s.pricePaise && <OfferCountdown variant="inline" endsAt={offer.endsAt} label={offer.label} endText={endText!} />}
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    {s.pricePaise ? (
                      <ServicePrice s={s} />
                    ) : (
                      <div>
                        <p className="font-serif text-xl font-semibold text-gold"><Bi en="Price on request" hi="मूल्य पूछताछ पर" /></p>
                        <p className="text-xs text-muted-foreground"><Bi en="Send an enquiry for the fee" hi="शुल्क जानने के लिए पूछताछ भेजें" /></p>
                      </div>
                    )}
                  </div>
                  <BookService svc={s} className="min-w-[170px]" />
                </div>
              </div>
            </article>
          ); })}
        </div>
      </section>

      {samples.length > 0 && (
        <section id="samples" aria-labelledby="smp-h" className="scroll-mt-20 space-y-5">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="See before you pay" hi="भुगतान से पहले देखें" /></p>
            <h2 id="smp-h" className="font-cinzel text-3xl font-bold"><Bi en="Sample Report for Every Service" hi="हर सेवा की नमूना रिपोर्ट" /></h2>
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground"><Bi en="Real pages from each report type, made for a fictional client with the same method used for yours." hi="हर रिपोर्ट प्रकार के वास्तविक पृष्ठ, एक काल्पनिक क्लाइंट के लिए उसी पद्धति से बने जिससे आपकी रिपोर्ट बनती है।" /></p>
          </div>
          <SampleReports samples={samples} services={funnelServices} whatsapp={wa} />
        </section>
      )}

      <section aria-labelledby="why-h" className="space-y-6">
        <h2 id="why-h" className="text-center font-cinzel text-3xl font-bold"><Bi en="Why Clients Choose Acharya Nandram" hi="क्लाइंट आचार्य नंदराम को क्यों चुनते हैं" /></h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w) => <div key={w.en[0]} className="glass rounded-xl border border-gold/20 p-5"><w.icon className="h-6 w-6 text-gold" /><p className="mt-3 font-semibold"><Bi en={w.en[0]} hi={w.hi[0]} /></p><p className="mt-1 text-sm text-muted-foreground"><Bi en={w.en[1]} hi={w.hi[1]} /></p></div>)}
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

      <section className="rounded-2xl border-2 border-gold/50 bg-gradient-to-br from-maroon/30 via-card/80 to-gold/15 p-6 text-center sm:p-10">
        <h2 className="font-cinzel text-3xl font-bold"><Bi en="Not Sure Which Service You Need?" hi="तय नहीं कर पा रहे कौन-सी सेवा लें?" /></h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground"><Bi en="Start with your free mini-reading, or send your date of birth on WhatsApp and Acharya Nandram's team will suggest the right service." hi="अपनी मुफ़्त मिनी-रीडिंग से शुरू करें, या WhatsApp पर जन्म तिथि भेजें – आचार्य नंदराम की टीम सही सेवा सुझाएगी।" /></p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href="#free-reading" className="inline-flex h-12 items-center gap-2 rounded-md bg-gradient-to-r from-gold to-amber-500 px-6 font-semibold text-black hover:brightness-110"><Gift className="h-4 w-4" /><Bi en="Free mini-reading" hi="मुफ़्त मिनी-रीडिंग" /></a>
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-md bg-success px-6 font-semibold text-white hover:brightness-110"><MessageCircle className="h-4 w-4" /><Bi en="Ask on WhatsApp" hi="WhatsApp पर पूछें" /></a>
        </div>
      </section>

      <AcharyaProfile />
      <p className="-mt-8 text-center text-sm"><Link href="/about" className="text-gold hover:underline"><Bi en="Read Acharya Nandram's full profile →" hi="आचार्य नंदराम की पूरी प्रोफ़ाइल पढ़ें →" /></Link></p>

      <section aria-labelledby="faq-h" className="mx-auto max-w-3xl space-y-3">
        <h2 id="faq-h" className="text-center font-cinzel text-3xl font-bold"><Bi en="Questions About Our Services" hi="सेवाओं से जुड़े प्रश्न" /></h2>
        {FAQ.map((f) => <details key={f.en[0]} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium"><Bi en={f.en[0]} hi={f.hi[0]} /></summary><p className="mt-2 text-sm text-muted-foreground"><Bi en={f.en[1]} hi={f.hi[1]} /></p></details>)}
        <p className="text-center text-xs text-muted-foreground"><Bi en={<>See our <Link href="/refund" className="underline">Refund Policy</Link> and <Link href="/terms" className="underline">Terms of Service</Link>. and <Link href="/disclaimer" className="underline">Numerology Disclaimer</Link>. Numerology is guidance, not a substitute for medical, legal or financial advice.</>} hi={<>हमारी <Link href="/refund" className="underline">रिफ़ंड नीति</Link> और <Link href="/terms" className="underline">सेवा की शर्तें</Link> देखें। साथ ही <Link href="/disclaimer" className="underline">अंक ज्योतिष अस्वीकरण</Link> पढ़ें। अंक ज्योतिष मार्गदर्शन है, चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं।</>} /></p>
      </section>
      <StickyCta whatsapp={wa} />
    </div>
  );
}
