/** SEO landing pages for the free calculators (lead magnets). */
export type CalcKind = 'moolank' | 'bhagyank' | 'loshu' | 'name' | 'mobile' | 'kua';

export interface CalcPage {
  slug: string; kind: CalcKind; title: string; h1: string; description: string; keywords: string[];
  intro: string[]; faq: { q: string; a: string }[];
}

export const CALCULATORS: CalcPage[] = [
  {
    slug: 'moolank-calculator', kind: 'moolank', title: 'Free Moolank Calculator – Find Your Root Number', h1: 'Free Moolank Calculator',
    description: 'Calculate your Moolank (psychic or root number) from your date of birth and learn its ruling planet, nature and lucky days.',
    keywords: ['moolank calculator', 'root number', 'psychic number', 'moolank meaning'],
    intro: ['Your Moolank is the single digit you get by adding the digits of the day you were born. It describes your day-to-day nature, the way others see you and the planet that rules your personality.', 'Enter your date of birth below to see your Moolank instantly.'],
    faq: [
      { q: 'How is Moolank calculated?', a: 'Add the digits of your birth date until a single digit remains. Someone born on the 28th has 2 + 8 = 10, and 1 + 0 = 1, so their Moolank is 1.' },
      { q: 'What is the difference between Moolank and Bhagyank?', a: 'Moolank comes from the day of birth and shows your personality. Bhagyank comes from the full date of birth and shows your destiny or life path.' },
      { q: 'Can my Moolank change?', a: 'No. It is fixed by your date of birth. Remedies, lucky colours and name spelling are used to balance its energy.' },
    ],
  },
  {
    slug: 'bhagyank-calculator', kind: 'bhagyank', title: 'Bhagyank Calculator – Destiny Number from Date of Birth', h1: 'Free Bhagyank (Destiny Number) Calculator',
    description: 'Find your Bhagyank, the destiny or life path number, from your full date of birth – including master numbers 11, 22 and 33.',
    keywords: ['bhagyank calculator', 'destiny number', 'life path number india', 'bhagyank meaning'],
    intro: ['Your Bhagyank is the total of every digit in your date of birth, reduced to one digit. In Indian numerology it shows the direction your life naturally takes and where fortune comes from.'],
    faq: [
      { q: 'How do I calculate my Bhagyank?', a: 'Write your date of birth as DD-MM-YYYY, add all the digits and keep adding until you reach a single digit.' },
      { q: 'What are master numbers?', a: 'If the total passes through 11, 22 or 33 before reducing, a master vibration sits behind your Bhagyank. It is shown as a note alongside the single digit.' },
    ],
  },
  {
    slug: 'lo-shu-grid-calculator', kind: 'loshu', title: 'Lo Shu Grid Calculator – Missing Numbers, Planes & Raj Yog', h1: 'Free Lo Shu Grid Calculator',
    description: 'Create your Lo Shu Grid from your date of birth. See missing and repeated numbers, complete planes, and yogs such as Raj Yog and Golden Yog.',
    keywords: ['lo shu grid calculator', 'missing numbers numerology', 'raj yog lo shu', 'lo shu grid meaning'],
    intro: ['The Lo Shu Grid is a 3 × 3 magic square. Your birth-date digits, Moolank, Bhagyank and Kua number are placed in it to show which energies you have in plenty and which are missing.'],
    faq: [
      { q: 'What does a missing number mean?', a: 'A missing number marks a quality you need to develop consciously. Each one has simple remedies such as colours, crystals and placement at home.' },
      { q: 'What is Raj Yog in the Lo Shu Grid?', a: 'When 2, 5 and 8 are all present, the property line is complete. In Indian practice this is called Raj Yog and supports authority and property.' },
    ],
  },
  {
    slug: 'name-numerology-calculator', kind: 'name', title: 'Name Numerology Calculator – Chaldean & Pythagorean', h1: 'Free Name Numerology Calculator',
    description: 'Calculate your name number with the Chaldean system used in India, compare it with the Pythagorean value, and see your soul urge and personality numbers.',
    keywords: ['name numerology calculator', 'chaldean numerology', 'name number', 'name correction numerology'],
    intro: ['Every letter carries a number. In the Chaldean system, the total of the name you use every day shows how the world responds to you. A name that matches your Moolank and Bhagyank supports your efforts.'],
    faq: [
      { q: 'Which name should I use – full name or common name?', a: 'Use the name you sign with and that people call you by. The full report analyses both.' },
      { q: 'Can a spelling change help?', a: 'Yes. Small changes such as doubling a letter can shift the vibration without changing pronunciation. The full report suggests options that suit your numbers.' },
    ],
  },
  {
    slug: 'mobile-number-numerology', kind: 'mobile', title: 'Mobile Number Numerology – Is Your Number Lucky?', h1: 'Free Mobile Number Numerology Check',
    description: 'Check whether your mobile number is lucky for your date of birth. See its total, compatibility score and difficult digit pairs.',
    keywords: ['mobile number numerology', 'lucky mobile number', 'mobile number total', 'mobile numerology calculator'],
    intro: ['Your mobile number is used many times a day, so its vibration matters. The total of its ten digits should be friendly with your Moolank and Bhagyank, and some digit pairs such as 4-8 are best avoided.'],
    faq: [
      { q: 'How is the mobile number total calculated?', a: 'Add all ten digits and reduce to a single number. That number is compared with your Moolank and Bhagyank.' },
      { q: 'Should I change my number?', a: 'Only if the score is low and changing is practical. The full report lists the ideal totals and digit patterns to look for.' },
    ],
  },
  {
    slug: 'kua-number-calculator', kind: 'kua', title: 'Kua Number Calculator – Lucky Directions for Home & Work', h1: 'Free Kua Number Calculator',
    description: 'Find your Kua number from your year of birth and gender, and see your four lucky directions for success, health, relationships and growth.',
    keywords: ['kua number calculator', 'lucky direction', 'kua number', 'east group west group'],
    intro: ['Your Kua number places you in the East or West group and gives four favourable directions. Facing your success direction while working and sleeping towards your health direction is a simple, practical remedy.'],
    faq: [
      { q: 'Why does gender matter for Kua?', a: 'The traditional Kua formula is different for men and women, so the same birth year can give different numbers.' },
      { q: 'What if I was born in January or early February?', a: 'Some practitioners use the solar new year (around 4 February). This calculator uses the calendar year; your numerologist can advise if you were born before 4 February.' },
    ],
  },
];

export const calcBySlug = (slug: string) => CALCULATORS.find((c) => c.slug === slug);
