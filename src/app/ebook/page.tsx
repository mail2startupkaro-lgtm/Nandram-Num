import type { Metadata } from 'next';
import { EbookLandingContent } from '@/components/home/ebook-landing-content';
import { abs, pageTitle } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: pageTitle('Free Numerology eBook (PDF) - Numerology Made Easy | Acharya Nandram'),
  description:
    'Download free 21-page Numerology eBook PDF by Acharya Nandram. Learn how to understand your Moolank, Bhagyank, Lo Shu Grid, Kua number, name and mobile numbers in simple Hindi and English.',
  keywords: [
    'free numerology ebook',
    'numerology pdf download',
    'learn numerology',
    'numerology made easy',
    'ank jyotish ebook',
    'moolank bhagyank guide',
    'lo shu grid pdf',
    'Acharya Nandram ebook',
  ],
  alternates: { canonical: abs('/ebook') },
  openGraph: {
    title: 'Free Numerology Guide eBook (PDF) · Numerology Made Easy',
    description:
      'Download free 21-page beginner guide by Acharya Nandram. Understand your personal numerology report in simple Hindi and English.',
    url: abs('/ebook'),
  },
};

export default function EbookPage() {
  return <EbookLandingContent />;
}
