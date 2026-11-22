import { describe, it, expect } from 'vitest';
import { calculateName, luckyNameTotals, nameCalcSummary, verdictOf } from '@/lib/name-calculator';
import { relationOf } from '@/lib/numerology/data/relations';

describe('Admin name numerology calculator', () => {
  it('hand-checked example: Rahul Sharma', () => {
    // Chaldean: R2 A1 H5 U6 L3 = 17 · S3 H5 A1 R2 M4 A1 = 16 → 33 (master) → 6
    // Pythagorean: R9 A1 H8 U3 L3 = 24 · S1 H8 A1 R9 M4 A1 = 24 → 48 → 3
    const r = calculateName({ fullName: 'Rahul Sharma' });
    const ch = r.main.chaldean, py = r.main.pythagorean;
    expect(ch.words.map((w) => w.compound)).toEqual([17, 16]);
    expect(ch.nameNumber).toMatchObject({ compound: 33, single: 6, master: 33 });
    expect(py.words.map((w) => w.compound)).toEqual([24, 24]);
    expect(py.nameNumber).toMatchObject({ compound: 48, single: 3 });
    expect(ch.soulUrge.compound).toBe(9);       // A U A A = 1+6+1+1
    expect(ch.personality.compound).toBe(24);   // consonants
    expect(r.main.planet.en).toBe('Venus');
    expect(r.compat).toBeNull();
    expect(r.corrections).toEqual([]);
  });

  it('with DOB: Moolank/Bhagyank, score, lucky totals and corrections', () => {
    const r = calculateName({ fullName: 'Rahul Sharma', dob: '1990-03-15' }); // 15 → 6; 1+5+0+3+1+9+9+0 = 28 → 1
    expect(r.compat).toMatchObject({ moolank: 6, bhagyank: 1 });
    expect(r.main.relB).toBe(relationOf(1, 6));
    expect(r.main.score).toBeGreaterThanOrEqual(0);
    expect(r.main.verdict).toBe(verdictOf(r.main.score!));
    for (const n of r.lucky!.singles) { expect(relationOf(1, n)).toBe('friend'); expect(relationOf(6, n)).not.toBe('enemy'); }
    for (const c of r.corrections) { expect(c.score).toBeGreaterThan(r.main.score!); expect(c.category).not.toBe('unfavourable'); }
  });

  it('daily-use name is the main name, document name shown separately', () => {
    const r = calculateName({ fullName: 'Rahul Kumar Sharma', commonName: 'Rahul Sharma' });
    expect(r.main.chaldean.name).toBe('RAHUL SHARMA');
    expect(r.official?.chaldean.name).toBe('RAHUL KUMAR SHARMA');
    expect(calculateName({ fullName: 'Rahul Sharma', commonName: ' rahul  sharma ' }).official).toBeNull();
  });

  it('spelling comparison: duplicates removed, bad entries skipped, exactly one best', () => {
    const r = calculateName({ fullName: 'Rahul Sharma', dob: '1990-03-15', variants: ['Rahull Sharma', 'RAHUL SHARMA', '', 'राहुल', 'Raahul Sharma'] });
    expect(r.variants.map((v) => v.spelling).sort()).toEqual(['Raahul Sharma', 'Rahul Sharma', 'Rahull Sharma']);
    expect(r.skipped).toEqual(['राहुल']);
    expect(r.variants.filter((v) => v.best)).toHaveLength(1);
    const scores = r.variants.map((v) => v.score!);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('lucky totals never include heavy 4/8 unless it is the person’s own number', () => {
    for (let m = 1; m <= 9; m++) for (let b = 1; b <= 9; b++) {
      const l = luckyNameTotals(m, b);
      for (const n of [4, 8]) if (l.singles.includes(n)) expect([m, b]).toContain(n);
    }
  });

  it('rejects names without English letters and future dates', () => {
    expect(() => calculateName({ fullName: 'राहुल' })).toThrow(/English letters/);
    expect(() => calculateName({ fullName: 'Rahul', dob: '2030-01-01' })).toThrow(/future/);
    expect(() => calculateName({ fullName: 'Rahul', dob: '1990-02-31' })).toThrow(/valid date/);
    expect(() => calculateName({ fullName: 'Rahul', dob: '2999-01-01' })).toThrow(/valid date|future/);
  });

  it('copy text in English and Hindi has no undefined / NaN', () => {
    const r = calculateName({ fullName: 'Priya Verma', commonName: 'Priyaa Verma', dob: '1995-11-29', variants: ['Preeya Verma'] });
    for (const lang of ['en', 'hi'] as const) {
      const s = nameCalcSummary(r, lang, 'Acharya Nandram');
      expect(s).not.toMatch(/undefined|NaN|null/);
      expect(s).toContain(lang === 'hi' ? 'नामांक' : 'Name number');
    }
  });
});
