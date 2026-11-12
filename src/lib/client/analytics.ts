'use client';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Sends custom event to Google Analytics / GTM if available */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  } catch {
    // Fail silently so tracking never interferes with user experience
  }
}

/** Tracks page view with pathname and title */
export function trackPageView(path: string, title?: string) {
  trackEvent('page_view', {
    page_path: path,
    page_title: title || (typeof document !== 'undefined' ? document.title : ''),
  });
}

/** Tracks a calculated numerology reading */
export function trackReadingGenerated(info: {
  moolank?: number;
  bhagyank?: number;
  modules?: string[];
  language?: string;
  isFull?: boolean;
}) {
  trackEvent('reading_generated', {
    moolank: info.moolank,
    bhagyank: info.bhagyank,
    modules: info.modules?.join(',') ?? 'dob',
    language: info.language ?? 'en',
    tier: info.isFull ? 'full' : 'preview',
  });
}

/** Tracks PDF report download */
export function trackPdfDownload(info: { tier?: string; pageCount?: number; filename?: string }) {
  trackEvent('pdf_download', {
    tier: info.tier ?? 'preview',
    page_count: info.pageCount ?? 15,
    filename: info.filename,
  });
}

/** Tracks checkout flow initiation */
export function trackCheckoutStarted(planCode: string, amountPaise: number) {
  trackEvent('begin_checkout', {
    currency: 'INR',
    value: amountPaise / 100,
    items: [{ item_id: planCode, item_name: planCode, price: amountPaise / 100 }],
  });
}

/** Tracks successful purchase */
export function trackPurchase(info: { orderId: string; paymentId: string; amountPaise: number; planCode?: string }) {
  trackEvent('purchase', {
    transaction_id: info.paymentId || info.orderId,
    currency: 'INR',
    value: info.amountPaise / 100,
    items: info.planCode ? [{ item_id: info.planCode, item_name: info.planCode, price: info.amountPaise / 100 }] : undefined,
  });
}

/** Tracks consultation / service order initiation */
export function trackServiceInquiry(serviceCode: string, pricePaise?: number) {
  trackEvent('service_inquiry', {
    service_code: serviceCode,
    value: pricePaise ? pricePaise / 100 : undefined,
    currency: 'INR',
  });
}
