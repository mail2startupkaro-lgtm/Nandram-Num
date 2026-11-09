import { ImageResponse } from 'next/og';
import { OG_SIZE, OgCard } from './og-card';

export const alt = 'Online numerology reading by Acharya Nandram – myNumerologist.com';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(<OgCard kicker="Vedic · Chaldean · Lo Shu" title="Online Numerology Reading" sub="Moolank, Bhagyank, Lo Shu grid, name, mobile number, angel numbers and compatibility – with remedies." />, size);
}
