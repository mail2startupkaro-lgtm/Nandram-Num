import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, BadgePercent, CheckCircle2, Clock, Gift, IndianRupee, Languages, Link2, LineChart, Megaphone, ShieldCheck, UserPlus, Wallet } from 'lucide-react';
import { Bi } from '@/components/i18n/bi';
import { EarningsCalculator } from '@/components/affiliate/earnings-calculator';
import { getSetting, SETTING_DEFAULTS, type AffiliateSettings } from '@/lib/admin/settings';
import { DEFAULT_SERVICES, isPayable, listServices } from '@/lib/billing/services';
import { serviceUsd } from '@/lib/billing/currency';
import { commissionFor, exGst } from '@/lib/affiliate/program';
import { SERVICE_PAGES } from '@/lib/service-pages';
import { SITE_URL, abs, jsonLd } from '@/lib/seo/site';

const PATH = '/affiliate-program';
const TITLE = 'Affiliate Program – Earn Commission Promoting Numerology Reports';
const DESC = 'Join the myNumerologist.com affiliate program: share your link or coupon code, your audience gets a discount, and you earn a commission on every paid numerology report and consultation.';
const JOIN = '/account/affiliate';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: TITLE, description: DESC, alternates: { canonical: PATH },
  keywords: ['numerology affiliate program', 'astrology affiliate program India', 'earn commission numerology', 'affiliate marketing numerology reports', 'refer and earn numerology'],
  openGraph: { title: TITLE, description: DESC, url: PATH, type: 'website', locale: 'en_IN', alternateLocale: ['hi_IN'] },
};

type Row = { code: string; name: { en: string; hi: string }; path: string; inr: number; usd: number | null };
async function products(): Promise<Row[]> {
  try {
    return (await listServices()).filter(isPayable).map((s) => ({ code: s.code, name: { en: s.en.name, hi: s.hi.name }, path: `/${SERVICE_PAGES.find((p) => p.serviceCode === s.code)?.slug ?? 'services'}`, inr: s.pricePaise, usd: serviceUsd(s).usd }));
  } catch {
    return DEFAULT_SERVICES.map((s) => ({ code: s.code!, name: { en: s.en!.name, hi: s.hi!.name }, path: `/${SERVICE_PAGES.find((p) => p.serviceCode === s.code)?.slug ?? 'services'}`, inr: s.pricePaise ?? 0, usd: null }));
  }
}
async function rules(): Promise<AffiliateSettings> { try { return await getSetting('affiliate'); } catch { return SETTING_DEFAULTS.affiliate; } }

const inr = (paise: number) => `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
const usd = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

const WHO: [string, string][] = [
  ['YouTube & Instagram creators', 'YouTube व Instagram क्रिएटर'], ['Astrologers, pandits & Vastu experts', 'ज्योतिषी, पंडित व वास्तु विशेषज्ञ'], ['Spiritual & wellness coaches', 'आध्यात्मिक व वेलनेस कोच'],
  ['Wedding, baby & event planners', 'विवाह, शिशु व इवेंट प्लानर'], ['Bloggers & Telegram / WhatsApp group admins', 'ब्लॉगर व Telegram / WhatsApp ग्रुप एडमिन'], ['Happy clients who love to recommend', 'संतुष्ट क्लाइंट जो सुझाव देना पसंद करते हैं'],
];

export default async function AffiliateProgramPage() {
  const [list, s] = await Promise.all([products(), rules()]);
  const rate = s.defaultPercent;
  const steps = [
    { icon: UserPlus, en: ['Apply in 2 minutes', 'Sign in, tell us where you will share, and add your UPI or bank details for payouts.'], hi: ['2 मिनट में आवेदन करें', 'साइन इन करें, बताएँ आप कहाँ साझा करेंगे, और भुगतान के लिए UPI या बैंक विवरण जोड़ें।'] },
    { icon: BadgeCheck, en: ['Get your link and code', 'After approval you get a personal link for every service and a coupon code for your audience.'], hi: ['अपना लिंक और कोड पाएँ', 'स्वीकृति के बाद आपको हर सेवा का व्यक्तिगत लिंक और अपने दर्शकों के लिए कूपन कोड मिलता है।'] },
    { icon: Megaphone, en: ['Share with your audience', 'Live sessions, reels, videos, posts, WhatsApp and Telegram groups – wherever your people are.'], hi: ['अपने दर्शकों से साझा करें', 'लाइव सत्र, रील, वीडियो, पोस्ट, WhatsApp और Telegram ग्रुप – जहाँ आपके लोग हैं।'] },
    { icon: Wallet, en: [`Earn ${rate}% on every sale`, `Track clicks and sales live in your dashboard. Payouts by UPI or bank transfer from ₹${s.minPayoutInr}.`], hi: [`हर बिक्री पर ${rate}% कमाएँ`, `अपने डैशबोर्ड में क्लिक और बिक्री लाइव देखें। ₹${s.minPayoutInr} से UPI या बैंक ट्रांसफ़र द्वारा भुगतान।`] },
  ];
  const why = [
    { icon: BadgePercent, en: [`${rate}% commission`, 'On every paid report and consultation your link or code brings – not just the first one in a session.'], hi: [`${rate}% कमीशन`, 'आपके लिंक या कोड से आई हर सशुल्क रिपोर्ट और परामर्श पर।'] },
    ...(s.customerDiscountPercent > 0 ? [{ icon: Gift, en: [`${s.customerDiscountPercent}% off for your audience`, 'Your personal coupon code gives your followers a real discount – an easy reason to buy today.'], hi: [`आपके दर्शकों को ${s.customerDiscountPercent}% छूट`, 'आपका व्यक्तिगत कूपन कोड आपके फ़ॉलोअर्स को असली छूट देता है – आज ख़रीदने का आसान कारण।'] }] : []),
    { icon: Clock, en: [`${s.cookieDays}-day tracking`, `If someone clicks your link and buys within ${s.cookieDays} days, the sale is yours.`], hi: [`${s.cookieDays} दिन की ट्रैकिंग`, `कोई आपके लिंक पर क्लिक करके ${s.cookieDays} दिनों में ख़रीदे, तो बिक्री आपकी।`] },
    { icon: ShieldCheck, en: ['Services people trust', 'Reports checked by Acharya Nandram, delivered within 3 hours, with a clear refund policy.'], hi: ['भरोसेमंद सेवाएँ', 'आचार्य नंदराम द्वारा जाँची रिपोर्ट, 3 घंटे में डिलीवरी, स्पष्ट रिफ़ंड नीति।'] },
    { icon: Languages, en: ['English and हिंदी', 'Every report is available in Hindi too – perfect for Indian audiences.'], hi: ['English और हिंदी', 'हर रिपोर्ट हिंदी में भी – भारतीय दर्शकों के लिए उत्तम।'] },
    { icon: LineChart, en: ['Live dashboard', 'See clicks, sales, earnings on hold, available and paid – and every payout with its reference.'], hi: ['लाइव डैशबोर्ड', 'क्लिक, बिक्री, होल्ड पर, उपलब्ध और भुगतान हुई कमाई – और हर भुगतान का रेफ़रेंस देखें।'] },
  ];
  const terms: [string, string][] = [
    [`Commission is ${rate}% of the order value excluding GST, after any discount. Some affiliates may have a personal rate.`, `कमीशन ऑर्डर मूल्य (GST छोड़कर, छूट के बाद) का ${rate}% है। कुछ एफ़िलिएट की व्यक्तिगत दर हो सकती है।`],
    [`A sale is yours when the buyer uses your coupon code, or buys within ${s.cookieDays} days of clicking your link (last click counts).`, `बिक्री आपकी होती है जब ख़रीदार आपका कूपन कोड उपयोग करे, या आपके लिंक पर क्लिक के ${s.cookieDays} दिनों में ख़रीदे (आख़िरी क्लिक मान्य)।`],
    [`Commissions stay on hold for ${s.holdDays} days (refund window), then become available. Refunded or cancelled orders earn no commission.`, `कमीशन ${s.holdDays} दिन होल्ड पर रहता है (रिफ़ंड अवधि), फिर उपलब्ध होता है। रिफ़ंड या रद्द ऑर्डर पर कमीशन नहीं।`],
    [`Payouts by UPI or bank transfer once your available balance reaches ₹${s.minPayoutInr} ($${s.minPayoutUsd} for USD sales).`, `उपलब्ध राशि ₹${s.minPayoutInr} ($${s.minPayoutUsd} USD बिक्री के लिए) होने पर UPI या बैंक ट्रांसफ़र से भुगतान।`],
    ['Your own purchases do not earn commission.', 'आपकी अपनी ख़रीद पर कमीशन नहीं मिलता।'],
    ['No spam, no misleading claims (no guaranteed results), no paid ads on our brand name and no posting the code on coupon websites. Breaking these rules can end your account and cancel unpaid commissions.', 'स्पैम, भ्रामक दावे (गारंटीड परिणाम), हमारे ब्रांड नाम पर पेड विज्ञापन और कूपन वेबसाइटों पर कोड डालना मना है। नियम तोड़ने पर खाता बंद और अदेय कमीशन रद्द हो सकता है।'],
    ['We may change rates or rules with notice; commissions already earned keep their rate.', 'हम सूचना देकर दरें या नियम बदल सकते हैं; पहले कमाए कमीशन की दर वही रहती है।'],
  ];
  const faq: { en: [string, string]; hi: [string, string] }[] = [
    { en: ['Does it cost anything to join?', 'No. Joining is free and there is no target or minimum sale.'], hi: ['क्या जुड़ने का कोई शुल्क है?', 'नहीं। जुड़ना मुफ़्त है और कोई लक्ष्य या न्यूनतम बिक्री नहीं।'] },
    { en: ['Do I need to know numerology?', 'No. We prepare and deliver every report. You only share your link or code.'], hi: ['क्या मुझे अंक ज्योतिष आना चाहिए?', 'नहीं। हर रिपोर्ट हम तैयार करके देते हैं। आप केवल अपना लिंक या कोड साझा करते हैं।'] },
    { en: ['When do I get paid?', `Commissions become available ${s.holdDays} days after payment. Once you have ₹${s.minPayoutInr} available, we pay by UPI or bank transfer, usually within the first week of the month.`], hi: ['भुगतान कब मिलेगा?', `भुगतान के ${s.holdDays} दिन बाद कमीशन उपलब्ध होता है। ₹${s.minPayoutInr} उपलब्ध होने पर हम UPI या बैंक से, प्रायः महीने के पहले सप्ताह में भुगतान करते हैं।`] },
    { en: ['Can I promote to clients outside India?', 'Yes. International clients pay in US dollars and your commission on those sales is in dollars.'], hi: ['क्या मैं भारत के बाहर के क्लाइंट को प्रमोट कर सकता हूँ?', 'हाँ। अंतरराष्ट्रीय क्लाइंट अमेरिकी डॉलर में भुगतान करते हैं और उन बिक्री पर आपका कमीशन डॉलर में होता है।'] },
    { en: ['How do I see my sales?', 'Your affiliate dashboard shows clicks, every sale with its commission, what is on hold, available and paid.'], hi: ['मैं अपनी बिक्री कैसे देखूँ?', 'आपका एफ़िलिएट डैशबोर्ड क्लिक, हर बिक्री व उसका कमीशन, होल्ड पर, उपलब्ध और भुगतान हुई राशि दिखाता है।'] },
  ];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: TITLE, url: abs(PATH), description: DESC, publisher: { '@id': `${SITE_URL}/#org` } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.en[0], acceptedAnswer: { '@type': 'Answer', text: f.en[1] } })) },
  ];
  const top = [...list].sort((a, b) => b.inr - a.inr)[0];

  return (
    <div className="container max-w-6xl space-y-16 pb-16 pt-6 sm:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground"><Bi en="Home" hi="होम" /></Link> / <Bi en="Affiliate program" hi="एफ़िलिएट प्रोग्राम" /></nav>

      <section aria-labelledby="af-h1" className="sh-hero relative -mx-4 overflow-hidden rounded-none px-4 py-8 sm:mx-0 sm:rounded-3xl sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
          <header className="mk-rise space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold"><span className="cz-eyebrow-dot" /><Link2 className="h-3.5 w-3.5" /><Bi en="Affiliate program · free to join" hi="एफ़िलिएट प्रोग्राम · जुड़ना मुफ़्त" /></span>
            <h1 id="af-h1" className="font-cinzel text-4xl font-bold leading-tight sm:text-5xl"><span className="gold-text"><Bi en={`Share numerology. Earn ${rate}% on every sale.`} hi={`अंक ज्योतिष साझा करें। हर बिक्री पर ${rate}% कमाएँ।`} /></span></h1>
            <p className="max-w-xl text-lg leading-relaxed text-foreground/90 sm:text-xl"><Bi en="Recommend Acharya Nandram's numerology reports to your audience with your personal link or coupon code. We do the work – you earn a commission on every paid order." hi="अपने व्यक्तिगत लिंक या कूपन कोड से अपने दर्शकों को आचार्य नंदराम की अंक ज्योतिष रिपोर्ट सुझाएँ। काम हम करते हैं – हर सशुल्क ऑर्डर पर कमीशन आप कमाते हैं।" /></p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                [`${rate}% commission on every paid order`, `हर सशुल्क ऑर्डर पर ${rate}% कमीशन`],
                ...(s.customerDiscountPercent > 0 ? [[`${s.customerDiscountPercent}% off for your audience`, `आपके दर्शकों को ${s.customerDiscountPercent}% छूट`]] : []),
                [`${s.cookieDays}-day link tracking`, `${s.cookieDays} दिन की लिंक ट्रैकिंग`], ['UPI or bank payouts', 'UPI या बैंक से भुगतान'],
              ].map(([en, hi]) => <li key={en} className="flex gap-2 text-sm sm:text-[15px]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><Bi en={en} hi={hi} /></li>)}
            </ul>
            <div className="flex flex-wrap gap-3 pt-1">
              {s.enabled
                ? <Link href={JOIN} className="cz-btn cz-btn-primary h-12 px-6 text-base"><UserPlus className="h-4 w-4" /><Bi en="Join the affiliate program" hi="एफ़िलिएट प्रोग्राम से जुड़ें" /></Link>
                : <span className="rounded-lg border border-gold/30 px-4 py-3 text-sm text-muted-foreground"><Bi en="New applications are paused right now." hi="अभी नए आवेदन रुके हुए हैं।" /></span>}
              <a href="#earn" className="cz-btn cz-btn-ghost h-12 px-5 text-base"><Bi en="See what you earn" hi="देखें आप कितना कमाएँगे" /> <ArrowRight className="h-4 w-4" /></a>
            </div>
          </header>
          <div className="sh-card relative space-y-3 rounded-2xl p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold"><Bi en="Your commission" hi="आपका कमीशन" /></p>
            <p className="font-serif text-6xl font-bold"><span className="gold-text">{rate}%</span></p>
            <p className="text-sm text-muted-foreground"><Bi en="of every paid order (excl. GST)" hi="हर सशुल्क ऑर्डर का (GST छोड़कर)" /></p>
            {top && <p className="rounded-lg border border-gold/20 bg-gold/5 p-3 text-sm"><Bi en="e.g." hi="उदा." /> <b><Bi en={top.name.en} hi={top.name.hi} /></b> {inr(top.inr)} → <b className="text-gold"><Bi en="you earn" hi="आपकी कमाई" /> {inr(commissionFor(exGst(top.inr), rate))}</b></p>}
            <Link href={JOIN} className="cz-btn cz-btn-primary w-full justify-center"><Bi en="Apply now – it's free" hi="अभी आवेदन करें – मुफ़्त" /></Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="af-who" className="space-y-4 text-center">
        <h2 id="af-who" className="font-serif text-2xl font-semibold"><Bi en="Perfect for people with an audience that trusts them" hi="उनके लिए जिनके दर्शक उन पर भरोसा करते हैं" /></h2>
        <ul className="flex flex-wrap justify-center gap-2">{WHO.map(([en, hi]) => <li key={en} className="rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-sm"><Bi en={en} hi={hi} /></li>)}</ul>
      </section>

      <section aria-labelledby="af-how" className="space-y-5">
        <h2 id="af-how" className="text-center font-serif text-3xl font-semibold"><Bi en="How it works" hi="यह कैसे काम करता है" /></h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((x, i) => (
            <li key={x.en[0]} className="glass rounded-xl border border-gold/20 p-5">
              <div className="flex items-center gap-2"><span className="font-cinzel text-3xl font-bold text-gold">{i + 1}</span><x.icon className="h-5 w-5 text-gold/80" aria-hidden /></div>
              <h3 className="mt-1 font-semibold"><Bi en={x.en[0]} hi={x.hi[0]} /></h3>
              <p className="mt-1 text-sm text-muted-foreground"><Bi en={x.en[1]} hi={x.hi[1]} /></p>
            </li>
          ))}
        </ol>
      </section>

      <section id="earn" aria-labelledby="af-earn" className="scroll-mt-24 space-y-5">
        <div className="space-y-2 text-center">
          <h2 id="af-earn" className="font-serif text-3xl font-semibold"><Bi en="What you earn per sale" hi="हर बिक्री पर आपकी कमाई" /></h2>
          <p className="text-sm text-muted-foreground"><Bi en={`${rate}% of the price excluding 18% GST. With your coupon the customer pays less and your commission is on what they pay.`} hi={`18% GST छोड़कर मूल्य का ${rate}%। आपके कूपन से ग्राहक कम भुगतान करता है और कमीशन उसी राशि पर होता है।`} /></p>
        </div>
        <div className="glass overflow-x-auto rounded-2xl border border-gold/25">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-gold/10 text-xs uppercase tracking-wider text-gold">
              <tr><th scope="col" className="px-4 py-3"><Bi en="Service" hi="सेवा" /></th><th scope="col" className="px-4 py-3 text-right"><Bi en="Customer pays" hi="ग्राहक भुगतान" /></th><th scope="col" className="bg-gold/10 px-4 py-3 text-right"><Bi en="You earn" hi="आपकी कमाई" /></th></tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {list.map((r) => (
                <tr key={r.code} className="hover:bg-gold/5">
                  <th scope="row" className="px-4 py-3 font-normal"><Link href={r.path} className="font-semibold hover:text-gold"><Bi en={r.name.en} hi={r.name.hi} /></Link></th>
                  <td className="px-4 py-3 text-right text-muted-foreground"><span className="cur-inr">{inr(r.inr)}</span><span className="cur-usd">{r.usd ? usd(r.usd) : inr(r.inr)}</span></td>
                  <td className="bg-gold/5 px-4 py-3 text-right font-bold text-gold"><span className="cur-inr">{inr(commissionFor(exGst(r.inr), rate))}</span><span className="cur-usd">{r.usd ? usd(commissionFor(r.usd, rate)) : inr(commissionFor(exGst(r.inr), rate))}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <EarningsCalculator rate={rate} prices={list.map((r) => exGst(r.inr))} />
      </section>

      <section aria-labelledby="af-why" className="space-y-5">
        <h2 id="af-why" className="text-center font-serif text-3xl font-semibold"><Bi en="Why promote us" hi="हमें क्यों प्रमोट करें" /></h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {why.map((w) => (
            <div key={w.en[0]} className="mk-card glass rounded-xl border border-gold/20 p-5">
              <w.icon className="h-6 w-6 text-gold" aria-hidden />
              <h3 className="mt-2 font-semibold"><Bi en={w.en[0]} hi={w.hi[0]} /></h3>
              <p className="mt-1 text-sm text-muted-foreground"><Bi en={w.en[1]} hi={w.hi[1]} /></p>
            </div>
          ))}
        </div>
      </section>

      <section id="terms" aria-labelledby="af-terms" className="mx-auto max-w-3xl scroll-mt-24 space-y-3">
        <h2 id="af-terms" className="flex items-center justify-center gap-2 text-center font-serif text-2xl font-semibold"><IndianRupee className="h-5 w-5 text-gold" /><Bi en="Program rules" hi="प्रोग्राम के नियम" /></h2>
        <ol className="glass list-decimal space-y-2 rounded-xl border border-gold/20 p-5 pl-10 text-sm">{terms.map(([en, hi]) => <li key={en}><Bi en={en} hi={hi} /></li>)}</ol>
      </section>

      <section aria-labelledby="af-faq" className="mx-auto max-w-3xl space-y-3">
        <h2 id="af-faq" className="text-center font-serif text-2xl font-semibold"><Bi en="Questions" hi="प्रश्न" /></h2>
        {faq.map((f) => <details key={f.en[0]} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium"><Bi en={f.en[0]} hi={f.hi[0]} /></summary><p className="mt-2 text-sm text-muted-foreground"><Bi en={f.en[1]} hi={f.hi[1]} /></p></details>)}
      </section>

      <section className="sh-hero relative overflow-hidden rounded-3xl px-6 py-10 text-center sm:px-10">
        <h2 className="font-cinzel text-2xl font-bold sm:text-3xl"><span className="gold-text"><Bi en="Start earning with your audience" hi="अपने दर्शकों के साथ कमाई शुरू करें" /></span></h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground"><Bi en="Apply today. Once approved, your link and code are ready in your dashboard." hi="आज आवेदन करें। स्वीकृति के बाद आपका लिंक और कोड डैशबोर्ड में तैयार मिलेगा।" /></p>
        <div className="mt-5 flex flex-wrap justify-center gap-3"><Link href={JOIN} className="cz-btn cz-btn-primary"><UserPlus className="h-4 w-4" /><Bi en="Join the affiliate program" hi="एफ़िलिएट प्रोग्राम से जुड़ें" /></Link></div>
      </section>
    </div>
  );
}
