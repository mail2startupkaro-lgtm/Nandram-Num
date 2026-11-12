'use client';
import * as React from 'react';
import { CURRENCY_COOKIE, type Currency } from '@/lib/billing/currency';

/** The currency this visitor sees (html[data-cur], set before first paint from their country or ₹/$ choice). */
export function useDisplayCurrency(): Currency {
  const read = (): Currency => (typeof document !== 'undefined' && document.documentElement.dataset.cur === 'USD' ? 'USD' : 'INR');
  const [cur, setCur] = React.useState<Currency>('INR');
  React.useEffect(() => {
    setCur(read());
    const mo = new MutationObserver(() => setCur(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-cur'] });
    return () => mo.disconnect();
  }, []);
  return cur;
}

/** Remember the visitor's ₹ / $ choice for a year and update the page immediately. */
export function chooseCurrency(c: Currency) {
  document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=31536000; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
  document.documentElement.dataset.cur = c;
}

/** The visitor's own time zone (e.g. "America/New_York"); IST if unknown. */
export function useTimeZone(): string {
  const [tz, setTz] = React.useState('Asia/Kolkata');
  React.useEffect(() => { try { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'); } catch { /* keep IST */ } }, []);
  return tz;
}
