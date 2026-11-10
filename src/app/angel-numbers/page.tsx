import type { Metadata } from 'next';
import { jsonLd as toLd } from '@/lib/seo/site';
import Link from 'next/link';
import { ArrowRight, Calculator, Clock, Eye, Heart, Sparkles } from 'lucide-react';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { AngelCta, AngelOrb, GOLD_BTN } from '@/components/angel/angel-parts';
import { AngelCalculator } from '@/components/angel/angel-calculator';
import { AngelExplorer, type AngelLite } from '@/components/angel/angel-explorer';
import { analyse, buildAngel, TOP_ANGEL } from '@/lib/angel/generate';
import { DIGITS } from '@/lib/angel/digits';
import { DIGITS_HI } from '@/lib/angel/digits-hi';
import { buildAngelHi } from '@/lib/angel/generate-hi';
import { Bi } from '@/components/i18n/bi';

export const metadata: Metadata = {
  title: 'Angel Numbers – Meanings of 1,400+ Angel Numbers (Love, Twin Flame, Career)',
  description: 'Meanings of every angel number, from 222, 777, 444 and 1111 to rare sequences, with love, twin flame, career, Hindi meaning and a free date-of-birth compatibility calculator by Acharya Nandram.',
  keywords: ['angel numbers', 'angel number meanings', 'all angel numbers', 'angel numbers list', 'angel number calculator', 'find my angel number', 'angel number meaning in hindi', 'twin flame numbers'],
  alternates: { canonical: '/angel-numbers' },
};

const FAQS = [
  { q: 'What are angel numbers?', a: 'Angel numbers are repeating or meaningful number sequences, such as 111, 222 or 11:11, that people notice again and again. In spiritual tradition they are read as gentle messages from the divine, your guides or your own intuition. Their meaning comes from the digits they contain.' },
  { q: 'How do I find my angel number?', a: 'Your personal angel number comes from your date of birth. Add all the digits of your birth date to get your Bhagyank (life path); repeating it gives your life path angel number, for example Bhagyank 7 gives 777. Use the free calculator on this page to find all four of your personal angel numbers.' },
  { q: 'Which angel number is the most powerful?', a: '1111 is the most famous because of its link with manifestation and 11:11 on the clock. By search interest in India, 222, 777 and 444 are the most looked-up. The most meaningful one for you is the number that keeps appearing in your life and aligns with your date of birth.' },
  { q: 'Are there bad angel numbers?', a: 'No. In angel-number tradition every number is guidance. Numbers such as 666 or 444 sometimes worry people, but they are read as calls to rebalance and to build stability, not as bad omens.' },
  { q: 'What does it mean when I see the same number on the clock?', a: 'Mirror and repeating times such as 11:11, 12:12 or 2:22 are among the most common forms of angel numbers. Look up the number on this page and notice what you were thinking at that moment.' },
  { q: 'Is angel number numerology the same as Indian numerology?', a: 'Angel numbers come from a modern spiritual tradition, while Indian numerology (Moolank, Bhagyank, Lo Shu grid) is a structured system. Our pages combine both: digit meanings with their Vedic ruling planets, and a compatibility check against your Moolank and Bhagyank.' },
];

const FAQS_HI = [
  { q: 'एंजेल नंबर क्या होते हैं?', a: 'एंजेल नंबर ऐसे दोहराए जाने वाले या अर्थपूर्ण अंक-क्रम हैं, जैसे 111, 222 या 11:11, जिन्हें लोग बार-बार देखते हैं। आध्यात्मिक परंपरा में इन्हें ईश्वर, आपके मार्गदर्शकों या आपके अंतर्ज्ञान के कोमल संदेश माना जाता है। इनका अर्थ इनमें मौजूद अंकों से निकलता है।' },
  { q: 'मैं अपना एंजेल नंबर कैसे जानूँ?', a: 'आपका व्यक्तिगत एंजेल नंबर आपकी जन्म तिथि से निकलता है। जन्म तिथि के सभी अंक जोड़ें तो भाग्यांक मिलता है; उसे तीन बार दोहराने पर आपका जीवन-पथ एंजेल नंबर बनता है, जैसे भाग्यांक 7 से 777। इस पेज के मुफ़्त कैलकुलेटर से अपने चारों व्यक्तिगत एंजेल नंबर जानें।' },
  { q: 'सबसे शक्तिशाली एंजेल नंबर कौन-सा है?', a: 'मैनिफेस्टेशन और घड़ी के 11:11 से जुड़े होने के कारण 1111 सबसे प्रसिद्ध है। भारत में खोज के आधार पर 222, 777 और 444 सबसे अधिक खोजे जाते हैं। आपके लिए सबसे सार्थक वही अंक है जो आपके जीवन में बार-बार दिखे और आपकी जन्म तिथि से मेल खाए।' },
  { q: 'क्या कोई एंजेल नंबर अशुभ होता है?', a: 'नहीं। एंजेल नंबर परंपरा में हर अंक मार्गदर्शन है। 666 या 444 जैसे अंक कभी-कभी लोगों को चिंतित करते हैं, पर इन्हें संतुलन लाने और स्थिरता बनाने के संकेत के रूप में पढ़ा जाता है, बुरे शगुन के रूप में नहीं।' },
  { q: 'घड़ी पर बार-बार एक ही समय दिखने का क्या अर्थ है?', a: '11:11, 12:12 या 2:22 जैसे दर्पण और दोहराव वाले समय एंजेल नंबर के सबसे आम रूपों में से हैं। इस पेज पर वह अंक खोजें और ध्यान दें कि उस क्षण आप क्या सोच रहे थे।' },
  { q: 'क्या एंजेल नंबर और भारतीय अंक ज्योतिष एक ही हैं?', a: 'एंजेल नंबर एक आधुनिक आध्यात्मिक परंपरा से आते हैं, जबकि भारतीय अंक ज्योतिष (मूलांक, भाग्यांक, लो शू ग्रिड) एक व्यवस्थित पद्धति है। हमारे पेज दोनों को जोड़ते हैं: अंकों के अर्थ उनके वैदिक स्वामी ग्रहों के साथ, और आपके मूलांक व भाग्यांक से अनुकूलता की जाँच।' },
];

const H = {
  en: { eyebrow: 'Angel number guide', h1: 'Angel Numbers', h1sub: 'Meanings of 1,400+ numbers, explained the Indian way',
    p: 'Keep seeing 222, 777, 444 or 11:11? Find out what your angel number means for love, twin flames, career and money, and check whether it matches your date of birth.',
    find: 'Find My Angel Number', browse: 'Browse all numbers', topH: 'Most Searched Angel Numbers', topP: 'Ranked by how often people in India search for them. Tap a number for its full meaning.', read: 'Read meaning',
    calcH: 'Angel Number Calculator by Date of Birth', calcP: 'Find your personal angel numbers, check whether the number you keep seeing is compatible with your date of birth, or discover your couple angel number.',
    whatH: 'What Are Angel Numbers?', what1: 'Angel numbers are number sequences that seem to follow you: 1:11 on the clock, 444 on a bill, 2222 on a number plate. In spiritual tradition they are read as gentle messages, reminders to pause, trust and notice what is happening in your life.',
    what2: 'Each digit carries a meaning, and repetition amplifies it. Acharya Nandram reads angel numbers alongside Indian numerology, so each digit is also linked with its ruling planet and checked against your Moolank and Bhagyank.',
    steps: [['Notice', 'Where and when you saw the number.'], ['Read', 'Look up its meaning and digits.'], ['Reflect', 'Connect it with your question.'], ['Act', 'Take one small aligned step.']],
    digitsH: 'Meaning of Each Digit 0–9', allH: 'All Angel Numbers and Their Meanings', allP: 'Every number below has its own detailed page: meaning, digits, spiritual meaning, love, twin flame, career, Hindi meaning and a date-of-birth compatibility check.', faqH: 'Angel Number FAQs' },
  hi: { eyebrow: 'एंजेल नंबर मार्गदर्शिका', h1: 'एंजेल नंबर', h1sub: '1,400 से अधिक अंकों के अर्थ, भारतीय पद्धति से समझाए गए',
    p: 'क्या आपको बार-बार 222, 777, 444 या 11:11 दिखता है? जानिए प्रेम, ट्विन फ्लेम, करियर और धन के लिए आपके एंजेल नंबर का क्या अर्थ है, और जाँचिए कि यह आपकी जन्म तिथि से मेल खाता है या नहीं।',
    find: 'मेरा एंजेल नंबर खोजें', browse: 'सभी अंक देखें', topH: 'सबसे अधिक खोजे जाने वाले एंजेल नंबर', topP: 'भारत में लोग इन्हें कितनी बार खोजते हैं, उसी क्रम में। पूरा अर्थ पढ़ने के लिए किसी अंक पर टैप करें।', read: 'अर्थ पढ़ें',
    calcH: 'जन्म तिथि से एंजेल नंबर कैलकुलेटर', calcP: 'अपने व्यक्तिगत एंजेल नंबर जानें, जाँचें कि बार-बार दिखने वाला अंक आपकी जन्म तिथि से मेल खाता है या नहीं, या अपनी जोड़ी का एंजेल नंबर जानें।',
    whatH: 'एंजेल नंबर क्या होते हैं?', what1: 'एंजेल नंबर ऐसे अंक-क्रम हैं जो मानो आपका पीछा करते हैं: घड़ी पर 1:11, बिल पर 444, गाड़ी के नंबर पर 2222। आध्यात्मिक परंपरा में इन्हें कोमल संदेश माना जाता है – रुकने, भरोसा रखने और अपने जीवन में हो रही बातों पर ध्यान देने की याद।',
    what2: 'हर अंक का एक अर्थ होता है, और दोहराव उसे और प्रबल कर देता है। आचार्य नंदराम एंजेल नंबरों को भारतीय अंक ज्योतिष के साथ पढ़ते हैं, इसलिए हर अंक उसके स्वामी ग्रह से भी जुड़ता है और आपके मूलांक व भाग्यांक से मिलाया जाता है।',
    steps: [['देखें', 'अंक कहाँ और कब दिखा।'], ['पढ़ें', 'उसका अर्थ और अंक जानें।'], ['सोचें', 'उसे अपने प्रश्न से जोड़ें।'], ['करें', 'उसके अनुरूप एक छोटा कदम उठाएँ।']],
    digitsH: 'अंक 0–9 का अर्थ', allH: 'सभी एंजेल नंबर और उनके अर्थ', allP: 'नीचे दिए हर अंक का अपना विस्तृत पेज है: अर्थ, अंक, आध्यात्मिक अर्थ, प्रेम, ट्विन फ्लेम, करियर, हिंदी में अर्थ और जन्म तिथि से अनुकूलता जाँच।', faqH: 'एंजेल नंबर – अक्सर पूछे जाने वाले प्रश्न' },
};

export default function AngelHub() {
  const featured = TOP_ANGEL.slice(0, 12).map((n) => { const en = buildAngel(n); return { en, hi: buildAngelHi(n, en) }; });
  const items: AngelLite[] = TOP_ANGEL.map((n) => [n, analyse(n).pattern]);
  const B = (k: Exclude<keyof typeof H.en, 'steps'>) => <Bi en={H.en[k]} hi={H.hi[k]} />;
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Angel Numbers', description: metadata.description, url: '/angel-numbers', author: { '@type': 'Person', name: 'Acharya Nandram' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
  return (
    <div className="container max-w-6xl space-y-12 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(jsonLd) }} />
      <header className="mk-rise relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-maroon/40 via-card/80 to-card/90 p-6 sm:p-10">
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">{B('eyebrow')}</p>
            <h1 className="font-cinzel mt-2 text-4xl font-bold leading-tight sm:text-6xl"><span className="gold-text">{B('h1')}</span><span className="mt-2 block text-xl font-normal text-muted-foreground sm:text-2xl">{B('h1sub')}</span></h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{B('p')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#calculator" className={`${GOLD_BTN} h-12 px-6`}><Calculator className="h-4 w-4" />{B('find')}</a>
              <a href="#all" className="inline-flex h-12 items-center rounded-md border border-gold/50 px-6 hover:bg-gold/10">{B('browse')}</a>
            </div>
          </div>
          <div className="mx-auto hidden sm:block"><AngelOrb n="1111" /></div>
        </div>
      </header>

      <section aria-labelledby="top" className="space-y-4">
        <h2 id="top" className="font-serif text-3xl font-bold">{B('topH')}</h2>
        <p className="text-muted-foreground">{B('topP')}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(({ en: p, hi: ph }, i) => (
            <Link key={p.n} href={`/angel-numbers/${p.n}`} className="mk-card glass group relative overflow-hidden rounded-xl border border-gold/25 p-5">
              <span className="absolute right-3 top-3 rounded-full border border-gold/30 px-2 py-0.5 text-[10px] text-muted-foreground">#{i + 1}</span>
              <div className="flex items-center gap-4"><AngelOrb n={p.n} size="sm" /><div><p className="gold-text font-cinzel text-3xl font-bold">{p.n}</p><p className="text-sm font-medium"><Bi en={p.theme} hi={ph.theme} /></p></div></div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground"><Bi en={p.summary} hi={ph.summary} /></p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-gold">{B('read')} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section id="calculator" aria-labelledby="calc" className="scroll-mt-24 space-y-4">
        <h2 id="calc" className="font-serif text-3xl font-bold">{B('calcH')}</h2>
        <p className="text-muted-foreground">{B('calcP')}</p>
        <AngelCalculator />
      </section>

      <section aria-labelledby="what" className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 id="what" className="font-serif text-3xl font-bold">{B('whatH')}</h2>
          <p className="text-muted-foreground">{B('what1')}</p>
          <p className="text-muted-foreground">{B('what2')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[Eye, Sparkles, Heart, Clock].map((Icon, i) => (
            <div key={i} className="glass rounded-xl border border-gold/20 p-4"><span className="text-gold"><Icon className="h-5 w-5" /></span><p className="mt-2 font-semibold"><Bi en={H.en.steps[i][0]} hi={H.hi.steps[i][0]} /></p><p className="text-sm text-muted-foreground"><Bi en={H.en.steps[i][1]} hi={H.hi.steps[i][1]} /></p></div>))}
        </div>
      </section>

      <section aria-labelledby="digits" className="space-y-4">
        <h2 id="digits" className="font-serif text-3xl font-bold">{B('digitsH')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DIGITS.map((d) => { const h = DIGITS_HI[d.d]; return (
            <Link key={d.d} href={`/angel-numbers/${d.d === 0 ? '000' : String(d.d).repeat(3)}`} className="mk-card rounded-xl border border-gold/25 bg-background/40 p-4">
              <p className="gold-text font-cinzel text-4xl font-bold">{d.d}</p><p className="font-semibold"><Bi en={d.word} hi={h.word} /></p><p className="text-xs text-muted-foreground"><Bi en={d.planet} hi={h.planet} /></p>
              <p className="mt-2 line-clamp-3 text-xs text-muted-foreground"><Bi en={d.core} hi={h.core} /></p>
            </Link>); })}
        </div>
      </section>

      <AngelCta />

      <section id="all" aria-labelledby="alln" className="scroll-mt-24 space-y-4">
        <h2 id="alln" className="font-serif text-3xl font-bold">{B('allH')}</h2>
        <p className="text-muted-foreground">{B('allP')}</p>
        <AngelExplorer items={items} />
      </section>

      <section aria-labelledby="faq" className="space-y-3">
        <h2 id="faq" className="font-serif text-3xl font-bold">{B('faqH')}</h2>
        {FAQS.map((f, i) => <details key={f.q} className="glass rounded-lg p-4"><summary className="cursor-pointer font-medium"><Bi en={f.q} hi={FAQS_HI[i].q} /></summary><p className="mt-2 text-sm text-muted-foreground"><Bi en={f.a} hi={FAQS_HI[i].a} /></p></details>)}
      </section>

      <AngelCta variant="big" />
      <AcharyaProfile />
    </div>
  );
}
