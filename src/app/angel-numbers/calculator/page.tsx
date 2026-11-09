import type { Metadata } from 'next';
import Link from 'next/link';
import { AcharyaProfile } from '@/components/blog/blog-parts';
import { AngelCta } from '@/components/angel/angel-parts';
import { AngelCalculator } from '@/components/angel/angel-calculator';
import { TOP_ANGEL } from '@/lib/angel/generate';

export const metadata: Metadata = {
  title: 'Angel Number Calculator – Find Your Angel Number by Date of Birth',
  description: 'Free angel number calculator: find your life path, Mulank, birthday and personal year angel numbers from your date of birth, check any angel number\'s compatibility with your DOB, and get your couple angel number.',
  keywords: ['angel number calculator', 'find my angel number', 'birthday angel number', 'my angel number', 'angel number by date of birth', 'angel number compatibility', 'couple angel number'],
  alternates: { canonical: '/angel-numbers/calculator' },
};

const FAQS = [
  { q: 'How is my angel number calculated from my date of birth?', a: 'We add every digit of your date of birth (DD-MM-YYYY) to get your Bhagyank, also called life path number. Repeating it three times gives your life path angel number, e.g. Bhagyank 4 → 444. Master numbers 11, 22 and 33 give 1111, 2222 and 3333.' },
  { q: 'What is a birthday angel number?', a: 'Your birthday angel number is your day of birth mirrored, for example the 7th gives 0707 and the 23rd gives 2323. It often shows up on clocks as a personal sign.' },
  { q: 'How does the compatibility score work?', a: 'The angel number is reduced to its root digit and compared with your Bhagyank and Mulank using the traditional friendly, neutral and enemy number table. Digits you share with the number add to the score.' },
  { q: 'What if my compatibility score is low?', a: 'A low score does not make the number bad. It means its message is a lesson for you rather than a natural strength. A full reading explains how to work with it.' },
];

export default function AngelCalculatorPage() {
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Angel Number Calculator', applicationCategory: 'LifestyleApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, author: { '@type': 'Person', name: 'Acharya Nandram' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
  return (
    <div className="container max-w-5xl space-y-10 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link> / <Link href="/angel-numbers" className="hover:text-foreground">Angel Numbers</Link> / Calculator</nav>
      <header className="text-center">
        <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text">Angel Number Calculator</span></h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">Find your personal angel numbers from your date of birth, check the number you keep seeing, or discover your couple angel number.</p>
      </header>
      <AngelCalculator />
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold">Popular Angel Numbers</h2>
        <div className="flex flex-wrap gap-2">{TOP_ANGEL.slice(0, 30).map((n) => <Link key={n} href={`/angel-numbers/${n}`} className="rounded-full border border-gold/40 px-4 py-1.5 font-cinzel text-sm font-semibold hover:bg-gold/10">{n}</Link>)}<Link href="/angel-numbers#all" className="px-3 py-1.5 text-sm text-gold hover:underline">All numbers →</Link></div>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold">How the Angel Number Calculator Works</h2>
        {FAQS.map((f) => <details key={f.q} className="glass rounded-lg p-4" open={f === FAQS[0]}><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}
      </section>
      <AngelCta variant="big" />
      <AcharyaProfile />
    </div>
  );
}
