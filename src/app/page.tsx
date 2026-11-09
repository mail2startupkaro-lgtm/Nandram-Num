'use client';
import * as React from 'react';
import Link from 'next/link';
import { Award, CalendarDays, CheckCircle, Heart, IdCard, ScrollText, Smartphone, Sparkles, Type } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Reveal } from '@/components/layout/cosmic-bg';
import { YantraWheel } from '@/components/home/yantra-wheel';
import { QuickReading } from '@/components/home/quick-reading';
import { planetOf } from '@/lib/numerology/data/planets';

const ICONS = [CalendarDays, Type, Smartphone, IdCard, Heart, ScrollText];
const ORB: Record<number, string> = { 1: '#ffb347', 2: '#dfe7ff', 3: '#f6d365', 4: '#8fa3b8', 5: '#7ed6a5', 6: '#ff9ecb', 7: '#c7a6ff', 8: '#7f8cff', 9: '#ff6b5b' };

const C = {
  en: {
    eyebrow: 'Vedic · Chaldean · Lo Shu',
    h1a: 'Every number carries a', h1b: 'divine message',
    sub: 'Discover what your date of birth, name and mobile number reveal about your',
    words: ['career', 'relationships', 'wealth', 'health habits', 'life purpose'],
    cta1: 'Reveal my numbers', cta2: 'See plans & report',
    trust: ['Exact traditional calculations', 'Private & encrypted', 'English · हिंदी · Hinglish'],
    modK: 'Six sacred readings', modH: 'Choose your path of insight', modP: 'Start with a single reading or receive them all in one complete life report.',
    mods: [
      ['Date of Birth', 'Moolank, Bhagyank, Kua number, Lo Shu grid, personal year and the cycles of your life.'],
      ['Name Numerology', 'Chaldean and Pythagorean values, with spelling suggestions that harmonise with your birth numbers.'],
      ['Mobile Number', 'A clear score for your mobile number and whether its vibration supports your goals.'],
      ['Aadhaar Vibration', 'Optional and consent-based. Calculated privately; only the last four digits are kept.'],
      ['Couple Compatibility', 'How two people’s numbers, planets and grids blend for marriage and partnership.'],
      ['Complete Life Report', 'Every module in one beautifully designed PDF with personal remedies.'],
    ],
    explore: 'Explore',
    plK: 'Navagraha', plH: 'Nine numbers, nine planets', plP: 'Each number from 1 to 9 is ruled by a planet that colours your nature.',
    calcK: 'Free instant reading', calcH: 'Reveal your numbers', calcP: 'The calculation happens instantly, right on your screen.',
    howK: 'How it works', howH: 'From your birth date to your blueprint',
    steps: [['Share your details', 'Date of birth, name and optional mobile number, with your consent.'], ['Exact calculation', 'Traditional Vedic and Chaldean rules applied precisely, every time.'], ['Your personal report', 'A detailed reading with remedies, delivered as a beautiful PDF.']],
    repK: 'The life report', repH: 'A keepsake, not just a printout', repP: 'A print-ready A4 report with charts, grids and personal remedies.',
    stats: [['18', 'report sections'], ['6', 'reading modules'], ['3', 'languages'], ['4', 'report themes']],
    faqK: 'Questions', faqH: 'Frequently asked',
    faq: [
      ['What is the difference between Moolank and Bhagyank?', 'Moolank (driver number) comes from your day of birth and describes your nature. Bhagyank (conductor or destiny number) comes from your full date of birth and describes the direction of your life.'],
      ['Is my Aadhaar number safe?', 'The Aadhaar reading is optional and needs your consent. It is calculated in memory and never saved; only the last four digits are kept, shown as XXXX-XXXX-1234.'],
      ['Can I get the report in Hindi?', 'Yes. Reports are available in English, Hindi and Hinglish.'],
      ['Should I change my name based on numerology?', 'Name suggestions are guidance only. Any legal name change is your personal decision.'],
    ],
    bandH: 'Your numbers are waiting', bandP: 'It takes less than a minute to begin.', bandC: 'Begin my free reading',
  },
  hi: {
    eyebrow: 'वैदिक · कैल्डियन · लो शू',
    h1a: 'हर अंक में छिपा है', h1b: 'आपका भाग्य',
    sub: 'जानिए आपकी जन्म तिथि, नाम और मोबाइल नंबर क्या बताते हैं आपके',
    words: ['करियर', 'रिश्तों', 'धन', 'स्वास्थ्य', 'जीवन उद्देश्य'],
    cta1: 'मेरे अंक जानें', cta2: 'प्लान और रिपोर्ट',
    trust: ['सटीक पारंपरिक गणना', 'निजी और एन्क्रिप्टेड', 'English · हिंदी · Hinglish'],
    modK: 'छह पवित्र रीडिंग', modH: 'अपना मार्ग चुनें', modP: 'एक रीडिंग से शुरू करें या सभी को एक संपूर्ण जीवन रिपोर्ट में पाएँ।',
    mods: [
      ['जन्म तिथि', 'मूलांक, भाग्यांक, कुआ अंक, लो शू ग्रिड, व्यक्तिगत वर्ष और जीवन चक्र।'],
      ['नाम अंक ज्योतिष', 'कैल्डियन और पाइथागोरियन मान, और आपके अंकों के अनुरूप वर्तनी सुझाव।'],
      ['मोबाइल नंबर', 'आपके मोबाइल नंबर का स्कोर और यह आपके लक्ष्यों का साथ देता है या नहीं।'],
      ['आधार वाइब्रेशन', 'वैकल्पिक और सहमति पर आधारित। केवल अंतिम चार अंक रखे जाते हैं।'],
      ['जोड़ी मिलान', 'विवाह और साझेदारी के लिए दो लोगों के अंकों, ग्रहों और ग्रिड का मेल।'],
      ['संपूर्ण जीवन रिपोर्ट', 'सभी मॉड्यूल और व्यक्तिगत उपाय एक सुंदर PDF में।'],
    ],
    explore: 'देखें',
    plK: 'नवग्रह', plH: 'नौ अंक, नौ ग्रह', plP: '1 से 9 तक हर अंक का एक स्वामी ग्रह है जो आपके स्वभाव को रंग देता है।',
    calcK: 'मुफ़्त तुरंत रीडिंग', calcH: 'अपने अंक जानें', calcP: 'गणना तुरंत आपकी स्क्रीन पर होती है।',
    howK: 'प्रक्रिया', howH: 'जन्म तिथि से जीवन के नक्शे तक',
    steps: [['विवरण दें', 'जन्म तिथि, नाम और वैकल्पिक मोबाइल नंबर, आपकी सहमति से।'], ['सटीक गणना', 'पारंपरिक वैदिक और कैल्डियन नियम, हर बार सटीक।'], ['आपकी रिपोर्ट', 'उपायों सहित विस्तृत रीडिंग, सुंदर PDF में।']],
    repK: 'जीवन रिपोर्ट', repH: 'सिर्फ़ प्रिंटआउट नहीं, एक यादगार', repP: 'चार्ट, ग्रिड और व्यक्तिगत उपायों के साथ प्रिंट-योग्य A4 रिपोर्ट।',
    stats: [['18', 'रिपोर्ट खंड'], ['6', 'रीडिंग मॉड्यूल'], ['3', 'भाषाएँ'], ['4', 'रिपोर्ट थीम']],
    faqK: 'प्रश्न', faqH: 'अक्सर पूछे जाने वाले प्रश्न',
    faq: [
      ['मूलांक और भाग्यांक में क्या अंतर है?', 'मूलांक जन्म के दिन से निकलता है और स्वभाव बताता है। भाग्यांक पूरी जन्म तिथि से निकलता है और जीवन की दिशा बताता है।'],
      ['क्या मेरा आधार नंबर सुरक्षित है?', 'आधार रीडिंग वैकल्पिक है और सहमति से होती है। पूरा नंबर कभी सेव नहीं होता; केवल अंतिम चार अंक XXXX-XXXX-1234 के रूप में रहते हैं।'],
      ['क्या रिपोर्ट हिंदी में मिल सकती है?', 'हाँ। रिपोर्ट English, हिंदी और Hinglish में उपलब्ध है।'],
      ['क्या अंक ज्योतिष के आधार पर नाम बदलना चाहिए?', 'नाम सुझाव केवल मार्गदर्शन हैं। कानूनी नाम परिवर्तन आपका व्यक्तिगत निर्णय है।'],
    ],
    bandH: 'आपके अंक आपका इंतज़ार कर रहे हैं', bandP: 'शुरू करने में एक मिनट से भी कम लगता है।', bandC: 'मुफ़्त रीडिंग शुरू करें',
  },
};

function Head({ k, h, p }: { k: string; h: string; p?: string }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      <span className="cz-kicker">{k}</span>
      <h2 className="font-cinzel mt-2 text-3xl font-bold sm:text-[42px] sm:leading-tight">{h}</h2>
      <div className="cz-divider my-3">✦</div>
      {p && <p className="font-cormorant text-xl text-muted-foreground">{p}</p>}
    </Reveal>
  );
}

function Typer({ words }: { words: string[] }) {
  const [txt, setTxt] = React.useState(words[0]);
  React.useEffect(() => {
    // Split into grapheme clusters so Devanagari letters + matras are typed together.
    const seg = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter() : null;
    const parts = words.map((w) => (seg ? Array.from(seg.segment(w), (x) => x.segment) : Array.from(w)));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let wi = 0, c = parts[0].length, del = true, wait = 18;
    const id = setInterval(() => {
      if (wait > 0) { wait--; return; }
      const w = parts[wi];
      if (del) { c--; setTxt(w.slice(0, c).join('')); if (c === 0) { del = false; wi = (wi + 1) % parts.length; } }
      else { const nw = parts[wi]; c++; setTxt(nw.slice(0, c).join('')); if (c === nw.length) { del = true; wait = 22; } }
    }, 75);
    return () => clearInterval(id);
  }, [words]);
  return <span className="cz-caret font-cinzel text-gold">{txt}</span>;
}

function Counter({ to }: { to: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [v, setV] = React.useState(to);
  React.useEffect(() => {
    const el = ref.current; if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setV(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      let c = 0; const id = setInterval(() => { c++; setV(c); if (c >= to) clearInterval(id); }, Math.max(30, 900 / to));
    }, { threshold: 0.5 });
    io.observe(el); return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{v}</span>;
}

/** 3D tilt on pointer move. */
function useTilt() {
  return {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') return;
      const c = e.currentTarget, r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = ''; },
  };
}

export default function Home() {
  const { lang } = useApp();
  const c = C[lang];
  const tilt = useTilt();

  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container grid min-h-[calc(100vh-4rem)] items-center gap-8 py-14 lg:grid-cols-[1.05fr_.95fr]">
          <div className="text-center lg:text-left">
            <Reveal>
              <div className="mb-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-gold/40 bg-gradient-to-r from-gold/15 via-maroon/20 to-gold/15 px-4 py-1.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-md lg:justify-start">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-maroon to-gold font-serif text-xs font-bold text-white shadow-sm">
                  ॐ
                </span>
                <span className="font-serif text-sm font-bold text-foreground sm:text-base">
                  {lang === 'hi' ? 'आचार्य नंदराम' : 'Acharya Nandram'}
                </span>
                <span className="h-3 w-px bg-gold/40" />
                <span className="rounded bg-gold/20 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-gold">
                  {lang === 'hi' ? 'अनुभव: 15+ वर्ष से अधिक' : 'Experience: 15+ Years +'}
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.05}><span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-[0.24em] text-gold cz-track"><i className="cz-eyebrow-dot" />{c.eyebrow}</span></Reveal>
            <Reveal delay={0.1}>
              <h1 className="font-cinzel text-[38px] font-bold leading-[1.15] sm:text-6xl">{c.h1a}<br className="hidden sm:block" /> <span className="cz-shine">{c.h1b}</span></h1>
            </Reveal>
            <Reveal delay={0.2}><p className="font-cormorant mx-auto mt-5 max-w-xl text-xl text-muted-foreground sm:text-2xl lg:mx-0">{c.sub} <Typer key={lang} words={c.words} /></p></Reveal>
            <Reveal delay={0.3} className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="#quick" className="cz-btn cz-btn-primary"><Sparkles className="h-4 w-4" />{c.cta1}</Link>
              <Link href="/pricing" className="cz-btn cz-btn-ghost">{c.cta2}</Link>
            </Reveal>
            <Reveal delay={0.4} className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground lg:justify-start">
              {c.trust.map((x) => <span key={x}><span className="text-gold">✦</span> {x}</span>)}
            </Reveal>
          </div>
          <Reveal delay={0.2}><YantraWheel lang={lang} /></Reveal>
        </div>
      </section>

      {/* MODULES */}
      <section className="container py-20">
        <Head k={c.modK} h={c.modH} p={c.modP} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {c.mods.map(([title, desc], i) => {
            const Icon = ICONS[i];
            return (
              <Reveal key={title} delay={0.08 * (i % 3)}>
                <Link href={i === 5 ? '/pricing' : '/reading'} className="cz-card cz-mod h-full" {...tilt}>
                  <span className="cz-num">{i + 1}</span>
                  <span className="cz-ic"><Icon className="h-6 w-6" /></span>
                  <h3 className="font-cinzel text-xl font-bold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  <span className="cz-go mt-4 inline-block text-[13px] tracking-wide text-gold">{c.explore}</span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* NAVAGRAHA */}
      <section className="container py-12">
        <Head k={c.plK} h={c.plH} p={c.plP} />
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-9">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
            const p = planetOf(n);
            return (
              <Reveal key={n} delay={n * 0.05} className="cz-pl">
                <div className="cz-orb" style={{ background: `radial-gradient(circle at 30% 30%, #fff, ${ORB[n]})`, boxShadow: `0 0 22px ${ORB[n]}` }}>{n}</div>
                <b className="font-cinzel block text-sm">{lang === 'hi' ? p.devanagari : p.name}</b>
                <small className="text-[11px] text-muted-foreground">{lang === 'hi' ? p.weekdayHindi : p.weekday}</small>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* QUICK READING */}
      <section id="quick" className="container scroll-mt-20 py-20">
        <Head k={c.calcK} h={c.calcH} p={c.calcP} />
        <Reveal><QuickReading lang={lang} /></Reveal>
      </section>

      {/* HOW */}
      <section className="container py-16">
        <Head k={c.howK} h={c.howH} />
        <div className="cz-steps grid gap-8 md:grid-cols-3">
          {c.steps.map(([h, p], i) => (
            <Reveal key={h} delay={0.1 * i} className="px-4 text-center">
              <div className="cz-circ">{i + 1}</div>
              <h3 className="font-cinzel text-lg font-bold">{h}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* REPORT */}
      <section className="container py-20">
        <Head k={c.repK} h={c.repH} p={c.repP} />
        <Reveal className="cz-pdfs" >
          <div className="cz-page"><div className="s">Section 02</div><div className="t">Lo Shu Grid</div><div className="ln" /><div className="ln sh" />
            <div className="mini">{[4, 9, 2, 3, 5, 7, 8, 1, 6].map((n) => <i key={n} className={[9, 2, 8, 1].includes(n) ? 'on' : ''}>{n}</i>)}</div>
            <div className="ln" /><div className="ln" /><div className="ln sh" /><div className="ft">Numerology offers guidance based on traditional methods.</div></div>
          <div className="cz-page cover"><div className="s">Complete Life Report</div><div className="big">1</div><div className="t">Rahul Sharma</div><div className="s mt-1.5">28 · 08 · 1990</div></div>
          <div className="cz-page"><div className="s">Section 14</div><div className="t">Remedies</div><div className="ln" /><div className="ln sh" />
            <div className="my-2 flex gap-1.5">{['#e9a23b', '#c33c54', '#f2d16b'].map((x) => <span key={x} className="h-6 flex-1 rounded" style={{ background: x }} />)}</div>
            <div className="ln" /><div className="ln" /><div className="ln sh" /><div className="ln" /><div className="ft">Numerology offers guidance based on traditional methods.</div></div>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {c.stats.map(([n, l], i) => (
            <Reveal key={l} delay={0.1 * i} className="cz-card py-6 text-center">
              <b className="font-cinzel cz-shine block text-4xl font-black"><Counter to={+n} /></b>
              <span className="text-[13px] text-muted-foreground">{l}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ABOUT EXPERT: ACHARYA NANDRAM */}
      <section className="container py-16">
        <Reveal>
          <div className="cz-card relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-card/90 via-card/75 to-card/90 p-8 sm:p-12 shadow-[0_0_40px_rgba(245,158,11,0.14)]">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <span className="cz-kicker text-gold">
                  {lang === 'hi' ? 'अंक ज्योतिष विशेषज्ञ' : 'Lead Numerologist & Guide'}
                </span>
                <h2 className="font-cinzel mt-2 text-3xl font-bold sm:text-4xl text-foreground">
                  {lang === 'hi' ? 'आचार्य नंदराम' : 'Acharya Nandram'}
                </h2>
                <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-gold/15 px-3 py-1 text-sm font-semibold text-gold">
                  <Award className="h-4 w-4" />
                  <span>{lang === 'hi' ? 'अनुभव: 15+ वर्ष से अधिक' : 'Experience: More than 15+ Years'}</span>
                </div>
                <p className="font-cormorant mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
                  {lang === 'hi' 
                    ? 'वैदिक अंक ज्योतिष, कैल्डियन पद्धति और लो शू ग्रिड के गहन अध्ययन के साथ, आचार्य नंदराम ने पिछले 15+ वर्षों में हज़ारों जातकों को उनके करियर, व्यवसाय, विवाह, स्वास्थ्य और नाम सुधार में सटीक और व्यावहारिक मार्गदर्शन प्रदान किया है।' 
                    : 'With more than 15+ years of dedicated mastery in Vedic, Chaldean, and Lo Shu grid systems, Acharya Nandram has guided thousands of individuals and families toward clarity, success, and prosperity through precise number vibrations and personalized remedies.'}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-xs sm:text-sm text-foreground/85">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 border border-border">
                    <CheckCircle className="h-3.5 w-3.5 text-gold" /> {lang === 'hi' ? 'जन्म तिथि व मूलांक-भाग्यांक' : 'Date of Birth & Moolank Analysis'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 border border-border">
                    <CheckCircle className="h-3.5 w-3.5 text-gold" /> {lang === 'hi' ? 'नाम व हस्ताक्षर सुधार' : 'Name & Signature Harmony'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 border border-border">
                    <CheckCircle className="h-3.5 w-3.5 text-gold" /> {lang === 'hi' ? 'मोबाइल व आधार वाइब्रेशन' : 'Mobile & Aadhaar Vibration'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 border border-border">
                    <CheckCircle className="h-3.5 w-3.5 text-gold" /> {lang === 'hi' ? 'विवाह व जोड़ी अनुकूलता' : 'Couple Compatibility'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col shrink-0">
                <Link href="#quick" className="cz-btn cz-btn-primary whitespace-nowrap text-center">
                  <Sparkles className="h-4 w-4" />
                  {lang === 'hi' ? 'मुफ़्त अंक विश्लेषण करें' : 'Start Free Reading'}
                </Link>
                <Link href="/pricing" className="cz-btn cz-btn-ghost whitespace-nowrap text-center">
                  {lang === 'hi' ? 'संपूर्ण जीवन रिपोर्ट' : 'Complete Life Report'}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="container py-16">
        <Head k={c.faqK} h={c.faqH} />
        <Reveal className="cz-faq mx-auto max-w-3xl">
          {c.faq.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
        </Reveal>
      </section>

      {/* CTA BAND */}
      <section className="container pb-6 pt-8">
        <Reveal className="cz-band">
          <h2 className="font-cinzel relative text-3xl font-bold sm:text-4xl">{c.bandH}</h2>
          <p className="font-cormorant relative mb-6 mt-2 text-xl opacity-90">{c.bandP}</p>
          <Link href="/reading" className="cz-btn cz-btn-primary relative"><Sparkles className="h-4 w-4" />{c.bandC}</Link>
        </Reveal>
      </section>
    </div>
  );
}
