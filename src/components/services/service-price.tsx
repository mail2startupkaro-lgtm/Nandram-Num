import { Bi } from '@/components/i18n/bi';
import { formatMoney, type Currency } from '@/lib/billing/currency';

export interface PricedService { pricePaise: number | null; mrpPaise: number | null; usdCents?: number | null; usdMrpCents?: number | null }

/** Real (struck-through) price: the admin's value, else 2× (INR) or the same ratio rounded to .99 (USD). */
export function serviceReal(s: PricedService, cur: Currency): number {
  const price = s.pricePaise ?? 0;
  const inrReal = s.mrpPaise && s.mrpPaise > price ? s.mrpPaise : price * 2;
  if (cur === 'INR') return inrReal;
  const usd = s.usdCents ?? 0;
  if (s.usdMrpCents && s.usdMrpCents > usd) return s.usdMrpCents;
  return Math.max(usd, Math.round((usd * (inrReal / Math.max(1, price))) / 100) * 100 - 1);
}

function Block({ price, real, cur, note }: { price: number; real: number; cur: Currency; note: { en: string; hi: string } }) {
  const pct = real ? Math.round(((real - price) / real) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs">
        <span className="font-medium text-muted-foreground">1 · <Bi en="Real Price" hi="वास्तविक मूल्य" />:</span>
        <span className="text-muted-foreground line-through decoration-danger decoration-[1.5px]">{formatMoney(real, cur)}</span>
        <span className="rounded bg-danger/15 px-1.5 text-[10px] font-bold text-danger">{pct}% <Bi en="OFF" hi="छूट" /></span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gold">2 · <Bi en="Offer Price" hi="ऑफ़र मूल्य" />:</span>
        <span className="font-serif text-3xl font-bold"><span className="gold-text">{formatMoney(price, cur)}</span></span>
      </div>
      <p className="text-[11px] text-muted-foreground"><Bi en={note.en} hi={note.hi} /></p>
    </div>
  );
}

/**
 * Service fee in ₹, plus a $ version for visitors outside India when the admin set one.
 * Both are rendered; CSS shows the one matching html[data-cur] (set before first paint), so cached pages work for everyone.
 */
export function ServicePrice({ s, note = { en: 'incl. 18% GST · one-time', hi: '18% GST सहित · एक बार' } }: { s: PricedService; note?: { en: string; hi: string } }) {
  if (!s.pricePaise) return null;
  const inr = <Block price={s.pricePaise} real={serviceReal(s, 'INR')} cur="INR" note={note} />;
  if (!s.usdCents) return inr;
  return (
    <>
      <div className="cur-inr">{inr}</div>
      <div className="cur-usd"><Block price={s.usdCents} real={serviceReal(s, 'USD')} cur="USD" note={{ en: 'incl. taxes · one-time · international card', hi: 'कर सहित · एक बार · अंतरराष्ट्रीय कार्ड' }} /></div>
    </>
  );
}
