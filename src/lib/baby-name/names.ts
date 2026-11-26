/**
 * Curated bank of Indian baby names used by the Baby Name Analysis tool to suggest names.
 * g: b = boy, g = girl, u = either. hi = name in Devanagari. en / hm = short meaning in English / Hindi.
 * Spellings are the common English spellings – the tool also scores spelling tweaks.
 */
export type NameGender = 'b' | 'g' | 'u';
export interface BankName { n: string; g: NameGender; hi: string; en: string; hm: string }

const B = (n: string, hi: string, en: string, hm: string): BankName => ({ n, g: 'b', hi, en, hm });
const G = (n: string, hi: string, en: string, hm: string): BankName => ({ n, g: 'g', hi, en, hm });
const U = (n: string, hi: string, en: string, hm: string): BankName => ({ n, g: 'u', hi, en, hm });

export const NAME_BANK: BankName[] = [
  // ---------- Boys ----------
  B('Aarav', 'आरव', 'Peaceful, calm', 'शांत'), B('Aadi', 'आदि', 'The beginning', 'आरंभ'), B('Aditya', 'आदित्य', 'The Sun', 'सूर्य'),
  B('Advait', 'अद्वैत', 'Unique, one of a kind', 'अद्वितीय'), B('Agastya', 'अगस्त्य', 'A great sage', 'महान ऋषि'), B('Ajay', 'अजय', 'Unconquerable', 'अजेय'),
  B('Akash', 'आकाश', 'The sky', 'आकाश'), B('Amar', 'अमर', 'Immortal', 'अमर'), B('Anant', 'अनंत', 'Infinite', 'अनंत'),
  B('Anay', 'अनय', 'Lord Ganesha', 'भगवान गणेश'), B('Anirudh', 'अनिरुद्ध', 'Unstoppable', 'जिसे रोका न जा सके'), B('Arjun', 'अर्जुन', 'Bright, shining', 'उज्ज्वल'),
  B('Arnav', 'अर्णव', 'The ocean', 'समुद्र'), B('Aryan', 'आर्यन', 'Noble', 'श्रेष्ठ'), B('Atharv', 'अथर्व', 'Lord Ganesha; first Veda', 'गणेश; अथर्ववेद'),
  B('Ayaan', 'अयान', 'Gift of God', 'ईश्वर का उपहार'), B('Ayush', 'आयुष', 'Long life', 'दीर्घायु'), B('Bhavya', 'भव्य', 'Grand', 'भव्य'),
  B('Chirag', 'चिराग', 'Lamp', 'दीपक'), B('Daksh', 'दक्ष', 'Skilful', 'कुशल'), B('Darsh', 'दर्श', 'Sight, vision', 'दर्शन'),
  B('Dev', 'देव', 'Divine', 'दिव्य'), B('Dhruv', 'ध्रुव', 'Pole star, steady', 'ध्रुव तारा, अटल'), B('Divyansh', 'दिव्यांश', 'Part of the divine', 'ईश्वर का अंश'),
  B('Eshan', 'ईशान', 'Lord Shiva', 'भगवान शिव'), B('Gaurav', 'गौरव', 'Pride, honour', 'सम्मान'), B('Hardik', 'हार्दिक', 'Heartfelt', 'हृदय से'),
  B('Harsh', 'हर्ष', 'Joy', 'प्रसन्नता'), B('Hrithik', 'ऋतिक', 'From the heart', 'हृदय से'), B('Ishaan', 'ईशान', 'Lord Shiva; north-east', 'भगवान शिव'),
  B('Jay', 'जय', 'Victory', 'विजय'), B('Kabir', 'कबीर', 'Great; the poet-saint', 'महान'), B('Kartik', 'कार्तिक', 'Son of Shiva', 'शिव पुत्र'),
  B('Kavish', 'कविश', 'King of poets', 'कवियों के राजा'), B('Krish', 'क्रिश', 'Lord Krishna', 'श्रीकृष्ण'), B('Kunal', 'कुणाल', 'Lotus', 'कमल'),
  B('Laksh', 'लक्ष', 'Aim, target', 'लक्ष्य'), B('Lakshay', 'लक्षय', 'Goal', 'लक्ष्य'), B('Madhav', 'माधव', 'Lord Krishna', 'श्रीकृष्ण'),
  B('Manan', 'मनन', 'Deep thought', 'चिंतन'), B('Mihir', 'मिहिर', 'The Sun', 'सूर्य'), B('Mohit', 'मोहित', 'Attractive', 'मनमोहक'),
  B('Naitik', 'नैतिक', 'Moral, ethical', 'नैतिक'), B('Neel', 'नील', 'Blue', 'नीला'), B('Nikhil', 'निखिल', 'Complete', 'संपूर्ण'),
  B('Om', 'ओम', 'The sacred sound', 'पवित्र ध्वनि'), B('Parth', 'पार्थ', 'Arjuna', 'अर्जुन'), B('Pranav', 'प्रणव', 'Om, sacred syllable', 'ओंकार'),
  B('Pratham', 'प्रथम', 'First', 'पहला'), B('Rahul', 'राहुल', 'Efficient', 'कुशल'), B('Raghav', 'राघव', 'Lord Rama', 'श्रीराम'),
  B('Reyansh', 'रेयांश', 'Ray of light', 'प्रकाश की किरण'), B('Rishi', 'ऋषि', 'Sage', 'ऋषि'), B('Rohan', 'रोहन', 'Ascending', 'ऊपर उठने वाला'),
  B('Rudra', 'रुद्र', 'Lord Shiva', 'भगवान शिव'), B('Sahil', 'साहिल', 'Shore', 'किनारा'), B('Samarth', 'समर्थ', 'Capable', 'सक्षम'),
  B('Sarthak', 'सार्थक', 'Meaningful', 'सार्थक'), B('Shaurya', 'शौर्य', 'Bravery', 'वीरता'), B('Shivansh', 'शिवांश', 'Part of Shiva', 'शिव का अंश'),
  B('Shlok', 'श्लोक', 'Sacred verse', 'पवित्र छंद'), B('Siddharth', 'सिद्धार्थ', 'One who achieves his goal', 'जिसने लक्ष्य पाया'), B('Sohum', 'सोहम्', 'I am That', 'मैं वही हूँ'),
  B('Tanmay', 'तन्मय', 'Absorbed', 'लीन'), B('Tejas', 'तेजस', 'Brilliance', 'तेज'), B('Utkarsh', 'उत्कर्ष', 'Progress', 'उन्नति'),
  B('Vansh', 'वंश', 'Lineage', 'वंश'), B('Ved', 'वेद', 'Sacred knowledge', 'पवित्र ज्ञान'), B('Vedant', 'वेदांत', 'Essence of the Vedas', 'वेदों का सार'),
  B('Vihaan', 'विहान', 'Dawn', 'भोर'), B('Viraj', 'विराज', 'Shining, splendid', 'तेजस्वी'), B('Vivaan', 'विवान', 'Full of life', 'जीवंत'),
  B('Vivek', 'विवेक', 'Wisdom', 'विवेक'), B('Yash', 'यश', 'Fame, success', 'यश'), B('Yuvan', 'युवान', 'Youthful', 'युवा'),
  B('Abhinav', 'अभिनव', 'New, innovative', 'नवीन'), B('Aniket', 'अनिकेत', 'Lord Shiva', 'भगवान शिव'), B('Devansh', 'देवांश', 'Part of God', 'देव का अंश'),
  B('Garv', 'गर्व', 'Pride', 'गर्व'), B('Harshit', 'हर्षित', 'Joyful', 'प्रसन्न'), B('Jivin', 'जीविन', 'Giving life', 'जीवन देने वाला'),
  B('Kiaan', 'कियान', 'Grace of God', 'ईश्वर की कृपा'), B('Mayank', 'मयंक', 'The Moon', 'चंद्रमा'), B('Nirav', 'नीरव', 'Quiet, calm', 'शांत'),
  B('Prateek', 'प्रतीक', 'Symbol', 'प्रतीक'), B('Rehaan', 'रेहान', 'Fragrant herb', 'सुगंधित'), B('Ritvik', 'ऋत्विक', 'Priest', 'पुरोहित'),
  B('Samar', 'समर', 'Battle; one who wins', 'युद्ध'), B('Shrey', 'श्रेय', 'Credit, merit', 'श्रेय'), B('Tanish', 'तनीश', 'Ambition', 'महत्त्वाकांक्षा'),
  B('Udit', 'उदित', 'Risen, awakened', 'उदित'), B('Yatharth', 'यथार्थ', 'Truth', 'सत्य'), B('Ishant', 'इशांत', 'Lord of peace', 'शांति के स्वामी'),
  B('Kanav', 'कणव', 'A sage', 'एक ऋषि'), B('Aarush', 'आरुष', 'First ray of the Sun', 'सूर्य की पहली किरण'), B('Hriday', 'हृदय', 'Heart', 'हृदय'),
  // ---------- Girls ----------
  G('Aadhya', 'आध्या', 'First power, Durga', 'प्रथम शक्ति'), G('Aanya', 'आन्या', 'Grace', 'कृपा'), G('Aarohi', 'आरोही', 'Rising musical note', 'स्वरों का आरोह'),
  G('Aditi', 'अदिति', 'Mother of the gods', 'देवमाता'), G('Advika', 'अद्विका', 'Unique', 'अद्वितीय'), G('Akshara', 'अक्षरा', 'Letter; eternal', 'अक्षर'),
  G('Ananya', 'अनन्या', 'One of a kind', 'अनोखी'), G('Anika', 'अनिका', 'Goddess Durga', 'माँ दुर्गा'), G('Anushka', 'अनुष्का', 'Grace', 'कृपा'),
  G('Avni', 'अवनि', 'The earth', 'पृथ्वी'), G('Bhavika', 'भाविका', 'Well-meaning', 'भाव से भरी'), G('Charvi', 'चार्वी', 'Beautiful', 'सुंदर'),
  G('Diya', 'दीया', 'Lamp', 'दीपक'), G('Disha', 'दिशा', 'Direction', 'दिशा'), G('Divya', 'दिव्या', 'Divine', 'दिव्य'),
  G('Esha', 'ईशा', 'Desire; goddess', 'इच्छा; देवी'), G('Gauri', 'गौरी', 'Goddess Parvati', 'माँ पार्वती'), G('Ira', 'इरा', 'Goddess Saraswati', 'माँ सरस्वती'),
  G('Ishani', 'ईशानी', 'Goddess Durga', 'माँ दुर्गा'), G('Ishita', 'ईशिता', 'Mastery, wealth', 'श्रेष्ठता'), G('Jiya', 'जिया', 'Heart', 'दिल'),
  G('Kavya', 'काव्या', 'Poetry', 'कविता'), G('Khushi', 'ख़ुशी', 'Happiness', 'ख़ुशी'), G('Kiara', 'कियारा', 'Bright', 'उज्ज्वल'),
  G('Kriti', 'कृति', 'Creation', 'रचना'), G('Lavanya', 'लावण्या', 'Grace, beauty', 'लावण्य'), G('Mahi', 'माही', 'The earth', 'धरती'),
  G('Meera', 'मीरा', 'Devotee of Krishna', 'कृष्ण भक्त'), G('Myra', 'मायरा', 'Beloved', 'प्रिय'), G('Naina', 'नैना', 'Eyes', 'आँखें'),
  G('Navya', 'नव्या', 'New, young', 'नई'), G('Nidhi', 'निधि', 'Treasure', 'ख़ज़ाना'), G('Nisha', 'निशा', 'Night', 'रात'),
  G('Pari', 'परी', 'Fairy', 'परी'), G('Pihu', 'पीहू', 'Sweet bird call', 'पक्षी की मधुर आवाज़'), G('Prisha', 'प्रिशा', 'Gift of God', 'ईश्वर का उपहार'),
  G('Riya', 'रिया', 'Singer', 'गायिका'), G('Saanvi', 'सान्वी', 'Goddess Lakshmi', 'माँ लक्ष्मी'), G('Sara', 'सारा', 'Pure', 'शुद्ध'),
  G('Shanaya', 'शनाया', 'First ray of the Sun', 'सूर्य की पहली किरण'), G('Shreya', 'श्रेया', 'Auspicious', 'शुभ'), G('Siya', 'सिया', 'Goddess Sita', 'माँ सीता'),
  G('Tanvi', 'तन्वी', 'Delicate', 'कोमल'), G('Tara', 'तारा', 'Star', 'तारा'), G('Trisha', 'तृषा', 'Wish', 'इच्छा'),
  G('Vanya', 'वान्या', 'Gracious gift', 'उपहार'), G('Vedika', 'वेदिका', 'Altar; knowledge', 'वेदी'), G('Vrinda', 'वृंदा', 'Tulsi', 'तुलसी'),
  G('Yashvi', 'यशवी', 'Famous', 'यशस्वी'), G('Zara', 'ज़ारा', 'Princess', 'राजकुमारी'), G('Aarya', 'आर्या', 'Noble; Goddess Durga', 'श्रेष्ठ; माँ दुर्गा'),
  G('Amaira', 'अमायरा', 'Princess', 'राजकुमारी'), G('Anvi', 'अन्वी', 'Goddess of the forest', 'वन की देवी'), G('Arya', 'आर्या', 'Noble', 'श्रेष्ठ'),
  G('Avika', 'अविका', 'Sun-like', 'सूर्य समान'), G('Bhoomi', 'भूमि', 'The earth', 'धरती'), G('Darshana', 'दर्शना', 'Vision', 'दर्शन'),
  G('Dhriti', 'धृति', 'Patience', 'धैर्य'), G('Garima', 'गरिमा', 'Dignity', 'गरिमा'), G('Hiral', 'हिरल', 'Bright, lustrous', 'चमकदार'),
  G('Isha', 'ईशा', 'Goddess', 'देवी'), G('Janvi', 'जान्वी', 'The Ganga', 'गंगा'), G('Kashvi', 'काश्वी', 'Shining', 'चमकती'),
  G('Mahika', 'महिका', 'Dew drop', 'ओस की बूँद'),
  G('Mishka', 'मिश्का', 'Gift of love', 'प्रेम का उपहार'), G('Nitya', 'नित्या', 'Eternal', 'शाश्वत'), G('Ojasvi', 'ओजस्वी', 'Bright, radiant', 'तेजस्वी'),
  G('Pranavi', 'प्रणवी', 'Goddess Parvati', 'माँ पार्वती'), G('Ridhi', 'रिद्धि', 'Prosperity', 'समृद्धि'), G('Ruhi', 'रूही', 'Soul', 'आत्मा'),
  G('Samaira', 'समायरा', 'Enchanting', 'मनमोहक'), G('Shivani', 'शिवानी', 'Goddess Parvati', 'माँ पार्वती'), G('Shruti', 'श्रुति', 'Sacred knowledge', 'वेद ज्ञान'),
  G('Swara', 'स्वरा', 'Musical note', 'स्वर'), G('Tisha', 'तिशा', 'Joy', 'ख़ुशी'), G('Urvi', 'उर्वी', 'The earth', 'पृथ्वी'),
  G('Vaani', 'वाणी', 'Speech; Saraswati', 'वाणी'), G('Yuvika', 'युविका', 'Young woman', 'युवती'), G('Inaya', 'इनाया', 'Kindness', 'दया'),
  G('Aashvi', 'आश्वी', 'Blessed', 'आशीर्वादित'), G('Hansika', 'हंसिका', 'Swan', 'हंसिनी'), G('Lakshmi', 'लक्ष्मी', 'Goddess of wealth', 'धन की देवी'),
  G('Mansi', 'मानसी', 'Of the mind; sweet', 'मन से'), G('Reet', 'रीत', 'Tradition', 'परंपरा'), G('Suhani', 'सुहानी', 'Pleasant', 'सुहानी'),
  G('Vaishnavi', 'वैष्णवी', 'Goddess Durga', 'माँ दुर्गा'), G('Kanak', 'कनक', 'Gold', 'सोना'), G('Shaivi', 'शैवी', 'Prosperity', 'समृद्धि'),
  // ---------- Either ----------
  U('Aarju', 'आरजू', 'Wish', 'इच्छा'), U('Akshat', 'अक्षत', 'Unbroken', 'अखंड'), U('Ami', 'अमी', 'Nectar', 'अमृत'),
  U('Kiran', 'किरण', 'Ray of light', 'किरण'), U('Noor', 'नूर', 'Light', 'प्रकाश'), U('Prem', 'प्रेम', 'Love', 'प्रेम'),
  U('Ravi', 'रवि', 'The Sun', 'सूर्य'), U('Tanu', 'तनु', 'Slender; body', 'तनु'),
  U('Shubh', 'शुभ', 'Auspicious', 'शुभ'), U('Anu', 'अनु', 'Atom; gracious', 'अणु'), U('Jyoti', 'ज्योति', 'Flame, light', 'ज्योति'),
];

/** Does the name start with one of the preferred letters / syllables ("A", "Sh", "Kr")? */
export function startsWithAny(name: string, prefixes: string[]): boolean {
  if (!prefixes.length) return true;
  const n = name.trim().toUpperCase();
  return prefixes.some((p) => p && n.startsWith(p.toUpperCase()));
}

/** "A, Sh / K" → ['A', 'SH', 'K'] (letters only, max 4 characters each, up to 10). */
export function parseLetters(raw: string | undefined): string[] {
  if (!raw) return [];
  const out = raw.split(/[\s,/|;]+/).map((x) => x.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4)).filter(Boolean);
  return [...new Set(out)].slice(0, 10);
}
