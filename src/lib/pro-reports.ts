/**
 * Trade prices for numerology professionals (white-label and customized reports).
 * Edit the numbers here to change the prices on /white-label-numerology-reports.
 * INR prices exclude 18% GST (a GST invoice is issued); USD prices are for consultants outside India.
 */
type L = { en: string; hi: string };
export interface ProReport { code: string; name: L; pages: L; wl: { inr: number; usd: number }; custom: { inr: number; usd: number } }

export const PRO_REPORTS: ProReport[] = [
  { code: 'SVC_PERSONAL_REPORT', name: { en: 'Personal Numerology Report', hi: 'व्यक्तिगत अंक ज्योतिष रिपोर्ट' }, pages: { en: 'Moolank, Bhagyank, Lo Shu, name, personal year, remedies', hi: 'मूलांक, भाग्यांक, लो शू, नाम, व्यक्तिगत वर्ष, उपाय' }, wl: { inr: 999, usd: 15 }, custom: { inr: 1499, usd: 22 } },
  { code: 'SVC_NAME_CORRECTION', name: { en: 'Name Correction', hi: 'नाम सुधार' }, pages: { en: 'Chaldean name check + 3 corrected spellings', hi: 'कैल्डियन नाम जाँच + 3 सुधरी वर्तनी' }, wl: { inr: 549, usd: 8 }, custom: { inr: 799, usd: 12 } },
  { code: 'SVC_LOSHU', name: { en: 'Lo Shu Grid Analysis', hi: 'लो शू ग्रिड विश्लेषण' }, pages: { en: 'Grid, planes, missing & repeated numbers, remedies', hi: 'ग्रिड, प्लेन, लुप्त व दोहराए अंक, उपाय' }, wl: { inr: 549, usd: 8 }, custom: { inr: 799, usd: 12 } },
  { code: 'SVC_MOBILE_NUMBER', name: { en: 'Mobile Number Numerology', hi: 'मोबाइल नंबर अंक ज्योतिष' }, pages: { en: 'Total, digit pairs, match with DOB, lucky options', hi: 'योग, अंक-जोड़ियाँ, जन्म तिथि से मिलान, शुभ विकल्प' }, wl: { inr: 249, usd: 4 }, custom: { inr: 399, usd: 6 } },
  { code: 'SVC_BABY_NAME', name: { en: 'Baby Name Numerology', hi: 'शिशु नाम अंक ज्योतिष' }, pages: { en: 'Lucky letters + checked name suggestions', hi: 'शुभ अक्षर + जाँचे हुए नाम सुझाव' }, wl: { inr: 549, usd: 8 }, custom: { inr: 849, usd: 12 } },
  { code: 'SVC_COUPLE', name: { en: 'Couple Compatibility', hi: 'दंपति अनुकूलता' }, pages: { en: 'Both charts, match score, strengths, remedies', hi: 'दोनों चार्ट, मिलान स्कोर, ताक़त, उपाय' }, wl: { inr: 999, usd: 15 }, custom: { inr: 1499, usd: 22 } },
  { code: 'SVC_BUSINESS_NAME', name: { en: 'Business Name Numerology', hi: 'व्यवसाय नाम अंक ज्योतिष' }, pages: { en: 'Name number vs owner, corrected options', hi: 'नाम अंक बनाम मालिक, सुधरे विकल्प' }, wl: { inr: 999, usd: 15 }, custom: { inr: 1499, usd: 22 } },
  { code: 'SVC_BUSINESS_COMPAT', name: { en: 'Business Compatibility', hi: 'व्यवसाय अनुकूलता' }, pages: { en: 'Best sectors ranked, verdict on chosen business', hi: 'सर्वश्रेष्ठ क्षेत्र क्रम में, चुने व्यवसाय पर निर्णय' }, wl: { inr: 999, usd: 15 }, custom: { inr: 1499, usd: 22 } },
  { code: 'SVC_BUSINESS_COMPLETE', name: { en: 'Complete Business Report', hi: 'संपूर्ण व्यवसाय रिपोर्ट' }, pages: { en: 'Name, brand & logo, partners, growth cycle, CEO report', hi: 'नाम, ब्रांड व लोगो, साझेदार, विकास चक्र, CEO रिपोर्ट' }, wl: { inr: 2499, usd: 35 }, custom: { inr: 3499, usd: 49 } },
  { code: 'SVC_PERSONAL_YEAR', name: { en: 'Personal Year Forecast', hi: 'व्यक्तिगत वर्ष पूर्वानुमान' }, pages: { en: 'Personal year, months and key dates', hi: 'व्यक्तिगत वर्ष, माह और मुख्य तिथियाँ' }, wl: { inr: 699, usd: 10 }, custom: { inr: 1099, usd: 15 } },
  { code: 'SVC_DESTINY_MATRIX', name: { en: 'Destiny Matrix Analysis', hi: 'डेस्टिनी मैट्रिक्स विश्लेषण' }, pages: { en: '22-arcana chart, money & love, karmic tail, purposes, timeline', hi: '22-आर्काना चार्ट, धन व प्रेम, कर्म-पूँछ, उद्देश्य, समयरेखा' }, wl: { inr: 999, usd: 15 }, custom: { inr: 1499, usd: 22 } },
  { code: 'SVC_BIRTH_CHART', name: { en: 'Pythagorean Birth Chart', hi: 'पाइथागोरस जन्म चार्ट' }, pages: { en: 'Pythagoras Square, 9 qualities, 8 life lines', hi: 'पाइथागोरस वर्ग, 9 गुण, 8 जीवन रेखाएँ' }, wl: { inr: 249, usd: 4 }, custom: { inr: 399, usd: 6 } },
  { code: 'SVC_SIGNATURE', name: { en: 'Signature Analysis', hi: 'हस्ताक्षर विश्लेषण' }, pages: { en: '12 features, ideal signature, practice chart', hi: '12 विशेषताएँ, आदर्श हस्ताक्षर, अभ्यास चार्ट' }, wl: { inr: 299, usd: 5 }, custom: { inr: 449, usd: 7 } },
];

/** Volume packs: a discount on the per-report prices above, valid for 12 months, any mix of report types. */
export const PRO_PACKS = [
  { id: 'starter', reports: 10, off: 10, name: { en: 'Starter', hi: 'स्टार्टर' }, extras: [{ en: 'Any mix of report types', hi: 'कोई भी रिपोर्ट प्रकार' }, { en: 'Valid for 12 months', hi: '12 महीने वैध' }] },
  { id: 'growth', reports: 25, off: 15, name: { en: 'Growth', hi: 'ग्रोथ' }, popular: true, extras: [{ en: 'Free branding setup', hi: 'ब्रांडिंग सेटअप मुफ़्त' }, { en: 'Any mix · 12 months', hi: 'कोई भी प्रकार · 12 महीने' }] },
  { id: 'studio', reports: 50, off: 20, name: { en: 'Studio', hi: 'स्टूडियो' }, extras: [{ en: 'Free branding setup', hi: 'ब्रांडिंग सेटअप मुफ़्त' }, { en: 'Priority 24-hour delivery', hi: 'प्राथमिकता 24 घंटे डिलीवरी' }, { en: 'Dedicated WhatsApp line', hi: 'समर्पित WhatsApp लाइन' }] },
] as const;

/** One-time and per-order add-ons. */
export const PRO_ADDONS = [
  { name: { en: 'Branding setup (one time)', hi: 'ब्रांडिंग सेटअप (एक बार)' }, inr: '₹1,999', usd: '$29', note: { en: 'Your logo, colours, cover page, footer and contact details – used on every report. Free with Growth and Studio packs.', hi: 'आपका लोगो, रंग, कवर पेज, फ़ुटर और संपर्क विवरण – हर रिपोर्ट पर। ग्रोथ और स्टूडियो पैक में मुफ़्त।' } },
  { name: { en: 'Express delivery (24 hours)', hi: 'एक्सप्रेस डिलीवरी (24 घंटे)' }, inr: '+50%', usd: '+50%', note: { en: 'Standard delivery is 2–3 working days.', hi: 'सामान्य डिलीवरी 2–3 कार्य-दिवस।' } },
  { name: { en: 'Bilingual report (English + हिंदी)', hi: 'द्विभाषी रिपोर्ट (English + हिंदी)' }, inr: '+₹199', usd: '+$3', note: { en: 'One language is included in every price.', hi: 'हर मूल्य में एक भाषा शामिल है।' } },
] as const;

export const inrFmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
export const usdFmt = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
export const packPrice = (n: number, off: number) => Math.round((n * (100 - off)) / 100);
export const PRO_FROM = { inr: Math.min(...PRO_REPORTS.map((r) => r.wl.inr)), usd: Math.min(...PRO_REPORTS.map((r) => r.wl.usd)) };
