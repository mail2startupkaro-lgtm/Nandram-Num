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
  ]} hi={{ title: 'रिफ़ंड और रद्दीकरण नीति', updated: LEGAL.updatedHi, sections: [
    { h: 'डिजिटल रिपोर्ट', p: ['रिपोर्ट व्यक्तिगत डिजिटल उत्पाद हैं। एक बार किसी रिपोर्ट क्रेडिट का उपयोग रिपोर्ट अनलॉक और डाउनलोड करने में हो जाए, तो उसका रिफ़ंड नहीं हो सकता।'] },
    { h: 'अप्रयुक्त क्रेडिट', p: [`अप्रयुक्त रिपोर्ट क्रेडिट का रिफ़ंड ख़रीद के 7 दिनों के भीतर हो सकता है। अपने इनवॉइस नंबर के साथ ${LEGAL.email ? `${LEGAL.email} पर लिखें` : 'अपने अकाउंट पेज से हमें लिखें'}।`] },
    { h: 'प्रो प्लान', p: ['प्रो प्लान अग्रिम भुगतान वाले हैं और अपने-आप नवीनीकृत नहीं होते। यदि ख़रीद के 48 घंटों में कोई पूरी रिपोर्ट नहीं बनाई गई है, तो आप उस अवधि में रिफ़ंड का अनुरोध कर सकते हैं।'] },
    { h: 'असफल या दोहरे भुगतान', p: ['यदि पैसा कट गया पर आपका ऑर्डर पूरा नहीं हुआ, या आपसे दो बार शुल्क लिया गया, तो राशि 5–7 कार्य-दिवसों के भीतर मूल भुगतान माध्यम में वापस कर दी जाती है।'] },
    { h: 'रिफ़ंड कैसे दिया जाता है', p: ['स्वीकृत रिफ़ंड हमारे पेमेंट गेटवे (कैशफ़्री पेमेंट्स) के माध्यम से मूल भुगतान माध्यम में भेजे जाते हैं। बैंक को क्रेडिट दिखाने में 5–7 कार्य-दिवस लग सकते हैं।'] },
  ] }} />;
}
