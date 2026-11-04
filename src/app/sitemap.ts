import type { MetadataRoute } from 'next';
import { CALCULATORS } from '@/lib/seo/calculators';

const base = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${base()}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base()}/reading`, lastModified: now, priority: 0.9 },
    { url: `${base()}/pricing`, lastModified: now, priority: 0.8 },
    { url: `${base()}/calculators`, lastModified: now, priority: 0.8 },
    ...CALCULATORS.map((c) => ({ url: `${base()}/calculators/${c.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...['terms', 'privacy', 'refund'].map((p) => ({ url: `${base()}/${p}`, lastModified: now, priority: 0.2 })),
  ];
}
