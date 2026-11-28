'use client';

import * as React from 'react';
import { trackEvent, trackMeta } from '@/lib/client/analytics';

/** Fires Meta "ViewContent" (and a GA event) once when an ad landing page opens. Waits briefly for the pixel to load. */
export function LpViewContent({ code, name, value, currency = 'INR' }: { code: string; name: string; value?: number; currency?: string }) {
  React.useEffect(() => {
    const send = () => trackMeta('ViewContent', { content_ids: [code], content_type: 'product', content_name: name, ...(value ? { value, currency } : {}) });
    const t = window.setTimeout(send, 600);
    trackEvent('lp_view', { service_code: code, page: window.location.pathname });
    return () => window.clearTimeout(t);
  }, [code, name, value, currency]);
  return null;
}

/** A CTA link that reports which button was used (GA: lp_cta; WhatsApp links also send Meta "Contact"). */
export function LpLink({ href, where, code, kind = 'book', className, children, external }: { href: string; where: string; code: string; kind?: 'book' | 'whatsapp'; className?: string; children: React.ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      onClick={() => trackEvent(kind === 'whatsapp' ? 'whatsapp_click' : 'lp_cta', { source: where, service_code: code })}
    >
      {children}
    </a>
  );
}
