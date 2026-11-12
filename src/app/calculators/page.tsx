import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator as CalcIcon } from 'lucide-react';
import { CALCULATORS } from '@/lib/seo/calculators';
import { ExpertCard } from '@/components/calculators/expert-card';
import { Bi } from '@/components/i18n/bi';
import { DisclaimerNote } from '@/components/legal/disclaimer-note';

export const metadata: Metadata = { title: 'Free Numerology Calculators', description: 'Free numerology calculators: Moolank, Bhagyank, Lo Shu grid, name, mobile number, Kua, personal year, vehicle number and house number, based on Indian numerology.', alternates: { canonical: '/calculators' } };

export default function Calculators() {
  return (
    <div className="container space-y-8 py-10 sm:py-14">
      <h1 className="text-center text-4xl font-bold sm:text-5xl"><span className="gold-text"><Bi en="Free numerology calculators" hi="मुफ़्त अंक ज्योतिष कैलकुलेटर" /></span></h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CALCULATORS.map((c) => (
          <Link key={c.slug} href={`/calculators/${c.slug}`} className="glass group rounded-lg p-5 hover:ring-1 hover:ring-gold">
            <CalcIcon className="mb-3 h-6 w-6 text-gold" /><h2 className="text-xl font-semibold group-hover:text-gold"><Bi en={c.h1.replace(/^Free /, '')} hi={c.hi.h1.replace(/^मुफ़्त /, '')} /></h2><p className="mt-1 text-sm text-muted-foreground"><Bi en={c.description} hi={c.hi.description} /></p>
          </Link>
        ))}
        <Link href="/angel-numbers/calculator" className="glass group rounded-lg p-5 ring-1 ring-gold/40 hover:ring-gold">
          <CalcIcon className="mb-3 h-6 w-6 text-gold" /><h2 className="text-xl font-semibold group-hover:text-gold"><Bi en="Angel Number Calculator" hi="एंजेल नंबर कैलकुलेटर" /></h2><p className="mt-1 text-sm text-muted-foreground"><Bi en="Find your personal angel numbers from your date of birth and check any angel number's compatibility with your Mulank and Bhagyank." hi="अपनी जन्म तिथि से अपने व्यक्तिगत एंजेल नंबर जानें और किसी भी एंजेल नंबर की अपने मूलांक व भाग्यांक से अनुकूलता जाँचें।" /></p>
        </Link>
      </div>
      <ExpertCard />
      <DisclaimerNote />
    </div>
  );
}
