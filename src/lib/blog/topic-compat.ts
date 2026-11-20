/**
 * "Mulank A and Mulank B compatibility" articles – all 45 pairs (A ≤ B), English + Hindi.
 * Relations come from the house friendship table (relations.ts), so verdicts match every couple report.
 */
import { planetOf } from '@/lib/numerology/data/planets';
import { mutualHarmony, relationOf, type Relation } from '@/lib/numerology/data/relations';
import { LOSHU_NUMBER_INFO } from '@/lib/numerology/data/grids';
import { NUMBER_TRAITS } from '@/lib/i18n/numberMeanings';
import { tr } from '@/lib/i18n/hi-terms';
import { mulankFor } from '@/lib/mulank-data';
import { DAYS_OF, DISCLAIM, L, NUMS, calcLink, calcSection, clip, fig, finish, join, list, p, red, sec, serviceLink, table, tip, type Lang, type TopicPost, type TopicRef } from './topic-kit';
import type { Section } from './generate';

export const compatSlug = (a: number, b: number) => `mulank-${Math.min(a, b)}-and-mulank-${Math.max(a, b)}-compatibility-marriage`;

type Verdict = 'same' | 'excellent' | 'good' | 'mixed' | 'challenging';
const sc = (r: Relation) => (r === 'friend' ? 1 : r === 'enemy' ? -1 : 0);
export function pairVerdict(a: number, b: number): Verdict {
  if (a === b) return 'same';
  const s = sc(relationOf(a, b)) + sc(relationOf(b, a));
  return s >= 2 ? 'excellent' : s === 1 ? 'good' : s === 0 ? 'mixed' : 'challenging';
}
const VLABEL: Record<Lang, Record<Verdict, string>> = {
  en: { same: 'Same number – deep understanding', excellent: 'Excellent match', good: 'Good match', mixed: 'Mixed – needs understanding', challenging: 'Challenging – remedies advised' },
  hi: { same: 'समान अंक – गहरी समझ', excellent: 'उत्तम मेल', good: 'अच्छा मेल', mixed: 'मिश्रित – समझ ज़रूरी', challenging: 'चुनौतीपूर्ण – उपाय उचित' },
};
const RW: Record<Lang, Record<Relation, string>> = { en: { friend: 'friendly', neutral: 'neutral', enemy: 'challenging' }, hi: { friend: 'मित्र', neutral: 'सम', enemy: 'चुनौतीपूर्ण' } };

function harmony(a: number, b: number) { return a === b ? 85 : Math.round(mutualHarmony(a, b)); }

function goodDays(a: number, b: number) {
  const both = NUMS.filter((n) => relationOf(a, n) === 'friend' && relationOf(b, n) === 'friend');
  const ok = both.length ? both : NUMS.filter((n) => relationOf(a, n) !== 'enemy' && relationOf(b, n) !== 'enemy' && (relationOf(a, n) === 'friend' || relationOf(b, n) === 'friend'));
  return { nums: ok, days: [...new Set(ok.flatMap(DAYS_OF))].sort((x, y) => x - y) };
}

const firstSentence = (s: string) => { const m = s.match(/^.*?[.।](\s|$)/); return (m ? m[0] : s).trim(); };

function build(a: number, b: number, lang: Lang): TopicPost {
  const hi = lang === 'hi';
  const ma = mulankFor(a, lang)!, mb = mulankFor(b, lang)!, ea = mulankFor(a, 'en')!, eb = mulankFor(b, 'en')!;
  const pa = planetOf(a), pb = planetOf(b);
  const PA = hi ? ma.planet : pa.name, PB = hi ? mb.planet : pb.name;
  const ta = NUMBER_TRAITS[lang][a], tb = NUMBER_TRAITS[lang][b];
  const v = pairVerdict(a, b), score = harmony(a, b);
  const ab = relationOf(a, b), ba = relationOf(b, a);
  const M = (n: number) => (hi ? `मूलांक ${n}` : `Mulank ${n}`);
  const A = M(a), B = M(b);
  const { nums: goodNums, days } = goodDays(a, b);
  const shared = pa.colours.filter((c) => pb.colours.includes(c)).map((c) => tr(lang, c));
  const slug = compatSlug(a, b);
  const same = a === b;
  const exDay = DAYS_OF(a).slice(-1)[0];
  const exSum = String(exDay).split('').reduce((x, d) => x + Number(d), 0);
  const exChain = exDay < 10 ? `${exDay} = ${exDay}` : `${String(exDay).split('').join(' + ')} = ${exSum}${exSum > 9 ? ` → ${red(exSum)}` : ''}`;

  const title = hi ? `मूलांक ${a} और ${b} की अनुकूलता: प्रेम, विवाह और उपाय` : `Mulank ${a} and Mulank ${b} Compatibility: Love, Marriage & Remedies`;
  const h1 = hi ? `मूलांक ${a} और मूलांक ${b} की अनुकूलता: प्रेम, विवाह और उपाय` : `Mulank ${a} and Mulank ${b} Compatibility: Love, Marriage and Remedies`;
  const description = clip(`Is Mulank ${a} (${pa.name}) compatible with Mulank ${b} (${pb.name})? Love, marriage, money, lucky wedding dates and remedies, explained by Acharya Nandram.`);
  const keywords = [`mulank ${a} and ${b} compatibility`, `moolank ${a} and ${b} marriage`, `mulank ${a} and mulank ${b}`, `${a} and ${b} numerology compatibility`, `number ${a} and ${b} love compatibility`, `mulank ${a} ${b} shadi`, `मूलांक ${a} और ${b}`];

  const verdictText: Record<Verdict, string> = hi ? {
    same: `दोनों का मूलांक ${a} है, इसलिए आप एक-दूसरे को बिना कहे समझ लेते हैं। ${PA} की ऊर्जा दोगुनी हो जाती है – इसके गुण भी दोगुने होते हैं और कमियाँ भी। ऐसी जोड़ी में अपनापन बहुत होता है, पर एक जैसी कमज़ोरियों (${ta.minus}) से बचने के लिए जानबूझकर संतुलन रखना पड़ता है।`,
    excellent: `${A} (${PA}) और ${B} (${PB}) अंक ज्योतिष में स्वाभाविक मित्र हैं। दोनों अंक एक-दूसरे को मित्र मानते हैं, इसलिए स्वभाव, लक्ष्य और दिनचर्या में सहज तालमेल रहता है। यह उन जोड़ियों में से है जहाँ छोटी-मोटी असहमति जल्दी सुलझ जाती है और दोनों एक-दूसरे को आगे बढ़ाते हैं।`,
    good: `${A} (${PA}) और ${B} (${PB}) का मेल अच्छा है। एक अंक दूसरे को मित्र मानता है और दूसरा सम (तटस्थ) भाव रखता है, इसलिए रिश्ते की नींव मज़बूत है, पर दोनों को एक-दूसरे की गति और तरीक़े को समझने में थोड़ा समय देना होता है।`,
    mixed: `${A} (${PA}) और ${B} (${PB}) की ऊर्जा मिश्रित है। यहाँ न गहरी मित्रता है, न सीधा टकराव – रिश्ता इस पर निर्भर करता है कि दोनों कितनी समझदारी, धैर्य और खुलकर बात करने से इसे पोषित करते हैं। ऐसी जोड़ियाँ अक्सर सचेत प्रयास से बहुत सुंदर बनती हैं।`,
    challenging: `${A} (${PA}) और ${B} (${PB}) की ऊर्जाएँ कई बातों में टकराती हैं। इसका अर्थ यह नहीं कि विवाह असंभव है – इसका अर्थ है कि अहंकार, गति या प्राथमिकताओं के अंतर पहले से पहचानकर उन पर काम करना ज़रूरी है। सही नाम-वर्तनी, मोबाइल नंबर, विवाह की तिथि और सरल उपायों से यह जोड़ी काफ़ी संतुलित हो सकती है।`,
  } : {
    same: `Both partners have Mulank ${a}, so you understand each other without many words. The energy of ${PA} is doubled – its gifts and its weak spots. These couples feel deeply familiar, but they must consciously balance shared tendencies such as ${ta.minus.toLowerCase()}.`,
    excellent: `${A} (${PA}) and ${B} (${PB}) are natural friends in numerology. Each number treats the other as friendly, so temperament, goals and daily rhythm tend to fall into place. Small disagreements are settled quickly and each partner helps the other grow.`,
    good: `${A} (${PA}) and ${B} (${PB}) make a good match. One number treats the other as a friend while the other is neutral, so the foundation is strong, but both need a little time to respect each other's pace and style.`,
    mixed: `${A} (${PA}) and ${B} (${PB}) carry mixed energies. There is neither deep friendship nor open conflict between the numbers – the relationship depends on how much understanding, patience and honest talk both partners bring. Such couples often become beautiful through conscious effort.`,
    challenging: `The energies of ${A} (${PA}) and ${B} (${PB}) clash in several ways. This does not make marriage impossible – it means differences in ego, pace or priorities must be recognised early and worked on. The right name spelling, mobile numbers, wedding date and simple remedies can balance this pair a great deal.`,
  };

  const sections: Section[] = [];
  sections.push(sec('overview', hi ? `${A} और ${B}: क्या यह जोड़ी अनुकूल है?` : `Are Mulank ${a} and Mulank ${b} Compatible?`, [
    p(verdictText[v]),
    fig({ t: 'pair', a, b, score }, hi ? `${A} (${PA}) और ${B} (${PB}) – सामंजस्य स्कोर ${score}/100` : `Mulank ${a} (${PA}) and Mulank ${b} (${PB}) – harmony score ${score}/100`),
    table(hi ? ['संक्षिप्त जानकारी', 'परिणाम'] : ['At a glance', 'Result'], [
      [hi ? 'कुल मेल' : 'Overall match', VLABEL[lang][v]],
      [hi ? 'सामंजस्य स्कोर' : 'Harmony score', `${score}/100`],
      [hi ? `${A} की दृष्टि में ${B}` : `How ${A} sees ${B}`, RW[lang][ab]],
      [hi ? `${B} की दृष्टि में ${A}` : `How ${B} sees ${A}`, RW[lang][ba]],
      [hi ? 'स्वामी ग्रह' : 'Ruling planets', `${PA} + ${PB}`],
      [hi ? 'तत्व' : 'Elements', `${ma.element} + ${mb.element}`],
      [hi ? 'दोनों के लिए शुभ अंक' : 'Numbers lucky for both', goodNums.join(', ')],
    ]),
    p(hi ? `यह परिणाम हमारी अंक-मित्रता तालिका से आता है – वही तालिका जो हर जोड़ी-मिलान रिपोर्ट और स्कोर में उपयोग होती है। ध्यान दें कि तालिका दोनों दिशाओं में देखी जाती है: एक अंक दूसरे को कैसे देखता है, यह उल्टी दिशा से अलग हो सकता है।` : `This result comes from our number friendship table – the same table used in every couple compatibility report and score. The table is read in both directions: how one number sees the other can differ from the reverse.`),
  ], true));

  sections.push(sec('find', hi ? 'अपना मूलांक कैसे जानें' : 'How to Find Your Mulank', [
    p(hi ? 'मूलांक केवल जन्म के दिन से निकलता है – महीना और वर्ष नहीं जोड़े जाते। दिन के अंकों को एक अंक तक जोड़ें।' : 'Mulank comes only from the day of birth – the month and year are not added. Reduce the day to a single digit.'),
    table(hi ? ['मूलांक', 'जन्म तिथियाँ'] : ['Mulank', 'Born on'], [[String(a), DAYS_OF(a).join(', ')], ...(same ? [] : [[String(b), DAYS_OF(b).join(', ')]])]),
    p(hi ? `उदाहरण: किसी का जन्म ${exDay} तारीख़ को हुआ तो ${exChain}, यानी मूलांक ${a}।` : `Example: someone born on the ${exDay}${exDay % 10 === 1 && exDay !== 11 ? 'st' : exDay % 10 === 2 && exDay !== 12 ? 'nd' : exDay % 10 === 3 && exDay !== 13 ? 'rd' : 'th'} adds ${exChain}, so the Mulank is ${a}.`),
  ]));

  sections.push(sec('nature', hi ? `${A} और ${B} का स्वभाव` : `Mulank ${a} and Mulank ${b} Personalities`, [
    table(hi ? ['विषय', A, B] : ['Trait', A, B], [
      [hi ? 'पहचान' : 'Archetype', hi ? ma.title : ea.title, hi ? mb.title : eb.title],
      [hi ? 'ग्रह' : 'Planet', PA, PB],
      [hi ? 'मुख्य गुण' : 'Key quality', ta.keyword, tb.keyword],
      [hi ? 'ख़ूबियाँ' : 'Strengths', ta.plus, tb.plus],
      [hi ? 'ध्यान रखें' : 'Watch out for', ta.minus, tb.minus],
      [hi ? 'शुभ दिन' : 'Lucky days', ma.luckyDays.join(', '), mb.luckyDays.join(', ')],
    ]),
    p(hi ? `${A}: ${firstSentence(ma.intro.replace(/^यदि.*?मूलांक \d है।\s*/, ''))}` : `${A}: ${firstSentence(ea.intro.replace(/^Born on[^,]*,[^,]*,[^,]*?(or \d+[a-z]{2}, )?your Mulank is \d\.\s*/, ''))}`),
    ...(same ? [] : [p(hi ? `${B}: ${firstSentence(mb.intro.replace(/^यदि.*?मूलांक \d है।\s*/, ''))}` : `${B}: ${firstSentence(eb.intro.replace(/^Born on[^,]*,[^,]*,[^,]*?(or \d+[a-z]{2}, )?your Mulank is \d\.\s*/, ''))}`)]),
  ]));

  sections.push(sec('love', hi ? 'प्रेम और रोमांस' : 'Love and Romance', [
    p(hi ? `प्रेम में ${A}: ${ma.relationships}` : `${A} in love: ${ea.relationships}`),
    ...(same ? [p(hi ? 'जब दोनों साथी एक ही स्वभाव के हों, तो सबसे बड़ा उपहार है गहरी समझ। सबसे बड़ा जोखिम है कि दोनों एक ही समय पर एक ही ग़लती दोहराएँ। बारी-बारी से नेतृत्व और आराम लेने की आदत इस जोड़ी को संतुलित रखती है।' : 'When both partners share one nature, the gift is deep understanding and the risk is repeating the same mistake at the same time. Taking turns to lead and to rest keeps this couple balanced.')]
      : [p(hi ? `प्रेम में ${B}: ${mb.relationships}` : `${B} in love: ${eb.relationships}`)]),
    p(hi ? (v === 'excellent' || v === 'good' ? 'आपकी भावनात्मक भाषा आसानी से मिलती है। एक-दूसरे की ख़ूबियों की खुलकर सराहना करें – यही इस रिश्ते का ईंधन है।' : 'आपकी भावनात्मक भाषा अलग है। जो बात एक के लिए प्रेम है, वह दूसरे को नियंत्रण या दूरी लग सकती है। हफ़्ते में एक बार बिना फ़ोन के, शांत होकर अपनी ज़रूरतें साझा करें।')
      : (v === 'excellent' || v === 'good' ? 'Your emotional languages meet easily. Praise each other’s strengths openly – that is the fuel of this relationship.' : 'Your emotional languages differ. What feels like love to one can feel like control or distance to the other. Once a week, sit calmly without phones and share what you each need.')),
  ]));

  sections.push(sec('marriage', hi ? 'विवाह और पारिवारिक जीवन' : 'Marriage and Family Life', [
    p(hi ? (v === 'challenging' ? `विवाह के बाद ${A} और ${B} के बीच सबसे ज़्यादा घर्षण निर्णय लेने के तरीक़े और प्राथमिकताओं पर आता है। ज़िम्मेदारियाँ स्पष्ट बाँट लें – कौन किस विषय पर अंतिम निर्णय लेगा – तो टकराव बहुत कम हो जाता है।` : `विवाह के बाद ${A} और ${B} एक-दूसरे की कमियों को भरने की क्षमता रखते हैं। ${ta.keyword} और ${tb.keyword} का मेल घर में स्थिरता और गर्माहट दोनों लाता है, यदि दोनों अपनी-अपनी भूमिका का सम्मान करें।`)
      : (v === 'challenging' ? `After marriage, most friction between ${A} and ${B} comes from how decisions are made and what comes first. Divide responsibilities clearly – who has the final word on which subject – and conflict drops sharply.` : `After marriage, ${A} and ${B} can fill each other’s gaps. ${ta.keyword} meeting ${tb.keyword.toLowerCase()} brings both stability and warmth at home, as long as each respects the other’s role.`)),
    list(hi ? [
      `${A} के लिए: ${tr(lang, LOSHU_NUMBER_INFO[a].dailyHabit)}`,
      ...(same ? [] : [`${B} के लिए: ${tr(lang, LOSHU_NUMBER_INFO[b].dailyHabit)}`]),
      'बड़े निर्णय (घर, निवेश, बच्चे की योजना) दोनों के व्यक्तिगत वर्ष देखकर लें।',
      'घर का नंबर और जोड़ी का साझा मोबाइल नंबर दोनों के मित्र अंकों में से चुनें।',
    ] : [
      `For ${A}: ${LOSHU_NUMBER_INFO[a].dailyHabit}`,
      ...(same ? [] : [`For ${B}: ${LOSHU_NUMBER_INFO[b].dailyHabit}`]),
      'Time big decisions (home, investments, planning a child) by checking both personal years.',
      'Choose the house number and any shared mobile number from the numbers friendly to both.',
    ]),
    tip(hi ? `मैंने कई ${v === 'challenging' ? 'चुनौतीपूर्ण' : 'अच्छे'} मूलांक वाली जोड़ियों को सुखी देखा है। फ़र्क़ भाग्यांक और नामांक से पड़ता है – यदि दोनों के भाग्यांक मित्र हों, तो मूलांक का टकराव काफ़ी हल्का हो जाता है।` : `I have seen many couples with ${v === 'challenging' ? 'challenging' : 'good'} Mulank pairs live happily. The difference comes from Bhagyank and name number – when both destiny numbers are friendly, a Mulank clash becomes much lighter.`),
  ], true));

  sections.push(sec('money', hi ? 'धन, करियर और व्यावसायिक साझेदारी' : 'Money, Career and Business Partnership', [
    p(hi ? `${A} (${PA}) के अनुकूल क्षेत्र: ${pa.careers.map((c) => tr(lang, c)).join(', ')}।${same ? '' : ` ${B} (${PB}) के अनुकूल क्षेत्र: ${pb.careers.map((c) => tr(lang, c)).join(', ')}।`}` : `Fields that suit ${A} (${PA}): ${pa.careers.join(', ')}.${same ? '' : ` Fields that suit ${B} (${PB}): ${pb.careers.join(', ')}.`}`),
    p(hi ? (v === 'excellent' || v === 'good' || v === 'same' ? 'व्यवसाय में यह जोड़ी अच्छे साझेदार बन सकती है। भूमिकाएँ बाँटें – एक बाहरी काम (बिक्री, संपर्क) और दूसरा भीतरी काम (हिसाब, व्यवस्था) सँभाले।' : 'साझा व्यवसाय संभव है, पर लिखित समझौता, स्पष्ट हिसाब और अलग-अलग ज़िम्मेदारियाँ ज़रूरी हैं। पैसों के निर्णय भावनाओं में नहीं, तय नियमों से लें।')
      : (v === 'excellent' || v === 'good' || v === 'same' ? 'In business this couple can be strong partners. Split the roles – one handles outside work (sales, contacts), the other inside work (accounts, systems).' : 'A shared business is possible, but it needs a written agreement, clean accounts and separate responsibilities. Make money decisions by agreed rules, not by mood.')),
    p(hi ? `व्यवसाय का नाम, लॉन्च तिथि या दुकान का नंबर ऐसे अंकों में रखें जो दोनों के लिए शुभ हों: ${goodNums.join(', ')}।` : `Keep a business name, launch date or shop number in numbers that are lucky for both of you: ${goodNums.join(', ')}.`),
  ]));

  sections.push(sec('friction', hi ? 'संभावित टकराव और उनका समाधान' : 'Common Friction Points and How to Solve Them', [
    table(hi ? ['साथी', 'ध्यान देने वाली बात', 'क्या मदद करता है'] : ['Partner', 'Watch for', 'What helps'], [
      [A, ma.challenges.slice(0, 2).join(', '), hi ? ma.remedies[0] : ea.remedies[0]],
      ...(same ? [] : [[B, mb.challenges.slice(0, 2).join(', '), hi ? mb.remedies[0] : eb.remedies[0]]]),
    ]),
    p(hi ? 'अंक ज्योतिष यह नहीं कहता कि कोई जोड़ी "अच्छी" या "बुरी" है – यह बताता है कि ऊर्जाएँ कहाँ स्वाभाविक रूप से मिलती हैं और कहाँ सचेत प्रयास चाहिए। समस्या को अंक का दोष मानने के बजाय उसे समझने का संकेत मानें।' : 'Numerology does not label a couple “good” or “bad” – it shows where energies meet naturally and where conscious effort is needed. Treat a friction point as a signal to understand, not as a fault of the number.'),
  ]));

  sections.push(sec('remedies', hi ? 'जोड़ी के लिए शुभ तिथियाँ, रंग और उपाय' : 'Lucky Wedding Dates, Colours and Remedies for the Couple', [
    table((hi ? ['उपाय', A, B] : ['Remedy', A, B]).slice(0, same ? 2 : 3), [
      [hi ? 'ग्रह का दिन' : 'Planet day', tr(lang, pa.weekday), tr(lang, pb.weekday)],
      [hi ? 'शुभ रंग' : 'Lucky colours', ma.luckyColors.join(', '), mb.luckyColors.join(', ')],
      [hi ? 'मंत्र' : 'Mantra', tr(lang, pa.mantra.beej), tr(lang, pb.mantra.beej)],
      [hi ? 'दान' : 'Daan (charity)', pa.daan.slice(0, 2).map((d) => tr(lang, d)).join(', '), pb.daan.slice(0, 2).map((d) => tr(lang, d)).join(', ')],
    ].map((r) => (same ? r.slice(0, 2) : r))),
    list(hi ? [
      `विवाह, सगाई या गृह-प्रवेश के लिए शुभ तारीख़ें (दोनों के लिए): ${days.join(', ')}।`,
      shared.length ? `दोनों के लिए साझा शुभ रंग: ${join(lang, shared)} – विवाह के वस्त्र या घर की सजावट में उपयोग करें।` : `कोई साझा ग्रह-रंग नहीं है, इसलिए विवाह के वस्त्रों में दोनों के एक-एक शुभ रंग (${ma.luckyColors[0]} और ${mb.luckyColors[0]}) शामिल करें।`,
      'शुक्रवार को साथ में माँ लक्ष्मी की पूजा या कोई मीठा दान रिश्ते में मधुरता लाता है।',
      'तिथि चुनते समय पंचांग और परिवार की परंपरा का भी सम्मान करें; अंक ज्योतिष उसमें सहायक है।',
    ] : [
      `Lucky dates for a wedding, engagement or house-warming (good for both): ${days.join(', ')}.`,
      shared.length ? `Colours shared by both planets: ${join(lang, shared)} – use them in wedding clothes or home décor.` : `There is no shared planet colour, so include one lucky colour of each partner (${ea.luckyColors[0]} and ${eb.luckyColors[0]}) in wedding clothes and décor.`,
      'A joint Friday prayer to Maa Lakshmi or a small sweet daan brings sweetness to the relationship.',
      'When fixing the date, also respect the panchang and family tradition; numerology supports it.',
    ]),
  ]));

  sections.push(sec('beyond', hi ? 'केवल मूलांक से निर्णय क्यों न लें' : 'Why Mulank Alone Is Not Enough', [
    p(hi ? 'मूलांक आपके स्वभाव की पहली परत है। एक सटीक जोड़ी-मिलान में ये सब साथ देखे जाते हैं:' : 'Mulank is the first layer of personality. An accurate couple match reads all of these together:'),
    list(hi ? ['दोनों के भाग्यांक (पूरी जन्म तिथि का योग) – जीवन की दिशा', 'नामांक – समाज और रिश्तों में आपकी ऊर्जा', 'दोनों के लो शू ग्रिड – कौन-से अंक एक-दूसरे की कमी भरते हैं', 'वर्तमान व्यक्तिगत वर्ष – विवाह के लिए सही समय', 'मोबाइल नंबर – रोज़मर्रा का कंपन'] : ['Both Bhagyanks (total of the full date of birth) – the direction of life', 'Name numbers – your energy in society and relationships', 'Both Lo Shu grids – which numbers fill each other’s gaps', 'Current personal years – the right time for marriage', 'Mobile numbers – the vibration you live with every day']),
    p(hi ? `आचार्य नंदराम की जोड़ी मिलान रिपोर्ट इन सभी को एक स्कोर और सरल भाषा की व्याख्या में जोड़ती है, साथ में ${A} और ${B} के लिए व्यक्तिगत उपाय।` : `Acharya Nandram’s couple compatibility report combines all of these into one score and a plain-language explanation, with personal remedies for ${A} and ${B}.`),
  ]));

  sections.push(calcSection(lang, ['moolank', 'bhagyank', 'loshu', 'name']));
  sections.push(sec('faq', hi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions', [p(DISCLAIM[lang])]));

  const faqs = hi ? [
    { q: `क्या मूलांक ${a} और मूलांक ${b} विवाह के लिए अच्छे हैं?`, a: `हमारी मित्रता तालिका के अनुसार यह "${VLABEL.hi[v]}" श्रेणी की जोड़ी है (सामंजस्य ${score}/100)। अंतिम निर्णय के लिए भाग्यांक, नामांक और लो शू ग्रिड भी देखें।` },
    { q: `यदि मूलांक ${a} और ${b} का मेल कमज़ोर हो तो क्या करें?`, a: 'विवाह की तिथि, घर का नंबर और मोबाइल नंबर दोनों के मित्र अंकों में चुनें, नाम-वर्तनी जाँचें और दोनों के ग्रहों के सरल उपाय अपनाएँ। अधिकतर जोड़ियाँ इससे अच्छी तरह संतुलित हो जाती हैं।' },
    { q: `मूलांक ${a} और ${b} के लिए शुभ विवाह तिथियाँ कौन-सी हैं?`, a: `दोनों के लिए अनुकूल तारीख़ें हैं: ${days.join(', ')}। पंचांग के मुहूर्त के साथ इन्हें मिलाकर चुनें।` },
    { q: 'मूलांक और भाग्यांक में से विवाह के लिए क्या ज़्यादा महत्वपूर्ण है?', a: 'दोनों महत्वपूर्ण हैं। मूलांक रोज़ का स्वभाव बताता है, भाग्यांक जीवन की दिशा। लंबे रिश्ते के लिए भाग्यांक का मेल अक्सर अधिक निर्णायक होता है।' },
    { q: 'क्या ऑनलाइन जोड़ी-मिलान रिपोर्ट मिल सकती है?', a: 'हाँ। दोनों की जन्म तिथि और नाम दर्ज करें, आचार्य नंदराम की विधि से तैयार जोड़ी मिलान रिपोर्ट हिंदी या अंग्रेज़ी में ऑनलाइन मिलती है।' },
  ] : [
    { q: `Are Mulank ${a} and Mulank ${b} good for marriage?`, a: `By our friendship table this is a “${VLABEL.en[v]}” pair (harmony ${score}/100). For a final decision, also check Bhagyank, name numbers and both Lo Shu grids.` },
    { q: `What if the Mulank ${a} and ${b} match is weak?`, a: 'Choose the wedding date, house number and mobile numbers from numbers friendly to both, check the name spelling and follow simple remedies for both planets. Most couples balance well this way.' },
    { q: `Which wedding dates are lucky for Mulank ${a} and ${b}?`, a: `Dates that suit both are: ${days.join(', ')}. Combine them with a muhurat from the panchang.` },
    { q: 'Which matters more for marriage, Mulank or Bhagyank?', a: 'Both matter. Mulank shows daily temperament; Bhagyank shows the direction of life. For a long relationship, the Bhagyank match is often more decisive.' },
    { q: 'Can I get a couple compatibility report online?', a: 'Yes. Enter both dates of birth and names to get a couple compatibility report prepared with Acharya Nandram’s method, in English or Hindi.' },
  ];

  return finish({
    slug, cat: 'compatibility', title, h1, description, keywords,
    kicker: hi ? `जोड़ी मिलान · ${VLABEL.hi[v]}` : `Compatibility · ${VLABEL.en[v]}`,
    sub: hi ? `${A} और ${B} के बीच प्रेम, विवाह, धन और उपाय – आचार्य नंदराम द्वारा सरल भाषा में।` : `Love, marriage, money and remedies for ${A} and ${B}, explained in simple language by Acharya Nandram.`,
    art: { t: 'pair', a, b, score }, sections, faqs,
    service: serviceLink(lang, 'couple'), calc: calcLink(lang, 'moolank'),
  });
}

export const COMPAT_POSTS: TopicRef[] = NUMS.flatMap((a) => NUMS.filter((b) => b >= a).map((b) => ({ slug: compatSlug(a, b), cat: 'compatibility' as const, build: (lang: Lang) => build(a, b, lang) })));
