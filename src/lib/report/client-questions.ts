/**
 * "Your Questions Answered" – every report answers the questions (and problems / challenges) the client wrote in the
 * booking form, with realistic, practical suggestions from their own numbers.
 *
 * The facts always come from the engine (Moolank, Bhagyank, personal year and months, favourable years, lucky days,
 * colours and numbers, remedies). When an AI provider is configured it writes the answers in natural language from
 * those facts; otherwise – or if the AI reply is unusable – the built-in rules below write them. Answers never promise
 * outcomes, and health, legal and money questions always point to the right professional as well.
 */
import { generateNumerology, type DateParts } from '@/lib/numerology';
import { planetOf } from '@/lib/numerology/data/planets';
import { configFromEnv, providerFromConfig } from '@/lib/narrative/providers/llm';
import { tr } from '@/lib/i18n/hi-terms';

export type QaLang = 'en' | 'hi';
export interface QA { q: string; a: string }
export interface QuestionInput {
  questions?: string | null; challenges?: string | null;
  name?: string | null; dob: string; gender?: string | null;
  serviceCode?: string; lang: QaLang; asOf?: DateParts;
}

export const MAX_QUESTIONS = 6;

/** Splits the client's text into separate questions (numbered lists, lines, question marks). */
export function parseQuestions(questions?: string | null, challenges?: string | null): string[] {
  const split = (s: string) => s
    .replace(/\r/g, '')
    .split(/\n+|(?<=[?।])\s+|(?:^|\s)(?:\d{1,2}|[a-z])[.)]\s+/i)
    .map((x) => x.replace(/^[\s\-•*–]+/, '').replace(/^(?:\d{1,2}|[a-z])[.)]\s+/i, '').trim())
    .filter((x) => x.replace(/[^\p{L}\p{N}]/gu, '').length >= 6);
  const qs = split(questions ?? '');
  const ch = split(challenges ?? '').map((x) => (/[?？]$/.test(x) ? x : x));
  const seen = new Set<string>();
  return [...qs, ...ch].filter((x) => { const k = x.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, MAX_QUESTIONS).map((x) => x.slice(0, 400));
}

/* ---------- topics ---------- */
type Topic = 'marriage' | 'love' | 'career' | 'business' | 'money' | 'property' | 'health' | 'education' | 'children' | 'travel' | 'legal' | 'name' | 'mobile' | 'family' | 'general';
const TOPIC_WORDS: [Topic, RegExp][] = [
  ['marriage', /marri|wedding|shaadi|shadi|vivah|विवाह|शादी|rishta|रिश्ता|spouse|husband|wife|pati|patni|पति|पत्नी|divorce|talaq|तलाक/i],
  ['love', /love|relationship|partner|boyfriend|girlfriend|breakup|pyar|प्यार|प्रेम|prem/i],
  ['children', /child|baby|pregnan|conceiv|santan|संतान|bachch|बच्च|beta|beti|बेटा|बेटी|son\b|daughter/i],
  ['business', /business|vyapar|vyavsay|व्यापार|व्यवसाय|dukan|दुकान|shop|startup|company|firm|partnership|brand|client|customer|dhandha|धंधा/i],
  ['career', /job|career|naukri|नौकरी|promotion|transfer|interview|office|boss|salary|government job|sarkari|सरकारी|profession|work|काम|kaam/i],
  ['money', /money|paisa|पैसा|dhan|धन|loan|debt|karz|कर्ज़|कर्ज|finance|invest|saving|income|loss|nuksan|नुकसान|stock|share market|wealth/i],
  ['health', /health|sehat|सेहत|स्वास्थ्य|disease|illness|bimari|बीमारी|stress|anxiety|depress|sleep|neend|नींद|weight|pain|surgery|operation|doctor/i],
  ['education', /study|studies|exam|education|padhai|पढ़ाई|college|school|degree|admission|competitive|upsc|neet|jee|result|marks|course/i],
  ['travel', /abroad|foreign|videsh|विदेश|visa|travel|settle|immigrat|canada|usa|america|uk\b|australia|dubai|relocat|shift/i],
  ['legal', /court|case|legal|kanoon|कानून|मुकदमा|mukadma|police|dispute|vivad|विवाद|litigation|lawyer/i],
  ['family', /family|parivar|परिवार|parents|mother|father|\bmaa\b|papa|saas|सास|in-?law|brother|sister|bhai|behen|argument|quarrel|fight|jhagd|झगड़|kalah|कलह|at home|ghar me|घर में|peace/i],
  ['name', /name|naam|नाम|spelling|signature|hastakshar|हस्ताक्षर/i],
  ['property', /property|house|flat\b|plot|land\b|zameen|ज़मीन|जमीन|makaan|मकान|vehicle|\bcar\b|gaadi|गाड़ी|buy (?:a |my )?home|new home|ghar (?:lena|kharid)|घर (?:लेना|खरीद)/i],
  ['mobile', /mobile|phone|number|नंबर|sim/i],
];
export function topicOf(q: string): Topic {
  for (const [t, re] of TOPIC_WORDS) if (re.test(q)) return t;
  return 'general';
}

/** Personal years that support each kind of step (house rules: marriage 2/6, job change 1/5, business 1/3/5, property 4/6/8). */
const TOPIC_YEARS: Record<Topic, number[]> = {
  marriage: [2, 6], love: [2, 6, 3], children: [2, 6], career: [1, 5, 8], business: [1, 3, 5, 8], money: [8, 4, 1], property: [4, 6, 8],
  health: [4, 7, 9], education: [3, 7, 1], travel: [5, 9], legal: [8, 9, 4], name: [1, 3], mobile: [1, 5], family: [6, 2, 4], general: [1, 3, 5, 8],
};

const PY_THEME: Record<number, { en: string; hi: string }> = {
  1: { en: 'a year of new beginnings – start things, take the lead, apply and launch', hi: 'नई शुरुआत का वर्ष – काम शुरू करें, पहल करें, आवेदन करें और नई योजना लॉन्च करें' },
  2: { en: 'a year of patience, partnership and relationships – cooperate, wait for the right moment, avoid force', hi: 'धैर्य, साझेदारी और रिश्तों का वर्ष – सहयोग करें, सही समय की प्रतीक्षा करें, ज़ोर-ज़बरदस्ती से बचें' },
  3: { en: 'a year of growth, learning and expression – communicate, network, study and show your work', hi: 'विकास, सीखने और अभिव्यक्ति का वर्ष – बातचीत करें, संपर्क बढ़ाएँ, पढ़ाई करें और अपना काम दिखाएँ' },
  4: { en: 'a year of hard work and foundations – plan, organise, save and build step by step', hi: 'मेहनत और नींव का वर्ष – योजना बनाएँ, व्यवस्थित रहें, बचत करें और कदम-दर-कदम आगे बढ़ें' },
  5: { en: 'a year of change and movement – travel, new opportunities and quick decisions, but avoid impulsive risks', hi: 'बदलाव और गति का वर्ष – यात्रा, नए अवसर और तेज़ निर्णय, पर जल्दबाज़ी के जोखिम से बचें' },
  6: { en: 'a year of family, home and responsibility – marriage, home matters and caring for others are favoured', hi: 'परिवार, घर और ज़िम्मेदारी का वर्ष – विवाह, घर से जुड़े काम और परिवार की देखभाल शुभ है' },
  7: { en: 'a year of inner work and study – research, health, spiritual practice; not ideal for big risks', hi: 'आत्मचिंतन और अध्ययन का वर्ष – शोध, स्वास्थ्य और साधना; बड़े जोखिम के लिए उचित समय नहीं' },
  8: { en: 'a year of money, power and results – career growth, business and financial decisions; work with discipline', hi: 'धन, शक्ति और परिणाम का वर्ष – करियर, व्यापार और धन के निर्णय; अनुशासन से काम करें' },
  9: { en: 'a year of completion – finish pending work, clear old issues and prepare for the next cycle', hi: 'पूर्णता का वर्ष – अधूरे काम पूरे करें, पुराने मामले सुलझाएँ और अगले चक्र की तैयारी करें' },
};

const ADVICE: Record<Topic, { en: string; hi: string }> = {
  marriage: { en: 'For marriage talks, meet and finalise in the favourable period shown above, prefer your lucky days for first meetings and the engagement, and check the partner\'s Moolank and Bhagyank for harmony before deciding. Family understanding, honest communication and practical matters (career, values, finances) matter as much as the numbers.', hi: 'विवाह की बातचीत के लिए ऊपर दिए शुभ समय में मुलाकात और निर्णय करें, पहली मुलाकात और सगाई के लिए अपने शुभ दिन चुनें, और निर्णय से पहले साथी के मूलांक-भाग्यांक का मिलान अवश्य कराएँ। परिवार की समझ, खुली बातचीत और व्यावहारिक बातें (करियर, मूल्य, आर्थिक स्थिति) अंकों जितनी ही महत्वपूर्ण हैं।' },
  love: { en: 'In relationships, give time and clear communication rather than pressure. Plan important conversations on your lucky days, and check both partners\' numbers for compatibility before a long-term commitment.', hi: 'रिश्तों में दबाव के बजाय समय और स्पष्ट बातचीत दें। ज़रूरी बातचीत अपने शुभ दिनों में करें और लंबी प्रतिबद्धता से पहले दोनों के अंकों का मिलान करा लें।' },
  children: { en: 'For family planning, the favourable years above are supportive; follow your doctor\'s guidance for all medical decisions. Keep the home calm and positive, and use the remedies below for peace of mind.', hi: 'संतान की योजना के लिए ऊपर दिए वर्ष सहायक हैं; चिकित्सा से जुड़े हर निर्णय में डॉक्टर की सलाह मानें। घर का वातावरण शांत और सकारात्मक रखें और मन की शांति के लिए नीचे दिए उपाय करें।' },
  career: { en: 'For job change, promotion or interviews, apply and negotiate in the favourable period, schedule interviews on your lucky days and dates, and strengthen your skills in the slower months. Fields that suit your numbers: {careers}.', hi: 'नौकरी बदलने, पदोन्नति या इंटरव्यू के लिए शुभ समय में आवेदन और बातचीत करें, इंटरव्यू अपने शुभ दिनों व तिथियों पर रखें, और धीमे महीनों में अपनी योग्यता बढ़ाएँ। आपके अंकों के अनुकूल क्षेत्र: {careers}।' },
  business: { en: 'Start or expand the business in the favourable period, register and sign agreements on your lucky dates, and keep the business name and mobile number in harmony with your Bhagyank. Grow step by step with a written plan and proper accounts – numerology supports timing, results come from execution.', hi: 'व्यवसाय शुभ समय में शुरू करें या बढ़ाएँ, पंजीकरण और अनुबंध अपनी शुभ तिथियों पर करें, और व्यवसाय का नाम व मोबाइल नंबर अपने भाग्यांक के अनुकूल रखें। लिखित योजना और सही हिसाब-किताब के साथ धीरे-धीरे बढ़ें – अंक ज्योतिष समय बताता है, परिणाम मेहनत से आते हैं।' },
  money: { en: 'For money matters, make big financial moves in the favourable years, start savings or investments on your lucky dates, and avoid new loans or speculative risks in the slower periods. Keep a monthly budget and clear high-interest debt first; for investments, take advice from a qualified financial adviser.', hi: 'धन के मामलों में बड़े आर्थिक कदम शुभ वर्षों में उठाएँ, बचत या निवेश अपनी शुभ तिथियों पर शुरू करें, और धीमे समय में नया कर्ज़ या सट्टे जैसा जोखिम न लें। मासिक बजट बनाएँ और पहले महंगा कर्ज़ चुकाएँ; निवेश के लिए योग्य वित्तीय सलाहकार की राय लें।' },
  property: { en: 'For buying property or a vehicle, the favourable years above are best; book or register on a lucky date and check all documents and loan terms carefully. A home whose number or entrance direction suits you (see your lucky directions) is preferable.', hi: 'प्रॉपर्टी या वाहन खरीदने के लिए ऊपर दिए वर्ष सबसे अच्छे हैं; बुकिंग या रजिस्ट्री शुभ तिथि पर करें और सभी कागज़ात व लोन की शर्तें ध्यान से जाँचें। ऐसा घर चुनें जिसकी दिशा या नंबर आपके अनुकूल हो (अपनी शुभ दिशाएँ देखें)।' },
  health: { en: 'Numerology can show the periods when you should take extra care, but it is not a diagnosis. Please follow your doctor\'s advice and get regular check-ups. A steady routine, enough sleep, a daily walk and the calming remedies below support your energy, especially in the slower months.', hi: 'अंक ज्योतिष यह बता सकता है कि किस समय अधिक ध्यान रखना चाहिए, पर यह रोग का निदान नहीं है। कृपया डॉक्टर की सलाह मानें और नियमित जाँच कराएँ। नियमित दिनचर्या, पूरी नींद, रोज़ टहलना और नीचे दिए शांत करने वाले उपाय – विशेषकर धीमे महीनों में – आपकी ऊर्जा को सहारा देते हैं।' },
  education: { en: 'For studies and exams, the favourable period above supports focus and results. Keep a fixed daily timetable, revise on your lucky days, and fill exam forms or start a new course on a lucky date. Steady preparation matters most.', hi: 'पढ़ाई और परीक्षा के लिए ऊपर दिया समय एकाग्रता और परिणाम में सहायक है। रोज़ का निश्चित टाइम-टेबल रखें, शुभ दिनों में दोहराएँ, और परीक्षा फ़ॉर्म या नया कोर्स शुभ तिथि पर शुरू करें। नियमित तैयारी सबसे ज़रूरी है।' },
  travel: { en: 'For travel, study or settling abroad, the favourable years above support movement. Apply for visas and admissions in those periods, submit on your lucky days, and keep documents complete – the outcome also depends on eligibility and paperwork.', hi: 'यात्रा, विदेश में पढ़ाई या बसने के लिए ऊपर दिए वर्ष सहायक हैं। वीज़ा और प्रवेश के आवेदन इन्हीं समयों में करें, शुभ दिनों में जमा करें और कागज़ात पूरे रखें – परिणाम योग्यता और दस्तावेज़ों पर भी निर्भर करता है।' },
  legal: { en: 'In legal matters, numerology can only support timing and peace of mind – always follow your lawyer\'s advice. Try to settle or file important papers in the favourable period, attend hearings on lucky days where possible, and keep communication calm and documented.', hi: 'कानूनी मामलों में अंक ज्योतिष केवल समय और मन की शांति में सहायता कर सकता है – हमेशा अपने वकील की सलाह मानें। महत्वपूर्ण कागज़ात शुभ समय में दाखिल करें या समझौते का प्रयास करें, संभव हो तो पेशी शुभ दिनों में रखें, और बातचीत शांत व लिखित रखें।' },
  name: { en: 'A name or signature correction works best when the new spelling\'s number is friendly to your Bhagyank. Start using it on a lucky date, use it consistently (signature, social media, business card) and practise the new signature daily for at least 40 days.', hi: 'नाम या हस्ताक्षर सुधार तब सबसे अच्छा काम करता है जब नई वर्तनी का अंक आपके भाग्यांक का मित्र हो। इसे शुभ तिथि से शुरू करें, हर जगह एक जैसा उपयोग करें (हस्ताक्षर, सोशल मीडिया, विज़िटिंग कार्ड) और कम से कम 40 दिन रोज़ नए हस्ताक्षर का अभ्यास करें।' },
  mobile: { en: 'Choose a mobile number whose total is friendly to your Bhagyank and Moolank and that avoids your difficult digits; activate the new number on a lucky date. Your lucky numbers are listed below.', hi: 'ऐसा मोबाइल नंबर चुनें जिसका योग आपके भाग्यांक और मूलांक का मित्र हो और जिसमें कठिन अंक न हों; नया नंबर शुभ तिथि पर शुरू करें। आपके शुभ अंक नीचे दिए हैं।' },
  family: { en: 'For family harmony, focus on patient communication and small shared routines. Family decisions and celebrations go best in the favourable period above; the remedies below help keep the home peaceful.', hi: 'पारिवारिक सामंजस्य के लिए धैर्य से बात करें और साथ में छोटी-छोटी दिनचर्याएँ बनाएँ। पारिवारिक निर्णय और उत्सव ऊपर दिए शुभ समय में अच्छे रहते हैं; नीचे दिए उपाय घर में शांति बनाए रखने में सहायक हैं।' },
  general: { en: 'Use the favourable period above for important starts and decisions, plan them on your lucky days and dates, and use the slower months for preparation. Combine the timing with practical planning and effort.', hi: 'महत्वपूर्ण शुरुआत और निर्णयों के लिए ऊपर दिया शुभ समय चुनें, उन्हें अपने शुभ दिनों व तिथियों पर रखें, और धीमे महीनों का उपयोग तैयारी में करें। सही समय के साथ व्यावहारिक योजना और मेहनत भी ज़रूरी है।' },
};

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
};

const HI_MON: Record<string, string> = { Jan: 'जन॰', Feb: 'फ़र॰', Mar: 'मार्च', Apr: 'अप्रैल', May: 'मई', Jun: 'जून', Jul: 'जुलाई', Aug: 'अग॰', Sep: 'सित॰', Oct: 'अक्टू॰', Nov: 'नव॰', Dec: 'दिस॰' };
const hiDates = (s: string) => s.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/g, (m) => HI_MON[m.slice(0, 3)] ?? m);

export interface QaFacts {
  name: string; moolank: number; bhagyank: number; planet: string; personalYear: number; pyPeriod: string;
  timeline: { year: number; personalYear: number; label: string }[];
  months: { month: number; year: number; personalMonth: number }[];
  lucky: { numbers: number[]; days: string[]; colours: string[]; dates: number[] }; difficult: number[];
  mantra: string; daan: string[]; careers: string[]; missing: number[]; asOf?: string;
}

/** The client's numbers the answers are built from (engine only). */
export function questionFacts(i: Pick<QuestionInput, 'name' | 'dob' | 'gender' | 'asOf'>): QaFacts {
  const g = i.gender === 'female' || i.gender === 'girl' ? 'female' : i.gender === 'other' ? 'other' : 'male';
  const fullName = /[A-Za-z]{2}/.test(i.name ?? '') ? i.name!.trim() : 'Client';
  const r = generateNumerology({ fullName, gender: g, dob: i.dob, language: 'en', concerns: [], aadhaarConsent: false }, { modules: ['dob'], ...(i.asOf ? { asOf: i.asOf } : {}) });
  const d = r.results.dob, rm = r.results.remedies;
  const cyc = d.personalCycles;
  return {
    name: (i.name ?? '').trim(), moolank: d.moolank.value, bhagyank: d.bhagyank.value, planet: planetOf(d.moolank.value).name,
    personalYear: cyc.current.personalYear, pyPeriod: cyc.current.label,
    timeline: cyc.timeline.slice(0, 6).map((t) => ({ year: t.year, personalYear: t.personalYear, label: t.label })),
    months: cyc.detailed[0]?.months ?? [],
    lucky: { numbers: rm.lucky.numbers, days: rm.lucky.days, colours: rm.lucky.colours.slice(0, 3), dates: rm.lucky.dates.slice(0, 6) },
    asOf: r.asOf, difficult: rm.relationship.challengingPartnerNumbers, mantra: rm.mantra.mantra, daan: rm.daan.slice(0, 2), careers: rm.career.suitableFields.slice(0, 5), missing: d.loShu.missing,
  };
}

/** Rule-based answer for one question (always available, no AI). */
export function ruleAnswer(q: string, f: QaFacts, lang: QaLang, opts: { first?: boolean } = {}): string {
  const hi = lang === 'hi';
  const T = (s: string) => tr(lang, s);
  const topic = topicOf(q);
  const want = TOPIC_YEARS[topic];
  const good = f.timeline.filter((t) => want.includes(t.personalYear)).slice(0, 3);
  const nowFits = want.includes(f.personalYear);
  const nowKey = f.asOf ? f.asOf.slice(0, 7) : '';
  const months = f.months.filter((m) => want.includes(m.personalMonth) && `${m.year}-${String(m.month).padStart(2, '0')}` >= nowKey).slice(0, 4).map((m) => `${MONTHS[lang][m.month - 1]} ${m.year}`);
  const period = (label: string) => (hi ? hiDates(label) : label);
  const theme = PY_THEME[f.personalYear][lang];
  const lines: string[] = [];
  if (opts.first !== false) lines.push(hi
    ? `आपका मूलांक ${f.moolank} और भाग्यांक ${f.bhagyank} है। अभी आपका व्यक्तिगत वर्ष ${f.personalYear} चल रहा है (${period(f.pyPeriod)}) – ${theme}।`
    : `Your Moolank is ${f.moolank} and your Bhagyank is ${f.bhagyank}. You are now in Personal Year ${f.personalYear} (${f.pyPeriod}) – ${theme}.`);
  if (nowFits) lines.push(hi ? `${opts.first === false ? `आपका वर्तमान व्यक्तिगत वर्ष ${f.personalYear} – ` : ''}यह वर्ष इस विषय के लिए अनुकूल है${months.length ? `; विशेष रूप से ${months.join(', ')} अच्छे महीने हैं` : ''}।` 
    : `${opts.first === false ? `In your current Personal Year ${f.personalYear}, ` : ''}${opts.first === false ? 'this' : 'This'} year supports this matter${months.length ? `, especially ${months.join(', ')}` : ''}.`);
  else if (good.length) lines.push(hi
    ? `${opts.first === false ? `अभी आपका व्यक्तिगत वर्ष ${f.personalYear} है। ` : ''}इस विषय के लिए सबसे अनुकूल समय: ${good.map((t) => `${period(t.label)} (व्यक्तिगत वर्ष ${t.personalYear})`).join('; ')}।${months.length ? ` इस वर्ष के भीतर ${months.join(', ')} अपेक्षाकृत बेहतर महीने हैं – तैयारी अभी से शुरू करें।` : ' तब तक तैयारी पर ध्यान दें।'}`
    : `${opts.first === false ? `You are in Personal Year ${f.personalYear}. ` : ''}The most favourable periods for this are: ${good.map((t) => `${t.label} (Personal Year ${t.personalYear})`).join('; ')}.${months.length ? ` Within this year, ${months.join(', ')} are relatively better months – start preparing now.` : ' Until then, focus on preparation.'}`);
  lines.push(ADVICE[topic][lang].replace('{careers}', f.careers.map(T).join(', ')));
  if (opts.first === false) lines.push(hi ? `अपने शुभ दिन (${f.lucky.days.map(T).join(', ')}) और ऊपर दिए उपाय इस विषय में भी सहायक हैं।` : `Your lucky days (${f.lucky.days.join(', ')}) and the remedies given above support this matter too.`);
  else lines.push(hi
    ? `सहायक उपाय: शुभ दिन ${f.lucky.days.map(T).join(', ')}, शुभ अंक ${f.lucky.numbers.join(', ')}, शुभ रंग ${f.lucky.colours.map(T).join(', ')}। रोज़ "${T(f.mantra)}" मंत्र का जाप करें${f.daan.length ? ` और ${f.daan.map(T).join(', ')} का दान करें` : ''}।${f.difficult.length ? ` अंक ${f.difficult.join(', ')} वाली तिथियों पर बड़े निर्णय टालें।` : ''}`
    : `Supporting remedies: lucky days ${f.lucky.days.join(', ')}, lucky numbers ${f.lucky.numbers.join(', ')}, lucky colours ${f.lucky.colours.join(', ')}. Chant "${f.mantra}" daily${f.daan.length ? ` and donate ${f.daan.join(', ')}` : ''}.${f.difficult.length ? ` Avoid big decisions on dates that add up to ${f.difficult.join(', ')}.` : ''}`);
  return lines.join(' ');
}

const SAFE = /guarantee|100%|definitely will|सुनिश्चित रूप से|पक्का होगा|death|मृत्यु/i;

/** Answers for the client's questions in the report language (AI from the engine facts when configured, else rules). */
export async function answerClientQuestions(i: QuestionInput, opts: { useAi?: boolean; fetchImpl?: typeof fetch } = {}): Promise<QA[]> {
  const qs = parseQuestions(i.questions, i.challenges);
  if (!qs.length || !/^\d{4}-\d{2}-\d{2}$/.test(i.dob)) return [];
  let facts: QaFacts;
  try { facts = questionFacts(i); } catch { return []; }
  const rules = qs.map((q, k) => ({ q, a: ruleAnswer(q, facts, i.lang, { first: k === 0 }) }));
  if (opts.useAi === false) return rules;
  const provider = providerFromConfig(configFromEnv(), opts.fetchImpl);
  if (!provider) return rules;
  try {
    const hi = i.lang === 'hi';
    const raw = await provider.complete({
      system: `You are Acharya Nandram, an experienced Indian numerologist (Vedic Moolank/Bhagyank, Chaldean, Lo Shu). Answer the client's own questions for their report in ${hi ? 'simple, natural Hindi (Devanagari)' : 'simple, plain English'}.
Rules: use ONLY the numbers and periods in the FACTS (never invent dates or numbers); be warm, specific and practical (what to do, when, and how); 90–170 words per answer; no guarantees, no fear, no predictions of death, illness or accidents; for health, legal or money questions add that a doctor / lawyer / financial adviser should be consulted; numerology supports timing and choices, effort and practical steps still matter.
Reply with ONLY a JSON array: [{"q": "<question as given>", "a": "<answer>"}] in the same order.`,
      messages: [{ role: 'user', content: `FACTS: ${JSON.stringify({ ...facts, personalYearThemes: Object.fromEntries(Object.entries(PY_THEME).map(([k, v]) => [k, v.en])), favourableYearsByTopic: TOPIC_YEARS })}\n\nDRAFT ANSWERS FROM THE RULES (improve and personalise; keep the facts):\n${JSON.stringify(rules)}\n\nQUESTIONS:\n${JSON.stringify(qs)}` }],
      maxTokens: 2500,
    });
    const s = raw.indexOf('['), e = raw.lastIndexOf(']');
    const parsed = JSON.parse(raw.slice(s, e + 1)) as { q?: unknown; a?: unknown }[];
    if (!Array.isArray(parsed) || parsed.length !== qs.length) return rules;
    return qs.map((q, k) => {
      const a = typeof parsed[k]?.a === 'string' ? (parsed[k].a as string).trim() : '';
      return a.length >= 60 && a.length <= 2000 && !SAFE.test(a) ? { q, a } : rules[k];
    });
  } catch (e) {
    console.warn('[questions] AI answers unavailable, using rules:', e instanceof Error ? e.message : e);
    return rules;
  }
}

/* ---------- printing ---------- */
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
export const qaTitle = (lang: QaLang) => (lang === 'hi' ? 'आपके प्रश्नों के उत्तर' : 'Your Questions Answered');
const qaIntro = (lang: QaLang) => (lang === 'hi'
  ? 'बुकिंग के समय आपने जो प्रश्न और समस्याएँ लिखी थीं, उनके उत्तर आपके अपने अंकों के आधार पर नीचे दिए गए हैं।'
  : 'The questions and problems you wrote when booking, answered from your own numbers.');

/** Self-styled HTML block (works inside every report design). */
export function qaHtml(qa: QA[], lang: QaLang, c: { primary?: string; accent?: string; soft?: string; heading?: string; newPage?: boolean } = {}): string {
  if (!qa.length) return '';
  const p = c.primary ?? '#7a1f2b', a = c.accent ?? '#c9a227', s = c.soft ?? '#fbf1d9';
  return `<section class="qa-block" style="margin:6mm 0 4mm${c.newPage ? ';break-before:page;padding-top:2mm' : ''}">
  ${c.heading === 'none' ? '' : `<h2 style="color:${p};border-bottom:2px solid ${a};padding-bottom:4px;margin:0 0 3mm;font-size:18px;break-after:avoid">${esc(qaTitle(lang))}</h2>`}
  <p style="margin:0 0 3mm;font-size:12.5px;color:#5a4a3a">${esc(qaIntro(lang))}</p>
  ${qa.map((x, i) => `<div style="border:1px solid ${a}55;border-left:4px solid ${a};border-radius:8px;padding:10px 14px;margin:0 0 10px;background:#fff;break-inside:avoid">
    <p style="margin:0 0 6px;font-weight:700;color:${p};font-size:13.5px">${lang === 'hi' ? 'प्रश्न' : 'Q'} ${i + 1}. ${esc(x.q)}</p>
    <p style="margin:0;font-size:12.5px;line-height:1.6;background:${s}55;padding:2px 0">${esc(x.a)}</p></div>`).join('')}
</section>`;
}
