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
  const savings = real && real > price ? real - price : 0;
  return (
    <div className="space-y-2">
      {/* Big discount badge and struck-through real price */}
      <div className="flex flex-wrap items-center gap-2.5">
        {pct > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-3 py-1 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/30 ring-1 ring-white/30 animate-pulse">
            🔥 {pct}% <Bi en="OFF" hi="छूट" />
          </span>
        )}
        {real > price && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider"><Bi en="Real Price" hi="वास्तविक मूल्य" />:</span>
            <span className="font-semibold line-through decoration-red-500 decoration-2 text-muted-foreground/80">{formatMoney(real, cur)}</span>
          </div>
        )}
      </div>

      {/* Offer Price with large Cinzel font and savings badge */}
      <div className="flex flex-wrap items-baseline gap-2.5">
        <span className="font-cinzel text-3xl sm:text-4xl font-extrabold tracking-tight">
          <span className="gold-text drop-shadow-[0_2px_14px_rgba(234,179,8,0.4)]">{formatMoney(price, cur)}</span>
        </span>
        {savings > 0 && (
          <span className="inline-flex items-center rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
            <Bi en={`Save ${formatMoney(savings, cur)}`} hi={`बचत ${formatMoney(savings, cur)}`} />
          </span>
        )}
      </div>

      {/* Trust note */}
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
        <Bi en={note.en} hi={note.hi} />
      </p>
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
