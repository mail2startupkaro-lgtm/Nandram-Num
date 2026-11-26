import type { Metadata } from 'next';
import { serviceUsd } from '@/lib/billing/currency';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Baby, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, Clock, Compass, FileCheck, FileText, Grid3x3, HeartHandshake, Languages, LockKeyhole, MessageCircle, PenLine, Quote, Send, ShieldCheck, Smartphone, Sparkles, Store, Target, Type, UserRound, Users, BadgeCheck, Orbit, Sigma } from 'lucide-react';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { Calculator } from '@/components/calculators/calculator';
import { Bi, BiBlock, ForLang } from '@/components/i18n/bi';
import { BookService, ServiceReturnBanner, type PublicService } from '@/components/services/book-service';
import { DEFAULT_SERVICES, getService, isPayable } from '@/lib/billing/services';
import { formatInr as inr } from '@/lib/billing/plans';
import type { Service } from '@/lib/db/schema';
import { SERVICE_PAGES, servicePageBySlug } from '@/lib/service-pages';
import { abs, EXPERT, jsonLd as toLd } from '@/lib/seo/site';
import { DisclaimerNote } from '@/components/legal/disclaimer-note';
import { ServicePrice } from '@/components/services/service-price';
import { LeadForm, OfferCountdown, StickyCta } from '@/components/services/funnel';
import { formatOfferEnd, funnelWhatsapp, getLiveOffer } from '@/lib/funnel/offer';
import { InsideReportSection } from '@/components/services/inside-report';
import { HeroActionCard } from '@/components/services/hero-action-card';
import { HeroArt } from '@/components/services/hero-art';
import { heroFor, type HeroIcon } from '@/lib/service-hero';
import { getPublishedTestimonials } from '@/lib/testimonials-server';
import type { Testimonial } from '@/lib/testimonials';

const HERO_ICONS: Record<HeroIcon, typeof UserRound> = { user: UserRound, type: Type, grid: Grid3x3, phone: Smartphone, baby: Baby, heart: HeartHandshake, store: Store, building: Building2, briefcase: BriefcaseBusiness, calendar: CalendarDays, pen: PenLine, label: BadgeCheck, matrix: Orbit, square: Sigma };

/** One real, published review for this service (else a general one). Full testimonial shown without truncation. */
async function heroReview(code: string): Promise<Testimonial | null> {
  const all = await getPublishedTestimonials().catch(() => [] as Testimonial[]);
  const t = all.find((x) => x.service === code) ?? all.find((x) => x.service === 'general') ?? all[0];
  return t ?? null;
}

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
  try { s = await getService(code); } catch { const d = DEFAULT_SERVICES.find((x) => x.code === code); s = d ? ({ ...d, mrpPaise: null, usdCents: null, usdMrpCents: null, priceConfirmed: false, active: true, featured: !!d.featured, sort: d.sort ?? 0, updatedAt: new Date() } as Service) : undefined; }
  if (!s || !s.active) return null;
  return { code: s.code, en: s.en, hi: s.hi, intake: s.intake, payable: isPayable(s), pricePaise: isPayable(s) ? s.pricePaise : null, mrpPaise: isPayable(s) ? s.mrpPaise : null, usdCents: isPayable(s) ? serviceUsd(s).usd : null, usdMrpCents: isPayable(s) ? serviceUsd(s).usdMrp : null };
}

const STEPS = [
  {
    step: 1,
    icon: FileText,
    title: { en: 'Book & share details', hi: 'विवरण साझा करें' },
    sub: { en: 'Name, DOB, gender & your 3 personal questions', hi: 'नाम, जन्म तिथि और अपने 3 व्यक्तिगत प्रश्न' },
  },
  {
    step: 2,
    icon: LockKeyhole,
    title: { en: 'Pay securely online', hi: 'सुरक्षित ऑनलाइन भुगतान' },
    sub: { en: 'Instant UPI, GPay, PhonePe, Cards or NetBanking', hi: 'UPI, Google Pay, कार्ड या नेटबैंकिंग द्वारा सुरक्षित' },
  },
  {
    step: 3,
    icon: Clock,
    title: { en: 'Acharya Nandram prepares it personally', hi: 'आचार्य नंदराम स्वयं तैयार करते हैं' },
    sub: { en: 'Deep Vedic & Chaldean chart reading (15+ yrs exp)', hi: 'वैदिक व कैल्डियन अंक ज्योतिष से हस्तलिखित गणना' },
  },
  {
    step: 4,
    icon: Send,
    title: { en: 'Instant Download · Email & WhatsApp', hi: 'तुरंत डाउनलोड · ईमेल और WhatsApp' },
    sub: { en: 'High-res designed PDF delivered within 3 hours + instant dashboard download', hi: '3 घंटे के भीतर सुंदर PDF ईमेल, WhatsApp और सीधे डाउनलोड करें' },
  },
];

const COMMON_FAQS: { en: [string, string]; hi: [string, string] }[] = [
  {
    en: [
      'When and how will I receive my report?',
      'Your high-resolution PDF report is delivered to your WhatsApp and Email within 3 hours of order confirmation. You can also view and download it directly anytime from your secure account dashboard.',
    ],
    hi: [
      'मुझे मेरी रिपोर्ट कब और कैसे मिलेगी?',
      'ऑर्डर की पुष्टि के 3 घंटे के भीतर आपकी उच्च-गुणवत्ता वाली PDF रिपोर्ट आपके WhatsApp और ईमेल पर भेज दी जाती है। आप इसे अपने खाते से भी कभी भी सीधे डाउनलोड कर सकते हैं।',
    ],
  },
  {
    en: [
      'Can I ask personal questions to Acharya Nandram?',
      'Yes! You can include up to 3 personal questions (career, business, marriage, relationship, or health) while booking. Acharya Nandram analyzes them personally and provides direct answers in your report.',
    ],
    hi: [
      'क्या मैं आचार्य नंदराम से अपने व्यक्तिगत प्रश्न पूछ सकता हूँ?',
      'हाँ! बुकिंग के समय आप करियर, व्यवसाय, विवाह, रिश्ते या स्वास्थ्य से जुड़े अधिकतम 3 व्यक्तिगत प्रश्न पूछ सकते हैं। आचार्य नंदराम स्वयं इनका विश्लेषण कर रिपोर्ट में उत्तर देते हैं।',
    ],
  },
  {
    en: [
      'Are the remedies practical and easy to follow?',
      'Absolutely. There are no expensive rituals, mandatory gemstones, or difficult poojas. Acharya Nandram provides 100% practical, zero-cost daily remedies: lucky colors, days, daily mantras, charity (daan), and basic vastu directions.',
    ],
    hi: [
      'क्या उपाय व्यावहारिक और अपनाने में आसान हैं?',
      'बिल्कुल। कोई महँगे अनुष्ठान, अनिवार्य रत्न या कठिन पूजा नहीं है। आचार्य नंदराम 100% व्यावहारिक और आसान उपाय बताते हैं: शुभ रंग, शुभ दिन, दैनिक मंत्र, दान और सरल वास्तु दिशाएँ।',
    ],
  },
  {
    en: [
      'Will my personal details and birth information remain confidential?',
      'Yes, 100% private and confidential. Your personal data is encrypted and used exclusively by Acharya Nandram to prepare your consultation report. We never share or sell personal information.',
    ],
    hi: [
      'क्या मेरी जानकारी और जन्म विवरण गोपनीय रहेंगे?',
      'हाँ, 100% निजी और गोपनीय। आपकी जानकारी पूरी तरह सुरक्षित रहती है और इसका उपयोग केवल आचार्य नंदराम द्वारा आपकी रिपोर्ट तैयार करने के लिए किया जाता है।',
    ],
  },
  {
    en: [
      'In which languages can I get the report?',
      'You can choose English, Hindi, or Hinglish (English script with conversational Hindi) based on your comfort when booking your consultation.',
    ],
    hi: [
      'मुझे रिपोर्ट किन भाषाओं में मिल सकती है?',
      'आप अपनी सुविधानुसार हिंदी, अंग्रेज़ी या हिंग्लिश (अंग्रेज़ी लिपि में हिंदी) में से किसी भी भाषा का चयन कर सकते हैं।',
    ],
  },
];

function AnimatedWhoItIsFor({ items }: { items: { en: string[]; hi: string[] } }) {
  const enrichments = [
    {
      icon: Compass,
      sub: { en: 'Get clarity on career crossroads, new business decisions, or relationship compatibility.', hi: 'करियर बदलाव, नए व्यवसाय के निर्णय या रिश्तों की अनुकूलता पर पूर्ण स्पष्टता पाएँ।' },
    },
    {
      icon: FileCheck,
      sub: { en: 'A comprehensive, permanent reference PDF with verified core numbers and remedies.', hi: 'प्रमाणित मूल अंकों और उपायों के साथ एक विस्तृत, स्थायी संदर्भ दस्तावेज़।' },
    },
    {
      icon: Sparkles,
      sub: { en: 'Move beyond generic automated tools to deep, expert-level hand-analyzed guidance.', hi: 'सामान्य ऑटोमेटेड टूल से आगे बढ़कर विशेषज्ञ स्तर के व्यक्तिगत मार्गदर्शन का लाभ लें।' },
    },
    {
      icon: Languages,
      sub: { en: 'Clear, compassionate advice written naturally in your preferred language.', hi: 'आपकी पसंदीदा भाषा में सहज और स्पष्ट रूप से लिखा गया व्यक्तिगत परामर्श।' },
    },
    {
      icon: Target,
      sub: { en: 'Overcome repeating hurdles, delays, or financial roadblocks with targeted remedies.', hi: 'लक्षित उपायों द्वारा बार-बार आने वाली बाधाओं, देरी या वित्तीय रुकावटों से मुक्ति पाएँ।' },
    },
    {
      icon: ShieldCheck,
      sub: { en: '100% confidential consultation prepared directly by Acharya Nandram.', hi: 'आचार्य नंदराम द्वारा स्वयं तैयार किया गया 100% गोपनीय एवं प्रमाणित परामर्श।' },
    },
  ];

  return (
    <div className="glass relative overflow-hidden rounded-2xl border border-gold/30 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold"><Bi en="Tailored For You" hi="आपके लिए विशेष" /></p>
            <h2 id="who-h" className="font-cinzel text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-gold" /><Bi en="Who It Is For" hi="यह किनके लिए है" />
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success border border-success/30">
            <CheckCircle2 className="h-3 w-3" />
            <Bi en="High Accuracy" hi="सटीक मार्गदर्शन" />
          </span>
        </div>

        <div className="space-y-2.5">
          <ForLang>
            {(lang) => (
              <>
                {items[lang].map((title, i) => {
                  const extra = enrichments[i] ?? enrichments[0];
                  const Icon = extra.icon;
                  return (
                    <div
                      key={title}
                      className="group relative flex items-start gap-3 rounded-xl border border-gold/15 bg-background/50 p-2.5 sm:p-3 hover:border-gold/50 hover:bg-gold/5 hover:translate-x-1 transition-all duration-300"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold ring-1 ring-gold/30 group-hover:scale-110 group-hover:rotate-6 transition-transform mt-0.5">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm sm:text-[15px] text-foreground group-hover:text-gold transition-colors leading-snug">
                          {title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-normal">
                          {extra.sub[lang]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </ForLang>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gold/15 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-gold" /><Bi en="Zero guesswork · 100% authentic" hi="कोई अटकलें नहीं · 100% प्रामाणिक" /></span>
        <span className="text-gold font-semibold font-serif"><Bi en="15+ Yrs Experience" hi="15+ वर्ष अनुभव" /></span>
      </div>
    </div>
  );
}

function AnimatedHowItWorks() {
  return (
    <div className="glass relative overflow-hidden rounded-2xl border border-gold/30 p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold"><Bi en="Simple 4-Step Process" hi="सरल 4-चरणीय प्रक्रिया" /></p>
          <h2 className="font-cinzel text-2xl font-bold"><Bi en="How It Works" hi="प्रक्रिया" /></h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold border border-gold/30">
          <Sparkles className="h-3 w-3 animate-spin text-gold" style={{ animationDuration: '4s' }} />
          <Bi en="3-hr delivery" hi="3 घंटे में डिलीवरी" />
        </span>
      </div>

      <div className="relative space-y-3.5">
        {/* Animated glowing vertical connector line */}
        <div aria-hidden className="cz-step-line pointer-events-none absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-gold/70 via-gold/40 to-gold/20" />

        {STEPS.map((s) => (
          <div key={s.step} className="cz-step-card group relative flex items-start gap-3 rounded-xl border border-gold/15 bg-background/50 p-2.5 sm:p-3 hover:border-gold/50 hover:bg-gold/5 transition-all">
            <div className="cz-step-badge cz-step-pulse h-10 w-10 shrink-0 font-cinzel text-sm font-bold text-gold">
              <span className="relative z-10">{s.step}</span>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-gold/15 text-gold group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <s.icon className="h-3.5 w-3.5" />
                </span>
                <p className="font-semibold text-sm sm:text-base text-foreground group-hover:text-gold transition-colors leading-snug">
                  <Bi en={s.title.en} hi={s.title.hi} />
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-normal pl-8">
                <Bi en={s.sub.en} hi={s.sub.hi} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function ServiceLanding({ slug, children }: { slug: string; children?: ReactNode }) {
  const page = servicePageBySlug(slug)!;
  const [svc, liveOffer, review] = await Promise.all([loadService(page.serviceCode), getLiveOffer(), heroReview(page.serviceCode)]);
  const hero = heroFor(slug);
  const HeroIc = HERO_ICONS[hero.icon];
  const offerOn = liveOffer && svc?.pricePaise ? liveOffer : null;
  const endText = offerOn ? { en: formatOfferEnd(offerOn.endsAt, 'en'), hi: formatOfferEnd(offerOn.endsAt, 'hi') } : null;
  const wa = funnelWhatsapp();
  const funnelServices = svc ? [{ code: svc.code, name: { en: svc.en.name, hi: svc.hi.name } }] : [];
  const others = SERVICE_PAGES.filter((x) => x.slug !== slug);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Service', name: page.h1.en, description: page.description, serviceType: 'Numerology consultation', areaServed: 'IN', url: abs(`/${page.slug}`), availableLanguage: ['English', 'Hindi'],
      provider: { '@type': 'Person', name: EXPERT.name, url: abs('/about') },
      ...(svc?.pricePaise ? { offers: { '@type': 'Offer', price: (svc.pricePaise / 100).toFixed(2), priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: abs(`/${page.slug}`), ...(offerOn ? { priceValidUntil: offerOn.endsAt.slice(0, 10) } : {}) } } : {}) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: f.en[0], acceptedAnswer: { '@type': 'Answer', text: f.en[1] } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', item: abs('/') }, { name: 'Services', item: abs('/services') }, { name: page.h1.en, item: abs(`/${page.slug}`) }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, ...x })) },
  ];
  const offer = svc && (
    <div className="glass rounded-2xl border border-gold/40 p-5 sm:p-6">
      <BiBlock en={<OfferText t={svc.en} />} hi={<OfferText t={svc.hi} />} />
      {offerOn && endText && <div className="mt-4"><OfferCountdown variant="inline" endsAt={offerOn.endsAt} label={offerOn.label} endText={endText} /></div>}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-border/50 pt-4">
        <div>
          {svc.pricePaise ? (
            <ServicePrice s={svc} note={{ en: 'secure payment by Cashfree', hi: 'Cashfree द्वारा सुरक्षित भुगतान' }} />
          ) : (
            <div>
              <p className="font-serif text-xl font-semibold text-gold"><Bi en="Price on request" hi="मूल्य पूछताछ पर" /></p>
              <p className="text-xs text-muted-foreground"><Bi en="Send an enquiry for the fee" hi="शुल्क जानने के लिए पूछताछ भेजें" /></p>
            </div>
          )}
        </div>
        <BookService svc={svc} whatsapp={wa} className="min-w-[180px]" />
      </div>
    </div>
  );
  return (
    <div className="container max-w-6xl space-y-12 pb-24 pt-6 sm:pt-10 md:pb-14">
      {offerOn && endText && <OfferCountdown endsAt={offerOn.endsAt} label={offerOn.label} endText={endText} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(ld) }} />
      <nav aria-labelledby="bc-label" className="text-xs text-muted-foreground"><span id="bc-label" className="sr-only"><Bi en="Breadcrumb" hi="पथ" /></span><Link href="/" className="hover:text-foreground"><Bi en="Home" hi="होम" /></Link> / <Link href="/services" className="hover:text-foreground"><Bi en="Services" hi="सेवाएँ" /></Link> / <Bi en={page.h1.en} hi={page.h1.hi} /></nav>
      <section aria-labelledby="sh-h1" className="sh-hero relative -mx-4 overflow-hidden rounded-none px-4 py-8 sm:mx-0 sm:rounded-3xl sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div aria-hidden className="sh-ring hidden lg:block"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span></div>
        <div className="relative grid items-start gap-8 lg:grid-cols-[1fr_400px] lg:gap-x-10 lg:gap-y-6">
          <header className="mk-rise space-y-5 lg:col-start-1 lg:row-start-1">
            <div className="space-y-5 pr-28 sm:pr-40 lg:pr-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold"><span className="cz-eyebrow-dot" /><HeroIc className="h-3.5 w-3.5" /><Bi en={hero.tag.en} hi={hero.tag.hi} /></span>
              {offerOn && <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-3 py-1 text-xs font-semibold text-danger"><Sparkles className="h-3.5 w-3.5" /><Bi en={offerOn.label.en} hi={offerOn.label.hi} /></span>}
            </div>
            <h1 id="sh-h1" className="font-cinzel text-4xl font-bold leading-tight sm:text-5xl"><span className="gold-text"><Bi en={page.h1.en} hi={page.h1.hi} /></span></h1>
            </div>
            <p className="max-w-xl text-lg leading-relaxed text-foreground/90 sm:text-xl"><Bi en={hero.hook.en} hi={hero.hook.hi} /></p>
            {svc && svc.en.includes.length > 0 && (
              <BiBlock en={<HeroPoints items={svc.en.includes} />} hi={<HeroPoints items={svc.hi.includes} />} />
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="#book" className="cz-btn cz-btn-primary h-12 px-6 text-base"><Sparkles className="h-4 w-4" /><Bi en={svc?.payable ? 'Book my report' : 'Send an enquiry'} hi={svc?.payable ? 'मेरी रिपोर्ट बुक करें' : 'पूछताछ भेजें'} /></a>
              <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Namaste Acharya ji, I want to know about ${page.h1.en}.`)}`} target="_blank" rel="noopener noreferrer" className="cz-btn cz-btn-ghost h-12 px-5 text-base"><MessageCircle className="h-4 w-4 text-success" /><Bi en="Ask on WhatsApp" hi="WhatsApp पर पूछें" /></a>
            </div>
          </header>
          <div id="book" className="scroll-mt-24 lg:relative lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
            <span id="free" className="sr-only" />
            <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-24 w-28 sm:h-32 sm:w-40 lg:static lg:mx-auto lg:-mb-4 lg:h-44 lg:w-56"><HeroArt kind={hero.icon} /></div>
            <HeroActionCard
              freeTitle={hero.freeTitle}
              free={<LeadForm services={funnelServices} defaultService={svc?.code ?? ''} whatsapp={wa} compact bookHref="#book" labels={hero.leadLabels} />}
              book={offer || null}
            />
          </div>
          <div className="space-y-5 lg:col-start-1 lg:row-start-2">
              <div className="flex items-center gap-3.5 border-t border-gold/15 pt-5">
                <Image src="/images/acharya-nandram-512.png" alt={EXPERT.name} width={64} height={64} className="h-16 w-16 shrink-0 rounded-full border-2 border-gold/60 object-cover shadow-[0_0_20px_hsl(var(--gold)/0.4)]" />
                <div className="space-y-0.5 leading-snug">
                  <p className="font-serif text-lg sm:text-xl font-bold text-foreground">
                    <Bi en={`Prepared personally by ${EXPERT.name}`} hi="आचार्य नंदराम द्वारा स्वयं तैयार" />
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    <Bi en="15+ years · Vedic, Chaldean & Lo Shu numerology" hi="15+ वर्ष · वैदिक, कैल्डियन और लो शू अंक ज्योतिष" />
                  </p>
                </div>
              </div>
              <ul className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:gap-x-5">
                <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /><Bi en="Secure payment · Cashfree" hi="सुरक्षित भुगतान · Cashfree" /></li>
                <li className="flex items-center gap-1.5"><Languages className="h-4 w-4 text-gold" /><Bi en="English & हिंदी" hi="हिंदी और English" /></li>
                <li className="flex items-center gap-1.5"><Send className="h-4 w-4 text-gold" /><Bi en="Download · Email & WhatsApp" hi="डाउनलोड · ईमेल और WhatsApp" /></li>
                <li><a href="#inside-report" className="flex items-center gap-1.5 text-gold hover:underline"><FileText className="h-4 w-4" /><Bi en="See sample report pages" hi="नमूना रिपोर्ट पृष्ठ देखें" /></a></li>
              </ul>
              {review && (
                <figure className="glass relative max-w-xl rounded-xl border border-gold/25 p-4 pl-11 shadow-md">
                  <Quote aria-hidden className="absolute left-3 top-4 h-5 w-5 text-gold/70" />
                  <blockquote className="text-sm italic text-foreground/90 leading-relaxed">
                    “<Bi en={review.quoteEn} hi={review.quoteHi} />”
                  </blockquote>
                  <figcaption className="mt-2 text-xs text-muted-foreground">— <span className="font-semibold text-foreground">{review.name}</span>{review.location ? `, ${review.location}` : ''}{review.rating ? ` · ${'★'.repeat(review.rating)}` : ''}</figcaption>
                </figure>
              )}
          </div>
        </div>
      </section>

      <section aria-label={page.h1.en} className="mx-auto max-w-3xl">
        <BiBlock className="space-y-3" en={page.intro.en.map((x) => <p key={x} className="text-lg text-muted-foreground">{x}</p>)} hi={page.intro.hi.map((x) => <p key={x} className="text-lg text-muted-foreground">{x}</p>)} />
      </section>
      <ServiceReturnBanner />

      {page.calculator && (
        <section aria-labelledby="calc-h" className="space-y-4">
          <h2 id="calc-h" className="font-cinzel text-2xl font-bold sm:text-3xl"><Bi en={page.calculator.title.en} hi={page.calculator.title.hi} /></h2>
          <Calculator kind={page.calculator.kind} />
        </section>
      )}

      {children}

      <InsideReportSection slug={slug} />

      <section aria-labelledby="who-h" className="grid gap-6 md:grid-cols-2 items-stretch">
        <AnimatedWhoItIsFor items={page.forWho} />
        <AnimatedHowItWorks />
      </section>

      <section aria-labelledby="faq-h" className="mx-auto max-w-3xl space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold"><Bi en="Got Questions?" hi="प्रश्न हैं?" /></p>
          <h2 id="faq-h" className="mt-1 font-cinzel text-3xl font-bold"><Bi en="Frequently Asked Questions" hi="अक्सर पूछे जाने वाले प्रश्न" /></h2>
          <p className="text-sm text-muted-foreground mt-1"><Bi en="Everything you need to know about your consultation, delivery and remedies." hi="आपकी रिपोर्ट, परामर्श, डिलीवरी और उपायों के बारे में सभी जानकारी।" /></p>
        </div>
        <div className="space-y-2.5 pt-2">
          {[...page.faq, ...COMMON_FAQS].map((f) => (
            <details key={f.en[0]} className="group glass rounded-xl border border-gold/20 p-4 transition-all hover:border-gold/45">
              <summary className="cursor-pointer font-semibold text-foreground flex items-center justify-between gap-3 list-none">
                <span className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-gold/60 shrink-0 group-open:bg-gold group-open:scale-125 transition-transform" />
                  <span className="group-hover:text-gold transition-colors text-sm sm:text-base"><Bi en={f.en[0]} hi={f.hi[0]} /></span>
                </span>
                <span className="font-mono text-xs text-gold/70 group-open:rotate-180 transition-transform shrink-0">▼</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground pl-4 border-l-2 border-gold/30 leading-relaxed">
                <Bi en={f.en[1]} hi={f.hi[1]} />
              </p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="lead-h" className="grid items-center gap-6 rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold/10 via-card/70 to-maroon/25 p-6 grid-cols-[minmax(0,1fr)] sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold"><Bi en="Free · 30 seconds" hi="मुफ़्त · 30 सेकंड" /></p>
          <h2 id="lead-h" className="mt-1 font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="Get Your Free Mini-Reading" hi="अपनी मुफ़्त मिनी-रीडिंग पाएँ" /></h2>
          <p className="mt-2 text-muted-foreground"><Bi en="See your Moolank and Bhagyank instantly, understand your core numbers, and get a direct WhatsApp line to Acharya Nandram." hi="अपना मूलांक और भाग्यांक तुरंत देखें, अपने मूल अंकों को समझें और आचार्य नंदराम से सीधे WhatsApp पर जुड़ें।" /></p></div>
        <div className="glass rounded-xl p-5"><LeadForm services={funnelServices} defaultService={svc?.code ?? ''} whatsapp={wa} compact bookHref="#book" labels={hero.leadLabels} /></div>
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
      <StickyCta whatsapp={wa} bookHref="#book" />
    </div>
  );
}

function HeroPoints({ items }: { items: string[] }) {
  return <ul className="grid gap-2 sm:grid-cols-2">{items.slice(0, 4).map((x) => <li key={x} className="flex gap-2 text-sm sm:text-[15px]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>)}</ul>;
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
