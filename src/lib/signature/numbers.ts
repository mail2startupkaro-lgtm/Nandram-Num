/** Deterministic numerology facts that ground the signature analysis (never invented by the AI). */
import { analyseNameSystem, bhagyank, moolank, nameCompatibilityScore, personalYear, personalYearPeriod, personalYearStart, reduce, todayIST, type DateParts } from '@/lib/numerology';
import { planetOf } from '@/lib/numerology/data/planets';
import { mutualHarmony, relationOf, RELATION_TABLE, type Relation } from '@/lib/numerology/data/relations';
import { CHALDEAN, compoundCategory, type CompoundCategory } from '@/lib/numerology/data/tables';
import { PROFESSIONS } from './catalogue';

/** Short keywords for Chaldean compound numbers (Cheiro tradition); 53+ reduce to their digit sum. */
const COMPOUND_KEYWORDS: Record<number, string> = {
  10: 'Wheel of Fortune – rise and recognition', 11: 'Hidden tests – needs caution and faith', 12: 'Sacrifice – efforts used by others', 13: 'Change and upheaval – transformation',
  14: 'Movement and trade – risks through haste', 15: 'Charm and eloquence – attracts help and money', 16: 'Shattered tower – sudden setbacks, plan carefully', 17: 'Star of the Magi – peace, fame and lasting name',
  18: 'Material conflict – quarrels and deception to watch', 19: 'Prince of Heaven – success, honour and happiness', 20: 'Awakening – new purpose, delays in material plans', 21: 'Crown of the Magi – advancement and victory after effort',
  22: 'Illusion – misplaced trust, needs clear judgement', 23: 'Royal Star of the Lion – help from superiors, success', 24: 'Love and favour – gains through partners and patrons', 25: 'Strength through experience – success after trials',
  26: 'Partnership warnings – losses through others', 27: 'The Sceptre – authority, creative command', 28: 'Contradiction – gains that may be lost, needs safeguards', 29: 'Uncertainty – deception and trials in relationships',
  30: 'Thoughtful deduction – mental power, may be solitary', 31: 'The recluse – self-contained, isolated', 32: 'Magic of words – popularity and communication', 33: 'Love and favour (as 24)',
  34: 'Strength through experience (as 25)', 35: 'Partnership warnings (as 26)', 36: 'The Sceptre (as 27)', 37: 'Good fortune in love and partnerships',
  38: 'Uncertainty (as 29)', 39: 'Thoughtful but solitary (as 30)', 40: 'The recluse (as 31)', 41: 'Magic of words (as 32)', 42: 'Love and favour (as 24)', 43: 'Revolution and upheaval – unsettled conditions',
  44: 'Partnership warnings (as 26)', 45: 'The Sceptre (as 27)', 46: 'Good fortune in partnerships (as 37)', 47: 'Uncertainty (as 29)', 48: 'Thoughtful but solitary (as 30)', 49: 'The recluse (as 31)',
  50: 'Magic of words (as 32)', 51: 'The Warrior – sudden rise and power, guard against enemies', 52: 'Revolution and upheaval (as 43)',
};
export function compoundMeaning(n: number): string {
  let c = n; while (c > 52) c = String(c).split('').reduce((a, b) => a + +b, 0);
  if (c < 10) return `Single vibration ${c}`;
  return COMPOUND_KEYWORDS[c] ?? '';
}

export interface NameOption {
  text: string; label: string; compound: number; single: number; category: CompoundCategory; meaning: string;
  toBhagyank: Relation; toMoolank: Relation; firstLetter: string; score: number; current: boolean; professionMatch: boolean;
}
export interface StartDate { iso: string; weekday: string; dayNumber: number; dateNumber: number; reason: string }

export interface SignatureNumbers {
  moolank: number; bhagyank: number; bhagyankMaster: number | null;
  fullName: { text: string; compound: number; single: number; category: CompoundCategory; meaning: string; score: number };
  signName: { text: string; compound: number; single: number; category: CompoundCategory; meaning: string; score: number };
  firstLetter: { letter: string; value: number; planet: string; toBhagyank: Relation; toMoolank: Relation };
  nameToBhagyank: Relation; nameToMoolank: Relation; signToBhagyank: Relation; signToMoolank: Relation;
  friendly: number[]; avoid: number[];
  profession: { label: string; numbers: number[]; fitScore: number; note: string };
  planet: { name: string; weekday: string; colours: string[]; signatureTip: string; careers: string[] };
  moolankPlanet: { name: string; weekday: string };
  nameOptions: NameOption[];
  bestOption: NameOption | null;
  startDates: StartDate[];
  numerologyScore: number;
  /** Letter-by-letter Chaldean values (optional: results produced before 2026-11-25 do not have them). */
  letters?: { signed: LetterValue[]; full: LetterValue[]; best?: LetterValue[] };
  /** Personal Year running today (birthday to birthday) – used to judge the timing of the new signature. */
  personalYear?: { number: number; period: string; nextNumber: number; nextFrom: string };
}
export interface LetterValue { ch: string; v: number }

/** Chaldean value of every letter of a name (spaces and dots dropped). */
export function letterValues(text: string): LetterValue[] {
  return text.toUpperCase().replace(/[^A-Z]/g, '').split('').map((ch) => ({ ch, v: CHALDEAN[ch] ?? 0 }));
}

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Practical ways a person can sign their name, built from the words of the full name. */
export function signingVariants(fullName: string, signedAs?: string): { text: string; label: string }[] {
  const w = fullName.toUpperCase().replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(Boolean);
  const out: { text: string; label: string }[] = [];
  const add = (parts: string[], label: string) => { const t = parts.join(' ').trim(); if (t && !out.some((o) => o.text === t)) out.push({ text: t, label }); };
  if (signedAs?.trim()) add(signedAs.toUpperCase().replace(/[^A-Z. ]/g, ' ').replace(/\./g, ' ').split(/\s+/).filter(Boolean), 'Current signature');
  add(w, 'Full name');
  if (w.length >= 2) {
    const first = w[0], last = w[w.length - 1], mids = w.slice(1, -1);
    add([first, last], 'First name + surname');
    add([first[0], last], 'Initial + surname');
    add([first, last[0]], 'First name + surname initial');
    add([first], 'First name only');
    add([last], 'Surname only');
    if (mids.length) { add([first, ...mids.map((m) => m[0]), last], 'Middle initial'); add([first[0], ...mids.map((m) => m[0]), last], 'Initials + surname'); }
    add(w.map((x) => x[0]), 'Initials only');
  }
  return out;
}

function nextDates(planetWeekday: string, bhag: number, asOf: DateParts, count = 3): StartDate[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const target = days.indexOf(planetWeekday);
  const friendly = RELATION_TABLE[bhag].friend;
  const out: StartDate[] = [], fallback: StartDate[] = [];
  const start = Date.UTC(asOf.year, asOf.month - 1, asOf.day, 12);
  for (let i = 1; i <= 70 && out.length < count; i++) {
    const d = new Date(start + i * 86_400_000);
    if (d.getUTCDay() !== target) continue;
    const day = d.getUTCDate(), dn = reduce(day).value;
    const dateNumber = reduce([...`${day}${d.getUTCMonth() + 1}${d.getUTCFullYear()}`].reduce((x, c) => x + Number(c), 0)).value;
    const iso = d.toISOString().slice(0, 10);
    const item = { iso, weekday: planetWeekday, dayNumber: dn, dateNumber, reason: '' };
    if (friendly.includes(dn) && friendly.includes(dateNumber)) out.push({ ...item, reason: `${planetWeekday}; day number ${dn} and date total ${dateNumber} are both friendly to Bhagyank ${bhag}` });
    else if (friendly.includes(dn) || friendly.includes(dateNumber)) fallback.push({ ...item, reason: `${planetWeekday}; ${friendly.includes(dn) ? `day number ${dn}` : `date total ${dateNumber}`} is friendly to Bhagyank ${bhag}` });
  }
  return [...out, ...fallback].sort((a, b) => a.iso.localeCompare(b.iso)).slice(0, count);
}

export function signatureNumbers(input: { fullName: string; signatureName?: string; dob: DateParts; professionId: string; professionText?: string; asOf?: DateParts }): SignatureNumbers {
  const m = moolank(input.dob.day).value; const b = bhagyank(input.dob);
  const full = analyseNameSystem(input.fullName, 'chaldean');
  const sign = analyseNameSystem(input.signatureName?.trim() || input.fullName, 'chaldean');
  const first = sign.name.replace(/[^A-Z]/g, '')[0] ?? 'A';
  const firstVal = CHALDEAN[first] ?? 1;
  const prof = PROFESSIONS.find((p) => p.id === input.professionId) ?? PROFESSIONS[PROFESSIONS.length - 1];
  const pn = prof.numbers;
  const fit = pn.length
    ? Math.round(Math.max(...pn.map((n) => Math.max(mutualHarmony(b.value, n), sign.nameNumber.single === n ? 100 : 0, m === n ? 95 : 0))))
    : 60;
  const p = planetOf(b.value);
  const row = RELATION_TABLE[b.value];

  const scoreName = (single: number, compound: number) => nameCompatibilityScore(single, compound, m, b.value);
  const options: NameOption[] = signingVariants(input.fullName, input.signatureName?.trim() || input.fullName).map((v, i) => {
    const a = analyseNameSystem(v.text, 'chaldean');
    const s = a.nameNumber;
    const fl = a.name.replace(/[^A-Z]/g, '')[0] ?? 'A';
    const professionMatch = pn.includes(s.single);
    const score = Math.min(100, scoreName(s.single, s.compound) + (professionMatch ? 6 : 0) + (relationOf(b.value, CHALDEAN[fl] ?? 1) === 'friend' ? 4 : relationOf(b.value, CHALDEAN[fl] ?? 1) === 'enemy' ? -4 : 0));
    return {
      text: v.text.split(' ').map((x) => (x.length === 1 ? `${x}.` : cap(x))).join(' '), label: v.label, compound: s.compound, single: s.single,
      category: compoundCategory(s.compound), meaning: compoundMeaning(s.compound), toBhagyank: relationOf(b.value, s.single), toMoolank: relationOf(m, s.single),
      firstLetter: fl, score: Math.max(0, score), current: i === 0, professionMatch,
    };
  });
  const current = options[0];
  const ranked = [current, ...options.slice(1).sort((x, y) => y.score - x.score)];
  const best = options.slice(1).filter((o) => o.toBhagyank !== 'enemy' && o.category !== 'unfavourable').sort((x, y) => y.score - x.score)[0] ?? null;

  const signScore = scoreName(sign.nameNumber.single, sign.nameNumber.compound);
  const fullScore = scoreName(full.nameNumber.single, full.nameNumber.compound);
  const flHarmony = mutualHarmony(b.value, firstVal);
  const today = input.asOf ?? todayIST();
  const pyStart = personalYearStart(input.dob, today);
  const bestOption = best && best.score >= current.score + 8 ? best : null;
  return {
    moolank: m, bhagyank: b.value, bhagyankMaster: b.master,
    fullName: { text: full.name, compound: full.nameNumber.compound, single: full.nameNumber.single, category: compoundCategory(full.nameNumber.compound), meaning: compoundMeaning(full.nameNumber.compound), score: fullScore },
    signName: { text: sign.name, compound: sign.nameNumber.compound, single: sign.nameNumber.single, category: compoundCategory(sign.nameNumber.compound), meaning: compoundMeaning(sign.nameNumber.compound), score: signScore },
    firstLetter: { letter: first, value: firstVal, planet: planetOf(firstVal).name, toBhagyank: relationOf(b.value, firstVal), toMoolank: relationOf(m, firstVal) },
    nameToBhagyank: relationOf(b.value, full.nameNumber.single), nameToMoolank: relationOf(m, full.nameNumber.single),
    signToBhagyank: relationOf(b.value, sign.nameNumber.single), signToMoolank: relationOf(m, sign.nameNumber.single),
    friendly: row.friend, avoid: row.enemy,
    profession: { label: prof.id === 'other' ? (input.professionText || 'Other') : prof.label, numbers: pn, fitScore: fit,
      note: pn.length ? `${prof.label} is traditionally supported by numbers ${pn.join(', ')}.` : 'No fixed number mapping for this profession; judged from Bhagyank and name harmony.' },
    planet: { name: p.name, weekday: p.weekday, colours: p.colours, signatureTip: p.signatureTip, careers: p.careers },
    moolankPlanet: { name: planetOf(m).name, weekday: planetOf(m).weekday },
    nameOptions: ranked.slice(0, 7),
    bestOption,
    startDates: nextDates(p.weekday, b.value, today),
    numerologyScore: Math.round(0.45 * signScore + 0.2 * fullScore + 0.15 * flHarmony + 0.2 * fit),
    letters: { signed: letterValues(sign.name), full: letterValues(full.name), best: bestOption ? letterValues(bestOption.text) : undefined },
    personalYear: { number: personalYear(input.dob, pyStart), period: personalYearPeriod(input.dob, pyStart).label, nextNumber: personalYear(input.dob, pyStart + 1), nextFrom: personalYearPeriod(input.dob, pyStart + 1).label.split(' – ')[0] },
  };
}
