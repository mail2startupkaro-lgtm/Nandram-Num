/**
 * Destiny Matrix (Matrix of Destiny, Natalia Ladini method) – the full chart from a date of birth.
 *
 * Rules (checked against published worked examples, see tests/destiny-matrix.test.ts):
 *  - Every value is one of the 22 Major Arcana. A number above 22 is reduced by ADDING ITS DIGITS (repeat while > 22).
 *    (Some calculators subtract 22 instead; that is not the Ladini method and gives different charts.)
 *  - A = day (reduced), B = month, C = digit-sum of the year (reduced), D = A+B+C, E (centre) = A+B+C+D.
 *  - Ancestral square: F = A+B (top-left), G = B+C (top-right), H = C+D (bottom-right), I = D+A (bottom-left).
 *  - On every line from an outer point to the centre: point next to centre = outer + E; point next to the outer = outer + that point.
 *    The heart (Anahata) points on the A and B lines = (point next to centre) + E.
 *  - Money/relationship channel: X = C1 + D1, money point = C1 + X, love point = D1 + X.
 *  - Sky = B + D, Earth = A + C, Personal purpose = Sky + Earth; Male (father) line = F + H, Female (mother) line = G + I,
 *    Social purpose = Male + Female; Spiritual = Personal + Social; Planetary = Social + Spiritual.
 *  - Karmic tail (read from the centre outwards) = D1, D2, D.
 *  - Health map: Body = left/earth points, Energy = top/sky points, Emotions = Body + Energy; the last row sums each column.
 *  - Age scale: corners every 10 years clockwise from A (0) → F (10) → B (20) → G (30) → C (40) → H (50) → D (60) → I (70) → A (80);
 *    each 10-year side is halved three times (5, 2.5/7.5, then 1.25/3.75/6.25/8.75 years), each point = sum of its two ends.
 */
import { parseDate, type DateParts } from '@/lib/numerology/core/date';

export type Arcana = number; // 1..22

/** Reduce to 1–22 by adding digits while the number is above 22 (Ladini rule). */
export function rd(n: number): Arcana {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Destiny Matrix: invalid value ${n}`);
  let x = n;
  while (x > 22) x = String(x).split('').reduce((s, c) => s + Number(c), 0);
  return x;
}
const sum = (...xs: number[]) => rd(xs.reduce((s, x) => s + x, 0));

export interface Chakra { id: ChakraId; body: Arcana; energy: Arcana; emotion: Arcana }
export type ChakraId = 'sahasrara' | 'ajna' | 'vishuddha' | 'anahata' | 'manipura' | 'svadhisthana' | 'muladhara';
export interface AgePoint { age: number; value: Arcana; corner: boolean }

export interface DestinyMatrix {
  dob: string;
  /** Personal square and centre. */
  A: Arcana; B: Arcana; C: Arcana; D: Arcana; E: Arcana;
  /** Ancestral (family) square. */
  F: Arcana; G: Arcana; H: Arcana; I: Arcana; familyForce: Arcana;
  /** Points on the lines to the centre: x1 = next to the centre, x2 = next to the outer point, x3 = heart point (A and B lines only). */
  a1: Arcana; a2: Arcana; a3: Arcana; b1: Arcana; b2: Arcana; b3: Arcana;
  c1: Arcana; c2: Arcana; d1: Arcana; d2: Arcana;
  f1: Arcana; f2: Arcana; g1: Arcana; g2: Arcana; h1: Arcana; h2: Arcana; i1: Arcana; i2: Arcana;
  /** Money & relationship channel. */
  x: Arcana; money: Arcana; love: Arcana;
  /** Purposes. */
  sky: Arcana; earth: Arcana; personal: Arcana; male: Arcana; female: Arcana; social: Arcana; spiritual: Arcana; planetary: Arcana;
  karmicTail: [Arcana, Arcana, Arcana];
  health: Chakra[]; healthTotal: { body: Arcana; energy: Arcana; emotion: Arcana };
  ages: AgePoint[];
}

export function destinyMatrix(input: string | DateParts): DestinyMatrix {
  const p = parseDate(input);
  const A = rd(p.day);
  const B = p.month; // 1–12, never reduced
  const C = rd(String(p.year).split('').reduce((s, c) => s + Number(c), 0));
  const D = sum(A, B, C);
  const E = sum(A, B, C, D);
  const F = sum(A, B), G = sum(B, C), H = sum(C, D), I = sum(D, A);
  const line = (o: number) => { const one = sum(o, E); return [one, sum(o, one)] as const; };
  const [a1, a2] = line(A), [b1, b2] = line(B), [c1, c2] = line(C), [d1, d2] = line(D);
  const [f1, f2] = line(F), [g1, g2] = line(G), [h1, h2] = line(H), [i1, i2] = line(I);
  const a3 = sum(a1, E), b3 = sum(b1, E);
  const x = sum(c1, d1), money = sum(c1, x), love = sum(d1, x);
  const sky = sum(B, D), earth = sum(A, C), personal = sum(sky, earth);
  const male = sum(F, H), female = sum(G, I), social = sum(male, female);
  const spiritual = sum(personal, social), planetary = sum(social, spiritual);
  const rows: [ChakraId, number, number][] = [
    ['sahasrara', A, B], ['ajna', a2, b2], ['vishuddha', a1, b1], ['anahata', a3, b3], ['manipura', E, E], ['svadhisthana', c1, d1], ['muladhara', C, D],
  ];
  const health: Chakra[] = rows.map(([id, body, energy]) => ({ id, body, energy, emotion: sum(body, energy) }));
  const healthTotal = { body: sum(...health.map((h) => h.body)), energy: sum(...health.map((h) => h.energy)), emotion: sum(...health.map((h) => h.emotion)) };
  const corners = [A, F, B, G, C, H, D, I, A];
  const ages: AgePoint[] = [];
  for (let s = 0; s < 8; s++) {
    const a = corners[s], b = corners[s + 1];
    const m = sum(a, b), q1 = sum(a, m), q3 = sum(m, b);
    const vals = [a, sum(a, q1), q1, sum(q1, m), m, sum(m, q3), q3, sum(q3, b)];
    vals.forEach((v, k) => ages.push({ age: s * 10 + k * 1.25, value: v, corner: k === 0 }));
  }
  return {
    dob: `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`,
    A, B, C, D, E, F, G, H, I, familyForce: sum(F, G, H, I),
    a1, a2, a3, b1, b2, b3, c1, c2, d1, d2, f1, f2, g1, g2, h1, h2, i1, i2,
    x, money, love, sky, earth, personal, male, female, social, spiritual, planetary,
    karmicTail: [d1, d2, D], health, healthTotal, ages,
  };
}

/** The age-scale point that is active at a given age (each point covers 1.25 years). */
export function ageEnergy(m: DestinyMatrix, age: number): AgePoint {
  const a = Math.max(0, Math.min(79.99, age));
  return m.ages[Math.floor(a / 1.25)];
}

/** Age range label for an age point, e.g. 31.25 → "31¼–32½". */
export function ageRange(age: number): string {
  const f = (n: number) => { const w = Math.floor(n), r = n - w; return `${w}${r === 0.25 ? '¼' : r === 0.5 ? '½' : r === 0.75 ? '¾' : ''}`; };
  return `${f(age)}–${f(age + 1.25)}`;
}

/** How often each arcana appears among the 22 main positions – the energies that dominate the chart. */
export function dominantEnergies(m: DestinyMatrix): { arcana: Arcana; count: number }[] {
  const pts = [m.A, m.B, m.C, m.D, m.E, m.F, m.G, m.H, m.I, m.a1, m.a2, m.b1, m.b2, m.c1, m.c2, m.d1, m.d2, m.x, m.money, m.love, m.personal, m.social];
  const c = new Map<number, number>();
  for (const v of pts) c.set(v, (c.get(v) ?? 0) + 1);
  return [...c.entries()].map(([arcana, count]) => ({ arcana, count })).sort((a, b) => b.count - a.count || a.arcana - b.arcana);
}

/** Age in whole years on a date (ISO strings). */
export function ageOnIso(dob: string, asOf: string): number {
  const [y, m, d] = dob.split('-').map(Number), [Y, M, Dd] = asOf.split('-').map(Number);
  let a = Y - y; if (M < m || (M === m && Dd < d)) a--;
  return a;
}
/** Exact age in years (fractional, by days) – used to find the current 1.25-year point. */
export function exactAge(dob: string, asOf: string): number {
  const t0 = Date.UTC(...(dob.split('-').map(Number) as [number, number, number]).map((v, i) => (i === 1 ? v - 1 : v)) as [number, number, number]);
  const t1 = Date.UTC(...(asOf.split('-').map(Number) as [number, number, number]).map((v, i) => (i === 1 ? v - 1 : v)) as [number, number, number]);
  return (t1 - t0) / (365.2425 * 86_400_000);
}
