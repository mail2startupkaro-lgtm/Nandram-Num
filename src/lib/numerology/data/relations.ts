/**
 * Friendly / Neutral / Enemy numbers – the house table (owner decision 2026-11-09).
 * It is the single source of truth: the Mulank 1–9 pages read their "compatible" / "avoid" lists from here,
 * and every score (name, mobile, Aadhaar, couple, lucky numbers, remedies) uses it.
 * Each number is also friendly to itself. Numbers not listed as friend or enemy are neutral.
 * Rows are asymmetric by design (how 2 sees 4 can differ from how 4 sees 2). Expert-overridable.
 */
import { NUMBERS_1_TO_9 } from '../core/reduce';

export type Relation = 'friend' | 'neutral' | 'enemy';

/** Compatible / avoid lists exactly as published on the Mulank pages (self not included). */
export const MULANK_COMPATIBILITY: Record<number, { compatible: number[]; avoid: number[] }> = {
  1: { compatible: [2, 3, 5, 9], avoid: [8] },
  2: { compatible: [1, 4, 6, 7], avoid: [5, 9] },
  3: { compatible: [1, 2, 5, 9], avoid: [4, 8] },
  4: { compatible: [1, 5, 7, 8], avoid: [3, 9] },
  5: { compatible: [1, 3, 4, 6], avoid: [2] },
  6: { compatible: [2, 3, 5, 9], avoid: [1, 8] },
  7: { compatible: [1, 2, 4], avoid: [8, 9] },
  8: { compatible: [4, 5, 6], avoid: [1, 2, 3, 7, 9] },
  9: { compatible: [1, 3, 6], avoid: [4, 7, 8] },
};

export const RELATION_TABLE: Record<number, { friend: number[]; neutral: number[]; enemy: number[] }> = Object.fromEntries(
  NUMBERS_1_TO_9.map((n) => {
    const { compatible, avoid } = MULANK_COMPATIBILITY[n];
    const friend = [...new Set([n, ...compatible])].sort((a, b) => a - b);
    const enemy = [...avoid].sort((a, b) => a - b);
    const neutral = NUMBERS_1_TO_9.filter((x) => !friend.includes(x) && !enemy.includes(x));
    return [n, { friend, neutral, enemy }];
  }),
);

/** How `base` (e.g. the person's Bhagyank) sees `other` (e.g. a mobile total). */
export function relationOf(base: number, other: number): Relation {
  const row = RELATION_TABLE[base];
  if (!row) throw new RangeError(`relationOf: base must be 1–9, got ${base}`);
  if (row.friend.includes(other)) return 'friend';
  if (row.enemy.includes(other)) return 'enemy';
  return 'neutral';
}

export const relationScore = (r: Relation): number => (r === 'friend' ? 1 : r === 'enemy' ? -1 : 0);

/** Symmetric harmony between two numbers on a 0–100 scale. */
export function mutualHarmony(a: number, b: number): number {
  const s = (relationScore(relationOf(a, b)) + relationScore(relationOf(b, a))) / 2;
  return 50 + 50 * s;
}

export interface CombinedRelations {
  friendly: number[];
  neutral: number[];
  enemy: number[];
}

/**
 * Classify 1–9 against several base numbers at once (e.g. Moolank + Bhagyank).
 * Sum of scores ≥1 → friendly, 0 → neutral, <0 → enemy.
 */
export function combinedRelations(bases: number[]): CombinedRelations {
  const out: CombinedRelations = { friendly: [], neutral: [], enemy: [] };
  for (const n of NUMBERS_1_TO_9) {
    const s = bases.reduce((acc, b) => acc + relationScore(relationOf(b, n)), 0);
    if (s >= 1) out.friendly.push(n);
    else if (s === 0) out.neutral.push(n);
    else out.enemy.push(n);
  }
  return out;
}

/** Pairs where both numbers treat each other as enemies (used for mobile digit pairs). */
export function isMutualEnemy(a: number, b: number): boolean {
  if (a === 0 || b === 0) return false;
  return relationOf(a, b) === 'enemy' && relationOf(b, a) === 'enemy';
}
