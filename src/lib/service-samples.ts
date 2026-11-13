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
];

export const sampleFor = (code: string) => SERVICE_SAMPLES.find((s) => s.code === code);
