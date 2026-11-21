/**
 * Pythagorean birth chart – the "Pythagoras Square" / Psychomatrix (A. Aleksandrov school) – from a date of birth.
 *
 *  1st working number = sum of all digits of the date (DD MM YYYY).
 *  2nd = sum of the digits of the 1st.
 *  3rd = 1st − 2 × (first non-zero digit of the day). If this is negative (it happens for many people born in 2000 or later)
 *        the absolute value is used – the classic rule, applied the same way for every year of birth.
 *  4th = sum of the digits of the 3rd.
 *  The digits of the date and of all four working numbers – zeros excluded – are counted into nine cells.
 *
 * Grid layout (traditional):   1 4 7
 *                              2 5 8
 *                              3 6 9
 * Rows: 1-4-7 Purpose, 2-5-8 Family, 3-6-9 Habits & stability.  Columns: 1-2-3 Self-esteem, 4-5-6 Money & home, 7-8-9 Talent.
 * Diagonals: 1-5-9 Spirituality, 3-5-7 Temperament (the naming used by most schools).
 */
import { parseDate, type DateParts } from '@/lib/numerology/core/date';

export type CellDigit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type LineId = 'purpose' | 'family' | 'stability' | 'selfEsteem' | 'money' | 'talent' | 'spirituality' | 'temperament';
export type Level = 'weak' | 'normal' | 'strong' | 'veryStrong';

export const LINES: { id: LineId; digits: [CellDigit, CellDigit, CellDigit]; kind: 'row' | 'column' | 'diagonal' }[] = [
  { id: 'purpose', digits: [1, 4, 7], kind: 'row' }, { id: 'family', digits: [2, 5, 8], kind: 'row' }, { id: 'stability', digits: [3, 6, 9], kind: 'row' },
  { id: 'selfEsteem', digits: [1, 2, 3], kind: 'column' }, { id: 'money', digits: [4, 5, 6], kind: 'column' }, { id: 'talent', digits: [7, 8, 9], kind: 'column' },
  { id: 'spirituality', digits: [1, 5, 9], kind: 'diagonal' }, { id: 'temperament', digits: [3, 5, 7], kind: 'diagonal' },
];

export interface Psychomatrix {
  dob: string;
  dateDigits: number[];
  working: [number, number, number, number];
  /** True when the 3rd working number came out negative and its absolute value was used. */
  absUsed: boolean;
  counts: Record<CellDigit, number>;
  lines: { id: LineId; digits: CellDigit[]; total: number; level: Level }[];
  /** Number of digits placed in the square (zeros excluded). */
  totalDigits: number;
  empty: CellDigit[];
  strongest: CellDigit[];
}

const digitSum = (n: number) => String(Math.abs(n)).split('').reduce((s, c) => s + Number(c), 0);
export const lineLevel = (total: number): Level => (total <= 2 ? 'weak' : total <= 4 ? 'normal' : total <= 6 ? 'strong' : 'veryStrong');
/** Cell strength by how many times the digit appears: 0 empty, 1 weak, 2 normal, 3–4 strong, 5+ very strong. */
export const cellLevel = (count: number): 'empty' | Level => (count === 0 ? 'empty' : count === 1 ? 'weak' : count === 2 ? 'normal' : count <= 4 ? 'strong' : 'veryStrong');

export function psychomatrix(input: string | DateParts): Psychomatrix {
  const p = parseDate(input);
  const ds = `${String(p.day).padStart(2, '0')}${String(p.month).padStart(2, '0')}${p.year}`;
  const dateDigits = ds.split('').map(Number);
  const w1 = dateDigits.reduce((s, x) => s + x, 0);
  const w2 = digitSum(w1);
  const firstDayDigit = String(p.day).split('').map(Number).find((x) => x !== 0)!;
  const raw3 = w1 - 2 * firstDayDigit;
  const w3 = Math.abs(raw3);
  const w4 = digitSum(w3);
  const all = [...dateDigits, ...[w1, w2, w3, w4].flatMap((n) => String(n).split('').map(Number))].filter((x) => x !== 0);
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } as Record<CellDigit, number>;
  for (const d of all) counts[d as CellDigit]++;
  const lines = LINES.map((l) => { const total = l.digits.reduce((s, d) => s + counts[d], 0); return { id: l.id, digits: l.digits, total, level: lineLevel(total) }; });
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9] as CellDigit[];
  const max = Math.max(...digits.map((d) => counts[d]));
  return {
    dob: `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`,
    dateDigits, working: [w1, w2, w3, w4], absUsed: raw3 < 0, counts, lines, totalDigits: all.length,
    empty: digits.filter((d) => counts[d] === 0), strongest: max >= 3 ? digits.filter((d) => counts[d] === max) : [],
  };
}

/** The digits of a cell as printed in the square, e.g. 3 ones → "111", none → "—". */
export const cellText = (d: CellDigit, count: number) => (count ? String(d).repeat(count) : '—');
