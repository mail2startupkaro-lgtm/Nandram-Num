/**
 * Expert services sold on /services (delivered personally by Acharya Nandram, unlike the instant PDF plans).
 * Codes start with "SVC_" and are stored in payments.plan_code, so checkout, invoices and finance reports work unchanged.
 * Seeded draft prices are NOT payable until the owner confirms them in Admin → Services (priceConfirmed).
 */
import { and, asc, desc, eq, inArray, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type Db } from '@/lib/db/client';
import { appSettings, payments, serviceOrders, services, users, type Service, type ServiceIntakeField, type ServiceText } from '@/lib/db/schema';
import { decryptJson, encryptJson } from '@/lib/security/crypto';

export const SERVICE_PREFIX = 'SVC_';
export const isServiceCode = (code: string) => code.startsWith(SERVICE_PREFIX);
export const INTAKE_FIELDS: ServiceIntakeField[] = ['clientName', 'dob', 'gender', 'maritalStatus', 'partnerName', 'partnerDob', 'tob', 'pob', 'city', 'state', 'country', 'mobile', 'email', 'profession', 'education', 'concerns', 'language', 'currentName', 'parents', 'letters', 'businesses', 'businessName', 'launchDate', 'partners', 'brand', 'challenges', 'questions'];
export const SERVICE_ORDER_STATUSES = ['awaiting_payment', 'paid', 'in_progress', 'delivered', 'cancelled'] as const;
export type ServiceOrderStatus = (typeof SERVICE_ORDER_STATUSES)[number];

const t = (name: string, short: string, includes: string[], delivery: string): ServiceText => ({ name, short, includes, delivery });

export const DEFAULT_SERVICES: (typeof services.$inferInsert)[] = [
  {
    code: 'SVC_PERSONAL_REPORT', sort: 1, featured: true, pricePaise: 2_100_00, mrpPaise: 4_200_00,
    intake: ['clientName', 'currentName', 'dob', 'gender', 'maritalStatus', 'partnerName', 'partnerDob', 'tob', 'pob', 'city', 'state', 'mobile', 'email', 'profession', 'concerns', 'language', 'challenges', 'questions'],
    en: t('Complete Life Report by Acharya Nandram', 'Your complete chart read personally by Acharya Nandram, with answers to your own questions and remedies that fit your life.',
      ['Moolank, Bhagyank, Kua and Lo Shu grid analysis', 'Name number and mobile number check', 'Destiny Matrix analysis', 'Current personal year and the next 3 years', 'Answers to up to 3 questions you send', 'Personal remedies: colours, days, mantra, daan', 'PDF in English, Hindi or Hinglish'], 'Delivered as a PDF within 3 hours'),
    hi: t('आचार्य नंदराम द्वारा संपूर्ण जीवन अंक ज्योतिष रिपोर्ट', 'आपका पूरा चार्ट स्वयं आचार्य नंदराम द्वारा पढ़ा जाता है, आपके अपने प्रश्नों के उत्तर और आपके जीवन के अनुकूल उपायों के साथ।',
      ['मूलांक, भाग्यांक, कुआ और लो शू ग्रिड विश्लेषण', 'नामांक और मोबाइल नंबर की जाँच', 'डेस्टिनी मैट्रिक्स विश्लेषण', 'वर्तमान व्यक्तिगत वर्ष और अगले 3 वर्ष', 'आपके भेजे गए अधिकतम 3 प्रश्नों के उत्तर', 'व्यक्तिगत उपाय: रंग, दिन, मंत्र, दान', 'अंग्रेज़ी, हिंदी या हिंग्लिश में PDF'], '3 घंटे के भीतर PDF के रूप में'),
  },
  {
    code: 'SVC_NAME_CORRECTION', sort: 2, featured: true, pricePaise: 1_100_00, mrpPaise: 2_100_00, intake: ['currentName', 'dob', 'gender', 'mobile', 'questions'],
    en: t('Name Correction (Lucky Name Spelling)', 'A name spelling that matches your Moolank and Bhagyank, chosen so it still looks and sounds natural.',
      ['Analysis of your current name (Chaldean and Pythagorean)', '3 corrected spellings with their numbers', 'Which spelling to use where: signature, documents, social media', 'Signature guidance'], 'Delivered within 3 hours'),
    hi: t('नाम सुधार (शुभ नाम-वर्तनी)', 'ऐसी नाम-वर्तनी जो आपके मूलांक और भाग्यांक से मेल खाए और फिर भी स्वाभाविक दिखे और सुनाई दे।',
      ['आपके वर्तमान नाम का विश्लेषण (कैल्डियन और पाइथागोरियन)', 'अंकों सहित 3 सुधारी हुई वर्तनियाँ', 'कौन-सी वर्तनी कहाँ उपयोग करें: हस्ताक्षर, दस्तावेज़, सोशल मीडिया', 'हस्ताक्षर संबंधी मार्गदर्शन'], '3 घंटे के भीतर'),
  },
  {
    code: 'SVC_MOBILE_NUMBER', sort: 4, featured: false, pricePaise: 501_00, mrpPaise: 1_001_00, intake: ['clientName', 'dob', 'gender', 'mobile', 'questions'],
    en: t('Lucky Mobile Number Selection', 'Find out whether your mobile number supports you, and get the number patterns that suit your date of birth.',
      ['Full analysis of your current number', 'Your best totals and digit pairs', 'Digits and pairs to avoid', 'Help choosing between numbers you shortlist (up to 5)'], 'Delivered within 3 hours'),
    hi: t('शुभ मोबाइल नंबर चयन', 'जानें कि आपका मोबाइल नंबर आपका साथ देता है या नहीं, और अपनी जन्म तिथि के अनुकूल नंबर-पैटर्न पाएँ।',
      ['आपके वर्तमान नंबर का पूरा विश्लेषण', 'आपके सर्वोत्तम योग और अंक-जोड़ियाँ', 'बचने योग्य अंक और जोड़ियाँ', 'आपके चुने हुए अधिकतम 5 नंबरों में से चयन में मदद'], '3 घंटे के भीतर'),
  },
  {
    code: 'SVC_BABY_NAME', sort: 5, featured: false, pricePaise: 1_100_00, mrpPaise: 2_100_00, intake: ['dob', 'gender', 'tob', 'pob', 'parents', 'letters', 'questions'],
    en: t('Baby Name Numerology', 'Meaningful baby names (Formal Name & Nickname) whose numbers suit your child\'s date of birth, in the starting letters you prefer.',
      ['7 shortlisted names with meanings', 'Formal name & auspicious nickname (calling name) compatibility', 'Name number of each and how it matches the date of birth', 'Spelling advice for documents', 'Lucky colours and numbers for the child', 'Best career path for your child – career fields, subjects and age-wise guidance'], 'Delivered within 3 hours'),
    hi: t('शिशु नाम अंक ज्योतिष', 'अर्थपूर्ण शिशु नाम (औपचारिक नाम व निकनेम) जिनके अंक आपके बच्चे की जन्म तिथि के अनुकूल हों, आपके पसंदीदा आरंभिक अक्षरों में।',
      ['अर्थ सहित 7 चुने हुए नाम', 'औपचारिक नाम व शुभ निकनेम (पुकारने के नाम) का सामंजस्य', 'हर नाम का नामांक और जन्म तिथि से उसका मेल', 'दस्तावेज़ों के लिए वर्तनी संबंधी सलाह', 'बच्चे के शुभ रंग और अंक', 'बच्चे के लिए सर्वश्रेष्ठ करियर पथ – करियर क्षेत्र, विषय और उम्र के अनुसार मार्गदर्शन'], '3 घंटे के भीतर'),
  },
  {
    code: 'SVC_LOSHU', sort: 3, featured: false, pricePaise: 1_100_00, mrpPaise: 2_100_00, intake: ['clientName', 'dob', 'gender', 'questions'],
    en: t('Lo Shu Grid Analysis', 'A detailed reading of your Lo Shu grid: what your repeated and missing numbers mean for you, and exactly how to balance them.',
      ['Your grid with Moolank, Bhagyank and Kua placed', 'Meaning of every repeated and missing number', 'Planes, arrows of strength and weakness, Raj Yog', 'Remedies for each missing number: placement, colour, bracelet, habit', 'Lucky directions from your Kua number'], 'Delivered within 3 hours'),
    hi: t('लो शू ग्रिड विश्लेषण', 'आपके लो शू ग्रिड की विस्तृत रीडिंग: आपके दोहराए गए और अनुपस्थित अंकों का अर्थ, और उन्हें संतुलित करने का सटीक तरीक़ा।',
      ['मूलांक, भाग्यांक और कुआ सहित आपका ग्रिड', 'हर दोहराए गए और अनुपस्थित अंक का अर्थ', 'प्लेन, शक्ति और कमज़ोरी के तीर, राज योग', 'हर अनुपस्थित अंक के उपाय: स्थान, रंग, ब्रेसलेट, आदत', 'कुआ अंक से शुभ दिशाएँ'], '3 घंटे के भीतर'),
  },
  {
    code: 'SVC_COUPLE', sort: 6, featured: false, pricePaise: 2_100_00, mrpPaise: 4_200_00, intake: ['clientName', 'dob', 'gender', 'partnerName', 'partnerDob', 'questions'],
    en: t('Couple Compatibility Report', 'How your numbers work together – for marriage, engagement or an existing relationship – with practical guidance for harmony.',
      ['Moolank, Bhagyank and name number harmony of both partners', 'Combined Lo Shu grid: what each partner brings', 'Strengths and likely friction areas', 'Favourable marriage dates and years', 'Remedies for a balanced relationship'], 'Delivered within 3 hours'),
    hi: t('जोड़ी अनुकूलता रिपोर्ट', 'विवाह, सगाई या मौजूदा रिश्ते के लिए – आप दोनों के अंक साथ कैसे काम करते हैं, सामंजस्य के व्यावहारिक मार्गदर्शन के साथ।',
      ['दोनों साथियों के मूलांक, भाग्यांक और नामांक का सामंजस्य', 'संयुक्त लो शू ग्रिड: हर साथी क्या जोड़ता है', 'ख़ूबियाँ और संभावित टकराव के क्षेत्र', 'विवाह की शुभ तिथियाँ और वर्ष', 'संतुलित रिश्ते के लिए उपाय'], '3 घंटे के भीतर'),
  },
  {
    code: 'SVC_BUSINESS_NAME', sort: 7, featured: false, pricePaise: 2_100_00, mrpPaise: 4_200_00, intake: ['clientName', 'dob', 'gender', 'currentName', 'questions'],
    en: t('Business Name Numerology', 'A business or brand name whose number supports the owner\'s date of birth – checked before you register, print or launch.',
      ['Analysis of your current or proposed names (up to 5)', 'Best spelling options with their numbers', 'Fit with the owner\'s Moolank and Bhagyank', 'Lucky launch dates and business mobile number totals', 'Brand colour suggestions'], 'Delivered within 3 hours'),
    hi: t('व्यवसाय नाम अंक ज्योतिष', 'ऐसा व्यवसाय या ब्रांड नाम जिसका अंक मालिक की जन्म तिथि का साथ दे – पंजीकरण, छपाई या लॉन्च से पहले जाँचा हुआ।',
      ['आपके वर्तमान या प्रस्तावित नामों का विश्लेषण (अधिकतम 5)', 'अंकों सहित सर्वोत्तम वर्तनी विकल्प', 'मालिक के मूलांक और भाग्यांक से मेल', 'लॉन्च की शुभ तिथियाँ और व्यवसायिक मोबाइल नंबर के योग', 'ब्रांड रंग के सुझाव'], '3 घंटे के भीतर'),
  },
  {
    code: 'SVC_BUSINESS_COMPAT', sort: 9, featured: false, pricePaise: 2_100_00, mrpPaise: 4_200_00, intake: ['clientName', 'dob', 'gender', 'pob', 'businesses', 'questions'],
    en: t('Business Compatibility Report', 'Which business suits your date of birth? Your Moolank, Bhagyank, name number and Lo Shu grid checked against 1000+ business categories – with timing, name, direction and remedies.',
      ['Your compatibility score for 1000+ business categories, ranked', 'Top recommendations with how to start and what to watch', 'A clear verdict on each business you are already considering', 'Best sectors and least-suited businesses', 'Best years to launch or expand, business name totals, lucky direction and remedies', 'Downloadable PDF report prepared by Acharya Nandram'], 'Delivered within 3 hours'),
    hi: t('व्यवसाय अनुकूलता रिपोर्ट', 'आपकी जन्म तिथि के लिए कौन-सा व्यवसाय शुभ है? आपके मूलांक, भाग्यांक, नामांक और लो शू ग्रिड का 1000+ व्यवसाय श्रेणियों से मिलान – समय, नाम, दिशा और उपायों सहित।',
      ['1000+ व्यवसाय श्रेणियों के लिए आपका अनुकूलता स्कोर, क्रम सहित', 'शीर्ष सुझाव – कैसे शुरू करें और किन बातों का ध्यान रखें', 'जिन व्यवसायों पर आप पहले से विचार कर रहे हैं, हर एक पर स्पष्ट निर्णय', 'सर्वोत्तम क्षेत्र और सबसे कम अनुकूल व्यवसाय', 'शुरुआत या विस्तार के शुभ वर्ष, व्यवसाय नाम के योग, शुभ दिशा और उपाय', 'आचार्य नंदराम द्वारा तैयार डाउनलोड योग्य PDF रिपोर्ट'], '3 घंटे के भीतर'),
  },
  {
    code: 'SVC_BUSINESS_COMPLETE', sort: 7, featured: true, pricePaise: 5_100_00, mrpPaise: 11_000_00, intake: ['clientName', 'dob', 'gender', 'businessName', 'businesses', 'launchDate', 'partners', 'brand', 'mobile', 'questions'],
    en: t('Complete Business Numerology Report', 'Business numerology for business name selection, brand name correction, startup dates, partnership compatibility and entrepreneur numerology – one personalised report for the owner and the business.',
      ['Business Name Analysis – every name you send, scored against the owner\'s numbers', 'Business Name Correction – small spelling changes that make the number lucky', 'Brand & Logo Numerology – brand colours, logo shape, lettering, tagline and lucky launch dates', 'Business Partner Compatibility – each partner matched with the owner and the business, with best roles', 'Business growth cycle forecast – the business\'s year-by-year cycle for the next 9 years', 'CEO Numerology Report – leadership style, best sectors, lucky days and directions for the owner', 'Remedies and a 90-day action plan in a designed PDF by Acharya Nandram'], 'Delivered within 3 hours'),
    hi: t('संपूर्ण व्यवसाय अंक ज्योतिष रिपोर्ट', 'व्यवसाय नाम चयन, ब्रांड नाम सुधार, स्टार्टअप तिथि, साझेदारी अनुकूलता और उद्यमी अंक ज्योतिष – मालिक और व्यवसाय दोनों के लिए एक व्यक्तिगत रिपोर्ट।',
      ['व्यवसाय नाम विश्लेषण – आपके भेजे हर नाम का मालिक के अंकों से स्कोर', 'व्यवसाय नाम सुधार – वर्तनी में छोटे बदलाव जो अंक को शुभ बनाएँ', 'ब्रांड और लोगो अंक ज्योतिष – ब्रांड रंग, लोगो आकृति, अक्षर शैली, टैगलाइन और लॉन्च की शुभ तिथियाँ', 'व्यवसाय साझेदार अनुकूलता – हर साझेदार का मालिक और व्यवसाय से मिलान, उपयुक्त भूमिकाओं सहित', 'व्यवसाय विकास चक्र पूर्वानुमान – अगले 9 वर्षों का वर्ष-दर-वर्ष चक्र', 'सीईओ अंक ज्योतिष रिपोर्ट – मालिक की नेतृत्व शैली, सर्वोत्तम क्षेत्र, शुभ दिन और दिशाएँ', 'उपाय और 90-दिन की कार्य-योजना – आचार्य नंदराम द्वारा डिज़ाइन की हुई PDF'], '3 घंटे के भीतर'),
  },
  {
    code: 'SVC_PERSONAL_YEAR', sort: 8, featured: false, pricePaise: 1_500_00, mrpPaise: 3_000_00, intake: ['clientName', 'dob', 'gender', 'mobile', 'questions'],
    en: t('Personal Year Consultancy', 'Plan the year ahead with your personal year, month and day numbers – when to start, when to wait and when to act on big decisions.',
      ['Your personal year theme from birthday to birthday', 'Month-by-month guidance for the next 12 months', 'Best dates for important decisions you name', 'Remedies to support the year', 'Personal answers to your questions on call or WhatsApp'], 'Scheduled within 3 hours'),
    hi: t('व्यक्तिगत वर्ष परामर्श', 'अपने व्यक्तिगत वर्ष, माह और दिन के अंकों से आने वाले वर्ष की योजना बनाएँ – कब शुरुआत करें, कब प्रतीक्षा करें और कब बड़े निर्णय लें।',
      ['जन्मदिन से जन्मदिन तक आपके व्यक्तिगत वर्ष का विषय', 'अगले 12 महीनों के लिए माह-दर-माह मार्गदर्शन', 'आपके बताए महत्वपूर्ण निर्णयों के लिए शुभ तिथियाँ', 'वर्ष को सहारा देने वाले उपाय', 'कॉल या WhatsApp पर आपके प्रश्नों के व्यक्तिगत उत्तर'], '3 घंटे के भीतर समय तय'),
  },
  {
    code: 'SVC_SIGNATURE', sort: 10, featured: false, pricePaise: 475_00, mrpPaise: 2_475_00, priceConfirmed: true, intake: ['clientName', 'dob', 'gender', 'currentName', 'questions'],
    en: t('Signature Analysis & Correction', 'Your signature read with graphology and numerology – what it reveals, what may be holding you back, and a corrected signature to practise.',
      ['11 signature features checked: baseline, slant, size, first letter, cutting strokes, ending, dots and more', 'Numerology of your signed name and first letter with your Moolank and Bhagyank', 'The best way to sign your name – ranked options', 'Personality, career and money indications from your signature', 'Step-by-step ideal signature with do\'s and don\'ts', 'Start dates, ink colour and a 21-day practice chart', 'Designed PDF report prepared by Acharya Nandram'], 'PDF within 3 hours of receiving your signature photos'),
    hi: t('हस्ताक्षर विश्लेषण और सुधार', 'हस्तलेख विज्ञान और अंक ज्योतिष से आपके हस्ताक्षर की रीडिंग – यह क्या दर्शाता है, क्या आपको रोक रहा हो सकता है, और अभ्यास के लिए सुधारा हुआ हस्ताक्षर।',
      ['हस्ताक्षर की 11 विशेषताओं की जाँच: आधार रेखा, झुकाव, आकार, पहला अक्षर, काटती रेखाएँ, अंत, बिंदु और अधिक', 'आपके हस्ताक्षर-नाम और पहले अक्षर का अंक ज्योतिष, मूलांक और भाग्यांक के साथ', 'नाम लिखने का सबसे अच्छा तरीका – क्रमवार विकल्प', 'हस्ताक्षर से व्यक्तित्व, करियर और धन के संकेत', 'करें और न करें सहित आदर्श हस्ताक्षर चरण-दर-चरण', 'शुभ आरंभ तिथियाँ, स्याही का रंग और 21 दिन का अभ्यास चार्ट', 'आचार्य नंदराम द्वारा तैयार डिज़ाइन की हुई PDF रिपोर्ट'], 'हस्ताक्षर की फ़ोटो मिलने के 3 घंटे के भीतर PDF'),
  },
  {
    code: 'SVC_DESTINY_MATRIX', sort: 11, featured: true, pricePaise: 2_100_00, mrpPaise: 4_200_00, intake: ['clientName', 'dob', 'gender', 'questions'],
    en: t('Destiny Matrix Analysis', 'Your complete Destiny Matrix (22 arcana) read in plain language – personality, talents, money and love channels, karmic tail, life purposes, chakra health map and your life timeline year by year.',
      ['Your full Destiny Matrix chart, drawn and explained point by point', 'Personality, talents and comfort zone – your strengths in the plus and the minus', 'Money channel and love channel – where money and the right partner come from', 'Karmic tail – the lesson you carry and how to free yourself from it', 'Four life purposes: personal, social, spiritual and planetary', 'Chakra health map and family (ancestral) lines', 'Life timeline 0–80 years with your current and next 10 years', 'Personal answers to your questions'], 'Delivered within 3 hours'),
    hi: t('डेस्टिनी मैट्रिक्स विश्लेषण', 'आपकी पूरी डेस्टिनी मैट्रिक्स (22 आर्काना) सरल भाषा में – व्यक्तित्व, प्रतिभा, धन और प्रेम चैनल, कर्म-पूँछ, जीवन के उद्देश्य, चक्र स्वास्थ्य मानचित्र और वर्ष-दर-वर्ष जीवन समयरेखा।',
      ['आपकी पूरी डेस्टिनी मैट्रिक्स चार्ट, हर बिंदु की व्याख्या के साथ', 'व्यक्तित्व, प्रतिभा और सहज क्षेत्र – प्लस और माइनस में आपकी ताक़त', 'धन चैनल और प्रेम चैनल – धन और सही साथी कहाँ से आते हैं', 'कर्म-पूँछ – आपकी सीख और उससे मुक्त होने का तरीका', 'चार जीवन उद्देश्य: व्यक्तिगत, सामाजिक, आध्यात्मिक और ग्रहीय', 'चक्र स्वास्थ्य मानचित्र और पारिवारिक (पूर्वज) रेखाएँ', '0–80 वर्ष की जीवन समयरेखा, आपके वर्तमान और अगले 10 वर्षों के साथ', 'आपके प्रश्नों के व्यक्तिगत उत्तर'], '3 घंटे के भीतर'),
  },
  {
    code: 'SVC_BIRTH_CHART', sort: 12, featured: false, pricePaise: 501_00, mrpPaise: 1_001_00, intake: ['clientName', 'dob', 'gender', 'questions'],
    en: t('Pythagorean Birth Chart Analysis', 'Your Pythagoras Square (Psychomatrix) from your date of birth – character, energy, health, logic, talent, duty and memory, with the life lines that shape purpose, family, money and talent.',
      ['Your Pythagoras Square drawn with the four working numbers', 'All nine qualities read with their strength – character, energy, interest, health, logic, work, luck, duty, memory', 'Eight life lines: purpose, family, habits, self-esteem, money & home, talent, spirituality, temperament', 'Your strengths and what to develop, with simple practices', 'Personal answers to your questions'], 'Delivered within 3 hours'),
    hi: t('पाइथागोरस जन्म चार्ट विश्लेषण', 'आपकी जन्म तिथि से पाइथागोरस वर्ग (साइकोमैट्रिक्स) – चरित्र, ऊर्जा, स्वास्थ्य, तर्क, प्रतिभा, कर्तव्य और स्मृति, साथ में उद्देश्य, परिवार, धन और प्रतिभा की जीवन रेखाएँ।',
      ['चार कार्य-अंकों के साथ बना आपका पाइथागोरस वर्ग', 'सभी नौ गुण उनकी शक्ति के साथ – चरित्र, ऊर्जा, रुचि, स्वास्थ्य, तर्क, श्रम, भाग्य, कर्तव्य, स्मृति', 'आठ जीवन रेखाएँ: उद्देश्य, परिवार, आदतें, आत्म-सम्मान, धन व घर, प्रतिभा, आध्यात्मिकता, स्वभाव', 'आपकी ताक़त और विकसित करने योग्य बातें, सरल अभ्यासों के साथ', 'आपके प्रश्नों के व्यक्तिगत उत्तर'], '3 घंटे के भीतर'),
  },
];

/**
 * Seeds default services in versioned batches, so services added in a later release appear once,
 * while a service the owner deleted is never re-created.
 */
const SEED_BATCHES: string[][] = [
  ['SVC_PERSONAL_REPORT', 'SVC_NAME_CORRECTION', 'SVC_MOBILE_NUMBER', 'SVC_BABY_NAME'],
  ['SVC_LOSHU', 'SVC_COUPLE', 'SVC_BUSINESS_NAME', 'SVC_PERSONAL_YEAR'],
  ['SVC_BUSINESS_COMPAT'],
  ['SVC_SIGNATURE'],
  ['SVC_BUSINESS_COMPLETE'],
  ['SVC_DESTINY_MATRIX', 'SVC_BIRTH_CHART'],
];
let seeded = false;
export async function ensureServices(db: Db = getDb()) {
  if (seeded) return;
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, 'servicesSeed')).limit(1);
  let done = typeof row?.value === 'number' ? row.value : 0;
  if (!row) { const [any] = await db.select({ code: services.code }).from(services).limit(1); if (any) done = 1; } // databases seeded before batches existed
  for (let b = done; b < SEED_BATCHES.length; b++) {
    const rows = DEFAULT_SERVICES.filter((x) => SEED_BATCHES[b].includes(x.code));
    if (rows.length) await db.insert(services).values(rows).onConflictDoNothing();
  }
  // Keep the built-in text and intake fields in step with the code – but only write rows that actually differ
  // (this runs on every cold start; 13 blind UPDATEs to a database in another region slowed the first page load).
  const current = await db.select({ code: services.code, en: services.en, hi: services.hi, intake: services.intake }).from(services);
  // jsonb does not keep key order, so compare with sorted keys.
  const stable = (v: unknown): string => (Array.isArray(v) ? `[${v.map(stable).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`).join(',')}}` : JSON.stringify(v ?? null));
  const same = (a: unknown, b: unknown) => stable(a) === stable(b);
  for (const s of DEFAULT_SERVICES) {
    const row = current.find((r) => r.code === s.code);
    if (row && !(same(row.en, s.en) && same(row.hi, s.hi) && same(row.intake, s.intake))) {
      await db.update(services).set({ en: s.en, hi: s.hi, intake: s.intake, updatedAt: new Date() }).where(eq(services.code, s.code));
    }
  }
  if (done !== SEED_BATCHES.length) await db.insert(appSettings).values({ key: 'servicesSeed', value: SEED_BATCHES.length }).onConflictDoUpdate({ target: appSettings.key, set: { value: SEED_BATCHES.length, updatedAt: new Date() } });
  seeded = true;
}

export async function listServices(opts: { includeInactive?: boolean } = {}, db: Db = getDb()): Promise<Service[]> {
  await ensureServices(db);
  // Ties on `sort` (two services with the same number) keep the built-in catalogue order, so the list never shuffles between page loads.
  const rank = (code: string) => { const i = DEFAULT_SERVICES.findIndex((d) => d.code === code); return i < 0 ? DEFAULT_SERVICES.length : i; };
  const all = (await db.select().from(services).orderBy(asc(services.sort), asc(services.code)))
    .map((s, i) => ({ s, i })).sort((a, b) => a.s.sort - b.s.sort || rank(a.s.code) - rank(b.s.code) || a.i - b.i).map((x) => x.s);
  return opts.includeInactive ? all : all.filter((s) => s.active);
}

export async function getService(code: string, db: Db = getDb()): Promise<Service | undefined> {
  await ensureServices(db);
  return (await db.select().from(services).where(eq(services.code, code)).limit(1))[0];
}

/** Payable only when active and the owner has confirmed the price. */
export const isPayable = (s: Service) => s.active && s.priceConfirmed && s.pricePaise >= 100;

/* ---------- admin editing ---------- */
const Text = z.object({ name: z.string().trim().min(3).max(120), short: z.string().trim().max(400), includes: z.array(z.string().trim().min(1).max(200)).max(12), delivery: z.string().trim().max(120) });
export const ServiceSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^SVC_[A-Z0-9_]{2,26}$/, 'Code must start with SVC_ and use A–Z, 0–9 or _'),
  en: Text, hi: Text,
  pricePaise: z.number().int().min(100).max(10_000_000), mrpPaise: z.number().int().min(100).max(10_000_000).nullable().optional(),
  usdCents: z.number().int().min(100).max(10_000_000).nullable().optional(), usdMrpCents: z.number().int().min(100).max(10_000_000).nullable().optional(),
  priceConfirmed: z.boolean(), intake: z.array(z.enum(INTAKE_FIELDS as [ServiceIntakeField, ...ServiceIntakeField[]])).min(1),
  active: z.boolean(), featured: z.boolean(), sort: z.number().int().min(0).max(999),
});
export async function saveService(input: z.infer<typeof ServiceSchema>, db: Db = getDb()) {
  const usdCents = input.usdCents ?? null;
  const row = { ...input, mrpPaise: input.mrpPaise && input.mrpPaise > input.pricePaise ? input.mrpPaise : null, usdCents, usdMrpCents: usdCents && input.usdMrpCents && input.usdMrpCents > usdCents ? input.usdMrpCents : null, updatedAt: new Date() };
  await db.insert(services).values(row).onConflictDoUpdate({ target: services.code, set: row });
}
export async function deleteService(code: string, db: Db = getDb()) {
  const [used] = await db.select({ id: serviceOrders.id }).from(serviceOrders).where(eq(serviceOrders.serviceCode, code)).limit(1);
  if (used) return 'in_use' as const;
  await db.delete(services).where(eq(services.code, code));
  return 'deleted' as const;
}

/* ---------- client details collected at checkout ---------- */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => { const d = new Date(`${s}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s) && s >= '1900-01-01' && d.getTime() <= Date.now() + 86_400_000; }, 'Enter a valid date of birth');
const FIELD: Record<ServiceIntakeField, z.ZodTypeAny> = {
  clientName: z.string().trim().min(2).max(120), dob: isoDate, gender: z.enum(['male', 'female', 'other']),
  maritalStatus: z.string().trim().max(50).optional(),
  tob: z.string().trim().max(10).optional(), pob: z.string().trim().max(120).optional(),
  city: z.string().trim().max(100).optional(), state: z.string().trim().max(100).optional(), country: z.string().trim().max(100).optional(),
  mobile: z.string().trim().max(25).optional(), email: z.string().trim().max(100).optional(),
  profession: z.string().trim().max(120).optional(), education: z.string().trim().max(120).optional(),
  concerns: z.string().trim().max(500).optional(), language: z.string().trim().max(20).optional(),
  currentName: z.string().trim().min(1).max(300).optional(), partnerName: z.string().trim().min(2).max(120).optional(), partnerDob: isoDate.optional(), parents: z.string().trim().max(200).optional(), letters: z.string().trim().max(60).optional(),
  businesses: z.string().trim().max(600).optional(),
  businessName: z.string().trim().min(2).max(400).regex(/[A-Za-z]/, 'Write the business name in English letters'),
  launchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => s >= '1900-01-01' && s <= '2045-12-31', 'Enter a valid date').optional(),
  partners: z.string().trim().max(800).optional(), brand: z.string().trim().max(400).optional(),
  challenges: z.string().trim().max(3000).optional(),
  questions: z.string().trim().max(2000).optional(),
};
const OPTIONAL: ServiceIntakeField[] = ['maritalStatus', 'partnerName', 'partnerDob', 'tob', 'pob', 'city', 'state', 'country', 'mobile', 'email', 'profession', 'education', 'concerns', 'language', 'currentName', 'parents', 'letters', 'businesses', 'launchDate', 'partners', 'brand', 'challenges', 'questions'];
/** Booking details; `forProfileId` / `forRelation` link the order to the saved person (self or a family member). */
export type IntakeDetails = Partial<Record<ServiceIntakeField | 'forProfileId' | 'forRelation' | 'signatureImage' | 'babyName' | 'nameType' | 'nameStyle' | 'surname' | 'fatherName' | 'motherName' | 'consideredNames', string>>;

/** One signature photo sent with a Signature Analysis booking: a JPEG/PNG/WEBP data URL, at most ~1 MB. */
export const SIGNATURE_IMAGE_MAX = 1_400_000;
export const SignatureImage = z.string().max(SIGNATURE_IMAGE_MAX).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, 'Upload a JPG, PNG or WEBP image');

/** Validates exactly the fields this service asks for; unknown keys are dropped. Aadhaar-like numbers are masked. */
export function parseIntake(svc: Service, raw: unknown): IntakeDetails {
  const shape = Object.fromEntries(svc.intake.map((k) => [k, OPTIONAL.includes(k) ? FIELD[k].optional() : FIELD[k]]));
  // Baby Name: the baby's current name (if any), formal/nickname preference, surname, parents, and names being considered.
  const baby: Record<string, z.ZodTypeAny> = svc.code === 'SVC_BABY_NAME'
    ? {
        babyName: z.string().trim().max(120).optional(),
        nameType: z.enum(['formal', 'nickname', 'both']).optional(),
        nameStyle: z.enum(['auto', 'mix', 'indian', 'english', 'arabic', 'spanish', 'portuguese', 'french', 'german', 'dutch', 'italian', 'russian', 'malay']).optional(),
        surname: z.string().trim().max(80).optional(),
        fatherName: z.string().trim().max(120).optional(),
        motherName: z.string().trim().max(120).optional(),
        consideredNames: z.string().trim().max(500).optional(),
      }
    : {};
  const parsed = z.object({ ...shape, ...baby, country: z.string().trim().max(100).optional() }).parse(raw ?? {}) as IntakeDetails;
  const mask = (s: string) => s.replace(/\b(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})\b/g, (_m, _a, _b, c) => `XXXX-XXXX-${c}`);
  return Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, mask(String(v))]));
}

/**
 * The automatic-delivery columns (migration 0015) are also added on first use, so orders keep working on a database
 * where `npm run db:migrate` has not been run yet. Same statements as drizzle/0015_auto_delivery.sql.
 */
const DELIVERY_DDL = [
  'ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "report_pdf_hi" text',
  'ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "report_file_name_hi" varchar(160)',
  'ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "delivered_by" varchar(10)',
  'ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "delivery_lock_at" timestamp with time zone',
  'ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "delivery_attempts" integer DEFAULT 0 NOT NULL',
  'ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "delivery_error" text',
  'ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "notified_at" timestamp with time zone',
  'ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "notify_log" text',
];
const ensured = new WeakMap<object, Promise<void>>();
export function ensureDeliveryColumns(db: Db = getDb()): Promise<void> {
  let p = ensured.get(db);
  if (!p) {
    p = (async () => {
      const [{ n }] = (await db.execute(sql`select count(*)::int as n from information_schema.columns where table_name = 'service_orders' and column_name = 'notify_log'`)).rows as { n: number }[];
      if (n > 0) return;
      for (const q of DELIVERY_DDL) await db.execute(sql.raw(q));
    })().catch((e) => { ensured.delete(db); console.warn('[services] could not add delivery columns:', e instanceof Error ? e.message : e); });
    ensured.set(db, p);
  }
  return p;
}

export async function createServiceOrder(paymentId: string, userId: string, serviceCode: string, details: IntakeDetails, db: Db = getDb()) {
  await ensureDeliveryColumns(db);
  await db.insert(serviceOrders).values({ paymentId, userId, serviceCode, detailsEnc: encryptJson(details) });
}

/** Called inside fulfilPayment's transaction. */
export async function markServiceOrderPaid(paymentId: string, db: Db) {
  await db.update(serviceOrders).set({ status: 'paid', updatedAt: new Date() }).where(and(eq(serviceOrders.paymentId, paymentId), eq(serviceOrders.status, 'awaiting_payment')));
}

export async function listServiceOrders(filter: { status?: string; userId?: string } = {}, db: Db = getDb()) {
  await ensureDeliveryColumns(db);
  const rows = await db.select({ o: serviceOrders, p: { amountPaise: payments.amountPaise, currency: payments.currency, status: payments.status, invoiceNumber: payments.invoiceNumber, billingName: payments.billingName, paidAt: payments.paidAt } })
    .from(serviceOrders).innerJoin(payments, eq(payments.id, serviceOrders.paymentId))
    .where(and(filter.userId ? eq(serviceOrders.userId, filter.userId) : undefined,
      filter.status && filter.status !== 'all' ? eq(serviceOrders.status, filter.status) : filter.userId ? undefined : inArray(serviceOrders.status, ['paid', 'in_progress', 'delivered', 'cancelled'])))
    .orderBy(desc(serviceOrders.createdAt)).limit(300);
  // The signature photo is left out of the list (it can be ~1 MB per order) and fetched on its own with getServiceOrderImage.
  return rows.map(({ o: { detailsEnc, reportPdf, reportPdfHi, notifyLog, ...o }, p }) => {
    const { signatureImage, ...details } = decryptJson<IntakeDetails>(detailsEnc);
    return { ...o, payment: p, details, hasSignatureImage: !!signatureImage, hasReportFile: !!(reportPdf || reportPdfHi), hasReportEn: !!reportPdf, hasReportHi: !!reportPdfHi, notify: parseNotifyLog(notifyLog) };
  });
}

/** One order of this customer (details decrypted, PDF left out), or null. */
export async function getUserServiceOrder(userId: string, id: string, db: Db = getDb()) {
  await ensureDeliveryColumns(db);
  const [row] = await db.select({ o: serviceOrders, paidAt: payments.paidAt, invoiceNumber: payments.invoiceNumber })
    .from(serviceOrders).innerJoin(payments, eq(payments.id, serviceOrders.paymentId))
    .where(and(eq(serviceOrders.id, id), eq(serviceOrders.userId, userId))).limit(1);
  if (!row) return null;
  const { detailsEnc, reportPdf, reportPdfHi, notifyLog: _log, ...o } = row.o;
  const { signatureImage: _img, ...details } = decryptJson<IntakeDetails>(detailsEnc);
  void _img; void _log;
  return { ...o, details, paidAt: row.paidAt, invoiceNumber: row.invoiceNumber, hasReportFile: !!(reportPdf || reportPdfHi), hasReportEn: !!reportPdf, hasReportHi: !!reportPdfHi, hasSignatureImage: !!_img };
}

export type ReportLanguage = 'en' | 'hi';

/** The stored report PDF of an order in one language (bytes + file name), or null. Without a language: English, else Hindi. */
export async function getServiceOrderReport(id: string, db: Db = getDb(), lang?: ReportLanguage): Promise<{ pdf: Uint8Array; fileName: string; lang: ReportLanguage } | null> {
  await ensureDeliveryColumns(db);
  const [row] = await db.select({ en: serviceOrders.reportPdf, enName: serviceOrders.reportFileName, hi: serviceOrders.reportPdfHi, hiName: serviceOrders.reportFileNameHi }).from(serviceOrders).where(eq(serviceOrders.id, id)).limit(1);
  if (!row) return null;
  const pick = (l: ReportLanguage) => {
    const b64 = l === 'en' ? row.en : row.hi;
    return b64 ? { pdf: new Uint8Array(Buffer.from(b64, 'base64')), fileName: (l === 'en' ? row.enName : row.hiName) || `numerology-report-${l}.pdf`, lang: l } : null;
  };
  return lang ? pick(lang) : pick('en') ?? pick('hi');
}

/** Max size of a report PDF stored on an order (base64 in the database). */
export const SERVICE_REPORT_MAX_BYTES = 15 * 1024 * 1024;

/**
 * Stores the finished report (one language) on the order. `markDelivered` (admin upload) also sets the order to Delivered.
 */
export async function saveServiceOrderReport(id: string, pdf: Uint8Array, fileName: string, opts: { markDelivered?: boolean; lang?: ReportLanguage; deliveredBy?: 'admin' | 'auto' } = {}, db: Db = getDb()) {
  if (pdf.byteLength > SERVICE_REPORT_MAX_BYTES) throw new Error('REPORT_TOO_LARGE');
  if (!(pdf[0] === 0x25 && pdf[1] === 0x50 && pdf[2] === 0x44 && pdf[3] === 0x46)) throw new Error('NOT_A_PDF'); // %PDF
  await ensureDeliveryColumns(db);
  const b64 = Buffer.from(pdf).toString('base64'), name = fileName.slice(0, 160);
  const set: Partial<typeof serviceOrders.$inferInsert> = opts.lang === 'hi' ? { reportPdfHi: b64, reportFileNameHi: name } : { reportPdf: b64, reportFileName: name };
  set.reportSavedAt = new Date(); set.updatedAt = new Date();
  if (opts.markDelivered) { set.status = 'delivered'; set.deliveredAt = new Date(); set.deliveredBy = opts.deliveredBy ?? 'admin'; set.deliveryError = null; }
  const [r] = await db.update(serviceOrders).set(set).where(eq(serviceOrders.id, id)).returning({ id: serviceOrders.id });
  return !!r;
}

/** Removes the stored report – one language, or both when none is given. */
export async function removeServiceOrderReport(id: string, db: Db = getDb(), lang?: ReportLanguage) {
  await ensureDeliveryColumns(db);
  const set: Partial<typeof serviceOrders.$inferInsert> = { updatedAt: new Date() };
  if (lang !== 'hi') { set.reportPdf = null; set.reportFileName = null; }
  if (lang !== 'en') { set.reportPdfHi = null; set.reportFileNameHi = null; }
  if (!lang) set.reportSavedAt = null;
  const [r] = await db.update(serviceOrders).set(set).where(eq(serviceOrders.id, id)).returning({ id: serviceOrders.id });
  return !!r;
}

/** The signature photo the client uploaded with the order, or null. */
export async function getServiceOrderImage(id: string, db: Db = getDb()): Promise<string | null> {
  const [row] = await db.select({ detailsEnc: serviceOrders.detailsEnc }).from(serviceOrders).where(eq(serviceOrders.id, id)).limit(1);
  return row ? decryptJson<IntakeDetails>(row.detailsEnc).signatureImage ?? null : null;
}

export const ServiceOrderUpdate = z.object({ id: z.string().min(1), status: z.enum(SERVICE_ORDER_STATUSES).optional(), adminNote: z.string().max(2000).nullable().optional(), onHold: z.boolean().optional() });
export async function updateServiceOrder(u: z.infer<typeof ServiceOrderUpdate>, db: Db = getDb()) {
  await ensureDeliveryColumns(db);
  const set: Partial<typeof serviceOrders.$inferInsert> = { updatedAt: new Date() };
  if (u.status) { set.status = u.status; set.deliveredAt = u.status === 'delivered' ? new Date() : null; set.deliveredBy = u.status === 'delivered' ? 'admin' : null; }
  if (u.onHold !== undefined) set.onHold = u.onHold;
  if (u.adminNote !== undefined) set.adminNote = u.adminNote?.trim() || null;
  const [r] = await db.update(serviceOrders).set(set).where(eq(serviceOrders.id, u.id)).returning({ id: serviceOrders.id });
  return !!r;
}

/* ---------- automatic delivery (lib/server/service-delivery-run.ts) ---------- */

export interface NotifyChannelResult { ok: boolean; to?: string; error?: string; skipped?: string; at: string }
export interface NotifyLog { sms?: NotifyChannelResult; email?: NotifyChannelResult }
export function parseNotifyLog(raw: string | null | undefined): NotifyLog | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as NotifyLog; } catch { return null; }
}

/** Minutes after which a worker's lock on an order is considered abandoned (the worker crashed or timed out). */
export const DELIVERY_LOCK_MIN = 12;
/** After this many failed attempts the order stays for the numerologist (shown with the error in Admin → Services). */
export const DELIVERY_MAX_ATTEMPTS = 4;

/** Everything the delivery needs about one order: details incl. the signature photo, payment time, the customer's contacts. */
export async function getServiceOrderForDelivery(id: string, db: Db = getDb()) {
  await ensureDeliveryColumns(db);
  const [row] = await db.select({ o: serviceOrders, paidAt: payments.paidAt, payStatus: payments.status, userEmail: users.email, userPhone: users.phone, userName: users.name })
    .from(serviceOrders).innerJoin(payments, eq(payments.id, serviceOrders.paymentId)).leftJoin(users, eq(users.id, serviceOrders.userId))
    .where(eq(serviceOrders.id, id)).limit(1);
  if (!row) return null;
  const { detailsEnc, reportPdf, reportPdfHi, notifyLog, ...o } = row.o;
  const { signatureImage, ...details } = decryptJson<IntakeDetails>(detailsEnc);
  return { ...o, details, signatureImage: signatureImage ?? null, hasReportEn: !!reportPdf, hasReportHi: !!reportPdfHi, notify: parseNotifyLog(notifyLog), paidAt: row.paidAt, paymentStatus: row.payStatus,
    user: { email: row.userEmail, phone: row.userPhone, name: row.userName } };
}
export type DeliveryOrder = NonNullable<Awaited<ReturnType<typeof getServiceOrderForDelivery>>>;

/**
 * Paid orders whose 3-hour mark has passed, that nobody has approved or put on hold, oldest first.
 * Orders already delivered but not yet notified are included (the notification is retried).
 */
export async function listDueServiceOrderIds(opts: { now?: Date; turnaroundMin: number; limit?: number; userId?: string } , db: Db = getDb()): Promise<string[]> {
  await ensureDeliveryColumns(db);
  const now = opts.now ?? new Date();
  const due = new Date(now.getTime() - opts.turnaroundMin * 60_000);
  const lockStale = new Date(now.getTime() - DELIVERY_LOCK_MIN * 60_000);
  const rows = await db.select({ id: serviceOrders.id }).from(serviceOrders).innerJoin(payments, eq(payments.id, serviceOrders.paymentId))
    .where(and(
      eq(payments.status, 'paid'), lte(payments.paidAt, due),
      opts.userId ? eq(serviceOrders.userId, opts.userId) : undefined,
      or(isNull(serviceOrders.deliveryLockAt), lt(serviceOrders.deliveryLockAt, lockStale)),
      lt(serviceOrders.deliveryAttempts, DELIVERY_MAX_ATTEMPTS),
      or(
        and(inArray(serviceOrders.status, ['paid', 'in_progress']), eq(serviceOrders.onHold, false)),
        // delivered (by admin or automatically) but the client has not been told yet – only recent ones
        and(eq(serviceOrders.status, 'delivered'), isNull(serviceOrders.notifiedAt), sql`${serviceOrders.deliveredAt} > now() - interval '3 days'`),
      ),
    ))
    .orderBy(asc(payments.paidAt)).limit(opts.limit ?? 20);
  return rows.map((r) => r.id);
}

/** Takes the order for one worker (atomic). Returns false when another worker holds it. */
export async function claimServiceOrder(id: string, db: Db = getDb(), now = new Date()): Promise<boolean> {
  const lockStale = new Date(now.getTime() - DELIVERY_LOCK_MIN * 60_000);
  const [r] = await db.update(serviceOrders).set({ deliveryLockAt: now })
    .where(and(eq(serviceOrders.id, id), or(isNull(serviceOrders.deliveryLockAt), lt(serviceOrders.deliveryLockAt, lockStale))))
    .returning({ id: serviceOrders.id });
  return !!r;
}

export async function releaseServiceOrder(id: string, outcome: { delivered?: { by: 'admin' | 'auto' }; error?: string | null; keepLock?: boolean }, db: Db = getDb()) {
  const set: Partial<typeof serviceOrders.$inferInsert> = { deliveryLockAt: outcome.keepLock ? new Date() : null, updatedAt: new Date() };
  if (outcome.delivered) {
    set.deliveryError = null;
    await db.update(serviceOrders).set({ ...set, status: 'delivered', deliveredBy: outcome.delivered.by, deliveredAt: sql`coalesce(${serviceOrders.deliveredAt}, now())` as unknown as Date })
      .where(eq(serviceOrders.id, id));
    // an order that was already delivered keeps its delivered time and "delivered by"
    return;
  }
  if (outcome.error !== undefined) { set.deliveryError = outcome.error?.slice(0, 500) ?? null; if (outcome.error) set.deliveryAttempts = sql`${serviceOrders.deliveryAttempts} + 1` as unknown as number; }
  await db.update(serviceOrders).set(set).where(eq(serviceOrders.id, id));
}

/** Records the "report ready" notification. `done` marks it sent so it is never repeated. */
export async function recordServiceOrderNotification(id: string, log: NotifyLog, done: boolean, db: Db = getDb()) {
  await db.update(serviceOrders).set({ notifyLog: JSON.stringify(log), ...(done ? { notifiedAt: new Date() } : {}), updatedAt: new Date() }).where(eq(serviceOrders.id, id));
}

/** Admin "Retry": clears the attempts counter and the error so the next run tries again. */
export async function resetServiceOrderDelivery(id: string, opts: { renotify?: boolean } = {}, db: Db = getDb()) {
  await ensureDeliveryColumns(db);
  const [r] = await db.update(serviceOrders).set({ deliveryAttempts: 0, deliveryError: null, deliveryLockAt: null, ...(opts.renotify ? { notifiedAt: null, notifyLog: null } : {}), updatedAt: new Date() })
    .where(eq(serviceOrders.id, id)).returning({ id: serviceOrders.id });
  return !!r;
}
