/**
 * 4.1 Date of Birth numerology: Moolank, Bhagyank, Kua, Lo Shu Grid, Vedic Grid,
 * personal cycles, friendly numbers, life cycles / pinnacles / challenges, life-area scores.
 */
import { clamp, digitsOf, frequency, NUMBERS_1_TO_9, reduce, reduceToSingle, round, sumDigits } from '../core/reduce';
import { ageOn, DateParts, parseDate, toDigitString, toIso } from '../core/date';
import { LOSHU_LAYOUT, LOSHU_LINES, VEDIC_LAYOUT } from '../data/grids';
import { NUMBER_PLANET, planetOf, PlanetId } from '../data/planets';
import { combinedRelations, CombinedRelations, Relation, relationOf, RELATION_TABLE } from '../data/relations';
import { KUA_DIRECTIONS, KuaDirections, SCORING } from '../data/tables';

export type Gender = 'male' | 'female' | 'other';
export type KuaBasis = 'male' | 'female';

export interface DobOptions {
  /** Date used for age and personal cycles. Pass explicitly for reproducible reports. */
  asOf: DateParts;
  /** For gender "other", which Kua formula to use (default male, flagged). */
  kuaBasis?: KuaBasis;
  /** 'traditional' adds Moolank to the grid only when the day is 11–31 except 20/30 (default). */
  moolankInGrid?: 'traditional' | 'always';
  includeKuaInGrid?: boolean; // default true
  yearsAhead?: number; // personal-year timeline length, default 9
}

// ---------- Primary numbers ----------

export function moolank(day: number) {
  const r = reduce(day);
  return { value: r.value, compound: day, master: r.master, planet: NUMBER_PLANET[r.value] as PlanetId };
}

export function bhagyank(dob: DateParts) {
  const r = reduce(sumDigits(toDigitString(dob)));
  return { value: r.value, compound: r.total, chain: r.chain, master: r.master, planet: NUMBER_PLANET[r.value] as PlanetId };
}

/**
 * Kua number. Reduce the birth-year digits to Y.
 * Male: 11 − Y (reduced), 5 → 2.  Female: 4 + Y (reduced), 5 → 8.
 * Equivalent to the classic pre/post-2000 formulas. Calendar year is used (no Lichun adjustment).
 */
export function kuaNumber(year: number, basis: KuaBasis): number {
  const y = reduceToSingle(sumDigits(year));
  let k = basis === 'male' ? reduceToSingle(11 - y) : reduceToSingle(4 + y);
  if (k === 5) k = basis === 'male' ? 2 : 8;
  return k;
}

// ---------- Grids ----------

export interface GridSource {
  digit: number;
  source: 'dob' | 'moolank' | 'bhagyank' | 'kua';
}

export function loShuSourceDigits(
  dob: DateParts,
  m: number,
  b: number,
  kua: number | null,
  moolankRule: 'traditional' | 'always' = 'traditional',
): GridSource[] {
  const src: GridSource[] = digitsOf(toDigitString(dob))
    .filter((d) => d !== 0)
    .map((d) => ({ digit: d, source: 'dob' as const }));
  const addMoolank = moolankRule === 'always' || (dob.day >= 11 && dob.day !== 20 && dob.day !== 30);
  if (addMoolank) src.push({ digit: m, source: 'moolank' });
  src.push({ digit: b, source: 'bhagyank' });
  if (kua !== null) src.push({ digit: kua, source: 'kua' });
  return src;
}

export type CellStatus = 'missing' | 'present' | 'repeated';

export interface GridCell {
  number: number;
  row: number;
  col: number;
  count: number;
  status: CellStatus;
  planet: PlanetId;
}

function buildCells(layout: number[][], counts: number[]): GridCell[] {
  const cells: GridCell[] = [];
  layout.forEach((row, r) =>
    row.forEach((n, c) =>
      cells.push({ number: n, row: r, col: c, count: counts[n], status: counts[n] === 0 ? 'missing' : counts[n] === 1 ? 'present' : 'repeated', planet: NUMBER_PLANET[n] }),
    ),
  );
  return cells;
}

export interface LineResult {
  id: string;
  name: string;
  numbers: number[];
  orientation: string;
  presentCount: number;
  status: 'complete' | 'partial' | 'empty';
  arrow: string | null; // strength or weakness arrow when complete / empty
  yog: string | null;
}

export function analyseLines(counts: number[]): LineResult[] {
  return LOSHU_LINES.map((l) => {
    const presentCount = l.numbers.filter((n) => counts[n] > 0).length;
    const status = presentCount === 3 ? 'complete' : presentCount === 0 ? 'empty' : 'partial';
    return {
      id: l.id,
      name: l.name,
      numbers: [...l.numbers],
      orientation: l.orientation,
      presentCount,
      status,
      arrow: status === 'complete' ? l.strengthName : status === 'empty' ? l.weaknessName : null,
      yog: status === 'complete' && l.yog ? l.yog : null,
    };
  });
}

export function buildLoShu(sources: GridSource[]) {
  const counts = frequency(sources.map((s) => s.digit));
  const cells = buildCells(LOSHU_LAYOUT, counts);
  const lines = analyseLines(counts);
  return {
    layout: LOSHU_LAYOUT,
    sources,
    counts: Object.fromEntries(NUMBERS_1_TO_9.map((n) => [n, counts[n]])) as Record<number, number>,
    cells,
    present: NUMBERS_1_TO_9.filter((n) => counts[n] > 0),
    missing: NUMBERS_1_TO_9.filter((n) => counts[n] === 0),
    repeated: NUMBERS_1_TO_9.filter((n) => counts[n] > 1).map((n) => ({ number: n, count: counts[n] })),
    planes: lines.filter((l) => l.orientation !== 'diagonal'),
    diagonals: lines.filter((l) => l.orientation === 'diagonal'),
    yogs: lines.filter((l) => l.yog).map((l) => ({ name: l.yog as string, numbers: l.numbers })),
    arrowsOfStrength: lines.filter((l) => l.status === 'complete').map((l) => ({ name: l.arrow as string, lineId: l.id, numbers: l.numbers })),
    arrowsOfWeakness: lines.filter((l) => l.status === 'empty').map((l) => ({ name: l.arrow as string, lineId: l.id, numbers: l.numbers })),
  };
}
export type LoShuGrid = ReturnType<typeof buildLoShu>;

export function buildVedicGrid(sources: GridSource[]) {
  const counts = frequency(sources.map((s) => s.digit));
  return {
    layout: VEDIC_LAYOUT,
    cells: buildCells(VEDIC_LAYOUT, counts).map((c) => ({ ...c, planetName: planetOf(c.number).name, planetHindi: planetOf(c.number).hindiName })),
    strongPlanets: NUMBERS_1_TO_9.filter((n) => counts[n] >= 2).map((n) => NUMBER_PLANET[n]),
    weakPlanets: NUMBERS_1_TO_9.filter((n) => counts[n] === 0).map((n) => NUMBER_PLANET[n]),
  };
}

// ---------- Cycles ----------

export const universalYear = (year: number) => reduceToSingle(sumDigits(year));

export function personalYear(dob: DateParts, year: number): number {
  return reduceToSingle(sumDigits(dob.day) + sumDigits(dob.month) + sumDigits(year));
}
export const personalMonth = (py: number, month: number) => reduceToSingle(py + month);
export const personalDay = (pm: number, day: number) => reduceToSingle(pm + day);

export function personalCycles(dob: DateParts, asOf: DateParts, yearsAhead = 9) {
  const pyNow = personalYear(dob, asOf.year);
  const pmNow = personalMonth(pyNow, asOf.month);
  const timeline = Array.from({ length: yearsAhead }, (_, i) => {
    const year = asOf.year + i;
    return { year, universalYear: universalYear(year), personalYear: personalYear(dob, year) };
  });
  const detailed = timeline.slice(0, 4).map((t) => ({
    ...t,
    months: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, personalMonth: personalMonth(t.personalYear, i + 1) })),
  }));
  return {
    asOf: toIso(asOf),
    current: { personalYear: pyNow, personalMonth: pmNow, personalDay: personalDay(pmNow, asOf.day) },
    timeline,
    detailed,
  };
}

/** Pythagorean life cycles, pinnacles and challenges (ages per the 36 − Life Path rule). */
export function lifePeriods(dob: DateParts, lifePath: number, age: number) {
  const m = reduceToSingle(dob.month);
  const d = reduceToSingle(dob.day);
  const y = reduceToSingle(sumDigits(dob.year));
  const firstEnd = 36 - lifePath;
  const p1 = reduce(m + d), p2 = reduce(d + y), p3 = reduce(p1.value + p2.value), p4 = reduce(m + y);
  const ranges: [number, number | null][] = [
    [0, firstEnd],
    [firstEnd + 1, firstEnd + 9],
    [firstEnd + 10, firstEnd + 18],
    [firstEnd + 19, null],
  ];
  const isCurrent = (from: number, to: number | null) => age >= from && (to === null || age <= to);
  const pinnacles = [p1, p2, p3, p4].map((p, i) => ({
    index: i + 1, number: p.value, master: p.master, fromAge: ranges[i][0], toAge: ranges[i][1], current: isCurrent(ranges[i][0], ranges[i][1]),
  }));
  const c1 = Math.abs(m - d), c2 = Math.abs(d - y);
  const challenges = [c1, c2, Math.abs(c1 - c2), Math.abs(m - y)].map((c, i) => ({
    index: i + 1, number: c, fromAge: ranges[i][0], toAge: ranges[i][1], current: isCurrent(ranges[i][0], ranges[i][1]),
  }));
  const cycleRanges: [number, number | null][] = [[0, firstEnd], [firstEnd + 1, firstEnd + 27], [firstEnd + 28, null]];
  const lifeCycles = [m, d, y].map((n, i) => ({
    index: i + 1, name: ['Formative', 'Productive', 'Harvest'][i], number: n, fromAge: cycleRanges[i][0], toAge: cycleRanges[i][1], current: isCurrent(cycleRanges[i][0], cycleRanges[i][1]),
  }));
  return { lifeCycles, pinnacles, challenges };
}

// ---------- Life-area scores (radar) ----------

export function lifeAreaScores(grid: LoShuGrid): Record<string, number> {
  const lineById = Object.fromEntries([...grid.planes, ...grid.diagonals].map((l) => [l.id, l]));
  const out: Record<string, number> = {};
  for (const [area, cfg] of Object.entries(SCORING.lifeAreas)) {
    const present = cfg.numbers.filter((n) => grid.counts[n] > 0).length / cfg.numbers.length;
    const line = lineById[cfg.line].presentCount / 3;
    const overload = cfg.numbers.filter((n) => grid.counts[n] >= 4).length * 5;
    out[area] = round(clamp(25 + 55 * present + 20 * line - overload));
  }
  return out;
}

// ---------- Main entry ----------

export interface DobInput {
  dob: string | DateParts;
  gender: Gender;
}

export function analyseDob(input: DobInput, opts: DobOptions) {
  const dob = parseDate(input.dob);
  const asOf = parseDate(opts.asOf);
  const flags: string[] = [];

  const m = moolank(dob.day);
  const b = bhagyank(dob);
  const basis: KuaBasis = input.gender === 'other' ? opts.kuaBasis ?? 'male' : input.gender;
  if (input.gender === 'other' && !opts.kuaBasis) flags.push('KUA_BASIS_DEFAULTED_MALE');
  const kua = kuaNumber(dob.year, basis);
  const kuaDirs: KuaDirections = KUA_DIRECTIONS[kua];

  const sources = loShuSourceDigits(dob, m.value, b.value, opts.includeKuaInGrid === false ? null : kua, opts.moolankInGrid);
  const loShu = buildLoShu(sources);
  const vedicGrid = buildVedicGrid(sources.filter((s) => s.source !== 'kua'));
  const age = ageOn(dob, asOf);

  const forMoolank = RELATION_TABLE[m.value];
  const forBhagyank = RELATION_TABLE[b.value];
  const combined: CombinedRelations = combinedRelations([m.value, b.value]);
  const mbRelation: Relation = relationOf(m.value, b.value);

  // Strength / weakness codes for the narrative knowledge base
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  loShu.yogs.forEach((y) => strengths.push(`YOG_${y.name.toUpperCase().replace(/\s+/g, '_')}`));
  loShu.arrowsOfStrength.forEach((a) => strengths.push(`ARROW_STRENGTH_${a.lineId.toUpperCase()}`));
  loShu.arrowsOfWeakness.forEach((a) => weaknesses.push(`ARROW_WEAKNESS_${a.lineId.toUpperCase()}`));
  loShu.missing.forEach((n) => weaknesses.push(`MISSING_${n}`));
  loShu.repeated.filter((r) => r.count >= 3).forEach((r) => weaknesses.push(`EXCESS_${r.number}_x${r.count}`));
  if (mbRelation === 'friend') strengths.push('MOOLANK_BHAGYANK_FRIENDLY');
  if (mbRelation === 'enemy') weaknesses.push('MOOLANK_BHAGYANK_CONFLICT');
  if (b.master) strengths.push(`MASTER_${b.master}`);

  return {
    module: 'dob' as const,
    dob: { ...dob, iso: toIso(dob) },
    gender: input.gender,
    age,
    moolank: { ...m, planetInfo: { name: planetOf(m.value).name, hindi: planetOf(m.value).hindiName } },
    bhagyank: { ...b, planetInfo: { name: planetOf(b.value).name, hindi: planetOf(b.value).hindiName } },
    moolankBhagyankRelation: mbRelation,
    kua: { value: kua, basis, ...kuaDirs },
    loShu,
    vedicGrid,
    personalCycles: personalCycles(dob, asOf, opts.yearsAhead ?? 9),
    numberRelations: { forMoolank, forBhagyank, combined },
    ...lifePeriods(dob, b.value, age),
    lifeAreaScores: lifeAreaScores(loShu),
    strengths,
    weaknesses,
    flags,
  };
}
export type DobResult = ReturnType<typeof analyseDob>;
