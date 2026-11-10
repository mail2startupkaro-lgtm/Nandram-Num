/** Contact-form choices (shared by the public form, the API and the admin inbox). Safe to import in the browser. */
export const CONTACT_TOPICS = ['service', 'support', 'other'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_SUBJECTS: Record<ContactTopic, { id: string; en: string; hi: string }[]> = {
  service: [
    { id: 'life_report', en: 'Complete life report (PDF)', hi: 'संपूर्ण जीवन रिपोर्ट (PDF)' },
    { id: 'consultation', en: 'Personal consultation with Acharya Nandram', hi: 'आचार्य नंदराम से व्यक्तिगत परामर्श' },
    { id: 'name_correction', en: 'Name correction / spelling', hi: 'नाम सुधार / वर्तनी' },
    { id: 'mobile_number', en: 'Lucky mobile number', hi: 'शुभ मोबाइल नंबर' },
    { id: 'marriage', en: 'Marriage / couple compatibility', hi: 'विवाह / जोड़ी मिलान' },
    { id: 'business', en: 'Business name & compatibility', hi: 'व्यवसाय का नाम और अनुकूलता' },
    { id: 'baby_name', en: 'Baby name', hi: 'शिशु का नाम' },
    { id: 'signature', en: 'Signature analysis', hi: 'हस्ताक्षर विश्लेषण' },
    { id: 'pro_plan', en: 'Pro plan for consultants', hi: 'परामर्शदाताओं के लिए प्रो प्लान' },
  ],
  support: [
    { id: 'payment', en: 'Payment / order issue', hi: 'भुगतान / ऑर्डर की समस्या' },
    { id: 'report_pdf', en: 'Report or PDF issue', hi: 'रिपोर्ट या PDF की समस्या' },
    { id: 'account', en: 'Login / account', hi: 'लॉगिन / खाता' },
    { id: 'refund', en: 'Refund / invoice', hi: 'रिफ़ंड / इनवॉइस' },
    { id: 'technical', en: 'Website / technical problem', hi: 'वेबसाइट / तकनीकी समस्या' },
  ],
  other: [
    { id: 'feedback', en: 'Feedback / suggestion', hi: 'प्रतिक्रिया / सुझाव' },
    { id: 'partnership', en: 'Partnership / media', hi: 'साझेदारी / मीडिया' },
    { id: 'general', en: 'General question', hi: 'सामान्य प्रश्न' },
  ],
};

export const CONTACT_STATUSES = ['new', 'in_progress', 'resolved'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const subjectLabel = (topic: string, id: string | null | undefined, lang: 'en' | 'hi' = 'en') =>
  CONTACT_SUBJECTS[topic as ContactTopic]?.find((s) => s.id === id)?.[lang] ?? id ?? '';
