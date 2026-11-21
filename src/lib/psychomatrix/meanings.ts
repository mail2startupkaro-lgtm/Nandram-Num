/**
 * Meanings for the Pythagoras Square (Psychomatrix) – traditional Aleksandrov-school readings in plain English and Hindi.
 * Cells: text for count 0, 1, 2, 3 and 4+ (index 4 is used for four or more).
 */
import type { CellDigit, Level, LineId } from './engine';

type L = { en: string; hi: string };
const l = (en: string, hi: string): L => ({ en, hi });

export const CELLS: Record<CellDigit, { name: L; about: L; levels: [L, L, L, L, L]; tip: L }> = {
  1: { name: l('Character & willpower', 'चरित्र और इच्छाशक्ति'), about: l('How strong your will is and how you assert yourself.', 'आपकी इच्छाशक्ति कितनी मज़बूत है और आप स्वयं को कैसे व्यक्त करते हैं।'),
    levels: [
      l('Your character is still forming; you rely on others for direction and need encouragement to take a stand.', 'आपका चरित्र अभी बन रहा है; दिशा के लिए आप दूसरों पर निर्भर रहते हैं और अपनी बात पर टिकने के लिए प्रोत्साहन चाहिए।'),
      l('Self-focused will: you like to be heard and praised and can be touchy. Learning to listen makes you much stronger.', 'स्व-केंद्रित इच्छाशक्ति: आप सुने जाना और प्रशंसा पाना पसंद करते हैं और जल्दी बुरा मान सकते हैं। सुनना सीखने से आप और मज़बूत बनते हैं।'),
      l('A soft, friendly character. You like to be liked, avoid conflict and may give in too easily.', 'कोमल, मित्रवत चरित्र। आप पसंद किए जाना चाहते हैं, टकराव से बचते हैं और जल्दी झुक सकते हैं।'),
      l('Balanced character – the "golden mean". Calm, flexible and able to stand firm when it matters.', 'संतुलित चरित्र – "स्वर्णिम मध्य"। शांत, लचीले और ज़रूरत पड़ने पर दृढ़ रहने वाले।'),
      l('Very strong will – a natural leader. Watch that firmness does not turn into stubbornness or control.', 'बहुत मज़बूत इच्छाशक्ति – स्वाभाविक नेता। ध्यान रखें कि दृढ़ता ज़िद या नियंत्रण में न बदले।'),
    ], tip: l('Set small goals and finish them – every finished task strengthens the will.', 'छोटे लक्ष्य तय करें और पूरे करें – हर पूरा काम इच्छाशक्ति को मज़बूत करता है।') },
  2: { name: l('Energy', 'ऊर्जा'), about: l('Your life energy, stamina and sensitivity to people and surroundings.', 'आपकी जीवन-ऊर्जा, सहनशक्ति और लोगों व वातावरण के प्रति संवेदनशीलता।'),
    levels: [
      l('Low reserve of energy: you tire easily and recharge from rest, nature and calm people. Protect your energy.', 'ऊर्जा का कम भंडार: आप जल्दी थकते हैं और आराम, प्रकृति व शांत लोगों से ऊर्जा पाते हैं। अपनी ऊर्जा की रक्षा करें।'),
      l('Enough energy for daily life, but sensitive to weather and stress. Regular rest keeps you steady.', 'दैनिक जीवन के लिए पर्याप्त ऊर्जा, पर मौसम और तनाव के प्रति संवेदनशील। नियमित आराम आपको स्थिर रखता है।'),
      l('Good, healthy energy. You can share it with others and recover quickly.', 'अच्छी, स्वस्थ ऊर्जा। आप इसे दूसरों से बाँट सकते हैं और जल्दी उबर जाते हैं।'),
      l('High energy and a strong sixth sense; you may feel other people\'s moods. Good for healing and caring work.', 'उच्च ऊर्जा और मज़बूत छठी इंद्रिय; आप दूसरों के मूड महसूस कर सकते हैं। उपचार और देखभाल के काम के लिए अच्छा।'),
      l('Very high energy that needs an outlet – sport, creativity or service. Unused, it turns into restlessness.', 'बहुत उच्च ऊर्जा जिसे निकास चाहिए – खेल, रचनात्मकता या सेवा। उपयोग न हो तो बेचैनी में बदलती है।'),
    ], tip: l('Sleep on time, move every day and limit time with people who drain you.', 'समय पर सोएँ, रोज़ शरीर चलाएँ और ऊर्जा खींचने वाले लोगों के साथ समय सीमित रखें।') },
  3: { name: l('Interest, order & science', 'रुचि, व्यवस्था और विज्ञान'), about: l('Love of order and precise knowledge; interest in technical and exact subjects.', 'व्यवस्था और सटीक ज्ञान का प्रेम; तकनीकी और सटीक विषयों में रुचि।'),
    levels: [
      l('Order depends on mood; you lean towards humanities, people and creativity rather than exact sciences.', 'व्यवस्था मूड पर निर्भर; आपका झुकाव सटीक विज्ञान के बजाय मानविकी, लोगों और रचनात्मकता की ओर है।'),
      l('Interest in technical subjects comes and goes; you keep order when it matters to you.', 'तकनीकी विषयों में रुचि आती-जाती है; जब ज़रूरी लगे तब आप व्यवस्था रखते हैं।'),
      l('Good ability for exact sciences, planning and tidy work.', 'सटीक विज्ञान, योजना और व्यवस्थित काम की अच्छी क्षमता।'),
      l('Strong analytical mind – science, engineering, research, accounts. You like everything in its place.', 'मज़बूत विश्लेषणात्मक मन – विज्ञान, इंजीनियरिंग, शोध, लेखा। आपको हर चीज़ अपनी जगह पसंद है।'),
      l('Exceptional precision; can become pedantic. Use it for science and quality work, and relax with people.', 'असाधारण सटीकता; कभी-कभी अति-नियमबद्धता। इसे विज्ञान और गुणवत्ता के काम में लगाएँ, और लोगों के साथ सहज रहें।'),
    ], tip: l('Keep one area of life (desk, accounts, schedule) in good order every day.', 'जीवन का एक क्षेत्र (मेज़, हिसाब, समय-सारणी) रोज़ व्यवस्थित रखें।') },
  4: { name: l('Health', 'स्वास्थ्य'), about: l('Physical strength and natural health given at birth.', 'जन्म से मिली शारीरिक शक्ति और स्वाभाविक स्वास्थ्य।'),
    levels: [
      l('Health needs conscious care: regular exercise, food and check-ups make a big difference for you.', 'स्वास्थ्य पर सचेत ध्यान ज़रूरी: नियमित व्यायाम, भोजन और जाँच आपके लिए बड़ा फ़र्क़ लाते हैं।'),
      l('Average health; keep fit to stay strong as you grow older.', 'औसत स्वास्थ्य; उम्र बढ़ने के साथ मज़बूत रहने के लिए फ़िट रहें।'),
      l('Good health and stamina; you recover well.', 'अच्छा स्वास्थ्य और सहनशक्ति; आप अच्छी तरह उबरते हैं।'),
      l('Very good health and physical strength – an asset for active work and sport.', 'बहुत अच्छा स्वास्थ्य और शारीरिक शक्ति – सक्रिय काम और खेल के लिए लाभ।'),
      l('Exceptional strength; do not take it for granted – overload can still harm you.', 'असाधारण शक्ति; इसे हल्के में न लें – अत्यधिक भार फिर भी नुकसान कर सकता है।'),
    ], tip: l('A daily walk or exercise and regular sleep are your best medicine.', 'रोज़ सैर या व्यायाम और नियमित नींद आपकी सबसे अच्छी दवा है।') },
  5: { name: l('Logic & intuition', 'तर्क और अंतर्ज्ञान'), about: l('The ability to foresee, plan and sense the right way.', 'आगे देखने, योजना बनाने और सही रास्ता भाँपने की क्षमता।'),
    levels: [
      l('You often act first and think later and learn from experience. Pause before big decisions.', 'आप अक्सर पहले करते हैं और बाद में सोचते हैं, और अनुभव से सीखते हैं। बड़े निर्णयों से पहले रुकें।'),
      l('Logic and intuition are working – you make fewer mistakes and can plan ahead.', 'तर्क और अंतर्ज्ञान काम कर रहे हैं – आप कम ग़लतियाँ करते हैं और आगे की योजना बना सकते हैं।'),
      l('Highly developed intuition and analysis – a natural investigator, strategist or advisor.', 'बहुत विकसित अंतर्ज्ञान और विश्लेषण – स्वाभाविक अन्वेषक, रणनीतिकार या सलाहकार।'),
      l('Very strong foresight; you often "just know". Trust it, and check facts too.', 'बहुत मज़बूत पूर्वाभास; आप अक्सर "बस जान जाते हैं"। इस पर भरोसा करें, और तथ्य भी जाँचें।'),
      l('Exceptional intuition – almost clairvoyant. Use it to guide others wisely.', 'असाधारण अंतर्ज्ञान – लगभग दिव्य-दृष्टि जैसा। इसका उपयोग दूसरों का समझदारी से मार्गदर्शन करने में करें।'),
    ], tip: l('Before a decision, write the possible outcomes – it trains logic and intuition together.', 'निर्णय से पहले संभावित परिणाम लिखें – इससे तर्क और अंतर्ज्ञान दोनों का अभ्यास होता है।') },
  6: { name: l('Work & practical skill', 'श्रम और व्यावहारिक कौशल'), about: l('Love of practical, hands-on work and being grounded.', 'व्यावहारिक, हाथ से किए जाने वाले काम का प्रेम और ज़मीनी होना।'),
    levels: [
      l('You prefer mental or creative work to physical labour; practical skills come through effort.', 'आप शारीरिक श्रम के बजाय मानसिक या रचनात्मक काम पसंद करते हैं; व्यावहारिक कौशल मेहनत से आते हैं।'),
      l('You can do practical work well when you need to, though it is not your first choice.', 'ज़रूरत पड़ने पर आप व्यावहारिक काम अच्छे से कर सकते हैं, हालाँकि यह आपकी पहली पसंद नहीं।'),
      l('Good hands and a love of practical work – crafts, cooking, building, fixing.', 'अच्छे हाथ और व्यावहारिक काम का प्रेम – शिल्प, खाना बनाना, निर्माण, मरम्मत।'),
      l('A hard, reliable worker who gets things done; take care not to overwork.', 'मेहनती, भरोसेमंद व्यक्ति जो काम पूरा करता है; ज़्यादा काम से बचें।'),
      l('Exceptional working capacity; balance it with rest and let others help.', 'असाधारण कार्य-क्षमता; इसे आराम से संतुलित करें और दूसरों को भी मदद करने दें।'),
    ], tip: l('Do something with your hands every week – it grounds the mind.', 'हर सप्ताह हाथों से कुछ करें – यह मन को स्थिर करता है।') },
  7: { name: l('Talent & luck', 'प्रतिभा और भाग्य'), about: l('Natural gifts and the luck that helps you in life.', 'स्वाभाविक प्रतिभा और जीवन में साथ देने वाला भाग्य।'),
    levels: [
      l('Success comes through your own steady work; talents open up as you practise.', 'सफलता आपकी स्थिर मेहनत से आती है; अभ्यास के साथ प्रतिभा खुलती है।'),
      l('A talent that grows with effort, and some help from luck.', 'मेहनत से बढ़ने वाली प्रतिभा, और भाग्य का कुछ साथ।'),
      l('Clearly talented and lucky – often artistic or creative. Develop the gift early.', 'स्पष्ट रूप से प्रतिभाशाली और भाग्यशाली – अक्सर कलात्मक या रचनात्मक। प्रतिभा को जल्दी विकसित करें।'),
      l('A special gift; life may test you before it opens fully. Do not give up.', 'विशेष प्रतिभा; पूरी तरह खुलने से पहले जीवन परीक्षा ले सकता है। हार न मानें।'),
      l('A rare, powerful gift that brings responsibility – use it to serve others.', 'दुर्लभ, शक्तिशाली प्रतिभा जो ज़िम्मेदारी लाती है – इसका उपयोग दूसरों की सेवा में करें।'),
    ], tip: l('Give your talent a regular time slot – luck meets practice.', 'अपनी प्रतिभा को नियमित समय दें – भाग्य अभ्यास से मिलता है।') },
  8: { name: l('Duty & responsibility', 'कर्तव्य और ज़िम्मेदारी'), about: l('Sense of duty, reliability and care for others.', 'कर्तव्य-बोध, विश्वसनीयता और दूसरों की परवाह।'),
    levels: [
      l('Taking on responsibility does not come easily; you value freedom. Keep promises small and keep them.', 'ज़िम्मेदारी लेना आसान नहीं लगता; आप स्वतंत्रता को महत्व देते हैं। छोटे वादे करें और निभाएँ।'),
      l('A developed sense of duty and fairness; people can rely on you.', 'विकसित कर्तव्य-बोध और निष्पक्षता; लोग आप पर भरोसा कर सकते हैं।'),
      l('Strong duty and a wish to help others – good for teaching, medicine and service.', 'मज़बूत कर्तव्य-बोध और दूसरों की मदद की इच्छा – शिक्षा, चिकित्सा और सेवा के लिए अच्छा।'),
      l('A calling to serve people; you carry others\' needs – remember your own too.', 'लोगों की सेवा का बुलावा; आप दूसरों की ज़रूरतें उठाते हैं – अपनी भी याद रखें।'),
      l('Very strong responsibility; avoid taking on everyone\'s burdens alone.', 'बहुत मज़बूत ज़िम्मेदारी; सबका बोझ अकेले उठाने से बचें।'),
    ], tip: l('Keep a simple list of promises and tick them off.', 'वादों की सरल सूची रखें और पूरा होने पर निशान लगाएँ।') },
  9: { name: l('Memory & intellect', 'स्मृति और बुद्धि'), about: l('Memory, learning ability and intelligence.', 'स्मृति, सीखने की क्षमता और बुद्धि।'),
    levels: [
      l('Memory and mental focus need training; learning works best through practice and repetition.', 'स्मृति और एकाग्रता को अभ्यास चाहिए; सीखना अभ्यास और दोहराव से सबसे अच्छा होता है।'),
      l('A practical mind; memory improves with regular study and reading.', 'व्यावहारिक मन; नियमित अध्ययन और पढ़ने से स्मृति बेहतर होती है।'),
      l('Good intelligence and memory – you learn quickly.', 'अच्छी बुद्धि और स्मृति – आप जल्दी सीखते हैं।'),
      l('A sharp, wise mind – excellent for study, analysis and advice.', 'तेज़, समझदार मन – अध्ययन, विश्लेषण और सलाह के लिए उत्तम।'),
      l('Exceptional intellect; speak the truth gently, as sharp words can hurt.', 'असाधारण बुद्धि; सच कोमलता से कहें, क्योंकि तीखे शब्द चोट पहुँचा सकते हैं।'),
    ], tip: l('Read or learn something for 20 minutes a day.', 'रोज़ 20 मिनट कुछ पढ़ें या सीखें।') },
};

export const LINE_INFO: Record<LineId, { name: L; about: L; levels: Record<Level, L> }> = {
  purpose: { name: l('Purpose (1-4-7)', 'उद्देश्य (1-4-7)'), about: l('Drive towards goals.', 'लक्ष्यों की ओर बढ़ने की शक्ति।'), levels: {
    weak: l('Goals change often; set one clear target and track it.', 'लक्ष्य अक्सर बदलते हैं; एक स्पष्ट लक्ष्य तय करके उस पर नज़र रखें।'), normal: l('You set goals and reach most of them.', 'आप लक्ष्य तय करते हैं और अधिकांश पा लेते हैं।'),
    strong: l('Purposeful and persistent – you finish what you start.', 'उद्देश्यपूर्ण और लगनशील – जो शुरू करते हैं उसे पूरा करते हैं।'), veryStrong: l('Very strong drive; make sure the goals are worth it.', 'बहुत तीव्र प्रेरणा; सुनिश्चित करें कि लक्ष्य सार्थक हों।') } },
  family: { name: l('Family (2-5-8)', 'परिवार (2-5-8)'), about: l('Desire for and readiness to build a family.', 'परिवार बनाने की इच्छा और तत्परता।'), levels: {
    weak: l('Family life needs conscious effort and good communication.', 'पारिवारिक जीवन के लिए सचेत प्रयास और अच्छा संवाद ज़रूरी।'), normal: l('A natural wish for family and togetherness.', 'परिवार और साथ की स्वाभाविक इच्छा।'),
    strong: l('Family is central; you are a devoted family person.', 'परिवार केंद्र में है; आप समर्पित पारिवारिक व्यक्ति हैं।'), veryStrong: l('Deep family devotion; let others carry their share too.', 'गहरा पारिवारिक समर्पण; दूसरों को भी अपना हिस्सा उठाने दें।') } },
  stability: { name: l('Habits & stability (3-6-9)', 'आदतें और स्थिरता (3-6-9)'), about: l('Love of routine, tradition and stability.', 'दिनचर्या, परंपरा और स्थिरता का प्रेम।'), levels: {
    weak: l('You like change and variety; build a few steady routines.', 'आपको बदलाव और विविधता पसंद है; कुछ स्थिर दिनचर्याएँ बनाएँ।'), normal: l('A healthy balance between routine and change.', 'दिनचर्या और बदलाव के बीच स्वस्थ संतुलन।'),
    strong: l('Stable, reliable and attached to habits and home.', 'स्थिर, भरोसेमंद और आदतों व घर से जुड़े।'), veryStrong: l('Very attached to the familiar; stay open to new ways.', 'परिचित चीज़ों से बहुत जुड़ाव; नए तरीकों के लिए खुले रहें।') } },
  selfEsteem: { name: l('Self-esteem (1-2-3)', 'आत्म-सम्मान (1-2-3)'), about: l('How you value yourself.', 'आप स्वयं को कितना महत्व देते हैं।'), levels: {
    weak: l('You may doubt yourself; note your wins every day.', 'आप स्वयं पर शक कर सकते हैं; रोज़ अपनी सफलताएँ लिखें।'), normal: l('Healthy, balanced self-esteem.', 'स्वस्थ, संतुलित आत्म-सम्मान।'),
    strong: l('Confident and self-assured.', 'आत्मविश्वासी और स्वयं पर भरोसा रखने वाले।'), veryStrong: l('Very high self-esteem; balance it with humility.', 'बहुत ऊँचा आत्म-सम्मान; इसे विनम्रता से संतुलित करें।') } },
  money: { name: l('Money & home (4-5-6)', 'धन और घर (4-5-6)'), about: l('Ability to earn and provide material comfort.', 'कमाने और भौतिक सुख देने की क्षमता।'), levels: {
    weak: l('Money comes through effort and planning; budgeting helps a lot.', 'धन मेहनत और योजना से आता है; बजट बनाना बहुत मदद करता है।'), normal: l('You earn steadily and manage the home well.', 'आप स्थिर रूप से कमाते हैं और घर अच्छे से चलाते हैं।'),
    strong: l('A good earner and provider.', 'अच्छे कमाने वाले और पालन करने वाले।'), veryStrong: l('Strong material focus; keep time for people and rest.', 'मज़बूत भौतिक ध्यान; लोगों और आराम के लिए भी समय रखें।') } },
  talent: { name: l('Talent (7-8-9)', 'प्रतिभा (7-8-9)'), about: l('Natural gifts and the ability to use them.', 'स्वाभाविक प्रतिभा और उसका उपयोग करने की क्षमता।'), levels: {
    weak: l('Talents open with persistent practice.', 'लगातार अभ्यास से प्रतिभा खुलती है।'), normal: l('Clear talents that grow with use.', 'स्पष्ट प्रतिभाएँ जो उपयोग से बढ़ती हैं।'),
    strong: l('Gifted – your talents can become your career.', 'प्रतिभाशाली – आपकी प्रतिभा आपका करियर बन सकती है।'), veryStrong: l('Highly gifted; share your gift with others.', 'अत्यंत प्रतिभाशाली; अपनी प्रतिभा दूसरों से बाँटें।') } },
  spirituality: { name: l('Spirituality (1-5-9)', 'आध्यात्मिकता (1-5-9)'), about: l('Interest in meaning, inner growth and higher values.', 'अर्थ, भीतरी विकास और उच्च मूल्यों में रुचि।'), levels: {
    weak: l('Practical outlook; spiritual interest may grow later in life.', 'व्यावहारिक दृष्टिकोण; आध्यात्मिक रुचि जीवन में बाद में बढ़ सकती है।'), normal: l('Balanced interest in inner growth.', 'भीतरी विकास में संतुलित रुचि।'),
    strong: l('Strong spiritual search and moral sense.', 'मज़बूत आध्यात्मिक खोज और नैतिक बोध।'), veryStrong: l('Deeply spiritual; stay grounded in daily life.', 'गहराई से आध्यात्मिक; दैनिक जीवन में ज़मीनी रहें।') } },
  temperament: { name: l('Temperament (3-5-7)', 'स्वभाव और उत्साह (3-5-7)'), about: l('Passion, warmth and emotional intensity.', 'जुनून, गर्मजोशी और भावनात्मक तीव्रता।'), levels: {
    weak: l('Calm and reserved; warmth shows through care rather than passion.', 'शांत और संयमी; गर्मजोशी जुनून के बजाय देखभाल में दिखती है।'), normal: l('Warm and balanced temperament.', 'गर्मजोशी भरा, संतुलित स्वभाव।'),
    strong: l('Passionate and expressive.', 'जोशीले और अभिव्यक्तिपूर्ण।'), veryStrong: l('Very intense temperament; channel it into creativity and sport.', 'बहुत तीव्र स्वभाव; इसे रचनात्मकता और खेल में लगाएँ।') } },
};

export const LEVEL_NAME: Record<'empty' | Level, L> = {
  empty: l('Empty', 'खाली'), weak: l('Weak', 'कमज़ोर'), normal: l('Normal', 'सामान्य'), strong: l('Strong', 'मज़बूत'), veryStrong: l('Very strong', 'बहुत मज़बूत'),
};

/** Strength names for a single cell (one digit = the quality is present at a basic level, not "weak"). */
export const CELL_LEVEL_NAME: Record<'empty' | Level, L> = {
  empty: l('Empty', 'खाली'), weak: l('Basic', 'आधारभूत'), normal: l('Normal', 'सामान्य'), strong: l('Strong', 'मज़बूत'), veryStrong: l('Very strong', 'बहुत मज़बूत'),
};
