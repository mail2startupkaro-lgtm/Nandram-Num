'use client';
import * as React from 'react';
import { REF_PARAM } from '@/lib/affiliate/program';

/** Counts a click on an affiliate link (?ref=CODE) once per code per browser tab session. The cookie is set by the middleware. */
export function AffiliateRefClick() {
  React.useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get(REF_PARAM)?.trim().toUpperCase();
      if (!code || !/^[A-Z0-9]{4,20}$/.test(code)) return;
      const key = `mn_ref_seen_${code}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      const body = JSON.stringify({ code, path: window.location.pathname });
      if (!navigator.sendBeacon?.('/api/affiliate/click', body)) fetch('/api/affiliate/click', { method: 'POST', body, keepalive: true }).catch(() => {});
    } catch { /* tracking must never break the page */ }
  }, []);
  return null;
}
