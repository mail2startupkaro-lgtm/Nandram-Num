/**
 * Hindi (simple, everyday Hindi) for the signature report's built-in analyst: feature names, what each option
 * means, the fixes, and the full written analysis. Used when the report language is Hindi.
 */
import { tr } from '@/lib/i18n/hi-terms';
import type { SignatureNumbers } from './numbers';

export const FEATURE_NAME_HI: Record<string, string> = {
  baseline: 'हस्ताक्षर की दिशा', slant: 'अक्षरों का झुकाव', size: 'आकार', first: 'पहला अक्षर', legibility: 'पढ़ने में आसानी', pressure: 'पेन का दबाव',
  underline: 'नीचे की रेखा', ending: 'आख़िरी स्ट्रोक', dots: 'बिंदु और पूर्ण विराम', spacing: 'नाम के हिस्सों के बीच जगह', enclosure: 'घेरा',
};

/** [label, meaning, fix?] per feature:option – written in plain words. */
export const OPTION_HI: Record<string, [string, string, string?]> = {
  'baseline:rising': ['ऊपर की ओर जाता', 'आशा, महत्वाकांक्षा और आगे बढ़ने की सोच। ऐसा हस्ताक्षर तरक्की का संकेत माना जाता है।'],
  'baseline:straight': ['सीधा', 'मन स्थिर है, आप भावनाओं पर काबू रखते हैं और व्यावहारिक सोच रखते हैं।'],
  'baseline:falling': ['नीचे की ओर गिरता', 'थकान, निराशा या दबाव का संकेत। भारतीय परंपरा में नीचे जाता हस्ताक्षर परिणाम कमज़ोर करता माना जाता है।', 'हस्ताक्षर ऐसे करने का अभ्यास करें कि वह बाएँ से दाएँ हल्का-सा ऊपर उठे।'],
  'baseline:wavy': ['लहरदार / असमान', 'मन और ऊर्जा बदलती रहती है; काम अच्छा शुरू होकर बीच में धीमा पड़ सकता है।', 'लाइन वाले काग़ज़ पर धीरे-धीरे हस्ताक्षर करें, जब तक लाइन सीधी और हल्की ऊपर उठती न हो जाए।'],
  'slant:right': ['दाईं ओर झुका', 'मिलनसार और खुले स्वभाव के; लोगों से आसानी से जुड़ते हैं और आगे की सोचते हैं।'],
  'slant:upright': ['सीधा खड़ा', 'दिल से ज़्यादा दिमाग़ से फ़ैसले लेते हैं; संतुलित और आत्मनिर्भर।'],
  'slant:left': ['बाईं ओर झुका', 'अपनी बातें मन में रखते हैं; कभी-कभी बीती बातों में उलझे रहते हैं।', 'अक्षरों को थोड़ा-सा दाईं ओर झुकाएँ, इससे बातचीत और अवसर खुलते हैं।'],
  'slant:mixed': ['मिला-जुला झुकाव', 'कई तरह के काम कर लेते हैं, पर प्रतिक्रिया का अंदाज़ा लगाना दूसरों के लिए कठिन होता है।', 'एक ही झुकाव रखें, बेहतर है हल्का दाईं ओर।'],
  'size:large': ['बड़ा', 'आत्मविश्वास और पहचान पाने की इच्छा।'],
  'size:medium': ['मध्यम', 'संतुलित सोच और हालात के अनुसार ढल जाने की क्षमता।'],
  'size:small': ['छोटा / दबा हुआ', 'विनम्र और बारीकी से काम करने वाले; पर कभी-कभी ख़ुद को पीछे रखते हैं।', 'हस्ताक्षर थोड़ा बड़ा करें, ख़ासकर पहला अक्षर।'],
  'first:bold': ['बड़ा और साफ़', 'अच्छा आत्मसम्मान और पहल करने की शक्ति। साफ़ पहला अक्षर नाम के अंक को मज़बूत करता है।'],
  'first:proportionate': ['बाक़ी अक्षरों जैसा', 'अपने बारे में संतुलित और सही सोच।'],
  'first:small': ['छोटा या अस्पष्ट', 'अपनी काबिलियत को कम आँकते हैं; मेहनत का पूरा श्रेय नहीं मिल पाता।', 'नाम का पहला अक्षर बड़ा और साफ़ लिखें।'],
  'legibility:clear': ['साफ़ पढ़ने योग्य', 'खुला और सीधा स्वभाव; बात साफ़-साफ़ कहते हैं।'],
  'legibility:partial': ['आंशिक रूप से पढ़ने योग्य', 'सोच-समझकर बातें साझा करते हैं; निजता पसंद है।'],
  'legibility:illegible': ['पढ़ने में नहीं आता', 'जल्दबाज़ी या निजता; लोग आपके इरादों को ग़लत समझ सकते हैं।', 'कम से कम पहला नाम या आद्याक्षर पढ़ने योग्य रखें।'],
  'pressure:heavy': ['भारी', 'मज़बूत इच्छाशक्ति और ऊर्जा; कभी-कभी तनाव भी दिखाता है।'],
  'pressure:medium': ['मध्यम', 'अच्छी ऊर्जा और संतुलित प्रतिक्रिया।'],
  'pressure:light': ['हल्का', 'संवेदनशील और कोमल स्वभाव; ऊर्जा बढ़ाने की ज़रूरत हो सकती है।'],
  'underline:none': ['कोई रेखा नहीं', 'आपका काम ख़ुद बोलता है; दिखावे की ज़रूरत नहीं।'],
  'underline:single': ['एक साफ़ रेखा', 'आत्मविश्वास और मज़बूत सहारा।'],
  'underline:double': ['दोहरी या मोटी रेखा', 'पहचान और सुरक्षा की गहरी इच्छा।'],
  'underline:through': ['रेखा नाम को काटती है', 'परंपरा में इसे शुभ नहीं माना जाता: ख़ुद की आलोचना या अपनी ही तरक्की रोकना।', 'रेखा हमेशा नाम के नीचे रखें; कोई लाइन अक्षरों को न काटे।'],
  'ending:upward': ['अंत ऊपर की ओर', 'महत्वाकांक्षा और भविष्य से अच्छी उम्मीद।'],
  'ending:flat': ['अंत सीधा', 'शांत रहकर काम पूरा करते हैं।'],
  'ending:downward': ['अंत नीचे की ओर / पीछे मुड़ता', 'काम पूरा करते-करते थकान या शंका; परंपरा में गिरता अंत ठीक नहीं माना जाता।', 'हस्ताक्षर को हल्के ऊपर उठते स्ट्रोक से ख़त्म करें।'],
  'dots:none': ['कोई नहीं', 'खुला और सहज स्वभाव।'],
  'dots:end': ['अंत में पूर्ण विराम', 'सावधान स्वभाव, बातचीत जल्दी ख़त्म कर देते हैं; परंपरा में यह प्रवाह रोकता माना जाता है।', 'हस्ताक्षर के बाद पूर्ण विराम (बिंदु) न लगाएँ।'],
  'dots:two': ['नीचे दो बिंदु', 'भारतीय हस्ताक्षर सुधार में इसे सहारा देने वाला शुभ चिह्न माना जाता है।'],
  'spacing:connected': ['जुड़ा हुआ / बहता', 'सोच में तालमेल और काम को अंत तक पहुँचाने की आदत।'],
  'spacing:gaps': ['शब्दों के बीच साफ़ जगह', 'स्वतंत्र सोच और साफ़ सीमाएँ।'],
  'spacing:overlap': ['एक-दूसरे पर चढ़ा / भीड़ भरा', 'ज़रूरत से ज़्यादा ज़िम्मेदारियाँ ले लेना; काम और घर को अलग रखना कठिन।', 'पहले नाम और उपनाम के बीच थोड़ी बराबर जगह छोड़ें।'],
  'enclosure:open': ['खुला (कोई घेरा नहीं)', 'लोगों, विचारों और अवसरों के लिए खुले हैं।'],
  'enclosure:circled': ['घेरे या लूप में बंद', 'ख़ुद को बचाकर रखते हैं; परंपरा में माना जाता है कि घेरा अवसरों और सहारे को बाहर रोकता है।', 'हस्ताक्षर के चारों ओर घेरा या लूप न बनाएँ – उसे हर तरफ़ से खुला रखें।'],
};

const PERSONALITY_HI: Record<string, Record<string, string>> = {
  baseline: { rising: 'आशावादी और महत्वाकांक्षी – आगे की सोचते हैं और तरक्की के लिए मेहनत करते हैं।', straight: 'स्थिर और व्यावहारिक – काम में भावनाओं पर काबू रखते हैं।', falling: 'अभी थकान या दबाव महसूस कर रहे हो सकते हैं; आराम और हौसले की ज़रूरत है।', wavy: 'मन और ऊर्जा रोज़ बदल सकती है; नियमित दिनचर्या से लाभ होगा।' },
  slant: { right: 'मिलनसार और खुले – लोगों से आसानी से जुड़ते हैं।', upright: 'संतुलित और आत्मनिर्भर – अक्सर दिमाग़ से फ़ैसला लेते हैं।', left: 'संकोची और निजी – भावनाएँ मन में रखते हैं।', mixed: 'कई काम कर लेते हैं, पर आपकी प्रतिक्रिया का अंदाज़ा लगाना कठिन होता है।' },
  first: { bold: 'अच्छा आत्मसम्मान और पहल करने की आदत।', proportionate: 'अपने बारे में संतुलित सोच।', small: 'अपनी उपलब्धियों को कम आँकते हैं।' },
  legibility: { clear: 'बातचीत में खुले और सीधे।', partial: 'सोच-समझकर बात साझा करते हैं और निजता पसंद करते हैं।', illegible: 'व्यस्त और निजी – लोग आपके इरादे ग़लत समझ सकते हैं।' },
  underline: { single: 'आत्मविश्वासी और मज़बूत आधार वाले।', double: 'पहचान और सुरक्षा चाहते हैं।', through: 'ख़ुद की बहुत आलोचना करते हैं और अपनी ही तरक्की रोक सकते हैं।' },
  ending: { upward: 'आशा और महत्वाकांक्षा के साथ काम पूरा करते हैं।', downward: 'काम के अंत तक थक जाते हैं या शंका में रहते हैं।' },
  enclosure: { circled: 'सतर्क रहते हैं – लोगों और प्रस्तावों को दूर रखते हैं।' },
};

const FIX_TITLE_HI: Record<string, string> = {
  'baseline:falling': 'हस्ताक्षर को ऊपर उठाएँ', 'baseline:wavy': 'हस्ताक्षर की लाइन सीधी करें', 'slant:left': 'अक्षरों को हल्का आगे झुकाएँ', 'slant:mixed': 'एक ही झुकाव रखें',
  size: 'थोड़ा बड़ा लिखें', first: 'पहला अक्षर बड़ा करें', legibility: 'नाम पढ़ने योग्य रखें', 'underline:through': 'नाम काटने वाली लाइन हटाएँ',
  ending: 'अंत ऊपर उठते स्ट्रोक से करें', dots: 'पूर्ण विराम हटाएँ', spacing: 'नाम के हिस्सों में बराबर जगह दें', enclosure: 'घेरा हटाएँ',
};

const REL_HI: Record<string, string> = { friend: 'मित्र (साथ देता है)', neutral: 'सम (न साथ, न विरोध)', enemy: 'विरोधी (साथ नहीं देता)' };
const DAY_HI: Record<string, string> = { Sunday: 'रविवार', Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार', Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार' };
const CAT_HI: Record<string, string> = { favourable: 'शुभ', unfavourable: 'कम शुभ', mixed: 'मिला-जुला' };

export const relHi = (r: string) => REL_HI[r] ?? r;
export const dayHi = (d: string) => DAY_HI[d] ?? tr('hi', d);
export const catHi = (c: string) => CAT_HI[c] ?? c;

interface FeatureLike { id: string; option: string; feature: string; label: string; meaning: string; fix?: string; impact: 'positive' | 'neutral' | 'watch'; value?: string }

/** The same feature, with Hindi name, label, meaning and fix. */
export function featureHi<T extends FeatureLike>(f: T): T {
  const o = OPTION_HI[`${f.id}:${f.option}`];
  return { ...f, feature: FEATURE_NAME_HI[f.id] ?? f.feature, label: o?.[0] ?? f.label, meaning: o?.[1] ?? f.meaning, fix: o?.[2] ?? f.fix };
}

export interface HiAnalysisParts {
  headline: string; summary: string; personality: string[]; fixTitle: (id: string, option: string) => string;
  signAs: (best: string, cur: string, b: string) => { title: string; detail: string }; adjustName: string; firstLetter: string; keep: { title: string; detail: string };
  careerFit: string; careerAdvice: string; steps: string[]; do: string[]; dont: string[]; startDay: (dates: string[]) => string; ink: string; practice: string; closing: string; noFeatures: { feature: string; observed: string; meaning: string };
}

/** All Hindi sentences for the built-in analyst – short, simple and with each term explained once. */
export function hindiParts(name: string, n: SignatureNumbers, total: number, counts: { positive: number; neutral: number; watch: number; all: number }, features: FeatureLike[]): HiAnalysisParts {
  const planet = tr('hi', n.planet.name);
  const signText = n.signName.text;
  return {
    headline: total >= 75 ? 'अच्छा हस्ताक्षर – बस छोटे सुधार चाहिए' : total >= 55 ? 'ठीक-ठाक हस्ताक्षर – इसे और मज़बूत किया जा सकता है' : 'हस्ताक्षर में सुधार ज़रूरी है ताकि यह आपके लक्ष्यों का साथ दे',
    summary: `${name} जी, आपका भाग्यांक (पूरी जन्म तिथि का जोड़) ${n.bhagyank} है, जिसका ग्रह ${planet} है। आपका मूलांक (जन्म की तारीख़ का अंक) ${n.moolank} है। आप हस्ताक्षर में "${signText}" लिखते हैं, जिसका अंक ${n.signName.single} आता है। यह अंक आपके भाग्यांक का ${relHi(n.signToBhagyank)} है। ${counts.all ? `आपके हस्ताक्षर की ${counts.all} बातें देखी गईं: ${counts.positive} अच्छी हैं, ${counts.neutral} सामान्य हैं और ${counts.watch} में सुधार चाहिए।` : ''}`,
    personality: [`भाग्यांक ${n.bhagyank} (${planet}) जीवन की मुख्य दिशा तय करता है; मूलांक ${n.moolank} (${tr('hi', n.moolankPlanet.name)}) रोज़ के स्वभाव को दिखाता है।`,
      ...features.map((f) => PERSONALITY_HI[f.id]?.[f.option]).filter((x): x is string => !!x)].slice(0, 7),
    fixTitle: (id, option) => FIX_TITLE_HI[`${id}:${option}`] ?? FIX_TITLE_HI[id] ?? `${FEATURE_NAME_HI[id] ?? id} सुधारें`,
    signAs: (best, cur, b) => ({ title: `हस्ताक्षर में "${best}" लिखें`, detail: `अभी आपके हस्ताक्षर-नाम का अंक ${cur} है। "${best}" लिखने पर अंक ${b} आता है, जो आपके भाग्यांक ${n.bhagyank} के साथ बेहतर मेल खाता है।` }),
    adjustName: `आपके हस्ताक्षर-नाम का अंक ${n.signName.single} आपके भाग्यांक ${n.bhagyank} का साथ नहीं देता। नाम का ऐसा रूप लिखें जिसका अंक ${n.friendly.join(', ')} में से हो – आचार्य जी सही वर्तनी बता सकते हैं।`,
    firstLetter: `"${n.firstLetter.letter}" का अंक ${n.firstLetter.value} है (${tr('hi', n.firstLetter.planet)})। इसे साफ़ और बाक़ी अक्षरों से लगभग डेढ़ गुना बड़ा लिखें।`,
    keep: { title: 'अच्छी बातें बनाए रखें', detail: 'हस्ताक्षर को ऊपर उठता हुआ, पढ़ने योग्य और बिना कटी लाइन के रखें।' },
    careerFit: `आपके काम (${professionHi(n.profession.label)}) के लिए आपके अंकों का मेल ${n.profession.fitScore}/100 है।`,
    careerAdvice: `${planet} ग्रह परंपरागत रूप से इन कामों में साथ देता है: ${n.planet.careers.map((c) => tr('hi', c)).join(', ')}।`,
    steps: [
      `हस्ताक्षर में "${n.bestOption ? n.bestOption.text : signText}" लिखें और पहला अक्षर "${n.firstLetter.letter}" साफ़ व थोड़ा बड़ा रखें।`,
      'हस्ताक्षर बाएँ से दाएँ हल्का-सा ऊपर उठता हुआ रखें (लगभग 10–15°)।',
      'नाम पढ़ने योग्य रखें; कोई लाइन नाम को न काटे।',
      'अंत में हल्का ऊपर उठता स्ट्रोक बनाएँ; ज़रूरत हो तो नाम के नीचे एक साफ़ रेखा दें।',
    ],
    do: ['ऊपर उठता हस्ताक्षर', 'साफ़ और बड़ा पहला अक्षर', 'हल्का दाईं ओर झुकाव', 'अंत में ऊपर उठता स्ट्रोक', 'हर दस्तावेज़ पर एक जैसा हस्ताक्षर'],
    dont: ['नाम के बाद पूर्ण विराम', 'अक्षरों को काटती लाइन', 'हस्ताक्षर के चारों ओर घेरा', 'नीचे गिरता अंत', 'हस्ताक्षर पर दोबारा लिखना'],
    startDay: (dates) => `${dayHi(n.planet.weekday)} (${planet} का दिन)${dates.length ? ` – सुझाई गई तारीखें: ${dates.join(', ')}` : ''}`,
    ink: `सरकारी दस्तावेज़ों के लिए नीला या काला; निजी पेन के लिए आपके शुभ रंग: ${n.planet.colours.slice(0, 2).map((c) => tr('hi', c)).join(' / ')}।`,
    practice: 'परंपरा के अनुसार नया हस्ताक्षर रोज़ अभ्यास करें (जैसे 21 दिन तक रोज़ 108 बार), जब तक वह सहज न हो जाए। फिर सभी नए दस्तावेज़ों पर उसी का उपयोग करें।',
    closing: 'हस्ताक्षर रोज़ का एक संकल्प है – छोटे और लगातार सुधार इसे आपके लक्ष्यों का साथी बनाते हैं।',
    noFeatures: { feature: 'हस्ताक्षर की विशेषताएँ', observed: 'नहीं दी गईं', meaning: 'झुकाव, दिशा, आकार और स्ट्रोक देखने के लिए हस्ताक्षर की फ़ोटो दें।' },
  };
}

/** Simple-Hindi keywords for Chaldean compound numbers 10–52 (same tradition as COMPOUND_KEYWORDS). */
const COMPOUND_HI: Record<number, string> = {
  10: 'भाग्य का पहिया – उन्नति और पहचान', 11: 'छिपी परीक्षाएँ – सावधानी और विश्वास रखें', 12: 'त्याग – आपकी मेहनत का लाभ दूसरे उठा सकते हैं', 13: 'बदलाव – जीवन में परिवर्तन',
  14: 'व्यापार और गति – जल्दबाज़ी में जोखिम', 15: 'आकर्षण और मीठी वाणी – मदद और धन मिलता है', 16: 'अचानक रुकावट – सोच-समझकर योजना बनाएँ', 17: 'शुभ तारा – शांति, यश और स्थायी नाम',
  18: 'भौतिक संघर्ष – झगड़े और धोखे से बचें', 19: 'स्वर्ग का राजकुमार – सफलता, सम्मान और ख़ुशी', 20: 'जागृति – नया उद्देश्य, भौतिक कामों में देरी', 21: 'विजय का मुकुट – मेहनत के बाद तरक्की',
  22: 'भ्रम – ग़लत भरोसे से बचें, सोच साफ़ रखें', 23: 'सिंह का तारा – बड़ों से मदद और सफलता', 24: 'प्रेम और कृपा – साथियों और संरक्षकों से लाभ', 25: 'अनुभव से शक्ति – कठिनाइयों के बाद सफलता',
  26: 'साझेदारी में सावधानी – दूसरों के कारण नुकसान', 27: 'राजदंड – अधिकार और रचनात्मक नेतृत्व', 28: 'विरोधाभास – लाभ मिलकर खो सकता है, सुरक्षा रखें', 29: 'अनिश्चितता – रिश्तों में धोखा और परीक्षा',
  30: 'गहरी सोच – मानसिक शक्ति, पर अकेलापन', 31: 'एकांतप्रिय – अपने में रहने वाले', 32: 'शब्दों का जादू – लोकप्रियता और अच्छी बातचीत', 33: 'प्रेम और कृपा (24 जैसा)',
  34: 'अनुभव से शक्ति (25 जैसा)', 35: 'साझेदारी में सावधानी (26 जैसा)', 36: 'राजदंड (27 जैसा)', 37: 'प्रेम और साझेदारी में सौभाग्य',
  38: 'अनिश्चितता (29 जैसा)', 39: 'गहरी सोच पर अकेलापन (30 जैसा)', 40: 'एकांतप्रिय (31 जैसा)', 41: 'शब्दों का जादू (32 जैसा)', 42: 'प्रेम और कृपा (24 जैसा)', 43: 'उथल-पुथल – अस्थिर हालात',
  44: 'साझेदारी में सावधानी (26 जैसा)', 45: 'राजदंड (27 जैसा)', 46: 'साझेदारी में सौभाग्य (37 जैसा)', 47: 'अनिश्चितता (29 जैसा)', 48: 'गहरी सोच पर अकेलापन (30 जैसा)', 49: 'एकांतप्रिय (31 जैसा)',
  50: 'शब्दों का जादू (32 जैसा)', 51: 'योद्धा – अचानक उन्नति और शक्ति, विरोधियों से सावधान', 52: 'उथल-पुथल (43 जैसा)',
};
export function compoundMeaningHi(n: number): string {
  let c = n; while (c > 52) c = String(c).split('').reduce((a, b) => a + +b, 0);
  if (c < 10) return `मूल अंक ${c}`;
  return COMPOUND_HI[c] ?? '';
}

const OPTION_LABEL_HI: Record<string, string> = {
  'Current signature': 'अभी का हस्ताक्षर', 'Full name': 'पूरा नाम', 'First name + surname': 'पहला नाम + उपनाम', 'First name + surname initial': 'पहला नाम + उपनाम का पहला अक्षर',
  'First name only': 'केवल पहला नाम', 'Initial + surname': 'पहला अक्षर + उपनाम', 'Initials + surname': 'आद्याक्षर + उपनाम', 'Initials only': 'केवल आद्याक्षर', 'Middle initial': 'बीच के नाम का पहला अक्षर', 'Surname only': 'केवल उपनाम',
};
export const optionLabelHi = (s: string) => OPTION_LABEL_HI[s] ?? s;

const PROFESSION_HI: Record<string, string> = {
  'Business / Trading': 'व्यवसाय / व्यापार', 'Government service / Administration': 'सरकारी नौकरी / प्रशासन', 'IT / Software / Engineering': 'आईटी / सॉफ़्टवेयर / इंजीनियरिंग', 'Finance / Banking / CA': 'वित्त / बैंकिंग / सीए',
  'Law / Judiciary': 'क़ानून / न्यायपालिका', 'Medicine / Healthcare': 'चिकित्सा / स्वास्थ्य सेवा', 'Teaching / Education / Coaching': 'शिक्षण / शिक्षा / कोचिंग', 'Media / Marketing / Sales': 'मीडिया / मार्केटिंग / सेल्स',
  'Arts / Design / Fashion / Film': 'कला / डिज़ाइन / फ़ैशन / फ़िल्म', 'Real Estate / Construction': 'रियल एस्टेट / निर्माण', 'Defence / Police / Sports': 'रक्षा / पुलिस / खेल', 'Spiritual / Healing / Research': 'आध्यात्म / उपचार / शोध',
  'Hospitality / Food / Beauty': 'होटल / खान-पान / ब्यूटी', 'Politics / Public life': 'राजनीति / सार्वजनिक जीवन', Student: 'विद्यार्थी', Homemaker: 'गृहिणी', Other: 'अन्य',
};
export const professionHi = (s: string) => PROFESSION_HI[s] ?? s;
