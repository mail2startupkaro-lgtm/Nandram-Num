/** Mulank (Root / Psychic Number) profiles, 1–9. Mulank = day of birth reduced to a single digit. */
export type MulankProfile = {
  n: number;
  title: string;
  tagline: string;
  planet: string;
  element: string;
  direction: string;
  luckyNumbers: number[];
  luckyColors: string[];
  luckyDays: string[];
  gemstone: string;
  metal: string;
  intro: string;
  traits: string[];
  strengths: string[];
  challenges: string[];
  career: string;
  relationships: string;
  health: string;
  money: string;
  remedies: string[];
  compatible: number[];
  avoid: number[];
  famousDates: string;
};

export const MULANK: MulankProfile[] = [
  {
    n: 1, title: 'The Leader', tagline: 'Born to begin, built to lead.',
    planet: 'Sun (Surya)', element: 'Fire', direction: 'East',
    luckyNumbers: [1, 2, 4, 7], luckyColors: ['Gold', 'Orange', 'Saffron'], luckyDays: ['Sunday', 'Monday'],
    gemstone: 'Ruby (Manik)', metal: 'Gold',
    intro: 'Born on the 1st, 10th, 19th or 28th, your Mulank is 1. Ruled by the Sun, you carry natural authority, a pioneering spirit and a need to stand on your own feet. People notice you when you enter a room, and you are happiest when you are the one starting something new.',
    traits: ['Confident and self-reliant', 'Original thinker', 'Ambitious and driven', 'Direct communicator', 'Protective of loved ones'],
    strengths: ['Decisive under pressure', 'Natural leadership', 'Courage to take the first step', 'Strong willpower'],
    challenges: ['Ego and stubbornness', 'Difficulty taking advice', 'Impatience with slower people', 'Can become domineering'],
    career: 'Entrepreneurship, senior management, politics, government service, defence, medicine and any role where you set the direction. You do poorly in jobs that demand constant obedience without autonomy.',
    relationships: 'You love loyally and expect the same. You shine with partners who admire your drive but are secure enough to speak their mind. Learn to listen first and lead second; warmth wins more hearts than command.',
    health: 'Watch the heart, blood pressure, eyes and spine. Stress from over-work is your main trigger, so protect time for rest and morning sunlight.',
    money: 'Good earning power through initiative and positions of authority. Avoid risky bets driven by pride; build steady reserves before expanding.',
    remedies: ['Offer water to the rising Sun each morning', 'Wear gold or copper on the ring finger after astrologer advice', 'Chant "Om Suryaya Namah"', 'Donate wheat or jaggery on Sundays'],
    compatible: [2, 3, 5, 9], avoid: [8],
    famousDates: 'Born on 1, 10, 19, 28',
  },
  {
    n: 2, title: 'The Peacemaker', tagline: 'Gentle strength that heals and connects.',
    planet: 'Moon (Chandra)', element: 'Water', direction: 'North-West',
    luckyNumbers: [1, 2, 6, 7], luckyColors: ['White', 'Cream', 'Silver', 'Light green'], luckyDays: ['Monday', 'Sunday'],
    gemstone: 'Pearl (Moti)', metal: 'Silver',
    intro: 'Born on the 2nd, 11th, 20th or 29th, your Mulank is 2. The Moon rules your emotions and intuition. You sense moods before they are spoken, you value harmony, and you grow best in a supportive circle rather than in a lone race.',
    traits: ['Sensitive and intuitive', 'Diplomatic and caring', 'Imaginative', 'Cooperative', 'Moody at times'],
    strengths: ['Excellent listener', 'Natural mediator', 'Creative imagination', 'Deep empathy'],
    challenges: ['Mood swings', 'Over-sensitivity to criticism', 'Indecision', 'Dependence on approval'],
    career: 'Counselling, teaching, nursing, design, music, hospitality, public relations, partnerships and any work built on people and care. You do well as the trusted number two who holds a team together.',
    relationships: 'Devoted, romantic and nurturing. You need emotional safety and quiet affection. Speak your needs clearly instead of hoping they will be guessed.',
    health: 'Digestion, sleep, fluid balance and emotional well-being are linked for you. Regular routine, hydration and time near water or in calm places help.',
    money: 'Income is steadier in partnerships or service roles. Avoid emotional spending and lending beyond your comfort.',
    remedies: ['Keep a small silver item or wear a pearl after guidance', 'Chant "Om Chandraya Namah"', 'Offer milk or white flowers on Mondays', 'Spend time under moonlight, meditating'],
    compatible: [1, 4, 6, 7], avoid: [5, 9],
    famousDates: 'Born on 2, 11, 20, 29',
  },
  {
    n: 3, title: 'The Creator', tagline: 'Wisdom, joy and the gift of expression.',
    planet: 'Jupiter (Guru)', element: 'Ether', direction: 'North-East',
    luckyNumbers: [3, 6, 9], luckyColors: ['Yellow', 'Saffron', 'Purple'], luckyDays: ['Thursday', 'Tuesday', 'Friday'],
    gemstone: 'Yellow Sapphire (Pukhraj)', metal: 'Gold',
    intro: 'Born on the 3rd, 12th, 21st or 30th, your Mulank is 3. Jupiter blesses you with optimism, learning and a love of sharing knowledge. You communicate with warmth, attract opportunities easily and often become the teacher or guide in any group.',
    traits: ['Optimistic and expressive', 'Wise beyond age', 'Generous', 'Creative and witty', 'Principled'],
    strengths: ['Gift of speech and writing', 'Teaching ability', 'Natural luck and goodwill', 'Big-picture thinking'],
    challenges: ['Scattering energy across too many interests', 'Over-promising', 'Preachy tone', 'Weak follow-through on details'],
    career: 'Teaching, law, advisory, writing, media, finance, spiritual guidance, event and creative fields. Roles that reward ideas and communication suit you best.',
    relationships: 'Warm, loyal and fun. You value shared ideals and growth. Make time for small daily gestures; grand intentions are not a substitute.',
    health: 'Liver, weight, cholesterol and diabetes risk can rise with comfort eating. Moderate sweets, walk daily and keep a regular sleep pattern.',
    money: 'Wealth comes through knowledge and advice. Guard against generosity that outpaces savings.',
    remedies: ['Respect teachers, elders and gurus', 'Chant "Om Gurave Namah"', 'Donate yellow lentils or turmeric on Thursdays', 'Wear yellow on Thursdays'],
    compatible: [1, 2, 5, 9], avoid: [4, 8],
    famousDates: 'Born on 3, 12, 21, 30',
  },
  {
    n: 4, title: 'The Builder', tagline: 'Discipline that turns plans into foundations.',
    planet: 'Rahu', element: 'Air', direction: 'South-West',
    luckyNumbers: [1, 4, 5, 7, 8], luckyColors: ['Blue', 'Grey', 'Electric shades'], luckyDays: ['Saturday', 'Sunday', 'Monday'],
    gemstone: 'Hessonite (Gomed)', metal: 'Iron / mixed alloy',
    intro: 'Born on the 4th, 13th, 22nd or 31st, your Mulank is 4. Rahu makes you unconventional, practical and persistent. You question the usual way, build systems others rely on, and often walk a path that looks different from your peers.',
    traits: ['Hard-working and methodical', 'Independent thinker', 'Loyal and dependable', 'Rebellious streak', 'Private'],
    strengths: ['Organisation and structure', 'Technical aptitude', 'Perseverance', 'Sharp analytical mind'],
    challenges: ['Sudden ups and downs', 'Stubborn opinions', 'Suspicion of others', 'Resistance to change in routine'],
    career: 'Engineering, technology, research, architecture, real estate, law, investigation and systems or operations roles. You excel where precision and persistence matter.',
    relationships: 'Steady and honest but reserved. Show appreciation openly; your partner may not guess your affection from actions alone.',
    health: 'Nervous tension, skin, back and sleep issues. Grounding habits, regular exercise and screen breaks help.',
    money: 'Slow but solid gains. Avoid shortcuts, speculation and get-rich schemes, which often backfire for this number.',
    remedies: ['Chant "Om Rahave Namah"', 'Feed birds or serve the needy on Saturdays', 'Keep your workspace tidy and uncluttered', 'Practice daily breathing exercises'],
    compatible: [1, 5, 7, 8], avoid: [3, 9],
    famousDates: 'Born on 4, 13, 22, 31',
  },
  {
    n: 5, title: 'The Communicator', tagline: 'Quick mind, restless heart, endless possibilities.',
    planet: 'Mercury (Budh)', element: 'Earth', direction: 'North',
    luckyNumbers: [5, 1, 6], luckyColors: ['Green', 'Light grey', 'White'], luckyDays: ['Wednesday', 'Friday'],
    gemstone: 'Emerald (Panna)', metal: 'Bronze / Brass',
    intro: 'Born on the 5th, 14th or 23rd, your Mulank is 5. Mercury gives you wit, adaptability and a gift for trade and conversation. You learn fast, love variety and travel, and feel stifled by monotony.',
    traits: ['Quick-witted and curious', 'Adaptable', 'Charming', 'Restless', 'Good with money and trade'],
    strengths: ['Communication and persuasion', 'Business sense', 'Versatility', 'Learns anything quickly'],
    challenges: ['Nervous energy', 'Inconsistency', 'Impulsive decisions', 'Commitment anxiety'],
    career: 'Sales, marketing, trading, journalism, accounting, digital media, travel and consulting. Roles with variety and interaction keep you engaged.',
    relationships: 'Playful and stimulating partner. You need freedom and conversation. Reliability in small promises builds trust.',
    health: 'Nervous system, skin, respiratory and stress-related issues. Meditation, balanced meals and good sleep keep the mind calm.',
    money: 'Strong earning through trade and ideas, but money can slip away just as quickly. Automate savings.',
    remedies: ['Chant "Om Budhaya Namah"', 'Donate green moong on Wednesdays', 'Keep a green plant at home', 'Journal daily to channel scattered thoughts'],
    compatible: [1, 3, 4, 6], avoid: [2],
    famousDates: 'Born on 5, 14, 23',
  },
  {
    n: 6, title: 'The Nurturer', tagline: 'Love, beauty and responsibility in harmony.',
    planet: 'Venus (Shukra)', element: 'Water / Earth', direction: 'South-East',
    luckyNumbers: [6, 3, 9], luckyColors: ['Pink', 'White', 'Pastel blue'], luckyDays: ['Friday', 'Tuesday', 'Thursday'],
    gemstone: 'Diamond / White Sapphire / Opal', metal: 'Silver / Platinum',
    intro: 'Born on the 6th, 15th or 24th, your Mulank is 6. Venus brings charm, aesthetic taste and a deep need to care for family and home. You are magnetic, artistic and often the one people lean on.',
    traits: ['Loving and responsible', 'Artistic and refined', 'Charming', 'Family-centred', 'Enjoys comfort'],
    strengths: ['Creates beauty and harmony', 'Caring and dependable', 'Social grace', 'Strong sense of duty'],
    challenges: ['Over-giving and self-neglect', 'Jealousy or possessiveness', 'Love of luxury', 'Fear of conflict'],
    career: 'Arts, fashion, design, hospitality, healthcare, entertainment, luxury goods, interior and beauty industries, teaching and counselling.',
    relationships: 'Romantic, devoted and home-loving. You want a lasting bond. Keep healthy boundaries so care does not become control.',
    health: 'Throat, kidneys, hormones and weight. Balance indulgence with movement and mindful eating.',
    money: 'Comfortable lifestyle and income through creative or relationship-driven work. Watch spending on appearances.',
    remedies: ['Chant "Om Shukraya Namah"', 'Offer white flowers or sweets on Fridays', 'Keep your home clean, fragrant and bright', 'Respect women and elders of the household'],
    compatible: [3, 5, 9, 2], avoid: [1, 8],
    famousDates: 'Born on 6, 15, 24',
  },
  {
    n: 7, title: 'The Seeker', tagline: 'The quiet mind that looks for deeper truth.',
    planet: 'Ketu', element: 'Fire / Spirit', direction: 'North-West',
    luckyNumbers: [7, 1, 2, 4], luckyColors: ['Smoky grey', 'White', 'Light green', 'Pale yellow'], luckyDays: ['Monday', 'Sunday'],
    gemstone: "Cat's Eye (Lehsunia)", metal: 'Silver / Mixed alloy',
    intro: 'Born on the 7th, 16th or 25th, your Mulank is 7. Ketu makes you introspective, analytical and spiritually curious. You prefer depth over crowds, and you often sense that life has a hidden meaning to uncover.',
    traits: ['Analytical and intuitive', 'Reserved', 'Spiritual or philosophical', 'Independent', 'Perfectionist'],
    strengths: ['Deep research ability', 'Strong inner knowing', 'Detachment under stress', 'Original insight'],
    challenges: ['Isolation and overthinking', 'Emotional distance', 'Secrecy', 'Restless dissatisfaction'],
    career: 'Research, science, philosophy, psychology, writing, astrology and numerology, IT, analysis and healing arts. Roles with solitude and depth suit you.',
    relationships: 'Loyal but private. You need space and a partner who values quiet. Share your feelings in words, not only in silence.',
    health: 'Nervous system, sleep, digestion and mental fatigue. Meditation, nature and digital rest restore you.',
    money: 'Income through specialised knowledge. Avoid impulsive or secretive financial moves; keep records clear.',
    remedies: ['Chant "Om Ketave Namah"', 'Meditate daily at a fixed time', 'Donate blankets or food to the needy', 'Spend regular time in nature'],
    compatible: [1, 2, 4], avoid: [8, 9],
    famousDates: 'Born on 7, 16, 25',
  },
  {
    n: 8, title: 'The Achiever', tagline: 'Slow, steady power that earns lasting success.',
    planet: 'Saturn (Shani)', element: 'Air / Earth', direction: 'West',
    luckyNumbers: [8, 4, 5, 6], luckyColors: ['Black', 'Dark blue', 'Navy'], luckyDays: ['Saturday', 'Friday', 'Wednesday'],
    gemstone: 'Blue Sapphire (Neelam)', metal: 'Iron',
    intro: 'Born on the 8th, 17th or 26th, your Mulank is 8. Saturn tests you early and rewards you later. You carry discipline, endurance and a strong sense of justice, and your success usually comes through patience and hard work.',
    traits: ['Disciplined and patient', 'Serious and responsible', 'Ambitious', 'Fair-minded', 'Resilient'],
    strengths: ['Staying power', 'Management and authority', 'Practical wisdom', 'Handles responsibility'],
    challenges: ['Delays and heavy responsibilities', 'Emotional guardedness', 'Workaholism', 'Pessimism in tough phases'],
    career: 'Business, finance, law, administration, mining, construction, manufacturing, politics and large institutions. Late-blooming leadership is common.',
    relationships: 'Deeply committed and protective, though not demonstrative. Plan time for joy and affection so work does not consume the bond.',
    health: 'Joints, bones, teeth, chronic fatigue and stress. Regular exercise, calcium and rest are important.',
    money: 'Wealth builds slowly and stays when earned honestly. Avoid shortcuts and exploiting others; Saturn returns what is given.',
    remedies: ['Chant "Om Shanaischaraya Namah"', 'Serve the elderly, workers and the poor on Saturdays', 'Light a sesame oil lamp on Saturday evenings', 'Keep promises and be punctual'],
    compatible: [4, 5, 6], avoid: [1, 2, 3, 7, 9],
    famousDates: 'Born on 8, 17, 26',
  },
  {
    n: 9, title: 'The Humanitarian', tagline: 'Courage with compassion, energy with purpose.',
    planet: 'Mars (Mangal)', element: 'Fire', direction: 'South',
    luckyNumbers: [9, 3, 6], luckyColors: ['Red', 'Crimson', 'Coral'], luckyDays: ['Tuesday', 'Thursday', 'Friday'],
    gemstone: 'Red Coral (Moonga)', metal: 'Copper',
    intro: 'Born on the 9th, 18th or 27th, your Mulank is 9. Mars gives you drive, bravery and a protective heart. You are energetic, generous and ready to fight for causes and for people you love.',
    traits: ['Courageous and energetic', 'Generous and idealistic', 'Competitive', 'Passionate', 'Quick-tempered'],
    strengths: ['Fearless action', 'Leadership in crisis', 'Big-hearted service', 'Strong physical stamina'],
    challenges: ['Anger and impatience', 'Impulsive conflicts', 'Burnout', 'Difficulty letting go'],
    career: 'Defence, police, sports, surgery, engineering, social work, NGOs, real estate and entrepreneurship. Any field with action and a cause.',
    relationships: 'Passionate and loyal. Pause before reacting in arguments; your warmth is your real power.',
    health: 'Blood pressure, injuries, inflammation and fevers. Channel energy into exercise and keep a cooling diet.',
    money: 'Earns well through effort and risk-taking in action-oriented fields. Avoid rash investments in anger or excitement.',
    remedies: ['Chant "Om Mangalaya Namah"', 'Offer red lentils on Tuesdays', 'Practice yoga or sport to release heat', 'Serve a cause beyond yourself'],
    compatible: [1, 3, 6], avoid: [4, 7, 8],
    famousDates: 'Born on 9, 18, 27',
  },
];

export function getMulank(n: number): MulankProfile | undefined {
  return MULANK.find((m) => m.n === n);
}
