/**
 * Affiliate program – pure rules shared by the server, the pages and the tests.
 *
 * Attribution: a visit with ?ref=CODE stores the code and the click time in the `mn_ref` cookie (set by the middleware,
 * last click wins). At checkout the sale goes to: the affiliate whose coupon code was used, else the affiliate in the
 * cookie if the click is within `cookieDays`. Affiliates never earn on their own purchases.
 * Commission = rate % of the order value excluding GST (after any discount), in the order's currency.
 * A commission is "pending" for `holdDays` after payment (refund window), then "available" until it is paid out.
 */
export const REF_PARAM = 'ref';
export const REF_COOKIE = 'mn_ref';
/** The cookie lives at most this long; the admin's cookieDays (≤ this) decides what still counts. */
export const REF_COOKIE_MAX_DAYS = 90;

export type AffiliateStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type CommissionStatus = 'awaiting' | 'pending' | 'paid' | 'cancelled';
export type PayoutMethod = 'upi' | 'bank';

/** Affiliate codes: 4–20 letters/digits, upper case. Anything else is ignored. */
export function normalizeCode(raw: string | null | undefined): string | null {
  const c = (raw ?? '').trim().toUpperCase();
  return /^[A-Z0-9]{4,20}$/.test(c) ? c : null;
}

export const refCookieValue = (code: string, nowMs = Date.now()) => `${code}.${Math.floor(nowMs / 1000)}`;

/** Code from the cookie if the click is recent enough, else null. */
export function parseRefCookie(value: string | null | undefined, cookieDays: number, nowMs = Date.now()): string | null {
  const m = /^([A-Z0-9]{4,20})\.(\d{9,11})$/.exec(value ?? '');
  if (!m) return null;
  const age = nowMs / 1000 - Number(m[2]);
  return age >= -300 && age <= cookieDays * 86_400 ? m[1] : null;
}

/** Reads one cookie from a Cookie header. */
export function cookieFrom(header: string | null | undefined, name: string): string | null {
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

/** First word of the name in capitals (max 8 letters) – "Ravi Kumar" → RAVI; a number is added to make it unique. */
export function codeBase(name: string | null | undefined): string {
  const w = (name ?? '').toUpperCase().replace(/[^A-Z ]/g, '').trim().split(/\s+/)[0] ?? '';
  return w.length >= 3 ? w.slice(0, 8) : 'PARTNER';
}

export const commissionFor = (salePaise: number, percent: number) => Math.max(0, Math.round((salePaise * percent) / 100));

/** Order value excluding 18% GST for a GST-inclusive Indian price (used to show "you earn about …"). */
export const exGst = (inclusivePaise: number, currency: 'INR' | 'USD' = 'INR') => (currency === 'INR' ? Math.round((inclusivePaise * 100) / 118) : inclusivePaise);

/** Pending commissions become available for payout after the hold period. */
export function isAvailable(c: { status: string; earnedAt: Date | string | null }, holdDays: number, nowMs = Date.now()): boolean {
  if (c.status !== 'pending' || !c.earnedAt) return false;
  return new Date(c.earnedAt).getTime() + holdDays * 86_400_000 <= nowMs;
}

/** The status shown to people: awaiting is hidden; pending splits into "on hold" and "available". */
export function displayStatus(c: { status: string; earnedAt: Date | string | null }, holdDays: number, nowMs = Date.now()): 'on_hold' | 'available' | 'paid' | 'cancelled' | 'awaiting' {
  if (c.status === 'pending') return isAvailable(c, holdDays, nowMs) ? 'available' : 'on_hold';
  return c.status as 'paid' | 'cancelled' | 'awaiting';
}

/** "₹1,250" / "$12.50" */
export function money(paise: number, currency: string): string {
  const v = paise / 100;
  return currency === 'USD'
    ? `$${v.toLocaleString('en-US', { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 })}`
    : `₹${v.toLocaleString('en-IN', { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

/** UPI id like name@bank; Indian bank account 9–18 digits; IFSC like SBIN0001234. */
export const UPI_RE = /^[a-zA-Z0-9._-]{2,60}@[a-zA-Z][a-zA-Z0-9.-]{1,40}$/;
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_RE = /^\d{9,18}$/;
export interface PayoutDetails { upi?: string; accountName?: string; accountNumber?: string; ifsc?: string; bankName?: string }
/** "xxxx1234" / "ra…@okaxis" – shown back to the affiliate without revealing the full details. */
export function maskPayout(method: string | null, d: PayoutDetails | null): string {
  if (!method || !d) return '';
  if (method === 'upi' && d.upi) { const [u, h] = d.upi.split('@'); return `${u.slice(0, 2)}…@${h}`; }
  if (method === 'bank' && d.accountNumber) return `${d.bankName ? `${d.bankName} ` : ''}xxxx${d.accountNumber.slice(-4)}${d.ifsc ? ` · ${d.ifsc}` : ''}`;
  return '';
}
