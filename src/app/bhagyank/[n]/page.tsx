import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { jsonLd as toLd } from '@/lib/seo/site';
import { BHAGYANK_NUMBERS, bhagyankFor, mulankBhagyankCombo, type BhagyankProfile } from '@/lib/bhagyank-data';
import { ForLang } from '@/components/i18n/bi';
import { numberPostSlug } from '@/lib/blog/numbers';

export const dynamicParams = false;
export function generateStaticParams() { return BHAGYANK_NUMBERS.map((n) => ({ n: String(n) })); }

export async function generateMetadata(props: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await props.params;
  const b = bhagyankFor(Number(n), 'en');
  if (!b) return {};
  return {
    title: `Bhagyank ${b.n} (${b.title}) – Destiny Number Meaning, Career & Remedies`,
    description: `Bhagyank ${b.n} is ruled by ${b.planet}. Read the life purpose, lessons, career, money, relationships, lucky colours, Mulank combinations and remedies for destiny number ${b.n}.`,
    alternates: { canonical: `/bhagyank/${b.n}` },
  };
}

function Block({ title, children, i = 0 }: { title: string; children: React.ReactNode; i?: number }) {
  return (
    <section style={{ animationDelay: `${i * 80}ms` }} className="mk-rise glass rounded-xl border border-gold/20 p-5">
      <h2 className="mb-2 font-cinzel text-xl font-bold gold-text">{title}</h2>{children}
    </section>
  );
}
const List = ({ items }: { items: string[] }) => <ul className="space-y-1.5 text-sm text-muted-foreground">{items.map((x) => <li key={x} className="flex gap-2"><span className="text-gold">✦</span>{x}</li>)}</ul>;

export default async function BhagyankPage(props: { params: Promise<{ n: string }> }) {
  const { n } = await props.params;
  const b = bhagyankFor(Number(n), 'en');
  if (!b) notFound();
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: `Bhagyank ${b.n} – ${b.title}`, description: b.tagline, inLanguage: ['en-IN', 'hi-IN'] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(ld) }} />
      <ForLang>{(l) => <BhagyankView b={bhagyankFor(b.n, l)!} lang={l} />}</ForLang>
    </>
  );
}

const L = {
  en: { root: 'Bhagyank', planet: 'Ruling planet', element: 'Element', direction: 'Direction', colours: 'Lucky colours', days: 'Lucky days', gem: 'Gemstone',
    getReading: (n: number) => `Get my Bhagyank ${n} reading`, calc: 'Check my Bhagyank', purpose: 'Life purpose', master: 'Master number', lessons: 'Life lessons', strengths: 'Strengths', challenges: 'Challenges',
    career: 'Career', relationships: 'Marriage & relationships', money: 'Money & wealth', spiritual: 'Spiritual growth', remedies: 'Simple remedies',
    compat: 'Friendly numbers', harmonious: 'Supports you:', care: 'Needs care:', combo: (n: number) => `Mulank + Bhagyank ${n} combination`,
    comboP: 'Your Mulank (day of birth) and Bhagyank work together. Find your Mulank below to see how the two numbers combine.', mulank: 'Mulank',
    verdict: { excellent: 'Excellent', good: 'Good', mixed: 'Mixed', challenging: 'Needs remedies' },
    services: 'Go deeper with your full chart', servicesP: 'Your Bhagyank is one part of your chart. A full reading combines it with Mulank, Kua, Lo Shu grid, name and mobile number.', more: 'Learn more →',
    disclaimer: 'Numerology offers guidance based on traditional methods and is not a substitute for professional medical, legal or financial advice.', all: 'All Bhagyank numbers' },
  hi: { root: 'भाग्यांक', planet: 'स्वामी ग्रह', element: 'तत्व', direction: 'दिशा', colours: 'शुभ रंग', days: 'शुभ दिन', gem: 'रत्न',
    getReading: (n: number) => `मेरी भाग्यांक ${n} रीडिंग पाएँ`, calc: 'मेरा भाग्यांक जाँचें', purpose: 'जीवन का उद्देश्य', master: 'मास्टर अंक', lessons: 'जीवन के सबक', strengths: 'ख़ूबियाँ', challenges: 'चुनौतियाँ',
    career: 'करियर', relationships: 'विवाह और रिश्ते', money: 'धन और समृद्धि', spiritual: 'आध्यात्मिक उन्नति', remedies: 'सरल उपाय',
    compat: 'मित्र अंक', harmonious: 'सहायक अंक:', care: 'सावधानी वाले अंक:', combo: (n: number) => `मूलांक + भाग्यांक ${n} का मेल`,
    comboP: 'आपका मूलांक (जन्म का दिन) और भाग्यांक साथ मिलकर काम करते हैं। नीचे अपना मूलांक देखें कि दोनों अंक कैसे मेल खाते हैं।', mulank: 'मूलांक',
    verdict: { excellent: 'उत्तम', good: 'अच्छा', mixed: 'मिश्रित', challenging: 'उपाय आवश्यक' },
    services: 'अपने पूरे चार्ट के साथ गहराई में जाएँ', servicesP: 'भाग्यांक आपके चार्ट का एक हिस्सा है। पूरी रीडिंग इसे मूलांक, कुआ, लो शू ग्रिड, नाम और मोबाइल नंबर के साथ जोड़ती है।', more: 'और जानें →',
    disclaimer: 'अंक ज्योतिष पारंपरिक विधियों पर आधारित मार्गदर्शन देता है; यह चिकित्सा, कानूनी या वित्तीय पेशेवर सलाह का विकल्प नहीं है।', all: 'सभी भाग्यांक' },
};

const TONE = { excellent: 'border-success/50 bg-success/10 text-success', good: 'border-gold/50 bg-gold/10 text-gold', mixed: 'border-border bg-muted/40 text-muted-foreground', challenging: 'border-danger/40 bg-danger/10 text-danger' } as const;

function BhagyankView({ b, lang }: { b: BhagyankProfile; lang: 'en' | 'hi' }) {
  const t = L[lang];
  const prev = b.n === 1 ? 9 : b.n - 1;
  const next = b.n === 9 ? 1 : b.n + 1;
  const services = lang === 'hi' ? [
    { icon: '✦', title: 'संपूर्ण जीवन रिपोर्ट (PDF)', desc: `भाग्यांक ${b.n} के साथ मूलांक, कुआ, लो शू ग्रिड, व्यक्तिगत वर्ष और उपाय – एक डिज़ाइन की हुई रिपोर्ट में।`, href: '/reading' },
    { icon: 'Aa', title: 'नाम अंक ज्योतिष और वर्तनी', desc: `ऐसी नाम-वर्तनी जो भाग्यांक ${b.n} के मित्र अंकों से मेल खाए।`, href: '/calculators/name-numerology-calculator' },
    { icon: '☎', title: 'शुभ मोबाइल नंबर जाँच', desc: `देखें कि आपका मोबाइल नंबर भाग्यांक ${b.n} का साथ देता है या नहीं।`, href: '/calculators/mobile-number-numerology' },
  ] : [
    { icon: '✦', title: 'Complete Life Report (PDF)', desc: `Bhagyank ${b.n} read together with Mulank, Kua, Lo Shu grid, personal years and remedies in one designed report.`, href: '/reading' },
    { icon: 'Aa', title: 'Name Numerology & Spelling', desc: `A name spelling that is friendly with Bhagyank ${b.n}.`, href: '/calculators/name-numerology-calculator' },
    { icon: '☎', title: 'Lucky Mobile Number Check', desc: `See whether your mobile number supports Bhagyank ${b.n}.`, href: '/calculators/mobile-number-numerology' },
  ];
  const facts: [string, string][] = [[t.planet, b.planet], [t.element, b.element], [t.direction, b.direction], [t.colours, b.luckyColors.join(', ')], [t.days, b.luckyDays.join(', ')], [t.gem, b.gemstone]];
  return (
    <div className="container max-w-5xl space-y-8 py-10 sm:py-14">
      <nav className="text-xs text-muted-foreground"><Link href="/bhagyank" className="hover:text-foreground">{t.root}</Link> / {t.root} {b.n}</nav>
      <header className="grid items-center gap-8 md:grid-cols-[220px_1fr]">
        <div className="relative mx-auto h-52 w-52">
          <span className="mk-spin absolute inset-0 rounded-full border border-dashed border-gold/60" />
          <span className="mk-spin-rev absolute inset-4 rounded-full border border-gold/30" />
          <span className="mk-spin absolute inset-8 rounded-full border border-dotted border-gold/40" />
          <span className="mk-pulse absolute inset-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a]"><span className="gold-text font-cinzel text-7xl font-bold">{b.n}</span></span>
        </div>
        <div className="mk-rise space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">{t.root} {b.n} · {b.planet}</p>
          <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text">{b.title}</span></h1>
          <p className="text-xl italic text-muted-foreground">{b.tagline}</p>
          <p className="text-muted-foreground">{b.intro}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/reading" className="inline-flex h-11 items-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-5 font-semibold text-[hsl(250_45%_10%)]">{t.getReading(b.n)}</Link>
            <Link href="/calculators/bhagyank-calculator" className="inline-flex h-11 items-center rounded-md border border-gold/50 px-5 hover:bg-gold/10">{t.calc}</Link>
          </div>
        </div>
      </header>

      <div className="mk-rise grid grid-cols-2 gap-3 sm:grid-cols-3" style={{ animationDelay: '120ms' }}>
        {facts.map(([k, v]) => <div key={k} className="mk-card rounded-lg border border-gold/20 p-3"><p className="text-[10px] uppercase tracking-widest text-gold">{k}</p><p className="mt-1 text-sm font-medium">{v}</p></div>)}
      </div>

      <div className={`grid gap-5 ${b.master ? 'md:grid-cols-2' : ''}`}>
        <Block title={t.purpose} i={1}><p className="text-sm text-muted-foreground">{b.purpose}</p></Block>
        {b.master && <Block title={t.master} i={2}><p className="text-sm text-muted-foreground">{b.master}</p></Block>}
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Block title={t.lessons} i={1}><List items={b.lessons} /></Block>
        <Block title={t.strengths} i={2}><List items={b.strengths} /></Block>
        <Block title={t.challenges} i={3}><List items={b.challenges} /></Block>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Block title={t.career} i={1}><p className="text-sm text-muted-foreground">{b.career}</p></Block>
        <Block title={t.relationships} i={2}><p className="text-sm text-muted-foreground">{b.relationships}</p></Block>
        <Block title={t.money} i={3}><p className="text-sm text-muted-foreground">{b.money}</p></Block>
        <Block title={t.spiritual} i={4}><p className="text-sm text-muted-foreground">{b.spiritual}</p></Block>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Block title={t.remedies} i={1}><List items={b.remedies} /></Block>
        <Block title={t.compat} i={2}>
          <p className="text-sm text-muted-foreground">{t.harmonious} <b className="text-foreground">{b.compatible.join(', ')}</b></p>
          <p className="mt-1 text-sm text-muted-foreground">{t.care} <b className="text-foreground">{b.avoid.join(', ')}</b></p>
        </Block>
      </div>

      <section className="mk-rise glass rounded-xl border border-gold/25 p-5">
        <h2 className="font-cinzel text-xl font-bold gold-text">{t.combo(b.n)}</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">{t.comboP}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-9">
          {BHAGYANK_NUMBERS.map((m) => { const c = mulankBhagyankCombo(m, b.n); return (
            <Link key={m} href={`/mulank/${m}`} className={`rounded-lg border p-2 text-center transition hover:brightness-110 ${TONE[c.verdict]}`}>
              <span className="block text-[10px] uppercase tracking-wide">{t.mulank}</span>
              <span className="font-cinzel text-2xl font-bold">{m}</span>
              <span className="block text-[11px] font-medium">{t.verdict[c.verdict]}</span>
            </Link>
          ); })}
        </div>
      </section>

      <section className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 via-transparent to-maroon/20 p-6">
        <h2 className="font-cinzel text-2xl font-bold gold-text">{t.services}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t.servicesP}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Link key={s.title} href={s.href} style={{ animationDelay: `${i * 80}ms` }} className="mk-rise mk-card rounded-lg border border-gold/25 bg-background/60 p-4">
              <span className="text-xl text-gold">{s.icon}</span><h3 className="mt-1 font-semibold">{s.title}</h3><p className="mt-1 text-sm text-muted-foreground">{s.desc}</p><span className="mt-2 inline-block text-sm text-gold">{t.more}</span>
            </Link>
          ))}
        </div>
      </section>

      <Link href={`/blog/${numberPostSlug('bhagyank', b.n)}`} className="mk-card glass flex items-center justify-between gap-4 rounded-xl border border-gold/30 p-5">
        <span><span className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold">{lang === 'hi' ? 'पूरा लेख पढ़ें' : 'Read the full article'}</span><span className="font-serif text-lg font-semibold">{lang === 'hi' ? `भाग्यांक ${b.n}: संपूर्ण मार्गदर्शिका – करियर, विवाह अनुकूलता, शुभ विवरण और उपाय` : `Bhagyank ${b.n}: the complete guide – career, marriage compatibility, lucky details and remedies`}</span></span>
        <span className="text-gold">→</span>
      </Link>
      <p className="text-center text-xs text-muted-foreground">{t.disclaimer}</p>
      <div className="flex justify-between text-sm">
        <Link href={`/bhagyank/${prev}`} className="text-gold hover:underline">← {t.root} {prev}</Link>
        <Link href="/bhagyank" className="text-muted-foreground hover:text-foreground">{t.all}</Link>
        <Link href={`/bhagyank/${next}`} className="text-gold hover:underline">{t.root} {next} →</Link>
      </div>
    </div>
  );
}
