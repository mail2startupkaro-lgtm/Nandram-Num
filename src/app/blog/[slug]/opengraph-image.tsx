import { ImageResponse } from 'next/og';
import { cityFromPostSlug } from '@/lib/blog/cities';
import { OG_SIZE, OgCard } from '../../og-card';

export const alt = 'Best numerologist city guide by Acharya Nandram';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const c = cityFromPostSlug(params.slug);
  return new ImageResponse(<OgCard kicker={c ? `${c.name}, ${c.state}` : 'City guide'} title={`Best Numerologist in ${c?.name ?? 'India'}`} sub="Online Vedic, Chaldean and Lo Shu numerology reports, consultations and free calculators." />, size);
}
