import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator as CalcIcon } from 'lucide-react';
import { CALCULATORS } from '@/lib/seo/calculators';

export const metadata: Metadata = { title: 'Free Numerology Calculators', description: 'Free Moolank, Bhagyank, Lo Shu Grid, name, mobile number and Kua calculators based on Indian numerology.', alternates: { canonical: '/calculators' } };

export default function Calculators() {
  return (
    <div className="container space-y-8 py-10 sm:py-14">
      <h1 className="text-center text-4xl font-bold sm:text-5xl"><span className="gold-text">Free numerology calculators</span></h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CALCULATORS.map((c) => (
          <Link key={c.slug} href={`/calculators/${c.slug}`} className="glass group rounded-lg p-5 hover:ring-1 hover:ring-gold">
            <CalcIcon className="mb-3 h-6 w-6 text-gold" /><h2 className="text-xl font-semibold group-hover:text-gold">{c.h1.replace(/^Free /, '')}</h2><p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
