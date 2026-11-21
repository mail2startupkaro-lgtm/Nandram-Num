import { describe, it, expect } from 'vitest';
import { analyseDob, analyseName, analyseMobile, buildRemedies, analyseCouple } from '@/lib/numerology';
import { destinyMatrix, ageEnergy } from '@/lib/destiny/matrix';
import { analyseDestiny, writeDestiny } from '@/lib/destiny/report';
import { analysePsychomatrix, writePsychomatrix } from '@/lib/psychomatrix/report';
import { findAngelNumbers, findLuckyNumbers, luckySummary, angelSummary } from '@/lib/finders';
import { businessAnalytics } from '@/lib/business/engine';
import { analyseCompleteBusiness } from '@/lib/business/complete';
import { compoundMeaning } from '@/lib/signature/numbers';
import { relationOf } from '@/lib/numerology/data/relations';

const asOf = { year: 2026, month: 11, day: 21 };
const bad = /undefined|NaN|\[object Object\]|null/;
const textOf = (r: any) => JSON.stringify(r);
const dates: string[] = [];
for (let y = 1900; y <= 2025; y++) for (let m = 1; m <= 12; m++) for (const d of [1, 9, 10, 11, 19, 20, 22, 28, 29, 30, 31]) {
  const dt = new Date(Date.UTC(y, m - 1, d)); if (dt.getUTCMonth() !== m - 1) continue;
  dates.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
}
const issues: string[] = [];
describe('every engine over every kind of date (1900–2025)', () => {
  it('no crash, every number in range, no undefined / NaN in EN or HI text', () => {
    let i = 0;
    for (const iso of dates) {
      i++;
      try {
        const [y, m, d] = iso.split('-').map(Number);
        const r = analyseDob({ dob: iso, gender: i % 2 ? 'male' : 'female' }, { asOf });
        if (r.moolank.value < 1 || r.moolank.value > 9 || r.bhagyank.value < 1 || r.bhagyank.value > 9) issues.push(`range ${iso}`);
        if (![1,2,3,4,6,7,8,9].includes(r.kua.value)) issues.push(`kua ${iso}`);
        const dm = destinyMatrix({ day: d, month: m, year: y } as any);
        for (const [k, v] of Object.entries(dm)) if (typeof v === 'number' && (v < 1 || v > 22)) issues.push(`dm ${k}=${v} ${iso}`);
        if (dm.ages.some((a: any) => a.value < 1 || a.value > 22) || dm.ages.length !== 64) issues.push(`dm ages ${iso}`);
        if (i % 7 === 0) {
          const dd = analyseDestiny({ name: 'Test', dob: iso, asOf: '2026-11-21' });
          for (const lang of ['en', 'hi'] as const) { const t = textOf(writeDestiny(dd, lang)); if (bad.test(t.replace(/"svg":"[^"]*"/g, ''))) issues.push(`destiny text ${lang} ${iso} ${t.match(bad)}`); }
          const pp = analysePsychomatrix({ name: 'Test', dob: iso } as any);
          for (const lang of ['en', 'hi'] as const) { const t = textOf(writePsychomatrix(pp, lang)); if (bad.test(t)) issues.push(`pyth text ${lang} ${iso} ${t.match(bad)}`); }
        }
        if (i % 13 === 0) {
          const nm = analyseName({ fullName: 'Rahul Kumar Sharma' }, r.moolank.value, r.bhagyank.value);
          const mob = analyseMobile('9876543210', { moolank: r.moolank.value, bhagyank: r.bhagyank.value, missingNumbers: r.loShu.missing });
          const rm = buildRemedies(r, { name: nm, mobile: mob });
          if (!rm.gemstones[0]) issues.push(`gem ${iso}`);
          const L = findLuckyNumbers({ fullName: 'Priya Verma', dob: iso, asOf });
          const A = findAngelNumbers({ fullName: 'Priya Verma', dob: iso, asOf });
          for (const lang of ['en', 'hi'] as const) { const t = luckySummary(L, lang) + angelSummary(A, lang); if (/undefined|NaN/.test(t)) issues.push(`finder ${lang} ${iso}`); }
          analyseCouple({ name: 'Amit', gender: 'male', dob: iso }, { name: 'Neha', gender: 'female', dob: '1993-05-17' }, { asOf });
        }
        if (i % 97 === 0) {
          const b = businessAnalytics({ fullName: 'Suresh Gupta', dob: { year: y, month: m, day: d }, gender: 'male', birthPlace: 'Jaipur', mode: 'both', capital: 2, risk: 'medium', interests: [], asOf });
          if (Number.isNaN(b.overall)) issues.push(`biz ${iso}`);
        }
      } catch (e: any) { issues.push(`THROW ${iso}: ${e.message}`); }
    }
    expect(issues).toEqual([]);
  });

  it('compound 38 reads as 29 (Uncertainty), per Cheiro', () => {
    expect(compoundMeaning(38)).toMatch(/^Uncertainty/);
    expect(compoundMeaning(47)).toMatch(/^Uncertainty/);
  });
  it('business report: own Bhagyank 4/8 can be a mobile total; a landline does not break the report', () => {
    let dob = '';
    for (let d = 1; d <= 28 && !dob; d++) { const iso = `1990-01-${String(d).padStart(2, '0')}`; if (analyseDob({ dob: iso, gender: 'male' }, { asOf }).bhagyank.value === 8) dob = iso; }
    const r = analyseCompleteBusiness({ owner: { name: 'Suresh Gupta', dob, gender: 'male' }, names: ['Gupta Traders', 'Shree Ram Steels', 'Om Sai Enterprises'], businessMobile: '0141-2345678', asOf });
    expect(r.mobile).toBeNull();
    for (const n of r.mobileTotals) expect(relationOf(8, n)).toBe('friend');
    const best = r.best.single;
    if (relationOf(best, 8) !== 'enemy') expect(r.mobileTotals).toContain(8);
  });
});

describe('API body reader', () => {
  it('accepts only a JSON object (null, arrays, numbers, strings are rejected, never crash a route)', async () => {
    const { readJson } = await import('@/lib/server/http');
    const req = (b: string) => new Request('http://x/api', { method: 'POST', body: b });
    for (const b of ['null', '[]', '[1]', '5', '"x"', 'true', 'not json']) await expect(readJson(req(b))).rejects.toThrow();
    await expect(readJson(req('{"a":1}'))).resolves.toEqual({ a: 1 });
  });
});
