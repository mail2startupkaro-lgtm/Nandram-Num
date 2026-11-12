/**
 * Offline Hindi writer (Devanagari). Mirrors template.ts section by section, using the Hindi knowledge base
 * and the display glossary (tr) for engine terms, so a Hindi report reads as Hindi throughout.
 * Client names and professions stay as the client wrote them.
 */
import type { KnowledgeSeed } from '../knowledge';
import { KNOWLEDGE_HI } from '../knowledge/seed-hi';
import type { ClientContext } from '../plan';
import { NUMBER_TRAITS } from '@/lib/i18n/numberMeanings';
import { tr } from '@/lib/i18n/hi-terms';

type F = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type HindiWriter = (f: F, ctx: ClientContext, kb: KnowledgeSeed[], seed: string) => string[];

const T = (s: string | null | undefined) => tr('hi', s);
const DEVANAGARI = /[ऀ-ॿ]/;

/** Hindi body for a KB entry: an admin entry already written in Hindi wins, then the Hindi seed, then the original. */
const hiBody = (k: KnowledgeSeed) => (DEVANAGARI.test(k.body) ? k.body : KNOWLEDGE_HI[k.key] ?? k.body);
const kbHi = (kb: KnowledgeSeed[], prefix: string) => kb.filter((k) => k.key.startsWith(prefix)).map(hiBody);

function list(xs: (string | number)[], or = false): string {
  const a = xs.map(String);
  if (a.length <= 1) return a[0] ?? '';
  return `${a.slice(0, -1).join(', ')} ${or ? 'या' : 'और'} ${a[a.length - 1]}`;
}
const listT = (xs: string[], or = false) => list(xs.map(T), or);

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pick = <X,>(arr: X[], seed: string): X => arr[hash(seed) % arr.length];

const CONCERN_HI: Record<string, string> = {
  career: 'करियर', business: 'व्यवसाय', money: 'धन', marriage: 'विवाह', love: 'प्रेम', health: 'स्वास्थ्य', children: 'संतान',
  education: 'शिक्षा', foreignTravel: 'विदेश यात्रा', property: 'संपत्ति', legal: 'क़ानूनी मामले',
};
const STAGE_HI: Record<string, string> = {
  student: 'जीवन के इस पड़ाव पर पढ़ाई और UPSC, NEET या JEE जैसी प्रतियोगी परीक्षाओं को अपनी सर्वश्रेष्ठ ऊर्जा दें; तय समय-सारणी आपके अंकों के अनुकूल है।',
  youngProfessional: 'यह समय कौशल और प्रतिष्ठा बनाने का है; केवल वेतन नहीं, शुरुआती सही भूमिकाएँ चुनना अधिक महत्वपूर्ण है।',
  settling: 'ज़िम्मेदारियाँ बढ़ रही हैं, इसलिए स्थिरता और लगातार प्रगति महत्वपूर्ण है, चाहे आप सरकारी नौकरी में हों, निजी कंपनी में या पारिवारिक व्यवसाय में।',
  midLife: 'अब आपका अनुभव ही आपकी सबसे बड़ी पूँजी है; बचत और संपत्ति को मज़बूत करना तथा दूसरों का मार्गदर्शन करना धन और सम्मान दोनों लाता है।',
  senior: 'यह पड़ाव मार्गदर्शन, पारिवारिक सामंजस्य और आध्यात्मिक साधना के लिए अनुकूल है; धन के मामलों को सरल और सुरक्षित रखें।',
};
const REL_HI = (r: string) => (r === 'friend' ? 'मित्र' : r === 'enemy' ? 'शत्रु' : 'सम');
const planetHi = (name: string) => T(name);
/** "28 Aug 2026 – 27 Aug 2027" → "28 अगस्त 2026 से 27 अगस्त 2027" */
const periodHi = (p?: string) => (p ? T(p).replace(/\s*–\s*/, ' से ') : '');
const range = (p: F) => (p.toAge === null ? `${p.fromAge} वर्ष की आयु के बाद` : p.fromAge === 0 ? `जन्म से ${p.toAge} वर्ष की आयु तक` : `${p.fromAge} से ${p.toAge} वर्ष की आयु के बीच`);
const uniq = <X,>(xs: X[]) => [...new Set(xs)];
export const isStudent = (prof?: string) => !!prof && /student|छात्र|विद्यार्थ/i.test(prof);

export const W_HI: Record<string, HindiWriter> = {
  intro: (f, c, _kb, s) => {
    const concerns = (f.concerns as string[]).map((x) => CONCERN_HI[x] ?? x);
    return [
      `${pick(['नमस्ते', 'प्रणाम'], s)} ${c.firstName} जी। यह रिपोर्ट आपकी जन्म तिथि और नाम के अंकों पर आधारित है, और इसमें हर बात के साथ व्यावहारिक उपाय भी दिए गए हैं।`,
      `आपका मूलांक ${f.moolank} है, जिसका स्वामी ${planetHi(f.moolankPlanet)} है, और भाग्यांक ${f.bhagyank} है, जिसका स्वामी ${planetHi(f.bhagyankPlanet)} है। आपका कुआ अंक ${f.kua} है${f.nameNumber ? `, और आपके नाम का अंक ${f.nameNumber} आता है` : ''}। ${f.currentYear} में आपका व्यक्तिगत वर्ष ${f.personalYear} चल रहा है।`,
      concerns.length ? `आपने ${list(concerns)} के बारे में पूछा है, इसलिए पूरी रिपोर्ट में इन विषयों पर विशेष ध्यान दिया गया है।` : 'इस रिपोर्ट में करियर से लेकर परिवार तक जीवन के सभी मुख्य क्षेत्रों को देखा गया है।',
    ];
  },

  moolank: (f, _c, kb) => {
    const [nature, daily] = [kbHi(kb, 'NUMBER_')[0], kbHi(kb, 'MOOLANK_')[0]];
    return [
      `आपका जन्म ${f.birthDay} तारीख़ को हुआ है, जिससे आपका मूलांक ${f.moolank} बनता है। इस अंक का स्वामी ग्रह ${planetHi(f.planet)} है। लोग आपमें सबसे पहले यही ऊर्जा देखते हैं।`,
      [nature, daily].filter(Boolean).join(' '),
      `आप ${planetHi(f.planet)} के गुणों का जितना सजग उपयोग करेंगे, रोज़मर्रा का जीवन उतना ही सहज चलेगा। इस रिपोर्ट के उपाय वाले भाग में इस ग्रह को मज़बूत करने वाले रंग, दिन और मंत्र दिए गए हैं।`,
    ];
  },

  bhagyank: (f, _c, kb) => {
    const nature = kbHi(kb, 'NUMBER_')[0], path = kbHi(kb, 'BHAGYANK_')[0], master = kbHi(kb, 'MASTER_')[0];
    return [
      `आपकी पूरी जन्म तिथि के सभी अंकों का योग ${f.compound} है, जो घटकर भाग्यांक ${f.bhagyank} बनता है। इसका स्वामी ${planetHi(f.planet)} है। मूलांक बताता है कि आप कैसे चलते हैं, और भाग्यांक बताता है कि रास्ता कहाँ ले जाता है।`,
      [path, master].filter(Boolean).join(' '),
      nature,
    ].filter(Boolean);
  },

  combination: (f, _c, kb) => {
    const rel = kbHi(kb, 'MOOLANK_BHAGYANK')[0];
    return [
      f.moolank === f.bhagyank ? `आपका मूलांक और भाग्यांक दोनों ${f.moolank} हैं। एक ही ऊर्जा का यह दोहराव आपके जीवन की दिशा को असाधारण रूप से स्पष्ट बनाता है।`
        : f.relation === 'friend' ? `मूलांक ${f.moolank} और भाग्यांक ${f.bhagyank} आपस में मित्र हैं, यह एक शुभ संयोग है।`
        : f.relation === 'enemy' ? `मूलांक ${f.moolank} और भाग्यांक ${f.bhagyank} स्वाभाविक रूप से एक-दूसरे से सहमत नहीं होते।`
        : `मूलांक ${f.moolank} और भाग्यांक ${f.bhagyank} का संबंध सम है।`,
      rel ?? 'कोई भी अंक दूसरे को रोकता नहीं है, इसलिए परिणाम इस पर निर्भर है कि आप दोनों का कितना सजग उपयोग करते हैं।',
      `आपका साथ देने वाले अंक ${list(f.friendlyNumbers)} हैं${f.enemyNumbers.length ? `, जबकि ${list(f.enemyNumbers)} से टकराव हो सकता है` : ''}। तिथियों, वाहन नंबर और महत्वपूर्ण चुनावों के लिए आपके सबसे शुभ अंक ${list(f.luckyNumbers)} हैं।`,
    ];
  },

  loshu: (f, _c, kb) => {
    const rep = f.repeated as { number: number; count: number }[];
    const excess = kb.filter((k) => k.key.startsWith('EXCESS_'));
    const yog = kbHi(kb, 'YOG_'), arrows = kbHi(kb, 'ARROW_STRENGTH_');
    const repLines = rep.map((r) => { const e = excess.find((k) => k.key === `EXCESS_${r.number}`); return `अंक ${r.number} ग्रिड में ${r.count} बार आता है। ${e ? hiBody(e) : ''}`.trim(); });
    const p2 = [...(yog.length ? [`आपकी कुंडली में ${listT(f.yogs)} है। ${yog.join(' ')}`] : []), ...arrows].join(' ');
    return [
      `आपके लो शू ग्रिड में ${list(f.present)} अंक उपस्थित हैं। ये आपके स्वाभाविक गुण हैं, जिनका उपयोग आप बिना प्रयास के कर सकते हैं।${repLines.length ? ` ${repLines[0]}` : ''}`,
      repLines.slice(1).join(' '),
      p2,
    ].filter(Boolean);
  },

  missing: (f, _c, kb) => {
    if (!f.missing.length) return ['आपके ग्रिड में एक से नौ तक सभी अंक उपस्थित हैं, जो बहुत कम देखने को मिलता है और आपको संतुलित व्यक्तित्व देता है।'];
    const miss = kb.filter((k) => k.key.startsWith('MISSING_'));
    const lines = (f.missing as number[]).map((n) => { const e = miss.find((k) => k.key === `MISSING_${n}`); return `अंक ${n}: ${e ? hiBody(e) : ''}`; });
    const half = Math.ceil(lines.length / 2);
    return [
      `आपके ग्रिड में ${list(f.missing)} अंक नहीं हैं। अनुपस्थित अंक कोई कमी नहीं है; वह केवल उस गुण को दिखाता है जिसे जीवन आपसे सजग रूप से विकसित करने को कहता है।`,
      lines.slice(0, half).join(' '), lines.slice(half).join(' '),
      kbHi(kb, 'ARROW_WEAKNESS_').join(' '),
      'इन सभी के लिए सरल उपाय, उपाय वाले भाग में दिए गए हैं।',
    ].filter(Boolean);
  },

  kua: (f, _c, kb) => {
    const d = f.favourable;
    return [
      `आपका कुआ अंक ${f.kua} है। ${kbHi(kb, 'KUA_')[0] ?? ''}`.trim(),
      `काम करते समय या महत्वपूर्ण काग़ज़ों पर हस्ताक्षर करते समय ${T(d.success)} दिशा की ओर मुँह रखें; यह आपकी सफलता की दिशा है। स्वास्थ्य के लिए सोते समय सिर ${T(d.health)} की ओर रखें, परिवार की तस्वीरें ${T(d.relationships)} में लगाएँ और पढ़ाई तथा पूजा के लिए ${T(d.personalGrowth)} दिशा का उपयोग करें। महत्वपूर्ण काम करते समय ${T(f.unfavourable.totalLoss)} की ओर मुँह करने से बचें।`,
    ];
  },

  forecast: (f, c, kb) => {
    const years = f.years as { year: number; personalYear: number; period?: string }[];
    const body = (py: number) => { const e = kb.find((k) => k.key === `PY_${py}`); return e ? hiBody(e) : ''; };
    const focus = c.concerns.length ? CONCERN_HI[c.concerns[0]] ?? '' : '';
    return years.map((y, i) => {
      const opener = i === 0
        ? `अभी (${periodHi(y.period) || y.year} तक) आपका व्यक्तिगत वर्ष ${y.personalYear} चल रहा है।`
        : `${y.year} के जन्मदिन से आपका व्यक्तिगत वर्ष ${y.personalYear} शुरू होगा।`;
      return `${opener} ${body(y.personalYear)}${i === 0 && focus ? ` ${focus} के लिए सही समय की प्रतीक्षा करने के बजाय इस ऊर्जा का सोच-समझकर उपयोग करें।` : ''}`;
    });
  },

  lifePeriods: (f) => {
    const cur = (f.pinnacles as F[]).find((p) => p.current), next = (f.pinnacles as F[]).find((p) => cur && p.fromAge > cur.fromAge);
    const ch = (f.challenges as F[]).find((p) => p.current);
    if (!cur) return [];
    const trait = NUMBER_TRAITS.hi[cur.number as number];
    return [
      `${f.age} वर्ष की आयु में आप शिखर अंक ${cur.number} के काल में हैं, जो ${range(cur)} चलता है। इसका विषय ${trait.keyword} है: यह ${trait.plus} बनने का समय है, साथ ही ${trait.minus} से सावधान रहने का भी।`,
      ch ? `इसी अवधि का चुनौती अंक ${ch.number} है${ch.number === 0 ? ', जो चुनाव की चुनौती है: कोई एक रुकावट तय नहीं है, इसलिए सीख यह है कि अपनी प्राथमिकताएँ समझदारी से चुनें' : ', और इसकी सीख पर काम करने से रुकावटें शक्ति में बदल जाती हैं'}।` : '',
      next ? (next.number === cur.number ? `यही शिखर अंक ${range(next)} फिर लौटता है, इसलिए इस काल की सीख बदलती नहीं बल्कि और गहरी होती है।` : `अगला शिखर अंक ${next.number} है, जो ${range(next)} चलेगा और ध्यान को ${NUMBER_TRAITS.hi[next.number as number].keyword} की ओर ले जाएगा।`) : '',
    ].filter(Boolean);
  },

  career: (f, c) => {
    const student = isStudent(f.profession);
    const prof = student ? undefined : (f.profession as string | undefined);
    const jobs = f.jobChangeYears?.length ? f.jobChangeYears : null, biz = f.businessYears?.length ? f.businessYears : null;
    const balance = c.gender === 'female' && c.maritalStatus === 'married' && f.careerScore >= 60
      ? 'आपके अंक बढ़ते करियर और स्थिर घर दोनों का साथ देते हैं, इसलिए एक के लिए दूसरे को छोड़ने की ज़रूरत नहीं; सप्ताह की योजना पहले से बनाने से संतुलन बना रहता है।' : '';
    return [
      `आपके अंक ${listT(f.suitableFields)} जैसे क्षेत्रों की ओर संकेत करते हैं${prof ? `, और ${prof} के रूप में आपका वर्तमान काम इनमें से कई गुणों का लाभ ले सकता है` : ''}।`,
      `आपका करियर संकेतक 100 में से ${f.careerScore} और धन संकेतक ${f.moneyScore} है। ${f.careerScore > f.moneyScore + 10 ? 'पहचान धन से पहले मिल सकती है, इसलिए बचत की आदत अभी से बनाएँ।' : f.moneyScore > f.careerScore + 10 ? 'धन पद की तुलना में अधिक सहजता से आता है; पद में आगे बढ़ने के लिए अपने कौशल में निवेश करें।' : 'जब आप निरंतरता बनाए रखते हैं, तब करियर और धन साथ-साथ बढ़ते हैं।'}`,
      `${STAGE_HI[student ? 'student' : f.stage] ?? ''} ${balance}`.trim(),
      [jobs ? `नौकरी बदलने के लिए सबसे अनुकूल वर्ष ${list(jobs)} हैं।` : '', biz ? `नया व्यवसाय या नया काम शुरू करने के लिए ${list(biz)} में सही ऊर्जा है।` : ''].join(' ').trim(),
    ].filter(Boolean);
  },

  relationships: (f, _c, kb) => {
    const style = kbHi(kb, 'RELATION_')[0] ?? '';
    const ms = f.maritalStatus;
    const years = f.marriageYears?.length ? f.marriageYears : null;
    return [
      style,
      `जिन साथियों का मूलांक या भाग्यांक ${list(f.compatiblePartnerNumbers, true)} है, वे आपको स्वाभाविक रूप से समझते हैं${f.challengingPartnerNumbers.length ? `, जबकि ${list(f.challengingPartnerNumbers)} के साथ दोनों ओर से अधिक धैर्य चाहिए` : ''}।`,
      ms === 'married' ? 'वैवाहिक जीवन में साथ बिताया समय और संयुक्त परिवार या ससुराल की ज़िम्मेदारियाँ बाँटना रिश्ते में गर्माहट बनाए रखता है।'
        : ms === 'engaged' ? `सगाई का यह समय दोनों परिवारों के बीच समझ बनाने के लिए अच्छा है।${years ? ` आपके अपने अंकों के अनुसार विवाह के लिए अनुकूल वर्ष ${list(years)} हैं।` : ''}`
        : years ? `यदि विवाह का विचार है, चाहे अरेंज हो या प्रेम विवाह, तो ${list(years)} सबसे सहायक वर्ष हैं।` : '',
      `आपका प्रेम संकेतक 100 में से ${f.loveScore} और परिवार संकेतक ${f.familyScore} है।`,
    ].filter(Boolean);
  },

  wellbeing: (f, _c, kb) => [
    `आपका स्वास्थ्य संकेतक 100 में से ${f.healthScore} है। ${planetHi(f.planet)} से शासित व्यक्ति के लिए नियमित दिनचर्या बहुत मायने रखती है। ${kbHi(kb, 'WELLBEING_')[0] ?? ''}`.trim(),
    'स्वास्थ्य से जुड़ी किसी भी समस्या के लिए कृपया योग्य डॉक्टर से सलाह लें; अंक ज्योतिष स्वस्थ दिनचर्या में सहायक हो सकता है, पर चिकित्सा सलाह का स्थान कभी नहीं लेता।',
  ],

  name: (f, _c, kb) => {
    const cat = kbHi(kb, 'NAME_COMPOUND_')[0] ?? '';
    const how = kbHi(kb, 'NAME_CORRECTION_HOW')[0];
    const opts = (f.corrections as F[]).map((o) => `${o.spelling} (${o.compound}/${o.nameNumber}, स्कोर ${o.score})`);
    return [
      `कैल्डियन पद्धति से "${f.name}" का योग ${f.compound} है, जिससे नामांक ${f.nameNumber} बनता है। ${cat}`.trim(),
      `यह अंक आपके मूलांक के लिए ${REL_HI(f.relationWithMoolank)} और भाग्यांक के लिए ${REL_HI(f.relationWithBhagyank)} है, जिससे अनुकूलता स्कोर 100 में से ${f.score} आता है। आपका आत्मांक (सोल अर्ज) ${f.soulUrge} और व्यक्तित्व अंक ${f.personality} है।`,
      f.needsCorrection && opts.length ? `नाम का उच्चारण बदले बिना वर्तनी में छोटा-सा बदलाव इसे आपके अंकों के अनुकूल बना सकता है। सबसे अच्छे विकल्प हैं: ${list(opts)}। ${how ?? ''}`.trim() : 'आपकी वर्तमान वर्तनी पहले से आपके अंकों के अनुकूल है, इसलिए किसी सुधार की आवश्यकता नहीं है।',
    ];
  },

  mobile: (f, _c, kb) => {
    const rel = (r: string) => (r === 'friend' ? 'का साथ देता है' : r === 'enemy' ? 'से टकराता है' : 'के लिए सम है');
    return [
      `आपके मोबाइल नंबर ${f.masked} का योग ${f.compound} है, यानी अंक ${f.total}, जो आपके भाग्यांक ${rel(f.relationWithBhagyank)}। इसका स्कोर 100 में से ${f.score} है: ${T(f.verdict)}। ${kbHi(kb, 'MOBILE_')[0] ?? ''}`.trim(),
      [f.maleficPairs.length ? `इसमें ${list(uniq(f.maleficPairs as string[]))} जैसे कठिन जोड़े हैं।` : 'इसमें कोई प्रबल अशुभ अंक-जोड़ा नहीं है।', f.missingNumbersFilled.length ? `यह आपके ग्रिड के अनुपस्थित अंक ${list(f.missingNumbersFilled)} भी लाता है।` : '', `यदि कभी नया नंबर चुनें, तो ऐसा योग रखें जो घटकर ${list(f.idealTotals, true)} बने।`].join(' ').trim(),
    ];
  },

  aadhaar: (f, _c, kb) => {
    const phr = ({ 'Highly Lucky': 'आपके अंकों के साथ बहुत अच्छा मेल रखता है', Supportive: 'आपके अंकों का साथ देता है', Neutral: 'आपके लिए सामान्य है', 'Needs Change': 'आपके अंकों से स्वाभाविक मेल नहीं रखता' } as Record<string, string>)[f.verdict] ?? 'आपके लिए सामान्य है';
    return [`आपके आधार (${f.masked}) का कंपन ${f.total} है, जो ${phr}। ${kbHi(kb, 'AADHAAR')[0] ?? ''}${f.missingNumbersFilled.length ? ` अच्छी बात यह है कि यह आपके अनुपस्थित अंकों में से ${list(f.missingNumbersFilled)} लाता है।` : ''}`];
  },

  couple: (f, _c, kb) => {
    const a = f.areaScores as Record<string, number>;
    const sorted = Object.entries(a).sort((x, y) => y[1] - x[1]);
    const best = sorted.slice(0, 2), weak = sorted.slice(-2);
    const lbl = (k: string) => ({ love: 'प्रेम और भावनात्मक जुड़ाव', communication: 'संवाद', finance: 'धन', family: 'परिवार और ससुराल', health: 'शारीरिक सामंजस्य', stability: 'दीर्घकालिक स्थिरता' } as Record<string, string>)[k] ?? k;
    const pair = (xs: [string, number][]) => xs.map(([k, v]) => `${lbl(k)} (${v})`).join(' और ');
    return [
      `आपके और ${f.partnerName} के अंकों को मिलाकर कुल अनुकूलता ${f.overall}% है। ${kbHi(kb, 'COUPLE_GENERAL')[0] ?? ''}`.trim(),
      `आपके सबसे मज़बूत क्षेत्र ${pair(best)} हैं। जिन क्षेत्रों में सचेत प्रयास चाहिए वे ${pair(weak)} हैं।`,
      `${f.bothMissing.length ? `आप दोनों के ग्रिड में ${list(f.bothMissing, true)} नहीं है, इसलिए ${f.bothMissing.length > 1 ? 'इन अंकों' : 'इस अंक'} के उपाय साथ मिलकर करना लाभदायक रहेगा। ` : ''}विवाह या अन्य महत्वपूर्ण साझा निर्णयों के लिए वे तिथियाँ शुभ हैं जिनका योग ${list(f.marriageDateNumbers, true)} बनता है${f.auspiciousYears.length ? `, और आप दोनों के लिए साथ में ${list(f.auspiciousYears)} विशेष रूप से शुभ ${f.auspiciousYears.length > 1 ? 'वर्ष हैं' : 'वर्ष है'}` : ''}।`,
    ];
  },

  remedies: (f, _c, kb) => {
    const gem = kbHi(kb, 'REMEDY_GEM')[0] ?? '';
    const grid = (f.gridRemedies as F[]).slice(0, 4);
    const habits = (f.habits as string[]).slice(0, 2).map(T).join(' ');
    return [
      'उपाय तभी सबसे अच्छा काम करते हैं जब वे आदत बन जाएँ, इसलिए यहाँ आपके शासक ग्रह और ग्रिड की कमियों पर आधारित एक सरल योजना है।',
      `हर ${T(f.mantraDay)} को ${T(f.deity)} की पूजा करें और "${T(f.mantra)}" मंत्र का ${f.mantraCount} बार जप करें। महत्वपूर्ण दिनों पर ${listT(f.luckyColours, true)} रंग पहनें, नया काम ${listT(f.luckyDays, true)} को शुरू करें, और यदि स्वास्थ्य अनुमति दे तो ${T(f.fastingDay)} का व्रत रखें।`,
      `आपका रत्न ${T(f.gemstone)} है, और ${T(f.rudraksha)} रुद्राक्ष एक सौम्य विकल्प है। ${gem} दान के लिए ${listT(f.daan)} उत्तम हैं; यह दान इसी ऊर्जा को मज़बूत करता है।`,
      grid.length ? `घर में ये छोटे बदलाव आपके अनुपस्थित अंकों को सहारा देते हैं: ${grid.map((g) => T(g.placement).replace(/[.।]$/, '')).join('; ')}। ${T(grid[0].wristband)} पहनना एक आसान उपाय है।` : '',
      f.avoidColours.length ? `महत्वपूर्ण अवसरों पर ${listT(f.avoidColours)} रंग का उपयोग कम करें। ${habits}` : habits,
    ].filter(Boolean);
  },

  closing: (f, c, kb) => [
    `${kbHi(kb, 'CLOSING')[0] ?? ''} अभी व्यक्तिगत वर्ष ${f.personalYear} चल रहा है और अगले जन्मदिन से व्यक्तिगत वर्ष ${f.nextPersonalYear} शुरू होगा, इसलिए समय आपके साथ है, ${c.firstName} जी। उपाय धैर्य के साथ नियमित रूप से करें, आप स्वयं अंतर महसूस करेंगे। आशीर्वाद और शुभकामनाओं सहित।`.trim(),
  ],
};
