/** Services we offer around a Mulank. Links point at existing pages; no prices are hard-coded here (see /pricing). */
export type MulankService = { icon: string; title: string; desc: string; href: string };

export function mulankServices(n: number): MulankService[] {
  return [
    { icon: '✦', title: `Mulank ${n} Life Report (PDF)`, desc: 'Your full Date of Birth reading: Moolank, Bhagyank, Kua, Lo Shu grid and yearly cycles in a designed keepsake report.', href: '/reading' },
    { icon: 'Aa', title: 'Name Numerology & Spelling', desc: `Chaldean and Pythagorean check of your name, with spelling suggestions that harmonise with Mulank ${n}.`, href: '/reading' },
    { icon: '☎', title: 'Lucky Mobile Number Check', desc: `A clear score for whether your mobile number supports a Mulank ${n} life.`, href: '/calculators' },
    { icon: '❤', title: 'Couple Compatibility', desc: `See how Mulank ${n} blends with your partner's numbers, planets and grids.`, href: '/reading' },
    { icon: '☸', title: 'Personal Remedies', desc: 'Gemstone, colour, day, mantra and habit guidance tailored to your numbers.', href: '/reading' },
  ];
}
