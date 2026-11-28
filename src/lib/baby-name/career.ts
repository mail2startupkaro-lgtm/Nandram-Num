/**
 * Best career path for the baby – from the baby's own numbers (Baby Name Numerology Report).
 *
 *   Bhagyank (destiny / life path)  → the long-term direction of work           weight 3
 *   Moolank (birth day)             → natural talent and working style          weight 2
 *   Recommended name number         → how the world will see and use the child  weight 1
 *   Lo Shu grid                     → strong planes = natural aptitudes; missing numbers = skills to build early
 *
 * Fields supported by more than one of these numbers rank higher. Wording stays gentle and realistic: numbers show
 * natural inclinations; the child's own interests, abilities and education decide – parents should observe and
 * encourage, never force.
 */
import { relationOf } from '@/lib/numerology/data/relations';

type L = { en: string; hi: string };
export interface CareerField { id: string; label: L; why: L }
interface NumberCareer { theme: L; talents: L; subjects: L; fields: { id: string; label: L }[]; nurture: [L, L, L]; avoid: L }

/** Career guidance per number 1–9 (Vedic planet rulership; modern Indian career options). */
export const NUMBER_CAREER: Record<number, NumberCareer> = {
  1: {
    theme: { en: 'A born leader – Sun energy: confident, independent and happiest when in charge.', hi: 'जन्मजात नेता – सूर्य की ऊर्जा: आत्मविश्वासी, स्वतंत्र और नेतृत्व करने में सबसे ख़ुश।' },
    talents: { en: 'Leadership, decision-making, initiative, self-confidence, original ideas', hi: 'नेतृत्व, निर्णय क्षमता, पहल करना, आत्मविश्वास, मौलिक विचार' },
    subjects: { en: 'Civics, economics, science, public speaking, management', hi: 'नागरिक शास्त्र, अर्थशास्त्र, विज्ञान, भाषण कला, प्रबंधन' },
    fields: [
      { id: 'admin', label: { en: 'Civil services & administration (IAS / IPS / PCS)', hi: 'सिविल सेवा और प्रशासन (IAS / IPS / PCS)' } },
      { id: 'entrepreneur', label: { en: 'Entrepreneurship & own business', hi: 'उद्यमिता और अपना व्यवसाय' } },
      { id: 'management', label: { en: 'Management & corporate leadership', hi: 'प्रबंधन और कॉर्पोरेट नेतृत्व' } },
      { id: 'medicine', label: { en: 'Medicine (doctor, hospital leadership)', hi: 'चिकित्सा (डॉक्टर, अस्पताल प्रबंधन)' } },
      { id: 'politics', label: { en: 'Public life, politics & social leadership', hi: 'सार्वजनिक जीवन, राजनीति और सामाजिक नेतृत्व' } },
      { id: 'engineering', label: { en: 'Engineering & project leadership', hi: 'इंजीनियरिंग और प्रोजेक्ट नेतृत्व' } },
    ],
    nurture: [
      { en: 'Let the child choose small things (clothes, games) and finish what they start; praise effort, not only results.', hi: 'बच्चे को छोटी-छोटी चीज़ें (कपड़े, खेल) ख़ुद चुनने दें और शुरू किया काम पूरा करने दें; केवल परिणाम नहीं, मेहनत की भी प्रशंसा करें।' },
      { en: 'Class monitor, school captain, debates and team sports build healthy leadership.', hi: 'क्लास मॉनिटर, स्कूल कैप्टन, वाद-विवाद और टीम खेल स्वस्थ नेतृत्व बनाते हैं।' },
      { en: 'Guide towards streams that lead to responsibility – science or commerce with management, or civil-services preparation.', hi: 'ज़िम्मेदारी वाले क्षेत्रों की ओर मार्गदर्शन करें – विज्ञान या कॉमर्स के साथ प्रबंधन, या सिविल सेवा की तैयारी।' },
    ],
    avoid: { en: 'Too much control or comparison makes a 1 rebellious; teach humility and listening to others.', hi: 'अधिक नियंत्रण या तुलना से अंक 1 का बच्चा विद्रोही हो सकता है; विनम्रता और दूसरों की बात सुनना सिखाएँ।' },
  },
  2: {
    theme: { en: 'Sensitive and caring – Moon energy: intuitive, artistic and good with people.', hi: 'संवेदनशील और देखभाल करने वाला – चंद्र की ऊर्जा: अंतर्ज्ञानी, कलात्मक और लोगों से अच्छा तालमेल।' },
    talents: { en: 'Empathy, imagination, cooperation, music and art, caring for others', hi: 'सहानुभूति, कल्पनाशीलता, सहयोग, संगीत और कला, दूसरों की देखभाल' },
    subjects: { en: 'Languages, music, fine arts, biology, home science, psychology', hi: 'भाषाएँ, संगीत, ललित कला, जीव विज्ञान, गृह विज्ञान, मनोविज्ञान' },
    fields: [
      { id: 'counselling', label: { en: 'Psychology & counselling', hi: 'मनोविज्ञान और काउंसलिंग' } },
      { id: 'healthcare', label: { en: 'Nursing, healthcare & nutrition', hi: 'नर्सिंग, स्वास्थ्य सेवा और पोषण' } },
      { id: 'teaching', label: { en: 'Teaching & early-childhood education', hi: 'शिक्षण और प्रारंभिक बाल शिक्षा' } },
      { id: 'arts', label: { en: 'Music, fine arts & performing arts', hi: 'संगीत, ललित कला और प्रदर्शन कला' } },
      { id: 'hospitality', label: { en: 'Hospitality, food & hotel management', hi: 'आतिथ्य, खाद्य और होटल प्रबंधन' } },
      { id: 'hr', label: { en: 'Human resources & public relations', hi: 'मानव संसाधन (HR) और जनसंपर्क' } },
    ],
    nurture: [
      { en: 'A calm, secure home matters most; give gentle routines and plenty of reassurance.', hi: 'शांत और सुरक्षित घर सबसे ज़रूरी है; सौम्य दिनचर्या और भरपूर भरोसा दें।' },
      { en: 'Music, drawing, dance and caring for plants or pets bring out natural gifts.', hi: 'संगीत, चित्रकला, नृत्य और पौधों या पालतू जानवरों की देखभाल प्राकृतिक प्रतिभा को निखारते हैं।' },
      { en: 'Choose fields with people and creativity – psychology, medicine/nursing, arts, teaching, hospitality.', hi: 'लोगों और रचनात्मकता वाले क्षेत्र चुनें – मनोविज्ञान, चिकित्सा/नर्सिंग, कला, शिक्षण, आतिथ्य।' },
    ],
    avoid: { en: 'Harsh criticism hurts a 2 deeply; build confidence and the habit of taking decisions.', hi: 'कठोर आलोचना अंक 2 के बच्चे को गहराई से चोट पहुँचाती है; आत्मविश्वास और निर्णय लेने की आदत बनाएँ।' },
  },
  3: {
    theme: { en: 'Wise and expressive – Jupiter energy: a natural learner, teacher and guide.', hi: 'ज्ञानी और अभिव्यक्तिशील – गुरु (बृहस्पति) की ऊर्जा: स्वाभाविक रूप से सीखने, सिखाने और मार्गदर्शन करने वाला।' },
    talents: { en: 'Learning quickly, speaking and writing, explaining, guiding, optimism', hi: 'जल्दी सीखना, बोलना और लिखना, समझाना, मार्गदर्शन करना, आशावाद' },
    subjects: { en: 'Languages, literature, law, economics, philosophy, commerce', hi: 'भाषाएँ, साहित्य, विधि, अर्थशास्त्र, दर्शनशास्त्र, कॉमर्स' },
    fields: [
      { id: 'teaching', label: { en: 'Teaching, professorship & academics', hi: 'शिक्षण, प्रोफ़ेसर और अकादमिक क्षेत्र' } },
      { id: 'law', label: { en: 'Law & judiciary', hi: 'विधि (क़ानून) और न्यायपालिका' } },
      { id: 'finance', label: { en: 'Banking, finance & advisory', hi: 'बैंकिंग, वित्त और सलाहकार सेवाएँ' } },
      { id: 'writing', label: { en: 'Writing, journalism & publishing', hi: 'लेखन, पत्रकारिता और प्रकाशन' } },
      { id: 'consulting', label: { en: 'Consulting & training', hi: 'परामर्श (कंसल्टिंग) और प्रशिक्षण' } },
      { id: 'spiritual', label: { en: 'Spiritual, cultural & social work', hi: 'आध्यात्मिक, सांस्कृतिक और सामाजिक कार्य' } },
    ],
    nurture: [
      { en: 'Read stories together every day and answer the many questions patiently.', hi: 'रोज़ साथ में कहानियाँ पढ़ें और बच्चे के अनेक प्रश्नों का धैर्य से उत्तर दें।' },
      { en: 'Elocution, quiz, debate and writing competitions suit this child.', hi: 'भाषण, क्विज़, वाद-विवाद और लेखन प्रतियोगिताएँ इस बच्चे के लिए अच्छी हैं।' },
      { en: 'Guide towards knowledge careers – law, teaching, finance, writing, consulting.', hi: 'ज्ञान आधारित करियर की ओर मार्गदर्शन करें – विधि, शिक्षण, वित्त, लेखन, परामर्श।' },
    ],
    avoid: { en: 'A 3 can start many things; teach discipline and finishing one task at a time.', hi: 'अंक 3 का बच्चा कई काम शुरू कर सकता है; अनुशासन और एक समय में एक काम पूरा करना सिखाएँ।' },
  },
  4: {
    theme: { en: 'Inventive and modern – Rahu energy: thinks differently, loves technology and new ideas.', hi: 'आविष्कारी और आधुनिक – राहु की ऊर्जा: अलग सोचता है, तकनीक और नए विचारों से प्रेम।' },
    talents: { en: 'Logic, analysis, technology, innovation, hard work behind the scenes', hi: 'तर्क, विश्लेषण, तकनीक, नवाचार, पर्दे के पीछे कड़ी मेहनत' },
    subjects: { en: 'Mathematics, computer science, physics, electronics, statistics', hi: 'गणित, कंप्यूटर साइंस, भौतिकी, इलेक्ट्रॉनिक्स, सांख्यिकी' },
    fields: [
      { id: 'it', label: { en: 'Software, IT & computer engineering', hi: 'सॉफ़्टवेयर, IT और कंप्यूटर इंजीनियरिंग' } },
      { id: 'data', label: { en: 'Data science, AI & analytics', hi: 'डेटा साइंस, AI और एनालिटिक्स' } },
      { id: 'research', label: { en: 'Research & innovation', hi: 'शोध और नवाचार' } },
      { id: 'aviation', label: { en: 'Aviation & aerospace', hi: 'विमानन और एयरोस्पेस' } },
      { id: 'media', label: { en: 'Digital media, design tech & electronics', hi: 'डिजिटल मीडिया, डिज़ाइन तकनीक और इलेक्ट्रॉनिक्स' } },
      { id: 'foreign', label: { en: 'Foreign trade & international work', hi: 'विदेश व्यापार और अंतरराष्ट्रीय कार्य' } },
    ],
    nurture: [
      { en: 'Building blocks, puzzles and "how does it work?" games suit this child.', hi: 'ब्लॉक्स, पहेलियाँ और "यह कैसे काम करता है?" वाले खेल इस बच्चे के लिए अच्छे हैं।' },
      { en: 'Coding, robotics, science fairs and maths olympiads build natural strengths.', hi: 'कोडिंग, रोबोटिक्स, विज्ञान मेले और गणित ओलंपियाड प्राकृतिक क्षमता बढ़ाते हैं।' },
      { en: 'Guide towards technology, research, aviation or international careers.', hi: 'तकनीक, शोध, विमानन या अंतरराष्ट्रीय करियर की ओर मार्गदर्शन करें।' },
    ],
    avoid: { en: 'A 4 can be stubborn or unconventional; give clear reasons for rules and limit screen time.', hi: 'अंक 4 का बच्चा ज़िद्दी या लीक से हटकर हो सकता है; नियमों के कारण स्पष्ट बताएँ और स्क्रीन समय सीमित रखें।' },
  },
  5: {
    theme: { en: 'Quick and clever – Mercury energy: a communicator with a sharp, business-like mind.', hi: 'तेज़ और चतुर – बुध की ऊर्जा: अच्छा संवादक, तेज़ और व्यापारिक बुद्धि।' },
    talents: { en: 'Communication, numbers, quick thinking, adaptability, persuasion', hi: 'संवाद, अंक, तेज़ सोच, अनुकूलन क्षमता, समझाने-मनाने की कला' },
    subjects: { en: 'Mathematics, commerce, accountancy, languages, mass communication', hi: 'गणित, कॉमर्स, लेखाशास्त्र, भाषाएँ, जनसंचार' },
    fields: [
      { id: 'business', label: { en: 'Business, trading & sales', hi: 'व्यवसाय, व्यापार और सेल्स' } },
      { id: 'ca', label: { en: 'Chartered accountancy, finance & stock markets', hi: 'चार्टर्ड अकाउंटेंसी, वित्त और शेयर बाज़ार' } },
      { id: 'marketing', label: { en: 'Marketing, advertising & digital marketing', hi: 'मार्केटिंग, विज्ञापन और डिजिटल मार्केटिंग' } },
      { id: 'journalism', label: { en: 'Journalism, media & communication', hi: 'पत्रकारिता, मीडिया और संचार' } },
      { id: 'it', label: { en: 'IT & software', hi: 'IT और सॉफ़्टवेयर' } },
      { id: 'travel', label: { en: 'Travel, tourism & logistics', hi: 'यात्रा, पर्यटन और लॉजिस्टिक्स' } },
    ],
    nurture: [
      { en: 'Talk a lot with the child; word games, rhymes and counting games suit this mind.', hi: 'बच्चे से खूब बात करें; शब्दों के खेल, कविताएँ और गिनती के खेल इस बुद्धि को भाते हैं।' },
      { en: 'Abacus / mental maths, language learning and small selling projects build skills.', hi: 'अबेकस / मानसिक गणित, भाषाएँ सीखना और छोटे बेचने के प्रोजेक्ट कौशल बढ़ाते हैं।' },
      { en: 'Guide towards commerce, CA / finance, marketing, media or business.', hi: 'कॉमर्स, CA / वित्त, मार्केटिंग, मीडिया या व्यवसाय की ओर मार्गदर्शन करें।' },
    ],
    avoid: { en: 'A 5 gets bored quickly; build patience and steady study habits without killing curiosity.', hi: 'अंक 5 का बच्चा जल्दी ऊब जाता है; जिज्ञासा बनाए रखते हुए धैर्य और नियमित पढ़ाई की आदत बनाएँ।' },
  },
  6: {
    theme: { en: 'Creative and loving – Venus energy: an eye for beauty, comfort and harmony.', hi: 'रचनात्मक और स्नेही – शुक्र की ऊर्जा: सौंदर्य, सुख-सुविधा और सामंजस्य की समझ।' },
    talents: { en: 'Creativity, design sense, charm, responsibility, caring for family and others', hi: 'रचनात्मकता, डिज़ाइन की समझ, आकर्षण, ज़िम्मेदारी, परिवार और दूसरों की देखभाल' },
    subjects: { en: 'Fine arts, design, music, biology, home science, hospitality', hi: 'ललित कला, डिज़ाइन, संगीत, जीव विज्ञान, गृह विज्ञान, आतिथ्य' },
    fields: [
      { id: 'design', label: { en: 'Fashion, interior & graphic design', hi: 'फ़ैशन, इंटीरियर और ग्राफ़िक डिज़ाइन' } },
      { id: 'architecture', label: { en: 'Architecture', hi: 'आर्किटेक्चर (वास्तुकला)' } },
      { id: 'arts', label: { en: 'Music, film, entertainment & performing arts', hi: 'संगीत, फ़िल्म, मनोरंजन और प्रदर्शन कला' } },
      { id: 'hospitality', label: { en: 'Hospitality, events & luxury brands', hi: 'आतिथ्य, इवेंट्स और लग्ज़री ब्रांड' } },
      { id: 'medicine', label: { en: 'Medicine & healthcare (dentistry, gynaecology, dermatology)', hi: 'चिकित्सा और स्वास्थ्य (दंत, स्त्री रोग, त्वचा रोग)' } },
      { id: 'beauty', label: { en: 'Beauty, wellness & cosmetics', hi: 'सौंदर्य, वेलनेस और कॉस्मेटिक्स' } },
    ],
    nurture: [
      { en: 'Colours, music and a beautiful, orderly room help this child bloom.', hi: 'रंग, संगीत और सुंदर, व्यवस्थित कमरा इस बच्चे को खिलने में मदद करते हैं।' },
      { en: 'Art and craft, dance, music lessons and helping at home build creativity and responsibility.', hi: 'कला और शिल्प, नृत्य, संगीत की कक्षाएँ और घर के कामों में मदद रचनात्मकता और ज़िम्मेदारी बढ़ाते हैं।' },
      { en: 'Guide towards design, architecture, arts, hospitality or caring medical fields.', hi: 'डिज़ाइन, वास्तुकला, कला, आतिथ्य या देखभाल वाले चिकित्सा क्षेत्रों की ओर मार्गदर्शन करें।' },
    ],
    avoid: { en: 'A 6 can over-please others; teach saying "no" kindly and managing money from a young age.', hi: 'अंक 6 का बच्चा दूसरों को ख़ुश करने में ख़ुद को भूल सकता है; विनम्रता से "ना" कहना और छोटी उम्र से पैसे का प्रबंधन सिखाएँ।' },
  },
  7: {
    theme: { en: 'Deep thinker – Ketu energy: curious, intuitive and drawn to research and the hidden truth.', hi: 'गहरा विचारक – केतु की ऊर्जा: जिज्ञासु, अंतर्ज्ञानी और शोध व छिपे सत्य की ओर आकर्षित।' },
    talents: { en: 'Research, concentration, intuition, analysis, healing, independent study', hi: 'शोध, एकाग्रता, अंतर्ज्ञान, विश्लेषण, उपचार, स्वतंत्र अध्ययन' },
    subjects: { en: 'Science, mathematics, computer science, philosophy, psychology', hi: 'विज्ञान, गणित, कंप्यूटर साइंस, दर्शनशास्त्र, मनोविज्ञान' },
    fields: [
      { id: 'research', label: { en: 'Scientific research & academics', hi: 'वैज्ञानिक शोध और अकादमिक क्षेत्र' } },
      { id: 'it', label: { en: 'Programming & software', hi: 'प्रोग्रामिंग और सॉफ़्टवेयर' } },
      { id: 'medicine', label: { en: 'Medicine, healing & alternative therapies', hi: 'चिकित्सा, उपचार और वैकल्पिक चिकित्सा' } },
      { id: 'counselling', label: { en: 'Psychology & counselling', hi: 'मनोविज्ञान और काउंसलिंग' } },
      { id: 'investigation', label: { en: 'Investigation, analysis & forensics', hi: 'जाँच, विश्लेषण और फ़ॉरेंसिक' } },
      { id: 'spiritual', label: { en: 'Spiritual guidance, philosophy & astrology', hi: 'आध्यात्मिक मार्गदर्शन, दर्शन और ज्योतिष' } },
    ],
    nurture: [
      { en: 'Give quiet time, nature walks and books; this child learns best alone and at their own pace.', hi: 'शांत समय, प्रकृति में सैर और किताबें दें; यह बच्चा अकेले और अपनी गति से सबसे अच्छा सीखता है।' },
      { en: 'Science kits, chess, coding and meditation for children build focus.', hi: 'विज्ञान किट, शतरंज, कोडिंग और बच्चों का ध्यान (मेडिटेशन) एकाग्रता बढ़ाते हैं।' },
      { en: 'Guide towards research, medicine, technology, psychology or analytical careers.', hi: 'शोध, चिकित्सा, तकनीक, मनोविज्ञान या विश्लेषणात्मक करियर की ओर मार्गदर्शन करें।' },
    ],
    avoid: { en: 'A 7 may withdraw; gently encourage friendships and sharing feelings.', hi: 'अंक 7 का बच्चा अकेला रहना पसंद कर सकता है; सौम्यता से दोस्ती और भावनाएँ साझा करने को प्रोत्साहित करें।' },
  },
  8: {
    theme: { en: 'Steady and disciplined – Saturn energy: hard-working, responsible and built for long-term success.', hi: 'स्थिर और अनुशासित – शनि की ऊर्जा: मेहनती, ज़िम्मेदार और दीर्घकालिक सफलता के लिए बना।' },
    talents: { en: 'Discipline, patience, organisation, justice, managing money and resources', hi: 'अनुशासन, धैर्य, संगठन क्षमता, न्यायप्रियता, धन और संसाधनों का प्रबंधन' },
    subjects: { en: 'Mathematics, physics, economics, law, engineering drawing', hi: 'गणित, भौतिकी, अर्थशास्त्र, विधि, इंजीनियरिंग ड्रॉइंग' },
    fields: [
      { id: 'engineering', label: { en: 'Engineering (civil, mechanical, industrial)', hi: 'इंजीनियरिंग (सिविल, मैकेनिकल, औद्योगिक)' } },
      { id: 'law', label: { en: 'Law, judiciary & compliance', hi: 'विधि, न्यायपालिका और कंप्लायंस' } },
      { id: 'realestate', label: { en: 'Real estate & construction', hi: 'रियल एस्टेट और निर्माण' } },
      { id: 'industry', label: { en: 'Manufacturing, industry & mining / energy', hi: 'विनिर्माण, उद्योग और खनन / ऊर्जा' } },
      { id: 'finance', label: { en: 'Finance, banking & long-term investment', hi: 'वित्त, बैंकिंग और दीर्घकालिक निवेश' } },
      { id: 'admin', label: { en: 'Government service & administration', hi: 'सरकारी सेवा और प्रशासन' } },
    ],
    nurture: [
      { en: 'A fixed routine and small responsibilities (keeping toys in place) suit this child.', hi: 'निश्चित दिनचर्या और छोटी ज़िम्मेदारियाँ (खिलौने जगह पर रखना) इस बच्चे के लिए अच्छी हैं।' },
      { en: 'Building sets, saving in a piggy bank, chess and long projects build natural strengths.', hi: 'बिल्डिंग सेट, गुल्लक में बचत, शतरंज और लंबे प्रोजेक्ट प्राकृतिक क्षमता बढ़ाते हैं।' },
      { en: 'Guide towards engineering, law, finance, government service or industry – success grows with age.', hi: 'इंजीनियरिंग, विधि, वित्त, सरकारी सेवा या उद्योग की ओर मार्गदर्शन करें – सफलता उम्र के साथ बढ़ती है।' },
    ],
    avoid: { en: 'An 8 may take things too seriously; balance hard work with play and appreciation.', hi: 'अंक 8 का बच्चा बातों को बहुत गंभीरता से ले सकता है; मेहनत के साथ खेल और प्रशंसा का संतुलन रखें।' },
  },
  9: {
    theme: { en: 'Brave and energetic – Mars energy: courageous, active and protective of others.', hi: 'साहसी और ऊर्जावान – मंगल की ऊर्जा: बहादुर, सक्रिय और दूसरों की रक्षा करने वाला।' },
    talents: { en: 'Courage, physical energy, competitiveness, quick action, helping and protecting', hi: 'साहस, शारीरिक ऊर्जा, प्रतिस्पर्धा, तेज़ कार्रवाई, मदद और रक्षा करना' },
    subjects: { en: 'Physical education, biology, chemistry, engineering, geography', hi: 'शारीरिक शिक्षा, जीव विज्ञान, रसायन विज्ञान, इंजीनियरिंग, भूगोल' },
    fields: [
      { id: 'defence', label: { en: 'Defence forces & police', hi: 'रक्षा सेवाएँ और पुलिस' } },
      { id: 'sports', label: { en: 'Sports, fitness & coaching', hi: 'खेल, फ़िटनेस और कोचिंग' } },
      { id: 'surgery', label: { en: 'Surgery & emergency medicine', hi: 'सर्जरी और आपातकालीन चिकित्सा' } },
      { id: 'engineering', label: { en: 'Engineering (mechanical, civil, electrical)', hi: 'इंजीनियरिंग (मैकेनिकल, सिविल, इलेक्ट्रिकल)' } },
      { id: 'realestate', label: { en: 'Real estate & land development', hi: 'रियल एस्टेट और भूमि विकास' } },
      { id: 'social', label: { en: 'Social service, rescue & humanitarian work', hi: 'समाज सेवा, बचाव और मानवीय कार्य' } },
    ],
    nurture: [
      { en: 'Plenty of outdoor play and physical activity every day channel the energy well.', hi: 'रोज़ भरपूर बाहर खेलना और शारीरिक गतिविधि ऊर्जा को सही दिशा देती है।' },
      { en: 'Martial arts, swimming, athletics, NCC / scouts build discipline and courage.', hi: 'मार्शल आर्ट, तैराकी, एथलेटिक्स, NCC / स्काउट अनुशासन और साहस बढ़ाते हैं।' },
      { en: 'Guide towards defence, sports, surgery, engineering or service careers.', hi: 'रक्षा, खेल, सर्जरी, इंजीनियरिंग या सेवा करियर की ओर मार्गदर्शन करें।' },
    ],
    avoid: { en: 'A 9 can be short-tempered; teach patience, sharing and calm ways to handle anger.', hi: 'अंक 9 का बच्चा जल्दी ग़ुस्सा कर सकता है; धैर्य, बाँटना और ग़ुस्से को शांति से संभालना सिखाएँ।' },
  },
};

/** Lo Shu planes – a complete plane (all three numbers present) is a natural aptitude. */
const PLANES: { nums: [number, number, number]; label: L; aptitude: L }[] = [
  { nums: [4, 9, 2], label: { en: 'Thought plane (4-9-2)', hi: 'विचार तल (4-9-2)' }, aptitude: { en: 'strong thinking and planning – suits study-heavy, analytical professions', hi: 'मज़बूत सोच और योजना क्षमता – पढ़ाई और विश्लेषण वाले पेशों के लिए उपयुक्त' } },
  { nums: [3, 5, 7], label: { en: 'Will plane (3-5-7)', hi: 'इच्छाशक्ति तल (3-5-7)' }, aptitude: { en: 'determination – does well in competitive exams and demanding careers', hi: 'दृढ़ संकल्प – प्रतियोगी परीक्षाओं और चुनौतीपूर्ण करियर में अच्छा प्रदर्शन' } },
  { nums: [8, 1, 6], label: { en: 'Action plane (8-1-6)', hi: 'कर्म तल (8-1-6)' }, aptitude: { en: 'gets things done – suits business, management and practical work', hi: 'काम पूरा करने की क्षमता – व्यवसाय, प्रबंधन और व्यावहारिक कार्य के लिए उपयुक्त' } },
  { nums: [4, 3, 8], label: { en: 'Mental plane (4-3-8)', hi: 'मानसिक तल (4-3-8)' }, aptitude: { en: 'sharp memory and intellect – suits academics, law and technical fields', hi: 'तेज़ स्मृति और बुद्धि – अकादमिक, विधि और तकनीकी क्षेत्रों के लिए उपयुक्त' } },
  { nums: [9, 5, 1], label: { en: 'Emotional plane (9-5-1)', hi: 'भावनात्मक तल (9-5-1)' }, aptitude: { en: 'strong feelings and courage – suits leadership, public life and the arts', hi: 'प्रबल भावनाएँ और साहस – नेतृत्व, सार्वजनिक जीवन और कला के लिए उपयुक्त' } },
  { nums: [2, 7, 6], label: { en: 'Practical plane (2-7-6)', hi: 'व्यावहारिक तल (2-7-6)' }, aptitude: { en: 'practical skill with hands and materials – suits design, medicine, engineering and crafts', hi: 'हाथों और सामग्री से व्यावहारिक कौशल – डिज़ाइन, चिकित्सा, इंजीनियरिंग और शिल्प के लिए उपयुक्त' } },
];

/** What each missing number means for study and future work, and how to build it. */
const MISSING_SKILL: Record<number, L> = {
  1: { en: 'self-expression and confidence – encourage speaking up and leading small tasks', hi: 'आत्म-अभिव्यक्ति और आत्मविश्वास – बोलने और छोटे काम का नेतृत्व करने को प्रोत्साहित करें' },
  2: { en: 'patience and sensitivity – team games and music help', hi: 'धैर्य और संवेदनशीलता – टीम खेल और संगीत सहायक हैं' },
  3: { en: 'imagination and expression – reading, drawing and storytelling help', hi: 'कल्पनाशीलता और अभिव्यक्ति – पढ़ना, चित्र बनाना और कहानी सुनाना सहायक है' },
  4: { en: 'order and method – a fixed study table and routine help', hi: 'व्यवस्था और तरीक़ा – निश्चित पढ़ाई की मेज़ और दिनचर्या सहायक है' },
  5: { en: 'balance and communication – conversations, outdoor play and new experiences help', hi: 'संतुलन और संवाद – बातचीत, बाहर खेलना और नए अनुभव सहायक हैं' },
  6: { en: 'responsibility and care – small home duties and creative hobbies help', hi: 'ज़िम्मेदारी और देखभाल – घर के छोटे काम और रचनात्मक शौक सहायक हैं' },
  7: { en: 'reflection and learning from mistakes – quiet reading time and puzzles help', hi: 'चिंतन और ग़लतियों से सीखना – शांत पढ़ाई का समय और पहेलियाँ सहायक हैं' },
  8: { en: 'organisation and money sense – saving, planning and keeping things in order help', hi: 'संगठन और धन की समझ – बचत, योजना और चीज़ें व्यवस्थित रखना सहायक है' },
  9: { en: 'drive and courage – sports and finishing challenges help', hi: 'उत्साह और साहस – खेल और चुनौतियाँ पूरी करना सहायक है' },
};

export interface BabyCareer {
  primary: number; secondary: number; nameNumber: number | null;
  theme: L; secondaryTheme: L | null; talents: L; subjects: L;
  fields: (CareerField & { score: number; numbers: number[] })[];
  aptitudes: L[]; build: { n: number; text: L }[];
  nurture: { age: L; text: L }[]; avoid: L; balance: L | null;
}

const AGES: [L, L, L] = [
  { en: 'Age 0–5', hi: 'आयु 0–5' }, { en: 'Age 6–12', hi: 'आयु 6–12' }, { en: 'Age 13–18 (stream & career choice)', hi: 'आयु 13–18 (विषय और करियर चयन)' },
];

/** Best career path from Bhagyank (×3), Moolank (×2) and the recommended name number (×1), plus the Lo Shu grid. */
export function babyCareer(i: { moolank: number; bhagyank: number; nameNumber?: number | null; gridNumbers: number[]; missing: number[] }): BabyCareer {
  const b = i.bhagyank, m = i.moolank, n = i.nameNumber && i.nameNumber >= 1 && i.nameNumber <= 9 ? i.nameNumber : null;
  const score = new Map<string, { field: CareerField; score: number; numbers: Set<number> }>();
  const add = (num: number, weight: number, role: L) => NUMBER_CAREER[num].fields.forEach((f, k) => {
    const cur = score.get(f.id) ?? { field: { id: f.id, label: f.label, why: { en: '', hi: '' } }, score: 0, numbers: new Set<number>() };
    cur.score += weight * (6 - k * 0.5); // the first fields of each number fit it best
    cur.numbers.add(num);
    if (!cur.field.why.en) cur.field = { ...cur.field, why: role };
    score.set(f.id, cur);
  });
  add(b, 3, { en: `Bhagyank ${b} – your child's life direction`, hi: `भाग्यांक ${b} – बच्चे की जीवन दिशा` });
  add(m, 2, { en: `Moolank ${m} – natural talent`, hi: `मूलांक ${m} – प्राकृतिक प्रतिभा` });
  if (n) add(n, 1, { en: `Name number ${n}`, hi: `नामांक ${n}` });
  const fields = [...score.values()].map((x) => {
    const nums = [...x.numbers];
    const multi = nums.length > 1;
    const why: L = multi
      ? { en: `Supported by ${nums.map((v) => (v === b ? `Bhagyank ${v}` : v === m ? `Moolank ${v}` : `name number ${v}`)).filter((v, k, a) => a.indexOf(v) === k).join(' + ')} – a strong match`, hi: `${nums.map((v) => (v === b ? `भाग्यांक ${v}` : v === m ? `मूलांक ${v}` : `नामांक ${v}`)).filter((v, k, a) => a.indexOf(v) === k).join(' + ')} दोनों का समर्थन – मज़बूत मेल` }
      : x.field.why;
    return { ...x.field, why, score: Math.round(x.score * (multi ? 1.25 : 1)), numbers: nums };
  }).sort((x, y) => y.score - x.score);
  // Keep the picture balanced: the best fields of the Moolank (2) and of the name number (1) always appear.
  const must = new Set<string>([...(m !== b ? NUMBER_CAREER[m].fields.slice(0, 2).map((f) => f.id) : []), ...(n && n !== b && n !== m ? [NUMBER_CAREER[n].fields[0].id] : [])]);
  const chosen = [...fields.filter((f) => must.has(f.id)), ...fields.filter((f) => !must.has(f.id))].slice(0, 7).sort((x, y) => y.score - x.score);
  fields.length = 0; fields.push(...chosen);
  const max = fields[0]?.score || 1;
  fields.forEach((f) => { f.score = Math.max(40, Math.min(98, Math.round((f.score / max) * 95))); });

  const present = new Set(i.gridNumbers);
  const aptitudes = PLANES.filter((p) => p.nums.every((x) => present.has(x))).map((p) => ({ en: `${p.label.en}: ${p.aptitude.en}`, hi: `${p.label.hi}: ${p.aptitude.hi}` }));
  const rel = relationOf(b, m);
  const balance: L | null = m === b ? null : rel === 'enemy'
    ? { en: `Moolank ${m} and Bhagyank ${b} pull in different directions, so the child may change interests often in the teenage years. Choose a field that uses both – for example the top matches above – and give time before the final stream choice.`, hi: `मूलांक ${m} और भाग्यांक ${b} अलग-अलग दिशाओं में खींचते हैं, इसलिए किशोरावस्था में रुचियाँ बदल सकती हैं। ऐसा क्षेत्र चुनें जिसमें दोनों का उपयोग हो – जैसे ऊपर के शीर्ष मेल – और अंतिम विषय चयन से पहले समय दें।` }
    : { en: `Moolank ${m} and Bhagyank ${b} work well together – natural talent and life direction support each other.`, hi: `मूलांक ${m} और भाग्यांक ${b} साथ में अच्छा काम करते हैं – प्राकृतिक प्रतिभा और जीवन दिशा एक-दूसरे का साथ देते हैं।` };
  const C = NUMBER_CAREER[b];
  return {
    primary: b, secondary: m, nameNumber: n, theme: C.theme, secondaryTheme: m !== b ? NUMBER_CAREER[m].theme : null,
    talents: m === b ? C.talents : { en: `${C.talents.en}; ${NUMBER_CAREER[m].talents.en}`, hi: `${C.talents.hi}; ${NUMBER_CAREER[m].talents.hi}` },
    subjects: m === b ? C.subjects : { en: `${C.subjects.en}; also ${NUMBER_CAREER[m].subjects.en}`, hi: `${C.subjects.hi}; साथ ही ${NUMBER_CAREER[m].subjects.hi}` },
    fields, aptitudes, build: i.missing.slice(0, 4).map((x) => ({ n: x, text: MISSING_SKILL[x] })),
    nurture: [0, 1, 2].map((k) => ({ age: AGES[k], text: k === 2 || m === b ? C.nurture[k] : { en: `${C.nurture[k].en} ${NUMBER_CAREER[m].nurture[k].en}`, hi: `${C.nurture[k].hi} ${NUMBER_CAREER[m].nurture[k].hi}` } })),
    avoid: C.avoid, balance,
  };
}
