import { describe, expect, it } from 'vitest';
import { ageEnergy, destinyMatrix, rd } from '@/lib/destiny/matrix';

describe('Destiny Matrix engine (Ladini method)', () => {
  it('reduces by adding digits, never by subtracting 22', () => {
    expect([rd(22), rd(23), rd(31), rd(37), rd(99), rd(41)]).toEqual([22, 5, 4, 10, 18, 5]);
  });

  // mind.university worked example: 23 June 1992
  it('matches the published example for 23-06-1992 (all points, purposes, health map)', () => {
    const m = destinyMatrix('1992-06-23');
    expect([m.A, m.B, m.C, m.D, m.E]).toEqual([5, 6, 21, 5, 10]);
    expect([m.F, m.G, m.H, m.I, m.familyForce]).toEqual([11, 9, 8, 10, 11]);
    expect([m.a1, m.a2]).toEqual([15, 20]);
    expect([m.x, m.money, m.love]).toEqual([19, 5, 7]);
    expect([m.sky, m.earth]).toEqual([11, 8]);
    expect(m.karmicTail).toEqual([15, 20, 5]);
    expect([m.personal, m.social, m.spiritual, m.planetary]).toEqual([19, 11, 3, 14]);
    expect(m.health.map((h) => [h.body, h.energy, h.emotion])).toEqual([[5, 6, 11], [20, 22, 6], [15, 16, 4], [7, 8, 15], [10, 10, 20], [4, 15, 19], [21, 5, 8]]);
    expect(m.healthTotal).toEqual({ body: 10, energy: 10, emotion: 11 });
  });

  // numefy.me example: 19 March 1988 – centre 6, karmic tail 9-12-3, money line 14 · 22 · 19
  it('matches the published example for 19-03-1988', () => {
    const m = destinyMatrix('1988-03-19');
    expect([m.A, m.B, m.C, m.D, m.E]).toEqual([19, 3, 8, 3, 6]);
    expect(m.karmicTail).toEqual([9, 12, 3]);
    expect([m.c1, m.c2, m.money]).toEqual([14, 22, 19]);
  });

  // numato.pl worked example: 15 March 1990, ages 30–40
  it('builds the 0–80 age scale exactly as published (15-03-1990, ages 30–38.75)', () => {
    const m = destinyMatrix('1990-03-15');
    expect([m.A, m.F, m.B, m.G, m.C, m.H, m.D, m.I]).toEqual([15, 18, 3, 22, 19, 11, 10, 7]);
    expect(m.ages).toHaveLength(64);
    expect(m.ages.filter((p) => p.age >= 30 && p.age < 40).map((p) => [p.age, p.value])).toEqual([[30, 22], [31.25, 4], [32.5, 9], [33.75, 14], [35, 5], [36.25, 11], [37.5, 6], [38.75, 7]]);
    expect(ageEnergy(m, 36).value).toBe(5);
    expect(m.ages.filter((p) => p.corner).map((p) => p.age)).toEqual([0, 10, 20, 30, 40, 50, 60, 70]);
  });

  it('day 22 stays 22, days 23–31 reduce; every point is 1–22 for every date of a century', () => {
    expect(destinyMatrix('2000-01-22').A).toBe(22);
    expect(destinyMatrix('2000-01-29').A).toBe(11);
    for (let t = Date.UTC(1930, 0, 1); t < Date.UTC(2030, 0, 1); t += 86_400_000 * 11) {
      const d = new Date(t), m = destinyMatrix({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
      const vals = [m.A, m.B, m.C, m.D, m.E, m.F, m.G, m.H, m.I, m.x, m.money, m.love, m.personal, m.social, m.spiritual, m.planetary, ...m.ages.map((a) => a.value), ...m.health.flatMap((h) => [h.body, h.energy, h.emotion])];
      for (const v of vals) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(22); }
      expect([3, 6, 9, 12, 15, 18, 21]).toContain(m.spiritual); // a property noted by the method's authors
    }
  });
});

import { SAMPLE_NUMBERS as N } from '@/lib/service-samples';
import { psychomatrix } from '@/lib/psychomatrix/engine';
import { analyseDestiny, writeDestiny } from '@/lib/destiny/report';
import { analysePsychomatrix, writePsychomatrix } from '@/lib/psychomatrix/report';
import { DEFAULT_SERVICES, INTAKE_FIELDS } from '@/lib/billing/services';
import { STANDARD_USD } from '@/lib/billing/currency';
import { servicePageByCode } from '@/lib/service-pages';

describe('Destiny Matrix & Pythagorean birth chart – samples, reports and wiring', () => {
  it('the service-page samples match the engine (Riya, 14-08-1992)', () => {
    const m = destinyMatrix(N.riya.dob), x = N.destiny;
    expect([m.A, m.B, m.C, m.D, m.E, m.money, m.love, m.x, m.c1, m.d1]).toEqual([x.A, x.B, x.C, x.D, x.E, x.money, x.love, x.x, x.c1, x.d1]);
    expect(m.karmicTail).toEqual(x.tail);
    expect([m.personal, m.social, m.spiritual, m.planetary, m.F, m.G, m.H, m.I, m.familyForce]).toEqual([x.personal, x.social, x.spiritual, x.planetary, x.F, x.G, x.H, x.I, x.familyForce]);
    const d = analyseDestiny({ name: 'Riya Sharma', dob: N.riya.dob, asOf: '2026-11-21' });
    expect([d.current.age, d.current.value]).toEqual(x.now);
    expect(d.upcoming.slice(0, 5).map((p) => [p.age, p.value])).toEqual(x.next);
    const p = psychomatrix(N.riya.dob);
    expect(p.working).toEqual(N.pyth.working);
    expect(p.counts).toEqual(N.pyth.counts);
    expect(Object.fromEntries(p.lines.map((l) => [l.id, l.total]))).toEqual(N.pyth.lines);
  });
  it('writes complete English and Hindi reports with the chart', () => {
    const d = analyseDestiny({ name: 'Riya Sharma', dob: '1992-08-14', asOf: '2026-11-21' });
    const q = analysePsychomatrix({ name: 'Riya Sharma', dob: '1992-08-14' });
    for (const lang of ['en', 'hi'] as const) {
      for (const w of [writeDestiny(d, lang), writePsychomatrix(q, lang)]) {
        expect(w.sections.length).toBeGreaterThanOrEqual(5);
        expect(w.sections[0].blocks[0]).toMatchObject({ k: 'svg' });
        for (const sct of w.sections) { expect(sct.blocks.length).toBeGreaterThan(0); expect(JSON.stringify(sct)).not.toMatch(/undefined|NaN/); }
        if (lang === 'hi') expect(JSON.stringify(w.sections)).toMatch(/[ऀ-ॿ]/);
      }
    }
    expect(writeDestiny(d, 'en').sections.find((x) => x.id === 'timeline')!.blocks.find((b) => b.k === 'table' && b.rows.length === 64)).toBeTruthy();
  });
  it('both services are wired: intake, $ price and service page', () => {
    for (const code of ['SVC_DESTINY_MATRIX', 'SVC_BIRTH_CHART']) {
      const svc = DEFAULT_SERVICES.find((s) => s.code === code)!;
      expect(svc).toBeTruthy();
      for (const k of svc.intake) expect(INTAKE_FIELDS).toContain(k);
      expect(STANDARD_USD[code]).toBeTruthy();
      expect(servicePageByCode(code)).toBeTruthy();
    }
  });
});
