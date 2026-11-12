import { describe, expect, it } from 'vitest';
import {
  analyseAadhaar, analyseCouple, analyseDob, analyseMobile, analyseName, analyseNameSystem, bhagyank, generateNumerology,
  kuaNumber, lifePeriods, loShuSourceDigits, moolank, nameCompatibilityScore, normalizeIndianMobile, personalYear,
  reduce, RELATION_TABLE, verhoeffCheckDigit, verhoeffValid,
} from '../src/lib/numerology';

const asOf = { day: 3, month: 11, year: 2026 };
const dummyAadhaar = (() => { const base = '23456789012'; return base + verhoeffCheckDigit(base); })();

describe('reduce()', () => {
  it('reduces and tracks master numbers', () => {
    expect(reduce(28)).toMatchObject({ value: 1, chain: [28, 10, 1], master: null });
    expect(reduce(38)).toMatchObject({ value: 2, chain: [38, 11, 2], master: 11 });
    expect(reduce(7).value).toBe(7);
  });
});

describe('Known test cases – DOB', () => {
  it('#1 28-08-1990: Moolank 1, Bhagyank 1 (28→10→1, 37→10→1)', () => {
    expect(moolank(28).value).toBe(1);
    expect(bhagyank({ day: 28, month: 8, year: 1990 })).toMatchObject({ value: 1, compound: 37 });
  });
  it('#2 15-05-1985: Moolank 6, Bhagyank 7 (34)', () => {
    expect(moolank(15).value).toBe(6);
    expect(bhagyank({ day: 15, month: 5, year: 1985 })).toMatchObject({ value: 7, compound: 34 });
  });
  it('#3 29-11-1987: Bhagyank 2 with master 11 visible', () => {
    expect(bhagyank({ day: 29, month: 11, year: 1987 })).toMatchObject({ value: 2, compound: 38, master: 11 });
  });
  it('#4 Kua – male/female formulas incl. the 5 → 2 / 5 → 8 rule', () => {
    expect(kuaNumber(1990, 'male')).toBe(1);
    expect(kuaNumber(1990, 'female')).toBe(8); // 4+1=5 → 8
    expect(kuaNumber(1985, 'male')).toBe(6);
    expect(kuaNumber(1985, 'female')).toBe(9);
    expect(kuaNumber(1995, 'male')).toBe(2); // 11-6=5 → 2
    expect(kuaNumber(2000, 'male')).toBe(9);
    expect(kuaNumber(2000, 'female')).toBe(6);
    expect(kuaNumber(2005, 'male')).toBe(4);
    expect(kuaNumber(2005, 'female')).toBe(2);
  });
  it('#5 Lo Shu for 15-05-1985 (male): counts, missing, planes, arrows', () => {
    const r = analyseDob({ dob: '15-05-1985', gender: 'male' }, { asOf });
    expect(r.loShu.counts).toEqual({ 1: 2, 2: 0, 3: 0, 4: 0, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 });
    expect(r.loShu.missing).toEqual([2, 3, 4]);
    expect(r.loShu.repeated).toEqual([{ number: 1, count: 2 }, { number: 5, count: 3 }, { number: 6, count: 2 }]);
    expect(r.loShu.arrowsOfStrength.map((a) => a.lineId)).toEqual(['practical', 'will']);
    expect(r.loShu.arrowsOfWeakness).toEqual([]);
  });
  it('#6 Lo Shu for 28-08-1990 (male): empty Emotional plane (3-5-7) → Arrow of Scepticism', () => {
    const r = analyseDob({ dob: '1990-08-28', gender: 'male' }, { asOf });
    expect(r.loShu.counts).toEqual({ 1: 4, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 2, 9: 2 }); // DOB 1 + Moolank 1 + Bhagyank 1 + Kua 1
    expect(r.loShu.arrowsOfWeakness.map((a) => a.name)).toContain('Arrow of Scepticism');
    expect(r.kua.value).toBe(1);
    expect(r.kua.favourable.success).toBe('South-East');
  });
  it('#7 Moolank added to grid only for days 11–31 except 20/30 (traditional rule)', () => {
    const src = (day: number) => loShuSourceDigits({ day, month: 1, year: 2001 }, moolank(day).value, 1, null).map((s) => s.source);
    expect(src(5)).not.toContain('moolank');
    expect(src(20)).not.toContain('moolank');
    expect(src(11)).toContain('moolank');
  });
  it('#8 Personal Year 2026 for 28-08-1990 = 1 (2+8+8+2+0+2+6 = 28)', () => {
    expect(personalYear({ day: 28, month: 8, year: 1990 }, 2026)).toBe(1);
    const r = analyseDob({ dob: '28-08-1990', gender: 'male' }, { asOf });
    expect(r.personalCycles.current).toMatchObject({ personalYear: 1, personalMonth: 3, personalDay: 6, startYear: 2026, from: '2026-08-28', to: '2027-08-27' });
    expect(r.personalCycles.timeline).toHaveLength(9);
  });
  it('#8b Personal Year runs birthday to birthday (owner decision)', () => {
    const dob = { day: 28, month: 8, year: 1990 };
    // before the birthday the previous personal year (started 28 Aug 2025) is still running
    const before = analyseDob({ dob, gender: 'male' }, { asOf: '2026-08-27' }).personalCycles.current;
    expect(before).toMatchObject({ startYear: 2025, personalYear: personalYear(dob, 2025), from: '2025-08-28', to: '2026-08-27' });
    const on = analyseDob({ dob, gender: 'male' }, { asOf: '2026-08-28' }).personalCycles.current;
    expect(on).toMatchObject({ startYear: 2026, personalYear: 1 });
    // 29 Feb birthdays switch on 1 Mar in non-leap years
    const leap = { day: 29, month: 2, year: 2000 };
    expect(analyseDob({ dob: leap, gender: 'female' }, { asOf: '2027-02-28' }).personalCycles.current.startYear).toBe(2026);
    expect(analyseDob({ dob: leap, gender: 'female' }, { asOf: '2027-03-01' }).personalCycles.current).toMatchObject({ startYear: 2027, from: '2027-03-01', to: '2028-02-28' });
    // months of the current personal year start at the birthday month
    const det = analyseDob({ dob, gender: 'male' }, { asOf: '2026-11-09' }).personalCycles.detailed[0];
    expect(det.months[0]).toMatchObject({ month: 8, year: 2026 });
    expect(det.months[11]).toMatchObject({ month: 7, year: 2027 });
  });
  it('#8c Friendship table matches the Mulank pages', async () => {
    const { RELATION_TABLE, MULANK_COMPATIBILITY } = await import('../src/lib/numerology/data/relations');
    const { MULANK } = await import('../src/lib/mulank-data');
    for (let n = 1; n <= 9; n++) {
      const page = MULANK.find((m) => m.n === n)!;
      expect(page.compatible).toEqual(MULANK_COMPATIBILITY[n].compatible);
      expect(RELATION_TABLE[n].friend).toEqual([...new Set([n, ...page.compatible])].sort((a, b) => a - b));
      expect(RELATION_TABLE[n].enemy).toEqual([...page.avoid].sort((a, b) => a - b));
      expect([...RELATION_TABLE[n].friend, ...RELATION_TABLE[n].neutral, ...RELATION_TABLE[n].enemy].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
    expect(RELATION_TABLE[2].friend).toEqual([1, 2, 4, 6, 7]);
    expect(RELATION_TABLE[7].enemy).toEqual([8, 9]);
  });
  it('#9 Pinnacles & challenges for 15-05-1985 (LP 7 → first pinnacle ends at 29)', () => {
    const p = lifePeriods({ day: 15, month: 5, year: 1985 }, 7, 41);
    expect(p.pinnacles.map((x) => [x.number, x.master, x.fromAge, x.toAge])).toEqual([[2, 11, 0, 29], [2, 11, 30, 38], [4, null, 39, 47], [1, null, 48, null]]);
    expect(p.challenges.map((c) => c.number)).toEqual([1, 1, 0, 0]);
    expect(p.pinnacles[2].current).toBe(true);
  });
});

describe('Known test cases – Name', () => {
  it('#10 RAHUL: Chaldean 17/8, Pythagorean 24/6, soul urge 7, personality 1', () => {
    const c = analyseNameSystem('Rahul', 'chaldean');
    expect(c.nameNumber).toMatchObject({ compound: 17, single: 8 });
    expect(c.soulUrge.single).toBe(7);
    expect(c.personality).toMatchObject({ compound: 10, single: 1 });
    expect(analyseNameSystem('Rahul', 'pythagorean').nameNumber).toMatchObject({ compound: 24, single: 6 });
  });
  it('#11 PRIYA Chaldean = 13/4; diacritics and punctuation are ignored', () => {
    expect(analyseNameSystem('Priya', 'chaldean').nameNumber).toMatchObject({ compound: 13, single: 4 });
    expect(analyseNameSystem("  priyá  ", 'chaldean').name).toBe('PRIYA');
  });
  it('#12 Name corrections always improve the score and keep the surname', () => {
    const r = analyseName({ fullName: 'Rahul Sharma' }, 1, 1);
    expect(r.corrections.length).toBeGreaterThan(0);
    for (const c of r.corrections) {
      expect(c.score).toBeGreaterThan(r.compatibilityScore);
      expect(c.fullName.endsWith('Sharma')).toBe(true);
      expect(c.category).not.toBe('unfavourable');
    }
  });
  it('score is bounded 0–100', () => {
    for (let s = 1; s <= 9; s++) for (let m = 1; m <= 9; m++) for (const comp of [10, 16, 23, 52, 70]) {
      const v = nameCompatibilityScore(s, comp, m, m);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe('Known test cases – Mobile & Aadhaar', () => {
  it('#13 9876543210 totals 45 → 9; +91 prefix is normalised', () => {
    expect(normalizeIndianMobile('+91 98765-43210')).toBe('9876543210');
    const r = analyseMobile('9876543210', { moolank: 1, bhagyank: 1, missingNumbers: [3, 4, 5, 6, 7] });
    expect(r.total).toMatchObject({ compound: 45, single: 9 });
    expect(r.missingNumbersFilled).toEqual([3, 4, 5, 6, 7]);
    expect(r.last4.digits).toBe('3210');
  });
  it('#14 detects malefic pairs and excess zeros', () => {
    const r = analyseMobile('9848000123', { moolank: 1, bhagyank: 1, missingNumbers: [] });
    expect(r.maleficPairs).toEqual(expect.arrayContaining(['84', '48', '00']));
    expect(r.flags).toContain('TOO_MANY_ZEROS');
  });
  it('rejects invalid Indian mobile numbers', () => {
    expect(() => normalizeIndianMobile('12345')).toThrow();
    expect(() => normalizeIndianMobile('5876543210')).toThrow();
  });
  it('#15 Verhoeff checksum (Wikipedia example 236 → 3)', () => {
    expect(verhoeffCheckDigit('236')).toBe(3);
    expect(verhoeffValid('2363')).toBe(true);
    expect(verhoeffValid('2364')).toBe(false);
    expect(verhoeffValid(dummyAadhaar)).toBe(true);
  });
  it('#16 Aadhaar result never contains the full number', () => {
    const r = analyseAadhaar(dummyAadhaar, { moolank: 1, bhagyank: 1, missingNumbers: [3], gridCounts: {} }, { consent: true });
    const json = JSON.stringify(r);
    expect(json).not.toContain(dummyAadhaar);
    expect(json).not.toContain(dummyAadhaar.slice(0, 8));
    expect(r.masked).toBe(`XXXX-XXXX-${dummyAadhaar.slice(-4)}`);
    expect(() => analyseAadhaar(dummyAadhaar, { moolank: 1, bhagyank: 1, missingNumbers: [], gridCounts: {} }, { consent: false })).toThrow();
  });
});

describe('Couple', () => {
  it('#17 compatibility is symmetric and bounded', () => {
    const a = { name: 'Rahul Sharma', gender: 'male' as const, dob: '28-08-1990' };
    const b = { name: 'Priya Verma', gender: 'female' as const, dob: '15-05-1992' };
    const ab = analyseCouple(a, b, { asOf });
    const ba = analyseCouple(b, a, { asOf });
    expect(ab.overall).toBe(ba.overall);
    expect(ab.areaScores).toEqual(ba.areaScores);
    expect(ab.overall).toBeGreaterThanOrEqual(0);
    expect(ab.overall).toBeLessThanOrEqual(100);
    expect(ab.marriage.favourableDateNumbers).not.toContain(4);
  });
});

describe('Data integrity, determinism, privacy', () => {
  it('relation table partitions 1–9 for every number', () => {
    for (let n = 1; n <= 9; n++) {
      const r = RELATION_TABLE[n];
      expect([...r.friend, ...r.neutral, ...r.enemy].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(r.friend).toContain(n);
    }
  });
  const input = {
    fullName: 'Rahul Kumar Sharma', commonName: 'Rahul Sharma', gender: 'male', dob: '28-08-1990',
    mobile: '9876543210', aadhaar: dummyAadhaar, aadhaarConsent: true,
    partner: { name: 'Priya Verma', gender: 'female', dob: '15-05-1992' },
  };
  it('#18 same input ⇒ identical output', () => {
    expect(JSON.stringify(generateNumerology(input, { asOf }))).toBe(JSON.stringify(generateNumerology(input, { asOf })));
  });
  it('#19 complete report contains no full Aadhaar and survives a JSON round-trip', () => {
    const r = generateNumerology(input, { asOf });
    const json = JSON.stringify(r);
    expect(json).not.toContain(dummyAadhaar);
    expect(JSON.parse(json)).toEqual(r);
    expect(r.client.aadhaarMasked).toMatch(/^XXXX-XXXX-\d{4}$/);
  });
  it('#20 Aadhaar without consent is rejected by the schema', () => {
    expect(() => generateNumerology({ ...input, aadhaarConsent: false }, { asOf })).toThrow();
  });
  it('invalid dates are rejected', () => {
    expect(() => analyseDob({ dob: '31-02-1990', gender: 'male' }, { asOf })).toThrow();
  });
});

describe('Name correction spelling rules', () => {
  it('never produces a tripled letter', () => {
    for (const n of ['Rahul', 'Anna', 'Priya', 'Deepak', 'Sunny']) {
      for (const c of analyseName({ fullName: n }, 1, 1).corrections) expect(c.spelling).not.toMatch(/(.)\1\1/i);
    }
  });
});
