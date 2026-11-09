import { ImageResponse } from 'next/og';
import { OG_SIZE, OgCard } from '../../og-card';

export const alt = 'Angel number meaning by Acharya Nandram';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image(props: { params: Promise<{ n: string }> }) {
  const params = await props.params;
  const n = /^\d{1,5}$/.test(params.n) ? params.n : '111';
  return new ImageResponse(<OgCard kicker="Angel number meaning" title={`${n} Angel Number`} sub="Meaning in love, twin flame, career, money and Hindi – with a free date-of-birth compatibility check." big={n} />, size);
}
