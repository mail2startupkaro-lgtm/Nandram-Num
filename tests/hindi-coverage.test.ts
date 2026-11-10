import { expect, test } from 'vitest';
import { generateNumerology, verhoeffCheckDigit } from '@/lib/numerology';
import { tr } from '@/lib/i18n/hi-terms';
import { planetOf } from '@/lib/numerology/data/planets';
/** Every engine string shown on the results screen has a Hindi rendering (letter-spelling hints excepted). */
test('Hindi glossary covers engine output', () => {
  const miss = new Map<string, number>();
  const add = (k: string, s: unknown) => { if (typeof s !== 'string' || !s || /^[\d\s,./:+-]*$/.test(s)) return; if (!/[ऀ-ॿ]/.test(tr('hi', s)) && !/[ऀ-ॿ]/.test(s)) miss.set(k + ' | ' + s, (miss.get(k + ' | ' + s) ?? 0) + 1); };
  for (let y = 1960; y < 2010; y += 3) for (let mo = 1; mo <= 12; mo += 2) for (let d = 1; d <= 28; d += 4) {
    const iso = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const r = generateNumerology({ fullName: 'Rahul Kumar Sharma', dob: iso, gender: d % 2 ? 'male' : 'female', mobile: '98' + String(y*mo*d).padStart(8,'7').slice(0,8), aadhaar: ((b) => b + verhoeffCheckDigit(b))('2345' + String(y*d*7).padStart(7,'1').slice(0,7)), aadhaarConsent: true, partner: { name: 'Priya Verma', dob: '1992-05-14', gender: 'female' } }, { asOf: '2026-11-10' });
    const R = r.results;
    add('nameCat', R.name?.chaldean.nameNumber.category);
    add('mobVerdict', R.mobile?.verdict); add('aadVerdict', R.aadhaar?.verdict); add('aadNote', R.aadhaar?.note);
    R.name?.corrections.forEach((c) => c.changes.filter((x) => !/^'.+' → '.+'$/.test(x)).forEach((x) => add('change', x)));
    add('kuaGroup', R.dob.kua.group); add('pyLabel', R.dob.personalCycles.current.label);
    for (let n = 1; n <= 9; n++) { add('planet', planetOf(n).name); add('planetHi', planetOf(n).hindiName); add('gemHi', planetOf(n).gemstone.hindi); add('mantra', planetOf(n).mantra.beej); }
    [...R.dob.loShu.planes, ...R.dob.loShu.diagonals].forEach((l) => { add('line', l.name); add('arrow', l.arrow); add('yog', l.yog); });
    R.dob.loShu.yogs.forEach((x) => add('yogs', x.name)); R.dob.loShu.arrowsOfStrength.forEach((x) => add('aS', x.name)); R.dob.loShu.arrowsOfWeakness.forEach((x) => add('aW', x.name));
    const rm = R.remedies;
    add('rp', rm.rulingPlanet.name); add('dp', rm.destinyPlanet.name);
    rm.lucky.days.forEach((x) => add('day', x)); rm.lucky.colours.forEach((x) => add('col', x)); rm.lucky.avoidColours.forEach((x) => add('avcol', x)); Object.values(rm.lucky.directions).forEach((x) => add('dir', x as string));
    rm.gemstones.forEach((g) => { add('gem', g.name); add('gfor', g.for); add('metal', g.metal); add('finger', g.finger); add('rud', g.rudraksha); g.alternatives.forEach((x) => add('alt', x)); add('caution', g.caution); });
    add('mday', rm.mantra.day); add('mtext', rm.mantra.mantra); add('rpHi', rm.rulingPlanet.hindi); add('deity', rm.mantra.deity); rm.daan.forEach((x) => add('daan', x)); add('fast', rm.fastingDay);
    rm.loShuRemedies.forEach((x) => { add('el', x.element); add('ldir', x.direction); add('place', x.placement); add('wrist', x.wristband); add('lcol', x.colour); });
    rm.dailyHabits.forEach((x) => add('habit', x)); rm.signature.forEach((x) => add('sig', x)); rm.career.suitableFields.forEach((x) => add('career', x)); add('disc', rm.disclaimer);
    R.mobile?.pairs.forEach((p) => add('pairkind', p.kind));
  }
  expect([...miss.keys()].sort()).toEqual([]);
});
