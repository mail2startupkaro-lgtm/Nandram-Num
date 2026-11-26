/** Report wording (English / Hindi) for the Advanced Mobile Number Analysis report. Simple, plain language. */
import type { Relation } from '@/lib/numerology/data/relations';
import type { CompoundCategory } from '@/lib/numerology/data/tables';
import type { Advice, Check, DigitNote, Verdict } from './analysis';

export type Lang = 'en' | 'hi';

export const L = {
  en: {
    title: 'Advanced Mobile Number Analysis', sub: 'Mobile Number Numerology with Date of Birth', t1: 'Mobile Number', t2: 'Analysis Report',
    tag: 'Numerology  ·  Mobile Number  ·  Lo Shu Grid', preparedFor: 'Prepared for', by: 'Your numerologist', years: '15+ years of practice', conf: 'Personal and confidential',
    client: 'Client', dob: 'Date of birth', date: 'Report date', mobile: 'Mobile number', born: 'Born on', age: 'Age', py: 'Personal Year',
    summary: 'Summary of findings', score: 'Mobile score', inside: 'In this report', dear: (n: string) => `Dear ${n},`,
    moolank: 'Moolank', bhagyank: 'Bhagyank', total: 'Mobile total', last4: 'Last 4 digits', kua: 'Kua',
    barB: 'With Bhagyank', barM: 'With Moolank', barC: 'Compound total', barP: 'Digit pairs', barG: 'Grid support', barL: 'Last 4 digits',
    s1: 'Your birth numbers', s1d: 'Every mobile number is judged against the person who uses it. These are the numbers from your date of birth that the mobile number must support.',
    s2: 'Your mobile number decoded', s2d: 'All ten digits are added to get the compound total and then reduced to a single digit. Each digit is also linked to a planet.',
    s3: 'Digit pairs and patterns', s3d: 'Digits next to each other work as pairs. Friendly pairs help; heavy or clashing pairs create friction. Repeated digits, zeros and the ending also matter.',
    s4: 'Your Lo Shu grid with this number', s4d: 'Your mobile number adds its digits to your birth grid every day. Here is your grid before and after, and how each area of life changes.',
    s5: 'Score card and checklist', s5d: 'The score starts at 50 and moves up or down with each rule below. The same rules are used in every report I prepare.',
    s6: 'Your lucky number blueprint', s6d: 'Use these totals, digits and pairs when you choose a new number or compare numbers you have shortlisted.',
    s7: 'Remedies and activation', s7d: 'Simple steps to get the most from your number, and the best months to start using a new one.',
    s8: 'About your numerologist',
    planet: 'Planet', number: 'Number', value: 'Value', relation: 'Relation', nature: 'Nature', meaning: 'Meaning', digit: 'Digit', count: 'Times', inDob: 'In your DOB', note: 'Note', pos: 'Position', pair: 'Pair', effect: 'Effect',
    friendly: 'Numbers that suit you', neutralN: 'Neutral numbers', avoid: 'Numbers to keep away from', missing: 'Missing in your birth grid', repeatedN: 'Repeated in your birth grid', none: 'None',
    friend: 'Friendly', neutral: 'Neutral', enemy: 'Not friendly', favourable: 'Favourable', mixed: 'Mixed', unfavourable: 'Unfavourable',
    yes: 'Yes', no: 'No', digits: 'Digits', chain: 'Working', grid: 'Lo Shu grid', gridDob: 'From date of birth', gridMob: 'With mobile digits', filledNow: 'Filled by your number', stillMissing: 'Still missing',
    arrows: 'Arrows of strength now', areas: 'Life areas: before and after', area: 'Area', before: 'Before', after: 'After', change: 'Change',
    factor: 'Rule', points: 'Points', totalScore: 'Final score', checklist: 'Checklist', pass: 'Good', warn: 'Watch', fail: 'Problem',
    idealTotals: 'Best single totals', idealCompounds: 'Best compound totals', goodPairs: 'Helpful digit pairs', avoidDigits: 'Digits to use less', avoidPairs: 'Pairs to avoid', luckyDigits: 'Lucky digits',
    compareH: 'Numbers compared', compareD: 'Every number you sent was checked with the same rules. The highest score suits you best.', current: 'Current', best: 'Best choice', scoreH: 'Score', verdictH: 'Verdict', issues: 'Pair issues',
    invalid: 'Not checked (not a valid Indian mobile number)',
    howTo: 'How to choose a new number', howToList: ['Total of all 10 digits should be one of your best totals.', 'Prefer a favourable compound total from the list above.', 'Avoid the pairs 48, 84, 44, 88 and 00 anywhere in the number.', 'Not more than two zeros.', 'Let the last four digits add up to a friendly number.', 'If possible, include digits that are missing from your birth grid.'],
    adviceH: 'My advice', remediesH: 'Simple remedies', monthsH: 'Best months to activate a new number', monthsD: 'Months whose Personal Month number suits you are marked. Start a new SIM, or begin using it for important calls, in a marked month and on your lucky day.',
    month: 'Month', pm: 'Personal Month', goodM: 'Good to start',
    rem: {
      day: 'Activation day', dayD: (d: string, p: string) => `Start using a new SIM, or make your first important call, on a ${d} – the day of ${p}, the planet of your Bhagyank.`,
      colour: 'Phone cover and wallpaper', colourD: (c: string) => `Use these colours for the phone cover or wallpaper: ${c}.`,
      mantra: 'Mantra', mantraD: (m: string) => `Before an important call or deal, say once: ${m}.`,
      daan: 'Daan', daanD: (d: string, x: string) => `On a ${d}, donate: ${x}.`,
      grid: 'For still-missing numbers', gridD: (x: string) => `Numbers ${x} are still missing. Saving important contacts under names whose number gives these digits, or keeping a crystal for them, helps balance the grid.`,
      none: 'Use the number as it is', noneD: 'Your number is already strong. Keep it clean: avoid long gaps without recharge and do not share it carelessly.',
    },
    advice: {
      keep: 'Keep this number. It suits your date of birth well. Use the remedies only if you want an extra boost.',
      keepRemedies: 'You can keep this number, but use the remedies in this report. If you ever change or add a number, choose one with the blueprint on the earlier page.',
      change: 'This number does not support you well. I advise moving to a better number when you can – use the blueprint and start the new number in one of the marked months. Until then, keep the old number for less important use and follow the remedies.',
    } as Record<Advice, string>,
    verdict: { excellent: 'Highly lucky', good: 'Supportive', neutral: 'Neutral', change: 'Needs change' } as Record<Verdict, string>,
    headline: {
      excellent: 'Your mobile number is in strong harmony with your date of birth.',
      good: 'Your mobile number supports you, with a few points to watch.',
      neutral: 'Your mobile number is neither strongly helpful nor harmful.',
      change: 'Your mobile number is working against your birth numbers.',
    } as Record<Verdict, string>,
    letter: (x: { total: string; b: number; rel: string; score: number; good: number; bad: number; advice: string }) =>
      `I have checked your mobile number digit by digit against your date of birth. Its total is ${x.total} and it is ${x.rel} with your Bhagyank ${x.b}. Out of the ten rules I use, ${x.good} are in your favour and ${x.bad} need attention, giving a score of ${x.score} out of 100. ${x.advice}`,
    relWord: { friend: 'friendly', neutral: 'neutral', enemy: 'not friendly' } as Record<Relation, string>,
    lifeArea: { career: 'Career', money: 'Money', love: 'Love', health: 'Health', family: 'Family', spirituality: 'Spirituality' } as Record<string, string>,
    breakdown: { base: 'Starting score', bhagyankRelation: 'Total with Bhagyank', moolankRelation: 'Total with Moolank', compound: 'Compound total', heavy48: 'Total 4 / 8', maleficPairs: 'Heavy or clashing pairs', zeros: 'Extra zeros', repeatedEnemyDigits: 'Repeated unfriendly digits', missingFilled: 'Missing numbers filled', last4: 'Last 4 digits' } as Record<string, string>,
    services: 'Other ways I can help you', servicesD: 'If you would like to go further, these readings work well with your mobile number report.',
    contact: 'Book or ask a question', whatsapp: 'WhatsApp', telegram: 'Telegram', website: 'Website', scanWa: 'Scan to chat on WhatsApp', scanWeb: 'Scan to see all services',
    ctaH: 'Want a number chosen for you?', ctaD: 'Send me up to 5 numbers you can get, or ask me to find patterns for you. I will check each one personally and tell you which to take.',
    expertNote: 'Note from your numerologist',
    closing: 'A number is a tool. Used with the right timing and effort, it supports everything you do.',
    disclaimer: 'Mobile number numerology gives guidance based on the traditions of Vedic, Chaldean and Lo Shu numerology. It is not medical, legal or financial advice. Results depend on your own effort and circumstances, and no outcome is guaranteed. Change a number linked to your bank, Aadhaar or business only after updating it everywhere.',
    madeLine: (by: string) => `Prepared by ${by} from your mobile number and date of birth`,
    bioDefault: (name: string) => `${name} has practised numerology for more than 15 years, working with the Vedic, Chaldean and Lo Shu systems. He reads names, dates of birth, mobile numbers and signatures for individuals, families and business owners, and every report is checked by him before it is sent. He also holds regular live sessions on YouTube where viewers can have their mobile numbers read.`,
    bioOther: (name: string) => `This report was prepared and checked by ${name}.`,
    whyMobile: 'Get up to 5 shortlisted numbers checked and the best one chosen for you.',
    whyName: (n: number) => `Make your name number match your Bhagyank ${n} as well as your mobile number does.`,
    whyYear: (n: number) => `You are in Personal Year ${n} – see what the next 3 years hold.`,
  },
  hi: {
    title: 'एडवांस मोबाइल नंबर विश्लेषण', sub: 'जन्म तिथि के साथ मोबाइल नंबर अंक ज्योतिष', t1: 'मोबाइल नंबर', t2: 'विश्लेषण रिपोर्ट',
    tag: 'अंक ज्योतिष  ·  मोबाइल नंबर  ·  लो शू ग्रिड', preparedFor: 'के लिए तैयार', by: 'आपके अंक ज्योतिषी', years: '15+ वर्षों का अनुभव', conf: 'व्यक्तिगत एवं गोपनीय',
    client: 'नाम', dob: 'जन्म तिथि', date: 'रिपोर्ट तिथि', mobile: 'मोबाइल नंबर', born: 'जन्म का दिन', age: 'आयु', py: 'व्यक्तिगत वर्ष',
    summary: 'मुख्य निष्कर्ष', score: 'मोबाइल स्कोर', inside: 'इस रिपोर्ट में', dear: (n: string) => `प्रिय ${n},`,
    moolank: 'मूलांक', bhagyank: 'भाग्यांक', total: 'मोबाइल योग', last4: 'अंतिम 4 अंक', kua: 'कुआ',
    barB: 'भाग्यांक से', barM: 'मूलांक से', barC: 'कंपाउंड योग', barP: 'अंक-जोड़ियाँ', barG: 'ग्रिड सहयोग', barL: 'अंतिम 4 अंक',
    s1: 'आपके जन्म के अंक', s1d: 'हर मोबाइल नंबर को उसे इस्तेमाल करने वाले व्यक्ति के अनुसार परखा जाता है। ये आपकी जन्म तिथि के वे अंक हैं जिनका साथ मोबाइल नंबर को देना चाहिए।',
    s2: 'आपके मोबाइल नंबर की गणना', s2d: 'सभी दस अंकों को जोड़कर कंपाउंड योग निकाला जाता है, फिर उसे एक अंक तक घटाया जाता है। हर अंक एक ग्रह से जुड़ा है।',
    s3: 'अंक-जोड़ियाँ और पैटर्न', s3d: 'साथ-साथ आने वाले अंक जोड़ी की तरह काम करते हैं। मित्र जोड़ियाँ मदद करती हैं; भारी या टकराने वाली जोड़ियाँ रुकावट लाती हैं। दोहराए अंक, शून्य और अंत भी मायने रखते हैं।',
    s4: 'इस नंबर के साथ आपका लो शू ग्रिड', s4d: 'आपका मोबाइल नंबर हर दिन अपने अंक आपके जन्म ग्रिड में जोड़ता है। यहाँ पहले और बाद का ग्रिड और जीवन के हर क्षेत्र पर असर दिया गया है।',
    s5: 'स्कोर कार्ड और जाँच-सूची', s5d: 'स्कोर 50 से शुरू होता है और नीचे दिए हर नियम से ऊपर या नीचे जाता है। मैं हर रिपोर्ट में यही नियम इस्तेमाल करता हूँ।',
    s6: 'आपका शुभ नंबर ब्लूप्रिंट', s6d: 'नया नंबर चुनते समय या चुने हुए नंबरों की तुलना करते समय इन योगों, अंकों और जोड़ियों का उपयोग करें।',
    s7: 'उपाय और शुरुआत', s7d: 'अपने नंबर से अधिकतम लाभ के आसान कदम, और नया नंबर शुरू करने के सबसे अच्छे महीने।',
    s8: 'आपके अंक ज्योतिषी',
    planet: 'ग्रह', number: 'अंक', value: 'मान', relation: 'संबंध', nature: 'स्वभाव', meaning: 'अर्थ', digit: 'अंक', count: 'बार', inDob: 'जन्म तिथि में', note: 'टिप्पणी', pos: 'स्थान', pair: 'जोड़ी', effect: 'असर',
    friendly: 'आपके अनुकूल अंक', neutralN: 'सम अंक', avoid: 'जिन अंकों से बचें', missing: 'जन्म ग्रिड में अनुपस्थित', repeatedN: 'जन्म ग्रिड में दोहराए', none: 'कोई नहीं',
    friend: 'मित्र', neutral: 'सम', enemy: 'शत्रु', favourable: 'शुभ', mixed: 'मिश्रित', unfavourable: 'अशुभ',
    yes: 'हाँ', no: 'नहीं', digits: 'अंक', chain: 'गणना', grid: 'लो शू ग्रिड', gridDob: 'जन्म तिथि से', gridMob: 'मोबाइल अंकों के साथ', filledNow: 'आपके नंबर से पूरे हुए', stillMissing: 'अभी भी अनुपस्थित',
    arrows: 'अब शक्ति के तीर', areas: 'जीवन के क्षेत्र: पहले और बाद', area: 'क्षेत्र', before: 'पहले', after: 'बाद में', change: 'बदलाव',
    factor: 'नियम', points: 'अंक', totalScore: 'अंतिम स्कोर', checklist: 'जाँच-सूची', pass: 'अच्छा', warn: 'ध्यान दें', fail: 'समस्या',
    idealTotals: 'सबसे अच्छे एकल योग', idealCompounds: 'सबसे अच्छे कंपाउंड योग', goodPairs: 'सहायक अंक-जोड़ियाँ', avoidDigits: 'कम इस्तेमाल करें', avoidPairs: 'बचने योग्य जोड़ियाँ', luckyDigits: 'शुभ अंक',
    compareH: 'नंबरों की तुलना', compareD: 'आपके भेजे हर नंबर को इन्हीं नियमों से जाँचा गया है। सबसे ज़्यादा स्कोर वाला नंबर आपके लिए सबसे अच्छा है।', current: 'वर्तमान', best: 'सबसे अच्छा', scoreH: 'स्कोर', verdictH: 'निर्णय', issues: 'जोड़ी दोष',
    invalid: 'जाँचे नहीं गए (मान्य भारतीय मोबाइल नंबर नहीं)',
    howTo: 'नया नंबर कैसे चुनें', howToList: ['सभी 10 अंकों का योग आपके सबसे अच्छे योगों में से हो।', 'ऊपर की सूची से शुभ कंपाउंड योग को प्राथमिकता दें।', 'नंबर में कहीं भी 48, 84, 44, 88 और 00 न हों।', 'दो से ज़्यादा शून्य न हों।', 'अंतिम चार अंकों का योग मित्र अंक हो।', 'हो सके तो जन्म ग्रिड में अनुपस्थित अंक शामिल करें।'],
    adviceH: 'मेरी सलाह', remediesH: 'आसान उपाय', monthsH: 'नया नंबर शुरू करने के सबसे अच्छे महीने', monthsD: 'जिन महीनों का व्यक्तिगत मास अंक आपके अनुकूल है, वे चिह्नित हैं। नई सिम चिह्नित महीने में और अपने शुभ दिन पर शुरू करें।',
    month: 'महीना', pm: 'व्यक्तिगत मास', goodM: 'शुरुआत के लिए अच्छा',
    rem: {
      day: 'शुरुआत का दिन', dayD: (d: string, p: string) => `नई सिम का उपयोग या पहली ज़रूरी कॉल ${d} को शुरू करें – यह आपके भाग्यांक के ग्रह ${p} का दिन है।`,
      colour: 'फ़ोन कवर और वॉलपेपर', colourD: (c: string) => `फ़ोन कवर या वॉलपेपर के लिए ये रंग लें: ${c}।`,
      mantra: 'मंत्र', mantraD: (m: string) => `किसी ज़रूरी कॉल या सौदे से पहले एक बार बोलें: ${m}।`,
      daan: 'दान', daanD: (d: string, x: string) => `${d} को दान करें: ${x}।`,
      grid: 'अभी भी अनुपस्थित अंकों के लिए', gridD: (x: string) => `अंक ${x} अभी भी अनुपस्थित हैं। इन अंकों के लिए क्रिस्टल रखना या ज़रूरी संपर्कों को ऐसे नामों से सहेजना जिनका अंक ये हो, ग्रिड को संतुलित करता है।`,
      none: 'नंबर को वैसे ही रखें', noneD: 'आपका नंबर पहले से मज़बूत है। इसे साफ़ रखें: लंबे समय तक बिना रिचार्ज न छोड़ें और लापरवाही से साझा न करें।',
    },
    advice: {
      keep: 'यह नंबर रखें। यह आपकी जन्म तिथि के बहुत अनुकूल है। अतिरिक्त लाभ चाहें तो ही उपाय करें।',
      keepRemedies: 'आप यह नंबर रख सकते हैं, पर इस रिपोर्ट के उपाय अपनाएँ। कभी नंबर बदलें या नया लें, तो पिछले पृष्ठ के ब्लूप्रिंट से चुनें।',
      change: 'यह नंबर आपका अच्छा साथ नहीं देता। जब संभव हो, बेहतर नंबर पर जाएँ – ब्लूप्रिंट का उपयोग करें और नया नंबर चिह्नित महीने में शुरू करें। तब तक पुराने नंबर को कम ज़रूरी कामों के लिए रखें और उपाय करें।',
    } as Record<Advice, string>,
    verdict: { excellent: 'अत्यंत शुभ', good: 'सहायक', neutral: 'सामान्य', change: 'बदलाव ज़रूरी' } as Record<Verdict, string>,
    headline: {
      excellent: 'आपका मोबाइल नंबर आपकी जन्म तिथि से बहुत अच्छा मेल खाता है।',
      good: 'आपका मोबाइल नंबर आपका साथ देता है, कुछ बातों पर ध्यान देना है।',
      neutral: 'आपका मोबाइल नंबर न बहुत सहायक है, न हानिकारक।',
      change: 'आपका मोबाइल नंबर आपके जन्म अंकों के विरुद्ध काम कर रहा है।',
    } as Record<Verdict, string>,
    letter: (x: { total: string; b: number; rel: string; score: number; good: number; bad: number; advice: string }) =>
      `मैंने आपके मोबाइल नंबर का हर अंक आपकी जन्म तिथि से मिलाकर जाँचा है। इसका योग ${x.total} है और यह आपके भाग्यांक ${x.b} का ${x.rel} है। मेरे दस नियमों में से ${x.good} आपके पक्ष में हैं और ${x.bad} पर ध्यान देना है, इसलिए स्कोर 100 में से ${x.score} है। ${x.advice}`,
    relWord: { friend: 'मित्र', neutral: 'सम', enemy: 'शत्रु' } as Record<Relation, string>,
    lifeArea: { career: 'करियर', money: 'धन', love: 'प्रेम', health: 'स्वास्थ्य', family: 'परिवार', spirituality: 'आध्यात्म' } as Record<string, string>,
    breakdown: { base: 'शुरुआती स्कोर', bhagyankRelation: 'भाग्यांक से योग', moolankRelation: 'मूलांक से योग', compound: 'कंपाउंड योग', heavy48: 'योग 4 / 8', maleficPairs: 'भारी या टकराने वाली जोड़ियाँ', zeros: 'अतिरिक्त शून्य', repeatedEnemyDigits: 'दोहराए शत्रु अंक', missingFilled: 'अनुपस्थित अंक पूरे', last4: 'अंतिम 4 अंक' } as Record<string, string>,
    services: 'मैं और कैसे मदद कर सकता हूँ', servicesD: 'अगर आप और आगे जानना चाहें, तो ये सेवाएँ आपकी मोबाइल नंबर रिपोर्ट के साथ अच्छी तरह काम करती हैं।',
    contact: 'बुक करें या सवाल पूछें', whatsapp: 'व्हाट्सऐप', telegram: 'टेलीग्राम', website: 'वेबसाइट', scanWa: 'व्हाट्सऐप पर बात करने के लिए स्कैन करें', scanWeb: 'सभी सेवाएँ देखने के लिए स्कैन करें',
    ctaH: 'क्या आप चाहते हैं कि नंबर आपके लिए चुना जाए?', ctaD: 'जो नंबर आपको मिल सकते हैं उनमें से अधिकतम 5 भेजें, या मुझसे पैटर्न ढूँढने को कहें। मैं हर नंबर स्वयं जाँचकर बताऊँगा कि कौन-सा लें।',
    expertNote: 'आपके अंक ज्योतिषी की टिप्पणी',
    closing: 'नंबर एक साधन है। सही समय और मेहनत के साथ यह आपके हर काम में साथ देता है।',
    disclaimer: 'मोबाइल नंबर अंक ज्योतिष वैदिक, कैल्डियन और लो शू अंक ज्योतिष की परंपराओं पर आधारित मार्गदर्शन है। यह चिकित्सा, कानूनी या वित्तीय सलाह नहीं है। परिणाम आपके प्रयास और परिस्थितियों पर निर्भर करते हैं; किसी परिणाम की गारंटी नहीं है। बैंक, आधार या व्यापार से जुड़ा नंबर हर जगह अपडेट करने के बाद ही बदलें।',
    madeLine: (by: string) => `${by} द्वारा आपके मोबाइल नंबर और जन्म तिथि से तैयार`,
    bioDefault: (name: string) => `${name} 15 वर्षों से अधिक समय से अंक ज्योतिष का अभ्यास कर रहे हैं और वैदिक, कैल्डियन तथा लो शू पद्धतियों से काम करते हैं। वे व्यक्तियों, परिवारों और व्यापारियों के लिए नाम, जन्म तिथि, मोबाइल नंबर और हस्ताक्षर का विश्लेषण करते हैं, और हर रिपोर्ट भेजने से पहले स्वयं जाँचते हैं। वे यूट्यूब पर नियमित लाइव सत्र भी करते हैं, जहाँ दर्शक अपने मोबाइल नंबर की जाँच करवा सकते हैं।`,
    bioOther: (name: string) => `यह रिपोर्ट ${name} द्वारा तैयार और जाँची गई है।`,
    whyMobile: 'अपने चुने हुए अधिकतम 5 नंबर जँचवाएँ और सबसे अच्छा नंबर पाएँ।',
    whyName: (n: number) => `अपना नामांक भी भाग्यांक ${n} के अनुकूल बनाएँ।`,
    whyYear: (n: number) => `आप व्यक्तिगत वर्ष ${n} में हैं – जानें अगले 3 वर्ष क्या लाएँगे।`,
  },
};
export type Lab = (typeof L)['en'];

/** What the single-digit mobile total means in daily life. */
export const TOTAL_MEANING: Record<Lang, Record<number, string>> = {
  en: {
    1: 'Sun energy: confidence, leadership and recognition. Good for people who lead, run a business or deal with government.',
    2: 'Moon energy: calm, caring and good for partnerships. Can make the user emotional or indecisive if the rest of the chart is weak.',
    3: 'Jupiter energy: wisdom, respect and growth. Good for teachers, advisers, finance and family life.',
    4: 'Rahu energy: hard work and sudden events. Often brings delays and surprises unless 4 is your own number.',
    5: 'Mercury energy: communication, sales and quick money. One of the best totals for business and networking.',
    6: 'Venus energy: comfort, love, beauty and luxury. Good for family life, arts, hospitality and customer work.',
    7: 'Ketu energy: research, intuition and spirituality. Calls may feel unsettled; less suited to sales.',
    8: 'Saturn energy: discipline and slow, steady results. Heavy for most people; suits only those with 8 in their chart.',
    9: 'Mars energy: courage, action and drive. Good for sports, defence, property and medicine; watch anger.',
  },
  hi: {
    1: 'सूर्य की ऊर्जा: आत्मविश्वास, नेतृत्व और पहचान। नेतृत्व करने वालों, व्यापारियों और सरकारी काम वालों के लिए अच्छा।',
    2: 'चंद्र की ऊर्जा: शांति, देखभाल और साझेदारी। बाकी चार्ट कमज़ोर हो तो भावुकता और अनिर्णय ला सकती है।',
    3: 'गुरु की ऊर्जा: ज्ञान, सम्मान और विकास। शिक्षकों, सलाहकारों, वित्त और पारिवारिक जीवन के लिए अच्छा।',
    4: 'राहु की ऊर्जा: मेहनत और अचानक घटनाएँ। जब तक 4 आपका अपना अंक न हो, देरी और आश्चर्य लाती है।',
    5: 'बुध की ऊर्जा: बातचीत, बिक्री और जल्दी धन। व्यापार और संपर्क के लिए सबसे अच्छे योगों में से एक।',
    6: 'शुक्र की ऊर्जा: सुख, प्रेम, सुंदरता और ऐश्वर्य। परिवार, कला, आतिथ्य और ग्राहक सेवा के लिए अच्छा।',
    7: 'केतु की ऊर्जा: शोध, अंतर्ज्ञान और आध्यात्म। कॉल अस्थिर लग सकती हैं; बिक्री के लिए कम उपयुक्त।',
    8: 'शनि की ऊर्जा: अनुशासन और धीमे, स्थिर परिणाम। अधिकतर लोगों के लिए भारी; केवल जिनके चार्ट में 8 हो उनके लिए ठीक।',
    9: 'मंगल की ऊर्जा: साहस, कर्म और जोश। खेल, रक्षा, प्रॉपर्टी और चिकित्सा के लिए अच्छा; क्रोध पर ध्यान दें।',
  },
};

export function relText(r: Relation | null | undefined, l: Lab) { return r === 'friend' ? l.friend : r === 'enemy' ? l.enemy : l.neutral; }
export function catText(c: CompoundCategory, l: Lab) { return c === 'favourable' ? l.favourable : c === 'unfavourable' ? l.unfavourable : l.mixed; }

export function digitNoteText(n: DigitNote, d: number, count: number, lang: Lang): string {
  const hi = lang === 'hi';
  switch (n) {
    case 'fills': return hi ? `आपके जन्म ग्रिड का अनुपस्थित अंक ${d} पूरा करता है` : `Fills the missing ${d} in your birth grid`;
    case 'repeat': return hi ? `${count} बार – ग्रह का असर बहुत बढ़ जाता है` : `${count} times – the planet becomes very strong`;
    case 'enemyRepeat': return hi ? `${count} बार और भाग्यांक का शत्रु – कम करना अच्छा` : `${count} times and unfriendly to your Bhagyank – better reduced`;
    case 'zeros': return hi ? `${count} शून्य – आसपास के अंकों को कमज़ोर करते हैं` : `${count} zeros – they weaken the digits around them`;
    case 'enemy': return hi ? 'भाग्यांक का शत्रु अंक' : 'Unfriendly to your Bhagyank';
    case 'absent': return '–';
    default: return hi ? 'सामान्य' : 'Normal';
  }
}

export function pairEffect(p: { kind: string; a: number; b: number; planetA: string; planetB: string; hasZero: boolean; same: boolean }, lang: Lang, T: (s: string) => string): string {
  const A = T(p.planetA), B = T(p.planetB), hi = lang === 'hi';
  if (p.kind === 'malefic') return p.a === 0 ? (hi ? 'दोहरा शून्य – ऊर्जा रुक जाती है और मेहनत का फल देर से मिलता है।' : 'Double zero – energy gets stuck and effort pays late.')
    : hi ? `भारी जोड़ी (${A}–${B}): देरी, तनाव और अचानक रुकावटों से जुड़ी।` : `Heavy pair (${A}–${B}): linked with delays, stress and sudden obstacles.`;
  if (p.kind === 'conflict') return hi ? `${A} और ${B} में मेल नहीं: इन ग्रहों के क्षेत्रों में टकराव ला सकती है।` : `${A} and ${B} do not get along: can bring friction in the areas they rule.`;
  if (p.kind === 'supportive') return p.same ? (hi ? `दोहरा ${A}: इस ग्रह के गुण दुगने।` : `Double ${A}: this planet's qualities are doubled.`) : hi ? `${A} और ${B} मित्र: सहज और सहायक ऊर्जा।` : `${A} and ${B} are friends: smooth, supportive energy.`;
  if (p.hasZero) { const x = p.a === 0 ? B : A; return hi ? `शून्य ${x} की ऊर्जा को थोड़ा धीमा करता है।` : `The zero softens ${x}'s energy a little.`; }
  if (p.same) return hi ? `दोहरा ${A}: इस ग्रह का असर बढ़ता है।` : `Double ${A}: this planet's effect grows.`;
  return hi ? `मिश्रित जोड़ी (${A}–${B}): न ज़्यादा मदद, न नुकसान।` : `Mixed pair (${A}–${B}): neither helps nor harms much.`;
}

export function checkText(c: Check, l: Lab, lang: Lang): { title: string; detail: string } {
  const hi = lang === 'hi', v = c.v, r = (x: unknown) => relText(x as Relation, l);
  const catW = (x: unknown) => catText(x as CompoundCategory, l);
  switch (c.id) {
    case 'totalB': return { title: hi ? 'योग और भाग्यांक' : 'Total with Bhagyank', detail: hi ? `योग ${v.total}, भाग्यांक ${v.b} का ${r(v.rel)} है।` : `Total ${v.total} is ${r(v.rel).toLowerCase()} with your Bhagyank ${v.b}.` };
    case 'totalM': return { title: hi ? 'योग और मूलांक' : 'Total with Moolank', detail: hi ? `योग ${v.total}, मूलांक ${v.m} का ${r(v.rel)} है।` : `Total ${v.total} is ${r(v.rel).toLowerCase()} with your Moolank ${v.m}.` };
    case 'compound': return { title: hi ? 'कंपाउंड योग' : 'Compound total', detail: hi ? `कंपाउंड ${v.compound} ${catW(v.cat)} है।` : `Compound ${v.compound} is ${catW(v.cat).toLowerCase()}.` };
    case 'heavy48': return { title: hi ? 'योग 4 या 8 नहीं' : 'Total is not 4 or 8', detail: c.status === 'pass' ? (hi ? 'योग भारी अंक 4 या 8 नहीं है, या ये आपके अपने अंक हैं।' : 'The total is not the heavy 4 or 8, or it is your own number.') : (hi ? `योग ${v.total} है, जो आपके लिए भारी है।` : `The total is ${v.total}, which is heavy for you.`) };
    case 'malefic': return { title: hi ? 'भारी / टकराने वाली जोड़ियाँ' : 'Heavy or clashing pairs', detail: c.status === 'pass' ? (hi ? 'कोई भारी या टकराने वाली जोड़ी नहीं।' : 'No heavy or clashing pairs.') : [v.malefic ? (hi ? `भारी: ${v.malefic}` : `Heavy: ${v.malefic}`) : '', v.conflict ? (hi ? `टकराव: ${v.conflict}` : `Clashing: ${v.conflict}`) : ''].filter(Boolean).join(' · ') };
    case 'zeros': return { title: hi ? 'शून्य की संख्या' : 'Number of zeros', detail: hi ? `${v.n} शून्य (दो तक ठीक)।` : `${v.n} zero${v.n === 1 ? '' : 's'} (up to two is fine).` };
    case 'repeat': return { title: hi ? 'दोहराए अंक' : 'Repeated digits', detail: c.status === 'pass' ? (hi ? 'कोई अंक तीन या अधिक बार नहीं।' : 'No digit appears three or more times.') : hi ? `तीन या अधिक बार: ${v.digits}` : `Three or more times: ${v.digits}` };
    case 'fills': return { title: hi ? 'अनुपस्थित अंक पूरे' : 'Missing numbers filled', detail: v.none ? (hi ? 'आपके जन्म ग्रिड में कोई अंक अनुपस्थित नहीं।' : 'No numbers are missing in your birth grid.') : v.filled ? (hi ? `पूरे हुए: ${v.filled} (अनुपस्थित थे: ${v.missing})` : `Filled: ${v.filled} (missing were: ${v.missing})`) : (hi ? `अनुपस्थित ${v.missing} में से कोई पूरा नहीं।` : `None of the missing ${v.missing} are filled.`) };
    case 'last4': return { title: hi ? 'अंतिम 4 अंक' : 'Last 4 digits', detail: hi ? `${v.digits} → ${v.total}, भाग्यांक का ${r(v.rel)}।` : `${v.digits} → ${v.total}, ${r(v.rel).toLowerCase()} with your Bhagyank.` };
    case 'lastDigit': return { title: hi ? 'अंतिम अंक' : 'Last digit', detail: v.rel === 'zero' ? (hi ? 'नंबर 0 पर समाप्त होता है – अंत कमज़ोर।' : 'The number ends in 0 – a weak ending.') : hi ? `अंतिम अंक ${v.d}, भाग्यांक का ${r(v.rel)}।` : `Ends in ${v.d}, ${r(v.rel).toLowerCase()} with your Bhagyank.` };
    default: return { title: c.id, detail: '' };
  }
}
