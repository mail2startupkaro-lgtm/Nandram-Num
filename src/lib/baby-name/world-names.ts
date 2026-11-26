/**
 * Baby names for clients outside India: one curated bank per naming culture, chosen from the client's country.
 * Same shape as the Indian bank (n = spelling used for the Chaldean calculation, hi = Devanagari, en / hm = meaning EN / HI).
 * Spellings are the common Latin-script spellings used on passports and birth certificates in that country.
 */
import { ALL_COUNTRIES } from '@/lib/countries';
import { NAME_BANK, type BankName } from './names';

export type NameStyle = 'indian' | 'english' | 'arabic' | 'spanish' | 'portuguese' | 'french' | 'german' | 'dutch' | 'italian' | 'russian' | 'malay';
/** 'auto' = from the country; 'mix' = the country's names + Indian names (for NRI families). */
export type NameStyleChoice = 'auto' | 'mix' | NameStyle;

export const NAME_STYLES: { id: NameStyle; en: string; hi: string }[] = [
  { id: 'indian', en: 'Indian', hi: 'भारतीय' },
  { id: 'english', en: 'English (international)', hi: 'अंग्रेज़ी (अंतरराष्ट्रीय)' },
  { id: 'arabic', en: 'Arabic / Islamic', hi: 'अरबी / इस्लामी' },
  { id: 'spanish', en: 'Spanish', hi: 'स्पेनिश' },
  { id: 'portuguese', en: 'Portuguese', hi: 'पुर्तगाली' },
  { id: 'french', en: 'French', hi: 'फ़्रेंच' },
  { id: 'german', en: 'German', hi: 'जर्मन' },
  { id: 'dutch', en: 'Dutch', hi: 'डच' },
  { id: 'italian', en: 'Italian', hi: 'इटैलियन' },
  { id: 'russian', en: 'Russian / Slavic', hi: 'रूसी / स्लाविक' },
  { id: 'malay', en: 'Malay / Indonesian', hi: 'मलय / इंडोनेशियाई' },
];

const B = (n: string, hi: string, en: string, hm: string): BankName => ({ n, g: 'b', hi, en, hm });
const G = (n: string, hi: string, en: string, hm: string): BankName => ({ n, g: 'g', hi, en, hm });
const U = (n: string, hi: string, en: string, hm: string): BankName => ({ n, g: 'u', hi, en, hm });

const ENGLISH: BankName[] = [
  B('Oliver', 'ओलिवर', 'Olive tree, peace', 'जैतून का पेड़, शांति'), B('Noah', 'नोआ', 'Rest, comfort', 'विश्राम, सुकून'), B('Liam', 'लियाम', 'Strong-willed protector', 'दृढ़ रक्षक'),
  B('James', 'जेम्स', 'One who follows', 'अनुयायी'), B('William', 'विलियम', 'Determined protector', 'दृढ़ संरक्षक'), B('Henry', 'हेनरी', 'Ruler of the home', 'घर का स्वामी'),
  B('Lucas', 'लूकस', 'Bringer of light', 'प्रकाश लाने वाला'), B('Ethan', 'ईथन', 'Strong, firm', 'मज़बूत, अटल'), B('Benjamin', 'बेंजामिन', 'Son of the right hand', 'प्रिय पुत्र'),
  B('Leo', 'लियो', 'Lion', 'सिंह'), B('Jack', 'जैक', 'God is gracious', 'ईश्वर कृपालु है'), B('Samuel', 'सैमुअल', 'Heard by God', 'ईश्वर द्वारा सुना गया'),
  B('Daniel', 'डेनियल', 'God is my judge', 'ईश्वर मेरा न्यायाधीश'), B('Arthur', 'आर्थर', 'Strong as a bear', 'भालू जैसा बलवान'), B('George', 'जॉर्ज', 'Farmer, earth-worker', 'किसान'),
  B('Thomas', 'थॉमस', 'Twin', 'जुड़वाँ'), B('Theodore', 'थियोडोर', 'Gift of God', 'ईश्वर का उपहार'), B('Elijah', 'एलाइजा', 'My God is the Lord', 'प्रभु मेरा ईश्वर'),
  B('Alexander', 'अलेक्ज़ेंडर', 'Defender of people', 'लोगों का रक्षक'), B('Ryan', 'रायन', 'Little king', 'छोटा राजा'), B('Adam', 'ऐडम', 'Of the earth', 'धरती से बना'),
  B('Nathan', 'नेथन', 'He gave', 'उसने दिया'), B('Isaac', 'आइज़ैक', 'Laughter', 'हँसी'), B('Oscar', 'ऑस्कर', 'Friend of deer; divine spear', 'दिव्य भाला'),
  G('Olivia', 'ओलिविया', 'Olive tree, peace', 'जैतून का पेड़, शांति'), G('Amelia', 'अमीलिया', 'Hard-working', 'परिश्रमी'), G('Charlotte', 'शार्लट', 'Free woman', 'स्वतंत्र'),
  G('Emma', 'एमा', 'Whole, universal', 'संपूर्ण'), G('Ava', 'एवा', 'Life', 'जीवन'), G('Sophia', 'सोफ़िया', 'Wisdom', 'बुद्धि'),
  G('Isla', 'आइला', 'Island', 'द्वीप'), G('Grace', 'ग्रेस', 'Grace, kindness', 'कृपा, दया'), G('Lily', 'लिली', 'Lily flower, purity', 'लिली का फूल, पवित्रता'),
  G('Chloe', 'क्लोई', 'Blooming', 'खिलती हुई'), G('Ella', 'एला', 'Light', 'प्रकाश'), G('Emily', 'एमिली', 'Industrious', 'मेहनती'),
  G('Hannah', 'हन्ना', 'Grace, favour', 'कृपा'), G('Mia', 'मिया', 'Mine; beloved', 'प्रिय'), G('Zoe', 'ज़ोई', 'Life', 'जीवन'),
  G('Ruby', 'रूबी', 'Red gemstone', 'माणिक'), G('Evelyn', 'एवलिन', 'Wished-for child', 'मनचाही संतान'), G('Harper', 'हार्पर', 'Harp player', 'वीणा वादिका'),
  G('Alice', 'ऐलिस', 'Noble', 'कुलीन'), G('Florence', 'फ़्लोरेंस', 'Flourishing', 'फलती-फूलती'), G('Eleanor', 'एलेनोर', 'Light, bright', 'उज्ज्वल'),
  G('Victoria', 'विक्टोरिया', 'Victory', 'विजय'), G('Hazel', 'हेज़ल', 'Hazel tree; wisdom', 'बुद्धिमत्ता'), G('Nora', 'नोरा', 'Honour, light', 'सम्मान, प्रकाश'),
  U('Riley', 'रायली', 'Courageous', 'साहसी'), U('Jordan', 'जॉर्डन', 'Flowing down', 'बहती धारा'), U('Avery', 'एवरी', 'Wise ruler', 'बुद्धिमान शासक'),
];

const ARABIC: BankName[] = [
  B('Muhammad', 'मुहम्मद', 'Praiseworthy', 'प्रशंसनीय'), B('Ahmed', 'अहमद', 'Most praised', 'सबसे प्रशंसित'), B('Ali', 'अली', 'Exalted, noble', 'उच्च, श्रेष्ठ'),
  B('Omar', 'उमर', 'Long-lived, flourishing', 'दीर्घायु'), B('Yusuf', 'यूसुफ़', 'God increases', 'ईश्वर बढ़ाता है'), B('Ibrahim', 'इब्राहीम', 'Father of nations', 'राष्ट्रों का पिता'),
  B('Hamza', 'हमज़ा', 'Steadfast, strong', 'दृढ़, बलवान'), B('Zayd', 'ज़ैद', 'Growth, abundance', 'वृद्धि, समृद्धि'), B('Adam', 'आदम', 'Of the earth', 'धरती से बना'),
  B('Rayan', 'रयान', 'Gate of paradise', 'जन्नत का द्वार'), B('Khalid', 'ख़ालिद', 'Eternal', 'शाश्वत'), B('Faris', 'फ़ारिस', 'Knight', 'घुड़सवार योद्धा'),
  B('Karim', 'करीम', 'Generous', 'उदार'), B('Tariq', 'तारिक़', 'Morning star', 'भोर का तारा'), B('Hassan', 'हसन', 'Handsome, good', 'सुंदर, नेक'),
  B('Hussain', 'हुसैन', 'Good, handsome', 'नेक, सुंदर'), B('Imran', 'इमरान', 'Prosperity', 'समृद्धि'), B('Bilal', 'बिलाल', 'Freshness; the first muezzin', 'ताज़गी'),
  B('Sami', 'सामी', 'Elevated', 'उच्च'), B('Rashid', 'रशीद', 'Rightly guided', 'सही मार्ग पर'), B('Nasir', 'नासिर', 'Helper, victorious', 'सहायक, विजयी'),
  B('Zain', 'ज़ैन', 'Beauty, grace', 'सुंदरता'), B('Ayaan', 'अयान', 'Gift of God', 'ईश्वर का उपहार'), B('Saif', 'सैफ़', 'Sword', 'तलवार'),
  G('Fatima', 'फ़ातिमा', 'One who abstains; the Prophet’s daughter', 'संयमी'), G('Aisha', 'आयशा', 'Alive, living', 'जीवंत'), G('Mariam', 'मरियम', 'Beloved; mother of Isa', 'प्रिय'),
  G('Layla', 'लैला', 'Night; beauty', 'रात; सौंदर्य'), G('Noor', 'नूर', 'Light', 'प्रकाश'), G('Zainab', 'ज़ैनब', 'Fragrant flower', 'सुगंधित फूल'),
  G('Sara', 'सारा', 'Princess, pure', 'राजकुमारी, पवित्र'), G('Hana', 'हना', 'Happiness', 'ख़ुशी'), G('Amira', 'अमीरा', 'Princess', 'राजकुमारी'),
  G('Yasmin', 'यास्मीन', 'Jasmine flower', 'चमेली'), G('Salma', 'सलमा', 'Peaceful, safe', 'शांत, सुरक्षित'), G('Huda', 'हुदा', 'Right guidance', 'सही मार्गदर्शन'),
  G('Rania', 'रानिया', 'Queenly; gazing', 'रानी जैसी'), G('Lina', 'लीना', 'Tender, palm tree', 'कोमल'), G('Malak', 'मलक', 'Angel', 'फ़रिश्ता'),
  G('Aya', 'आया', 'Sign, miracle', 'चिह्न, चमत्कार'), G('Jana', 'जना', 'Harvest, fruit', 'फसल, फल'), G('Dalia', 'दालिया', 'Dahlia flower', 'डेलिया फूल'),
  G('Inaya', 'इनाया', 'Care, concern', 'देखभाल'), G('Safiya', 'सफ़िया', 'Pure, sincere', 'पवित्र, सच्ची'), G('Zara', 'ज़ारा', 'Radiance; flower', 'चमक; फूल'),
  G('Mahira', 'माहिरा', 'Skilful', 'कुशल'), G('Alia', 'आलिया', 'Exalted, noble', 'उच्च, श्रेष्ठ'), G('Samira', 'समीरा', 'Pleasant companion', 'प्रिय साथी'),
];

const SPANISH: BankName[] = [
  B('Mateo', 'मातेओ', 'Gift of God', 'ईश्वर का उपहार'), B('Santiago', 'सांतियागो', 'Saint James', 'संत जेम्स'), B('Lucas', 'लूकास', 'Bringer of light', 'प्रकाश लाने वाला'),
  B('Diego', 'दिएगो', 'Supplanter; teaching', 'शिक्षा'), B('Hugo', 'ऊगो', 'Mind, intellect', 'मन, बुद्धि'), B('Pablo', 'पाब्लो', 'Humble', 'विनम्र'),
  B('Alejandro', 'अलेहांद्रो', 'Defender of people', 'लोगों का रक्षक'), B('Martín', 'मार्तीन', 'Warrior of Mars', 'योद्धा'), B('Daniel', 'दानिएल', 'God is my judge', 'ईश्वर मेरा न्यायाधीश'),
  B('Leonardo', 'लेओनार्दो', 'Brave as a lion', 'सिंह जैसा वीर'), B('Gabriel', 'गाब्रिएल', 'God is my strength', 'ईश्वर मेरी शक्ति'), B('Emiliano', 'एमिलियानो', 'Rival; eager', 'उत्साही'),
  B('Sebastián', 'सेबास्तियान', 'Venerable', 'आदरणीय'), B('Nicolás', 'निकोलास', 'Victory of the people', 'जनता की विजय'), B('Joaquín', 'होआकीन', 'Raised by God', 'ईश्वर द्वारा उठाया गया'),
  B('Rafael', 'राफ़ाएल', 'God heals', 'ईश्वर चंगा करता है'), B('Adrián', 'आद्रियान', 'From the sea', 'समुद्र से'), B('Tomás', 'तोमास', 'Twin', 'जुड़वाँ'),
  G('Sofía', 'सोफ़िया', 'Wisdom', 'बुद्धि'), G('Lucía', 'लूसिया', 'Light', 'प्रकाश'), G('Valentina', 'वालेंतीना', 'Strong, healthy', 'सशक्त, स्वस्थ'),
  G('Isabella', 'इसाबेला', 'Promise of God', 'ईश्वर का वचन'), G('Camila', 'कामिला', 'Helper at the altar', 'सेवा करने वाली'), G('Martina', 'मार्तीना', 'Warlike, strong', 'साहसी'),
  G('Paula', 'पाउला', 'Small, humble', 'विनम्र'), G('Elena', 'एलेना', 'Shining light', 'चमकता प्रकाश'), G('Daniela', 'दानिएला', 'God is my judge', 'ईश्वर मेरी न्यायाधीश'),
  G('Mariana', 'मारियाना', 'Of the sea; graceful', 'समुद्र की'), G('Carmen', 'कारमेन', 'Garden; song', 'उपवन; गीत'), G('Alba', 'आल्बा', 'Dawn', 'भोर'),
  G('Julia', 'हूलिया', 'Youthful', 'युवा'), G('Victoria', 'बिक्तोरिया', 'Victory', 'विजय'), G('Ximena', 'हिमेना', 'Listener', 'सुनने वाली'),
  G('Renata', 'रेनाता', 'Reborn', 'नवजीवन'), G('Gabriela', 'गाब्रिएला', 'God is my strength', 'ईश्वर मेरी शक्ति'), G('Inés', 'इनेस', 'Pure', 'पवित्र'),
];

const PORTUGUESE: BankName[] = [
  B('Miguel', 'मिगेल', 'Who is like God?', 'ईश्वर जैसा कौन?'), B('Arthur', 'आर्तुर', 'Strong as a bear', 'भालू जैसा बलवान'), B('Gael', 'गाएल', 'Generous; gentle', 'उदार'),
  B('Heitor', 'एइतोर', 'Steadfast', 'अटल'), B('Theo', 'तेओ', 'Gift of God', 'ईश्वर का उपहार'), B('Davi', 'दावी', 'Beloved', 'प्रिय'),
  B('Gabriel', 'गाब्रिएल', 'God is my strength', 'ईश्वर मेरी शक्ति'), B('Bernardo', 'बेर्नार्दो', 'Brave as a bear', 'वीर'), B('Samuel', 'सामुएल', 'Heard by God', 'ईश्वर द्वारा सुना गया'),
  B('João', 'जोआउ', 'God is gracious', 'ईश्वर कृपालु है'), B('Rafael', 'हाफ़ाएल', 'God heals', 'ईश्वर चंगा करता है'), B('Lorenzo', 'लोरेंज़ो', 'Crowned with laurel', 'विजय-मुकुट वाला'),
  B('Tiago', 'चियागो', 'Saint James', 'संत जेम्स'), B('Rodrigo', 'होद्रिगो', 'Famous ruler', 'प्रसिद्ध शासक'), B('Benício', 'बेनीसियो', 'Kind, good', 'दयालु'),
  G('Helena', 'एलेना', 'Shining light', 'चमकता प्रकाश'), G('Alice', 'आलिसी', 'Noble', 'कुलीन'), G('Laura', 'लाउरा', 'Laurel; victory', 'विजय'),
  G('Manuela', 'मानुएला', 'God is with us', 'ईश्वर हमारे साथ'), G('Valentina', 'वालेंचीना', 'Strong, healthy', 'सशक्त, स्वस्थ'), G('Sophia', 'सोफ़िया', 'Wisdom', 'बुद्धि'),
  G('Isabela', 'इज़ाबेला', 'Promise of God', 'ईश्वर का वचन'), G('Beatriz', 'बेआत्रिज़', 'She who brings joy', 'आनंद देने वाली'), G('Lara', 'लारा', 'Protector of the home', 'घर की रक्षिका'),
  G('Clara', 'क्लारा', 'Bright, clear', 'उज्ज्वल'), G('Lívia', 'लीविया', 'Peace; olive', 'शांति'), G('Mariana', 'मारियाना', 'Of the sea; graceful', 'समुद्र की'),
  G('Cecília', 'सेसीलिया', 'Patron of music', 'संगीत की संरक्षिका'), G('Luana', 'लुआना', 'Moonlight; happy', 'चाँदनी'), G('Esther', 'एस्तेर', 'Star', 'तारा'),
];

const FRENCH: BankName[] = [
  B('Gabriel', 'गाब्रिएल', 'God is my strength', 'ईश्वर मेरी शक्ति'), B('Louis', 'लुई', 'Famous warrior', 'प्रसिद्ध योद्धा'), B('Raphaël', 'राफ़ाएल', 'God heals', 'ईश्वर चंगा करता है'),
  B('Jules', 'ज्यूल', 'Youthful', 'युवा'), B('Adam', 'आदाम', 'Of the earth', 'धरती से बना'), B('Arthur', 'आर्तुर', 'Strong as a bear', 'भालू जैसा बलवान'),
  B('Léo', 'लेओ', 'Lion', 'सिंह'), B('Hugo', 'ऊगो', 'Mind, intellect', 'मन, बुद्धि'), B('Gabin', 'गाबैं', 'Man of God', 'ईश्वर का व्यक्ति'),
  B('Maël', 'माएल', 'Prince, chief', 'राजकुमार'), B('Noé', 'नोए', 'Rest, comfort', 'विश्राम'), B('Paul', 'पॉल', 'Humble', 'विनम्र'),
  B('Victor', 'विक्टोर', 'Winner', 'विजेता'), B('Antoine', 'आंत्वान', 'Priceless', 'अनमोल'), B('Étienne', 'एतिएन', 'Crown', 'मुकुट'),
  B('Mathis', 'मातीस', 'Gift of God', 'ईश्वर का उपहार'), B('Sacha', 'साशा', 'Defender of people', 'रक्षक'), B('Nathan', 'नातान', 'He gave', 'उसने दिया'),
  G('Jade', 'जाद', 'Jade stone, precious', 'जेड रत्न, कीमती'), G('Louise', 'लुईज़', 'Famous warrior', 'प्रसिद्ध योद्धा'), G('Ambre', 'आंब्र', 'Amber, warm glow', 'अंबर, गर्म चमक'),
  G('Alba', 'आल्बा', 'Dawn', 'भोर'), G('Emma', 'एमा', 'Whole, universal', 'संपूर्ण'), G('Rose', 'रोज़', 'Rose flower', 'गुलाब'),
  G('Alice', 'आलीस', 'Noble', 'कुलीन'), G('Romy', 'रोमी', 'Dew of the sea', 'समुद्र की ओस'), G('Anna', 'आना', 'Grace', 'कृपा'),
  G('Lina', 'लीना', 'Tender', 'कोमल'), G('Chloé', 'क्लोए', 'Blooming', 'खिलती हुई'), G('Léa', 'लेआ', 'Delicate, gentle', 'कोमल'),
  G('Manon', 'मानों', 'Beloved', 'प्रिय'), G('Camille', 'कामीय', 'Helper at the altar', 'सेवा करने वाली'), G('Inès', 'इनेस', 'Pure', 'पवित्र'),
  G('Céline', 'सेलीन', 'Heavenly', 'स्वर्गीय'), G('Juliette', 'ज्यूलिएत', 'Youthful', 'युवा'), G('Margaux', 'मार्गो', 'Pearl', 'मोती'),
];

const GERMAN: BankName[] = [
  B('Noah', 'नोआ', 'Rest, comfort', 'विश्राम'), B('Matteo', 'मातेओ', 'Gift of God', 'ईश्वर का उपहार'), B('Elias', 'एलियास', 'My God is the Lord', 'प्रभु मेरा ईश्वर'),
  B('Finn', 'फ़िन', 'Fair, bright', 'उज्ज्वल'), B('Leon', 'लेओन', 'Lion', 'सिंह'), B('Paul', 'पाउल', 'Humble', 'विनम्र'),
  B('Felix', 'फ़ेलिक्स', 'Lucky, happy', 'भाग्यशाली, प्रसन्न'), B('Emil', 'एमिल', 'Eager, industrious', 'उत्साही'), B('Henry', 'हेनरी', 'Ruler of the home', 'घर का स्वामी'),
  B('Jonas', 'योनास', 'Dove, peace', 'कबूतर, शांति'), B('Maximilian', 'माक्सिमिलियान', 'The greatest', 'सबसे महान'), B('Luis', 'लुइस', 'Famous warrior', 'प्रसिद्ध योद्धा'),
  B('Anton', 'अंतोन', 'Priceless', 'अनमोल'), B('Theo', 'तेओ', 'Gift of God', 'ईश्वर का उपहार'), B('Moritz', 'मोरित्ज़', 'Dark-skinned; steadfast', 'अटल'),
  B('Jakob', 'याकोब', 'One who follows', 'अनुयायी'), B('Lukas', 'लूकास', 'Bringer of light', 'प्रकाश लाने वाला'), B('Oskar', 'ऑस्कार', 'Divine spear', 'दिव्य भाला'),
  G('Emilia', 'एमीलिया', 'Eager, industrious', 'परिश्रमी'), G('Sophia', 'ज़ोफ़िया', 'Wisdom', 'बुद्धि'), G('Emma', 'एमा', 'Whole, universal', 'संपूर्ण'),
  G('Hannah', 'हाना', 'Grace', 'कृपा'), G('Mia', 'मीआ', 'Beloved', 'प्रिय'), G('Lina', 'लीना', 'Tender', 'कोमल'),
  G('Clara', 'क्लारा', 'Bright, clear', 'उज्ज्वल'), G('Ella', 'एला', 'Light', 'प्रकाश'), G('Lea', 'लेआ', 'Delicate, gentle', 'कोमल'),
  G('Marie', 'मारी', 'Beloved', 'प्रिय'), G('Mila', 'मीला', 'Gracious, dear', 'प्यारी'), G('Ida', 'ईडा', 'Hard-working', 'परिश्रमी'),
  G('Frieda', 'फ़्रीडा', 'Peace', 'शांति'), G('Johanna', 'योहाना', 'God is gracious', 'ईश्वर कृपालु है'), G('Greta', 'ग्रेटा', 'Pearl', 'मोती'),
  G('Luisa', 'लुइज़ा', 'Famous warrior', 'प्रसिद्ध योद्धा'), G('Paula', 'पाउला', 'Humble', 'विनम्र'), G('Charlotte', 'शार्लोटे', 'Free woman', 'स्वतंत्र'),
];

const DUTCH: BankName[] = [
  B('Daan', 'दान', 'God is my judge', 'ईश्वर मेरा न्यायाधीश'), B('Sem', 'सेम', 'Name, fame', 'नाम, यश'), B('Lucas', 'लूकास', 'Bringer of light', 'प्रकाश लाने वाला'),
  B('Levi', 'लेवी', 'Joined, attached', 'जुड़ा हुआ'), B('Finn', 'फ़िन', 'Fair, bright', 'उज्ज्वल'), B('Bram', 'ब्राम', 'Father of many', 'अनेकों का पिता'),
  B('Luuk', 'लूक', 'Bringer of light', 'प्रकाश लाने वाला'), B('Jesse', 'येसे', 'Gift', 'उपहार'), B('Thijs', 'टेइस', 'Gift of God', 'ईश्वर का उपहार'),
  B('Milan', 'मिलान', 'Gracious, dear', 'प्यारा'), B('Ruben', 'रूबेन', 'Behold, a son', 'देखो, पुत्र'), B('Max', 'माक्स', 'The greatest', 'सबसे महान'),
  G('Emma', 'एमा', 'Whole, universal', 'संपूर्ण'), G('Julia', 'यूलिया', 'Youthful', 'युवा'), G('Tess', 'टेस', 'Harvester', 'फसल काटने वाली'),
  G('Sophie', 'सोफ़ी', 'Wisdom', 'बुद्धि'), G('Zoë', 'ज़ोए', 'Life', 'जीवन'), G('Evi', 'एवी', 'Life', 'जीवन'),
  G('Saar', 'सार', 'Princess', 'राजकुमारी'), G('Nora', 'नोरा', 'Honour, light', 'सम्मान, प्रकाश'), G('Fenna', 'फ़ेना', 'Peace', 'शांति'),
  G('Lotte', 'लोटे', 'Free woman', 'स्वतंत्र'), G('Noor', 'नूर', 'Light', 'प्रकाश'), G('Anna', 'आना', 'Grace', 'कृपा'),
];

const ITALIAN: BankName[] = [
  B('Leonardo', 'लेओनार्दो', 'Brave as a lion', 'सिंह जैसा वीर'), B('Francesco', 'फ़्रांचेस्को', 'Free one', 'स्वतंत्र'), B('Alessandro', 'आलेस्सांद्रो', 'Defender of people', 'लोगों का रक्षक'),
  B('Lorenzo', 'लोरेंत्सो', 'Crowned with laurel', 'विजय-मुकुट वाला'), B('Mattia', 'मात्तिया', 'Gift of God', 'ईश्वर का उपहार'), B('Andrea', 'आंद्रेआ', 'Brave, manly', 'वीर'),
  B('Gabriele', 'गाब्रिएले', 'God is my strength', 'ईश्वर मेरी शक्ति'), B('Riccardo', 'रिक्कार्दो', 'Brave ruler', 'वीर शासक'), B('Tommaso', 'तोम्मासो', 'Twin', 'जुड़वाँ'),
  B('Edoardo', 'एदोआर्दो', 'Wealthy guardian', 'समृद्ध रक्षक'), B('Giuseppe', 'जुज़ेप्पे', 'God increases', 'ईश्वर बढ़ाता है'), B('Matteo', 'मात्तेओ', 'Gift of God', 'ईश्वर का उपहार'),
  B('Davide', 'दावीदे', 'Beloved', 'प्रिय'), B('Pietro', 'पिएत्रो', 'Rock, steady', 'चट्टान, अटल'), B('Marco', 'मार्को', 'Warlike, brave', 'वीर'),
  G('Sofia', 'सोफ़िया', 'Wisdom', 'बुद्धि'), G('Giulia', 'जूलिया', 'Youthful', 'युवा'), G('Aurora', 'आउरोरा', 'Dawn', 'भोर'),
  G('Alice', 'आलीचे', 'Noble', 'कुलीन'), G('Ginevra', 'जिनेव्रा', 'Fair one; juniper', 'गोरी'), G('Emma', 'एम्मा', 'Whole, universal', 'संपूर्ण'),
  G('Giorgia', 'जोर्जा', 'Farmer, earth-worker', 'धरती से जुड़ी'), G('Beatrice', 'बेआत्रीचे', 'She who brings joy', 'आनंद देने वाली'), G('Chiara', 'कियारा', 'Bright, clear', 'उज्ज्वल'),
  G('Vittoria', 'वित्तोरिया', 'Victory', 'विजय'), G('Ludovica', 'लुदोविका', 'Famous warrior', 'प्रसिद्ध योद्धा'), G('Bianca', 'बियांका', 'White, pure', 'श्वेत, पवित्र'),
  G('Francesca', 'फ़्रांचेस्का', 'Free one', 'स्वतंत्र'), G('Elena', 'एलेना', 'Shining light', 'चमकता प्रकाश'), G('Martina', 'मार्तीना', 'Strong, brave', 'साहसी'),
];

const RUSSIAN: BankName[] = [
  B('Alexander', 'अलेक्सांद्र', 'Defender of people', 'लोगों का रक्षक'), B('Mikhail', 'मिख़ाइल', 'Who is like God?', 'ईश्वर जैसा कौन?'), B('Maxim', 'मक्सीम', 'The greatest', 'सबसे महान'),
  B('Artem', 'आर्त्योम', 'Healthy, safe', 'स्वस्थ, सुरक्षित'), B('Ivan', 'इवान', 'God is gracious', 'ईश्वर कृपालु है'), B('Dmitri', 'द्मीत्री', 'Of the earth goddess', 'धरती से जुड़ा'),
  B('Nikita', 'निकीता', 'Victorious', 'विजयी'), B('Matvei', 'मात्वेई', 'Gift of God', 'ईश्वर का उपहार'), B('Lev', 'ल्येव', 'Lion', 'सिंह'),
  B('Timur', 'तिमूर', 'Iron, strong', 'लोहा, मज़बूत'), B('Daniil', 'दानीइल', 'God is my judge', 'ईश्वर मेरा न्यायाधीश'), B('Roman', 'रोमान', 'Of Rome; strong', 'मज़बूत'),
  B('Kirill', 'किरील', 'Lordly', 'स्वामी जैसा'), B('Ilya', 'इल्या', 'My God is the Lord', 'प्रभु मेरा ईश्वर'), B('Mark', 'मार्क', 'Warlike, brave', 'वीर'),
  G('Anastasia', 'अनास्तासिया', 'Resurrection, new life', 'नवजीवन'), G('Sofia', 'सोफ़िया', 'Wisdom', 'बुद्धि'), G('Maria', 'मारिया', 'Beloved', 'प्रिय'),
  G('Anna', 'आन्ना', 'Grace', 'कृपा'), G('Alisa', 'अलीसा', 'Noble', 'कुलीन'), G('Viktoria', 'विक्तोरिया', 'Victory', 'विजय'),
  G('Polina', 'पोलीना', 'Small, humble', 'विनम्र'), G('Eva', 'येवा', 'Life', 'जीवन'), G('Varvara', 'वार्वारा', 'Traveller, foreign', 'यात्री'),
  G('Daria', 'दारिया', 'Possessor of good', 'शुभ की स्वामिनी'), G('Ksenia', 'क्सेनिया', 'Hospitable', 'आतिथ्य करने वाली'), G('Milana', 'मिलाना', 'Gracious, dear', 'प्यारी'),
  G('Vera', 'वेरा', 'Faith', 'आस्था'), G('Mila', 'मीला', 'Dear, gracious', 'प्यारी'), G('Elena', 'येलेना', 'Shining light', 'चमकता प्रकाश'),
];

const MALAY: BankName[] = [
  B('Muhammad', 'मुहम्मद', 'Praiseworthy', 'प्रशंसनीय'), B('Aryan', 'आर्यन', 'Noble', 'श्रेष्ठ'), B('Rizky', 'रिज़्की', 'Blessing, sustenance', 'आशीर्वाद'),
  B('Danish', 'दानिश', 'Knowledge, wisdom', 'ज्ञान'), B('Haziq', 'हाज़िक़', 'Clever, skilful', 'कुशल, चतुर'), B('Irfan', 'इरफ़ान', 'Knowledge, gratitude', 'ज्ञान, कृतज्ञता'),
  B('Arif', 'आरिफ़', 'Knowledgeable', 'ज्ञानी'), B('Hakim', 'हकीम', 'Wise', 'बुद्धिमान'), B('Fikri', 'फ़िक्री', 'Thoughtful', 'विचारशील'),
  B('Budi', 'बुदी', 'Wise, of good character', 'बुद्धिमान, सदाचारी'), B('Putra', 'पुत्रा', 'Son, prince', 'पुत्र, राजकुमार'), B('Adi', 'आदी', 'First, excellent', 'प्रथम, उत्तम'),
  B('Iskandar', 'इस्कंदर', 'Defender of people', 'लोगों का रक्षक'), B('Naufal', 'नौफ़ल', 'Generous, handsome', 'उदार'), B('Bayu', 'बायू', 'Wind', 'पवन'),
  G('Nur', 'नूर', 'Light', 'प्रकाश'), G('Aisyah', 'आइस्याह', 'Alive, living', 'जीवंत'), G('Putri', 'पुत्री', 'Princess, daughter', 'राजकुमारी, पुत्री'),
  G('Dewi', 'देवी', 'Goddess', 'देवी'), G('Sari', 'सारी', 'Essence, flower', 'सार, फूल'), G('Ayu', 'आयू', 'Beautiful', 'सुंदर'),
  G('Intan', 'इंतान', 'Diamond', 'हीरा'), G('Mawar', 'मावार', 'Rose', 'गुलाब'), G('Kirana', 'किराना', 'Beam of light', 'प्रकाश-किरण'),
  G('Alya', 'आल्या', 'Exalted', 'उच्च'), G('Humaira', 'हुमैरा', 'Rosy-cheeked', 'गुलाबी गालों वाली'), G('Damia', 'दामिया', 'Gentle', 'कोमल'),
  G('Wulan', 'वुलान', 'Moon', 'चंद्रमा'), G('Indah', 'इंदाह', 'Beautiful', 'सुंदर'), G('Laila', 'लैला', 'Night; beauty', 'रात; सौंदर्य'),
];

export const WORLD_BANKS: Record<NameStyle, BankName[]> = {
  indian: NAME_BANK, english: ENGLISH, arabic: ARABIC, spanish: SPANISH, portuguese: PORTUGUESE, french: FRENCH,
  german: GERMAN, dutch: DUTCH, italian: ITALIAN, russian: RUSSIAN, malay: MALAY,
};

/** Country (name or ISO code, as stored on the order) → naming culture. Unknown foreign countries → English (international). */
const BY_COUNTRY: Record<string, NameStyle> = {
  IN: 'indian', NP: 'indian', BT: 'indian', LK: 'indian', MU: 'indian', FJ: 'indian',
  US: 'english', GB: 'english', UK: 'english', CA: 'english', AU: 'english', NZ: 'english', IE: 'english', ZA: 'english', SG: 'english', JM: 'english', TT: 'english', GY: 'english', KE: 'english', NG: 'english', GH: 'english', PH: 'english',
  AE: 'arabic', SA: 'arabic', QA: 'arabic', KW: 'arabic', OM: 'arabic', BH: 'arabic', EG: 'arabic', JO: 'arabic', LB: 'arabic', IQ: 'arabic', SY: 'arabic', YE: 'arabic', MA: 'arabic', DZ: 'arabic', TN: 'arabic', LY: 'arabic', SD: 'arabic', PK: 'arabic', BD: 'arabic', AF: 'arabic', TR: 'arabic', IR: 'arabic', MV: 'arabic',
  ES: 'spanish', MX: 'spanish', AR: 'spanish', CO: 'spanish', CL: 'spanish', PE: 'spanish', VE: 'spanish', EC: 'spanish', UY: 'spanish', PY: 'spanish', BO: 'spanish', CR: 'spanish', PA: 'spanish', DO: 'spanish', GT: 'spanish', CU: 'spanish', PR: 'spanish',
  BR: 'portuguese', PT: 'portuguese', AO: 'portuguese', MZ: 'portuguese',
  FR: 'french', BE: 'french', LU: 'french', MC: 'french', SN: 'french', CI: 'french',
  DE: 'german', AT: 'german', CH: 'german', LI: 'german', DK: 'german', SE: 'german', NO: 'german', FI: 'german', PL: 'german', CZ: 'german',
  NL: 'dutch', SR: 'dutch',
  IT: 'italian', SM: 'italian', MT: 'italian',
  RU: 'russian', UA: 'russian', BY: 'russian', KZ: 'russian', KG: 'russian', UZ: 'russian', BG: 'russian', RS: 'russian', HR: 'russian', AM: 'russian', AZ: 'russian', GE: 'russian', EE: 'russian', LV: 'russian', LT: 'russian',
  MY: 'malay', ID: 'malay', BN: 'malay',
};
const NAME_TO_CODE: Record<string, string> = {
  'india': 'IN', 'nepal': 'NP', 'bhutan': 'BT', 'sri lanka': 'LK', 'mauritius': 'MU', 'fiji': 'FJ',
  'united states': 'US', 'united states of america': 'US', 'usa': 'US', 'america': 'US', 'united kingdom': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB', 'great britain': 'GB',
  'canada': 'CA', 'australia': 'AU', 'new zealand': 'NZ', 'ireland': 'IE', 'south africa': 'ZA', 'singapore': 'SG', 'jamaica': 'JM', 'trinidad and tobago': 'TT', 'guyana': 'GY', 'kenya': 'KE', 'nigeria': 'NG', 'ghana': 'GH', 'philippines': 'PH',
  'united arab emirates': 'AE', 'uae': 'AE', 'dubai': 'AE', 'saudi arabia': 'SA', 'qatar': 'QA', 'kuwait': 'KW', 'oman': 'OM', 'bahrain': 'BH', 'egypt': 'EG', 'jordan': 'JO', 'lebanon': 'LB', 'iraq': 'IQ', 'syria': 'SY', 'yemen': 'YE',
  'morocco': 'MA', 'algeria': 'DZ', 'tunisia': 'TN', 'libya': 'LY', 'sudan': 'SD', 'pakistan': 'PK', 'bangladesh': 'BD', 'afghanistan': 'AF', 'turkey': 'TR', 'türkiye': 'TR', 'iran': 'IR', 'maldives': 'MV',
  'spain': 'ES', 'mexico': 'MX', 'argentina': 'AR', 'colombia': 'CO', 'chile': 'CL', 'peru': 'PE', 'venezuela': 'VE', 'ecuador': 'EC', 'uruguay': 'UY', 'paraguay': 'PY', 'bolivia': 'BO', 'costa rica': 'CR', 'panama': 'PA', 'dominican republic': 'DO', 'guatemala': 'GT', 'cuba': 'CU', 'puerto rico': 'PR',
  'brazil': 'BR', 'portugal': 'PT', 'angola': 'AO', 'mozambique': 'MZ',
  'france': 'FR', 'belgium': 'BE', 'luxembourg': 'LU', 'monaco': 'MC', 'senegal': 'SN', 'ivory coast': 'CI',
  'germany': 'DE', 'austria': 'AT', 'switzerland': 'CH', 'liechtenstein': 'LI', 'denmark': 'DK', 'sweden': 'SE', 'norway': 'NO', 'finland': 'FI', 'poland': 'PL', 'czech republic': 'CZ', 'czechia': 'CZ',
  'netherlands': 'NL', 'holland': 'NL', 'suriname': 'SR',
  'italy': 'IT', 'san marino': 'SM', 'malta': 'MT',
  'russia': 'RU', 'russian federation': 'RU', 'ukraine': 'UA', 'belarus': 'BY', 'kazakhstan': 'KZ', 'kyrgyzstan': 'KG', 'uzbekistan': 'UZ', 'bulgaria': 'BG', 'serbia': 'RS', 'croatia': 'HR', 'armenia': 'AM', 'azerbaijan': 'AZ', 'georgia': 'GE', 'estonia': 'EE', 'latvia': 'LV', 'lithuania': 'LT',
  'malaysia': 'MY', 'indonesia': 'ID', 'brunei': 'BN',
};

/** Country as entered ("United States", "US", "uae", "" …) → naming culture. Empty / India → Indian. */
export function nameStyleForCountry(country?: string | null): NameStyle {
  const raw = (country ?? '').trim();
  if (!raw) return 'indian';
  const low = raw.toLowerCase();
  const code = raw.length <= 3 ? raw.toUpperCase() : NAME_TO_CODE[low] ?? ALL_COUNTRIES.find((c) => c.name.toLowerCase() === low)?.code ?? '';
  return BY_COUNTRY[code] ?? 'english';
}

/** Resolves the admin's choice + the client's country to the banks to draw from (local first). */
export function resolveNameStyle(choice: NameStyleChoice | undefined, country?: string | null): { style: NameStyle; mix: boolean; banks: BankName[] } {
  const local = nameStyleForCountry(country);
  const style = !choice || choice === 'auto' || choice === 'mix' ? local : choice;
  const mix = choice === 'mix' && style !== 'indian';
  // De-duplicate by spelling (e.g. Ayaan, Aryan, Sara appear in more than one culture).
  const seen = new Set<string>();
  const banks = [...WORLD_BANKS[style], ...(mix ? NAME_BANK : [])].filter((x) => { const k = x.n.toUpperCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  return { style, mix, banks };
}

export const styleLabel = (style: NameStyle, lang: 'en' | 'hi') => NAME_STYLES.find((s) => s.id === style)?.[lang] ?? style;
