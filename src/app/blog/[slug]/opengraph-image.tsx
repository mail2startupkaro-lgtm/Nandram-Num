import { ImageResponse } from 'next/og';
import { cityFromPostSlug } from '@/lib/blog/cities';
import { TOPIC_CATS, buildTopic } from '@/lib/blog/topics';
import { OG_SIZE, OgCard } from '../../og-card';

export const alt = 'Best numerologist city guide by Acharya Nandram';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const t = buildTopic(params.slug, 'en');
  if (t) {
    const a = t.art;
    const big = a.t === 'pair' ? `${a.a}+${a.b}` : 'n' in a ? String(a.n) : undefined;
    const cat = TOPIC_CATS.find((c) => c.id === t.cat)!;
    return new ImageResponse(<OgCard kicker={cat.en.replace(/ \(.*\)$/, '')} title={t.h1.split(':')[0]} sub={cat.enSub} big={big && big.length <= 3 ? big : undefined} />, size);
  }
  const c = cityFromPostSlug(params.slug);
  return new ImageResponse(<OgCard kicker={c ? `${c.name}, ${c.state}` : 'City guide'} title={`Best Numerologist in ${c?.name ?? 'India'}`} sub="Online Vedic, Chaldean and Lo Shu numerology reports, consultations and free calculators." />, size);
}
