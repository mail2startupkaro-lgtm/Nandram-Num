/**
 * Display + checkout currency.
 *  - Visitors in India (or whose country is unknown, e.g. local development) see and pay ₹ INR.
 *  - Visitors outside India see and pay $ USD for every plan that has a USD price set in Admin → Plans.
 *    Plans without a USD price stay in ₹ for everyone.
 * Country comes from the hosting edge (Vercel `x-vercel-ip-country`, Cloudflare `cf-ipcountry`).
 * A visitor can override it with the ₹/$ switch on the pricing page (cookie `mn_cur`).
 * Safe for client and server code (no Node imports).
 */
export type Currency = 'INR' | 'USD';
export const CURRENCY_COOKIE = 'mn_cur';
export const OUTSIDE_INDIA = 'Outside India';

const isCur = (v: unknown): v is Currency => v === 'INR' || v === 'USD';

/** Two-letter country code from edge headers, or null when unknown. */
export function countryFromHeaders(h: Headers): string | null {
  const c = (h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || h.get('x-country-code') || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) && c !== 'XX' && c !== 'T1' ? c : null;
}

function cookieValue(h: Headers, name: string) {
  const m = (h.get('cookie') ?? '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Currency for this request: explicit choice (cookie) → country (outside India = USD) → INR. */
export function currencyForRequest(req: Request): { currency: Currency; country: string | null; chosen: boolean } {
  const country = countryFromHeaders(req.headers);
  const forced = (process.env.FORCE_CURRENCY ?? '').toUpperCase();
  if (isCur(forced)) return { currency: forced, country, chosen: true };
  const c = cookieValue(req.headers, CURRENCY_COOKIE)?.toUpperCase();
  if (isCur(c)) return { currency: c, country, chosen: true };
  return { currency: country && country !== 'IN' ? 'USD' : 'INR', country, chosen: false };
}

/** ₹1,999 / $24.99 from minor units (paise / cents). */
export function formatMoney(minor: number, cur: Currency = 'INR'): string {
  const v = minor / 100;
  const frac = { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 };
  return cur === 'USD' ? `$${v.toLocaleString('en-US', frac)}` : `₹${v.toLocaleString('en-IN', frac)}`;
}

export interface PriceView { currency: Currency; price: number; real: number; discount: number; percent: number }

type PlanLike = { code: string; pricePaise: number; credits?: number; features?: object | null };
const f = (p: PlanLike) => (p.features ?? {}) as Record<string, unknown>;
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : null);

/** USD price of a plan in cents, or null if the admin has not set one. */
export const usdPrice = (p: PlanLike) => n(f(p).usdCents);

/** Real (struck-through) INR price: the admin's MRP, else a sensible default. */
export function inrRealPrice(p: PlanLike): number {
  const mrp = n(f(p).mrpPaise);
  if (mrp && mrp > p.pricePaise) return mrp;
  const defaults: Record<string, number> = { SINGLE: 99_900, PACK5: 4_99_500, PRO_MONTHLY: 4_99_900, PRO_YEARLY: 59_98_800 };
  if (defaults[p.code] && defaults[p.code] > p.pricePaise) return defaults[p.code];
  if (p.credits && p.credits > 1) return Math.max(Math.round(p.pricePaise * 1.5), p.credits * 99_900);
  return p.pricePaise * 2;
}

/** What to show and charge for a plan in the requested currency (falls back to INR when no USD price is set). */
export function planPrice(p: PlanLike, want: Currency): PriceView {
  const usd = want === 'USD' ? usdPrice(p) : null;
  if (usd) {
    const mrp = n(f(p).usdMrpCents);
    // No USD real price set: keep the same discount ratio as INR, rounded to a .99 price.
    const ratio = inrRealPrice(p) / Math.max(1, p.pricePaise);
    const real = mrp && mrp > usd ? mrp : Math.max(usd, Math.round((usd * ratio) / 100) * 100 - 1);
    const discount = Math.max(0, real - usd);
    return { currency: 'USD', price: usd, real, discount, percent: real ? Math.round((discount / real) * 100) : 0 };
  }
  const real = inrRealPrice(p);
  const discount = Math.max(0, real - p.pricePaise);
  return { currency: 'INR', price: p.pricePaise, real, discount, percent: real ? Math.round((discount / real) * 100) : 0 };
}

/** International mobile for the payment gateway: "+<country code><number>", 8–15 digits. */
export function intlPhone(raw?: string | null): string | null {
  const s = (raw ?? '').trim();
  const d = s.replace(/\D/g, '');
  if (!s.startsWith('+') && !s.startsWith('00')) return null;
  const digits = s.startsWith('00') ? d.slice(2) : d;
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}
