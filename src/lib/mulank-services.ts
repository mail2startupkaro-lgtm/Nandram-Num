/** Services we offer around a Mulank. Links point at existing pages; no prices are hard-coded here (see /pricing). */
export type MulankService = { icon: string; title: string; desc: string; href: string };

export function mulankServices(n: number, lang: 'en' | 'hi' = 'en'): MulankService[] {
  if (lang === 'hi') {
    const mk = n ? `मूलांक ${n}` : 'आपके मूलांक';
    return [
      { icon: '✦', title: `${n ? `मूलांक ${n}` : 'मूलांक'} जीवन रिपोर्ट (PDF)`, desc: 'आपकी जन्म तिथि की पूरी रीडिंग: मूलांक, भाग्यांक, कुआ, लो शू ग्रिड और वार्षिक चक्र – एक सुंदर डिज़ाइन की हुई संग्रहणीय रिपोर्ट में।', href: '/reading' },
      { icon: 'Aa', title: 'नाम अंक ज्योतिष और वर्तनी', desc: `आपके नाम की कैल्डियन और पाइथागोरियन जाँच, ${mk} से मेल खाने वाली वर्तनी के सुझावों के साथ।`, href: '/reading' },
      { icon: '☎', title: 'शुभ मोबाइल नंबर जाँच', desc: `स्पष्ट स्कोर कि आपका मोबाइल नंबर ${mk} वाले जीवन का साथ देता है या नहीं।`, href: '/calculators' },
      { icon: '❤', title: 'जोड़ी मिलान', desc: `देखें कि ${mk} आपके जीवनसाथी के अंकों, ग्रहों और ग्रिड से कैसे मेल खाता है।`, href: '/reading' },
      { icon: '☸', title: 'व्यक्तिगत उपाय', desc: 'आपके अंकों के अनुसार रत्न, रंग, दिन, मंत्र और आदतों का मार्गदर्शन।', href: '/reading' },
    ];
  }
  const mk = n ? `Mulank ${n}` : 'your Mulank';
  return [
    { icon: '✦', title: `${n ? `Mulank ${n}` : 'Mulank'} Life Report (PDF)`, desc: 'Your full Date of Birth reading: Moolank, Bhagyank, Kua, Lo Shu grid and yearly cycles in a designed keepsake report.', href: '/reading' },
    { icon: 'Aa', title: 'Name Numerology & Spelling', desc: `Chaldean and Pythagorean check of your name, with spelling suggestions that harmonise with ${mk}.`, href: '/reading' },
    { icon: '☎', title: 'Lucky Mobile Number Check', desc: `A clear score for whether your mobile number supports a ${n ? `Mulank ${n}` : 'Mulank-based'} life.`, href: '/calculators' },
    { icon: '❤', title: 'Couple Compatibility', desc: `See how ${mk} blends with your partner's numbers, planets and grids.`, href: '/reading' },
    { icon: '☸', title: 'Personal Remedies', desc: 'Gemstone, colour, day, mantra and habit guidance tailored to your numbers.', href: '/reading' },
  ];
}
