/**
 * Remedies for the child's development – simple, safe, traditional practices for parents, chosen from the baby's numbers.
 * GROWTH (by Moolank): health & sleep, learning & memory, emotions & confidence.
 * MISSING (by number absent from the Lo Shu grid): the area it touches, an activity, and a home / nursery placement.
 * PLANET (by Moolank and Bhagyank planet): the planet's day, a charity (daan) and a practice for the parents.
 * Nothing here replaces a paediatrician; the report says so on the same page.
 */
import type { Lang } from './text';

type Bi = Record<Lang, string>;
const b = (en: string, hi: string): Bi => ({ en, hi });

export interface GrowthTips { health: Bi; learning: Bi; emotion: Bi }
export const GROWTH: Record<number, GrowthTips> = {
  1: {
    health: b('Morning sunlight (as your doctor allows) and a fixed wake-up time build strong energy. Keep meals on time – this child gets cranky when hungry.', 'सुबह की हल्की धूप (डॉक्टर की सलाह अनुसार) और तय समय पर उठना ऊर्जा बढ़ाता है। भोजन समय पर दें – भूख लगने पर यह बच्चा चिड़चिड़ा हो जाता है।'),
    learning: b('Learns best by doing things alone first. Give small tasks and let the child finish them; praise effort, not only results.', 'पहले ख़ुद करके सबसे अच्छा सीखता है। छोटे काम दें और पूरा करने दें; केवल परिणाम नहीं, मेहनत की भी तारीफ़ करें।'),
    emotion: b('Offer two choices instead of an order. Avoid comparing with other children – it hurts this child’s pride.', 'आदेश की जगह दो विकल्प दें। दूसरे बच्चों से तुलना न करें – इससे इस बच्चे के स्वाभिमान को ठेस लगती है।'),
  },
  2: {
    health: b('Needs good sleep and a calm room. Keep water intake good and avoid very cold food at night.', 'अच्छी नींद और शांत कमरा ज़रूरी है। पानी पर्याप्त दें और रात में बहुत ठंडी चीज़ें न दें।'),
    learning: b('Learns through stories, songs and pictures. A gentle teacher matters more than a strict one.', 'कहानियों, गीतों और चित्रों से सीखता है। कठोर से अधिक कोमल शिक्षक इसके लिए ज़रूरी है।'),
    emotion: b('Very sensitive to the mood at home. Hug often, keep a routine and never shout near the child.', 'घर के माहौल को बहुत महसूस करता है। अक्सर गले लगाएँ, दिनचर्या रखें और बच्चे के पास कभी ऊँची आवाज़ में न बोलें।'),
  },
  3: {
    health: b('Generally steady health; watch weight and sweets. Outdoor play every day keeps the body active.', 'सामान्यतः अच्छा स्वास्थ्य; वज़न और मिठाई पर ध्यान दें। रोज़ बाहर खेलना शरीर को सक्रिय रखता है।'),
    learning: b('A natural learner. Read aloud daily, keep books within reach and answer every “why” patiently.', 'स्वाभाविक रूप से सीखने वाला। रोज़ ज़ोर से पढ़कर सुनाएँ, किताबें पास रखें और हर “क्यों” का धैर्य से उत्तर दें।'),
    emotion: b('Values respect and fairness. Explain rules, keep promises and let the child help elders.', 'सम्मान और न्याय को महत्व देता है। नियम समझाएँ, वादे निभाएँ और बड़ों की मदद करने दें।'),
  },
  4: {
    health: b('Keep a fixed routine for food and sleep; sudden changes upset this child. Watch for stomach and cough in season changes.', 'भोजन और नींद की तय दिनचर्या रखें; अचानक बदलाव इस बच्चे को परेशान करते हैं। मौसम बदलने पर पेट और खाँसी का ध्यान रखें।'),
    learning: b('Learns with hands – blocks, puzzles, building toys. Always explain the reason behind a rule.', 'हाथों से सीखता है – ब्लॉक, पहेलियाँ, बनाने वाले खिलौने। हर नियम का कारण अवश्य समझाएँ।'),
    emotion: b('Can be stubborn. Stay calm and consistent; give warning before changing an activity.', 'ज़िद्दी हो सकता है। शांत और एक जैसा व्यवहार रखें; गतिविधि बदलने से पहले बता दें।'),
  },
  5: {
    health: b('Restless energy – needs plenty of movement and good sleep. Keep screens away, especially before bed.', 'बेचैन ऊर्जा – ख़ूब खेल-कूद और अच्छी नींद चाहिए। स्क्रीन दूर रखें, ख़ासकर सोने से पहले।'),
    learning: b('Quick but easily bored. Short, varied lessons, number games and talking work best.', 'तेज़ पर जल्दी ऊबने वाला। छोटे, अलग-अलग पाठ, अंकों के खेल और बातचीत सबसे अच्छे हैं।'),
    emotion: b('Loves freedom and new things. Give safe space to explore and talk with the child a lot.', 'आज़ादी और नई चीज़ें पसंद हैं। सुरक्षित रूप से खोजने दें और बच्चे से ख़ूब बातें करें।'),
  },
  6: {
    health: b('Likes comfort and sweets – keep a balanced diet. Clean, pleasant surroundings keep this child healthy.', 'आराम और मिठाई पसंद है – संतुलित आहार रखें। साफ़, सुंदर माहौल इस बच्चे को स्वस्थ रखता है।'),
    learning: b('Learns through music, colours and art. A pretty study corner makes study time happy.', 'संगीत, रंगों और कला से सीखता है। सुंदर पढ़ने का कोना पढ़ाई को आनंददायक बनाता है।'),
    emotion: b('Deeply attached to family. Show love openly and avoid fights in front of the child.', 'परिवार से गहरा लगाव। प्यार खुलकर दिखाएँ और बच्चे के सामने झगड़े से बचें।'),
  },
  7: {
    health: b('Sensitive digestion and sleep. Light food, fresh air and time in nature help a lot.', 'पाचन और नींद संवेदनशील। हल्का भोजन, ताज़ी हवा और प्रकृति में समय बहुत लाभ देता है।'),
    learning: b('Thinks deeply and asks big questions. Give quiet time, puzzles and nature walks; do not rush answers.', 'गहराई से सोचता है और बड़े प्रश्न पूछता है। शांत समय, पहेलियाँ और प्रकृति की सैर दें; उत्तर के लिए जल्दबाज़ी न करें।'),
    emotion: b('Keeps feelings inside. Ask gently how the day was, every day, and listen fully.', 'भावनाएँ भीतर रखता है। रोज़ प्यार से पूछें कि दिन कैसा रहा, और पूरा सुनें।'),
  },
  8: {
    health: b('Needs warmth and regular routine; watch bones, teeth and joints with good calcium as your doctor advises.', 'गर्माहट और नियमित दिनचर्या चाहिए; डॉक्टर की सलाह से कैल्शियम लेकर हड्डियों, दाँतों का ध्यान रखें।'),
    learning: b('Slow and steady learner who remembers for life. Do not compare speed; reward patience and finishing.', 'धीरे पर पक्का सीखने वाला, जो जीवन भर याद रखता है। गति की तुलना न करें; धैर्य और काम पूरा करने पर इनाम दें।'),
    emotion: b('Can look serious. Make time for play, laughter and friends; be fair and keep your word.', 'गंभीर दिख सकता है। खेल, हँसी और दोस्तों के लिए समय दें; न्याय करें और वचन निभाएँ।'),
  },
  9: {
    health: b('High energy and quick temper; prone to minor cuts and fever. Daily sport and enough water keep the balance.', 'बहुत ऊर्जा और जल्दी ग़ुस्सा; छोटी चोट और बुख़ार की संभावना। रोज़ खेल और पर्याप्त पानी संतुलन रखते हैं।'),
    learning: b('Learns with action and challenges. Sports, competitions and goals keep the child focused.', 'क्रिया और चुनौती से सीखता है। खेल, प्रतियोगिता और लक्ष्य बच्चे को एकाग्र रखते हैं।'),
    emotion: b('Brave and protective but impatient. Teach counting to ten when angry; praise kindness.', 'बहादुर और रक्षक पर अधीर। ग़ुस्से में दस तक गिनना सिखाएँ; दयालुता की तारीफ़ करें।'),
  },
};

export interface MissingTip { area: Bi; activity: Bi; home: Bi }
export const MISSING_DEV: Record<number, MissingTip> = {
  1: { area: b('Speech, self-expression and confidence', 'वाणी, अभिव्यक्ति और आत्मविश्वास'), activity: b('Talk and sing to the baby daily; later, let the child speak at family gatherings.', 'रोज़ शिशु से बातें करें और गाएँ; बड़े होने पर परिवार में बोलने का अवसर दें।'), home: b('North: a picture of flowing water or a blue item.', 'उत्तर: बहते पानी का चित्र या नीली वस्तु।') },
  2: { area: b('Emotional bonding, patience and sensitivity', 'भावनात्मक जुड़ाव, धैर्य और संवेदनशीलता'), activity: b('Skin-to-skin time, lullabies and a fixed bedtime routine.', 'माँ-शिशु का स्पर्श, लोरी और सोने का तय समय।'), home: b('South-west: a pair of soft round cushions or a family photo.', 'दक्षिण-पश्चिम: दो मुलायम गोल तकिए या परिवार की फ़ोटो।') },
  3: { area: b('Memory, imagination and learning', 'स्मरण-शक्ति, कल्पना और पढ़ाई'), activity: b('Picture books from the early months; later, rhymes and a small daily reading habit.', 'शुरुआती महीनों से चित्र-पुस्तकें; बाद में कविताएँ और रोज़ थोड़ा पढ़ने की आदत।'), home: b('East: a healthy green plant (out of the child’s reach).', 'पूर्व: हरा-भरा पौधा (बच्चे की पहुँच से दूर)।') },
  4: { area: b('Discipline, routine and practical skills', 'अनुशासन, दिनचर्या और व्यावहारिक कौशल'), activity: b('Same times for food, bath and sleep; later, simple chores like putting toys back.', 'भोजन, स्नान और नींद का एक ही समय; बाद में खिलौने वापस रखने जैसे छोटे काम।'), home: b('South-east: wooden toys or a green item.', 'दक्षिण-पूर्व: लकड़ी के खिलौने या हरी वस्तु।') },
  5: { area: b('Balance, adaptability and health', 'संतुलन, ढलने की क्षमता और स्वास्थ्य'), activity: b('Regular outdoor time and meeting family and other children.', 'नियमित बाहर घूमना और परिवार व दूसरे बच्चों से मिलना।'), home: b('Centre of the home: keep it open and clutter-free; a yellow touch helps.', 'घर का मध्य भाग: खुला और साफ़ रखें; हल्का पीला रंग लाभ देता है।') },
  6: { area: b('Creativity, family love and responsibility', 'रचनात्मकता, पारिवारिक प्रेम और ज़िम्मेदारी'), activity: b('Music, colours and drawing; let the child help at home with small caring tasks.', 'संगीत, रंग और चित्रकारी; घर में छोटे देखभाल वाले कामों में मदद करने दें।'), home: b('North-west: something white or a metal bowl (no small parts).', 'उत्तर-पश्चिम: सफ़ेद वस्तु या धातु का कटोरा (छोटे हिस्से न हों)।') },
  7: { area: b('Focus, intuition and inner calm', 'एकाग्रता, अंतर्ज्ञान और भीतरी शांति'), activity: b('Quiet time each day, nature walks and, later, a few minutes of sitting still or prayer.', 'रोज़ थोड़ा शांत समय, प्रकृति में सैर और बाद में कुछ मिनट शांत बैठना या प्रार्थना।'), home: b('West: white or silver décor, kept simple.', 'पश्चिम: सफ़ेद या चाँदी रंग की साधारण सजावट।') },
  8: { area: b('Organisation, patience and a sense of money', 'व्यवस्था, धैर्य और धन की समझ'), activity: b('Teach saving with a piggy bank and finishing what is started.', 'गुल्लक से बचत और शुरू किया काम पूरा करना सिखाएँ।'), home: b('North-east: keep it clean and bright; a yellow or earthy item.', 'उत्तर-पूर्व: साफ़ और उजला रखें; पीली या मिट्टी रंग की वस्तु।') },
  9: { area: b('Energy, courage and drive', 'ऊर्जा, साहस और लगन'), activity: b('Active play every day and, later, a sport; encourage helping others.', 'रोज़ सक्रिय खेल और बाद में कोई खेल; दूसरों की मदद को प्रोत्साहित करें।'), home: b('South: warm light or a red touch (a safe lamp, not a flame).', 'दक्षिण: गर्म रोशनी या लाल रंग (सुरक्षित लैंप, खुली लौ नहीं)।') },
};

export interface PlanetRemedy { daan: Bi; practice: Bi }
/** By number (planet): charity on the planet’s day and a practice for parents. */
export const PLANET_REMEDY: Record<number, PlanetRemedy> = {
  1: { daan: b('Wheat or jaggery on Sundays', 'रविवार को गेहूँ या गुड़ का दान'), practice: b('Parents offer water to the rising Sun and speak the child’s name with a blessing.', 'माता-पिता उगते सूर्य को जल अर्पित करें और शिशु का नाम लेकर आशीर्वाद माँगें।') },
  2: { daan: b('Milk, rice or white sweets on Mondays', 'सोमवार को दूध, चावल या सफ़ेद मिठाई का दान'), practice: b('Mother keeps a calm mind; a soft lullaby or “Om Namah Shivaya” at bedtime.', 'माँ मन शांत रखें; सोते समय धीमी लोरी या “ॐ नमः शिवाय”।') },
  3: { daan: b('Yellow dal, bananas or books to children on Thursdays', 'गुरुवार को पीली दाल, केले या बच्चों को किताबें'), practice: b('Touch elders’ feet with the child; light a lamp near the study place later on.', 'बच्चे के साथ बड़ों का आशीर्वाद लें; बाद में पढ़ाई के स्थान के पास दीपक जलाएँ।') },
  4: { daan: b('Help sweepers or give a blanket on Saturdays', 'शनिवार को सफ़ाई कर्मचारियों की मदद या कंबल दान'), practice: b('Keep the home tidy and avoid clutter under the child’s bed.', 'घर व्यवस्थित रखें और बच्चे के पलंग के नीचे सामान न रखें।') },
  5: { daan: b('Green moong or green fodder for a cow on Wednesdays', 'बुधवार को हरी मूँग या गाय को हरा चारा'), practice: b('Talk to the child a lot; Ganesh Vandana on Wednesdays.', 'बच्चे से ख़ूब बात करें; बुधवार को गणेश वंदना।') },
  6: { daan: b('White sweets or support a girl’s education on Fridays', 'शुक्रवार को सफ़ेद मिठाई या किसी बालिका की पढ़ाई में सहयोग'), practice: b('Keep the child’s room clean and fragrant; play gentle music.', 'बच्चे का कमरा साफ़ और सुगंधित रखें; मधुर संगीत बजाएँ।') },
  7: { daan: b('Feed stray dogs or give a blanket', 'आवारा कुत्तों को भोजन या कंबल दान'), practice: b('A few minutes of prayer or silence together each evening.', 'हर शाम कुछ मिनट साथ बैठकर प्रार्थना या मौन।') },
  8: { daan: b('Mustard oil, black sesame or help elderly people on Saturdays', 'शनिवार को सरसों का तेल, काले तिल या बुज़ुर्गों की सेवा'), practice: b('Respect for workers and elders at home; keep promises made to the child.', 'घर में कर्मचारियों और बड़ों का सम्मान; बच्चे से किए वादे निभाएँ।') },
  9: { daan: b('Red lentils (masoor) or sweets on Tuesdays', 'मंगलवार को मसूर दाल या मिठाई का दान'), practice: b('Hanuman Chalisa on Tuesdays by the parents; daily active play for the child.', 'मंगलवार को माता-पिता हनुमान चालीसा पढ़ें; बच्चे के लिए रोज़ सक्रिय खेल।') },
};

export const SAFETY: Bi[] = [
  b('No gemstones, rudraksha, threads or chains on a baby or toddler – they can choke or strangle. Use colours, sounds and routines instead; ask me about a gemstone only when the child is older.', 'शिशु या छोटे बच्चे को रत्न, रुद्राक्ष, धागा या चेन न पहनाएँ – गले में अटकने या फँसने का ख़तरा है। इसकी जगह रंग, ध्वनि और दिनचर्या अपनाएँ; रत्न के बारे में बच्चे के बड़े होने पर ही पूछें।'),
  b('Keep crystals, bowls, plants and lamps out of the child’s reach.', 'क्रिस्टल, कटोरे, पौधे और लैंप बच्चे की पहुँच से दूर रखें।'),
  b('These remedies support the child; they do not replace medical care. For any concern about health, growth, speech or behaviour, see your paediatrician.', 'ये उपाय बच्चे को सहारा देते हैं; चिकित्सा का विकल्प नहीं हैं। स्वास्थ्य, विकास, बोलने या व्यवहार की किसी भी चिंता के लिए अपने शिशु-रोग विशेषज्ञ से मिलें।'),
];
