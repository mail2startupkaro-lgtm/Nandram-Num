/** Angel number ↔ date-of-birth compatibility, using the house friendship table. Pure functions. */
import { bhagyank, moolank, personalYearOn, type DateParts } from '@/lib/numerology';
import { mutualHarmony, relationOf, type Relation } from '@/lib/numerology/data/relations';
import { analyse, angelOfLifeNumber } from './generate';

const pad2 = (n: number) => String(n).padStart(2, '0');
const W_B = { friend: 22, neutral: 5, enemy: -18 } as const;
const W_M = { friend: 15, neutral: 3, enemy: -12 } as const;

export function personalAngels(dob: DateParts, today: DateParts) {
  const m = moolank(dob.day), b = bhagyank(dob), py = personalYearOn(dob, today);
  return {
    moolank: m.value, bhagyank: b.value, master: b.master, personalYear: py,
    list: [
      { key: 'life', label: 'Life Path Angel Number', labelHi: 'जीवन-पथ एंजेल नंबर', n: angelOfLifeNumber(b.value, b.master),
        why: `From your Bhagyank (life path) ${b.master ? `${b.master}/${b.value}` : b.value}. Your main lifelong angel number.`,
        whyHi: `आपके भाग्यांक (जीवन-पथ अंक) ${b.master ? `${b.master}/${b.value}` : b.value} से। यह जीवन भर का आपका मुख्य एंजेल नंबर है।` },
      { key: 'mulank', label: 'Mulank Angel Number', labelHi: 'मूलांक एंजेल नंबर', n: String(m.value).repeat(3),
        why: `From your Mulank ${m.value} (day of birth). Shows your everyday nature.`, whyHi: `आपके मूलांक ${m.value} (जन्म का दिन) से। यह आपका रोज़मर्रा का स्वभाव दिखाता है।` },
      { key: 'birthday', label: 'Birthday Angel Number', labelHi: 'जन्मदिन एंजेल नंबर', n: pad2(dob.day).repeat(2),
        why: `Your birth day ${pad2(dob.day)} mirrored. A personal sign to watch for on clocks, dates, tickets and receipts.`, whyHi: `आपकी जन्म तारीख़ ${pad2(dob.day)} दोहराई गई। घड़ी, तारीख़ों, टिकट और रसीदों पर दिखने वाला आपका व्यक्तिगत संकेत।` },
      { key: 'year', label: `Personal Year Angel Number ${today.year}`, labelHi: 'व्यक्तिगत वर्ष एंजेल नंबर', n: String(py).repeat(3),
        why: `From your current personal year ${py}. The theme of this year for you.`, whyHi: `आपके वर्तमान व्यक्तिगत वर्ष ${py} से (जन्मदिन से जन्मदिन तक)। इस वर्ष आपके लिए मुख्य विषय।` },
    ],
  };
}

export type Verdict = 'Highly aligned' | 'Supportive' | 'Neutral – a learning number' | 'Challenging – read as a lesson';

export function angelCompatibility(angel: string, dob: DateParts) {
  const m = moolank(dob.day).value, b = bhagyank(dob).value;
  const a = analyse(angel);
  const digits = [...new Set(a.digits)];
  const perDigit = digits.map((d) => ({ d, rel: (d === 0 ? 'neutral' : relationOf(b, d)) as Relation }));
  let score: number; let relB: Relation = 'neutral', relM: Relation = 'neutral';
  if (a.root === 0) score = 85;
  else {
    relB = relationOf(b, a.root); relM = relationOf(m, a.root);
    score = 50 + W_B[relB] + W_M[relM];
    if (digits.includes(m)) score += 6;
    if (digits.includes(b)) score += 6;
    if (a.root === b) score += 4;
    score -= Math.min(9, 3 * perDigit.filter((x) => x.rel === 'enemy').length);
  }
  score = Math.max(12, Math.min(98, Math.round(score)));
  const verdict: Verdict = score >= 80 ? 'Highly aligned' : score >= 62 ? 'Supportive' : score >= 42 ? 'Neutral – a learning number' : 'Challenging – read as a lesson';
  return { moolank: m, bhagyank: b, root: a.root, sum: a.sum, relB, relM, perDigit, score, verdict };
}

export function coupleAngel(a: DateParts, b: DateParts) {
  const ba = bhagyank(a).value, bb = bhagyank(b).value, ma = moolank(a.day).value, mb = moolank(b.day).value;
  let c = ba + bb; while (c > 9) c = String(c).split('').reduce((x, y) => x + +y, 0);
  const harmony = Math.round(0.6 * mutualHarmony(ba, bb) + 0.4 * mutualHarmony(ma, mb));
  return { ba, bb, ma, mb, root: c, angel: String(c).repeat(3), harmony };
}
