import type { Metadata } from 'next';
import { HomeClient } from '@/components/home/home-client';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, EXPERT, SITE_NAME, SITE_URL, jsonLd } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: { absolute: DEFAULT_TITLE },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_IN', url: SITE_URL, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
};

const FAQ = [
  ['What is the difference between Moolank and Bhagyank?', 'Moolank (driver number) comes from your day of birth and describes your nature. Bhagyank (conductor or destiny number) comes from your full date of birth and describes the direction of your life.'],
  ['Is my Aadhaar number safe?', 'The Aadhaar reading is optional and needs your consent. It is calculated in memory and never saved; only the last four digits are kept.'],
  ['Can I get the report in Hindi?', 'Yes. Reports are available in English, Hindi and Hinglish.'],
  ['Should I change my name based on numerology?', 'Name suggestions are guidance only. Any legal name change is your personal decision.'],
];

export default function Home() {
  const ld = [
    { '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': `${SITE_URL}/#service`, name: `${SITE_NAME} – Numerology by ${EXPERT.name}`, url: SITE_URL, description: DEFAULT_DESCRIPTION,
      areaServed: { '@type': 'Country', name: 'India' }, availableLanguage: ['English', 'Hindi'], founder: { '@id': `${SITE_URL}/#expert` }, priceRange: '₹₹',
      serviceType: ['Numerology reading', 'Name numerology', 'Mobile number numerology', 'Marriage compatibility', 'Signature analysis'] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <HomeClient />
    </>
  );
}
