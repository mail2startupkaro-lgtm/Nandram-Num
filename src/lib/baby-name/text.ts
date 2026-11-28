/** Baby Name Analysis – English / Hindi wording for the admin preview and the PDF. Plain, warm language for parents. */
import type { Relation } from '@/lib/numerology/data/relations';
import type { CompoundCategory } from '@/lib/numerology/data/tables';
import type { Check, LetterClass, Verdict } from './analysis';

export type Lang = 'en' | 'hi';

const en = {
  title: 'Baby Name Numerology Report', sub: 'Name selection by date of birth',
  t1: 'Baby Name', t2: 'Numerology Report', tag: 'Numerology  ·  Baby Name  ·  Lo Shu Grid',
  kickerCover: 'Advanced name analysis · by date of birth', preparedFor: 'Prepared for', babyOf: (s: string) => (s ? `Baby ${s}` : 'Your little one'),
  by: 'Your numerologist', years: '15+ years of practice', conf: 'Personal and confidential', recommended: 'Recommended name',
  client: 'Baby', dob: 'Date of birth', tob: 'Time of birth', pob: 'Place of birth', gender: 'Gender', parents: 'Parents', date: 'Report date', surname: 'Surname',
  boy: 'Boy', girl: 'Girl', any: 'Not decided',
  moolank: 'Moolank', bhagyank: 'Bhagyank', kua: 'Kua', planet: 'Planet', born: 'born on the', group: 'group',
  summary: 'Summary of findings', score: 'Name score', inside: 'Inside this report', topPicks: 'Top three names for your baby',
  dear: (s: string) => (s ? `Dear ${s} family,` : 'Dear parents,'),
  letter: (o: { name: string; score: number; b: number; m: number; n: number; fam: string | null }) =>
    `Congratulations on your little one. I have checked every name against your baby's date of birth – Moolank ${o.m} and Bhagyank ${o.b} – using the Chaldean letter values, the compound number, the first letter, the soul urge, the Lo Shu grid${o.fam ? ' and both parents’ names' : ''}. The name that suits your baby best is ${o.name}, with a score of ${o.score} out of 100. Its number ${o.n} supports the path your baby is born with. On the next pages you will find why, how the other names compare, the lucky letters and numbers, small spelling changes that improve a name without changing its sound, and good dates for the naming ceremony.`,
  letterCur: (a: 'keep' | 'spelling' | 'change', cur: string, rec: string, alt: string) =>
    (a === 'keep' ? `Your baby is already called ${cur}, and the name suits the numbers well, so I recommend keeping it.`
      : a === 'spelling' ? `Your baby is already called ${cur}; I have kept the same sound and corrected the spelling to ${rec}.`
        : `The current name ${cur} does not suit the birth numbers, so I suggest ${rec} if a new name is possible.`)
    + (alt && a !== 'change' ? ` If you are open to a completely new name, ${alt} scores higher.` : ''),
  sec: {
    birth: 'Your baby’s birth numbers', blueprint: 'Lucky name blueprint', ranking: 'All names compared', top: 'The recommended name in depth',
    runners: 'Second and third choices', family: 'Family name harmony', bank: 'More names that suit your baby', ceremony: 'Naming ceremony and guidance', about: 'About your numerologist',
    current: 'Your baby’s current name – check and correction', nickname: 'Formal name and nickname', remedies: 'Remedies for your child’s development', career: 'Best career path for your child',
  },
  secD: {
    birth: 'Every name is checked against two numbers from the date of birth: the Moolank (from the day) shapes nature and habits, and the Bhagyank (from the full date) shows the path of life. A good name is a friend of both.',
    blueprint: 'These are the name numbers and starting letters that work in harmony with your baby’s birth numbers. Use them when you choose or spell a name.',
    ranking: 'Each name gets one score out of 100. The full name with surname counts most, then the first name, the first letter, the soul urge (vowels), the Lo Shu grid and harmony with the parents.',
    top: 'Here is how the recommended name works, letter by letter, and why it suits your baby.',
    runners: 'If you prefer another name, these are the next best. Small spelling changes are shown where they help.',
    family: 'A child’s name sits best in the family when its number is friendly with the parents’ name numbers. This page shows how each top name sits with mother and father.',
    bank: 'From my list of meaningful Indian names, these suit your baby’s date of birth' ,
    ceremony: 'Good dates to name your baby, colours and days that support the child, and simple tips for using the name.',
    current: 'Your baby already has a name. Here I check it with the same method as every other name and tell you plainly whether to keep it, correct its spelling, or choose a new name.',
    nickname: 'The formal name goes on the birth certificate and school records. The nickname is the name your child hears many times every day at home, so its sound works on the child daily. Both should be friends of the birth numbers and of each other.',
    remedies: 'Simple, safe practices chosen from your baby’s numbers to support health, learning and a happy, confident nature. Small daily habits work better than big one-time rituals.',
    career: 'The work your child is naturally made for, worked out from the Bhagyank (life direction), the Moolank (natural talent), the recommended name number and the Lo Shu grid. Numbers show natural inclinations – observe your child, encourage these strengths and let their own interests decide.',
  },
  nature: 'Nature (from Moolank)', path: 'Life path (from Bhagyank)', mb: 'Moolank and Bhagyank',
  grid: 'Lo Shu grid from the date of birth', missing: 'Missing numbers', repeated: 'Repeated numbers', none: 'None',
  friendly: 'Friendly numbers', neutralN: 'Neutral numbers', avoidN: 'Numbers to avoid',
  luckyNums: 'Lucky name numbers', bestTotals: 'Best compound totals', luckyLetters: 'Lucky first letters', neutralLetters: 'Neutral first letters', avoidLetters: 'First letters to avoid',
  prefH: 'The letters you asked about', prefD: 'Starting letters given by the family or from the rashi.', value: 'Value',
  tips: 'How to use this', tipsList: [
    'Choose a name whose total (first name with surname) is one of the lucky name numbers.',
    'A first letter from the lucky group gives the name a good start; avoid the letters in the last group if you can.',
    'Use exactly the same spelling on the birth certificate, Aadhaar, school records and passport.',
    'A small spelling change (a double letter or a long vowel) can improve a name without changing how it sounds.',
  ],
  rank: '#', name: 'Name', meaning: 'Meaning', firstN: 'First name', fullN: 'Full name', initial: 'First letter', verdictH: 'Verdict', source: 'From',
  fromFamily: 'Your list', fromBank: 'Suggested', prefMark: 'In your letters',
  chaldean: 'Chaldean', pyth: 'Pythagorean', soul: 'Soul urge', personality: 'Personality', compound: 'Compound', vowel: 'Vowel', letterH: 'Letter',
  numMeaning: (n: number) => `What name number ${n} gives your child`, checklist: 'Name checklist', cmpMeaning: 'Compound meaning',
  tweaks: 'Spelling tweaks that keep the sound', noTweaks: 'This spelling is already the best for this name.', changes: 'Change',
  father: 'Father', mother: 'Mother', nameNo: 'Name number', withFather: 'With father', withMother: 'With mother', famNote: 'Enter the parents’ names in the tool to include this check.',
  ceremonyH: 'Good dates for the naming ceremony', ceremonyD: 'Dates whose number is a friend of the baby’s Bhagyank and not against the Moolank, from the 11th day after birth.',
  noDates: 'No suitable dates in the next 60 days – ask me for a personal date.', dayNo: 'Date number',
  colours: 'Lucky colours for the baby', luckyDay: 'Lucky day', mantra: 'Mantra for blessings', nursery: 'For the nursery (missing numbers)',
  useH: 'Using the name', useList: [
    'Write the name in the same spelling everywhere – this is the spelling that carries the number.',
    'If you use a nickname at home, choose one whose number also suits the baby (see the nickname page); on paper always use the formal name.',
    'If you change a spelling, update it before the birth certificate is made – later changes need affidavits.',
  ],
  expertNote: 'Note from your numerologist', closing: 'A name is the first gift you give your child. May it bring health, wisdom and happiness all life long.',
  services: 'Other ways I can help your family', servicesD: 'Many parents also take these readings for the baby and for themselves.',
  whatsapp: 'WhatsApp', telegram: 'Telegram', website: 'Website', scanWa: 'Scan to chat on WhatsApp', scanWeb: 'Scan to see all services',
  ctaH: 'Want me to choose the name personally?', ctaD: 'Send me the date and time of birth and the letters you like. I will check the names myself, match them with the rashi letters and send you a short list with the best spelling.',
  disclaimer: 'Baby name numerology gives guidance based on the traditions of Vedic, Chaldean and Lo Shu numerology. It is not medical, legal or astrological certainty, and no outcome is guaranteed. Meanings of names are traditional and may vary by region. The final choice of name belongs to the family.',
  madeLine: (by: string) => `Prepared by ${by} from your baby’s date of birth`,
  bioDefault: (name: string) => `${name} has practised numerology for more than 15 years, working with the Vedic, Chaldean and Lo Shu systems. He has helped many families choose names for their newborns and corrects names for children and adults, and every report is checked by him before it is sent. He also holds regular live sessions on YouTube.`,
  bioOther: (name: string) => `This report was prepared and checked by ${name}.`,
  whyBaby: 'For brothers and sisters, or a second opinion on the rashi letters.',
  whyReport: 'A full life report for your baby – nature, studies, health tips and lucky years.',
  whyName: 'Make the parents’ own names match their numbers too.',
  cur: {
    formal: 'Current formal name', nick: 'Current nickname', keepH: 'Keep this name', spellingH: 'Correct the spelling', changeH: 'A new name is better', nchangeH: 'A new nickname is better',
    keep: (n: string, sc: number) => `${n} scores ${sc} out of 100 and suits your baby. Keep it – no change is needed.`,
    spelling: (n: string, sc: number, c: string, cs: number) => `${n} scores ${sc}. A small spelling change keeps the same sound and lifts the score: ${c} scores ${cs}. Use ${c} on the birth certificate and all documents.`,
    change: (n: string, sc: number, c: string) => `${n} scores ${sc} – its number is not friendly with your baby’s birth numbers, and no spelling change fixes it fully. If a new name is possible, ${c} is my recommendation; names with the same starting sound are listed below.`,
    nkeep: (n: string, sc: number) => `The nickname ${n} scores ${sc} out of 100. It suits your baby – keep calling the child ${n}.`,
    nspelling: (n: string, sc: number, c: string, cs: number) => `The nickname ${n} scores ${sc}. Written and said as ${c} it scores ${cs}, with almost the same sound.`,
    nchange: (n: string, sc: number, c: string) => `The nickname ${n} scores ${sc} – its number clashes with the birth numbers or with the formal name. Slowly move to ${c} or another nickname from the list.`,
    issues: 'What needs attention', good: 'What works well', corrected: 'Corrected spelling', sameSound: 'New names with the same starting sound',
    applyH: 'How to make the change', apply: [
      'Before the birth certificate is made: simply register the corrected spelling.',
      'After it is made: the birth registrar can correct the name, usually with a request letter and the parents’ ID; later changes may need an affidavit or a gazette notice. Rules differ by state and country – ask your registrar.',
      'Use the new spelling everywhere at once: birth certificate, Aadhaar or passport, school and bank records.',
    ],
  },
  nick: {
    formalH: 'Formal name (for documents)', nickH: 'Nickname (calling name)', harmony: 'Formal name and nickname harmony', with: 'With formal name',
    suggestH: 'Nicknames that suit your baby', suggestD: (f: string) => `Each nickname is checked on its own and with the formal name ${f}.`,
    short: 'Short form of the formal name', pet: 'Loving pet name', recommendedNick: 'Recommended nickname',
    tipsH: 'Using the nickname', tips: [
      'Use one main nickname at home so the child hears one steady sound; many different nicknames scatter it.',
      'A nickname is for the home and family – keep the formal name on every document.',
      'Short forms of the formal name (like Abhi for Abhinav) keep both names connected.',
    ],
    none: 'No suitable nickname found – write to me and I will make one for you.',
  },
  rem: {
    growthH: 'Nurture by nature', health: 'Health and sleep', learning: 'Learning and memory', emotion: 'Feelings and confidence',
    missingH: 'Missing numbers – simple remedies', area: 'Area', activity: 'What to do', home: 'At home / nursery',
    planetsH: 'Planet remedies for the parents', day: 'Day', daan: 'Charity (daan)', practice: 'Practice', mantra: 'Mantra (parents)',
    colourDay: 'Colours and day', safetyH: 'Safety first',
    noMissing: 'No number is missing from your baby’s Lo Shu grid – a balanced chart. The tips above are enough.',
  },
  verdict: { excellent: 'Excellent', good: 'Good', average: 'Average', weak: 'Weak' } as Record<Verdict, string>,
  headline: { excellent: 'A very good name for your baby', good: 'A good, supportive name', average: 'Workable – a small spelling change will help', weak: 'Better to choose another name' } as Record<Verdict, string>,
  rel: { friend: 'Friendly', neutral: 'Neutral', enemy: 'Against' } as Record<Relation, string>,
  cat: { favourable: 'Favourable', mixed: 'Mixed', unfavourable: 'Unfavourable' } as Record<CompoundCategory, string>,
  cls: { lucky: 'Lucky', neutral: 'Neutral', avoid: 'Avoid' } as Record<LetterClass, string>,
  pass: 'Good', warn: 'Okay', fail: 'Weak', yes: 'Yes', no: 'No',
};

type Lab = typeof en;

const hi: Lab = {
  title: 'शिशु नाम अंक ज्योतिष रिपोर्ट', sub: 'जन्म तिथि के अनुसार नाम चयन',
  t1: 'शिशु नाम', t2: 'अंक ज्योतिष रिपोर्ट', tag: 'अंक ज्योतिष  ·  शिशु नाम  ·  लो शू ग्रिड',
  kickerCover: 'एडवांस नाम विश्लेषण · जन्म तिथि के अनुसार', preparedFor: 'के लिए तैयार', babyOf: (s: string) => (s ? `शिशु ${s}` : 'आपका नन्हा शिशु'),
  by: 'आपके अंक ज्योतिषी', years: '15+ वर्षों का अनुभव', conf: 'व्यक्तिगत एवं गोपनीय', recommended: 'सुझाया गया नाम',
  client: 'शिशु', dob: 'जन्म तिथि', tob: 'जन्म समय', pob: 'जन्म स्थान', gender: 'लिंग', parents: 'माता-पिता', date: 'रिपोर्ट तिथि', surname: 'उपनाम',
  boy: 'बालक', girl: 'बालिका', any: 'तय नहीं',
  moolank: 'मूलांक', bhagyank: 'भाग्यांक', kua: 'कुआ', planet: 'ग्रह', born: 'जन्म', group: 'समूह',
  summary: 'मुख्य निष्कर्ष', score: 'नाम स्कोर', inside: 'इस रिपोर्ट में', topPicks: 'आपके शिशु के लिए तीन सबसे अच्छे नाम',
  dear: (s: string) => (s ? `प्रिय ${s} परिवार,` : 'प्रिय माता-पिता,'),
  letter: (o) =>
    `आपके नन्हे शिशु के आगमन पर हार्दिक बधाई। मैंने हर नाम को आपके शिशु की जन्म तिथि – मूलांक ${o.m} और भाग्यांक ${o.b} – से मिलाकर जाँचा है: कैल्डियन अक्षर-मान, कंपाउंड अंक, पहला अक्षर, सोल अर्ज, लो शू ग्रिड${o.fam ? ' और माता-पिता दोनों के नाम' : ''}। आपके शिशु के लिए सबसे उपयुक्त नाम ${o.name} है, जिसका स्कोर 100 में से ${o.score} है। इसका अंक ${o.n} शिशु के जीवन-पथ का साथ देता है। अगले पन्नों में आप पढ़ेंगे कि ऐसा क्यों है, बाकी नाम कैसे हैं, शुभ अक्षर और अंक, आवाज़ बदले बिना स्पेलिंग के छोटे सुधार, और नामकरण के शुभ दिन।`,
  letterCur: (a, cur, rec, alt) =>
    (a === 'keep' ? `आपके शिशु का नाम पहले से ${cur} है, और यह अंकों के अनुकूल है, इसलिए मेरा सुझाव है कि यही नाम रखें।`
      : a === 'spelling' ? `आपके शिशु का नाम पहले से ${cur} है; मैंने वही ध्वनि रखते हुए स्पेलिंग सुधारकर ${rec} की है।`
        : `वर्तमान नाम ${cur} जन्म अंकों के अनुकूल नहीं है, इसलिए नया नाम संभव हो तो ${rec} रखें।`)
    + (alt && a !== 'change' ? ` यदि आप बिल्कुल नया नाम रखना चाहें, तो ${alt} का स्कोर अधिक है।` : ''),
  sec: {
    birth: 'आपके शिशु के जन्म अंक', blueprint: 'शुभ नाम का खाका', ranking: 'सभी नामों की तुलना', top: 'सुझाया गया नाम – विस्तार से',
    runners: 'दूसरा और तीसरा विकल्प', family: 'परिवार के नामों से तालमेल', bank: 'आपके शिशु के लिए और उपयुक्त नाम', ceremony: 'नामकरण और मार्गदर्शन', about: 'आपके अंक ज्योतिषी के बारे में',
    current: 'शिशु का वर्तमान नाम – जाँच और सुधार', nickname: 'औपचारिक नाम और निकनेम', remedies: 'बच्चे के विकास के लिए उपाय', career: 'बच्चे के लिए सर्वश्रेष्ठ करियर पथ',
  },
  secD: {
    birth: 'हर नाम को जन्म तिथि के दो अंकों से जाँचा जाता है: मूलांक (जन्म दिन से) स्वभाव और आदतें बनाता है, और भाग्यांक (पूरी तिथि से) जीवन का रास्ता दिखाता है। अच्छा नाम दोनों का मित्र होता है।',
    blueprint: 'ये वे नामांक और पहले अक्षर हैं जो आपके शिशु के जन्म अंकों के साथ तालमेल में हैं। नाम चुनते या लिखते समय इनका उपयोग करें।',
    ranking: 'हर नाम को 100 में से एक स्कोर मिलता है। उपनाम सहित पूरे नाम का भार सबसे अधिक है, फिर पहला नाम, पहला अक्षर, सोल अर्ज (स्वर), लो शू ग्रिड और माता-पिता से तालमेल।',
    top: 'सुझाया गया नाम अक्षर-दर-अक्षर कैसे काम करता है और यह आपके शिशु के लिए क्यों उपयुक्त है।',
    runners: 'अगर आपको कोई और नाम पसंद है, तो ये अगले सबसे अच्छे विकल्प हैं। जहाँ मदद मिलती है, वहाँ स्पेलिंग के छोटे बदलाव दिए गए हैं।',
    family: 'बच्चे का नाम परिवार में तब सबसे अच्छा बैठता है जब उसका अंक माता-पिता के नामांक से मित्रता रखता हो। यह पन्ना दिखाता है कि हर मुख्य नाम माता और पिता के साथ कैसा है।',
    bank: 'मेरी अर्थपूर्ण भारतीय नामों की सूची में से ये नाम आपके शिशु की जन्म तिथि के अनुकूल हैं',
    ceremony: 'नामकरण के शुभ दिन, शिशु के लिए शुभ रंग और दिन, और नाम के उपयोग के सरल सुझाव।',
    current: 'आपके शिशु का नाम पहले से रखा हुआ है। यहाँ मैंने उसे उसी पद्धति से जाँचा है जिससे बाकी नाम, और साफ़ बताया है कि नाम रखें, उसकी स्पेलिंग सुधारें या नया नाम चुनें।',
    nickname: 'औपचारिक नाम जन्म प्रमाण पत्र और स्कूल के रिकॉर्ड में जाता है। निकनेम वह नाम है जिससे घर में बच्चे को दिन में कई बार पुकारा जाता है, इसलिए उसकी ध्वनि रोज़ बच्चे पर असर करती है। दोनों जन्म अंकों के और आपस में भी मित्र होने चाहिए।',
    remedies: 'शिशु के अंकों से चुने गए सरल और सुरक्षित उपाय, जो स्वास्थ्य, पढ़ाई और ख़ुशमिज़ाज, आत्मविश्वासी स्वभाव में सहायक हैं। बड़े एक-बार के अनुष्ठानों से ज़्यादा छोटी रोज़ की आदतें काम करती हैं।',
    career: 'बच्चा स्वाभाविक रूप से किस काम के लिए बना है – भाग्यांक (जीवन दिशा), मूलांक (प्राकृतिक प्रतिभा), सुझाए गए नाम के नामांक और लो शू ग्रिड से निकाला गया। अंक स्वाभाविक झुकाव दिखाते हैं – बच्चे को ध्यान से देखें, इन क्षमताओं को प्रोत्साहित करें और अंतिम निर्णय उसकी अपनी रुचि पर छोड़ें।',
  },
  nature: 'स्वभाव (मूलांक से)', path: 'जीवन पथ (भाग्यांक से)', mb: 'मूलांक और भाग्यांक',
  grid: 'जन्म तिथि का लो शू ग्रिड', missing: 'अनुपस्थित अंक', repeated: 'दोहराए अंक', none: 'कोई नहीं',
  friendly: 'मित्र अंक', neutralN: 'सम अंक', avoidN: 'बचने वाले अंक',
  luckyNums: 'शुभ नामांक', bestTotals: 'सबसे अच्छे कंपाउंड अंक', luckyLetters: 'शुभ पहले अक्षर', neutralLetters: 'सम पहले अक्षर', avoidLetters: 'बचने वाले पहले अक्षर',
  prefH: 'आपके बताए गए अक्षर', prefD: 'परिवार द्वारा या राशि से मिले पहले अक्षर।', value: 'मान',
  tips: 'इसका उपयोग कैसे करें', tipsList: [
    'ऐसा नाम चुनें जिसका कुल (उपनाम सहित) शुभ नामांकों में से एक हो।',
    'शुभ समूह का पहला अक्षर नाम को अच्छी शुरुआत देता है; हो सके तो आखिरी समूह के अक्षरों से बचें।',
    'जन्म प्रमाण पत्र, आधार, स्कूल और पासपोर्ट – सब जगह बिल्कुल एक ही स्पेलिंग लिखें।',
    'स्पेलिंग में छोटा बदलाव (दोहरा अक्षर या लंबा स्वर) आवाज़ बदले बिना नाम को बेहतर बना सकता है।',
  ],
  rank: '#', name: 'नाम', meaning: 'अर्थ', firstN: 'पहला नाम', fullN: 'पूरा नाम', initial: 'पहला अक्षर', verdictH: 'परिणाम', source: 'स्रोत',
  fromFamily: 'आपकी सूची', fromBank: 'सुझाव', prefMark: 'आपके अक्षर में',
  chaldean: 'कैल्डियन', pyth: 'पाइथागोरियन', soul: 'सोल अर्ज', personality: 'पर्सनैलिटी', compound: 'कंपाउंड', vowel: 'स्वर', letterH: 'अक्षर',
  numMeaning: (n: number) => `नामांक ${n} आपके बच्चे को क्या देता है`, checklist: 'नाम जाँच सूची', cmpMeaning: 'कंपाउंड अंक का अर्थ',
  tweaks: 'आवाज़ बदले बिना स्पेलिंग सुधार', noTweaks: 'इस नाम के लिए यही स्पेलिंग सबसे अच्छी है।', changes: 'बदलाव',
  father: 'पिता', mother: 'माता', nameNo: 'नामांक', withFather: 'पिता से', withMother: 'माता से', famNote: 'यह जाँच शामिल करने के लिए टूल में माता-पिता के नाम लिखें।',
  ceremonyH: 'नामकरण संस्कार के शुभ दिन', ceremonyD: 'वे तिथियाँ जिनका अंक शिशु के भाग्यांक का मित्र है और मूलांक के विरुद्ध नहीं, जन्म के 11वें दिन से।',
  noDates: 'अगले 60 दिनों में उपयुक्त तिथि नहीं मिली – व्यक्तिगत तिथि के लिए मुझसे पूछें।', dayNo: 'तिथि अंक',
  colours: 'शिशु के शुभ रंग', luckyDay: 'शुभ दिन', mantra: 'आशीर्वाद के लिए मंत्र', nursery: 'शिशु के कमरे के लिए (अनुपस्थित अंक)',
  useH: 'नाम का उपयोग', useList: [
    'नाम हर जगह एक ही स्पेलिंग में लिखें – यही स्पेलिंग अंक की ऊर्जा रखती है।',
    'घर में निकनेम से पुकारें तो ऐसा निकनेम चुनें जिसका अंक भी शिशु के अनुकूल हो (निकनेम वाला पन्ना देखें); काग़ज़ों पर हमेशा औपचारिक नाम ही लिखें।',
    'स्पेलिंग बदलनी हो तो जन्म प्रमाण पत्र बनने से पहले बदलें – बाद में बदलाव के लिए शपथ-पत्र लगता है।',
  ],
  expertNote: 'आपके अंक ज्योतिषी का संदेश', closing: 'नाम वह पहला उपहार है जो आप अपने बच्चे को देते हैं। यह जीवन भर स्वास्थ्य, बुद्धि और ख़ुशियाँ लाए।',
  services: 'मैं आपके परिवार की और कैसे मदद कर सकता हूँ', servicesD: 'कई माता-पिता शिशु और अपने लिए ये सेवाएँ भी लेते हैं।',
  whatsapp: 'व्हाट्सऐप', telegram: 'टेलीग्राम', website: 'वेबसाइट', scanWa: 'व्हाट्सऐप पर बात करने के लिए स्कैन करें', scanWeb: 'सभी सेवाएँ देखने के लिए स्कैन करें',
  ctaH: 'क्या आप चाहते हैं कि नाम मैं स्वयं चुनूँ?', ctaD: 'मुझे जन्म तिथि, जन्म समय और पसंद के अक्षर भेजें। मैं स्वयं नाम जाँचकर राशि अक्षरों से मिलाऊँगा और सबसे अच्छी स्पेलिंग के साथ छोटी सूची भेजूँगा।',
  disclaimer: 'शिशु नाम अंक ज्योतिष वैदिक, कैल्डियन और लो शू अंक ज्योतिष की परंपराओं पर आधारित मार्गदर्शन है। यह चिकित्सा, कानूनी या ज्योतिषीय निश्चितता नहीं है, और किसी परिणाम की गारंटी नहीं है। नामों के अर्थ पारंपरिक हैं और क्षेत्र के अनुसार बदल सकते हैं। नाम का अंतिम निर्णय परिवार का है।',
  madeLine: (by: string) => `${by} द्वारा आपके शिशु की जन्म तिथि से तैयार`,
  bioDefault: (name: string) => `${name} 15 वर्षों से अधिक समय से अंक ज्योतिष का अभ्यास कर रहे हैं और वैदिक, कैल्डियन तथा लो शू पद्धतियों से काम करते हैं। उन्होंने अनेक परिवारों को नवजात शिशुओं के नाम चुनने में मदद की है और बच्चों व बड़ों के नाम सुधारते हैं। हर रिपोर्ट भेजने से पहले वे स्वयं जाँचते हैं। वे यूट्यूब पर नियमित लाइव सत्र भी करते हैं।`,
  bioOther: (name: string) => `यह रिपोर्ट ${name} द्वारा तैयार और जाँची गई है।`,
  whyBaby: 'भाई-बहनों के लिए, या राशि अक्षरों पर दूसरी राय के लिए।',
  whyReport: 'आपके शिशु के लिए पूरी जीवन रिपोर्ट – स्वभाव, पढ़ाई, स्वास्थ्य सुझाव और शुभ वर्ष।',
  whyName: 'माता-पिता के अपने नाम भी उनके अंकों के अनुकूल बनाएँ।',
  cur: {
    formal: 'वर्तमान औपचारिक नाम', nick: 'वर्तमान निकनेम', keepH: 'यही नाम रखें', spellingH: 'स्पेलिंग सुधारें', changeH: 'नया नाम बेहतर रहेगा', nchangeH: 'नया निकनेम बेहतर रहेगा',
    keep: (n, sc) => `${n} का स्कोर 100 में से ${sc} है और यह आपके शिशु के अनुकूल है। यही नाम रखें – कोई बदलाव ज़रूरी नहीं।`,
    spelling: (n, sc, c, cs) => `${n} का स्कोर ${sc} है। स्पेलिंग का छोटा बदलाव आवाज़ वही रखता है और स्कोर बढ़ाता है: ${c} का स्कोर ${cs} है। जन्म प्रमाण पत्र और सभी दस्तावेज़ों में ${c} लिखें।`,
    change: (n, sc, c) => `${n} का स्कोर ${sc} है – इसका अंक शिशु के जन्म अंकों का मित्र नहीं है, और स्पेलिंग बदलने से भी पूरा सुधार नहीं होता। यदि नया नाम रखना संभव हो, तो मेरा सुझाव ${c} है; उसी आरंभिक ध्वनि वाले नाम नीचे दिए हैं।`,
    nkeep: (n, sc) => `निकनेम ${n} का स्कोर 100 में से ${sc} है। यह शिशु के अनुकूल है – बच्चे को ${n} ही पुकारते रहें।`,
    nspelling: (n, sc, c, cs) => `निकनेम ${n} का स्कोर ${sc} है। ${c} लिखने और बोलने पर स्कोर ${cs} हो जाता है, ध्वनि लगभग वही रहती है।`,
    nchange: (n, sc, c) => `निकनेम ${n} का स्कोर ${sc} है – इसका अंक जन्म अंकों या औपचारिक नाम से मेल नहीं खाता। धीरे-धीरे ${c} या सूची का कोई दूसरा निकनेम अपनाएँ।`,
    issues: 'किन बातों पर ध्यान दें', good: 'क्या अच्छा है', corrected: 'सुधरी हुई स्पेलिंग', sameSound: 'उसी आरंभिक ध्वनि वाले नए नाम',
    applyH: 'बदलाव कैसे करें', apply: [
      'जन्म प्रमाण पत्र बनने से पहले: सीधे सुधरी हुई स्पेलिंग दर्ज कराएँ।',
      'बनने के बाद: जन्म रजिस्ट्रार नाम सुधार सकते हैं, प्रायः आवेदन पत्र और माता-पिता के पहचान पत्र से; बाद में बदलाव के लिए शपथ-पत्र या गज़ट सूचना लग सकती है। नियम राज्य और देश के अनुसार अलग हैं – रजिस्ट्रार से पूछें।',
      'नई स्पेलिंग हर जगह एक साथ लिखें: जन्म प्रमाण पत्र, आधार या पासपोर्ट, स्कूल और बैंक रिकॉर्ड।',
    ],
  },
  nick: {
    formalH: 'औपचारिक नाम (दस्तावेज़ों के लिए)', nickH: 'निकनेम (पुकारने का नाम)', harmony: 'औपचारिक नाम और निकनेम का तालमेल', with: 'औपचारिक नाम से',
    suggestH: 'शिशु के अनुकूल निकनेम', suggestD: (f) => `हर निकनेम को अलग से और औपचारिक नाम ${f} के साथ जाँचा गया है।`,
    short: 'औपचारिक नाम का छोटा रूप', pet: 'प्यार का नाम', recommendedNick: 'सुझाया गया निकनेम',
    tipsH: 'निकनेम का उपयोग', tips: [
      'घर में एक ही मुख्य निकनेम रखें ताकि बच्चा एक स्थिर ध्वनि सुने; कई अलग-अलग निकनेम उसे बिखेर देते हैं।',
      'निकनेम घर और परिवार के लिए है – हर दस्तावेज़ में औपचारिक नाम ही रखें।',
      'औपचारिक नाम का छोटा रूप (जैसे अभिनव के लिए अभि) दोनों नामों को जोड़े रखता है।',
    ],
    none: 'उपयुक्त निकनेम नहीं मिला – मुझे लिखें, मैं आपके लिए बना दूँगा।',
  },
  rem: {
    growthH: 'स्वभाव के अनुसार पालन', health: 'स्वास्थ्य और नींद', learning: 'पढ़ाई और याददाश्त', emotion: 'भावनाएँ और आत्मविश्वास',
    missingH: 'अनुपस्थित अंक – सरल उपाय', area: 'क्षेत्र', activity: 'क्या करें', home: 'घर / शिशु कक्ष में',
    planetsH: 'माता-पिता के लिए ग्रह उपाय', day: 'दिन', daan: 'दान', practice: 'अभ्यास', mantra: 'मंत्र (माता-पिता)',
    colourDay: 'रंग और दिन', safetyH: 'सुरक्षा पहले',
    noMissing: 'शिशु के लो शू ग्रिड में कोई अंक अनुपस्थित नहीं – संतुलित चार्ट। ऊपर के सुझाव पर्याप्त हैं।',
  },
  verdict: { excellent: 'उत्तम', good: 'अच्छा', average: 'सामान्य', weak: 'कमज़ोर' },
  headline: { excellent: 'आपके शिशु के लिए बहुत अच्छा नाम', good: 'अच्छा, सहयोगी नाम', average: 'चल सकता है – स्पेलिंग का छोटा बदलाव मदद करेगा', weak: 'दूसरा नाम चुनना बेहतर' },
  rel: { friend: 'मित्र', neutral: 'सम', enemy: 'विरोधी' },
  cat: { favourable: 'शुभ', mixed: 'मिला-जुला', unfavourable: 'कम शुभ' },
  cls: { lucky: 'शुभ', neutral: 'सम', avoid: 'बचें' },
  pass: 'अच्छा', warn: 'ठीक', fail: 'कमज़ोर', yes: 'हाँ', no: 'नहीं',
};

export const L: Record<Lang, Lab> = { en, hi };
export type { Lab };

/** What each name number (1–9) gives a child. */
export const NAME_NUMBER_TEXT: Record<Lang, Record<number, string>> = {
  en: {
    1: 'Confidence, leadership and a strong will. The child likes to do things first and on their own, and grows into a natural leader.',
    2: 'Gentleness, care and imagination. The child is sensitive, loving and good with people, and needs a calm, warm home.',
    3: 'Wisdom, learning and good values. The child loves to learn and to teach others, is respected and usually does well in studies.',
    4: 'Hard work, discipline and practical skill. The child is steady and logical; this number is heavy unless it is the child’s own birth number.',
    5: 'Intelligence, quick speech and adaptability. The child is cheerful, curious and good with numbers, language and business.',
    6: 'Love, beauty and harmony. The child is affectionate, artistic and family-minded, and brings comfort and charm to the home.',
    7: 'Depth, intuition and a search for meaning. The child is thoughtful and spiritual and needs encouragement to share feelings.',
    8: 'Patience, endurance and late but lasting success. A serious number for a child – best only when 8 or 4 is the birth number.',
    9: 'Energy, courage and a caring heart. The child is active, brave and protective, and does well in sports and service.',
  },
  hi: {
    1: 'आत्मविश्वास, नेतृत्व और दृढ़ इच्छा। बच्चा हर काम में आगे रहना और स्वयं करना पसंद करता है और स्वाभाविक नेता बनता है।',
    2: 'कोमलता, देखभाल और कल्पना। बच्चा संवेदनशील, प्रेमपूर्ण और लोगों से अच्छा व्यवहार करने वाला होता है; उसे शांत, स्नेहभरा घर चाहिए।',
    3: 'ज्ञान, पढ़ाई और अच्छे संस्कार। बच्चे को सीखना और सिखाना पसंद है, उसे सम्मान मिलता है और वह प्रायः पढ़ाई में अच्छा करता है।',
    4: 'मेहनत, अनुशासन और व्यावहारिक कौशल। बच्चा स्थिर और तार्किक होता है; यह अंक भारी है, जब तक यह बच्चे का अपना जन्म अंक न हो।',
    5: 'बुद्धि, तेज़ वाणी और हर स्थिति में ढलने की क्षमता। बच्चा हँसमुख, जिज्ञासु और गणित, भाषा व व्यापार में अच्छा होता है।',
    6: 'प्रेम, सुंदरता और सामंजस्य। बच्चा स्नेही, कलाप्रिय और परिवार से जुड़ा होता है, और घर में सुख व आकर्षण लाता है।',
    7: 'गहराई, अंतर्ज्ञान और अर्थ की खोज। बच्चा विचारशील और आध्यात्मिक होता है; उसे भावनाएँ बाँटने के लिए प्रोत्साहन चाहिए।',
    8: 'धैर्य, सहनशीलता और देर से पर स्थायी सफलता। बच्चे के लिए गंभीर अंक – तभी अच्छा जब जन्म अंक 8 या 4 हो।',
    9: 'ऊर्जा, साहस और दयालु हृदय। बच्चा सक्रिय, बहादुर और रक्षा करने वाला होता है, और खेल व सेवा में अच्छा करता है।',
  },
};

/** Child's nature by Moolank. */
export const CHILD_NATURE: Record<Lang, Record<number, string>> = {
  en: {
    1: 'Independent and self-willed from an early age. Give choices instead of orders and praise effort – this child blooms with responsibility.',
    2: 'Soft-hearted, emotional and imaginative. Needs reassurance, routine and quiet time; music and stories calm this child.',
    3: 'Curious, disciplined and eager to learn. Respects elders and rules; books, teachers and good company matter a lot.',
    4: 'Practical, questioning and a little stubborn. Likes to know why; explain rules and give hands-on activities.',
    5: 'Quick, playful and full of ideas. Gets bored easily – keep learning varied and let the child talk and explore.',
    6: 'Loving, creative and attached to family. Enjoys beauty, art and music; responds best to warmth and appreciation.',
    7: 'Quiet, observant and deep-thinking. Needs space and patience; nature, puzzles and spiritual stories suit this child.',
    8: 'Serious, patient and hard-working beyond their years. Encourage play and laughter, and be steady and fair.',
    9: 'Energetic, brave and quick to react. Channel the energy into sport; teach patience gently and the child becomes a protector.',
  },
  hi: {
    1: 'छोटी उम्र से ही स्वतंत्र और अपनी मर्ज़ी का। आदेश की जगह विकल्प दें और मेहनत की तारीफ़ करें – ज़िम्मेदारी से यह बच्चा खिलता है।',
    2: 'कोमल, भावुक और कल्पनाशील। इसे भरोसा, नियमित दिनचर्या और शांत समय चाहिए; संगीत और कहानियाँ इसे शांत करती हैं।',
    3: 'जिज्ञासु, अनुशासित और सीखने को उत्सुक। बड़ों और नियमों का सम्मान करता है; किताबें, शिक्षक और अच्छी संगत बहुत मायने रखते हैं।',
    4: 'व्यावहारिक, सवाल पूछने वाला और थोड़ा ज़िद्दी। हर बात का कारण जानना चाहता है; नियम समझाएँ और हाथ से करने वाली गतिविधियाँ दें।',
    5: 'तेज़, चंचल और विचारों से भरा। जल्दी ऊब जाता है – पढ़ाई में विविधता रखें और बच्चे को बोलने व खोजने दें।',
    6: 'प्रेमपूर्ण, रचनात्मक और परिवार से जुड़ा। सुंदरता, कला और संगीत पसंद है; स्नेह और सराहना से सबसे अच्छा प्रतिसाद देता है।',
    7: 'शांत, ध्यान से देखने वाला और गहरा सोचने वाला। इसे जगह और धैर्य चाहिए; प्रकृति, पहेलियाँ और आध्यात्मिक कहानियाँ अच्छी लगती हैं।',
    8: 'उम्र से अधिक गंभीर, धैर्यवान और मेहनती। खेल और हँसी को प्रोत्साहित करें, और स्थिर व न्यायपूर्ण रहें।',
    9: 'ऊर्जावान, बहादुर और तुरंत प्रतिक्रिया देने वाला। ऊर्जा को खेलों में लगाएँ; धैर्य प्यार से सिखाएँ, यह बच्चा रक्षक बनता है।',
  },
};

/** Life path by Bhagyank. */
export const LIFE_PATH: Record<Lang, Record<number, string>> = {
  en: {
    1: 'A path of leadership and self-made success – administration, government, own business.',
    2: 'A path of care, creativity and partnership – arts, counselling, hospitality, public relations.',
    3: 'A path of knowledge and guidance – teaching, law, finance, advisory roles.',
    4: 'A path of systems and hard work – engineering, technology, research, planning.',
    5: 'A path of communication and trade – business, media, sales, travel, banking.',
    6: 'A path of beauty and service – design, fashion, medicine, hospitality, family business.',
    7: 'A path of research and inner wisdom – science, spirituality, healing, writing.',
    8: 'A path of patience and big responsibility – industry, law, property, management; success grows with time.',
    9: 'A path of energy and service – defence, sports, surgery, engineering, social work.',
  },
  hi: {
    1: 'नेतृत्व और स्वयं बनाई सफलता का पथ – प्रशासन, सरकारी सेवा, अपना व्यवसाय।',
    2: 'देखभाल, रचनात्मकता और साझेदारी का पथ – कला, परामर्श, आतिथ्य, जनसंपर्क।',
    3: 'ज्ञान और मार्गदर्शन का पथ – शिक्षण, कानून, वित्त, सलाहकार भूमिकाएँ।',
    4: 'व्यवस्था और मेहनत का पथ – इंजीनियरिंग, तकनीक, शोध, योजना।',
    5: 'संवाद और व्यापार का पथ – व्यवसाय, मीडिया, सेल्स, यात्रा, बैंकिंग।',
    6: 'सुंदरता और सेवा का पथ – डिज़ाइन, फ़ैशन, चिकित्सा, आतिथ्य, पारिवारिक व्यवसाय।',
    7: 'शोध और आंतरिक ज्ञान का पथ – विज्ञान, अध्यात्म, उपचार, लेखन।',
    8: 'धैर्य और बड़ी ज़िम्मेदारी का पथ – उद्योग, कानून, प्रॉपर्टी, प्रबंधन; सफलता समय के साथ बढ़ती है।',
    9: 'ऊर्जा और सेवा का पथ – रक्षा, खेल, सर्जरी, इंजीनियरिंग, समाज सेवा।',
  },
};

export const relText = (r: Relation | null, l: Lab) => (r ? l.rel[r] : '–');

/** Sentence for one checklist rule. */
export function checkText(c: Check, l: Lab, lang: Lang): { title: string; detail: string } {
  const v = c.v; const H = lang === 'hi';
  const rel = (x: unknown) => (x ? l.rel[x as Relation] ?? '–' : '–');
  switch (c.id) {
    case 'fullB': return H ? { title: 'पूरा नाम और भाग्यांक', detail: `उपनाम सहित नामांक ${v.n}, भाग्यांक ${v.b} से ${rel(v.rel)}।` } : { title: 'Full name and Bhagyank', detail: `Full name number ${v.n} is ${rel(v.rel).toLowerCase()} with Bhagyank ${v.b}.` };
    case 'firstB': return H ? { title: 'पहला नाम और भाग्यांक', detail: `पहले नाम का अंक ${v.n}, भाग्यांक ${v.b} से ${rel(v.rel)}।` } : { title: 'First name and Bhagyank', detail: `First name number ${v.n} is ${rel(v.rel).toLowerCase()} with Bhagyank ${v.b}.` };
    case 'moolank': return H ? { title: 'नाम और मूलांक', detail: `नामांक ${v.n}, मूलांक ${v.m} से ${rel(v.rel)}।` } : { title: 'Name and Moolank', detail: `Name number ${v.n} is ${rel(v.rel).toLowerCase()} with Moolank ${v.m}.` };
    case 'compound': return H ? { title: 'कंपाउंड अंक', detail: `${v.c} – ${l.cat[v.cat as CompoundCategory]}।` } : { title: 'Compound number', detail: `${v.c} is ${l.cat[v.cat as CompoundCategory].toLowerCase()}.` };
    case 'heavy': return H
      ? { title: 'भारी अंक 4 / 8', detail: c.status === 'pass' ? 'नाम का कुल 4 या 8 नहीं है (या यह बच्चे का अपना अंक है)।' : `नाम का कुल ${v.n} है – बच्चे के लिए भारी, जब तक जन्म अंक 4 या 8 न हो।` }
      : { title: 'Heavy totals 4 / 8', detail: c.status === 'pass' ? 'The name does not total 4 or 8 (or it is the child’s own number).' : `The name totals ${v.n} – heavy for a child unless 4 or 8 is in the birth numbers.` };
    case 'initial': return H ? { title: 'पहला अक्षर', detail: `${v.l} = ${v.n}, भाग्यांक से ${rel(v.rel)}।` } : { title: 'First letter', detail: `${v.l} = ${v.n}, ${rel(v.rel).toLowerCase()} with the Bhagyank.` };
    case 'soul': return H ? { title: 'सोल अर्ज (स्वर)', detail: `स्वरों का अंक ${v.n}, मूलांक ${v.m} से ${rel(v.rel)} – भीतर की इच्छाएँ स्वभाव से मेल खाती हैं या नहीं।` } : { title: 'Soul urge (vowels)', detail: `Vowel number ${v.n} is ${rel(v.rel).toLowerCase()} with Moolank ${v.m} – how inner wishes match nature.` };
    case 'grid': return H
      ? { title: 'लो शू ग्रिड', detail: v.none ? 'जन्म ग्रिड में कोई अंक अनुपस्थित नहीं है।' : v.fills ? `नामांक ${v.n} जन्म ग्रिड का अनुपस्थित अंक भरता है (${v.missing})।` : `अनुपस्थित अंक ${v.missing} – यह नाम उन्हें नहीं भरता।` }
      : { title: 'Lo Shu grid', detail: v.none ? 'No number is missing from the birth grid.' : v.fills ? `Name number ${v.n} fills a number missing from the birth grid (${v.missing}).` : `Missing numbers ${v.missing} – this name does not fill them.` };
    case 'family': return H ? { title: 'परिवार से तालमेल', detail: `पिता से ${rel(v.f)}, माता से ${rel(v.mo)}।` } : { title: 'Family harmony', detail: `With father: ${rel(v.f).toLowerCase()}, with mother: ${rel(v.mo).toLowerCase()}.` };
    case 'formalH': return H ? { title: 'औपचारिक नाम से तालमेल', detail: `निकनेम अंक ${v.n}, औपचारिक नाम ${v.name} (${v.f}) से ${rel(v.rel)}।` } : { title: 'Harmony with formal name', detail: `Nickname number ${v.n} is ${rel(v.rel).toLowerCase()} with the formal name ${v.name} (${v.f}).` };
  }
}
