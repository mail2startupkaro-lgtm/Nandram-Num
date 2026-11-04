/** 4.5 Couple / marriage compatibility. All area scores are symmetric (A,B) == (B,A). */
import { clamp, NUMBERS_1_TO_9, round } from '../core/reduce';
import { DateParts } from '../core/date';
import { mutualHarmony, relationOf, relationScore } from '../data/relations';
import { SCORING } from '../data/tables';
import { analyseDob, DobResult, Gender, personalYear } from './dob';
import { analyseNameSystem } from './name';

export interface PartnerInput {
  name: string;
  gender: Gender;
  dob: string | DateParts;
}

const coverage = (counts: Record<number, number>, nums: number[]) => (100 * nums.filter((n) => counts[n] > 0).length) / nums.length;

export function analyseCouple(a: PartnerInput, b: PartnerInput, opts: { asOf: DateParts; yearsAhead?: number }) {
  const da: DobResult = analyseDob({ dob: a.dob, gender: a.gender }, { asOf: opts.asOf });
  const db: DobResult = analyseDob({ dob: b.dob, gender: b.gender }, { asOf: opts.asOf });
  const na = analyseNameSystem(a.name, 'chaldean').nameNumber.single;
  const nb = analyseNameSystem(b.name, 'chaldean').nameNumber.single;
  const mA = da.moolank.value, bA = da.bhagyank.value, mB = db.moolank.value, bB = db.bhagyank.value;

  // Combined (overlay) grid
  const combined: Record<number, number> = {};
  const overlay = NUMBERS_1_TO_9.map((n) => {
    const ca = da.loShu.counts[n], cb = db.loShu.counts[n];
    combined[n] = ca + cb;
    return { number: n, partnerA: ca, partnerB: cb, combined: ca + cb, aBringsToB: ca > 0 && cb === 0, bBringsToA: cb > 0 && ca === 0, bothMissing: ca === 0 && cb === 0 };
  });
  const both5 = (da.loShu.counts[5] > 0 ? 1 : 0) + (db.loShu.counts[5] > 0 ? 1 : 0);
  const heavy = [mA, bA, mB, bB].filter((n) => n === 4 || n === 8).length;
  const crossFamily = (mutualHarmony(mA, bB) + mutualHarmony(mB, bA)) / 2;

  const areas = {
    love: 0.5 * mutualHarmony(mA, mB) + 0.25 * (combined[2] && combined[6] ? 100 : combined[2] || combined[6] ? 60 : 20) + 0.25 * coverage(combined, [3, 5, 7]),
    communication: 0.4 * mutualHarmony(na, nb) + 0.3 * (combined[3] && combined[5] ? 100 : combined[3] || combined[5] ? 60 : 20) + 0.3 * coverage(combined, [4, 9, 2]),
    finance: 0.4 * mutualHarmony(bA, bB) + 0.3 * coverage(combined, [8, 1, 6]) + 0.3 * coverage(combined, [4, 5, 6]),
    family: 0.4 * crossFamily + 0.3 * coverage(combined, [2, 6, 8]) + 0.3 * coverage(combined, [2, 5, 8]),
    health: 0.5 * mutualHarmony(mA, mB) + 0.25 * coverage(combined, [9, 5, 1]) + 0.25 * [30, 60, 100][both5],
    stability: 0.5 * mutualHarmony(bA, bB) + 0.25 * coverage(combined, [2, 7, 6]) + 0.25 * clamp(100 - 25 * heavy),
  };
  const areaScores = Object.fromEntries(Object.entries(areas).map(([k, v]) => [k, round(clamp(v))])) as Record<keyof typeof areas, number>;
  const w = SCORING.couple.weights;
  const overall = round(Object.entries(w).reduce((acc, [k, wt]) => acc + wt * areaScores[k as keyof typeof areas], 0));

  // Marriage-date numbers: no enemy among the four core numbers, at least two friends
  const bases = [mA, bA, mB, bB];
  const rank = NUMBERS_1_TO_9.map((n) => ({ n, sum: bases.reduce((s, x) => s + relationScore(relationOf(x, n)), 0), anyEnemy: bases.some((x) => relationOf(x, n) === 'enemy') }));
  let dateNumbers = rank.filter((r) => !r.anyEnemy && r.sum >= 2 && ![4, 8].includes(r.n)).map((r) => r.n);
  if (dateNumbers.length === 0) dateNumbers = [...rank].filter((r) => ![4, 8].includes(r.n)).sort((x, y) => y.sum - x.sum || x.n - y.n).slice(0, 3).map((r) => r.n).sort();
  const marriageDates = Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => dateNumbers.includes(((d - 1) % 9) + 1));

  const years = Array.from({ length: opts.yearsAhead ?? 10 }, (_, i) => opts.asOf.year + i).map((year) => {
    const pyA = personalYear(da.dob, year), pyB = personalYear(db.dob, year);
    const pts = (py: number) => (SCORING.couple.marriagePersonalYears.includes(py) ? 2 : SCORING.couple.supportivePersonalYears.includes(py) ? 1 : 0);
    return { year, personalYearA: pyA, personalYearB: pyB, score: pts(pyA) + pts(pyB) };
  });

  return {
    module: 'couple' as const,
    partnerA: { name: analyseNameSystem(a.name, 'chaldean').name, moolank: mA, bhagyank: bA, nameNumber: na, kua: da.kua.value, missing: da.loShu.missing },
    partnerB: { name: analyseNameSystem(b.name, 'chaldean').name, moolank: mB, bhagyank: bB, nameNumber: nb, kua: db.kua.value, missing: db.loShu.missing },
    relations: {
      moolank: { aToB: relationOf(mA, mB), bToA: relationOf(mB, mA), harmony: mutualHarmony(mA, mB) },
      bhagyank: { aToB: relationOf(bA, bB), bToA: relationOf(bB, bA), harmony: mutualHarmony(bA, bB) },
      nameNumber: { aToB: relationOf(na, nb), bToA: relationOf(nb, na), harmony: mutualHarmony(na, nb) },
    },
    areaScores,
    overall,
    combinedGrid: { overlay, bothMissing: overlay.filter((o) => o.bothMissing).map((o) => o.number) },
    marriage: { favourableDateNumbers: dateNumbers, favourableDatesOfMonth: marriageDates, auspiciousYears: years.filter((y) => y.score >= 3), yearTable: years },
  };
}
export type CoupleResult = ReturnType<typeof analyseCouple>;
