/**
 * Hero copy for each service landing page (English + Hindi).
 * `hook` is the benefit line under the H1 – it speaks to the visitor's problem, not the product.
 * The bullet points under it come from Admin → Services ("What's included"), so they always match what is sold.
 */
type L = { en: string; hi: string };
export type HeroIcon = 'user' | 'type' | 'grid' | 'phone' | 'baby' | 'heart' | 'store' | 'building' | 'briefcase' | 'calendar' | 'pen' | 'label' | 'matrix' | 'square';
export interface ServiceHero { icon: HeroIcon; tag: L; hook: L; freeTitle: L; leadLabels?: { name?: L; dob?: L } }

const FREE_DOB: L = { en: 'See your Moolank & Bhagyank in 30 seconds', hi: '30 सेकंड में अपना मूलांक और भाग्यांक देखें' };

export const SERVICE_HERO: Record<string, ServiceHero> = {
  'personal-numerology-report': {
    icon: 'user', tag: { en: 'Your complete numerology chart', hi: 'आपका संपूर्ण अंक ज्योतिष चार्ट' },
    hook: { en: 'Know your strengths, your right timing and the remedies that fit your life – in one personal report.', hi: 'अपनी ताक़त, सही समय और अपने जीवन के अनुकूल उपाय जानें – एक व्यक्तिगत रिपोर्ट में।' },
    freeTitle: FREE_DOB,
  },
  'name-numerology': {
    icon: 'type', tag: { en: 'Chaldean name analysis', hi: 'कैल्डियन नाम विश्लेषण' },
    hook: { en: 'Is your name helping you – or quietly holding you back? Find out, and get a lucky spelling that still looks natural.', hi: 'क्या आपका नाम आपकी मदद कर रहा है – या चुपचाप आपको रोक रहा है? जानिए, और ऐसी शुभ वर्तनी पाइए जो स्वाभाविक भी लगे।' },
    freeTitle: { en: 'Start free – see your birth numbers first', hi: 'मुफ़्त शुरुआत – पहले अपने जन्म अंक देखें' },
  },
  'lo-shu-grid': {
    icon: 'grid', tag: { en: 'Lo Shu magic square', hi: 'लो शू जादुई वर्ग' },
    hook: { en: 'Your missing numbers show exactly what to strengthen. See your grid – and the simple remedy for each gap.', hi: 'आपके लुप्त अंक बताते हैं कि किसे मज़बूत करना है। अपनी ग्रिड देखें – और हर कमी का सरल उपाय।' },
    freeTitle: FREE_DOB,
  },
  'mobile-number-numerology': {
    icon: 'phone', tag: { en: 'Mobile number numerology', hi: 'मोबाइल नंबर अंक ज्योतिष' },
    hook: { en: 'You use your mobile number every single day. Make sure its vibration supports your work, money and peace of mind.', hi: 'आप हर दिन अपना मोबाइल नंबर उपयोग करते हैं। सुनिश्चित करें कि उसकी ऊर्जा आपके काम, धन और मन की शांति का साथ दे।' },
    freeTitle: FREE_DOB,
  },
  'baby-name-numerology': {
    icon: 'baby', tag: { en: 'For your little one', hi: 'आपके नन्हे-मुन्ने के लिए' },
    hook: { en: 'A name your child will carry for life – beautiful in meaning and in harmony with their date of birth.', hi: 'वह नाम जो आपका बच्चा जीवन भर रखेगा – अर्थ में सुंदर और जन्म तिथि के साथ सामंजस्य में।' },
    freeTitle: { en: "See your baby's numbers – free", hi: 'शिशु के अंक देखें – मुफ़्त' },
    leadLabels: {
      name: { en: 'Baby Current Name', hi: 'शिशु का वर्तमान नाम' },
      dob: { en: 'Baby Date of Birth', hi: 'शिशु की जन्म तिथि' },
    },
  },
  'couple-compatibility-report': {
    icon: 'heart', tag: { en: 'Marriage & relationships', hi: 'विवाह और संबंध' },
    hook: { en: 'See how your numbers work together – where you click, where you clash, and how to make the bond stronger.', hi: 'देखें आपके अंक साथ में कैसे काम करते हैं – कहाँ मेल है, कहाँ टकराव, और रिश्ता मज़बूत कैसे बने।' },
    freeTitle: { en: 'Check your own numbers first – free', hi: 'पहले अपने अंक जाँचें – मुफ़्त' },
  },
  'business-name-numerology': {
    icon: 'store', tag: { en: 'Before you register or print', hi: 'रजिस्टर या प्रिंट कराने से पहले' },
    hook: { en: 'Your business name is spoken, printed and searched every day. Choose one whose number supports the owner and the growth.', hi: 'आपके व्यवसाय का नाम हर दिन बोला, छापा और खोजा जाता है। ऐसा नाम चुनें जिसका अंक मालिक और विकास दोनों का साथ दे।' },
    freeTitle: { en: "See the owner's numbers – free", hi: 'मालिक के अंक देखें – मुफ़्त' },
  },
  'business-numerology-report': {
    icon: 'building', tag: { en: 'For owners & founders', hi: 'मालिकों और संस्थापकों के लिए' },
    hook: { en: 'Name, brand, partners, timing and the owner – everything your business numbers say, in one complete report.', hi: 'नाम, ब्रांड, साझेदार, समय और मालिक – आपके व्यवसाय के अंक जो कुछ कहते हैं, सब एक संपूर्ण रिपोर्ट में।' },
    freeTitle: { en: "See the owner's numbers – free", hi: 'मालिक के अंक देखें – मुफ़्त' },
  },
  'business-compatibility-numerology': {
    icon: 'briefcase', tag: { en: 'Career & business choice', hi: 'करियर और व्यवसाय का चुनाव' },
    hook: { en: 'Before you invest, find out which line of business your date of birth is made for – and which to avoid.', hi: 'निवेश से पहले जानिए कि आपकी जन्म तिथि किस व्यवसाय के लिए बनी है – और किससे बचना है।' },
    freeTitle: FREE_DOB,
  },
  'personal-year-consultancy': {
    icon: 'calendar', tag: { en: 'Birthday to birthday', hi: 'जन्मदिन से जन्मदिन तक' },
    hook: { en: 'Know when to start, when to wait and when to act. Plan your year with your personal year, month and day numbers.', hi: 'जानिए कब शुरू करें, कब रुकें और कब कदम उठाएँ। अपने व्यक्तिगत वर्ष, माह और दिन के अंकों से साल की योजना बनाएँ।' },
    freeTitle: FREE_DOB,
  },
  'signature-analysis': {
    icon: 'pen', tag: { en: 'Graphology × Numerology', hi: 'हस्तलेख विज्ञान × अंक ज्योतिष' },
    hook: { en: 'You sign your name on cheques, contracts and forms all your life. Find out what your signature reveals – and how to make it work for you.', hi: 'आप जीवन भर चेक, अनुबंध और फ़ॉर्म पर हस्ताक्षर करते हैं। जानिए आपका हस्ताक्षर क्या बताता है – और उसे अपने पक्ष में कैसे करें।' },
    freeTitle: FREE_DOB,
  },
  'destiny-matrix-analysis': {
    icon: 'matrix', tag: { en: '22 arcana · Ladini method', hi: '22 आर्काना · लादिनी पद्धति' },
    hook: { en: 'Your date of birth holds a map of your life – your talents, where money and love come from, the lesson you carry and what this year is about.', hi: 'आपकी जन्म तिथि में आपके जीवन का नक्शा है – आपकी प्रतिभा, धन और प्रेम कहाँ से आते हैं, आप कौन-सी सीख लेकर आए हैं और यह वर्ष किस बारे में है।' },
    freeTitle: FREE_DOB,
  },
  'pythagorean-birth-chart': {
    icon: 'square', tag: { en: 'Pythagoras Square · Psychomatrix', hi: 'पाइथागोरस वर्ग · साइकोमैट्रिक्स' },
    hook: { en: 'Nine qualities, eight life lines, one square from your date of birth – see what comes naturally to you and what to build.', hi: 'नौ गुण, आठ जीवन रेखाएँ, आपकी जन्म तिथि से एक वर्ग – देखें क्या आपको स्वाभाविक रूप से आता है और क्या विकसित करना है।' },
    freeTitle: FREE_DOB,
  },
};

const FALLBACK: ServiceHero = { icon: 'user', tag: { en: 'Personal numerology', hi: 'व्यक्तिगत अंक ज्योतिष' }, hook: { en: 'Clear, practical guidance from your numbers – prepared personally for you.', hi: 'आपके अंकों से स्पष्ट, व्यावहारिक मार्गदर्शन – आपके लिए स्वयं तैयार।' }, freeTitle: FREE_DOB };
export const heroFor = (slug: string): ServiceHero => SERVICE_HERO[slug] ?? FALLBACK;
