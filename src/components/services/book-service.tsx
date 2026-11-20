'use client';
import * as React from 'react';
import Link from 'next/link';
import { MessageCircle, Sparkles } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { buttonVariants } from '@/components/ui/button';
import { confirmCashfreeOrder } from '@/lib/client/cashfree';
import type { ServiceIntakeField, ServiceText } from '@/lib/db/schema';

export interface PublicService { code: string; en: ServiceText; hi: ServiceText; intake: ServiceIntakeField[]; payable: boolean; pricePaise: number | null; mrpPaise: number | null; usdCents?: number | null; usdMrpCents?: number | null }

export const inr = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

const T = {
  en: { book: 'Book & pay', enquire: 'Enquire', title: 'Book', details: 'Details for the analysis', billing: 'Billing & contact', total: 'Total (incl. GST)',
    f: { businessName: 'Business / brand names (current or proposed, up to 5 – one per line)', launchDate: 'Business opening date – done or planned (optional)', partners: 'Business partners – name and date of birth, one per line (optional)', brand: 'Brand colours, logo idea or tagline (optional)', mobileBiz: 'Business mobile number (optional)', bizType: 'Type of business (optional)', clientName: 'Full name (spelling you use)', dob: 'Date of birth', dobBaby: "Baby's date of birth", gender: 'Gender', tob: 'Time of birth (optional)', pob: 'Place of birth (optional)', mobile: 'Mobile number to analyse (optional)', mobileMain: 'Current mobile number', currentName: 'Your name as you write it now', parents: "Father's and mother's names (optional)", letters: 'Preferred starting letters (optional)', partnerName: "Partner's full name", partnerDob: "Partner's date of birth", business: 'Business / brand names you are considering', businesses: 'Businesses or work you are considering (optional)', questions: 'Your questions or notes (optional)', bizQuestions: 'Capital you can invest, current work and your questions (optional)', signedAs: 'Name exactly as you sign it (e.g. R. Sharma)', sigQuestions: 'Profession, goals and questions (optional)' },
    male: 'Male', female: 'Female', other: 'Other', billName: 'Name on invoice', email: 'Email (for delivery & invoice)', phone: 'Mobile number (for payment & updates)', state: 'State (for GST)', select: 'Select…', gstin: 'GSTIN (optional)',
    pay: (a: string) => `Pay ${a} securely`, paying: 'Opening payment…', confirming: 'Confirming your payment with the bank…', ok: 'Payment received – thank you!', okText: 'Acharya Nandram will start your analysis. You will receive it on your email and WhatsApp within the delivery time. You can see the status under My account.', account: 'My account', failed: 'The payment did not complete. You have not been charged; please try again.', mock: 'Test mode – no real payment is taken.', simulate: 'Simulate successful payment', priceSoon: 'Price on request', loginHint: 'Already have an account?', signIn: 'Sign in', privacy: 'Your details are encrypted and used only for this analysis.' },
  hi: { book: 'बुक करें और भुगतान करें', enquire: 'पूछताछ करें', title: 'बुक करें', details: 'विश्लेषण के लिए विवरण', billing: 'बिलिंग और संपर्क', total: 'कुल (GST सहित)',
    f: { businessName: 'व्यवसाय / ब्रांड के नाम (वर्तमान या प्रस्तावित, अधिकतम 5 – हर पंक्ति में एक)', launchDate: 'व्यवसाय शुरू होने की तिथि – हो चुकी या योजना (वैकल्पिक)', partners: 'व्यवसाय साझेदार – नाम और जन्म तिथि, हर पंक्ति में एक (वैकल्पिक)', brand: 'ब्रांड रंग, लोगो विचार या टैगलाइन (वैकल्पिक)', mobileBiz: 'व्यवसायिक मोबाइल नंबर (वैकल्पिक)', bizType: 'व्यवसाय का प्रकार (वैकल्पिक)', clientName: 'पूरा नाम (जिस वर्तनी में आप लिखते हैं)', dob: 'जन्म तिथि', dobBaby: 'शिशु की जन्म तिथि', gender: 'लिंग', tob: 'जन्म समय (वैकल्पिक)', pob: 'जन्म स्थान (वैकल्पिक)', mobile: 'विश्लेषण हेतु मोबाइल नंबर (वैकल्पिक)', mobileMain: 'वर्तमान मोबाइल नंबर', currentName: 'आपका नाम, जैसे आप अभी लिखते हैं', parents: 'पिता और माता के नाम (वैकल्पिक)', letters: 'पसंदीदा आरंभिक अक्षर (वैकल्पिक)', partnerName: 'जीवनसाथी का पूरा नाम', partnerDob: 'जीवनसाथी की जन्म तिथि', business: 'व्यवसाय / ब्रांड के नाम जिन पर आप विचार कर रहे हैं', businesses: 'जिन व्यवसायों या कामों पर आप विचार कर रहे हैं (वैकल्पिक)', questions: 'आपके प्रश्न या टिप्पणी (वैकल्पिक)', bizQuestions: 'निवेश योग्य पूँजी, वर्तमान काम और आपके प्रश्न (वैकल्पिक)', signedAs: 'हस्ताक्षर में जैसे नाम लिखते हैं (जैसे R. Sharma)', sigQuestions: 'पेशा, लक्ष्य और प्रश्न (वैकल्पिक)' },
    male: 'पुरुष', female: 'महिला', other: 'अन्य', billName: 'इनवॉइस पर नाम', email: 'ईमेल (डिलीवरी और इनवॉइस के लिए)', phone: 'मोबाइल नंबर (भुगतान और अपडेट के लिए)', state: 'राज्य (GST हेतु)', select: 'चुनें…', gstin: 'GSTIN (वैकल्पिक)',
    pay: (a: string) => `${a} सुरक्षित भुगतान करें`, paying: 'भुगतान खुल रहा है…', confirming: 'बैंक से आपके भुगतान की पुष्टि हो रही है…', ok: 'भुगतान प्राप्त हुआ – धन्यवाद!', okText: 'आचार्य नंदराम आपका विश्लेषण शुरू करेंगे। डिलीवरी समय के भीतर यह आपको ईमेल और WhatsApp पर मिलेगा। स्थिति "मेरा खाता" में देख सकते हैं।', account: 'मेरा खाता', failed: 'भुगतान पूरा नहीं हुआ। आपसे कोई राशि नहीं ली गई; कृपया फिर प्रयास करें।', mock: 'टेस्ट मोड – कोई वास्तविक भुगतान नहीं।', simulate: 'सफल भुगतान का अनुकरण करें', priceSoon: 'मूल्य पूछताछ पर', loginHint: 'पहले से खाता है?', signIn: 'साइन इन करें', privacy: 'आपकी जानकारी एन्क्रिप्टेड रहती है और केवल इसी विश्लेषण के लिए उपयोग होती है।' },
};

/**
 * "Book & pay" button (or "Enquire" while the owner has not confirmed a price). Opens the "Get your reading" flow
 * for this service: details → register / sign in → payment, so the client's details are saved on their account.
 */
export function BookService({ svc, className }: { svc: PublicService; className?: string; whatsapp?: string }) {
  const { lang } = useApp();
  const t = T[lang];
  if (!svc.payable) return <Link href={`/contact?topic=service`} className={buttonVariants({ variant: 'outline', className })}><MessageCircle className="h-4 w-4" />{t.enquire}</Link>;
  return <Link href={`/reading?type=${encodeURIComponent(svc.code)}`} className={buttonVariants({ variant: 'gold', className })}><Sparkles className="h-4 w-4" />{t.book}</Link>;
}

/** Shown on /services after a bank redirect (?cf_order=…). */
export function ServiceReturnBanner() {
  const { lang, me } = useApp();
  const [st, setSt] = React.useState<'checking' | 'paid' | 'pending' | 'failed' | null>(null);
  React.useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('cf_order');
    if (!id || !id.startsWith('cf_') || !me?.user) return;
    setSt('checking');
    confirmCashfreeOrder(id).then(setSt).catch(() => setSt('pending')).finally(() => window.history.replaceState(null, '', '/services'));
  }, [me?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!st) return null;
  const t = T[lang];
  return <p role="status" className={`mx-auto max-w-xl rounded-md p-3 text-center text-sm ${st === 'paid' ? 'bg-success/15 text-success' : st === 'failed' ? 'bg-danger/10 text-danger' : 'bg-muted'}`}>{st === 'paid' ? `${t.ok} ${t.okText}` : st === 'failed' ? t.failed : t.confirming}</p>;
}
