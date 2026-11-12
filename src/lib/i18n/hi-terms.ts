/**
 * Hindi (Devanagari) for the data values the engine returns in English: planets, weekdays, colours, gemstones,
 * directions, elements, remedies, Lo Shu lines, verdicts … The engine stays English; the display layer calls tr().
 * Missing terms fall back to English (the Hindi-mode page scan in tests flags them).
 */
import type { Lang } from './dictionary';

export const HI_TERMS: Record<string, string> = {
  // planets
  Sun: 'सूर्य', Moon: 'चंद्र', Jupiter: 'बृहस्पति', Rahu: 'राहु', Mercury: 'बुध', Venus: 'शुक्र', Ketu: 'केतु', Saturn: 'शनि', Mars: 'मंगल',
  Surya: 'सूर्य', Chandra: 'चंद्र', 'Guru (Brihaspati)': 'गुरु (बृहस्पति)', Budh: 'बुध', Shukra: 'शुक्र', Shani: 'शनि', Mangal: 'मंगल', Guru: 'गुरु',
  // weekdays
  Sunday: 'रविवार', Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार', Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार',
  Ravivar: 'रविवार', Somvar: 'सोमवार', Mangalvar: 'मंगलवार', Budhvar: 'बुधवार', Guruvar: 'गुरुवार', Shukravar: 'शुक्रवार', Shanivar: 'शनिवार',
  // months
  January: 'जनवरी', February: 'फ़रवरी', March: 'मार्च', April: 'अप्रैल', May: 'मई', June: 'जून', July: 'जुलाई', August: 'अगस्त', September: 'सितंबर', October: 'अक्टूबर', November: 'नवंबर', December: 'दिसंबर',
  Jan: 'जन', Feb: 'फ़र', Mar: 'मार्च', Apr: 'अप्रै', Jun: 'जून', Jul: 'जुला', Aug: 'अग', Sep: 'सितं', Oct: 'अक्टू', Nov: 'नवं', Dec: 'दिसं',
  // colours
  Golden: 'सुनहरा', Orange: 'नारंगी', Saffron: 'केसरिया', Yellow: 'पीला', White: 'सफ़ेद', Cream: 'क्रीम', Silver: 'चाँदी', 'Light green': 'हल्का हरा', Green: 'हरा',
  'Light orange': 'हल्का नारंगी', Grey: 'स्लेटी', 'Electric blue': 'चमकीला नीला', 'Smoky shades': 'धुएँ जैसे रंग', Turquoise: 'फ़िरोज़ी', Pink: 'गुलाबी', 'Light blue': 'हल्का नीला',
  Pastels: 'हल्के (पेस्टल) रंग', 'Smoky grey': 'धुएँ जैसा स्लेटी', 'Light yellow': 'हल्का पीला', Multicolour: 'बहुरंगी', 'Navy blue': 'नेवी नीला', 'Dark blue': 'गहरा नीला',
  Black: 'काला', Violet: 'बैंगनी', Red: 'लाल', Maroon: 'मैरून', Coral: 'मूँगिया', Brown: 'भूरा', Blue: 'नीला',
  'Blue / Black': 'नीला / काला', 'White / Cream': 'सफ़ेद / क्रीम', 'Yellow / Earth tones': 'पीला / मिट्टी जैसे रंग', 'White / Silver': 'सफ़ेद / चाँदी', 'White / Grey': 'सफ़ेद / स्लेटी', 'Yellow / Brown': 'पीला / भूरा',
  // elements
  Fire: 'अग्नि', Water: 'जल', Earth: 'पृथ्वी', Air: 'वायु', Ether: 'आकाश', Wood: 'काष्ठ (लकड़ी)', Metal: 'धातु',
  // directions
  North: 'उत्तर', South: 'दक्षिण', East: 'पूर्व', West: 'पश्चिम', 'North-East': 'उत्तर-पूर्व (ईशान)', 'North-West': 'उत्तर-पश्चिम (वायव्य)', 'South-East': 'दक्षिण-पूर्व (आग्नेय)', 'South-West': 'दक्षिण-पश्चिम (नैऋत्य)', Centre: 'मध्य (ब्रह्मस्थान)',
  // Kua groups / direction kinds
  'East group': 'पूर्व समूह', 'West group': 'पश्चिम समूह', success: 'सफलता', health: 'स्वास्थ्य', relationships: 'संबंध', personalGrowth: 'व्यक्तिगत विकास',
  mishaps: 'दुर्घटना / बाधा', fiveGhosts: 'पंच भूत (विवाद)', sixKillings: 'षट् घात (हानि)', totalLoss: 'पूर्ण हानि',
  // gemstones & metals
  Ruby: 'माणिक्य (रूबी)', Pearl: 'मोती', 'Yellow Sapphire': 'पुखराज', Hessonite: 'गोमेद', Emerald: 'पन्ना', Diamond: 'हीरा', "Cat's Eye": 'लहसुनिया', "Cat’s Eye": 'लहसुनिया', 'Blue Sapphire': 'नीलम', 'Red Coral': 'मूँगा',
  'Om Hraam Hreem Hraum Sah Suryaya Namah': 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः',
  'Om Shraam Shreem Shraum Sah Chandramase Namah': 'ॐ श्रां श्रीं श्रौं सः चन्द्रमसे नमः',
  'Om Graam Greem Graum Sah Gurave Namah': 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',
  'Om Bhraam Bhreem Bhraum Sah Rahave Namah': 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः',
  'Om Braam Breem Braum Sah Budhaya Namah': 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',
  'Om Draam Dreem Draum Sah Shukraya Namah': 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः',
  'Om Sraam Sreem Sraum Sah Ketave Namah': 'ॐ स्रां स्रीं स्रौं सः केतवे नमः',
  'Om Praam Preem Praum Sah Shanaischaraya Namah': 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
  'Om Kraam Kreem Kraum Sah Bhaumaya Namah': 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
  Manik: 'माणिक्य', Moti: 'मोती', Pukhraj: 'पुखराज', Gomed: 'गोमेद', Panna: 'पन्ना', Heera: 'हीरा', Lehsunia: 'लहसुनिया', Neelam: 'नीलम', Moonga: 'मूँगा',
  'Red Garnet': 'लाल गार्नेट', Sunstone: 'सनस्टोन', Moonstone: 'मूनस्टोन (चंद्रकांत)', 'Yellow Topaz': 'सुनहला', Citrine: 'सुनहला (सिट्रीन)', 'Orange Zircon': 'नारंगी ज़िरकॉन', Peridot: 'पेरिडॉट',
  'Green Tourmaline': 'हरा टूमलाइन', 'White Zircon': 'सफ़ेद ज़िरकॉन', Opal: 'ओपल', Amethyst: 'कटैला (एमेथिस्ट)', 'Lapis Lazuli': 'लाजवर्द', Carnelian: 'कार्नेलियन', 'Tiger’s Eye': 'टाइगर आई', "Tiger's Eye": 'टाइगर आई',
  'Gold / Copper': 'सोना / ताँबा', Silver_: 'चाँदी', Gold: 'सोना', 'Silver / Ashtadhatu': 'चाँदी / अष्टधातु', 'Gold / Silver': 'सोना / चाँदी', 'Silver / Platinum': 'चाँदी / प्लैटिनम', 'Silver / Panchdhatu': 'चाँदी / पंचधातु', 'Copper / Gold': 'ताँबा / सोना', Panchdhatu: 'पंचधातु',
  'Ring finger': 'अनामिका', 'Little finger': 'कनिष्ठा', 'Index finger': 'तर्जनी', 'Middle finger': 'मध्यमा', 'Middle or ring finger': 'मध्यमा या अनामिका', 'Middle or little finger': 'मध्यमा या कनिष्ठा',
  Moolank: 'मूलांक', Bhagyank: 'भाग्यांक', conflict: 'टकराव', malefic: 'अशुभ', supportive: 'सहायक',
  'An Aadhaar number cannot be changed; use this vibration only to choose supportive remedies.': 'आधार नंबर बदला नहीं जा सकता; इसके कंपन का उपयोग केवल सहायक उपाय चुनने के लिए करें।',
  'Consult a qualified astrologer/numerologist before wearing any gemstone.': 'कोई भी रत्न पहनने से पहले योग्य ज्योतिषी/अंकशास्त्री से सलाह अवश्य लें।',
  'Powerful stone – wear only after a trial period and a full chart check by a qualified expert.': 'शक्तिशाली रत्न – परीक्षण अवधि और योग्य विशेषज्ञ द्वारा पूरी कुंडली जाँच के बाद ही पहनें।',
  // crystals / Lo Shu remedies
  Aquamarine: 'एक्वामरीन', 'Rose quartz / Moonstone': 'रोज़ क्वार्ट्ज़ / मूनस्टोन', 'Green aventurine': 'ग्रीन एवेंचुरीन', 'Green jade': 'ग्रीन जेड', 'Clear quartz': 'स्फटिक', 'Tiger’s eye': 'टाइगर आई', 'Red jasper / Carnelian': 'रेड जैस्पर / कार्नेलियन',
  'Small water fountain or metal tortoise in the North': 'उत्तर दिशा में छोटा पानी का फव्वारा या धातु का कछुआ',
  'Pair of rose quartz or a couple photograph in the South-West': 'दक्षिण-पश्चिम में रोज़ क्वार्ट्ज़ का जोड़ा या दंपती की तस्वीर',
  'Healthy green plants in the East': 'पूर्व दिशा में स्वस्थ हरे पौधे',
  'Money plant or bamboo in the South-East': 'दक्षिण-पूर्व में मनी प्लांट या बाँस का पौधा',
  'Keep the centre of the home clutter-free; place a crystal bowl there': 'घर का मध्य भाग साफ़ और खाली रखें; वहाँ क्रिस्टल का कटोरा रखें',
  'Metal wind chime (6 rods) in the North-West': 'उत्तर-पश्चिम में धातु की विंड चाइम (6 छड़ों वाली)',
  'Metal bowl or brass items in the West': 'पश्चिम में धातु का कटोरा या पीतल की वस्तुएँ',
  'Crystal ball or earthen pot in the North-East': 'उत्तर-पूर्व में क्रिस्टल बॉल या मिट्टी का घड़ा',
  'Red lamp or candle in the South': 'दक्षिण दिशा में लाल दीपक या मोमबत्ती',
  'Black tourmaline bracelet': 'ब्लैक टूमलाइन ब्रेसलेट', 'Moonstone bracelet': 'मूनस्टोन ब्रेसलेट', 'Green aventurine bracelet': 'ग्रीन एवेंचुरीन ब्रेसलेट', 'Green jade bracelet': 'ग्रीन जेड ब्रेसलेट',
  'Citrine bracelet': 'सिट्रीन ब्रेसलेट', 'Clear quartz bracelet': 'स्फटिक ब्रेसलेट', 'Amethyst bracelet': 'एमेथिस्ट ब्रेसलेट', 'Tiger’s eye bracelet': 'टाइगर आई ब्रेसलेट', 'Red jasper bracelet': 'रेड जैस्पर ब्रेसलेट',
  'Speak up for yourself once a day; write your goals each morning.': 'दिन में एक बार अपनी बात खुलकर रखें; हर सुबह अपने लक्ष्य लिखें।',
  'Drink water from a silver glass; spend 10 calm minutes without screens.': 'चाँदी के गिलास में पानी पिएँ; रोज़ 10 मिनट बिना मोबाइल/स्क्रीन के शांत बैठें।',
  'Read or learn something new for 15 minutes daily.': 'रोज़ 15 मिनट कुछ नया पढ़ें या सीखें।',
  'Plan the next day in writing every night.': 'हर रात अगले दिन की योजना लिखकर बनाएँ।',
  'Walk for 20 minutes; keep your wallet and desk organised.': '20 मिनट टहलें; अपना पर्स और मेज़ व्यवस्थित रखें।',
  'Help a family member each day; keep a fragrance at home.': 'रोज़ परिवार के किसी सदस्य की मदद करें; घर में सुगंध रखें।',
  'Meditate for 10 minutes; spend time in nature weekly.': '10 मिनट ध्यान करें; हर सप्ताह प्रकृति के बीच समय बिताएँ।',
  'Track money daily; serve elders or labourers when you can.': 'रोज़ पैसों का हिसाब रखें; जब हो सके बुज़ुर्गों या मज़दूरों की सेवा करें।',
  'Exercise in the morning; channel anger into physical activity.': 'सुबह व्यायाम करें; क्रोध को शारीरिक गतिविधि में लगाएँ।',
  // deities, daan, careers, signature tips
  'Surya Dev (offer Arghya at sunrise)': 'सूर्य देव (सूर्योदय पर अर्घ्य दें)', 'Lord Shiva': 'भगवान शिव', 'Lord Vishnu / Brihaspati Dev': 'भगवान विष्णु / बृहस्पति देव', 'Maa Durga / Bhairav': 'माँ दुर्गा / भैरव',
  'Lord Ganesha': 'भगवान गणेश', 'Maa Lakshmi': 'माँ लक्ष्मी', 'Shani Dev / Lord Hanuman': 'शनि देव / हनुमान जी', 'Lord Hanuman': 'हनुमान जी',
  Wheat: 'गेहूँ', 'Jaggery (gud)': 'गुड़', 'Copper vessel': 'ताँबे का पात्र', 'Red cloth': 'लाल वस्त्र', Rice: 'चावल', Milk: 'दूध', 'White cloth': 'सफ़ेद वस्त्र', Sugar: 'चीनी',
  'Chana dal': 'चना दाल', 'Turmeric (haldi)': 'हल्दी', Bananas: 'केले', 'Yellow cloth': 'पीला वस्त्र', 'Books to students': 'विद्यार्थियों को पुस्तकें',
  'Black sesame (til)': 'काले तिल', Blanket: 'कंबल', Blankets: 'कंबल', Coconut: 'नारियल', 'Mustard oil': 'सरसों का तेल', 'Green moong dal': 'हरी मूँग दाल', 'Green vegetables': 'हरी सब्ज़ियाँ',
  'Green cloth': 'हरा वस्त्र', 'Fodder for cows': 'गायों के लिए चारा', Curd: 'दही', 'White sweets': 'सफ़ेद मिठाई', Perfume: 'इत्र', Sesame: 'तिल', 'Food for stray dogs': 'बेसहारा कुत्तों को भोजन',
  'Black urad dal': 'काली उड़द दाल', 'Iron items': 'लोहे की वस्तुएँ', 'Footwear to the needy': 'ज़रूरतमंदों को जूते-चप्पल', 'Red masoor dal': 'लाल मसूर दाल', Jaggery: 'गुड़', 'Blood donation': 'रक्तदान',
  'Government service': 'सरकारी सेवा', Administration: 'प्रशासन', 'Leadership roles': 'नेतृत्व की भूमिकाएँ', Politics: 'राजनीति', Medicine: 'चिकित्सा',
  Hospitality: 'आतिथ्य (होटल)', 'Nursing & care': 'नर्सिंग और देखभाल', 'Dairy / liquids business': 'डेयरी / तरल पदार्थों का व्यापार', 'Creative arts': 'रचनात्मक कलाएँ', Counselling: 'परामर्श',
  Teaching: 'अध्यापन', Law: 'कानून', 'Financial advisory': 'वित्तीय सलाह', Consulting: 'कंसल्टिंग', 'Religious / spiritual work': 'धार्मिक / आध्यात्मिक कार्य',
  'Technology & IT': 'टेक्नोलॉजी और आईटी', Research: 'शोध', 'Foreign trade': 'विदेश व्यापार', Aviation: 'विमानन', 'Media & digital': 'मीडिया और डिजिटल',
  'Business & trading': 'व्यापार और ट्रेडिंग', Accounting: 'लेखा (अकाउंटिंग)', Communication: 'संचार', 'Marketing & sales': 'मार्केटिंग और बिक्री', IT: 'आईटी',
  'Fashion & beauty': 'फ़ैशन और सौंदर्य', 'Arts & design': 'कला और डिज़ाइन', 'Luxury retail': 'लग्ज़री रिटेल', Entertainment: 'मनोरंजन',
  'Spiritual guidance': 'आध्यात्मिक मार्गदर्शन', Healing: 'हीलिंग / उपचार', Programming: 'प्रोग्रामिंग', Investigation: 'जाँच-पड़ताल',
  Engineering: 'इंजीनियरिंग', 'Real estate': 'रियल एस्टेट', 'Mining & oil': 'खनन और तेल', 'Law & judiciary': 'कानून और न्यायपालिका', Manufacturing: 'विनिर्माण',
  'Defence & police': 'रक्षा और पुलिस', Sports: 'खेल', Surgery: 'सर्जरी',
  'Start with a bold, clear first letter; keep the signature rising upward.': 'पहला अक्षर बड़ा और स्पष्ट लिखें; हस्ताक्षर ऊपर की ओर उठता हुआ रखें।',
  'Use smooth, flowing strokes; avoid sharp cuts through your name.': 'मुलायम, बहती रेखाएँ बनाएँ; अपने नाम पर तीखी काट न लगाएँ।',
  'Keep letters well-formed and readable; a single underline is supportive.': 'अक्षर सुडौल और पढ़ने योग्य रखें; एक रेखा का अंडरलाइन शुभ है।',
  'Avoid ending the signature with a downward stroke or a dot.': 'हस्ताक्षर के अंत में नीचे जाती रेखा या बिंदु न लगाएँ।',
  'A fast, connected signature suits you; keep it legible.': 'तेज़ और जुड़ा हुआ हस्ताक्षर आपके लिए उपयुक्त है; पर पढ़ने योग्य रखें।',
  'An artistic, slightly rounded signature with a rising end is favourable.': 'कलात्मक, थोड़ा गोलाई वाला और ऊपर उठते अंत वाला हस्ताक्षर शुभ है।',
  'Keep your signature simple and do not cross through it.': 'हस्ताक्षर सरल रखें और उसे काटें नहीं।',
  'Write the signature with an upward slope and never underline it twice.': 'हस्ताक्षर ऊपर की ओर ढलान में लिखें और कभी दो बार अंडरलाइन न करें।',
  'A firm, energetic signature with a clear rising end suits you.': 'दृढ़, ऊर्जावान और स्पष्ट रूप से ऊपर उठते अंत वाला हस्ताक्षर आपके लिए शुभ है।',
  'Sign with a slight upward slope from left to right.': 'बाएँ से दाएँ हल्की ऊपर की ढलान में हस्ताक्षर करें।',
  'Do not cut through or strike your own name.': 'अपने नाम को काटें या उस पर रेखा न खींचें।',
  'Avoid ending with a dot or a downward stroke.': 'अंत में बिंदु या नीचे जाती रेखा न लगाएँ।',
  'Gemstones and remedies are traditional guidance. Consult a qualified expert before wearing any gemstone.': 'रत्न और उपाय पारंपरिक मार्गदर्शन हैं। कोई भी रत्न पहनने से पहले योग्य विशेषज्ञ से सलाह लें।',
  // Lo Shu lines, arrows, yogs
  'Mental Plane': 'मानसिक तल', 'Emotional Plane': 'भावनात्मक तल', 'Practical Plane': 'व्यावहारिक तल', 'Thought Plane': 'विचार तल', 'Will Plane': 'इच्छाशक्ति तल', 'Action Plane': 'कर्म तल',
  'Success Line (4-5-6)': 'सफलता रेखा (4-5-6)', 'Property Line (2-5-8)': 'संपत्ति रेखा (2-5-8)',
  'Arrow of Intellect': 'बुद्धि का तीर', 'Arrow of Poor Memory': 'कमज़ोर स्मरणशक्ति का तीर', 'Arrow of Emotional Balance': 'भावनात्मक संतुलन का तीर', 'Arrow of Hypersensitivity': 'अति-संवेदनशीलता का तीर',
  'Arrow of Practicality': 'व्यावहारिकता का तीर', 'Arrow of Disorder': 'अव्यवस्था का तीर', 'Arrow of Planning': 'योजना का तीर', 'Arrow of Confusion': 'भ्रम का तीर',
  'Arrow of Determination': 'दृढ़ संकल्प का तीर', 'Arrow of Frustration': 'निराशा का तीर', 'Arrow of Activity': 'सक्रियता का तीर', 'Arrow of Hesitation': 'झिझक का तीर',
  'Arrow of Prosperity': 'समृद्धि का तीर', 'Arrow of Scepticism': 'संशय का तीर', 'Arrow of Compassion': 'करुणा का तीर', 'Arrow of Indecision': 'अनिर्णय का तीर', 'Arrow of Spirituality': 'आध्यात्मिकता का तीर', 'Arrow of Willpower': 'इच्छाशक्ति का तीर',
  'Silver Yog': 'रजत योग', 'Golden Yog': 'स्वर्ण योग', 'Raj Yog': 'राज योग',
  complete: 'पूर्ण', partial: 'आंशिक', empty: 'खाली',
  // verdicts / categories / relations
  'Highly Lucky': 'अत्यंत शुभ', Supportive: 'सहायक', Neutral: 'सामान्य', 'Needs Change': 'बदलाव आवश्यक',
  favourable: 'शुभ', mixed: 'मिश्रित', unfavourable: 'अशुभ', friend: 'मित्र', neutral: 'सम', enemy: 'शत्रु',
  Friendly: 'मित्र', Challenging: 'चुनौतीपूर्ण',
  'Highly aligned': 'अत्यंत अनुकूल', 'Neutral – a learning number': 'सम – सीखने वाला अंक', 'Challenging – read as a lesson': 'चुनौतीपूर्ण – इसे सबक की तरह लें',
  Formative: 'निर्माण काल', Productive: 'उत्पादक काल', Harvest: 'फल प्राप्ति काल',
  male: 'पुरुष', female: 'महिला', other: 'अन्य',
  marriage: 'विवाह', jobChange: 'नौकरी बदलना', businessStart: 'व्यवसाय शुरू करना', propertyPurchase: 'संपत्ति ख़रीदना',
  career: 'करियर', money: 'धन', love: 'प्रेम', family: 'परिवार', spirituality: 'आध्यात्मिकता',
};
delete (HI_TERMS as Record<string, string>).Silver_;

/** Translate a data term for display. English (or an unknown term) is returned unchanged. */
export function tr(lang: Lang | 'en' | 'hi', s: string | null | undefined): string {
  if (!s) return s ?? '';
  if (lang !== 'hi') return s;
  const hit = HI_TERMS[s] ?? HI_TERMS[s.trim()];
  if (hit) return hit;
  // Patterned engine strings: "3 Mukhi", "1 or 12 Mukhi", "double 'A'", "'U' → 'OO'", "13 Jan 2026 – 12 Jan 2027"
  let m = /^(\d+)(?: or (\d+))? Mukhi$/.exec(s);
  if (m) return `${m[1]}${m[2] ? ` या ${m[2]}` : ''} मुखी`;
  m = /^double '(.+)'$/.exec(s);
  if (m) return `दोहरा '${m[1]}'`;
  if (/^\d{1,2} [A-Z][a-z]{2} \d{4} – \d{1,2} [A-Z][a-z]{2} \d{4}$/.test(s)) return s.replace(/[A-Z][a-z]{2}/g, (mo) => HI_MONTH_SHORT[mo] ?? mo);
  return s;
}
const HI_MONTH_SHORT: Record<string, string> = { Jan: 'जनवरी', Feb: 'फ़रवरी', Mar: 'मार्च', Apr: 'अप्रैल', May: 'मई', Jun: 'जून', Jul: 'जुलाई', Aug: 'अगस्त', Sep: 'सितंबर', Oct: 'अक्टूबर', Nov: 'नवंबर', Dec: 'दिसंबर' };
export const trList = (lang: Lang | 'en' | 'hi', xs: string[]) => xs.map((x) => tr(lang, x));
