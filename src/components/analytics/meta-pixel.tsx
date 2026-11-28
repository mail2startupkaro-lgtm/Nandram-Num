'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Meta (Facebook / Instagram) Pixel for Meta Ads. Switched on by NEXT_PUBLIC_META_PIXEL_ID (Vercel → Environment
 * Variables); without it nothing loads. Sends PageView on every page, including client-side navigation.
 * Standard events (Lead, Contact, InitiateCheckout, Purchase, ViewContent) come from lib/client/analytics.ts.
 * Never on admin / account screens.
 */
const PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || '').replace(/\D/g, '');
const PRIVATE = /^\/(admin|888|account|dashboard|settings)(\/|$)/;

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; push: unknown; loaded: boolean; version: string };

function install() {
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return;
  const n = function (...args: unknown[]) { if (n.callMethod) n.callMethod(...args); else n.queue.push(args); } as Fbq;
  n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
  w.fbq = n; w._fbq = n;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  n('init', PIXEL_ID);
}

export function MetaPixel() {
  const pathname = usePathname();
  const last = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!PIXEL_ID || !pathname || PRIVATE.test(pathname) || last.current === pathname) return;
    last.current = pathname;
    try { install(); window.fbq?.('track', 'PageView'); } catch { /* never block the page */ }
  }, [pathname]);
  return null;
}
