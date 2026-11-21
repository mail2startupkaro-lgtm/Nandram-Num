/**
 * Destiny Matrix Analysis report (English + Hindi): chart, every zone of the matrix read in plain language,
 * purposes, health map, ancestral lines and the 0–80 life timeline with the current period highlighted.
 */
import { arcana, type ArcanaInfo } from './arcana';
import { ageEnergy, ageRange, destinyMatrix, dominantEnergies, exactAge, type ChakraId, type DestinyMatrix } from './matrix';
import { destinySvg } from './svg';
import { fmtDob, type Blk, type Lang, type ReportSection, type WrittenReport } from '@/lib/report/blocks';

export interface DestinyData {
  name: string; dob: string; asOf: string; age: number;
  m: DestinyMatrix;
  current: { age: number; value: number }; upcoming: { age: number; value: number }[];
  dominant: { arcana: number; count: number }[];
}

export function analyseDestiny(input: { name: string; dob: string; asOf: string }): DestinyData {
  const m = destinyMatrix(input.dob);
  const age = exactAge(m.dob, input.asOf);
  const idx = Math.max(0, Math.min(63, Math.floor(age / 1.25)));
  const current = ageEnergy(m, age);
  return {
    name: input.name.trim(), dob: m.dob, asOf: input.asOf, age, m,
    current: { age: current.age, value: current.value },
    upcoming: m.ages.slice(idx + 1, idx + 9).map((p) => ({ age: p.age, value: p.value })),
    dominant: dominantEnergies(m).filter((x) => x.count >= 2),
  };
}

const CHAKRAS: Record<ChakraId, { en: [string, string]; hi: [string, string] }> = {
  sahasrara: { en: ['Sahasrara (crown)', 'Head, brain, sleep and the sense of purpose'], hi: ['सहस्रार (शीर्ष)', 'सिर, मस्तिष्क, नींद और जीवन-उद्देश्य का भाव'] },
  ajna: { en: ['Ajna (third eye)', 'Eyes, sinuses, hormones and intuition'], hi: ['आज्ञा (तीसरा नेत्र)', 'आँखें, साइनस, हार्मोन और अंतर्ज्ञान'] },
  vishuddha: { en: ['Vishuddha (throat)', 'Throat, thyroid, neck and self-expression'], hi: ['विशुद्ध (कंठ)', 'गला, थायरॉइड, गर्दन और अभिव्यक्ति'] },
  anahata: { en: ['Anahata (heart)', 'Heart, lungs, chest and the ability to love'], hi: ['अनाहत (हृदय)', 'हृदय, फेफड़े, छाती और प्रेम करने की क्षमता'] },
  manipura: { en: ['Manipura (solar plexus)', 'Digestion, liver, stomach and self-confidence'], hi: ['मणिपुर (नाभि)', 'पाचन, लीवर, पेट और आत्मविश्वास'] },
  svadhisthana: { en: ['Svadhisthana (sacral)', 'Kidneys, reproductive organs, lower back, pleasure and money'], hi: ['स्वाधिष्ठान (त्रिक)', 'गुर्दे, प्रजनन अंग, कमर का निचला भाग, आनंद और धन'] },
  muladhara: { en: ['Muladhara (root)', 'Spine, legs, bones, immunity and feeling safe'], hi: ['मूलाधार (मूल)', 'रीढ़, पैर, हड्डियाँ, प्रतिरक्षा और सुरक्षा का भाव'] },
};

const fmtAge = (a: number, lang: Lang) => (lang === 'hi' ? `${ageRange(a)} वर्ष` : `age ${ageRange(a)}`);

export function writeDestiny(d: DestinyData, lang: Lang): WrittenReport {
  const hi = lang === 'hi';
  const m = d.m;
  const A = (n: number): ArcanaInfo => arcana(n);
  const nm = (n: number) => `${n} – ${A(n).name[lang]}`;
  const read = (n: number, field: 'talent' | 'money' | 'love' | 'karma' | 'purpose' | 'body'): string => A(n)[field][lang];
  const plusMinus = (n: number): Blk[] => [
    { k: 'p', t: `${hi ? 'मुख्य गुण' : 'Key themes'}: ${A(n).keys[lang]}${hi ? '।' : '.'}` },
    { k: 'list', items: [`${hi ? 'सकारात्मक रूप में (प्लस)' : 'In the plus'}: ${A(n).plus[lang]}`, `${hi ? 'नकारात्मक रूप में (माइनस)' : 'In the minus'}: ${A(n).minus[lang]}`] },
  ];
  const T = (en: string, h: string) => (hi ? h : en);
  const s: ReportSection[] = [];
  const add = (id: string, title: string, blocks: Blk[]) => s.push({ id, title, blocks });

  // 1. Chart
  add('chart', T('Your Destiny Matrix', 'आपकी डेस्टिनी मैट्रिक्स'), [
    { k: 'svg', svg: destinySvg(m), caption: `${d.name} · ${fmtDob(d.dob, lang)}` },
    { k: 'tiles', items: [
      { label: T('A · Personality', 'A · व्यक्तित्व'), value: String(m.A) }, { label: T('B · Talents', 'B · प्रतिभा'), value: String(m.B) },
      { label: T('C · Material karma', 'C · भौतिक कर्म'), value: String(m.C) }, { label: T('D · Karmic task', 'D · कर्म-कार्य'), value: String(m.D) },
      { label: T('E · Comfort zone', 'E · सहज क्षेत्र'), value: String(m.E) }, { label: T('Karmic tail', 'कर्म-पूँछ'), value: m.karmicTail.join('-') },
    ] },
    { k: 'p', t: T(
      'Your date of birth becomes 22 energies (the Major Arcana), placed on an eight-pointed star. The left point is your day of birth, the top is your month, the right is your year and the bottom is their sum; the centre joins them all. Every other point is the sum of two points, reduced to 1–22 by adding digits (the Natalia Ladini method). Each energy can be lived in its bright form ("plus") or its shadow form ("minus") – this report shows both and how to stay in the plus.',
      'आपकी जन्म तिथि 22 ऊर्जाओं (मेजर आर्काना) में बदलकर आठ-कोणीय तारे पर रखी जाती है। बायाँ बिंदु आपका जन्म दिन है, ऊपर का बिंदु जन्म माह, दायाँ बिंदु जन्म वर्ष और नीचे का बिंदु इनका योग है; केंद्र इन सबको जोड़ता है। हर दूसरा बिंदु दो बिंदुओं का योग है, जिसे अंक जोड़कर 1–22 में लाया जाता है (नतालिया लादिनी पद्धति)। हर ऊर्जा को उज्ज्वल रूप ("प्लस") या छाया रूप ("माइनस") में जिया जा सकता है – यह रिपोर्ट दोनों दिखाती है और प्लस में रहने का तरीका बताती है।') },
  ]);

  // 2. Summary
  const dom = d.dominant.slice(0, 3);
  add('summary', T('Your matrix at a glance', 'एक नज़र में आपकी मैट्रिक्स'), [
    { k: 'table', head: [T('Area', 'क्षेत्र'), T('Energy', 'ऊर्जा'), T('In short', 'संक्षेप में')], rows: [
      [T('Personality', 'व्यक्तित्व'), nm(m.A), A(m.A).keys[lang]],
      [T('Talents', 'प्रतिभा'), nm(m.B), A(m.B).keys[lang]],
      [T('Comfort zone (core)', 'सहज क्षेत्र (केंद्र)'), nm(m.E), A(m.E).keys[lang]],
      [T('Money & work', 'धन और काम'), nm(m.money), A(m.money).keys[lang]],
      [T('Relationships', 'रिश्ते'), nm(m.love), A(m.love).keys[lang]],
      [T('Karmic lesson', 'कर्म-सीख'), nm(m.D), A(m.D).keys[lang]],
      [T('Life purpose (20–40)', 'जीवन उद्देश्य (20–40)'), nm(m.personal), A(m.personal).keys[lang]],
      [T('Now', 'अभी'), `${nm(d.current.value)} (${fmtAge(d.current.age, lang)})`, A(d.current.value).keys[lang]],
    ] },
    ...(dom.length ? [{ k: 'tip' as const, t: T(
      `Strongest energies in your chart (appearing more than once): ${dom.map((x) => `${nm(x.arcana)} ×${x.count}`).join(', ')}. These colour your whole life – their bright side is your biggest resource.`,
      `आपके चार्ट की सबसे प्रबल ऊर्जाएँ (एक से अधिक बार): ${dom.map((x) => `${nm(x.arcana)} ×${x.count}`).join(', ')}। ये आपके पूरे जीवन को रंगती हैं – इनका उज्ज्वल पक्ष आपका सबसे बड़ा संसाधन है।`) }] : []),
  ]);

  // 3. Personality
  add('personality', T('Personality – how you come across (A)', 'व्यक्तित्व – आप कैसे दिखते हैं (A)'), [
    { k: 'p', t: T(`The day of birth (A = ${nm(m.A)}) is your "calling card" – how people see you at first meeting and the qualities you show most easily.`, `जन्म दिन (A = ${nm(m.A)}) आपका "परिचय-पत्र" है – पहली मुलाक़ात में लोग आपको कैसे देखते हैं और कौन-से गुण आप सबसे आसानी से दिखाते हैं।`) },
    ...plusMinus(m.A),
    { k: 'p', t: T(`Deeper layers of the personality line: ${nm(m.a2)} (how you behave with close people) and ${nm(m.a1)} (your inner self, nearest the centre).`, `व्यक्तित्व रेखा की गहरी परतें: ${nm(m.a2)} (क़रीबी लोगों के साथ आपका व्यवहार) और ${nm(m.a1)} (केंद्र के सबसे पास – आपका भीतरी स्वरूप)।`) },
    { k: 'tip', t: `${T('How to stay in the plus', 'प्लस में कैसे रहें')}: ${A(m.A).advice[lang]}` },
  ]);

  // 4. Talents
  add('talents', T('Talents (B)', 'प्रतिभा (B)'), [
    { k: 'p', t: T(`The month of birth (B = ${nm(m.B)}) shows talents you were born with – what comes naturally and lifts you up.`, `जन्म माह (B = ${nm(m.B)}) जन्मजात प्रतिभा दिखाता है – जो स्वाभाविक रूप से आता है और आपको ऊपर उठाता है।`) },
    { k: 'list', items: [`${nm(m.B)}: ${read(m.B, 'talent')}`, `${nm(m.b2)}: ${read(m.b2, 'talent')}`, `${nm(m.b1)}: ${read(m.b1, 'talent')}`] },
    { k: 'tip', t: `${T('Develop it', 'इसे विकसित करें')}: ${A(m.B).advice[lang]}` },
  ]);

  // 5. Comfort zone
  add('core', T('Comfort zone – the core of your personality (E)', 'सहज क्षेत्र – आपके व्यक्तित्व का केंद्र (E)'), [
    { k: 'p', t: T(`The centre (E = ${nm(m.E)}) is where you feel at home and recharge. When life is hard, return to this energy; when you live it in the plus, everything else in the matrix works better.`, `केंद्र (E = ${nm(m.E)}) वह स्थान है जहाँ आप सहज महसूस करते हैं और ऊर्जा पाते हैं। कठिन समय में इसी ऊर्जा पर लौटें; जब आप इसे प्लस में जीते हैं, तो मैट्रिक्स का बाकी सब बेहतर काम करता है।`) },
    ...plusMinus(m.E),
    { k: 'tip', t: `${T('Recharge', 'ऊर्जा पाएँ')}: ${A(m.E).advice[lang]}` },
  ]);

  // 6. Money
  add('money', T('Money & work – the material line', 'धन और काम – भौतिक रेखा'), [
    { k: 'p', t: T(`Your year of birth (C = ${nm(m.C)}) shows material karma: how you relate to work and money. The money channel runs ${m.C} → ${m.c2} → ${m.c1} and opens at the money point ${nm(m.money)}.`, `आपका जन्म वर्ष (C = ${nm(m.C)}) भौतिक कर्म दिखाता है: काम और धन से आपका संबंध। धन-चैनल ${m.C} → ${m.c2} → ${m.c1} चलता है और धन-बिंदु ${nm(m.money)} पर खुलता है।`) },
    { k: 'table', head: [T('Point', 'बिंदु'), T('Energy', 'ऊर्जा'), T('What it says', 'यह क्या बताता है')], rows: [
      [T('Money point ($)', 'धन-बिंदु ($)'), nm(m.money), read(m.money, 'money')],
      [T('Entry to money (C1)', 'धन का प्रवेश (C1)'), nm(m.c1), read(m.c1, 'money')],
      [T('Material karma (C)', 'भौतिक कर्म (C)'), nm(m.C), read(m.C, 'money')],
      [T('Balance point', 'संतुलन बिंदु'), nm(m.x), A(m.x).keys[lang]],
    ] },
    { k: 'p', t: T(`Money flows best when you work through your talents (${nm(m.B)}) in the field of your money point. In the minus: ${A(m.money).minus.en}`, `धन तब सबसे अच्छा बहता है जब आप अपनी प्रतिभा (${nm(m.B)}) से अपने धन-बिंदु के क्षेत्र में काम करते हैं। माइनस में: ${A(m.money).minus.hi}`) },
    { k: 'tip', t: `${T('Money tip', 'धन सुझाव')}: ${A(m.money).advice[lang]}` },
  ]);

  // 7. Relationships
  add('love', T('Love & relationships', 'प्रेम और रिश्ते'), [
    { k: 'p', t: T(`The relationship line runs ${m.D} → ${m.d2} → ${m.d1} and meets money at the balance point (${nm(m.x)}). Your love point is ${nm(m.love)} – what you seek and how you love when the line is in the plus.`, `रिश्तों की रेखा ${m.D} → ${m.d2} → ${m.d1} चलती है और संतुलन बिंदु (${nm(m.x)}) पर धन से मिलती है। आपका प्रेम-बिंदु ${nm(m.love)} है – प्लस में आप क्या खोजते हैं और कैसे प्रेम करते हैं।`) },
    { k: 'list', items: [`${T('Love point', 'प्रेम-बिंदु')} ${nm(m.love)}: ${read(m.love, 'love')}`, `${T('Entry to relationships', 'रिश्तों का प्रवेश')} ${nm(m.d1)}: ${read(m.d1, 'love')}`] },
    { k: 'p', t: T(`Watch for the shadow: ${A(m.love).minus.en}`, `छाया पक्ष से सावधान: ${A(m.love).minus.hi}`) },
    { k: 'tip', t: `${T('For a happy relationship', 'सुखी रिश्ते के लिए')}: ${A(m.love).advice[lang]}` },
  ]);

  // 8. Karmic tail
  add('tail', T('Karmic tail – the lesson you carry', 'कर्म-पूँछ – आपकी सीख'), [
    { k: 'p', t: T(`Your karmic tail is ${m.karmicTail.join('-')} (read from the centre outwards). It describes a pattern you are here to work through. Repeating its shadow brings the same problems back; living its bright side frees you.`, `आपकी कर्म-पूँछ ${m.karmicTail.join('-')} है (केंद्र से बाहर की ओर पढ़ी जाती है)। यह वह पैटर्न बताती है जिस पर आपको काम करना है। इसकी छाया दोहराने से वही समस्याएँ लौटती हैं; इसका उज्ज्वल पक्ष जीने से मुक्ति मिलती है।`) },
    { k: 'list', items: m.karmicTail.map((n) => `${nm(n)}: ${read(n, 'karma')}`) },
    { k: 'tip', t: `${T('Main lesson', 'मुख्य सीख')} (${nm(m.D)}): ${A(m.D).karma[lang]} ${A(m.D).advice[lang]}` },
  ]);

  // 9. Ancestral lines
  add('family', T('Family & ancestral lines', 'परिवार और पूर्वज रेखाएँ'), [
    { k: 'p', t: T('The diagonal square shows what you received from your family. The line from top-left to bottom-right is the father\'s side, the other is the mother\'s side; the upper corners hold spiritual gifts, the lower corners material ones.', 'तिरछा वर्ग दिखाता है कि आपको परिवार से क्या मिला। ऊपर-बाएँ से नीचे-दाएँ की रेखा पिता का पक्ष है, दूसरी माता का; ऊपर के कोने आध्यात्मिक देन और नीचे के कोने भौतिक देन दर्शाते हैं।') },
    { k: 'table', head: [T('Line', 'रेखा'), T('Spiritual (upper)', 'आध्यात्मिक (ऊपर)'), T('Material (lower)', 'भौतिक (नीचे)')], rows: [
      [T("Father's side", 'पिता का पक्ष'), nm(m.F), nm(m.H)], [T("Mother's side", 'माता का पक्ष'), nm(m.G), nm(m.I)],
    ] },
    { k: 'p', t: T(`Family force (sum of the four corners): ${nm(m.familyForce)} – ${A(m.familyForce).plus.en}`, `पारिवारिक शक्ति (चारों कोनों का योग): ${nm(m.familyForce)} – ${A(m.familyForce).plus.hi}`) },
    { k: 'tip', t: `${T('Heal the family line', 'पारिवारिक रेखा का उपचार')}: ${A(m.familyForce).karma[lang]}` },
  ]);

  // 10. Purposes
  add('purpose', T('Life purposes', 'जीवन के उद्देश्य'), [
    { k: 'table', head: [T('Purpose', 'उद्देश्य'), T('How it is found', 'कैसे निकलता है'), T('Energy', 'ऊर्जा'), T('Meaning', 'अर्थ')], rows: [
      [T('Personal (about age 20–40)', 'व्यक्तिगत (लगभग 20–40 वर्ष)'), T(`Sky ${m.sky} + Earth ${m.earth}`, `आकाश ${m.sky} + पृथ्वी ${m.earth}`), nm(m.personal), read(m.personal, 'purpose')],
      [T('Social (about age 40–60)', 'सामाजिक (लगभग 40–60 वर्ष)'), T(`Male line ${m.male} + Female line ${m.female}`, `पुरुष रेखा ${m.male} + स्त्री रेखा ${m.female}`), nm(m.social), read(m.social, 'purpose')],
      [T('Spiritual (from about 60)', 'आध्यात्मिक (लगभग 60 से)'), T('Personal + Social', 'व्यक्तिगत + सामाजिक'), nm(m.spiritual), read(m.spiritual, 'purpose')],
      [T('Planetary (whole life)', 'ग्रहीय (पूरा जीवन)'), T('Social + Spiritual', 'सामाजिक + आध्यात्मिक'), nm(m.planetary), read(m.planetary, 'purpose')],
    ] },
    { k: 'p', t: T(`Sky line ${nm(m.sky)} shows what you need to learn inwardly; earth line ${nm(m.earth)} shows what to build in the material world. Your first life task is to bring them together as ${nm(m.personal)}.`, `आकाश रेखा ${nm(m.sky)} बताती है कि भीतर क्या सीखना है; पृथ्वी रेखा ${nm(m.earth)} बताती है कि भौतिक जगत में क्या बनाना है। आपका पहला जीवन-कार्य इन्हें ${nm(m.personal)} के रूप में जोड़ना है।`) },
  ]);

  // 11. Health map
  add('health', T('Health map (chakras)', 'स्वास्थ्य मानचित्र (चक्र)'), [
    { k: 'p', t: T('Each energy centre gets three numbers: Body (physical), Energy and Emotions (their sum). Centres whose energies are in the minus in your life are the ones to support first. This is traditional guidance about balance – it is not a medical diagnosis.', 'हर ऊर्जा केंद्र के तीन अंक होते हैं: शरीर, ऊर्जा और भावनाएँ (इनका योग)। जिन केंद्रों की ऊर्जाएँ आपके जीवन में माइनस में हैं, उन्हें पहले सहारा दें। यह संतुलन पर पारंपरिक मार्गदर्शन है – चिकित्सा निदान नहीं।') },
    { k: 'table', head: [T('Chakra', 'चक्र'), T('Body', 'शरीर'), T('Energy', 'ऊर्जा'), T('Emotions', 'भावनाएँ'), T('Area', 'क्षेत्र')], rows: [
      ...m.health.map((h) => [CHAKRAS[h.id][lang][0], String(h.body), String(h.energy), String(h.emotion), CHAKRAS[h.id][lang][1]]),
      [T('Total', 'कुल'), String(m.healthTotal.body), String(m.healthTotal.energy), String(m.healthTotal.emotion), T('Overall balance', 'समग्र संतुलन')],
    ] },
    { k: 'list', items: [...new Set([m.healthTotal.emotion, m.E, m.C])].map((n) => `${nm(n)}: ${read(n, 'body')}`) },
    { k: 'tip', t: T('For any health concern please consult a qualified doctor; use these notes only as lifestyle guidance.', 'किसी भी स्वास्थ्य समस्या के लिए योग्य डॉक्टर से परामर्श करें; इन बातों को केवल जीवनशैली मार्गदर्शन के रूप में लें।') },
  ]);

  // 12. Timeline
  const cur = Math.floor(d.age / 1.25);
  const rows = m.ages.map((p) => [ageRange(p.age), nm(p.value), A(p.value).keys[lang]]);
  add('timeline', T('Life timeline 0–80 years', 'जीवन समयरेखा 0–80 वर्ष'), [
    { k: 'p', t: T(`Around the edge of the matrix runs a timeline: each point covers about 1¼ years. You are now ${Math.floor(d.age)} – in the period ${ageRange(d.current.age)}, ruled by ${nm(d.current.value)}.`, `मैट्रिक्स के किनारे पर जीवन की समयरेखा चलती है: हर बिंदु लगभग सवा साल का होता है। अभी आपकी आयु ${Math.floor(d.age)} वर्ष है – अवधि ${ageRange(d.current.age)}, जिसकी ऊर्जा ${nm(d.current.value)} है।`) },
    { k: 'h', t: T('Now and the next ten years', 'अभी और अगले दस वर्ष') },
    { k: 'table', head: [T('Age', 'आयु'), T('Energy', 'ऊर्जा'), T('Theme', 'विषय')], rows: [[ageRange(d.current.age), nm(d.current.value), A(d.current.value).plus[lang]], ...d.upcoming.map((p) => [ageRange(p.age), nm(p.value), A(p.value).plus[lang]])], hl: [0] },
    { k: 'h', t: T('The full timeline', 'पूरी समयरेखा') },
    { k: 'table', head: [T('Age', 'आयु'), T('Energy', 'ऊर्जा'), T('Theme', 'विषय')], rows, hl: cur >= 0 && cur < 64 ? [cur] : [] },
  ]);

  // 13. Action plan
  add('plan', T('Your action plan', 'आपकी कार्य योजना'), [
    { k: 'list', items: [
      `${T('Personality', 'व्यक्तित्व')} (${m.A}): ${A(m.A).advice[lang]}`,
      `${T('Money', 'धन')} (${m.money}): ${A(m.money).advice[lang]}`,
      `${T('Relationships', 'रिश्ते')} (${m.love}): ${A(m.love).advice[lang]}`,
      `${T('Karmic lesson', 'कर्म-सीख')} (${m.D}): ${A(m.D).advice[lang]}`,
      `${T('This period', 'यह अवधि')} (${d.current.value}): ${A(d.current.value).advice[lang]}`,
    ] },
    { k: 'p', t: T('The Destiny Matrix is a tool for self-understanding and traditional guidance. It shows tendencies, not fixed fate – your choices decide which side of each energy you live.', 'डेस्टिनी मैट्रिक्स आत्म-समझ और पारंपरिक मार्गदर्शन का साधन है। यह प्रवृत्तियाँ दिखाती है, तय भाग्य नहीं – आपके निर्णय तय करते हैं कि आप हर ऊर्जा का कौन-सा पक्ष जीते हैं।') },
  ]);

  return {
    title: T('Destiny Matrix Analysis', 'डेस्टिनी मैट्रिक्स विश्लेषण'),
    subtitle: `${fmtDob(d.dob, lang)} · ${T('Centre', 'केंद्र')} ${nm(m.E)}`,
    summary: T(`Centre ${nm(m.E)}, personality ${nm(m.A)}, money point ${nm(m.money)}, karmic tail ${m.karmicTail.join('-')}.`, `केंद्र ${nm(m.E)}, व्यक्तित्व ${nm(m.A)}, धन-बिंदु ${nm(m.money)}, कर्म-पूँछ ${m.karmicTail.join('-')}।`),
    sections: s,
  };
}
