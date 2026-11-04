/** Generates sample engine output (dummy clients) for every module into /samples. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { generateNumerology, verhoeffCheckDigit } from '../src/lib/numerology';

const asOf = { day: 3, month: 11, year: 2026 };
const base = '23456789012'; // dummy, checksum-valid test number – not a real Aadhaar
const dummyAadhaar = base + verhoeffCheckDigit(base);

const client = {
  fullName: 'Rahul Kumar Sharma', commonName: 'Rahul Sharma', gender: 'male', dob: '28-08-1990',
  maritalStatus: 'engaged', profession: 'Software engineer', city: 'Jaipur', state: 'Rajasthan',
  mobile: '9876543210', aadhaar: dummyAadhaar, aadhaarConsent: true,
  concerns: ['career', 'marriage', 'money'], language: 'hinglish',
  partner: { name: 'Priya Verma', gender: 'female', dob: '15-05-1992' },
};

mkdirSync('samples', { recursive: true });
const full = generateNumerology(client, { asOf });
writeFileSync('samples/complete-life-report.json', JSON.stringify(full, null, 2));
for (const mod of ['dob', 'name', 'mobile', 'aadhaar', 'couple'] as const) {
  writeFileSync(`samples/${mod}.json`, JSON.stringify(full.results[mod], null, 2));
}
writeFileSync('samples/remedies.json', JSON.stringify(full.results.remedies, null, 2));

const { dob, name, mobile, aadhaar, couple, remedies } = full.results;
const lines = [
  `CLIENT: ${client.fullName} (${client.commonName}) | DOB ${dob.dob.iso} | Age ${dob.age} | as of ${full.asOf}`,
  `Moolank ${dob.moolank.value} (${dob.moolank.planetInfo.name}) | Bhagyank ${dob.bhagyank.value} [${dob.bhagyank.compound}] (${dob.bhagyank.planetInfo.name}) | Kua ${dob.kua.value} (${dob.kua.group} group)`,
  `Lo Shu: ${dob.loShu.layout.map((r) => r.map((n) => (dob.loShu.counts[n] ? String(n).repeat(dob.loShu.counts[n]) : '·')).join(' | ')).join('  /  ')}`,
  `Missing: ${dob.loShu.missing.join(', ')} | Yogs: ${dob.loShu.yogs.map((y) => y.name).join(', ') || 'none'} | Weak arrows: ${dob.loShu.arrowsOfWeakness.map((a) => a.name).join(', ') || 'none'}`,
  `Personal Year now: ${dob.personalCycles.current.personalYear} | Timeline: ${dob.personalCycles.timeline.map((t) => `${t.year}:${t.personalYear}`).join(' ')}`,
  `Life areas: ${JSON.stringify(dob.lifeAreaScores)}`,
  `Name "${name!.analysedName}": Chaldean ${name!.chaldean.nameNumber.compound}/${name!.chaldean.nameNumber.single} (${name!.chaldean.nameNumber.category}) | Pythagorean ${name!.pythagorean.nameNumber.compound}/${name!.pythagorean.nameNumber.single} | Score ${name!.compatibilityScore}`,
  `Name corrections: ${name!.corrections.map((c) => `${c.fullName} (${c.compound}/${c.single}, ${c.score})`).join('; ')}`,
  `Mobile ${mobile!.masked}: total ${mobile!.total.compound}/${mobile!.total.single} | Score ${mobile!.score} → ${mobile!.verdict} | Ideal totals ${mobile!.suggestion.idealTotals.join(',')}`,
  `Aadhaar ${aadhaar!.masked}: vibration ${aadhaar!.total.compound}/${aadhaar!.total.single} | Score ${aadhaar!.score} → ${aadhaar!.verdict}`,
  `Couple with ${couple!.partnerB.name}: overall ${couple!.overall}% | ${JSON.stringify(couple!.areaScores)} | Auspicious years: ${couple!.marriage.auspiciousYears.map((y) => y.year).join(', ')}`,
  `Remedies: lucky numbers ${remedies.lucky.numbers.join(',')} | colours ${remedies.lucky.colours.join(', ')} | gem ${remedies.gemstones[0].name} (${remedies.gemstones[0].hindi}) | mantra "${remedies.mantra.mantra}" ×${remedies.mantra.dailyCount} on ${remedies.mantra.day}`,
];
writeFileSync('samples/SUMMARY.txt', lines.join('\n') + '\n');
console.log(lines.join('\n'));
