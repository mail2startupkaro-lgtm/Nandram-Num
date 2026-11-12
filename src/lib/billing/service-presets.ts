/**
 * Service-wise Report Presets:
 * Maps service codes (e.g. SVC_NAME_CORRECTION, SVC_LOSHU) to tailored report templates,
 * pre-selecting the optimal modules, chapters, report title, and intake fields.
 */
export interface ServicePreset {
  code: string;
  label: string;
  badge: string;
  description: string;
  reportTitle: string;
  modules: ('complete' | 'dob' | 'name' | 'mobile' | 'aadhaar' | 'couple')[];
  includedChapters: string[];
  keyFields: string[];
  icon: string;
}

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    code: 'SVC_PERSONAL_REPORT',
    label: 'Personal Numerology Report',
    badge: 'Comprehensive',
    description: 'Full chart reading: Moolank, Bhagyank, Lo Shu, Kua, personal cycles, name, mobile, life areas & remedies.',
    reportTitle: 'Personal Numerology Life Report',
    modules: ['complete'],
    includedChapters: ['glance', 'core', 'grid', 'kua', 'timing', 'life', 'name', 'numbers', 'couple', 'remedies'],
    keyFields: ['fullName', 'dob', 'gender', 'mobile', 'profession'],
    icon: '👑',
  },
  {
    code: 'SVC_NAME_CORRECTION',
    label: 'Name Correction & Lucky Spelling',
    badge: 'Name Vibration',
    description: 'Current name vibrations (Chaldean & Pythagorean), compound numbers, lucky spelling options and signature advice.',
    reportTitle: 'Name Correction & Lucky Spelling Report',
    modules: ['dob', 'name'],
    includedChapters: ['glance', 'core', 'name', 'remedies'],
    keyFields: ['fullName', 'commonName', 'dob', 'gender'],
    icon: '✍️',
  },
  {
    code: 'SVC_LOSHU',
    label: 'Lo Shu Grid Analysis',
    badge: 'Grid & Yogs',
    description: 'Complete Lo Shu chart, missing/repeated numbers, Raj Yogs, 8 planes & directional balancing remedies.',
    reportTitle: 'Lo Shu Grid Analysis & Yogs Report',
    modules: ['dob'],
    includedChapters: ['glance', 'core', 'grid', 'kua', 'remedies'],
    keyFields: ['fullName', 'dob', 'gender'],
    icon: '🔲',
  },
  {
    code: 'SVC_MOBILE_NUMBER',
    label: 'Lucky Mobile Number Selection',
    badge: 'Mobile Vibrations',
    description: 'Full audit of current mobile number, single/compound totals, digit pairs (malefic/supportive) & ideal target totals.',
    reportTitle: 'Lucky Mobile Number Analysis Report',
    modules: ['dob', 'mobile'],
    includedChapters: ['glance', 'core', 'numbers', 'remedies'],
    keyFields: ['fullName', 'dob', 'gender', 'mobile'],
    icon: '📱',
  },
  {
    code: 'SVC_COUPLE',
    label: 'Couple Compatibility Report',
    badge: 'Match & Harmony',
    description: 'Relationship harmony, combined Lo Shu overlay, mutual strengths, friction zones and auspicious marriage dates.',
    reportTitle: 'Couple Compatibility & Marriage Report',
    modules: ['dob', 'couple'],
    includedChapters: ['glance', 'core', 'couple', 'remedies'],
    keyFields: ['fullName', 'dob', 'gender', 'partnerName', 'partnerDob'],
    icon: '💍',
  },
  {
    code: 'SVC_BABY_NAME',
    label: 'Baby Name Numerology',
    badge: 'Newborn Harmony',
    description: 'Harmonious name suggestions matching birth Moolank & Bhagyank, lucky starting letters, and planetary colours.',
    reportTitle: 'Baby Name Numerology Report',
    modules: ['dob', 'name'],
    includedChapters: ['glance', 'core', 'name', 'remedies'],
    keyFields: ['fullName', 'dob', 'gender'],
    icon: '👶',
  },
  {
    code: 'SVC_BUSINESS_NAME',
    label: 'Business Name Numerology',
    badge: 'Brand Success',
    description: 'Commercial brand/business name alignment with founder birth numbers, lucky registration/launch dates & career forecast.',
    reportTitle: 'Business & Brand Name Numerology Report',
    modules: ['dob', 'name'],
    includedChapters: ['glance', 'core', 'name', 'life', 'remedies'],
    keyFields: ['fullName', 'commonName', 'dob', 'profession'],
    icon: '🏢',
  },
  {
    code: 'SVC_PERSONAL_YEAR',
    label: 'Personal Year Consultancy',
    badge: '12-Month Cycles',
    description: 'Current and upcoming 12-month personal cycle timeline, pinnacles, challenges, and decision timing.',
    reportTitle: 'Personal Year & Timing Forecast Report',
    modules: ['dob'],
    includedChapters: ['glance', 'core', 'timing', 'life', 'remedies'],
    keyFields: ['fullName', 'dob', 'gender'],
    icon: '📅',
  },
];

export function getServicePreset(code: string): ServicePreset | undefined {
  return SERVICE_PRESETS.find((p) => p.code === code);
}
