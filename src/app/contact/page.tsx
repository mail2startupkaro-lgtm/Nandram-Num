import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/contact-form';
import { Bi } from '@/components/i18n/bi';
import { LEGAL, jsonLd as toLd, abs } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'Contact Us – Numerology Enquiry & Support',
  description: 'Contact Acharya Nandram for a numerology report, consultation, name correction or lucky mobile number, or get help with payments, reports and your account.',
  alternates: { canonical: '/contact' },
};

/** WhatsApp number for the contact page (digits with country code), e.g. CONTACT_WHATSAPP=91XXXXXXXXXX. */
const whatsapp = () => (process.env.CONTACT_WHATSAPP || '').replace(/\D/g, '') || null;

export default function ContactPage() {
  const wa = whatsapp();
  const ld = { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact myNumerologist.com', url: abs('/contact'),
    mainEntity: { '@type': 'Organization', name: 'myNumerologist.com', url: abs('/'), contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', availableLanguage: ['English', 'Hindi'], ...(LEGAL.email ? { email: LEGAL.email } : {}), ...(LEGAL.phone ? { telephone: LEGAL.phone } : {}) }] } };
  return (
    <div className="container max-w-6xl space-y-10 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(ld) }} />
      <header className="mk-rise space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="Contact us · We reply within 24 hours" hi="संपर्क करें · 24 घंटे में उत्तर" /></p>
        <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text"><Bi en="How Can We Help You?" hi="हम आपकी कैसे सहायता करें?" /></span></h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground"><Bi en="Ask about a numerology report or a personal consultation with Acharya Nandram, or tell us about any problem with a payment, report or your account." hi="अंक ज्योतिष रिपोर्ट या आचार्य नंदराम से व्यक्तिगत परामर्श के बारे में पूछें, या भुगतान, रिपोर्ट अथवा खाते से जुड़ी किसी भी समस्या के बारे में बताएँ।" /></p>
      </header>
      <ContactForm whatsapp={wa} email={LEGAL.email || null} phone={LEGAL.phone || null} />
    </div>
  );
}
