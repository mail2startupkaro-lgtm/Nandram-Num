import type { MetadataRoute } from 'next';
import { CALCULATORS } from '@/lib/seo/calculators';
import { MULANK } from '@/lib/mulank-data';
import { CITIES, postSlug } from '@/lib/blog/cities';

const base = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${base()}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base()}/reading`, lastModified: now, priority: 0.9 },
    { url: `${base()}/pricing`, lastModified: now, priority: 0.8 },
    { url: `${base()}/calculators`, lastModified: now, priority: 0.8 },
    ...CALCULATORS.map((c) => ({ url: `${base()}/calculators/${c.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${base()}/mulank`, lastModified: now, priority: 0.8 },
    ...MULANK.map((m) => ({ url: `${base()}/mulank/${m.n}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${base()}/blog`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    ...CITIES.map((c) => ({ url: `${base()}/blog/${postSlug(c)}`, lastModified: now, changeFrequency: 'monthly' as const, priority: c.tier === 1 ? 0.8 : c.tier === 2 ? 0.6 : 0.5 })),
    ...['terms', 'privacy', 'refund'].map((p) => ({ url: `${base()}/${p}`, lastModified: now, priority: 0.2 })),
  ];
}
