import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { LEGAL, legalContact, legalContactHi } from '@/lib/seo/site';

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
  ]} hi={{ title: 'सेवा की शर्तें', updated: LEGAL.updatedHi, sections: [
    { h: 'सेवा के बारे में', p: [`mynumerologist.com ("हम") का संचालन ${LEGAL.name}${LEGAL.address ? `, ${LEGAL.address}` : ''} द्वारा किया जाता है। हम पारंपरिक भारतीय, कैल्डियन, पाइथागोरियन और लो शू पद्धतियों से तैयार अंक ज्योतिष रीडिंग और रिपोर्ट प्रदान करते हैं।`] },
    { h: 'अंक ज्योतिष की प्रकृति', p: ['अंक ज्योतिष पारंपरिक विधियों पर आधारित मार्गदर्शन देता है। यह विज्ञान नहीं है और पेशेवर सलाह का विकल्प नहीं है। स्वास्थ्य, वित्त और कानूनी मामलों के निर्णय योग्य पेशेवरों के साथ लें। आपके द्वारा लिए गए निर्णयों की ज़िम्मेदारी आपकी है।', 'रत्न, मंत्र और अन्य उपाय पारंपरिक सुझाव हैं। कोई भी रत्न पहनने से पहले योग्य विशेषज्ञ से सलाह लें।'] },
    { h: 'अकाउंट', p: ['आप अपने ईमेल या मोबाइल नंबर और पासवर्ड से, या Google से साइन इन करते हैं। अपना पासवर्ड और ये अकाउंट सुरक्षित रखें। कोई प्लान ख़रीदने के लिए आपकी आयु 18 वर्ष या उससे अधिक होनी चाहिए।', 'कंसल्टेंट (प्रो प्लान) की ज़िम्मेदारी है कि वे अपने क्लाइंट का विवरण दर्ज करने से पहले उनकी सहमति लें, और वे अपनी दी गई सलाह के लिए स्वयं ज़िम्मेदार हैं।'] },
    { h: 'भुगतान', p: ['मूल्य भारतीय रुपये में हैं और इनमें GST शामिल है। भुगतान कैशफ़्री पेमेंट्स द्वारा संसाधित किए जाते हैं। हर सशुल्क ऑर्डर के लिए GST इनवॉइस जारी किया जाता है।', 'रिपोर्ट क्रेडिट की कोई समय-सीमा नहीं है, जब तक अलग से न बताया जाए। प्रो प्लान दर्शाई गई अवधि के लिए अग्रिम भुगतान वाले हैं और अपने-आप नवीनीकृत नहीं होते।'] },
    { h: 'स्वीकार्य उपयोग', p: ['सेवा का दुरुपयोग न करें, अन्य उपयोगकर्ताओं के डेटा तक पहुँचने का प्रयास न करें, दूसरों के लिए बनी रिपोर्ट उनकी सहमति के बिना न बेचें, और ऐसा व्यक्तिगत डेटा दर्ज न करें जिसके उपयोग का आपको अधिकार नहीं है।'] },
    { h: 'दायित्व', p: ['क़ानून द्वारा अनुमत सीमा तक, किसी भी दावे के लिए हमारा दायित्व दावे से पहले के तीन महीनों में आपके द्वारा हमें भुगतान की गई राशि तक सीमित है।'] },
    { h: 'लागू क़ानून', p: [`ये शर्तें भारत के क़ानूनों के अधीन हैं। ${LEGAL.city === 'India' ? 'भारत' : LEGAL.city} की अदालतों को विशेष क्षेत्राधिकार प्राप्त है।`] },
    { h: 'संपर्क', p: [legalContactHi()] },
  ] }} />;
}
