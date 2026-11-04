/**
 * Planet data for numbers 1–9 (Indian / Vedic numerology).
 * Default values – overridable from the admin knowledge base in a later phase.
 */

export type PlanetId = 'sun' | 'moon' | 'jupiter' | 'rahu' | 'mercury' | 'venus' | 'ketu' | 'saturn' | 'mars';

export interface PlanetInfo {
  id: PlanetId;
  number: number;
  name: string;
  hindiName: string;
  devanagari: string;
  element: string;
  weekday: string;
  weekdayHindi: string;
  colours: string[];
  gemstone: {
    name: string;
    hindi: string;
    alternatives: string[];
    metal: string;
    finger: string;
    caution: string;
  };
  mantra: { beej: string; dailyCount: number; japaTotal: number };
  deity: string;
  daan: string[];
  fastingDay: string;
  rudraksha: string;
  careers: string[];
  signatureTip: string;
}

const STD_CAUTION = 'Consult a qualified astrologer/numerologist before wearing any gemstone.';
const STRONG_CAUTION =
  'Powerful stone – wear only after a trial period and a full chart check by a qualified expert.';

export const NUMBER_PLANET: Record<number, PlanetId> = {
  1: 'sun', 2: 'moon', 3: 'jupiter', 4: 'rahu', 5: 'mercury', 6: 'venus', 7: 'ketu', 8: 'saturn', 9: 'mars',
};

export const PLANETS: Record<PlanetId, PlanetInfo> = {
  sun: {
    id: 'sun', number: 1, name: 'Sun', hindiName: 'Surya', devanagari: 'सूर्य', element: 'Fire',
    weekday: 'Sunday', weekdayHindi: 'Ravivar', colours: ['Golden', 'Orange', 'Saffron', 'Yellow'],
    gemstone: { name: 'Ruby', hindi: 'Manik', alternatives: ['Red Garnet', 'Sunstone'], metal: 'Gold / Copper', finger: 'Ring finger', caution: STD_CAUTION },
    mantra: { beej: 'Om Hraam Hreem Hraum Sah Suryaya Namah', dailyCount: 108, japaTotal: 7000 },
    deity: 'Surya Dev (offer Arghya at sunrise)', daan: ['Wheat', 'Jaggery (gud)', 'Copper vessel', 'Red cloth'],
    fastingDay: 'Sunday', rudraksha: '1 or 12 Mukhi',
    careers: ['Government service', 'Administration', 'Leadership roles', 'Politics', 'Medicine'],
    signatureTip: 'Start with a bold, clear first letter; keep the signature rising upward.',
  },
  moon: {
    id: 'moon', number: 2, name: 'Moon', hindiName: 'Chandra', devanagari: 'चंद्र', element: 'Water',
    weekday: 'Monday', weekdayHindi: 'Somvar', colours: ['White', 'Cream', 'Silver', 'Light green'],
    gemstone: { name: 'Pearl', hindi: 'Moti', alternatives: ['Moonstone'], metal: 'Silver', finger: 'Little finger', caution: STD_CAUTION },
    mantra: { beej: 'Om Shraam Shreem Shraum Sah Chandramase Namah', dailyCount: 108, japaTotal: 11000 },
    deity: 'Lord Shiva', daan: ['Rice', 'Milk', 'White cloth', 'Sugar'],
    fastingDay: 'Monday', rudraksha: '2 Mukhi',
    careers: ['Hospitality', 'Nursing & care', 'Dairy / liquids business', 'Creative arts', 'Counselling'],
    signatureTip: 'Use smooth, flowing strokes; avoid sharp cuts through your name.',
  },
  jupiter: {
    id: 'jupiter', number: 3, name: 'Jupiter', hindiName: 'Guru (Brihaspati)', devanagari: 'गुरु', element: 'Ether',
    weekday: 'Thursday', weekdayHindi: 'Guruvar', colours: ['Yellow', 'Saffron', 'Light orange'],
    gemstone: { name: 'Yellow Sapphire', hindi: 'Pukhraj', alternatives: ['Yellow Topaz', 'Citrine'], metal: 'Gold', finger: 'Index finger', caution: STD_CAUTION },
    mantra: { beej: 'Om Graam Greem Graum Sah Gurave Namah', dailyCount: 108, japaTotal: 19000 },
    deity: 'Lord Vishnu / Brihaspati Dev', daan: ['Chana dal', 'Turmeric (haldi)', 'Bananas', 'Yellow cloth', 'Books to students'],
    fastingDay: 'Thursday', rudraksha: '5 Mukhi',
    careers: ['Teaching', 'Law', 'Financial advisory', 'Consulting', 'Religious / spiritual work'],
    signatureTip: 'Keep letters well-formed and readable; a single underline is supportive.',
  },
  rahu: {
    id: 'rahu', number: 4, name: 'Rahu', hindiName: 'Rahu', devanagari: 'राहु', element: 'Air',
    weekday: 'Saturday', weekdayHindi: 'Shanivar', colours: ['Grey', 'Electric blue', 'Smoky shades'],
    gemstone: { name: 'Hessonite', hindi: 'Gomed', alternatives: ['Orange Zircon'], metal: 'Silver / Ashtadhatu', finger: 'Middle finger', caution: STRONG_CAUTION },
    mantra: { beej: 'Om Bhraam Bhreem Bhraum Sah Rahave Namah', dailyCount: 108, japaTotal: 18000 },
    deity: 'Maa Durga / Bhairav', daan: ['Black sesame (til)', 'Blanket', 'Coconut', 'Mustard oil'],
    fastingDay: 'Saturday', rudraksha: '8 Mukhi',
    careers: ['Technology & IT', 'Research', 'Foreign trade', 'Aviation', 'Media & digital'],
    signatureTip: 'Avoid ending the signature with a downward stroke or a dot.',
  },
  mercury: {
    id: 'mercury', number: 5, name: 'Mercury', hindiName: 'Budh', devanagari: 'बुध', element: 'Earth',
    weekday: 'Wednesday', weekdayHindi: 'Budhvar', colours: ['Green', 'Light green', 'Turquoise'],
    gemstone: { name: 'Emerald', hindi: 'Panna', alternatives: ['Peridot', 'Green Tourmaline'], metal: 'Gold / Silver', finger: 'Little finger', caution: STD_CAUTION },
    mantra: { beej: 'Om Braam Breem Braum Sah Budhaya Namah', dailyCount: 108, japaTotal: 9000 },
    deity: 'Lord Ganesha', daan: ['Green moong dal', 'Green vegetables', 'Green cloth', 'Fodder for cows'],
    fastingDay: 'Wednesday', rudraksha: '4 Mukhi',
    careers: ['Business & trading', 'Accounting', 'Communication', 'Marketing & sales', 'IT'],
    signatureTip: 'A fast, connected signature suits you; keep it legible.',
  },
  venus: {
    id: 'venus', number: 6, name: 'Venus', hindiName: 'Shukra', devanagari: 'शुक्र', element: 'Water',
    weekday: 'Friday', weekdayHindi: 'Shukravar', colours: ['White', 'Pink', 'Light blue', 'Pastels'],
    gemstone: { name: 'Diamond', hindi: 'Heera', alternatives: ['White Zircon', 'Opal'], metal: 'Silver / Platinum', finger: 'Middle or ring finger', caution: STD_CAUTION },
    mantra: { beej: 'Om Draam Dreem Draum Sah Shukraya Namah', dailyCount: 108, japaTotal: 16000 },
    deity: 'Maa Lakshmi', daan: ['Rice', 'Sugar', 'Curd', 'White sweets', 'Perfume'],
    fastingDay: 'Friday', rudraksha: '6 Mukhi',
    careers: ['Fashion & beauty', 'Arts & design', 'Hospitality', 'Luxury retail', 'Entertainment'],
    signatureTip: 'An artistic, slightly rounded signature with a rising end is favourable.',
  },
  ketu: {
    id: 'ketu', number: 7, name: 'Ketu', hindiName: 'Ketu', devanagari: 'केतु', element: 'Fire',
    weekday: 'Tuesday', weekdayHindi: 'Mangalvar', colours: ['Smoky grey', 'Light yellow', 'Multicolour'],
    gemstone: { name: "Cat's Eye", hindi: 'Lehsunia', alternatives: ["Tiger's Eye"], metal: 'Silver / Panchdhatu', finger: 'Middle or little finger', caution: STRONG_CAUTION },
    mantra: { beej: 'Om Sraam Sreem Sraum Sah Ketave Namah', dailyCount: 108, japaTotal: 17000 },
    deity: 'Lord Ganesha', daan: ['Blankets', 'Sesame', 'Food for stray dogs'],
    fastingDay: 'Tuesday', rudraksha: '9 Mukhi',
    careers: ['Research', 'Spiritual guidance', 'Healing', 'Programming', 'Investigation'],
    signatureTip: 'Keep your signature simple and do not cross through it.',
  },
  saturn: {
    id: 'saturn', number: 8, name: 'Saturn', hindiName: 'Shani', devanagari: 'शनि', element: 'Air',
    weekday: 'Saturday', weekdayHindi: 'Shanivar', colours: ['Navy blue', 'Dark blue', 'Black', 'Violet'],
    gemstone: { name: 'Blue Sapphire', hindi: 'Neelam', alternatives: ['Amethyst', 'Lapis Lazuli'], metal: 'Silver / Panchdhatu', finger: 'Middle finger', caution: STRONG_CAUTION },
    mantra: { beej: 'Om Praam Preem Praum Sah Shanaischaraya Namah', dailyCount: 108, japaTotal: 23000 },
    deity: 'Shani Dev / Lord Hanuman', daan: ['Mustard oil', 'Black urad dal', 'Iron items', 'Footwear to the needy'],
    fastingDay: 'Saturday', rudraksha: '7 or 14 Mukhi',
    careers: ['Engineering', 'Real estate', 'Mining & oil', 'Law & judiciary', 'Manufacturing'],
    signatureTip: 'Write the signature with an upward slope and never underline it twice.',
  },
  mars: {
    id: 'mars', number: 9, name: 'Mars', hindiName: 'Mangal', devanagari: 'मंगल', element: 'Fire',
    weekday: 'Tuesday', weekdayHindi: 'Mangalvar', colours: ['Red', 'Maroon', 'Coral', 'Pink'],
    gemstone: { name: 'Red Coral', hindi: 'Moonga', alternatives: ['Carnelian'], metal: 'Copper / Gold', finger: 'Ring finger', caution: STD_CAUTION },
    mantra: { beej: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah', dailyCount: 108, japaTotal: 10000 },
    deity: 'Lord Hanuman', daan: ['Red masoor dal', 'Jaggery', 'Red cloth', 'Blood donation'],
    fastingDay: 'Tuesday', rudraksha: '3 Mukhi',
    careers: ['Defence & police', 'Sports', 'Surgery', 'Real estate', 'Engineering'],
    signatureTip: 'A firm, energetic signature with a clear rising end suits you.',
  },
};

export const planetOf = (n: number): PlanetInfo => PLANETS[NUMBER_PLANET[n]];
