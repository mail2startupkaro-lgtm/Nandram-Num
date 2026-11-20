/**
 * Hand-written pillar guides (15), English + Hindi, including the Acharya Nandram profile article.
 * Facts follow the site's method: Mulank = day of birth; Bhagyank = full date (master 11/22/33 shown for 2/4/6);
 * Lo Shu = DOB digits + Bhagyank + Kua (+ Mulank by rule); personal year birthday to birthday.
 */
import { relationOf } from '@/lib/numerology/data/relations';
import { PY_THEMES } from '@/lib/i18n/numberMeanings';
import { mulankFor } from '@/lib/mulank-data';
import type { Art } from './art';
import type { Block, Section } from './generate';
import { DISCLAIM, NUMS, calcLink, calcSection, clip, fig, finish, list, p, sec, serviceLink, steps, table, tip, cards, type CalcKey, type Lang, type ServiceKey, type TopicPost, type TopicRef } from './topic-kit';

type Side = { title: string; h1: string; description: string; kicker: string; sub: string; faqs: { q: string; a: string }[] };
type S = { id: string; cta?: boolean; en: [string, Block[]]; hi: [string, Block[]] };
interface Pillar { slug: string; art: Art; keywords: string[]; service: ServiceKey; calc: CalcKey; calcs: CalcKey[]; en: Side; hi: Side; sections: S[] }

const WA = '+91 88199 99374';

function build(x: Pillar, lang: Lang): TopicPost {
  const side = x[lang];
  const sections: Section[] = [
    ...x.sections.map((s) => sec(s.id, s[lang][0], s[lang][1], !!s.cta)),
    calcSection(lang, x.calcs),
    sec('faq', lang === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions', [p(DISCLAIM[lang])]),
  ];
  return finish({ slug: x.slug, cat: 'guide', title: side.title, h1: side.h1, description: clip(side.description), keywords: x.keywords, kicker: side.kicker, sub: side.sub,
    art: x.art, sections, faqs: side.faqs, service: serviceLink(lang, x.service), calc: calcLink(lang, x.calc) });
}

/* 2027 forecast table – universal year 2 against each Mulank, from the friendship table. */
const u2027 = (lang: Lang) => NUMS.map((n) => {
  const r = relationOf(n, 2);
  const m = mulankFor(n, lang)!;
  return [String(n), m.planet, lang === 'hi' ? { friend: 'सहायक वर्ष', neutral: 'संतुलित वर्ष', enemy: 'सावधानी का वर्ष' }[r] : { friend: 'Supportive year', neutral: 'Balanced year', enemy: 'Year for care' }[r],
    lang === 'hi' ? { friend: 'साझेदारी, विवाह और नए संबंधों के लिए अच्छा।', neutral: 'धैर्य से स्थिर प्रगति; जल्दबाज़ी न करें।', enemy: 'भावनात्मक निर्णयों और साझेदारी में सावधानी; उपाय अपनाएँ।' }[r] : { friend: 'Good for partnerships, marriage and new alliances.', neutral: 'Steady progress with patience; avoid rushing.', enemy: 'Be careful with emotional decisions and partnerships; follow remedies.' }[r]];
});

const PILLARS: Pillar[] = [
  /* 1 ─ Profile */
  {
    slug: 'acharya-nandram-numerologist-profile', art: { t: 'portrait' }, service: 'report', calc: 'moolank', calcs: ['moolank', 'bhagyank', 'loshu', 'mobile'],
    keywords: ['acharya nandram', 'acharya nandram numerologist', 'best numerologist in india', 'online numerologist', 'numerology consultation online', 'mynumerologist', 'आचार्य नंदराम'],
    en: { title: 'Acharya Nandram – Numerologist Profile, Method & Services', h1: 'Acharya Nandram: Numerologist with 15+ Years of Experience', description: 'Meet Acharya Nandram, numerologist with 15+ years in Vedic, Chaldean and Lo Shu numerology. His method, services, reports in English and Hindi, and how to consult him online.', kicker: 'About the expert', sub: 'Vedic, Chaldean and Lo Shu numerology – personal reports, name correction, lucky mobile numbers and couple matching, online across India and abroad.',
      faqs: [
        { q: 'Who is Acharya Nandram?', a: 'Acharya Nandram is an Indian numerologist with more than 15 years of practice in Vedic, Chaldean and Lo Shu grid numerology, and the expert behind myNumerologist.com.' },
        { q: 'Does Acharya Nandram consult online?', a: 'Yes. Reports and consultations are delivered online, so people anywhere in India and abroad can use them from home.' },
        { q: 'In which languages are reports available?', a: 'English, Hindi and Hinglish.' },
        { q: 'How quickly is a report ready?', a: 'The designed Complete Life Report is usually ready about 2 hours after you submit your details.' },
        { q: 'How can I contact him?', a: `Use the contact page on the website, or WhatsApp ${WA} for consultations.` },
      ] },
    hi: { title: 'आचार्य नंदराम – अंक ज्योतिषी प्रोफ़ाइल, विधि और सेवाएँ', h1: 'आचार्य नंदराम: 15+ वर्षों के अनुभव वाले अंक ज्योतिषी', description: 'आचार्य नंदराम से मिलें – वैदिक, कैल्डियन और लो शू अंक ज्योतिष में 15+ वर्ष। उनकी विधि, सेवाएँ, हिंदी व अंग्रेज़ी रिपोर्ट और ऑनलाइन परामर्श।', kicker: 'विशेषज्ञ के बारे में', sub: 'वैदिक, कैल्डियन और लो शू अंक ज्योतिष – व्यक्तिगत रिपोर्ट, नाम सुधार, शुभ मोबाइल नंबर और जोड़ी मिलान, पूरे भारत और विदेश में ऑनलाइन।',
      faqs: [
        { q: 'आचार्य नंदराम कौन हैं?', a: 'आचार्य नंदराम भारतीय अंक ज्योतिषी हैं जिन्हें वैदिक, कैल्डियन और लो शू ग्रिड अंक ज्योतिष में 15 वर्षों से अधिक का अनुभव है; वे इस वेबसाइट के विशेषज्ञ हैं।' },
        { q: 'क्या आचार्य नंदराम ऑनलाइन परामर्श देते हैं?', a: 'हाँ। रिपोर्ट और परामर्श ऑनलाइन दिए जाते हैं, इसलिए भारत या विदेश में कहीं से भी घर बैठे लाभ लिया जा सकता है।' },
        { q: 'रिपोर्ट किन भाषाओं में मिलती है?', a: 'अंग्रेज़ी, हिंदी और हिंग्लिश में।' },
        { q: 'रिपोर्ट कितनी जल्दी तैयार होती है?', a: 'डिज़ाइन की हुई संपूर्ण जीवन रिपोर्ट आमतौर पर विवरण जमा करने के लगभग 2 घंटे बाद तैयार हो जाती है।' },
        { q: 'उनसे संपर्क कैसे करें?', a: `वेबसाइट के संपर्क पेज का उपयोग करें, या परामर्श के लिए व्हाट्सऐप ${WA} पर संदेश भेजें।` },
      ] },
    sections: [
      { id: 'about', cta: true, en: ['Who Is Acharya Nandram?', [
        p('Acharya Nandram is an Indian numerologist who has practised Vedic, Chaldean and Lo Shu grid numerology for more than 15 years. Over this time he has guided thousands of individuals and families – students choosing careers, couples planning marriage, parents naming a newborn, and business owners choosing a name or launch date.'),
        fig({ t: 'portrait' }, 'Acharya Nandram – numerologist, author and guide'),
        p('His work is known for two things: exact, traditional calculations that give the same result every time, and explanations in plain language that the whole family can read. He is also the author of numerology books and guides in English and Hindi, and the expert behind the free calculators on this website.'),
      ]], hi: ['आचार्य नंदराम कौन हैं?', [
        p('आचार्य नंदराम भारतीय अंक ज्योतिषी हैं, जो 15 वर्षों से अधिक समय से वैदिक, कैल्डियन और लो शू ग्रिड अंक ज्योतिष का अभ्यास कर रहे हैं। इस दौरान उन्होंने हज़ारों व्यक्तियों और परिवारों का मार्गदर्शन किया है – करियर चुनते विद्यार्थी, विवाह की योजना बनाते दंपति, नवजात का नाम रखते माता-पिता और व्यवसाय का नाम या लॉन्च तिथि चुनते उद्यमी।'),
        fig({ t: 'portrait' }, 'आचार्य नंदराम – अंक ज्योतिषी, लेखक और मार्गदर्शक'),
        p('उनका काम दो बातों के लिए जाना जाता है: सटीक, पारंपरिक गणना जो हर बार एक ही परिणाम दे, और सरल भाषा में व्याख्या जिसे पूरा परिवार पढ़ सके। वे अंग्रेज़ी और हिंदी में अंक ज्योतिष की पुस्तकों व मार्गदर्शिकाओं के लेखक भी हैं और इस वेबसाइट के मुफ़्त कैलकुलेटरों के पीछे के विशेषज्ञ हैं।'),
      ]] },
      { id: 'method', en: ['His Method: One Chart, Not One Number', [
        p('A single number never decides a life. In every reading Acharya Nandram reads these layers together as one chart:'),
        list(['Mulank (day of birth) – your nature', 'Bhagyank (full date of birth) – your destiny path, with master numbers 11, 22 and 33', 'Lo Shu grid – strengths, missing numbers, planes and yogs', 'Chaldean name number – your public vibration', 'Mobile number – the energy you live with daily', 'Kua number and personal year – directions and timing']),
        tip('Numerology should give clarity, not fear. If a reading only frightens you, it has not done its job. My aim is always one practical step you can take this week.'),
      ]], hi: ['उनकी विधि: एक अंक नहीं, पूरा चार्ट', [
        p('कोई एक अंक जीवन तय नहीं करता। हर रीडिंग में आचार्य नंदराम इन परतों को एक चार्ट के रूप में साथ पढ़ते हैं:'),
        list(['मूलांक (जन्म का दिन) – आपका स्वभाव', 'भाग्यांक (पूरी जन्म तिथि) – जीवन-पथ, मास्टर अंक 11, 22 और 33 सहित', 'लो शू ग्रिड – ख़ूबियाँ, अनुपस्थित अंक, तल और योग', 'कैल्डियन नामांक – आपका सार्वजनिक कंपन', 'मोबाइल नंबर – रोज़ साथ रहने वाली ऊर्जा', 'कुआ अंक और व्यक्तिगत वर्ष – दिशाएँ और सही समय']),
        tip('अंक ज्योतिष स्पष्टता दे, डर नहीं। जो रीडिंग केवल डराए, उसने अपना काम नहीं किया। मेरा लक्ष्य हमेशा एक ऐसा व्यावहारिक क़दम होता है जो आप इसी सप्ताह उठा सकें।'),
      ]] },
      { id: 'services', cta: true, en: ['Services and Reports', [
        cards([
          { title: 'Personal Numerology Report', text: 'Complete life report: Mulank, Bhagyank, Lo Shu, name, mobile, Kua and personal year with remedies.', href: '/personal-numerology-report' },
          { title: 'Name Correction', text: 'A few suitable spellings matched to your date of birth.', href: '/name-numerology' },
          { title: 'Lucky Mobile Number', text: 'Check your number or choose a new one that suits you.', href: '/mobile-number-numerology' },
          { title: 'Couple Compatibility', text: 'Marriage matching with both charts and remedies.', href: '/couple-compatibility-report' },
          { title: 'Baby Name Numerology', text: 'Names that match your child’s date of birth.', href: '/baby-name-numerology' },
          { title: 'Business Name & Signature', text: 'Business name, launch date and signature analysis.', href: '/business-name-numerology' },
        ]),
        p('Reports are designed PDFs in English, Hindi or Hinglish. The Complete Life Report is usually ready about 2 hours after you submit your details, and every report includes personal remedies – colours, days, mantras, daan and habits – without expensive rituals.'),
      ]], hi: ['सेवाएँ और रिपोर्ट', [
        cards([
          { title: 'व्यक्तिगत अंक ज्योतिष रिपोर्ट', text: 'संपूर्ण जीवन रिपोर्ट: मूलांक, भाग्यांक, लो शू, नाम, मोबाइल, कुआ और व्यक्तिगत वर्ष, उपायों सहित।', href: '/personal-numerology-report' },
          { title: 'नाम सुधार', text: 'आपकी जन्म तिथि से मेल खाती कुछ अनुकूल वर्तनियाँ।', href: '/name-numerology' },
          { title: 'शुभ मोबाइल नंबर', text: 'अपना नंबर जाँचें या अपने अनुकूल नया नंबर चुनें।', href: '/mobile-number-numerology' },
          { title: 'जोड़ी मिलान', text: 'दोनों चार्ट और उपायों के साथ विवाह मिलान।', href: '/couple-compatibility-report' },
          { title: 'शिशु नाम अंक ज्योतिष', text: 'बच्चे की जन्म तिथि से मेल खाते नाम।', href: '/baby-name-numerology' },
          { title: 'व्यवसाय नाम और हस्ताक्षर', text: 'व्यवसाय का नाम, लॉन्च तिथि और हस्ताक्षर विश्लेषण।', href: '/business-name-numerology' },
        ]),
        p('रिपोर्ट अंग्रेज़ी, हिंदी या हिंग्लिश में डिज़ाइन की हुई PDF होती हैं। संपूर्ण जीवन रिपोर्ट आमतौर पर विवरण जमा करने के लगभग 2 घंटे बाद तैयार हो जाती है, और हर रिपोर्ट में व्यक्तिगत उपाय – रंग, दिन, मंत्र, दान और आदतें – शामिल होते हैं, बिना महँगे अनुष्ठानों के।'),
      ]] },
      { id: 'why', en: ['Why People Choose Him', [
        list(['15+ years of focused practice in three systems – Vedic, Chaldean and Lo Shu', 'The same calculation engine on the website and in the reports, so results are consistent', 'Plain-language explanations in English, Hindi and Hinglish', 'Practical, low-cost remedies and honest guidance', 'Online service for India and international clients, with prices shown in your currency']),
      ]], hi: ['लोग उन्हें क्यों चुनते हैं', [
        list(['तीन पद्धतियों – वैदिक, कैल्डियन और लो शू – में 15+ वर्षों का समर्पित अभ्यास', 'वेबसाइट और रिपोर्ट में एक ही गणना-इंजन, इसलिए परिणाम एक जैसे', 'अंग्रेज़ी, हिंदी और हिंग्लिश में सरल व्याख्या', 'व्यावहारिक, कम ख़र्च वाले उपाय और ईमानदार मार्गदर्शन', 'भारत और विदेश के लिए ऑनलाइन सेवा, आपकी मुद्रा में मूल्य']),
      ]] },
      { id: 'contact', en: ['How to Consult Acharya Nandram', [
        steps([
          { title: 'Try the free calculators', text: 'Find your Mulank, Bhagyank and Lo Shu grid in a minute.' },
          { title: 'Choose your reading', text: 'Pick the reading you need on the “Get my reading” page and enter only those details.' },
          { title: 'Receive your report', text: 'Get a designed PDF in your language, with remedies you can follow.' },
          { title: 'Ask follow-up questions', text: `Use the contact page or WhatsApp ${WA} for consultations.` },
        ]),
      ]], hi: ['आचार्य नंदराम से परामर्श कैसे लें', [
        steps([
          { title: 'मुफ़्त कैलकुलेटर आज़माएँ', text: 'एक मिनट में अपना मूलांक, भाग्यांक और लो शू ग्रिड जानें।' },
          { title: 'अपनी रीडिंग चुनें', text: '"मेरी रीडिंग पाएँ" पेज पर ज़रूरत की रीडिंग चुनें और केवल वही विवरण भरें।' },
          { title: 'रिपोर्ट पाएँ', text: 'अपनी भाषा में डिज़ाइन की हुई PDF, ऐसे उपायों के साथ जिन्हें आप अपना सकें।' },
          { title: 'आगे के प्रश्न पूछें', text: `परामर्श के लिए संपर्क पेज या व्हाट्सऐप ${WA} का उपयोग करें।` },
        ]),
      ]] },
    ],
  },

  /* 2 ─ Beginner's guide */
  {
    slug: 'what-is-numerology-complete-beginners-guide', art: { t: 'wheel' }, service: 'report', calc: 'moolank', calcs: ['moolank', 'bhagyank', 'loshu', 'name'],
    keywords: ['what is numerology', 'numerology for beginners', 'numerology meaning', 'how numerology works', 'indian numerology', 'अंक ज्योतिष क्या है'],
    en: { title: 'What Is Numerology? A Complete Beginner’s Guide (Indian Method)', h1: 'What Is Numerology? A Complete Beginner’s Guide', description: 'What numerology is, how numbers 1–9 and their planets work, Mulank, Bhagyank, name and Lo Shu explained simply for beginners by Acharya Nandram.', kicker: 'Beginner’s guide', sub: 'Numbers 1–9, their planets, and the five numbers every person should know – explained simply.',
      faqs: [
        { q: 'Is numerology scientific?', a: 'Numerology is a traditional system of symbolism and guidance, not a laboratory science. Many people find it useful for self-understanding and timing.' },
        { q: 'Which numerology system is used in India?', a: 'Vedic numerology for the date of birth, with Chaldean values for names and mobile numbers, and the Lo Shu grid.' },
        { q: 'What is the most important number?', a: 'Mulank and Bhagyank together, read with the name number and Lo Shu grid.' },
        { q: 'Can numerology change my future?', a: 'It cannot guarantee outcomes. It helps you understand tendencies and choose better timing, names and numbers.' },
        { q: 'Where should a beginner start?', a: 'Use the free Moolank and Bhagyank calculators, then read the guides for your two numbers.' },
      ] },
    hi: { title: 'अंक ज्योतिष क्या है? शुरुआती लोगों के लिए संपूर्ण मार्गदर्शिका', h1: 'अंक ज्योतिष क्या है? शुरुआती लोगों के लिए संपूर्ण मार्गदर्शिका', description: 'अंक ज्योतिष क्या है, 1 से 9 तक के अंक और उनके ग्रह कैसे काम करते हैं, मूलांक, भाग्यांक, नाम और लो शू – आचार्य नंदराम द्वारा सरल भाषा में।', kicker: 'शुरुआती मार्गदर्शिका', sub: '1 से 9 तक के अंक, उनके ग्रह और वे पाँच अंक जो हर व्यक्ति को जानने चाहिए – सरल भाषा में।',
      faqs: [
        { q: 'क्या अंक ज्योतिष वैज्ञानिक है?', a: 'अंक ज्योतिष प्रतीकों और मार्गदर्शन की पारंपरिक पद्धति है, प्रयोगशाला का विज्ञान नहीं। बहुत से लोग इसे आत्म-समझ और सही समय चुनने में उपयोगी पाते हैं।' },
        { q: 'भारत में कौन-सी पद्धति उपयोग होती है?', a: 'जन्म तिथि के लिए वैदिक अंक ज्योतिष, नाम और मोबाइल के लिए कैल्डियन मान, और लो शू ग्रिड।' },
        { q: 'सबसे महत्वपूर्ण अंक कौन-सा है?', a: 'मूलांक और भाग्यांक साथ में, नामांक और लो शू ग्रिड के साथ पढ़े जाएँ।' },
        { q: 'क्या अंक ज्योतिष भविष्य बदल सकता है?', a: 'यह परिणाम की गारंटी नहीं देता। यह प्रवृत्तियाँ समझने और बेहतर समय, नाम व अंक चुनने में मदद करता है।' },
        { q: 'शुरुआत कहाँ से करें?', a: 'मुफ़्त मूलांक और भाग्यांक कैलकुलेटर उपयोग करें, फिर अपने दोनों अंकों की मार्गदर्शिकाएँ पढ़ें।' },
      ] },
    sections: [
      { id: 'intro', cta: true, en: ['Numerology in Simple Words', [
        p('Numerology is the traditional study of how numbers connected to your life – your date of birth, your name, your mobile and house numbers – reflect your nature, strengths and the timing of events. In Indian numerology each number from 1 to 9 is linked with one of the nine planets (Navagraha).'),
        fig({ t: 'wheel' }, 'The nine numbers of numerology, each ruled by a planet'),
        p('Think of it as a language. Each number has a personality; when several numbers meet in your chart, they either support or challenge each other, just as people do.'),
      ]], hi: ['सरल शब्दों में अंक ज्योतिष', [
        p('अंक ज्योतिष इस बात का पारंपरिक अध्ययन है कि आपके जीवन से जुड़े अंक – जन्म तिथि, नाम, मोबाइल और मकान नंबर – आपके स्वभाव, ख़ूबियों और घटनाओं के समय को कैसे दर्शाते हैं। भारतीय अंक ज्योतिष में 1 से 9 तक हर अंक नवग्रहों में से किसी एक ग्रह से जुड़ा है।'),
        fig({ t: 'wheel' }, 'अंक ज्योतिष के नौ अंक, हर एक का स्वामी एक ग्रह'),
        p('इसे एक भाषा की तरह समझें। हर अंक का अपना व्यक्तित्व है; जब आपके चार्ट में कई अंक मिलते हैं, तो वे लोगों की तरह एक-दूसरे का साथ देते हैं या चुनौती देते हैं।'),
      ]] },
      { id: 'planets', en: ['Numbers 1–9 and Their Planets', [
        table(['Number', 'Planet', 'Key quality'], NUMS.map((n) => [String(n), mulankFor(n, 'en')!.planet, mulankFor(n, 'en')!.title])),
      ]], hi: ['अंक 1–9 और उनके ग्रह', [
        table(['अंक', 'ग्रह', 'मुख्य पहचान'], NUMS.map((n) => [String(n), mulankFor(n, 'hi')!.planet, mulankFor(n, 'hi')!.title])),
      ]] },
      { id: 'five', en: ['The Five Numbers Everyone Should Know', [
        steps([
          { title: 'Mulank (root number)', text: 'Your day of birth reduced to one digit. Born on the 23rd: 2 + 3 = 5.' },
          { title: 'Bhagyank (destiny number)', text: 'All digits of your full date of birth added and reduced. It shows your life path.' },
          { title: 'Name number', text: 'Letters of your name added with Chaldean values. It shapes how the world sees you.' },
          { title: 'Lo Shu grid', text: 'A 3×3 grid of your birth digits showing strengths and missing numbers.' },
          { title: 'Personal year', text: 'Day + month of birth + the year of your last birthday – the theme of your current year.' },
        ]),
      ]], hi: ['पाँच अंक जो हर किसी को जानने चाहिए', [
        steps([
          { title: 'मूलांक (मूल अंक)', text: 'जन्म का दिन एक अंक तक जोड़ें। 23 तारीख़: 2 + 3 = 5।' },
          { title: 'भाग्यांक (भाग्य अंक)', text: 'पूरी जन्म तिथि के सभी अंक जोड़कर एक अंक तक। यह जीवन-पथ बताता है।' },
          { title: 'नामांक', text: 'नाम के अक्षरों के कैल्डियन मान जोड़ें। यह तय करता है कि दुनिया आपको कैसे देखती है।' },
          { title: 'लो शू ग्रिड', text: 'जन्म-अंकों का 3×3 ग्रिड, जो ख़ूबियाँ और अनुपस्थित अंक दिखाता है।' },
          { title: 'व्यक्तिगत वर्ष', text: 'जन्म का दिन + महीना + पिछले जन्मदिन का वर्ष – आपके वर्तमान वर्ष का विषय।' },
        ]),
      ]] },
      { id: 'friends', cta: true, en: ['Friendly and Unfriendly Numbers', [
        p('Numbers have friendships, just like planets. When your name, mobile number or partner’s number is friendly with your Mulank and Bhagyank, life feels smoother; when they clash, effort feels heavier. This friendship table is the backbone of every score in our reports.'),
        tip('Beginners often look only at “lucky numbers”. The more useful question is: which numbers are friendly with BOTH my Mulank and my Bhagyank? Start there.'),
      ]], hi: ['मित्र और शत्रु अंक', [
        p('ग्रहों की तरह अंकों की भी मित्रता होती है। जब आपका नाम, मोबाइल नंबर या जीवनसाथी का अंक आपके मूलांक और भाग्यांक का मित्र हो, तो जीवन सहज लगता है; टकराव हो तो प्रयास भारी लगता है। यही मित्रता तालिका हमारी हर रिपोर्ट के स्कोर का आधार है।'),
        tip('शुरुआती लोग अक्सर केवल "शुभ अंक" देखते हैं। अधिक उपयोगी प्रश्न है: कौन-से अंक मेरे मूलांक और भाग्यांक दोनों के मित्र हैं? वहीं से शुरुआत करें।'),
      ]] },
      { id: 'uses', en: ['What Numerology Is Used For', [
        list(['Understanding yourself and your children', 'Career and business direction', 'Marriage compatibility and wedding dates', 'Name, baby name and business name selection', 'Choosing mobile, house and vehicle numbers', 'Timing important decisions with personal years']),
      ]], hi: ['अंक ज्योतिष किन कामों में उपयोगी है', [
        list(['स्वयं और अपने बच्चों को समझना', 'करियर और व्यवसाय की दिशा', 'विवाह अनुकूलता और विवाह की तिथि', 'नाम, शिशु नाम और व्यवसाय नाम का चयन', 'मोबाइल, मकान और वाहन नंबर चुनना', 'व्यक्तिगत वर्ष से महत्वपूर्ण निर्णयों का समय']),
      ]] },
    ],
  },

  /* 3 ─ Systems */
  {
    slug: 'vedic-chaldean-pythagorean-numerology-difference', art: { t: 'letters', letters: 'VEDIC', n: 3 }, service: 'name', calc: 'name', calcs: ['name', 'moolank', 'bhagyank', 'loshu'],
    keywords: ['vedic vs chaldean numerology', 'chaldean vs pythagorean', 'which numerology is accurate', 'types of numerology', 'chaldean numerology india', 'वैदिक कैल्डियन अंक ज्योतिष'],
    en: { title: 'Vedic vs Chaldean vs Pythagorean Numerology: Which Is Accurate?', h1: 'Vedic, Chaldean and Pythagorean Numerology: The Differences', description: 'Vedic, Chaldean and Pythagorean numerology compared – letter charts, uses, accuracy, and why Acharya Nandram uses Vedic for dates and Chaldean for names.', kicker: 'Numerology systems', sub: 'Three systems, three strengths – and how they work together in one reading.',
      faqs: [
        { q: 'Which numerology system is most accurate?', a: 'Each has its strength. We use Vedic for the date of birth and Chaldean for names and mobile numbers, with Pythagorean as a second opinion.' },
        { q: 'Why does Chaldean not use 9 for letters?', a: 'In the Chaldean tradition 9 is considered sacred and is not assigned to any letter, though it can appear as a total.' },
        { q: 'Can my name number differ between systems?', a: 'Yes, because the letter values differ. That is why a reading should always state which system was used.' },
        { q: 'Is Lo Shu part of Vedic numerology?', a: 'Lo Shu comes from Chinese tradition, but it is widely used in Indian numerology alongside the Vedic grid.' },
        { q: 'Do I need all three systems?', a: 'No. A good reading uses the right system for each question and explains it simply.' },
      ] },
    hi: { title: 'वैदिक, कैल्डियन और पाइथागोरियन अंक ज्योतिष: कौन-सा सटीक है?', h1: 'वैदिक, कैल्डियन और पाइथागोरियन अंक ज्योतिष में अंतर', description: 'वैदिक, कैल्डियन और पाइथागोरियन अंक ज्योतिष की तुलना – अक्षर तालिका, उपयोग, सटीकता, और आचार्य नंदराम जन्म तिथि के लिए वैदिक व नाम के लिए कैल्डियन क्यों चुनते हैं।', kicker: 'अंक ज्योतिष पद्धतियाँ', sub: 'तीन पद्धतियाँ, तीन ख़ूबियाँ – और एक रीडिंग में वे साथ कैसे काम करती हैं।',
      faqs: [
        { q: 'कौन-सी पद्धति सबसे सटीक है?', a: 'हर पद्धति की अपनी ख़ूबी है। हम जन्म तिथि के लिए वैदिक और नाम व मोबाइल के लिए कैल्डियन उपयोग करते हैं, पाइथागोरियन को दूसरी राय के रूप में।' },
        { q: 'कैल्डियन में अक्षरों को 9 क्यों नहीं दिया जाता?', a: 'कैल्डियन परंपरा में 9 को पवित्र माना जाता है, इसलिए किसी अक्षर को नहीं दिया जाता, पर योग में 9 आ सकता है।' },
        { q: 'क्या दोनों पद्धतियों में नामांक अलग आ सकता है?', a: 'हाँ, क्योंकि अक्षर-मान अलग हैं। इसलिए रीडिंग में हमेशा बताया जाना चाहिए कि कौन-सी पद्धति उपयोग हुई।' },
        { q: 'क्या लो शू वैदिक अंक ज्योतिष का हिस्सा है?', a: 'लो शू चीनी परंपरा से आया है, पर भारतीय अंक ज्योतिष में वैदिक ग्रिड के साथ व्यापक रूप से उपयोग होता है।' },
        { q: 'क्या तीनों पद्धतियाँ ज़रूरी हैं?', a: 'नहीं। अच्छी रीडिंग हर प्रश्न के लिए सही पद्धति चुनती है और उसे सरल भाषा में समझाती है।' },
      ] },
    sections: [
      { id: 'overview', cta: true, en: ['Three Systems at a Glance', [
        table(['System', 'Origin', 'Best used for'], [['Vedic', 'Indian tradition, planets (Navagraha)', 'Date of birth: Mulank, Bhagyank, remedies'], ['Chaldean', 'Ancient Babylon (Chaldea)', 'Names, mobile and business names'], ['Pythagorean', 'Greek mathematician Pythagoras', 'Western name analysis, second opinion']]),
        fig({ t: 'letters', letters: 'VEDIC', n: 3 }, 'Letters carry values – but the values depend on the system'),
      ]], hi: ['तीनों पद्धतियाँ एक नज़र में', [
        table(['पद्धति', 'उत्पत्ति', 'सबसे उपयोगी'], [['वैदिक', 'भारतीय परंपरा, नवग्रह', 'जन्म तिथि: मूलांक, भाग्यांक, उपाय'], ['कैल्डियन', 'प्राचीन बेबीलोन (कैल्डिया)', 'नाम, मोबाइल और व्यवसाय नाम'], ['पाइथागोरियन', 'यूनानी गणितज्ञ पाइथागोरस', 'पश्चिमी नाम विश्लेषण, दूसरी राय']]),
        fig({ t: 'letters', letters: 'VEDIC', n: 3 }, 'अक्षरों के मान होते हैं – पर मान पद्धति पर निर्भर हैं'),
      ]] },
      { id: 'vedic', en: ['Vedic Numerology', [p('Vedic numerology links each number with a planet and uses the date of birth as the primary source. Mulank (day of birth) shows your nature and Bhagyank (full date) shows your destiny path. Remedies come from planetary tradition: days, colours, mantras, gemstones and daan. It is the foundation of every reading we do.')]], hi: ['वैदिक अंक ज्योतिष', [p('वैदिक अंक ज्योतिष हर अंक को एक ग्रह से जोड़ता है और जन्म तिथि को मुख्य आधार मानता है। मूलांक (जन्म का दिन) स्वभाव बताता है और भाग्यांक (पूरी तिथि) जीवन-पथ। उपाय ग्रह-परंपरा से आते हैं: दिन, रंग, मंत्र, रत्न और दान। यही हमारी हर रीडिंग की नींव है।')]] },
      { id: 'chaldean', en: ['Chaldean Numerology', [p('The Chaldean system gives letters values from 1 to 8 based on their sound vibration; 9 is not assigned to any letter. It also reads compound numbers (10 to 52) for deeper meaning, which makes it very precise for names. In India it is the most used system for name correction and mobile numbers.'), tip('When you compare name numbers from two websites and they differ, check which system each used. Most confusion comes from mixing Chaldean and Pythagorean values.')]], hi: ['कैल्डियन अंक ज्योतिष', [p('कैल्डियन पद्धति अक्षरों को उनकी ध्वनि-कंपन के आधार पर 1 से 8 तक मान देती है; 9 किसी अक्षर को नहीं दिया जाता। यह गहरे अर्थ के लिए मिश्रित अंक (10 से 52) भी पढ़ती है, जिससे नामों के लिए यह बहुत सटीक बनती है। भारत में नाम सुधार और मोबाइल नंबर के लिए यही सबसे अधिक प्रचलित है।'), tip('दो वेबसाइटों पर नामांक अलग आए तो देखें कि किसने कौन-सी पद्धति उपयोग की। अधिकतर भ्रम कैल्डियन और पाइथागोरियन मानों को मिलाने से होता है।')]] },
      { id: 'pythagorean', en: ['Pythagorean Numerology', [p('Pythagorean numerology assigns values 1 to 9 to letters in alphabetical order (A=1 … I=9, J=1 …). It is simple and popular in the West, and useful for soul urge and personality numbers. We use it as a second opinion alongside Chaldean.')]], hi: ['पाइथागोरियन अंक ज्योतिष', [p('पाइथागोरियन अंक ज्योतिष अक्षरों को वर्णमाला के क्रम में 1 से 9 तक मान देता है। यह सरल है और पश्चिम में लोकप्रिय है; आत्मा-इच्छा और व्यक्तित्व अंक के लिए उपयोगी है। हम इसे कैल्डियन के साथ दूसरी राय के रूप में देखते हैं।')]] },
      { id: 'together', en: ['How They Work Together', [list(['Vedic for Mulank, Bhagyank, planets and remedies', 'Chaldean for names, mobile and business names', 'Lo Shu grid for strengths and missing numbers', 'Pythagorean as a cross-check for names'])]], hi: ['ये साथ कैसे काम करती हैं', [list(['मूलांक, भाग्यांक, ग्रह और उपायों के लिए वैदिक', 'नाम, मोबाइल और व्यवसाय नाम के लिए कैल्डियन', 'ख़ूबियों और अनुपस्थित अंकों के लिए लो शू ग्रिड', 'नाम की पुष्टि के लिए पाइथागोरियन'])]] },
    ],
  },

  /* 4 ─ How to calculate */
  {
    slug: 'how-to-calculate-mulank-bhagyank-step-by-step', art: { t: 'orb', n: 5 }, service: 'report', calc: 'bhagyank', calcs: ['moolank', 'bhagyank', 'year', 'loshu'],
    keywords: ['how to calculate mulank', 'how to calculate bhagyank', 'moolank bhagyank calculation', 'destiny number calculation', 'root number calculation', 'मूलांक भाग्यांक कैसे निकालें'],
    en: { title: 'How to Calculate Mulank and Bhagyank: Step-by-Step with Examples', h1: 'How to Calculate Mulank and Bhagyank (with Examples)', description: 'Step-by-step method to calculate Mulank (root number) and Bhagyank (destiny number) from your date of birth, with master numbers 11, 22, 33 and worked examples.', kicker: 'Calculation guide', sub: 'Two numbers from your date of birth – calculated correctly in under a minute.',
      faqs: [
        { q: 'Is Mulank the same as root number or psychic number?', a: 'Yes – Mulank, Moolank, root number and psychic number all mean the day of birth reduced to one digit.' },
        { q: 'Is Bhagyank the same as life path or destiny number?', a: 'Yes, it is the total of the full date of birth.' },
        { q: 'What if my total is 11, 22 or 33?', a: 'These are master numbers. We show them (11/2, 22/4, 33/6) and read the single digit for compatibility.' },
        { q: 'Do I use the Hindu calendar date?', a: 'Use the date on your birth certificate (Gregorian calendar).' },
        { q: 'Does birth time change Mulank?', a: 'No. Only the date is used. For births near midnight, confirm the recorded date.' },
      ] },
    hi: { title: 'मूलांक और भाग्यांक कैसे निकालें: उदाहरण सहित चरण-दर-चरण', h1: 'मूलांक और भाग्यांक कैसे निकालें (उदाहरण सहित)', description: 'जन्म तिथि से मूलांक और भाग्यांक निकालने की चरण-दर-चरण विधि, मास्टर अंक 11, 22, 33 और हल किए उदाहरणों के साथ।', kicker: 'गणना मार्गदर्शिका', sub: 'जन्म तिथि से दो अंक – एक मिनट में सही गणना।',
      faqs: [
        { q: 'क्या मूलांक और रूट नंबर एक ही हैं?', a: 'हाँ – मूलांक, रूट नंबर और साइकिक नंबर, सबका अर्थ है जन्म का दिन एक अंक तक।' },
        { q: 'क्या भाग्यांक और लाइफ़ पाथ नंबर एक ही हैं?', a: 'हाँ, यह पूरी जन्म तिथि का योग है।' },
        { q: 'योग 11, 22 या 33 आए तो?', a: 'ये मास्टर अंक हैं। हम इन्हें (11/2, 22/4, 33/6) दिखाते हैं और अनुकूलता के लिए एक अंक पढ़ते हैं।' },
        { q: 'क्या हिंदू पंचांग की तिथि लें?', a: 'जन्म प्रमाणपत्र की तारीख़ (अंग्रेज़ी कैलेंडर) लें।' },
        { q: 'क्या जन्म का समय मूलांक बदलता है?', a: 'नहीं। केवल तारीख़ उपयोग होती है। आधी रात के आसपास जन्म हो तो दर्ज तारीख़ की पुष्टि करें।' },
      ] },
    sections: [
      { id: 'mulank', cta: true, en: ['Step 1: Calculate Your Mulank', [
        p('Take only the day of birth. If it has two digits, add them; if the result still has two digits, add again.'),
        steps([{ title: 'Born on the 7th', text: 'Mulank = 7' }, { title: 'Born on the 16th', text: '1 + 6 = 7 → Mulank 7' }, { title: 'Born on the 29th', text: '2 + 9 = 11 → 1 + 1 = 2 → Mulank 2' }]),
        fig({ t: 'orb', n: 5 }, 'Every date reduces to one number from 1 to 9'),
      ]], hi: ['चरण 1: अपना मूलांक निकालें', [
        p('केवल जन्म का दिन लें। दो अंक हों तो जोड़ें; परिणाम फिर दो अंक का हो तो दोबारा जोड़ें।'),
        steps([{ title: '7 तारीख़', text: 'मूलांक = 7' }, { title: '16 तारीख़', text: '1 + 6 = 7 → मूलांक 7' }, { title: '29 तारीख़', text: '2 + 9 = 11 → 1 + 1 = 2 → मूलांक 2' }]),
        fig({ t: 'orb', n: 5 }, 'हर तारीख़ 1 से 9 के किसी एक अंक में बदलती है'),
      ]] },
      { id: 'bhagyank', en: ['Step 2: Calculate Your Bhagyank', [
        p('Write the full date as DD-MM-YYYY and add every digit, then reduce.'),
        steps([{ title: '14-08-1990', text: '1 + 4 + 0 + 8 + 1 + 9 + 9 + 0 = 32 → 3 + 2 = 5 → Bhagyank 5' }, { title: '29-11-1985', text: '2 + 9 + 1 + 1 + 1 + 9 + 8 + 5 = 36 → 9 → Bhagyank 9' }, { title: '02-02-2000', text: '0 + 2 + 0 + 2 + 2 + 0 + 0 + 0 = 6 → Bhagyank 6' }]),
        tip('Always add every digit of the full date in one go. Reducing day, month and year separately can hide a master number.'),
      ]], hi: ['चरण 2: अपना भाग्यांक निकालें', [
        p('पूरी तारीख़ DD-MM-YYYY के रूप में लिखें, सभी अंक जोड़ें और एक अंक तक लाएँ।'),
        steps([{ title: '14-08-1990', text: '1 + 4 + 0 + 8 + 1 + 9 + 9 + 0 = 32 → 3 + 2 = 5 → भाग्यांक 5' }, { title: '29-11-1985', text: '2 + 9 + 1 + 1 + 1 + 9 + 8 + 5 = 36 → 9 → भाग्यांक 9' }, { title: '02-02-2000', text: '0 + 2 + 0 + 2 + 2 + 0 + 0 + 0 = 6 → भाग्यांक 6' }]),
        tip('पूरी तारीख़ के सभी अंक एक साथ जोड़ें। दिन, महीना और वर्ष अलग-अलग घटाने से मास्टर अंक छिप सकता है।'),
      ]] },
      { id: 'master', en: ['Master Numbers 11, 22 and 33', [p('If the total of your full date is 11, 22 or 33 before the last reduction, you carry a master number. We show it as 11/2, 22/4 or 33/6. For compatibility and remedies the single digit is used, while the master number adds intensity and a higher purpose.')]], hi: ['मास्टर अंक 11, 22 और 33', [p('यदि अंतिम घटाव से पहले पूरी तारीख़ का योग 11, 22 या 33 हो, तो आपके पास मास्टर अंक है। हम इसे 11/2, 22/4 या 33/6 लिखते हैं। अनुकूलता और उपायों में एक अंक उपयोग होता है, जबकि मास्टर अंक तीव्रता और ऊँचा उद्देश्य जोड़ता है।')]] },
      { id: 'together', cta: true, en: ['Reading Mulank and Bhagyank Together', [p('Mulank is how you behave day to day; Bhagyank is the direction life keeps pushing you. When the two are friends, effort and fortune move the same way. When they clash, you may feel pulled in two directions – the right name and mobile number help bridge them.'), list(['Same number: very strong, focused character', 'Friendly pair: smooth progress', 'Neutral pair: steady, effort-based progress', 'Challenging pair: inner conflict – remedies and name balancing help'])]], hi: ['मूलांक और भाग्यांक को साथ पढ़ना', [p('मूलांक बताता है कि आप रोज़ कैसे व्यवहार करते हैं; भाग्यांक वह दिशा है जिसकी ओर जीवन आपको ले जाता है। दोनों मित्र हों तो प्रयास और भाग्य एक दिशा में चलते हैं। टकराव हो तो आप दो दिशाओं में खिंचते महसूस कर सकते हैं – सही नाम और मोबाइल नंबर इन्हें जोड़ते हैं।'), list(['समान अंक: बहुत प्रबल, केंद्रित चरित्र', 'मित्र जोड़ा: सहज प्रगति', 'सम जोड़ा: स्थिर, मेहनत पर आधारित प्रगति', 'चुनौतीपूर्ण जोड़ा: भीतरी द्वंद्व – उपाय और नाम-संतुलन मदद करते हैं'])]] },
    ],
  },

  /* 5 ─ Lo Shu */
  {
    slug: 'lo-shu-grid-complete-guide-planes-arrows-yogs', art: { t: 'grid', present: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, service: 'loshu', calc: 'loshu', calcs: ['loshu', 'moolank', 'bhagyank', 'kua'],
    keywords: ['lo shu grid', 'lo shu grid numerology', 'lo shu grid calculator', 'lo shu grid missing numbers', 'lo shu grid planes arrows', 'raj yog lo shu', 'लो शू ग्रिड'],
    en: { title: 'Lo Shu Grid Numerology: Complete Guide to Planes, Arrows & Yogs', h1: 'The Lo Shu Grid: A Complete Guide', description: 'How to make your Lo Shu grid, what each number and plane means, arrows of strength and weakness, Golden and Silver Yog, repeated and missing numbers.', kicker: 'Lo Shu grid', sub: 'The 3×3 magic square that maps your strengths and gaps.',
      faqs: [
        { q: 'Which numbers go into the Lo Shu grid?', a: 'Non-zero digits of the date of birth, the Bhagyank, the Kua number, and the Mulank if you were born on the 11th or later (except 20th and 30th).' },
        { q: 'What is Raj Yog in Lo Shu?', a: 'Indian practice calls complete lines yogs: 4-5-6 is the Golden Yog (success line) and 2-5-8 the Silver Yog (property line).' },
        { q: 'Is a repeated number good?', a: 'Twice is usually strong; three or more times can make that quality excessive.' },
        { q: 'Can a grid have all numbers?', a: 'Rarely, but it happens – such charts are balanced and versatile.' },
        { q: 'Does Lo Shu replace Mulank and Bhagyank?', a: 'No, it adds detail. All are read together.' },
      ] },
    hi: { title: 'लो शू ग्रिड अंक ज्योतिष: तल, तीर और योग की संपूर्ण मार्गदर्शिका', h1: 'लो शू ग्रिड: संपूर्ण मार्गदर्शिका', description: 'अपना लो शू ग्रिड कैसे बनाएँ, हर अंक और तल का अर्थ, शक्ति और कमज़ोरी के तीर, स्वर्ण और रजत योग, दोहराए और अनुपस्थित अंक।', kicker: 'लो शू ग्रिड', sub: '3×3 का जादुई वर्ग जो आपकी ख़ूबियाँ और कमियाँ दिखाता है।',
      faqs: [
        { q: 'लो शू ग्रिड में कौन-से अंक जाते हैं?', a: 'जन्म तिथि के शून्य-रहित अंक, भाग्यांक, कुआ अंक, और यदि जन्म 11 या बाद की तारीख़ (20 और 30 छोड़कर) को हुआ तो मूलांक।' },
        { q: 'लो शू में राज योग क्या है?', a: 'भारतीय परंपरा में पूरी रेखाओं को योग कहते हैं: 4-5-6 स्वर्ण योग (सफलता रेखा) और 2-5-8 रजत योग (संपत्ति रेखा)।' },
        { q: 'क्या दोहराया अंक अच्छा है?', a: 'दो बार आमतौर पर प्रबल है; तीन या अधिक बार वह गुण अधिक हो सकता है।' },
        { q: 'क्या किसी ग्रिड में सभी अंक हो सकते हैं?', a: 'कम, पर होता है – ऐसे चार्ट संतुलित और बहुमुखी होते हैं।' },
        { q: 'क्या लो शू मूलांक-भाग्यांक का विकल्प है?', a: 'नहीं, यह विवरण जोड़ता है। सब साथ पढ़े जाते हैं।' },
      ] },
    sections: [
      { id: 'what', cta: true, en: ['What Is the Lo Shu Grid?', [p('The Lo Shu is an ancient 3×3 magic square in which every row, column and diagonal adds to 15. In numerology, the digits of your date of birth are placed in its fixed positions: 4-9-2 on top, 3-5-7 in the middle and 8-1-6 at the bottom.'), fig({ t: 'grid', present: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, 'The Lo Shu magic square – every line adds to 15')]], hi: ['लो शू ग्रिड क्या है?', [p('लो शू एक प्राचीन 3×3 जादुई वर्ग है जिसकी हर पंक्ति, स्तंभ और विकर्ण का योग 15 है। अंक ज्योतिष में जन्म तिथि के अंक इसके तय स्थानों पर रखे जाते हैं: ऊपर 4-9-2, बीच में 3-5-7 और नीचे 8-1-6।'), fig({ t: 'grid', present: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, 'लो शू जादुई वर्ग – हर रेखा का योग 15')]] },
      { id: 'make', en: ['How to Make Your Grid', [steps([{ title: 'Write the date', text: 'Take every non-zero digit of DD-MM-YYYY.' }, { title: 'Add Bhagyank and Kua', text: 'Place your Bhagyank and Kua number in the grid too.' }, { title: 'Mulank rule', text: 'Add the Mulank as well if you were born on the 11th or later, except the 20th and 30th.' }, { title: 'Read the grid', text: 'Note which numbers repeat, which are missing, and which lines are complete.' }])]], hi: ['अपना ग्रिड कैसे बनाएँ', [steps([{ title: 'तारीख़ लिखें', text: 'DD-MM-YYYY के सभी शून्य-रहित अंक लें।' }, { title: 'भाग्यांक और कुआ जोड़ें', text: 'अपना भाग्यांक और कुआ अंक भी ग्रिड में रखें।' }, { title: 'मूलांक नियम', text: 'जन्म 11 या उसके बाद की तारीख़ (20 और 30 छोड़कर) को हुआ हो तो मूलांक भी जोड़ें।' }, { title: 'ग्रिड पढ़ें', text: 'देखें कौन-से अंक दोहराए गए, कौन-से अनुपस्थित हैं और कौन-सी रेखाएँ पूरी हैं।' }])]] },
      { id: 'planes', en: ['Planes, Arrows and Yogs', [table(['Line', 'Numbers', 'Meaning when complete'], [['Mental plane', '4-9-2', 'Intellect and memory'], ['Emotional plane', '3-5-7', 'Spirituality and feeling'], ['Practical plane', '8-1-6', 'Practical success'], ['Thought plane', '4-3-8', 'Planning'], ['Will plane', '9-5-1', 'Determination'], ['Action plane', '2-7-6', 'Activity'], ['Golden Yog', '4-5-6', 'Success and willpower'], ['Silver Yog', '2-5-8', 'Property and emotional balance']]), p('When all three numbers of a line are missing, it becomes an arrow of weakness – for example, 3-5-7 missing is the Arrow of Scepticism.')]], hi: ['तल, तीर और योग', [table(['रेखा', 'अंक', 'पूरी होने पर अर्थ'], [['मानसिक तल', '4-9-2', 'बुद्धि और स्मरणशक्ति'], ['भावनात्मक तल', '3-5-7', 'आध्यात्मिकता और भावना'], ['व्यावहारिक तल', '8-1-6', 'व्यावहारिक सफलता'], ['विचार तल', '4-3-8', 'योजना'], ['इच्छाशक्ति तल', '9-5-1', 'दृढ़ संकल्प'], ['कर्म तल', '2-7-6', 'सक्रियता'], ['स्वर्ण योग', '4-5-6', 'सफलता और इच्छाशक्ति'], ['रजत योग', '2-5-8', 'संपत्ति और भावनात्मक संतुलन']]), p('जब किसी रेखा के तीनों अंक अनुपस्थित हों, तो वह कमज़ोरी का तीर बनती है – जैसे 3-5-7 अनुपस्थित हो तो संशय का तीर।')]] },
      { id: 'missing', cta: true, en: ['Missing and Repeated Numbers', [p('Missing numbers show qualities that need conscious effort; repeated numbers show qualities in abundance. Read our separate guides for each missing number 1 to 9 – each has its own colour, direction, crystal and habit remedy.'), tip('Look at the missing 5 first if you have it. Because 5 sits in the centre and joins four lines, fixing it improves several areas at once.')]], hi: ['अनुपस्थित और दोहराए अंक', [p('अनुपस्थित अंक वे गुण दिखाते हैं जिन पर सचेत प्रयास चाहिए; दोहराए अंक प्रचुर गुण दिखाते हैं। हर अनुपस्थित अंक 1 से 9 की हमारी अलग मार्गदर्शिकाएँ पढ़ें – हर एक का अपना रंग, दिशा, क्रिस्टल और आदत-उपाय है।'), tip('यदि आपका 5 अनुपस्थित है तो पहले उसी पर ध्यान दें। 5 केंद्र में है और चार रेखाओं को जोड़ता है, इसलिए इसे सुधारने से कई क्षेत्र एक साथ बेहतर होते हैं।')]] },
    ],
  },

  /* 6 ─ Master numbers */
  {
    slug: 'master-numbers-11-22-33-meaning-numerology', art: { t: 'orb', n: 11 }, service: 'report', calc: 'bhagyank', calcs: ['bhagyank', 'name', 'moolank', 'loshu'],
    keywords: ['master number 11', 'master number 22', 'master number 33', 'master numbers numerology', 'bhagyank 11', 'मास्टर अंक 11 22 33'],
    en: { title: 'Master Numbers 11, 22 and 33 in Numerology: Meaning & Life Path', h1: 'Master Numbers 11, 22 and 33: What They Mean', description: 'What master numbers 11, 22 and 33 mean in numerology, how to know if you have one, their strengths, challenges and how they combine with Bhagyank 2, 4 and 6.', kicker: 'Master numbers', sub: 'Higher-intensity versions of 2, 4 and 6 – gifts that ask for responsibility.',
      faqs: [
        { q: 'How do I know if I have a master number?', a: 'If the total of your full date of birth is 11, 22 or 33 before the final reduction.' },
        { q: 'Is a master number lucky?', a: 'It brings strong potential and also stronger tests. Grounded effort turns it into achievement.' },
        { q: 'Do master numbers change compatibility?', a: 'Compatibility uses the single digit (2, 4 or 6). The master number adds intensity.' },
        { q: 'Can a name number be a master number?', a: 'Yes, a name total of 11, 22 or 33 carries similar intensity.' },
        { q: 'Are there other master numbers like 44?', a: 'Some traditions mention them, but our method uses only 11, 22 and 33.' },
      ] },
    hi: { title: 'अंक ज्योतिष में मास्टर अंक 11, 22 और 33: अर्थ और जीवन-पथ', h1: 'मास्टर अंक 11, 22 और 33: इनका अर्थ', description: 'अंक ज्योतिष में मास्टर अंक 11, 22 और 33 का अर्थ, कैसे जानें कि आपके पास मास्टर अंक है, इनकी ख़ूबियाँ, चुनौतियाँ और भाग्यांक 2, 4, 6 से संबंध।', kicker: 'मास्टर अंक', sub: '2, 4 और 6 के उच्च-तीव्रता रूप – ऐसे वरदान जो ज़िम्मेदारी माँगते हैं।',
      faqs: [
        { q: 'कैसे जानें कि मेरे पास मास्टर अंक है?', a: 'यदि अंतिम घटाव से पहले पूरी जन्म तिथि का योग 11, 22 या 33 हो।' },
        { q: 'क्या मास्टर अंक भाग्यशाली है?', a: 'यह प्रबल संभावना और कठिन परीक्षाएँ दोनों लाता है। ज़मीन से जुड़ा प्रयास इसे उपलब्धि बनाता है।' },
        { q: 'क्या मास्टर अंक अनुकूलता बदलते हैं?', a: 'अनुकूलता में एक अंक (2, 4 या 6) उपयोग होता है। मास्टर अंक तीव्रता जोड़ता है।' },
        { q: 'क्या नामांक मास्टर अंक हो सकता है?', a: 'हाँ, नाम का योग 11, 22 या 33 हो तो वैसी ही तीव्रता होती है।' },
        { q: 'क्या 44 जैसे और मास्टर अंक हैं?', a: 'कुछ परंपराएँ इनका उल्लेख करती हैं, पर हमारी विधि में केवल 11, 22 और 33 हैं।' },
      ] },
    sections: [
      { id: 'what', cta: true, en: ['What Are Master Numbers?', [p('Master numbers are the double digits 11, 22 and 33 that appear as the total of a date of birth (or name) before the final reduction. They are read as intensified versions of 2, 4 and 6 – the same nature, with a bigger mission and stronger lessons.'), fig({ t: 'orb', n: 11 }, 'Master number 11 – the intuitive illuminator')]], hi: ['मास्टर अंक क्या हैं?', [p('मास्टर अंक दोहरे अंक 11, 22 और 33 हैं जो अंतिम घटाव से पहले जन्म तिथि (या नाम) के योग में आते हैं। इन्हें 2, 4 और 6 के तीव्र रूप माना जाता है – वही स्वभाव, बड़ा उद्देश्य और कठिन सीख।'), fig({ t: 'orb', n: 11 }, 'मास्टर अंक 11 – अंतर्ज्ञानी प्रकाशक')]] },
      { id: 'eleven', en: ['Master Number 11 (11/2)', [p('11 is the number of intuition, inspiration and spiritual insight. People with 11 often sense things before they happen and inspire others. The challenge is nervous energy and self-doubt; grounding routines and creative expression help.')]], hi: ['मास्टर अंक 11 (11/2)', [p('11 अंतर्ज्ञान, प्रेरणा और आध्यात्मिक अंतर्दृष्टि का अंक है। 11 वाले लोग अक्सर घटनाओं का पूर्वाभास करते हैं और दूसरों को प्रेरित करते हैं। चुनौती है घबराहट और आत्म-संदेह; ज़मीन से जुड़ी दिनचर्या और रचनात्मक अभिव्यक्ति मदद करती है।')]] },
      { id: 'twentytwo', en: ['Master Number 22 (22/4)', [p('22 is the master builder – the ability to turn big visions into practical, lasting results. It suits large projects, institutions and businesses. The challenge is pressure and over-control; delegation and patience keep it healthy.')]], hi: ['मास्टर अंक 22 (22/4)', [p('22 महान निर्माता है – बड़े सपनों को व्यावहारिक, स्थायी परिणाम में बदलने की क्षमता। यह बड़े प्रोजेक्ट, संस्थाओं और व्यवसायों के अनुकूल है। चुनौती है दबाव और अधिक नियंत्रण; काम बाँटना और धैर्य इसे संतुलित रखते हैं।')]] },
      { id: 'living', en: ['Living Well with a Master Number', [p('Master numbers feel like a double-edged gift. Many people with 11, 22 or 33 go through intense early years – high sensitivity, heavy responsibility or a sense of being different – before the energy settles. Three habits help: a daily grounding routine (walking, prayer or meditation), finishing practical work before chasing big visions, and choosing a name and mobile number that are friendly with the single digit. When these are in place, the master vibration shows as leadership, healing or building on a larger scale.'), list(['Do not ignore the single digit – live it well first', 'Keep your body and sleep steady; master energy is nervous energy', 'Serve others without carrying their whole burden', 'Check your personal year before big launches'])]], hi: ['मास्टर अंक के साथ अच्छा जीवन', [p('मास्टर अंक दोधारी वरदान जैसे लगते हैं। 11, 22 या 33 वाले कई लोग शुरुआती वर्षों में तीव्र अनुभवों से गुज़रते हैं – अधिक संवेदनशीलता, भारी ज़िम्मेदारी या अलग होने की भावना – फिर ऊर्जा स्थिर होती है। तीन आदतें मदद करती हैं: रोज़ ज़मीन से जुड़ने की दिनचर्या (सैर, प्रार्थना या ध्यान), बड़े सपनों से पहले व्यावहारिक काम पूरा करना, और ऐसा नाम व मोबाइल नंबर चुनना जो एक अंक के मित्र हों। ये हों तो मास्टर कंपन नेतृत्व, उपचार या बड़े स्तर के निर्माण के रूप में दिखता है।'), list(['एक अंक को अनदेखा न करें – पहले उसे अच्छी तरह जिएँ', 'शरीर और नींद स्थिर रखें; मास्टर ऊर्जा घबराहट वाली ऊर्जा है', 'दूसरों की सेवा करें, पर उनका पूरा बोझ न उठाएँ', 'बड़े लॉन्च से पहले अपना व्यक्तिगत वर्ष देखें'])]] },
      { id: 'thirtythree', en: ['Master Number 33 (33/6)', [p('33 is the master teacher and healer – deep compassion, service and the ability to uplift families and communities. The challenge is carrying everyone’s burden; healthy boundaries are essential.'), tip('If you carry a master number, do not let it become pressure. Live the single digit well first – the master energy grows naturally from that foundation.')]], hi: ['मास्टर अंक 33 (33/6)', [p('33 महान शिक्षक और उपचारक है – गहरी करुणा, सेवा और परिवार व समाज को ऊपर उठाने की क्षमता। चुनौती है सबका बोझ उठाना; स्वस्थ सीमाएँ ज़रूरी हैं।'), tip('यदि आपके पास मास्टर अंक है, तो उसे दबाव न बनने दें। पहले एक अंक को अच्छी तरह जिएँ – मास्टर ऊर्जा उसी नींव से स्वाभाविक रूप से बढ़ती है।')]] },
    ],
  },

  /* 7 ─ Name correction */
  {
    slug: 'name-correction-numerology-spelling-guide', art: { t: 'letters', letters: 'NAME', n: 5 }, service: 'name', calc: 'name', calcs: ['name', 'moolank', 'bhagyank', 'mobile'],
    keywords: ['name correction numerology', 'name spelling numerology', 'lucky name spelling', 'name numerology correction online', 'change name spelling numerology', 'नाम सुधार अंक ज्योतिष'],
    en: { title: 'Name Correction Numerology: How to Choose a Lucky Spelling', h1: 'Name Correction in Numerology: A Practical Guide', description: 'How name correction numerology works, when a spelling change helps, how to choose a lucky Chaldean name number for your date of birth, and mistakes to avoid.', kicker: 'Name correction', sub: 'One or two letters can bring your name in tune with your date of birth.',
      faqs: [
        { q: 'Do I need to change my name legally?', a: 'No. The spelling you use daily – signature, social media, visiting card – carries the vibration.' },
        { q: 'How many letters should I change?', a: 'As few as possible – usually one added or doubled letter.' },
        { q: 'Which name number is best?', a: 'One that is friendly with both your Mulank and Bhagyank and has a favourable compound number.' },
        { q: 'How long until I see results?', a: 'With consistent use, many people notice changes in a few months.' },
        { q: 'Can I correct my child’s name?', a: 'Yes; for newborns it is best to choose a matching name from the start.' },
      ] },
    hi: { title: 'नाम सुधार अंक ज्योतिष: शुभ वर्तनी कैसे चुनें', h1: 'अंक ज्योतिष में नाम सुधार: व्यावहारिक मार्गदर्शिका', description: 'नाम सुधार अंक ज्योतिष कैसे काम करता है, वर्तनी बदलना कब मदद करता है, अपनी जन्म तिथि के लिए शुभ कैल्डियन नामांक कैसे चुनें और किन ग़लतियों से बचें।', kicker: 'नाम सुधार', sub: 'एक-दो अक्षर आपके नाम को जन्म तिथि के सुर में ला सकते हैं।',
      faqs: [
        { q: 'क्या क़ानूनी रूप से नाम बदलना ज़रूरी है?', a: 'नहीं। रोज़ उपयोग की वर्तनी – हस्ताक्षर, सोशल मीडिया, विज़िटिंग कार्ड – ही कंपन देती है।' },
        { q: 'कितने अक्षर बदलें?', a: 'जितने कम हो सकें – आमतौर पर एक अक्षर जोड़ना या दोहराना।' },
        { q: 'कौन-सा नामांक सबसे अच्छा है?', a: 'जो मूलांक और भाग्यांक दोनों का मित्र हो और जिसका मिश्रित अंक शुभ हो।' },
        { q: 'परिणाम कब दिखते हैं?', a: 'लगातार उपयोग से कई लोग कुछ महीनों में बदलाव महसूस करते हैं।' },
        { q: 'क्या बच्चे का नाम सुधारा जा सकता है?', a: 'हाँ; नवजात के लिए शुरू से ही अनुकूल नाम चुनना सबसे अच्छा है।' },
      ] },
    sections: [
      { id: 'why', cta: true, en: ['Why Name Correction Works', [p('Your date of birth cannot change, but your name can. In Chaldean numerology every letter carries a vibration; the total of your name decides how the world responds to you. When that total is unfriendly with your Mulank or Bhagyank, people often feel blocked despite hard work. A small spelling change can turn the total into a friendly number.'), fig({ t: 'letters', letters: 'NAME', n: 5 }, 'A single added letter can change the name number')]], hi: ['नाम सुधार क्यों काम करता है', [p('जन्म तिथि नहीं बदल सकती, पर नाम बदल सकता है। कैल्डियन अंक ज्योतिष में हर अक्षर का कंपन है; नाम का योग तय करता है कि दुनिया आपको कैसे जवाब देती है। जब यह योग आपके मूलांक या भाग्यांक का शत्रु हो, तो मेहनत के बावजूद रुकावट महसूस होती है। छोटा-सा वर्तनी परिवर्तन योग को मित्र अंक बना सकता है।'), fig({ t: 'letters', letters: 'NAME', n: 5 }, 'एक अक्षर जोड़ने से नामांक बदल सकता है')]] },
      { id: 'when', en: ['When Should You Consider It?', [list(['Repeated obstacles in career despite effort', 'Name number unfriendly with both Mulank and Bhagyank', 'Unfavourable compound number (for example 16, 18 or 26 in the Chaldean list)', 'Starting a new business, brand or public career', 'Naming a newborn'])]], hi: ['कब विचार करें?', [list(['मेहनत के बावजूद करियर में बार-बार रुकावट', 'नामांक मूलांक और भाग्यांक दोनों का शत्रु', 'अशुभ मिश्रित अंक (जैसे कैल्डियन सूची में 16, 18 या 26)', 'नया व्यवसाय, ब्रांड या सार्वजनिक करियर शुरू करना', 'नवजात का नाम रखना'])]] },
      { id: 'how', en: ['How to Choose the Right Spelling', [steps([{ title: 'Find your numbers', text: 'Calculate Mulank and Bhagyank.' }, { title: 'Pick target numbers', text: 'Choose name numbers friendly with both.' }, { title: 'Try small changes', text: 'Double a vowel, add an H or Y, or adjust the surname spelling.' }, { title: 'Check the compound', text: 'Prefer a favourable compound total.' }, { title: 'Use it everywhere', text: 'Signature, email, social media and cards.' }]), tip('A good correction should still look and sound like your name. If people cannot read it, it will not be used – and an unused spelling has no effect.')]], hi: ['सही वर्तनी कैसे चुनें', [steps([{ title: 'अपने अंक जानें', text: 'मूलांक और भाग्यांक निकालें।' }, { title: 'लक्ष्य अंक चुनें', text: 'ऐसे नामांक चुनें जो दोनों के मित्र हों।' }, { title: 'छोटे बदलाव आज़माएँ', text: 'स्वर दोहराएँ, एच या वाई जोड़ें, या उपनाम की वर्तनी बदलें।' }, { title: 'मिश्रित अंक जाँचें', text: 'शुभ मिश्रित योग को प्राथमिकता दें।' }, { title: 'हर जगह उपयोग करें', text: 'हस्ताक्षर, ईमेल, सोशल मीडिया और कार्ड।' }]), tip('अच्छा सुधार वही है जिसमें नाम पहचान में और सुनने में वैसा ही रहे। जिसे लोग पढ़ न सकें, वह उपयोग नहीं होगा – और उपयोग न होने वाली वर्तनी का कोई प्रभाव नहीं।')]] },
      { id: 'mistakes', cta: true, en: ['Mistakes to Avoid', [list(['Changing many letters so the name becomes unrecognisable', 'Using Pythagorean values while following Chaldean rules', 'Ignoring the Bhagyank and matching only Mulank', 'Using the new spelling in only one place'])]], hi: ['इन ग़लतियों से बचें', [list(['इतने अक्षर बदलना कि नाम पहचान में न आए', 'कैल्डियन नियम मानते हुए पाइथागोरियन मान उपयोग करना', 'भाग्यांक को अनदेखा कर केवल मूलांक से मिलान', 'नई वर्तनी केवल एक जगह उपयोग करना'])]] },
    ],
  },

  /* 8 ─ Mobile */
  {
    slug: 'how-to-choose-lucky-mobile-number-numerology', art: { t: 'phone', n: 5 }, service: 'mobile', calc: 'mobile', calcs: ['mobile', 'bhagyank', 'moolank', 'loshu'],
    keywords: ['lucky mobile number', 'how to choose lucky mobile number', 'mobile number numerology', 'lucky mobile number by date of birth', 'mobile number total', 'शुभ मोबाइल नंबर'],
    en: { title: 'How to Choose a Lucky Mobile Number by Date of Birth (Numerology)', h1: 'How to Choose a Lucky Mobile Number', description: 'Choose a lucky mobile number by date of birth: total, digit pairs to avoid (48, 84, 44, 88, 00), zeros, last four digits and missing numbers – explained by Acharya Nandram.', kicker: 'Lucky mobile number', sub: 'A five-point check to see if a number truly suits you.',
      faqs: [
        { q: 'Which total is best for a mobile number?', a: 'The one friendly with your Bhagyank and Mulank. There is no single lucky total for everyone.' },
        { q: 'Which digit pairs should I avoid?', a: '48, 84, 44, 88 and 00, and mutually unfriendly digits side by side.' },
        { q: 'Should business and personal numbers differ?', a: 'Ideally, the business number suits the owner’s Bhagyank and the nature of the business.' },
        { q: 'Is a number with many 9s good?', a: 'Repetition intensifies a digit; it suits only if that digit is friendly with your chart.' },
        { q: 'Can you check numbers before I buy?', a: 'Yes, the lucky mobile number service compares available numbers with your date of birth.' },
      ] },
    hi: { title: 'जन्म तिथि से शुभ मोबाइल नंबर कैसे चुनें (अंक ज्योतिष)', h1: 'शुभ मोबाइल नंबर कैसे चुनें', description: 'जन्म तिथि से शुभ मोबाइल नंबर चुनें: योग, किन जोड़ों से बचें (48, 84, 44, 88, 00), शून्य, अंतिम चार अंक और अनुपस्थित अंक – आचार्य नंदराम द्वारा।', kicker: 'शुभ मोबाइल नंबर', sub: 'पाँच बिंदुओं की जाँच, जिससे पता चले कि नंबर सचमुच आपके अनुकूल है या नहीं।',
      faqs: [
        { q: 'मोबाइल नंबर का कौन-सा योग सबसे अच्छा है?', a: 'वह जो आपके भाग्यांक और मूलांक का मित्र हो। सबके लिए एक शुभ योग नहीं होता।' },
        { q: 'किन अंक-जोड़ों से बचें?', a: '48, 84, 44, 88 और 00, और आपस में शत्रु अंक लगातार।' },
        { q: 'क्या व्यवसाय और निजी नंबर अलग हों?', a: 'आदर्श रूप से व्यवसाय का नंबर मालिक के भाग्यांक और व्यवसाय के स्वभाव के अनुकूल हो।' },
        { q: 'क्या कई 9 वाला नंबर अच्छा है?', a: 'दोहराव अंक को तीव्र करता है; यह तभी अच्छा है जब वह अंक आपके चार्ट का मित्र हो।' },
        { q: 'क्या ख़रीदने से पहले नंबर जाँच सकते हैं?', a: 'हाँ, शुभ मोबाइल नंबर सेवा उपलब्ध नंबरों की तुलना आपकी जन्म तिथि से करती है।' },
      ] },
    sections: [
      { id: 'why', cta: true, en: ['Why Your Mobile Number Matters', [p('Your mobile number is with you all day – in calls, payments, business and identity. Numerology treats it as a vibration you live with. A number that suits your chart tends to bring smoother communication and opportunities; a clashing one can add friction.'), fig({ t: 'phone', n: 5 }, 'Ten digits, one total – and much more')]], hi: ['मोबाइल नंबर क्यों महत्वपूर्ण है', [p('मोबाइल नंबर दिन भर आपके साथ है – कॉल, भुगतान, व्यवसाय और पहचान में। अंक ज्योतिष इसे साथ रहने वाला कंपन मानता है। चार्ट के अनुकूल नंबर संवाद और अवसरों को सहज बनाता है; टकराने वाला नंबर रुकावट बढ़ा सकता है।'), fig({ t: 'phone', n: 5 }, 'दस अंक, एक योग – और उससे कहीं अधिक')]] },
      { id: 'check', en: ['The Five-Point Check', [steps([{ title: 'Total', text: 'Add all ten digits; the total should be friendly with your Bhagyank and Mulank.' }, { title: 'Pairs', text: 'Avoid 48, 84, 44, 88 and 00, and unfriendly digits side by side.' }, { title: 'Zeros', text: 'Not more than two zeros.' }, { title: 'Last four digits', text: 'Their total should also be friendly with your Bhagyank.' }, { title: 'Missing numbers', text: 'Digits missing from your Lo Shu grid are a bonus when present.' }])]], hi: ['पाँच बिंदुओं की जाँच', [steps([{ title: 'योग', text: 'दसों अंक जोड़ें; योग आपके भाग्यांक और मूलांक का मित्र हो।' }, { title: 'जोड़े', text: '48, 84, 44, 88 और 00 तथा लगातार शत्रु अंकों से बचें।' }, { title: 'शून्य', text: 'दो से अधिक शून्य न हों।' }, { title: 'अंतिम चार अंक', text: 'इनका योग भी भाग्यांक का मित्र हो।' }, { title: 'अनुपस्थित अंक', text: 'लो शू ग्रिड के अनुपस्थित अंक नंबर में हों तो अतिरिक्त लाभ।' }])]] },
      { id: 'heavy', en: ['About Totals 4 and 8', [p('Totals 4 (Rahu) and 8 (Saturn) are heavy numbers. In our scoring they are penalised unless 4 or 8 is your own Mulank or Bhagyank. For people whose chart supports them, they can work well for technology, industry or long-term business.'), tip('Do not buy a “VIP” number only because it looks attractive. Many costly fancy numbers I have checked had malefic pairs hidden inside.')]], hi: ['योग 4 और 8 के बारे में', [p('योग 4 (राहु) और 8 (शनि) भारी अंक हैं। हमारी गणना में इन्हें तब तक कम अंक मिलते हैं जब तक 4 या 8 आपका अपना मूलांक या भाग्यांक न हो। जिनका चार्ट साथ दे, उनके लिए ये टेक्नोलॉजी, उद्योग या लंबे व्यवसाय में अच्छे चल सकते हैं।'), tip('केवल आकर्षक दिखने के कारण "वीआईपी" नंबर न ख़रीदें। मैंने जिन महँगे फ़ैंसी नंबरों की जाँच की, उनमें से कई के भीतर अशुभ जोड़े छिपे थे।')]] },
      { id: 'totals', cta: true, en: ['Read the Guide for Your Total', [p('Each mobile total from 1 to 9 has its own guide with meaning, who it suits and remedies. Find yours with the free mobile numerology calculator, then read the matching guide.')]], hi: ['अपने योग की मार्गदर्शिका पढ़ें', [p('मोबाइल योग 1 से 9 तक हर एक की अपनी मार्गदर्शिका है – अर्थ, किसके लिए शुभ और उपाय। मुफ़्त मोबाइल अंक ज्योतिष कैलकुलेटर से अपना योग जानें, फिर उसकी मार्गदर्शिका पढ़ें।')]] },
    ],
  },

  /* 9 ─ Baby name */
  {
    slug: 'baby-name-numerology-guide-lucky-name-for-child', art: { t: 'baby' }, service: 'baby', calc: 'name', calcs: ['name', 'moolank', 'bhagyank', 'loshu'],
    keywords: ['baby name numerology', 'lucky baby name by date of birth', 'baby name as per numerology', 'numerology baby names india', 'शिशु नाम अंक ज्योतिष'],
    en: { title: 'Baby Name Numerology: How to Choose a Lucky Name for Your Child', h1: 'Baby Name Numerology: Choosing a Lucky Name', description: 'How to choose a lucky baby name by date of birth using numerology: Mulank, Bhagyank, Chaldean name number, first letter, spelling and family surname – step by step.', kicker: 'Baby name numerology', sub: 'A name your child will carry for life – matched to the date they were born.',
      faqs: [
        { q: 'Should the baby name match Mulank or Bhagyank?', a: 'Ideally both. The name number should be friendly with both numbers.' },
        { q: 'Does the first letter matter?', a: 'Yes, the first letter sets the tone; we also check the full name total.' },
        { q: 'Can I keep a traditional name from the rashi letter?', a: 'Yes – we can adjust the spelling so a rashi-based name also suits numerology.' },
        { q: 'Should the surname be included?', a: 'Check both the first name alone and first name + surname.' },
        { q: 'Can the name be chosen before birth?', a: 'You can shortlist, but the final check needs the actual date of birth.' },
      ] },
    hi: { title: 'शिशु नाम अंक ज्योतिष: बच्चे के लिए शुभ नाम कैसे चुनें', h1: 'शिशु नाम अंक ज्योतिष: शुभ नाम का चयन', description: 'अंक ज्योतिष से जन्म तिथि अनुसार शुभ शिशु नाम कैसे चुनें: मूलांक, भाग्यांक, कैल्डियन नामांक, पहला अक्षर, वर्तनी और उपनाम – चरण-दर-चरण।', kicker: 'शिशु नाम अंक ज्योतिष', sub: 'वह नाम जो बच्चा जीवन भर रखेगा – उसकी जन्म तिथि से मेल खाता हुआ।',
      faqs: [
        { q: 'शिशु का नाम मूलांक से मिलाएँ या भाग्यांक से?', a: 'आदर्श रूप से दोनों से। नामांक दोनों का मित्र हो।' },
        { q: 'क्या पहला अक्षर मायने रखता है?', a: 'हाँ, पहला अक्षर स्वर तय करता है; हम पूरे नाम का योग भी जाँचते हैं।' },
        { q: 'क्या राशि अक्षर वाला पारंपरिक नाम रख सकते हैं?', a: 'हाँ – हम वर्तनी समायोजित कर सकते हैं ताकि राशि वाला नाम अंक ज्योतिष के भी अनुकूल हो।' },
        { q: 'क्या उपनाम भी जोड़ें?', a: 'केवल पहला नाम और पहला नाम + उपनाम, दोनों जाँचें।' },
        { q: 'क्या जन्म से पहले नाम चुन सकते हैं?', a: 'सूची बना सकते हैं, पर अंतिम जाँच वास्तविक जन्म तिथि से ही होती है।' },
      ] },
    sections: [
      { id: 'why', cta: true, en: ['Why a Numerology-Matched Name Helps', [p('A child hears their name thousands of times. In numerology the name is the vibration that connects the child with the world – school, friends and later career. When the name number is friendly with the child’s Mulank and Bhagyank, the child’s natural strengths get support.'), fig({ t: 'baby' }, 'A name matched to the date of birth')]], hi: ['अंक ज्योतिष से मिला नाम क्यों मदद करता है', [p('बच्चा अपना नाम हज़ारों बार सुनता है। अंक ज्योतिष में नाम वह कंपन है जो बच्चे को दुनिया से जोड़ता है – स्कूल, मित्र और बाद में करियर। जब नामांक बच्चे के मूलांक और भाग्यांक का मित्र हो, तो उसकी स्वाभाविक ख़ूबियों को सहारा मिलता है।'), fig({ t: 'baby' }, 'जन्म तिथि से मेल खाता नाम')]] },
      { id: 'steps', en: ['Step-by-Step Method', [steps([{ title: 'Calculate the child’s numbers', text: 'Mulank from the day, Bhagyank from the full date of birth.' }, { title: 'List friendly name numbers', text: 'Numbers friendly with both.' }, { title: 'Shortlist names', text: 'Include family tradition and rashi letter if you follow it.' }, { title: 'Check spelling', text: 'Calculate the Chaldean total of each spelling.' }, { title: 'Check with surname', text: 'First name alone and with the surname.' }])]], hi: ['चरण-दर-चरण विधि', [steps([{ title: 'बच्चे के अंक निकालें', text: 'दिन से मूलांक, पूरी जन्म तिथि से भाग्यांक।' }, { title: 'मित्र नामांक लिखें', text: 'वे अंक जो दोनों के मित्र हों।' }, { title: 'नामों की सूची बनाएँ', text: 'पारिवारिक परंपरा और राशि अक्षर (यदि मानते हैं) शामिल करें।' }, { title: 'वर्तनी जाँचें', text: 'हर वर्तनी का कैल्डियन योग निकालें।' }, { title: 'उपनाम के साथ जाँचें', text: 'केवल पहला नाम और उपनाम सहित।' }])]] },
      { id: 'letters', en: ['First Letter and Name Number by Mulank', [p('A quick starting point: find the child’s Mulank and choose a name whose Chaldean total is friendly with it. The table shows friendly name numbers for each Mulank from our friendship table; always confirm against the Bhagyank too.'), table(['Child’s Mulank', 'Friendly name numbers'], NUMS.map((n) => [String(n), NUMS.filter((m) => relationOf(n, m) === 'friend').join(', ')]))]], hi: ['मूलांक अनुसार पहला अक्षर और नामांक', [p('शुरुआत का आसान तरीक़ा: बच्चे का मूलांक जानें और ऐसा नाम चुनें जिसका कैल्डियन योग उसका मित्र हो। तालिका हमारी मित्रता तालिका से हर मूलांक के मित्र नामांक दिखाती है; भाग्यांक से भी अवश्य पुष्टि करें।'), table(['बच्चे का मूलांक', 'मित्र नामांक'], NUMS.map((n) => [String(n), NUMS.filter((m) => relationOf(n, m) === 'friend').join(', ')]))]] },
      { id: 'tips', cta: true, en: ['Practical Tips for Parents', [list(['Prefer names that are easy to spell and pronounce', 'Avoid unusual spellings only for numerology', 'Keep the school certificate spelling the same as the daily spelling', 'Check the nickname too, if it will be used every day']), tip('Parents often ask for a “perfect” number. I prefer a name that is friendly to the child’s chart, easy to write and loved by the family – that name will actually be used.')]], hi: ['माता-पिता के लिए व्यावहारिक सुझाव', [list(['ऐसे नाम चुनें जो लिखने और बोलने में आसान हों', 'केवल अंक ज्योतिष के लिए अजीब वर्तनी न रखें', 'स्कूल प्रमाणपत्र और रोज़ की वर्तनी एक जैसी रखें', 'यदि घर का नाम रोज़ उपयोग होगा तो उसे भी जाँचें']), tip('माता-पिता अक्सर "सर्वश्रेष्ठ" अंक माँगते हैं। मैं ऐसा नाम पसंद करता हूँ जो बच्चे के चार्ट का मित्र हो, लिखने में आसान हो और परिवार को प्रिय हो – वही नाम सचमुच उपयोग होगा।')]] },
    ],
  },

  /* 10 ─ Business name */
  {
    slug: 'business-name-numerology-guide-lucky-company-name', art: { t: 'shop' }, service: 'business', calc: 'name', calcs: ['name', 'bhagyank', 'mobile', 'house'],
    keywords: ['business name numerology', 'lucky business name', 'company name numerology', 'shop name numerology', 'brand name numerology india', 'व्यवसाय नाम अंक ज्योतिष'],
    en: { title: 'Business Name Numerology: How to Choose a Lucky Company Name', h1: 'Business Name Numerology: Choosing a Lucky Name', description: 'Choose a lucky business or shop name with numerology: owner’s Bhagyank, industry number, Chaldean total, launch date, logo and business mobile – a practical checklist.', kicker: 'Business numerology', sub: 'Match your brand name to the owner, the industry and the launch date.',
      faqs: [
        { q: 'Should a business name match the owner?', a: 'Yes, mainly the owner’s Bhagyank; with partners, find numbers friendly to all.' },
        { q: 'Which business number is good for trading?', a: 'Number 5 (Mercury) often suits trade, sales and communication, if it suits the owner.' },
        { q: 'Does the launch date matter?', a: 'Yes. Choose a date whose number is friendly with the business name and the owner.' },
        { q: 'Should I include “Pvt Ltd” in the calculation?', a: 'Check the brand name people use, and also the full registered name.' },
        { q: 'Can an existing business name be corrected?', a: 'Often a small spelling or logo-text change is enough.' },
      ] },
    hi: { title: 'व्यवसाय नाम अंक ज्योतिष: शुभ कंपनी नाम कैसे चुनें', h1: 'व्यवसाय नाम अंक ज्योतिष: शुभ नाम का चयन', description: 'अंक ज्योतिष से शुभ व्यवसाय या दुकान का नाम चुनें: मालिक का भाग्यांक, उद्योग का अंक, कैल्डियन योग, लॉन्च तिथि, लोगो और व्यवसाय मोबाइल – व्यावहारिक सूची।', kicker: 'व्यवसाय अंक ज्योतिष', sub: 'ब्रांड नाम को मालिक, उद्योग और लॉन्च तिथि से मिलाएँ।',
      faqs: [
        { q: 'क्या व्यवसाय का नाम मालिक से मेल खाए?', a: 'हाँ, मुख्य रूप से मालिक के भाग्यांक से; साझेदार हों तो सबके मित्र अंक खोजें।' },
        { q: 'व्यापार के लिए कौन-सा अंक अच्छा है?', a: 'अंक 5 (बुध) अक्सर व्यापार, सेल्स और संवाद के अनुकूल है, यदि मालिक के अनुकूल हो।' },
        { q: 'क्या लॉन्च तिथि मायने रखती है?', a: 'हाँ। ऐसी तिथि चुनें जिसका अंक नाम और मालिक दोनों का मित्र हो।' },
        { q: 'क्या गणना में "प्राइवेट लिमिटेड" जोड़ें?', a: 'लोग जो ब्रांड नाम उपयोग करते हैं वह जाँचें, साथ ही पूरा पंजीकृत नाम भी।' },
        { q: 'क्या मौजूदा व्यवसाय नाम सुधारा जा सकता है?', a: 'अक्सर छोटा वर्तनी या लोगो-शब्द परिवर्तन पर्याप्त होता है।' },
      ] },
    sections: [
      { id: 'why', cta: true, en: ['Why a Business Name Matters', [p('A business name is repeated by every customer, invoice and signboard. Numerology reads it as the vibration of the enterprise. When the name number is friendly with the owner’s Bhagyank and suits the nature of the work, growth tends to be steadier.'), fig({ t: 'shop' }, 'Your business name, signboard and launch date work together')]], hi: ['व्यवसाय का नाम क्यों महत्वपूर्ण है', [p('व्यवसाय का नाम हर ग्राहक, बिल और साइनबोर्ड पर दोहराया जाता है। अंक ज्योतिष इसे उद्यम का कंपन मानता है। जब नामांक मालिक के भाग्यांक का मित्र हो और काम के स्वभाव से मेल खाए, तो विकास अधिक स्थिर रहता है।'), fig({ t: 'shop' }, 'व्यवसाय का नाम, साइनबोर्ड और लॉन्च तिथि साथ काम करते हैं')]] },
      { id: 'industry', en: ['Numbers That Suit Different Industries', [table(['Number', 'Suits'], [['1', 'Leadership brands, government contracts, consulting'], ['3', 'Education, finance, law, publishing'], ['5', 'Trading, sales, media, travel, IT services'], ['6', 'Fashion, beauty, food, hospitality, design'], ['8', 'Real estate, manufacturing, mining (only if the owner supports 8)'], ['9', 'Construction, sports, defence supplies, engineering']])]], hi: ['अलग उद्योगों के अनुकूल अंक', [table(['अंक', 'अनुकूल'], [['1', 'नेतृत्व ब्रांड, सरकारी अनुबंध, परामर्श'], ['3', 'शिक्षा, वित्त, कानून, प्रकाशन'], ['5', 'व्यापार, सेल्स, मीडिया, यात्रा, आईटी सेवाएँ'], ['6', 'फ़ैशन, सौंदर्य, भोजन, आतिथ्य, डिज़ाइन'], ['8', 'रियल एस्टेट, निर्माण, खनन (केवल यदि मालिक 8 के अनुकूल हो)'], ['9', 'निर्माण कार्य, खेल, रक्षा आपूर्ति, इंजीनियरिंग']])]] },
      { id: 'launch', en: ['Launch Date, Signboard and Business Mobile', [p('The name is only one part. The day you open, the date on your registration, the number on your shop and the business mobile number all carry vibrations. Choose a launch day whose number is friendly with both the business name and the owner’s Bhagyank, and prefer a personal year of 1, 3 or 5 for the owner – the years our method marks as favourable for starting a business. Keep the signboard spelling exactly the same as the registered brand name.'), tip('A good name with a clashing launch date is like a strong seed sown on the wrong day. Spend ten extra minutes on the date – it is free.')]], hi: ['लॉन्च तिथि, साइनबोर्ड और व्यवसाय मोबाइल', [p('नाम केवल एक हिस्सा है। उद्घाटन का दिन, पंजीकरण की तिथि, दुकान का नंबर और व्यवसाय का मोबाइल नंबर – सबका कंपन होता है। ऐसा लॉन्च दिन चुनें जिसका अंक व्यवसाय के नाम और मालिक के भाग्यांक दोनों का मित्र हो, और मालिक के लिए व्यक्तिगत वर्ष 1, 3 या 5 को प्राथमिकता दें – हमारी विधि में ये व्यवसाय शुरू करने के लिए अनुकूल वर्ष हैं। साइनबोर्ड की वर्तनी पंजीकृत ब्रांड नाम जैसी ही रखें।'), tip('अच्छा नाम और टकराती लॉन्च तिथि – जैसे मज़बूत बीज ग़लत दिन बोया गया हो। तिथि पर दस मिनट अधिक लगाएँ – यह मुफ़्त है।')]] },
      { id: 'checklist', cta: true, en: ['Business Name Checklist', [list(['Name number friendly with the owner’s Bhagyank', 'Favourable compound number', 'Suits the industry', 'Launch or registration date friendly with the name', 'Business mobile number total friendly with the owner', 'Logo text spelled exactly like the name']), tip('With partners, I look for a number friendly with every partner’s Bhagyank. If none exists, the main decision-maker’s number takes priority.')]], hi: ['व्यवसाय नाम जाँच-सूची', [list(['नामांक मालिक के भाग्यांक का मित्र', 'शुभ मिश्रित अंक', 'उद्योग के अनुकूल', 'लॉन्च या पंजीकरण तिथि नाम की मित्र', 'व्यवसाय मोबाइल का योग मालिक का मित्र', 'लोगो में वर्तनी ठीक नाम जैसी']), tip('साझेदार हों तो मैं ऐसा अंक खोजता हूँ जो हर साझेदार के भाग्यांक का मित्र हो। ऐसा न मिले तो मुख्य निर्णय लेने वाले का अंक प्राथमिक होता है।')]] },
    ],
  },

  /* 11 ─ Marriage date */
  {
    slug: 'marriage-date-numerology-lucky-wedding-date', art: { t: 'rings' }, service: 'couple', calc: 'year', calcs: ['moolank', 'bhagyank', 'year', 'name'],
    keywords: ['marriage date numerology', 'lucky wedding date numerology', 'wedding date by date of birth', 'shubh vivah date numerology', 'marriage compatibility numerology', 'विवाह तिथि अंक ज्योतिष'],
    en: { title: 'Marriage Date Numerology: How to Choose a Lucky Wedding Date', h1: 'Choosing a Lucky Wedding Date with Numerology', description: 'How to pick a lucky wedding date with numerology: both partners’ Mulank and Bhagyank, personal years 2 and 6, date number and combining with the panchang muhurat.', kicker: 'Wedding numerology', sub: 'A date that supports both partners – and the years that favour marriage.',
      faqs: [
        { q: 'Which personal years favour marriage?', a: 'In our method, personal years 2 and 6 are the most favourable.' },
        { q: 'Should the date match the bride or groom?', a: 'Both. Look for a date number friendly with both partners.' },
        { q: 'Does the month or year matter?', a: 'The day number matters most; the full date total is also checked.' },
        { q: 'What about muhurat?', a: 'Numerology works alongside the panchang. Choose a muhurat date that is also numerologically friendly.' },
        { q: 'Can numerology replace kundli matching?', a: 'It is a separate system. Many families use both.' },
      ] },
    hi: { title: 'विवाह तिथि अंक ज्योतिष: शुभ विवाह तिथि कैसे चुनें', h1: 'अंक ज्योतिष से शुभ विवाह तिथि का चयन', description: 'अंक ज्योतिष से शुभ विवाह तिथि कैसे चुनें: दोनों के मूलांक और भाग्यांक, व्यक्तिगत वर्ष 2 और 6, तिथि का अंक और पंचांग मुहूर्त के साथ मिलान।', kicker: 'विवाह अंक ज्योतिष', sub: 'ऐसी तिथि जो दोनों का साथ दे – और वे वर्ष जो विवाह के अनुकूल हैं।',
      faqs: [
        { q: 'कौन-से व्यक्तिगत वर्ष विवाह के अनुकूल हैं?', a: 'हमारी विधि में व्यक्तिगत वर्ष 2 और 6 सबसे अनुकूल हैं।' },
        { q: 'तिथि वर से मिलाएँ या वधू से?', a: 'दोनों से। ऐसा तिथि-अंक खोजें जो दोनों का मित्र हो।' },
        { q: 'क्या महीना या वर्ष मायने रखता है?', a: 'दिन का अंक सबसे महत्वपूर्ण है; पूरी तिथि का योग भी जाँचा जाता है।' },
        { q: 'मुहूर्त का क्या?', a: 'अंक ज्योतिष पंचांग के साथ काम करता है। ऐसा मुहूर्त चुनें जो अंक ज्योतिष से भी अनुकूल हो।' },
        { q: 'क्या अंक ज्योतिष कुंडली मिलान का विकल्प है?', a: 'यह अलग पद्धति है। कई परिवार दोनों का उपयोग करते हैं।' },
      ] },
    sections: [
      { id: 'intro', cta: true, en: ['How Numerology Helps Choose the Date', [p('A wedding date becomes a lifelong anniversary – and in numerology, the number of that day becomes part of the couple’s shared vibration. The aim is a date whose number is friendly with both partners’ Mulank and Bhagyank, ideally in a supportive personal year.'), fig({ t: 'rings' }, 'Two charts, one date')]], hi: ['अंक ज्योतिष तिथि चुनने में कैसे मदद करता है', [p('विवाह की तिथि जीवन भर की वर्षगाँठ बनती है – और अंक ज्योतिष में उस दिन का अंक दंपति के साझा कंपन का हिस्सा बन जाता है। लक्ष्य है ऐसी तिथि जिसका अंक दोनों के मूलांक और भाग्यांक का मित्र हो, और संभव हो तो अनुकूल व्यक्तिगत वर्ष में।'), fig({ t: 'rings' }, 'दो चार्ट, एक तिथि')]] },
      { id: 'steps', en: ['Step-by-Step', [steps([{ title: 'Both partners’ numbers', text: 'Mulank and Bhagyank of bride and groom.' }, { title: 'Friendly numbers for both', text: 'List numbers friendly with all four.' }, { title: 'Dates in the month', text: 'Days that reduce to those numbers (for example 5, 14, 23 reduce to 5).' }, { title: 'Personal years', text: 'Prefer personal year 2 or 6 for at least one partner.' }, { title: 'Combine with muhurat', text: 'Pick the panchang muhurat that falls on one of these dates.' }])]], hi: ['चरण-दर-चरण', [steps([{ title: 'दोनों के अंक', text: 'वर और वधू के मूलांक और भाग्यांक।' }, { title: 'दोनों के मित्र अंक', text: 'चारों के मित्र अंकों की सूची।' }, { title: 'महीने की तिथियाँ', text: 'वे दिन जो इन अंकों में बदलें (जैसे 5, 14, 23 → 5)।' }, { title: 'व्यक्तिगत वर्ष', text: 'कम से कम एक साथी के लिए व्यक्तिगत वर्ष 2 या 6 को प्राथमिकता।' }, { title: 'मुहूर्त से मिलान', text: 'पंचांग का वह मुहूर्त चुनें जो इनमें से किसी तिथि पर आए।' }])]] },
      { id: 'years', en: ['Personal Years That Favour Marriage', [p('In our method, personal years 2 and 6 are the most favourable for marriage, and 1, 3, 5 and 9 are supportive for the couple’s overall progress. Your personal year starts on your birthday, so a wedding a few weeks after the birthday can fall in a completely different year from one a few weeks before. When both partners are in a 2 or 6 year at the wedding date, the start of married life tends to feel especially smooth.'), table(['Personal year', 'For marriage'], [['2, 6', 'Most favourable'], ['1, 3, 5, 9', 'Supportive'], ['4, 7, 8', 'Possible – choose the date with extra care']])]], hi: ['विवाह के अनुकूल व्यक्तिगत वर्ष', [p('हमारी विधि में व्यक्तिगत वर्ष 2 और 6 विवाह के लिए सबसे अनुकूल हैं, और 1, 3, 5 व 9 दंपति की समग्र प्रगति के लिए सहायक हैं। व्यक्तिगत वर्ष जन्मदिन से शुरू होता है, इसलिए जन्मदिन के कुछ सप्ताह बाद का विवाह, कुछ सप्ताह पहले वाले से बिल्कुल अलग वर्ष में आ सकता है। जब विवाह की तिथि पर दोनों साथी वर्ष 2 या 6 में हों, तो वैवाहिक जीवन की शुरुआत विशेष रूप से सहज रहती है।'), table(['व्यक्तिगत वर्ष', 'विवाह के लिए'], [['2, 6', 'सबसे अनुकूल'], ['1, 3, 5, 9', 'सहायक'], ['4, 7, 8', 'संभव – तिथि अधिक सावधानी से चुनें']])]] },
      { id: 'pairs', cta: true, en: ['Check Your Mulank Pair', [p('We have written a separate compatibility guide for every Mulank pair from 1-1 to 9-9, each with the lucky dates for that couple. Find both Mulanks with the free calculator and open your pair’s guide.'), tip('If the ideal date is not available, a neutral date in a good personal year is better than a friendly date in a very difficult year.')]], hi: ['अपना मूलांक जोड़ा देखें', [p('हमने 1-1 से 9-9 तक हर मूलांक जोड़े की अलग अनुकूलता मार्गदर्शिका लिखी है, हर एक में उस जोड़ी की शुभ तिथियाँ हैं। मुफ़्त कैलकुलेटर से दोनों मूलांक जानें और अपनी जोड़ी की मार्गदर्शिका खोलें।'), tip('यदि आदर्श तिथि उपलब्ध न हो, तो अच्छे व्यक्तिगत वर्ष में सम तिथि बहुत कठिन वर्ष की मित्र तिथि से बेहतर है।')]] },
    ],
  },

  /* 12 ─ Signature */
  {
    slug: 'signature-numerology-how-to-sign-for-success', art: { t: 'pen' }, service: 'signature', calc: 'name', calcs: ['name', 'moolank', 'bhagyank', 'loshu'],
    keywords: ['signature numerology', 'lucky signature', 'signature analysis', 'how to sign for success', 'signature as per numerology', 'हस्ताक्षर अंक ज्योतिष'],
    en: { title: 'Signature Numerology: How to Sign for Success and Confidence', h1: 'Signature Numerology: Signing for Success', description: 'What your signature reveals and how to improve it with numerology: rising slope, first letter, underline, dots and cuts, plus the planet tip for your Mulank.', kicker: 'Signature analysis', sub: 'The pen strokes you repeat every day – shaped to support you.',
      faqs: [
        { q: 'Should a signature rise upward?', a: 'Yes, a gently rising signature is considered positive for growth and optimism.' },
        { q: 'Is a dot at the end bad?', a: 'A dot or full stop at the end is usually avoided, as it signals stopping or blocking.' },
        { q: 'Should I underline my signature?', a: 'A single clean underline can support confidence; avoid cutting through the name.' },
        { q: 'Does the signature need my full name?', a: 'Not necessarily, but the first letter should be clear and confident.' },
        { q: 'How long to adopt a new signature?', a: 'Practise for a few weeks and use it consistently everywhere.' },
      ] },
    hi: { title: 'हस्ताक्षर अंक ज्योतिष: सफलता और आत्मविश्वास के लिए हस्ताक्षर', h1: 'हस्ताक्षर अंक ज्योतिष: सफलता के लिए हस्ताक्षर', description: 'आपके हस्ताक्षर क्या बताते हैं और अंक ज्योतिष से उन्हें कैसे सुधारें: ऊपर उठती ढलान, पहला अक्षर, अंडरलाइन, बिंदु और कटाव, और आपके मूलांक के ग्रह का सुझाव।', kicker: 'हस्ताक्षर विश्लेषण', sub: 'रोज़ दोहराई जाने वाली कलम की रेखाएँ – आपके साथ देने के लिए।',
      faqs: [
        { q: 'क्या हस्ताक्षर ऊपर की ओर उठें?', a: 'हाँ, हल्का ऊपर उठता हस्ताक्षर विकास और आशावाद के लिए शुभ माना जाता है।' },
        { q: 'क्या अंत में बिंदु बुरा है?', a: 'अंत में बिंदु या पूर्ण विराम आमतौर पर नहीं लगाया जाता, क्योंकि यह रुकावट दर्शाता है।' },
        { q: 'क्या हस्ताक्षर के नीचे रेखा खींचें?', a: 'एक साफ़ रेखा आत्मविश्वास बढ़ा सकती है; नाम को काटती रेखा से बचें।' },
        { q: 'क्या हस्ताक्षर में पूरा नाम ज़रूरी है?', a: 'ज़रूरी नहीं, पर पहला अक्षर स्पष्ट और आत्मविश्वासी हो।' },
        { q: 'नया हस्ताक्षर अपनाने में कितना समय लगता है?', a: 'कुछ सप्ताह अभ्यास करें और फिर हर जगह एक जैसा उपयोग करें।' },
      ] },
    sections: [
      { id: 'why', cta: true, en: ['Why Your Signature Matters', [p('You sign cheques, contracts and forms for life. Graphology and numerology both treat the signature as a mirror of self-image. A clear, rising signature with a confident first letter supports how you present yourself – and repeated daily, it reinforces that image.'), fig({ t: 'pen' }, 'A gently rising signature with a clear start')]], hi: ['हस्ताक्षर क्यों महत्वपूर्ण है', [p('आप जीवन भर चेक, अनुबंध और फ़ॉर्म पर हस्ताक्षर करते हैं। लेखन-विज्ञान और अंक ज्योतिष दोनों हस्ताक्षर को आत्म-छवि का दर्पण मानते हैं। स्पष्ट, ऊपर उठता हस्ताक्षर और आत्मविश्वासी पहला अक्षर आपकी प्रस्तुति को सहारा देता है – और रोज़ दोहराने से वह छवि मज़बूत होती है।'), fig({ t: 'pen' }, 'स्पष्ट शुरुआत के साथ हल्का ऊपर उठता हस्ताक्षर')]] },
      { id: 'rules', en: ['Seven Signature Guidelines', [list(['Let the signature rise gently from left to right', 'Make the first letter clear and slightly larger', 'Avoid a dot or full stop at the end', 'Do not cut through your own name', 'Avoid a falling end stroke', 'A single underline is fine; avoid double lines', 'Keep it readable enough to recognise'])]], hi: ['हस्ताक्षर के सात नियम', [list(['हस्ताक्षर बाएँ से दाएँ हल्का ऊपर उठे', 'पहला अक्षर स्पष्ट और थोड़ा बड़ा हो', 'अंत में बिंदु या पूर्ण विराम न लगाएँ', 'अपने नाम को न काटें', 'अंत की रेखा नीचे न गिरे', 'एक अंडरलाइन ठीक है; दोहरी रेखा से बचें', 'इतना पठनीय रखें कि पहचाना जा सके'])]] },
      { id: 'read', en: ['What Your Current Signature Says', [p('Before changing anything, look at your present signature on a plain sheet. A falling line often reflects tiredness or pessimism; a very small, cramped signature can show hesitation; an illegible scribble may mean you prefer privacy; a big flourish under the name shows a wish to be noticed. None of these is wrong – they simply show what is happening now. The aim of correction is not a beautiful signature but one that supports the confidence and direction you want.'), list(['Falling slope → tiredness, low optimism', 'Very small → hesitation, low self-projection', 'Cut through the name → self-criticism', 'Clear first letter and rising end → confidence and growth'])]], hi: ['आपके वर्तमान हस्ताक्षर क्या कहते हैं', [p('कुछ बदलने से पहले सादे काग़ज़ पर अपने वर्तमान हस्ताक्षर देखें। नीचे गिरती रेखा अक्सर थकान या निराशा दर्शाती है; बहुत छोटे, सिकुड़े हस्ताक्षर झिझक दिखा सकते हैं; अपठनीय घसीट निजता की पसंद हो सकती है; नाम के नीचे बड़ा अलंकरण ध्यान खींचने की इच्छा दिखाता है। इनमें से कुछ भी ग़लत नहीं – ये बस बताते हैं कि अभी क्या चल रहा है। सुधार का लक्ष्य सुंदर हस्ताक्षर नहीं, बल्कि ऐसा हस्ताक्षर है जो आपके चाहे आत्मविश्वास और दिशा का साथ दे।'), list(['गिरती ढलान → थकान, कम आशावाद', 'बहुत छोटे → झिझक, कम आत्म-प्रस्तुति', 'नाम को काटती रेखा → आत्म-आलोचना', 'स्पष्ट पहला अक्षर और ऊपर उठता अंत → आत्मविश्वास और विकास'])]] },
      { id: 'planet', cta: true, en: ['Planet Tips by Mulank', [table(['Mulank', 'Tip'], [['1', 'Bold, clear first letter; signature rising upward'], ['2', 'Smooth, flowing strokes; no sharp cuts'], ['3', 'Well-formed, readable letters; a single underline'], ['4', 'Avoid a downward stroke or dot at the end'], ['5', 'Fast, connected signature, still legible'], ['6', 'Artistic, rounded strokes with a rising end'], ['7', 'Simple signature, never crossed through'], ['8', 'Upward slope; never underline twice'], ['9', 'Firm, energetic strokes with a rising end']]), tip('Practise your new signature 21 times each morning for three weeks. After that the hand remembers it, and it stops feeling forced.')]], hi: ['मूलांक अनुसार ग्रह सुझाव', [table(['मूलांक', 'सुझाव'], [['1', 'बोल्ड, स्पष्ट पहला अक्षर; ऊपर उठता हस्ताक्षर'], ['2', 'सहज, बहती रेखाएँ; तीखे कटाव नहीं'], ['3', 'सुगठित, पठनीय अक्षर; एक अंडरलाइन'], ['4', 'अंत में नीचे की रेखा या बिंदु से बचें'], ['5', 'तेज़, जुड़ा हुआ, पर पठनीय'], ['6', 'कलात्मक, गोल रेखाएँ, ऊपर उठता अंत'], ['7', 'सरल हस्ताक्षर, कभी काटें नहीं'], ['8', 'ऊपर की ढलान; दो बार अंडरलाइन नहीं'], ['9', 'दृढ़, ऊर्जावान रेखाएँ, ऊपर उठता अंत']]), tip('तीन सप्ताह तक हर सुबह नया हस्ताक्षर 21 बार अभ्यास करें। उसके बाद हाथ उसे याद कर लेता है और वह बनावटी नहीं लगता।')]] },
    ],
  },

  /* 13 ─ Remedies */
  {
    slug: 'numerology-remedies-colours-mantras-daan-habits', art: { t: 'wheel' }, service: 'report', calc: 'loshu', calcs: ['moolank', 'bhagyank', 'loshu', 'kua'],
    keywords: ['numerology remedies', 'numerology remedies for each number', 'lucky colour by numerology', 'mantra for mulank', 'daan remedies numerology', 'अंक ज्योतिष उपाय'],
    en: { title: 'Numerology Remedies That Help: Colours, Mantras, Daan & Habits', h1: 'Numerology Remedies: Simple Steps That Actually Help', description: 'Practical numerology remedies for numbers 1–9: lucky colours, days, beej mantras, daan, habits and gemstone cautions – low-cost guidance by Acharya Nandram.', kicker: 'Remedies', sub: 'Low-cost, everyday remedies – and when a gemstone is (and is not) needed.',
      faqs: [
        { q: 'Do remedies really work?', a: 'Remedies work best as consistent habits that reinforce positive qualities; they are supportive, not magical.' },
        { q: 'Should I wear a gemstone?', a: 'Only after a full chart check by a qualified expert, and some stones need a trial period.' },
        { q: 'How long should I follow a remedy?', a: 'Most daily remedies are followed for 40 days, then reviewed.' },
        { q: 'Which remedy should I start with?', a: 'The one for your most important missing number or weakest planet in your chart.' },
        { q: 'Are expensive rituals necessary?', a: 'No. Our approach uses simple, affordable remedies.' },
      ] },
    hi: { title: 'अंक ज्योतिष के उपाय जो मदद करते हैं: रंग, मंत्र, दान और आदतें', h1: 'अंक ज्योतिष के उपाय: सरल क़दम जो सचमुच मदद करते हैं', description: 'अंक 1–9 के व्यावहारिक उपाय: शुभ रंग, दिन, बीज मंत्र, दान, आदतें और रत्न संबंधी सावधानियाँ – आचार्य नंदराम का कम ख़र्च वाला मार्गदर्शन।', kicker: 'उपाय', sub: 'कम ख़र्च वाले रोज़ के उपाय – और रत्न कब ज़रूरी है, कब नहीं।',
      faqs: [
        { q: 'क्या उपाय सचमुच काम करते हैं?', a: 'उपाय सबसे अच्छा तब काम करते हैं जब वे सकारात्मक गुणों को मज़बूत करने वाली नियमित आदत बनें; वे सहायक हैं, जादू नहीं।' },
        { q: 'क्या मुझे रत्न पहनना चाहिए?', a: 'केवल योग्य विशेषज्ञ की पूरी चार्ट जाँच के बाद; कुछ रत्नों के लिए परीक्षण अवधि ज़रूरी है।' },
        { q: 'उपाय कितने समय तक करें?', a: 'अधिकतर रोज़ के उपाय 40 दिन करें, फिर समीक्षा करें।' },
        { q: 'शुरुआत किस उपाय से करें?', a: 'आपके सबसे महत्वपूर्ण अनुपस्थित अंक या चार्ट के सबसे कमज़ोर ग्रह के उपाय से।' },
        { q: 'क्या महँगे अनुष्ठान ज़रूरी हैं?', a: 'नहीं। हमारी पद्धति सरल, किफ़ायती उपाय उपयोग करती है।' },
      ] },
    sections: [
      { id: 'principle', cta: true, en: ['The Principle Behind Remedies', [p('Every number is linked with a planet. When a number is weak, missing or clashing in your chart, remedies strengthen the qualities of its planet through colour, day, sound (mantra), giving (daan) and behaviour (habit). The best remedies are simple enough to follow daily.'), fig({ t: 'wheel' }, 'Each number’s planet has its own day, colour and mantra')]], hi: ['उपायों के पीछे का सिद्धांत', [p('हर अंक एक ग्रह से जुड़ा है। जब आपके चार्ट में कोई अंक कमज़ोर, अनुपस्थित या टकराता हो, तो उपाय रंग, दिन, ध्वनि (मंत्र), दान और व्यवहार (आदत) के माध्यम से उसके ग्रह के गुण मज़बूत करते हैं। सबसे अच्छे उपाय वे हैं जो रोज़ आसानी से किए जा सकें।'), fig({ t: 'wheel' }, 'हर अंक के ग्रह का अपना दिन, रंग और मंत्र')]] },
      { id: 'table', en: ['Remedies for Numbers 1–9', [table(['Number', 'Day', 'Colours', 'Simple remedy'], NUMS.map((n) => { const m = mulankFor(n, 'en')!; return [String(n), m.luckyDays[0], m.luckyColors.slice(0, 2).join(', '), m.remedies[0]]; }))]], hi: ['अंक 1–9 के उपाय', [table(['अंक', 'दिन', 'रंग', 'सरल उपाय'], NUMS.map((n) => { const m = mulankFor(n, 'hi')!; return [String(n), m.luckyDays[0], m.luckyColors.slice(0, 2).join(', '), m.remedies[0]]; }))]] },
      { id: 'gems', en: ['A Word on Gemstones', [p('Gemstones are powerful and sometimes expensive. Stones for Saturn, Rahu and Ketu (Blue Sapphire, Hessonite, Cat’s Eye) need a trial period and a full chart check. Many people get good results from colours, habits and mantras alone, without any stone.'), tip('Begin with the habit, not the stone. If after 40 days of habit and mantra you still feel stuck, then we discuss whether a gemstone suits your chart.')]], hi: ['रत्नों के बारे में', [p('रत्न शक्तिशाली और कभी-कभी महँगे होते हैं। शनि, राहु और केतु के रत्न (नीलम, गोमेद, लहसुनिया) के लिए परीक्षण अवधि और पूरी चार्ट जाँच ज़रूरी है। कई लोगों को बिना रत्न के केवल रंग, आदतों और मंत्र से अच्छे परिणाम मिलते हैं।'), tip('रत्न से नहीं, आदत से शुरुआत करें। 40 दिन आदत और मंत्र के बाद भी अटका महसूस हो, तब हम चर्चा करते हैं कि क्या कोई रत्न आपके चार्ट के अनुकूल है।')]] },
      { id: 'order', cta: true, en: ['The Right Order to Apply Remedies', [steps([{ title: 'Habit', text: 'A daily behaviour linked to the weak number.' }, { title: 'Colour and day', text: 'Use the planet’s colour and honour its day.' }, { title: 'Mantra and daan', text: 'Daily mantra and weekly charity.' }, { title: 'Name and mobile', text: 'Balance through spelling and number choice.' }, { title: 'Gemstone (if needed)', text: 'Only after a full expert check.' }])]], hi: ['उपाय अपनाने का सही क्रम', [steps([{ title: 'आदत', text: 'कमज़ोर अंक से जुड़ा रोज़ का व्यवहार।' }, { title: 'रंग और दिन', text: 'ग्रह का रंग अपनाएँ और उसका दिन मानें।' }, { title: 'मंत्र और दान', text: 'रोज़ मंत्र और साप्ताहिक दान।' }, { title: 'नाम और मोबाइल', text: 'वर्तनी और नंबर चयन से संतुलन।' }, { title: 'रत्न (यदि आवश्यक)', text: 'केवल विशेषज्ञ की पूरी जाँच के बाद।' }])]] },
    ],
  },

  /* 14 ─ Consultation guide */
  {
    slug: 'online-numerology-consultation-guide-how-to-prepare', art: { t: 'portrait' }, service: 'report', calc: 'moolank', calcs: ['moolank', 'bhagyank', 'loshu', 'mobile'],
    keywords: ['online numerology consultation', 'numerologist near me', 'how to choose a numerologist', 'numerology report online india', 'numerology consultation hindi', 'ऑनलाइन अंक ज्योतिष परामर्श'],
    en: { title: 'Online Numerology Consultation: How to Prepare & What to Ask', h1: 'Online Numerology Consultation: A Complete Guide', description: 'How an online numerology consultation works, what details to keep ready, questions to ask, how to choose a genuine numerologist and what you receive from Acharya Nandram.', kicker: 'Consultation guide', sub: 'Get the most out of your reading – from details to keep ready to follow-up questions.',
      faqs: [
        { q: 'What details are needed?', a: 'Full name as used daily, date of birth, gender (for Kua), and any numbers you want checked – mobile, house, partner’s details.' },
        { q: 'Is an online consultation as good as in person?', a: 'Numerology needs numbers, not physical presence, so online readings are just as accurate.' },
        { q: 'Can I ask about a specific decision?', a: 'Yes – job change, marriage date, business name, new number and similar questions are common.' },
        { q: 'Is my data kept private?', a: 'Personal details are stored encrypted and used only for your reports.' },
        { q: 'How do I book?', a: `Choose a reading on the “Get my reading” page, or WhatsApp ${WA}.` },
      ] },
    hi: { title: 'ऑनलाइन अंक ज्योतिष परामर्श: तैयारी कैसे करें और क्या पूछें', h1: 'ऑनलाइन अंक ज्योतिष परामर्श: संपूर्ण मार्गदर्शिका', description: 'ऑनलाइन अंक ज्योतिष परामर्श कैसे होता है, कौन-से विवरण तैयार रखें, क्या पूछें, सच्चे अंक ज्योतिषी को कैसे चुनें और आचार्य नंदराम से क्या मिलता है।', kicker: 'परामर्श मार्गदर्शिका', sub: 'अपनी रीडिंग का पूरा लाभ लें – ज़रूरी विवरण से लेकर आगे के प्रश्नों तक।',
      faqs: [
        { q: 'कौन-से विवरण चाहिए?', a: 'रोज़ उपयोग वाला पूरा नाम, जन्म तिथि, लिंग (कुआ के लिए), और जो नंबर जाँचने हों – मोबाइल, मकान, जीवनसाथी के विवरण।' },
        { q: 'क्या ऑनलाइन परामर्श आमने-सामने जितना अच्छा है?', a: 'अंक ज्योतिष को अंक चाहिए, शारीरिक उपस्थिति नहीं, इसलिए ऑनलाइन रीडिंग उतनी ही सटीक है।' },
        { q: 'क्या किसी विशेष निर्णय के बारे में पूछ सकते हैं?', a: 'हाँ – नौकरी बदलना, विवाह तिथि, व्यवसाय नाम, नया नंबर जैसे प्रश्न आम हैं।' },
        { q: 'क्या मेरी जानकारी सुरक्षित रहती है?', a: 'व्यक्तिगत विवरण एन्क्रिप्ट करके रखे जाते हैं और केवल आपकी रिपोर्ट के लिए उपयोग होते हैं।' },
        { q: 'बुकिंग कैसे करें?', a: `"मेरी रीडिंग पाएँ" पेज पर रीडिंग चुनें, या व्हाट्सऐप ${WA} पर संदेश भेजें।` },
      ] },
    sections: [
      { id: 'how', cta: true, en: ['How an Online Consultation Works', [p('Numerology needs your numbers, not your physical presence. You share your details, the chart is calculated, and you receive a designed report with explanations and remedies – with the option to ask follow-up questions.'), fig({ t: 'portrait' }, 'Consult Acharya Nandram online from anywhere')]], hi: ['ऑनलाइन परामर्श कैसे होता है', [p('अंक ज्योतिष को आपके अंक चाहिए, आपकी शारीरिक उपस्थिति नहीं। आप अपने विवरण देते हैं, चार्ट की गणना होती है, और आपको व्याख्या व उपायों के साथ डिज़ाइन की हुई रिपोर्ट मिलती है – आगे प्रश्न पूछने की सुविधा के साथ।'), fig({ t: 'portrait' }, 'कहीं से भी आचार्य नंदराम से ऑनलाइन परामर्श लें')]] },
      { id: 'prepare', en: ['Details to Keep Ready', [list(['Full name exactly as you use it daily (and as on documents, if different)', 'Date of birth from the birth certificate', 'Gender (needed for the Kua number)', 'Mobile, house or vehicle numbers you want checked', 'Partner’s name and date of birth for compatibility', 'Your top two or three questions'])]], hi: ['ये विवरण तैयार रखें', [list(['रोज़ उपयोग वाला पूरा नाम (और दस्तावेज़ों वाला, यदि अलग हो)', 'जन्म प्रमाणपत्र की जन्म तिथि', 'लिंग (कुआ अंक के लिए)', 'जिन मोबाइल, मकान या वाहन नंबरों की जाँच करनी है', 'अनुकूलता के लिए जीवनसाथी का नाम और जन्म तिथि', 'आपके दो-तीन मुख्य प्रश्न'])]] },
      { id: 'choose', en: ['How to Choose a Genuine Numerologist', [list(['They explain which system they use and show calculations', 'They do not frighten you or push costly rituals', 'Their remedies are practical and affordable', 'They respect professional medical, legal and financial advice', 'They give results in a language your family can read']), tip('A good reading leaves you calmer and clearer than before. If you feel more anxious after a consultation, ask for the reasoning behind every prediction.')]], hi: ['सच्चे अंक ज्योतिषी को कैसे चुनें', [list(['वे बताते हैं कि कौन-सी पद्धति उपयोग करते हैं और गणना दिखाते हैं', 'वे डराते नहीं और महँगे अनुष्ठान नहीं थोपते', 'उनके उपाय व्यावहारिक और किफ़ायती हैं', 'वे चिकित्सा, कानूनी और वित्तीय पेशेवर सलाह का सम्मान करते हैं', 'वे ऐसी भाषा में परिणाम देते हैं जिसे परिवार पढ़ सके']), tip('अच्छी रीडिंग के बाद आप पहले से अधिक शांत और स्पष्ट महसूस करते हैं। परामर्श के बाद चिंता बढ़े, तो हर भविष्यवाणी का कारण पूछें।')]] },
      { id: 'receive', cta: true, en: ['What You Receive', [list(['A designed PDF report in English, Hindi or Hinglish', 'Mulank, Bhagyank, Lo Shu grid, name and mobile analysis', 'Lucky numbers, colours, days and directions', 'Personal remedies in a clear order', 'Timing guidance from your personal year'])]], hi: ['आपको क्या मिलता है', [list(['अंग्रेज़ी, हिंदी या हिंग्लिश में डिज़ाइन की हुई PDF रिपोर्ट', 'मूलांक, भाग्यांक, लो शू ग्रिड, नाम और मोबाइल विश्लेषण', 'शुभ अंक, रंग, दिन और दिशाएँ', 'स्पष्ट क्रम में व्यक्तिगत उपाय', 'व्यक्तिगत वर्ष से समय का मार्गदर्शन'])]] },
    ],
  },

  /* 15 ─ 2027 predictions */
  {
    slug: 'numerology-2027-predictions-universal-year-2', art: { t: 'year', n: 2 }, service: 'year', calc: 'year', calcs: ['year', 'moolank', 'bhagyank', 'loshu'],
    keywords: ['numerology 2027', 'numerology predictions 2027', '2027 universal year 2', 'mulank 2027 prediction', 'numerology 2027 for all numbers', 'अंक ज्योतिष 2027'],
    en: { title: 'Numerology 2027 Predictions: Universal Year 2 for Mulank 1–9', h1: 'Numerology 2027: The Year of Partnership (Universal Year 2)', description: 'Numerology predictions for 2027, a universal year 2 ruled by the Moon: themes for the world and a forecast for Mulank 1 to 9, with simple remedies by Acharya Nandram.', kicker: 'Numerology 2027', sub: 'A Moon year of partnerships, patience and emotions – and what it means for your Mulank.',
      faqs: [
        { q: 'What is the universal year number of 2027?', a: '2 + 0 + 2 + 7 = 11 → 2. 2027 is a universal year 2, ruled by the Moon.' },
        { q: 'Is 2027 good for marriage?', a: 'Universal year 2 favours partnerships, but your own personal year decides the timing.' },
        { q: 'Which Mulanks benefit most in 2027?', a: 'By our friendship table, numbers that treat 2 as friendly – such as 1, 2, 4, 6 and 7 – tend to find 2027 supportive.' },
        { q: 'Does 2027 apply from 1 January?', a: 'The universal year follows the calendar; your personal year runs birthday to birthday.' },
        { q: 'How do I get a personal 2027 forecast?', a: 'The personal year consultancy gives month-by-month guidance for your date of birth.' },
      ] },
    hi: { title: 'अंक ज्योतिष 2027 भविष्यवाणी: मूलांक 1–9 के लिए सार्वभौमिक वर्ष 2', h1: 'अंक ज्योतिष 2027: साझेदारी का वर्ष (सार्वभौमिक वर्ष 2)', description: 'वर्ष 2027 की अंक ज्योतिष भविष्यवाणी – चंद्रमा का सार्वभौमिक वर्ष 2: दुनिया के लिए विषय और मूलांक 1 से 9 का पूर्वानुमान, सरल उपायों के साथ।', kicker: 'अंक ज्योतिष 2027', sub: 'साझेदारी, धैर्य और भावनाओं का चंद्र वर्ष – और आपके मूलांक के लिए इसका अर्थ।',
      faqs: [
        { q: '2027 का सार्वभौमिक वर्ष अंक क्या है?', a: '2 + 0 + 2 + 7 = 11 → 2। 2027 चंद्रमा का सार्वभौमिक वर्ष 2 है।' },
        { q: 'क्या 2027 विवाह के लिए अच्छा है?', a: 'सार्वभौमिक वर्ष 2 साझेदारी के अनुकूल है, पर समय आपका व्यक्तिगत वर्ष तय करता है।' },
        { q: '2027 में किन मूलांकों को सबसे अधिक लाभ?', a: 'हमारी मित्रता तालिका के अनुसार जो अंक 2 को मित्र मानते हैं – जैसे 1, 2, 4, 6 और 7 – उनके लिए 2027 सहायक रहता है।' },
        { q: 'क्या 2027 का प्रभाव 1 जनवरी से है?', a: 'सार्वभौमिक वर्ष कैलेंडर से चलता है; आपका व्यक्तिगत वर्ष जन्मदिन से जन्मदिन तक।' },
        { q: 'व्यक्तिगत 2027 पूर्वानुमान कैसे पाएँ?', a: 'व्यक्तिगत वर्ष परामर्श आपकी जन्म तिथि के लिए माह-वार मार्गदर्शन देता है।' },
      ] },
    sections: [
      { id: 'theme', cta: true, en: ['2027: A Universal Year 2', [p(`2 + 0 + 2 + 7 = 11, and 1 + 1 = 2. 2027 carries the number 2 – with a touch of master number 11 – ruled by the Moon. Its theme is ${PY_THEMES.en[2].toLowerCase()}: cooperation over competition, diplomacy, emotional intelligence and the slow growth of what 2026 (a universal 1 year) began.`), fig({ t: 'year', n: 2 }, '2027 – a Moon year of partnership and patience')]], hi: ['2027: सार्वभौमिक वर्ष 2', [p(`2 + 0 + 2 + 7 = 11, और 1 + 1 = 2। वर्ष 2027 अंक 2 का है – मास्टर अंक 11 की झलक के साथ – और इसके स्वामी चंद्रमा हैं। इसका विषय है ${PY_THEMES.hi[2]}: प्रतिस्पर्धा से अधिक सहयोग, कूटनीति, भावनात्मक समझ और 2026 (सार्वभौमिक वर्ष 1) में शुरू हुई चीज़ों का धीमा विकास।`), fig({ t: 'year', n: 2 }, '2027 – साझेदारी और धैर्य का चंद्र वर्ष')]] },
      { id: 'world', en: ['What 2027 Favours', [list(['Partnerships, alliances and joint ventures', 'Marriage, family bonds and reconciliation', 'Counselling, healthcare, hospitality and creative arts', 'Patient, steady progress rather than dramatic leaps', 'Listening, negotiation and emotional wellbeing'])]], hi: ['2027 किसके अनुकूल है', [list(['साझेदारी, गठबंधन और संयुक्त उद्यम', 'विवाह, पारिवारिक बंधन और सुलह', 'परामर्श, स्वास्थ्य सेवा, आतिथ्य और रचनात्मक कलाएँ', 'नाटकीय छलाँग के बजाय धैर्यपूर्ण, स्थिर प्रगति', 'सुनना, बातचीत और भावनात्मक स्वास्थ्य'])]] },
      { id: 'mulank', cta: true, en: ['2027 Forecast for Mulank 1 to 9', [table(['Mulank', 'Planet', '2027', 'Guidance'], u2027('en')), tip('This table shows the general mood of 2027 for your Mulank. Your personal year – which starts on your birthday – matters more for your own decisions.')]], hi: ['मूलांक 1 से 9 के लिए 2027 का पूर्वानुमान', [table(['मूलांक', 'ग्रह', '2027', 'मार्गदर्शन'], u2027('hi')), tip('यह तालिका आपके मूलांक के लिए 2027 का सामान्य रुख़ दिखाती है। आपके अपने निर्णयों के लिए आपका व्यक्तिगत वर्ष – जो जन्मदिन से शुरू होता है – अधिक महत्वपूर्ण है।')]] },
      { id: 'remedies', en: ['Remedies for a Moon Year', [list(['Offer water or milk to Lord Shiva on Mondays', 'Spend calm time near water; keep a regular sleep routine', 'Wear white or cream on important days', 'Chant “Om Chandraya Namah” 108 times on Mondays', 'Strengthen relationships – one honest conversation each week'])]], hi: ['चंद्र वर्ष के उपाय', [list(['सोमवार को भगवान शिव को जल या दूध अर्पित करें', 'जल के पास शांत समय बिताएँ; नींद की नियमित दिनचर्या रखें', 'महत्वपूर्ण दिनों में सफ़ेद या क्रीम रंग पहनें', 'सोमवार को "ॐ चंद्राय नमः" 108 बार जपें', 'रिश्ते मज़बूत करें – हर सप्ताह एक ईमानदार बातचीत'])]] },
    ],
  },
];

export const PILLAR_POSTS: TopicRef[] = PILLARS.map((x) => ({ slug: x.slug, cat: 'guide' as const, build: (lang: Lang) => build(x, lang) }));
