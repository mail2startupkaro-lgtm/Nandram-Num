/**
 * Friendly / Neutral / Enemy numbers, derived from Vedic natural planetary friendship
 * (Naisargika Maitri) with each number counted as friendly to itself.
 * Rahu (4) and Ketu (7) follow Saturn-like / Mars-like behaviour respectively.
 * Rows are asymmetric by design (as in Vedic tradition). Expert-overridable.
 */
import { NUMBERS_1_TO_9 } from '../core/reduce';

export type Relation = 'friend' | 'neutral' | 'enemy';

export const RELATION_TABLE: Record<number, { friend: number[]; neutral: number[]; enemy: number[] }> = {
  1: { friend: [1, 2, 3, 9], neutral: [5], enemy: [4, 6, 7, 8] },
  2: { friend: [1, 2, 5], neutral: [3, 6, 8, 9], enemy: [4, 7] },
  3: { friend: [1, 2, 3, 7, 9], neutral: [4, 8], enemy: [5, 6] },
  4: { friend: [4, 5, 6, 8], neutral: [3, 7], enemy: [1, 2, 9] },
  5: { friend: [1, 4, 5, 6], neutral: [3, 7, 8, 9], enemy: [2] },
  6: { friend: [4, 5, 6, 8], neutral: [3, 7, 9], enemy: [1, 2] },
  7: { friend: [3, 7, 9], neutral: [4, 5, 6, 8], enemy: [1, 2] },
  8: { friend: [4, 5, 6, 8], neutral: [3, 7], enemy: [1, 2, 9] },
  9: { friend: [1, 2, 3, 7, 9], neutral: [6, 8], enemy: [4, 5] },
};

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
