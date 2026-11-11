import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Numerology Report Price & Plans',
  description: 'Numerology report plans by Acharya Nandram: complete life report PDF, name, mobile and couple compatibility in English or Hindi. Secure Cashfree payment.',
  keywords: ['numerology report price', 'numerology consultation fees', 'numerology report online India', 'complete life numerology report'],
  alternates: { canonical: '/pricing' },
  openGraph: { title: 'Numerology Report Price & Plans | myNumerologist', description: 'Choose a numerology report: DOB, name, mobile, couple compatibility or the complete life report with remedies.', url: '/pricing', type: 'website', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Numerology report plans' }] },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
