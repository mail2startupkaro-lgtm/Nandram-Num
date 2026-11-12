'use client';
/** Browser helpers for Cashfree checkout (shared by /services). */
import { api } from './api';

type CashfreeResult = { error?: { message?: string }; redirect?: boolean };
type CashfreeFn = (o: { mode: string }) => { checkout: (o: { paymentSessionId: string; redirectTarget?: string }) => Promise<CashfreeResult> };

export function loadCashfree(): Promise<CashfreeFn> {
  const w = window as unknown as { Cashfree?: CashfreeFn };
  return new Promise((res, rej) => {
    if (w.Cashfree) return res(w.Cashfree);
    const s = Object.assign(document.createElement('script'), { src: 'https://sdk.cashfree.com/js/v3/cashfree.js', async: true });
    s.onload = () => (w.Cashfree ? res(w.Cashfree) : rej(new Error('Could not load Cashfree')));
    s.onerror = () => rej(new Error('Could not load Cashfree'));
    document.body.appendChild(s);
  });
}

/** Asks our server (which asks Cashfree) a few times, because UPI confirmations can take a few seconds. */
export async function confirmCashfreeOrder(orderId: string, tries = 6): Promise<'paid' | 'pending' | 'failed'> {
  for (let i = 0; i < tries; i++) {
    const r = await api<{ status: 'paid' | 'pending' | 'failed' }>('/api/billing/cashfree/verify', { method: 'POST', json: { orderId } });
    if (r.status !== 'pending') return r.status;
    await new Promise((ok) => setTimeout(ok, 2500));
  }
  return 'pending';
}
