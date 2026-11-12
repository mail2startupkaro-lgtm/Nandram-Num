/**
 * The eight service landing pages in the header "Services" menu (English + Hindi).
 * Each page sells one service from the `services` table (fee, what's included and delivery come from Admin → Services),
 * and adds SEO content, a free tool where it helps, and FAQs.
 */
import type { CalcKind } from '@/lib/seo/calculators';

type L = { en: string; hi: string };
type LL = { en: string[]; hi: string[] };
export interface ServicePage {
  slug: string; serviceCode: string; menu: L; menuSub: L; title: string; description: string; h1: L; intro: LL; forWho: LL;
  calculator?: { kind: CalcKind; title: L }; related: { href: string; label: L }[]; faq: { en: [string, string]; hi: [string, string] }[];
}

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: 'personal-numerology-report', serviceCode: 'SVC_PERSONAL_REPORT',
    menu: { en: 'Personal Numerology Report', hi: 'व्यक्तिगत अंक ज्योतिष रिपोर्ट' }, menuSub: { en: 'Your full chart, read by Acharya Nandram', hi: 'आचार्य नंदराम द्वारा पढ़ा गया आपका पूरा चार्ट' },
    title: 'Personal Numerology Report by Acharya Nandram',
    description: 'Personal numerology report by Acharya Nandram: Moolank, Bhagyank, Lo Shu grid, name, mobile, year forecast and remedies, with answers to your questions.',
    h1: { en: 'Personal Numerology Report', hi: 'व्यक्तिगत अंक ज्योतिष रिपोर्ट' },
    intro: {
      en: ['Free calculators show single numbers. A personal report reads all of them together – your date of birth, name and mobile number – the way an experienced numerologist does in a consultation.', 'Acharya Nandram prepares the report himself, answers up to three questions you send, and gives remedies you can actually follow in daily life.'],
      hi: ['मुफ़्त कैलकुलेटर अलग-अलग अंक दिखाते हैं। व्यक्तिगत रिपोर्ट इन सबको एक साथ पढ़ती है – आपकी जन्म तिथि, नाम और मोबाइल नंबर – जैसे एक अनुभवी अंक ज्योतिषी परामर्श में करता है।', 'आचार्य नंदराम यह रिपोर्ट स्वयं तैयार करते हैं, आपके भेजे गए अधिकतम तीन प्रश्नों के उत्तर देते हैं और ऐसे उपाय बताते हैं जिन्हें आप दैनिक जीवन में सच में अपना सकें।'],
    },
    forWho: { en: ['You are at a crossroads in career, business or relationships', 'You want one clear document for yourself or a family member', 'You have tried free tools and want a deeper, personal reading', 'You prefer guidance in Hindi, English or Hinglish'], hi: ['आप करियर, व्यवसाय या रिश्तों में किसी मोड़ पर हैं', 'आप अपने या परिवार के किसी सदस्य के लिए एक स्पष्ट दस्तावेज़ चाहते हैं', 'आपने मुफ़्त टूल आज़माए हैं और गहरी, व्यक्तिगत रीडिंग चाहते हैं', 'आप हिंदी, अंग्रेज़ी या हिंग्लिश में मार्गदर्शन पसंद करते हैं'] },
    related: [{ href: '/reading', label: { en: 'Try the free online reading', hi: 'मुफ़्त ऑनलाइन रीडिंग आज़माएँ' } }, { href: '/pricing', label: { en: 'Complete Life Report PDF plans', hi: 'संपूर्ण जीवन रिपोर्ट PDF प्लान' } }],
    faq: [
      { en: ['How is this different from the Complete Life Report plan?', 'The Complete Life Report follows a standard format. The personal report is prepared by Acharya Nandram himself and answers your own questions.'], hi: ['यह संपूर्ण जीवन रिपोर्ट प्लान से कैसे अलग है?', 'संपूर्ण जीवन रिपोर्ट एक मानक प्रारूप में होती है। व्यक्तिगत रिपोर्ट आचार्य नंदराम स्वयं तैयार करते हैं और आपके अपने प्रश्नों के उत्तर देती है।'] },
      { en: ['Do I need my time of birth?', 'No. Numerology works from the date of birth and name. Time and place of birth are optional.'], hi: ['क्या जन्म समय ज़रूरी है?', 'नहीं। अंक ज्योतिष जन्म तिथि और नाम से काम करता है। जन्म समय और स्थान वैकल्पिक हैं।'] },
      { en: ['Can I order a report for a family member?', 'Yes. Enter their name and date of birth while booking; the report is prepared for them.'], hi: ['क्या मैं परिवार के किसी सदस्य के लिए रिपोर्ट मँगा सकता हूँ?', 'हाँ। बुकिंग के समय उनका नाम और जन्म तिथि दर्ज करें; रिपोर्ट उन्हीं के लिए तैयार होगी।'] },
    ],
  },
  {
    slug: 'name-numerology', serviceCode: 'SVC_NAME_CORRECTION',
    menu: { en: 'Name Numerology', hi: 'नाम अंक ज्योतिष' }, menuSub: { en: 'Name analysis and spelling guidance', hi: 'नाम विश्लेषण और वर्तनी मार्गदर्शन' },
    title: 'Name Numerology & Name Correction – Acharya Nandram',
    description: 'Name numerology and name correction by Acharya Nandram: Chaldean name analysis and lucky spellings that match your Moolank and Bhagyank. Free name check.',
    h1: { en: 'Name Numerology & Name Correction', hi: 'नाम अंक ज्योतिष और नाम सुधार' },
    intro: {
      en: ['The name you use every day carries a number. When that number is friendly with your Moolank and Bhagyank, your efforts meet less resistance; when it clashes, small changes in spelling can help.', 'Check your name for free below. For a corrected spelling that still looks natural on your signature, documents and social media, book a name correction with Acharya Nandram.'],
      hi: ['जो नाम आप हर दिन उपयोग करते हैं, उसका एक अंक होता है। जब यह अंक आपके मूलांक और भाग्यांक का मित्र होता है तो प्रयासों में कम बाधा आती है; टकराव होने पर वर्तनी में छोटे बदलाव मदद कर सकते हैं।', 'नीचे अपना नाम मुफ़्त जाँचें। ऐसी सुधारी हुई वर्तनी के लिए जो आपके हस्ताक्षर, दस्तावेज़ों और सोशल मीडिया पर स्वाभाविक लगे, आचार्य नंदराम से नाम सुधार बुक करें।'],
    },
    forWho: { en: ['Your name number clashes with your date of birth', 'You are changing your name after marriage', 'Your name is your brand: professionals, artists, creators', 'You feel stuck despite hard work'], hi: ['आपका नामांक आपकी जन्म तिथि से टकराता है', 'विवाह के बाद आप अपना नाम बदल रही हैं', 'आपका नाम ही आपका ब्रांड है: पेशेवर, कलाकार, क्रिएटर', 'मेहनत के बावजूद आप अटका हुआ महसूस करते हैं'] },
    calculator: { kind: 'name', title: { en: 'Free name number check', hi: 'मुफ़्त नामांक जाँच' } },
    related: [{ href: '/calculators/name-numerology-calculator', label: { en: 'Name numerology calculator', hi: 'नाम अंक ज्योतिष कैलकुलेटर' } }, { href: '/business-name-numerology', label: { en: 'Business name numerology', hi: 'व्यवसाय नाम अंक ज्योतिष' } }],
    faq: [
      { en: ['Do I have to change my name legally?', 'Usually not. Most people use the corrected spelling in their signature, email, social media and visiting cards. Legal change is optional.'], hi: ['क्या मुझे क़ानूनी रूप से नाम बदलना होगा?', 'आमतौर पर नहीं। अधिकतर लोग सुधारी हुई वर्तनी अपने हस्ताक्षर, ईमेल, सोशल मीडिया और विज़िटिंग कार्ड में उपयोग करते हैं। क़ानूनी बदलाव वैकल्पिक है।'] },
      { en: ['Which system do you use?', 'The Chaldean system for the name number, with the Pythagorean system as a second check.'], hi: ['आप कौन-सी पद्धति उपयोग करते हैं?', 'नामांक के लिए कैल्डियन पद्धति, और दूसरी जाँच के लिए पाइथागोरियन पद्धति।'] },
      { en: ['How many spelling options will I get?', 'Three corrected spellings with their numbers, and advice on which one to use where.'], hi: ['मुझे कितने वर्तनी विकल्प मिलेंगे?', 'अंकों सहित तीन सुधारी हुई वर्तनियाँ, और यह सलाह कि कौन-सी कहाँ उपयोग करें।'] },
    ],
  },
  {
    slug: 'lo-shu-grid', serviceCode: 'SVC_LOSHU',
    menu: { en: 'Lo Shu Grid Analysis', hi: 'लो शू ग्रिड विश्लेषण' }, menuSub: { en: 'Calculator and interpretation', hi: 'कैलकुलेटर और व्याख्या' },
    title: 'Lo Shu Grid Calculator & Analysis – Missing Numbers',
    description: 'Make your Lo Shu grid free from your date of birth, understand missing and repeated numbers, planes and Raj Yog, and get a detailed analysis with remedies.',
    h1: { en: 'Lo Shu Grid: Calculator & Analysis', hi: 'लो शू ग्रिड: कैलकुलेटर और विश्लेषण' },
    intro: {
      en: ['The Lo Shu grid is a 3 × 3 magic square. Your birth-date digits, Moolank, Bhagyank and Kua number are placed in it to show which energies you have in plenty and which are missing.', 'A missing number is not bad luck – it shows a quality to develop. Make your grid below for free, then book a detailed analysis for the meaning of your exact grid and remedies for each missing number.'],
      hi: ['लो शू ग्रिड एक 3 × 3 जादुई वर्ग है। आपकी जन्म तिथि के अंक, मूलांक, भाग्यांक और कुआ अंक इसमें रखे जाते हैं, जिससे पता चलता है कि कौन-सी ऊर्जाएँ भरपूर हैं और कौन-सी अनुपस्थित।', 'अनुपस्थित अंक दुर्भाग्य नहीं है – यह विकसित करने योग्य गुण बताता है। नीचे अपना ग्रिड मुफ़्त बनाएँ, फिर अपने सटीक ग्रिड के अर्थ और हर अनुपस्थित अंक के उपायों के लिए विस्तृत विश्लेषण बुक करें।'],
    },
    forWho: { en: ['You have several missing numbers in your grid', 'You have a number repeated three times or more', 'You want to know your planes, arrows and Raj Yog', 'You want practical remedies for missing numbers'], hi: ['आपके ग्रिड में कई अंक अनुपस्थित हैं', 'आपके ग्रिड में कोई अंक तीन या अधिक बार है', 'आप अपने प्लेन, तीर और राज योग जानना चाहते हैं', 'आप अनुपस्थित अंकों के व्यावहारिक उपाय चाहते हैं'] },
    calculator: { kind: 'loshu', title: { en: 'Make your Lo Shu grid (free)', hi: 'अपना लो शू ग्रिड बनाएँ (मुफ़्त)' } },
    related: [{ href: '/calculators/kua-number-calculator', label: { en: 'Kua number calculator', hi: 'कुआ अंक कैलकुलेटर' } }, { href: '/mulank', label: { en: 'Mulank 1–9 meanings', hi: 'मूलांक 1–9 के अर्थ' } }],
    faq: [
      { en: ['Which numbers go into the Lo Shu grid?', 'Every non-zero digit of your date of birth, plus your Moolank, Bhagyank and Kua number, as used in Indian numerology.'], hi: ['लो शू ग्रिड में कौन-से अंक जाते हैं?', 'आपकी जन्म तिथि का हर शून्य-रहित अंक, साथ में मूलांक, भाग्यांक और कुआ अंक, जैसा भारतीय अंक ज्योतिष में होता है।'] },
      { en: ['Is a missing number a problem?', 'It shows a quality that needs conscious effort. Simple remedies – colours, placements and habits – help balance it.'], hi: ['क्या अनुपस्थित अंक समस्या है?', 'यह ऐसा गुण दिखाता है जिसके लिए सचेत प्रयास चाहिए। रंग, वस्तुओं का स्थान और आदतें जैसे सरल उपाय इसे संतुलित करते हैं।'] },
      { en: ['What is Raj Yog in the Lo Shu grid?', 'A complete line of numbers (for example 2-5-8 or 4-5-6) that strengthens a particular area of life.'], hi: ['लो शू ग्रिड में राज योग क्या है?', 'अंकों की पूरी पंक्ति (जैसे 2-5-8 या 4-5-6) जो जीवन के किसी विशेष क्षेत्र को मज़बूत करती है।'] },
    ],
  },
  {
    slug: 'mobile-number-numerology', serviceCode: 'SVC_MOBILE_NUMBER',
    menu: { en: 'Mobile Number Numerology', hi: 'मोबाइल नंबर अंक ज्योतिष' }, menuSub: { en: 'Lucky mobile number selection', hi: 'शुभ मोबाइल नंबर चयन' },
    title: 'Lucky Mobile Number Numerology – Acharya Nandram',
    description: 'Lucky mobile number by date of birth: Acharya Nandram checks your total, digit pairs and last four digits and helps you choose a number that suits you.',
    h1: { en: 'Lucky Mobile Number Numerology', hi: 'शुभ मोबाइल नंबर अंक ज्योतिष' },
    intro: {
      en: ['You use your mobile number many times a day, and in business it is how clients reach you. Its total should be friendly with your Moolank and Bhagyank, and difficult digit pairs such as 4-8 are best avoided.', 'Check your current number for free below. For help choosing a new number – or choosing between numbers your operator offers – book a mobile number selection.'],
      hi: ['आप अपना मोबाइल नंबर दिन में कई बार उपयोग करते हैं, और व्यवसाय में ग्राहक इसी से आप तक पहुँचते हैं। इसका योग आपके मूलांक और भाग्यांक का मित्र होना चाहिए, और 4-8 जैसी कठिन अंक-जोड़ियों से बचना अच्छा है।', 'नीचे अपना वर्तमान नंबर मुफ़्त जाँचें। नया नंबर चुनने – या ऑपरेटर द्वारा दिए गए नंबरों में से चुनने – में मदद के लिए मोबाइल नंबर चयन बुक करें।'],
    },
    forWho: { en: ['You are buying a new SIM or business number', 'Your current number scored low in the free check', 'You run a business and clients call you on mobile', 'You want to compare a few numbers before choosing'], hi: ['आप नया सिम या व्यवसायिक नंबर ले रहे हैं', 'मुफ़्त जाँच में आपके वर्तमान नंबर का स्कोर कम आया', 'आप व्यवसाय चलाते हैं और ग्राहक आपको मोबाइल पर कॉल करते हैं', 'आप चुनने से पहले कुछ नंबरों की तुलना करना चाहते हैं'] },
    calculator: { kind: 'mobile', title: { en: 'Free mobile number check', hi: 'मुफ़्त मोबाइल नंबर जाँच' } },
    related: [{ href: '/calculators/vehicle-number-numerology', label: { en: 'Vehicle number numerology', hi: 'वाहन नंबर अंक ज्योतिष' } }, { href: '/calculators/house-number-numerology', label: { en: 'House number numerology', hi: 'मकान नंबर अंक ज्योतिष' } }],
    faq: [
      { en: ['Which part of the mobile number matters most?', 'The total of all ten digits, the digit pairs and the last four digits, all compared with your date of birth.'], hi: ['मोबाइल नंबर का कौन-सा हिस्सा सबसे महत्वपूर्ण है?', 'सभी दस अंकों का योग, अंक-जोड़ियाँ और अंतिम चार अंक – सबकी तुलना आपकी जन्म तिथि से।'] },
      { en: ['Should I change my number if it scores low?', 'Not always. If changing is difficult, remedies and a supportive second number can help. We advise case by case.'], hi: ['यदि स्कोर कम आए तो क्या नंबर बदल दूँ?', 'हमेशा नहीं। यदि बदलना कठिन हो तो उपाय और एक सहायक दूसरा नंबर मदद कर सकते हैं। हम हर स्थिति के अनुसार सलाह देते हैं।'] },
      { en: ['Can you check numbers I have shortlisted?', 'Yes. Send up to five numbers in the notes while booking and we will tell you the best one for you.'], hi: ['क्या आप मेरे चुने हुए नंबर जाँच सकते हैं?', 'हाँ। बुकिंग के समय टिप्पणी में अधिकतम पाँच नंबर भेजें, हम बताएँगे कि आपके लिए कौन-सा सबसे अच्छा है।'] },
    ],
  },
  {
    slug: 'baby-name-numerology', serviceCode: 'SVC_BABY_NAME',
    menu: { en: 'Baby Name Suggestion', hi: 'शिशु नाम सुझाव' }, menuSub: { en: 'Lucky names for your baby\'s date of birth', hi: 'शिशु की जन्म तिथि के अनुसार शुभ नाम' },
    title: 'Baby Name Numerology – Lucky Baby Names by DOB',
    description: 'Baby name suggestions by numerology: meaningful names whose numbers suit your baby\'s date of birth, in your preferred letters, by Acharya Nandram.',
    h1: { en: 'Baby Name Numerology', hi: 'शिशु नाम अंक ज्योतिष' },
    intro: {
      en: ['A name stays with a child for life. In numerology, a name whose number is friendly with the child\'s Moolank and Bhagyank supports confidence, health and growth.', 'Tell us the date of birth, your preferred starting letters or sounds and any family traditions. Acharya Nandram shortlists meaningful names that suit the numbers – and you choose.'],
      hi: ['नाम जीवनभर बच्चे के साथ रहता है। अंक ज्योतिष में ऐसा नाम जिसका अंक बच्चे के मूलांक और भाग्यांक का मित्र हो, आत्मविश्वास, स्वास्थ्य और विकास में सहायक होता है।', 'हमें जन्म तिथि, अपने पसंदीदा आरंभिक अक्षर या ध्वनियाँ और पारिवारिक परंपराएँ बताएँ। आचार्य नंदराम अंकों के अनुकूल अर्थपूर्ण नाम चुनते हैं – और अंतिम चयन आप करते हैं।'],
    },
    forWho: { en: ['Parents naming a newborn', 'Families following a starting-letter tradition', 'Parents who want a name that is modern and meaningful', 'Anyone checking a name already chosen'], hi: ['नवजात का नाम रखने वाले माता-पिता', 'आरंभिक अक्षर की परंपरा मानने वाले परिवार', 'आधुनिक और अर्थपूर्ण नाम चाहने वाले माता-पिता', 'पहले से चुना हुआ नाम जाँचने वाले'] },
    calculator: { kind: 'name', title: { en: 'Check a name you like (free)', hi: 'पसंदीदा नाम जाँचें (मुफ़्त)' } },
    related: [{ href: '/name-numerology', label: { en: 'Name numerology', hi: 'नाम अंक ज्योतिष' } }, { href: '/calculators/moolank-calculator', label: { en: 'Moolank calculator', hi: 'मूलांक कैलकुलेटर' } }],
    faq: [
      { en: ['Can you suggest names before the baby is born?', 'The date of birth is needed for an exact match. You can book now and send the date after the birth.'], hi: ['क्या बच्चे के जन्म से पहले नाम सुझा सकते हैं?', 'सटीक मेल के लिए जन्म तिथि ज़रूरी है। आप अभी बुक कर सकते हैं और जन्म के बाद तिथि भेज सकते हैं।'] },
      { en: ['Do you consider the starting letter from the horoscope?', 'Yes. Mention the letters or syllables suggested by your family astrologer and we will work within them.'], hi: ['क्या आप कुंडली के अनुसार आरंभिक अक्षर का ध्यान रखते हैं?', 'हाँ। अपने पारिवारिक ज्योतिषी द्वारा सुझाए अक्षर या शब्दांश बताएँ, हम उन्हीं में नाम चुनेंगे।'] },
      { en: ['How many names will I get?', 'Seven shortlisted names with meanings and their numbers.'], hi: ['मुझे कितने नाम मिलेंगे?', 'अर्थ और अंकों सहित सात चुने हुए नाम।'] },
    ],
  },
  {
    slug: 'couple-compatibility-report', serviceCode: 'SVC_COUPLE',
    menu: { en: 'Couple Compatibility Report', hi: 'जोड़ी अनुकूलता रिपोर्ट' }, menuSub: { en: 'Marriage and relationship matching', hi: 'विवाह और रिश्ते का मिलान' },
    title: 'Couple Compatibility Report – Marriage Numerology',
    description: 'Numerology compatibility for marriage: Moolank, Bhagyank and name harmony, combined Lo Shu grid, favourable marriage dates and remedies, by Acharya Nandram.',
    h1: { en: 'Couple Compatibility Report', hi: 'जोड़ी अनुकूलता रिपोर्ट' },
    intro: {
      en: ['Numerology looks at how two people\'s numbers support or challenge each other: the Moolank shows day-to-day nature, the Bhagyank the direction of life, and the combined Lo Shu grid what each partner brings.', 'The report is useful before marriage or engagement and also for couples who want to understand each other better. It closes with favourable dates and simple remedies.'],
      hi: ['अंक ज्योतिष देखता है कि दो लोगों के अंक एक-दूसरे का साथ कैसे देते या चुनौती देते हैं: मूलांक रोज़मर्रा का स्वभाव, भाग्यांक जीवन की दिशा, और संयुक्त लो शू ग्रिड बताता है कि हर साथी क्या जोड़ता है।', 'यह रिपोर्ट विवाह या सगाई से पहले उपयोगी है, और उन दंपतियों के लिए भी जो एक-दूसरे को बेहतर समझना चाहते हैं। अंत में शुभ तिथियाँ और सरल उपाय दिए जाते हैं।'],
    },
    forWho: { en: ['Couples planning engagement or marriage', 'Families matching a proposal', 'Married couples facing repeated friction', 'Anyone choosing a wedding date'], hi: ['सगाई या विवाह की योजना बना रहे जोड़े', 'रिश्ते का मिलान कर रहे परिवार', 'बार-बार टकराव का सामना कर रहे विवाहित दंपति', 'विवाह की तिथि चुन रहे लोग'] },
    related: [{ href: '/reading', label: { en: 'Free couple reading', hi: 'मुफ़्त जोड़ी रीडिंग' } }, { href: '/mulank', label: { en: 'Mulank compatibility table', hi: 'मूलांक अनुकूलता तालिका' } }],
    faq: [
      { en: ['Is numerology matching the same as kundli matching?', 'No. Kundli matching uses the birth chart; numerology uses dates of birth and names. Many families use both.'], hi: ['क्या अंक ज्योतिष मिलान कुंडली मिलान जैसा ही है?', 'नहीं। कुंडली मिलान जन्म कुंडली से होता है; अंक ज्योतिष जन्म तिथि और नाम से। कई परिवार दोनों का उपयोग करते हैं।'] },
      { en: ['What if our numbers are not compatible?', 'Few couples are perfect matches. The report explains where care is needed and gives remedies for balance.'], hi: ['यदि हमारे अंक अनुकूल न हों तो?', 'बहुत कम जोड़ियों का पूर्ण मेल होता है। रिपोर्ट बताती है कि कहाँ सावधानी चाहिए और संतुलन के उपाय देती है।'] },
      { en: ['Do you suggest marriage dates?', 'Yes – favourable dates of the month and favourable years for both partners.'], hi: ['क्या आप विवाह की तिथियाँ सुझाते हैं?', 'हाँ – दोनों साथियों के लिए महीने की शुभ तिथियाँ और शुभ वर्ष।'] },
    ],
  },
  {
    slug: 'business-name-numerology', serviceCode: 'SVC_BUSINESS_NAME',
    menu: { en: 'Business Name Numerology', hi: 'व्यवसाय नाम अंक ज्योतिष' }, menuSub: { en: 'Brand names, launch dates, business numbers', hi: 'ब्रांड नाम, लॉन्च तिथि, व्यवसायिक अंक' },
    title: 'Business Name Numerology – Lucky Brand Name',
    description: 'Business name numerology by Acharya Nandram: check proposed company and brand names against the owner\'s date of birth, with lucky spellings and launch dates.',
    h1: { en: 'Business Name Numerology', hi: 'व्यवसाय नाम अंक ज्योतिष' },
    intro: {
      en: ['A business name is said thousands of times – by customers, on invoices and online. Numerology checks whether its number supports the owner\'s Moolank and Bhagyank before you register, print or launch.', 'Send the names you are considering. You get the best options with their numbers, spelling tweaks, launch dates and supportive totals for your business mobile number.'],
      hi: ['व्यवसाय का नाम हज़ारों बार बोला जाता है – ग्राहकों द्वारा, इनवॉइस पर और ऑनलाइन। पंजीकरण, छपाई या लॉन्च से पहले अंक ज्योतिष जाँचता है कि इसका अंक मालिक के मूलांक और भाग्यांक का साथ देता है या नहीं।', 'जिन नामों पर आप विचार कर रहे हैं, वे भेजें। आपको अंकों सहित सर्वोत्तम विकल्प, वर्तनी में सुधार, लॉन्च की तिथियाँ और व्यवसायिक मोबाइल नंबर के सहायक योग मिलेंगे।'],
    },
    forWho: { en: ['Founders registering a new company or shop', 'Businesses planning a rebrand', 'Professionals naming a clinic, studio or practice', 'Anyone choosing a launch date'], hi: ['नई कंपनी या दुकान पंजीकृत करने वाले संस्थापक', 'रीब्रांड की योजना बना रहे व्यवसाय', 'क्लिनिक, स्टूडियो या प्रैक्टिस का नाम रखने वाले पेशेवर', 'लॉन्च की तिथि चुन रहे लोग'] },
    calculator: { kind: 'name', title: { en: 'Check a business name (free)', hi: 'व्यवसाय का नाम जाँचें (मुफ़्त)' } },
    related: [{ href: '/name-numerology', label: { en: 'Personal name numerology', hi: 'व्यक्तिगत नाम अंक ज्योतिष' } }, { href: '/mobile-number-numerology', label: { en: 'Business mobile number', hi: 'व्यवसायिक मोबाइल नंबर' } }],
    faq: [
      { en: ['Whose date of birth is used?', 'The main owner\'s. For partnerships, mention every partner\'s date of birth in the notes.'], hi: ['किसकी जन्म तिथि उपयोग होती है?', 'मुख्य मालिक की। साझेदारी में टिप्पणी में हर साझेदार की जन्म तिथि लिखें।'] },
      { en: ['Can you check an existing business name?', 'Yes. If the number does not suit you, we suggest small spelling changes or a tagline rather than a full rename.'], hi: ['क्या आप मौजूदा व्यवसाय का नाम जाँच सकते हैं?', 'हाँ। यदि अंक अनुकूल न हो तो पूरा नाम बदलने के बजाय वर्तनी में छोटे बदलाव या टैगलाइन सुझाते हैं।'] },
      { en: ['Do you check domain and trademark availability?', 'No – please check those yourself or with your lawyer before finalising.'], hi: ['क्या आप डोमेन और ट्रेडमार्क की उपलब्धता जाँचते हैं?', 'नहीं – अंतिम निर्णय से पहले इन्हें स्वयं या अपने वकील से जाँचें।'] },
    ],
  },
  {
    slug: 'personal-year-consultancy', serviceCode: 'SVC_PERSONAL_YEAR',
    menu: { en: 'Personal Year Consultancy', hi: 'व्यक्तिगत वर्ष परामर्श' }, menuSub: { en: 'Plan the year ahead, month by month', hi: 'आने वाले वर्ष की माह-दर-माह योजना' },
    title: 'Personal Year Numerology Consultancy – Year Ahead',
    description: 'Personal year consultancy by Acharya Nandram: your year theme, month-by-month guidance, best dates for big decisions and remedies. Free calculator.',
    h1: { en: 'Personal Year Consultancy', hi: 'व्यक्तिगत वर्ष परामर्श' },
    intro: {
      en: ['Each year from birthday to birthday carries a number from 1 to 9 – a year to begin, to build, to rest, to finish. Working with that rhythm makes decisions easier and timing better.', 'Find your personal year free below. In a consultation Acharya Nandram maps the next twelve months for you and picks good dates for the decisions you are planning.'],
      hi: ['जन्मदिन से जन्मदिन तक हर वर्ष का 1 से 9 तक एक अंक होता है – शुरुआत, निर्माण, विश्राम या समापन का वर्ष। इस लय के साथ चलने से निर्णय आसान और समय बेहतर होता है।', 'नीचे अपना व्यक्तिगत वर्ष मुफ़्त जानें। परामर्श में आचार्य नंदराम आपके लिए अगले बारह महीनों का खाका बनाते हैं और आपके नियोजित निर्णयों के लिए अच्छी तिथियाँ चुनते हैं।'],
    },
    forWho: { en: ['You are planning a job change, move, launch or wedding', 'You start the year and want a clear plan', 'You feel the timing of your efforts is off', 'You want answers to your own questions'], hi: ['आप नौकरी बदलने, स्थान बदलने, लॉन्च या विवाह की योजना बना रहे हैं', 'वर्ष की शुरुआत में आप स्पष्ट योजना चाहते हैं', 'आपको लगता है कि आपके प्रयासों का समय ठीक नहीं बैठ रहा', 'आप अपने प्रश्नों के उत्तर चाहते हैं'] },
    calculator: { kind: 'personalYear', title: { en: 'Find your personal year (free)', hi: 'अपना व्यक्तिगत वर्ष जानें (मुफ़्त)' } },
    related: [{ href: '/calculators/personal-year-calculator', label: { en: 'Personal year calculator', hi: 'व्यक्तिगत वर्ष कैलकुलेटर' } }, { href: '/personal-numerology-report', label: { en: 'Personal numerology report', hi: 'व्यक्तिगत अंक ज्योतिष रिपोर्ट' } }],
    faq: [
      { en: ['When does my personal year change?', 'On your birthday – this site follows the traditional birthday-to-birthday method.'], hi: ['मेरा व्यक्तिगत वर्ष कब बदलता है?', 'आपके जन्मदिन पर – यह साइट पारंपरिक जन्मदिन-से-जन्मदिन विधि मानती है।'] },
      { en: ['How is the consultation done?', 'By phone or WhatsApp at a time agreed with you, with a written summary of the month-by-month guidance.'], hi: ['परामर्श कैसे होता है?', 'आपके साथ तय समय पर फ़ोन या WhatsApp द्वारा, माह-दर-माह मार्गदर्शन के लिखित सारांश के साथ।'] },
      { en: ['Which personal years are best for new beginnings?', 'Years 1, 3, 5 and 6 are usually supportive, but your Moolank and Bhagyank change the picture – that is what the consultation checks.'], hi: ['नई शुरुआत के लिए कौन-से व्यक्तिगत वर्ष अच्छे हैं?', 'वर्ष 1, 3, 5 और 6 सामान्यतः सहायक होते हैं, पर आपके मूलांक और भाग्यांक से तस्वीर बदलती है – परामर्श यही जाँचता है।'] },
    ],
  },
];

export const servicePageBySlug = (slug: string) => SERVICE_PAGES.find((p) => p.slug === slug);
export const servicePageByCode = (code: string) => SERVICE_PAGES.find((p) => p.serviceCode === code);
