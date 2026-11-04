/** Letter charts, compound-number categories, Kua directions and tunable scoring settings. */

// ---------- Letter values ----------
export const CHALDEAN: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1, K: 2, L: 3, M: 4,
  N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7,
};

export const PYTHAGOREAN: Record<string, number> = Object.fromEntries(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((ch, i) => [ch, (i % 9) + 1]),
);

export const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

// ---------- Compound numbers (Chaldean / Cheiro tradition) ----------
export type CompoundCategory = 'favourable' | 'mixed' | 'unfavourable';

const UNFAVOURABLE = [12, 16, 18, 22, 26, 28, 29, 35, 38, 43, 44, 47, 52];
const MIXED = [11, 13, 14, 20, 30, 31, 39, 40, 48, 49];

export function compoundCategory(n: number): CompoundCategory {
  let c = n;
  while (c > 52) c = String(c).split('').reduce((a, b) => a + +b, 0);
  if (c <= 9) return [1, 3, 5, 6].includes(c) ? 'favourable' : [4, 8].includes(c) ? 'unfavourable' : 'mixed';
  if (UNFAVOURABLE.includes(c)) return 'unfavourable';
  if (MIXED.includes(c)) return 'mixed';
  return 'favourable';
}

// ---------- Kua directions (Eight Mansions) ----------
export interface KuaDirections {
  group: 'East' | 'West';
  favourable: { success: string; health: string; relationships: string; personalGrowth: string };
  unfavourable: { mishaps: string; fiveGhosts: string; sixKillings: string; totalLoss: string };
}

const k = (g: 'East' | 'West', f: string[], u: string[]): KuaDirections => ({
  group: g,
  favourable: { success: f[0], health: f[1], relationships: f[2], personalGrowth: f[3] },
  unfavourable: { mishaps: u[0], fiveGhosts: u[1], sixKillings: u[2], totalLoss: u[3] },
});

export const KUA_DIRECTIONS: Record<number, KuaDirections> = {
  1: k('East', ['South-East', 'East', 'South', 'North'], ['West', 'North-East', 'North-West', 'South-West']),
  2: k('West', ['North-East', 'West', 'North-West', 'South-West'], ['East', 'South-East', 'South', 'North']),
  3: k('East', ['South', 'North', 'South-East', 'East'], ['South-West', 'North-West', 'North-East', 'West']),
  4: k('East', ['North', 'South', 'East', 'South-East'], ['North-West', 'South-West', 'West', 'North-East']),
  6: k('West', ['West', 'North-East', 'South-West', 'North-West'], ['South-East', 'East', 'North', 'South']),
  7: k('West', ['North-West', 'South-West', 'North-East', 'West'], ['North', 'South', 'South-East', 'East']),
  8: k('West', ['South-West', 'North-West', 'West', 'North-East'], ['South', 'North', 'East', 'South-East']),
  9: k('East', ['East', 'South-East', 'North', 'South'], ['North-East', 'West', 'South-West', 'North-West']),
};

// ---------- Scoring settings (tunable by the expert) ----------
export const SCORING = {
  name: { base: 50, bhagyank: { friend: 25, neutral: 5, enemy: -25 }, moolank: { friend: 15, neutral: 3, enemy: -15 }, compound: { favourable: 10, mixed: 0, unfavourable: -12 }, heavy48Penalty: 8 },
  mobile: {
    base: 50,
    bhagyank: { friend: 18, neutral: 4, enemy: -18 },
    moolank: { friend: 14, neutral: 3, enemy: -14 },
    compound: { favourable: 6, mixed: 0, unfavourable: -6 },
    heavy48Penalty: 8,
    hardMaleficPair: 6,
    mutualEnemyPair: 3,
    maleficCap: 24,
    zeroPenaltyPerExtra: 4, // per zero beyond 2
    repeatedEnemyDigit: 3,
    missingFilledBonus: 2,
    missingFilledCap: 8,
    last4: { friend: 4, neutral: 0, enemy: -4 },
  },
  verdicts: [
    { min: 80, label: 'Highly Lucky' },
    { min: 65, label: 'Supportive' },
    { min: 45, label: 'Neutral' },
    { min: 0, label: 'Needs Change' },
  ] as const,
  /** Life-area radar: which numbers and which Lo Shu line feed each area. */
  lifeAreas: {
    career: { numbers: [1, 8, 9], line: 'will' },
    money: { numbers: [4, 6, 8], line: 'golden' },
    love: { numbers: [2, 6], line: 'emotional' },
    health: { numbers: [1, 5, 9], line: 'practical' },
    family: { numbers: [2, 6, 3], line: 'raj' },
    spirituality: { numbers: [3, 7, 9], line: 'thought' },
  } as Record<string, { numbers: number[]; line: string }>,
  /** Personal years considered favourable for each life event. */
  eventYears: {
    marriage: [2, 6],
    jobChange: [1, 5],
    businessStart: [1, 3, 5],
    propertyPurchase: [4, 6, 8],
  } as Record<string, number[]>,
  couple: {
    weights: { love: 0.2, communication: 0.15, finance: 0.15, family: 0.15, health: 0.1, stability: 0.25 },
    marriagePersonalYears: [2, 6],
    supportivePersonalYears: [1, 3, 5, 9],
  },
};

/** Hard-coded malefic mobile digit pairs used in Indian practice. */
export const HARD_MALEFIC_PAIRS = ['48', '84', '44', '88', '00'];
