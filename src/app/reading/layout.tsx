import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Numerology Reading by Date of Birth & Name',
  description: 'Get your free numerology reading online: Moolank, Bhagyank, Lo Shu grid, name number and mobile number compatibility, with remedies. Reports in English, Hindi and Hinglish.',
  keywords: ['free numerology reading', 'numerology by date of birth', 'numerology by name', 'numerology report online', 'moolank bhagyank calculator'],
  alternates: { canonical: '/reading' },
  openGraph: { title: 'Free Numerology Reading by Date of Birth & Name | myNumerologist', description: 'Moolank, Bhagyank, Lo Shu grid, name and mobile number reading with remedies.', url: '/reading', type: 'website' },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
