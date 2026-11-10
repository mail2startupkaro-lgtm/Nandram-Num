/** SEO landing pages for the free calculators (lead magnets). */
export type CalcKind = 'moolank' | 'bhagyank' | 'loshu' | 'name' | 'mobile' | 'kua';

export interface CalcPage {
  slug: string; kind: CalcKind; title: string; h1: string; description: string; keywords: string[];
  intro: string[]; faq: { q: string; a: string }[];
  /** Hindi (Devanagari) page text. */
  hi: { h1: string; description: string; intro: string[]; faq: { q: string; a: string }[] };
}

export const CALCULATORS: CalcPage[] = [
  {
    slug: 'moolank-calculator', kind: 'moolank', title: 'Free Moolank Calculator – Find Your Root Number', h1: 'Free Moolank Calculator',
    description: 'Calculate your Moolank (psychic or root number) from your date of birth and learn its ruling planet, nature and lucky days.',
    keywords: ['moolank calculator', 'root number', 'psychic number', 'moolank meaning'],
    intro: ['Your Moolank is the single digit you get by adding the digits of the day you were born. It describes your day-to-day nature, the way others see you and the planet that rules your personality.', 'Enter your date of birth below to see your Moolank instantly.'],
    faq: [
      { q: 'How is Moolank calculated?', a: 'Add the digits of your birth date until a single digit remains. Someone born on the 28th has 2 + 8 = 10, and 1 + 0 = 1, so their Moolank is 1.' },
      { q: 'What is the difference between Moolank and Bhagyank?', a: 'Moolank comes from the day of birth and shows your personality. Bhagyank comes from the full date of birth and shows your destiny or life path.' },
      { q: 'Can my Moolank change?', a: 'No. It is fixed by your date of birth. Remedies, lucky colours and name spelling are used to balance its energy.' },
    ],
    hi: { h1: 'मुफ़्त मूलांक कैलकुलेटर', description: 'अपनी जन्म तिथि से अपना मूलांक (मूल अंक) निकालें और उसका स्वामी ग्रह, स्वभाव और शुभ दिन जानें।',
      intro: ['मूलांक वह एक अंक है जो आपके जन्म की तारीख़ (दिन) के अंकों को जोड़ने से मिलता है। यह आपके रोज़ के स्वभाव, लोग आपको कैसे देखते हैं और आपके व्यक्तित्व के स्वामी ग्रह को दर्शाता है।', 'तुरंत अपना मूलांक देखने के लिए नीचे अपनी जन्म तिथि दर्ज करें।'],
      faq: [
        { q: 'मूलांक कैसे निकाला जाता है?', a: 'जन्म की तारीख़ के अंकों को तब तक जोड़ें जब तक एक अंक न बचे। 28 तारीख़ को जन्मे व्यक्ति के लिए 2 + 8 = 10 और 1 + 0 = 1, इसलिए उनका मूलांक 1 है।' },
        { q: 'मूलांक और भाग्यांक में क्या अंतर है?', a: 'मूलांक जन्म के दिन से निकलता है और व्यक्तित्व दिखाता है। भाग्यांक पूरी जन्म तिथि से निकलता है और भाग्य या जीवन-पथ दिखाता है।' },
        { q: 'क्या मेरा मूलांक बदल सकता है?', a: 'नहीं। यह आपकी जन्म तिथि से तय होता है। इसकी ऊर्जा को संतुलित करने के लिए उपाय, शुभ रंग और नाम की वर्तनी का उपयोग किया जाता है।' },
      ] },
  },
  {
    slug: 'bhagyank-calculator', kind: 'bhagyank', title: 'Bhagyank Calculator – Destiny Number from Date of Birth', h1: 'Free Bhagyank (Destiny Number) Calculator',
    description: 'Find your Bhagyank, the destiny or life path number, from your full date of birth – including master numbers 11, 22 and 33.',
    keywords: ['bhagyank calculator', 'destiny number', 'life path number india', 'bhagyank meaning'],
    intro: ['Your Bhagyank is the total of every digit in your date of birth, reduced to one digit. In Indian numerology it shows the direction your life naturally takes and where fortune comes from.'],
    faq: [
      { q: 'How do I calculate my Bhagyank?', a: 'Write your date of birth as DD-MM-YYYY, add all the digits and keep adding until you reach a single digit.' },
      { q: 'What are master numbers?', a: 'If the total passes through 11, 22 or 33 before reducing, a master vibration sits behind your Bhagyank. It is shown as a note alongside the single digit.' },
    ],
    hi: { h1: 'मुफ़्त भाग्यांक (भाग्य अंक) कैलकुलेटर', description: 'अपनी पूरी जन्म तिथि से अपना भाग्यांक (जीवन-पथ अंक) जानें – मास्टर नंबर 11, 22 और 33 सहित।',
      intro: ['भाग्यांक आपकी जन्म तिथि के हर अंक का योग है, जिसे एक अंक तक घटाया जाता है। भारतीय अंक ज्योतिष में यह बताता है कि आपका जीवन स्वाभाविक रूप से किस दिशा में जाता है और भाग्य कहाँ से आता है।'],
      faq: [
        { q: 'मैं अपना भाग्यांक कैसे निकालूँ?', a: 'अपनी जन्म तिथि DD-MM-YYYY के रूप में लिखें, सभी अंक जोड़ें और एक अंक बचने तक जोड़ते रहें।' },
        { q: 'मास्टर नंबर क्या होते हैं?', a: 'यदि घटाने से पहले योग 11, 22 या 33 से होकर गुज़रता है, तो आपके भाग्यांक के पीछे एक मास्टर कंपन होता है। इसे एकल अंक के साथ टिप्पणी के रूप में दिखाया जाता है।' },
      ] },
  },
  {
    slug: 'lo-shu-grid-calculator', kind: 'loshu', title: 'Lo Shu Grid Calculator – Missing Numbers, Planes & Raj Yog', h1: 'Free Lo Shu Grid Calculator',
    description: 'Create your Lo Shu Grid from your date of birth. See missing and repeated numbers, complete planes, and yogs such as Raj Yog and Golden Yog.',
    keywords: ['lo shu grid calculator', 'missing numbers numerology', 'raj yog lo shu', 'lo shu grid meaning'],
    intro: ['The Lo Shu Grid is a 3 × 3 magic square. Your birth-date digits, Moolank, Bhagyank and Kua number are placed in it to show which energies you have in plenty and which are missing.'],
    faq: [
      { q: 'What does a missing number mean?', a: 'A missing number marks a quality you need to develop consciously. Each one has simple remedies such as colours, crystals and placement at home.' },
      { q: 'What is Raj Yog in the Lo Shu Grid?', a: 'When 2, 5 and 8 are all present, the property line is complete. In Indian practice this is called Raj Yog and supports authority and property.' },
    ],
    hi: { h1: 'मुफ़्त लो शू ग्रिड कैलकुलेटर', description: 'अपनी जन्म तिथि से अपना लो शू ग्रिड बनाएँ। अनुपस्थित और दोहराए गए अंक, पूर्ण तल और राज योग व स्वर्ण योग जैसे योग देखें।',
      intro: ['लो शू ग्रिड 3 × 3 का एक जादुई वर्ग है। इसमें आपकी जन्म तिथि के अंक, मूलांक, भाग्यांक और कुआ अंक रखे जाते हैं, ताकि पता चले कि कौन-सी ऊर्जाएँ आपमें भरपूर हैं और कौन-सी अनुपस्थित हैं।'],
      faq: [
        { q: 'अनुपस्थित अंक का क्या अर्थ है?', a: 'अनुपस्थित अंक ऐसे गुण को दर्शाता है जिसे आपको सचेत रूप से विकसित करना है। हर अनुपस्थित अंक के लिए रंग, क्रिस्टल और घर में वस्तुएँ रखने जैसे सरल उपाय होते हैं।' },
        { q: 'लो शू ग्रिड में राज योग क्या है?', a: 'जब 2, 5 और 8 तीनों उपस्थित हों, तो संपत्ति रेखा पूर्ण होती है। भारतीय पद्धति में इसे राज योग कहा जाता है, जो अधिकार और संपत्ति में सहायक है।' },
      ] },
  },
  {
    slug: 'name-numerology-calculator', kind: 'name', title: 'Name Numerology Calculator – Chaldean & Pythagorean', h1: 'Free Name Numerology Calculator',
    description: 'Calculate your name number with the Chaldean system used in India, compare it with the Pythagorean value, and see your soul urge and personality numbers.',
    keywords: ['name numerology calculator', 'chaldean numerology', 'name number', 'name correction numerology'],
    intro: ['Every letter carries a number. In the Chaldean system, the total of the name you use every day shows how the world responds to you. A name that matches your Moolank and Bhagyank supports your efforts.'],
    faq: [
      { q: 'Which name should I use – full name or common name?', a: 'Use the name you sign with and that people call you by. The full report analyses both.' },
      { q: 'Can a spelling change help?', a: 'Yes. Small changes such as doubling a letter can shift the vibration without changing pronunciation. The full report suggests options that suit your numbers.' },
    ],
    hi: { h1: 'मुफ़्त नाम अंक ज्योतिष कैलकुलेटर', description: 'भारत में प्रचलित कैल्डियन पद्धति से अपना नामांक निकालें, पाइथागोरियन मान से तुलना करें और अपने आत्मा व व्यक्तित्व अंक देखें।',
      intro: ['हर अक्षर का एक अंक होता है। कैल्डियन पद्धति में, जिस नाम का आप रोज़ उपयोग करते हैं उसका योग बताता है कि दुनिया आप पर कैसी प्रतिक्रिया देती है। आपके मूलांक और भाग्यांक से मेल खाने वाला नाम आपके प्रयासों का साथ देता है।', 'नाम अंग्रेज़ी अक्षरों (A–Z) में लिखें, क्योंकि अंक अंग्रेज़ी वर्तनी से निकलते हैं।'],
      faq: [
        { q: 'कौन-सा नाम उपयोग करूँ – पूरा नाम या आम नाम?', a: 'वही नाम लिखें जिससे आप हस्ताक्षर करते हैं और लोग आपको पुकारते हैं। पूरी रिपोर्ट दोनों का विश्लेषण करती है।' },
        { q: 'क्या वर्तनी बदलने से मदद मिल सकती है?', a: 'हाँ। किसी अक्षर को दोहराने जैसे छोटे बदलाव उच्चारण बदले बिना कंपन बदल सकते हैं। पूरी रिपोर्ट आपके अंकों के अनुकूल विकल्प सुझाती है।' },
      ] },
  },
  {
    slug: 'mobile-number-numerology', kind: 'mobile', title: 'Mobile Number Numerology – Is Your Number Lucky?', h1: 'Free Mobile Number Numerology Check',
    description: 'Check whether your mobile number is lucky for your date of birth. See its total, compatibility score and difficult digit pairs.',
    keywords: ['mobile number numerology', 'lucky mobile number', 'mobile number total', 'mobile numerology calculator'],
    intro: ['Your mobile number is used many times a day, so its vibration matters. The total of its ten digits should be friendly with your Moolank and Bhagyank, and some digit pairs such as 4-8 are best avoided.'],
    faq: [
      { q: 'How is the mobile number total calculated?', a: 'Add all ten digits and reduce to a single number. That number is compared with your Moolank and Bhagyank.' },
      { q: 'Should I change my number?', a: 'Only if the score is low and changing is practical. The full report lists the ideal totals and digit patterns to look for.' },
    ],
    hi: { h1: 'मुफ़्त मोबाइल नंबर अंक ज्योतिष जाँच', description: 'जाँचें कि आपका मोबाइल नंबर आपकी जन्म तिथि के लिए शुभ है या नहीं। इसका योग, अनुकूलता स्कोर और कठिन अंक-जोड़ियाँ देखें।',
      intro: ['आपका मोबाइल नंबर दिन में कई बार उपयोग होता है, इसलिए उसका कंपन मायने रखता है। इसके दस अंकों का योग आपके मूलांक और भाग्यांक का मित्र होना चाहिए, और 4-8 जैसी कुछ अंक-जोड़ियों से बचना बेहतर है।'],
      faq: [
        { q: 'मोबाइल नंबर का योग कैसे निकाला जाता है?', a: 'सभी दस अंक जोड़ें और एक अंक तक घटाएँ। उस अंक की तुलना आपके मूलांक और भाग्यांक से की जाती है।' },
        { q: 'क्या मुझे अपना नंबर बदलना चाहिए?', a: 'केवल तभी जब स्कोर कम हो और बदलना व्यावहारिक हो। पूरी रिपोर्ट आदर्श योग और देखने योग्य अंक-क्रम बताती है।' },
      ] },
  },
  {
    slug: 'kua-number-calculator', kind: 'kua', title: 'Kua Number Calculator – Lucky Directions for Home & Work', h1: 'Free Kua Number Calculator',
    description: 'Find your Kua number from your year of birth and gender, and see your four lucky directions for success, health, relationships and growth.',
    keywords: ['kua number calculator', 'lucky direction', 'kua number', 'east group west group'],
    intro: ['Your Kua number places you in the East or West group and gives four favourable directions. Facing your success direction while working and sleeping towards your health direction is a simple, practical remedy.'],
    faq: [
      { q: 'Why does gender matter for Kua?', a: 'The traditional Kua formula is different for men and women, so the same birth year can give different numbers.' },
      { q: 'What if I was born in January or early February?', a: 'Some practitioners use the solar new year (around 4 February). This calculator uses the calendar year; your numerologist can advise if you were born before 4 February.' },
    ],
    hi: { h1: 'मुफ़्त कुआ अंक कैलकुलेटर', description: 'अपने जन्म वर्ष और लिंग से अपना कुआ अंक जानें और सफलता, स्वास्थ्य, संबंध और विकास की अपनी चार शुभ दिशाएँ देखें।',
      intro: ['आपका कुआ अंक आपको पूर्व या पश्चिम समूह में रखता है और चार अनुकूल दिशाएँ देता है। काम करते समय सफलता की दिशा की ओर मुँह करना और स्वास्थ्य की दिशा की ओर सिर करके सोना एक सरल, व्यावहारिक उपाय है।'],
      faq: [
        { q: 'कुआ अंक के लिए लिंग क्यों मायने रखता है?', a: 'पारंपरिक कुआ सूत्र पुरुषों और महिलाओं के लिए अलग है, इसलिए एक ही जन्म वर्ष से अलग-अलग अंक आ सकते हैं।' },
        { q: 'यदि मेरा जन्म जनवरी या फ़रवरी की शुरुआत में हुआ हो तो?', a: 'कुछ विशेषज्ञ सौर नववर्ष (लगभग 4 फ़रवरी) का उपयोग करते हैं। यह कैलकुलेटर कैलेंडर वर्ष का उपयोग करता है; यदि आपका जन्म 4 फ़रवरी से पहले हुआ है तो आपके अंक ज्योतिषी सलाह दे सकते हैं।' },
      ] },
  },
];

export const calcBySlug = (slug: string) => CALCULATORS.find((c) => c.slug === slug);
