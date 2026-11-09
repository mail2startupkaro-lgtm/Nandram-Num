import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { LEGAL } from '@/lib/seo/site';

export const metadata: Metadata = { title: 'Refund & Cancellation Policy', description: 'Refund and cancellation policy for myNumerologist.com numerology reports, credits and Pro plans.', alternates: { canonical: '/refund' } };

export default function Refund() {
  return <LegalPage title="Refund & Cancellation Policy" updated={LEGAL.updated} sections={[
    { h: 'Digital reports', p: ['Reports are personalised digital products. Once a report credit has been used to unlock and download a report, it cannot be refunded.'] },
    { h: 'Unused credits', p: [`Unused report credits can be refunded within 7 days of purchase. Write to ${LEGAL.email || 'us from your account page'} with your invoice number.`] },
    { h: 'Pro plans', p: ['Pro plans are prepaid and not renewed automatically. You may request a refund within 48 hours of purchase if no full report has been generated during that time.'] },
    { h: 'Failed or duplicate payments', p: ['If money was debited but your order was not completed, or you were charged twice, the amount is refunded to the original payment method within 5–7 working days.'] },
    { h: 'How refunds are paid', p: ['Approved refunds are processed through our payment gateway (Cashfree Payments) to the original payment method. Banks may take 5–7 working days to show the credit.'] },
  ]} />;
}
