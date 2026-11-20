/**
 * "Missing number N in the Lo Shu grid" (9) and "Personal Year N" (9) articles, English + Hindi.
 * Grid examples are produced with the engine's own Lo Shu rules (DOB digits + Moolank rule + Bhagyank + Kua),
 * personal-year examples with the birthday-to-birthday rule, so they match the reports.
 */
import { bhagyank, buildLoShu, kuaNumber, loShuSourceDigits, moolank, personalYear, personalYearPeriod } from '@/lib/numerology/modules/dob';
import { LOSHU_LINES, LOSHU_NUMBER_INFO } from '@/lib/numerology/data/grids';
import { planetOf } from '@/lib/numerology/data/planets';
import { SCORING } from '@/lib/numerology/data/tables';
import { PY_THEMES, NUMBER_TRAITS } from '@/lib/i18n/numberMeanings';
import { tr } from '@/lib/i18n/hi-terms';
import { DISCLAIM, NUMS, calcLink, calcSection, clip, fig, finish, list, p, sec, serviceLink, steps, table, tip, type Lang, type TopicPost, type TopicRef } from './topic-kit';
import type { Section } from './generate';

const PL_HI = ['सूर्य', 'चंद्र', 'गुरु', 'राहु', 'बुध', 'शुक्र', 'केतु', 'शनि', 'मंगल'];
const pl = (lang: Lang, n: number) => (lang === 'hi' ? PL_HI[n - 1] : planetOf(n).name);

/* ═════════════════════════ Lo Shu: missing numbers ═════════════════════════ */

type MissText = { meaning: string; effects: string[]; signs: string };
const MISSING: Record<Lang, Record<number, MissText>> = {
  en: {
    1: { meaning: 'Number 1 is the Sun’s number of self-expression and confidence. When it is missing, a person often knows what they feel but struggles to say it, especially to seniors or in public.', effects: ['Hesitation in speaking up for yourself', 'Others may take credit for your work', 'Need for approval before starting something new'], signs: 'People with a missing 1 are often kind and adaptable; the work is to build a clear, confident voice.' },
    2: { meaning: 'Number 2 belongs to the Moon and governs sensitivity, intuition and cooperation. A missing 2 can make a person appear impatient or misunderstood in close relationships.', effects: ['Impatience with slow people and processes', 'Difficulty reading others’ moods', 'Feeling that you must manage everything alone'], signs: 'A missing 2 often gives strong independence; balancing it brings softer, warmer relationships.' },
    3: { meaning: 'Number 3 is Jupiter’s number of memory, imagination and learning. When 3 is missing, planning and study may need extra effort and self-belief.', effects: ['Forgetting details or losing focus while studying', 'Self-doubt about your abilities', 'Difficulty expressing ideas creatively'], signs: 'Practical minds often have a missing 3; reading and journaling strengthen it.' },
    4: { meaning: 'Number 4 (Rahu) brings order, discipline and practical organisation. A missing 4 can show as scattered effort and difficulty finishing what you start.', effects: ['Untidy space or irregular routine', 'Starting many tasks, finishing few', 'Carelessness with money and paperwork'], signs: 'Creative, free-spirited people often miss 4; a simple daily plan works wonders.' },
    5: { meaning: 'Number 5 (Mercury) sits at the centre of the grid and stands for balance, communication and stability. A missing 5 is very common and can make life feel unsettled.', effects: ['Feeling unsteady or lacking direction', 'Communication gaps and misunderstandings', 'Ups and downs in health or finances'], signs: 'Because 5 joins four lines of the grid, a missing 5 weakens several planes at once – remedies for it help many areas.' },
    6: { meaning: 'Number 6 is Venus’ number of family, home, love and responsibility. A missing 6 can bring distance from family or difficulty settling down.', effects: ['Feeling less connected to home or family', 'Delays in marriage or domestic happiness', 'Neglect of comfort and self-care'], signs: 'People missing 6 are often very independent; nurturing home life brings the balance.' },
    7: { meaning: 'Number 7 (Ketu) relates to inner wisdom, spirituality and learning from experience. A missing 7 may make a person repeat the same mistakes or feel disappointed easily.', effects: ['Learning lessons the hard way', 'Little interest in reflection or spiritual practice', 'Feeling let down by people or plans'], signs: 'A missing 7 often means a very practical nature; a little daily quiet time strengthens intuition.' },
    8: { meaning: 'Number 8 (Saturn) governs patience, financial management and attention to detail. A missing 8 can lead to irregular finances and hasty decisions.', effects: ['Difficulty saving or managing money', 'Impatience and hasty decisions', 'Overlooking fine details in work'], signs: 'Those missing 8 are often generous and quick; structure and patience complete them.' },
    9: { meaning: 'Number 9 (Mars) brings energy, courage, ambition and compassion. People born from 2000 onwards often miss 9, which can show as low drive or lack of purpose.', effects: ['Low energy or motivation', 'Hesitation to take bold steps', 'Less interest in serving others'], signs: 'A missing 9 is common in today’s children; regular exercise and service activate it.' },
  },
  hi: {
    1: { meaning: 'अंक 1 सूर्य का अंक है – आत्म-अभिव्यक्ति और आत्मविश्वास का। यह अनुपस्थित हो तो व्यक्ति अपनी भावनाएँ जानता है, पर उन्हें कहने में, ख़ासकर बड़ों के सामने या सार्वजनिक रूप से, झिझकता है।', effects: ['अपनी बात रखने में झिझक', 'आपके काम का श्रेय दूसरे ले सकते हैं', 'कुछ नया शुरू करने से पहले दूसरों की स्वीकृति की ज़रूरत'], signs: 'जिनका 1 अनुपस्थित होता है वे अक्सर दयालु और लचीले होते हैं; बस स्पष्ट और आत्मविश्वासी आवाज़ बनानी होती है।' },
    2: { meaning: 'अंक 2 चंद्रमा का अंक है – संवेदनशीलता, अंतर्ज्ञान और सहयोग का। 2 अनुपस्थित हो तो व्यक्ति करीबी रिश्तों में अधीर या ग़लत समझा जा सकता है।', effects: ['धीमे लोगों और कामों के प्रति अधीरता', 'दूसरों की मनोदशा समझने में कठिनाई', 'यह भावना कि सब कुछ अकेले सँभालना है'], signs: 'अनुपस्थित 2 अक्सर मज़बूत आत्मनिर्भरता देता है; इसे संतुलित करने से रिश्ते कोमल और स्नेही बनते हैं।' },
    3: { meaning: 'अंक 3 गुरु का अंक है – स्मरणशक्ति, कल्पना और ज्ञान का। 3 अनुपस्थित हो तो योजना और पढ़ाई में अधिक प्रयास और आत्मविश्वास की ज़रूरत पड़ती है।', effects: ['पढ़ते समय बातें भूलना या ध्यान भटकना', 'अपनी क्षमता पर संदेह', 'विचारों को रचनात्मक ढंग से कहने में कठिनाई'], signs: 'व्यावहारिक सोच वालों में अक्सर 3 अनुपस्थित होता है; पढ़ना और डायरी लिखना इसे मज़बूत करते हैं।' },
    4: { meaning: 'अंक 4 (राहु) व्यवस्था, अनुशासन और व्यावहारिक संगठन देता है। 4 अनुपस्थित हो तो प्रयास बिखर जाते हैं और शुरू किया काम पूरा करना कठिन लगता है।', effects: ['अव्यवस्थित जगह या अनियमित दिनचर्या', 'कई काम शुरू करना, कम पूरे करना', 'पैसे और काग़ज़ात में लापरवाही'], signs: 'रचनात्मक और स्वतंत्र स्वभाव वालों में 4 अक्सर अनुपस्थित होता है; रोज़ की छोटी योजना कमाल करती है।' },
    5: { meaning: 'अंक 5 (बुध) ग्रिड के केंद्र में है और संतुलन, संवाद व स्थिरता का अंक है। अनुपस्थित 5 बहुत आम है और जीवन में अस्थिरता का अनुभव करा सकता है।', effects: ['अस्थिरता या दिशा की कमी का अनुभव', 'संवाद में कमी और ग़लतफ़हमियाँ', 'स्वास्थ्य या धन में उतार-चढ़ाव'], signs: 'क्योंकि 5 ग्रिड की चार रेखाओं को जोड़ता है, इसकी अनुपस्थिति कई तलों को एक साथ कमज़ोर करती है – इसलिए इसके उपाय कई क्षेत्रों में लाभ देते हैं।' },
    6: { meaning: 'अंक 6 शुक्र का अंक है – परिवार, घर, प्रेम और ज़िम्मेदारी का। 6 अनुपस्थित हो तो परिवार से दूरी या घर बसाने में कठिनाई हो सकती है।', effects: ['घर या परिवार से कम जुड़ाव', 'विवाह या घरेलू सुख में देरी', 'आराम और अपनी देखभाल की उपेक्षा'], signs: 'जिनका 6 अनुपस्थित होता है वे अक्सर बहुत आत्मनिर्भर होते हैं; घर-परिवार को समय देना संतुलन लाता है।' },
    7: { meaning: 'अंक 7 (केतु) आंतरिक ज्ञान, आध्यात्मिकता और अनुभव से सीखने का अंक है। 7 अनुपस्थित हो तो व्यक्ति एक ही ग़लती दोहरा सकता है या जल्दी निराश हो सकता है।', effects: ['कठिन अनुभवों से ही सीखना', 'चिंतन या साधना में कम रुचि', 'लोगों या योजनाओं से निराशा'], signs: 'अनुपस्थित 7 अक्सर बहुत व्यावहारिक स्वभाव देता है; रोज़ थोड़ा शांत समय अंतर्ज्ञान बढ़ाता है।' },
    8: { meaning: 'अंक 8 (शनि) धैर्य, धन-प्रबंधन और बारीकियों पर ध्यान का अंक है। 8 अनुपस्थित हो तो वित्त अनियमित और निर्णय जल्दबाज़ी वाले हो सकते हैं।', effects: ['बचत या धन-प्रबंधन में कठिनाई', 'अधीरता और जल्दबाज़ी के निर्णय', 'काम की बारीकियाँ छूट जाना'], signs: 'जिनका 8 अनुपस्थित होता है वे अक्सर उदार और तेज़ होते हैं; व्यवस्था और धैर्य उन्हें पूर्ण बनाते हैं।' },
    9: { meaning: 'अंक 9 (मंगल) ऊर्जा, साहस, महत्वाकांक्षा और करुणा देता है। वर्ष 2000 के बाद जन्मे लोगों में 9 अक्सर अनुपस्थित होता है, जो कम ऊर्जा या उद्देश्य की कमी के रूप में दिख सकता है।', effects: ['कम ऊर्जा या प्रेरणा', 'साहसी क़दम उठाने में झिझक', 'दूसरों की सेवा में कम रुचि'], signs: 'आज के बच्चों में अनुपस्थित 9 आम है; नियमित व्यायाम और सेवा इसे सक्रिय करते हैं।' },
  },
};

/** A real date (male Kua) whose Lo Shu grid, by the engine's rules, lacks n. */
function missingExample(n: number) {
  for (let y = 1984; y <= 2008; y++) for (let mo = 1; mo <= 12; mo++) for (let d = 1; d <= 28; d++) {
    const dob = { year: y, month: mo, day: d };
    const m = moolank(d).value, b = bhagyank(dob).value, k = kuaNumber(y, 'male');
    const g = buildLoShu(loShuSourceDigits(dob, m, b, k));
    if (g.missing.includes(n) && g.missing.length <= 3 && (y * 7 + mo * 3 + d + n * 11) % 5 === 0) {
      return { date: `${String(d).padStart(2, '0')}-${String(mo).padStart(2, '0')}-${y}`, m, b, k, present: [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => !g.missing.includes(x)), missing: g.missing };
    }
  }
  throw new Error(`no example for ${n}`);
}

export const loshuSlug = (n: number) => `missing-number-${n}-in-lo-shu-grid-effects-remedies`;

function buildLoshu(n: number, lang: Lang): TopicPost {
  const hi = lang === 'hi';
  const t = MISSING[lang][n], info = LOSHU_NUMBER_INFO[n], P = planetOf(n);
  const T = (s: string) => tr(lang, s);
  const ex = missingExample(n);
  const lines = LOSHU_LINES.filter((x) => x.numbers.includes(n));
  const title = hi ? `लो शू ग्रिड में अंक ${n} अनुपस्थित: प्रभाव और उपाय` : `Missing Number ${n} in Lo Shu Grid: Effects & Remedies`;
  const h1 = hi ? `लो शू ग्रिड में अंक ${n} अनुपस्थित हो तो क्या करें` : `Missing Number ${n} in the Lo Shu Grid: Meaning, Effects and Remedies`;
  const description = clip(`What does a missing ${n} in your Lo Shu grid mean? Effects on life, the ${P.name} connection and simple remedies – colour, direction, crystal, habit – by Acharya Nandram.`);
  const sections: Section[] = [
    sec('meaning', hi ? `अनुपस्थित ${n} का अर्थ` : `What a Missing ${n} Means`, [
      p(hi ? `लो शू ग्रिड 3×3 का एक जादुई वर्ग है जिसमें 1 से 9 तक के अंक तय स्थानों पर होते हैं। आपकी जन्म तिथि के अंक (साथ में भाग्यांक, कुआ और नियम अनुसार मूलांक) इसमें भरे जाते हैं। जो अंक एक बार भी नहीं आता, वह "अनुपस्थित" कहलाता है।` : `The Lo Shu grid is a 3×3 magic square in which the numbers 1 to 9 have fixed places. The digits of your date of birth (with the Bhagyank, Kua and, by rule, the Mulank) are placed in it. A number that does not appear even once is called "missing".`),
      p(t.meaning),
      fig({ t: 'grid', present: ex.present, missing: n }, hi ? `उदाहरण ग्रिड: अंक ${n} (${pl(lang, n)}) अनुपस्थित` : `Example grid: number ${n} (${pl(lang, n)}) is missing`),
      table(hi ? ['विवरण', `अंक ${n}`] : ['Detail', `Number ${n}`], [
        [hi ? 'ग्रह' : 'Planet', pl(lang, n)], [hi ? 'तत्व' : 'Element', T(info.element)], [hi ? 'ग्रिड में दिशा' : 'Direction in the grid', T(info.direction)],
        [hi ? 'मुख्य गुण' : 'Key quality', NUMBER_TRAITS[lang][n].keyword], [hi ? 'रेखाएँ जिनसे जुड़ा है' : 'Lines it belongs to', lines.map((x) => T(x.name)).join(', ')],
      ]),
    ], true),
    sec('effects', hi ? `अंक ${n} अनुपस्थित होने के प्रभाव` : `Effects of a Missing ${n}`, [
      list(t.effects), p(t.signs),
      p(hi ? 'ध्यान दें: अनुपस्थित अंक दुर्भाग्य नहीं है। यह केवल बताता है कि कौन-सा गुण स्वाभाविक रूप से कम मिला है और किस पर सचेत रूप से काम करना है। आपका मूलांक, भाग्यांक या नामांक यही अंक हो, तो इसकी कमी काफ़ी हद तक भर जाती है।' : 'Note: a missing number is not bad luck. It only shows which quality came to you less naturally and needs conscious work. If your Mulank, Bhagyank or name number is this same number, the gap is largely filled.'),
    ]),
    sec('lines', hi ? `अनुपस्थित ${n} और ग्रिड की रेखाएँ` : `Missing ${n} and the Grid Lines`, [
      p(hi ? `अंक ${n} इन रेखाओं का हिस्सा है। यदि किसी रेखा के तीनों अंक अनुपस्थित हों, तो वह "कमज़ोरी का तीर" बनती है:` : `Number ${n} is part of these lines. If all three numbers of a line are missing, it forms an "arrow of weakness":`),
      table(hi ? ['रेखा', 'अंक', 'तीनों हों तो', 'तीनों न हों तो'] : ['Line', 'Numbers', 'All present', 'All missing'], lines.map((x) => [T(x.name), x.numbers.join('-'), T(x.strengthName), T(x.weaknessName)])),
    ]),
    sec('example', hi ? 'उदाहरण से समझें' : 'A Worked Example', [
      steps(hi ? [
        { title: ex.date, text: `इस जन्म तिथि के अंक ग्रिड में रखे जाते हैं; मूलांक ${ex.m}, भाग्यांक ${ex.b} और कुआ ${ex.k} (पुरुष) भी जोड़े जाते हैं।` },
        { title: hi ? 'उपस्थित अंक' : '', text: `ग्रिड में आने वाले अंक: ${ex.present.join(', ')}।` },
        { title: 'अनुपस्थित अंक', text: `अनुपस्थित अंक: ${ex.missing.join(', ')} – इनमें अंक ${n} भी है।` },
      ] : [
        { title: ex.date, text: `The digits of this date go into the grid, together with Mulank ${ex.m} (by rule), Bhagyank ${ex.b} and Kua ${ex.k} (male).` },
        { title: 'Numbers present', text: `Numbers that appear: ${ex.present.join(', ')}.` },
        { title: 'Numbers missing', text: `Missing numbers: ${ex.missing.join(', ')} – including ${n}.` },
      ]),
      p(hi ? 'अपना ग्रिड जाँचने के लिए मुफ़्त लो शू ग्रिड कैलकुलेटर उपयोग करें – यह यही नियम लागू करता है।' : 'Use the free Lo Shu grid calculator to check your own grid – it applies exactly these rules.'),
    ]),
    sec('remedies', hi ? `अनुपस्थित ${n} के उपाय` : `Remedies for a Missing ${n}`, [
      table(hi ? ['उपाय', 'क्या करें'] : ['Remedy', 'What to do'], [
        [hi ? 'रंग' : 'Colour', T(info.colour)], [hi ? 'दिशा और वस्तु' : 'Direction & placement', T(info.placement)],
        [hi ? 'क्रिस्टल' : 'Crystal', T(info.crystal)], [hi ? 'ब्रेसलेट' : 'Wristband', T(info.wristband)],
        [hi ? 'रोज़ की आदत' : 'Daily habit', T(info.dailyHabit)], [hi ? 'मंत्र' : 'Mantra', `${T(P.mantra.beej)} (${P.mantra.dailyCount}×)`],
        [hi ? 'दान' : 'Daan', P.daan.slice(0, 3).map(T).join(', ')], [hi ? 'शुभ दिन' : 'Day', T(P.weekday)],
      ]),
      list(hi ? [`नाम-वर्तनी ऐसी चुनें जिसका नामांक या कोई महत्वपूर्ण अक्षर-मान ${n} हो।`, `मोबाइल नंबर में ${n} अंक शामिल करें, बशर्ते उसका कुल योग आपके मूलांक और भाग्यांक के अनुकूल हो।`, `हस्ताक्षर: ${T(P.signatureTip)}`] : [`Choose a name spelling whose name number, or a key letter value, is ${n}.`, `Include the digit ${n} in your mobile number, provided its total suits your Mulank and Bhagyank.`, `Signature: ${P.signatureTip}`]),
      tip(hi ? `एक साथ सारे उपाय न करें। पहले रोज़ की आदत 40 दिन तक अपनाएँ – मैंने देखा है कि अनुपस्थित अंक का सबसे पक्का उपाय व्यवहार में बदलाव है, वस्तुएँ उसके बाद सहायक होती हैं।` : `Do not start every remedy at once. Follow the daily habit for 40 days first – in my experience the surest remedy for a missing number is a change in behaviour; objects support it afterwards.`),
      p(hi ? `रत्न केवल विशेषज्ञ की पूरी कुंडली/चार्ट जाँच के बाद पहनें। ${T(P.gemstone.caution)}` : `Wear a gemstone only after an expert checks your full chart. ${P.gemstone.caution}`),
    ], true),
    calcSection(lang, ['loshu', 'moolank', 'bhagyank', 'name']),
    sec('faq', hi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions', [p(DISCLAIM[lang])]),
  ];
  const faqs = hi ? [
    { q: `क्या लो शू ग्रिड में ${n} अनुपस्थित होना बुरा है?`, a: 'नहीं। यह केवल एक गुण की स्वाभाविक कमी दिखाता है, जिसे आदत, रंग, दिशा और नाम/मोबाइल के उपायों से संतुलित किया जा सकता है।' },
    { q: `अनुपस्थित ${n} का सबसे आसान उपाय क्या है?`, a: `रोज़ की यह आदत: ${T(info.dailyHabit)} साथ में ${T(info.colour)} रंग का उपयोग।` },
    { q: 'क्या मोबाइल नंबर से अनुपस्थित अंक भरा जा सकता है?', a: `हाँ, मोबाइल नंबर में ${n} जोड़ना सहायक है, पर नंबर का कुल योग आपके मूलांक और भाग्यांक का मित्र होना चाहिए।` },
    { q: 'ग्रिड में कौन-से अंक जोड़े जाते हैं?', a: 'जन्म तिथि के सभी शून्य-रहित अंक, भाग्यांक, कुआ अंक और – यदि जन्म 11 या उसके बाद की तारीख़ (20 और 30 छोड़कर) को हुआ है – मूलांक।' },
    { q: 'क्या एक से ज़्यादा अंक अनुपस्थित हो सकते हैं?', a: 'हाँ, अधिकतर लोगों के 2 से 4 अंक अनुपस्थित होते हैं। पूरी रिपोर्ट में सबसे महत्वपूर्ण कमी पहले सुधारने का क्रम बताया जाता है।' },
  ] : [
    { q: `Is a missing ${n} in the Lo Shu grid bad?`, a: 'No. It shows a quality that comes less naturally, which habits, colours, directions and name or mobile remedies can balance.' },
    { q: `What is the easiest remedy for a missing ${n}?`, a: `This daily habit: ${info.dailyHabit} Add the colour ${info.colour.toLowerCase()} in clothes or your workspace.` },
    { q: 'Can a mobile number fill a missing number?', a: `Yes, including ${n} in your mobile number helps, but the number’s total must be friendly with your Mulank and Bhagyank.` },
    { q: 'Which numbers go into the grid?', a: 'All non-zero digits of the date of birth, the Bhagyank, the Kua number and – if you were born on the 11th or later (except the 20th and 30th) – the Mulank.' },
    { q: 'Can more than one number be missing?', a: 'Yes, most people have 2 to 4 missing numbers. A full report tells you which gap to work on first.' },
  ];
  return finish({ slug: loshuSlug(n), cat: 'loshu', title, h1, description,
    keywords: [`missing number ${n} in lo shu grid`, `missing ${n} in numerology`, `lo shu grid missing number ${n} remedies`, `number ${n} missing in date of birth`, `lo shu grid ${n}`, `लो शू ग्रिड अंक ${n}`],
    kicker: hi ? `लो शू ग्रिड · अनुपस्थित ${n}` : `Lo Shu grid · Missing ${n}`, sub: hi ? `अंक ${n} (${pl(lang, n)}) की कमी जीवन में कैसे दिखती है और उसे सरल उपायों से कैसे भरें।` : `How a missing ${n} (${pl(lang, n)}) shows in life, and how to fill it with simple remedies.`,
    art: { t: 'grid', present: ex.present, missing: n }, sections, faqs, service: serviceLink(lang, 'loshu'), calc: calcLink(lang, 'loshu') });
}

/* ═════════════════════════ Personal Year 1–9 ═════════════════════════ */

type PyText = { overview: string; career: string; love: string; money: string; health: string; doList: string[]; avoid: string[] };
const PY: Record<Lang, Record<number, PyText>> = {
  en: {
    1: { overview: 'Personal Year 1 opens a new nine-year cycle. It is a year of fresh starts, independence and planting seeds. What you begin now shapes the next nine years, so choose your direction with care and act boldly.', career: 'Start a business, apply for a new role, launch a project or ask for leadership. Initiative is rewarded more than waiting.', love: 'Singles meet people through new activities; couples do well when each supports the other’s new goals rather than competing.', money: 'Invest in skills and tools that help a new beginning. Avoid copying others’ investments; make your own plan.', health: 'Start a new fitness routine – habits begun in a 1 year tend to last.', doList: ['Set clear goals for the next nine years', 'Start the project you have postponed', 'Take decisions yourself'], avoid: ['Waiting for perfect conditions', 'Depending on others to push you', 'Ego clashes with seniors'] },
    2: { overview: 'Personal Year 2 is slow, gentle and relationship-focused. Seeds planted last year grow quietly. Patience, cooperation and diplomacy bring more than force.', career: 'Partnerships, team work and supporting roles go well. Results may be delayed; keep working steadily.', love: 'One of the best years for romance, engagement and marriage. Emotions run deep – listen and be tender.', money: 'Steady but not dramatic. Avoid lending large sums emotionally; joint finances need clear agreements.', health: 'Watch sleep, digestion and emotional stress; time near water and calm routines help.', doList: ['Build partnerships and alliances', 'Strengthen family bonds', 'Practise patience'], avoid: ['Forcing quick results', 'Taking criticism too personally', 'Breaking partnerships in a moment of hurt'] },
    3: { overview: 'Personal Year 3 brings expansion, creativity, social life and optimism. You feel more expressive and others notice you. It is a year to share your talents.', career: 'Excellent for marketing, teaching, writing, media and any work that needs communication. Learning a new skill pays off.', love: 'Social and fun; good for meeting people and celebrating with family. Avoid scattering your affection.', money: 'Income can grow through creative work and networking, but so can spending on enjoyment – keep a budget.', health: 'Good energy; just avoid overindulgence in food and late nights.', doList: ['Learn, teach or create something', 'Network and socialise', 'Celebrate milestones'], avoid: ['Scattering energy on too many plans', 'Careless talk and gossip', 'Overspending'] },
    4: { overview: 'Personal Year 4 is a year of hard work, discipline and building foundations. Progress comes through effort, order and attention to detail rather than luck.', career: 'Ideal for systems, structure, exams and long-term projects. Extra responsibility now builds lasting reputation.', love: 'Commitment and practical support matter more than romance. Share the workload at home.', money: 'Good for buying property, paying off loans and creating a savings system. Avoid shortcuts and risky deals.', health: 'Overwork is the risk – plan rest days and keep a regular routine.', doList: ['Organise finances and paperwork', 'Work on long-term goals', 'Build healthy routines'], avoid: ['Shortcuts and get-rich-quick schemes', 'Complaining about hard work', 'Neglecting rest'] },
    5: { overview: 'Personal Year 5 is the year of change, freedom, travel and new experiences. Life speeds up; unexpected opportunities arrive. Adaptability is your best tool.', career: 'Good for a job change, sales, travel-related work and new markets. Be ready to move quickly.', love: 'Exciting and changeable. Keep communication honest; avoid impulsive decisions in relationships.', money: 'Money moves in and out quickly. Grab good opportunities but avoid gambling and impulsive buying.', health: 'Restlessness and irregular habits can tire you – keep some fixed routine.', doList: ['Travel and explore', 'Embrace change at work', 'Try something new each month'], avoid: ['Impulsive commitments', 'Risky speculation', 'Restless over-scheduling'] },
    6: { overview: 'Personal Year 6 centres on home, family, love and responsibility. Duties increase, but so does the warmth of relationships. It is a year to care and be cared for.', career: 'Service, design, hospitality, healing and family business do well. Recognition comes for responsible work.', love: 'One of the best years for marriage, having a child and family events. Harmony at home brings luck outside.', money: 'Spending on home, family and beauty rises. Property and home improvement are favoured.', health: 'Take care of throat, skin and sugar; do not neglect yourself while caring for others.', doList: ['Plan family events, marriage or a new home', 'Beautify your home', 'Support loved ones'], avoid: ['Taking on everyone’s burdens', 'Interfering too much', 'Overspending on luxuries'] },
    7: { overview: 'Personal Year 7 is a quiet year of reflection, study, inner growth and spirituality. The outer world slows down so the inner world can deepen.', career: 'Excellent for research, higher study, specialised skills and analysis. Avoid big expansions; refine what you have.', love: 'You may want more space. Explain your need for quiet so your partner does not feel shut out.', money: 'Not a year for big gambles. Review investments and plan carefully.', health: 'Rest, meditation and nature are healing; watch stress and overthinking.', doList: ['Study, research or take a course', 'Meditate and spend time in nature', 'Review your life direction'], avoid: ['Major risky launches', 'Isolating yourself completely', 'Trusting blindly'] },
    8: { overview: 'Personal Year 8 is a year of power, money, career results and karma. Effort of past years can bring promotion, profit or recognition – along with bigger responsibilities.', career: 'Strong for promotions, business growth, leadership and important negotiations. Work with integrity.', love: 'Balance ambition with time for family; work pressure can create distance.', money: 'One of the best years for earnings and investments made with discipline. Keep accounts and taxes clean.', health: 'Stress, bones and joints need attention; keep a steady routine.', doList: ['Ask for what you deserve', 'Make disciplined investments', 'Take on leadership'], avoid: ['Unethical shortcuts', 'Ignoring family for work', 'Legal or tax carelessness'] },
    9: { overview: 'Personal Year 9 completes the nine-year cycle. It is a year of endings, release, forgiveness and service. Letting go of what no longer fits makes room for the new 1 year ahead.', career: 'Finish pending projects; change jobs only if it completes a chapter. Humanitarian and service work is rewarding.', love: 'Old issues surface to be resolved. Forgive and close what is finished; avoid starting things in anger.', money: 'Clear debts and declutter. Charity done now returns as goodwill.', health: 'Release stress through exercise; watch anger and inflammation.', doList: ['Complete unfinished work', 'Declutter home and life', 'Forgive and serve'], avoid: ['Starting big new ventures late in the year', 'Holding on to the past', 'Acting in anger'] },
  },
  hi: {
    1: { overview: 'व्यक्तिगत वर्ष 1 नौ वर्षों का नया चक्र खोलता है। यह नई शुरुआत, आत्मनिर्भरता और बीज बोने का वर्ष है। अभी जो शुरू करेंगे, वही अगले नौ वर्षों को आकार देगा – इसलिए दिशा सोच-समझकर चुनें और साहस से आगे बढ़ें।', career: 'व्यवसाय शुरू करें, नई नौकरी के लिए आवेदन करें, प्रोजेक्ट लॉन्च करें या नेतृत्व माँगें। इंतज़ार से अधिक पहल का फल मिलता है।', love: 'अविवाहित लोग नई गतिविधियों से नए लोगों से मिलते हैं; दंपति तब अच्छा करते हैं जब प्रतिस्पर्धा के बजाय एक-दूसरे के नए लक्ष्यों में साथ दें।', money: 'नई शुरुआत में मदद करने वाले कौशल और साधनों में निवेश करें। दूसरों की नकल में निवेश न करें; अपनी योजना बनाएँ।', health: 'नई फ़िटनेस दिनचर्या शुरू करें – वर्ष 1 में शुरू की आदतें लंबे समय तक टिकती हैं।', doList: ['अगले नौ वर्षों के स्पष्ट लक्ष्य बनाएँ', 'टाला हुआ प्रोजेक्ट शुरू करें', 'निर्णय स्वयं लें'], avoid: ['सही परिस्थितियों का अंतहीन इंतज़ार', 'दूसरों के धक्के पर निर्भर रहना', 'बड़ों से अहंकार का टकराव'] },
    2: { overview: 'व्यक्तिगत वर्ष 2 धीमा, कोमल और रिश्तों पर केंद्रित है। पिछले वर्ष बोए बीज चुपचाप बढ़ते हैं। ज़ोर से अधिक धैर्य, सहयोग और कूटनीति फल देती है।', career: 'साझेदारी, टीमवर्क और सहयोगी भूमिकाएँ अच्छी चलती हैं। परिणाम देर से आ सकते हैं; स्थिरता से काम करते रहें।', love: 'प्रेम, सगाई और विवाह के लिए सबसे अच्छे वर्षों में से एक। भावनाएँ गहरी रहती हैं – सुनें और कोमल रहें।', money: 'स्थिर, पर नाटकीय नहीं। भावनाओं में बड़ी रक़म उधार न दें; साझा वित्त में स्पष्ट समझौता रखें।', health: 'नींद, पाचन और भावनात्मक तनाव पर ध्यान दें; जल के पास समय और शांत दिनचर्या मदद करती है।', doList: ['साझेदारी और संबंध बनाएँ', 'पारिवारिक बंधन मज़बूत करें', 'धैर्य का अभ्यास करें'], avoid: ['जल्दी परिणाम के लिए ज़ोर लगाना', 'आलोचना को दिल पर लेना', 'आहत होकर साझेदारी तोड़ना'] },
    3: { overview: 'व्यक्तिगत वर्ष 3 विस्तार, रचनात्मकता, सामाजिक जीवन और आशावाद लाता है। आप अधिक अभिव्यक्त करते हैं और लोग आपको नोटिस करते हैं। अपनी प्रतिभा बाँटने का वर्ष है।', career: 'मार्केटिंग, अध्यापन, लेखन, मीडिया और संवाद वाले हर काम के लिए उत्तम। नया कौशल सीखना लाभ देता है।', love: 'मिलनसार और आनंदमय; नए लोगों से मिलने और परिवार के साथ उत्सव के लिए अच्छा। स्नेह को बिखरने न दें।', money: 'रचनात्मक काम और संपर्कों से आय बढ़ सकती है, पर मौज-मस्ती पर ख़र्च भी – बजट रखें।', health: 'ऊर्जा अच्छी रहती है; बस खान-पान और देर रात की अति से बचें।', doList: ['कुछ सीखें, सिखाएँ या रचें', 'संपर्क बढ़ाएँ और मिलें-जुलें', 'उपलब्धियों का उत्सव मनाएँ'], avoid: ['बहुत सारी योजनाओं में ऊर्जा बिखेरना', 'लापरवाह बातें और चुगली', 'फ़िज़ूलख़र्ची'] },
    4: { overview: 'व्यक्तिगत वर्ष 4 मेहनत, अनुशासन और नींव बनाने का वर्ष है। प्रगति भाग्य से नहीं, प्रयास, व्यवस्था और बारीकियों पर ध्यान से आती है।', career: 'व्यवस्था, ढाँचे, परीक्षाओं और लंबे प्रोजेक्ट के लिए आदर्श। अभी ली गई अतिरिक्त ज़िम्मेदारी स्थायी प्रतिष्ठा बनाती है।', love: 'रोमांस से अधिक प्रतिबद्धता और व्यावहारिक सहयोग महत्वपूर्ण है। घर के काम बाँटें।', money: 'संपत्ति ख़रीदने, ऋण चुकाने और बचत की व्यवस्था बनाने के लिए अच्छा। शॉर्टकट और जोखिम भरे सौदों से बचें।', health: 'अधिक काम का जोखिम है – आराम के दिन तय करें और नियमित दिनचर्या रखें।', doList: ['वित्त और काग़ज़ात व्यवस्थित करें', 'लंबे लक्ष्यों पर काम करें', 'स्वस्थ दिनचर्या बनाएँ'], avoid: ['शॉर्टकट और जल्दी अमीर बनने की योजनाएँ', 'मेहनत की शिकायत', 'आराम की उपेक्षा'] },
    5: { overview: 'व्यक्तिगत वर्ष 5 परिवर्तन, स्वतंत्रता, यात्रा और नए अनुभवों का वर्ष है। जीवन की गति बढ़ती है; अचानक अवसर आते हैं। लचीलापन आपका सबसे अच्छा साधन है।', career: 'नौकरी बदलने, सेल्स, यात्रा से जुड़े काम और नए बाज़ारों के लिए अच्छा। तेज़ी से आगे बढ़ने को तैयार रहें।', love: 'रोमांचक और बदलता हुआ। बातचीत ईमानदार रखें; रिश्तों में आवेग के निर्णय से बचें।', money: 'पैसा तेज़ी से आता-जाता है। अच्छे अवसर पकड़ें, पर जुए और आवेग की ख़रीदारी से बचें।', health: 'बेचैनी और अनियमित आदतें थका सकती हैं – कुछ दिनचर्या तय रखें।', doList: ['यात्रा करें और नई चीज़ें खोजें', 'काम में बदलाव को अपनाएँ', 'हर महीने कुछ नया आज़माएँ'], avoid: ['आवेग में वचन देना', 'जोखिम भरी सट्टेबाज़ी', 'बेचैनी में ज़रूरत से अधिक काम भरना'] },
    6: { overview: 'व्यक्तिगत वर्ष 6 घर, परिवार, प्रेम और ज़िम्मेदारी पर केंद्रित है। कर्तव्य बढ़ते हैं, पर रिश्तों की गर्माहट भी। देखभाल करने और पाने का वर्ष है।', career: 'सेवा, डिज़ाइन, आतिथ्य, उपचार और पारिवारिक व्यवसाय अच्छे चलते हैं। ज़िम्मेदार काम के लिए पहचान मिलती है।', love: 'विवाह, संतान और पारिवारिक आयोजनों के लिए सबसे अच्छे वर्षों में से एक। घर का सामंजस्य बाहर भी भाग्य लाता है।', money: 'घर, परिवार और सौंदर्य पर ख़र्च बढ़ता है। संपत्ति और घर के सुधार अनुकूल हैं।', health: 'गला, त्वचा और शुगर का ध्यान रखें; दूसरों की देखभाल में अपनी उपेक्षा न करें।', doList: ['पारिवारिक आयोजन, विवाह या नए घर की योजना', 'घर को सुंदर बनाएँ', 'अपनों का साथ दें'], avoid: ['सबका बोझ अपने सिर लेना', 'ज़रूरत से अधिक दख़ल', 'विलासिता पर अधिक ख़र्च'] },
    7: { overview: 'व्यक्तिगत वर्ष 7 चिंतन, अध्ययन, आंतरिक विकास और आध्यात्मिकता का शांत वर्ष है। बाहरी दुनिया धीमी होती है ताकि भीतर की दुनिया गहरी हो सके।', career: 'शोध, उच्च शिक्षा, विशेष कौशल और विश्लेषण के लिए उत्तम। बड़े विस्तार से बचें; जो है उसे निखारें।', love: 'आपको अधिक एकांत चाहिए हो सकता है। अपनी शांति की ज़रूरत समझाएँ ताकि साथी को दूरी न लगे।', money: 'बड़े दाँव का वर्ष नहीं। निवेशों की समीक्षा करें और सावधानी से योजना बनाएँ।', health: 'आराम, ध्यान और प्रकृति उपचार करते हैं; तनाव और अधिक सोचने से बचें।', doList: ['अध्ययन, शोध या कोर्स करें', 'ध्यान करें और प्रकृति में समय बिताएँ', 'जीवन की दिशा की समीक्षा करें'], avoid: ['बड़े जोखिम भरे लॉन्च', 'स्वयं को पूरी तरह अलग कर लेना', 'आँख मूँदकर भरोसा'] },
    8: { overview: 'व्यक्तिगत वर्ष 8 शक्ति, धन, करियर के परिणाम और कर्म का वर्ष है। पिछले वर्षों की मेहनत पदोन्नति, लाभ या पहचान दे सकती है – साथ में बड़ी ज़िम्मेदारियाँ भी।', career: 'पदोन्नति, व्यवसाय-विस्तार, नेतृत्व और महत्वपूर्ण बातचीत के लिए प्रबल। ईमानदारी से काम करें।', love: 'महत्वाकांक्षा के साथ परिवार के लिए भी समय रखें; काम का दबाव दूरी बना सकता है।', money: 'अनुशासन से की गई कमाई और निवेश के लिए सबसे अच्छे वर्षों में से एक। हिसाब और कर साफ़ रखें।', health: 'तनाव, हड्डियों और जोड़ों पर ध्यान दें; नियमित दिनचर्या रखें।', doList: ['जो आपका हक़ है वह माँगें', 'अनुशासित निवेश करें', 'नेतृत्व की ज़िम्मेदारी लें'], avoid: ['अनैतिक शॉर्टकट', 'काम के लिए परिवार की उपेक्षा', 'क़ानूनी या कर संबंधी लापरवाही'] },
    9: { overview: 'व्यक्तिगत वर्ष 9 नौ वर्षों का चक्र पूरा करता है। यह समापन, मुक्ति, क्षमा और सेवा का वर्ष है। जो अब उपयुक्त नहीं, उसे छोड़ने से आने वाले वर्ष 1 के लिए जगह बनती है।', career: 'अधूरे प्रोजेक्ट पूरे करें; नौकरी तभी बदलें जब इससे एक अध्याय पूरा हो। सेवा और मानवतावादी काम संतोष देता है।', love: 'पुरानी बातें सुलझने के लिए सामने आती हैं। क्षमा करें और जो पूरा हो चुका उसे बंद करें; क्रोध में कुछ शुरू न करें।', money: 'ऋण चुकाएँ और अनावश्यक चीज़ें हटाएँ। अभी किया दान सद्भावना बनकर लौटता है।', health: 'व्यायाम से तनाव निकालें; क्रोध और सूजन का ध्यान रखें।', doList: ['अधूरा काम पूरा करें', 'घर और जीवन से अव्यवस्था हटाएँ', 'क्षमा और सेवा करें'], avoid: ['वर्ष के अंत में बड़े नए उद्यम', 'अतीत से चिपके रहना', 'क्रोध में निर्णय'] },
  },
};

/** A birthday whose personal year starting in `year` is n (deterministic, for the worked example). */
function pyExample(n: number, year: number) {
  for (let mo = 1; mo <= 12; mo++) for (let d = 3; d <= 28; d += 5) {
    if (personalYear({ year: 1990, month: mo, day: d }, year) === n && (mo + d + n) % 3 === 0) return { day: d, month: mo };
  }
  for (let mo = 1; mo <= 12; mo++) for (let d = 1; d <= 28; d++) if (personalYear({ year: 1990, month: mo, day: d }, year) === n) return { day: d, month: mo };
  throw new Error('no py example');
}
const MONTH = { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'] };

export const pySlug = (n: number) => `personal-year-${n}-numerology-meaning-2026-2027`;
const EVENT: Record<Lang, Record<string, string>> = {
  en: { marriage: 'Marriage', jobChange: 'Job change', businessStart: 'Starting a business', propertyPurchase: 'Buying property' },
  hi: { marriage: 'विवाह', jobChange: 'नौकरी बदलना', businessStart: 'व्यवसाय शुरू करना', propertyPurchase: 'संपत्ति ख़रीदना' },
};

function buildPy(n: number, lang: Lang): TopicPost {
  const hi = lang === 'hi';
  const t = PY[lang][n], P = planetOf(n), T = (s: string) => tr(lang, s);
  const ex = pyExample(n, 2026);
  const per = personalYearPeriod({ year: 1990, month: ex.month, day: ex.day }, 2026);
  const fmt = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTH[lang][m - 1]} ${y}`; };
  const sumLine = `${String(ex.day).split('').join(' + ')} + ${String(ex.month).split('').join(' + ')} + 2 + 0 + 2 + 6`;
  const total = String(ex.day).split('').map(Number).reduce((a, b) => a + b, 0) + String(ex.month).split('').map(Number).reduce((a, b) => a + b, 0) + 10;
  const events = Object.entries(SCORING.eventYears).map(([k, ys]) => [EVENT[lang][k], ys.includes(n) ? (hi ? 'अनुकूल ✓' : 'Favourable ✓') : (hi ? 'सामान्य' : 'Neutral')]);
  const title = hi ? `व्यक्तिगत वर्ष ${n}: अर्थ, करियर, प्रेम और उपाय (2026–2027)` : `Personal Year ${n} Numerology: Meaning, Career & Love (2026–27)`;
  const h1 = hi ? `व्यक्तिगत वर्ष ${n}: ${PY_THEMES.hi[n]} का वर्ष` : `Personal Year ${n}: A Year of ${PY_THEMES.en[n]}`;
  const description = clip(`Personal Year ${n} meaning in numerology: ${PY_THEMES.en[n].toLowerCase()}. Career, love, money, health, what to do and avoid, with the birthday-to-birthday method by Acharya Nandram.`);
  const sections: Section[] = [
    sec('overview', hi ? `व्यक्तिगत वर्ष ${n} का अर्थ` : `What Personal Year ${n} Means`, [
      p(t.overview),
      fig({ t: 'year', n }, hi ? `व्यक्तिगत वर्ष ${n} – ${PY_THEMES.hi[n]}` : `Personal Year ${n} – ${PY_THEMES.en[n]}`),
      table(hi ? ['विवरण', `वर्ष ${n}`] : ['At a glance', `Year ${n}`], [[hi ? 'मुख्य विषय' : 'Theme', PY_THEMES[lang][n]], [hi ? 'ग्रह' : 'Planet', pl(lang, n)], [hi ? 'शुभ दिन' : 'Supportive day', T(P.weekday)], [hi ? 'शुभ रंग' : 'Supportive colours', P.colours.slice(0, 3).map(T).join(', ')]]),
    ], true),
    sec('calculate', hi ? 'अपना व्यक्तिगत वर्ष कैसे निकालें' : 'How to Calculate Your Personal Year', [
      p(hi ? 'हमारी विधि में व्यक्तिगत वर्ष जन्मदिन से जन्मदिन तक चलता है, 1 जनवरी से नहीं। जन्म का दिन + जन्म का महीना + उस वर्ष के अंक जोड़ें जिसमें आपका पिछला जन्मदिन आया था, फिर एक अंक तक लाएँ।' : 'In our method the personal year runs from birthday to birthday, not from 1 January. Add the day of birth + month of birth + the year in which your last birthday fell, then reduce to one digit.'),
      steps([
        { title: hi ? `जन्म: ${ex.day} ${MONTH.hi[ex.month - 1]}` : `Born ${ex.day} ${MONTH.en[ex.month - 1]}`, text: hi ? `2026 के जन्मदिन से: ${sumLine} = ${total} → ${n}` : `From the 2026 birthday: ${sumLine} = ${total} → ${n}` },
        { title: hi ? 'अवधि' : 'Period', text: hi ? `यह व्यक्तिगत वर्ष ${n} ${fmt(per.from)} से ${fmt(per.to)} तक चलता है।` : `This Personal Year ${n} runs from ${fmt(per.from)} to ${fmt(per.to)}.` },
      ]),
      p(hi ? 'अर्थात 2026 के जन्मदिन से पहले की अवधि पिछले व्यक्तिगत वर्ष में गिनी जाती है। मुफ़्त व्यक्तिगत वर्ष कैलकुलेटर यह अपने-आप करता है।' : 'So the months before your 2026 birthday still belong to the previous personal year. The free Personal Year calculator does this automatically.'),
    ]),
    sec('career', hi ? 'करियर और व्यवसाय' : 'Career and Business', [p(t.career)]),
    sec('love', hi ? 'प्रेम और विवाह' : 'Love and Marriage', [p(t.love)]),
    sec('money', hi ? 'धन और स्वास्थ्य' : 'Money and Health', [p(t.money), p(t.health)]),
    sec('events', hi ? 'बड़े निर्णयों के लिए यह वर्ष कैसा है' : 'Is This a Good Year for Big Decisions?', [
      table(hi ? ['निर्णय', `व्यक्तिगत वर्ष ${n}`] : ['Decision', `Personal Year ${n}`], events),
      p(hi ? 'यह तालिका वही नियम उपयोग करती है जो हमारी रिपोर्ट में "सही समय" बताने के लिए लगते हैं। अंतिम समय के लिए आपका मूलांक, भाग्यांक और व्यक्तिगत माह भी देखे जाते हैं।' : 'This table uses the same rules our reports use to suggest timing. For exact timing, your Mulank, Bhagyank and personal month are also considered.'),
    ]),
    sec('do', hi ? 'क्या करें और क्या न करें' : 'What to Do and What to Avoid', [
      table(hi ? ['करें', 'न करें'] : ['Do', 'Avoid'], t.doList.map((d, i) => [d, t.avoid[i] ?? ''])),
      tip(hi ? `वर्ष की शुरुआत (अपने जन्मदिन) पर तीन लक्ष्य लिखें जो "${PY_THEMES.hi[n]}" से मेल खाते हों। साल भर में जब भी निर्णय उलझे, उन्हीं तीन लक्ष्यों से मिलान करें।` : `On your birthday, write three goals that match the theme of “${PY_THEMES.en[n].toLowerCase()}”. Whenever a decision feels confusing during the year, check it against those three goals.`),
    ], true),
    sec('remedies', hi ? `व्यक्तिगत वर्ष ${n} के उपाय` : `Remedies for Personal Year ${n}`, [
      list(hi ? [`${T(P.weekday)} को ${T(P.deity)} की पूजा या स्मरण करें।`, `मंत्र: ${T(P.mantra.beej)} – प्रतिदिन ${P.mantra.dailyCount} बार।`, `दान: ${P.daan.slice(0, 3).map(T).join(', ')}।`, `महत्वपूर्ण कामों में ${P.colours.slice(0, 2).map(T).join(' या ')} रंग का उपयोग करें।`]
        : [`Remember or worship ${P.deity} on ${P.weekday}s.`, `Mantra: ${P.mantra.beej} – ${P.mantra.dailyCount} times daily.`, `Daan: ${P.daan.slice(0, 3).join(', ')}.`, `Use ${P.colours.slice(0, 2).join(' or ').toLowerCase()} for important work days.`]),
    ]),
    calcSection(lang, ['year', 'moolank', 'bhagyank', 'loshu']),
    sec('faq', hi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions', [p(DISCLAIM[lang])]),
  ];
  const faqs = hi ? [
    { q: `व्यक्तिगत वर्ष ${n} कब शुरू होता है?`, a: 'आपके जन्मदिन पर, और अगले जन्मदिन से एक दिन पहले समाप्त होता है।' },
    { q: `क्या व्यक्तिगत वर्ष ${n} विवाह के लिए अच्छा है?`, a: SCORING.eventYears.marriage.includes(n) ? 'हाँ, हमारी विधि में यह विवाह के लिए अनुकूल वर्षों में से है।' : 'हमारी विधि में विवाह के लिए वर्ष 2 और 6 सबसे अनुकूल हैं। इस वर्ष विवाह हो तो तिथि दोनों के मित्र अंकों में चुनें।' },
    { q: 'व्यक्तिगत वर्ष और सार्वभौमिक वर्ष में क्या अंतर है?', a: 'सार्वभौमिक वर्ष सबके लिए एक है (जैसे 2026 = 1, 2027 = 2), जबकि व्यक्तिगत वर्ष आपकी जन्म तिथि से निकलता है और केवल आपका होता है।' },
    { q: `व्यक्तिगत वर्ष ${n} के बाद कौन-सा वर्ष आएगा?`, a: `अगले जन्मदिन से व्यक्तिगत वर्ष ${n === 9 ? 1 : n + 1} शुरू होगा।` },
    { q: 'क्या पूरे वर्ष का माह-वार मार्गदर्शन मिल सकता है?', a: 'हाँ, व्यक्तिगत वर्ष परामर्श में आचार्य नंदराम हर व्यक्तिगत माह का मार्गदर्शन और महत्वपूर्ण तिथियाँ देते हैं।' },
  ] : [
    { q: `When does Personal Year ${n} start?`, a: 'On your birthday, and it ends the day before your next birthday.' },
    { q: `Is Personal Year ${n} good for marriage?`, a: SCORING.eventYears.marriage.includes(n) ? 'Yes, in our method it is one of the favourable years for marriage.' : 'In our method years 2 and 6 are the most favourable for marriage. If you marry this year, choose a date friendly to both partners.' },
    { q: 'What is the difference between personal year and universal year?', a: 'The universal year is the same for everyone (e.g. 2026 = 1, 2027 = 2), while the personal year comes from your date of birth and is yours alone.' },
    { q: `What comes after Personal Year ${n}?`, a: `Personal Year ${n === 9 ? 1 : n + 1} begins on your next birthday.` },
    { q: 'Can I get month-by-month guidance for the year?', a: 'Yes, the Personal Year consultancy gives guidance for each personal month and key dates, prepared by Acharya Nandram.' },
  ];
  return finish({ slug: pySlug(n), cat: 'personal-year', title, h1, description,
    keywords: [`personal year ${n}`, `personal year ${n} numerology`, `personal year ${n} meaning`, `personal year ${n} 2026`, `personal year ${n} 2027`, `personal year ${n} career`, `व्यक्तिगत वर्ष ${n}`],
    kicker: hi ? `व्यक्तिगत वर्ष · ${PY_THEMES.hi[n]}` : `Personal year · ${PY_THEMES.en[n]}`, sub: hi ? `वर्ष ${n} में करियर, प्रेम, धन और स्वास्थ्य – जन्मदिन से जन्मदिन की विधि से।` : `Career, love, money and health in year ${n}, using the birthday-to-birthday method.`,
    art: { t: 'year', n }, sections, faqs, service: serviceLink(lang, 'year'), calc: calcLink(lang, 'year') });
}

export const LOSHU_POSTS: TopicRef[] = NUMS.map((n) => ({ slug: loshuSlug(n), cat: 'loshu' as const, build: (l: Lang) => buildLoshu(n, l) }));
export const PY_POSTS: TopicRef[] = NUMS.map((n) => ({ slug: pySlug(n), cat: 'personal-year' as const, build: (l: Lang) => buildPy(n, l) }));

