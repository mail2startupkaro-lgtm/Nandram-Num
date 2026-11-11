/**
 * Long-form SEO articles for Mulank 1–9 and Bhagyank 1–9 (18 posts), in English and Hindi.
 * Built from the same data as the /mulank and /bhagyank pages and the numerology engine
 * (planets, friendship table, master numbers), so every fact matches the reports.
 * Both languages produce the same section ids in the same order (the page renders them side by side).
 */
import { planetOf } from '@/lib/numerology/data/planets';
import { relationOf, type Relation } from '@/lib/numerology/data/relations';
import { NUMBER_TRAITS, PY_THEMES } from '@/lib/i18n/numberMeanings';
import { tr } from '@/lib/i18n/hi-terms';
import { mulankFor } from '@/lib/mulank-data';
import { bhagyankFor, mulankBhagyankCombo } from '@/lib/bhagyank-data';
import type { Block, Section } from './generate';

export type NumKind = 'mulank' | 'bhagyank';
type Lang = 'en' | 'hi';

export interface NumberPost {
  kind: NumKind; n: number; slug: string; title: string; h1: string; description: string; keywords: string[];
  sections: Section[]; faqs: { q: string; a: string }[]; readMinutes: number; wordCount: number;
}

const NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const numberPostSlug = (kind: NumKind, n: number) => kind === 'mulank' ? `mulank-${n}-meaning-personality-career-remedies` : `bhagyank-${n}-meaning-destiny-career-remedies`;
export const NUMBER_POSTS: { kind: NumKind; n: number; slug: string }[] = (['mulank', 'bhagyank'] as const).flatMap((kind) => NUMS.map((n) => ({ kind, n, slug: numberPostSlug(kind, n) })));
export const numberPostBySlug = (slug: string) => NUMBER_POSTS.find((p) => p.slug === slug);

export const NUMBER_POST_PUBLISHED = '2026-11-10';
const YEARS = [2026, 2027];
const digitSum = (s: string) => s.replace(/\D/g, '').split('').reduce((a, d) => a + Number(d), 0);
const reduce = (x: number) => { while (x > 9) x = digitSum(String(x)); return x; };
const universalYear = (y: number) => reduce(digitSum(String(y)));
const clip = (s: string, max = 158) => (s.length <= max ? s : `${s.slice(0, s.lastIndexOf(' ', max - 1))}…`);
const DAYS_OF = (n: number) => Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => reduce(d) === n);

/** Three real example birth dates whose digits total to n (shows the master path when there is one). */
function bhagyankExamples(n: number): { date: string; steps: string }[] {
  const out: { date: string; steps: string }[] = [];
  for (let y = 1975; y <= 2005 && out.length < 3; y += 7) for (let m = 1; m <= 12 && out.length < 3; m += 5) for (let d = 3; d <= 28 && out.length < 3; d += 6) {
    const dd = String(d).padStart(2, '0'), mm = String(m).padStart(2, '0');
    const digits = `${dd}${mm}${y}`.split('');
    const total = digits.reduce((a, x) => a + Number(x), 0);
    if (reduce(total) !== n || out.some((o) => o.date.endsWith(String(y)))) continue;
    const chain = [total]; let t = total; while (t > 9) { t = digitSum(String(t)); chain.push(t); }
    out.push({ date: `${dd}-${mm}-${y}`, steps: `${digits.join(' + ')} = ${chain.join(' → ')}` });
  }
  return out;
}

const REL = {
  en: { friend: 'Friendly', neutral: 'Neutral', enemy: 'Challenging' },
  hi: { friend: 'मित्र', neutral: 'सम', enemy: 'चुनौतीपूर्ण' },
};
const VERDICT = {
  en: { excellent: 'Excellent', good: 'Good', mixed: 'Mixed', challenging: 'Needs remedies' },
  hi: { excellent: 'उत्तम', good: 'अच्छा', mixed: 'मिश्रित', challenging: 'उपाय आवश्यक' },
};
function pairNote(lang: Lang, a: Relation, b: Relation) {
  const s = (a === 'friend' ? 1 : a === 'enemy' ? -1 : 0) + (b === 'friend' ? 1 : b === 'enemy' ? -1 : 0);
  if (lang === 'hi') return s >= 2 ? 'दोनों अंक एक-दूसरे का साथ देते हैं; सहज तालमेल।' : s === 1 ? 'अच्छा मेल; छोटे समायोजन से रिश्ता मज़बूत रहता है।' : s === 0 ? 'मिश्रित ऊर्जा; आपसी समझ और धैर्य ज़रूरी।' : 'ऊर्जाएँ टकराती हैं; नाम, मोबाइल और उपायों से संतुलन करें।';
  return s >= 2 ? 'Both numbers support each other; natural harmony.' : s === 1 ? 'A good match; small adjustments keep it strong.' : s === 0 ? 'Mixed energies; understanding and patience matter.' : 'The energies clash; balance them with name, mobile and remedies.';
}

const CALCS = {
  en: [
    { title: 'Moolank Calculator', text: 'Find your Mulank (root number) from your day of birth in one click.', href: '/calculators/moolank-calculator' },
    { title: 'Bhagyank Calculator', text: 'Get your destiny number from your full date of birth, including master numbers 11, 22 and 33.', href: '/calculators/bhagyank-calculator' },
    { title: 'Lo Shu Grid Calculator', text: 'See your missing and repeated numbers, planes and Raj Yog in the 3×3 grid.', href: '/calculators/lo-shu-grid-calculator' },
    { title: 'Name Numerology Calculator', text: 'Check your name number in the Chaldean and Pythagorean systems.', href: '/calculators/name-numerology-calculator' },
    { title: 'Mobile Number Numerology', text: 'Find out whether your mobile number is lucky for you.', href: '/calculators/mobile-number-numerology' },
    { title: 'Kua Number Calculator', text: 'Know your lucky directions for home, sleep and work.', href: '/calculators/kua-number-calculator' },
  ],
  hi: [
    { title: 'मूलांक कैलकुलेटर', text: 'अपने जन्म के दिन से एक क्लिक में अपना मूलांक जानें।', href: '/calculators/moolank-calculator' },
    { title: 'भाग्यांक कैलकुलेटर', text: 'पूरी जन्म तिथि से अपना भाग्यांक जानें, मास्टर अंक 11, 22 और 33 सहित।', href: '/calculators/bhagyank-calculator' },
    { title: 'लो शू ग्रिड कैलकुलेटर', text: '3×3 ग्रिड में अपने अनुपस्थित और दोहराए गए अंक, प्लेन और राज योग देखें।', href: '/calculators/lo-shu-grid-calculator' },
    { title: 'नाम अंक ज्योतिष कैलकुलेटर', text: 'कैल्डियन और पाइथागोरियन पद्धति से अपना नामांक जाँचें।', href: '/calculators/name-numerology-calculator' },
    { title: 'मोबाइल नंबर अंक ज्योतिष', text: 'जानें कि आपका मोबाइल नंबर आपके लिए शुभ है या नहीं।', href: '/calculators/mobile-number-numerology' },
    { title: 'कुआ नंबर कैलकुलेटर', text: 'घर, सोने और काम के लिए अपनी शुभ दिशाएँ जानें।', href: '/calculators/kua-number-calculator' },
  ],
};

function calcSection(lang: Lang, kind: NumKind, n: number): Section {
  const name = lang === 'hi' ? (kind === 'mulank' ? 'मूलांक' : 'भाग्यांक') : (kind === 'mulank' ? 'Mulank' : 'Bhagyank');
  return { id: 'calculators', title: lang === 'hi' ? 'मुफ़्त अंक ज्योतिष कैलकुलेटर आज़माएँ' : 'Try the Free Numerology Calculators', blocks: [
    { kind: 'p', text: lang === 'hi'
      ? `${name} ${n} जानना पहला क़दम है। पूरी तस्वीर के लिए नीचे दिए मुफ़्त कैलकुलेटर उपयोग करें – कोई साइन-अप नहीं, तुरंत परिणाम। ये वही गणना-इंजन उपयोग करते हैं जो आचार्य नंदराम की रिपोर्ट में लगता है।`
      : `Knowing your ${name} ${n} is the first step. Use the free calculators below for the full picture – no sign-up, instant results. They use the same calculation engine as Acharya Nandram's reports.` },
    { kind: 'cards', items: CALCS[lang] },
  ] };
}

function luckyDates(lang: Lang, nums: number[]) {
  const days = [...new Set(nums.flatMap(DAYS_OF))].sort((a, b) => a - b);
  return days.join(', ') + (lang === 'hi' ? ' तारीख़' : '');
}

function yearSection(lang: Lang, kind: NumKind, n: number): Section {
  const name = lang === 'hi' ? (kind === 'mulank' ? 'मूलांक' : 'भाग्यांक') : (kind === 'mulank' ? 'Mulank' : 'Bhagyank');
  const rows = YEARS.map((y) => {
    const u = universalYear(y); const r = relationOf(n, u);
    return [String(y), `${u} · ${PY_THEMES[lang][u]}`, REL[lang][r], lang === 'hi'
      ? (r === 'friend' ? 'सहायक वर्ष: नई योजनाएँ शुरू करने और अवसर पकड़ने का समय।' : r === 'enemy' ? 'सावधानी का वर्ष: बड़े निर्णयों से पहले समय और उपायों पर ध्यान दें।' : 'संतुलित वर्ष: लगातार प्रयास से स्थिर प्रगति।')
      : (r === 'friend' ? 'A supportive year to start plans and take opportunities.' : r === 'enemy' ? 'A year for care: check timing and remedies before big decisions.' : 'A balanced year: steady effort brings steady progress.')];
  });
  return { id: 'years', title: lang === 'hi' ? `${name} ${n} के लिए ${YEARS[0]} और ${YEARS[1]}` : `${name} ${n} in ${YEARS[0]} and ${YEARS[1]}`, blocks: [
    { kind: 'p', text: lang === 'hi'
      ? `हर कैलेंडर वर्ष का एक सार्वभौमिक अंक होता है (वर्ष के अंकों का योग)। ${YEARS[0]} का अंक ${universalYear(YEARS[0])} और ${YEARS[1]} का अंक ${universalYear(YEARS[1])} है। नीचे देखें कि ये ${name} ${n} के साथ कैसे मेल खाते हैं। ध्यान दें: आपका व्यक्तिगत वर्ष आपके जन्मदिन से जन्मदिन तक चलता है और आपकी पूरी जन्म तिथि पर निर्भर करता है – इसे आपकी रिपोर्ट में अलग से निकाला जाता है।`
      : `Every calendar year has a universal number (the digits of the year added). ${YEARS[0]} is a ${universalYear(YEARS[0])} year and ${YEARS[1]} is a ${universalYear(YEARS[1])} year. Here is how they combine with ${name} ${n}. Note: your personal year runs from birthday to birthday and depends on your full date of birth – it is worked out separately in your report.` },
    { kind: 'table', head: lang === 'hi' ? ['वर्ष', 'वर्ष का अंक', 'संबंध', 'मार्गदर्शन'] : ['Year', 'Year number', 'Relation', 'Guidance'], rows },
  ] };
}

function compatTable(lang: Lang, n: number, label: string): Block {
  return { kind: 'table', head: lang === 'hi' ? [`साथी का ${label}`, 'मेल', 'अर्थ'] : [`Partner's ${label}`, 'Match', 'What it means'],
    rows: NUMS.map((m) => { const a = relationOf(n, m), b = relationOf(m, n); const s = (a === 'friend' ? 1 : a === 'enemy' ? -1 : 0) + (b === 'friend' ? 1 : b === 'enemy' ? -1 : 0);
      const v = m === n || s >= 2 ? 'excellent' : s === 1 ? 'good' : s === 0 ? 'mixed' : 'challenging';
      return [String(m), VERDICT[lang][v], m === n ? (lang === 'hi' ? 'समान अंक: गहरी समझ, पर एक जैसी कमियाँ भी।' : 'Same number: deep understanding, but shared weak spots too.') : pairNote(lang, a, b)]; }) };
}

/* ───────────────────────── Mulank ───────────────────────── */

function buildMulank(n: number, lang: Lang): NumberPost {
  const m = mulankFor(n, lang)!; const en = mulankFor(n, 'en')!;
  const p = planetOf(n); const T = (x: string) => tr(lang, x);
  const hi = lang === 'hi';
  const dates = DAYS_OF(n);
  const trait = NUMBER_TRAITS[lang][n];
  const slug = numberPostSlug('mulank', n);
  const title = hi ? `मूलांक ${n}: स्वभाव, करियर, विवाह, शुभ रंग और उपाय – संपूर्ण मार्गदर्शिका` : `Mulank ${n} Meaning: Personality, Career, Marriage & Remedies`;
  const h1 = hi ? `मूलांक ${n} (${m.title}): संपूर्ण मार्गदर्शिका` : `Mulank ${n} (${en.title}): The Complete Guide`;
  const description = clip(`Mulank ${n} (born on ${dates.join(', ')}): ${p.name}-ruled personality, career, marriage match, lucky colours & remedies by Acharya Nandram. Free calculator.`);
  const keywords = [`mulank ${n}`, `moolank ${n}`, `mulank ${n} personality`, `mulank ${n} career`, `mulank ${n} marriage compatibility`, `mulank ${n} lucky colour`, `mulank ${n} remedies`, `numerology number ${n}`, `मूलांक ${n}`];
  const sections: Section[] = [];

  sections.push({ id: 'intro', cta: true, title: hi ? `मूलांक ${n} क्या है?` : `What Is Mulank ${n}?`, blocks: [
    { kind: 'p', text: hi
      ? `यदि आपका जन्म किसी भी महीने की ${dates.join(', ')} तारीख़ को हुआ है, तो आपका मूलांक ${n} है। मूलांक (मूल अंक या रूट नंबर) आपके जन्म के दिन को एक अंक तक जोड़कर निकलता है। यह आपका मूल स्वभाव, सोचने का तरीक़ा और वह पहली छाप बताता है जो आप दूसरों पर छोड़ते हैं। मूलांक ${n} के स्वामी ग्रह ${m.planet} हैं और इसका मुख्य गुण है "${trait.keyword}"।`
      : `If you were born on the ${dates.join(', ')} of any month, your Mulank is ${n}. Mulank (also spelled Moolank, the root or psychic number) is your day of birth reduced to a single digit. It describes your core nature, the way you think and the first impression you make. Mulank ${n} is ruled by ${p.name} (${p.hindiName}) and its key quality is "${trait.keyword.toLowerCase()}".` },
    { kind: 'p', text: m.intro },
    { kind: 'table', head: hi ? ['विषय', 'मूलांक ' + n] : ['Quick facts', `Mulank ${n}`], rows: [
      [hi ? 'स्वामी ग्रह' : 'Ruling planet', m.planet], [hi ? 'तत्व' : 'Element', m.element], [hi ? 'दिशा' : 'Direction', m.direction],
      [hi ? 'शुभ अंक' : 'Lucky numbers', m.luckyNumbers.join(', ')], [hi ? 'शुभ रंग' : 'Lucky colours', m.luckyColors.join(', ')], [hi ? 'शुभ दिन' : 'Lucky days', m.luckyDays.join(', ')],
      [hi ? 'रत्न' : 'Gemstone', m.gemstone], [hi ? 'धातु' : 'Metal', m.metal], [hi ? 'मित्र अंक' : 'Friendly numbers', m.compatible.join(', ')], [hi ? 'सावधानी वाले अंक' : 'Numbers to be careful with', m.avoid.join(', ')],
    ] },
  ] });

  sections.push({ id: 'calculate', title: hi ? `मूलांक ${n} कैसे निकालें` : `How to Calculate Mulank ${n}`, blocks: [
    { kind: 'p', text: hi ? 'केवल जन्म का दिन लें (महीना और वर्ष नहीं) और उसके अंकों को तब तक जोड़ें जब तक एक अंक न बचे:' : 'Take only the day of birth (not the month or year) and add its digits until one digit is left:' },
    { kind: 'list', items: dates.map((d) => d < 10 ? (hi ? `${d} तारीख़ → मूलांक ${d}` : `Born on the ${d} → Mulank ${d}`) : (hi ? `${d} तारीख़ → ${String(d).split('').join(' + ')} = ${digitSum(String(d))}${digitSum(String(d)) > 9 ? ` → ${reduce(d)}` : ''} → मूलांक ${n}` : `Born on the ${d} → ${String(d).split('').join(' + ')} = ${digitSum(String(d))}${digitSum(String(d)) > 9 ? ` → ${reduce(d)}` : ''} → Mulank ${n}`)) },
    { kind: 'p', text: hi ? 'यह जाँचने के लिए नीचे दिए मुफ़्त मूलांक कैलकुलेटर का उपयोग करें। मूलांक के साथ भाग्यांक (पूरी जन्म तिथि का योग) भी देखें, क्योंकि दोनों मिलकर ही पूरी कहानी बताते हैं।' : 'Use the free Moolank calculator below to check. Also look at your Bhagyank (the total of your full date of birth), because the two numbers together tell the full story.' },
  ] });

  sections.push({ id: 'personality', title: hi ? `मूलांक ${n} का स्वभाव और व्यक्तित्व` : `Mulank ${n} Personality and Nature`, blocks: [
    { kind: 'p', text: hi ? `मूलांक ${n} वाले लोग ${m.tagline} इनके मुख्य गुण हैं:` : `People with Mulank ${n}: ${en.tagline.charAt(0).toLowerCase() + en.tagline.slice(1)} Their key traits are:` },
    { kind: 'list', items: m.traits },
    { kind: 'p', text: hi ? `सकारात्मक पक्ष: ${trait.plus}। जिन बातों का ध्यान रखें: ${trait.minus}।` : `On the positive side they are ${trait.plus.toLowerCase()}. What to watch: ${trait.minus.toLowerCase()}.` },
  ] });

  sections.push({ id: 'strengths', title: hi ? `मूलांक ${n} की ख़ूबियाँ और चुनौतियाँ` : `Mulank ${n} Strengths and Challenges`, blocks: [
    { kind: 'table', head: hi ? ['ख़ूबियाँ', 'चुनौतियाँ'] : ['Strengths', 'Challenges'], rows: m.strengths.map((s, i) => [s, m.challenges[i] ?? '']) },
    { kind: 'p', text: hi ? `चुनौतियाँ भाग्य नहीं हैं – ये वे क्षेत्र हैं जहाँ थोड़ी जागरूकता बड़ा अंतर लाती है। सही नाम-वर्तनी, मोबाइल नंबर और ${p.devanagari} के सरल उपाय मूलांक ${n} की ऊर्जा को संतुलित करते हैं।` : `Challenges are not fate – they are areas where a little awareness makes a big difference. The right name spelling, mobile number and simple ${p.name} remedies keep Mulank ${n} energy balanced.` },
  ] });

  sections.push({ id: 'career', title: hi ? `मूलांक ${n} के लिए करियर और व्यवसाय` : `Best Career and Business for Mulank ${n}`, blocks: [
    { kind: 'p', text: m.career },
    { kind: 'p', text: hi ? `${p.devanagari} से जुड़े अनुकूल क्षेत्र:` : `Fields linked with ${p.name}:` },
    { kind: 'list', items: p.careers.map(T) },
    { kind: 'p', text: hi ? `व्यवसाय का नाम, लॉन्च की तारीख़ और बिज़नेस मोबाइल नंबर मूलांक ${n} के मित्र अंकों (${m.compatible.join(', ')}) से मेल खाएँ तो प्रयास को सहारा मिलता है।` : `When your business name, launch date and business mobile number match the friendly numbers of Mulank ${n} (${m.compatible.join(', ')}), your effort gets extra support.` },
  ] });

  sections.push({ id: 'love', cta: true, title: hi ? `मूलांक ${n}: प्रेम, विवाह और अनुकूलता` : `Mulank ${n} Love, Marriage and Compatibility`, blocks: [
    { kind: 'p', text: m.relationships },
    { kind: 'p', text: hi ? `नीचे मूलांक ${n} का हर मूलांक के साथ मेल दिया गया है। यह हमारी अंक-मित्रता तालिका से निकाला गया है – वही तालिका जो हर रिपोर्ट और जोड़ी-मिलान स्कोर में उपयोग होती है।` : `Here is how Mulank ${n} matches with every Mulank. It comes from our number friendship table – the same table used in every report and couple-compatibility score.` },
    compatTable(lang, n, hi ? 'मूलांक' : 'Mulank'),
    { kind: 'p', text: hi ? 'केवल मूलांक से विवाह का निर्णय न लें। भाग्यांक, नामांक और दोनों के लो शू ग्रिड साथ देखने पर ही सही तस्वीर बनती है – यही जोड़ी-मिलान रीडिंग में किया जाता है।' : 'Do not decide a marriage on Mulank alone. Bhagyank, name number and both Lo Shu grids together give the real picture – which is exactly what the couple compatibility reading does.' },
  ] });

  sections.push({ id: 'health', title: hi ? `मूलांक ${n} का स्वास्थ्य` : `Mulank ${n} Health`, blocks: [
    { kind: 'p', text: m.health },
    { kind: 'p', text: hi ? 'यह पारंपरिक अंक ज्योतिष का मार्गदर्शन है, चिकित्सा सलाह नहीं। कोई भी स्वास्थ्य समस्या हो तो डॉक्टर से परामर्श करें।' : 'This is traditional numerology guidance, not medical advice. Always consult a doctor for any health concern.' },
  ] });

  sections.push({ id: 'money', title: hi ? `मूलांक ${n} और धन` : `Mulank ${n} Money and Wealth`, blocks: [{ kind: 'p', text: m.money }] });

  sections.push({ id: 'combo', title: hi ? `मूलांक ${n} और भाग्यांक का मेल` : `Mulank ${n} with Every Bhagyank`, blocks: [
    { kind: 'p', text: hi ? `मूलांक बताता है कि आप कैसे हैं; भाग्यांक बताता है कि जीवन आपको कहाँ ले जाता है। जब दोनों मित्र हों तो प्रयास और भाग्य एक दिशा में चलते हैं। मूलांक ${n} के साथ हर भाग्यांक:` : `Mulank shows who you are; Bhagyank shows where life takes you. When the two are friends, effort and fortune move in the same direction. Mulank ${n} with each Bhagyank:` },
    { kind: 'table', head: hi ? ['भाग्यांक', 'मेल', 'अर्थ'] : ['Bhagyank', 'Combination', 'What it means'], rows: NUMS.map((b) => { const c = mulankBhagyankCombo(n, b); return [String(b), VERDICT[lang][c.verdict], b === n ? (hi ? 'एक ही अंक दोहराया: गुण बहुत प्रबल, संतुलन ज़रूरी।' : 'Same number twice: very strong qualities, balance needed.') : pairNote(lang, c.rel, c.back)]; }) },
  ] });

  sections.push({ id: 'lucky', title: hi ? `मूलांक ${n} के लिए शुभ अंक, रंग, दिन और रत्न` : `Lucky Numbers, Colours, Days and Gemstone for Mulank ${n}`, blocks: [
    { kind: 'table', head: hi ? ['शुभ विवरण', 'मूलांक ' + n] : ['Lucky detail', `Mulank ${n}`], rows: [
      [hi ? 'शुभ अंक' : 'Lucky numbers', m.luckyNumbers.join(', ')],
      [hi ? 'शुभ तारीख़ें' : 'Lucky dates', luckyDates(lang, m.luckyNumbers)],
      [hi ? 'शुभ रंग' : 'Lucky colours', m.luckyColors.join(', ')],
      [hi ? 'शुभ दिन' : 'Lucky days', m.luckyDays.join(', ')],
      [hi ? 'रत्न और धातु' : 'Gemstone & metal', `${m.gemstone} · ${m.metal}`],
      [hi ? 'उँगली' : 'Finger', T(p.gemstone.finger)],
      [hi ? 'मंत्र' : 'Mantra', `${T(p.mantra.beej)} (${p.mantra.dailyCount}×)`],
      [hi ? 'व्रत का दिन' : 'Fasting day', T(p.fastingDay)],
      [hi ? 'रुद्राक्ष' : 'Rudraksha', T(p.rudraksha)],
    ] },
    { kind: 'p', text: T(p.gemstone.caution) },
  ] });

  sections.push(yearSection(lang, 'mulank', n));

  sections.push({ id: 'remedies', title: hi ? `मूलांक ${n} के सरल उपाय` : `Simple Remedies for Mulank ${n}`, blocks: [
    { kind: 'list', items: [...m.remedies, ...(hi ? [`दान: ${p.daan.map(T).join(', ')}`, `हस्ताक्षर: ${T(p.signatureTip)}`] : [`Daan (charity): ${p.daan.join(', ')}`, `Signature: ${p.signatureTip}`])] },
    { kind: 'p', text: hi ? 'उपाय तब सबसे अच्छा काम करते हैं जब वे आपके पूरे चार्ट – भाग्यांक, लो शू ग्रिड में अनुपस्थित अंक, नाम और मोबाइल – के अनुसार चुने जाएँ।' : 'Remedies work best when chosen for your full chart – Bhagyank, missing numbers in the Lo Shu grid, name and mobile number.' },
  ] });

  sections.push(calcSection(lang, 'mulank', n));

  const faqs = hi ? [
    { q: `मूलांक ${n} किन तारीख़ों में जन्मे लोगों का होता है?`, a: `किसी भी महीने की ${dates.join(', ')} तारीख़ को जन्मे लोगों का मूलांक ${n} होता है।` },
    { q: `मूलांक ${n} का स्वामी ग्रह कौन है?`, a: `मूलांक ${n} के स्वामी ${m.planet} हैं।` },
    { q: `मूलांक ${n} के लिए शुभ रंग कौन-से हैं?`, a: `${m.luckyColors.join(', ')}। शुभ दिन: ${m.luckyDays.join(', ')}।` },
    { q: `मूलांक ${n} की शादी किस मूलांक से अच्छी रहती है?`, a: `मूलांक ${m.compatible.join(', ')} के साथ अच्छा मेल रहता है; ${m.avoid.join(', ')} के साथ अतिरिक्त समझ और उपाय की ज़रूरत होती है। सही निर्णय के लिए पूरा जोड़ी-मिलान देखें।` },
    { q: `मूलांक ${n} के लिए कौन-सा रत्न है?`, a: `${m.gemstone}। कोई भी रत्न पहनने से पहले योग्य विशेषज्ञ से पूरा चार्ट जँचवाएँ।` },
    { q: 'मूलांक और भाग्यांक में क्या अंतर है?', a: 'मूलांक जन्म के दिन से निकलता है और स्वभाव बताता है; भाग्यांक पूरी जन्म तिथि से निकलता है और जीवन की दिशा बताता है।' },
    { q: 'क्या मैं अपना मूलांक मुफ़्त में जाँच सकता हूँ?', a: 'हाँ, इस साइट के मुफ़्त मूलांक, भाग्यांक, लो शू ग्रिड, नाम और मोबाइल नंबर कैलकुलेटर बिना साइन-अप के उपयोग करें।' },
  ] : [
    { q: `Which dates of birth have Mulank ${n}?`, a: `Anyone born on the ${dates.join(', ')} of any month has Mulank ${n}.` },
    { q: `Which planet rules Mulank ${n}?`, a: `Mulank ${n} is ruled by ${p.name} (${p.hindiName}).` },
    { q: `What is the lucky colour for Mulank ${n}?`, a: `${en.luckyColors.join(', ')}. Lucky days: ${en.luckyDays.join(', ')}.` },
    { q: `Which Mulank is best for marriage with Mulank ${n}?`, a: `Mulank ${en.compatible.join(', ')} match well; ${en.avoid.join(', ')} need extra understanding and remedies. Check full couple compatibility before deciding.` },
    { q: `Which gemstone suits Mulank ${n}?`, a: `${en.gemstone}. Have your full chart checked by a qualified expert before wearing any gemstone.` },
    { q: 'What is the difference between Mulank and Bhagyank?', a: 'Mulank comes from the day of birth and shows your nature; Bhagyank comes from the full date of birth and shows the direction of your life.' },
    { q: 'Can I check my Mulank for free?', a: 'Yes. Use the free Moolank, Bhagyank, Lo Shu grid, name and mobile number calculators on this site – no sign-up needed.' },
  ];
  sections.push({ id: 'faq', title: hi ? `मूलांक ${n}: अक्सर पूछे जाने वाले प्रश्न` : `Mulank ${n}: Frequently Asked Questions`, blocks: [] });
  return finish({ kind: 'mulank', n, slug, title, h1, description, keywords, sections, faqs });
}

/* ───────────────────────── Bhagyank ───────────────────────── */

function buildBhagyank(n: number, lang: Lang): NumberPost {
  const b = bhagyankFor(n, lang)!; const en = bhagyankFor(n, 'en')!;
  const p = planetOf(n); const T = (x: string) => tr(lang, x);
  const hi = lang === 'hi';
  const ex = bhagyankExamples(n);
  const slug = numberPostSlug('bhagyank', n);
  const master = n === 2 ? 11 : n === 4 ? 22 : n === 6 ? 33 : null;
  const title = hi ? `भाग्यांक ${n}: भाग्य, करियर, विवाह, धन और उपाय – संपूर्ण मार्गदर्शिका` : `Bhagyank ${n} Meaning: Destiny, Career, Marriage, Money & Remedies`;
  const h1 = hi ? `भाग्यांक ${n} (${b.title}): संपूर्ण मार्गदर्शिका` : `Bhagyank ${n} (${en.title}): The Complete Guide`;
  const description = clip(`Bhagyank ${n}${master ? ` (master ${master})` : ''} destiny number meaning: life purpose, career, marriage, money, lucky colours & remedies by Acharya Nandram. Free calculator.`);
  const keywords = [`bhagyank ${n}`, `destiny number ${n}`, `life path number ${n}`, `bhagyank ${n} career`, `bhagyank ${n} marriage`, `bhagyank ${n} remedies`, `bhagyank ${n} lucky colour`, ...(master ? [`master number ${master}`] : []), `भाग्यांक ${n}`];
  const sections: Section[] = [];

  sections.push({ id: 'intro', cta: true, title: hi ? `भाग्यांक ${n} क्या है?` : `What Is Bhagyank ${n}?`, blocks: [
    { kind: 'p', text: hi
      ? `भाग्यांक (भाग्य अंक, जिसे डेस्टिनी नंबर या लाइफ़ पाथ नंबर भी कहते हैं) आपकी पूरी जन्म तिथि – दिन, महीना और वर्ष – के सभी अंकों का योग है, जिसे एक अंक तक घटाया जाता है। जिनका योग ${n} आता है, उनका भाग्यांक ${n} होता है। इसके स्वामी ${b.planet} हैं और इसका सार है: "${b.tagline}"`
      : `Bhagyank (the destiny or life path number) is the total of every digit in your full date of birth – day, month and year – reduced to one digit. When the total comes to ${n}, your Bhagyank is ${n}. It is ruled by ${p.name} (${p.hindiName}) and its essence is: "${en.tagline}"` },
    { kind: 'p', text: b.intro },
    { kind: 'table', head: hi ? ['विषय', 'भाग्यांक ' + n] : ['Quick facts', `Bhagyank ${n}`], rows: [
      [hi ? 'स्वामी ग्रह' : 'Ruling planet', b.planet], [hi ? 'तत्व' : 'Element', b.element], [hi ? 'दिशा' : 'Direction', b.direction],
      [hi ? 'शुभ रंग' : 'Lucky colours', b.luckyColors.join(', ')], [hi ? 'शुभ दिन' : 'Lucky days', b.luckyDays.join(', ')], [hi ? 'रत्न' : 'Gemstone', b.gemstone],
      [hi ? 'मित्र अंक' : 'Friendly numbers', b.compatible.join(', ')], [hi ? 'सावधानी वाले अंक' : 'Numbers to be careful with', b.avoid.join(', ')],
      ...(master ? [[hi ? 'मास्टर अंक' : 'Master number', String(master)]] : []),
    ] },
  ] });

  sections.push({ id: 'calculate', title: hi ? `भाग्यांक ${n} कैसे निकालें (उदाहरण सहित)` : `How to Calculate Bhagyank ${n} (with Examples)`, blocks: [
    { kind: 'p', text: hi ? 'जन्म तिथि DD-MM-YYYY में लिखें, सभी आठ अंक जोड़ें और योग को तब तक जोड़ते रहें जब तक एक अंक न बचे। ये वास्तविक तारीख़ें भाग्यांक ' + n + ' देती हैं:' : `Write your date of birth as DD-MM-YYYY, add all eight digits and keep adding the total until one digit is left. These real dates give Bhagyank ${n}:` },
    { kind: 'steps', items: ex.map((e) => ({ title: e.date, text: e.steps })) },
    ...(master ? [{ kind: 'p' as const, text: b.master! }] : []),
    { kind: 'p', text: hi ? 'अपनी तारीख़ तुरंत जाँचने के लिए मुफ़्त भाग्यांक कैलकुलेटर उपयोग करें – यह मास्टर अंक भी दिखाता है।' : 'Use the free Bhagyank calculator to check your own date instantly – it also shows master numbers.' },
  ] });

  sections.push({ id: 'purpose', title: hi ? `भाग्यांक ${n}: जीवन का उद्देश्य और सबक` : `Bhagyank ${n} Life Purpose and Lessons`, blocks: [
    { kind: 'p', text: hi ? `जीवन का उद्देश्य: ${b.purpose}` : `Life purpose: ${en.purpose}` },
    { kind: 'p', text: hi ? 'इस जीवन-पथ के मुख्य सबक:' : 'The key lessons of this life path:' },
    { kind: 'list', items: b.lessons },
  ] });

  sections.push({ id: 'strengths', title: hi ? `भाग्यांक ${n} की ख़ूबियाँ और चुनौतियाँ` : `Bhagyank ${n} Strengths and Challenges`, blocks: [
    { kind: 'table', head: hi ? ['ख़ूबियाँ', 'चुनौतियाँ'] : ['Strengths', 'Challenges'], rows: b.strengths.map((s, i) => [s, b.challenges[i] ?? '']) },
  ] });

  sections.push({ id: 'career', title: hi ? `भाग्यांक ${n} के लिए करियर और व्यवसाय` : `Best Career and Business for Bhagyank ${n}`, blocks: [
    { kind: 'p', text: b.career },
    { kind: 'p', text: hi ? `${p.devanagari} से जुड़े अनुकूल क्षेत्र:` : `Fields linked with ${p.name}:` },
    { kind: 'list', items: p.careers.map(T) },
  ] });

  sections.push({ id: 'love', cta: true, title: hi ? `भाग्यांक ${n}: विवाह और रिश्ते` : `Bhagyank ${n} Marriage and Relationships`, blocks: [
    { kind: 'p', text: b.relationships },
    { kind: 'p', text: hi ? `साथी के भाग्यांक के साथ भाग्यांक ${n} का मेल:` : `How Bhagyank ${n} matches with a partner's Bhagyank:` },
    compatTable(lang, n, hi ? 'भाग्यांक' : 'Bhagyank'),
  ] });

  sections.push({ id: 'money', title: hi ? `भाग्यांक ${n}: धन और आध्यात्मिक उन्नति` : `Bhagyank ${n} Money and Spiritual Growth`, blocks: [
    { kind: 'p', text: b.money }, { kind: 'p', text: b.spiritual },
  ] });

  sections.push({ id: 'combo', title: hi ? `हर मूलांक के साथ भाग्यांक ${n}` : `Bhagyank ${n} with Every Mulank`, blocks: [
    { kind: 'p', text: hi ? 'आपका मूलांक (जन्म का दिन) आपका स्वभाव है और भाग्यांक आपकी दिशा। दोनों का मेल बताता है कि प्रयास कितनी आसानी से परिणाम में बदलता है:' : 'Your Mulank (day of birth) is your nature and your Bhagyank is your direction. Their combination shows how easily effort turns into results:' },
    { kind: 'table', head: hi ? ['मूलांक', 'मेल', 'अर्थ'] : ['Mulank', 'Combination', 'What it means'], rows: NUMS.map((m) => { const c = mulankBhagyankCombo(m, n); return [String(m), VERDICT[lang][c.verdict], m === n ? (hi ? 'एक ही अंक दोहराया: गुण बहुत प्रबल, संतुलन ज़रूरी।' : 'Same number twice: very strong qualities, balance needed.') : pairNote(lang, c.rel, c.back)]; }) },
  ] });

  sections.push({ id: 'lucky', title: hi ? `भाग्यांक ${n} के लिए शुभ रंग, दिन, रत्न और मंत्र` : `Lucky Colours, Days, Gemstone and Mantra for Bhagyank ${n}`, blocks: [
    { kind: 'table', head: hi ? ['शुभ विवरण', 'भाग्यांक ' + n] : ['Lucky detail', `Bhagyank ${n}`], rows: [
      [hi ? 'शुभ तारीख़ें' : 'Lucky dates', luckyDates(lang, [n, ...b.compatible])],
      [hi ? 'शुभ रंग' : 'Lucky colours', b.luckyColors.join(', ')],
      [hi ? 'शुभ दिन' : 'Lucky days', b.luckyDays.join(', ')],
      [hi ? 'रत्न' : 'Gemstone', b.gemstone],
      [hi ? 'मंत्र' : 'Mantra', `${T(p.mantra.beej)} (${p.mantra.dailyCount}×)`],
      [hi ? 'देवता' : 'Deity', T(p.deity)],
      [hi ? 'व्रत का दिन' : 'Fasting day', T(p.fastingDay)],
    ] },
    { kind: 'p', text: T(p.gemstone.caution) },
  ] });

  sections.push(yearSection(lang, 'bhagyank', n));

  sections.push({ id: 'remedies', title: hi ? `भाग्यांक ${n} के सरल उपाय` : `Simple Remedies for Bhagyank ${n}`, blocks: [
    { kind: 'list', items: [...b.remedies, hi ? `दान: ${p.daan.map(T).join(', ')}` : `Daan (charity): ${p.daan.join(', ')}`] },
  ] });

  sections.push(calcSection(lang, 'bhagyank', n));

  const faqs = hi ? [
    { q: `भाग्यांक ${n} का अर्थ क्या है?`, a: `भाग्यांक ${n} "${b.title}" है: ${b.purpose}` },
    { q: `भाग्यांक ${n} का स्वामी ग्रह कौन है?`, a: `भाग्यांक ${n} के स्वामी ${b.planet} हैं।` },
    { q: `भाग्यांक ${n} के लिए कौन-सा करियर अच्छा है?`, a: p.careers.map(T).join(', ') + ' – साथ ही आपके मूलांक और नाम के अनुसार।' },
    { q: `भाग्यांक ${n} की शादी किस अंक से अच्छी है?`, a: `${b.compatible.join(', ')} के साथ अच्छा मेल; ${b.avoid.join(', ')} के साथ अतिरिक्त समझ ज़रूरी। निर्णय से पहले पूरा जोड़ी-मिलान देखें।` },
    ...(master ? [{ q: `क्या भाग्यांक ${n} मास्टर अंक ${master} हो सकता है?`, a: b.master! }] : []),
    { q: 'भाग्यांक कैसे निकालते हैं?', a: 'जन्म तिथि के सभी अंक (DD-MM-YYYY) जोड़ें और योग को एक अंक तक घटाएँ। या मुफ़्त भाग्यांक कैलकुलेटर उपयोग करें।' },
    { q: 'क्या भाग्यांक बदला जा सकता है?', a: 'नहीं, भाग्यांक जन्म तिथि से तय होता है। पर नाम, हस्ताक्षर, मोबाइल नंबर और उपायों को इसके अनुकूल बनाया जा सकता है।' },
  ] : [
    { q: `What does Bhagyank ${n} mean?`, a: `Bhagyank ${n} is "${en.title}": ${en.purpose}` },
    { q: `Which planet rules Bhagyank ${n}?`, a: `Bhagyank ${n} is ruled by ${p.name} (${p.hindiName}).` },
    { q: `Which career is best for Bhagyank ${n}?`, a: `${p.careers.join(', ')} – fine-tuned to your Mulank and name.` },
    { q: `Which number is best for marriage with Bhagyank ${n}?`, a: `${en.compatible.join(', ')} match well; ${en.avoid.join(', ')} need extra understanding. Check full couple compatibility before deciding.` },
    ...(master ? [{ q: `Can Bhagyank ${n} be master number ${master}?`, a: en.master! }] : []),
    { q: 'How do I calculate my Bhagyank?', a: 'Add all digits of your date of birth (DD-MM-YYYY) and reduce the total to one digit, or use the free Bhagyank calculator.' },
    { q: 'Can my Bhagyank be changed?', a: 'No, it is fixed by your date of birth. Your name, signature, mobile number and remedies can be aligned with it.' },
  ];
  sections.push({ id: 'faq', title: hi ? `भाग्यांक ${n}: अक्सर पूछे जाने वाले प्रश्न` : `Bhagyank ${n}: Frequently Asked Questions`, blocks: [] });
  return finish({ kind: 'bhagyank', n, slug, title, h1, description, keywords, sections, faqs });
}

function finish(p: Omit<NumberPost, 'readMinutes' | 'wordCount'>): NumberPost {
  const text = [p.h1, ...p.sections.flatMap((s) => [s.title, ...s.blocks.flatMap((b) => {
    switch (b.kind) { case 'p': return [b.text]; case 'list': return b.items; case 'cards': return b.items.flatMap((x) => [x.title, x.text]); case 'steps': return b.items.flatMap((x) => [x.title, x.text]); case 'table': return [...b.head, ...b.rows.flat()]; default: return []; }
  })]), ...p.faqs.flatMap((f) => [f.q, f.a])].join(' ');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return { ...p, wordCount, readMinutes: Math.max(4, Math.round(wordCount / 200)) };
}

export function buildNumberPost(kind: NumKind, n: number, lang: Lang = 'en'): NumberPost {
  return kind === 'mulank' ? buildMulank(n, lang) : buildBhagyank(n, lang);
}
