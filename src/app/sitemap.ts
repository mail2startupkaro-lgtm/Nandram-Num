import type { MetadataRoute } from 'next';
import { CALCULATORS } from '@/lib/seo/calculators';
import { MULANK } from '@/lib/mulank-data';
import { NUMBER_POSTS } from '@/lib/blog/numbers';
import { CITIES, postSlug } from '@/lib/blog/cities';
import { TOP_ANGEL } from '@/lib/angel/generate';

import { SITE_URL } from '@/lib/seo/site';

const base = () => SITE_URL;
/** Date the static guides were last revised – keeps lastmod stable between deploys. */
const CONTENT_DATE = new Date('2026-11-09');

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const c = CONTENT_DATE;
  return [
    { url: `${base()}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base()}/reading`, lastModified: now, priority: 0.9 },
    { url: `${base()}/pricing`, lastModified: now, priority: 0.8 },
    { url: `${base()}/calculators`, lastModified: now, priority: 0.8 },
    ...CALCULATORS.map((x) => ({ url: `${base()}/calculators/${x.slug}`, lastModified: c, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${base()}/mulank`, lastModified: now, priority: 0.8 },
    ...MULANK.map((m) => ({ url: `${base()}/mulank/${m.n}`, lastModified: c, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${base()}/bhagyank`, lastModified: now, priority: 0.8 },
    ...NUMBER_POSTS.map((p) => ({ url: `${base()}/blog/${p.slug}`, lastModified: c, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...MULANK.map((m) => ({ url: `${base()}/bhagyank/${m.n}`, lastModified: c, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${base()}/angel-numbers`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base()}/angel-numbers/calculator`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    ...TOP_ANGEL.map((n, i) => ({ url: `${base()}/angel-numbers/${n}`, lastModified: c, changeFrequency: 'monthly' as const, priority: i < 50 ? 0.8 : i < 300 ? 0.6 : 0.4 })),
    { url: `${base()}/blog`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    ...CITIES.map((x) => ({ url: `${base()}/blog/${postSlug(x)}`, lastModified: c, changeFrequency: 'monthly' as const, priority: x.tier === 1 ? 0.8 : x.tier === 2 ? 0.6 : 0.5 })),
    ...['terms', 'privacy', 'refund'].map((p) => ({ url: `${base()}/${p}`, lastModified: now, priority: 0.2 })),
  ];
}
