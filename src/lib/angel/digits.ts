/** Core meaning of each digit 0–9 as used in angel-number interpretation, blended with Indian (Vedic) numerology. */
export interface DigitMeaning {
  d: number;
  word: string; // one-word theme
  keywords: string[];
  planet: string; // Vedic ruler (0 has none)
  core: string; // what the digit carries
  spiritual: string;
  love: string;
  career: string;
  twin: string;
  caution: string;
  action: string;
  hiWord: string;
  hiCore: string;
}

export const DIGITS: DigitMeaning[] = [
  {
    d: 0, word: 'Wholeness', keywords: ['potential', 'new cycle', 'divine connection', 'infinity'], planet: 'None (pure potential)',
    core: 'Zero is the circle with no beginning and no end. It stands for pure potential, the start of a fresh cycle and your link with the divine source. It also amplifies every digit standing beside it.',
    spiritual: 'a reminder to slow down, pray or meditate and listen to your inner guidance before you choose a direction',
    love: 'a clean slate: old patterns can end and a more honest bond can begin',
    career: 'a blank page at work, ideal for planning, learning and choosing what you really want to build',
    twin: 'the soul connection itself, the sense that two people come from one source',
    caution: 'drifting without a plan because everything feels possible',
    action: 'Spend a few quiet minutes each day in prayer, meditation or journaling.',
    hiWord: 'पूर्णता', hiCore: 'शून्य अनंत संभावना, नई शुरुआत और ईश्वर से जुड़ाव का प्रतीक है।',
  },
  {
    d: 1, word: 'New beginnings', keywords: ['leadership', 'fresh start', 'manifestation', 'self-belief'], planet: 'Sun (Surya)',
    core: 'One is the number of the Sun: initiative, independence, confidence and new beginnings. In angel-number tradition it is the classic manifestation digit, because thoughts are said to take shape quickly when 1 appears.',
    spiritual: 'a sign that your thoughts are seeds, so keep them positive and focused on what you want rather than what you fear',
    love: 'a fresh start, self-respect and the courage to take the first step',
    career: 'leadership, a new project, a job change or starting your own work',
    twin: 'the moment of awakening, when you first recognise a deep connection',
    caution: 'ego, impatience or trying to do everything alone',
    action: 'Write down one clear intention and take one small step towards it today.',
    hiWord: 'नई शुरुआत', hiCore: 'अंक 1 सूर्य का अंक है – नेतृत्व, आत्मविश्वास और नई शुरुआत।',
  },
  {
    d: 2, word: 'Balance', keywords: ['harmony', 'partnership', 'trust', 'patience'], planet: 'Moon (Chandra)',
    core: 'Two belongs to the Moon: emotion, intuition, cooperation and partnership. It asks for patience and trust, and it says that things are coming together even if you cannot yet see it.',
    spiritual: 'a call to trust the timing of your life and keep faith while things are still growing quietly',
    love: 'harmony, commitment and give-and-take in a relationship',
    career: 'teamwork, partnerships, diplomacy and patience with results',
    twin: 'union and mirroring, the two halves learning to balance each other',
    caution: 'over-sensitivity, people-pleasing or indecision',
    action: 'Choose patience over pressure in one situation today and listen more than you speak.',
    hiWord: 'संतुलन', hiCore: 'अंक 2 चंद्रमा का अंक है – भावना, साझेदारी, धैर्य और विश्वास।',
  },
  {
    d: 3, word: 'Growth', keywords: ['creativity', 'expression', 'joy', 'divine support'], planet: 'Jupiter (Guru)',
    core: 'Three is ruled by Jupiter, the Guru: wisdom, growth, creativity and joyful self-expression. In angel-number tradition it also signals that your guides and teachers are near.',
    spiritual: 'reassurance that you are supported and that your prayers are heard',
    love: 'warmth, fun, open communication and growth together',
    career: 'teaching, creative work, communication, and expansion through learning',
    twin: 'growth through honest expression of feelings',
    caution: 'scattered energy or saying yes to too many things',
    action: 'Express yourself: speak, write, create or teach something you know.',
    hiWord: 'विकास', hiCore: 'अंक 3 गुरु (बृहस्पति) का अंक है – ज्ञान, विकास, रचनात्मकता और आशीर्वाद।',
  },
  {
    d: 4, word: 'Stability', keywords: ['foundation', 'discipline', 'protection', 'hard work'], planet: 'Rahu',
    core: 'Four is the number of foundations: discipline, order, hard work and steady progress. Western angel-number writers link it with protection; in Indian numerology it is ruled by Rahu, which rewards structure and punishes shortcuts.',
    spiritual: 'a sign that you are protected and that steady effort is building something lasting',
    love: 'loyalty, security and building a stable home',
    career: 'systems, planning, property, engineering and patient hard work',
    twin: 'building a grounded, practical base before union',
    caution: 'rigidity, stress or sudden unexpected changes',
    action: 'Organise one area of your life: your schedule, finances or workspace.',
    hiWord: 'स्थिरता', hiCore: 'अंक 4 राहु का अंक है – मेहनत, अनुशासन, सुरक्षा और मज़बूत नींव।',
  },
  {
    d: 5, word: 'Change', keywords: ['freedom', 'transformation', 'adventure', 'adaptability'], planet: 'Mercury (Budh)',
    core: 'Five belongs to Mercury: movement, communication, travel, business and change. It says a shift is on its way and asks you to stay flexible so the change can work in your favour.',
    spiritual: 'encouragement to release what no longer fits and welcome transformation',
    love: 'change in love: a new person, a new phase, or more freedom and fun in a current bond',
    career: 'business, sales, travel, media and new opportunities that need quick decisions',
    twin: 'shifts and movement, often after a period of separation',
    caution: 'restlessness, impulsive choices or overindulgence',
    action: 'Say yes to one healthy change and let go of one habit that holds you back.',
    hiWord: 'परिवर्तन', hiCore: 'अंक 5 बुध का अंक है – बदलाव, स्वतंत्रता, व्यापार और यात्रा।',
  },
  {
    d: 6, word: 'Love and home', keywords: ['family', 'care', 'responsibility', 'beauty'], planet: 'Venus (Shukra)',
    core: 'Six is ruled by Venus: love, beauty, family, comfort and responsibility. It asks you to balance material worries with care for yourself and the people you love.',
    spiritual: 'a call to put care and gratitude before worry, especially about money',
    love: 'nurturing love, family, marriage and caring for one another',
    career: 'design, arts, hospitality, healing and service-oriented work',
    twin: 'unconditional love and healing old wounds',
    caution: 'worrying about material things or carrying everyone else\'s burdens',
    action: 'Do one caring thing for yourself and one for your family today.',
    hiWord: 'प्रेम और परिवार', hiCore: 'अंक 6 शुक्र का अंक है – प्रेम, सुंदरता, परिवार और ज़िम्मेदारी।',
  },
  {
    d: 7, word: 'Inner wisdom', keywords: ['spiritual awakening', 'intuition', 'study', 'luck'], planet: 'Ketu',
    core: 'Seven is the number of inner wisdom: study, intuition, faith and spiritual awakening. It is ruled by Ketu in Indian numerology and is widely seen as a lucky, blessed number.',
    spiritual: 'confirmation that you are on the right spiritual path and that inner study is paying off',
    love: 'a deep, soulful connection, and time alone to understand what you need',
    career: 'research, analysis, teaching, healing, spiritual and technical expertise',
    twin: 'a spiritual bond that grows through inner work',
    caution: 'isolation, overthinking or doubting your intuition',
    action: 'Make time for quiet study, meditation or a walk alone.',
    hiWord: 'आंतरिक ज्ञान', hiCore: 'अंक 7 केतु का अंक है – अंतर्ज्ञान, अध्यात्म, अध्ययन और भाग्य।',
  },
  {
    d: 8, word: 'Abundance', keywords: ['prosperity', 'karma', 'power', 'success'], planet: 'Saturn (Shani)',
    core: 'Eight is the number of abundance, authority and karma. Ruled by Saturn (Shani) in Indian numerology, it rewards honest, consistent work: what you give comes back to you.',
    spiritual: 'a reminder of karma: steady, honest effort is being recorded and will be returned',
    love: 'mature, committed love and balance between giving and receiving',
    career: 'finance, management, law, property and long-term success through discipline',
    twin: 'karmic connection and lessons that lead to balance',
    caution: 'workaholism, control or delays that test your patience',
    action: 'Review your finances and keep one promise you made to yourself.',
    hiWord: 'समृद्धि', hiCore: 'अंक 8 शनि का अंक है – कर्म, धन, अनुशासन और सफलता।',
  },
  {
    d: 9, word: 'Completion', keywords: ['endings', 'compassion', 'service', 'wisdom'], planet: 'Mars (Mangal)',
    core: 'Nine is the last single digit, so it marks completion: the end of one chapter and the wisdom gained from it. Ruled by Mars, it also carries courage, compassion and service to others.',
    spiritual: 'a sign that a chapter is closing so that a higher purpose can begin',
    love: 'release, forgiveness and compassionate love',
    career: 'service, healing, defence, social work and finishing what you started',
    twin: 'completing a karmic cycle before a new stage',
    caution: 'holding on to the past or anger about how something ended',
    action: 'Finish one pending task and forgive one old hurt.',
    hiWord: 'पूर्णता और सेवा', hiCore: 'अंक 9 मंगल का अंक है – साहस, सेवा, करुणा और एक अध्याय की समाप्ति।',
  },
];

export const MASTER: Record<number, { title: string; text: string }> = {
  11: { title: 'Master number 11 – the intuitive messenger', text: 'Eleven is the first master number. It doubles the energy of 1 and adds the sensitivity of 2, so it is linked with intuition, inspiration and spiritual awakening.' },
  22: { title: 'Master number 22 – the master builder', text: 'Twenty-two is called the master builder. It joins the vision of 11 with the practical power of 4, turning big dreams into real, lasting results.' },
  33: { title: 'Master number 33 – the master teacher', text: 'Thirty-three is the master teacher. It combines creative 3 with compassionate 6 and is linked with healing, guidance and selfless service.' },
};
