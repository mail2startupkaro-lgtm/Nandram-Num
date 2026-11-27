'use client';
import * as React from 'react';
import { Calculator } from 'lucide-react';
import { useApp } from '@/components/layout/providers';

/** "If you refer N sales a month" → monthly earnings, at the average price of the services (excl. GST). */
export function EarningsCalculator({ rate, prices }: { rate: number; prices: number[] }) {
  const { lang } = useApp();
  const hi = lang === 'hi';
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const [n, setN] = React.useState(20);
  const month = Math.round((n * avg * rate) / 100 / 100);
  const fmt = (v: number) => `₹${v.toLocaleString('en-IN')}`;
  if (!avg) return null;
  return (
    <div className="glass mx-auto max-w-2xl rounded-2xl border border-gold/30 p-5">
      <p className="flex items-center gap-2 font-semibold"><Calculator className="h-5 w-5 text-gold" />{hi ? 'कमाई कैलकुलेटर' : 'Earnings calculator'}</p>
      <label htmlFor="af-calc" className="mt-3 block text-sm text-muted-foreground">{hi ? `हर महीने बिक्री: ${n}` : `Sales you refer each month: ${n}`}</label>
      <input id="af-calc" type="range" min={1} max={200} value={n} onChange={(e) => setN(Number(e.target.value))} className="mt-1 w-full accent-[hsl(var(--gold))]" />
      <div className="mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg bg-gold/10 p-3"><p className="text-xs text-muted-foreground">{hi ? 'प्रति माह' : 'Per month'}</p><p className="font-serif text-2xl font-bold text-gold">{fmt(month)}</p></div>
        <div className="rounded-lg bg-gold/10 p-3"><p className="text-xs text-muted-foreground">{hi ? 'प्रति वर्ष' : 'Per year'}</p><p className="font-serif text-2xl font-bold text-gold">{fmt(month * 12)}</p></div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hi ? 'सेवाओं के औसत मूल्य (GST छोड़कर) पर अनुमान। वास्तविक कमाई बिक्री पर निर्भर है।' : 'Estimate at the average service price (excl. GST). Actual earnings depend on your sales.'}</p>
    </div>
  );
}
