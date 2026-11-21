/**
 * Sample report excerpts for each service (English + Hindi), shown on /services and the service pages.
 * The clients are FICTIONAL; every number below comes from the calculation engine
 * (tests/service-samples.test.ts re-computes them, so a change in the engine cannot leave a sample wrong).
 * The first `open` sections are visible to everyone; the rest unlock after the free lead form.
 */
type L = { en: string; hi: string };
type LL = { en: string[]; hi: string[] };

export interface SampleSection { h: L; p: LL; rows?: { k: L; v: L }[] }
export interface ServiceSample {
  code: string;
  title: L;
  client: L;
  tiles: { k: L; v: string; note?: L }[];
  /** Lo Shu counts 1–9 to draw a grid, when the sample has one. */
  grid?: Record<number, number>;
  open: number;
  sections: SampleSection[];
}

const l = (en: string, hi: string): L => ({ en, hi });
const RIYA = l('Riya Sharma · Female · DOB 14 Aug 1992', 'रिया शर्मा · महिला · जन्म तिथि 14 अगस्त 1992');
const RIYA_GRID = { 1: 2, 2: 1, 3: 0, 4: 1, 5: 1, 6: 0, 7: 2, 8: 1, 9: 2 };

export const SAMPLE_NUMBERS = {
  riya: { dob: '1992-08-14', gender: 'female' as const, name: 'Riya Sharma', moolank: 5, bhagyank: 7, kua: 7, nameCompound: 21, nameSingle: 3, nameScore: 80, missing: [3, 6], repeated: [1, 7, 9], personalYear: 5, mobile: '9876543210', mobileCompound: 45, mobileSingle: 9, mobileScore: 36 },
  rahul: { dob: '1988-11-26', name: 'Rahul Verma', moolank: 8, bhagyank: 9, nameCompound: 35, nameSingle: 8, nameScore: 28, fixes: [{ name: 'Rahuul Verma', compound: 41, single: 5, score: 80 }, { name: 'Raahuul Verma', compound: 42, single: 6, score: 100 }] },
  baby: { dob: '2026-03-21', moolank: 3, bhagyank: 7, names: [{ name: 'Anaya Sharma', compound: 25, single: 7, score: 88 }, { name: 'Kiara Sharma', compound: 23, single: 5, score: 80 }, { name: 'Diya Sharma', compound: 23, single: 5, score: 80 }, { name: 'Ishani Sharma', compound: 32, single: 5, score: 80 }] },
  couple: { partner: { name: 'Arjun Mehta', dob: '1990-01-03', gender: 'male' as const, moolank: 3, bhagyank: 5, nameSingle: 7 }, overall: 78, areas: { love: 90, communication: 80, finance: 60, family: 80, health: 100, stability: 67 }, bothMissing: [6], bestYear: 2027 },
  business: [{ name: 'Riya Interiors', compound: 35, single: 8, score: null as number | null }, { name: 'Sharma Interiors', compound: 46, single: 1, score: 100 }, { name: 'Riiyaa Interiors', compound: 37, single: 1, score: 100 }],
  bizCompat: { analysed: 1335, top: [['online-reputation-management', 89], ['led-lights-trading', 87], ['solar-panel-dealer', 87]] as [string, number][], sectors: [['Technology & Media', 88], ['Trade & Retail', 87]] as [string, number][],
    shortlist: [['digital-marketing-agency', 77, 190], ['interior-design-firm', 68, 642], ['petrol-pump', 39, 1325]] as [string, number, number][], launchYears: [2026, 2029] },
  signature: { signedAs: 'Riya S', signCompound: 8, signSingle: 8, fullCompound: 21, fullSingle: 3, letter: 'R', letterValue: 2, weekday: 'Tuesday',
    options: [['Riya Sharma', 21, 3, 90], ['Riya', 5, 5, 84], ['R. S.', 5, 5, 84], ['Riya S.', 8, 8, 12]] as [string, number, number, number][], dates: ['2026-12-01', '2026-12-15'] },
  destiny: { A: 14, B: 8, C: 21, D: 7, E: 5, money: 10, love: 5, x: 20, c1: 8, d1: 12, tail: [12, 19, 7] as [number, number, number], personal: 5, social: 10, spiritual: 15, planetary: 7,
    F: 22, G: 11, H: 10, I: 21, familyForce: 10, now: [33.75, 21] as [number, number], next: [[35, 5], [36.25, 13], [37.5, 8], [38.75, 11], [40, 21]] as [number, number][] },
  pyth: { working: [34, 7, 32, 5] as [number, number, number, number], counts: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 0, 7: 1, 8: 1, 9: 2 }, lines: { purpose: 5, family: 4, stability: 4, selfEsteem: 6, money: 3, talent: 4, spirituality: 5, temperament: 4 } },
  months: [[11, 2026, 7], [12, 2026, 8], [1, 2027, 6], [2, 2027, 7], [3, 2027, 8], [4, 2027, 9], [5, 2027, 1], [6, 2027, 2], [7, 2027, 3]] as [number, number, number][],
};

export const SERVICE_SAMPLES: ServiceSample[] = [
  {
    code: 'SVC_PERSONAL_REPORT', open: 2, client: RIYA, grid: RIYA_GRID,
    title: l('Personal Numerology Report – sample pages', 'व्यक्तिगत अंक ज्योतिष रिपोर्ट – नमूना पृष्ठ'),
    tiles: [{ k: l('Moolank', 'मूलांक'), v: '5' }, { k: l('Bhagyank', 'भाग्यांक'), v: '7' }, { k: l('Kua', 'कुआ'), v: '7' }, { k: l('Name number', 'नामांक'), v: '21/3' }, { k: l('Personal year', 'व्यक्तिगत वर्ष'), v: '5' }],
    sections: [
      { h: l('1. Your core numbers', '1. आपके मूल अंक'), p: {
        en: ['Riya, your Moolank 5 (Mercury) makes you quick, curious and good with people and words. Your Bhagyank 7 (Ketu) pulls life towards depth, research and inner wisdom. The two are neutral to each other: you move fast on the outside, but your best results come when you slow down and think deeply before big decisions.'],
        hi: ['रिया, आपका मूलांक 5 (बुध) आपको तेज़, जिज्ञासु और लोगों व शब्दों में कुशल बनाता है। आपका भाग्यांक 7 (केतु) जीवन को गहराई, शोध और आंतरिक ज्ञान की ओर ले जाता है। दोनों एक-दूसरे के सम (न्यूट्रल) हैं: बाहर से आप तेज़ चलती हैं, पर बड़े निर्णयों से पहले रुककर गहराई से सोचने पर ही सबसे अच्छे परिणाम मिलते हैं।'] } },
      { h: l('2. Your Lo Shu grid at a glance', '2. एक नज़र में आपका लो शू ग्रिड'), p: {
        en: ['Your grid has the Arrow of Intellect (4-9-2) and the Arrow of Determination (9-5-1) complete – a sharp memory and strong will power. 1, 7 and 9 repeat twice. Numbers 3 and 6 are missing: planning, guidance from elders, and comfort at home need conscious attention.'],
        hi: ['आपके ग्रिड में बुद्धि का तीर (4-9-2) और दृढ़ संकल्प का तीर (9-5-1) पूर्ण हैं – तेज़ स्मरण शक्ति और मज़बूत इच्छा-शक्ति। 1, 7 और 9 दो-दो बार हैं। अंक 3 और 6 अनुपस्थित हैं: योजना, बड़ों का मार्गदर्शन और घर का सुख – इन पर सचेत ध्यान देना होगा।'] } },
      { h: l('3. Career and money', '3. करियर और धन'), p: {
        en: ['Mercury 5 with a strong mental plane suits design, media, sales, consulting and any work with variety. Your 7 asks for expertise: one deep skill will earn more than many shallow ones. Money grows best through your own work rather than speculation.'],
        hi: ['मज़बूत मानसिक तल के साथ बुध 5 डिज़ाइन, मीडिया, सेल्स, परामर्श और विविधता वाले कामों के लिए उपयुक्त है। आपका 7 विशेषज्ञता माँगता है: एक गहरा कौशल कई सतही कौशलों से अधिक कमाएगा। धन सट्टे की बजाय आपके अपने काम से सबसे अच्छा बढ़ता है।'] } },
      { h: l('4. Your question: "Should I start my own design studio?"', '4. आपका प्रश्न: "क्या मुझे अपना डिज़ाइन स्टूडियो शुरू करना चाहिए?"'), p: {
        en: ['Your personal year 5 (14 Aug 2026 – 13 Aug 2027) favours change and new ventures. Prepare now and launch on a date adding to 1 – your name and business number should also be checked before registering.'],
        hi: ['आपका व्यक्तिगत वर्ष 5 (14 अगस्त 2026 – 13 अगस्त 2027) बदलाव और नए उद्यम के पक्ष में है। अभी तैयारी करें और 1 योग वाली तिथि पर शुरुआत करें – पंजीकरण से पहले नाम और व्यवसाय अंक की जाँच भी करें।'] } },
      { h: l('5. Personal remedies', '5. व्यक्तिगत उपाय'), p: { en: ['A short list you can follow daily – no costly rituals.'], hi: ['रोज़ अपनाने योग्य छोटी सूची – कोई महँगे अनुष्ठान नहीं।'] },
        rows: [{ k: l('For missing 3', 'अनुपस्थित 3 के लिए'), v: l('Yellow on Thursdays, respect teachers, a yellow item in the East', 'गुरुवार को पीला, गुरुजनों का सम्मान, पूर्व दिशा में पीली वस्तु') },
          { k: l('For missing 6', 'अनुपस्थित 6 के लिए'), v: l('Keep home tidy and fragrant, white/pink on Fridays, a silver item in the North-West', 'घर साफ़ व सुगंधित रखें, शुक्रवार को सफ़ेद/गुलाबी, उत्तर-पश्चिम में चाँदी की वस्तु') },
          { k: l('Lucky day & colour', 'शुभ दिन और रंग'), v: l('Wednesday · green', 'बुधवार · हरा') }] },
    ],
  },
  {
    code: 'SVC_NAME_CORRECTION', open: 2, client: l('Rahul Verma · Male · DOB 26 Nov 1988', 'राहुल वर्मा · पुरुष · जन्म तिथि 26 नवंबर 1988'),
    title: l('Name Correction – sample pages', 'नाम सुधार – नमूना पृष्ठ'),
    tiles: [{ k: l('Moolank', 'मूलांक'), v: '8' }, { k: l('Bhagyank', 'भाग्यांक'), v: '9' }, { k: l('Current name', 'वर्तमान नामांक'), v: '35/8' }, { k: l('Name score', 'नाम स्कोर'), v: '28/100' }],
    sections: [
      { h: l('1. Your current name', '1. आपका वर्तमान नाम'), p: {
        en: ['"Rahul Verma" totals 35 → 8 in the Chaldean system. 35 is an unfavourable compound, and 8 is an enemy of your Bhagyank 9 – this name pulls against your destiny number. Compatibility score: 28/100, so a spelling correction is advised.'],
        hi: ['कैल्डियन पद्धति में "Rahul Verma" का योग 35 → 8 है। 35 एक प्रतिकूल संयुक्त अंक है, और 8 आपके भाग्यांक 9 का शत्रु है – यह नाम आपके भाग्य अंक के विपरीत खींचता है। अनुकूलता स्कोर: 28/100, इसलिए वर्तनी सुधार की सलाह है।'] } },
      { h: l('2. Corrected spellings', '2. सुधारी हुई वर्तनियाँ'), p: { en: ['Small changes that keep the name natural:'], hi: ['छोटे बदलाव जो नाम को स्वाभाविक रखते हैं:'] },
        rows: [{ k: l('Rahuul Verma', 'Rahuul Verma'), v: l('41 → 5 · favourable · score 80', '41 → 5 · अनुकूल · स्कोर 80') }, { k: l('Raahuul Verma', 'Raahuul Verma'), v: l('42 → 6 · favourable · score 100', '42 → 6 · अनुकूल · स्कोर 100') }] },
      { h: l('3. Where to use the new spelling', '3. नई वर्तनी कहाँ उपयोग करें'), p: {
        en: ['Use it first in your signature, email name, social media and visiting card. Legal documents are optional – the change works through daily use. Sign with a rising stroke and do not cut the name.'],
        hi: ['पहले हस्ताक्षर, ईमेल नाम, सोशल मीडिया और विज़िटिंग कार्ड में उपयोग करें। क़ानूनी दस्तावेज़ वैकल्पिक हैं – बदलाव रोज़ के उपयोग से काम करता है। ऊपर उठती रेखा के साथ हस्ताक्षर करें और नाम को काटें नहीं।'] } },
      { h: l('4. Signature guidance', '4. हस्ताक्षर मार्गदर्शन'), p: { en: ['Specific advice on first letter size, underline and slant for your numbers.'], hi: ['आपके अंकों के अनुसार पहले अक्षर का आकार, रेखांकन और झुकाव।'] } },
    ],
  },
  {
    code: 'SVC_LOSHU', open: 2, client: RIYA, grid: RIYA_GRID,
    title: l('Lo Shu Grid Analysis – sample pages', 'लो शू ग्रिड विश्लेषण – नमूना पृष्ठ'),
    tiles: [{ k: l('Moolank', 'मूलांक'), v: '5' }, { k: l('Bhagyank', 'भाग्यांक'), v: '7' }, { k: l('Kua', 'कुआ'), v: '7' }, { k: l('Missing', 'अनुपस्थित'), v: '3, 6' }],
    sections: [
      { h: l('1. Strengths in your grid', '1. आपके ग्रिड की ताक़त'), p: {
        en: ['Complete Mental plane – Arrow of Intellect (4-9-2): sharp memory and planning. Complete Will plane – Arrow of Determination (9-5-1): you finish what you start. 2-5-8 together form the Silver Yog, which supports steady growth.'],
        hi: ['पूर्ण मानसिक तल – बुद्धि का तीर (4-9-2): तेज़ स्मरण और योजना। पूर्ण इच्छा तल – दृढ़ संकल्प का तीर (9-5-1): आप जो शुरू करती हैं, पूरा करती हैं। 2-5-8 मिलकर सिल्वर योग बनाते हैं, जो स्थिर प्रगति में सहायक है।'] } },
      { h: l('2. Repeated numbers', '2. दोहराए गए अंक'), p: {
        en: ['1 ×2: clear self-expression. 7 ×2: deep thinking, some delays that turn into gains. 9 ×2: high energy and ambition – watch quick anger.'],
        hi: ['1 ×2: स्पष्ट आत्म-अभिव्यक्ति। 7 ×2: गहरा चिंतन, कुछ देरी जो बाद में लाभ बनती है। 9 ×2: ऊँची ऊर्जा और महत्वाकांक्षा – जल्दी ग़ुस्से से बचें।'] } },
      { h: l('3. Missing numbers and remedies', '3. अनुपस्थित अंक और उपाय'), p: { en: ['Each missing number with placement, colour and habit:'], hi: ['हर अनुपस्थित अंक के लिए स्थान, रंग और आदत:'] },
        rows: [{ k: l('3 (Jupiter)', '3 (गुरु)'), v: l('East · yellow · write a weekly plan', 'पूर्व · पीला · साप्ताहिक योजना लिखें') }, { k: l('6 (Venus)', '6 (शुक्र)'), v: l('North-West · white/pink · keep home beautiful', 'उत्तर-पश्चिम · सफ़ेद/गुलाबी · घर सुंदर रखें') }] },
      { h: l('4. Lucky directions (Kua 7, West group)', '4. शुभ दिशाएँ (कुआ 7, पश्चिम समूह)'), p: { en: ['Directions for desk, bed and main door:'], hi: ['डेस्क, बिस्तर और मुख्य द्वार की दिशाएँ:'] },
        rows: [{ k: l('Success', 'सफलता'), v: l('North-West', 'उत्तर-पश्चिम') }, { k: l('Health', 'स्वास्थ्य'), v: l('South-West', 'दक्षिण-पश्चिम') }, { k: l('Relationships', 'संबंध'), v: l('North-East', 'उत्तर-पूर्व') }, { k: l('Growth', 'विकास'), v: l('West', 'पश्चिम') }] },
    ],
  },
  {
    code: 'SVC_MOBILE_NUMBER', open: 2, client: RIYA,
    title: l('Lucky Mobile Number – sample pages', 'शुभ मोबाइल नंबर – नमूना पृष्ठ'),
    tiles: [{ k: l('Number', 'नंबर'), v: '98765 43210' }, { k: l('Total', 'योग'), v: '45/9' }, { k: l('Score', 'स्कोर'), v: '36/100', note: l('Needs change', 'बदलाव ज़रूरी') }],
    sections: [
      { h: l('1. Your current number', '1. आपका वर्तमान नंबर'), p: {
        en: ['98765 43210 totals 45 → 9. 45 is a favourable compound, but 9 is an enemy of your Bhagyank 7, and the pairs 98, 87 and 43 clash. Score 36/100 – this number works against you on important calls and deals.'],
        hi: ['98765 43210 का योग 45 → 9 है। 45 अनुकूल संयुक्त अंक है, पर 9 आपके भाग्यांक 7 का शत्रु है, और 98, 87 व 43 जोड़ियाँ टकराती हैं। स्कोर 36/100 – यह नंबर ज़रूरी कॉल और सौदों में आपके विरुद्ध काम करता है।'] } },
      { h: l('2. What suits you', '2. आपके अनुकूल क्या है'), p: { en: ['Use these when choosing a new number:'], hi: ['नया नंबर चुनते समय इनका उपयोग करें:'] },
        rows: [{ k: l('Best totals', 'सर्वोत्तम योग'), v: l('1, 3, 5, 6, 7', '1, 3, 5, 6, 7') }, { k: l('Good pairs', 'अच्छी जोड़ियाँ'), v: l('11, 13, 15, 33, 35, 51, 55, 56, 65', '11, 13, 15, 33, 35, 51, 55, 56, 65') }, { k: l('Avoid', 'बचें'), v: l('digits 8, 9 · pairs 48, 84, 44, 88, 00', 'अंक 8, 9 · जोड़ियाँ 48, 84, 44, 88, 00') }] },
      { h: l('3. Your shortlisted numbers compared', '3. आपके चुने नंबरों की तुलना'), p: { en: ['Each number you send is scored and ranked, with the best one marked.'], hi: ['आपके भेजे हर नंबर का स्कोर और क्रम, सबसे अच्छे पर निशान।'] } },
    ],
  },
  {
    code: 'SVC_BABY_NAME', open: 2, client: l('Baby girl · DOB 21 Mar 2026 · surname Sharma', 'शिशु कन्या · जन्म तिथि 21 मार्च 2026 · उपनाम शर्मा'),
    title: l('Baby Name Numerology – sample pages', 'शिशु नाम अंक ज्योतिष – नमूना पृष्ठ'),
    tiles: [{ k: l('Moolank', 'मूलांक'), v: '3' }, { k: l('Bhagyank', 'भाग्यांक'), v: '7' }, { k: l('Names suggested', 'सुझाए नाम'), v: '7' }],
    sections: [
      { h: l('1. Your baby\'s numbers', '1. आपके शिशु के अंक'), p: {
        en: ['Moolank 3 (Jupiter) gives a bright, expressive and learning-loving nature. Bhagyank 7 (Ketu) adds intuition and depth. A good name should be friendly to 7 and not clash with 3.'],
        hi: ['मूलांक 3 (गुरु) उज्ज्वल, अभिव्यक्तिशील और सीखने में रुचि रखने वाला स्वभाव देता है। भाग्यांक 7 (केतु) अंतर्ज्ञान और गहराई जोड़ता है। अच्छा नाम 7 का मित्र हो और 3 से न टकराए।'] } },
      { h: l('2. Shortlisted names', '2. चुने हुए नाम'), p: { en: ['With surname, Chaldean system:'], hi: ['उपनाम सहित, कैल्डियन पद्धति:'] },
        rows: [{ k: l('Anaya – caring, unique', 'अनाया – स्नेही, अद्वितीय'), v: l('25 → 7 · score 88', '25 → 7 · स्कोर 88') }, { k: l('Kiara – bright', 'किआरा – उज्ज्वल'), v: l('23 → 5 · score 80', '23 → 5 · स्कोर 80') }, { k: l('Diya – a lamp', 'दिया – दीपक'), v: l('23 → 5 · score 80', '23 → 5 · स्कोर 80') }, { k: l('Ishani – Goddess Durga', 'ईशानी – देवी दुर्गा'), v: l('32 → 5 · score 80', '32 → 5 · स्कोर 80') }] },
      { h: l('3. Three more names in your preferred letters', '3. आपके पसंदीदा अक्षरों में तीन और नाम'), p: { en: ['Plus spelling advice for the birth certificate and the child\'s lucky colours.'], hi: ['साथ ही जन्म प्रमाण-पत्र के लिए वर्तनी सलाह और बच्चे के शुभ रंग।'] } },
    ],
  },
  {
    code: 'SVC_COUPLE', open: 2, client: l('Riya Sharma (14 Aug 1992) & Arjun Mehta (3 Jan 1990)', 'रिया शर्मा (14 अगस्त 1992) और अर्जुन मेहता (3 जनवरी 1990)'),
    title: l('Couple Compatibility – sample pages', 'जोड़ी अनुकूलता – नमूना पृष्ठ'),
    tiles: [{ k: l('Overall', 'कुल'), v: '78/100' }, { k: l('Moolank', 'मूलांक'), v: '5 + 3' }, { k: l('Bhagyank', 'भाग्यांक'), v: '7 + 5' }, { k: l('Best year', 'शुभ वर्ष'), v: '2027' }],
    sections: [
      { h: l('1. How your numbers meet', '1. आपके अंक कैसे मिलते हैं'), p: {
        en: ['Moolank 5 and 3 are friends of each other – natural attraction and easy talk (harmony 100). Bhagyank 7 and 5 are neutral, as are the name numbers 3 and 7: shared goals need conscious planning.'],
        hi: ['मूलांक 5 और 3 एक-दूसरे के मित्र हैं – स्वाभाविक आकर्षण और सहज बातचीत (सामंजस्य 100)। भाग्यांक 7 और 5 सम हैं, नामांक 3 और 7 भी: साझा लक्ष्यों के लिए सचेत योजना चाहिए।'] } },
      { h: l('2. Area scores', '2. क्षेत्रवार स्कोर'), p: { en: ['From both charts and the combined Lo Shu grid:'], hi: ['दोनों चार्ट और संयुक्त लो शू ग्रिड से:'] },
        rows: [{ k: l('Love', 'प्रेम'), v: l('90', '90') }, { k: l('Communication', 'संवाद'), v: l('80', '80') }, { k: l('Family', 'परिवार'), v: l('80', '80') }, { k: l('Finance', 'धन'), v: l('60', '60') }, { k: l('Stability', 'स्थिरता'), v: l('67', '67') }] },
      { h: l('3. What each partner brings', '3. हर साथी क्या जोड़ता है'), p: {
        en: ['Arjun brings 3 (planning) to Riya; Riya brings 2, 4, 7 and 8 (patience, order, depth, money sense). Both miss 6 – home harmony needs effort from both.'],
        hi: ['अर्जुन रिया को 3 (योजना) देते हैं; रिया 2, 4, 7 और 8 (धैर्य, व्यवस्था, गहराई, धन-समझ) देती हैं। दोनों में 6 नहीं है – घर के सामंजस्य के लिए दोनों का प्रयास चाहिए।'] } },
      { h: l('4. Marriage dates and remedies', '4. विवाह तिथियाँ और उपाय'), p: { en: ['2027 is the strongest year (both in personal year 6). Favourable date numbers: 1, 3, 5, 6.'], hi: ['2027 सबसे मज़बूत वर्ष है (दोनों व्यक्तिगत वर्ष 6 में)। शुभ तिथि अंक: 1, 3, 5, 6।'] } },
    ],
  },
  {
    code: 'SVC_BUSINESS_NAME', open: 2, client: l('Owner: Riya Sharma · Moolank 5 · Bhagyank 7', 'मालिक: रिया शर्मा · मूलांक 5 · भाग्यांक 7'),
    title: l('Business Name Numerology – sample pages', 'व्यवसाय नाम अंक ज्योतिष – नमूना पृष्ठ'),
    tiles: [{ k: l('Proposed', 'प्रस्तावित'), v: '35/8' }, { k: l('Recommended', 'अनुशंसित'), v: '46/1' }, { k: l('Fit score', 'मेल स्कोर'), v: '100' }],
    sections: [
      { h: l('1. Names you proposed', '1. आपके प्रस्तावित नाम'), p: { en: ['Chaldean totals and fit with the owner:'], hi: ['कैल्डियन योग और मालिक से मेल:'] },
        rows: [{ k: l('Riya Interiors', 'Riya Interiors'), v: l('35 → 8 · unfavourable, enemy of Bhagyank 7 – avoid', '35 → 8 · प्रतिकूल, भाग्यांक 7 का शत्रु – न लें') }, { k: l('Sharma Interiors', 'Sharma Interiors'), v: l('46 → 1 · favourable, friend of 5 and 7 – best', '46 → 1 · अनुकूल, 5 और 7 का मित्र – सर्वोत्तम') }] },
      { h: l('2. Why number 1 suits this business', '2. यह व्यवसाय अंक 1 के अनुकूल क्यों'), p: {
        en: ['1 (Sun) gives leadership, visibility and a name people remember – ideal for a design brand. It is friendly to both the owner\'s Moolank and Bhagyank, so the business supports her instead of draining her.'],
        hi: ['1 (सूर्य) नेतृत्व, पहचान और याद रहने वाला नाम देता है – डिज़ाइन ब्रांड के लिए आदर्श। यह मालिक के मूलांक और भाग्यांक दोनों का मित्र है, इसलिए व्यवसाय उन्हें थकाता नहीं, सहारा देता है।'] } },
      { h: l('3. Launch dates, mobile and colours', '3. लॉन्च तिथियाँ, मोबाइल और रंग'), p: { en: ['Launch on dates adding to 1 (1, 10, 19, 28). Business mobile total: 1, 5 or 6.'], hi: ['1 योग वाली तिथियों (1, 10, 19, 28) पर लॉन्च करें। व्यवसायिक मोबाइल योग: 1, 5 या 6।'] },
        rows: [{ k: l('Brand colours', 'ब्रांड रंग'), v: l('Gold / orange with green', 'सुनहरा / नारंगी, हरे के साथ') }] },
    ],
  },
  {
    code: 'SVC_BUSINESS_COMPLETE', open: 2, client: l('Owner: Riya Sharma · Moolank 5 · Bhagyank 7 · opened 10 Apr 2024 · partner Arjun Mehta', 'मालिक: रिया शर्मा · मूलांक 5 · भाग्यांक 7 · शुरुआत 10 अप्रैल 2024 · साझेदार अर्जुन मेहता'),
    title: l('Complete Business Numerology Report – sample pages', 'संपूर्ण व्यवसाय अंक ज्योतिष रिपोर्ट – नमूना पृष्ठ'),
    tiles: [{ k: l('Overall score', 'समग्र स्कोर'), v: '84' }, { k: l('Best name', 'सर्वश्रेष्ठ नाम'), v: '46/1' }, { k: l('Partner harmony', 'साझेदार सामंजस्य'), v: '78' }, { k: l('2026 score', '2026 स्कोर'), v: '72' }],
    sections: [
      { h: l('1. Business name analysis', '1. व्यवसाय नाम विश्लेषण'), p: { en: ['Each name scored against the owner\'s Bhagyank, Moolank, the compound number and the ruling numbers of interior design (6, 4, 3):'], hi: ['हर नाम का मालिक के भाग्यांक, मूलांक, मिश्रित अंक और इंटीरियर डिज़ाइन के स्वामी अंकों (6, 4, 3) से स्कोर:'] },
        rows: [{ k: l('Sharma Interiors', 'Sharma Interiors'), v: l('46/1 · favourable · 96/100 – excellent', '46/1 · शुभ · 96/100 – उत्तम') }, { k: l('Riya Interiors', 'Riya Interiors'), v: l('35/8 · unfavourable · 36/100 – correction advised', '35/8 · अशुभ · 36/100 – सुधार उचित') }] },
      { h: l('2. Business name correction', '2. व्यवसाय नाम सुधार'), p: { en: ['If the owner wants to keep “Riya Interiors”, one small change makes it lucky:'], hi: ['यदि मालिक “Riya Interiors” ही रखना चाहें, तो एक छोटा बदलाव इसे शुभ बना देता है:'] },
        rows: [{ k: l('Riya Interriors', 'Riya Interriors'), v: l('37/1 · favourable · 96/100 (double “r”)', '37/1 · शुभ · 96/100 (“r” दोहराएँ)') }] },
      { h: l('3. Partner compatibility', '3. साझेदार अनुकूलता'), p: { en: ['Arjun Mehta (Moolank 3, Bhagyank 5): harmony with the owner 70/100, friendly with the business number 1 – score 78, best role: sales, marketing and expansion.'], hi: ['अर्जुन मेहता (मूलांक 3, भाग्यांक 5): मालिक से सामंजस्य 70/100, व्यवसाय अंक 1 के मित्र – स्कोर 78, उपयुक्त भूमिका: बिक्री, मार्केटिंग और विस्तार।'] } },
      { h: l('4. Growth cycle forecast', '4. विकास चक्र पूर्वानुमान'), p: { en: ['Business year from the opening date, combined with the owner\'s personal year:'], hi: ['शुरुआत की तिथि से व्यवसाय वर्ष, मालिक के व्यक्तिगत वर्ष के साथ:'] },
        rows: [{ k: l('2026 · business year 6', '2026 · व्यवसाय वर्ष 6'), v: l('Customers – service, quality, loyalty · 72', 'ग्राहक – सेवा, गुणवत्ता, विश्वास · 72') }, { k: l('2027 · business year 7', '2027 · व्यवसाय वर्ष 7'), v: l('Review – research and planning · 50', 'समीक्षा – शोध और योजना · 50') }, { k: l('2028 · business year 8', '2028 · व्यवसाय वर्ष 8'), v: l('Harvest – profit and investment · 71', 'फ़सल – लाभ और निवेश · 71') }] },
      { h: l('5. Brand, logo and CEO pages', '5. ब्रांड, लोगो और सीईओ पृष्ठ'), p: { en: ['Brand planet Sun: gold and orange, a circle or sun-burst mark with bold capitals; business mobile totals 1, 2 or 7. The CEO pages cover the owner\'s leadership style, best sectors, lucky days and seating direction.'], hi: ['ब्रांड ग्रह सूर्य: सुनहरा और नारंगी, वृत्त या सूर्य-किरण चिह्न और मोटे बड़े अक्षर; व्यवसायिक मोबाइल योग 1, 2 या 7। सीईओ पृष्ठों में मालिक की नेतृत्व शैली, सर्वोत्तम क्षेत्र, शुभ दिन और बैठने की दिशा है।'] } },
    ],
  },
  {
    code: 'SVC_BUSINESS_COMPAT', open: 2, client: RIYA,
    title: l('Business Compatibility Report – sample pages', 'व्यवसाय अनुकूलता रिपोर्ट – नमूना पृष्ठ'),
    tiles: [{ k: l('Categories checked', 'जाँची गई श्रेणियाँ'), v: '1,335' }, { k: l('Best sector', 'सर्वोत्तम क्षेत्र'), v: '88' }, { k: l('Best match', 'सर्वोत्तम मेल'), v: '89' }, { k: l('Personal year', 'व्यक्तिगत वर्ष'), v: '5' }],
    sections: [
      { h: l('1. Your business personality', '1. आपका व्यावसायिक स्वभाव'), p: {
        en: ['Riya, your Bhagyank 7 (Ketu) with Moolank 5 (Mercury) and name number 3 gives a sharp, analytical and communicative business nature. Numbers 1, 2, 4 and 7 are friendly to your Bhagyank and all four are present in your grid – so work built on ideas, technology, communication and expertise comes most naturally. 8 and 9 do not support your Bhagyank.'],
        hi: ['रिया, आपका भाग्यांक 7 (केतु), मूलांक 5 (बुध) और नामांक 3 आपको तेज़, विश्लेषणात्मक और संवाद-कुशल व्यावसायिक स्वभाव देते हैं। अंक 1, 2, 4 और 7 आपके भाग्यांक के मित्र हैं और चारों आपके ग्रिड में उपस्थित हैं – इसलिए विचार, तकनीक, संचार और विशेषज्ञता पर आधारित काम आपके लिए सबसे स्वाभाविक है। 8 और 9 आपके भाग्यांक का साथ नहीं देते।'] },
        rows: [{ k: l('Technology & Media', 'तकनीक और मीडिया'), v: l('88 / 100 – strongest sector', '88 / 100 – सबसे मज़बूत क्षेत्र') }, { k: l('Trade & Retail', 'व्यापार और खुदरा'), v: l('87 / 100', '87 / 100') }] },
      { h: l('2. Your top matches out of 1,335 businesses', '2. 1,335 व्यवसायों में आपके शीर्ष मेल'), p: { en: ['Ranked by compatibility with your numbers and a medium capital budget:'], hi: ['आपके अंकों और मध्यम पूँजी के अनुसार अनुकूलता क्रम:'] },
        rows: [{ k: l('1. Online reputation management', '1. ऑनलाइन रेप्युटेशन मैनेजमेंट'), v: l('89 / 100', '89 / 100') }, { k: l('2. LED lights trading', '2. LED लाइट्स का व्यापार'), v: l('87 / 100', '87 / 100') }, { k: l('3. Solar panel dealer', '3. सोलर पैनल डीलर'), v: l('87 / 100', '87 / 100') }] },
      { h: l('3. Verdict on the businesses you are considering', '3. आपके विचाराधीन व्यवसायों पर निर्णय'), p: { en: ['Each business you name gets its own score and rank:'], hi: ['आपके बताए हर व्यवसाय का अपना स्कोर और स्थान:'] },
        rows: [{ k: l('Digital marketing agency', 'डिजिटल मार्केटिंग एजेंसी'), v: l('77 · rank 190 – highly compatible', '77 · स्थान 190 – अत्यंत अनुकूल') }, { k: l('Interior design firm', 'इंटीरियर डिज़ाइन फ़र्म'), v: l('68 · rank 642 – compatible; number 6 is missing in your grid', '68 · स्थान 642 – अनुकूल; आपके ग्रिड में 6 अनुपस्थित है') }, { k: l('Petrol pump', 'पेट्रोल पंप'), v: l('39 · rank 1,325 – not advised (8 & 9 based)', '39 · स्थान 1,325 – अनुशंसित नहीं (8 और 9 आधारित)') }] },
      { h: l('4. When to launch', '4. कब शुरू करें'), p: {
        en: ['Personal year 5 (14 Aug 2026 – 13 Aug 2027) favours change and new ventures; 2029 (personal year 8) is the strongest year for expansion and investment. Start important work on a Tuesday, and face North-West while working.'],
        hi: ['व्यक्तिगत वर्ष 5 (14 अगस्त 2026 – 13 अगस्त 2027) बदलाव और नए उद्यम के पक्ष में है; 2029 (व्यक्तिगत वर्ष 8) विस्तार और निवेश का सबसे मज़बूत वर्ष है। महत्वपूर्ण काम मंगलवार को शुरू करें और काम करते समय उत्तर-पश्चिम की ओर मुख रखें।'] } },
      { h: l('5. Business name, remedies & action plan', '5. व्यवसाय नाम, उपाय और कार्य-योजना'), p: { en: ['The full report adds business name totals that suit you, remedies for missing numbers 3 and 6, the least-suited businesses and a step-by-step action plan.'], hi: ['पूरी रिपोर्ट में आपके अनुकूल व्यवसाय नाम के योग, अनुपस्थित अंक 3 और 6 के उपाय, सबसे कम अनुकूल व्यवसाय और चरण-दर-चरण कार्य-योजना भी है।'] } },
    ],
  },
  {
    code: 'SVC_PERSONAL_YEAR', open: 2, client: RIYA,
    title: l('Personal Year Consultancy – sample pages', 'व्यक्तिगत वर्ष परामर्श – नमूना पृष्ठ'),
    tiles: [{ k: l('Personal year', 'व्यक्तिगत वर्ष'), v: '5' }, { k: l('Period', 'अवधि'), v: '14 Aug 26 – 13 Aug 27' }, { k: l('Next year', 'अगला वर्ष'), v: '6' }],
    sections: [
      { h: l('1. Theme of your year: change and freedom', '1. आपके वर्ष का विषय: बदलाव और स्वतंत्रता'), p: {
        en: ['Personal year 5 opens doors – travel, new work, new people. It rewards bold but planned moves and punishes impulsive spending. Use it to start; personal year 6 (from Aug 2027) is for home, family and commitment.'],
        hi: ['व्यक्तिगत वर्ष 5 द्वार खोलता है – यात्रा, नया काम, नए लोग। यह साहसी पर योजनाबद्ध क़दमों को पुरस्कृत करता है और आवेग में ख़र्च को दंडित करता है। इसे शुरुआत के लिए उपयोग करें; व्यक्तिगत वर्ष 6 (अगस्त 2027 से) घर, परिवार और प्रतिबद्धता का है।'] } },
      { h: l('2. Month by month', '2. माह-दर-माह'), p: { en: ['Personal month numbers for the coming months:'], hi: ['आने वाले महीनों के व्यक्तिगत माह अंक:'] },
        rows: [{ k: l('Nov 2026 · 7', 'नवं 2026 · 7'), v: l('Pause, review, learn', 'रुकें, समीक्षा करें, सीखें') }, { k: l('Dec 2026 · 8', 'दिस 2026 · 8'), v: l('Money and career push', 'धन और करियर में ज़ोर') }, { k: l('Jan 2027 · 6', 'जन 2027 · 6'), v: l('Family, home matters', 'परिवार, घर के काम') }, { k: l('May 2027 · 1', 'मई 2027 · 1'), v: l('Best month to launch', 'शुरुआत का सबसे अच्छा महीना') }] },
      { h: l('3. Dates for your decisions', '3. आपके निर्णयों की तिथियाँ'), p: { en: ['Dates adding to 1 or 5 (1, 5, 10, 14, 19, 23, 28) suit signing and starting. Your own questions are answered on call or WhatsApp.'], hi: ['1 या 5 योग वाली तिथियाँ (1, 5, 10, 14, 19, 23, 28) हस्ताक्षर और शुरुआत के लिए उपयुक्त हैं। आपके प्रश्नों के उत्तर कॉल या WhatsApp पर।'] } },
    ],
  },
  {
    code: 'SVC_SIGNATURE', open: 2, client: l('Riya Sharma · Female · DOB 14 Aug 1992 · signs as “Riya S.”', 'रिया शर्मा · महिला · जन्म तिथि 14 अगस्त 1992 · हस्ताक्षर “Riya S.”'),
    title: l('Signature Analysis Report – sample pages', 'हस्ताक्षर विश्लेषण रिपोर्ट – नमूना पृष्ठ'),
    tiles: [{ k: l('Signed name', 'हस्ताक्षर-नाम'), v: '8/8', note: l('not friendly to 7', '7 का शत्रु') }, { k: l('Better form', 'बेहतर रूप'), v: '21/3' }, { k: l('First letter', 'पहला अक्षर'), v: 'R = 2' }, { k: l('Start day', 'आरंभ दिवस'), v: 'Tue' }],
    sections: [
      { h: l('1. What the signature shows', '1. हस्ताक्षर क्या दर्शाता है'), p: { en: ['Riya’s signature was measured from two samples (consistency 92/100):'], hi: ['रिया के हस्ताक्षर को दो नमूनों से मापा गया (एकरूपता 92/100):'] },
        rows: [
          { k: l('Baseline', 'आधार रेखा'), v: l('Falls about 9° – tiredness or discouragement; needs attention', 'लगभग 9° नीचे गिरती है – थकान या निराशा; ध्यान दें') },
          { k: l('First letter R', 'पहला अक्षर R'), v: l('Same height as the rest – achievements may not get due credit', 'बाकी अक्षरों जितना – उपलब्धियों को उचित श्रेय न मिलना') },
          { k: l('Slant', 'झुकाव'), v: l('Mixed – forward at the start, backward at the end; reactions can be hard to predict', 'मिश्रित – शुरुआत में आगे, अंत में पीछे; प्रतिक्रियाएँ अनुमान से बाहर हो सकती हैं') },
          { k: l('Ending', 'अंत'), v: l('Falls away and ends with a full stop – believed to stop the flow', 'नीचे गिरकर पूर्ण विराम पर समाप्त – प्रवाह रुकने का संकेत') },
        ] },
      { h: l('2. Numerology of the signed name', '2. हस्ताक्षर-नाम का अंक ज्योतिष'), p: {
        en: ['Bhagyank 7 (Ketu), Moolank 5 (Mercury). “Riya S.” totals 8 in Chaldean numerology – a number that is not friendly to Bhagyank 7 and is heavy for this chart. The full name “Riya Sharma” totals 21/3, the Crown of the Magi – advancement and victory after effort. The first letter R (2, Moon) is friendly to the Bhagyank.'],
        hi: ['भाग्यांक 7 (केतु), मूलांक 5 (बुध)। कैल्डियन अंक ज्योतिष में “Riya S.” का योग 8 है – यह अंक भाग्यांक 7 का मित्र नहीं है और इस चार्ट के लिए भारी है। पूरा नाम “Riya Sharma” 21/3 है – मैगी का मुकुट, प्रयास के बाद उन्नति और विजय। पहला अक्षर R (2, चंद्र) भाग्यांक का मित्र है।'] } },
      { h: l('3. The best way to sign – ranked', '3. हस्ताक्षर का सबसे अच्छा तरीका – क्रमवार'), p: { en: ['Each way of writing the name, scored for Riya’s numbers:'], hi: ['नाम लिखने का हर तरीका, रिया के अंकों के अनुसार स्कोर:'] },
        rows: [
          { k: l('Riya Sharma', 'Riya Sharma'), v: l('21/3 · favourable · 90 – recommended', '21/3 · शुभ · 90 – अनुशंसित') },
          { k: l('Riya', 'Riya'), v: l('5 · favourable · 84', '5 · शुभ · 84') },
          { k: l('Riya S. (current)', 'Riya S. (वर्तमान)'), v: l('8 · not friendly · 12 – change', '8 · शत्रु · 12 – बदलें') },
        ] },
      { h: l('4. Corrections, in order of priority', '4. सुधार, प्राथमिकता क्रम में'), p: {
        en: ['Sign the full name “Riya Sharma”; let the baseline rise gently (10–15°); make the R about 1.5× taller; drop the full stop and finish with a light upward stroke.'],
        hi: ['पूरा नाम “Riya Sharma” लिखें; आधार रेखा को धीरे-धीरे ऊपर उठने दें (10–15°); R को लगभग 1.5 गुना ऊँचा करें; पूर्ण विराम हटाएँ और हल्के ऊपर जाते स्ट्रोक से समाप्त करें।'] } },
      { h: l('5. Ideal signature, start dates & 21-day chart', '5. आदर्श हस्ताक्षर, आरंभ तिथियाँ और 21 दिन का चार्ट'), p: {
        en: ['Start on a Tuesday – suggested dates 1 Dec and 15 Dec 2026 – and practise daily for 21 days with the tick-box chart in the report. Blue or black ink for documents.'],
        hi: ['मंगलवार से शुरू करें – सुझाई गई तिथियाँ 1 दिसंबर और 15 दिसंबर 2026 – और रिपोर्ट के चार्ट के साथ 21 दिन रोज़ अभ्यास करें। दस्तावेज़ों के लिए नीली या काली स्याही।'] } },
    ],
  },
  {
    code: 'SVC_DESTINY_MATRIX', open: 2, client: RIYA,
    title: l('Destiny Matrix Analysis – sample pages', 'डेस्टिनी मैट्रिक्स विश्लेषण – नमूना पृष्ठ'),
    tiles: [{ k: l('Centre', 'केंद्र'), v: '5', note: l('The Hierophant', 'गुरु') }, { k: l('Personality', 'व्यक्तित्व'), v: '14', note: l('Temperance', 'संयम') }, { k: l('Money point', 'धन-बिंदु'), v: '10', note: l('Wheel of Fortune', 'भाग्य चक्र') }, { k: l('Karmic tail', 'कर्म-पूँछ'), v: '12-19-7' }],
    sections: [
      { h: l('1. Your matrix at a glance', '1. एक नज़र में आपकी मैट्रिक्स'), p: { en: ['Day 14, month 8 and year 1992 (1+9+9+2 = 21) give the four outer points; their sum 43 → 7 is the bottom point and 14+8+21+7 = 50 → 5 is the centre.'], hi: ['दिन 14, माह 8 और वर्ष 1992 (1+9+9+2 = 21) चार बाहरी बिंदु देते हैं; इनका योग 43 → 7 नीचे का बिंदु है और 14+8+21+7 = 50 → 5 केंद्र है।'] },
        rows: [
          { k: l('Personality (A)', 'व्यक्तित्व (A)'), v: l('14 – Temperance: calm, patient, finds the middle path', '14 – संयम: शांत, धैर्यवान, मध्य मार्ग खोजने वाली') },
          { k: l('Talents (B)', 'प्रतिभा (B)'), v: l('8 – Justice: fairness, order, law and accounts', '8 – न्याय: निष्पक्षता, व्यवस्था, क़ानून और लेखा') },
          { k: l('Comfort zone (E)', 'सहज क्षेत्र (E)'), v: l('5 – The Hierophant: a born teacher and mentor', '5 – गुरु: जन्मजात शिक्षक और मार्गदर्शक') },
          { k: l('Now (age 33¾–35)', 'अभी (33¾–35 वर्ष)'), v: l('21 – The World: expansion, travel, wider horizons', '21 – विश्व: विस्तार, यात्रा, व्यापक क्षितिज') },
        ] },
      { h: l('2. Money channel', '2. धन चैनल'), p: { en: ['Year energy 21 (The World) → 11 → 8 opens at the money point 10 – Wheel of Fortune: money comes in waves through trade, travel and networking. Save in the good phases; the balance point 20 links money to family.'], hi: ['वर्ष ऊर्जा 21 (विश्व) → 11 → 8 धन-बिंदु 10 – भाग्य चक्र पर खुलती है: धन व्यापार, यात्रा और नेटवर्किंग से लहरों में आता है। अच्छे दौर में बचत करें; संतुलन बिंदु 20 धन को परिवार से जोड़ता है।'] } },
      { h: l('3. Love channel & karmic tail', '3. प्रेम चैनल और कर्म-पूँछ'), p: { en: ['Love point 5 – values-based, committed love. Karmic tail 12-19-7: serve from love, shine without ego and set the right goal before racing ahead.'], hi: ['प्रेम-बिंदु 5 – मूल्यों पर आधारित, प्रतिबद्ध प्रेम। कर्म-पूँछ 12-19-7: प्रेम से सेवा करें, अहंकार के बिना चमकें और दौड़ने से पहले सही लक्ष्य तय करें।'] } },
      { h: l('4. Life purposes', '4. जीवन उद्देश्य'), p: { en: ['Personal (20–40): 5 – to teach and pass on wisdom. Social (40–60): 10 – to live in the flow and help others trust change. Spiritual: 15. Planetary: 7.'], hi: ['व्यक्तिगत (20–40): 5 – सिखाना और ज्ञान आगे देना। सामाजिक (40–60): 10 – जीवन के प्रवाह में जीना और दूसरों को परिवर्तन पर भरोसा करना सिखाना। आध्यात्मिक: 15। ग्रहीय: 7।'] } },
      { h: l('5. Next ten years', '5. अगले दस वर्ष'), p: { en: ['35: 5 Hierophant · 36¼: 13 Transformation · 37½: 8 Justice · 38¾: 11 Strength · 40: 21 The World – a decade of teaching, renewal and widening horizons.'], hi: ['35: 5 गुरु · 36¼: 13 परिवर्तन · 37½: 8 न्याय · 38¾: 11 शक्ति · 40: 21 विश्व – सिखाने, नवीनीकरण और क्षितिज बढ़ाने का दशक।'] } },
    ],
  },
  {
    code: 'SVC_BIRTH_CHART', open: 2, client: RIYA,
    title: l('Pythagorean Birth Chart – sample pages', 'पाइथागोरस जन्म चार्ट – नमूना पृष्ठ'),
    tiles: [{ k: l('Working numbers', 'कार्य-अंक'), v: '34·7·32·5' }, { k: l('Character', 'चरित्र'), v: '11' }, { k: l('Health', 'स्वास्थ्य'), v: '44' }, { k: l('Empty cell', 'खाली खाना'), v: '6' }],
    sections: [
      { h: l('1. How the square is built', '1. वर्ग कैसे बनता है'), p: { en: ['Digits of 14.08.1992 add up to 34 (1st working number); 3+4 = 7 (2nd); 34 − 2×1 = 32 (3rd); 3+2 = 5 (4th). All digits except zeros go into the nine cells.'], hi: ['14.08.1992 के अंकों का योग 34 (पहला कार्य-अंक); 3+4 = 7 (दूसरा); 34 − 2×1 = 32 (तीसरा); 3+2 = 5 (चौथा)। शून्य छोड़कर सभी अंक नौ खानों में जाते हैं।'] },
        rows: [
          { k: l('Character (11)', 'चरित्र (11)'), v: l('Soft, friendly will – likes harmony', 'कोमल, मित्रवत इच्छाशक्ति – सामंजस्य पसंद') },
          { k: l('Energy (22)', 'ऊर्जा (22)'), v: l('Good, healthy energy that recovers quickly', 'अच्छी, स्वस्थ ऊर्जा जो जल्दी लौटती है') },
          { k: l('Health (44)', 'स्वास्थ्य (44)'), v: l('Good health and stamina', 'अच्छा स्वास्थ्य और सहनशक्ति') },
          { k: l('Memory (99)', 'स्मृति (99)'), v: l('Learns quickly, good intelligence', 'जल्दी सीखती है, अच्छी बुद्धि') },
        ] },
      { h: l('2. Life lines', '2. जीवन रेखाएँ'), p: { en: ['Purpose 5 (strong), self-esteem 6 (strong), spirituality 5 (strong); family, habits, talent and temperament 4 (normal); money & home 3 (normal).'], hi: ['उद्देश्य 5 (मज़बूत), आत्म-सम्मान 6 (मज़बूत), आध्यात्मिकता 5 (मज़बूत); परिवार, आदतें, प्रतिभा और स्वभाव 4 (सामान्य); धन व घर 3 (सामान्य)।'] } },
      { h: l('3. To develop', '3. विकसित करें'), p: { en: ['Cell 6 (work & practical skill) is empty: doing something with the hands every week grounds the mind and builds practical skill.'], hi: ['खाना 6 (श्रम और व्यावहारिक कौशल) खाली है: हर सप्ताह हाथों से कुछ करना मन को स्थिर करता है और व्यावहारिक कौशल बढ़ाता है।'] } },
    ],
  },
];

export const sampleFor = (code: string) => SERVICE_SAMPLES.find((s) => s.code === code);
