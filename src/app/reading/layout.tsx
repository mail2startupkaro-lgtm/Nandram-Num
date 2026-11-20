import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get Your Numerology Reading – Free & Expert Reports',
  description: 'Choose your numerology reading: a free instant reading (Moolank, Bhagyank, Lo Shu grid, name and mobile number) or an expert report by Acharya Nandram – personal, name correction, mobile number, couple, baby name, business and signature analysis.',
  keywords: ['free numerology reading', 'numerology by date of birth', 'numerology by name', 'numerology report online', 'moolank bhagyank calculator'],
  alternates: { canonical: '/reading' },
  openGraph: { title: 'Free Numerology Reading by Date of Birth & Name | myNumerologist', description: 'Moolank, Bhagyank, Lo Shu grid, name and mobile number reading with remedies.', url: '/reading', type: 'website', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Free numerology reading by Acharya Nandram' }] },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
