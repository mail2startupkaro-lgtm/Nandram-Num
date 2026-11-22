import { ImageResponse } from 'next/og';
import { publishedCelebPost } from '@/lib/celebrity/public';
import { OG_SIZE, OgCard } from '../../../og-card';

export const alt = 'Celebrity numerology by Acharya Nandram';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const row = await publishedCelebPost(slug);
  const n = row?.post.numbers;
  return new ImageResponse(
    <OgCard kicker="Celebrity numerology" title={row ? `${row.name} Numerology` : 'Celebrity Numerology'}
      sub={n ? `Mulank ${n.moolank.value} · Bhagyank ${n.bhagyank.value} · Name number ${n.chaldean.compound}/${n.chaldean.single}` : 'Mulank, Bhagyank, name number and Lo Shu grid of famous people.'}
      big={n ? String(n.moolank.value) : undefined} />, size);
}
