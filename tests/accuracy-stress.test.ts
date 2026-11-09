/**
 * Accuracy stress test: every calendar date from 1900-01-01 to the report date, plus thousands of
 * names and mobile numbers, checked against an independent re-implementation of the textbook rules
 * (written without reusing any engine code). Any change to the engine that alters a core number fails here.
 */
import { describe, expect, it } from 'vitest';
import { analyseDob, analyseMobile, analyseNameSystem, normalizeIndianMobile, parseDate } from '../src/lib/numerology';

const AS_OF = parseDate('2026-11-09');
const ds = (n: number | string) => String(n).split('').filter((c) => /\d/.test(c)).reduce((a, c) => a + Number(c), 0);
const red = (n: number) => { while (n > 9) n = ds(n); return n; };
const pad = (n: number) => String(n).padStart(2, '0');

/** Kua by the classic two-digit-year method (pre/post 2000), not the engine's full-year formula. */
function refKua(year: number, g: 'male' | 'female') {
  const L = red(year % 100);
  let k = year < 2000 ? (g === 'male' ? red(10 - L) || 9 : red(5 + L)) : g === 'male' ? (9 - L > 0 ? 9 - L : 9) : red(6 + L);
  if (k === 5) k = g === 'male' ? 2 : 8;
  return k;
}

const CHAL: Record<string, number> = Object.fromEntries('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c, i) => [c, [1, 2, 3, 4, 5, 8, 3, 5, 1, 1, 2, 3, 4, 5, 7, 8, 1, 2, 3, 4, 6, 6, 6, 5, 1, 7][i]]));
const PYT: Record<string, number> = Object.fromEntries('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c, i) => [c, (i % 9) + 1]));

function* allDates() {
  for (let t = Date.UTC(1900, 0, 1); t <= Date.UTC(AS_OF.year, AS_OF.month - 1, AS_OF.day); t += 864e5) {
    const d = new Date(t);
    yield { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  }
}

describe('accuracy stress – every date of birth 1900 → today', () => {
  it('Moolank, Bhagyank, Kua, Lo Shu counts and birthday-based Personal Year match the reference', () => {
    let checked = 0;
    const errors: string[] = [];
    for (const dob of allDates()) {
      const g = checked % 2 ? 'female' : 'male';
      const r = analyseDob({ dob, gender: g }, { asOf: AS_OF });
      const iso = `${dob.year}-${pad(dob.month)}-${pad(dob.day)}`;
      const total = ds(`${pad(dob.day)}${pad(dob.month)}${dob.year}`);
      const kua = refKua(dob.year, g);
      const digits = `${pad(dob.day)}${pad(dob.month)}${dob.year}`.split('').map(Number).filter((d) => d !== 0);
      if (dob.day >= 11 && dob.day !== 20 && dob.day !== 30) digits.push(red(dob.day));
      digits.push(red(total), kua);
      // birthday to birthday: before this year's birthday the personal year that began last year is still running
      const before = AS_OF.month < dob.month || (AS_OF.month === dob.month && AS_OF.day < dob.day);
      const py = red(ds(dob.day) + ds(dob.month) + ds(AS_OF.year - (before ? 1 : 0)));
      if (r.moolank.value !== red(dob.day)) errors.push(`${iso} moolank`);
      if (r.bhagyank.value !== red(total) || r.bhagyank.compound !== total) errors.push(`${iso} bhagyank`);
      if (r.kua.value !== kua) errors.push(`${iso} kua ${g}`);
      for (let n = 1; n <= 9; n++) if (r.loShu.counts[n] !== digits.filter((d) => d === n).length) errors.push(`${iso} loShu ${n}`);
      if (r.personalCycles.current.personalYear !== py) errors.push(`${iso} personalYear`);
      checked++;
      if (errors.length > 20) break;
    }
    expect(errors).toEqual([]);
    expect(checked).toBeGreaterThan(46000);
  }, 120_000);

  it('rejects a date of birth after the report date', () => {
    expect(() => analyseDob({ dob: '2026-11-10', gender: 'male' }, { asOf: AS_OF })).toThrow(/after the report date/);
  });
});

describe('accuracy stress – names and mobiles', () => {
  const first = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Nandram', 'Shivang', 'Zoya', 'Om', 'Aarav', 'Ishaan', 'Mohammed', 'Gurpreet', 'Joseph', 'Lakshmi', 'Xavier', 'Qadir', 'Yamini', 'Wasim'];
  const last = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Khan', 'Das', 'Yogi', 'Banerjee', 'Pillai', 'Kapoor', 'Ram'];
  const names = first.flatMap((f) => last.flatMap((l) => [`${f} ${l}`, `${f.toUpperCase()} ${l.toLowerCase()}`, ` ${f}  Kumar ${l}. `]));

  it(`Chaldean / Pythagorean totals match for ${names.length} names`, () => {
    for (const n of names) {
      const letters = n.toUpperCase().replace(/[^A-Z]/g, '').split('');
      expect(analyseNameSystem(n, 'chaldean').nameNumber.compound, n).toBe(letters.reduce((a, c) => a + CHAL[c], 0));
      expect(analyseNameSystem(n, 'pythagorean').nameNumber.compound, n).toBe(letters.reduce((a, c) => a + PYT[c], 0));
    }
  });

  it('normalises names with accents and special letters', () => {
    expect(analyseNameSystem('José Muñoz', 'chaldean').name).toBe('JOSE MUNOZ');
    expect(analyseNameSystem('Ærøskøbing Straße', 'chaldean').name).toBe('AEROSKOBING STRASSE');
  });

  it('mobile totals, malefic pairs and score breakdown are consistent for 5000 numbers', () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
    for (let i = 0; i < 5000; i++) {
      const num = String(6 + Math.floor(rnd() * 4)) + Array.from({ length: 9 }, () => Math.floor(rnd() * 10)).join('');
      const raw = ['', '+91 ', '0', '91', '0091 ', '+91 0'][i % 6] + num;
      expect(normalizeIndianMobile(raw)).toBe(num);
      const r = analyseMobile(raw, { moolank: (i % 9) + 1, bhagyank: ((i * 5) % 9) + 1, missingNumbers: [2, 5, 7] });
      expect(r.total.compound).toBe(ds(num));
      const mal = Array.from({ length: 9 }, (_, k) => num.slice(k, k + 2)).filter((p) => ['48', '84', '44', '88', '00'].includes(p));
      expect(r.maleficPairs).toEqual(mal);
      expect(r.score).toBe(Math.max(0, Math.min(100, Object.values(r.scoreBreakdown).reduce((a, b) => a + b, 0))));
    }
  });
});
