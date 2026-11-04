/**
 * 4.4 Aadhaar number vibration.
 * PRIVACY CONTRACT: the returned object never contains the full number or its digit sequence.
 * Only the masked form (last 4 digits), totals and derived relations leave this function.
 * Callers must not persist or log the raw input (enforced again at the API layer).
 */
import { clamp, digitsOf, frequency, NumerologyInputError, reduce, round } from '../core/reduce';
import { relationOf } from '../data/relations';
import { compoundCategory, SCORING } from '../data/tables';
import { verdictFor } from './mobile';

// Verhoeff checksum tables (UIDAI uses Verhoeff for the 12th digit)
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
const INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export function verhoeffValid(num: string): boolean {
  let c = 0;
  const ds = digitsOf(num).reverse();
  ds.forEach((d, i) => (c = D[c][P[i % 8][d]]));
  return c === 0;
}

export function verhoeffCheckDigit(num: string): number {
  let c = 0;
  const ds = digitsOf(num).reverse();
  ds.forEach((d, i) => (c = D[c][P[(i + 1) % 8][d]]));
  return INV[c];
}

export const maskAadhaar = (digits: string) => `XXXX-XXXX-${digits.slice(-4)}`;

export interface AadhaarContext {
  moolank: number;
  bhagyank: number;
  missingNumbers: number[];
  gridCounts: Record<number, number>;
}

export function analyseAadhaar(raw: string, ctx: AadhaarContext, opts: { consent: boolean }) {
  if (!opts.consent) throw new NumerologyInputError('AADHAAR_NO_CONSENT', 'Aadhaar analysis requires explicit consent.');
  const digitsStr = raw.replace(/\D/g, '');
  if (!/^[2-9]\d{11}$/.test(digitsStr)) throw new NumerologyInputError('AADHAAR_FORMAT', 'Aadhaar must be 12 digits and cannot start with 0 or 1.');
  if (!verhoeffValid(digitsStr)) throw new NumerologyInputError('AADHAAR_CHECKSUM', 'This Aadhaar number fails the checksum. Please re-check it.');

  const digits = digitsOf(digitsStr);
  const freq = frequency(digits);
  const total = reduce(digits.reduce((a, b) => a + b, 0));
  const relB = relationOf(ctx.bhagyank, total.value);
  const relM = relationOf(ctx.moolank, total.value);
  const category = compoundCategory(total.total);
  const filled = ctx.missingNumbers.filter((n) => freq[n] > 0);
  const overloaded = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => (ctx.gridCounts[n] ?? 0) + freq[n] >= 4);
  const s = SCORING.mobile;
  const score = round(clamp(s.base + s.bhagyank[relB] + s.moolank[relM] + s.compound[category] + Math.min(s.missingFilledCap, filled.length * s.missingFilledBonus) - overloaded.length * 3));

  return {
    module: 'aadhaar' as const,
    masked: maskAadhaar(digitsStr),
    total: { compound: total.total, single: total.value, master: total.master, category },
    relationWithBhagyank: relB,
    relationWithMoolank: relM,
    gridEffect: { missingNumbersFilled: filled, overloadedNumbers: overloaded },
    score,
    verdict: verdictFor(score),
    note: 'An Aadhaar number cannot be changed; use this vibration only to choose supportive remedies.',
  };
}
export type AadhaarResult = ReturnType<typeof analyseAadhaar>;
