'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/client/analytics';

interface AnalyticsConfig {
  measurementId: string;
  gtmId: string;
  enabled: boolean;
  trackPageViews: boolean;
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [config, setConfig] = React.useState<AnalyticsConfig | null>(null);

  React.useEffect(() => {
    fetch('/api/analytics/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg: AnalyticsConfig | null) => {
        if (!cfg || !cfg.enabled) return;
        setConfig(cfg);

        // Inject GA4 gtag script if measurementId is provided
        if (cfg.measurementId && typeof window !== 'undefined') {
          const gaId = cfg.measurementId.trim();
          const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`);
          if (!existingScript) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            if (!window.gtag) {
              window.gtag = function gtag() {
                window.dataLayer.push(arguments);
              };
              window.gtag('js', new Date());
            }
            window.gtag('config', gaId, { send_page_view: false });
          }
        }
      })
      .catch(() => {});
  }, []);

  // Track page view on route transitions
  React.useEffect(() => {
    if (!config?.enabled || !config?.trackPageViews) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams, config]);

  return null;
}
