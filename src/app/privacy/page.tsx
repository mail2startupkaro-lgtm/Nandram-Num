import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = { title: 'Privacy Policy', alternates: { canonical: '/privacy' } };

export default function Privacy() {
  return <LegalPage title="Privacy Policy" updated="[date]" sections={[
    { h: 'Who we are', p: ['[Legal business name] is the Data Fiduciary for personal data processed through mynumerologist.com, under the Digital Personal Data Protection Act, 2023 (DPDP Act).'] },
    { h: 'What we collect and why', p: ['Account data: email or mobile number, name – to sign you in and send invoices.', 'Reading data: names, date, time and place of birth, gender, marital status, profession, city, concerns, mobile number and partner details – only to calculate and write your numerology report.', 'Aadhaar number (optional): used only in memory to calculate its vibration, with your explicit consent. We never store, log, export or print the full number; only the last four digits are kept.', 'Payment data: handled by Razorpay. We receive order and payment identifiers, not your card or UPI details.'] },
    { h: 'How we protect it', p: ['Personal data is encrypted at rest (AES-256-GCM) and in transit (HTTPS). Access is limited by role. Share links expire and can be password-protected and revoked.'] },
    { h: 'Sharing', p: ['We do not sell personal data. Service providers that process data for us: hosting and database ([hosting provider], [database provider]), Cashfree Payments (payments), email/SMS delivery providers, and – when enabled – an AI writing service that receives calculated numbers and first name only to draft report text.'] },
    { h: 'Retention and your rights', p: ['We keep reading data while your account is active or until you delete it. You can delete any client profile at any time from the dashboard; deletion is permanent and includes all reports and share links.', 'You may request access, correction, erasure or grievance redressal by writing to our Grievance Officer: [name], [email]. We respond within the time required by law. You may also approach the Data Protection Board of India.'] },
    { h: 'Children', p: ['Readings for a minor must be requested by a parent or guardian, who gives consent on the child\'s behalf.'] },
  ]} />;
}
