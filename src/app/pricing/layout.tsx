import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Numerology Report Price & Plans – Complete Life Report',
  description: 'Compare numerology report plans by Acharya Nandram: date of birth, name, mobile number, couple compatibility and complete life report PDF in English, Hindi or Hinglish. Secure payment by Cashfree.',
  keywords: ['numerology report price', 'numerology consultation fees', 'numerology report online India', 'complete life numerology report'],
  alternates: { canonical: '/pricing' },
  openGraph: { title: 'Numerology Report Price & Plans | myNumerologist', description: 'Choose a numerology report: DOB, name, mobile, couple compatibility or the complete life report with remedies.', url: '/pricing', type: 'website' },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
