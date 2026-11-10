/** 4.3 Mobile number numerology. */
import { clamp, digitsOf, frequency, NumerologyInputError, reduce, round } from '../core/reduce';
import { isMutualEnemy, relationOf } from '../data/relations';
import { compoundCategory, HARD_MALEFIC_PAIRS, SCORING } from '../data/tables';
import { combinedRelations } from '../data/relations';

/** Accepts +91 / 0-prefixed / spaced input; returns the 10-digit Indian mobile number. */
export function normalizeIndianMobile(raw: string): string {
  let d = raw.replace(/\D/g, '');
  // International / trunk prefixes: 0091…, 091…, +91 0…, 91…, 0…
  if (d.length === 14 && d.startsWith('0091')) d = d.slice(4);
  if (d.length === 13 && (d.startsWith('091') || d.startsWith('910'))) d = d.slice(3);
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (!/^[6-9]\d{9}$/.test(d)) throw new NumerologyInputError('MOBILE_INVALID', 'Enter a valid 10-digit Indian mobile number starting with 6–9.');
  return d;
}

export function verdictFor(score: number): string {
  return SCORING.verdicts.find((v) => score >= v.min)!.label;
}

/** Mobile totals (single + favourable compounds 19–72) that suit a person – used by mobile analysis and the lucky-number finder. */
export function mobileIdealTotals(moolank: number, bhagyank: number) {
  const rel = combinedRelations([moolank, bhagyank]);
  let idealTotals = rel.friendly.filter((n) => ![4, 8].includes(n) || [moolank, bhagyank].includes(n));
  if (idealTotals.length === 0) idealTotals = rel.neutral.filter((n) => ![4, 8].includes(n));
  const idealCompounds: number[] = [];
  for (let c = 19; c <= 72; c++) if (idealTotals.includes(reduce(c).value) && compoundCategory(c) === 'favourable') idealCompounds.push(c);
  return { idealTotals, idealCompounds };
}

export interface MobileContext {
  moolank: number;
  bhagyank: number;
  /** Numbers missing from the person's Lo Shu grid. */
  missingNumbers: number[];
}

export function analyseMobile(raw: string, ctx: MobileContext) {
  const number = normalizeIndianMobile(raw);
  const digits = digitsOf(number);
  const s = SCORING.mobile;
  const total = reduce(digits.reduce((a, b) => a + b, 0));
  const relB = relationOf(ctx.bhagyank, total.value);
  const relM = relationOf(ctx.moolank, total.value);
  const category = compoundCategory(total.total);
  const freq = frequency(digits);

  const pairs = digits.slice(0, -1).map((d, i) => {
    const pair = `${d}${digits[i + 1]}`;
    const kind = HARD_MALEFIC_PAIRS.includes(pair)
      ? 'malefic'
      : isMutualEnemy(d, digits[i + 1])
        ? 'conflict'
        : d !== 0 && digits[i + 1] !== 0 && relationOf(d, digits[i + 1]) === 'friend' && relationOf(digits[i + 1], d) === 'friend'
          ? 'supportive'
          : 'neutral';
    return { position: i + 1, pair, kind };
  });
  const malefic = pairs.filter((p) => p.kind === 'malefic');
  const conflict = pairs.filter((p) => p.kind === 'conflict');
  const repeating = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => freq[d] >= 3).map((d) => ({ digit: d, count: freq[d] }));
  const zeros = freq[0];
  const filled = ctx.missingNumbers.filter((n) => freq[n] > 0);
  const last4Digits = digits.slice(-4);
  const last4 = reduce(last4Digits.reduce((a, b) => a + b, 0));
  const last4Rel = relationOf(ctx.bhagyank, last4.value);

  const breakdown: Record<string, number> = {
    base: s.base,
    bhagyankRelation: s.bhagyank[relB],
    moolankRelation: s.moolank[relM],
    compound: s.compound[category],
    heavy48: (total.value === 4 || total.value === 8) && ![4, 8].includes(ctx.moolank) && ![4, 8].includes(ctx.bhagyank) ? -s.heavy48Penalty : 0,
    maleficPairs: -Math.min(s.maleficCap, malefic.length * s.hardMaleficPair + conflict.length * s.mutualEnemyPair),
    zeros: zeros > 2 ? -(zeros - 2) * s.zeroPenaltyPerExtra : 0,
    repeatedEnemyDigits: -repeating.filter((r) => r.digit !== 0 && relationOf(ctx.bhagyank, r.digit) === 'enemy').length * s.repeatedEnemyDigit,
    missingFilled: Math.min(s.missingFilledCap, filled.length * s.missingFilledBonus),
    last4: s.last4[last4Rel],
  };
  for (const k of Object.keys(breakdown)) breakdown[k] = breakdown[k] || 0; // normalise -0
  const score = round(clamp(Object.values(breakdown).reduce((a, b) => a + b, 0)));

  // Suggestions
  const rel = combinedRelations([ctx.moolank, ctx.bhagyank]);
  const { idealTotals, idealCompounds } = mobileIdealTotals(ctx.moolank, ctx.bhagyank);
  const goodDigits = idealTotals;
  const goodPairs: string[] = [];
  for (const a of goodDigits) for (const b of goodDigits) if (relationOf(a, b) === 'friend' && relationOf(b, a) === 'friend') goodPairs.push(`${a}${b}`);
  const avoidDigits = rel.enemy;

  const flags: string[] = [];
  if (malefic.length) flags.push('MALEFIC_PAIRS');
  if (zeros >= 3) flags.push('TOO_MANY_ZEROS');
  if (repeating.length) flags.push('REPEATING_DIGITS');
  if (relB === 'enemy') flags.push('TOTAL_ENEMY_OF_BHAGYANK');

  return {
    module: 'mobile' as const,
    masked: `${number.slice(0, 2)}XXXXXX${number.slice(-2)}`,
    number, // mobile is stored per DPDP consent; Aadhaar is never returned (see aadhaar.ts)
    total: { compound: total.total, single: total.value, master: total.master, category },
    relationWithBhagyank: relB,
    relationWithMoolank: relM,
    digitFrequency: Object.fromEntries(freq.map((c, d) => [d, c])) as Record<number, number>,
    repeatingDigits: repeating,
    zeroCount: zeros,
    pairs,
    maleficPairs: malefic.map((p) => p.pair),
    conflictPairs: conflict.map((p) => p.pair),
    missingNumbersFilled: filled,
    last4: { digits: last4Digits.join(''), compound: last4.total, single: last4.value, relationWithBhagyank: last4Rel },
    scoreBreakdown: breakdown,
    score,
    verdict: verdictFor(score),
    suggestion: { idealTotals, idealCompounds, favourableDigitPairs: goodPairs, avoidDigits, avoidPairs: HARD_MALEFIC_PAIRS },
    flags,
  };
}
export type MobileResult = ReturnType<typeof analyseMobile>;
