/**
 * Shared types and helpers for the topic articles (compatibility, Lo Shu, personal year, house, mobile, name, Kua and pillar guides).
 * Every builder returns the same section ids in the same order for English and Hindi (the page renders them side by side).
 */
import type { Art } from './art';
import type { Block, Section } from './generate';

export type Lang = 'en' | 'hi';
export type TopicCat = 'guide' | 'compatibility' | 'loshu' | 'personal-year' | 'house' | 'mobile' | 'name' | 'kua';

export interface TopicPost {
  slug: string; cat: TopicCat; title: string; h1: string; description: string; keywords: string[];
  /** Short label above the H1. */ kicker: string;
  /** One-line summary under the H1. */ sub: string;
  art: Art; sections: Section[]; faqs: { q: string; a: string }[];
  /** Best matching service page and free calculator for the sidebar. */
  service: { href: string; label: string }; calc: { href: string; label: string };
  readMinutes: number; wordCount: number;
}
export interface TopicRef { slug: string; cat: TopicCat; build: (lang: Lang) => TopicPost }

export const NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const digitSum = (s: string) => s.replace(/\D/g, '').split('').reduce((a, d) => a + Number(d), 0);
export const red = (x: number) => { while (x > 9) x = digitSum(String(x)); return x; };
export const DAYS_OF = (n: number) => Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => red(d) === n);
export const clip = (s: string, max = 158) => (s.length <= max ? s : `${s.slice(0, s.lastIndexOf(' ', max - 1))}…`);
export const L = <T,>(lang: Lang, en: T, hi: T): T => (lang === 'hi' ? hi : en);
export const join = (lang: Lang, xs: (string | number)[]) => { const a = xs.map(String); if (a.length < 2) return a.join(''); return `${a.slice(0, -1).join(', ')} ${lang === 'hi' ? 'और' : 'and'} ${a[a.length - 1]}`; };

export const p = (text: string): Block => ({ kind: 'p', text });
export const list = (items: string[]): Block => ({ kind: 'list', items });
export const table = (head: string[], rows: string[][]): Block => ({ kind: 'table', head, rows });
export const tip = (text: string): Block => ({ kind: 'tip', text });
export const fig = (art: Art, caption: string): Block => ({ kind: 'figure', art, caption });
export const steps = (items: { title: string; text: string }[]): Block => ({ kind: 'steps', items });
export const cards = (items: { title: string; text: string; href?: string }[]): Block => ({ kind: 'cards', items });
export const sec = (id: string, title: string, blocks: Block[], cta = false): Section => ({ id, title, blocks, ...(cta ? { cta: true } : {}) });

const blockText = (b: Block): string[] => {
  switch (b.kind) {
    case 'p': case 'tip': return [b.text];
    case 'list': return b.items;
    case 'table': return [...b.head, ...b.rows.flat()];
    case 'cards': case 'steps': return b.items.flatMap((x) => [x.title, x.text]);
    case 'figure': return [b.caption];
    default: return [];
  }
};
/** All human-readable text of a post (used for word counts and the Hindi-coverage test). */
export const postText = (x: Pick<TopicPost, 'title' | 'h1' | 'sub' | 'kicker' | 'sections' | 'faqs'>) =>
  [x.title, x.h1, x.sub, x.kicker, ...x.sections.flatMap((s) => [s.title, ...s.blocks.flatMap(blockText)]), ...x.faqs.flatMap((f) => [f.q, f.a])];

export function finish(x: Omit<TopicPost, 'readMinutes' | 'wordCount'>): TopicPost {
  const wordCount = postText(x).join(' ').split(/\s+/).filter(Boolean).length;
  return { ...x, wordCount, readMinutes: Math.max(4, Math.round(wordCount / 200)) };
}

/** Free calculator cards (same engine as the reports). */
const CALC = {
  moolank: { en: ['Moolank Calculator', 'Find your Mulank (root number) from your day of birth.'], hi: ['मूलांक कैलकुलेटर', 'जन्म के दिन से अपना मूलांक जानें।'], href: '/calculators/moolank-calculator' },
  bhagyank: { en: ['Bhagyank Calculator', 'Your destiny number from the full date of birth, with master numbers.'], hi: ['भाग्यांक कैलकुलेटर', 'पूरी जन्म तिथि से भाग्यांक, मास्टर अंकों सहित।'], href: '/calculators/bhagyank-calculator' },
  loshu: { en: ['Lo Shu Grid Calculator', 'See missing and repeated numbers, planes and yogs.'], hi: ['लो शू ग्रिड कैलकुलेटर', 'अनुपस्थित और दोहराए अंक, प्लेन और योग देखें।'], href: '/calculators/lo-shu-grid-calculator' },
  name: { en: ['Name Numerology Calculator', 'Chaldean and Pythagorean name number in seconds.'], hi: ['नाम अंक ज्योतिष कैलकुलेटर', 'कैल्डियन और पाइथागोरियन नामांक तुरंत।'], href: '/calculators/name-numerology-calculator' },
  mobile: { en: ['Mobile Number Numerology', 'Check whether your mobile number suits you.'], hi: ['मोबाइल नंबर अंक ज्योतिष', 'जाँचें कि आपका मोबाइल नंबर आपके अनुकूल है या नहीं।'], href: '/calculators/mobile-number-numerology' },
  kua: { en: ['Kua Number Calculator', 'Your lucky directions for home, sleep and work.'], hi: ['कुआ नंबर कैलकुलेटर', 'घर, नींद और काम के लिए शुभ दिशाएँ।'], href: '/calculators/kua-number-calculator' },
  year: { en: ['Personal Year Calculator', 'Your personal year, month and day numbers.'], hi: ['व्यक्तिगत वर्ष कैलकुलेटर', 'आपका व्यक्तिगत वर्ष, माह और दिन अंक।'], href: '/calculators/personal-year-calculator' },
  house: { en: ['House Number Numerology', 'Is your house or flat number lucky for you?'], hi: ['मकान नंबर अंक ज्योतिष', 'क्या आपका मकान या फ़्लैट नंबर आपके लिए शुभ है?'], href: '/calculators/house-number-numerology' },
  vehicle: { en: ['Vehicle Number Numerology', 'Check your car or bike number.'], hi: ['वाहन नंबर अंक ज्योतिष', 'अपनी कार या बाइक का नंबर जाँचें।'], href: '/calculators/vehicle-number-numerology' },
};
export type CalcKey = keyof typeof CALC;
export const calcLink = (lang: Lang, k: CalcKey) => ({ href: CALC[k].href, label: CALC[k][lang][0] });
export function calcSection(lang: Lang, keys: CalcKey[], lead?: string): Section {
  return sec('calculators', L(lang, 'Try the Free Numerology Calculators', 'मुफ़्त अंक ज्योतिष कैलकुलेटर आज़माएँ'), [
    p(lead ?? L(lang, 'Start with the free calculators below – no sign-up and instant results. They use the same calculation engine as Acharya Nandram’s reports, so the numbers you see here match your report.', 'नीचे दिए मुफ़्त कैलकुलेटर से शुरुआत करें – कोई साइन-अप नहीं, तुरंत परिणाम। ये वही गणना-इंजन उपयोग करते हैं जो आचार्य नंदराम की रिपोर्ट में लगता है, इसलिए यहाँ दिखे अंक आपकी रिपोर्ट से मेल खाते हैं।')),
    cards(keys.map((k) => ({ title: CALC[k][lang][0], text: CALC[k][lang][1], href: CALC[k].href }))),
  ]);
}

/** Service pages offered on the site. */
const SERVICE = {
  report: { href: '/personal-numerology-report', en: 'Personal Numerology Report', hi: 'व्यक्तिगत अंक ज्योतिष रिपोर्ट' },
  name: { href: '/name-numerology', en: 'Name Correction', hi: 'नाम सुधार' },
  loshu: { href: '/lo-shu-grid', en: 'Lo Shu Grid Reading', hi: 'लो शू ग्रिड रीडिंग' },
  mobile: { href: '/mobile-number-numerology', en: 'Lucky Mobile Number', hi: 'शुभ मोबाइल नंबर' },
  baby: { href: '/baby-name-numerology', en: 'Baby Name Numerology', hi: 'शिशु नाम अंक ज्योतिष' },
  couple: { href: '/couple-compatibility-report', en: 'Couple Compatibility Report', hi: 'जोड़ी मिलान रिपोर्ट' },
  business: { href: '/business-name-numerology', en: 'Business Name Numerology', hi: 'व्यवसाय नाम अंक ज्योतिष' },
  year: { href: '/personal-year-consultancy', en: 'Personal Year Consultancy', hi: 'व्यक्तिगत वर्ष परामर्श' },
  signature: { href: '/signature-analysis', en: 'Signature Analysis', hi: 'हस्ताक्षर विश्लेषण' },
};
export type ServiceKey = keyof typeof SERVICE;
export const serviceLink = (lang: Lang, k: ServiceKey) => ({ href: SERVICE[k].href, label: SERVICE[k][lang] });

export const DISCLAIM = {
  en: 'Numerology is traditional guidance to support your decisions. It does not replace medical, legal or financial advice.',
  hi: 'अंक ज्योतिष आपके निर्णयों में सहायता के लिए पारंपरिक मार्गदर्शन है। यह चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं है।',
};
