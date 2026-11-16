/**
 * Client testimonials shown in the slider above the footer on every public page.
 * Managed in Admin → Testimonials (stored in app_settings key "testimonials"); these are the starting entries.
 * Only publish reviews written by real clients who agreed to be shown. Ratings are left empty unless the client gave one.
 * Safe to import in client components (no server code).
 */
export type TestimonialService =
  | 'general' | 'SVC_PERSONAL_REPORT' | 'SVC_NAME_CORRECTION' | 'SVC_LOSHU' | 'SVC_MOBILE_NUMBER'
  | 'SVC_BABY_NAME' | 'SVC_COUPLE' | 'SVC_BUSINESS_NAME' | 'SVC_PERSONAL_YEAR' | 'SVC_BUSINESS_COMPAT';

export interface Testimonial {
  id: string;
  name: string;
  gender: 'male' | 'female';
  location: string;          // e.g. "India", "Jaipur" – may be empty
  service: TestimonialService;
  quoteEn: string;           // the client's own words
  quoteHi: string;           // optional Hindi version supplied by / approved by the client ('' = show the original)
  rating: number | null;     // 1–5 only if the client gave a rating
  consent: boolean;          // client agreed to be published
  active: boolean;
}
export interface TestimonialSettings { enabled: boolean; items: Testimonial[] }

export const TESTIMONIAL_SERVICES: { id: TestimonialService; en: string; hi: string; slug?: string }[] = [
  { id: 'general', en: 'Numerology consultation', hi: 'अंक ज्योतिष परामर्श' },
  { id: 'SVC_PERSONAL_REPORT', en: 'Personal Numerology Report', hi: 'व्यक्तिगत अंक ज्योतिष रिपोर्ट', slug: 'personal-numerology-report' },
  { id: 'SVC_NAME_CORRECTION', en: 'Name Numerology', hi: 'नाम अंक ज्योतिष', slug: 'name-numerology' },
  { id: 'SVC_LOSHU', en: 'Lo Shu Grid Analysis', hi: 'लो शू ग्रिड विश्लेषण', slug: 'lo-shu-grid' },
  { id: 'SVC_MOBILE_NUMBER', en: 'Mobile Number Numerology', hi: 'मोबाइल नंबर अंक ज्योतिष', slug: 'mobile-number-numerology' },
  { id: 'SVC_BABY_NAME', en: 'Baby Name Suggestion', hi: 'शिशु नाम सुझाव', slug: 'baby-name-numerology' },
  { id: 'SVC_COUPLE', en: 'Relationship Compatibility', hi: 'संबंध अनुकूलता', slug: 'couple-compatibility-report' },
  { id: 'SVC_BUSINESS_NAME', en: 'Business Name Numerology', hi: 'व्यवसाय नाम अंक ज्योतिष', slug: 'business-name-numerology' },
  { id: 'SVC_PERSONAL_YEAR', en: 'Personal Year Consultancy', hi: 'व्यक्तिगत वर्ष परामर्श', slug: 'personal-year-consultancy' },
  { id: 'SVC_BUSINESS_COMPAT', en: 'Business Compatibility Report', hi: 'व्यवसाय अनुकूलता रिपोर्ट', slug: 'business-compatibility-numerology' },
];
export const serviceLabel = (s: TestimonialService) => TESTIMONIAL_SERVICES.find((x) => x.id === s) ?? TESTIMONIAL_SERVICES[0];

const t = (id: string, name: string, gender: Testimonial['gender'], location: string, service: TestimonialService, quoteEn: string): Testimonial =>
  ({ id, name, gender, location, service, quoteEn, quoteHi: '', rating: null, consent: true, active: true });

/** Client reviews supplied by the owner on 2026-11-14 (confirmed as real client reviews). */
export const DEFAULT_TESTIMONIALS: TestimonialSettings = {
  enabled: true,
  items: [
    t('t1', 'Rahul Sharma', 'male', 'India', 'SVC_PERSONAL_REPORT', 'I was always curious about Numerology, but I never understood how numbers could relate to my personality and life decisions. The detailed consultation helped me understand my strengths, challenges and opportunities. A truly insightful experience!'),
    t('t2', 'Priya Verma', 'female', 'India', 'SVC_PERSONAL_REPORT', 'My Numerology consultation was a wonderful experience. The report was explained in simple language, making even complex concepts easy to understand. I now have a better understanding of myself and my personal goals.'),
    t('t3', 'Amit Patel', 'male', 'India', 'SVC_PERSONAL_REPORT', 'The consultation was professional, detailed and easy to understand. I particularly liked the personalized analysis instead of generic predictions. Highly recommended for anyone interested in self-discovery.'),
    t('t4', 'Neha Gupta', 'female', 'India', 'SVC_PERSONAL_REPORT', 'I received my Numerology report and was impressed by how systematically everything was explained. It gave me a fresh perspective on my personality, relationships and professional aspirations.'),
    t('t5', 'Vikram Singh', 'male', 'India', 'SVC_PERSONAL_REPORT', 'Excellent experience! The analysis helped me explore my personality, natural abilities and areas where I can improve. The explanations were practical and easy to follow.'),
    t('t6', 'Ananya Mehta', 'female', 'India', 'SVC_NAME_CORRECTION', 'I always wanted to understand the meaning behind my birth date and name. This consultation made Numerology interesting and understandable. The report was beautifully structured and informative.'),
    t('t7', 'Nisha Jain', 'female', '', 'SVC_BUSINESS_NAME', 'Starting my own business was an important decision for me. The Business Name Numerology consultation helped me compare different name options and understand their numerical values.'),
    t('t8', 'Simran Kaur', 'female', '', 'SVC_COUPLE', 'I really enjoyed the relationship compatibility reading. The analysis was explained in a balanced and easy-to-understand manner. It gave us some interesting things to discuss and reflect upon.'),
  ],
};

/** Paths where the slider is not shown (private / app screens). */
export const HIDE_TESTIMONIALS_ON = /^\/(admin|login|account|settings|dashboard|s)(\/|$)/;

/** Order for a page: the page's own service first, then personal-report / general reviews, then the rest. */
export function orderForPath(items: Testimonial[], pathname: string): Testimonial[] {
  const slug = pathname.split('/')[1] ?? '';
  const svc = TESTIMONIAL_SERVICES.find((s) => s.slug === slug)?.id;
  const live = items.filter((x) => x.active && x.consent && x.quoteEn.trim());
  if (!svc) return live;
  return [...live.filter((x) => x.service === svc), ...live.filter((x) => x.service !== svc)];
}
