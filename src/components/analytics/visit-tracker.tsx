'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackVisit } from '@/lib/client/visit-tracker';

/** Feeds Admin → Visitor analytics on every page / route change. */
export function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  React.useEffect(() => {
    const q = searchParams?.toString();
    void trackVisit(pathname + (q ? `?${q}` : ''));
  }, [pathname, searchParams]);
  return null;
}
