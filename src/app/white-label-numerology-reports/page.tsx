import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, CheckCircle2, Clock, FileText, Languages, Lock, MessageCircle, Palette, PenTool, Send, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Bi } from '@/components/i18n/bi';
import { DisclaimerNote } from '@/components/legal/disclaimer-note';
import { HeroArt } from '@/components/services/hero-art';
import { DEFAULT_SERVICES, getService, isPayable } from '@/lib/billing/services';
import { serviceUsd } from '@/lib/billing/currency';
import { funnelWhatsapp } from '@/lib/funnel/offer';
import { PRO_ADDONS, PRO_FROM, PRO_PACKS, PRO_REPORTS, inrFmt, packPrice, usdFmt } from '@/lib/pro-reports';
import { SITE_URL, abs, jsonLd } from '@/lib/seo/site';

const PATH = '/white-label-numerology-reports';
const TITLE = 'White-Label Numerology Reports for Numerologists';
const DESC = 'Branded numerology reports for numerologists, astrologers and consultants: your logo and contact details on every page, 13 report types, English & Hindi, trade prices from ₹249.';
const ENQUIRY = '/contact?topic=service&subject=white_label';

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: PATH },
  keywords: ['white label numerology report', 'numerology report for numerologists', 'branded numerology report', 'numerology report reseller', 'custom numerology report', 'numerology PDF report service', 'numerology report generator for consultants'],
  openGraph: { title: TITLE, description: DESC, url: PATH, type: 'website', locale: 'en_IN', alternateLocale: ['hi_IN', 'en_US'] },
};

const WHO: [string, string][] = [
  ['Numerologists', 'अंक ज्योतिषी'], ['Astrologers & Vastu consultants', 'ज्योतिषी व वास्तु सलाहकार'], ['Tarot & spiritual coaches', 'टैरो व आध्यात्मिक कोच'],
  ['Life & business coaches', 'लाइफ़ व बिज़नेस कोच'], ['YouTube & Instagram creators', 'YouTube व Instagram क्रिएटर'], ['Gift, wedding & naming services', 'गिफ़्ट, विवाह व नामकरण सेवाएँ'],
];

const TIERS = [
  {
    id: 'wl', icon: BadgeCheck, name: { en: 'White-label report', hi: 'व्हाइट-लेबल रिपोर्ट' },
    sub: { en: 'Our complete report – fully under your brand', hi: 'हमारी संपूर्ण रिपोर्ट – पूरी तरह आपके ब्रांड में' },
    points: [
      { en: 'Your logo, name, colours and contact on the cover and every page', hi: 'कवर और हर पेज पर आपका लोगो, नाम, रंग और संपर्क' },
      { en: 'No mention of myNumerologist.com anywhere', hi: 'कहीं भी myNumerologist.com का उल्लेख नहीं' },
      { en: 'Standard sections, remedies and charts for each report type', hi: 'हर रिपोर्ट प्रकार के मानक भाग, उपाय और चार्ट' },
      { en: 'English or हिंदी · print-ready PDF', hi: 'English या हिंदी · प्रिंट-योग्य PDF' },
      { en: 'Delivered to you – we never contact your client', hi: 'आपको डिलीवर – हम आपके क्लाइंट से कभी संपर्क नहीं करते' },
    ],
  },
  {
    id: 'custom', icon: PenTool, best: true, name: { en: 'Customized report', hi: 'कस्टमाइज़्ड रिपोर्ट' },
    sub: { en: 'Everything in white-label, shaped to your practice', hi: 'व्हाइट-लेबल का सब कुछ, आपकी प्रैक्टिस के अनुसार' },
    points: [
      { en: 'Everything in the white-label report', hi: 'व्हाइट-लेबल रिपोर्ट का सब कुछ' },
      { en: "Answers to your client's specific questions", hi: 'आपके क्लाइंट के विशेष प्रश्नों के उत्तर' },
      { en: 'Your own remedies, notes or signature section added', hi: 'आपके अपने उपाय, नोट्स या हस्ताक्षर भाग जोड़े जाते हैं' },
      { en: 'Choose, reorder or remove sections', hi: 'भाग चुनें, क्रम बदलें या हटाएँ' },
      { en: 'Custom cover design and a personal welcome letter in your name', hi: 'कस्टम कवर डिज़ाइन और आपके नाम से स्वागत पत्र' },
    ],
  },
] as const;

const STEPS = [
  { icon: Palette, en: ['Share your brand once', 'Send your logo, brand colours, name and contact details. We set up your report design.'], hi: ['एक बार अपना ब्रांड दें', 'अपना लोगो, ब्रांड रंग, नाम और संपर्क विवरण भेजें। हम आपकी रिपोर्ट डिज़ाइन तैयार करते हैं।'] },
  { icon: Send, en: ["Send your client's details", 'Name, date of birth and the details the report needs – on WhatsApp or email, one or many at a time.'], hi: ['क्लाइंट का विवरण भेजें', 'नाम, जन्म तिथि और रिपोर्ट के लिए ज़रूरी विवरण – WhatsApp या ईमेल पर, एक या कई एक साथ।'] },
  { icon: ShieldCheck, en: ['We prepare and check it', "Calculated with our tested engine, then reviewed by Acharya Nandram's team before it leaves us."], hi: ['हम तैयार करके जाँचते हैं', 'हमारे परीक्षित इंजन से गणना, फिर भेजने से पहले आचार्य नंदराम की टीम द्वारा जाँच।'] },
  { icon: FileText, en: ['You deliver it as your own', 'You receive the branded PDF in 2–3 working days (24 hours with express) and share it with your client.'], hi: ['आप इसे अपनी रिपोर्ट के रूप में दें', 'आपको 2–3 कार्य-दिवसों (एक्सप्रेस में 24 घंटे) में ब्रांडेड PDF मिलती है और आप इसे क्लाइंट को देते हैं।'] },
];

const WHY = [
  { icon: BadgeCheck, en: ['Accurate, consistent calculations', 'Vedic Moolank & Bhagyank, Chaldean name values and Lo Shu grid from the same engine that powers our own reports.'], hi: ['सटीक, एक-समान गणना', 'वैदिक मूलांक व भाग्यांक, कैल्डियन नाम मान और लो शू ग्रिड – उसी इंजन से जो हमारी अपनी रिपोर्ट बनाता है।'] },
  { icon: Lock, en: ['Your clients stay yours', 'Client details are used only to prepare the report and are never used to contact or market to your clients.'], hi: ['आपके क्लाइंट आपके ही रहें', 'क्लाइंट का विवरण केवल रिपोर्ट बनाने के लिए उपयोग होता है, उनसे संपर्क या मार्केटिंग के लिए कभी नहीं।'] },
  { icon: Languages, en: ['English and हिंदी', 'Plain, easy language your clients understand – in English, Hindi or both.'], hi: ['English और हिंदी', 'सरल, आसान भाषा जिसे आपके क्लाइंट समझें – अंग्रेज़ी, हिंदी या दोनों में।'] },
  { icon: Sparkles, en: ['Designed to impress', 'A premium cover, charts and clean layouts – a report your clients will keep and share.'], hi: ['प्रभावित करने वाला डिज़ाइन', 'प्रीमियम कवर, चार्ट और साफ़ लेआउट – ऐसी रिपोर्ट जिसे क्लाइंट संभालकर रखें और साझा करें।'] },
  { icon: Clock, en: ['Save hours on every client', 'Spend your time on consultations and sales – not on calculations and formatting.'], hi: ['हर क्लाइंट पर घंटों की बचत', 'अपना समय परामर्श और बिक्री पर लगाएँ – गणना और फ़ॉर्मैटिंग पर नहीं।'] },
  { icon: Users, en: ['No minimum order', 'Order one report at a time, or save up to 20% with a pack.'], hi: ['कोई न्यूनतम ऑर्डर नहीं', 'एक-एक रिपोर्ट ऑर्डर करें, या पैक से 20% तक बचाएँ।'] },
];

const FAQ: { en: [string, string]; hi: [string, string] }[] = [
  { en: ['Will my clients see your name or website?', 'No. White-label and customized reports carry only your brand – your logo, name and contact details. myNumerologist.com is not mentioned anywhere in the report.'], hi: ['क्या मेरे क्लाइंट आपका नाम या वेबसाइट देखेंगे?', 'नहीं। व्हाइट-लेबल और कस्टमाइज़्ड रिपोर्ट पर केवल आपका ब्रांड होता है – आपका लोगो, नाम और संपर्क। रिपोर्ट में कहीं भी myNumerologist.com का उल्लेख नहीं होता।'] },
  { en: ['Can I set my own price for my clients?', 'Yes. You buy at the trade price and charge your clients whatever you choose. Most consultants charge at least our own retail price.'], hi: ['क्या मैं अपने क्लाइंट के लिए अपना मूल्य तय कर सकता हूँ?', 'हाँ। आप ट्रेड मूल्य पर खरीदते हैं और अपने क्लाइंट से जो चाहें वह शुल्क लेते हैं। अधिकांश परामर्शदाता कम से कम हमारा खुदरा मूल्य लेते हैं।'] },
  { en: ['How do I pay?', 'Pay per order or buy a pack in advance by UPI, card or bank transfer. You receive a proper invoice receipt. Consultants outside India pay in US dollars.'], hi: ['भुगतान कैसे करें?', 'हर ऑर्डर पर भुगतान करें या UPI, कार्ड या बैंक ट्रांसफ़र से पहले पैक खरीदें। आपको विधिवत इनवॉइस रसीद मिलती है। भारत के बाहर के परामर्शदाता अमेरिकी डॉलर में भुगतान करते हैं।'] },
  { en: ['How fast will I get the reports?', 'Standard delivery is 2–3 working days. Express delivery within 24 hours costs 50% extra, and is included free in the Studio pack.'], hi: ['रिपोर्ट कितनी जल्दी मिलेगी?', 'सामान्य डिलीवरी 2–3 कार्य-दिवस। 24 घंटे में एक्सप्रेस डिलीवरी 50% अतिरिक्त है, और स्टूडियो पैक में मुफ़्त शामिल है।'] },
  { en: ['Can I see a sample first?', 'Yes. Ask on WhatsApp and we will send you a sample report so you can check the quality and layout before your first order.'], hi: ['क्या मैं पहले नमूना देख सकता हूँ?', 'हाँ। WhatsApp पर पूछें, हम आपको नमूना रिपोर्ट भेजेंगे ताकि पहले ऑर्डर से पहले आप गुणवत्ता और लेआउट देख सकें।'] },
  { en: ['Can I mix report types in a pack?', 'Yes. Pack discounts apply to any mix of report types, and the reports can be used over 12 months.'], hi: ['क्या पैक में अलग-अलग रिपोर्ट ले सकते हैं?', 'हाँ। पैक छूट किसी भी रिपोर्ट मिश्रण पर लागू होती है, और रिपोर्ट 12 महीनों में उपयोग की जा सकती हैं।'] },
];

type Retail = { inr: number | null; usd: number | null };
async function retailPrices(): Promise<Record<string, Retail>> {
  const out: Record<string, Retail> = {};
  await Promise.all(PRO_REPORTS.map(async (r) => {
    try {
      const s = await getService(r.code);
      out[r.code] = s && s.active && isPayable(s) ? { inr: Math.round(s.pricePaise / 100), usd: serviceUsd(s).usd ? Math.round(serviceUsd(s).usd! / 100) : null } : { inr: null, usd: null };
    } catch {
      const d = DEFAULT_SERVICES.find((x) => x.code === r.code);
      out[r.code] = { inr: d ? Math.round(d.pricePaise / 100) : null, usd: null };
    }
  }));
  return out;
}

function Money({ inr, usd, className }: { inr: number | null; usd: number | null; className?: string }) {
  return (
    <>
      <span className={`cur-inr ${className ?? ''}`}>{inr != null ? inrFmt(inr) : '—'}</span>
      <span className={`cur-usd ${className ?? ''}`}>{usd != null ? usdFmt(usd) : '—'}</span>
    </>
  );
}

export default async function WhiteLabelPage() {
  const retail = await retailPrices();
  const wa = funnelWhatsapp();
  const waLink = (msg: string) => `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
  const sampleWa = waLink('Namaste Acharya ji, I am a numerology professional. Please send me a sample white-label report and your trade price list.');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Service', name: 'White-label numerology reports for professionals', serviceType: 'White-label numerology report generation', url: abs(PATH), description: DESC,
      provider: { '@id': `${SITE_URL}/#org` }, audience: { '@type': 'BusinessAudience', audienceType: 'Numerologists, astrologers and consultants' }, areaServed: 'Worldwide',
      offers: PRO_REPORTS.flatMap((r) => [
        { '@type': 'Offer', name: `${r.name.en} – white-label`, price: r.wl.inr, priceCurrency: 'INR' },
        { '@type': 'Offer', name: `${r.name.en} – customized`, price: r.custom.inr, priceCurrency: 'INR' },
      ]) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.en[0], acceptedAnswer: { '@type': 'Answer', text: f.en[1] } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', item: abs('/') }, { name: 'For professionals', item: abs(PATH) }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, ...x })) },
  ];

  return (
    <div className="container max-w-6xl space-y-16 pb-16 pt-6 sm:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground"><Bi en="Home" hi="होम" /></Link> / <Bi en="For professionals" hi="पेशेवरों के लिए" /></nav>

      {/* Hero */}
      <section aria-labelledby="wl-h1" className="sh-hero relative -mx-4 overflow-hidden rounded-none px-4 py-8 sm:mx-0 sm:rounded-3xl sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
          <header className="mk-rise space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold"><span className="cz-eyebrow-dot" /><Users className="h-3.5 w-3.5" /><Bi en="For numerologists, astrologers & consultants" hi="अंक ज्योतिषियों, ज्योतिषियों और सलाहकारों के लिए" /></span>
            <h1 id="wl-h1" className="font-cinzel text-4xl font-bold leading-tight sm:text-5xl"><span className="gold-text"><Bi en="White-Label Numerology Reports for Professionals" hi="पेशेवरों के लिए व्हाइट-लेबल अंक ज्योतिष रिपोर्ट" /></span></h1>
            <p className="max-w-xl text-lg leading-relaxed text-foreground/90 sm:text-xl"><Bi en="Give your clients beautifully designed numerology reports under your own brand. We prepare and check them – you deliver them and keep the client." hi="अपने क्लाइंट को अपने ब्रांड में सुंदर अंक ज्योतिष रिपोर्ट दें। हम तैयार करके जाँचते हैं – आप देते हैं और क्लाइंट आपका रहता है।" /></p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                ['Your logo & contact on every page', 'हर पेज पर आपका लोगो व संपर्क'], ['13 report types · English & हिंदी', '13 रिपोर्ट प्रकार · English व हिंदी'],
                ['Trade prices – you set your own', 'ट्रेड मूल्य – अपना मूल्य आप तय करें'], ['No minimum order', 'कोई न्यूनतम ऑर्डर नहीं'],
              ].map(([en, hi]) => <li key={en} className="flex gap-2 text-sm sm:text-[15px]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><Bi en={en} hi={hi} /></li>)}
            </ul>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href={sampleWa} target="_blank" rel="noopener noreferrer" className="cz-btn cz-btn-primary h-12 px-6 text-base"><MessageCircle className="h-4 w-4" /><Bi en="Get a free sample report" hi="मुफ़्त नमूना रिपोर्ट पाएँ" /></a>
              <a href="#pricing" className="cz-btn cz-btn-ghost h-12 px-5 text-base"><Bi en="See trade prices" hi="ट्रेड मूल्य देखें" /> <ArrowRight className="h-4 w-4" /></a>
            </div>
          </header>
          <div className="space-y-3">
            <div aria-hidden className="mx-auto h-48 w-60 sm:h-52 sm:w-64"><HeroArt kind="label" /></div>
            <div className="sh-card relative rounded-2xl p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold"><Bi en="Trade prices from" hi="ट्रेड मूल्य शुरू" /></p>
              <p className="mt-1 font-serif text-4xl font-bold"><span className="gold-text"><Money inr={PRO_FROM.inr} usd={PRO_FROM.usd} /></span><span className="text-base font-normal text-muted-foreground"> / <Bi en="report" hi="रिपोर्ट" /></span></p>
              <p className="mt-1 text-xs text-muted-foreground"><Bi en="save up to 20% with packs" hi="पैक से 20% तक बचत" /></p>
              <Link href={ENQUIRY} className="cz-btn cz-btn-primary mt-4 w-full justify-center"><Send className="h-4 w-4" /><Bi en="Send a business enquiry" hi="व्यावसायिक पूछताछ भेजें" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section aria-labelledby="wl-who" className="space-y-4 text-center">
        <h2 id="wl-who" className="font-serif text-2xl font-semibold"><Bi en="Made for professionals who sell guidance" hi="मार्गदर्शन देने वाले पेशेवरों के लिए" /></h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {WHO.map(([en, hi]) => <li key={en} className="rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-sm"><Bi en={en} hi={hi} /></li>)}
        </ul>
      </section>

      {/* Two ways */}
      <section aria-labelledby="wl-tiers" className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 id="wl-tiers" className="font-serif text-3xl font-semibold"><Bi en="Two ways to work with us" hi="हमारे साथ काम करने के दो तरीके" /></h2>
          <p className="text-muted-foreground"><Bi en="Start with white-label. Choose customized when a client needs something special." hi="व्हाइट-लेबल से शुरू करें। जब क्लाइंट को कुछ खास चाहिए, तो कस्टमाइज़्ड चुनें।" /></p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {TIERS.map((t) => (
            <div key={t.id} className={`glass relative rounded-2xl border p-6 ${'best' in t && t.best ? 'border-gold/60 shadow-[0_20px_50px_-30px_hsl(var(--gold)/0.7)]' : 'border-gold/20'}`}>
              {'best' in t && t.best && <span className="absolute -top-3 right-5 rounded-full bg-gradient-to-r from-gold to-amber-500 px-3 py-0.5 text-xs font-bold text-black"><Bi en="Highest value" hi="सर्वाधिक मूल्य" /></span>}
              <t.icon className="h-7 w-7 text-gold" aria-hidden />
              <h3 className="mt-2 font-cinzel text-xl font-bold"><Bi en={t.name.en} hi={t.name.hi} /></h3>
              <p className="text-sm text-muted-foreground"><Bi en={t.sub.en} hi={t.sub.hi} /></p>
              <ul className="mt-4 space-y-2">{t.points.map((p) => <li key={p.en} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><Bi en={p.en} hi={p.hi} /></li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {/* Price list */}
      <section id="pricing" aria-labelledby="wl-price" className="scroll-mt-24 space-y-5">
        <div className="space-y-2 text-center">
          <h2 id="wl-price" className="font-serif text-3xl font-semibold"><Bi en="Trade price list – per report" hi="ट्रेड मूल्य सूची – प्रति रिपोर्ट" /></h2>
          <p className="text-sm text-muted-foreground"><span className="cur-inr"><Bi en="Prices in ₹. One language included." hi="मूल्य ₹ में। एक भाषा शामिल।" /></span><span className="cur-usd"><Bi en="Prices in US dollars for consultants outside India. One language included." hi="भारत के बाहर के परामर्शदाताओं के लिए मूल्य अमेरिकी डॉलर में। एक भाषा शामिल।" /></span></p>
        </div>
        <div className="glass overflow-x-auto rounded-2xl border border-gold/25">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gold/10 text-xs uppercase tracking-wider text-gold">
              <tr>
                <th scope="col" className="px-4 py-3"><Bi en="Report" hi="रिपोर्ट" /></th>
                <th scope="col" className="px-4 py-3 text-right"><Bi en="Our retail price" hi="हमारा खुदरा मूल्य" /></th>
                <th scope="col" className="px-4 py-3 text-right"><Bi en="White-label" hi="व्हाइट-लेबल" /></th>
                <th scope="col" className="bg-gold/10 px-4 py-3 text-right"><Bi en="Customized" hi="कस्टमाइज़्ड" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {PRO_REPORTS.map((r) => (
                <tr key={r.code} className="hover:bg-gold/5">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <span className="block font-semibold text-foreground"><Bi en={r.name.en} hi={r.name.hi} /></span>
                    <span className="block text-xs text-muted-foreground"><Bi en={r.pages.en} hi={r.pages.hi} /></span>
                  </th>
                  <td className="px-4 py-3 text-right text-muted-foreground"><Money inr={retail[r.code]?.inr ?? null} usd={retail[r.code]?.usd ?? null} /></td>
                  <td className="px-4 py-3 text-right font-semibold"><Money inr={r.wl.inr} usd={r.wl.usd} /></td>
                  <td className="bg-gold/5 px-4 py-3 text-right font-bold text-gold"><Money inr={r.custom.inr} usd={r.custom.usd} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-xs text-muted-foreground"><Bi en="Retail price = what a client pays on our own website, shown so you can see your margin." hi="खुदरा मूल्य = हमारी वेबसाइट पर क्लाइंट जो भुगतान करता है, ताकि आप अपना मार्जिन देख सकें।" /></p>
      </section>

      {/* Packs */}
      <section aria-labelledby="wl-packs" className="space-y-5">
        <div className="space-y-2 text-center">
          <h2 id="wl-packs" className="font-serif text-3xl font-semibold"><Bi en="Save more with report packs" hi="रिपोर्ट पैक से अधिक बचत" /></h2>
          <p className="text-sm text-muted-foreground"><Bi en="Discount on every report in the price list – any mix of report types." hi="मूल्य सूची की हर रिपोर्ट पर छूट – कोई भी रिपोर्ट मिश्रण।" /></p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {PRO_PACKS.map((p) => {
            const popular = 'popular' in p && p.popular;
            const eg = PRO_REPORTS[0];
            return (
              <div key={p.id} className={`glass relative flex flex-col rounded-2xl border p-6 text-center ${popular ? 'border-gold/60 shadow-[0_20px_50px_-30px_hsl(var(--gold)/0.7)]' : 'border-gold/20'}`}>
                {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-gold to-amber-500 px-3 py-0.5 text-xs font-bold text-black"><Bi en="Most popular" hi="सबसे लोकप्रिय" /></span>}
                <h3 className="font-cinzel text-xl font-bold"><Bi en={p.name.en} hi={p.name.hi} /></h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.reports} <Bi en="reports" hi="रिपोर्ट" /></p>
                <p className="mt-3 font-serif text-4xl font-bold"><span className="gold-text">{p.off}%</span> <span className="text-base font-normal text-muted-foreground"><Bi en="off" hi="छूट" /></span></p>
                <p className="mt-1 text-xs text-muted-foreground"><Bi en="e.g. Personal Report (white-label)" hi="उदा. व्यक्तिगत रिपोर्ट (व्हाइट-लेबल)" />: <s className="opacity-70"><Money inr={eg.wl.inr} usd={eg.wl.usd} /></s> → <b className="text-foreground"><Money inr={packPrice(eg.wl.inr, p.off)} usd={Math.round(eg.wl.usd * (100 - p.off)) / 100} /></b></p>
                <ul className="my-5 space-y-2 text-left text-sm">{p.extras.map((x) => <li key={x.en} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><Bi en={x.en} hi={x.hi} /></li>)}</ul>
                <a href={waLink(`Namaste Acharya ji, I want the ${p.name.en} pack (${p.reports} white-label reports).`)} target="_blank" rel="noopener noreferrer" className={`cz-btn mt-auto w-full justify-center ${popular ? 'cz-btn-primary' : 'cz-btn-ghost'}`}><MessageCircle className="h-4 w-4" /><Bi en={`Get the ${p.name.en} pack`} hi={`${p.name.hi} पैक लें`} /></a>
              </div>
            );
          })}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {PRO_ADDONS.map((a) => (
            <div key={a.name.en} className="rounded-xl border border-gold/15 bg-background/40 p-4">
              <div className="flex items-baseline justify-between gap-2"><h3 className="text-sm font-semibold"><Bi en={a.name.en} hi={a.name.hi} /></h3><span className="font-bold text-gold"><span className="cur-inr">{a.inr}</span><span className="cur-usd">{a.usd}</span></span></div>
              <p className="mt-1 text-xs text-muted-foreground"><Bi en={a.note.en} hi={a.note.hi} /></p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="wl-how" className="space-y-5">
        <h2 id="wl-how" className="text-center font-serif text-3xl font-semibold"><Bi en="How it works" hi="यह कैसे काम करता है" /></h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.en[0]} className="glass rounded-xl border border-gold/20 p-5">
              <div className="flex items-center gap-2"><span className="font-cinzel text-3xl font-bold text-gold">{i + 1}</span><s.icon className="h-5 w-5 text-gold/80" aria-hidden /></div>
              <h3 className="mt-1 font-semibold"><Bi en={s.en[0]} hi={s.hi[0]} /></h3>
              <p className="mt-1 text-sm text-muted-foreground"><Bi en={s.en[1]} hi={s.hi[1]} /></p>
            </li>
          ))}
        </ol>
      </section>

      {/* Why */}
      <section aria-labelledby="wl-why" className="space-y-5">
        <h2 id="wl-why" className="text-center font-serif text-3xl font-semibold"><Bi en="Why professionals partner with us" hi="पेशेवर हमारे साथ क्यों जुड़ते हैं" /></h2>
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

      {/* FAQ */}
      <section aria-labelledby="wl-faq" className="mx-auto max-w-3xl space-y-3">
        <h2 id="wl-faq" className="text-center font-serif text-2xl font-semibold"><Bi en="Questions from professionals" hi="पेशेवरों के प्रश्न" /></h2>
        {FAQ.map((f) => <details key={f.en[0]} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium"><Bi en={f.en[0]} hi={f.hi[0]} /></summary><p className="mt-2 text-sm text-muted-foreground"><Bi en={f.en[1]} hi={f.hi[1]} /></p></details>)}
      </section>

      {/* CTA band */}
      <section className="sh-hero relative overflow-hidden rounded-3xl px-6 py-10 text-center sm:px-10">
        <h2 className="font-cinzel text-2xl font-bold sm:text-3xl"><span className="gold-text"><Bi en="Start offering branded reports this week" hi="इसी सप्ताह ब्रांडेड रिपोर्ट देना शुरू करें" /></span></h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground"><Bi en="Ask for a free sample, check the quality, then send your first client's details." hi="मुफ़्त नमूना माँगें, गुणवत्ता देखें, फिर अपने पहले क्लाइंट का विवरण भेजें।" /></p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href={sampleWa} target="_blank" rel="noopener noreferrer" className="cz-btn cz-btn-primary"><MessageCircle className="h-4 w-4" /><Bi en="WhatsApp for a sample" hi="नमूने के लिए WhatsApp" /></a>
          <Link href={ENQUIRY} className="cz-btn cz-btn-ghost"><Send className="h-4 w-4" /><Bi en="Send an enquiry" hi="पूछताछ भेजें" /></Link>
        </div>
      </section>

      <DisclaimerNote />
    </div>
  );
}
