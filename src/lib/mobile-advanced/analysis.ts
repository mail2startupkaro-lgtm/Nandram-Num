/**
 * Advanced Mobile Number Analysis with Date of Birth – pure logic on top of the shared engine.
 * Same relation table, compound categories and mobile scoring as every other report, plus:
 * digit-by-digit table, pair-by-pair planets, Lo Shu grid before/after the mobile digits, life-area impact,
 * a rule checklist, a lucky-number blueprint, activation timing and a side-by-side comparison of shortlisted numbers.
 * Runs in the browser (admin preview) and on the server (PDF). Nothing is saved.
 */
import {
  analyseDob, analyseMobile, buildLoShu, lifeAreaScores, normalizeIndianMobile, NumerologyInputError, parseDate, personalMonth, personalYearOn, reduce, todayIST, toIso,
  type DateParts, type Gender, type GridSource, type MobileResult,
} from '@/lib/numerology';
import { NUMBER_PLANET, planetOf } from '@/lib/numerology/data/planets';
import { relationOf, type Relation } from '@/lib/numerology/data/relations';
import { compoundCategory, HARD_MALEFIC_PAIRS, type CompoundCategory } from '@/lib/numerology/data/tables';
import { compoundMeaning } from '@/lib/signature/numbers';

export interface MobileAdvancedInput {
  fullName: string;
  /** YYYY-MM-DD or DD-MM-YYYY */
  dob: string;
  gender?: Gender | '';
  mobile: string;
  /** Other numbers the client is considering (up to 6). */
  alternates?: string[];
  /** Report "as of" date (YYYY-MM-DD) – defaults to today in India. */
  asOf?: string;
}

export type Verdict = 'excellent' | 'good' | 'neutral' | 'change';
export type Advice = 'keep' | 'keepRemedies' | 'change';
export type CheckStatus = 'pass' | 'warn' | 'fail';
export type DigitNote = 'fills' | 'repeat' | 'enemyRepeat' | 'zeros' | 'present' | 'absent' | 'enemy';

export const verdictOf = (score: number): Verdict => (score >= 80 ? 'excellent' : score >= 65 ? 'good' : score >= 45 ? 'neutral' : 'change');
export const adviceOf = (score: number): Advice => (score >= 80 ? 'keep' : score >= 50 ? 'keepRemedies' : 'change');

export interface Check { id: string; status: CheckStatus; /** values used by the sentence for this check */ v: Record<string, string | number> }
export interface CompareRow { number: string; masked: string; compound: number; single: number; category: CompoundCategory; relB: Relation; relM: Relation; score: number; verdict: Verdict; malefic: number; current: boolean; best: boolean }

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekdayOf = (p: DateParts) => WEEKDAYS[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()];
const planetName = (n: number) => (n >= 1 && n <= 9 ? planetOf(n).name : '');

export function analyseMobileAdvanced(input: MobileAdvancedInput) {
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  if (!fullName) throw new NumerologyInputError('NAME_REQUIRED', 'Enter the client’s name.');
  if (!input.dob) throw new NumerologyInputError('DOB_REQUIRED', 'Enter the date of birth.');
  const dobP = parseDate(input.dob);
  const asOf = input.asOf ? parseDate(input.asOf) : todayIST();
  const gender: Gender = input.gender === 'female' || input.gender === 'other' ? input.gender : 'male';
  const dob = analyseDob({ dob: dobP, gender }, { asOf });
  const m = dob.moolank.value, b = dob.bhagyank.value;
  const ctx = { moolank: m, bhagyank: b, missingNumbers: dob.loShu.missing };
  const mob: MobileResult = analyseMobile(input.mobile, ctx);
  const digits = mob.number.split('').map(Number);

  // ---------- Digit table ----------
  const fillsSet = new Set(mob.missingNumbersFilled);
  const digitTable = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => {
    const count = mob.digitFrequency[d] ?? 0;
    const relB: Relation | null = d === 0 ? null : relationOf(b, d);
    let note: DigitNote;
    if (d === 0) note = count > 2 ? 'zeros' : count ? 'present' : 'absent';
    else if (count === 0) note = 'absent';
    else if (count >= 3 && relB === 'enemy') note = 'enemyRepeat';
    else if (count >= 3) note = 'repeat';
    else if (fillsSet.has(d)) note = 'fills';
    else if (relB === 'enemy') note = 'enemy';
    else note = 'present';
    return { digit: d, count, planet: d === 0 ? '' : planetName(d), relB, inDob: d === 0 ? false : (dob.loShu.counts[d] ?? 0) > 0, note };
  });

  // ---------- Pairs ----------
  const pairs = mob.pairs.map((p) => {
    const a = Number(p.pair[0]), c = Number(p.pair[1]);
    return { ...p, a, b: c, planetA: a ? planetName(a) : '', planetB: c ? planetName(c) : '', hasZero: a === 0 || c === 0, same: a === c };
  });

  // ---------- Lo Shu grid with the mobile digits ----------
  const extra: GridSource[] = digits.filter((d) => d !== 0).map((d) => ({ digit: d, source: 'dob' }));
  const combined = buildLoShu([...dob.loShu.sources, ...extra]);
  const before = lifeAreaScores(dob.loShu), after = lifeAreaScores(combined);
  const lifeAreas = Object.keys(before).map((k) => ({ area: k, before: before[k], after: after[k], diff: after[k] - before[k] }));

  // ---------- Totals ----------
  const totalChain = reduce(digits.reduce((s, d) => s + d, 0)).chain;
  const lastDigit = digits[digits.length - 1];
  const lastRelB: Relation | null = lastDigit === 0 ? null : relationOf(b, lastDigit);
  const heavy48 = (mob.total.single === 4 || mob.total.single === 8) && ![4, 8].includes(m) && ![4, 8].includes(b);
  const repeatedEnemy = mob.repeatingDigits.filter((r) => r.digit !== 0 && relationOf(b, r.digit) === 'enemy').map((r) => r.digit);

  // ---------- Rule checklist ----------
  const st = (good: boolean, bad: boolean): CheckStatus => (good ? 'pass' : bad ? 'fail' : 'warn');
  const checks: Check[] = [
    { id: 'totalB', status: st(mob.relationWithBhagyank === 'friend', mob.relationWithBhagyank === 'enemy'), v: { total: mob.total.single, b, rel: mob.relationWithBhagyank } },
    { id: 'totalM', status: st(mob.relationWithMoolank === 'friend', mob.relationWithMoolank === 'enemy'), v: { total: mob.total.single, m, rel: mob.relationWithMoolank } },
    { id: 'compound', status: st(mob.total.category === 'favourable', mob.total.category === 'unfavourable'), v: { compound: mob.total.compound, cat: mob.total.category } },
    { id: 'heavy48', status: heavy48 ? 'fail' : 'pass', v: { total: mob.total.single } },
    { id: 'malefic', status: mob.maleficPairs.length ? 'fail' : mob.conflictPairs.length ? 'warn' : 'pass', v: { malefic: mob.maleficPairs.join(', '), conflict: mob.conflictPairs.join(', '), n: mob.maleficPairs.length + mob.conflictPairs.length } },
    { id: 'zeros', status: mob.zeroCount > 2 ? 'fail' : mob.zeroCount === 2 ? 'warn' : 'pass', v: { n: mob.zeroCount } },
    { id: 'repeat', status: repeatedEnemy.length ? 'fail' : mob.repeatingDigits.length ? 'warn' : 'pass', v: { digits: (repeatedEnemy.length ? repeatedEnemy : mob.repeatingDigits.map((r) => r.digit)).join(', ') } },
    { id: 'fills', status: mob.missingNumbersFilled.length ? 'pass' : dob.loShu.missing.length ? 'warn' : 'pass', v: { filled: mob.missingNumbersFilled.join(', '), missing: dob.loShu.missing.join(', '), none: dob.loShu.missing.length ? 0 : 1 } },
    { id: 'last4', status: st(mob.last4.relationWithBhagyank === 'friend', mob.last4.relationWithBhagyank === 'enemy'), v: { digits: mob.last4.digits, total: mob.last4.single, rel: mob.last4.relationWithBhagyank } },
    { id: 'lastDigit', status: lastRelB === null ? 'warn' : st(lastRelB === 'friend', lastRelB === 'enemy'), v: { d: lastDigit, rel: lastRelB ?? 'zero' } },
  ];

  // ---------- Activation timing: next 12 months ----------
  const ideal = mob.suggestion.idealTotals;
  const months = Array.from({ length: 12 }, (_, i) => {
    const mo = ((asOf.month - 1 + i) % 12) + 1, yr = asOf.year + Math.floor((asOf.month - 1 + i) / 12);
    const py = personalYearOn(dobP, { year: yr, month: mo, day: 15 });
    const pm = personalMonth(py, mo);
    return { year: yr, month: mo, personalYear: py, personalMonth: pm, good: ideal.includes(pm) };
  });
  const bp = planetOf(b);

  // ---------- Comparison of shortlisted numbers ----------
  const invalidAlternates: string[] = [];
  const seen = new Set([mob.number]);
  const rows: CompareRow[] = [row(mob, true)];
  for (const raw of (input.alternates ?? []).map((x) => x.trim()).filter(Boolean).slice(0, 6)) {
    let n: string;
    try { n = normalizeIndianMobile(raw); } catch { invalidAlternates.push(raw); continue; }
    if (seen.has(n)) continue; seen.add(n);
    rows.push(row(analyseMobile(n, ctx), false));
  }
  const top = Math.max(...rows.map((r) => r.score));
  if (rows.length > 1) rows.forEach((r) => { r.best = r.score === top; });
  rows.sort((x, y) => y.score - x.score || Number(y.current) - Number(x.current));

  // Example favourable endings: last-4 totals (single) that are friends of Bhagyank and avoid malefic pairs
  const favourablePairs = [...new Set(mob.suggestion.favourableDigitPairs.filter((p) => p[0] !== p[1] || [m, b].includes(Number(p[0]))))].slice(0, 16);

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    asOf: toIso(asOf),
    client: { fullName, dob: toIso(dobP), weekday: weekdayOf(dobP), age: dob.age, gender },
    core: {
      moolank: { value: m, day: dobP.day, planet: dob.moolank.planetInfo.name },
      bhagyank: { value: b, compound: dob.bhagyank.compound, chain: dob.bhagyank.chain, master: dob.bhagyank.master, planet: dob.bhagyank.planetInfo.name },
      kua: { value: dob.kua.value, group: dob.kua.group },
      mbRelation: dob.moolankBhagyankRelation,
      friendly: dob.numberRelations.combined.friendly,
      neutral: dob.numberRelations.combined.neutral,
      enemy: dob.numberRelations.combined.enemy,
      personalYear: { number: dob.personalCycles.current.personalYear, label: dob.personalCycles.current.label, month: dob.personalCycles.current.personalMonth },
    },
    dobGrid: { cells: dob.loShu.cells, missing: dob.loShu.missing, repeated: dob.loShu.repeated, present: dob.loShu.present },
    mobile: {
      number: mob.number, masked: mob.masked, digits,
      total: mob.total, totalChain, planet: planetName(mob.total.single), meaning: compoundMeaning(mob.total.compound),
      relB: mob.relationWithBhagyank, relM: mob.relationWithMoolank,
      digitTable, pairs,
      malefic: mob.maleficPairs, conflict: mob.conflictPairs,
      repeating: mob.repeatingDigits, zeros: mob.zeroCount,
      last4: { ...mob.last4, planet: planetName(mob.last4.single) },
      lastDigit: { digit: lastDigit, relB: lastRelB, planet: lastDigit ? planetName(lastDigit) : '' },
      filled: mob.missingNumbersFilled,
      breakdown: mob.scoreBreakdown,
    },
    grid: { cells: combined.cells, missing: combined.missing, newlyFilled: mob.missingNumbersFilled, arrowsOfStrength: combined.arrowsOfStrength.map((a) => a.name), yogs: combined.yogs.map((y) => y.name), dobArrows: dob.loShu.arrowsOfStrength.map((a) => a.name) },
    lifeAreas,
    checks,
    score: mob.score,
    verdict: verdictOf(mob.score),
    advice: adviceOf(mob.score),
    blueprint: {
      idealTotals: ideal,
      idealCompounds: mob.suggestion.idealCompounds.slice(0, 14),
      favourablePairs,
      avoidDigits: mob.suggestion.avoidDigits,
      avoidPairs: [...new Set([...HARD_MALEFIC_PAIRS, ...mob.conflictPairs])],
      luckyDigits: [...new Set([m, b, ...ideal])].filter((d) => relationOf(b, d) !== 'enemy').sort((x, y) => x - y),
    },
    remedies: {
      planet: bp.name, weekday: bp.weekday, colours: bp.colours, mantra: bp.mantra.beej, deity: bp.deity, daan: bp.daan,
      totalPlanet: planetName(mob.total.single), totalPlanetMantra: mob.total.single ? planetOf(mob.total.single).mantra.beej : '',
    },
    months,
    comparison: rows,
    invalidAlternates,
  };

  function row(r: MobileResult, current: boolean): CompareRow {
    return { number: r.number, masked: r.masked, compound: r.total.compound, single: r.total.single, category: r.total.category, relB: r.relationWithBhagyank, relM: r.relationWithMoolank, score: r.score, verdict: verdictOf(r.score), malefic: r.maleficPairs.length + r.conflictPairs.length, current, best: false };
  }
}
export type MobileAdvancedResult = ReturnType<typeof analyseMobileAdvanced>;

/** Category of a compound total (re-exported for the UI). */
export { compoundCategory, NUMBER_PLANET };
