'use client';
import { visitEvent } from './visit-tracker';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Meta (Facebook / Instagram) Pixel standard events for Meta Ads optimisation. Loaded only when
 * NEXT_PUBLIC_META_PIXEL_ID is set (see components/analytics/meta-pixel.tsx); otherwise every call is a no-op.
 * `eventID` lets Meta remove duplicates if the same event is later also sent from the server (Conversions API).
 */
export function trackMeta(event: 'ViewContent' | 'Lead' | 'Contact' | 'InitiateCheckout' | 'Purchase', params: Record<string, unknown> = {}, eventID?: string) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      if (eventID) window.fbq('track', event, params, { eventID });
      else window.fbq('track', event, params);
    }
  } catch {
    // never block the UI
  }
}

/** GA event → Meta standard event, so every existing CTA on the site also reports to Meta Ads. */
function toMeta(name: string, params: Record<string, unknown>) {
  const svc = (params.service_code ?? params.service ?? params.lead_magnet) as string | undefined;
  const base = svc ? { content_ids: [svc], content_type: 'product' } : {};
  if (name === 'generate_lead') trackMeta('Lead', { ...base, content_name: params.lead_magnet });
  else if (name === 'whatsapp_click') trackMeta('Contact', { ...base, content_name: params.source });
  else if (name === 'begin_checkout') trackMeta('InitiateCheckout', { ...base, value: params.value, currency: params.currency, num_items: 1 });
  else if (name === 'purchase') trackMeta('Purchase', { ...base, value: params.value, currency: params.currency, num_items: 1 }, params.transaction_id as string | undefined);
}

/** Events also recorded in the site's own Visitor analytics (whatsapp/call clicks are captured automatically there). */
const FIRST_PARTY = new Set(['generate_lead', 'begin_checkout', 'purchase', 'service_inquiry', 'reading_generated', 'pdf_download', 'download_ebook_click', 'sample_view', 'popup_manual_open', 'contact_submit', 'sign_up', 'login']);

/** Sends custom event to Google Analytics / GTM if available */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (FIRST_PARTY.has(name)) {
    const label = [params.lead_magnet, params.service, params.service_code, params.tier, params.source, params.page].find((x) => typeof x === 'string') as string | undefined;
    visitEvent(name, { label, value: typeof params.value === 'number' ? params.value : undefined });
  }
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  } catch {
    // Fail silently so tracking never interferes with user experience
  }
  toMeta(name, params);
}

/** Free calculators counted in Admin → Visitor analytics → "Free calculator users" (keys = event labels). */
export type FreeCalculator = 'moolank' | 'bhagyank' | 'loshu' | 'name' | 'mobile' | 'kua' | 'personal-year' | 'vehicle' | 'house'
  | 'quick-reading' | 'angel' | 'destiny-matrix' | 'pythagoras' | 'signature' | 'business';

/**
 * Records that a visitor used (got a result from) a free calculator. Counted once per browser tab session per
 * calculator, so typing or re-calculating does not inflate the numbers. Goes to the site's own analytics and GA.
 */
export function trackCalculatorUse(tool: FreeCalculator) {
  if (typeof window === 'undefined') return;
  try {
    const key = `mn_calc_${tool}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch { /* storage blocked: still count */ }
  visitEvent('calculator_use', { label: tool });
  try { if (typeof window.gtag === 'function') window.gtag('event', 'calculator_use', { calculator: tool }); } catch { /* never block the UI */ }
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
export function trackCheckoutStarted(planCode: string, amountPaise: number, currency = 'INR') {
  trackEvent('begin_checkout', {
    currency,
    value: amountPaise / 100,
    service_code: planCode,
    items: [{ item_id: planCode, item_name: planCode, price: amountPaise / 100 }],
  });
}

/** Tracks successful purchase */
export function trackPurchase(info: { orderId: string; paymentId: string; amountPaise: number; planCode?: string; currency?: string }) {
  trackEvent('purchase', {
    transaction_id: info.paymentId || info.orderId,
    currency: info.currency || 'INR',
    service_code: info.planCode,
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
