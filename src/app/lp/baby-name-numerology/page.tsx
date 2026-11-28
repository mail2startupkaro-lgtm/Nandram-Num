/**
 * Ad landing page for Meta (Facebook / Instagram) campaigns: Baby Lucky Name Numerology.
 * Use as the ad's Website URL:  https://www.mynumerologist.com/lp/baby-name-numerology?utm_source=meta&utm_medium=paid_social&utm_campaign=baby_name
 * Hindi ads: add &lang=hi.
 *
 * Built for Meta's ad review and the in-app browser: one offer, one main action, the same promise as the ad, real
 * price, no made-up ratings or client counts, no guaranteed results, no health claims, countdown only when a real
 * offer is live (Admin → Offer & leads), disclaimer + privacy / terms / refund links on the page.
 * Not for search: noindex, canonical points to the SEO page /baby-name-numerology.
 */
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Baby, CalendarHeart, CheckCircle2, Clock, FileText, Languages, LockKeyhole, MessageCircle, PenLine, Quote, Send, ShieldCheck, Sparkles, Star, Type } from 'lucide-react';
import { Bi, BiBlock } from '@/components/i18n/bi';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { DisclaimerNote } from '@/components/legal/disclaimer-note';
import { HeroArt } from '@/components/services/hero-art';
import { InsideReportSection } from '@/components/services/inside-report';
import { LeadForm, OfferCountdown, StickyCta } from '@/components/services/funnel';
import { LpLink, LpViewContent } from '@/components/services/lp-track';
import { ServicePrice } from '@/components/services/service-price';
import type { PublicService } from '@/components/services/book-service';
import { serviceUsd } from '@/lib/billing/currency';
import { DEFAULT_SERVICES, getService, isPayable } from '@/lib/billing/services';
import type { Service } from '@/lib/db/schema';
import { formatOfferEnd, funnelWhatsapp, getLiveOffer } from '@/lib/funnel/offer';
import { servicePageBySlug } from '@/lib/service-pages';
import { EXPERT } from '@/lib/seo/site';
import { getPublishedTestimonials } from '@/lib/testimonials-server';
import type { Testimonial } from '@/lib/testimonials';

export const revalidate = 300;

const CODE = 'SVC_BABY_NAME';
const SLUG = 'baby-name-numerology';
const NAME = { en: 'Baby Lucky Name Numerology', hi: 'शिशु शुभ नाम अंक ज्योतिष' };
const TITLE = 'Baby Lucky Name Numerology – 7 Lucky Names for Your Baby’s Date of Birth';
const DESC = 'Seven meaningful baby names (formal name and nickname) matched to your baby’s date of birth, prepared personally by Acharya Nandram. PDF report in English & Hindi within 3 hours.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: `/${SLUG}` },
  robots: { index: false, follow: true },
  openGraph: { title: TITLE, description: DESC, url: `/lp/${SLUG}`, type: 'website', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: NAME.en }] },
};

async function loadService(): Promise<PublicService | null> {
  let s: Service | undefined;
  try { s = await getService(CODE); } catch {
    const d = DEFAULT_SERVICES.find((x) => x.code === CODE);
    s = d ? ({ ...d, mrpPaise: null, usdCents: null, usdMrpCents: null, priceConfirmed: false, active: true, featured: !!d.featured, sort: d.sort ?? 0, updatedAt: new Date() } as Service) : undefined;
  }
  if (!s || !s.active) return null;
  const pay = isPayable(s);
  return { code: s.code, en: s.en, hi: s.hi, intake: s.intake, payable: pay, pricePaise: pay ? s.pricePaise : null, mrpPaise: pay ? s.mrpPaise : null, usdCents: pay ? serviceUsd(s).usd : null, usdMrpCents: pay ? serviceUsd(s).usdMrp : null };
}

async function review(): Promise<Testimonial | null> {
  const all = await getPublishedTestimonials().catch(() => [] as Testimonial[]);
  return all.find((x) => x.service === CODE) ?? all.find((x) => x.service === 'general') ?? null;
}

const WHY = [
  { icon: Type, en: ['Formal name + nickname', 'Both are checked, because the name a child is called at home every day matters as much as the one on the birth certificate.'], hi: ['औपचारिक नाम + निकनेम', 'दोनों जाँचे जाते हैं, क्योंकि घर में रोज़ पुकारा जाने वाला नाम भी जन्म प्रमाण-पत्र वाले नाम जितना ही महत्वपूर्ण है।'] },
  { icon: PenLine, en: ['Your letters, your traditions', 'Share the starting letters from your family astrologer (rashi akshar) or names the family likes – we work within them.'], hi: ['आपके अक्षर, आपकी परंपरा', 'अपने पारिवारिक ज्योतिषी के बताए आरंभिक अक्षर (राशि अक्षर) या परिवार के पसंदीदा नाम बताएँ – हम उन्हीं के भीतर काम करते हैं।'] },
  { icon: Star, en: ['Every name scored', 'Each name gets a clear score with its name number and how it matches the Moolank and Bhagyank – so the choice is easy.'], hi: ['हर नाम का स्कोर', 'हर नाम को उसके नामांक और मूलांक-भाग्यांक से मेल के साथ स्पष्ट स्कोर मिलता है – ताकि चुनना आसान हो।'] },
  { icon: Languages, en: ['Meanings in English & Hindi', 'Every suggested name comes with its meaning, so you choose a name you love – not just a number.'], hi: ['अंग्रेज़ी और हिंदी में अर्थ', 'हर सुझाए गए नाम के साथ उसका अर्थ मिलता है, ताकि आप वह नाम चुनें जो आपको पसंद हो – सिर्फ़ अंक नहीं।'] },
  { icon: CalendarHeart, en: ['Naming-ceremony dates', 'Favourable dates for the naam karan, plus lucky colours and numbers for the child.'], hi: ['नामकरण की तिथियाँ', 'नामकरण संस्कार के लिए शुभ तिथियाँ, साथ में बच्चे के शुभ रंग और अंक।'] },
  { icon: ShieldCheck, en: ['Simple, no-cost guidance', 'No gemstones, no costly rituals – only practical suggestions you can follow at home.'], hi: ['सरल, बिना ख़र्च का मार्गदर्शन', 'कोई रत्न नहीं, कोई महँगा अनुष्ठान नहीं – केवल व्यावहारिक सुझाव जिन्हें आप घर पर अपना सकें।'] },
];

const STEPS = [
  { icon: FileText, en: ['Share your baby’s details', 'Date of birth, gender, preferred letters and any names you are already considering.'], hi: ['शिशु का विवरण दें', 'जन्म तिथि, लिंग, पसंदीदा अक्षर और वे नाम जिन पर आप पहले से विचार कर रहे हैं।'] },
  { icon: LockKeyhole, en: ['Pay securely', 'UPI, cards or net banking through Cashfree. International cards are accepted.'], hi: ['सुरक्षित भुगतान करें', 'Cashfree द्वारा UPI, कार्ड या नेट बैंकिंग। अंतरराष्ट्रीय कार्ड भी स्वीकार्य।'] },
  { icon: Sparkles, en: ['Acharya Nandram prepares it', 'Names are checked with Chaldean name numbers, Moolank, Bhagyank and the Lo Shu grid.'], hi: ['आचार्य नंदराम तैयार करते हैं', 'नाम कैल्डियन नामांक, मूलांक, भाग्यांक और लो शू ग्रिड से जाँचे जाते हैं।'] },
  { icon: Send, en: ['Download your PDF', 'Ready within 3 hours in your account, in English and Hindi. You get an email and SMS when it is ready.'], hi: ['अपनी PDF डाउनलोड करें', '3 घंटे के भीतर आपके खाते में, अंग्रेज़ी और हिंदी में तैयार। तैयार होने पर ईमेल और SMS मिलता है।'] },
];

const EXTRA_FAQ: { en: [string, string]; hi: [string, string] }[] = [
  { en: ['Our baby already has a name. Can you still help?', 'Yes. We check the current formal name and nickname. If a number does not suit the date of birth, we first suggest a small spelling change that keeps the same sound, before suggesting new names.'], hi: ['हमारे बच्चे का नाम पहले से रखा है। क्या आप फिर भी मदद कर सकते हैं?', 'हाँ। हम वर्तमान औपचारिक नाम और निकनेम जाँचते हैं। यदि अंक जन्म तिथि के अनुकूल न हो, तो नए नाम सुझाने से पहले वही ध्वनि रखते हुए वर्तनी में छोटा बदलाव सुझाते हैं।'] },
  { en: ['What details do I need to share?', 'The baby’s date of birth and gender. Time and place of birth, parents’ names and preferred starting letters are optional but make the suggestions more personal.'], hi: ['मुझे कौन-सा विवरण देना होगा?', 'शिशु की जन्म तिथि और लिंग। जन्म समय व स्थान, माता-पिता के नाम और पसंदीदा आरंभिक अक्षर वैकल्पिक हैं, पर इनसे सुझाव अधिक व्यक्तिगत बनते हैं।'] },
  { en: ['When will I get the report?', 'Within 3 hours of payment, in the Reports section of your account, in English and Hindi. We also send you an email and SMS when it is ready.'], hi: ['रिपोर्ट कब मिलेगी?', 'भुगतान के 3 घंटे के भीतर, आपके खाते के रिपोर्ट सेक्शन में, अंग्रेज़ी और हिंदी में। तैयार होने पर हम ईमेल और SMS भी भेजते हैं।'] },
  { en: ['Is my baby’s information kept private?', 'Yes. Details are used only to prepare your report and are never sold or shared. See our privacy policy for details.'], hi: ['क्या मेरे बच्चे की जानकारी निजी रहती है?', 'हाँ। विवरण केवल आपकी रिपोर्ट तैयार करने के लिए उपयोग होता है और कभी बेचा या साझा नहीं किया जाता। विस्तार के लिए हमारी गोपनीयता नीति देखें।'] },
];

export default async function BabyNameLanding() {
  const page = servicePageBySlug(SLUG)!;
  const [svc, liveOffer, rv] = await Promise.all([loadService(), getLiveOffer(), review()]);
  const wa = funnelWhatsapp();
  const bookHref = svc?.payable ? `/reading?type=${CODE}` : '/contact?topic=service';
  const waText = encodeURIComponent('Namaste Acharya ji, I saw your ad and want lucky name suggestions for my baby.');
  const waHref = `https://wa.me/${wa}?text=${waText}`;
  const offerOn = liveOffer && svc?.pricePaise ? liveOffer : null;
  const endText = offerOn ? { en: formatOfferEnd(offerOn.endsAt, 'en'), hi: formatOfferEnd(offerOn.endsAt, 'hi') } : null;
  const funnelServices = svc ? [{ code: svc.code, name: NAME }] : [];
  const faq = [...EXTRA_FAQ, ...page.faq];

  const bookBtn = (where: string, label?: { en: string; hi: string }) => (
    <LpLink href={bookHref} where={where} code={CODE} className="cz-btn cz-btn-primary h-12 w-full px-6 text-base sm:w-auto">
      <Baby className="h-5 w-5" />
      <Bi en={label?.en ?? (svc?.payable ? 'Get My Baby’s Names' : 'Send an enquiry')} hi={label?.hi ?? (svc?.payable ? 'मेरे शिशु के नाम पाएँ' : 'पूछताछ भेजें')} />
    </LpLink>
  );
  const priceCard = svc && (
    <div className="glass rounded-2xl border border-gold/40 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold"><Bi en={NAME.en} hi={NAME.hi} /></p>
      {offerOn && endText && <div className="mt-3"><OfferCountdown variant="inline" endsAt={offerOn.endsAt} label={offerOn.label} endText={endText} /></div>}
      <div className="mt-4">
        {svc.pricePaise ? <ServicePrice s={svc} note={{ en: 'one-time fee · secure payment by Cashfree', hi: 'एकमुश्त शुल्क · Cashfree द्वारा सुरक्षित भुगतान' }} /> : <p className="font-serif text-xl font-semibold text-gold"><Bi en="Price on request" hi="मूल्य पूछताछ पर" /></p>}
      </div>
      <div className="mt-4 grid gap-2">
        {bookBtn('price_card')}
        <LpLink href={waHref} where="price_card" code={CODE} kind="whatsapp" external className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-success/50 font-semibold text-success hover:bg-success/10">
          <MessageCircle className="h-4 w-4" /><Bi en="Ask a question on WhatsApp" hi="WhatsApp पर प्रश्न पूछें" />
        </LpLink>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 text-gold" /><Bi en="PDF in English & Hindi within 3 hours" hi="3 घंटे में अंग्रेज़ी और हिंदी PDF" /></p>
    </div>
  );

  return (
    <div className="container max-w-5xl space-y-12 pb-28 pt-4 sm:pt-8 md:pb-14">
      {svc && <LpViewContent code={CODE} name={NAME.en} value={svc.pricePaise ? svc.pricePaise / 100 : undefined} />}
      {offerOn && endText && <OfferCountdown endsAt={offerOn.endsAt} label={offerOn.label} endText={endText} />}

      {/* 1. Hero: same promise as the ad, price and main action above the fold on mobile */}
      <section aria-labelledby="lp-h1" className="sh-hero relative -mx-4 overflow-hidden px-4 py-7 sm:mx-0 sm:rounded-3xl sm:px-8 sm:py-10">
        <div className="relative grid items-start gap-7 lg:grid-cols-[1fr_380px] lg:gap-10">
          <header className="space-y-4">
            <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-24 w-28 sm:h-32 sm:w-40 lg:hidden"><HeroArt kind="baby" /></div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold"><Baby className="h-3.5 w-3.5" /><Bi en={NAME.en} hi={NAME.hi} /></span>
            <h1 id="lp-h1" className="pr-24 font-cinzel text-3xl font-bold leading-tight sm:pr-36 sm:text-5xl lg:pr-0">
              <span className="gold-text"><Bi en="7 Lucky, Meaningful Names Chosen for Your Baby’s Date of Birth" hi="शिशु की जन्म तिथि के अनुसार चुने गए 7 शुभ, अर्थपूर्ण नाम" /></span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-foreground/90 sm:text-lg">
              <Bi en="Formal name and nickname, in the starting letters your family prefers – each with its meaning, name number and score. Prepared personally by Acharya Nandram." hi="औपचारिक नाम और निकनेम, आपके परिवार के पसंदीदा आरंभिक अक्षरों में – हर नाम के अर्थ, नामांक और स्कोर के साथ। आचार्य नंदराम द्वारा स्वयं तैयार।" />
            </p>
            {svc && svc.en.includes.length > 0 && (
              <BiBlock en={<Points items={svc.en.includes} />} hi={<Points items={svc.hi.includes} />} />
            )}
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              {bookBtn('hero')}
              <a href="#free-check" className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-gold/50 px-5 font-semibold hover:bg-gold/10"><Sparkles className="h-4 w-4 text-gold" /><Bi en="Check your baby’s numbers free" hi="शिशु के अंक मुफ़्त देखें" /></a>
            </div>
            <ul className="grid grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:gap-x-5">
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /><Bi en="Secure payment" hi="सुरक्षित भुगतान" /></li>
              <li className="flex items-center gap-1.5"><Languages className="h-4 w-4 text-gold" /><Bi en="English & हिंदी" hi="हिंदी और English" /></li>
              <li className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-gold" /><Bi en="Ready in 3 hours" hi="3 घंटे में तैयार" /></li>
              <li><a href="#inside-report" className="flex items-center gap-1.5 text-gold hover:underline"><FileText className="h-4 w-4" /><Bi en="See sample pages" hi="नमूना पृष्ठ देखें" /></a></li>
            </ul>
          </header>
          <div id="book" className="scroll-mt-24 space-y-3">
            <div aria-hidden className="hidden lg:mx-auto lg:-mb-6 lg:block lg:h-40 lg:w-52"><HeroArt kind="baby" /></div>
            {priceCard}
          </div>
        </div>
      </section>

      {/* 2. Expert + one real review (only a published testimonial – never invented) */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass flex items-center gap-4 rounded-2xl border border-gold/25 p-5">
          <Image src="/images/acharya-nandram-512.png" alt={EXPERT.name} width={72} height={72} className="h-[72px] w-[72px] shrink-0 rounded-full border-2 border-gold/60 object-cover" />
          <div className="space-y-1">
            <p className="font-serif text-lg font-bold"><Bi en={`Prepared personally by ${EXPERT.name}`} hi="आचार्य नंदराम द्वारा स्वयं तैयार" /></p>
            <p className="text-sm text-muted-foreground"><Bi en="15+ years in Vedic, Chaldean and Lo Shu numerology. Every report is reviewed before it reaches you." hi="वैदिक, कैल्डियन और लो शू अंक ज्योतिष में 15+ वर्ष। हर रिपोर्ट आप तक पहुँचने से पहले जाँची जाती है।" /></p>
          </div>
        </div>
        {rv && (
          <figure className="glass relative rounded-2xl border border-gold/25 p-5 pl-12">
            <Quote aria-hidden className="absolute left-4 top-5 h-5 w-5 text-gold/70" />
            <blockquote className="text-sm italic leading-relaxed text-foreground/90">“<Bi en={rv.quoteEn} hi={rv.quoteHi} />”</blockquote>
            <figcaption className="mt-2 text-xs text-muted-foreground">— <span className="font-semibold text-foreground">{rv.name}</span>{rv.location ? `, ${rv.location}` : ''}{rv.rating ? ` · ${'★'.repeat(rv.rating)}` : ''}</figcaption>
          </figure>
        )}
      </section>

      {/* 3. Why this report */}
      <section aria-labelledby="why-h" className="space-y-5">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="More than a list of names" hi="सिर्फ़ नामों की सूची नहीं" /></p>
          <h2 id="why-h" className="font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="What Makes This Report Different" hi="यह रिपोर्ट क्यों अलग है" /></h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((x) => (
            <div key={x.en[0]} className="glass flex gap-3 rounded-xl border border-gold/20 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold"><x.icon className="h-5 w-5" /></span>
              <div><p className="font-semibold"><Bi en={x.en[0]} hi={x.hi[0]} /></p><p className="text-sm text-muted-foreground"><Bi en={x.en[1]} hi={x.hi[1]} /></p></div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Free check (captures a Lead for Meta) */}
      <section id="free-check" aria-labelledby="free-h" className="scroll-mt-24 grid items-center gap-6 rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold/10 via-card/70 to-maroon/25 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold"><Bi en="Free · 30 seconds" hi="मुफ़्त · 30 सेकंड" /></p>
          <h2 id="free-h" className="mt-1 font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="See Your Baby’s Birth Numbers – Free" hi="शिशु के जन्म अंक देखें – मुफ़्त" /></h2>
          <p className="mt-2 text-muted-foreground"><Bi en="Enter the date of birth to see the Moolank and Bhagyank instantly – the two numbers every name in the full report is matched to." hi="जन्म तिथि डालें और तुरंत मूलांक व भाग्यांक देखें – वे दो अंक जिनसे पूरी रिपोर्ट का हर नाम मिलाया जाता है।" /></p>
        </div>
        <div className="glass rounded-xl p-5">
          <LeadForm services={funnelServices} defaultService={CODE} whatsapp={wa} compact bookHref={bookHref} labels={{ name: { en: 'Baby’s name (if already chosen)', hi: 'शिशु का नाम (यदि रखा हो)' }, dob: { en: 'Baby’s date of birth', hi: 'शिशु की जन्म तिथि' } }} />
        </div>
      </section>

      {/* 5. Sample pages */}
      <InsideReportSection slug={SLUG} />

      {/* 6. How it works */}
      <section aria-labelledby="how-h" className="space-y-5">
        <h2 id="how-h" className="text-center font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="How It Works" hi="यह कैसे काम करता है" /></h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.en[0]} className="glass rounded-xl border border-gold/20 p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gold/20 font-cinzel text-sm font-bold text-gold">{i + 1}</span>
                <s.icon className="h-4 w-4 text-gold" />
              </div>
              <p className="mt-2 font-semibold"><Bi en={s.en[0]} hi={s.hi[0]} /></p>
              <p className="text-sm text-muted-foreground"><Bi en={s.en[1]} hi={s.hi[1]} /></p>
            </li>
          ))}
        </ol>
        <p className="text-center text-sm text-muted-foreground"><Bi en="Baby not born yet? Book now and share the date of birth after the birth." hi="शिशु का जन्म अभी नहीं हुआ? अभी बुक करें और जन्म के बाद तिथि भेजें।" /></p>
        <div className="flex justify-center">{bookBtn('how_it_works')}</div>
      </section>

      {/* 7. FAQ */}
      <section aria-labelledby="faq-h" className="mx-auto max-w-3xl space-y-3">
        <h2 id="faq-h" className="text-center font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="Questions Parents Ask" hi="माता-पिता के प्रश्न" /></h2>
        {faq.map((f) => (
          <details key={f.en[0]} className="group glass rounded-xl border border-gold/20 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold"><span><Bi en={f.en[0]} hi={f.hi[0]} /></span><span className="text-xs text-gold/70 transition-transform group-open:rotate-180">▼</span></summary>
            <p className="mt-3 border-l-2 border-gold/30 pl-4 text-sm leading-relaxed text-muted-foreground"><Bi en={f.en[1]} hi={f.hi[1]} /></p>
          </details>
        ))}
      </section>

      {/* 8. Closing offer */}
      <section aria-labelledby="close-h" className="mx-auto max-w-2xl space-y-4 text-center">
        <h2 id="close-h" className="font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="Give Your Baby a Name You’ll Both Love" hi="अपने शिशु को ऐसा नाम दें जो आप दोनों को पसंद आए" /></h2>
        <div className="text-left">{priceCard}</div>
      </section>

      <AcharyaProfile />

      <div className="space-y-3">
        <DisclaimerNote />
        <nav aria-label="Policies" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-gold"><Bi en="Privacy policy" hi="गोपनीयता नीति" /></Link>
          <Link href="/terms" className="hover:text-gold"><Bi en="Terms" hi="नियम व शर्तें" /></Link>
          <Link href="/refund" className="hover:text-gold"><Bi en="Refund policy" hi="रिफ़ंड नीति" /></Link>
          <Link href="/contact" className="hover:text-gold"><Bi en="Contact" hi="संपर्क" /></Link>
          <Link href={`/${SLUG}`} className="hover:text-gold"><Bi en="Full service details" hi="सेवा का पूरा विवरण" /></Link>
        </nav>
      </div>

      <StickyCta whatsapp={wa} bookHref={bookHref} />
    </div>
  );
}

function Points({ items }: { items: string[] }) {
  return <ul className="grid gap-2 sm:grid-cols-2">{items.slice(0, 6).map((x) => <li key={x} className="flex gap-2 text-sm sm:text-[15px]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>)}</ul>;
}
