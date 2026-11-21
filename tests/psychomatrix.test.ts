import { describe, expect, it } from 'vitest';
import { psychomatrix } from '@/lib/psychomatrix/engine';

describe('Pythagoras Square (psychomatrix) engine', () => {
  // vrachka.eu worked example 15.03.1990: working 28, 10, 26, 8; counts 1×3, 2×2, 3, 5, 6, 8×2, 9×2; 4 and 7 empty
  it('matches the published example for 15-03-1990', () => {
    const m = psychomatrix('1990-03-15');
    expect(m.working).toEqual([28, 10, 26, 8]);
    expect(m.counts).toEqual({ 1: 3, 2: 2, 3: 1, 4: 0, 5: 1, 6: 1, 7: 0, 8: 2, 9: 2 });
    expect(m.empty).toEqual([4, 7]);
    expect(Object.fromEntries(m.lines.map((l) => [l.id, l.total]))).toEqual({ purpose: 3, family: 5, stability: 4, selfEsteem: 6, money: 2, talent: 4, spirituality: 6, temperament: 2 });
  });
  // fatos-pro example 15.06.1988: 38, 11, 36, 9
  it('matches the published example for 15-06-1988', () => {
    expect(psychomatrix('1988-06-15').working).toEqual([38, 11, 36, 9]);
  });
  it('uses the first non-zero digit of the day (day 05 → 5) and the absolute value for negative 3rd numbers', () => {
    const m = psychomatrix('2005-01-09'); // digits 0,9,0,1,2,0,0,5 = 17 → 8; 17 − 18 = −1 → 1; 1
    expect(m.working).toEqual([17, 8, 1, 1]);
    expect(m.absUsed).toBe(true);
    expect(psychomatrix('1985-05-05').working[2]).toBe(psychomatrix('1985-05-05').working[0] - 10);
  });
});
