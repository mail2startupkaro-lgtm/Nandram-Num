import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL;
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard', '/admin', '/account', '/settings', '/s/', '/login', '/888'] }], sitemap: `${base}/sitemap.xml` };
}
