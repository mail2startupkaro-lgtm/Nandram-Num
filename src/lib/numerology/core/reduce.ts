/**
 * Core digit arithmetic. Pure functions only – no I/O, no randomness, no clock.
 */

export const MASTER_NUMBERS = [11, 22, 33] as const;

export class NumerologyInputError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'NumerologyInputError';
  }
}

/** All decimal digits contained in a number or string (non-digits ignored). */
export function digitsOf(input: number | string): number[] {
  return String(input)
    .replace(/\D/g, '')
    .split('')
    .map(Number);
}

export function sumDigits(input: number | string): number {
  return digitsOf(input).reduce((a, b) => a + b, 0);
}

export interface Reduction {
  /** The unreduced total (the "compound" number). */
  total: number;
  /** Final single digit 0–9 (0 only for an empty/zero total). */
  value: number;
  /** Every step of the reduction, e.g. [38, 11, 2]. */
  chain: number[];
  /** First master number met during reduction (11 / 22 / 33), else null. */
  master: number | null;
}

export function reduce(total: number): Reduction {
  if (!Number.isInteger(total) || total < 0) {
    throw new RangeError(`reduce() expects a non-negative integer, got ${total}`);
  }
  const chain = [total];
  let n = total;
  while (n > 9) {
    n = sumDigits(n);
    chain.push(n);
  }
  const master = chain.find((c) => (MASTER_NUMBERS as readonly number[]).includes(c)) ?? null;
  return { total, value: n, chain, master };
}

export const reduceToSingle = (n: number): number => reduce(n).value;

export const clamp = (n: number, lo = 0, hi = 100): number => Math.min(hi, Math.max(lo, n));

export const round = (n: number): number => Math.round(n);

/** Count occurrences of 1–9 in a digit list (index 0 unused for grids, kept for zero counts). */
export function frequency(digits: number[]): number[] {
  const f = new Array(10).fill(0);
  for (const d of digits) f[d]++;
  return f;
}

export const NUMBERS_1_TO_9: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
