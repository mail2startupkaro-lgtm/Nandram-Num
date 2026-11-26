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
