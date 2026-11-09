import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { LEGAL, legalContact } from '@/lib/seo/site';

export const metadata: Metadata = { title: 'Terms of Service', description: 'Terms for using myNumerologist.com numerology readings, reports, accounts and payments.', alternates: { canonical: '/terms' } };

export default function Terms() {
  return <LegalPage title="Terms of Service" updated={LEGAL.updated} sections={[
    { h: 'About the service', p: [`mynumerologist.com ("we") is operated by ${LEGAL.name}${LEGAL.address ? `, ${LEGAL.address}` : ''}. We provide numerology readings and reports prepared using traditional Indian, Chaldean, Pythagorean and Lo Shu methods.`] },
    { h: 'Nature of numerology', p: ['Numerology offers guidance based on traditional methods. It is not a science and is not a substitute for professional advice. Decisions about health, finance and legal matters should be taken with qualified professionals. You are responsible for decisions you make.', 'Gemstone, mantra and other remedies are traditional suggestions. Consult a qualified expert before wearing any gemstone.'] },
    { h: 'Accounts', p: ['You sign in with your email or mobile number and a password, or with Google. Keep your password and these accounts secure. You must be 18 or older to buy a plan.', 'Consultants (Pro plan) are responsible for having their clients\' consent before entering client details, and for the advice they give.'] },
    { h: 'Payments', p: ['Prices are in Indian Rupees and include GST. Payments are processed by Cashfree Payments. A GST invoice is issued for every paid order.', 'Report credits do not expire unless stated. Pro plans are prepaid for the period shown and are not renewed automatically.'] },
    { h: 'Acceptable use', p: ['Do not misuse the service, attempt to access other users\' data, resell reports generated for others without their consent, or enter personal data you are not entitled to use.'] },
    { h: 'Liability', p: ['To the extent permitted by law, our liability for any claim is limited to the amount you paid us in the three months before the claim.'] },
    { h: 'Governing law', p: [`These terms are governed by the laws of India. Courts at ${LEGAL.city} have exclusive jurisdiction.`] },
    { h: 'Contact', p: [legalContact()] },
  ]} />;
}
