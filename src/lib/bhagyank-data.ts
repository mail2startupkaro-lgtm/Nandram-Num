/**
 * Bhagyank (Destiny / Life Path Number) profiles, 1–9.
 * Bhagyank = every digit of the full date of birth added and reduced to one digit (15-08-1990 → 33 → 6).
 * Planet, colours, days and gemstone come from the same ruling-planet data as the Mulank pages;
 * compatibility comes from the engine's house friendship table, so pages and reports always agree.
 */
import { MULANK_COMPATIBILITY, relationOf, type Relation } from '@/lib/numerology/data/relations';
import { mulankFor } from './mulank-data';

export type BhagyankText = {
  title: string;
  tagline: string;
  intro: string;
  purpose: string;
  lessons: string[];
  strengths: string[];
  challenges: string[];
  career: string;
  relationships: string;
  money: string;
  spiritual: string;
  remedies: string[];
  /** Note about the master number that can sit behind this Bhagyank (11 → 2, 22 → 4, 33 → 6). */
  master?: string;
};

export type BhagyankProfile = BhagyankText & {
  n: number;
  planet: string;
  element: string;
  direction: string;
  luckyColors: string[];
  luckyDays: string[];
  gemstone: string;
  compatible: number[];
  avoid: number[];
};

const EN: Record<number, BhagyankText> = {
  1: {
    title: 'The Path of the Pioneer', tagline: 'Destiny asks you to lead, not to follow.',
    intro: 'When all the digits of your date of birth add up to 1, your Bhagyank is 1. Ruled by the Sun, your life keeps placing you at the front: starting things, taking charge and standing on your own feet. Fortune comes when you trust your own judgement and take the first step.',
    purpose: 'To develop independence, self-belief and leadership, and to use them to open new paths for others.',
    lessons: ['Lead with confidence but without ego', 'Accept help without feeling smaller', 'Finish what you start'],
    strengths: ['Initiative and courage', 'Clear decision-making', 'Original ideas', 'Strong willpower'],
    challenges: ['Pride and stubbornness', 'Loneliness at the top', 'Impatience with others', 'Rushing ahead without a plan'],
    career: 'Your own business, leadership roles, government, administration, politics, medicine and any field where you set the direction. Success usually grows after you take charge of your own work.',
    relationships: 'You need a partner who respects your independence and also tells you the truth. Share decisions at home instead of making them alone.',
    money: 'Money follows initiative. Earnings rise with responsibility and ownership; avoid investments made only to prove a point.',
    spiritual: 'Your growth comes from humility: realising that real strength serves others.',
    remedies: ['Offer water to the rising Sun', 'Respect your father and elders', 'Keep a regular wake-up time', 'Chant "Om Suryaya Namah" on Sundays'],
  },
  2: {
    title: 'The Path of Partnership', tagline: 'Destiny grows through harmony and trust.',
    intro: 'When your date of birth adds up to 2, your Bhagyank is 2. The Moon guides your life path, so your biggest wins come through people: partnerships, teams, family and patient cooperation. You succeed by connecting, not by competing.',
    purpose: 'To bring people together, to heal and support, and to learn that gentleness is a form of strength.',
    lessons: ['Trust your intuition', 'Set healthy boundaries', 'Make decisions without waiting for approval'],
    strengths: ['Diplomacy and tact', 'Intuition', 'Patience', 'Loyal partnership'],
    challenges: ['Indecision', 'Over-sensitivity', 'Mood swings', 'Depending on others for confidence'],
    career: 'Counselling, healthcare, teaching, hospitality, HR, art, music, liaison and partnership businesses. You do best with a trusted partner or team.',
    relationships: 'Marriage and partnership are central to your destiny. Choose a partner who is emotionally steady and say what you feel clearly.',
    money: 'Gains come through partnerships and steady saving. Avoid lending money only because you cannot say no.',
    spiritual: 'Meditation, devotion and time near water calm your mind and sharpen your intuition.',
    remedies: ['Respect your mother and offer her support', 'Keep water in a silver glass by your bed', 'Fast or eat light on Mondays', 'Chant "Om Chandraya Namah"'],
    master: 'If your total passes through 11 before reducing to 2, you carry master number 11: strong intuition, inspiration and a calling to guide or teach others.',
  },
  3: {
    title: 'The Path of Wisdom', tagline: 'Destiny rewards knowledge shared with joy.',
    intro: 'When your date of birth adds up to 3, your Bhagyank is 3. Jupiter, the planet of knowledge and blessings, guides your life. You rise through learning, teaching, advising and expressing yourself, and respect comes naturally when you share what you know.',
    purpose: 'To learn deeply, to guide others and to spread optimism, knowledge and good values.',
    lessons: ['Practise what you preach', 'Focus on fewer goals', 'Accept advice as well as giving it'],
    strengths: ['Wisdom and good judgement', 'Communication', 'Optimism', 'Respect from others'],
    challenges: ['Scattered energy', 'Over-confidence', 'Lecturing others', 'Over-spending on comforts'],
    career: 'Teaching, law, finance, banking, consulting, religion, writing, media, management and advisory roles.',
    relationships: 'Generous and protective. Avoid judging your partner; listen as much as you guide.',
    money: 'Fortunate with money over time, especially through knowledge and advice. Keep a budget for generosity.',
    spiritual: 'Respect for teachers and elders and regular study of good books bring blessings.',
    remedies: ['Respect teachers and gurus', 'Apply a little turmeric or saffron tilak', 'Donate yellow lentils on Thursdays', 'Chant "Om Gurave Namah"'],
  },
  4: {
    title: 'The Path of the Builder', tagline: 'Destiny is built brick by brick.',
    intro: 'When your date of birth adds up to 4, your Bhagyank is 4. Rahu guides your path, bringing sudden turns and unconventional ideas. Your life rewards hard work, systems and persistence: what you build slowly tends to last.',
    purpose: 'To create order, solid structures and practical solutions, and to stay steady through change.',
    lessons: ['Patience with slow results', 'Stay away from shortcuts', 'Adapt when plans change suddenly'],
    strengths: ['Discipline and hard work', 'Practical thinking', 'Reliability', 'Original problem-solving'],
    challenges: ['Sudden ups and downs', 'Rigidity', 'Arguments and rebellion', 'Overthinking and worry'],
    career: 'Engineering, technology, research, construction, manufacturing, accounts, law and fields that need systems or unusual thinking.',
    relationships: 'Loyal and dependable. Express affection in words, not only through duties.',
    money: 'Wealth grows through steady effort. Avoid speculation, gambling and quick-money schemes.',
    spiritual: 'Routine, honesty and service to the needy keep Rahu energy positive.',
    remedies: ['Keep your home and workplace clutter-free', 'Feed birds or stray dogs', 'Avoid alcohol and late nights', 'Chant "Om Rahave Namah"'],
    master: 'If your total passes through 22 before reducing to 4, you carry master number 22: the "master builder" who can turn big ideas into lasting work.',
  },
  5: {
    title: 'The Path of Freedom', tagline: 'Destiny moves with change and communication.',
    intro: 'When your date of birth adds up to 5, your Bhagyank is 5. Mercury guides your path, so your life is full of movement: travel, trade, new people and fresh ideas. You succeed by adapting quickly and communicating well.',
    purpose: 'To experience life fully, to connect ideas and people, and to use freedom responsibly.',
    lessons: ['Commit and finish', 'Balance freedom with responsibility', 'Avoid excess and impulsive choices'],
    strengths: ['Quick thinking', 'Excellent communication', 'Adaptability', 'Business sense'],
    challenges: ['Restlessness', 'Impulsive decisions', 'Inconsistency', 'Nervous stress'],
    career: 'Business, sales, marketing, media, travel, finance, IT, writing and any work with variety and people.',
    relationships: 'You need fun, space and good conversation. Keep promises so your partner feels secure.',
    money: 'Quick earnings and quick spending. Automate savings and avoid risky trading on impulse.',
    spiritual: 'Silence and breathing practice balance your busy mind.',
    remedies: ['Donate green vegetables on Wednesdays', 'Keep a green plant at your desk', 'Speak kindly to younger people', 'Chant "Om Budhaya Namah"'],
  },
  6: {
    title: 'The Path of Love and Responsibility', tagline: 'Destiny blossoms through care and beauty.',
    intro: 'When your date of birth adds up to 6, your Bhagyank is 6. Venus guides your path, bringing love, comfort, art and family. Your life asks you to care for others and to create beauty and harmony around you.',
    purpose: 'To nurture family and community, to create beauty and to balance giving with self-care.',
    lessons: ['Do not carry everyone else\'s burden', 'Love without controlling', 'Avoid perfectionism'],
    strengths: ['Caring nature', 'Artistic taste', 'Sense of duty', 'Natural charm'],
    challenges: ['Over-responsibility', 'Interference in others\' lives', 'Love of luxury', 'Worry about family'],
    career: 'Design, fashion, beauty, hospitality, interiors, arts, healthcare, teaching, counselling and luxury or family businesses.',
    relationships: 'Marriage and home are central to your destiny. Choose love that is equal and respect personal space.',
    money: 'Comforts come easily; savings need discipline. Spend on quality, not on show.',
    spiritual: 'Devotion, music and serving family and community bring inner peace.',
    remedies: ['Keep your home clean and fragrant', 'Respect women in the family', 'Donate white sweets or rice on Fridays', 'Chant "Om Shukraya Namah"'],
    master: 'If your total passes through 33 before reducing to 6, you carry master number 33: the "master teacher" of compassion, called to serve and uplift others.',
  },
  7: {
    title: 'The Path of the Seeker', tagline: 'Destiny reveals itself through inner wisdom.',
    intro: 'When your date of birth adds up to 7, your Bhagyank is 7. Ketu guides your path, turning your attention inward: research, spirituality and deep understanding. Your life rewards study, intuition and trust in a higher plan.',
    purpose: 'To search for truth, develop wisdom and share insight that others cannot easily see.',
    lessons: ['Trust people and life a little more', 'Turn ideas into action', 'Stay connected instead of isolating'],
    strengths: ['Deep thinking', 'Intuition', 'Research ability', 'Spiritual insight'],
    challenges: ['Isolation', 'Secretiveness', 'Doubt and over-analysis', 'Detachment from practical matters'],
    career: 'Research, science, technology, analysis, healing, astrology and numerology, spirituality, writing and specialised consulting.',
    relationships: 'You need space and a partner who respects your inner world. Share your thoughts openly.',
    money: 'Income often comes through expertise. Keep practical financial plans instead of leaving things to chance.',
    spiritual: 'Meditation and spiritual practice are your strongest support.',
    remedies: ['Meditate daily', 'Feed street dogs', 'Keep a regular routine', 'Chant "Om Ketave Namah"'],
  },
  8: {
    title: 'The Path of Karma and Achievement', tagline: 'Destiny pays back every honest effort.',
    intro: 'When your date of birth adds up to 8, your Bhagyank is 8. Saturn guides your path: slow, steady and fair. Success may come later than for others, but it is solid and lasting when built on discipline, patience and honesty.',
    purpose: 'To achieve through perseverance, to handle power and money responsibly and to stand for justice.',
    lessons: ['Patience with delays', 'Honesty in every deal', 'Do not hold on to bitterness'],
    strengths: ['Endurance', 'Organisation and management', 'Practical ambition', 'Sense of justice'],
    challenges: ['Delays and obstacles', 'Pessimism', 'Workaholism', 'Emotional coldness'],
    career: 'Management, administration, law, finance, real estate, mining, oil, industry, government and large organisations.',
    relationships: 'Loyal and serious. Show warmth openly and make time for family away from work.',
    money: 'Wealth builds slowly and can become large. Avoid shortcuts; stay disciplined with debt.',
    spiritual: 'Serving workers, the elderly and the poor balances Saturn\'s karma.',
    remedies: ['Help elderly people and workers', 'Donate black sesame or mustard oil on Saturdays', 'Avoid alcohol and dishonest dealings', 'Chant "Om Shanaischaraya Namah"'],
  },
  9: {
    title: 'The Path of Service and Courage', tagline: 'Destiny calls you to fight for a cause.',
    intro: 'When your date of birth adds up to 9, your Bhagyank is 9. Mars guides your path, giving energy, courage and a generous heart. Your life rewards bold action, protecting others and working for something bigger than yourself.',
    purpose: 'To serve, protect and inspire, and to turn energy and courage into compassionate action.',
    lessons: ['Control anger', 'Let go of the past', 'Act with patience as well as courage'],
    strengths: ['Courage', 'Energy and drive', 'Generosity', 'Leadership in crisis'],
    challenges: ['Temper and impatience', 'Impulsive conflicts', 'Accidents from haste', 'Burnout'],
    career: 'Defence, police, sports, surgery, engineering, real estate, social work, NGOs, politics and leadership in action-oriented fields.',
    relationships: 'Passionate and protective. Pause before reacting and say sorry easily.',
    money: 'Earns through effort and boldness. Avoid rash investments made in excitement or anger.',
    spiritual: 'Selfless service and physical discipline channel your energy positively.',
    remedies: ['Donate red lentils on Tuesdays', 'Exercise or practise yoga daily', 'Serve a social cause', 'Chant "Om Mangalaya Namah"'],
  },
};

const HI: Record<number, BhagyankText> = {
  1: {
    title: 'अग्रणी का मार्ग', tagline: 'भाग्य आपको नेतृत्व के लिए कहता है, अनुसरण के लिए नहीं।',
    intro: 'जब आपकी जन्म तिथि के सभी अंक जोड़ने पर 1 आता है, तब आपका भाग्यांक 1 होता है। इसके स्वामी सूर्य हैं, इसलिए जीवन आपको बार-बार आगे खड़ा करता है: नई शुरुआत करना, ज़िम्मेदारी लेना और अपने पैरों पर खड़े होना। जब आप अपने निर्णय पर भरोसा करके पहला क़दम उठाते हैं, तब भाग्य साथ देता है।',
    purpose: 'स्वतंत्रता, आत्मविश्वास और नेतृत्व विकसित करना, और उनसे दूसरों के लिए नए रास्ते खोलना।',
    lessons: ['अहंकार के बिना आत्मविश्वास से नेतृत्व करें', 'मदद लेने में संकोच न करें', 'जो शुरू करें, उसे पूरा करें'],
    strengths: ['पहल और साहस', 'स्पष्ट निर्णय क्षमता', 'मौलिक विचार', 'दृढ़ इच्छाशक्ति'],
    challenges: ['अभिमान और ज़िद', 'ऊँचाई पर अकेलापन', 'दूसरों के प्रति अधीरता', 'बिना योजना के जल्दबाज़ी'],
    career: 'अपना व्यवसाय, नेतृत्व की भूमिकाएँ, सरकारी सेवा, प्रशासन, राजनीति, चिकित्सा और हर वह क्षेत्र जहाँ दिशा आप तय करें। प्रायः अपना काम स्वयं संभालने के बाद सफलता तेज़ी से बढ़ती है।',
    relationships: 'आपको ऐसा जीवनसाथी चाहिए जो आपकी स्वतंत्रता का सम्मान करे और सच भी कहे। घर के निर्णय अकेले नहीं, मिलकर लें।',
    money: 'धन पहल के पीछे आता है। ज़िम्मेदारी और स्वामित्व के साथ आय बढ़ती है; केवल कुछ साबित करने के लिए निवेश न करें।',
    spiritual: 'आपकी उन्नति विनम्रता से होती है: यह समझना कि सच्ची शक्ति दूसरों की सेवा करती है।',
    remedies: ['उगते सूर्य को जल अर्पित करें', 'पिता और बड़ों का सम्मान करें', 'रोज़ एक निश्चित समय पर उठें', 'रविवार को "ॐ सूर्याय नमः" का जाप करें'],
  },
  2: {
    title: 'साझेदारी का मार्ग', tagline: 'भाग्य सामंजस्य और विश्वास से बढ़ता है।',
    intro: 'जब आपकी जन्म तिथि का योग 2 आता है, तब आपका भाग्यांक 2 होता है। आपके जीवन-पथ के मार्गदर्शक चंद्र हैं, इसलिए सबसे बड़ी सफलताएँ लोगों के माध्यम से मिलती हैं: साझेदारी, टीम, परिवार और धैर्यपूर्ण सहयोग। आप प्रतिस्पर्धा से नहीं, जुड़ाव से आगे बढ़ते हैं।',
    purpose: 'लोगों को जोड़ना, सहारा देना और यह सीखना कि कोमलता भी एक शक्ति है।',
    lessons: ['अपनी अंतर्ज्ञान पर भरोसा करें', 'स्वस्थ सीमाएँ तय करें', 'दूसरों की स्वीकृति का इंतज़ार किए बिना निर्णय लें'],
    strengths: ['कूटनीति और व्यवहार-कुशलता', 'अंतर्ज्ञान', 'धैर्य', 'वफ़ादार साझेदारी'],
    challenges: ['अनिर्णय', 'अति-संवेदनशीलता', 'मनोदशा में उतार-चढ़ाव', 'आत्मविश्वास के लिए दूसरों पर निर्भरता'],
    career: 'परामर्श, स्वास्थ्य सेवा, शिक्षण, आतिथ्य, HR, कला, संगीत, संपर्क-कार्य और साझेदारी वाले व्यवसाय। विश्वसनीय साथी या टीम के साथ आप सबसे अच्छा करते हैं।',
    relationships: 'विवाह और साझेदारी आपके भाग्य का केंद्र हैं। भावनात्मक रूप से स्थिर साथी चुनें और अपनी भावनाएँ स्पष्ट कहें।',
    money: 'लाभ साझेदारी और नियमित बचत से आता है। केवल "ना" न कह पाने के कारण पैसा उधार न दें।',
    spiritual: 'ध्यान, भक्ति और जल के पास समय बिताना मन को शांत और अंतर्ज्ञान को तेज़ करता है।',
    remedies: ['माता का सम्मान करें और उनका सहयोग करें', 'सोते समय चाँदी के गिलास में जल पास रखें', 'सोमवार को व्रत या हल्का भोजन करें', '"ॐ चन्द्राय नमः" का जाप करें'],
    master: 'यदि 2 बनने से पहले आपका योग 11 से होकर गुज़रता है, तो आपके पास मास्टर अंक 11 है: प्रबल अंतर्ज्ञान, प्रेरणा और दूसरों का मार्गदर्शन करने या सिखाने की पुकार।',
  },
  3: {
    title: 'ज्ञान का मार्ग', tagline: 'भाग्य प्रसन्नता से बाँटे गए ज्ञान को पुरस्कृत करता है।',
    intro: 'जब आपकी जन्म तिथि का योग 3 आता है, तब आपका भाग्यांक 3 होता है। ज्ञान और आशीर्वाद के ग्रह गुरु (बृहस्पति) आपके जीवन का मार्गदर्शन करते हैं। आप सीखने, सिखाने, सलाह देने और स्वयं को व्यक्त करने से आगे बढ़ते हैं, और जो जानते हैं उसे बाँटने पर सम्मान स्वाभाविक रूप से मिलता है।',
    purpose: 'गहराई से सीखना, दूसरों का मार्गदर्शन करना और आशावाद, ज्ञान व अच्छे संस्कार फैलाना।',
    lessons: ['जो सिखाएँ, वही आचरण करें', 'कम लक्ष्यों पर ध्यान केंद्रित करें', 'सलाह देने के साथ सलाह लेना भी सीखें'],
    strengths: ['बुद्धिमत्ता और सही निर्णय', 'संवाद-कौशल', 'आशावाद', 'दूसरों से मिलने वाला सम्मान'],
    challenges: ['बिखरी हुई ऊर्जा', 'अति-आत्मविश्वास', 'दूसरों को उपदेश देना', 'सुख-सुविधाओं पर अधिक ख़र्च'],
    career: 'शिक्षण, क़ानून, वित्त, बैंकिंग, परामर्श, धर्म, लेखन, मीडिया, प्रबंधन और सलाहकार की भूमिकाएँ।',
    relationships: 'उदार और रक्षक स्वभाव। साथी को परखने से बचें; जितना मार्गदर्शन करें, उतना सुनें भी।',
    money: 'समय के साथ धन में भाग्यशाली, विशेषकर ज्ञान और सलाह के माध्यम से। उदारता के लिए भी बजट रखें।',
    spiritual: 'गुरुओं और बड़ों का सम्मान तथा अच्छी पुस्तकों का नियमित अध्ययन आशीर्वाद लाता है।',
    remedies: ['गुरुओं और शिक्षकों का सम्मान करें', 'हल्दी या केसर का तिलक लगाएँ', 'गुरुवार को चने की दाल का दान करें', '"ॐ गुरवे नमः" का जाप करें'],
  },
  4: {
    title: 'निर्माता का मार्ग', tagline: 'भाग्य ईंट-दर-ईंट बनता है।',
    intro: 'जब आपकी जन्म तिथि का योग 4 आता है, तब आपका भाग्यांक 4 होता है। राहु आपके मार्ग का मार्गदर्शन करता है, जिससे अचानक मोड़ और लीक से हटकर विचार आते हैं। आपका जीवन कड़ी मेहनत, व्यवस्था और दृढ़ता को पुरस्कृत करता है: जो आप धीरे-धीरे बनाते हैं, वह टिकता है।',
    purpose: 'व्यवस्था, मज़बूत ढाँचे और व्यावहारिक समाधान बनाना, और बदलाव के बीच स्थिर रहना।',
    lessons: ['धीमे परिणामों पर धैर्य रखें', 'शॉर्टकट से दूर रहें', 'योजना अचानक बदले तो ढल जाएँ'],
    strengths: ['अनुशासन और परिश्रम', 'व्यावहारिक सोच', 'विश्वसनीयता', 'मौलिक समस्या-समाधान'],
    challenges: ['अचानक उतार-चढ़ाव', 'कठोरता', 'वाद-विवाद और विद्रोह', 'अधिक सोचना और चिंता'],
    career: 'इंजीनियरिंग, तकनीक, शोध, निर्माण, उत्पादन, लेखा, क़ानून और वे क्षेत्र जहाँ व्यवस्था या अलग सोच चाहिए।',
    relationships: 'वफ़ादार और भरोसेमंद। स्नेह केवल कर्तव्यों से नहीं, शब्दों से भी व्यक्त करें।',
    money: 'धन लगातार प्रयास से बढ़ता है। सट्टा, जुआ और जल्दी पैसा कमाने की योजनाओं से बचें।',
    spiritual: 'दिनचर्या, ईमानदारी और ज़रूरतमंदों की सेवा राहु की ऊर्जा को सकारात्मक रखती है।',
    remedies: ['घर और कार्यस्थल को अव्यवस्था से मुक्त रखें', 'पक्षियों या बेसहारा कुत्तों को भोजन दें', 'शराब और देर रात से बचें', '"ॐ राहवे नमः" का जाप करें'],
    master: 'यदि 4 बनने से पहले आपका योग 22 से होकर गुज़रता है, तो आपके पास मास्टर अंक 22 है: "मास्टर बिल्डर", जो बड़े विचारों को स्थायी कार्य में बदल सकता है।',
  },
  5: {
    title: 'स्वतंत्रता का मार्ग', tagline: 'भाग्य परिवर्तन और संवाद के साथ चलता है।',
    intro: 'जब आपकी जन्म तिथि का योग 5 आता है, तब आपका भाग्यांक 5 होता है। बुध आपके मार्ग के मार्गदर्शक हैं, इसलिए जीवन गतिशीलता से भरा रहता है: यात्रा, व्यापार, नए लोग और नए विचार। आप जल्दी ढलकर और अच्छे संवाद से सफल होते हैं।',
    purpose: 'जीवन का पूरा अनुभव करना, विचारों और लोगों को जोड़ना, और स्वतंत्रता का ज़िम्मेदारी से उपयोग करना।',
    lessons: ['प्रतिबद्ध रहें और काम पूरा करें', 'स्वतंत्रता और ज़िम्मेदारी में संतुलन रखें', 'अति और आवेग में लिए निर्णयों से बचें'],
    strengths: ['तेज़ सोच', 'उत्कृष्ट संवाद', 'अनुकूलन क्षमता', 'व्यापारिक समझ'],
    challenges: ['बेचैनी', 'आवेग में निर्णय', 'अस्थिरता', 'घबराहट और तनाव'],
    career: 'व्यापार, सेल्स, मार्केटिंग, मीडिया, यात्रा, वित्त, IT, लेखन और विविधता व लोगों से जुड़ा कोई भी काम।',
    relationships: 'आपको आनंद, स्पेस और अच्छी बातचीत चाहिए। वादे निभाएँ ताकि साथी सुरक्षित महसूस करे।',
    money: 'जल्दी कमाई और जल्दी ख़र्च। बचत स्वचालित करें और आवेग में जोखिम भरी ट्रेडिंग से बचें।',
    spiritual: 'मौन और प्राणायाम आपके व्यस्त मन को संतुलित करते हैं।',
    remedies: ['बुधवार को हरी सब्ज़ियों का दान करें', 'अपनी डेस्क पर हरा पौधा रखें', 'छोटों से प्रेम से बात करें', '"ॐ बुधाय नमः" का जाप करें'],
  },
  6: {
    title: 'प्रेम और उत्तरदायित्व का मार्ग', tagline: 'भाग्य देखभाल और सौंदर्य से खिलता है।',
    intro: 'जब आपकी जन्म तिथि का योग 6 आता है, तब आपका भाग्यांक 6 होता है। शुक्र आपके मार्ग के मार्गदर्शक हैं, जो प्रेम, सुख-सुविधा, कला और परिवार लाते हैं। जीवन आपसे दूसरों की देखभाल करने और अपने आसपास सौंदर्य व सामंजस्य बनाने को कहता है।',
    purpose: 'परिवार और समाज का पोषण करना, सौंदर्य रचना और देने व अपनी देखभाल में संतुलन रखना।',
    lessons: ['हर किसी का बोझ स्वयं न उठाएँ', 'नियंत्रण के बिना प्रेम करें', 'पूर्णतावाद से बचें'],
    strengths: ['देखभाल करने वाला स्वभाव', 'कलात्मक रुचि', 'कर्तव्य-बोध', 'स्वाभाविक आकर्षण'],
    challenges: ['अति-उत्तरदायित्व', 'दूसरों के जीवन में दख़ल', 'विलासिता का मोह', 'परिवार की चिंता'],
    career: 'डिज़ाइन, फ़ैशन, ब्यूटी, आतिथ्य, इंटीरियर, कला, स्वास्थ्य सेवा, शिक्षण, परामर्श और लग्ज़री या पारिवारिक व्यवसाय।',
    relationships: 'विवाह और घर आपके भाग्य का केंद्र हैं। बराबरी वाला प्रेम चुनें और व्यक्तिगत स्पेस का सम्मान करें।',
    money: 'सुख-सुविधाएँ आसानी से आती हैं; बचत के लिए अनुशासन चाहिए। दिखावे पर नहीं, गुणवत्ता पर ख़र्च करें।',
    spiritual: 'भक्ति, संगीत और परिवार व समाज की सेवा आंतरिक शांति देती है।',
    remedies: ['घर को साफ़ और सुगंधित रखें', 'परिवार की महिलाओं का सम्मान करें', 'शुक्रवार को सफ़ेद मिठाई या चावल का दान करें', '"ॐ शुक्राय नमः" का जाप करें'],
    master: 'यदि 6 बनने से पहले आपका योग 33 से होकर गुज़रता है, तो आपके पास मास्टर अंक 33 है: करुणा के "मास्टर टीचर", जिनकी पुकार दूसरों की सेवा और उत्थान है।',
  },
  7: {
    title: 'साधक का मार्ग', tagline: 'भाग्य आंतरिक ज्ञान से प्रकट होता है।',
    intro: 'जब आपकी जन्म तिथि का योग 7 आता है, तब आपका भाग्यांक 7 होता है। केतु आपके मार्ग का मार्गदर्शन करता है और ध्यान भीतर की ओर ले जाता है: शोध, आध्यात्म और गहरी समझ। आपका जीवन अध्ययन, अंतर्ज्ञान और एक उच्च योजना पर विश्वास को पुरस्कृत करता है।',
    purpose: 'सत्य की खोज करना, ज्ञान विकसित करना और वह अंतर्दृष्टि बाँटना जो दूसरे आसानी से नहीं देख पाते।',
    lessons: ['लोगों और जीवन पर थोड़ा अधिक भरोसा करें', 'विचारों को कर्म में बदलें', 'अलग-थलग होने के बजाय जुड़े रहें'],
    strengths: ['गहन चिंतन', 'अंतर्ज्ञान', 'शोध क्षमता', 'आध्यात्मिक अंतर्दृष्टि'],
    challenges: ['एकांतप्रियता', 'गोपनीयता', 'संदेह और अधिक विश्लेषण', 'व्यावहारिक बातों से दूरी'],
    career: 'शोध, विज्ञान, तकनीक, विश्लेषण, उपचार, ज्योतिष और अंक ज्योतिष, आध्यात्म, लेखन और विशेषज्ञ परामर्श।',
    relationships: 'आपको स्पेस और ऐसा साथी चाहिए जो आपकी आंतरिक दुनिया का सम्मान करे। अपने विचार खुलकर साझा करें।',
    money: 'आय प्रायः विशेषज्ञता से आती है। चीज़ें भाग्य पर छोड़ने के बजाय व्यावहारिक वित्तीय योजना रखें।',
    spiritual: 'ध्यान और आध्यात्मिक साधना आपका सबसे मज़बूत सहारा हैं।',
    remedies: ['रोज़ ध्यान करें', 'गली के कुत्तों को भोजन दें', 'नियमित दिनचर्या रखें', '"ॐ केतवे नमः" का जाप करें'],
  },
  8: {
    title: 'कर्म और उपलब्धि का मार्ग', tagline: 'भाग्य हर ईमानदार प्रयास का फल देता है।',
    intro: 'जब आपकी जन्म तिथि का योग 8 आता है, तब आपका भाग्यांक 8 होता है। शनि आपके मार्ग के मार्गदर्शक हैं: धीमे, स्थिर और न्यायप्रिय। सफलता दूसरों की तुलना में देर से आ सकती है, पर अनुशासन, धैर्य और ईमानदारी पर बनी हो तो वह ठोस और स्थायी होती है।',
    purpose: 'लगन से उपलब्धि पाना, शक्ति और धन को ज़िम्मेदारी से संभालना और न्याय के पक्ष में खड़े रहना।',
    lessons: ['देरी पर धैर्य रखें', 'हर सौदे में ईमानदारी रखें', 'कड़वाहट को मन में न रखें'],
    strengths: ['सहनशक्ति', 'संगठन और प्रबंधन', 'व्यावहारिक महत्वाकांक्षा', 'न्याय-बोध'],
    challenges: ['देरी और बाधाएँ', 'निराशावाद', 'काम में डूबे रहना', 'भावनात्मक रूखापन'],
    career: 'प्रबंधन, प्रशासन, क़ानून, वित्त, रियल एस्टेट, खनन, तेल, उद्योग, सरकारी सेवा और बड़े संगठन।',
    relationships: 'वफ़ादार और गंभीर। स्नेह खुलकर व्यक्त करें और काम से हटकर परिवार को समय दें।',
    money: 'धन धीरे-धीरे बनता है और बड़ा हो सकता है। शॉर्टकट से बचें; क़र्ज़ में अनुशासन रखें।',
    spiritual: 'श्रमिकों, बुज़ुर्गों और ग़रीबों की सेवा शनि के कर्म को संतुलित करती है।',
    remedies: ['बुज़ुर्गों और श्रमिकों की सहायता करें', 'शनिवार को काले तिल या सरसों के तेल का दान करें', 'शराब और बेईमानी से दूर रहें', '"ॐ शनैश्चराय नमः" का जाप करें'],
  },
  9: {
    title: 'सेवा और साहस का मार्ग', tagline: 'भाग्य आपको किसी उद्देश्य के लिए लड़ने को पुकारता है।',
    intro: 'जब आपकी जन्म तिथि का योग 9 आता है, तब आपका भाग्यांक 9 होता है। मंगल आपके मार्ग के मार्गदर्शक हैं, जो ऊर्जा, साहस और उदार हृदय देते हैं। आपका जीवन साहसिक कर्म, दूसरों की रक्षा और स्वयं से बड़े उद्देश्य के लिए काम करने को पुरस्कृत करता है।',
    purpose: 'सेवा करना, रक्षा करना और प्रेरित करना, और ऊर्जा व साहस को करुणामय कर्म में बदलना।',
    lessons: ['क्रोध पर नियंत्रण रखें', 'अतीत को छोड़ दें', 'साहस के साथ धैर्य से भी काम लें'],
    strengths: ['साहस', 'ऊर्जा और लगन', 'उदारता', 'संकट में नेतृत्व'],
    challenges: ['क्रोध और अधीरता', 'आवेग में टकराव', 'जल्दबाज़ी से दुर्घटनाएँ', 'थकान और बर्नआउट'],
    career: 'रक्षा सेवा, पुलिस, खेल, सर्जरी, इंजीनियरिंग, रियल एस्टेट, समाज सेवा, NGO, राजनीति और कर्म-प्रधान क्षेत्रों में नेतृत्व।',
    relationships: 'जोशीले और रक्षक। प्रतिक्रिया देने से पहले रुकें और सहजता से क्षमा माँगें।',
    money: 'मेहनत और साहस से कमाई होती है। उत्साह या क्रोध में जल्दबाज़ी के निवेश से बचें।',
    spiritual: 'निःस्वार्थ सेवा और शारीरिक अनुशासन आपकी ऊर्जा को सकारात्मक दिशा देते हैं।',
    remedies: ['मंगलवार को मसूर दाल का दान करें', 'रोज़ व्यायाम या योग करें', 'किसी सामाजिक कार्य में सेवा दें', '"ॐ मंगलाय नमः" का जाप करें'],
  },
};

export const BHAGYANK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function bhagyankFor(n: number, lang: 'en' | 'hi'): BhagyankProfile | undefined {
  const text = (lang === 'hi' ? HI : EN)[n];
  const m = mulankFor(n, lang);
  if (!text || !m) return undefined;
  return {
    ...text, n,
    planet: m.planet, element: m.element, direction: m.direction,
    luckyColors: m.luckyColors, luckyDays: m.luckyDays, gemstone: m.gemstone,
    ...MULANK_COMPATIBILITY[n],
  };
}

/** How a Mulank (1–9) combines with this Bhagyank, read both ways from the house friendship table. */
export function mulankBhagyankCombo(mulank: number, bhagyank: number): { rel: Relation; back: Relation; verdict: 'excellent' | 'good' | 'mixed' | 'challenging' } {
  const rel = relationOf(mulank, bhagyank);
  const back = relationOf(bhagyank, mulank);
  const score = [rel, back].reduce((a, r) => a + (r === 'friend' ? 1 : r === 'enemy' ? -1 : 0), 0);
  const verdict = mulank === bhagyank || score === 2 ? 'excellent' : score === 1 ? 'good' : score === 0 ? 'mixed' : 'challenging';
  return { rel, back, verdict };
}
