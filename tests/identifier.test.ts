import { describe, expect, it } from 'vitest';
import { analyseIdentifier, IDENTIFIER_SCORING, relationOf } from '@/lib/numerology';
import { CHALDEAN, compoundCategory } from '@/lib/numerology/data/tables';

const red = (n: number) => { while (n > 9 && ![11, 22, 33].includes(n)) n = String(n).split('').reduce((a, b) => a + +b, 0); while (n > 9) n = String(n).split('').reduce((a, b) => a + +b, 0); return n; };

describe('vehicle & house number numerology', () => {
  it('known cases', () => {
    const v = analyseIdentifier('MP09 AB 1234', { moolank: 1, bhagyank: 5 }, 'vehicle');
    expect(v.registration).toBe('1234'); expect(v.total).toMatchObject({ compound: 10, single: 1 });
    expect(v.fullTotal.compound).toBe(4 + 8 + 0 + 9 + 1 + 2 + 1 + 2 + 3 + 4); // M=4 P=8 A=1 B=2
    const h = analyseIdentifier('12-A', { moolank: 2, bhagyank: 7 }, 'house');
    expect(h.total).toMatchObject({ compound: 4, single: 4 }); expect(h.registration).toBeNull();
    expect(analyseIdentifier('B-702', { moolank: 3, bhagyank: 3 }, 'house').total.compound).toBe(2 + 7 + 0 + 2);
    expect(() => analyseIdentifier('ABCD', { moolank: 1, bhagyank: 1 }, 'vehicle')).toThrow();
    expect(() => analyseIdentifier('0000', { moolank: 1, bhagyank: 1 }, 'vehicle')).toThrow();
  });
  it('matches an independent calculation on 20,000 random numbers', () => {
    let seed = 20261111; const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
    const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < 20000; i++) {
      const kind = i % 2 ? 'vehicle' as const : 'house' as const;
      const m = 1 + rnd(9), b = 1 + rnd(9);
      const num = String(1 + rnd(9998));
      const raw = kind === 'vehicle' ? `${AZ[rnd(26)]}${AZ[rnd(26)]}${String(rnd(100)).padStart(2, '0')} ${AZ[rnd(26)]}${AZ[rnd(26)]} ${num.padStart(4, '0')}` : `${rnd(3) === 0 ? AZ[rnd(26)] + '-' : ''}${num}${rnd(4) === 0 ? AZ[rnd(26)] : ''}`;
      let r; try { r = analyseIdentifier(raw, { moolank: m, bhagyank: b }, kind); } catch { expect(kind === 'vehicle' && /^0+$/.test(num.padStart(4, '0'))).toBe(true); continue; }
      const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').split('');
      const all = chars.reduce((a, c) => a + (/\d/.test(c) ? +c : CHALDEAN[c]), 0);
      const prim = kind === 'vehicle' ? num.padStart(4, '0').split('').reduce((a, c) => a + +c, 0) : all;
      expect(r.total.compound).toBe(prim); expect(r.total.single).toBe(red(prim)); expect(r.fullTotal.compound).toBe(all);
      const s = IDENTIFIER_SCORING, single = red(prim);
      const exp = s.base + s.bhagyank[relationOf(b, single)] + s.moolank[relationOf(m, single)] + s.compound[compoundCategory(prim)] + ((single === 4 || single === 8) && ![4, 8].includes(m) && ![4, 8].includes(b) ? s.heavy48 : 0);
      expect(r.score).toBe(Math.max(0, Math.min(100, exp)));
      expect(r.score).toBeGreaterThanOrEqual(0); expect(r.score).toBeLessThanOrEqual(100);
    }
  });
});
