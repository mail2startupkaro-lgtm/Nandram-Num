import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Numerology Reading by Date of Birth & Name',
  description: 'Free online numerology reading: Moolank, Bhagyank, Lo Shu grid, name number and mobile number compatibility with remedies, in English, Hindi or Hinglish.',
  keywords: ['free numerology reading', 'numerology by date of birth', 'numerology by name', 'numerology report online', 'moolank bhagyank calculator'],
  alternates: { canonical: '/reading' },
  openGraph: { title: 'Free Numerology Reading by Date of Birth & Name | myNumerologist', description: 'Moolank, Bhagyank, Lo Shu grid, name and mobile number reading with remedies.', url: '/reading', type: 'website', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Free numerology reading by Acharya Nandram' }] },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
