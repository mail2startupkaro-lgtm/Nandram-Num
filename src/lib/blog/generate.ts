/**
 * Builds the "Best Numerologist in <city>" article for any city in the dataset.
 * Everything is derived from the city, its state/tier and the numerology engine, with deterministic variants per city.
 */
import { analyseNameSystem } from '@/lib/numerology';
import { planetOf } from '@/lib/numerology/data/planets';
import { NUMBER_TRAITS } from '@/lib/i18n/numberMeanings';
import { CITIES, STATES, postSlug, type City, type Tier } from './cities';

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'cards'; items: { title: string; text: string; href?: string }[] }
  | { kind: 'steps'; items: { title: string; text: string }[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'mulank' };
export interface Section { id: string; title: string; blocks: Block[]; cta?: boolean }
export interface Post {
  city: City; slug: string; title: string; h1: string; description: string; keywords: string[];
  sections: Section[]; faqs: { q: string; a: string }[]; related: City[]; readMinutes: number; wordCount: number;
}

const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; };
const pick = <T,>(h: number, arr: T[], salt = 0) => arr[(h + salt) % arr.length];
const rotate = <T,>(arr: T[], by: number, take: number) => Array.from({ length: take }, (_, i) => arr[(by + i) % arr.length]);
const SITE = 'Acharya Nandram';

const TIER_PHRASE: Record<Tier, string[]> = {
  1: ["one of India's major metro cities", 'a leading metropolitan hub', 'a fast-moving metro'],
  2: ['a major regional city', 'a growing commercial and education hub', 'an important regional centre'],
  3: ['a fast-growing city', 'a well-connected town with a strong local community', 'a developing city with close family and business ties'],
};
const REASONS: Record<Tier, string[]> = {
  1: [
    'Career timing: job switches, promotions, leadership roles and relocations, where a second perspective on timing helps.',
    'Startup and business planning: choosing a business name, a launch period and partner numbers.',
    'Name and signature correction for professionals whose name is their personal brand.',
    'Mobile and bank-account numbers: people who deal with clients all day want a number that supports them.',
    'Busy schedules: an online consultation fits around long commutes and packed work hours.',
    'Property and investment timing, using personal-year cycles as one input alongside professional financial advice.',
    'Relationship and marriage compatibility, in a city where families and careers often pull in different directions.',
  ],
  2: [
    'Business growth: family trade, retail and franchise decisions in an expanding regional market.',
    'Education and competitive-exam guidance: understanding a student\'s strengths, weak numbers and study rhythm.',
    'Career moves: whether to stay, shift to a bigger metro or start something locally.',
    'Marriage matching and compatibility conversations that involve the whole family.',
    'Name selection for a new baby or a new business.',
    'Mobile number and vehicle number checks before buying or changing.',
    'Easy access to experienced guidance that a smaller local market may not always offer.',
  ],
  3: [
    'Family-business decisions: succession, expansion and partnership numbers.',
    'Government-job and exam preparation: understanding strengths, weak areas and daily routine.',
    'Marriage and relationship compatibility, often discussed together with the family.',
    'Naming a child, a shop or a firm and checking the number that goes with it.',
    'Remedies explained in simple language, in English, Hindi or Hinglish.',
    'Online access: you can speak to an experienced numerologist without travelling to a bigger city.',
    'Trade, agriculture and local-business timing viewed through personal-year cycles.',
  ],
};

/** Hand-written local context for the biggest metros. */
const METRO: Record<string, string[]> = {
  mumbai: [
    'Mumbai runs on ambition: the finance and corporate offices of Nariman Point and Bandra-Kurla, the film and television studios of the western suburbs, and a startup scene that never sleeps. In a city where careers change quickly and every hour is booked, many people look for clear, personalised guidance they can act on.',
    'From local-train commutes to the Ganesh Chaturthi season, Mumbai also has a strong tradition of faith and auspicious timing. Numerology fits naturally into this: it is a simple, number-based way to understand your own strengths, your lucky periods and the changes that suit you.',
  ],
  pune: [
    'Pune is a city of colleges, IT parks and manufacturing belts such as Hinjewadi, Kharadi and Pimpri-Chinchwad. Students, engineers and first-generation entrepreneurs make up a large part of the city, and many of them are making big choices about studies, jobs and business at the same time.',
    'With Marathi traditions such as Gudi Padwa and Ganeshotsav deeply rooted in the city, Punekars are comfortable with the idea of auspicious timing. A numerology reading adds a personal layer: your own birth numbers, your current personal year and the periods ahead.',
  ],
  ahmedabad: [
    'Ahmedabad is known for trade, textiles, pharma and a very strong entrepreneurial culture. Business families here think carefully about names, numbers and timing before launching a firm, signing a partnership or opening a new branch.',
    'Festivals such as Navratri and Uttarayan shape the calendar of the city, and Gujarati business households have long valued auspicious beginnings. Numerology helps you check a business name, a signature or a mobile number against your own birth numbers before you commit.',
  ],
  bengaluru: [
    'Bengaluru is India\'s technology capital, with product companies, global capability centres and a thriving startup ecosystem in areas such as Whitefield, Koramangala and Electronic City. People here change roles and cities often, so questions about career timing and direction are very common.',
    'The city is also a meeting point of many languages and cultures, and festivals such as Ugadi and Dasara are widely celebrated. Numerology offers a personal, number-based view that works for professionals from any background.',
  ],
  chennai: [
    'Chennai combines a large automobile and manufacturing base, a strong IT corridor along OMR and a long tradition of education and the arts. Tamil households have a deep respect for astrology and numerology, and name numbers in particular are taken seriously for children and businesses.',
    'Around Pongal and the Tamil New Year, many families plan new beginnings. A numerology reading helps you pair that auspicious spirit with your own Moolank, Bhagyank and personal-year cycle.',
  ],
  hyderabad: [
    'Hyderabad is a major IT, pharma and biotech centre, with HITEC City and Gachibowli attracting professionals from across the country. Alongside the technology boom, the city has a rich cultural life, from Bonalu and Bathukamma to Ugadi.',
    'People moving to Hyderabad for work often have questions about timing, career direction and relationships. A numerology consultation gives a clear, personal framework for those decisions, without needing you to visit anyone in person.',
  ],
  kolkata: [
    'Kolkata is a city of culture, literature, trade and education, and Durga Puja is the heart of its calendar. Bengali families have a long tradition of consulting experts about names, auspicious dates and important life events.',
    'Whether you are choosing a name for a child, planning a business in Burrabazar or the Salt Lake sector, or thinking about a move, numerology can add a personal, number-based perspective alongside your family\'s advice.',
  ],
  delhi: [
    'Delhi is the capital of India, with government offices, corporate headquarters, a large startup community and a population drawn from every state. Careers here are often tied to civil services, politics, media, business and consulting, where timing and reputation matter a great deal.',
    'With festivals such as Diwali and Dussehra setting the rhythm of the year, many Delhiites plan new ventures around auspicious periods. A numerology reading adds your own birth numbers, your name vibration and your current personal year to that planning.',
  ],
  'new-delhi': [
    'New Delhi is the seat of the central government and home to many of the country\'s institutions, embassies and corporate offices. People working in policy, law, media, consulting and business often make decisions where timing and name carry real weight.',
    'Numerology is a personal framework you can use alongside your own judgement: it looks at your Moolank, Bhagyank, name and mobile number, and at the personal-year cycle you are currently in.',
  ],
};

const MULANK_CAREER: Record<number, string> = {
  1: 'leadership roles, entrepreneurship, administration and government service', 2: 'counselling, teaching, design, hospitality and creative or care-based work',
  3: 'teaching, law, banking, advisory and publishing', 4: 'engineering, technology, real estate, research and systems work',
  5: 'sales, marketing, trading, media and communication', 6: 'fashion, arts, beauty, hospitality and family business',
  7: 'research, analysis, spirituality, healing and technical fields', 8: 'finance, industry, construction, law and long-term business building',
  9: 'defence, sports, medicine, engineering and service-oriented work',
};

function buildFaqs(c: City, h: number): { q: string; a: string }[] {
  const info = STATES[c.state];
  const all = [
    { q: `Who is the best numerologist in ${c.name}?`, a: `"Best" depends on experience, accuracy and how well a numerologist explains the results. ${SITE} has more than 15 years of experience in Vedic, Chaldean and Lo Shu numerology and offers online consultations to people in ${c.name} and across ${c.state}. Check his profile on this page, try the free calculators and decide for yourself.` },
    { q: `Can I consult a numerologist online from ${c.name}?`, a: `Yes. Your Moolank, Bhagyank, Lo Shu grid and name number are calculated from your date of birth and name, so no physical visit is needed. Reports are available in English, Hindi and Hinglish, which suits ${info.langs} speakers as well.` },
    { q: `What details do I need for a numerology reading?`, a: `Your full name as per documents, your date of birth (DD-MM-YYYY) and gender. For a mobile number analysis add your number, and for a compatibility reading add your partner's name and date of birth. Time and place of birth are optional.` },
    { q: `How accurate is numerology?`, a: `Numerology is a traditional guidance system, not a science, and it cannot predict events with certainty. It is best used as a tool for self-understanding and planning. Decisions about health, money and legal matters should always be taken with qualified professionals.` },
    { q: `Can numerology help me choose a name or change a spelling in ${c.name}?`, a: `Yes. Using the Chaldean system, a name is checked against your Moolank and Bhagyank. Sometimes a small spelling adjustment is suggested. Many people in ${c.name} do this for a new baby, a business or a professional name.` },
    { q: `How much does a numerology report cost?`, a: `All prices are in INR and include 18% GST. You can start free with the calculators, and paid reports and plans are listed on the pricing page.` },
    { q: `Which language is the report in?`, a: `You can choose English, Hindi or Hinglish. Many readers in ${c.state} prefer a bilingual report so the whole family can read it.` },
    { q: `Is my personal data safe?`, a: `Payments are processed securely through Cashfree Payments and sensitive details such as Aadhaar are optional and never stored in full. Read the privacy policy on the site for details.` },
  ];
  const first = all.slice(0, 2), rest = all.slice(2);
  return [...first, ...rotate(rest, h % rest.length, 4)];
}

export function buildPost(c: City): Post {
  const h = hash(c.slug);
  const info = STATES[c.state];
  const alias = c.alias ? ` (also searched as ${c.alias})` : '';
  const tier = pick(h, TIER_PHRASE[c.tier]);
  const slug = postSlug(c);
  const metro = METRO[c.slug];
  const [fa, fb, fc] = info.festivals;

  // city name numerology (Chaldean + Pythagorean)
  const ch = analyseNameSystem(c.name, 'chaldean'), py = analyseNameSystem(c.name, 'pythagorean');
  const cn = ch.nameNumber.single, pl = planetOf(cn), tr = NUMBER_TRAITS.en[cn];

  const title = `Best Numerologist in ${c.name}${c.alias ? ` (${c.alias})` : ''} – Online Numerology by ${SITE}`;
  const full = `Looking for the best numerologist in ${c.name}, ${c.state}? ${SITE} (15+ years) offers online Vedic, Chaldean & Lo Shu numerology reports. Try free calculators.`;
  const description = full.length <= 160 ? full : `Best numerologist in ${c.name}, ${c.state}: ${SITE} (15+ years) offers online Vedic, Chaldean & Lo Shu numerology reports and free calculators.`;
  const sections: Section[] = [];

  const intro: Block[] = [
    { kind: 'p', text: pick(h, [
      `If you are searching for the best numerologist in ${c.name}${alias}, you probably want three things: an experienced expert, a clear explanation in plain language and practical advice you can actually use. ${c.name} is ${tier} in ${c.state}, and people here are increasingly turning to numerology to understand their personality, time their decisions and choose names and numbers that support them.`,
      `${c.name}${alias} is ${tier} in ${c.state}, and more and more of its residents are asking the same question: who is the best numerologist for an honest, accurate reading? This guide explains how numerology works, what a good consultation should include and how you can get a personal report from ${SITE} without leaving ${c.name}.`,
      `Finding the best numerologist in ${c.name}${alias} is not about the loudest promise, it is about experience, method and clarity. As ${tier} in ${c.state}, ${c.name} has residents with very different needs, from career and business to marriage and naming. This article shows what to look for and how ${SITE} can help you online.`,
    ]) },
    { kind: 'p', text: `${SITE} has more than 15 years of experience in Vedic numerology, the Chaldean system and the Lo Shu grid, and has guided thousands of individuals and families through precise number analysis and personal remedies. His readings are delivered as designed reports in English, Hindi or Hinglish, so you can read them with your family in ${c.name}.` },
  ];
  sections.push({ id: 'intro', title: `Best Numerologist in ${c.name}: What You Should Know`, blocks: intro, cta: true });

  if (metro) sections.push({ id: 'city', title: `Numerology and Life in ${c.name}`, blocks: metro.map((text) => ({ kind: 'p' as const, text })) });

  sections.push({ id: 'why', title: `Why People in ${c.name} Consult a Numerologist`, blocks: [
    { kind: 'p', text: `People in ${c.name} come to numerology for many reasons. These are the most common ones for ${c.tier === 1 ? 'a big metro' : c.tier === 2 ? 'a regional hub' : 'a growing city'} like ${c.name}:` },
    { kind: 'list', items: rotate(REASONS[c.tier], h % 7, 5) },
  ] });

  sections.push({ id: 'basics', title: 'Numerology in 60 Seconds: Moolank, Bhagyank and Lo Shu', blocks: [
    { kind: 'p', text: 'Indian numerology reads your personality and life path from numbers. The three you should know first are:' },
    { kind: 'list', items: [
      'Moolank (root number): your day of birth reduced to one digit. Born on the 28th? 2 + 8 = 10 → 1. It describes your nature and how others see you.',
      'Bhagyank (destiny number): all digits of your full date of birth added and reduced. Born on 28-08-1990? 2+8+0+8+1+9+9+0 = 37 → 10 → 1. It shows the direction your life tends to take.',
      'Lo Shu grid: your birth digits placed in a 3×3 magic square. Missing and repeated numbers show strengths, gaps and the remedies that may help.',
    ] },
    { kind: 'p', text: 'Each number is linked with a planet, a lucky day, lucky colours and a set of traits. You can find yours in a minute with the free Moolank, Bhagyank and Lo Shu calculators on this site.' },
  ] });

  sections.push({ id: 'cityname', title: `The Numerology of the Name "${c.name}"`, blocks: [
    { kind: 'p', text: `Just for fun, here is the numerology of the city itself. In the Chaldean system, the name ${c.name} adds up to ${ch.nameNumber.compound}, which reduces to ${cn}. In the Pythagorean system it adds up to ${py.nameNumber.compound}, reducing to ${py.nameNumber.single}.` },
    { kind: 'p', text: `Number ${cn} is ruled by ${pl.name} (${pl.hindiName}) and is associated with ${tr.keyword.toLowerCase()}: ${tr.plus.toLowerCase()}. Its lucky day is ${pl.weekday}. This is a light-hearted look at the place, not a prediction. Your personal numerology depends on your own date of birth and name, which is what a consultation with ${SITE} analyses.` },
  ] });

  sections.push({ id: 'services', title: `Numerology Services for ${c.name} Residents`, blocks: [
    { kind: 'p', text: `Everything below is available online to people in ${c.name} and the rest of ${c.state}:` },
    { kind: 'cards', items: [
      { title: 'Date of Birth Reading', text: 'Moolank, Bhagyank, Kua, Lo Shu grid and personal-year cycles explained clearly.', href: '/reading' },
      { title: 'Name Numerology', text: 'Chaldean and Pythagorean checks with spelling suggestions that suit your birth numbers.', href: '/calculators/name-numerology-calculator' },
      { title: 'Mobile Number Analysis', text: 'A compatibility score for your mobile number and numbers that would suit you better.', href: '/calculators/mobile-number-numerology' },
      { title: 'Lo Shu Grid Report', text: 'Missing numbers, repeated numbers, planes and yogs with practical remedies.', href: '/calculators/lo-shu-grid-calculator' },
      { title: 'Couple Compatibility', text: 'How two people\'s numbers, planets and grids blend for marriage or partnership.', href: '/reading' },
      { title: 'Complete Life Report (PDF)', text: 'Every module in one designed PDF with personal remedies, ready to share with family.', href: '/pricing' },
    ] },
  ], cta: true });

  const careerText = c.tier === 1
    ? `In a competitive metro like ${c.name}, timing and positioning matter. Numerology can help you understand which kind of role suits your Moolank, when your personal year favours a move and which names or numbers to avoid when you build your brand.`
    : c.tier === 2
      ? `In a growing regional hub like ${c.name}, many people are deciding between staying local, moving to a metro or building something of their own. Numerology gives you a personal view of your strengths and of the years that favour each choice.`
      : `In a city like ${c.name}, many families run their own business or look for stable government and private jobs. Numerology can help you see which fields suit your Moolank and which years favour a new start, an expansion or patience.`;
  sections.push({ id: 'career', title: `Numerology for Career and Business in ${c.name}`, blocks: [
    { kind: 'p', text: careerText },
    { kind: 'table', head: ['Moolank', 'Ruling planet', 'Fields that often suit'], rows: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [String(n), planetOf(n).name, MULANK_CAREER[n]]) },
    { kind: 'p', text: 'This is a general guide. A full reading combines your Moolank with your Bhagyank, name number and the current personal year before suggesting anything.' },
  ] });

  sections.push({ id: 'relationships', title: `Marriage and Relationship Compatibility in ${c.name}`, blocks: [
    { kind: 'p', text: pick(h, [
      `Marriage is one of the most common reasons people in ${c.name} ask for a numerology reading. Compatibility looks at both partners' Moolank and Bhagyank, how their planets relate and where their Lo Shu grids support or balance each other.`,
      `Families in ${c.name} often want to understand compatibility before an important decision. A numerology compatibility reading compares the Moolank, Bhagyank and Lo Shu grids of two people and explains the strengths and the areas that need care.`,
    ], 1) },
    { kind: 'p', text: 'It is not a verdict on a relationship. It highlights communication styles, strengths and likely friction points so that couples and families can talk about them openly.' },
  ] });

  sections.push({ id: 'timing', title: `Auspicious Timing in ${c.state}: ${fa}, ${fb} and ${fc}`, blocks: [
    { kind: 'p', text: `In ${c.state}, festivals such as ${fa}, ${fb} and ${fc} are traditional moments for new beginnings, from starting a business to naming a child or buying a vehicle. Many families in ${c.name} like to combine these auspicious times with a personal check.` },
    { kind: 'p', text: `A numerologist does not replace your panchang or family priest. Numerology adds a personal layer: whether the date adds up to a friendly number for you, and which personal year you are in when you take the step.` },
  ] });

  sections.push({ id: 'how', title: `How Your Online Consultation Works from ${c.name}`, blocks: [
    { kind: 'steps', items: [
      { title: 'Share your details', text: 'Enter your name, date of birth and gender. Mobile number and partner details are optional.' },
      { title: 'Exact calculation', text: 'Traditional Vedic and Chaldean rules are applied precisely, so the numbers are always consistent.' },
      { title: 'Expert write-up', text: `Your reading is written in ${SITE}'s style, with remedies and practical advice.` },
      { title: 'Download your PDF', text: `Get a designed report in English, Hindi or Hinglish that you can share with your family in ${c.name}.` },
    ] },
  ] });

  sections.push({ id: 'mulank', title: 'Find Your Mulank (Moolank) 1 to 9', blocks: [
    { kind: 'p', text: 'Pick your root number to read its personality, career, relationships, lucky colours and remedies:' },
    { kind: 'mulank' },
  ] });

  const faqs = buildFaqs(c, h);
  sections.push({ id: 'faq', title: `Numerology FAQs for ${c.name}`, blocks: [] });

  // nearby cities: same state first, then same region, never self
  const same = CITIES.filter((x) => x.state === c.state && x.slug !== c.slug);
  const ordered = [...same.filter((x) => x.tier <= c.tier).slice(0, 4), ...same.slice(h % Math.max(1, same.length)).slice(0, 8)];
  const related = Array.from(new Map(ordered.map((x) => [x.slug, x])).values()).slice(0, 8);
  if (related.length < 8) for (const x of CITIES.filter((x) => x.region === c.region && x.state !== c.state && x.tier <= (c.region === 'North-East' ? 3 : 2))) { if (related.length >= 8) break; if (!related.find((r) => r.slug === x.slug)) related.push(x); }

  const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
  const wc = sections.reduce((a, s) => a + words(s.title) + s.blocks.reduce((b, k) => b + (k.kind === 'p' ? words(k.text) : k.kind === 'list' ? k.items.reduce((x, i) => x + words(i), 0) : k.kind === 'cards' ? k.items.reduce((x, i) => x + words(i.title + i.text), 0) : k.kind === 'steps' ? k.items.reduce((x, i) => x + words(i.title + i.text), 0) : k.kind === 'table' ? k.rows.reduce((x, r) => x + words(r.join(' ')), 0) : 40), 0), 0)
    + faqs.reduce((a, f) => a + words(f.q + f.a), 0) + 180; // + expert profile and CTA copy rendered by the page

  const keywords = [`best numerologist in ${c.name}`, `numerologist in ${c.name}`, `numerology consultation ${c.name}`, `online numerologist ${c.name}`, `numerology report ${c.name}`, `${SITE}`, `numerologist in ${c.state}`, ...(c.alias ? [`best numerologist in ${c.alias}`, `numerologist in ${c.alias}`] : [])];
  return { city: c, slug, title, h1: `Best Numerologist in ${c.name}`, description, keywords, sections, faqs, related, readMinutes: Math.max(4, Math.round(wc / 220)), wordCount: wc };
}
