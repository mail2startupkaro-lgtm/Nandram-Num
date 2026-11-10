import type { Metadata } from 'next';
import Link from 'next/link';
import { BHAGYANK_NUMBERS, bhagyankFor } from '@/lib/bhagyank-data';
import { ForLang } from '@/components/i18n/bi';

export const metadata: Metadata = {
  title: 'Bhagyank 1 to 9 – Destiny Number Meaning, Career, Money & Remedies',
  description: 'Find your Bhagyank (destiny / life path number) from your full date of birth. Read the life purpose, career, money, relationships, lucky colours and remedies for Bhagyank 1 to 9.',
  alternates: { canonical: '/bhagyank' },
};

const L = {
  en: { eyebrow: 'Destiny number · भाग्यांक', h1: 'Discover your Bhagyank', p: 'Your Bhagyank is the total of every digit in your date of birth, reduced to one digit. It shows the path your life naturally takes and where fortune comes from. Pick your number to explore.',
    how: 'How to find it', howP: 'Write your date of birth as DD-MM-YYYY and add every digit. Example: 15-08-1990 → 1+5+0+8+1+9+9+0 = 33 → 3+3 = 6. Bhagyank 6.', calc: 'Use the free Bhagyank calculator →',
    root: 'Bhagyank', explore: (n: number) => `Explore Bhagyank ${n} →`, diff: 'Mulank or Bhagyank?', diffP: 'Mulank (from the day of birth) is your personality, how you act. Bhagyank (from the full date) is your destiny, where life takes you. Read both together for the full picture.', mulank: 'See Mulank 1–9 →', reading: 'Get my full reading' },
  hi: { eyebrow: 'भाग्य अंक · भाग्यांक', h1: 'अपना भाग्यांक जानें', p: 'भाग्यांक आपकी पूरी जन्म तिथि के सभी अंकों को जोड़कर एक अंक तक लाने से निकलता है। यह बताता है कि जीवन आपको स्वाभाविक रूप से किस दिशा में ले जाता है और भाग्य कहाँ से साथ देता है। जानने के लिए अपना अंक चुनें।',
    how: 'कैसे निकालें', howP: 'अपनी जन्म तिथि DD-MM-YYYY में लिखें और सभी अंक जोड़ें। उदाहरण: 15-08-1990 → 1+5+0+8+1+9+9+0 = 33 → 3+3 = 6। भाग्यांक 6।', calc: 'मुफ़्त भाग्यांक कैलकुलेटर उपयोग करें →',
    root: 'भाग्यांक', explore: (n: number) => `भाग्यांक ${n} देखें →`, diff: 'मूलांक या भाग्यांक?', diffP: 'मूलांक (जन्म के दिन से) आपका व्यक्तित्व है, यानी आप कैसे व्यवहार करते हैं। भाग्यांक (पूरी जन्म तिथि से) आपका भाग्य है, यानी जीवन आपको कहाँ ले जाता है। पूरी तस्वीर के लिए दोनों को साथ पढ़ें।', mulank: 'मूलांक 1–9 देखें →', reading: 'मेरी पूरी रीडिंग पाएँ' },
};

export default function BhagyankIndex() {
  return <ForLang>{(l) => <BhagyankIndexView lang={l} />}</ForLang>;
}

function BhagyankIndexView({ lang }: { lang: 'en' | 'hi' }) {
  const t = L[lang];
  return (
    <div className="container max-w-6xl space-y-12 py-10 sm:py-14">
      <header className="mk-rise space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">{t.eyebrow}</p>
        <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text">{t.h1}</span></h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{t.p}</p>
      </header>
      <section className="mk-rise glass mx-auto max-w-3xl rounded-xl border border-gold/25 p-5 text-center">
        <h2 className="font-cinzel text-xl font-bold gold-text">{t.how}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.howP}</p>
        <Link href="/calculators/bhagyank-calculator" className="mt-3 inline-block text-sm text-gold hover:underline">{t.calc}</Link>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BHAGYANK_NUMBERS.map((n, i) => { const b = bhagyankFor(n, lang)!; return (
          <Link key={n} href={`/bhagyank/${n}`} style={{ animationDelay: `${i * 70}ms` }} className="mk-rise mk-card glass group relative overflow-hidden rounded-xl border border-gold/25 p-5">
            <span className="mk-spin pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-dashed border-gold/40" />
            <div className="flex items-center gap-4">
              <span className="mk-pulse flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a] font-cinzel text-3xl font-bold gold-text">{n}</span>
              <div><h2 className="font-cinzel text-lg font-bold">{t.root} {n} · {b.title}</h2><p className="text-xs text-gold">{b.planet}</p></div>
            </div>
            <p className="mt-3 text-sm italic text-muted-foreground">{b.tagline}</p>
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{b.purpose}</p>
            <span className="mt-3 inline-block text-sm text-gold group-hover:underline">{t.explore(n)}</span>
          </Link>
        ); })}
      </div>
      <section className="glass rounded-xl border border-gold/25 p-6 text-center">
        <h2 className="font-cinzel text-2xl font-bold gold-text">{t.diff}</h2>
        <p className="mx-auto mt-2 max-w-3xl text-sm text-muted-foreground">{t.diffP}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/mulank" className="inline-flex h-11 items-center rounded-md border border-gold/50 px-5 hover:bg-gold/10">{t.mulank}</Link>
          <Link href="/reading" className="inline-flex h-11 items-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-5 font-semibold text-[hsl(250_45%_10%)]">{t.reading}</Link>
        </div>
      </section>
    </div>
  );
}
