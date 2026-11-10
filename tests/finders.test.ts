/** Admin finders: Angel Number Finder + Lucky Number Finder (Name + DOB), checked against independent rules. */
import { describe, expect, it } from 'vitest';
import { angelSummary, findAngelNumbers, findLuckyNumbers, luckySummary } from '../src/lib/finders';

const AS_OF = { year: 2026, month: 11, day: 10 };
const ds = (n: number | string) => String(n).replace(/\D/g, '').split('').reduce((a, c) => a + +c, 0);
const red = (n: number) => { while (n > 9) n = ds(n); return n; };
const chain = (n: number) => { const c = [n]; while (n > 9) { n = ds(n); c.push(n); } return c; };
const CHAL: Record<string, number> = Object.fromEntries('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c, i) => [c, [1, 2, 3, 4, 5, 8, 3, 5, 1, 1, 2, 3, 4, 5, 7, 8, 1, 2, 3, 4, 6, 6, 6, 5, 1, 7][i]]));
// House table (Mulank pages), self = friend
const COMP: Record<number, number[]> = { 1: [2, 3, 5, 9], 2: [1, 4, 6, 7], 3: [1, 2, 5, 9], 4: [1, 5, 7, 8], 5: [1, 3, 4, 6], 6: [2, 3, 5, 9], 7: [1, 2, 4], 8: [4, 5, 6], 9: [1, 3, 6] };
const AV: Record<number, number[]> = { 1: [8], 2: [5, 9], 3: [4, 8], 4: [3, 9], 5: [2], 6: [1, 8], 7: [8, 9], 8: [1, 2, 3, 7, 9], 9: [4, 7, 8] };
const rel = (a: number, b: number) => (a === b || COMP[a].includes(b) ? 'friend' : AV[a].includes(b) ? 'enemy' : 'neutral');
const score = (x: string) => (x === 'friend' ? 1 : x === 'enemy' ? -1 : 0);
const angelOf = (total: number) => { const c = chain(total); const v = c[c.length - 1]; const m = c.find((x) => x === 11 || x === 22 || x === 33); return m ? String(m).repeat(2) : String(v).repeat(3); };

const FIRST = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Nandram', 'Shivang', 'Zoya', 'Om', 'Aarav', 'Ishaan', 'Mohammed', 'Gurpreet', 'Lakshmi', 'Xavier', 'Bhavya', 'Krishna'];
const LAST = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Reddy', 'Nair', 'Khan', 'Yogi', 'Pillai', 'Kapoor', 'Ram', 'Lynch'];

function* cases(n: number) {
  let seed = 11;
  const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const t = Date.UTC(1940, 0, 1) + Math.floor(rnd() * 31000) * 864e5;
    const d = new Date(t);
    const dob = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    const fullName = `${FIRST[Math.floor(rnd() * FIRST.length)]} ${LAST[Math.floor(rnd() * LAST.length)]}`;
    yield { fullName, dob, gender: (i % 2 ? 'female' : 'male') as 'male' | 'female' };
  }
}

describe('Angel Number Finder (Name + DOB)', () => {
  it('3,000 random clients: every angel number matches the independent rules', () => {
    for (const c of cases(3000)) {
      const r = findAngelNumbers({ ...c, asOf: AS_OF });
      const letters = c.fullName.toUpperCase().replace(/[^A-Z]/g, '').split('');
      const nameTotal = letters.reduce((a, l) => a + CHAL[l], 0);
      const soulTotal = letters.filter((l) => 'AEIOU'.includes(l)).reduce((a, l) => a + CHAL[l], 0);
      const bTotal = ds(`${String(c.dob.day).padStart(2, '0')}${String(c.dob.month).padStart(2, '0')}${c.dob.year}`);
      const get = (k: string) => r.list.find((x) => x.key === k)!.n;
      expect(r.list).toHaveLength(7);
      expect(get('life'), c.fullName).toBe(angelOf(bTotal));
      expect(get('mulank')).toBe(String(red(c.dob.day)).repeat(3));
      expect(get('birthday')).toBe(String(c.dob.day).padStart(2, '0').repeat(2));
      expect(get('name'), c.fullName).toBe(angelOf(nameTotal));
      expect(get('soul'), c.fullName).toBe(soulTotal ? angelOf(soulTotal) : '000');
      expect(get('destiny')).toBe(String(red(red(nameTotal) + red(bTotal))).repeat(3));
      const before = AS_OF.month < c.dob.month || (AS_OF.month === c.dob.month && AS_OF.day < c.dob.day);
      const py = red(ds(c.dob.day) + ds(c.dob.month) + ds(AS_OF.year - (before ? 1 : 0)));
      expect(get('year')).toBe(String(py).repeat(3));
      for (const x of r.list) {
        expect(x.score).toBeGreaterThanOrEqual(12);
        expect(x.score).toBeLessThanOrEqual(98);
        const root = red(ds(x.n));
        if (root) expect(x.relB).toBe(rel(red(bTotal), root));
      }
      expect(r.list.some((x) => x.key === r.strongest)).toBe(true);
      expect(Math.max(...r.list.map((x) => x.score))).toBe(r.list.find((x) => x.key === r.strongest)!.score);
    }
  }, 60_000);

  it('known case: Rahul Sharma, 15-08-1990', () => {
    const r = findAngelNumbers({ fullName: 'Rahul Sharma', dob: '15-08-1990', gender: 'male', asOf: AS_OF });
    // Bhagyank total 33 (master) → 3333; Mulank 6 → 666; birthday 1515
    expect(r.list.find((x) => x.key === 'life')!.n).toBe('3333');
    expect(r.list.find((x) => x.key === 'mulank')!.n).toBe('666');
    expect(r.list.find((x) => x.key === 'birthday')!.n).toBe('1515');
    // RAHUL SHARMA = 2+1+5+6+3 + 3+5+1+2+4+1 = 33 (master) → 3333
    expect(r.nameNumber).toMatchObject({ compound: 33, single: 6, master: 33 });
    expect(r.list.find((x) => x.key === 'name')!.n).toBe('3333');
    const en = angelSummary(r, 'en'), hi = angelSummary(r, 'hi');
    expect(en).toContain('ANGEL NUMBER REPORT – RAHUL SHARMA');
    expect(hi).toContain('एंजेल नंबर रिपोर्ट');
    expect(en).not.toMatch(/undefined|NaN|\[object/);
    expect(hi).not.toMatch(/undefined|NaN|\[object/);
  });

  it('rejects names without English letters and future dates of birth', () => {
    expect(() => findAngelNumbers({ fullName: 'राहुल', dob: '15-08-1990', asOf: AS_OF })).toThrow();
    expect(() => findAngelNumbers({ fullName: 'Rahul', dob: '15-08-2030', asOf: AS_OF })).toThrow(/after the report date/);
  });
});

describe('Lucky Number Finder (Name + DOB)', () => {
  it('3,000 random clients: lucky / avoid numbers and dates follow the house table', () => {
    for (const c of cases(3000)) {
      const r = findLuckyNumbers({ ...c, asOf: AS_OF });
      const m = red(c.dob.day), b = r.destiny.number;
      expect(r.primary.number).toBe(m);
      const sum = (n: number) => score(rel(m, n)) + score(rel(b, n));
      const friendly = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => sum(n) >= 1);
      expect(r.avoidNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => sum(n) < 0));
      expect(r.neutralNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => sum(n) === 0));
      expect(r.luckyNumbers).toEqual(friendly.filter((n) => ![4, 8].includes(n) || n === m || n === b));
      expect(r.luckyDates).toEqual(Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => r.luckyNumbers.includes(red(d))));
      for (const n of r.luckyNumbers) expect(r.avoidNumbers).not.toContain(n);
      expect(r.mobile.idealTotals.length).toBeGreaterThan(0);
      for (const t of r.mobile.idealCompounds) expect(r.mobile.idealTotals).toContain(red(t));
      const s = luckySummary(r, c.dob.day % 2 ? 'en' : 'hi');
      expect(s).not.toMatch(/undefined|NaN|\[object/);
    }
  }, 60_000);

  it('known case: Rahul Sharma, 15-08-1990', () => {
    const r = findLuckyNumbers({ fullName: 'Rahul Sharma', dob: '15-08-1990', gender: 'male', asOf: AS_OF });
    expect(r.primary).toMatchObject({ number: 6, planet: 'Venus' });
    expect(r.destiny).toMatchObject({ number: 6, master: 33 });
    // Mulank 6 and Bhagyank 6: friends 2,3,5,6,9 (score 2), avoid 1,8
    expect(r.luckyNumbers).toEqual([2, 3, 5, 6, 9]);
    expect(r.avoidNumbers).toEqual([1, 8]);
    expect(r.luckyDates).toEqual([2, 3, 5, 6, 9, 11, 12, 14, 15, 18, 20, 21, 23, 24, 27, 29, 30]);
    expect(luckySummary(r, 'hi')).toContain('शुभ अंक: 2, 3, 5, 6, 9');
  });
});
