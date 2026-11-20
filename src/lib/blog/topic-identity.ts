/**
 * House number (9), mobile number total (9), Chaldean name number (9) and Kua number (8) articles, English + Hindi.
 * Rules (friendship table, malefic pairs, compound categories, Kua directions) come from the engine data.
 */
import { analyseNameSystem } from '@/lib/numerology/modules/name';
import { kuaNumber } from '@/lib/numerology/modules/dob';
import { planetOf } from '@/lib/numerology/data/planets';
import { relationOf } from '@/lib/numerology/data/relations';
import { CHALDEAN, HARD_MALEFIC_PAIRS, KUA_DIRECTIONS, compoundCategory } from '@/lib/numerology/data/tables';
import { LOSHU_NUMBER_INFO } from '@/lib/numerology/data/grids';
import { IDENTIFIER_MEANINGS } from '@/lib/numerology/data/identifier-meanings';
import { NUMBER_TRAITS } from '@/lib/i18n/numberMeanings';
import { KUA_MEANING_HI } from '@/lib/i18n/kua-hi';
import { tr } from '@/lib/i18n/hi-terms';
import { DISCLAIM, NUMS, calcLink, calcSection, clip, digitSum, fig, finish, list, p, red, sec, serviceLink, steps, table, tip, type Lang, type TopicPost, type TopicRef } from './topic-kit';
import type { Section } from './generate';

const PL_HI = ['सूर्य', 'चंद्र', 'गुरु', 'राहु', 'बुध', 'शुक्र', 'केतु', 'शनि', 'मंगल'];
const pl = (lang: Lang, n: number) => (lang === 'hi' ? PL_HI[n - 1] : planetOf(n).name);
const friendsOf = (n: number) => NUMS.filter((m) => relationOf(m, n) === 'friend');
const enemiesOf = (n: number) => NUMS.filter((m) => relationOf(m, n) === 'enemy');
const faqSec = (lang: Lang) => sec('faq', lang === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions', [p(DISCLAIM[lang])]);

/* ═════════════════════════ House number ═════════════════════════ */

const HOUSE_BEST: Record<Lang, Record<number, string>> = {
  en: { 1: 'entrepreneurs, single professionals and anyone starting a new chapter', 2: 'newly married couples, artists and people who value peace', 3: 'teachers, students, writers and growing families', 4: 'hard-working people building savings, and those in technical fields', 5: 'traders, sales people, travellers and social families', 6: 'families, artists, home-makers and people in hospitality or beauty', 7: 'researchers, spiritual seekers, writers and retired people', 8: 'business owners and people building long-term wealth with discipline', 9: 'energetic families, sports people, doctors and those in service' },
  hi: { 1: 'उद्यमी, अकेले रहने वाले पेशेवर और जीवन का नया अध्याय शुरू करने वाले', 2: 'नवविवाहित दंपति, कलाकार और शांति पसंद लोग', 3: 'शिक्षक, विद्यार्थी, लेखक और बढ़ते परिवार', 4: 'बचत बनाने वाले मेहनती लोग और तकनीकी क्षेत्र के लोग', 5: 'व्यापारी, सेल्स से जुड़े लोग, यात्री और मिलनसार परिवार', 6: 'परिवार, कलाकार, गृहिणियाँ और आतिथ्य या सौंदर्य क्षेत्र के लोग', 7: 'शोधकर्ता, साधक, लेखक और सेवानिवृत्त लोग', 8: 'व्यवसायी और अनुशासन से लंबी अवधि का धन बनाने वाले', 9: 'ऊर्जावान परिवार, खिलाड़ी, डॉक्टर और सेवा क्षेत्र के लोग' },
};
const HOUSE_EX: Record<number, string> = { 1: '505', 2: 'B-9', 3: '201', 4: '13', 5: '302', 6: '24', 7: 'A-6', 8: '404', 9: '702' };
const houseTotal = (s: string) => red(s.toUpperCase().split('').reduce((a, ch) => a + (/\d/.test(ch) ? Number(ch) : CHALDEAN[ch] ?? 0), 0));
export const houseSlug = (n: number) => `house-number-${n}-numerology-meaning-remedies`;

function buildHouse(n: number, lang: Lang): TopicPost {
  const hi = lang === 'hi', P = planetOf(n), info = LOSHU_NUMBER_INFO[n], T = (s: string) => tr(lang, s);
  const ex = HOUSE_EX[n];
  if (houseTotal(ex) !== n) throw new Error(`house example ${ex} ≠ ${n}`);
  const exSteps = ex.toUpperCase().split('').filter((c) => /[A-Z0-9]/.test(c)).map((c) => (/\d/.test(c) ? c : `${c}(${CHALDEAN[c]})`)).join(' + ');
  const fr = friendsOf(n), en = enemiesOf(n);
  const sections: Section[] = [
    sec('meaning', hi ? `मकान नंबर ${n} का अर्थ` : `Meaning of House Number ${n}`, [
      p(IDENTIFIER_MEANINGS[lang][n].house),
      p(hi ? `मकान नंबर ${n} के स्वामी ${pl(lang, n)} हैं और इसका मुख्य गुण "${NUMBER_TRAITS.hi[n].keyword}" है। ऐसे घर का वातावरण ${NUMBER_TRAITS.hi[n].plus} जैसे गुणों को बढ़ाता है, पर ध्यान न रखें तो ${NUMBER_TRAITS.hi[n].minus} जैसी प्रवृत्तियाँ भी दिख सकती हैं।` : `House number ${n} is ruled by ${P.name} and its key quality is ${NUMBER_TRAITS.en[n].keyword.toLowerCase()}. The atmosphere of such a home encourages qualities like ${NUMBER_TRAITS.en[n].plus.toLowerCase()}, but without care it can also show ${NUMBER_TRAITS.en[n].minus.toLowerCase()}.`),
      fig({ t: 'house', n }, hi ? `मकान नंबर ${n} – ${pl(lang, n)} का घर` : `House number ${n} – a home of ${P.name}`),
    ], true),
    sec('calculate', hi ? 'मकान नंबर कैसे निकालें' : 'How to Calculate Your House Number', [
      p(hi ? 'अपने दरवाज़े पर लिखे नंबर के सभी अंक जोड़ें। अक्षर हो तो उसका कैल्डियन मान जोड़ें। फ़्लैट में रहते हैं तो इमारत का नहीं, अपने फ़्लैट का नंबर लें।' : 'Add all digits of the number on your door. If there is a letter, add its Chaldean value. In an apartment, use your own flat number, not the building number.'),
      steps([{ title: ex, text: `${exSteps} = ${ex.toUpperCase().split('').reduce((a, c) => a + (/\d/.test(c) ? Number(c) : CHALDEAN[c] ?? 0), 0)} → ${n}` }]),
    ]),
    sec('suits', hi ? `मकान नंबर ${n} किसके लिए शुभ है` : `Who House Number ${n} Suits`, [
      p(hi ? `सबसे अधिक अनुकूल: ${HOUSE_BEST.hi[n]}।` : `Best suited for ${HOUSE_BEST.en[n]}.`),
      table(hi ? ['आपका मूलांक/भाग्यांक', `मकान ${n} से संबंध`] : ['Your Mulank / Bhagyank', `Relation with house ${n}`], [
        [fr.join(', '), hi ? 'मित्र – घर आपका साथ देता है' : 'Friendly – the home supports you'],
        [NUMS.filter((m) => !fr.includes(m) && !en.includes(m)).join(', ') || '—', hi ? 'सम – सामान्य, उपायों से बेहतर' : 'Neutral – fine, better with remedies'],
        [en.join(', ') || '—', hi ? 'चुनौतीपूर्ण – संतुलन के उपाय करें' : 'Challenging – use balancing remedies'],
      ]),
      p(hi ? 'एक ही घर किसी के लिए अच्छा और किसी के लिए सामान्य हो सकता है। परिवार के मुखिया और कमाने वाले सदस्य के मूलांक व भाग्यांक को सबसे अधिक महत्व दें।' : 'The same home can be excellent for one person and ordinary for another. Give most weight to the Mulank and Bhagyank of the head of the family and the main earning member.'),
    ]),
    sec('remedies', hi ? `मकान नंबर ${n} के उपाय` : `Remedies for House Number ${n}`, [
      list(hi ? [
        `${pl(lang, n)} की दिशा मज़बूत करें: ${T(info.placement)}।`,
        `सजावट में ${P.colours.slice(0, 2).map(T).join(' और ')} रंग का संतुलित उपयोग करें।`,
        `${T(P.weekday)} को घर में दीपक जलाएँ और ${T(P.deity)} का स्मरण करें।`,
        'नंबर अनुकूल न हो तो दरवाज़े के भीतर की ओर एक छोटा अक्षर या अंक जोड़कर योग को मित्र अंक में बदला जा सकता है – विशेषज्ञ से सही अक्षर पूछें।',
        'प्रवेश द्वार साफ़, रोशन और अव्यवस्था-रहित रखें; टूटी नेमप्लेट तुरंत बदलें।',
      ] : [
        `Strengthen the direction of ${P.name}: ${info.placement}.`,
        `Use ${P.colours.slice(0, 2).join(' and ').toLowerCase()} in a balanced way in décor.`,
        `Light a lamp at home on ${P.weekday}s and remember ${P.deity}.`,
        'If the number does not suit you, a small letter or number added on the inner side of the door can change the total to a friendly number – ask an expert which one.',
        'Keep the entrance clean, bright and clutter-free; replace a broken name plate at once.',
      ]),
      tip(hi ? 'घर बदलना अंतिम विकल्प है। मेरे अनुभव में अधिकतर परिवारों के लिए नेमप्लेट, रंग और प्रवेश-द्वार की व्यवस्था से ही घर की ऊर्जा अनुकूल हो जाती है।' : 'Moving house is the last option. In my experience, for most families the name plate, colours and entrance arrangement are enough to make a home’s energy supportive.'),
    ], true),
    calcSection(lang, ['house', 'moolank', 'bhagyank', 'vehicle']),
    faqSec(lang),
  ];
  const faqs = hi ? [
    { q: `क्या मकान नंबर ${n} शुभ है?`, a: `मकान ${n} उन लोगों के लिए विशेष शुभ है जिनका मूलांक या भाग्यांक ${fr.join(', ')} है।` },
    { q: 'फ़्लैट नंबर B-702 जैसा हो तो कैसे गिनें?', a: 'अक्षर का कैल्डियन मान और सभी अंक जोड़ें: B(2) + 7 + 0 + 2 = 11 → 2।' },
    { q: 'क्या इमारत या सोसाइटी का नंबर भी देखना चाहिए?', a: 'मुख्य प्रभाव आपके अपने दरवाज़े के नंबर का है; इमारत का नंबर सहायक प्रभाव देता है।' },
    { q: `मकान ${n} अनुकूल न हो तो क्या घर बदलना पड़ेगा?`, a: 'नहीं। नेमप्लेट में अक्षर जोड़ना, रंग, दिशा और दीपक जैसे उपाय पर्याप्त होते हैं।' },
    { q: 'नया घर ख़रीदने से पहले क्या जाँचें?', a: 'मकान नंबर, गृह-प्रवेश की तिथि और परिवार के मुखिया का व्यक्तिगत वर्ष। संपत्ति के लिए वर्ष 4, 6 और 8 अनुकूल माने जाते हैं।' },
  ] : [
    { q: `Is house number ${n} lucky?`, a: `House ${n} is especially lucky for people whose Mulank or Bhagyank is ${fr.join(', ')}.` },
    { q: 'How do I count a flat number like B-702?', a: 'Add the letter’s Chaldean value and all digits: B(2) + 7 + 0 + 2 = 11 → 2.' },
    { q: 'Should I also check the building or society number?', a: 'Your own door number has the main effect; the building number has a supporting effect.' },
    { q: `If house ${n} does not suit me, must I move?`, a: 'No. Remedies such as adding a letter on the name plate, colours, directions and lamps are usually enough.' },
    { q: 'What should I check before buying a new home?', a: 'The house number, the griha-pravesh date and the personal year of the head of the family. Personal years 4, 6 and 8 favour property.' },
  ];
  return finish({ slug: houseSlug(n), cat: 'house', title: hi ? `मकान नंबर ${n} अंक ज्योतिष: अर्थ, किसके लिए शुभ और उपाय` : `House Number ${n} Numerology: Meaning, Who It Suits & Remedies`,
    h1: hi ? `मकान नंबर ${n}: अर्थ, शुभता और उपाय` : `House Number ${n} Numerology: Meaning, Lucky For and Remedies`,
    description: clip(`House number ${n} numerology: meaning of a ${P.name}-ruled home, how to calculate flat numbers with letters, who it suits and simple remedies by Acharya Nandram.`),
    keywords: [`house number ${n} numerology`, `house number ${n} meaning`, `flat number ${n} numerology`, `is house number ${n} lucky`, `house number ${n} remedies`, `मकान नंबर ${n}`],
    kicker: hi ? `मकान नंबर · ${pl(lang, n)}` : `House number · ${P.name}`, sub: hi ? `मकान ${n} का वातावरण, यह किस मूलांक के लिए शुभ है और सरल उपाय।` : `The atmosphere of house ${n}, which numbers it suits and simple remedies.`,
    art: { t: 'house', n }, sections, faqs, service: serviceLink(lang, 'report'), calc: calcLink(lang, 'house') });
}

/* ═════════════════════════ Mobile number total ═════════════════════════ */

const MOBILE: Record<Lang, Record<number, { meaning: string; good: string }>> = {
  en: {
    1: { meaning: 'A mobile total of 1 carries the Sun’s confidence. Calls bring leadership opportunities, recognition and independence.', good: 'leaders, entrepreneurs, government and management roles' },
    2: { meaning: 'A total of 2 is soft, caring and emotional. It supports relationships and cooperation but can make a person sensitive to every call and message.', good: 'counsellors, caregivers, partnerships and creative work' },
    3: { meaning: 'A total of 3 is Jupiter’s number of wisdom and growth. It brings respect, learning opportunities and helpful advisers.', good: 'teachers, consultants, lawyers, finance and advisory roles' },
    4: { meaning: 'A total of 4 (Rahu) is hard-working but unpredictable. It can bring sudden changes, delays and heavy effort unless 4 is your own number.', good: 'technology, research and people whose Mulank or Bhagyank is 4 or a friend of 4' },
    5: { meaning: 'A total of 5 (Mercury) is the classic business number – quick, communicative and lucky for sales and networking.', good: 'business owners, sales, marketing, media and frequent travellers' },
    6: { meaning: 'A total of 6 (Venus) brings charm, comfort, family harmony and attraction. It supports creative and client-facing work.', good: 'artists, designers, beauty, hospitality and family businesses' },
    7: { meaning: 'A total of 7 (Ketu) is reflective and spiritual. It suits research and quiet work but can feel isolating for sales or public roles.', good: 'researchers, healers, analysts and spiritual work' },
    8: { meaning: 'A total of 8 (Saturn) is heavy: it rewards discipline and long effort, but can bring delays and burdens unless 8 suits your chart.', good: 'industry, law, real estate and people whose numbers are friendly with 8' },
    9: { meaning: 'A total of 9 (Mars) is energetic and courageous. It brings drive and action, but also impatience and arguments if overused.', good: 'defence, sports, surgery, engineering and energetic leaders' },
  },
  hi: {
    1: { meaning: 'मोबाइल का योग 1 सूर्य का आत्मविश्वास देता है। कॉल से नेतृत्व के अवसर, पहचान और आत्मनिर्भरता आती है।', good: 'नेतृत्व करने वाले, उद्यमी, सरकारी और प्रबंधन भूमिकाएँ' },
    2: { meaning: 'योग 2 कोमल, देखभाल करने वाला और भावुक है। यह रिश्तों और सहयोग को बढ़ाता है, पर व्यक्ति को हर कॉल और संदेश के प्रति संवेदनशील बना सकता है।', good: 'परामर्शदाता, देखभाल करने वाले, साझेदारी और रचनात्मक काम' },
    3: { meaning: 'योग 3 गुरु का ज्ञान और विकास का अंक है। यह सम्मान, सीखने के अवसर और सहायक सलाहकार लाता है।', good: 'शिक्षक, सलाहकार, वकील, वित्त और परामर्श भूमिकाएँ' },
    4: { meaning: 'योग 4 (राहु) मेहनती पर अप्रत्याशित है। जब तक 4 आपका अपना अंक न हो, यह अचानक बदलाव, देरी और भारी प्रयास ला सकता है।', good: 'टेक्नोलॉजी, शोध और वे लोग जिनका मूलांक या भाग्यांक 4 या 4 का मित्र है' },
    5: { meaning: 'योग 5 (बुध) व्यापार का प्रमुख अंक है – तेज़, संवादी और सेल्स व संपर्क के लिए शुभ।', good: 'व्यवसायी, सेल्स, मार्केटिंग, मीडिया और बार-बार यात्रा करने वाले' },
    6: { meaning: 'योग 6 (शुक्र) आकर्षण, सुख-सुविधा, पारिवारिक सामंजस्य लाता है। यह रचनात्मक और ग्राहकों से जुड़े काम में सहायक है।', good: 'कलाकार, डिज़ाइनर, सौंदर्य, आतिथ्य और पारिवारिक व्यवसाय' },
    7: { meaning: 'योग 7 (केतु) चिंतनशील और आध्यात्मिक है। यह शोध और शांत काम के लिए अच्छा है, पर सेल्स या सार्वजनिक भूमिका में अकेलापन दे सकता है।', good: 'शोधकर्ता, उपचारक, विश्लेषक और आध्यात्मिक कार्य' },
    8: { meaning: 'योग 8 (शनि) भारी है: यह अनुशासन और लंबी मेहनत का फल देता है, पर यदि 8 आपके चार्ट के अनुकूल न हो तो देरी और बोझ ला सकता है।', good: 'उद्योग, कानून, रियल एस्टेट और वे लोग जिनके अंक 8 के मित्र हैं' },
    9: { meaning: 'योग 9 (मंगल) ऊर्जावान और साहसी है। यह जोश और कर्म लाता है, पर अधिकता में अधीरता और बहस भी।', good: 'रक्षा, खेल, सर्जरी, इंजीनियरिंग और ऊर्जावान नेतृत्व' },
  },
};
export const mobileSlug = (n: number) => `mobile-number-total-${n}-numerology-meaning`;

function buildMobile(n: number, lang: Lang): TopicPost {
  const hi = lang === 'hi', P = planetOf(n), T = (s: string) => tr(lang, s);
  const digits = `987654321${n === 9 ? 0 : n}`;
  const sum = digitSum(digits);
  const fr = friendsOf(n), en = enemiesOf(n);
  const cat = compoundCategory(sum);
  const CAT = { en: { favourable: 'favourable', mixed: 'mixed', unfavourable: 'unfavourable' }, hi: { favourable: 'शुभ', mixed: 'मिश्रित', unfavourable: 'अशुभ' } }[lang];
  const t = MOBILE[lang][n];
  const sections: Section[] = [
    sec('meaning', hi ? `मोबाइल नंबर का योग ${n}: अर्थ` : `Mobile Number Total ${n}: Meaning`, [
      p(hi ? 'आपका मोबाइल नंबर दिन में सैकड़ों बार उपयोग होता है, इसलिए अंक ज्योतिष में उसका कंपन महत्वपूर्ण माना जाता है। नंबर के सभी 10 अंक जोड़कर जो एक अंक बचता है, वही उसका योग (टोटल) है।' : 'You use your mobile number hundreds of times a day, so numerology treats its vibration as important. Add all 10 digits and reduce to one digit – that is the total of the number.'),
      p(t.meaning),
      fig({ t: 'phone', n }, hi ? `मोबाइल नंबर का योग ${n} – ${pl(lang, n)}` : `Mobile number total ${n} – ${P.name}`),
    ], true),
    sec('calculate', hi ? 'मोबाइल नंबर का योग कैसे निकालें' : 'How to Calculate the Mobile Total', [
      steps([{ title: digits.replace(/(\d{5})(\d{5})/, '$1 $2'), text: `${digits.split('').join(' + ')} = ${sum} → ${n}` }]),
      p(hi ? `इस उदाहरण में मिश्रित योग ${sum} है, जो कैल्डियन परंपरा में "${CAT[cat]}" श्रेणी में आता है। देश कोड (+91) नहीं जोड़ा जाता।` : `In this example the compound total is ${sum}, which falls in the “${CAT[cat]}” group in the Chaldean tradition. The country code (+91) is not added.`),
    ]),
    sec('suits', hi ? `योग ${n} किसके लिए शुभ है` : `Who a Total of ${n} Suits`, [
      p(hi ? `स्वभाव से उपयुक्त: ${t.good}।` : `By nature it suits ${t.good}.`),
      table(hi ? ['आपका भाग्यांक / मूलांक', `योग ${n} का प्रभाव`] : ['Your Bhagyank / Mulank', `Effect of total ${n}`], [
        [fr.join(', '), hi ? 'मित्र – नंबर सहायक है' : 'Friendly – the number supports you'],
        [NUMS.filter((m) => !fr.includes(m) && !en.includes(m)).join(', ') || '—', hi ? 'सम – सामान्य' : 'Neutral – ordinary'],
        [en.join(', ') || '—', hi ? 'चुनौतीपूर्ण – बदलने पर विचार करें' : 'Challenging – consider changing'],
      ]),
      p(hi ? 'हमारी गणना में भाग्यांक का संबंध सबसे अधिक महत्व रखता है, फिर मूलांक का। इसलिए एक ही नंबर एक व्यक्ति के लिए बहुत शुभ और दूसरे के लिए सामान्य हो सकता है।' : 'In our scoring the relation with your Bhagyank carries the most weight, then your Mulank. That is why the same number can be very lucky for one person and ordinary for another.'),
    ]),
    sec('pairs', hi ? 'केवल योग नहीं: अंक-जोड़े और शून्य' : 'Beyond the Total: Digit Pairs and Zeros', [
      list(hi ? [
        `इन जोड़ों से बचें: ${HARD_MALEFIC_PAIRS.join(', ')} – ये भारी या रुकावट वाले माने जाते हैं।`,
        'आपस में शत्रु अंक लगातार न हों (जैसे 2 और 9 एक-दूसरे के बगल में)।',
        'दो से अधिक शून्य ऊर्जा को कमज़ोर करते हैं।',
        'अंतिम चार अंकों का योग भी आपके भाग्यांक का मित्र हो तो बेहतर।',
        'नंबर में आपके लो शू ग्रिड के अनुपस्थित अंक हों तो वे कमी भरने में मदद करते हैं।',
      ] : [
        `Avoid these pairs: ${HARD_MALEFIC_PAIRS.join(', ')} – they are treated as heavy or blocking.`,
        'Avoid mutually unfriendly digits side by side (for example 2 next to 9).',
        'More than two zeros weaken the energy.',
        'It helps if the total of the last four digits is also friendly with your Bhagyank.',
        'Digits that are missing from your Lo Shu grid help fill those gaps when they appear in the number.',
      ]),
      tip(hi ? `मैं केवल योग ${n} देखकर नंबर चुनने की सलाह नहीं देता। सही नंबर वह है जिसका योग, जोड़े, शून्य और अंतिम चार अंक – चारों आपकी जन्म तिथि से मेल खाएँ।` : `I never advise choosing a number by its total of ${n} alone. The right number is one whose total, pairs, zeros and last four digits all agree with your date of birth.`),
    ], true),
    sec('remedies', hi ? 'यदि नंबर बदल न सकें' : 'If You Cannot Change the Number', [
      list(hi ? [`फ़ोन कवर या वॉलपेपर में अपने भाग्यांक के शुभ रंग रखें।`, `${T(P.weekday)} को ${pl(lang, n)} का मंत्र जपें: ${T(P.mantra.beej)}।`, 'नंबर को संपर्कों में सेव करते समय आपका पूरा सही नाम दिखे, ताकि नाम का कंपन साथ दे।', 'व्यवसाय के लिए एक अलग, अनुकूल नंबर लेना सबसे सरल समाधान है।']
        : [`Use the lucky colours of your Bhagyank for the phone cover or wallpaper.`, `Chant the mantra of ${P.name} on ${P.weekday}s: ${P.mantra.beej}.`, 'Make sure your correct full name shows when people save your number, so the name vibration supports it.', 'For business, a separate, well-matched number is the simplest solution.']),
    ]),
    calcSection(lang, ['mobile', 'bhagyank', 'moolank', 'loshu']),
    faqSec(lang),
  ];
  const faqs = hi ? [
    { q: `क्या मोबाइल नंबर का योग ${n} शुभ है?`, a: `यह उन लोगों के लिए शुभ है जिनका भाग्यांक या मूलांक ${fr.join(', ')} है। ${en.length ? `भाग्यांक ${en.join(', ')} वालों को सावधानी रखनी चाहिए।` : ''}` },
    { q: 'मोबाइल नंबर का योग कैसे निकालें?', a: 'देश कोड छोड़कर दसों अंक जोड़ें और एक अंक तक लाएँ।' },
    { q: 'क्या केवल योग देखना काफ़ी है?', a: 'नहीं। अंक-जोड़े, शून्य की संख्या और अंतिम चार अंक भी उतने ही महत्वपूर्ण हैं।' },
    { q: 'व्यवसाय के लिए कौन-सा योग अच्छा है?', a: 'अक्सर 5, 1, 3 और 6 व्यवसाय के लिए अच्छे हैं, पर अंतिम चयन मालिक के भाग्यांक से होना चाहिए।' },
    { q: 'क्या आचार्य नंदराम नया शुभ नंबर चुनने में मदद करते हैं?', a: 'हाँ, शुभ मोबाइल नंबर सेवा में आपकी जन्म तिथि के अनुसार उपलब्ध नंबरों की जाँच की जाती है।' },
  ] : [
    { q: `Is a mobile number total of ${n} lucky?`, a: `It is lucky for people whose Bhagyank or Mulank is ${fr.join(', ')}. ${en.length ? `People with Bhagyank ${en.join(', ')} should be careful.` : ''}`.trim() },
    { q: 'How do I calculate my mobile number total?', a: 'Leave out the country code, add all ten digits and reduce to one digit.' },
    { q: 'Is the total enough to judge a number?', a: 'No. Digit pairs, the number of zeros and the last four digits matter just as much.' },
    { q: 'Which total is good for business?', a: 'Totals 5, 1, 3 and 6 often suit business, but the final choice must follow the owner’s Bhagyank.' },
    { q: 'Does Acharya Nandram help choose a new lucky number?', a: 'Yes, the lucky mobile number service checks available numbers against your date of birth.' },
  ];
  return finish({ slug: mobileSlug(n), cat: 'mobile', title: hi ? `मोबाइल नंबर योग ${n}: अर्थ, किसके लिए शुभ और उपाय` : `Mobile Number Total ${n} Numerology: Meaning & Who It Suits`,
    h1: hi ? `मोबाइल नंबर का योग ${n}: क्या यह आपके लिए शुभ है?` : `Mobile Number Total ${n}: Is It Lucky for You?`,
    description: clip(`Mobile number total ${n} in numerology: ${P.name} energy, how to calculate, which Bhagyank and Mulank it suits, digit pairs to avoid and remedies by Acharya Nandram.`),
    keywords: [`mobile number total ${n}`, `mobile number numerology ${n}`, `phone number total ${n} meaning`, `is mobile number total ${n} lucky`, `mobile number sum ${n}`, `मोबाइल नंबर योग ${n}`],
    kicker: hi ? `मोबाइल अंक ज्योतिष · योग ${n}` : `Mobile numerology · Total ${n}`, sub: hi ? `योग ${n} का कंपन, किसके लिए शुभ है और किन अंक-जोड़ों से बचें।` : `The vibration of total ${n}, who it suits and which digit pairs to avoid.`,
    art: { t: 'phone', n }, sections, faqs, service: serviceLink(lang, 'mobile'), calc: calcLink(lang, 'mobile') });
}

/* ═════════════════════════ Chaldean name number ═════════════════════════ */

const NAME_POOL = ['RAHUL', 'PRIYA', 'AMIT', 'NEHA', 'ROHIT', 'POOJA', 'VIKAS', 'ANJALI', 'SURESH', 'KAVITA', 'RAJESH', 'SUNITA', 'DEEPAK', 'ANITA', 'MANOJ', 'REKHA', 'SANJAY', 'GEETA', 'ARJUN', 'MEERA', 'KARAN', 'SNEHA', 'VIJAY', 'NISHA', 'RAVI', 'ASHA', 'ANIL', 'USHA', 'GAURAV', 'RITU', 'NITIN', 'SEEMA', 'ARUN', 'DIVYA', 'MOHIT', 'KIRAN', 'TARUN', 'JYOTI', 'ALOK', 'SHWETA', 'HARSH', 'PREETI', 'VARUN', 'SAPNA', 'YASH', 'RADHA', 'DEV', 'TANVI', 'OM', 'ISHA', 'KUNAL', 'LATA', 'NIKHIL', 'MAYA', 'SACHIN', 'ADITI', 'PANKAJ', 'RIYA', 'VINOD', 'SAVITA', 'AJAY', 'MANISHA', 'ABHAY', 'NANDINI', 'GOPAL', 'PARUL', 'HEMANT', 'KOMAL', 'ASHOK', 'MAMTA'];
const NAME_HI: Record<string, string> = { RAHUL: 'राहुल', PRIYA: 'प्रिया', AMIT: 'अमित', NEHA: 'नेहा', ROHIT: 'रोहित', POOJA: 'पूजा', VIKAS: 'विकास', ANJALI: 'अंजलि', SURESH: 'सुरेश', KAVITA: 'कविता', RAJESH: 'राजेश', SUNITA: 'सुनीता', DEEPAK: 'दीपक', ANITA: 'अनीता', MANOJ: 'मनोज', REKHA: 'रेखा', SANJAY: 'संजय', GEETA: 'गीता', ARJUN: 'अर्जुन', MEERA: 'मीरा', KARAN: 'करण', SNEHA: 'स्नेहा', VIJAY: 'विजय', NISHA: 'निशा', RAVI: 'रवि', ASHA: 'आशा', ANIL: 'अनिल', USHA: 'उषा', GAURAV: 'गौरव', RITU: 'ऋतु', NITIN: 'नितिन', SEEMA: 'सीमा', ARUN: 'अरुण', DIVYA: 'दिव्या', MOHIT: 'मोहित', KIRAN: 'किरण', TARUN: 'तरुण', JYOTI: 'ज्योति', ALOK: 'आलोक', SHWETA: 'श्वेता', HARSH: 'हर्ष', PREETI: 'प्रीति', VARUN: 'वरुण', SAPNA: 'सपना', YASH: 'यश', RADHA: 'राधा', DEV: 'देव', TANVI: 'तन्वी', OM: 'ओम', ISHA: 'ईशा', KUNAL: 'कुणाल', LATA: 'लता', NIKHIL: 'निखिल', MAYA: 'माया', SACHIN: 'सचिन', ADITI: 'अदिति', PANKAJ: 'पंकज', RIYA: 'रिया', VINOD: 'विनोद', SAVITA: 'सविता', AJAY: 'अजय', MANISHA: 'मनीषा', ABHAY: 'अभय', NANDINI: 'नंदिनी', GOPAL: 'गोपाल', PARUL: 'पारुल', HEMANT: 'हेमंत', KOMAL: 'कोमल', ASHOK: 'अशोक', MAMTA: 'ममता' };
const NAMENUM: Record<Lang, Record<number, { meaning: string; career: string }>> = {
  en: {
    1: { meaning: 'Name number 1 gives a strong, independent public image. People see you as capable and confident, someone who takes charge.', career: 'leadership, entrepreneurship, administration and personal brands' },
    2: { meaning: 'Name number 2 makes you appear gentle, trustworthy and approachable. It helps cooperation but may need a firmer signature in competitive fields.', career: 'counselling, hospitality, design, teaching and partnerships' },
    3: { meaning: 'Name number 3 carries Jupiter’s respect and wisdom. It brings goodwill, learning and support from mentors – one of the most favoured name numbers.', career: 'teaching, law, consulting, finance and spiritual work' },
    4: { meaning: 'Name number 4 gives a hard-working, practical image, but in Chaldean practice it can bring sudden ups and downs unless it suits your birth numbers.', career: 'technology, engineering, research and systems' },
    5: { meaning: 'Name number 5 is lively, communicative and lucky for money and networking. It is one of the most popular choices for name correction.', career: 'business, sales, media, travel and communication' },
    6: { meaning: 'Name number 6 brings charm, beauty, love and comfort. People are drawn to you and family life is supported.', career: 'arts, fashion, beauty, hospitality and luxury trade' },
    7: { meaning: 'Name number 7 gives depth, mystery and spiritual insight. Good for research and healing, though it can make a person seem distant.', career: 'research, writing, healing, analysis and spiritual teaching' },
    8: { meaning: 'Name number 8 carries Saturn’s weight. It can bring authority after long effort, but also delays – choose it only when your chart supports 8.', career: 'law, industry, real estate and long-term business' },
    9: { meaning: 'Name number 9 gives energy, courage and a humanitarian image. People see you as active and protective; control anger in public.', career: 'defence, sports, medicine, engineering and social service' },
  },
  hi: {
    1: { meaning: 'नामांक 1 मज़बूत और स्वतंत्र सार्वजनिक छवि देता है। लोग आपको सक्षम, आत्मविश्वासी और ज़िम्मेदारी लेने वाला मानते हैं।', career: 'नेतृत्व, उद्यमिता, प्रशासन और व्यक्तिगत ब्रांड' },
    2: { meaning: 'नामांक 2 आपको कोमल, भरोसेमंद और सहज बनाता है। यह सहयोग में मदद करता है, पर प्रतिस्पर्धी क्षेत्रों में दृढ़ हस्ताक्षर की ज़रूरत हो सकती है।', career: 'परामर्श, आतिथ्य, डिज़ाइन, अध्यापन और साझेदारी' },
    3: { meaning: 'नामांक 3 में गुरु का सम्मान और ज्ञान है। यह सद्भावना, शिक्षा और मार्गदर्शकों का सहयोग लाता है – सबसे पसंदीदा नामांकों में से एक।', career: 'अध्यापन, कानून, परामर्श, वित्त और आध्यात्मिक कार्य' },
    4: { meaning: 'नामांक 4 मेहनती और व्यावहारिक छवि देता है, पर कैल्डियन परंपरा में यह जन्म-अंकों के अनुकूल न हो तो अचानक उतार-चढ़ाव ला सकता है।', career: 'टेक्नोलॉजी, इंजीनियरिंग, शोध और व्यवस्था' },
    5: { meaning: 'नामांक 5 जीवंत, संवादी और धन व संपर्कों के लिए शुभ है। नाम सुधार में यह सबसे लोकप्रिय विकल्पों में से एक है।', career: 'व्यवसाय, सेल्स, मीडिया, यात्रा और संवाद' },
    6: { meaning: 'नामांक 6 आकर्षण, सौंदर्य, प्रेम और सुख लाता है। लोग आपकी ओर खिंचते हैं और पारिवारिक जीवन को सहारा मिलता है।', career: 'कला, फ़ैशन, सौंदर्य, आतिथ्य और विलासिता व्यापार' },
    7: { meaning: 'नामांक 7 गहराई, रहस्य और आध्यात्मिक अंतर्दृष्टि देता है। शोध और उपचार के लिए अच्छा, पर व्यक्ति दूर-दूर लग सकता है।', career: 'शोध, लेखन, उपचार, विश्लेषण और आध्यात्मिक शिक्षण' },
    8: { meaning: 'नामांक 8 में शनि का भार है। लंबी मेहनत के बाद अधिकार दे सकता है, पर देरी भी – इसे तभी चुनें जब आपका चार्ट 8 का साथ दे।', career: 'कानून, उद्योग, रियल एस्टेट और दीर्घकालिक व्यवसाय' },
    9: { meaning: 'नामांक 9 ऊर्जा, साहस और मानवतावादी छवि देता है। लोग आपको सक्रिय और रक्षक मानते हैं; सार्वजनिक रूप से क्रोध पर नियंत्रण रखें।', career: 'रक्षा, खेल, चिकित्सा, इंजीनियरिंग और समाज सेवा' },
  },
};
export const nameSlug = (n: number) => `name-number-${n}-chaldean-numerology-meaning`;
function examplesFor(n: number) {
  return NAME_POOL.map((nm) => ({ nm, r: analyseNameSystem(nm, 'chaldean') })).filter((x) => x.r.nameNumber.single === n).slice(0, 3);
}

function buildName(n: number, lang: Lang): TopicPost {
  const hi = lang === 'hi', P = planetOf(n);
  const ex = examplesFor(n);
  const fr = friendsOf(n), en = enemiesOf(n);
  const t = NAMENUM[lang][n];
  const chartRows = [1, 2, 3, 4, 5, 6, 7, 8].map((v) => [String(v), Object.keys(CHALDEAN).filter((k) => CHALDEAN[k] === v).join(' ')]);
  const sections: Section[] = [
    sec('meaning', hi ? `नामांक ${n} का अर्थ` : `Meaning of Name Number ${n}`, [
      p(t.meaning),
      p(hi ? `नामांक ${n} के स्वामी ${pl(lang, n)} हैं। नाम वह कंपन है जिससे दुनिया आपको पुकारती है – इसलिए नामांक आपकी सार्वजनिक छवि, करियर और रिश्तों पर सीधा प्रभाव डालता है।` : `Name number ${n} is ruled by ${P.name}. Your name is the vibration the world calls you by, so the name number directly influences your public image, career and relationships.`),
      fig({ t: 'letters', letters: ex[0]?.nm ?? 'NAME', n }, hi ? `उदाहरण: ${ex[0] ? NAME_HI[ex[0].nm] : ''} – कैल्डियन नामांक ${n}` : `Example: ${ex[0]?.nm ?? ''} – Chaldean name number ${n}`),
    ], true),
    sec('calculate', hi ? 'कैल्डियन पद्धति से नामांक कैसे निकालें' : 'How to Calculate a Chaldean Name Number', [
      p(hi ? 'कैल्डियन पद्धति में हर अक्षर का मान 1 से 8 तक होता है (9 किसी अक्षर को नहीं दिया जाता)। नाम के सभी अक्षरों के मान जोड़कर एक अंक तक लाएँ। वही नाम लें जिससे आप रोज़ जाने जाते हैं या हस्ताक्षर करते हैं।' : 'In the Chaldean system every letter has a value from 1 to 8 (9 is not given to any letter). Add the values of all letters and reduce to one digit. Use the name you are known by every day or sign with.'),
      table(hi ? ['मान', 'अक्षर'] : ['Value', 'Letters'], chartRows),
      steps(ex.map((x) => ({ title: hi ? `${x.nm} (${NAME_HI[x.nm]})` : x.nm, text: `${x.r.letters.map((l) => `${l.letter}(${l.value})`).join(' + ')} = ${x.r.nameNumber.compound} → ${n}` }))),
    ]),
    sec('suits', hi ? `नामांक ${n} किसके लिए अनुकूल है` : `Who Name Number ${n} Suits`, [
      p(hi ? `करियर में सहायक: ${t.career}।` : `Supportive careers: ${t.career}.`),
      table(hi ? ['आपका भाग्यांक / मूलांक', `नामांक ${n}`] : ['Your Bhagyank / Mulank', `Name number ${n}`], [
        [fr.join(', '), hi ? 'मित्र – नाम आपका साथ देता है' : 'Friendly – the name supports you'],
        [NUMS.filter((m) => !fr.includes(m) && !en.includes(m)).join(', ') || '—', hi ? 'सम' : 'Neutral'],
        [en.join(', ') || '—', hi ? 'चुनौतीपूर्ण – वर्तनी सुधार पर विचार करें' : 'Challenging – consider a spelling correction'],
      ]),
    ]),
    sec('compound', hi ? 'मिश्रित (कंपाउंड) अंक भी देखें' : 'Check the Compound Number Too', [
      p(hi ? `एक ही नामांक ${n} कई मिश्रित योगों से बन सकता है – जैसे ${[n + 9, n + 18, n + 27, n + 36].filter((x) => x <= 52).join(', ')}। कैल्डियन परंपरा में हर मिश्रित अंक की अपनी श्रेणी है:` : `The same name number ${n} can come from several compound totals – such as ${[n + 9, n + 18, n + 27, n + 36].filter((x) => x <= 52).join(', ')}. In the Chaldean tradition each compound has its own category:`),
      table(hi ? ['मिश्रित योग', 'श्रेणी'] : ['Compound total', 'Category'], [n + 9, n + 18, n + 27, n + 36].filter((x) => x <= 52).map((x) => [String(x), hi ? { favourable: 'शुभ', mixed: 'मिश्रित', unfavourable: 'अशुभ' }[compoundCategory(x)] : compoundCategory(x)])),
      tip(hi ? 'नाम सुधार में मैं केवल एक अक्षर बदलकर या जोड़कर काम चलाने की कोशिश करता हूँ, ताकि नाम पहचान में वही रहे और मिश्रित अंक भी शुभ श्रेणी में आ जाए।' : 'In name correction I try to change or add just one letter, so the name still looks the same while the compound number moves into a favourable group.'),
    ], true),
    sec('remedies', hi ? 'नाम के कंपन को मज़बूत कैसे करें' : 'How to Strengthen Your Name Vibration', [
      list(hi ? [`हस्ताक्षर: ${tr(lang, P.signatureTip)}`, 'नई वर्तनी अपनाएँ तो उसे हर जगह – सोशल मीडिया, विज़िटिंग कार्ड, ईमेल – एक जैसा रखें।', 'काग़ज़ी नाम (आधार, पासपोर्ट) बदलना ज़रूरी नहीं; रोज़ उपयोग का नाम सबसे अधिक प्रभाव डालता है।', `${tr(lang, P.weekday)} से नई वर्तनी शुरू करना शुभ माना जाता है।`]
        : [`Signature: ${P.signatureTip}`, 'If you adopt a new spelling, use it everywhere – social media, visiting cards, email.', 'Changing legal documents (Aadhaar, passport) is not required; the name you use daily has the most effect.', `Starting a new spelling on a ${P.weekday} is considered auspicious.`]),
    ]),
    calcSection(lang, ['name', 'moolank', 'bhagyank', 'mobile']),
    faqSec(lang),
  ];
  const faqs = hi ? [
    { q: `क्या नामांक ${n} शुभ है?`, a: `यह भाग्यांक या मूलांक ${fr.join(', ')} वालों के लिए विशेष शुभ है।` },
    { q: 'कैल्डियन और पाइथागोरियन में कौन-सा सही है?', a: 'भारत में नाम सुधार के लिए कैल्डियन पद्धति अधिक प्रचलित और सटीक मानी जाती है; हम पाइथागोरियन को दूसरी राय के रूप में देखते हैं।' },
    { q: 'क्या पूरा नाम लें या केवल पहला नाम?', a: 'वह नाम लें जिससे आप सबसे अधिक जाने जाते हैं और हस्ताक्षर करते हैं – अक्सर पहला नाम + उपनाम।' },
    { q: 'नाम की वर्तनी बदलने से असर कब दिखता है?', a: 'नई वर्तनी को लगातार उपयोग करने पर आमतौर पर कुछ महीनों में अंतर महसूस होता है।' },
    { q: 'क्या ऑनलाइन नाम सुधार हो सकता है?', a: 'हाँ, आचार्य नंदराम आपकी जन्म तिथि के अनुसार कुछ अनुकूल वर्तनियाँ सुझाते हैं।' },
  ] : [
    { q: `Is name number ${n} lucky?`, a: `It is especially lucky for people with Bhagyank or Mulank ${fr.join(', ')}.` },
    { q: 'Chaldean or Pythagorean – which is right?', a: 'For name correction in India the Chaldean system is the most used and considered more precise; we use Pythagorean as a second opinion.' },
    { q: 'Should I use my full name or only my first name?', a: 'Use the name you are most known by and sign with – usually first name + surname.' },
    { q: 'When does a spelling change start to work?', a: 'With consistent use of the new spelling, most people notice a difference within a few months.' },
    { q: 'Can name correction be done online?', a: 'Yes, Acharya Nandram suggests a few suitable spellings based on your date of birth.' },
  ];
  return finish({ slug: nameSlug(n), cat: 'name', title: hi ? `नामांक ${n}: कैल्डियन अंक ज्योतिष में अर्थ और नाम सुधार` : `Name Number ${n} in Chaldean Numerology: Meaning & Correction`,
    h1: hi ? `नामांक ${n}: अर्थ, गणना और नाम सुधार` : `Name Number ${n}: Meaning, Calculation and Name Correction`,
    description: clip(`Name number ${n} in Chaldean numerology: ${P.name} energy, how to calculate with examples, compound numbers, who it suits and spelling tips by Acharya Nandram.`),
    keywords: [`name number ${n}`, `name number ${n} numerology`, `chaldean name number ${n}`, `name numerology ${n} meaning`, `lucky name number ${n}`, `नामांक ${n}`],
    kicker: hi ? `नाम अंक ज्योतिष · नामांक ${n}` : `Name numerology · Number ${n}`, sub: hi ? `नामांक ${n} आपकी छवि, करियर और रिश्तों पर कैसे असर डालता है।` : `How name number ${n} shapes your image, career and relationships.`,
    art: { t: 'letters', letters: ex[0]?.nm ?? 'NAME', n }, sections, faqs, service: serviceLink(lang, 'name'), calc: calcLink(lang, 'name') });
}

/* ═════════════════════════ Kua number ═════════════════════════ */

const KUA_EN = { success: 'Sheng Chi – success, wealth and recognition', health: 'Tien Yi – health, healing and support', relationships: 'Nien Yen – love, family and harmony', personalGrowth: 'Fu Wei – peace, stability and self-growth', mishaps: 'Ho Hai – mishaps and obstacles', fiveGhosts: 'Wu Kwei – disputes and loss of energy', sixKillings: 'Lui Sha – quarrels and delays', totalLoss: 'Chueh Ming – the weakest direction overall' };
export const kuaSlug = (n: number) => `kua-number-${n}-lucky-directions`;
const KUA_NUMS = [1, 2, 3, 4, 6, 7, 8, 9];

function kuaYears(n: number) {
  const male: number[] = [], female: number[] = [];
  for (let y = 1960; y <= 2010; y++) {
    if (kuaNumber(y, 'male') === n) male.push(y);
    if (kuaNumber(y, 'female') === n) female.push(y);
  }
  return { male: male.filter((y) => y >= 1975).slice(0, 5), female: female.filter((y) => y >= 1975).slice(0, 5) };
}

function buildKua(n: number, lang: Lang): TopicPost {
  const hi = lang === 'hi', K = KUA_DIRECTIONS[n], T = (s: string) => tr(lang, s);
  const M = hi ? KUA_MEANING_HI : KUA_EN;
  const good = [K.favourable.success, K.favourable.health, K.favourable.relationships, K.favourable.personalGrowth];
  const yrs = kuaYears(n);
  const sections: Section[] = [
    sec('meaning', hi ? `कुआ नंबर ${n} क्या है` : `What Kua Number ${n} Means`, [
      p(hi ? `कुआ नंबर फेंग शुई की "आठ भवन" पद्धति से आता है और आपकी जन्म-वर्ष और लिंग से निकलता है। यह बताता है कि कौन-सी चार दिशाएँ आपके लिए शुभ हैं – सोने, बैठने, काम करने और मुख्य द्वार के लिए। कुआ ${n} ${K.group === 'East' ? 'पूर्व' : 'पश्चिम'} समूह में आता है।` : `The Kua number comes from the Eight Mansions method of Feng Shui and is worked out from your birth year and gender. It tells you which four directions are lucky for you – for sleeping, sitting, working and the main door. Kua ${n} belongs to the ${K.group} group.`),
      fig({ t: 'compass', n, good }, hi ? `कुआ ${n} – चार शुभ दिशाएँ चमक रही हैं` : `Kua ${n} – the four lucky directions are highlighted`),
    ], true),
    sec('directions', hi ? `कुआ ${n} की शुभ और अशुभ दिशाएँ` : `Lucky and Unlucky Directions for Kua ${n}`, [
      table(hi ? ['दिशा', 'प्रभाव'] : ['Direction', 'Effect'], [
        [T(K.favourable.success), M.success], [T(K.favourable.health), M.health], [T(K.favourable.relationships), M.relationships], [T(K.favourable.personalGrowth), M.personalGrowth],
        [T(K.unfavourable.mishaps), M.mishaps], [T(K.unfavourable.fiveGhosts), M.fiveGhosts], [T(K.unfavourable.sixKillings), M.sixKillings], [T(K.unfavourable.totalLoss), M.totalLoss],
      ]),
    ]),
    sec('calculate', hi ? 'कुआ नंबर कैसे निकालें' : 'How to Calculate the Kua Number', [
      p(hi ? 'जन्म-वर्ष के अंक जोड़कर एक अंक (Y) बनाएँ। पुरुष: 11 − Y, फिर एक अंक तक; परिणाम 5 हो तो कुआ 2। महिला: 4 + Y, फिर एक अंक तक; परिणाम 5 हो तो कुआ 8। इसलिए 5 कभी अंतिम कुआ नहीं होता।' : 'Add the digits of the birth year to one digit (Y). Male: 11 − Y, reduced; if the result is 5, Kua is 2. Female: 4 + Y, reduced; if the result is 5, Kua is 8. That is why 5 is never a final Kua number.'),
      table(hi ? ['', `कुआ ${n} वाले जन्म-वर्ष (उदाहरण)`] : ['', `Birth years with Kua ${n} (examples)`], [[hi ? 'पुरुष' : 'Male', yrs.male.join(', ') || '—'], [hi ? 'महिला' : 'Female', yrs.female.join(', ') || '—']]),
    ]),
    sec('use', hi ? 'घर और दफ़्तर में कुआ का उपयोग' : 'Using Kua at Home and Work', [
      list(hi ? [`सोते समय सिर ${T(K.favourable.health)} या ${T(K.favourable.personalGrowth)} की ओर रखें।`, `काम या पढ़ाई करते समय मुख ${T(K.favourable.success)} की ओर रखें।`, `परिवार और रिश्तों के लिए ${T(K.favourable.relationships)} दिशा को साफ़ और रोशन रखें।`, `${T(K.unfavourable.totalLoss)} की ओर मुख करके महत्वपूर्ण बैठकें न करें।`]
        : [`Sleep with your head towards ${K.favourable.health} or ${K.favourable.personalGrowth}.`, `Face ${K.favourable.success} while working or studying.`, `Keep the ${K.favourable.relationships} area clean and bright for family and relationships.`, `Avoid facing ${K.unfavourable.totalLoss} in important meetings.`]),
      tip(hi ? 'पूरा घर तोड़-फोड़ करने की ज़रूरत नहीं। बिस्तर और कुर्सी की दिशा बदलना ही अक्सर सबसे बड़ा अंतर लाता है।' : 'You do not need to rebuild the house. Turning the bed and the work chair is often what makes the biggest difference.'),
      p(hi ? 'हमारी विधि में कुआ अंक आपके लो शू ग्रिड में भी जोड़ा जाता है, इसलिए यह आपके अनुपस्थित अंकों को भी प्रभावित कर सकता है।' : 'In our method the Kua number is also added to your Lo Shu grid, so it can affect your missing numbers too.'),
    ], true),
    calcSection(lang, ['kua', 'loshu', 'house', 'bhagyank']),
    faqSec(lang),
  ];
  const faqs = hi ? [
    { q: `कुआ ${n} की सबसे शुभ दिशा कौन-सी है?`, a: `${T(K.favourable.success)} – सफलता और धन की दिशा।` },
    { q: 'क्या पति-पत्नी के कुआ अलग हों तो समस्या है?', a: 'नहीं। बिस्तर की दिशा मुख्य कमाने वाले या दोनों के लिए साझा शुभ दिशा के अनुसार रखें।' },
    { q: 'कुआ 5 क्यों नहीं होता?', a: 'परिणाम 5 आने पर पुरुषों के लिए 2 और महिलाओं के लिए 8 लिया जाता है।' },
    { q: 'क्या 1 जनवरी से पहले जन्म हो तो वर्ष बदलता है?', a: 'हमारी गणना कैलेंडर वर्ष उपयोग करती है, चीनी नव वर्ष का समायोजन नहीं।' },
    { q: 'दरवाज़ा अशुभ दिशा में हो तो क्या करें?', a: 'घर के भीतर अपनी शुभ दिशा की ओर मुख करके बैठें-सोएँ और प्रवेश द्वार को साफ़ व रोशन रखें; विशेषज्ञ अतिरिक्त उपाय बता सकते हैं।' },
  ] : [
    { q: `What is the luckiest direction for Kua ${n}?`, a: `${K.favourable.success} – the direction of success and wealth.` },
    { q: 'Is it a problem if husband and wife have different Kua numbers?', a: 'No. Place the bed by the main earner’s lucky direction or a direction good for both.' },
    { q: 'Why is there no Kua 5?', a: 'When the result is 5, men take Kua 2 and women take Kua 8.' },
    { q: 'Does the year change for births before Chinese New Year?', a: 'Our calculation uses the calendar year, without the Chinese New Year adjustment.' },
    { q: 'What if my main door faces an unlucky direction?', a: 'Sit and sleep facing your lucky directions inside the home, and keep the entrance clean and bright; an expert can suggest more remedies.' },
  ];
  return finish({ slug: kuaSlug(n), cat: 'kua', title: hi ? `कुआ नंबर ${n}: शुभ दिशाएँ, गणना और उपयोग` : `Kua Number ${n}: Lucky Directions for Home, Sleep & Work`,
    h1: hi ? `कुआ नंबर ${n}: आपकी शुभ दिशाएँ` : `Kua Number ${n}: Your Lucky and Unlucky Directions`,
    description: clip(`Kua number ${n} (${K.group} group): lucky directions for success, health, love and growth, how to calculate Kua for men and women, and how to use it at home – by Acharya Nandram.`),
    keywords: [`kua number ${n}`, `kua number ${n} lucky directions`, `kua ${n} direction`, `kua number ${n} sleeping direction`, `kua number ${n} ${K.group.toLowerCase()} group`, `कुआ नंबर ${n}`],
    kicker: hi ? `कुआ नंबर · ${K.group === 'East' ? 'पूर्व' : 'पश्चिम'} समूह` : `Kua number · ${K.group} group`, sub: hi ? `कुआ ${n} के लिए सोने, काम और परिवार की सबसे शुभ दिशाएँ।` : `The best directions to sleep, work and live by for Kua ${n}.`,
    art: { t: 'compass', n, good }, sections, faqs, service: serviceLink(lang, 'report'), calc: calcLink(lang, 'kua') });
}

export const HOUSE_POSTS: TopicRef[] = NUMS.map((n) => ({ slug: houseSlug(n), cat: 'house' as const, build: (l: Lang) => buildHouse(n, l) }));
export const MOBILE_POSTS: TopicRef[] = NUMS.map((n) => ({ slug: mobileSlug(n), cat: 'mobile' as const, build: (l: Lang) => buildMobile(n, l) }));
export const NAME_POSTS: TopicRef[] = NUMS.map((n) => ({ slug: nameSlug(n), cat: 'name' as const, build: (l: Lang) => buildName(n, l) }));
export const KUA_POSTS: TopicRef[] = KUA_NUMS.map((n) => ({ slug: kuaSlug(n), cat: 'kua' as const, build: (l: Lang) => buildKua(n, l) }));
