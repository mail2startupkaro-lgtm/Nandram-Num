'use client';
/**
 * Live price of the Complete Life Report (SVC_PERSONAL_REPORT) exactly as set in Admin → Services and shown on the
 * Services page – used wherever the free instant reading offers the full report. ₹ for India, $ for visitors abroad
 * (CSS picks the block from html[data-cur], like ServicePrice).
 */
import * as React from 'react';
import { api } from '@/lib/client/api';
import { formatMoney } from '@/lib/billing/currency';
import type { PublicService } from '@/components/services/book-service';
import { ServicePrice, serviceReal } from '@/components/services/service-price';

export const LIFE_REPORT_CODE = 'SVC_PERSONAL_REPORT';

let cache: Promise<PublicService[]> | null = null;
const loadServices = () => (cache ??= api<{ services: PublicService[] }>('/api/services').then((r) => r.services).catch(() => { cache = null; return []; }));

export function useService(code: string): PublicService | null {
  const [s, setS] = React.useState<PublicService | null>(null);
  React.useEffect(() => { let on = true; loadServices().then((l) => { if (on) setS(l.find((x) => x.code === code && x.payable) ?? null); }); return () => { on = false; }; }, [code]);
  return s;
}

/** Short inline price, e.g. "₹2,100 ₹4,200" (offer + struck-through real price). Renders nothing until loaded / when no price is confirmed. */
export function LifeReportPriceInline({ className, struck = true, code = LIFE_REPORT_CODE, prefix = '' }: { className?: string; struck?: boolean; code?: string; prefix?: string }) {
  const s = useService(code);
  if (!s?.pricePaise) return null;
  const one = (price: number, real: number, cur: 'INR' | 'USD') => <>{formatMoney(price, cur)}{struck && real > price && <s className="ml-1.5 text-[0.85em] font-normal opacity-70">{formatMoney(real, cur)}</s>}</>;
  return (
    <span className={className}>
      {prefix}<span className={s.usdCents ? 'cur-inr' : undefined}>{one(s.pricePaise, serviceReal(s, 'INR'), 'INR')}</span>
      {s.usdCents ? <span className="cur-usd">{one(s.usdCents, serviceReal(s, 'USD'), 'USD')}</span> : null}
    </span>
  );
}

/** The full price block from the Services page (discount badge, real price, offer price, savings). */
export function LifeReportPriceBlock() {
  const s = useService(LIFE_REPORT_CODE);
  if (!s?.pricePaise) return null;
  return <div className="flex justify-center text-left"><ServicePrice s={s} /></div>;
}
