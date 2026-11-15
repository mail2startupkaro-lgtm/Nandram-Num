/** Server wrapper: loads the published testimonials and renders the slider (above the footer on every page). */
import { TestimonialsSlider } from '@/components/home/testimonials-slider';
import { getPublishedTestimonials } from '@/lib/testimonials-server';

export async function TestimonialsSection() {
  const items = await getPublishedTestimonials();
  return items.length ? <TestimonialsSlider items={items} /> : null;
}
