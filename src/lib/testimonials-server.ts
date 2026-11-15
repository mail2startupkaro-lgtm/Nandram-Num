/** Server-side read of the testimonials (cached; Admin → Testimonials clears the cache on save). */
import { unstable_cache } from 'next/cache';
import { getSetting } from '@/lib/admin/settings';
import { DEFAULT_TESTIMONIALS, type Testimonial } from '@/lib/testimonials';

export const TESTIMONIALS_TAG = 'testimonials';

const load = unstable_cache(async (): Promise<Testimonial[]> => {
  const s = await getSetting('testimonials');
  return s.enabled ? s.items.filter((t) => t.active && t.consent) : [];
}, ['testimonials-v1'], { tags: [TESTIMONIALS_TAG], revalidate: 3600 });

/** Published testimonials; falls back to the built-in list when there is no database (build / preview). */
export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  try { return await load(); } catch { return DEFAULT_TESTIMONIALS.items; }
}
