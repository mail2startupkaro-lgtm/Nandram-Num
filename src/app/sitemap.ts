import type { MetadataRoute } from 'next';
import { CALCULATORS } from '@/lib/seo/calculators';
import { MULANK } from '@/lib/mulank-data';
import { NUMBER_POSTS } from '@/lib/blog/numbers';
import { SERVICE_PAGES } from '@/lib/service-pages';
import { CITIES, postSlug } from '@/lib/blog/cities';
import { TOP_ANGEL } from '@/lib/angel/generate';
import { TOPIC_POSTS } from '@/lib/blog/topics';
import { publishedCelebPosts } from '@/lib/celebrity/public';

import { SITE_URL } from '@/lib/seo/site';

const base = () => SITE_URL;
/** Date the static guides were last revised – keeps lastmod stable between deploys. */
const CONTENT_DATE = new Date('2026-11-09');

// Built per request (the post list itself is cached and cleared on publish), so new celebrity posts appear at once.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const celebs = await publishedCelebPosts();
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
    { url: `${base()}/contact`, lastModified: now, priority: 0.5 },
    { url: `${base()}/services`, lastModified: now, priority: 0.9 },
    { url: `${base()}/about`, lastModified: now, priority: 0.7 },
    { url: `${base()}/international-numerology`, lastModified: now, priority: 0.7 },
    { url: `${base()}/white-label-numerology-reports`, lastModified: now, priority: 0.7 },
    { url: `${base()}/affiliate-program`, lastModified: now, priority: 0.6 },
    ...SERVICE_PAGES.map((x) => ({ url: `${base()}/${x.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...TOPIC_POSTS.map((p) => ({ url: `${base()}/blog/${p.slug}`, lastModified: new Date('2026-11-20'), changeFrequency: 'monthly' as const, priority: p.cat === 'guide' ? 0.8 : 0.7 })),
    ...NUMBER_POSTS.map((p) => ({ url: `${base()}/blog/${p.slug}`, lastModified: c, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...MULANK.map((m) => ({ url: `${base()}/bhagyank/${m.n}`, lastModified: c, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${base()}/angel-numbers`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base()}/angel-numbers/calculator`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    ...TOP_ANGEL.map((n, i) => ({ url: `${base()}/angel-numbers/${n}`, lastModified: c, changeFrequency: 'monthly' as const, priority: i < 50 ? 0.8 : i < 300 ? 0.6 : 0.4 })),
    { url: `${base()}/blog`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${base()}/blog/celebrity`, lastModified: celebs[0] ? new Date(celebs[0].publishedAt ?? celebs[0].updatedAt) : now, changeFrequency: 'weekly' as const, priority: 0.7 },
    ...celebs.map((p) => ({ url: `${base()}/blog/celebrity/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...CITIES.map((x) => ({ url: `${base()}/blog/${postSlug(x)}`, lastModified: c, changeFrequency: 'monthly' as const, priority: x.tier === 1 ? 0.8 : x.tier === 2 ? 0.6 : 0.5 })),
    ...['terms', 'privacy', 'refund', 'disclaimer'].map((p) => ({ url: `${base()}/${p}`, lastModified: now, priority: 0.2 })),
  ];
}
