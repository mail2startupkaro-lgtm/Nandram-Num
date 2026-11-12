/**
 * Default knowledge base – the expert's interpretations, keyed by the codes the engine emits.
 * Seeds the KnowledgeEntry table; the expert edits/extends these from the admin panel (Phase 6).
 * Keep entries free of digits where possible: the narrative validator checks every number in the text.
 */

export interface KnowledgeSeed {
  key: string;
  title: string;
  body: string;
  tags?: string[];
}

const N = (n: number, title: string, body: string, tags: string[] = []): KnowledgeSeed => ({ key: `NUMBER_${n}`, title, body, tags: ['number', ...tags] });

export const KNOWLEDGE_SEED: KnowledgeSeed[] = [
  // ---------- Core nature of each number ----------
  N(1, 'Number One – the Sun', 'A natural leader with a strong sense of self. People with this vibration like to start things, take charge and be recognised for their work. Pride and impatience are the shadow side; when they learn to listen, their leadership becomes truly respected.'),
  N(2, 'Number Two – the Moon', 'Gentle, intuitive and caring. This vibration understands people without words and works best in partnership. Mood swings and over-thinking are the shadow side; a calm routine keeps the mind steady.'),
  N(3, 'Number Three – Jupiter (Guru)', 'The vibration of knowledge, guidance and optimism. These people are natural teachers and advisers and earn respect through wisdom. The shadow side is giving advice nobody asked for and spreading energy over too many plans.'),
  N(4, 'Number Four – Rahu', 'Hard-working, practical and unconventional. Rahu brings sudden turns, both good and testing, and rewards people who stay disciplined. The shadow side is restlessness and rigid thinking.'),
  N(5, 'Number Five – Mercury (Budh)', 'Quick, clever and communicative, with a strong head for business and numbers. This vibration loves variety and travel. The shadow side is nervous energy and leaving work half-done.'),
  N(6, 'Number Six – Venus (Shukra)', 'Loving, artistic and family-minded. Six brings comfort, beauty and the ability to create a warm home. The shadow side is over-attachment and spending on luxuries.'),
  N(7, 'Number Seven – Ketu', 'Deep, analytical and spiritual. Seven sees beneath the surface and is drawn to research, healing and inner growth. The shadow side is detachment and keeping feelings hidden.'),
  N(8, 'Number Eight – Saturn (Shani)', 'Patient, serious and ambitious. Shani gives results slowly but they last; this vibration builds wealth and position through steady effort. The shadow side is delay, worry and carrying too much responsibility alone.'),
  N(9, 'Number Nine – Mars (Mangal)', 'Energetic, brave and generous. Nine fights for what is right and has great physical and mental stamina. The shadow side is anger and acting before thinking.'),

  // ---------- Moolank (day-to-day personality) ----------
  ...[
    'You like to lead rather than follow, and you feel happiest when your work carries your own stamp. Others often look to you to take the first step.',
    'You read moods quickly and people feel comfortable opening up to you. You do your best work in a supportive team rather than in open competition.',
    'People come to you for advice, and you enjoy learning and sharing what you know. Discipline and a clear plan turn your knowledge into results.',
    'You are practical and work hard, though life sometimes changes direction suddenly for you. A steady routine is your best friend.',
    'You think fast, talk easily and spot opportunities others miss. Variety keeps you motivated; boredom drains you.',
    'You care deeply about family, comfort and beauty. You are the one who keeps relationships warm and the home welcoming.',
    'You are reflective and need time alone to recharge. Your intuition is strong, and research or spiritual practice suits you.',
    'You take responsibility seriously and rarely give up. Rewards may come later than for others, but they come on a strong foundation.',
    'You have courage and energy in abundance and you protect the people you love. Channelling that fire into sport, work or service keeps it positive.',
  ].map((body, i) => ({ key: `MOOLANK_${i + 1}`, title: `Moolank ${['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][i]}`, body, tags: ['moolank'] })),

  // ---------- Bhagyank (destiny path) ----------
  ...[
    'Your destiny pushes you towards independence and leadership. Life tends to reward you when you take initiative and stand on your own feet.',
    'Your path grows through partnerships, patience and cooperation. Success often comes with and through the right people.',
    'Your destiny is linked to knowledge and guidance. Teaching, advising or any role where people trust your judgement brings fortune.',
    'Your path asks for discipline and hard work, and it often brings unusual opportunities, including technology or foreign connections.',
    'Your destiny favours business, communication and movement. Change and travel tend to open new doors for you.',
    'Your path is tied to family, comfort and responsibility towards others. Creative fields and service bring you both money and satisfaction.',
    'Your destiny leads you towards depth, research and spiritual understanding. Success comes when you trust your inner voice.',
    'Your path is one of slow and steady building. Patience is your greatest asset, and the second half of life is usually stronger than the first.',
    'Your destiny rewards courage and service. You do well in roles where you protect, lead in action or help many people at once.',
  ].map((body, i) => ({ key: `BHAGYANK_${i + 1}`, title: `Bhagyank ${['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][i]}`, body, tags: ['bhagyank'] })),

  { key: 'MASTER_11', title: 'Master number eleven', body: 'The master vibration of intuition and inspiration sits behind your destiny. It gives you sensitivity and vision, along with the need to manage nervous tension.', tags: ['master'] },
  { key: 'MASTER_22', title: 'Master number twenty-two', body: 'The master builder vibration sits behind your destiny. You have the capacity to turn big ideas into lasting structures if you stay grounded.', tags: ['master'] },
  { key: 'MASTER_33', title: 'Master number thirty-three', body: 'The master teacher vibration sits behind your destiny, asking you to guide and heal others with compassion.', tags: ['master'] },

  { key: 'MOOLANK_BHAGYANK_FRIENDLY', title: 'Friendly combination', body: 'Your personality and your destiny pull in the same direction, so effort turns into results without much inner conflict.' },
  { key: 'MOOLANK_BHAGYANK_CONFLICT', title: 'Conflicting combination', body: 'Your personality and your destiny pull in different directions, which can create inner tension and delays. The remedies in this report are chosen to balance these two energies.' },

  // ---------- Missing numbers ----------
  ...[
    'With this number missing, expressing yourself and asking for what you want may not come naturally. Small daily acts of self-assertion help build this quality.',
    'With this number missing, patience and sensitivity to others can feel harder, and you may feel unsupported at times. Calm, cooperative habits strengthen it.',
    'With this number missing, focus and imagination may scatter, and studies can need extra effort. Regular reading and planning fill this gap.',
    'With this number missing, organisation and steady routine may be a challenge. Writing plans down and finishing one task at a time helps greatly.',
    'With this number missing, balance between different areas of life may be hard to hold. Physical activity and an orderly space bring you back to centre.',
    'With this number missing, home and family responsibilities may feel heavy or unsettled. Care, gratitude and a beautiful home environment strengthen it.',
    'With this number missing, lessons may come through loss or disappointment until you learn to trust your inner guidance. Quiet reflection builds this strength.',
    'With this number missing, money management and attention to detail may need conscious effort. Tracking finances daily makes a real difference.',
    'With this number missing, drive and courage may fluctuate, and you may hesitate to take bold steps. Exercise and service activate this energy.',
  ].map((body, i) => ({ key: `MISSING_${i + 1}`, title: `Missing ${['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][i]}`, body, tags: ['missing'] })),

  // ---------- Repeated / excess numbers ----------
  ...[
    'Repetition here makes you very expressive, sometimes to the point of talking more than listening or holding on to your own view.',
    'Repetition here makes you highly sensitive and intuitive; you may take things to heart and need emotional reassurance.',
    'Repetition here gives a sharp, imaginative mind that can also live too much in ideas. Grounding them in action is the key.',
    'Repetition here gives great practical ability but can make you stubborn or overloaded with work.',
    'Repetition here brings strong energy and quick decisions, which can tip into restlessness or impulsive spending.',
    'Repetition here deepens your attachment to home and family; worry about loved ones can become heavy.',
    'Repetition here brings deep thinking and spiritual pull, with a tendency to withdraw from people.',
    'Repetition here makes you very responsible and hard-working, with a tendency to carry stress and to see delays.',
    'Repetition here brings strong ambition and idealism, with a temper that needs a healthy outlet.',
  ].map((body, i) => ({ key: `EXCESS_${i + 1}`, title: `Strong ${['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][i]}`, body, tags: ['excess'] })),

  // ---------- Yogs & arrows ----------
  { key: 'YOG_GOLDEN_YOG', title: 'Golden Yog', body: 'The success line is complete in your chart. This is the Golden Raj Yog, a classic sign of prosperity, recognition and of efforts turning into tangible rewards.' },
  { key: 'YOG_SILVER_YOG', title: 'Silver Yog', body: 'The property line is complete in your chart. This is the Silver Raj Yog, which supports land, home and property matters and a stable, respected position in society.' },
  ...([
    ['MENTAL', 'Arrow of Intellect', 'Your mental plane is complete: memory, planning and intelligence are clear strengths.', 'Arrow of Poor Memory', 'Your mental plane is empty, so memory and focus need deliberate support through notes, routine and rest.'],
    ['EMOTIONAL', 'Arrow of Spirituality', 'Your emotional plane is complete, giving you inner calm, genuine empathy and a natural pull towards spiritual understanding.', 'Arrow of Scepticism', 'Your emotional plane is empty, so you may trust only what you can see and prove, and keep your feelings guarded. Staying open to intuition and sharing feelings with trusted people brings balance.'],
    ['PRACTICAL', 'Arrow of Practicality', 'Your practical plane is complete: you are grounded, organised and good with material matters.', 'Arrow of Disorder', 'Your practical plane is empty, so structure in daily life and money matters needs conscious effort.'],
    ['THOUGHT', 'Arrow of Planning', 'Your thought plane is complete, making you a natural planner who sees steps ahead.', 'Arrow of Confusion', 'Your thought plane is empty, so decisions improve when you write options down and take advice.'],
    ['WILL', 'Arrow of Determination', 'Your will plane is complete: once you decide, you persist until you succeed.', 'Arrow of Indecision', 'Your will plane is empty, so decisions may be put off and motivation can dip when results are slow. Small, visible goals and fixed dates keep you moving.'],
    ['ACTION', 'Arrow of Activity', 'Your action plane is complete: you turn ideas into action quickly.', 'Arrow of Hesitation', 'Your action plane is empty, so you may wait too long before acting. Fixed deadlines help.'],
    ['GOLDEN', 'Arrow of Willpower', 'The success line is complete, giving strong willpower and supporting steady growth in wealth and position.', 'Arrow of Frustration', 'The success line is empty, so results may feel slower than your effort deserves and expectations of others can lead to disappointment. Patience and realistic goals protect your peace of mind.'],
    ['RAJ', 'Arrow of Emotional Balance', 'The property line is complete, bringing emotional balance and stability in home and property matters.', 'Arrow of Hypersensitivity', 'The property line is empty, so you may take things to heart easily, and big decisions about home and property need extra time and counsel.'],
  ] as const).flatMap(([id, sName, sBody, wName, wBody]) => [
    { key: `ARROW_STRENGTH_${id}`, title: sName, body: sBody, tags: ['arrow'] },
    { key: `ARROW_WEAKNESS_${id}`, title: wName, body: wBody, tags: ['arrow'] },
  ]),

  // ---------- Kua ----------
  { key: 'KUA_EAST', title: 'East group', body: 'You belong to the East group. Facing your success direction while working, and sleeping with your head towards your health direction, supports your energy.' },
  { key: 'KUA_WEST', title: 'West group', body: 'You belong to the West group. Facing your success direction while working, and sleeping with your head towards your health direction, supports your energy.' },

  // ---------- Personal years ----------
  ...[
    'A year of new beginnings. Start projects, apply for new roles and take initiative; seeds planted now grow over the coming cycle.',
    'A year of patience and partnership. Relationships, teamwork and quiet preparation matter more than bold moves.',
    'A year of expansion, learning and social connection. Communication, creativity and study are favoured.',
    'A year of hard work and building foundations. Organise finances, health routines and paperwork; property matters can move.',
    'A year of change and movement. Travel, job shifts and new contacts are likely; stay flexible but avoid rash decisions.',
    'A year of family and responsibility. Marriage, home improvement and caring for loved ones come into focus.',
    'A year of reflection and learning. Research, spiritual practice and rest bring clarity; avoid forcing big launches.',
    'A year of money and authority. Effort is rewarded with recognition and financial progress; manage power wisely.',
    'A year of completion. Finish pending work, let go of what no longer serves you and prepare for a fresh cycle.',
  ].map((body, i) => ({ key: `PY_${i + 1}`, title: `Personal year ${['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][i]}`, body, tags: ['cycle'] })),

  // ---------- Relationships by number ----------
  ...[
    'In relationships you are loyal and protective but like to have the final word. A partner who respects your independence suits you.',
    'In relationships you are tender and devoted and need emotional reassurance. Harmony at home directly affects your peace of mind.',
    'In relationships you are generous and guiding. Mutual respect and shared values matter more to you than romance alone.',
    'In relationships you are dependable but can seem reserved. Clear communication prevents misunderstandings.',
    'In relationships you need fun, conversation and freedom. Routine without variety can make you restless.',
    'In relationships you are romantic and family-oriented, and you naturally take care of everyone.',
    'In relationships you need understanding and personal space. A partner who values depth over display suits you.',
    'In relationships you are committed and serious. Sharing responsibilities lightens the load you tend to carry alone.',
    'In relationships you are passionate and protective. Patience in arguments keeps your bonds strong.',
  ].map((body, i) => ({ key: `RELATION_${i + 1}`, title: 'Relationships', body, tags: ['relationship'] })),

  // ---------- Wellbeing by number (lifestyle only – never illness predictions) ----------
  ...[
    'Morning sunlight, an early start and regular breaks from screens keep your energy high.',
    'Good sleep, enough water and calm evenings keep your mind steady.',
    'Moderate eating and regular walks balance your love of good food and long hours of mental work.',
    'A fixed daily routine and time in fresh air help you manage sudden stress.',
    'Breathing exercises and a tidy schedule calm your active mind.',
    'Balanced meals and time for creative hobbies keep you feeling well.',
    'Meditation, quiet time and nature walks recharge you.',
    'Regular stretching, enough rest and not carrying worries alone keep you strong.',
    'Daily exercise is the best outlet for your energy and keeps your temper calm.',
  ].map((body, i) => ({ key: `WELLBEING_${i + 1}`, title: 'Wellbeing', body, tags: ['wellbeing'] })),

  // ---------- Name / mobile / aadhaar / couple ----------
  { key: 'NAME_COMPOUND_FAVOURABLE', title: 'Favourable name vibration', body: 'Your name carries a favourable compound vibration, which supports reputation and the way people respond to you.' },
  { key: 'NAME_COMPOUND_MIXED', title: 'Mixed name vibration', body: 'Your name carries a mixed compound vibration: it supports you in some areas while asking for effort in others.' },
  { key: 'NAME_COMPOUND_UNFAVOURABLE', title: 'Challenging name vibration', body: 'Your name carries a challenging compound vibration, which can create obstacles despite hard work. A small spelling correction can shift this.' },
  { key: 'NAME_CORRECTION_HOW', title: 'Using a corrected name', body: 'Use the corrected spelling in your signature, email and social profiles, business cards and nameplate. Official documents can stay unchanged; what matters is the name you use daily.' },
  { key: 'MOBILE_HIGHLY_LUCKY', title: 'Highly lucky number', body: 'Your mobile number works strongly in your favour. Keep it and use it for important work.' },
  { key: 'MOBILE_SUPPORTIVE', title: 'Supportive number', body: 'Your mobile number supports you overall, with a few minor patterns to be aware of.' },
  { key: 'MOBILE_NEUTRAL', title: 'Neutral number', body: 'Your mobile number is neutral: it neither blocks nor boosts you much. A better-matched number would add support.' },
  { key: 'MOBILE_NEEDS_CHANGE', title: 'Number needs change', body: 'Your mobile number clashes with your core numbers. If changing it is practical, choosing a number with a better total is advisable.' },
  { key: 'AADHAAR_NOTE', title: 'Aadhaar vibration', body: 'An Aadhaar number cannot be changed, so its vibration is used only to fine-tune your remedies, never as a cause for worry.' },
  { key: 'COUPLE_GENERAL', title: 'Couple compatibility', body: 'Compatibility in numerology shows natural strengths and the areas that need conscious effort. Every pairing has its own strengths, and every challenge has a remedy.' },

  // ---------- Remedies ----------
  { key: 'REMEDY_GEM_NOTE', title: 'Gemstones', body: 'Wear a gemstone only after consulting a qualified expert and checking it suits you.' },
  { key: 'CLOSING', title: 'Closing', body: 'Numbers show tendencies, not fixed fate. Your choices, effort and the remedies you follow shape how these energies unfold.' },
];
