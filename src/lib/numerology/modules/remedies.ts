/** Section 7 – rule-based remedies built from the DOB result (+ optional name/mobile results). */
import { LOSHU_NUMBER_INFO } from '../data/grids';
import { NUMBER_PLANET, planetOf } from '../data/planets';
import { SCORING } from '../data/tables';
import { DobResult, personalYear } from './dob';
import { MobileResult } from './mobile';
import { NameResult } from './name';

const uniq = <T,>(xs: T[]) => [...new Set(xs)];

export function buildRemedies(dob: DobResult, extras: { name?: NameResult; mobile?: MobileResult; yearsAhead?: number } = {}) {
  const m = dob.moolank.value, b = dob.bhagyank.value;
  const ruling = planetOf(m);
  const destiny = planetOf(b);
  const friendly = dob.numberRelations.combined.friendly;
  const luckyNumbers = friendly.filter((n) => ![4, 8].includes(n) || n === m || n === b);
  const luckyDates = Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => luckyNumbers.includes(((d - 1) % 9) + 1));
  const luckyDays = uniq([ruling.weekday, destiny.weekday, ...luckyNumbers.slice(0, 3).map((n) => planetOf(n).weekday)]);
  const luckyColours = uniq([...ruling.colours.slice(0, 3), ...destiny.colours.slice(0, 2)]);
  const avoidColours = uniq(dob.numberRelations.combined.enemy.flatMap((n) => planetOf(n).colours.slice(0, 1))).filter((c) => !luckyColours.includes(c));

  const excessPlanets = dob.loShu.repeated.filter((r) => r.count >= 3).map((r) => planetOf(r.number));
  const daan = uniq([...ruling.daan.slice(0, 2), ...excessPlanets.flatMap((p) => p.daan.slice(0, 2))]);

  const startYear = Number(dob.personalCycles.asOf.slice(0, 4));
  const years = Array.from({ length: extras.yearsAhead ?? 10 }, (_, i) => startYear + i);
  const favourableYears = Object.fromEntries(
    Object.entries(SCORING.eventYears).map(([event, pys]) => [event, years.filter((y) => pys.includes(personalYear(dob.dob, y))).map((y) => ({ year: y, personalYear: personalYear(dob.dob, y) }))]),
  );

  return {
    module: 'remedies' as const,
    rulingPlanet: { number: m, id: NUMBER_PLANET[m], name: ruling.name, hindi: ruling.hindiName },
    destinyPlanet: { number: b, id: NUMBER_PLANET[b], name: destiny.name, hindi: destiny.hindiName },
    lucky: { numbers: luckyNumbers, dates: luckyDates, days: luckyDays, colours: luckyColours, avoidColours, directions: dob.kua.favourable, avoidDirections: dob.kua.unfavourable },
    gemstones: [
      { for: 'Moolank', planet: ruling.name, ...ruling.gemstone, rudraksha: ruling.rudraksha },
      ...(b !== m ? [{ for: 'Bhagyank', planet: destiny.name, ...destiny.gemstone, rudraksha: destiny.rudraksha }] : []),
    ],
    mantra: { planet: ruling.name, deity: ruling.deity, mantra: ruling.mantra.beej, day: ruling.weekday, dailyCount: ruling.mantra.dailyCount, fullJapa: ruling.mantra.japaTotal },
    loShuRemedies: dob.loShu.missing.map((n) => ({ ...LOSHU_NUMBER_INFO[n], planet: planetOf(n).name })),
    daan,
    fastingDay: ruling.fastingDay,
    dailyHabits: dob.loShu.missing.slice(0, 4).map((n) => LOSHU_NUMBER_INFO[n].dailyHabit),
    signature: [
      'Sign with a slight upward slope from left to right.',
      'Do not cut through or strike your own name.',
      'Avoid ending with a dot or a downward stroke.',
      ruling.signatureTip,
    ],
    favourableYears,
    nameCorrection: extras.name ? { needed: extras.name.needsCorrection, currentScore: extras.name.compatibilityScore, options: extras.name.corrections } : null,
    mobileSuggestion: extras.mobile ? { currentScore: extras.mobile.score, verdict: extras.mobile.verdict, ...extras.mobile.suggestion } : null,
    career: { suitableFields: uniq([...ruling.careers.slice(0, 3), ...destiny.careers.slice(0, 3)]) },
    relationship: { compatiblePartnerNumbers: friendly, challengingPartnerNumbers: dob.numberRelations.combined.enemy },
    disclaimer: 'Gemstones and remedies are traditional guidance. Consult a qualified expert before wearing any gemstone.',
  };
}
export type RemediesResult = ReturnType<typeof buildRemedies>;
