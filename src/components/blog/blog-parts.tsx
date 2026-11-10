import Link from 'next/link';
import { Award, BadgeCheck, BookOpen, CheckCircle, Languages, Sparkles, Users } from 'lucide-react';
import { ForLang } from '@/components/i18n/bi';

type Lang = 'en' | 'hi';

/** Call-to-action block used inside every blog post. `banner` is compact (mid-article); `big` closes the article. */
export function BlogCta({ city, cityHi, variant = 'banner' }: { city: string; cityHi?: string; variant?: 'banner' | 'big' }) {
  return <ForLang>{(l) => <BlogCtaView city={l === 'hi' ? cityHi ?? city : city} lang={l} variant={variant} />}</ForLang>;
}

const CTA = {
  en: { forCity: (c: string) => `For ${c}`, free: 'Free to start', h: 'Get Your Personal Numerology Reading from Acharya Nandram',
    bigP: (c: string) => `Whether you are in ${c} or anywhere in India, your Moolank, Bhagyank, Lo Shu grid, name and mobile number are read together and explained in simple language, with remedies you can follow.`,
    smallP: (c: string) => `Online for ${c} and all of India. Start with the free calculators, then get your complete life report.`,
    list: ['Date of birth, Moolank & Bhagyank analysis', 'Name and signature harmony', 'Mobile number compatibility score', 'Couple compatibility reading', 'Designed PDF in English, Hindi or Hinglish', 'Personal remedies and lucky details'],
    get: 'Get My Reading', plans: 'See Plans & Pricing', calc: 'Or try the free calculators →', aria: 'Get your numerology reading' },
  hi: { forCity: (c: string) => `${c} के लिए`, free: 'मुफ़्त शुरुआत', h: 'आचार्य नंदराम से अपनी व्यक्तिगत अंक ज्योतिष रीडिंग पाएँ',
    bigP: (c: string) => `चाहे आप ${c} में हों या भारत में कहीं भी, आपके मूलांक, भाग्यांक, लो शू ग्रिड, नाम और मोबाइल नंबर को एक साथ पढ़ा जाता है और सरल भाषा में समझाया जाता है, साथ में ऐसे उपाय जिन्हें आप आसानी से अपना सकें।`,
    smallP: (c: string) => `${c} और पूरे भारत के लिए ऑनलाइन। मुफ़्त कैलकुलेटर से शुरुआत करें, फिर अपनी संपूर्ण जीवन रिपोर्ट पाएँ।`,
    list: ['जन्म तिथि, मूलांक और भाग्यांक विश्लेषण', 'नाम और हस्ताक्षर का सामंजस्य', 'मोबाइल नंबर अनुकूलता स्कोर', 'जोड़ी मिलान रीडिंग', 'अंग्रेज़ी, हिंदी या हिंग्लिश में डिज़ाइन की हुई PDF', 'व्यक्तिगत उपाय और शुभ विवरण'],
    get: 'मेरी रीडिंग पाएँ', plans: 'प्लान और मूल्य देखें', calc: 'या मुफ़्त कैलकुलेटर आज़माएँ →', aria: 'अपनी अंक ज्योतिष रीडिंग पाएँ' },
};

function BlogCtaView({ city, lang, variant }: { city: string; lang: Lang; variant: 'banner' | 'big' }) {
  const t = CTA[lang];
  const big = variant === 'big';
  return (
    <aside aria-label={t.aria} className={`relative overflow-hidden rounded-2xl border border-gold/50 bg-gradient-to-br from-gold/15 via-card/70 to-maroon/25 ${big ? 'p-7 sm:p-10' : 'p-5 sm:p-6'} shadow-[0_0_34px_hsl(var(--gold)/0.16)]`}>
      <span className="mk-spin pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-dashed border-gold/40" />
      <div className={`relative grid items-center gap-5 ${big ? 'md:grid-cols-[1fr_auto]' : 'sm:grid-cols-[1fr_auto]'}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{big ? t.forCity(city) : t.free}</p>
          <h3 className={`font-cinzel mt-1 font-bold ${big ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>{t.h}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{big ? t.bigP(city) : t.smallP(city)}</p>
          {big && <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">{t.list.map((x) => <li key={x} className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{x}</li>)}</ul>}
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[210px]">
          <Link href="/reading" className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-6 font-semibold text-[hsl(250_45%_10%)] hover:brightness-105"><Sparkles className="h-4 w-4" />{t.get}</Link>
          <Link href="/pricing" className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-md border border-gold/50 px-5 text-sm hover:bg-gold/10">{t.plans}</Link>
          <Link href="/calculators" className="text-center text-xs text-gold hover:underline">{t.calc}</Link>
        </div>
      </div>
    </aside>
  );
}

const AP = {
  en: { stats: [['15+', 'Years of experience'], ['1000s', 'Individuals & families guided'], ['3', 'Report languages: EN, हिं, Hinglish'], ['6', 'Reading modules']] as [string, string][],
    skills: ['Vedic numerology (Moolank, Bhagyank, Kua)', 'Chaldean name and signature analysis', 'Lo Shu grid and missing-number remedies', 'Mobile and Aadhaar vibration (consent-based)', 'Couple and marriage compatibility', 'Personal remedies: colours, days, mantras and daan'],
    eyebrow: 'About the author · Lead numerologist & guide', name: 'Acharya Nandram', exp: 'Experience: 15+ Years', initials: 'AN',
    bio: 'With more than 15 years of dedicated practice in Vedic, Chaldean and Lo Shu grid numerology, Acharya Nandram has guided thousands of individuals and families toward clarity, success and prosperity through precise number vibrations and personalised remedies.',
    online: (c: string) => ` Reports and consultations are delivered online, so people in ${c} and across India can use them from home.`,
    expertise: 'Areas of expertise', approach: 'His approach',
    approachList: ['Exact, traditional calculations so results are consistent every time.', 'Plain-language explanations you can read with your family.', 'Guidance, not fear: numerology supports decisions, it does not replace professional advice.'], langs: 'Reports in English, Hindi and Hinglish.',
    start: 'Start my free reading', report: 'Complete life report', calcs: 'Free calculators →', aria: 'About Acharya Nandram' },
  hi: { stats: [['15+', 'वर्षों का अनुभव'], ['हज़ारों', 'व्यक्ति और परिवार लाभान्वित'], ['3', 'रिपोर्ट की भाषाएँ: अंग्रेज़ी, हिंदी, हिंग्लिश'], ['6', 'रीडिंग मॉड्यूल']] as [string, string][],
    skills: ['वैदिक अंक ज्योतिष (मूलांक, भाग्यांक, कुआ)', 'कैल्डियन नाम और हस्ताक्षर विश्लेषण', 'लो शू ग्रिड और अनुपस्थित अंकों के उपाय', 'मोबाइल और आधार वाइब्रेशन (सहमति से)', 'जोड़ी और विवाह अनुकूलता', 'व्यक्तिगत उपाय: रंग, दिन, मंत्र और दान'],
    eyebrow: 'लेखक के बारे में · प्रमुख अंक ज्योतिषी और मार्गदर्शक', name: 'आचार्य नंदराम', exp: 'अनुभव: 15+ वर्ष', initials: 'आ',
    bio: 'वैदिक, कैल्डियन और लो शू ग्रिड अंक ज्योतिष में 15 वर्षों से अधिक की समर्पित साधना के साथ, आचार्य नंदराम ने सटीक अंक-कंपन और व्यक्तिगत उपायों के माध्यम से हज़ारों व्यक्तियों और परिवारों को स्पष्टता, सफलता और समृद्धि की राह दिखाई है।',
    online: (c: string) => ` रिपोर्ट और परामर्श ऑनलाइन दिए जाते हैं, इसलिए ${c} और पूरे भारत के लोग घर बैठे इनका लाभ ले सकते हैं।`,
    expertise: 'विशेषज्ञता के क्षेत्र', approach: 'उनकी कार्य-पद्धति',
    approachList: ['सटीक, पारंपरिक गणना, ताकि परिणाम हर बार एक जैसे रहें।', 'सरल भाषा में व्याख्या, जिसे आप परिवार के साथ पढ़ सकें।', 'डर नहीं, मार्गदर्शन: अंक ज्योतिष निर्णयों में सहायता करता है, पेशेवर सलाह का विकल्प नहीं है।'], langs: 'अंग्रेज़ी, हिंदी और हिंग्लिश में रिपोर्ट।',
    start: 'मेरी मुफ़्त रीडिंग शुरू करें', report: 'संपूर्ण जीवन रिपोर्ट', calcs: 'मुफ़्त कैलकुलेटर →', aria: 'आचार्य नंदराम के बारे में' },
};

/** Full profile of the numerologist, shown at the end of every post. Facts are the ones already published on the home page. */
export function AcharyaProfile({ city, cityHi }: { city?: string; cityHi?: string }) {
  return <div id="expert" className="scroll-mt-24"><ForLang>{(l) => <AcharyaProfileView city={l === 'hi' ? cityHi ?? city : city} lang={l} />}</ForLang></div>;
}

function AcharyaProfileView({ city, lang }: { city?: string; lang: Lang }) {
  const t = AP[lang];
  const stats = t.stats, skills = t.skills;
  return (
    <section aria-label={t.aria} className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-card/90 via-card/75 to-card/90 p-6 shadow-[0_0_40px_hsl(var(--gold)/0.14)] sm:p-9">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative grid gap-7 md:grid-cols-[auto_1fr]">
        <div className="relative mx-auto h-36 w-36 shrink-0">
          <span className="mk-spin absolute inset-0 rounded-full border border-dashed border-gold/60" />
          <span className="mk-spin-rev absolute inset-3 rounded-full border border-gold/30" />
          <span className="mk-pulse absolute inset-5 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a]"><span className="gold-text font-cinzel text-4xl font-bold">{t.initials}</span></span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{t.eyebrow}</p>
          <h2 className="font-cinzel mt-1 text-3xl font-bold">{t.name}</h2>
          <p className="mt-1 inline-flex items-center gap-2 rounded-md bg-gold/15 px-3 py-1 text-sm font-semibold text-gold"><Award className="h-4 w-4" />{t.exp}</p>
          <p className="mt-3 text-muted-foreground">{t.bio}{city ? t.online(city) : ''}</p>
        </div>
      </div>
      <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">{stats.map(([n, l]) => <div key={l} className="rounded-lg border border-gold/25 bg-background/40 p-3 text-center"><p className="gold-text font-serif text-3xl font-bold">{n}</p><p className="text-xs text-muted-foreground">{l}</p></div>)}</div>
      <div className="relative mt-6 grid gap-6 md:grid-cols-2">
        <div><h3 className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold"><BookOpen className="h-4 w-4 text-gold" />{t.expertise}</h3><ul className="space-y-1.5 text-sm">{skills.map((s) => <li key={s} className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{s}</li>)}</ul></div>
        <div><h3 className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold"><Users className="h-4 w-4 text-gold" />{t.approach}</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">{t.approachList.map((x) => <li key={x} className="flex gap-2"><span className="text-gold">✦</span>{x}</li>)}<li className="flex gap-2"><Languages className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{t.langs}</li></ul></div>
      </div>
      <div className="relative mt-7 flex flex-wrap gap-3">
        <Link href="/reading" className="inline-flex h-11 items-center gap-2 rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-5 text-sm font-semibold text-[hsl(250_45%_10%)] hover:brightness-105"><Sparkles className="h-4 w-4" />{t.start}</Link>
        <Link href="/pricing" className="inline-flex h-11 items-center rounded-md border border-gold/50 px-5 text-sm hover:bg-gold/10">{t.report}</Link>
        <Link href="/calculators" className="inline-flex h-11 items-center rounded-md px-3 text-sm text-gold hover:underline">{t.calcs}</Link>
      </div>
    </section>
  );
}
