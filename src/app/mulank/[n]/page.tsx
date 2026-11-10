import type { Metadata } from 'next';
import { jsonLd as toLd } from '@/lib/seo/site';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MULANK, getMulank, mulankFor, type MulankProfile } from '@/lib/mulank-data';
import { ForLang } from '@/components/i18n/bi';
import { mulankServices } from '@/lib/mulank-services';

export const dynamicParams = false;
export function generateStaticParams() { return MULANK.map((m) => ({ n: String(m.n) })); }

export async function generateMetadata(props: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const params = await props.params;
  const m = getMulank(Number(params.n));
  if (!m) return {};
  return {
    title: `Mulank ${m.n} (${m.title}) – Personality, Career, Lucky Colour & Remedies`,
    description: `Mulank ${m.n} is ruled by ${m.planet}. Read traits, strengths, career, relationships, health, lucky numbers, colours and remedies for people born on ${m.famousDates.replace('Born on ', '')}.`,
    alternates: { canonical: `/mulank/${m.n}` },
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

export default async function MulankPage(props: { params: Promise<{ n: string }> }) {
  const params = await props.params;
  const m = getMulank(Number(params.n));
  if (!m) notFound();
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: `Mulank ${m.n} – ${m.title}`, description: m.tagline, inLanguage: ['en-IN', 'hi-IN'] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(jsonLd) }} />
      <ForLang>{(l) => <MulankView m={mulankFor(m.n, l)!} lang={l} />}</ForLang>
    </>
  );
}

const L = {
  en: { root: 'Mulank', planet: 'Ruling planet', element: 'Element', direction: 'Direction', nums: 'Lucky numbers', colours: 'Lucky colours', days: 'Lucky days', gem: 'Gemstone', metal: 'Metal',
    getReading: (n: number) => `Get my Mulank ${n} reading`, plans: 'See plans', traits: 'Traits', strengths: 'Strengths', challenges: 'Challenges', career: 'Career', relationships: 'Relationships',
    health: 'Health', money: 'Money', remedies: 'Simple remedies', compat: 'Compatibility', harmonious: 'Harmonious with:', care: 'Needs care with:', services: (n: number) => `Our services for Mulank ${n}`,
    servicesP: 'Go beyond the root number. Your full chart is read from your date of birth, name and mobile number.', more: 'Learn more →',
    disclaimer: 'Numerology offers guidance based on traditional methods and is not a substitute for professional medical, legal or financial advice.', all: 'All Mulank numbers' },
  hi: { root: 'मूलांक', planet: 'स्वामी ग्रह', element: 'तत्व', direction: 'दिशा', nums: 'शुभ अंक', colours: 'शुभ रंग', days: 'शुभ दिन', gem: 'रत्न', metal: 'धातु',
    getReading: (n: number) => `मेरी मूलांक ${n} रीडिंग पाएँ`, plans: 'प्लान देखें', traits: 'स्वभाव', strengths: 'ख़ूबियाँ', challenges: 'चुनौतियाँ', career: 'करियर', relationships: 'रिश्ते',
    health: 'स्वास्थ्य', money: 'धन', remedies: 'सरल उपाय', compat: 'अनुकूलता', harmonious: 'इनसे मेल:', care: 'इनसे सावधानी:', services: (n: number) => `मूलांक ${n} के लिए हमारी सेवाएँ`,
    servicesP: 'मूलांक से आगे बढ़ें। आपका पूरा चार्ट आपकी जन्म तिथि, नाम और मोबाइल नंबर से पढ़ा जाता है।', more: 'और जानें →',
    disclaimer: 'अंक ज्योतिष पारंपरिक विधियों पर आधारित मार्गदर्शन देता है; यह चिकित्सा, कानूनी या वित्तीय पेशेवर सलाह का विकल्प नहीं है।', all: 'सभी मूलांक' },
};

function MulankView({ m, lang }: { m: MulankProfile; lang: 'en' | 'hi' }) {
  const t = L[lang];
  const prev = m.n === 1 ? 9 : m.n - 1;
  const next = m.n === 9 ? 1 : m.n + 1;
  const services = mulankServices(m.n, lang);
  const facts: [string, string][] = [[t.planet, m.planet], [t.element, m.element], [t.direction, m.direction], [t.nums, m.luckyNumbers.join(', ')], [t.colours, m.luckyColors.join(', ')], [t.days, m.luckyDays.join(', ')], [t.gem, m.gemstone], [t.metal, m.metal]];
  return (
    <div className="container max-w-5xl space-y-8 py-10 sm:py-14">
      <nav className="text-xs text-muted-foreground"><Link href="/mulank" className="hover:text-foreground">{t.root}</Link> / {t.root} {m.n}</nav>
      <header className="grid items-center gap-8 md:grid-cols-[220px_1fr]">
        <div className="relative mx-auto h-52 w-52">
          <span className="mk-spin absolute inset-0 rounded-full border border-dashed border-gold/60" />
          <span className="mk-spin-rev absolute inset-4 rounded-full border border-gold/30" />
          <span className="mk-spin absolute inset-8 rounded-full border border-dotted border-gold/40" />
          <span className="mk-pulse absolute inset-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a]"><span className="gold-text font-cinzel text-7xl font-bold">{m.n}</span></span>
        </div>
        <div className="mk-rise space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">{t.root} {m.n} · {m.planet}</p>
          <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text">{m.title}</span></h1>
          <p className="text-xl italic text-muted-foreground">{m.tagline}</p>
          <p className="text-muted-foreground">{m.intro}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/reading" className="inline-flex h-11 items-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-5 font-semibold text-[hsl(250_45%_10%)]">{t.getReading(m.n)}</Link>
            <Link href="/pricing" className="inline-flex h-11 items-center rounded-md border border-gold/50 px-5 hover:bg-gold/10">{t.plans}</Link>
          </div>
        </div>
      </header>

      <div className="mk-rise grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: '120ms' }}>
        {facts.map(([k, v]) => <div key={k} className="mk-card rounded-lg border border-gold/20 p-3"><p className="text-[10px] uppercase tracking-widest text-gold">{k}</p><p className="mt-1 text-sm font-medium">{v}</p></div>)}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Block title={t.traits} i={1}><List items={m.traits} /></Block>
        <Block title={t.strengths} i={2}><List items={m.strengths} /></Block>
        <Block title={t.challenges} i={3}><List items={m.challenges} /></Block>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Block title={t.career} i={1}><p className="text-sm text-muted-foreground">{m.career}</p></Block>
        <Block title={t.relationships} i={2}><p className="text-sm text-muted-foreground">{m.relationships}</p></Block>
        <Block title={t.health} i={3}><p className="text-sm text-muted-foreground">{m.health}</p></Block>
        <Block title={t.money} i={4}><p className="text-sm text-muted-foreground">{m.money}</p></Block>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Block title={t.remedies} i={1}><List items={m.remedies} /></Block>
        <Block title={t.compat} i={2}>
          <p className="text-sm text-muted-foreground">{t.harmonious} <b className="text-foreground">{m.compatible.join(', ')}</b></p>
          <p className="mt-1 text-sm text-muted-foreground">{t.care} <b className="text-foreground">{m.avoid.join(', ')}</b></p>
          <div className="mt-3 flex flex-wrap gap-2">{[...m.compatible, ...m.avoid].filter((v, i, a) => a.indexOf(v) === i).sort().map((n) => <Link key={n} href={`/mulank/${n}`} className="rounded-full border border-gold/40 px-3 py-1 text-xs hover:bg-gold/10">{t.root} {n}</Link>)}</div>
        </Block>
      </div>

      <section className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 via-transparent to-maroon/20 p-6">
        <h2 className="font-cinzel text-2xl font-bold gold-text">{t.services(m.n)}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t.servicesP}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Link key={s.title} href={s.href} style={{ animationDelay: `${i * 80}ms` }} className="mk-rise mk-card rounded-lg border border-gold/25 bg-background/60 p-4">
              <span className="text-xl text-gold">{s.icon}</span><h3 className="mt-1 font-semibold">{s.title}</h3><p className="mt-1 text-sm text-muted-foreground">{s.desc}</p><span className="mt-2 inline-block text-sm text-gold">{t.more}</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">{t.disclaimer}</p>
      <div className="flex justify-between text-sm">
        <Link href={`/mulank/${prev}`} className="text-gold hover:underline">← {t.root} {prev}</Link>
        <Link href="/mulank" className="text-muted-foreground hover:text-foreground">{t.all}</Link>
        <Link href={`/mulank/${next}`} className="text-gold hover:underline">{t.root} {next} →</Link>
      </div>
    </div>
  );
}
