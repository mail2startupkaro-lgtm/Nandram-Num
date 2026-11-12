import { getSetting } from '@/lib/admin/settings';
import { json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const analytics = await getSetting('analytics');
  return json({
    measurementId: analytics.measurementId || process.env.NEXT_PUBLIC_GA_ID || '',
    gtmId: analytics.gtmId || process.env.NEXT_PUBLIC_GTM_ID || 'GTM-NPNKXF4B',
    enabled: analytics.enabled,
    trackPageViews: analytics.trackPageViews,
    trackReadings: analytics.trackReadings,
    trackCheckouts: analytics.trackCheckouts,
    trackPdfDownloads: analytics.trackPdfDownloads,
    trackServices: analytics.trackServices,
  });
}
