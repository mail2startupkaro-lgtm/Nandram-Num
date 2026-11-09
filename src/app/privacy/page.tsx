import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { LEGAL, legalContact } from '@/lib/seo/site';

export const metadata: Metadata = { title: 'Privacy Policy', description: 'How myNumerologist.com collects, uses and protects your personal data under the Digital Personal Data Protection Act, 2023.', alternates: { canonical: '/privacy' } };

export default function Privacy() {
  return <LegalPage title="Privacy Policy" updated={LEGAL.updated} sections={[
    { h: 'Who we are', p: [`${LEGAL.name} is the Data Fiduciary for personal data processed through mynumerologist.com, under the Digital Personal Data Protection Act, 2023 (DPDP Act).`] },
    { h: 'What we collect and why', p: ['Account data: email or mobile number, name – to sign you in and send invoices.', 'Reading data: names, date, time and place of birth, gender, marital status, profession, city, concerns, mobile number and partner details – only to calculate and write your numerology report.', 'Aadhaar number (optional): used only in memory to calculate its vibration, with your explicit consent. We never store, log, export or print the full number; only the last four digits are kept.', 'Payment data: handled by Cashfree Payments. We receive order and payment identifiers, not your card or UPI details.'] },
    { h: 'How we protect it', p: ['Personal data is encrypted at rest (AES-256-GCM) and in transit (HTTPS). Access is limited by role. Share links expire and can be password-protected and revoked.'] },
    { h: 'Sharing', p: ['We do not sell personal data. Service providers that process data for us: hosting and database (Vercel, Supabase), Cashfree Payments (payments), email/SMS delivery providers, and – when enabled – an AI service. For automatic report text the AI receives calculated numbers and first name only. When you ask our numerologist for a signature, business or detailed consultation, the details needed for that analysis (such as name, date of birth, profession and a signature image) may be processed by the AI service; they are not stored by us after the analysis.'] },
    { h: 'Retention and your rights', p: ['We keep reading data while your account is active or until you delete it. You can delete any client profile at any time from the dashboard; deletion is permanent and includes all reports and share links.', `You may request access, correction, erasure or grievance redressal by writing to our Grievance Officer, ${LEGAL.grievanceOfficer} (${legalContact()}). We respond within the time required by law. You may also approach the Data Protection Board of India.`] },
    { h: 'Children', p: ['Readings for a minor must be requested by a parent or guardian, who gives consent on the child\'s behalf.'] },
  ]} />;
}
