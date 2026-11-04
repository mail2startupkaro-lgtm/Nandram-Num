/** Short default traits per number (seed for the knowledge base; full narrative comes in Phase 3). */
import type { Lang } from './dictionary';

export const NUMBER_TRAITS: Record<Lang, Record<number, { keyword: string; plus: string; minus: string }>> = {
  en: {
    1: { keyword: 'Leadership', plus: 'Confident, original, self-driven', minus: 'Ego, impatience, going it alone' },
    2: { keyword: 'Sensitivity', plus: 'Caring, intuitive, diplomatic', minus: 'Mood swings, over-thinking' },
    3: { keyword: 'Wisdom', plus: 'Knowledgeable, guiding, optimistic', minus: 'Preachy, scattered effort' },
    4: { keyword: 'Discipline', plus: 'Hard-working, practical, systematic', minus: 'Sudden ups and downs, rigidity' },
    5: { keyword: 'Balance', plus: 'Smart, communicative, business-minded', minus: 'Restlessness, nervous energy' },
    6: { keyword: 'Harmony', plus: 'Loving, creative, family-oriented', minus: 'Over-attachment, indulgence' },
    7: { keyword: 'Insight', plus: 'Spiritual, analytical, research-minded', minus: 'Detachment, secrecy' },
    8: { keyword: 'Karma', plus: 'Patient, ambitious, builds wealth slowly', minus: 'Delays, heavy responsibilities' },
    9: { keyword: 'Energy', plus: 'Courageous, generous, humanitarian', minus: 'Anger, impulsiveness' },
  },
  hi: {
    1: { keyword: 'नेतृत्व', plus: 'आत्मविश्वासी, मौलिक, स्वप्रेरित', minus: 'अहंकार, अधीरता' },
    2: { keyword: 'संवेदनशीलता', plus: 'देखभाल करने वाले, अंतर्ज्ञानी', minus: 'मनोदशा में बदलाव, अधिक सोचना' },
    3: { keyword: 'ज्ञान', plus: 'ज्ञानी, मार्गदर्शक, आशावादी', minus: 'उपदेशात्मक, बिखरा प्रयास' },
    4: { keyword: 'अनुशासन', plus: 'मेहनती, व्यावहारिक', minus: 'अचानक उतार-चढ़ाव, कठोरता' },
    5: { keyword: 'संतुलन', plus: 'चतुर, संवादी, व्यापारिक सोच', minus: 'बेचैनी' },
    6: { keyword: 'सामंजस्य', plus: 'प्रेमपूर्ण, रचनात्मक, पारिवारिक', minus: 'अधिक लगाव, भोग' },
    7: { keyword: 'अंतर्दृष्टि', plus: 'आध्यात्मिक, विश्लेषणात्मक', minus: 'अलगाव, गोपनीयता' },
    8: { keyword: 'कर्म', plus: 'धैर्यवान, महत्वाकांक्षी', minus: 'विलंब, भारी ज़िम्मेदारियाँ' },
    9: { keyword: 'ऊर्जा', plus: 'साहसी, उदार, मानवतावादी', minus: 'क्रोध, आवेग' },
  },
};

export const PY_THEMES: Record<Lang, Record<number, string>> = {
  en: { 1: 'New beginnings', 2: 'Partnerships & patience', 3: 'Expansion & expression', 4: 'Hard work & foundations', 5: 'Change & travel', 6: 'Family & responsibility', 7: 'Reflection & learning', 8: 'Money & power', 9: 'Completion & release' },
  hi: { 1: 'नई शुरुआत', 2: 'साझेदारी और धैर्य', 3: 'विस्तार और अभिव्यक्ति', 4: 'मेहनत और नींव', 5: 'परिवर्तन और यात्रा', 6: 'परिवार और ज़िम्मेदारी', 7: 'चिंतन और सीख', 8: 'धन और शक्ति', 9: 'समापन और मुक्ति' },
};
