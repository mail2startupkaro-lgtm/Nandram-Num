/**
 * Dynamic loader and checkout helper for Razorpay standard checkout.
 */

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on: (event: string, handler: (res: unknown) => void) => void;
    };
  }
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

let loaderPromise: Promise<void> | null = null;

export function loadRazorpayJs(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error('Failed to load Razorpay checkout script'));
    };
    document.body.appendChild(script);
  });

  return loaderPromise;
}

export async function openRazorpayCheckout(opts: RazorpayCheckoutOptions): Promise<{
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}> {
  await loadRazorpayJs();
  if (!window.Razorpay) throw new Error('Razorpay SDK not available');

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      ...opts,
      handler: (response) => {
        opts.handler?.(response);
        resolve(response);
      },
      modal: {
        ...opts.modal,
        ondismiss: () => {
          opts.modal?.ondismiss?.();
          reject(new Error('PAYMENT_CANCELLED'));
        },
      },
    });

    rzp.on('payment.failed', (resp: unknown) => {
      console.warn('[Razorpay] Payment failed event:', resp);
    });

    rzp.open();
  });
}

/**
 * Confirms a finished Razorpay checkout with the server. Razorpay can take a few seconds to capture
 * a successful payment, so "pending" is re-checked a few times before giving up (the webhook still
 * activates the order later if it was really paid).
 */
export async function confirmRazorpayPayment(
  resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string },
  opts: { tries?: number; delayMs?: number } = {}
): Promise<'paid' | 'pending' | 'failed'> {
  const tries = opts.tries ?? 5;
  const delayMs = opts.delayMs ?? 2500;
  let last: 'paid' | 'pending' | 'failed' = 'pending';
  for (let i = 0; i < tries; i++) {
    if (i) await new Promise((r) => setTimeout(r, delayMs));
    const res = await fetch('/api/billing/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature }),
    }).catch(() => null);
    const data = res ? ((await res.json().catch(() => null)) as { status?: string } | null) : null;
    last = data?.status === 'paid' ? 'paid' : data?.status === 'failed' ? 'failed' : 'pending';
    if (last !== 'pending') return last;
  }
  return last;
}
