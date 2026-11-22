/**
 * Celebrity Numerology – the numbers. Pure and deterministic, computed on the shared engine
 * (same charts, tables and scoring as every report). The AI writer only interprets these numbers;
 * the figures shown on the blog post and in the PDF always come from here.
 */
import { analyseDob, analyseNameSystem, nameCompatibilityScore, parseDate, personalYearOn, todayIST, toIso, type DateParts } from '@/lib/numerology';
import { relationOf, type Relation } from '@/lib/numerology/data/relations';
import { planetOf } from '@/lib/numerology/data/planets';
import { compoundMeaning } from '@/lib/signature/numbers';
import { compoundMeaningHi } from '@/lib/signature/hindi';
import { verdictOf, type Verdict } from '@/lib/name-calculator';

export interface CelebNumbers {
  name: string;
  dob: string; // ISO
  weekday: { en: string; hi: string };
  age: number;
  moolank: { value: number; planet: string; planetHi: string };
  bhagyank: { value: number; compound: number; master: number | null; planet: string; planetHi: string };
  moolankBhagyank: Relation;
  chaldean: { compound: number; single: number; master: number | null; category: string; meaning: { en: string; hi: string }; planet: string; planetHi: string };
  pythagorean: { expression: number; soulUrge: number; personality: number };
  nameScore: number;
  nameVerdict: Verdict;
  nameRelB: Relation;
  loShu: {
    /** Count of each number 1–9 (Lo Shu, without Kua – gender is not asked). */
    counts: Record<number, number>;
    present: number[];
    missing: number[];
    repeated: { number: number; count: number }[];
    strengths: string[];
    weaknesses: string[];
    yogs: string[];
  };
  personalYear: { value: number; asOf: string; from: string; to: string };
  pinnacle: { number: number; fromAge: number; toAge: number | null } | null;
}

const WD = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
};

export class CelebInputError extends Error { constructor(public field: 'name' | 'dob', msg: string) { super(msg); } }

const cleanName = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();

export function celebNumbers(rawName: string, rawDob: string, asOf: DateParts = todayIST()): CelebNumbers {
  const name = cleanName(rawName);
  if (name.length < 2) throw new CelebInputError('name', 'Enter the celebrity’s name');
  let dob: DateParts;
  try { dob = parseDate(rawDob); } catch { throw new CelebInputError('dob', 'Enter a valid date of birth'); }
  if (dob.year < 1800) throw new CelebInputError('dob', 'Enter a valid date of birth');
  let d;
  try { d = analyseDob({ dob, gender: 'other' }, { asOf, kuaBasis: 'male', includeKuaInGrid: false, yearsAhead: 3 }); }
  catch { throw new CelebInputError('dob', 'The date of birth is in the future – check the year'); }
  let ch, py;
  try { ch = analyseNameSystem(name, 'chaldean'); py = analyseNameSystem(name, 'pythagorean'); }
  catch { throw new CelebInputError('name', 'Write the name in English letters (A–Z)'); }

  const m = d.moolank.value, b = d.bhagyank.value;
  const score = nameCompatibilityScore(ch.nameNumber.single, ch.nameNumber.compound, m, b);
  const wd = new Date(Date.UTC(dob.year, dob.month - 1, dob.day)).getUTCDay();
  const pyNow = d.personalCycles.current;
  const pin = d.pinnacles.find((p) => p.current) ?? null;
  const pl = (n: number) => planetOf(n);
  return {
    name,
    dob: toIso(dob),
    weekday: { en: WD.en[wd], hi: WD.hi[wd] },
    age: d.age,
    moolank: { value: m, planet: pl(m).name, planetHi: pl(m).devanagari },
    bhagyank: { value: b, compound: d.bhagyank.compound, master: d.bhagyank.master ?? null, planet: pl(b).name, planetHi: pl(b).devanagari },
    moolankBhagyank: d.moolankBhagyankRelation,
    chaldean: {
      compound: ch.nameNumber.compound, single: ch.nameNumber.single, master: ch.nameNumber.master ?? null, category: ch.nameNumber.category,
      meaning: { en: compoundMeaning(ch.nameNumber.compound), hi: compoundMeaningHi(ch.nameNumber.compound) },
      planet: pl(ch.nameNumber.single).name, planetHi: pl(ch.nameNumber.single).devanagari,
    },
    pythagorean: { expression: py.expression.single, soulUrge: py.soulUrge.single, personality: py.personality.single },
    nameScore: score,
    nameVerdict: verdictOf(score),
    nameRelB: relationOf(b, ch.nameNumber.single),
    loShu: {
      counts: d.loShu.counts,
      present: d.loShu.present,
      missing: d.loShu.missing,
      repeated: d.loShu.repeated,
      strengths: d.loShu.arrowsOfStrength.map((a) => a.name),
      weaknesses: d.loShu.arrowsOfWeakness.map((a) => a.name),
      yogs: d.loShu.yogs.map((y) => y.name),
    },
    personalYear: { value: personalYearOn(dob, asOf), asOf: toIso(asOf), from: pyNow.from, to: pyNow.to },
    pinnacle: pin ? { number: pin.number, fromAge: pin.fromAge, toAge: pin.toAge } : null,
  };
}

const REL = { en: { friend: 'friendly', neutral: 'neutral', enemy: 'challenging' }, hi: { friend: 'मित्र', neutral: 'सम', enemy: 'शत्रु' } } as const;
export const relWord = (r: Relation, lang: 'en' | 'hi') => REL[lang][r as keyof (typeof REL)['en']] ?? r;

/** Plain-text summary of the numbers – given to the AI writer, and used for checks. */
export function numbersText(n: CelebNumbers): string {
  return [
    `Name analysed: ${n.name}`,
    `Date of birth: ${n.dob} (${n.weekday.en}); age today: ${n.age}`,
    `Moolank (root/psychic number, from birth day): ${n.moolank.value} – ruled by ${n.moolank.planet}`,
    `Bhagyank (destiny/life path number, full date): ${n.bhagyank.value} (compound ${n.bhagyank.compound}${n.bhagyank.master ? `, master number ${n.bhagyank.master}` : ''}) – ruled by ${n.bhagyank.planet}`,
    `Moolank–Bhagyank relation: ${relWord(n.moolankBhagyank, 'en')}`,
    `Chaldean name number: ${n.chaldean.compound}/${n.chaldean.single} (${n.chaldean.category}) – ruled by ${n.chaldean.planet}; compound meaning: ${n.chaldean.meaning.en}`,
    `Name number vs Bhagyank: ${relWord(n.nameRelB, 'en')}; name compatibility score ${n.nameScore}/100 (${n.nameVerdict})`,
    `Pythagorean: expression ${n.pythagorean.expression}, soul urge ${n.pythagorean.soulUrge}, personality ${n.pythagorean.personality}`,
    `Lo Shu grid present: ${n.loShu.present.join(', ') || 'none'}; missing: ${n.loShu.missing.join(', ') || 'none'}; repeated: ${n.loShu.repeated.map((r) => `${r.number}×${r.count}`).join(', ') || 'none'}`,
    `Lo Shu arrows of strength: ${n.loShu.strengths.join(', ') || 'none'}; arrows of weakness: ${n.loShu.weaknesses.join(', ') || 'none'}; yogs: ${n.loShu.yogs.join(', ') || 'none'}`,
    `Current personal year (birthday to birthday, ${n.personalYear.from} to ${n.personalYear.to}): ${n.personalYear.value}`,
    n.pinnacle ? `Current pinnacle: ${n.pinnacle.number} (age ${n.pinnacle.fromAge}–${n.pinnacle.toAge ?? 'onwards'})` : '',
  ].filter(Boolean).join('\n');
}

export const celebSlug = (name: string) =>
  `${name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'celebrity'}-numerology`;
